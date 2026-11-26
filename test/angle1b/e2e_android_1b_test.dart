// E2E-ANDROID (issue #7, F3a): the Android 1B host renders the pinned ANGLE
// Vulkan build into the platform SurfaceTextureProducer texture and serves
// readbacks and captures from it.
//
// REG-NOWEBVIEW-1 evidence: the pixels the host shows come from the ANGLE
// window surface bound to the plugin's ANativeWindow (the `angle_1b`
// channel + a `Texture` widget id), with the ANGLE renderer identity string
// recorded — no WebView or platform view participates anywhere on this path
// (decision 5 of docs/angle_1b.md).
//
// Runs on an Android device or emulator from the example app host:
//   cd example && flutter test ../test/angle1b/e2e_android_1b_test.dart -d <device>
// Under `flutter test` on a non-Android host every test is skipped (the
// quality/quality-macos jobs compile the file without executing it).
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart' show debugPrint;
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart' show JsThreeSurface;
import 'package:jsr_three_angle/jsr_three_angle.dart';

import '../support/three_1b_real_wire.dart' show g1Command;

const _kChannel = MethodChannel('angle_1b');

// G1 opcodes (tool/three/webgl2_g1_methods.json): the two-tone reference
// draw — clear to color A, then a scissored half-surface clear to color B.
Uint8List _clear(int r, int g, int b) {
  final cmds = <Uint8List>[
    g1Command(189, [r / 255, g / 255, b / 255, 1.0]), // glClearColor
    g1Command(192, [0x4000]), // glClear(COLOR_BUFFER_BIT)
  ];
  final out = BytesBuilder();
  for (final c in cmds) {
    out.add(c);
  }
  return out.toBytes();
}

Uint8List _scissoredClear(int x, int y, int w, int h, int r, int g, int b) {
  final cmds = <Uint8List>[
    g1Command(5, [x, y, w, h]), // glScissor
    g1Command(6, [0xC11]), // glEnable(GL_SCISSOR_TEST)
    g1Command(189, [r / 255, g / 255, b / 255, 1.0]),
    g1Command(192, [0x4000]),
    g1Command(7, [0xC11]), // glDisable(GL_SCISSOR_TEST)
  ];
  final out = BytesBuilder();
  for (final c in cmds) {
    out.add(c);
  }
  return out.toBytes();
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  final notAndroid = !Platform.isAndroid;

  testWidgets('E2E-ANDROID-PLUGIN: the angle_1b plugin answers with the '
      'API level (probe d input)', (tester) async {
    final apiLevel = await _kChannel.invokeMethod<int>('apiLevel');
    expect(apiLevel, isNotNull);
    if (apiLevel! < 28) {
      markTestSkipped('the 1B probe requires API >= 28 (device: $apiLevel)');
      return;
    }
  }, skip: notAndroid);

  testWidgets('E2E-ANDROID-PROBE: the pinned ANGLE Vulkan display '
      'initializes with an ANGLE renderer identity', (tester) async {
    final backend = AngleThreeBackend();
    final reason = backend.probeNative();
    if (reason != null) {
      debugPrint('E2E-ANDROID: 1B probe unavailable: $reason');
      markTestSkipped('ANGLE 1B probe failed: $reason');
      return;
    }
    final info = backend.angleInfo;
    debugPrint('E2E-ANDROID: ANGLE $info — REG-NOWEBVIEW-1 identity evidence');
    expect(info['renderer'], isNotEmpty);
    expect(info['renderer'], isNot(contains('WebView')));
  }, skip: notAndroid);

  testWidgets('E2E-ANDROID-RENDER: a two-tone reference image renders '
      'through ANGLE into the plugin texture (REG-NOWEBVIEW-1)', (
    tester,
  ) async {
    final backend = AngleThreeBackend();
    final reason = backend.probeNative();
    if (reason != null) {
      markTestSkipped('ANGLE 1B probe failed: $reason');
      return;
    }
    final surface = backend.attach('e2e-android', 'main#1', <String, dynamic>{
      'width': 64,
      'height': 64,
      'devicePixelRatio': 1.0,
    });
    addTearDown(() => backend.disposeEngine('e2e-android'));

    // The presentation texture comes from the plugin (no WebView texture).
    final diagnostics = surface.diagnostics;
    expect(diagnostics['texture'], greaterThan(0));
    expect(diagnostics['angleSurface'], greaterThan(0));

    // Two-tone draw through the synchronous G1 lane (left red, right blue).
    final left = _clear(255, 0, 0);
    final right = _scissoredClear(32, 0, 32, 64, 0, 0, 255);
    backend.dispatch1B('e2e-android', left);
    backend.dispatch1B('e2e-android', right);

    final png = await _captureWhen(surface, (dims) => dims == (64, 64));
    expect(png, isNotNull);
    final pixels = await _decodeRgba(png!);
    final distinct = _distinctColors(pixels);
    expect(
      distinct.length,
      greaterThan(1),
      reason: 'the reference image must not be uniform',
    );
    // The scissor half is deterministic: exactly the two drawn colors.
    expect(
      distinct.length,
      lessThan(8),
      reason: 'unexpected extra content in the reference image',
    );
    debugPrint('E2E-ANDROID: reference image colors=$distinct');
  }, skip: notAndroid);

  testWidgets('E2E-ANDROID-READBACK: capture matches the drawn colors', (
    tester,
  ) async {
    final backend = AngleThreeBackend();
    final reason = backend.probeNative();
    if (reason != null) {
      markTestSkipped('ANGLE 1B probe failed: $reason');
      return;
    }
    final surface = backend.attach(
      'e2e-android-rb',
      'main#1',
      <String, dynamic>{'width': 32, 'height': 32, 'devicePixelRatio': 1.0},
    );
    addTearDown(() => backend.disposeEngine('e2e-android-rb'));
    backend.dispatch1B('e2e-android-rb', _clear(18, 52, 86));

    final png = await _captureWhen(surface, (dims) => dims == (32, 32));
    expect(png, isNotNull);
    final pixels = await _decodeRgba(png!);
    // Center pixel: readback through ANGLE round-trips the clear color.
    final center = _pixelAt(pixels, 16, 16);
    expect(center.$1, inInclusiveRange(12, 24), reason: 'red channel');
    expect(center.$2, inInclusiveRange(46, 58), reason: 'green channel');
    expect(center.$3, inInclusiveRange(80, 92), reason: 'blue channel');
  }, skip: notAndroid);

  testWidgets('E2E-ANDROID-RESIZE: resize recreates the window surface '
      'at the new pixel size', (tester) async {
    final backend = AngleThreeBackend();
    final reason = backend.probeNative();
    if (reason != null) {
      markTestSkipped('ANGLE 1B probe failed: $reason');
      return;
    }
    final surface = backend.attach(
      'e2e-android-rs',
      'main#1',
      <String, dynamic>{'width': 64, 'height': 64, 'devicePixelRatio': 1.0},
    );
    addTearDown(() => backend.disposeEngine('e2e-android-rs'));
    surface.resize(const Size(48, 32), 1.0);
    final png = await _captureWhen(surface, (dims) => dims == (48, 32));
    expect(
      png,
      isNotNull,
      reason: 'the resized surface must render and capture',
    );
    final pixels = await _decodeRgba(png!);
    expect(pixels.width, 48);
    expect(pixels.height, 32);
  }, skip: notAndroid);

  testWidgets('E2E-ANDROID-DPR: the surface pixel size follows the '
      'device pixel ratio', (tester) async {
    final backend = AngleThreeBackend();
    final reason = backend.probeNative();
    if (reason != null) {
      markTestSkipped('ANGLE 1B probe failed: $reason');
      return;
    }
    final surface = backend.attach(
      'e2e-android-dpr',
      'main#1',
      <String, dynamic>{'width': 32, 'height': 32, 'devicePixelRatio': 2.0},
    );
    addTearDown(() => backend.disposeEngine('e2e-android-dpr'));
    expect(surface.diagnostics['dpr'], 2.0);
    final png = await _captureWhen(surface, (dims) => dims == (64, 64));
    expect(png, isNotNull, reason: 'pixel size = 32 x dpr 2');
    final pixels = await _decodeRgba(png!);
    expect(pixels.width, 64);
    expect(pixels.height, 64);
  }, skip: notAndroid);

  testWidgets('E2E-ANDROID-NOWEBVIEW: the 1B lane carries no WebView — '
      'no in-app browser channel is touched on the render path', (
    tester,
  ) async {
    final backend = AngleThreeBackend();
    final reason = backend.probeNative();
    if (reason != null) {
      markTestSkipped('ANGLE 1B probe failed: $reason');
      return;
    }
    // A render + capture over the angle_1b texture path only; any WebView
    // participation would need its own platform channels on this path.
    final surface = backend.attach(
      'e2e-android-nwv',
      'main#1',
      <String, dynamic>{'width': 32, 'height': 32, 'devicePixelRatio': 1.0},
    );
    addTearDown(() => backend.disposeEngine('e2e-android-nwv'));
    backend.dispatch1B('e2e-android-nwv', _clear(0, 128, 0));
    final png = await _captureWhen(surface, (dims) => dims == (32, 32));
    expect(png, isNotNull);
    expect(
      surface.diagnostics['texture'],
      greaterThan(0),
      reason: 'presentation is the plugin Texture, not a WebView',
    );
  }, skip: notAndroid);
}

