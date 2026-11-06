import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';

/// Defect pin for `three-performance` (official webgl_performance — the
/// dungeon_warkarma.glb scene: 26 textures / ~800 single-material meshes).
///
/// Two invariants must hold once the scene is warm:
///
/// 1. Draw-call bound: every planned frame draws the SAME (large) number of
///    R1 draws — the static scene neither grows nor churns its draw plan, so
///    per-frame cost is bounded by draw planning + paint, never by resource
///    replay.
/// 2. Upload stability: geometry / material / texture / node / batch versions
///    are byte-stable across a steady-state window — the identity/version
///    lanes must NOT re-upsert static resources per frame (a redundant
///    per-frame upsert regressed this scene before via geometry signature
///    churn and would reintroduce multi-second load stalls here).
void main() {
  testWidgets(
    'three-performance keeps a stable draw-call bound and warm upload stability',
    (WidgetTester tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-performance',
        instanceId: 'three-performance-drawbound',
      );
      addTearDown(() => harness.dispose(tester));

      // The dungeon GLB + UltraHDR env parse over several seconds of real work;
      // wait for the full model (hundreds of single-material mesh draws).
      final plan = await harness.pumpUntil(
        tester,
        (state, plan) => plan.draws.length >= 400,
        attempts: 600,
      );
      expect(plan, isNotNull, reason: 'dungeon scene must reach a drawn plan');
      expect(plan!.canRender, isTrue);
      expect(plan.diagnostics.warnings, isEmpty);

      await tester.runAsync(
        () => Future<void>.delayed(const Duration(milliseconds: 200)),
      );
      await harness.pumpFrames(tester, 10);
      final warmState = harness.state!;
      final warmPlan = const ThreeDrawPlanner().plan(warmState);
      final steady = _ResourceSnapshot.of(warmState);
      final submittedBefore = warmState.submittedFrameCount;
      final drawsWarm = warmPlan.draws.length;
      final trianglesWarm = warmPlan.triangleCount;

      await tester.runAsync(
        () => Future<void>.delayed(const Duration(milliseconds: 800)),
      );
      await harness.pumpFrames(tester, 10);

      final laterState = harness.state!;
      final laterPlan = const ThreeDrawPlanner().plan(laterState);
      final steadyLater = _ResourceSnapshot.of(laterState);

      // Frames kept flowing across the window (the pump stayed live).
      expect(
        laterState.submittedFrameCount,
        greaterThan(submittedBefore),
        reason: 'steady-state window must still submit frames',
      );

      // 1. Draw-call bound: identical plan shape on both sides of the window.
      expect(
        laterPlan.draws.length,
        drawsWarm,
        reason: 'static scene must not change its per-frame draw count',
      );
      expect(laterPlan.draws.length, greaterThanOrEqualTo(400));
      expect(
        laterPlan.diagnostics.warnings,
        isEmpty,
        reason: 'warm frames must plan without warnings',
      );

      // 2. Upload stability: no resource version moved in the steady window.
      expect(
        steadyLater.geometryVersions,
        steady.geometryVersions,
        reason: 'static geometry must not re-upsert per frame',
      );
      expect(
        steadyLater.materialVersions,
        steady.materialVersions,
        reason: 'static materials must not re-upsert per frame',
      );
      expect(
        steadyLater.textureVersions,
        steady.textureVersions,
        reason: 'static textures must not re-upsert per frame',
      );
      expect(
        steadyLater.nodeVersions,
        steady.nodeVersions,
        reason: 'static nodes must not re-upsert per frame',
      );
      expect(
        steadyLater.batchVersions,
        steady.batchVersions,
        reason: 'static batches must not re-upsert per frame',
      );
      // Sanity on the scale of the pin: the dungeon is a many-draw scene.
      expect(drawsWarm, greaterThanOrEqualTo(400));
      expect(trianglesWarm, greaterThan(10000));

      // Dispose inside the body: the scheduler binding asserts no transient
      // callbacks survive the test body, and tearDowns run after that check.
      await harness.dispose(tester);
    },
  );
}

final class _ResourceSnapshot {
  const _ResourceSnapshot({
    required this.geometryVersions,
    required this.materialVersions,
    required this.textureVersions,
    required this.nodeVersions,
    required this.batchVersions,
  });

  factory _ResourceSnapshot.of(JsThreeSurfaceState state) => _ResourceSnapshot(
    geometryVersions: state.geometries.map(
      (id, upsert) => MapEntry(id, upsert.version),
    ),
    materialVersions: state.materials.map(
      (id, upsert) => MapEntry(id, upsert.version),
    ),
    textureVersions: state.textures.map(
      (id, upsert) => MapEntry(id, upsert.version),
    ),
    nodeVersions: state.nodes.map(
      (id, upsert) => MapEntry(
        id,
        Object.hash(
          upsert.parentId,
          upsert.geometryId,
          upsert.materialId,
          upsert.flags,
          upsert.matrixWorld,
          upsert.renderOrder,
        ),
      ),
    ),
    batchVersions: state.batches.map(
      (id, upsert) => MapEntry(id, upsert.version),
    ),
  );

  final Map<int, int> geometryVersions;
  final Map<int, int> materialVersions;
  final Map<int, int> textureVersions;
  final Map<int, int> nodeVersions;
  final Map<int, int> batchVersions;
}
