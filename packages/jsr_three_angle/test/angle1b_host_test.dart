import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter_test/flutter_test.dart';
import 'package:jsr_three_angle/jsr_three_angle.dart';

// Host tests of the ANGLE 1B backend against the real pinned ANGLE build
// (issue #7, ADR-0003): probe, surface lifecycle, G1 dispatch, the scratch
// lane, readback/capture and disposal.
//
// Without the libraries on the host the suite SKIPS with the probe reason;
// with JSR_REQUIRE_ANGLE=1 (CI job quality-macos) a failed probe FAILS.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final requireAngle = Platform.environment['JSR_REQUIRE_ANGLE'] == '1';
  final backend = createAngleThreeHost();
  final probeReason = backend.probeNative();

  setUpAll(() {
    if (probeReason != null && requireAngle) {
      fail('JSR_REQUIRE_ANGLE=1 but the ANGLE 1B probe failed: $probeReason');
    }
  });

  test('IT-SYNC: probe initializes the pinned ANGLE display', () async {
    final probe = await probeAngle1b();
    expect(probe.available, isTrue, reason: probe.reason);
    // ignore: avoid_print
    print(probe);
    // eglVendor reports "Google Inc. (Apple)"; the ANGLE identity lives in
    // the renderer string ("ANGLE (Apple, ANGLE Metal Renderer: ...)").
    expect(probe.renderer, contains('ANGLE'));
    expect(probe.eglVendor, isNotEmpty);
    expect(probe.eglVersion, isNotEmpty);
    expect(backend.angleInfo['eglVersion'], isNotEmpty);
  }, skip: probeReason);

  test('angle1b: attach creates a live IOSurface-backed surface', () async {
    final surface = backend.attach('eng-a', 's1', <String, dynamic>{
      'width': 64,
      'height': 48,
    });
    addTearDown(() => backend.disposeEngine('eng-a'));
    expect(surface.isDisposed, isFalse);
    expect(surface.logicalSize, const ui.Size(64, 48));
    expect(surface.diagnostics['angleSurface']! > 0, isTrue);
    expect(surface.diagnostics['iosurface']! > 0, isTrue);
    expect(backend.findSurface('eng-a', 's1'), same(surface));
    // Idempotent re-attach returns the same surface.
    expect(backend.attach('eng-a', 's1', <String, dynamic>{}), same(surface));
  }, skip: probeReason);

  test(
    'angle1b: resize recreates the surface and keeps the context usable',
    () async {
      final surface = backend.attach('eng-a', 's1', <String, dynamic>{
        'width': 64,
        'height': 48,
      });
      addTearDown(() => backend.disposeEngine('eng-a'));
      surface.resize(const ui.Size(96, 64), 1.0);
      expect(surface.diagnostics['width'], 96);
      expect(surface.diagnostics['height'], 64);
      expect(backend.dispatch1B('eng-a', _g1(1)), 0); // getError == NO_ERROR
    },
    skip: probeReason,
  );

  test('IT-SYNC: G1 dispatch allocates and frees GL objects', () async {
    final surface = backend.attach('eng-a', 's1', <String, dynamic>{
      'width': 32,
      'height': 32,
    });
    addTearDown(() => backend.disposeEngine('eng-a'));
    final name = backend.dispatch1B('eng-a', _g1(33)); // createBuffer
    expect(name, greaterThan(0));
    expect(backend.dispatch1B('eng-a', _g1(35, [name])), 1); // isBuffer
    backend.dispatch1B('eng-a', _g1(34, [name])); // deleteBuffer
    expect(backend.dispatch1B('eng-a', _g1(35, [name])), 0); // isBuffer
    expect(backend.dispatch1B('eng-a', _g1(1)), 0); // getError == NO_ERROR
    expect(surface.isDisposed, isFalse);
  }, skip: probeReason);

  test('IT-SYNC: the scratch lane returns the GL_VERSION string', () async {
    backend.attach('eng-a', 's1', <String, dynamic>{'width': 32, 'height': 32});
    addTearDown(() => backend.disposeEngine('eng-a'));
    backend.dispatch1B('eng-a', _g1(31, [0x1F02])); // getParameter(GL_VERSION)
    final version = utf8.decode(
      base64Decode(backend.result1BAsBase64('eng-a')),
    );
    expect(version, contains('OpenGL'));
  }, skip: probeReason);

  test('E2E-READBACK: clear-to-red round-trips through capture', () async {
    final surface = backend.attach('eng-a', 's1', <String, dynamic>{
      'width': 64,
      'height': 48,
    });
    addTearDown(() => backend.disposeEngine('eng-a'));
    backend.dispatch1B(
      'eng-a',
      _g1(189, <Object>[1.0, 0.0, 0.0, 1.0]), // clearColor
    );
    backend.dispatch1B('eng-a', _g1(192, [0x4000])); // clear(COLOR)
    expect(backend.dispatch1B('eng-a', _g1(1)), 0); // getError
    backend.dispatch1B('eng-a', _g1(3)); // finish

    final png = await surface.capture();
    expect(png, isNotNull);
    expect(png!.sublist(0, 4), <int>[0x89, 0x50, 0x4E, 0x47]); // PNG magic

    final codec = await ui.instantiateImageCodec(png);
    final frame = await codec.getNextFrame();
    final rgba = (await frame.image.toByteData(
      format: ui.ImageByteFormat.rawRgba,
    ))!.buffer.asUint8List();
    codec.dispose();
    expect(rgba.length, 64 * 48 * 4);
    // Top-left pixel is the clear color: opaque red (BGRA→RGBA converted).
    expect(rgba[0], greaterThanOrEqualTo(250)); // R
    expect(rgba[1], lessThanOrEqualTo(5)); // G
    expect(rgba[2], lessThanOrEqualTo(5)); // B
    expect(rgba[3], greaterThanOrEqualTo(250)); // A
  }, skip: probeReason);

  test(
    'angle1b: dispose tears the surface down and isolates engines',
    () async {
      final kept = backend.attach('eng-a', 's1', <String, dynamic>{
        'width': 32,
        'height': 32,
      });
      final doomed = backend.attach('eng-b', 's1', <String, dynamic>{
        'width': 32,
        'height': 32,
      });
      addTearDown(() => backend.disposeEngine('eng-a'));
      backend.disposeEngine('eng-b');
      expect(doomed.isDisposed, isTrue);
      expect(backend.findSurface('eng-b', 's1'), isNull);
      expect(
        // no current surface for the disposed engine (documented sentinel).
        backend.dispatch1B('eng-b', _g1(1)),
        -0x7fffffff,
      );
      // The surviving engine still renders without error.
      expect(backend.dispatch1B('eng-a', _g1(1)), 0);
      expect(kept.isDisposed, isFalse);
    },
    skip: probeReason,
  );
}

/// One raw G1 command: `[u32 opcode LE][args...]` (int args as i32/u32,
/// double args as f32 — the locked wire format of g1_packer.js).
Uint8List _g1(int opcode, [List<Object> args = const <Object>[]]) {
  final b = BytesBuilder();
  final head = ByteData(4)..setUint32(0, opcode, Endian.little);
  b.add(head.buffer.asUint8List());
  for (final arg in args) {
    final v = ByteData(4);
    if (arg is num) {
      if (arg is int) {
        v.setInt32(0, arg, Endian.little);
      } else {
        v.setFloat32(0, arg.toDouble(), Endian.little);
      }
    } else {
      throw ArgumentError.value(arg, 'arg', 'G1 args are int or double');
    }
    b.add(v.buffer.asUint8List());
  }
  return b.toBytes();
}
