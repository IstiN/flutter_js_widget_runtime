import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_draw_plan_bytes.dart';

/// Lever 2 (round 3): composer sub-pass plan reuse.
///
/// Multi-pass effects queue ~15 frames per JS tick with an unchanged
/// resource revision between them. The planner must:
///   1. reuse one walk across those frames (shared draw lists, per-frame
///      shell),
///   2. RE-PLAN when the scene mutates between queued frames (depth passes
///      swap materials; a stale walk would bind the wrong material),
///   3. treat a content-identical node re-upsert as unchanged (composer
///      ticks re-send every node once per pass).
JsThreeSurfaceState _apply(
  JsThreeStateStore store,
  List<Uint8List> commands, {
  int sequence = 1,
}) {
  final engine = utf8.encode('engine');
  final surface = utf8.encode('surface');
  final payload = r1Envelope(commands, version: 2);
  final headerBytes = 32 + engine.length + surface.length;
  final result = Uint8List(headerBytes + payload.length);
  final data = ByteData.sublistView(result);
  result.setRange(0, 4, ascii.encode('JSR3'));
  data.setUint8(4, 1);
  data.setUint8(5, 1);
  data.setUint16(6, headerBytes, Endian.little);
  data.setUint32(8, sequence, Endian.little);
  data.setUint32(12, payload.length, Endian.little);
  data.setUint16(16, engine.length, Endian.little);
  data.setUint16(18, surface.length, Endian.little);
  data.setUint32(24, result.length, Endian.little);
  result.setRange(32, 32 + engine.length, engine);
  result.setRange(32 + engine.length, headerBytes, surface);
  result.setRange(headerBytes, result.length, payload);
  return store.apply(result).surface;
}

