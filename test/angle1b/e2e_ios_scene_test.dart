// F3b iOS device suite (issue #7 AC3 + the iOS part of AC9/AC10):
// E2E-IOS non-empty reference images and readbacks through ANGLE, resize,
// DPR, capture, and REG-NOWEBVIEW-1. The suite runs on an iOS device or
// simulator with the example app as host (the app embeds libangle_1b and
// registers the angle_1b texture plugin); exact commands in
// docs/angle_1b.md, section "iOS host (F3b)".
//
// Off iOS the tests self-skip (host runs on macOS/ubuntu stay green). On an
// iOS device a missing ANGLE backend fails loudly with the machine-readable
// marker ANGLE_1B_UNAVAILABLE — the CI `angle-ios` job greps it and records
// the reason (the simulator build does not embed the device-slice dylibs by
// design; plan §9 records that a simulator cannot run the device GPU path).
@Timeout(Duration(minutes: 10))
library;

import 'dart:ffi' as ffi;
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:jsr_three_angle/jsr_three_angle.dart';

// Subset of the shim ABI the suite drives directly (the deterministic demo
// renderer and the surface switches; everything else goes through the
// AngleThreeBackend public API).
typedef _MakeCurrentT = int Function(int);
typedef _RenderTriangleT = int Function(int);
typedef _SwapT = int Function(int);

final class _Shim {
  _Shim(ffi.DynamicLibrary lib)
    : makeCurrent = lib
          .lookupFunction<ffi.Int32 Function(ffi.Int64), _MakeCurrentT>(
            'a1b_make_current',
          ),
      renderTriangle = lib
          .lookupFunction<ffi.Int32 Function(ffi.Int64), _RenderTriangleT>(
            'a1b_render_triangle',
          ),
      swapBuffers = lib.lookupFunction<ffi.Int32 Function(ffi.Int64), _SwapT>(
        'a1b_swap_buffers',
      );

  final _MakeCurrentT makeCurrent;
  final _RenderTriangleT renderTriangle;
  final _SwapT swapBuffers;
}

_Shim? _openShim() {
  const candidates = <String>['@rpath/libangle_1b.dylib', 'libangle_1b.dylib'];
  for (final path in candidates) {
    try {
      return _Shim(ffi.DynamicLibrary.open(path));
    } catch (_) {
      continue;
    }
  }
  return null;
}

/// FNV-1a over the RGBA bytes — recorded in the log for cross-run
/// comparison on the same device (deterministic demo renderer).
int _fnv1a(Uint8List bytes) {
  var hash = 0x811c9dc5;
  for (final b in bytes) {
    hash ^= b;
    hash = (hash * 0x01000193) & 0xFFFFFFFF;
  }
  return hash;
}

Future<ui.Image> _decode(Uint8List png) async {
  final codec = await ui.instantiateImageCodec(png);
  final frame = await codec.getNextFrame();
  codec.dispose();
  return frame.image;
}

