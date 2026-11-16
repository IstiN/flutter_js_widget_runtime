@Timeout(Duration(minutes: 3))
library;

import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import '../support/three_gpu_golden_harness.dart';
import '../support/widget_logic_helper.dart';

/// Native alpha/transmission regression with real geometry behind the glass.
///
/// Three yellow backing quads are covered by blue glass:
/// - explicit MeshStandardMaterial(opacity: 0.08, transparent: true);
/// - MeshPhysicalMaterial(transmission: 1, opacity: 0.25);
/// - MeshPhysicalMaterial(transmission: 1) with upstream-default opacity 1.
///
/// The physical fallback is deliberately bounded alpha transparency, not a
/// claim of screen-space refraction. Every center pixel must retain the yellow
/// backing; an opaque blue center is the YoClip Ferrari/write_the_light bug.
const _runGpuGolden = bool.fromEnvironment('JSR_THREE_GPU_GOLDEN');

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!_runGpuGolden || !hasQuickjsNativeLib || !Platform.isMacOS) {
    test(
      'R1 transmission GPU golden',
      () {},
      skip: 'requires macOS Impeller/Flutter GPU',
    );
    return;
  }

  testWidgets(
    'R1 keeps an opaque object visible through Standard and Physical glass',
    (tester) async {
      final run = await bootBundledThreeGpuGolden(
        tester,
        'three-r1-transmission-golden',
      );
      await run.engine.run(r'''
      const canvas = jsr.three.createCanvas('main');
      const renderer = new THREE.WebGLRenderer({canvas: canvas});
      renderer.setSize(256, 256);
      renderer.setPixelRatio(1);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x182238);
      const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 20);
      camera.position.set(0, 0, 6);
      camera.lookAt(0, 0, 0);
      scene.add(new THREE.AmbientLight(0xffffff, 1));

      function backing(x) {
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(1.5, 1.5),
          new THREE.MeshBasicMaterial({color: 0xffdd00})
        );
        mesh.position.set(x, 0, 0);
        mesh.renderOrder = 1;
        scene.add(mesh);
      }
      function glass(x, material) {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), material);
        mesh.position.set(x, 0, 1);
        // Deliberately added before the backing and given a distinct order:
        // the transparent bucket must still follow every opaque backing.
        mesh.renderOrder = 3;
        scene.add(mesh);
        return mesh;
      }

      glass(-2, new THREE.MeshStandardMaterial({
        color: 0x0000ff, emissive: 0x0000ff, emissiveIntensity: 1,
        transparent: true, opacity: 0.08, depthWrite: false,
        side: THREE.DoubleSide
      }));
      backing(-2);

      glass(0, new THREE.MeshPhysicalMaterial({
        color: 0x0000ff, emissive: 0x0000ff, emissiveIntensity: 1,
        transmission: 1, opacity: 0.25, side: THREE.DoubleSide
      }));
      backing(0);

      glass(2, new THREE.MeshPhysicalMaterial({
        color: 0x0000ff, emissive: 0x0000ff, emissiveIntensity: 1,
        transmission: 1, side: THREE.DoubleSide
      }));
      backing(2);

      let frames = 0;
      function tick() {
        renderer.render(scene, camera);
        if (++frames < 8) requestAnimationFrame(tick);
      }
      tick();
    ''');
      final golden = await presentThreeGpuGolden(tester, run, (_) => true);
      final surface = golden.surface;
      final png = golden.png;
      expect(surface.lastError, isNull);

      final plan = const ThreeDrawPlanner().plan(surface.state!);
      expect(plan.opaque, hasLength(3));
      expect(plan.transparent, hasLength(3));
      final glass = plan.transparent.toList()
        ..sort((a, b) => a.material.opacity.compareTo(b.material.opacity));
      expect(glass[0].material.opacity, closeTo(0.08, 1e-6));
      expect(glass[1].material.opacity, closeTo(0.25, 1e-6));
      expect(glass[2].material.opacity, closeTo(0.25, 1e-6));
      for (final draw in glass) {
        expect(draw.material.transparent, isTrue);
        expect(draw.material.depthWrite, isFalse);
        expect(draw.node.renderOrder, 3);
      }

      final probe = await decodeThreeGpuGolden(tester, png);
      expect(probe.lengthInBytes, 256 * 256 * 4);
      List<int> rgba(int x, int y) {
        final offset = (y * 256 + x) * 4;
        return [
          probe.getUint8(offset),
          probe.getUint8(offset + 1),
          probe.getUint8(offset + 2),
          probe.getUint8(offset + 3),
        ];
      }

      final centers = [rgba(43, 128), rgba(128, 128), rgba(213, 128)];
      for (var index = 0; index < centers.length; index++) {
        final pixel = centers[index];
        expect(
          pixel[0],
          greaterThan(150),
          reason: 'glass $index must not erase the yellow backing: $pixel',
        );
        expect(
          pixel[1],
          greaterThan(130),
          reason: 'glass $index must not erase the yellow backing: $pixel',
        );
        expect(
          pixel[2],
          lessThan(230),
          reason: 'glass $index must not become opaque blue: $pixel',
        );
        expect(pixel[3], 255);
      }
      // Default-opacity transmission and explicit 0.25 resolve to the same
      // bounded effective alpha, so equal source colors/lights produce a match.
      for (var channel = 0; channel < 3; channel++) {
        expect(
          (centers[1][channel] - centers[2][channel]).abs(),
          lessThanOrEqualTo(8),
          reason: 'physical default/explicit alpha mismatch: $centers',
        );
      }

      await tester.runAsync(() => run.engine.dispose());
      await tester.pump();
      await tester.runAsync(
        () => expectLater(
          png,
          matchesGoldenFile('goldens/three-r1-transmission-glass-macos.png'),
        ),
      );
    },
  );
}
