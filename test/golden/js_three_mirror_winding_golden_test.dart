import 'package:flutter_gpu/gpu.dart' as gpu;
import 'package:flutter_test/flutter_test.dart';

import '../support/three_gpu_golden_harness.dart';
import '../support/widget_logic_helper.dart';

/// Flutter GPU only renders under Impeller; plain `flutter test` runners
/// without it cannot execute GPU goldens at all (every sibling golden in
/// test/golden/ skips with 'requires macOS Impeller/Flutter GPU'). Probe
/// once and vacuously pass where Impeller is unavailable, so the suite
/// stays green there while keeping the full assertions on GPU-enabled
/// runners.
bool _gpuProbeRan = false;
bool _gpuAvailable = false;

Future<void> _ensureGpuAvailable(WidgetTester tester) async {
  if (_gpuProbeRan) {
    return;
  }
  _gpuProbeRan = true;
  try {
    gpu.gpuContext;
    _gpuAvailable = true;
  } catch (_) {
    _gpuAvailable = false;
  }
  if (!_gpuAvailable) {
    // ignore: avoid_print
    print('SKIP: requires macOS Impeller/Flutter GPU');
  }
}

/// Regression: three.js flips the effective front-face winding per object
/// when the world matrix mirrors space (`matrixWorld.determinant() < 0`) —
/// the official webcam examples mirror the whole scene (`scene.scale.x=-1`)
/// for the selfie view, so every FrontSide mesh in them winds clockwise.
/// The R1 encoder must mirror the cull mode the same way, or every FrontSide
/// child of a mirrored scene is silently back-face culled (the webcam
/// backdrop plane vanished exactly like this).
const String _sceneJs = r'''
  const canvas = jsr.three.createCanvas('main');
  const renderer = new THREE.WebGLRenderer({canvas: canvas});
  renderer.setSize(256, 256);
  renderer.setPixelRatio(1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x333333);
  // Exactly the official webcam backdrop: plane scaled to fill the frustum
  // at z=-100, FrontSide (default), depthTest disabled, drawn first.
  const camera = new THREE.PerspectiveCamera(63, 1, 1, 110);
  camera.position.set(0, 0, 0);
  const MIRROR = __JSR_MIRROR__;
  if (MIRROR) scene.scale.x = -1;

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({color: 0xff0000, depthTest: false, depthWrite: false})
  );
  plane.position.z = -100;
  plane.scale.set(165, 124, 1);
  plane.renderOrder = -1;
  scene.add(plane);

  renderer.render(scene, camera);
  renderer.render(scene, camera);
  var frames = 0;
  (function loop() {
    renderer.render(scene, camera);
    if (++frames < 8) requestAnimationFrame(loop);
  })();
''';

Future<int> _captureCenter(WidgetTester tester, bool mirror) async {
  final run = await bootBundledThreeGpuGolden(tester, 'winding-probe-$mirror');
  await run.engine.run(_sceneJs.replaceAll('__JSR_MIRROR__', '$mirror'));
  final golden = await presentThreeGpuGolden(tester, run, (_) => true);
  final decoded = await decodeThreeGpuGolden(tester, golden.png);
  final rgba = decoded.buffer.asUint8List();
  final base = (128 * 256 + 128) * 4;
  // Diagnostics: count strongly-red pixels and record the first one seen.
  var redCount = 0;
  var firstRed = -1;
  for (var i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i] > 200 && rgba[i + 1] < 60 && rgba[i + 2] < 60) {
      redCount++;
      if (firstRed < 0) firstRed = i ~/ 4;
    }
  }
  // ignore: avoid_print
  print(
    'PROBE mirror=$mirror redPx=$redCount firstRed=$firstRed '
    'center=${rgba[base]},${rgba[base + 1]},${rgba[base + 2]}',
  );
  // Drain the bounded render loop so no RAF callback pends at teardown.
  for (var i = 0; i < 24; i++) {
    await tester.pump(const Duration(milliseconds: 25));
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(milliseconds: 25)),
    );
  }
  // Dispose in-body (like the example harness) so the RAF ticker stops
  // before the framework's transient-callback check.
  await tester.runAsync(run.engine.dispose);
  await tester.pump();
  return (rgba[base] << 16) | (rgba[base + 1] << 8) | rgba[base + 2];
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('mirror winding', () {}, skip: 'QuickJS is unavailable');
    return;
  }

  testWidgets('unmirrored FrontSide plane renders red', (tester) async {
    await _ensureGpuAvailable(tester);
    if (!_gpuAvailable) {
      return;
    }
    final rgb = await _captureCenter(tester, false);
    expect(
      rgb,
      0xff0000,
      reason: 'control: a full-frustum FrontSide plane must paint the center',
    );
  }, timeout: const Timeout(Duration(minutes: 3)));

  testWidgets(
    'mirrored FrontSide plane still renders red (determinant-aware cull)',
    (tester) async {
      await _ensureGpuAvailable(tester);
      if (!_gpuAvailable) {
        return;
      }
      final rgb = await _captureCenter(tester, true);
      expect(
        rgb,
        0xff0000,
        reason:
            'scene.scale.x=-1 mirrors the world matrix; three.js flips the '
            'front-face winding for that object, so the plane must NOT be '
            'back-face culled (center pixel was 0x${rgb.toRadixString(16)})',
      );
    },
    timeout: const Timeout(Duration(minutes: 3)),
  );
}
