import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_host.dart'
    show FlutterGpuThreeSurface;
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';
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

  test('Flutter CanvasTexture reaches QuickJS R1 and refreshes a static scene', () async {
    final host = createFlutterGpuThreeHost();
    final config = JsRuntimeConfig(
      widgetId: 'three-canvas2d-quickjs',
      instanceId: 'three-canvas2d-quickjs',
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
      var canvasScene = (() => {
        const surface = jsr.three.createCanvas('main');
        const canvas = jsr.three.createCanvas2D('main', {width: 16, height: 16});
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0.1, 'rgba(210,210,210,1)');
        gradient.addColorStop(1, 'rgba(255,255,255,1)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 16, 16);
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({map: texture});
        const scene = new THREE.Scene();
        scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        camera.position.z = 3;
        const renderer = new THREE.WebGLRenderer({canvas: surface});
        canvas.addEventListener('ready', () => jsr.exportState({
          phase: 'ready', textureVersion: texture.version,
          width: texture.image.width, height: texture.image.height
        }));
        renderer.render(scene, camera);
        jsr.exportState({phase: 'initial', textureVersion: texture.version});
        jsr.onEvent(action => {
          if (action === 'dedup') {
            renderer.render(scene, camera);
            renderer.render(scene, camera);
          } else if (action === 'update') {
            context.fillStyle = 'rgba(1,2,3,1)';
            context.fillRect(0, 0, 16, 16);
          }
        });
        return {surface, canvas, context, texture, material, renderer, scene, camera};
      })();
    ''');

    Future<JsThreeSurfaceState> waitFor(
      bool Function(JsThreeSurfaceState state) predicate,
    ) async {
      for (var attempt = 0; attempt < 500; attempt++) {
        final surface = host.findSurface(
          'three-canvas2d-quickjs',
          'main#1',
        );
        final state = (surface as FlutterGpuThreeSurface?)?.state;
        if (state != null && predicate(state)) return state;
        await Future<void>.delayed(const Duration(milliseconds: 10));
      }
      final surface = host.findSurface('three-canvas2d-quickjs', 'main#1');
      final state = (surface as FlutterGpuThreeSurface?)?.state;
      throw StateError(
        'Timed out waiting for Canvas2D QuickJS R1 state: '
        'frames=${state?.submittedFrameCount}, textures=${state?.textureUploadCount}, '
        'exported=${engine.exportedState}, logs=${engine.peekLogs()}',
      );
    }

    final ready = await waitFor(
      (state) => state.textureUploadCount == 1 && state.submittedFrameCount >= 2,
    );
    expect(ready.currentFrame, isNotNull);
    expect(ready.textureUploadCount, 1);
    expect(ready.materialUploadCount, 2);
    final upload = ready.textures.values.single;
    expect(upload.version, 1);
    expect(upload.width, 16);
    expect(upload.height, 16);
    expect(upload.encoding, JsThreeTextureEncoding.rawRgba8);
    expect(upload.data.length, 16 * 16 * 4);
    final center = (8 * 16 + 8) * 4;
    expect(upload.data.sublist(center, center + 4), [210, 210, 210, 255]);
    expect(upload.data.sublist(0, 4), [255, 255, 255, 255]);
    expect(ready.materials.values.single.mapTextureId, upload.textureId);
    expect(engine.exportedState, {
      'phase': 'ready',
      'textureVersion': 2,
      'width': 16,
      'height': 16,
    });

    final submitted = ready.submittedFrameCount;
    await backend.callEvent('dedup');
    final deduplicated = await waitFor(
      (state) => state.submittedFrameCount >= submitted + 2,
    );
    expect(deduplicated.textureUploadCount, 1);
    expect(deduplicated.textures.values.single.version, 1);
    final deduplicatedSubmitted = deduplicated.submittedFrameCount;

    await backend.callEvent('update');
    final updated = await waitFor((state) => state.textureUploadCount == 2);
    final second = updated.textures.values.single;
    expect(second.version, 2);
    expect(second.width, 16);
    expect(second.height, 16);
    for (var offset = 0; offset < second.data.length; offset += 4) {
      expect(second.data.sublist(offset, offset + 4), [1, 2, 3, 255]);
    }
    expect(updated.submittedFrameCount, greaterThan(deduplicatedSubmitted));
    expect(engine.exportedState, {
      'phase': 'ready',
      'textureVersion': 3,
      'width': 16,
      'height': 16,
    });
  });
}