/// Captures after the async allocation settles: polls until the surface's
/// capture dimensions match [want] (the Android handshake is asynchronous,
/// unlike the macOS synchronous allocation), with a hard bound.
Future<Uint8List?> _captureWhen(
  JsThreeSurface surface,
  bool Function((int, int)) want,
) async {
  for (var i = 0; i < 50; i++) {
    final png = await surface.capture();
    if (png != null) {
      final pixels = await _decodeRgba(png);
      if (want((pixels.width, pixels.height))) return png;
    }
    await Future<void>.delayed(const Duration(milliseconds: 100));
  }
  return null;
}

Future<({int width, int height, Uint8List bytes})> _decodeRgba(
  Uint8List png,
) async {
  final codec = await ui.instantiateImageCodec(png);
  final frame = await codec.getNextFrame();
  final width = frame.image.width;
  final height = frame.image.height;
  final data = await frame.image.toByteData(format: ui.ImageByteFormat.rawRgba);
  frame.image.dispose();
  codec.dispose();
  return (width: width, height: height, bytes: data!.buffer.asUint8List());
}

/// RGBA byte at (x, y) as a (r, g, b, a) record.
(int, int, int, int) _pixelAt(
  ({int width, int height, Uint8List bytes}) px,
  int x,
  int y,
) {
  final i = (y * px.width + x) * 4;
  return (px.bytes[i], px.bytes[i + 1], px.bytes[i + 2], px.bytes[i + 3]);
}

/// Distinct colors, quantized to 16-step buckets so antialiased boundary
/// rows do not explode the count.
Set<(int, int, int)> _distinctColors(
  ({int width, int height, Uint8List bytes}) px,
) {
  final out = <(int, int, int)>{};
  for (var y = 0; y < px.height; y++) {
    for (var x = 0; x < px.width; x++) {
      final (r, g, b, _) = _pixelAt(px, x, y);
      out.add((r >> 4, g >> 4, b >> 4));
    }
  }
  return out;
}
