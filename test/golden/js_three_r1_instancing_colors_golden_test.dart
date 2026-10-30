@Timeout(Duration(minutes: 3))
library;

import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import '../support/three_gpu_golden_harness.dart';
import '../support/widget_logic_helper.dart';

/// GPU golden for the wave-3 instancing batch: per-instance colors and
/// transparent instancing, both native R1.
///
/// The scene is four axis-aligned 1x1 quads in front of a fixed camera,
/// all MeshBasicMaterial so the pixel math is exact:
///
///  - top-left:  InstancedMesh instance 0, instanceColor red  (1,0,0)
///  - top-right: InstancedMesh instance 1, instanceColor blue (0,0,1)
///    (one draw, one material color white — the red/blue split is ONLY
///    possible through the per-instance color attribute)
///  - bottom-left:  InstancedMesh WITHOUT instanceColor, material yellow
///    0xffdd00 — the neutral control: material color, no multiply
///  - bottom-right: transparent InstancedMesh (opacity 0.55, green
///    0x00cc66) floating in front of a larger opaque 0x804000 quad —
///    the overlap pixel proves the blended instanced draw; the exposed
///    rim of the backing quad proves the opaque draw underneath.
///
/// macOS-only, like every flutter_gpu golden. Run:
/// `flutter test --enable-impeller --enable-flutter-gpu --dart-define=JSR_THREE_GPU_GOLDEN=true test/golden/js_three_r1_instancing_colors_golden_test.dart`
/// Add `--update-goldens` only when deliberately replacing the baseline.
const _runGpuGolden = bool.fromEnvironment('JSR_THREE_GPU_GOLDEN');

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!_runGpuGolden || !hasQuickjsNativeLib || !Platform.isMacOS) {
    test('R1 instancing colors GPU golden', () {},
        skip: 'requires macOS Impeller/Flutter GPU');
    return;
  }

  testWidgets(
      'R1 per-instance colors and transparent instancing match the GPU golden',
      (tester) async {
    final run =
        await bootBundledThreeGpuGolden(tester, 'three-r1-instancing-colors-golden');
    await run.engine.run(r'''
      const canvas = jsr.three.createCanvas('main');
      const renderer = new THREE.WebGLRenderer({canvas: canvas});
      renderer.setSize(256, 256);
      renderer.setPixelRatio(1);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x182238);
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 4.2);
      camera.lookAt(0, 0, 0);

      // One InstancedMesh, two instances, white material: the red/blue
      // split below is per-instance color evidence, nothing else.
      const colored = new THREE.InstancedMesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({color: 0xffffff}),
        2
      );
      const dummy = new THREE.Object3D();
      dummy.position.set(-1.05, 0.45, 0);
      dummy.updateMatrix();
      colored.setMatrixAt(0, dummy.matrix);
      colored.setColorAt(0, new THREE.Color(1, 0, 0));
      dummy.position.set(1.05, 0.45, 0);
      dummy.updateMatrix();
      colored.setMatrixAt(1, dummy.matrix);
      colored.setColorAt(1, new THREE.Color(0, 0, 1));
      colored.instanceMatrix.needsUpdate = true;
      colored.instanceColor.needsUpdate = true;
      scene.add(colored);

      // Neutral control: no instanceColor at all, yellow material.
      const plain = new THREE.InstancedMesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({color: 0xffdd00}),
        1
      );
      dummy.position.set(-1.05, -0.75, 0);
      dummy.updateMatrix();
      plain.setMatrixAt(0, dummy.matrix);
      plain.instanceMatrix.needsUpdate = true;
      scene.add(plain);

      // Transparent instanced draw: green at 0.55 opacity, in front of a
      // larger opaque backing quad. One blended draw for one instance —
      // per-instance sorting is not exercised (documented bounded pass).
      const backing = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 1.4),
        new THREE.MeshBasicMaterial({color: 0x804000})
      );
      backing.position.set(1.05, -0.75, 0);
      scene.add(backing);
      const veil = new THREE.InstancedMesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          color: 0x00cc66, transparent: true, opacity: 0.55
        }),
        1
      );
      dummy.position.set(1.05, -0.75, 0.3);
      dummy.updateMatrix();
      veil.setMatrixAt(0, dummy.matrix);
      veil.instanceMatrix.needsUpdate = true;
      scene.add(veil);

      renderer.render(scene, camera);
      renderer.render(scene, camera);
    ''');
    final golden = await presentThreeGpuGolden(tester, run, (_) => true);
    final surface = golden.surface;
    final png = golden.png;
    // Four draws: colored instanced, plain instanced, backing, veil.
    expect(surface.diagnostics['calls'], 4);
    expect(surface.diagnostics['triangles'], 10);

    // Plan-level pins: the colored batch carries its instanceColor payload,
    // the veil is a transparent instanced submission after the opaque ones.
    final state = surface.state!;
    final plan = const ThreeDrawPlanner().plan(state);
    expect(plan.opaque, hasLength(3));
    expect(plan.transparent, hasLength(1));
    final veilDraw = plan.transparent.single;
    expect(veilDraw.instanced, isTrue);
    expect(veilDraw.instanceCount, 1);
    expect(veilDraw.material.transparent, isTrue);
    final coloredBatch = plan.opaque
        .map((draw) => draw.batch)
        .firstWhere((batch) => batch != null && batch.hasInstanceColors)!;
    expect(coloredBatch.instanceCount, 2);
    expect(coloredBatch.instanceColors[0], 1);
    expect(coloredBatch.instanceColors[2], 0);
    expect(coloredBatch.instanceColors[5], 1);

    // Pixel probes: 45 deg fov at distance 4.2 -> 128 px per 1.7397 world
    // units = 73.58 px/unit. Centers of the four quads, far from edges.
    final probe = await decodeThreeGpuGolden(tester, png);
    expect(probe.lengthInBytes, 256 * 256 * 4);
    int r(int x, int y) => probe.getUint8((y * 256 + x) * 4);
    int g(int x, int y) => probe.getUint8((y * 256 + x) * 4 + 1);
    int b(int x, int y) => probe.getUint8((y * 256 + x) * 4 + 2);

    // Top-left (col 51, row 95): pure red — material white x instance red.
    expect(r(51, 95), greaterThan(245));
    expect(g(51, 95), lessThan(10));
    expect(b(51, 95), lessThan(10));
    // Top-right (col 205, row 95): pure blue — same draw, other instance.
    expect(b(205, 95), greaterThan(245));
    expect(r(205, 95), lessThan(10));
    expect(g(205, 95), lessThan(10));
    // Bottom-left (col 51, row 183): exact yellow 0xffdd00 — no
    // instanceColor means the material color wins unchanged.
    expect(r(51, 183), greaterThan(245));
    expect(g(51, 183), inInclusiveRange(210, 230));
    expect(b(51, 183), lessThan(10));

    // Bottom-right overlap (col 205, row 183): green veil over the brown
    // backing. Naive sRGB blend = (58, 140, 56); a linear-space blend
    // rounds to (88, 161, 76). Both are decisively NOT pure source
    // (0, 204, 102) nor pure backing (128, 64, 0): green must dominate.
    expect(r(205, 183), inInclusiveRange(45, 105));
    expect(g(205, 183), inInclusiveRange(120, 175));
    expect(b(205, 183), inInclusiveRange(45, 90));
    expect(g(205, 183), greaterThan(r(205, 183) + 40));
    // The exposed rim of the backing quad (col 254, row 183) stays the
    // opaque 0x804000 brown — the veil (cols ~172..250) never covers it.
    expect(r(254, 183), inInclusiveRange(115, 140));
    expect(g(254, 183), inInclusiveRange(50, 78));
    expect(b(254, 183), lessThan(10));

    // Golden file IO must run outside the fake-async test zone.
    await tester.runAsync(
      () => expectLater(
        png,
        matchesGoldenFile('goldens/three-r1-instancing-colors-macos.png'),
      ),
    );
  });
}
