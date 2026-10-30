@Timeout(Duration(minutes: 3))
library;

import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import '../support/three_gpu_golden_harness.dart';
import '../support/widget_logic_helper.dart';

const _runGpuGolden = bool.fromEnvironment('JSR_THREE_GPU_GOLDEN');

typedef _OrthographicCapture = ({Uint8List png, Map<String, num> diagnostics});

/// Runs the same scene through ordinary and automatic instanced draw paths.
/// The orthographic camera places every object in the WebGL negative-NDC-Z
/// half, which regressively catches the Flutter GPU [0, w] clip-depth remap.
Future<_OrthographicCapture> _captureOrthographicGrid(
  WidgetTester tester,
  String threeSource,
  bool sharedGeometry,
) async {
  final engineId = 'three-r1-orthographic-$sharedGeometry';
  final run = await bootThreeGpuGolden(
    tester,
    engineId,
    threeSource,
  );
  await run.engine.run('''
      const canvas = jsr.three.createCanvas('main');
      const renderer = new THREE.WebGLRenderer({canvas: canvas});
      renderer.setSize(256, 256);
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);
      const camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 100);
      camera.position.z = 20;
      scene.add(new THREE.AmbientLight(0xffffff, 1));
      const light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(3, 6, 4);
      light.castShadow = true;
      light.shadow.mapSize.set(512, 512);
      light.shadow.camera.left = -10;
      light.shadow.camera.right = 10;
      light.shadow.camera.top = 10;
      light.shadow.camera.bottom = -10;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 30;
      scene.add(light);
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial({color: 0x64748b})
      );
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -6;
      plane.receiveShadow = true;
      scene.add(plane);
      const shared = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      for (let y = -4; y <= 4; y += 2) {
        for (let x = -4; x <= 4; x += 2) {
          const geometry = $sharedGeometry
              ? shared : new THREE.BoxGeometry(1.2, 1.2, 1.2);
          const mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshLambertMaterial({color: 0x2288cc})
          );
          mesh.position.set(x, y, 0);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          scene.add(mesh);
        }
      }
      const instances = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshStandardMaterial({color: 0x3b82f6}),
        3
      );
      const transform = new THREE.Object3D();
      for (let index = 0; index < 3; index++) {
        transform.position.set(index - 1, 6, 0);
        transform.updateMatrix();
        instances.setMatrixAt(index, transform.matrix);
      }
      instances.instanceMatrix.needsUpdate = true;
      instances.castShadow = true;
      scene.add(instances);
      for (let frame = 0; frame < 10; frame++) renderer.render(scene, camera);
    ''');
  final surface = await attachThreeGpuGolden(tester, run);
    final png = await captureThreeGpuGolden(
      tester,
      surface,
      (diagnostics) =>
          (diagnostics['shadowCacheHits'] ?? 0) >= 1 &&
          (diagnostics['batchCacheHits'] ?? 0) >= 1,
    );
    final diagnostics = Map<String, num>.from(surface.diagnostics);
    expect(png, isNotNull, reason: 'diagnostics=$diagnostics');
    expect(surface.lastError, isNull);
    expect(diagnostics['failedPresentations'], 0);
    expect(diagnostics['calls'], sharedGeometry ? 3 : 27);
    expect(diagnostics['triangles'], 338);
    return (png: png!, diagnostics: diagnostics);
  }

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!_runGpuGolden || !hasQuickjsNativeLib || !Platform.isMacOS) {
    test(
      'R1 orthographic GPU golden',
      () {},
      skip: 'requires macOS Impeller/Flutter GPU',
    );
    return;
  }

  testWidgets('R1 orthographic depth and automatic instancing match', (
    tester,
  ) async {
    final threeSource = await tester.runAsync(
      () => rootBundle.loadString('assets/three/three.native.js'),
    );
    final distinct = await _captureOrthographicGrid(
      tester,
      threeSource!,
      false,
    );
    final instanced = await _captureOrthographicGrid(tester, threeSource, true);
    expect(instanced.png, orderedEquals(distinct.png));
    await tester.runAsync(
      () => expectLater(
        instanced.png,
        matchesGoldenFile('goldens/three-r1-orthographic-autobatch-macos.png'),
      ),
    );
  });
}
