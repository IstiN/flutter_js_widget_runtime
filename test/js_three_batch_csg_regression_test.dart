import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart'
    show JsThreeMaterialKind;
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets('BatchedMesh retains visible per-geometry instances and colors', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      instanceId: 'three-batched-mesh-regression',
      source: r'''
        const surface = jsr.three.createCanvas('main');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        camera.position.z = 8;
        camera.lookAt(0, 0, 0);
        const box = new THREE.BoxGeometry(1, 1, 1);
        const sphere = new THREE.SphereGeometry(0.7, 8, 6);
        const batch = new THREE.BatchedMesh(
          4,
          box.attributes.position.count + sphere.attributes.position.count,
          box.index.count + sphere.index.count,
          new THREE.MeshStandardMaterial({
            color: 0xffffff, metalness: 1, roughness: 0.8
          })
        );
        const boxId = batch.addGeometry(box);
        const sphereId = batch.addGeometry(sphere);
        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();
        for (let i = 0; i < 4; i++) {
          const id = batch.addInstance(i % 2 === 0 ? boxId : sphereId);
          matrix.makeTranslation((i - 1.5) * 1.5, 0, 0);
          batch.setMatrixAt(id, matrix);
          batch.setColorAt(id, color.setRGB(i % 2 === 0 ? 1 : 0, i % 2, 0.25));
        }
        scene.add(batch);
        const renderer = new THREE.WebGLRenderer({canvas: surface});
        renderer.render(scene, camera);
        renderer.render(scene, camera);
        jsr.exportState({
          calls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          geometries: renderer.info.memory.geometries
        });
      ''',
    );
    final state = harness.state!;
    final plan = const ThreeDrawPlanner().plan(state);
    expect(plan.mainTriangleCount, greaterThan(0));
    expect(plan.mainDrawCallCount, 2);
    expect(plan.mainDraws.map((draw) => draw.material.kind).toSet(), {
      JsThreeMaterialKind.meshBasic,
    });
    expect(plan.mainDraws.map((draw) => draw.instanceCount), [2, 2]);
    expect(
      plan.mainDraws.every((draw) => draw.batch!.hasInstanceColors),
      isTrue,
    );
    expect(state.batches, hasLength(2));
    expect(
      state.batches.values.every((batch) => batch.instanceCount == 2),
      isTrue,
    );
    expect(state.geometryUploadCount, 2);
    expect(state.batchUploadCount, 2);
    expect(harness.engine.exportedState, {
      'calls': 2,
      'triangles': 184,
      'geometries': 2,
    });
    await harness.dispose(tester);
  });

  testWidgets('official batch LOD BVH presents centered real instances', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-batch-lod-bvh',
      instanceId: 'three-batch-lod-bvh-regression',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.submittedFrameCount > 0 && plan.mainTriangleCount > 0,
      attempts: 20,
    );
    final state = harness.state!;
    final plan = const ThreeDrawPlanner().plan(state);
    // Bounded batch: the wrapper retains the 128 instances closest to the
    // world origin and every retained instance renders its base LOD0 range
    // (16384 tris) in one draw per base geometry.
    expect(plan.mainTriangleCount, 2097152);
    expect(plan.mainDrawCallCount, 10);
    expect(plan.mainDraws.map((draw) => draw.material.kind).toSet(), {
      JsThreeMaterialKind.meshStandard,
    });
    expect(
      plan.mainDraws.every((draw) => draw.material.envMapTextureId > 0),
      isTrue,
    );
    expect(
      state.batches.values.fold<int>(
        0,
        (sum, batch) => sum + batch.instanceCount,
      ),
      128,
    );
    expect(
      plan.mainDraws.every((draw) => draw.batch!.hasInstanceColors),
      isTrue,
    );
    final geometryUploads = state.geometryUploadCount;
    final batchUploads = state.batchUploadCount;
    await harness.pumpFrames(tester, 3);
    expect(state.geometryUploadCount, geometryUploads);
    expect(state.batchUploadCount, batchUploads);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(minutes: 3)));

  testWidgets(
    'official CSG reuses coherent topology during base-transform animation',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-geometry-csg',
        instanceId: 'three-geometry-csg-regression',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.submittedFrameCount > 0 && plan.mainTriangleCount > 0,
        attempts: 20,
      );
      final state = harness.state!;
      final uploadDeltas = <int>[];
      for (var frame = 0; frame < 4; frame++) {
        final before = state.geometryUploadCount + state.batchUploadCount;
        await harness.pumpFrame(tester);
        uploadDeltas.add(
          state.geometryUploadCount + state.batchUploadCount - before,
        );
      }
      expect(uploadDeltas.reduce((a, b) => a + b), lessThanOrEqualTo(2));
      expect(uploadDeltas.skip(1).every((delta) => delta == 0), isTrue);
      expect(
        const ThreeDrawPlanner().plan(state).mainTriangleCount,
        greaterThan(0),
      );
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(minutes: 3)),
  );

  /// Shared FakeEvaluator JS source prefix for the bounded-CSG suites. The
  /// [evaluateBody] differs per test (userData probe vs transform
  /// propagation); the rest of the harness must stay identical so the
  /// evaluator cache behavior is comparable across cases. The returned
  /// prefix is concatenated with the per-test scene source.
  String _csgFakeEvaluatorSource({
    required String evaluateBody,
    required String evaluatorSetup,
  }) =>
      """
        let evaluations = 0;
        class FakeEvaluator {
          constructor() {
            this.useGroups = true;
            this.consolidateGroups = true;
            this.removeUnusedMaterials = true;
            this.attributes = ['position'];
          }
          evaluate(a, b, operation, target) {
            evaluations++;
            $evaluateBody
            return target;
          }
        }
        $evaluatorSetup
        const evaluator = new CachedEvaluator();
""";

  testWidgets(
    'bounded CSG evaluator caches transforms and invalidates structure',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.bootSource(
        tester,
        instanceId: 'three-csg-cache-regression',
        source:
            _csgFakeEvaluatorSource(
              evaluateBody: 'target.userData.operation = operation;',
              evaluatorSetup:
                  'const CachedEvaluator = THREE.createBoundedCSGEvaluator('
                  'FakeEvaluator, {transformInterval: 3});',
            ) +
            r'''
        const a = new THREE.Mesh(
          new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()
        );
        const b = new THREE.Mesh(
          new THREE.SphereGeometry(), new THREE.MeshBasicMaterial()
        );
        const target = new THREE.Mesh(
          new THREE.BufferGeometry(), new THREE.MeshBasicMaterial()
        );
        for (let frame = 0; frame < 7; frame++) {
          a.rotation.x = frame * 0.01;
          a.updateMatrixWorld();
          b.updateMatrixWorld();
          evaluator.evaluate(a, b, 1, target);
        }
        evaluator.evaluate(a, b, 1, target);
        evaluator.evaluate(a, b, 2, target);
        jsr.exportState({
          evaluations,
          targetOperation: target.userData.operation,
          diagnostics: THREE.getNativeCSGDiagnostics()
        });
      ''',
      );
      expect(harness.engine.exportedState, {
        'evaluations': 4,
        'targetOperation': 2,
        'diagnostics': {
          'evaluations': 4,
          'exactHits': 1,
          'transformSkips': 4,
          'transformUpdates': 0,
          'structuralInvalidations': 1,
        },
      });
      await harness.dispose(tester);
    },
  );

  testWidgets(
    'bounded CSG propagates transforms without periodic exact rebuilds',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.bootSource(
        tester,
        instanceId: 'three-csg-transform-propagation',
        source:
            _csgFakeEvaluatorSource(
              evaluateBody:
                  'target.material = [a.material, b.material];\n'
                  'a.matrixWorld.decompose(target.position, '
                  'target.quaternion, target.scale);\n'
                  'target.updateMatrix();\n'
                  'target.matrixWorld.copy(a.matrixWorld);',
              evaluatorSetup:
                  'const CachedEvaluator = '
                  "THREE.createBoundedCSGEvaluator(FakeEvaluator);",
            ) +
            r'''
        const a = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
        const b = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([
          0, 0, 0, 1, 0, 0, 0, 1, 0,
          3, 0, 0, 4, 0, 0, 3, 1, 0
        ], 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute([
          0, 0, 1, 0, 0, 1, 0, 0, 1,
          0, 0, 1, 0, 0, 1, 0, 0, 1
        ], 3));
        geometry.addGroup(0, 3, 0);
        geometry.addGroup(3, 3, 1);
        const target = new THREE.Mesh(geometry, [a.material, b.material]);
        const samples = [];
        for (let frame = 0; frame < 25; frame++) {
          a.position.x = frame;
          b.position.x = frame * 2;
          a.updateMatrixWorld();
          b.updateMatrixWorld();
          evaluator.evaluate(a, b, 1, target);
          if (frame < 3) {
            samples.push({
              resultX: target.position.x,
              aVertexX: geometry.attributes.position.getX(0),
              bVertexX: geometry.attributes.position.getX(4)
            });
          }
        }
        jsr.exportState({
          evaluations, samples,
          dynamicAttributes: geometry.attributes.position._r1DynamicContent &&
            geometry.attributes.normal._r1DynamicContent,
          boundsValid: geometry.boundingBox.min.x === 0 &&
            geometry.boundingBox.max.x === 28 &&
            geometry.boundingSphere.center.x === 14 &&
            geometry.boundingSphere.radius >= 14,
          diagnostics: THREE.getNativeCSGDiagnostics()
        });
      ''',
      );
      expect(harness.engine.exportedState, {
        'evaluations': 1,
        'samples': [
          {'resultX': 0, 'aVertexX': 0, 'bVertexX': 4},
          {'resultX': 1, 'aVertexX': 0, 'bVertexX': 5},
          {'resultX': 2, 'aVertexX': 0, 'bVertexX': 6},
        ],
        'dynamicAttributes': true,
        'boundsValid': true,
        'diagnostics': {
          'evaluations': 1,
          'exactHits': 0,
          'transformSkips': 24,
          'transformUpdates': 24,
          'structuralInvalidations': 0,
        },
      });
      await harness.dispose(tester);
    },
  );

  testWidgets(
    'official CSG exact evaluations stay stable across animated frames',
    (tester) async {
      // The bounded evaluator must be WIRED into the official example
      // (importOverrides: three-bvh-csg -> degrades/csg_cached.mjs) and its
      // cache must hold while only brush transforms animate: exactly one
      // structural evaluation at boot, transform skips for every later
      // frame, no structural invalidations and no transform refreshes in the
      // rigid mode. The stock evaluator never touches the diagnostics
      // (all-zero) and a cache miss bug would tick `evaluations` per frame.
      final raw = await tester.runAsync(
        () =>
            File('example/widgets/three-geometry-csg/widget.js').readAsString(),
      );
      final harness = await ThreeQuickjsExampleHarness.bootSource(
        tester,
        source:
            '$raw'
            '''
;(function(){
  if (typeof jsr === 'undefined' || !jsr.exportState) return;
  setInterval(function(){
    var d = globalThis.__JSR_THREE_CSG_DIAGNOSTICS__ || {};
    jsr.exportState({ csgDiagnostics: {
      evaluations: d.evaluations | 0,
      exactHits: d.exactHits | 0,
      transformSkips: d.transformSkips | 0,
      transformUpdates: d.transformUpdates | 0,
      structuralInvalidations: d.structuralInvalidations | 0
    }});
  }, 50);
})();
''',
        instanceId: 'three-geometry-csg-evaluations',
        useIsolate: true,
      );
      Map<String, dynamic>? first;
      Map<String, dynamic>? last;
      for (
        var i = 0;
        i < 120 && (last == null || last['transformSkips']! < 10);
        i++
      ) {
        await harness.pumpFrame(tester);
        final value = harness.engine.exportedState?['csgDiagnostics'];
        if (value is Map) {
          final snapshot = value.cast<String, dynamic>();
          first ??= snapshot;
          last = snapshot;
        }
      }
      expect(last, isNotNull, reason: 'CSG diagnostics probe never exported');
      expect(
        first!['evaluations'],
        greaterThanOrEqualTo(1),
        reason: 'bounded evaluator not wired: diagnostics never ticked',
      );
      expect(
        last!['evaluations'],
        first['evaluations'],
        reason: 'exact CSG re-evaluated per frame (cache miss bug)',
      );
      expect(
        last['transformSkips'],
        greaterThanOrEqualTo(10),
        reason: 'transform cache produced no skips',
      );
      expect(
        last['structuralInvalidations'],
        0,
        reason: 'structural key flapped during transform-only animation',
      );
      expect(
        last['transformUpdates'],
        0,
        reason: 'rigid mode must not rewrite cached vertices per frame',
      );
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(minutes: 3)),
  );
}
