@Timeout(Duration(minutes: 3))
library;

import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import '../support/three_gpu_golden_harness.dart';
import '../support/widget_logic_helper.dart';

/// A real Flutter GPU golden, not a JSON-renderer approximation.
///
/// The fixed scene exercises ordinary and instanced draws, a warm batch
/// fast path, main/shadow frustum culling, and a cached 512px shadow map.
/// It is macOS-only because flutter_gpu goldens are platform-specific. Run:
/// `flutter test --enable-impeller --enable-flutter-gpu --dart-define=JSR_THREE_GPU_GOLDEN=true test/golden/js_three_r1_golden_test.dart`
/// Add `--update-goldens` only when deliberately replacing the baseline.
const _runGpuGolden = bool.fromEnvironment('JSR_THREE_GPU_GOLDEN');

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!_runGpuGolden || !hasQuickjsNativeLib || !Platform.isMacOS) {
    test('R1 GPU golden', () {}, skip: 'requires macOS Impeller/Flutter GPU');
    return;
  }

  testWidgets('R1 instancing, culling and shadows match the GPU golden', (
    tester,
  ) async {
    final threeSource = await tester.runAsync(
      () => rootBundle.loadString('assets/three/three.native.js'),
    );
    const engineId = 'three-r1-golden';
    final run = await bootThreeGpuGolden(
      tester,
      engineId,
      threeSource,
    );
    await run.engine.run(r'''
      const canvas = jsr.three.createCanvas('main');
      const renderer = new THREE.WebGLRenderer({canvas: canvas});
      renderer.setSize(256, 256);
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x182238);
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(4, 3, 6);
      camera.lookAt(0, 0, 0);

      scene.add(new THREE.AmbientLight(0xffffff, 1));
      const light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(3, 6, 4);
      light.castShadow = true;
      light.shadow.mapSize.set(512, 512);
      light.shadow.camera.left = -6;
      light.shadow.camera.right = 6;
      light.shadow.camera.top = 6;
      light.shadow.camera.bottom = -6;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 30;
      light.shadow.bias = 0.001;
      light.shadow.normalBias = 0.02;
      scene.add(light);

      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        new THREE.MeshStandardMaterial({color: 0x64748b})
      );
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -0.6;
      plane.receiveShadow = true;
      scene.add(plane);

      const box = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({color: 0x22c55e})
      );
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);

      const instances = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.3),
        new THREE.MeshStandardMaterial({color: 0x3b82f6}),
        3
      );
      const transform = new THREE.Object3D();
      const positions = [[-1.5, 0, 0], [0, 1.2, 0], [1.5, 0, 0]];
      for (let index = 0; index < positions.length; index++) {
        transform.position.set.apply(transform.position, positions[index]);
        transform.updateMatrix();
        instances.setMatrixAt(index, transform.matrix);
      }
      instances.instanceMatrix.needsUpdate = true;
      instances.castShadow = true;
      instances.receiveShadow = true;
      scene.add(instances);

      const offscreen = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({color: 0xef4444})
      );
      offscreen.position.x = 1000;
      offscreen.castShadow = true;
      scene.add(offscreen);

      renderer.render(scene, camera);
      renderer.render(scene, camera);
    ''');
    final surface = await attachThreeGpuGolden(tester, run);

    final png = await captureThreeGpuGolden(
      tester,
      surface,
      (diagnostics) =>
          (diagnostics['shadowCacheHits'] ?? 0) >= 1 &&
          (diagnostics['batchCacheHits'] ?? 0) >= 1,
    );
    expect(png, isNotNull, reason: 'diagnostics=${surface.diagnostics}');
    expect(surface.lastError, isNull);
    expect(surface.diagnostics['failedPresentations'], 0);
    expect(surface.diagnostics['calls'], 3);
    expect(surface.diagnostics['triangles'], 50);
    expect(surface.diagnostics['lastCulledShadowNodes'], greaterThan(0));
    expect(surface.diagnostics['renderedShadowDraws'], 2);
    expect(surface.diagnostics['shadowCacheHits'], greaterThan(0));
    expect(surface.diagnostics['batchCacheHits'], greaterThan(0));
    // Golden file IO must run outside the fake-async test zone.
    await tester.runAsync(
      () => expectLater(
        png,
        matchesGoldenFile('goldens/three-r1-instancing-shadows-macos.png'),
      ),
    );
  });

  testWidgets('R1 spot shadow and clipping match the GPU golden', (
    tester,
  ) async {
    final threeSource = await tester.runAsync(
      () => rootBundle.loadString('assets/three/three.native.js'),
    );
    const engineId = 'three-r1-clipping-golden';
    final run = await bootThreeGpuGolden(
      tester,
      engineId,
      threeSource,
    );
    await run.engine.run(r'''
      const canvas = jsr.three.createCanvas('main');
      const renderer = new THREE.WebGLRenderer({canvas: canvas});
      renderer.setSize(256, 256);
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = true;
      renderer.localClippingEnabled = true;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x182238);
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 1.2, 4.2);
      camera.lookAt(0, 0, 0);

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const spot = new THREE.SpotLight(0xffffff, 90);
      spot.angle = Math.PI / 5;
      spot.penumbra = 0.25;
      spot.position.set(2.5, 3.5, 2.5);
      spot.castShadow = true;
      spot.shadow.mapSize.set(512, 512);
      spot.shadow.camera.near = 1;
      spot.shadow.camera.far = 12;
      spot.shadow.bias = 0.0005;
      spot.shadow.normalBias = 0.02;
      scene.add(spot);
      scene.add(spot.target);

      const material = new THREE.MeshPhongMaterial({
        color: 0x00aabb,
        shininess: 80,
        clippingPlanes: [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.35)],
        clipShadows: true
      });
      const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.6, 0.18, 128, 24), material);
      knot.castShadow = true;
      knot.receiveShadow = true;
      scene.add(knot);

      renderer.render(scene, camera);
      renderer.render(scene, camera);
    ''');
    final surface = await attachThreeGpuGolden(tester, run);

    final png = await captureThreeGpuGolden(
      tester,
      surface, (_) => true);
    expect(png, isNotNull, reason: 'diagnostics=${surface.diagnostics}');
    expect(surface.lastError, isNull);
    expect(surface.diagnostics['failedPresentations'], 0);
    expect(surface.diagnostics['calls'], greaterThanOrEqualTo(1));
    expect(surface.diagnostics['triangles'], 6144);
    expect(surface.diagnostics['renderedShadowDraws'], 1);
    // The frame names the spot as the shadow map owner and the resolved plan
    // carries the spot light and the knot's clipShadows set.
    final state = surface.state!;
    final plan = const ThreeDrawPlanner().plan(state);
    expect(plan.frame?.hasSpotShadow, isTrue);
    expect(plan.spotLights, hasLength(1));
    final knotMaterial = plan.draws
        .map((draw) => draw.material)
        .firstWhere((material) => material.shininess == 80);
    expect(knotMaterial.hasClipping, isTrue);
    expect(knotMaterial.clipShadows, isTrue);
    expect(
      state.clippings[knotMaterial.clipId]!.planeCount,
      1,
    );

    // Pixel probes (scan rows, not single pixels: the torus knot has gaps).
    // The camera sits at distance 4.2 with a 45° fov, so 128 px ≈ 1.74 world
    // units: the knot's unclipped top would reach image row ~90, and the
    // clip plane y = 0.35 cuts at row ~102. three.js Plane semantics keep
    // the `normal·p + constant >= 0` half-space: with plane (0,-1,0), 0.35
    // the knot is VISIBLE below the cut (rows > 102) and discarded above it.
    // The pre-fix binding wrote the raw constant and inverted the visible
    // half-space, leaving only a sliver below world y ≈ -0.35 (rows ~146+).
    final probe = await decodeThreeGpuGolden(tester, png!);
    expect(probe.lengthInBytes, 256 * 256 * 4);
    const background = 0x382218; // 0x182238 in little-endian RGBA bytes.
    int litCount(int y) {
      var count = 0;
      for (var x = 40; x < 216; x++) {
        final offset = (y * 256 + x) * 4;
        final rgb =
            probe.getUint8(offset) |
            (probe.getUint8(offset + 1) << 8) |
            (probe.getUint8(offset + 2) << 16);
        if (rgb != background) count++;
      }
      return count;
    }

    // Row 90 is where the unclipped knot top would reach: the clip plane
    // must keep the whole band above the cut empty.
    expect(
      litCount(90),
      0,
      reason: 'clip plane must discard the knot above the cut',
    );
    // Just below the cut the knot must be lit (three.js keeps y <= 0.35).
    expect(
      litCount(115),
      greaterThan(10),
      reason: 'knot body must render right below the cut',
    );
    expect(
      litCount(170),
      greaterThan(10),
      reason: 'knot body must render below the cut',
    );

    // Golden file IO must run outside the fake-async test zone.
    await tester.runAsync(
      () => expectLater(
        png,
        matchesGoldenFile('goldens/three-r1-spot-clipping-macos.png'),
      ),
    );
  });
}
