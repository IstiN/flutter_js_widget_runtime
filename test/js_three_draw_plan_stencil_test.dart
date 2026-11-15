import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_draw_plan_bytes.dart';

void main() {
  group('R1 v8 stencil draw state and clear markers', () {
    Iterable<ThreeStencilClearMarker> markers(ThreeDrawPlan plan) => plan
        .mainStream
        .whereType<ThreeDrawStreamStencilClear>()
        .map((entry) => entry.clear);

    /// v8 fixture: the extended node layout (v5+ sprite center) is chosen
    /// at encode time, so the root group must be added after r1Version.
    /// v8 fixture: the extended node layout (v5+ sprite center) is chosen
    /// at encode time, so the root group must be added after r1Version.
    /// The FRAME command is appended by each test AFTER its markers — the
    /// encoder emits markers ahead of FRAME in the same envelope.
    ThreeDrawPlanFixture v8Fixture() {
      final fixture = ThreeDrawPlanFixture.withCommands(<Uint8List>[])
        ..r1Version = 8;
      fixture
        ..node(1, objectKind: JsThreeObjectKind.group)
        ..camera(1);
      return fixture;
    }

    void v8Frame(
      ThreeDrawPlanFixture fixture, {
      List<int> culledNodeIds = const [],
    }) {
      fixture.commands.add(
        r1Command(
          8,
          r1Frame(
            sceneId: 1,
            cameraId: 1,
            culledNodeIds: culledNodeIds,
            v5Tail: true,
          ),
        ),
      );
    }

    test('stenciless v8 scenes produce a marker-free draw stream', () {
      final fixture = v8Fixture();
      fixture
        ..geometry(1)
        ..material(2)
        ..node(10, parentId: 1, materialId: 2)
        ..node(11, parentId: 1, materialId: 2, z: -2);
      v8Frame(fixture);

      final plan = const ThreeDrawPlanner().plan(fixture.state());

      // Byte-identical contract: no stencil state, no markers, pre-v8 order.
      expect(plan.stream, everyElement(isA<ThreeDrawStreamDraw>()));
      expect(
        plan.stream.whereType<ThreeDrawStreamDraw>().map(
          (entry) => entry.draw.node.nodeId,
        ),
        [10, 11],
      );
      expect(
        plan.mainStream.whereType<ThreeDrawStreamDraw>().every(
          (entry) => entry.draw.stencil == null,
        ),
        isTrue,
      );
      expect(plan.diagnostics.warnings, isEmpty);
    });

    test('stencil and colorWrite state ride on the draw entries', () {
      final fixture = v8Fixture();
      fixture
        ..geometry(1)
        ..material(
          2,
          stencil: true,
          stencilFunc: JsThreeStencilFunc.notEqual,
          stencilRef: 3,
          stencilFuncMask: 15,
          stencilWriteMask: 240,
          stencilFailOp: JsThreeStencilOp.zero,
          stencilZFailOp: JsThreeStencilOp.replace,
          stencilZPassOp: JsThreeStencilOp.incrementWrap,
        )
        ..material(3, colorWriteOff: true)
        ..node(10, parentId: 1, materialId: 2)
        ..node(11, parentId: 1, materialId: 3);
      v8Frame(fixture);

      final plan = const ThreeDrawPlanner().plan(fixture.state());
      final stenciled = plan.draws
          .firstWhere((draw) => draw.node.nodeId == 10)
          .stencil!;
      expect(stenciled.writeEnabled, isTrue);
      expect(stenciled.compareFunction, JsThreeStencilFunc.notEqual);
      expect(stenciled.reference, 3);
      expect(stenciled.readMask, 15);
      expect(stenciled.writeMask, 240);
      expect(stenciled.failOperation, JsThreeStencilOp.zero);
      expect(stenciled.zFailOperation, JsThreeStencilOp.replace);
      expect(stenciled.zPassOperation, JsThreeStencilOp.incrementWrap);
      expect(stenciled.colorWrite, isTrue);

      final writeOff = plan.draws
          .firstWhere((draw) => draw.node.nodeId == 11)
          .stencil!;
      expect(writeOff.writeEnabled, isFalse);
      expect(writeOff.colorWrite, isFalse);

      expect(plan.diagnostics.warnings, isEmpty);
    });

    test('markers weave after the last draw of their node in stream order', () {
      final fixture = v8Fixture();
      fixture
        ..geometry(1)
        ..material(2)
        ..material(3)
        ..node(10, parentId: 1, materialId: 2, renderOrder: 1)
        ..node(11, parentId: 1, materialId: 3, renderOrder: 2)
        ..stencilClear(0, 1)
        ..stencilClear(11, 7)
        ..stencilClear(10, 2);
      v8Frame(fixture);

      final plan = const ThreeDrawPlanner().plan(fixture.state());

      expect(plan.draws.map((draw) => draw.node.nodeId), [10, 11]);
      expect(markers(plan).map((clear) => (clear.nodeId, clear.value)), [
        (0, 1),
        (10, 2),
        (11, 7),
      ]);
      expect(
        plan.mainStream.map(
          (entry) => entry is ThreeDrawStreamDraw
              ? 'd${entry.draw.node.nodeId}'
              : 'c${(entry as ThreeDrawStreamStencilClear).clear.value}',
        ),
        ['c1', 'd10', 'c2', 'd11', 'c7'],
      );
    });

    test('markers for absent owners anchor by renderOrder', () {
      final fixture = v8Fixture();
      fixture
        ..geometry(1)
        ..material(2)
        ..material(3)
        ..node(10, parentId: 1, materialId: 2, renderOrder: 1)
        ..node(11, parentId: 1, materialId: 3, renderOrder: 2)
        ..node(12, parentId: 1, materialId: 2, renderOrder: 5);
      fixture.stencilClear(12, 4);
      v8Frame(fixture, culledNodeIds: const [12]);

      final plan = const ThreeDrawPlanner().plan(fixture.state());

      // Node 12 is culled; its marker lands after draws sorting below
      // renderOrder 5, i.e. after both surviving draws.
      expect(plan.draws.map((draw) => draw.node.nodeId), [10, 11, 12]);
      expect(plan.draws.last.culledFromMain, isTrue);
      expect(plan.mainDraws.map((draw) => draw.node.nodeId), [10, 11]);
      expect(markers(plan).single.value, 4);
      expect(
        plan.mainStream.whereType<ThreeDrawStreamDraw>().map(
          (entry) => entry.draw.node.nodeId,
        ),
        [10, 11],
      );
      expect(
        plan.mainStream.last,
        isA<ThreeDrawStreamStencilClear>()
            .having((e) => e.clear.nodeId, 'nodeId', 12)
            .having((e) => e.clear.value, 'value', 4),
      );
    });

    test('markers survive main culling even when their node is gone', () {
      final fixture = v8Fixture();
      fixture
        ..geometry(1)
        ..material(2)
        ..node(10, parentId: 1, materialId: 2)
        ..stencilClear(10, 9);
      v8Frame(fixture, culledNodeIds: const [10]);

      final plan = const ThreeDrawPlanner().plan(fixture.state());

      expect(plan.mainDraws, isEmpty);
      // Culled owner with renderOrder 0: nothing sorts below it, so the
      // marker anchors at the stream start and is still applied.
      expect(plan.mainStream.single, isA<ThreeDrawStreamStencilClear>());
      expect(markers(plan).single.value, 9);
    });
  });
}