Future<Angle1bProbe> _probeOrFail() async {
  final probe = await probeAngle1b();
  if (!probe.available) {
    // Machine-readable marker for the CI angle-ios job: a failing suite on
    // the simulator is EXPECTED to carry this reason, never a silent pass.
    // ignore: avoid_print
    print('ANGLE_1B_UNAVAILABLE: ${probe.reason}');
    fail('ANGLE 1B backend unavailable on this device: ${probe.reason}');
  }
  return probe;
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  final skipIos = !Platform.isIOS;

  testWidgets(
    'E2E-IOS-SCENE-1: ANGLE renders a non-empty reference image and reads it back',
    (tester) async {
      final probe = await _probeOrFail();
      final shim = _openShim();
      expect(shim, isNotNull, reason: 'libangle_1b not loadable after probe');

      final dpr = tester.view.devicePixelRatio;
      final backend = createAngleThreeHost();
      expect(backend.probeNative(), isNull);
      final surface = backend.attach('e2e-ios-scene', 'main', <String, dynamic>{
        'width': 320,
        'height': 240,
        'devicePixelRatio': dpr,
      });
      addTearDown(() => backend.disposeEngine('e2e-ios-scene'));

      // Render the deterministic demo triangle through the G1 dispatch path
      // (a1b_render_triangle routes every GL call through a1b_gl_dispatch),
      // swap, and announce the frame to the texture registry.
      final angleSurface = surface.diagnostics['angleSurface']!.toInt();
      expect(angleSurface, greaterThan(0));
      expect(shim!.makeCurrent(angleSurface), 0);
      expect(shim.renderTriangle(angleSurface), 0);
      expect(shim.swapBuffers(angleSurface), 0);
      final textureId = surface.diagnostics['texture']!.toInt();
      expect(
        textureId,
        greaterThan(0),
        reason:
            'the angle_1b plugin must register the IOSurface-backed '
            'CVPixelBuffer as a Flutter texture (IOSurface -> CVPixelBuffer '
            '-> FlutterTexture)',
      );
      await backend.announceFrame(textureId);

      // Present the texture through the real widget tree.
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: SizedBox(
                width: 320,
                height: 240,
                child: Builder(
                  builder: (context) => backend.build(
                    context,
                    surface,
                    const <String, dynamic>{},
                  ),
                ),
              ),
            ),
          ),
        ),
      );
      await tester.pump();
      expect(find.byType(Texture), findsOneWidget);

      // Readback through ANGLE (a1b_read_pixels): non-empty reference image.
      shim.makeCurrent(angleSurface);
      final png = await surface.capture();
      expect(png, isNotNull, reason: 'capture returns the ANGLE readback');
      final image = await _decode(png!);
      expect(image.width, greaterThan(0));
      expect(image.height, greaterThan(0));
      final rgba = (await image.toByteData(
        format: ui.ImageByteFormat.rawRgba,
      ))!.buffer.asUint8List();
      expect(rgba.length, greaterThan(0));
      // A solid/blank frame would be one dominant color; the demo clears
      // dark blue and draws a gradient triangle over most of the surface.
      final counts = <int, int>{};
      for (var i = 0; i + 3 < rgba.length; i += 4) {
        final key =
            (rgba[i] << 24) |
            (rgba[i + 1] << 16) |
            (rgba[i + 2] << 8) |
            rgba[i + 3];
        counts[key] = (counts[key] ?? 0) + 1;
      }
      final dominant = counts.values.reduce((a, b) => a > b ? a : b);
      expect(
        dominant / (image.width * image.height),
        lessThan(0.8),
        reason:
            'the reference image must show the rendered scene, not a '
            'blank frame',
      );
      // ignore: avoid_print
      print(
        'E2E_IOS_SCENE: ${image.width}x${image.height} dpr=$dpr '
        'distinctColors=${counts.length} fnv1a=0x'
        '${_fnv1a(rgba).toRadixString(16).padLeft(8, '0')} '
        'renderer=${probe.renderer}',
      );
    },
    skip: skipIos,
  );

  testWidgets(
    'E2E-IOS-RESIZE-1: resize and DPR recreate the surface with matching pixel dimensions',
    (tester) async {
      await _probeOrFail();
      final shim = _openShim();
      expect(shim, isNotNull);

      final dpr = tester.view.devicePixelRatio;
      expect(dpr, greaterThan(0), reason: 'a real display reports its scale');
      final backend = createAngleThreeHost();
      expect(backend.probeNative(), isNull);
      final surface = backend.attach(
        'e2e-ios-resize',
        'main',
        <String, dynamic>{'width': 320, 'height': 240, 'devicePixelRatio': dpr},
      );
      addTearDown(() => backend.disposeEngine('e2e-ios-resize'));

      final png1 = await surface.capture();
      expect(png1, isNotNull);
      final image1 = await _decode(png1!);
      expect(image1.width, (320 * dpr).round());
      expect(image1.height, (240 * dpr).round());

      surface.resize(const Size(160, 120), dpr * 2);
      final png2 = await surface.capture();
      expect(png2, isNotNull);
      final image2 = await _decode(png2!);
      expect(image2.width, (160 * dpr * 2).round(), reason: 'resize + DPR');
      expect(image2.height, (120 * dpr * 2).round(), reason: 'resize + DPR');

      // The recreated surface still renders and reads back non-empty.
      final angleSurface = surface.diagnostics['angleSurface']!.toInt();
      expect(angleSurface, greaterThan(0));
      expect(shim!.makeCurrent(angleSurface), 0);
      expect(shim.renderTriangle(angleSurface), 0);
      expect(shim.swapBuffers(angleSurface), 0);
      shim.makeCurrent(angleSurface);
      final png3 = await surface.capture();
      expect(png3, isNotNull);
      final image3 = await _decode(png3!);
      expect(image3.width, (160 * dpr * 2).round());
      expect(image3.height, (120 * dpr * 2).round());
    },
    skip: skipIos,
  );

  testWidgets(
    'REG-NOWEBVIEW-1: the 1B surface presents through a Flutter texture, never a web view',
    (tester) async {
      await _probeOrFail();
      final backend = createAngleThreeHost();
      expect(backend.probeNative(), isNull);
      final dpr = tester.view.devicePixelRatio;
      final surface = backend.attach(
        'e2e-ios-nowebview',
        'main',
        <String, dynamic>{'width': 160, 'height': 120, 'devicePixelRatio': dpr},
      );
      addTearDown(() => backend.disposeEngine('e2e-ios-nowebview'));

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: SizedBox(
                width: 160,
                height: 120,
                child: Builder(
                  builder: (context) => backend.build(
                    context,
                    surface,
                    const <String, dynamic>{},
                  ),
                ),
              ),
            ),
          ),
        ),
      );
      await tester.pump();

      expect(find.byType(Texture), findsOneWidget);
      final hierarchy = await const MethodChannel(
        'angle_1b',
      ).invokeMethod<List<dynamic>>('debugHierarchy');
      final names = hierarchy?.map((e) => e.toString()) ?? const <String>[];
      expect(names, isNotEmpty, reason: 'the key window view tree is walkable');
      final webViews = names
          .where((n) => n.contains('WebView') || n.contains('WKWebView'))
          .toList();
      expect(
        webViews,
        isEmpty,
        reason:
            'REG-NOWEBVIEW-1: native drawing must never go through a '
            'WKWebView (hierarchy contained: $webViews)',
      );
      // ignore: avoid_print
      print('REG_NOWEBVIEW: ${names.length} views, texture path, no web view');
    },
    skip: skipIos,
  );
}