List<Uint8List> _scene({double nodeX = 0}) => [
  r1Command(4, r1Node(1, objectKind: JsThreeObjectKind.group)),
  r1Command(
    1,
    r1Geometry(
      2,
      version: 1,
      primitive: JsThreePrimitive.triangles,
      positions: const [0, 0, 0, 1, 0, 0, 0, 1, 0],
      normals: null,
      uvs: null,
      colors: null,
      indices: const [],
    ),
  ),
  r1Command(3, r1Material(3)),
  r1Command(
    4,
    r1Node(
      4,
      parentId: 1,
      geometryId: 2,
      materialId: 3,
      objectKind: JsThreeObjectKind.mesh,
      matrixWorld: [1, 0, 0, nodeX, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    ),
  ),
  r1Command(6, r1Camera(9)),
];

bool _sameSet(Set<int> a, Set<int> b) =>
    a.length == b.length && a.every(b.contains);

void main() {
  test('unchanged tick: queued frames share one walk, keep their own frame', () {
    final store = JsThreeStateStore();
    final state = _apply(store, [..._scene(), r1Command(8, r1Frame(sceneId: 1, cameraId: 9))]);
    final rev = state.contentRevision;
    final first = JsThreeFramePlanView.snapshot(state, state.currentFrame!, const []);
    // Composer pass 2 re-sends the same node content; the revision must not
    // move, and the snapshot must reuse the shared map set.
    final state2 = _apply(
      store,
      [..._scene(), r1Command(8, r1Frame(sceneId: 1, cameraId: 9))],
      sequence: 2,
    );
    expect(state2, same(state));
    expect(state2.contentRevision, rev, reason: 'content-identical re-upserts must not bump the revision');
    final second = JsThreeFramePlanView.snapshot(state2, state2.currentFrame!, const []);
    expect(identical(first.geometries, second.geometries), isTrue, reason: 'snapshot map set must be shared across unchanged frames');
    expect(identical(first.nodes, second.nodes), isTrue);

    const planner = ThreeDrawPlanner();
    final planA = planner.plan(first, frame: first.frame);
    final planB = planner.plan(second, frame: second.frame);
    expect(identical(planA.opaque, planB.opaque), isFalse, reason: 'independent plans still walk (no reuse without the backend memo)');
  });

  test('backend reuse: identical frames share draw lists, clone keeps frame', () {
    final store = JsThreeStateStore();
    final state = _apply(store, [
      ..._scene(),
      r1Command(8, r1Frame(sceneId: 1, cameraId: 9)),
      r1Command(8, r1Frame(sceneId: 1, cameraId: 9)),
    ]);
    final views = <JsThreeFramePlanView>[
      for (final frame in state.pendingFrames)
        JsThreeFramePlanView.snapshot(state, frame, const []),
    ];
    // Mirror the backend reuse memo (unchanged revision + same scene/camera
    // + equal culls => clone, else plan).
    final plans = <ThreeDrawPlan>[];
    ThreeDrawPlan? reused;
    for (final view in views) {
      final canReuse = reused != null &&
          views[0].contentRevision == view.contentRevision &&
          reused.frame!.sceneId == view.frame!.sceneId &&
          reused.frame!.cameraId == view.frame!.cameraId &&
          _sameSet(
            reused.frame!.culledNodeIds,
            view.frame!.culledNodeIds,
          );
      final plan = canReuse
          ? reused.withFrame(view.frame!)
          : const ThreeDrawPlanner().plan(view, frame: view.frame);
      reused = plan;
      plans.add(plan);
    }
    expect(plans, hasLength(2));
    expect(identical(plans[0].opaque, plans[1].opaque), isTrue, reason: 'unchanged revision reuses the walk');
    expect(plans[1].frame, same(views[1].frame), reason: 'clone keeps its own frame binding');
    expect(plans[0].frame, same(views[0].frame));
  });

  test('scene mutation between queued frames forces a fresh plan', () {
    final store = JsThreeStateStore();
    _apply(store, [..._scene(), r1Command(8, r1Frame(sceneId: 1, cameraId: 9))]);
    final before = JsThreeFramePlanView.snapshot(store.surface('engine', 'surface')!, store.surface('engine', 'surface')!.currentFrame!, const []);
    // Depth pass swaps the node's material (different content) — revision
    // must bump and the snapshot maps must be re-copied.
    final state = _apply(
      store,
      [
        r1Command(
          4,
          r1Node(
            4,
            parentId: 1,
            geometryId: 2,
            materialId: 5,
            objectKind: JsThreeObjectKind.mesh,
            matrixWorld: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
          ),
        ),
        r1Command(3, r1Material(5)),
        r1Command(8, r1Frame(sceneId: 1, cameraId: 9)),
      ],
      sequence: 2,
    );
    expect(state.contentRevision, isNot(before.contentRevision));
    final after = JsThreeFramePlanView.snapshot(state, state.currentFrame!, const []);
    expect(identical(before.nodes, after.nodes), isFalse, reason: 'mutated tick must not share snapshot maps');
    expect(after.nodes[4]!.materialId, 5);

    final planA = const ThreeDrawPlanner().plan(before, frame: before.frame);
    final planB = const ThreeDrawPlanner().plan(after, frame: after.frame);
    expect(planA.opaque.single.material.materialId, 3);
    expect(planB.opaque.single.material.materialId, 5);
    // And the reuse gate itself must refuse:
    final sameWalk = before.contentRevision == after.contentRevision;
    expect(sameWalk, isFalse);
  });

  test('cull-set difference between frames forces a fresh plan', () {
    final store = JsThreeStateStore();
    final state = _apply(store, [
      ..._scene(),
      r1Command(8, r1Frame(sceneId: 1, cameraId: 9)),
      r1Command(8, r1Frame(sceneId: 1, cameraId: 9, culledNodeIds: const [4])),
    ]);
    final views = [
      for (final frame in state.pendingFrames)
        JsThreeFramePlanView.snapshot(state, frame, const []),
    ];
    final planA = const ThreeDrawPlanner().plan(views[0], frame: views[0].frame);
    final planB = const ThreeDrawPlanner().plan(views[1], frame: views[1].frame);
    expect(planA.opaque, hasLength(1));
    expect(planB.opaque.single.culledFromMain, isTrue);
    // The cull sets differ so the backend memo would re-plan:
    final culledA = views[0].frame!.culledNodeIds;
    final culledB = views[1].frame!.culledNodeIds;
    final sameCull = culledA.length == culledB.length &&
        culledA.every(culledB.contains);
    expect(sameCull, isFalse);
  });
}
