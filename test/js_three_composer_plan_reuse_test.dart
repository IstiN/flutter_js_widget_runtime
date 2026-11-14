import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_backend.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';

import 'support/three_draw_plan_bytes.dart';

/// Lever 2 (round 3): composer sub-pass plan reuse.
///
/// Multi-pass effects queue ~15 frames per JS tick with an unchanged
/// resource revision between them. The production planner must reuse one
/// walk across those frames, while any resource, scene, camera, or cull-set
/// change forces a fresh walk.
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

List<JsThreeFramePlanView> _views(JsThreeSurfaceState state) => [
  for (final frame in state.pendingFrames)
    JsThreeFramePlanView.snapshot(state, frame, const []),
];

void main() {
  test('frames == null handles both a null frame and the current frame', () {
    final store = JsThreeStateStore();
    final emptyState = _apply(store, _scene());

    final emptyPlans = debugPlanThreeFrames(emptyState);

    expect(emptyPlans, hasLength(1));
    expect(emptyPlans.single.frame, isNull);
    expect(emptyPlans.single.opaque, isEmpty);
    expect(
      emptyPlans.single.diagnostics.warnings,
      contains('surface JsThreeSurfaceKey(engine, surface) has no submitted frame'),
    );

    final framedState = _apply(
      store,
      [r1Command(8, r1Frame(sceneId: 1, cameraId: 9))],
      sequence: 2,
    );
    final framedPlans = debugPlanThreeFrames(framedState);

    expect(framedPlans, hasLength(1));
    expect(framedPlans.single.frame, same(framedState.currentFrame));
    expect(framedPlans.single.opaque, hasLength(1));
  });

  test('content-identical re-upserts retain the revision and share a plan', () {
    final store = JsThreeStateStore();
    final state = _apply(store, [
      ..._scene(),
      r1Command(8, r1Frame(sceneId: 1, cameraId: 9)),
    ]);
    final revision = state.contentRevision;
    final first = JsThreeFramePlanView.snapshot(
      state,
      state.currentFrame!,
      const [],
    );
    final state2 = _apply(
      store,
      [..._scene(), r1Command(8, r1Frame(sceneId: 1, cameraId: 9))],
      sequence: 2,
    );
    final second = JsThreeFramePlanView.snapshot(
      state2,
      state2.currentFrame!,
      const [],
    );

    expect(state2, same(state));
    expect(state2.contentRevision, revision);
    expect(identical(first.geometries, second.geometries), isTrue);
    expect(identical(first.nodes, second.nodes), isTrue);

    final plans = debugPlanThreeFrames(state2, frames: [first, second]);

    expect(identical(plans[0].opaque, plans[1].opaque), isTrue);
    expect(plans[1].frame, same(second.frame));
  });

  test('repeated view identity reuses draws and still clones the plan shell', () {
    final store = JsThreeStateStore();
    final state = _apply(store, [
      ..._scene(),
      r1Command(
        8,
        r1Frame(sceneId: 1, cameraId: 9, culledNodeIds: const [4]),
      ),
    ]);
    final view = JsThreeFramePlanView.snapshot(
      state,
      state.currentFrame!,
      const [],
    );

    final plans = debugPlanThreeFrames(state, frames: [view, view]);

    expect(plans, hasLength(2));
    expect(plans[1], isNot(same(plans[0])));
    expect(identical(plans[0].opaque, plans[1].opaque), isTrue);
    expect(identical(plans[0].stream, plans[1].stream), isTrue);
    expect(identical(plans[0].diagnostics, plans[1].diagnostics), isTrue);
    expect(plans[0].frame, same(view.frame));
    expect(plans[1].frame, same(view.frame));
  });

  test('equal non-identical cull sets share draws and retain their frames', () {
    final store = JsThreeStateStore();
    final state = _apply(store, [
      ..._scene(),
      r1Command(
        8,
        r1Frame(sceneId: 1, cameraId: 9, culledNodeIds: const [4]),
      ),
      r1Command(
        8,
        r1Frame(sceneId: 1, cameraId: 9, culledNodeIds: const [4]),
      ),
    ]);
    final views = _views(state);
    expect(
      identical(views[0].frame.culledNodeIds, views[1].frame.culledNodeIds),
      isFalse,
    );

    final plans = debugPlanThreeFrames(state, frames: views);

    expect(plans[1], isNot(same(plans[0])));
    expect(identical(plans[0].opaque, plans[1].opaque), isTrue);
    expect(identical(plans[0].transparent, plans[1].transparent), isTrue);
    expect(identical(plans[0].stream, plans[1].stream), isTrue);
    expect(plans[0].frame, same(views[0].frame));
    expect(plans[1].frame, same(views[1].frame));
  });

  test('same-length cull sets with different IDs force fresh plans', () {
    final store = JsThreeStateStore();
    final state = _apply(store, [
      ..._scene(),
      r1Command(
        8,
        r1Frame(sceneId: 1, cameraId: 9, culledNodeIds: const [4]),
      ),
      r1Command(
        8,
        r1Frame(sceneId: 1, cameraId: 9, culledNodeIds: const [999]),
      ),
    ]);
    final views = _views(state);
    expect(views[0].frame.culledNodeIds, hasLength(1));
    expect(views[1].frame.culledNodeIds, hasLength(1));

    final plans = debugPlanThreeFrames(state, frames: views);

    expect(identical(plans[0].opaque, plans[1].opaque), isFalse);
    expect(plans[0].opaque.single.culledFromMain, isTrue);
    expect(plans[1].opaque.single.culledFromMain, isFalse);
  });

  test('empty and non-empty cull sets force fresh plans', () {
    final store = JsThreeStateStore();
    final state = _apply(store, [
      ..._scene(),
      r1Command(8, r1Frame(sceneId: 1, cameraId: 9)),
      r1Command(
        8,
        r1Frame(sceneId: 1, cameraId: 9, culledNodeIds: const [4]),
      ),
    ]);
    final views = _views(state);

    final plans = debugPlanThreeFrames(state, frames: views);

    expect(identical(plans[0].opaque, plans[1].opaque), isFalse);
    expect(plans[0].opaque.single.culledFromMain, isFalse);
    expect(plans[1].opaque.single.culledFromMain, isTrue);
  });

  test('a changed resource revision forces a fresh plan', () {
    final store = JsThreeStateStore();
    final beforeState = _apply(store, [
      ..._scene(),
      r1Command(8, r1Frame(sceneId: 1, cameraId: 9)),
    ]);
    final before = JsThreeFramePlanView.snapshot(
      beforeState,
      beforeState.currentFrame!,
      const [],
    );
    final afterState = _apply(
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
    final after = JsThreeFramePlanView.snapshot(
      afterState,
      afterState.currentFrame!,
      const [],
    );
    expect(after.contentRevision, isNot(before.contentRevision));
    expect(identical(before.nodes, after.nodes), isFalse);

    final plans = debugPlanThreeFrames(afterState, frames: [before, after]);

    expect(identical(plans[0].opaque, plans[1].opaque), isFalse);
    expect(plans[0].opaque.single.material.materialId, 3);
    expect(plans[1].opaque.single.material.materialId, 5);
  });

  test('a scene change forces a fresh plan', () {
    final store = JsThreeStateStore();
    final state = _apply(store, [
      ..._scene(),
      r1Command(4, r1Node(10, objectKind: JsThreeObjectKind.group)),
      r1Command(
        4,
        r1Node(
          11,
          parentId: 10,
          geometryId: 2,
          materialId: 3,
          objectKind: JsThreeObjectKind.mesh,
        ),
      ),
      r1Command(8, r1Frame(sceneId: 1, cameraId: 9)),
      r1Command(8, r1Frame(sceneId: 10, cameraId: 9)),
    ]);
    final views = _views(state);

    final plans = debugPlanThreeFrames(state, frames: views);

    expect(identical(plans[0].opaque, plans[1].opaque), isFalse);
    expect(plans[0].opaque.single.node.nodeId, 4);
    expect(plans[1].opaque.single.node.nodeId, 11);
  });

  test('a camera change forces a fresh plan and rebinds the camera', () {
    final store = JsThreeStateStore();
    final state = _apply(store, [
      ..._scene(),
      r1Command(6, r1Camera(10)),
      r1Command(8, r1Frame(sceneId: 1, cameraId: 9)),
      r1Command(8, r1Frame(sceneId: 1, cameraId: 10)),
    ]);
    final views = _views(state);

    final plans = debugPlanThreeFrames(state, frames: views);

    expect(identical(plans[0].opaque, plans[1].opaque), isFalse);
    expect(plans[0].camera!.cameraId, 9);
    expect(plans[1].camera!.cameraId, 10);
  });
}
