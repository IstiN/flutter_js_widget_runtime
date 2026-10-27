import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_host.dart'
    show FlutterGpuThreeSurface;
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  test(
    'upstream native bundle crosses JS encoder/Dart decoder without uploads churn',
    () async {
      final host = createFlutterGpuThreeHost();
      final config = JsRuntimeConfig(
        widgetId: 'three-quickjs',
        instanceId: 'three-quickjs',
        threeEnabled: true,
        threeHost: host,
        onRender: (_) {},
        onSetTitle: (_) {},
        onStorageUpdate: (_) {},
      );
      final backend = QuickjsWidgetEngineBackend(config: config);
      final engine = JsWidgetEngine(config: config.copyWith(backend: backend));
      addTearDown(engine.dispose);
      await engine.init();
      await engine.run(r'''
      const canvas = jsr.three.createCanvas('main');
      const renderer = new THREE.WebGLRenderer({canvas: canvas});
      renderer.setSize(64, 64);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xbfd1e5);
      const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
      camera.position.z = 3;
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({color: 0x44aa66});
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      for (let frame = 0; frame < 300; frame++) {
        camera.position.x = frame * 0.001;
        renderer.render(scene, camera);
      }
      jsr.exportState({
        revision: THREE.REVISION,
        backend: jsr.three.capabilities.backend,
        rawWebGL: jsr.three.capabilities.rawWebGL,
        frame: renderer.info.render.frame,
        geometries: renderer.info.memory.geometries
      });
    ''');

      expect(engine.exportedState, {
        'revision': '186',
        'backend': 'flutterGpu',
        'rawWebGL': false,
        'frame': 300,
        'geometries': 1,
      });
      final surface = host.findSurface('three-quickjs', 'main#1');
      expect(surface, isA<FlutterGpuThreeSurface>());
      final state = (surface! as FlutterGpuThreeSurface).state!;
      expect(state.geometryUploadCount, 1);
      expect(state.textureUploadCount, 0);
      expect(state.materialUploadCount, 1);
      expect(state.submittedFrameCount, 300);
      expect(state.appliedEnvelopeCount, 300);
      expect(state.pendingFrameCount, lessThanOrEqualTo(2));
      expect(state.geometries, hasLength(1));
      expect(state.currentFrame, isNotNull);
    },
  );
}
