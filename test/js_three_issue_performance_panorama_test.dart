import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_quickjs_example_harness.dart';

Future<ThreeQuickjsExampleHarness> _bootOfficial(
  WidgetTester tester,
  String widgetId,
) async {
  final harness = await ThreeQuickjsExampleHarness.boot(
    tester,
    widgetId: widgetId,
    instanceId: '$widgetId-regression',
  );
  await harness.pumpUntil(
    tester,
    (state, plan) => state.submittedFrameCount >= 3,
  );
  await tester.runAsync(() => Future<void>.delayed(const Duration(seconds: 2)));
  await harness.pumpFrames(tester, 5);
  return harness;
}

void main() {
  testWidgets('draw range uploads only the active non-indexed vertex window', (
    tester,
  ) async {
    final harness = await _bootOfficial(
      tester,
      'three-buffergeometry-drawrange',
    );
    final before = harness.state!;
    final framesBefore = before.submittedFrameCount;
    final geometryBefore = before.geometryUploadCount;
    final textureBefore = before.textureUploadCount;
    final materialBefore = before.materialUploadCount;
    final batchBefore = before.batchUploadCount;

    await harness.pumpFrames(tester, 40);

    final state = harness.state!;
    final plan = const ThreeDrawPlanner().plan(state);
    expect(plan.diagnostics.warnings, isEmpty);
    expect(state.submittedFrameCount - framesBefore, 40);
    expect(state.geometryUploadCount, greaterThan(geometryBefore));
    expect(state.textureUploadCount, textureBefore);
    expect(state.materialUploadCount, materialBefore);
    expect(state.batchUploadCount, batchBefore);

    final connections = plan.draws.singleWhere(
      (draw) => draw.geometry.colors != null,
    );
    // The backing BufferAttributes have 250,000 vertices. Only the changing
    // draw-range window is encoded now, not that entire capacity every frame.
    expect(connections.geometry.vertexCount, lessThan(250000));
    expect(connections.geometry.vertexCount, connections.drawCount);
    expect(connections.geometry.indexCount, 0);
    expect(
      connections.geometry.positions.length,
      connections.geometry.vertexCount * 3,
    );
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('paused skinning keeps geometry and shadow revisions flat', (
    tester,
  ) async {
    final harness = await _bootOfficial(
      tester,
      'three-animation-skinning-blending',
    );
    final animated = harness.state!;
    final animatedGeometry = animated.geometryUploadCount;
    await harness.pumpFrames(tester, 20);
    expect(
      harness.state!.geometryUploadCount,
      greaterThan(animatedGeometry),
      reason: 'the control must begin with genuinely animated skinning',
    );

    final gui = harness.engine.exportedState!['gui'] as Map<String, dynamic>;
    final pause = (gui['values'] as List<dynamic>)
        .cast<Map<String, dynamic>>()
        .singleWhere((value) => value['property'] == 'pause/continue');
    await harness.backend.callEvent(pause['action'] as String, {});
    // Let the final mixer update reach the bone matrices before sampling.
    await harness.pumpFrames(tester, 4);
    final paused = harness.state!;
    final pausedFrames = paused.submittedFrameCount;
    final geometryBefore = paused.geometryUploadCount;
    final textureBefore = paused.textureUploadCount;
    final materialBefore = paused.materialUploadCount;
    final shadowBefore = paused.currentFrame!.shadowContentRevision;
    expect(shadowBefore, isNotNull);

    await harness.pumpFrames(tester, 40);

    final state = harness.state!;
    expect(state.submittedFrameCount - pausedFrames, 40);
    expect(state.geometryUploadCount, geometryBefore);
    expect(state.textureUploadCount, textureBefore);
    expect(state.materialUploadCount, materialBefore);
    expect(state.currentFrame!.shadowContentRevision, shadowBefore);
    expect(const ThreeDrawPlanner().plan(state).diagnostics.warnings, isEmpty);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('shadow performance dedups static resources and auto-instances', (
    tester,
  ) async {
    final harness = await _bootOfficial(tester, 'three-shadowmap-performance');
    final before = harness.state!;
    final textureBefore = before.textureUploadCount;
    final materialBefore = before.materialUploadCount;
    final batchBefore = before.batchUploadCount;

    await harness.pumpFrames(tester, 40);

    final state = harness.state!;
    final plan = const ThreeDrawPlanner().plan(state);
    expect(plan.diagnostics.warnings, isEmpty);
    expect(plan.drawCallCount, greaterThan(600));
    expect(state.textureUploadCount, textureBefore);
    expect(state.materialUploadCount, materialBefore);
    expect(state.batchUploadCount, batchBefore);

    final nativePlan = const ThreeDrawPlanner(autoInstance: true).plan(state);
    expect(nativePlan.drawCallCount, lessThan(20));
    final horseInstances = nativePlan.draws
        .where((draw) => draw.autoInstanced)
        .fold<int>(0, (count, draw) => count + draw.instanceCount);
    expect(
      horseInstances,
      601,
      reason: 'all cloned horses share a few native instance submissions',
    );
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('panorama atlas produces six stable textured cube faces', (
    tester,
  ) async {
    final harness = await _bootOfficial(tester, 'three-panorama-cube');
    final ready = harness.state!;
    expect(ready.textureUploadCount, 6);
    final before = (
      geometry: ready.geometryUploadCount,
      texture: ready.textureUploadCount,
      material: ready.materialUploadCount,
      batch: ready.batchUploadCount,
    );

    await harness.pumpFrames(tester, 40);

    final state = harness.state!;
    final plan = const ThreeDrawPlanner().plan(state);
    expect(plan.diagnostics.warnings, isEmpty);
    expect(plan.drawCallCount, 6);
    expect(state.geometryUploadCount, before.geometry);
    expect(state.textureUploadCount, before.texture);
    expect(state.materialUploadCount, before.material);
    expect(state.batchUploadCount, before.batch);
    expect(state.textures, hasLength(6));
    for (final texture in state.textures.values) {
      expect(texture.width, 1024);
      expect(texture.height, 1024);
      expect(texture.encoding, JsThreeTextureEncoding.rawRgba8);
      expect(texture.data.length, 1024 * 1024 * 4);
      expect(
        texture.data.take(4096).toSet().length,
        greaterThan(8),
        reason: 'each face contains decoded image pixels, not a white fill',
      );
    }
    final mappedMaterials = state.materials.values
        .where((material) => material.mapTextureId != 0)
        .toList();
    expect(mappedMaterials, hasLength(6));
    expect(
      mappedMaterials.map((material) => material.mapTextureId).toSet(),
      hasLength(6),
    );
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets(
    'camera-only frames reuse the automatic shadow content revision',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.bootSource(
        tester,
        instanceId: 'three-camera-only-shadow-cache',
        source: r'''
      const surface = jsr.three.createCanvas('main');
      const renderer = new THREE.WebGLRenderer({canvas: surface});
      renderer.shadowMap.enabled = true;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      camera.position.set(0, 3, 8);
      const light = new THREE.DirectionalLight(0xffffff, 2);
      light.position.set(3, 6, 4);
      light.castShadow = true;
      scene.add(light);
      const caster = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({
          color: 0x8899aa, polygonOffset: true,
          polygonOffsetFactor: 1, polygonOffsetUnits: 1
        })
      );
      caster.castShadow = true;
      scene.add(caster);
      let tick = 0;
      renderer.setAnimationLoop(() => {
        tick++;
        camera.position.x = tick * 0.01;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      });
      ''',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) => state.submittedFrameCount >= 3,
      );
      final before = harness.state!;
      final framesBefore = before.submittedFrameCount;
      final revision = before.currentFrame!.shadowContentRevision;
      final geometry = before.geometryUploadCount;
      final material = before.materialUploadCount;
      expect(revision, isNotNull);

      await harness.pumpFrames(tester, 40);

      final state = harness.state!;
      expect(state.submittedFrameCount - framesBefore, 40);
      expect(state.currentFrame!.shadowContentRevision, revision);
      expect(state.geometryUploadCount, geometry);
      expect(state.materialUploadCount, material);
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );
}
