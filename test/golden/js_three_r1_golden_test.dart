@Timeout(Duration(minutes: 3))
library;

import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_host.dart'
    show FlutterGpuThreeSurface;
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

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
    final host = createFlutterGpuThreeHost();
    const engineId = 'three-r1-golden';
    final config = JsRuntimeConfig(
      widgetId: engineId,
      instanceId: engineId,
      threeEnabled: true,
      threeSource: threeSource,
      threeHost: host,
      onRender: (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
    );
    final backend = QuickjsWidgetEngineBackend(config: config);
    final engine = JsWidgetEngine(config: config.copyWith(backend: backend));
    addTearDown(() async {
      await engine.dispose();
      host.disposeEngine(engineId);
    });
    await engine.init();
    await engine.run(r'''
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

    final surface =
        host.findSurface(engineId, 'main#1') as FlutterGpuThreeSurface?;
    expect(surface, isNotNull);
    host.attach(engineId, 'main#1', const {});
    surface!.resize(const Size(256, 256), 1);
    await tester.pumpWidget(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Center(
          child: SizedBox(
            width: 256,
            height: 256,
            child: AnimatedBuilder(
              animation: surface,
              builder: (context, _) => host.build(context, surface, const {}),
            ),
          ),
        ),
      ),
    );

    Uint8List? png;
    for (var attempt = 0; attempt < 400; attempt++) {
      if (surface.diagnostics['failedPresentations'] == 0 &&
          (surface.diagnostics['presentedFrames'] ?? 0) >= 2 &&
          (surface.diagnostics['shadowCacheHits'] ?? 0) >= 1 &&
          (surface.diagnostics['batchCacheHits'] ?? 0) >= 1 &&
          surface.diagnostics['backendReady'] == 1) {
        png = await tester.runAsync<Uint8List?>(
          () => surface.capture().timeout(const Duration(seconds: 5)),
        );
        if (png != null) break;
      }
      await tester.pump(const Duration(milliseconds: 25));
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(milliseconds: 25)),
      );
    }
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

    await tester.pumpWidget(const SizedBox.shrink());
    await engine.dispose();
    host.disposeEngine(engineId);
  });
}
