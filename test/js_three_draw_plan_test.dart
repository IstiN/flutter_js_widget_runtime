import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_backend.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_draw_plan_bytes.dart';

void main() {
  group('ThreeDrawPlanner', () {
    test('sorts opaque by material and transparent far to near', () {
      final fixture = ThreeDrawPlanFixture.basic()
        ..material(2, transparent: true)
        ..material(3)
        ..geometry(1)
        ..node(10, parentId: 1, materialId: 2, z: -1)
        ..node(11, parentId: 1, materialId: 2, z: -8)
        ..node(12, parentId: 1, materialId: 3, z: -3)
        ..node(13, parentId: 1, materialId: 1, z: -2);

      final plan = const ThreeDrawPlanner().plan(fixture.state());

      expect(plan.canRender, isTrue);
      expect(plan.opaque.map((draw) => draw.node.nodeId), [13, 12]);
      expect(plan.transparent.map((draw) => draw.node.nodeId), [11, 10]);
      expect(plan.draws.map((draw) => draw.node.nodeId), [13, 12, 11, 10]);
      expect(plan.transparent.map((draw) => draw.viewDepth), [-8.0, -1.0]);
      expect(plan.diagnostics.warnings, isEmpty);
    });

    test('main culling preserves the full shadow draw set', () {
      final fixture = ThreeDrawPlanFixture.basic()
        ..geometry(1)
        ..node(2, parentId: 1);
      fixture.commands.add(
        r1Command(
          8,
          r1Frame(sceneId: 1, cameraId: 1, culledNodeIds: const [2]),
        ),
      );

      final plan = const ThreeDrawPlanner().plan(fixture.state());

      expect(plan.draws.single.culledFromMain, isTrue);
      expect(plan.mainDraws, isEmpty);
      expect(plan.mainDrawCallCount, 0);
      expect(plan.mainTriangleCount, 0);
      expect(plan.drawCallCount, 1);
      expect(plan.triangleCount, 1);
    });

    test(
      'visibility prunes descendants and missing resources are diagnosed',
      () {
        final fixture = ThreeDrawPlanFixture.basic()
          ..geometry(1)
          ..node(20, parentId: 1, visible: false)
          ..node(21, parentId: 20)
          ..node(22, parentId: 1, materialId: 999);

        final plan = const ThreeDrawPlanner().plan(fixture.state());

        expect(plan.draws, isEmpty);
        expect(plan.diagnostics.invisibleSubtreeCount, 1);
        expect(plan.diagnostics.missingResourceCount, 1);
        expect(plan.diagnostics.warnings.join('\n'), contains('material'));
      },
    );

    test('validates object primitive and material combinations', () {
      final fixture = ThreeDrawPlanFixture.basic()
        ..geometry(1, primitive: JsThreePrimitive.points, positions: [0, 0, 0])
        ..material(2, kind: JsThreeMaterialKind.pointsBasic)
        ..node(
          5,
          parentId: 1,
          materialId: 2,
          objectKind: JsThreeObjectKind.points,
        )
        ..node(6, parentId: 1, objectKind: JsThreeObjectKind.line);

      final plan = const ThreeDrawPlanner().plan(fixture.state());

      expect(plan.draws.map((draw) => draw.node.nodeId), [5]);
      expect(plan.draws.single.primitive, ThreeDrawPrimitive.points);
      expect(plan.diagnostics.incompatibleMaterialCount, 1);
    });

    test('plans real Phong and selects wire indices for mesh wireframe', () {
      final fixture = ThreeDrawPlanFixture.basic()
        ..geometry(1, wireIndices: const [0, 1, 1, 2, 2, 0])
        ..material(2, kind: JsThreeMaterialKind.meshPhong)
        ..material(3, wireframe: true)
        ..node(2, parentId: 1, materialId: 2)
        ..node(3, parentId: 1, materialId: 3, castShadow: true);

      final plan = const ThreeDrawPlanner().plan(fixture.state());

      expect(plan.diagnostics.warnings, isEmpty);
      expect(plan.draws, hasLength(2));
      final phong = plan.draws.firstWhere((draw) => draw.node.nodeId == 2);
      expect(phong.material.kind, JsThreeMaterialKind.meshPhong);
      expect(phong.primitive, ThreeDrawPrimitive.triangles);
      expect(phong.drawCount, 3);
      final wire = plan.draws.firstWhere((draw) => draw.node.nodeId == 3);
      expect(wire.primitive, ThreeDrawPrimitive.lines);
      expect(wire.wireframe, isTrue);
      expect(wire.indexed, isTrue);
      expect(wire.drawCount, 6);
      expect(plan.triangleCount, 1);

      final missing = ThreeDrawPlanFixture.basic()
        ..geometry(1)
        ..material(2, wireframe: true)
        ..node(2, parentId: 1, materialId: 2);
      final invalid = const ThreeDrawPlanner().plan(missing.state());
      expect(invalid.draws, isEmpty);
      expect(invalid.diagnostics.invalidGeometryCount, 1);
      expect(invalid.diagnostics.warnings.join('\n'), contains('wireframe'));
    });

    test('plans Normal independently and forwards side and emissive state', () {
      final fixture = ThreeDrawPlanFixture.basic()
        ..geometry(1)
        ..material(
          2,
          kind: JsThreeMaterialKind.meshNormal,
          transparent: true,
          vertexColors: true,
          flatShading: true,
          side: JsThreeSide.double,
        )
        ..material(
          3,
          version: 2,
          kind: JsThreeMaterialKind.meshStandard,
          emissive: true,
        )
        ..node(2, parentId: 1, materialId: 2)
        ..node(3, parentId: 1, materialId: 3);

      final plan = const ThreeDrawPlanner().plan(fixture.state());

      expect(plan.diagnostics.warnings, isEmpty);
      expect(plan.diagnostics.incompatibleMaterialCount, 0);
      expect(plan.draws, hasLength(2));
      final normal = plan.draws.singleWhere((draw) => draw.node.nodeId == 2);
      expect(normal.material.kind, JsThreeMaterialKind.meshNormal);
      expect(normal.material.vertexColors, isTrue);
      expect(normal.material.flatShading, isTrue);
      expect(normal.primitive, ThreeDrawPrimitive.triangles);
      final normalVertex = debugThreeVertexUniform(normal, plan, 1);
      expect(normalVertex.getFloat32(200, Endian.little), 2);
      expect(normalVertex.getFloat32(204, Endian.little), 1);
      final emissive = plan.draws.singleWhere((draw) => draw.node.nodeId == 3);
      expect(emissive.material.version, 2);
      expect(emissive.material.emissiveR, 0.125);
      expect(emissive.material.emissiveG, 0.25);
      expect(emissive.material.emissiveB, 0.5);
      expect(emissive.material.emissiveIntensity, 3);
    });

    test('supports independent lines and explicitly selected line strips', () {
      final fixture = ThreeDrawPlanFixture.basic()
        ..geometry(
          1,
          primitive: JsThreePrimitive.lines,
          positions: [0, 0, 0, 1, 0, 0],
        )
        ..material(1, kind: JsThreeMaterialKind.lineBasic, version: 2)
        ..node(2, parentId: 1, objectKind: JsThreeObjectKind.line);
      final state = fixture.state();

      final segments = const ThreeDrawPlanner().plan(state);
      final strip = const ThreeDrawPlanner().plan(
        state,
        lineMode: ThreeLineMode.lineStrip,
      );

      expect(segments.draws.single.primitive, ThreeDrawPrimitive.lines);
      expect(strip.draws.single.primitive, ThreeDrawPrimitive.lineStrip);
      expect(strip.draws.single.drawCount, 2);
    });

    test('expands indexed multi-material batches deterministically', () {
      final fixture = ThreeDrawPlanFixture.basic()
        ..geometry(1, indices: const [0, 1, 2, 2, 1, 0, 0, 2, 1])
        ..material(2)
        ..material(3)
        ..batch(5, parts: const [(1, 3, 3, 3), (1, 2, 6, 3), (1, 2, 0, 3)]);

      final plan = const ThreeDrawPlanner().plan(fixture.state());

      expect(plan.canRender, isTrue);
      expect(plan.drawCallCount, 3);
      expect(plan.triangleCount, 3);
      expect(plan.draws, hasLength(3));
      expect(plan.draws.map((draw) => draw.material.materialId), [2, 2, 3]);
      expect(plan.draws.map((draw) => draw.batchPartIndex), [1, 2, 0]);
      expect(plan.draws.map((draw) => draw.indexOffset), [6, 0, 3]);
      expect(plan.draws.every((draw) => draw.drawCount == 3), isTrue);
      expect(plan.draws.every((draw) => draw.instanceCount == 1), isTrue);
      expect(plan.draws.every((draw) => !draw.instanced), isTrue);
      final batch = plan.draws.first.batch;
      expect(batch, isNotNull);
      expect(plan.draws.every((draw) => identical(draw.batch, batch)), isTrue);
      expect(plan.diagnostics.warnings, isEmpty);
    });

    test('plans real instance matrices and skips zero-instance batches', () {
      final fixture = ThreeDrawPlanFixture.basic()
        ..geometry(1)
        ..batch(5, instanced: true, instanceCount: 2);
      final state = fixture.state();

      final plan = const ThreeDrawPlanner().plan(state);

      expect(plan.drawCallCount, 1);
      expect(plan.triangleCount, 2);
      final draw = plan.draws.single;
      expect(draw.node.nodeId, 5);
      expect(draw.instanceCount, 2);
      expect(draw.instanced, isTrue);
      expect(draw.drawCount, 3);
      expect(draw.indexOffset, 0);
      expect(draw.batch!.instanceMatrices, hasLength(32));
      expect(draw.batch!.instanceMatrices[0], 1);
      expect(draw.batch!.instanceMatrices[16], 1);

      final empty = ThreeDrawPlanFixture.basic()
        ..batch(
          6,
          instanced: true,
          instanceCount: 0,
          parts: const [(999, 999, 0, 3)],
        );
      final emptyPlan = const ThreeDrawPlanner().plan(empty.state());
      expect(emptyPlan.drawCallCount, 0);
      expect(emptyPlan.triangleCount, 0);
      expect(emptyPlan.draws, isEmpty);
      expect(emptyPlan.diagnostics.warnings, isEmpty);
    });

    // Per-instance colors ride the DRAW_BATCH color flag (wire bit 1): the
    // planner must surface hasInstanceColors and the decoded payload on
    // every part draw of the batch, and stay neutral (material color) when
    // the flag is absent — the two states the GPU golden family pins.
    test('carries instance colors through every batch part draw', () {
      final colored = ThreeDrawPlanFixture.basic()
        ..geometry(
          1,
          positions: List<double>.generate(18, (index) => index.toDouble()),
        )
        ..material(2)
        ..batch(
          5,
          instanced: true,
          instanceCount: 2,
          parts: const [(1, 2, 0, 3), (1, 2, 3, 3)],
          colors: const [1, 0, 0, 0, 0, 1],
        );
      final plan = const ThreeDrawPlanner().plan(colored.state());
      expect(plan.draws, hasLength(2));
      for (final draw in plan.draws) {
        expect(draw.batch!.hasInstanceColors, isTrue);
        expect(draw.batch!.instanceColors, const [1, 0, 0, 0, 0, 1]);
      }

      final plain = ThreeDrawPlanFixture.basic()
        ..geometry(1)
        ..material(2)
        ..batch(6, instanced: true, instanceCount: 2);
      final plainPlan = const ThreeDrawPlanner().plan(plain.state());
      final plainBatch = plainPlan.draws.single.batch!;
      expect(plainBatch.hasInstanceColors, isFalse);
      expect(plainBatch.instanceColors, isEmpty);
    });

    test('rejects malformed batch shapes with scoped diagnostics', () {
      // Bare-mesh node carrying direct resources: rejected by the batch
      // shape validation (invalidBatchCount warning, no draws).
      final resourced = ThreeDrawPlanFixture.basic()
        ..geometry(1)
        ..batch(5, geometryId: 9);
      final resourcedPlan = const ThreeDrawPlanner().plan(resourced.state());
      expect(resourcedPlan.draws, isEmpty);
      expect(resourcedPlan.diagnostics.warnings, isNotEmpty);
      expect(resourcedPlan.diagnostics.warnings.first, contains('5'));
    });

    test('auto-instances the 200-mesh Orthographic shape into one draw', () {
      final fixture = ThreeDrawPlanFixture.basic()..geometry(1);
      for (var index = 0; index < 200; index++) {
        final id = index + 2;
        fixture
          ..material(
            id,
            kind: JsThreeMaterialKind.meshPhong,
            color: [index / 199, 0.25, 1 - index / 199],
            opacity: index.isEven ? 0.5 : 0.75,
          )
          ..node(
            id,
            parentId: 1,
            materialId: id,
            z: -index.toDouble(),
            castShadow: true,
            receiveShadow: true,
          );
      }
      final state = fixture.state();

      final ordinary = const ThreeDrawPlanner().plan(state);
      final plan = const ThreeDrawPlanner(autoInstance: true).plan(state);

      expect(ordinary.drawCallCount, 200);
      expect(ordinary.mainDrawCallCount, 200);
      expect(plan.drawCallCount, 1);
      expect(plan.mainDrawCallCount, 1);
      expect(plan.triangleCount, 200);
      expect(plan.mainTriangleCount, 200);
      final draw = plan.opaque.single;
      expect(draw.autoInstanced, isTrue);
      expect(draw.instanced, isTrue);
      expect(draw.batch, isNull);
      expect(draw.instanceCount, 200);
      expect(draw.autoInstanceDraws, hasLength(200));
      expect(
        draw.autoInstanceDraws.map((item) => item.node.nodeId),
        List<int>.generate(200, (index) => index + 2),
      );
      expect(
        draw.autoInstanceDraws.every(
          (item) => identical(item.geometry, draw.geometry),
        ),
        isTrue,
      );
      for (final shadowPass in [false, true]) {
        final vertex = debugThreeVertexUniform(
          draw,
          plan,
          1,
          shadowPass: shadowPass,
        );
        for (var index = 0; index < 16; index++) {
          expect(
            vertex.getFloat32(index * 4, Endian.little),
            index % 5 == 0 ? 1 : 0,
          );
        }
      }
    });

    test('auto-instance eligibility excludes incompatible render state', () {
      ThreeDrawPlan planPair({
        bool secondTransparent = false,
        bool secondEmissive = false,
        JsThreeSide secondSide = JsThreeSide.front,
        bool secondDepthWrite = true,
        bool secondReceiveShadow = false,
        bool secondCastShadow = false,
        int secondGeometryId = 1,
        bool secondWireframe = false,
        bool explicitInstances = false,
        List<int> culledNodeIds = const [],
        List<int> culledShadowNodeIds = const [],
      }) {
        final fixture = ThreeDrawPlanFixture.basic()
          ..geometry(
            1,
            wireIndices: secondWireframe ? const [0, 1, 1, 2, 2, 0] : null,
          )
          ..material(2, kind: JsThreeMaterialKind.meshPhong)
          ..material(
            3,
            kind: JsThreeMaterialKind.meshPhong,
            color: const [0.25, 0.5, 0.75],
            transparent: secondTransparent,
            emissive: secondEmissive,
            side: secondSide,
            depthWrite: secondDepthWrite,
            wireframe: secondWireframe,
          );
        if (secondGeometryId == 2) fixture.geometry(2);
        if (explicitInstances) {
          fixture
            ..batch(
              2,
              instanced: true,
              instanceCount: 2,
              parts: const [(1, 2, 0, 3)],
            )
            ..batch(
              3,
              instanced: true,
              instanceCount: 2,
              parts: const [(1, 3, 0, 3)],
            );
        } else {
          fixture
            ..node(2, parentId: 1, materialId: 2)
            ..node(
              3,
              parentId: 1,
              geometryId: secondGeometryId,
              materialId: 3,
              receiveShadow: secondReceiveShadow,
              castShadow: secondCastShadow,
            );
        }
        fixture.commands[2] = r1Command(
          8,
          r1Frame(
            sceneId: 1,
            cameraId: 1,
            culledNodeIds: culledNodeIds,
            culledShadowNodeIds: culledShadowNodeIds,
          ),
        );
        return const ThreeDrawPlanner(autoInstance: true).plan(fixture.state());
      }

      final cases = <String, ThreeDrawPlan Function()>{
        'transparent': () => planPair(secondTransparent: true),
        'emissive': () => planPair(secondEmissive: true),
        'side': () => planPair(secondSide: JsThreeSide.double),
        'depth write': () => planPair(secondDepthWrite: false),
        'receiveShadow': () => planPair(secondReceiveShadow: true),
        'castShadow': () => planPair(secondCastShadow: true),
        'geometry': () => planPair(secondGeometryId: 2),
        'wireframe': () => planPair(secondWireframe: true),
        'main-camera culling': () => planPair(culledNodeIds: const [3]),
        'shadow culling': () => planPair(culledShadowNodeIds: const [3]),
        'explicit instances': () => planPair(explicitInstances: true),
      };
      for (final entry in cases.entries) {
        final plan = entry.value();
        expect(plan.draws, hasLength(2), reason: entry.key);
        expect(
          plan.draws.every((draw) => !draw.autoInstanced),
          isTrue,
          reason: entry.key,
        );
      }

      final points = ThreeDrawPlanFixture.basic()
        ..geometry(
          1,
          primitive: JsThreePrimitive.points,
          positions: const [0, 0, 0],
        )
        ..material(2, kind: JsThreeMaterialKind.pointsBasic)
        ..material(3, kind: JsThreeMaterialKind.pointsBasic)
        ..node(
          2,
          parentId: 1,
          materialId: 2,
          objectKind: JsThreeObjectKind.points,
        )
        ..node(
          3,
          parentId: 1,
          materialId: 3,
          objectKind: JsThreeObjectKind.points,
        );
      final pointPlan = const ThreeDrawPlanner(
        autoInstance: true,
      ).plan(points.state());
      expect(pointPlan.draws, hasLength(2));
      expect(pointPlan.draws.every((draw) => !draw.autoInstanced), isTrue);
    });

    test('rejects invalid batch ranges and incompatible parts', () {
      final invalidRanges = ThreeDrawPlanFixture.basic()
        ..geometry(1, indices: const [0, 1, 2, 2, 1, 0, 0, 2, 1])
        ..material(2, kind: JsThreeMaterialKind.lineBasic)
        ..batch(
          5,
          parts: const [
            (1, 1, 8, 3),
            (1, 1, 1, 3),
            (1, 1, 0, 2),
            (1, 99, 0, 3),
            (1, 2, 0, 3),
          ],
        );
      final invalidPlan = const ThreeDrawPlanner().plan(invalidRanges.state());
      expect(invalidPlan.draws, isEmpty);
      expect(invalidPlan.diagnostics.invalidBatchCount, 3);
      expect(invalidPlan.diagnostics.missingResourceCount, 1);
      expect(invalidPlan.diagnostics.incompatibleMaterialCount, 1);

      final nonIndexed = ThreeDrawPlanFixture.basic()
        ..geometry(
          1,
          positions: List<double>.generate(18, (index) => index.toDouble()),
        )
        ..batch(5, parts: const [(1, 1, 0, 3), (1, 1, 3, 3)]);
      final nonIndexedPlan = const ThreeDrawPlanner().plan(nonIndexed.state());
      expect(nonIndexedPlan.draws, hasLength(2));
      expect(nonIndexedPlan.draws.map((draw) => draw.indexOffset), [0, 3]);
      expect(nonIndexedPlan.draws.every((draw) => draw.drawCount == 3), isTrue);
      expect(nonIndexedPlan.diagnostics.invalidBatchCount, 0);
    });

    // Honest merge verdict for per-instance colors: AUTO-instanced runs
    // merge across differing material colors because _threeAutoInstanceData
    // bakes each source material's color+opacity into its per-instance
    // attribute (the fragment shader multiplies material_info.colorOpacity,
    // which is forced white for auto runs) — so the merged draw renders the
    // same pixels as separate draws. Explicit InstancedMesh batches carry
    // their own instanceColor buffers and are never merged with anything
    // (pinned by the 'explicit instances' eligibility case above).
    test('auto-instancing merges differing material colors in one draw', () {
      final fixture = ThreeDrawPlanFixture.basic()
        ..geometry(1)
        ..material(2, kind: JsThreeMaterialKind.meshPhong)
        ..material(
          3,
          kind: JsThreeMaterialKind.meshPhong,
          color: const [0.25, 0.5, 0.75],
          opacity: 0.5,
        )
        ..node(2, parentId: 1, materialId: 2)
        ..node(3, parentId: 1, materialId: 3);

      final plan = const ThreeDrawPlanner(
        autoInstance: true,
      ).plan(fixture.state());

      expect(plan.draws, hasLength(1));
      final draw = plan.draws.single;
      expect(draw.autoInstanced, isTrue);
      expect(draw.instanceCount, 2);
      // The baked per-instance colors must keep each source material's
      // exact color+opacity (debugThreeAutoInstanceData pins the bytes).
      final packed = debugThreeAutoInstanceData(draw);
      final white = <double>[1, 1, 1, 1];
      final colored = const [0.25, 0.5, 0.75, 0.5];
      for (var component = 0; component < 4; component++) {
        expect(
          packed.getFloat32(64 + component * 4, Endian.little),
          white[component],
        );
        expect(
          packed.getFloat32(80 + 64 + component * 4, Endian.little),
          closeTo(colored[component], 1e-6),
        );
      }
    });

    // Transparent instancing is a deliberate bounded pass since the wave-3
    // instancing batch: each transparent InstancedMesh part blends in ONE
    // draw (GPU instancing) and sorts among the transparent bucket by the
    // batch node's view depth — the same material-level back-to-front order
    // non-instanced transparent draws use. Per-instance sorting inside one
    // instanced draw is out of scope; splitting instances across meshes is
    // the documented workaround, like the dual-paraboloid point shadows.
    test('transparent instanced batches blend in the transparent bucket', () {
      final fixture = ThreeDrawPlanFixture.basic()
        ..geometry(1)
        ..material(2)
        ..material(3, transparent: true)
        ..material(4, transparent: true)
        ..batch(
          5,
          instanced: true,
          instanceCount: 2,
          parts: const [(1, 2, 0, 3)],
        )
        ..batch(
          6,
          instanced: true,
          instanceCount: 3,
          z: -0.25,
          parts: const [(1, 3, 0, 3)],
        )
        ..batch(
          7,
          instanced: true,
          instanceCount: 4,
          z: -2,
          parts: const [(1, 4, 0, 3)],
        )
        ..node(8, parentId: 1, materialId: 3, z: -0.5);
      final plan = const ThreeDrawPlanner().plan(fixture.state());
      expect(plan.diagnostics.invalidBatchCount, 0);
      expect(plan.diagnostics.warnings.join('\n'), '');
      // Far-to-near back-to-front order across instanced and ordinary
      // transparent draws alike: node 7 (z -2), node 8 (z -0.5), node 6.
      expect(plan.transparent.map((draw) => draw.node.nodeId), [7, 8, 6]);
      final instancedParts = plan.transparent
          .where((draw) => draw.instanced)
          .toList();
      expect(instancedParts.map((draw) => draw.instanceCount), [4, 3]);
      expect(instancedParts.every((draw) => draw.batch != null), isTrue);
      // The opaque instanced batch stays an ordinary opaque submission.
      expect(plan.opaque, hasLength(1));
      expect(plan.opaque.single.instanced, isTrue);
      expect(plan.opaque.single.instanceCount, 2);
    });

    test('caps each light family independently and deterministically', () {
      final fixture = ThreeDrawPlanFixture.basic();
      for (var id = 1; id <= 6; id++) {
        fixture.light(
          id,
          JsThreeLightType.directional,
          intensity: id.toDouble(),
        );
      }
      for (var id = 7; id <= 17; id++) {
        fixture.light(id, JsThreeLightType.point);
      }
      fixture.light(18, JsThreeLightType.ambient, intensity: 0.25);
      fixture.light(19, JsThreeLightType.ambient, intensity: 0.5);
      for (var id = 20; id <= 25; id++) {
        fixture.light(id, JsThreeLightType.hemisphere);
      }

      final plan = const ThreeDrawPlanner().plan(fixture.state());

      expect(plan.directionalLights.map((light) => light.lightId), [
        1,
        2,
        3,
        4,
      ]);
      expect(plan.pointLights.map((light) => light.lightId), [
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
      ]);
      expect(plan.hemisphereLights.map((light) => light.lightId), [
        20,
        21,
        22,
        23,
      ]);
      expect(plan.diagnostics.droppedDirectionalLightCount, 2);
      expect(plan.diagnostics.droppedPointLightCount, 3);
      expect(plan.diagnostics.droppedHemisphereLightCount, 2);
      expect(plan.ambient.r, closeTo(0.75, 1e-6));
      expect(plan.diagnostics.warnings, hasLength(3));
    });

    test(
      'keeps HemisphereLight distinct and packs exact GPU light uniforms',
      () {
        final fixture = ThreeDrawPlanFixture.basic()
          ..light(
            1,
            JsThreeLightType.ambient,
            intensity: 0.5,
            red: 0.25,
            green: 0.5,
            blue: 0.75,
          )
          ..light(
            2,
            JsThreeLightType.hemisphere,
            intensity: 2,
            red: 0.125,
            green: 0.25,
            blue: 0.5,
            groundRed: 0.75,
            groundGreen: 0.5,
            groundBlue: 0.25,
            direction: const [0.6, 0.8, 0],
          );

        final plan = const ThreeDrawPlanner().plan(fixture.state());
        expect(plan.hemisphereLights, hasLength(1));
        expect(plan.directionalLights, isEmpty);
        expect(plan.pointLights, isEmpty);
        expect(plan.ambient.r, 0.125);
        expect(plan.ambient.g, 0.25);
        expect(plan.ambient.b, 0.375);
        expect(plan.hemisphereLights.single.type, JsThreeLightType.hemisphere);
        expect(plan.hemisphereLights.single.groundColorR, 0.75);

        final frame = debugThreeFrameUniform(plan);
        expect(frame.lengthInBytes, 144);
        expect(frame.getFloat32(32, Endian.little), 0);
        expect(frame.getFloat32(36, Endian.little), 0);
        expect(frame.getFloat32(40, Endian.little), 1);
        final lights = debugThreeLightsUniform(plan);
        expect(lights.lengthInBytes, 832);
        for (final expected in <int, double>{
          384: 0.6,
          388: 0.8,
          392: 0,
          396: 2,
          448: 0.125,
          452: 0.25,
          456: 0.5,
          460: 1,
          512: 0.75,
          516: 0.5,
          520: 0.25,
          524: 1,
        }.entries) {
          expect(
            lights.getFloat32(expected.key, Endian.little),
            closeTo(expected.value, 1e-6),
          );
        }
      },
    );

    test(
      'uses selected pending frame camera and exposes camera/background',
      () {
        final fixture = ThreeDrawPlanFixture.basic()
          ..camera(2)
          ..node(2, parentId: 1)
          ..geometry(1);
        fixture.commands.add(
          r1Command(8, r1Frame(sceneId: 1, cameraId: 2, exposure: 2)),
        );
        final state = fixture.state();

        // A frame value can be supplied by the host after takePendingFrame().
        final plan = const ThreeDrawPlanner().plan(
          state,
          frame: state.pendingFrames.last,
        );
        expect(plan.camera?.cameraId, 2);
        expect(plan.frame?.exposure, closeTo(2, 1e-6));
        expect(plan.cameraPosition, (x: 0.0, y: 0.0, z: 0.0));
        expect(plan.background.a, closeTo(1, 1e-6));
        expect(state.currentFrame, isNotNull);
      },
    );

    test('missing frame and camera produce a non-renderable plan', () {
      final noFrame = ThreeDrawPlanFixture.withCommands([
        r1Command(6, r1Camera(1)),
      ]).state();
      expect(const ThreeDrawPlanner().plan(noFrame).canRender, isFalse);

      final noCamera = ThreeDrawPlanFixture.withCommands([
        r1Command(4, r1Node(1, objectKind: JsThreeObjectKind.group)),
        r1Command(8, r1Frame(sceneId: 1, cameraId: 9)),
      ]).state();
      final plan = const ThreeDrawPlanner().plan(noCamera);
      expect(plan.canRender, isFalse);
      expect(plan.diagnostics.missingResourceCount, 1);
    });

    test('uses node id to break material and view-depth ties', () {
      final fixture = ThreeDrawPlanFixture.basic()
        ..material(2, transparent: true)
        ..material(3)
        ..geometry(1)
        ..node(9, parentId: 1, materialId: 3, z: -4)
        ..node(8, parentId: 1, materialId: 3, z: -4)
        ..node(7, parentId: 1, materialId: 2, z: -4)
        ..node(6, parentId: 1, materialId: 2, z: -4);

      final plan = const ThreeDrawPlanner().plan(fixture.state());

      expect(plan.opaque.map((draw) => draw.node.nodeId), [8, 9]);
      expect(plan.transparent.map((draw) => draw.node.nodeId), [6, 7]);
      expect(plan.draws.every((draw) => !draw.indexed), isTrue);
      expect(plan.opaque.every((draw) => !draw.transparent), isTrue);
      expect(plan.transparent.every((draw) => draw.transparent), isTrue);
    });

    test('diagnoses hierarchy cycles without looping or drawing', () {
      final state = ThreeDrawPlanFixture.withCommands([
        r1Command(
          4,
          r1Node(1, parentId: 2, objectKind: JsThreeObjectKind.group),
        ),
        r1Command(
          4,
          r1Node(2, parentId: 1, objectKind: JsThreeObjectKind.group),
        ),
        r1Command(6, r1Camera(1)),
        r1Command(8, r1Frame(sceneId: 1, cameraId: 1)),
      ]).state();

      final plan = const ThreeDrawPlanner().plan(state);

      expect(plan.draws, isEmpty);
      expect(plan.diagnostics.hierarchyCycleCount, 1);
      expect(plan.diagnostics.warnings.join('\n'), contains('cycle'));
    });

    test('diagnoses invalid groups and zero or missing draw resources', () {
      final fixture = ThreeDrawPlanFixture.basic()
        ..geometry(1)
        ..node(2, parentId: 1, geometryId: 0)
        ..node(3, parentId: 1, materialId: 0)
        ..node(4, parentId: 1, geometryId: 999);
      fixture.commands.add(
        r1Command(
          4,
          r1Node(
            5,
            parentId: 1,
            geometryId: 1,
            materialId: 1,
            objectKind: JsThreeObjectKind.group,
          ),
        ),
      );

      final plan = const ThreeDrawPlanner().plan(fixture.state());

      expect(plan.draws, isEmpty);
      expect(plan.diagnostics.invalidNodeCount, 1);
      expect(plan.diagnostics.missingResourceCount, 3);
      final warnings = plan.diagnostics.warnings.join('\n');
      expect(warnings, contains('group 5'));
      expect(warnings, contains('zero geometry/material'));
      expect(warnings, contains('misses geometry'));
    });

    test('warns once for a missing material map and keeps valid draws', () {
      final fixture = ThreeDrawPlanFixture.basic()
        ..material(1, version: 2, mapTextureId: 99)
        ..geometry(1)
        ..node(2, parentId: 1)
        ..node(3, parentId: 1);

      final plan = const ThreeDrawPlanner().plan(fixture.state());

      expect(plan.draws.map((draw) => draw.node.nodeId), [2, 3]);
      expect(plan.diagnostics.missingResourceCount, 1);
      expect(
        plan.diagnostics.warnings.where((w) => w.contains('white fallback')),
        hasLength(1),
      );
    });

    test('diagnoses disposed surfaces and missing scene roots', () {
      final disposed = ThreeDrawPlanFixture.withCommands([
        r1Command(10, Uint8List(0)),
      ]).state();
      final disposedPlan = const ThreeDrawPlanner().plan(disposed);
      expect(disposedPlan.canRender, isFalse);
      expect(
        disposedPlan.diagnostics.warnings.join('\n'),
        contains('disposed'),
      );

      final missingScene = ThreeDrawPlanFixture.withCommands([
        r1Command(6, r1Camera(1)),
        r1Command(8, r1Frame(sceneId: 99, cameraId: 1)),
      ]).state();
      final plan = const ThreeDrawPlanner().plan(missingScene);
      expect(plan.canRender, isTrue);
      expect(plan.draws, isEmpty);
      expect(plan.diagnostics.missingResourceCount, 1);
      expect(plan.diagnostics.warnings.join('\n'), contains('scene 99'));
    });
  });

  group('interleaveThreeGeometry', () {
    test('packs defaults and copies checked indices', () {
      final fixture = ThreeDrawPlanFixture.basic()
        ..geometry(
          1,
          indices: [2, 1, 0],
          wireIndices: const [0, 1, 1, 2, 2, 0],
        );
      final geometry = fixture.state().geometries[1]!;

      final packed = interleaveThreeGeometry(geometry);

      expect(packed.vertices.lengthInBytes, 3 * 48);
      expect(packed.indices, isNotNull);
      expect(packed.indexCount, 3);
      expect(packed.vertices.getFloat32(0, Endian.little), 0);
      expect(packed.vertices.getFloat32(20, Endian.little), 1);
      expect(packed.vertices.getFloat32(24, Endian.little), 0);
      for (var vertex = 0; vertex < 3; vertex++) {
        final offset = vertex * 48 + 32;
        for (var component = 0; component < 4; component++) {
          expect(
            packed.vertices.getFloat32(offset + component * 4, Endian.little),
            1,
          );
        }
      }
      expect(packed.indices!.getUint32(0, Endian.little), 2);
      expect(packed.indices!.getUint32(8, Endian.little), 0);
      expect(packed.wireIndices!.lengthInBytes, 24);
      expect(packed.wireIndices!.getUint32(0, Endian.little), 0);
      expect(packed.wireIndices!.getUint32(20, Endian.little), 0);
    });

    test('packs normal uv RGB and RGBA without reading outside strides', () {
      final fixture = ThreeDrawPlanFixture.basic()
        ..geometry(
          1,
          positions: [1, 2, 3, 4, 5, 6, 7, 8, 9],
          normals: [0, 1, 0, 0, 1, 0, 0, 1, 0],
          uvs: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
          colors: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        )
        ..geometry(
          2,
          colors: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 0.5, 0.25],
        );
      final state = fixture.state();

      final rgb = interleaveThreeGeometry(state.geometries[1]!);
      expect(rgb.vertices.getFloat32(12, Endian.little), 0);
      expect(rgb.vertices.getFloat32(16, Endian.little), 1);
      expect(rgb.vertices.getFloat32(24, Endian.little), closeTo(0.1, 1e-6));
      expect(rgb.vertices.getFloat32(32, Endian.little), closeTo(0.2, 1e-6));
      expect(rgb.vertices.getFloat32(44, Endian.little), 1);
      expect(
        rgb.vertices.getFloat32(48 + 32, Endian.little),
        closeTo(0.5, 1e-6),
      );

      final rgba = interleaveThreeGeometry(state.geometries[2]!);
      expect(rgba.vertices.getFloat32(44, Endian.little), closeTo(0.4, 1e-6));
      expect(
        rgba.vertices.getFloat32(48 + 44, Endian.little),
        closeTo(0.8, 1e-6),
      );
      expect(rgba.indices, isNull);
    });

    test('GPU shadow uniforms preserve the reflected ABI and node flags', () {
      final fixture = ThreeDrawPlanFixture.basic();
      fixture.commands[2] = r1Command(
        8,
        r1Frame(sceneId: 1, cameraId: 1, shadowMapSize: 2048),
      );
      fixture
        ..geometry(1)
        ..node(2, parentId: 1, castShadow: true, receiveShadow: true);
      final plan = const ThreeDrawPlanner().plan(fixture.state());
      final draw = plan.opaque.single;

      final vertex = debugThreeVertexUniform(draw, plan, 2);
      // ABI: 19 used vec4s (304 bytes) padded to the 320-byte VertexInfo
      // the ThreeR1Vertex spirv reflects (R1 v5 spriteParams tail at 288;
      // the shadow-pass ABI check rejects anything larger).
      expect(vertex.lengthInBytes, 320);
      expect(vertex.getFloat32(196, Endian.little), 0);
      expect(vertex.getFloat32(208, Endian.little), 1);
      expect(vertex.getFloat32(272, Endian.little), closeTo(0.02, 1e-6));
      expect(vertex.getFloat32(276, Endian.little), 0.25);
      expect(vertex.getFloat32(280, Endian.little), 1);
      final unattenuated = debugThreeVertexUniform(
        draw,
        plan,
        2,
        viewportHeight: 1080,
      );
      expect(unattenuated.getFloat32(276, Endian.little), 270);
      final shadowVertex = debugThreeVertexUniform(
        draw,
        plan,
        2,
        shadowPass: true,
      );
      expect(shadowVertex.getFloat32(196, Endian.little), 1);

      final frame = debugThreeFrameUniform(plan);
      // v5 tail: point-shadow light/params vec4s at 112/128; this plan has
      // no point shadow so the flag reads 0.
      expect(frame.lengthInBytes, 144);
      expect(frame.getFloat32(80, Endian.little), closeTo(-0.0001, 1e-6));
      expect(frame.getFloat32(84, Endian.little), 1 / 2048);
      expect(frame.getFloat32(88, Endian.little), 1 / 2048);
      expect(frame.getFloat32(92, Endian.little), 1);
      expect(frame.getFloat32(112, Endian.little), 0);
      expect(frame.getFloat32(128, Endian.little), 0);
      expect(
        debugThreeMaterialUniform(draw, plan).getFloat32(44, Endian.little),
        1,
      );
    });

    test('GPU point uniforms preserve size attenuation and viewport scale', () {
      final fixture = ThreeDrawPlanFixture.basic();
      fixture.commands[3] = r1Command(
        3,
        r1Material(1, sizeAttenuation: false, pointSize: 0.05),
      );
      fixture
        ..geometry(1)
        ..node(2, parentId: 1);
      final plan = const ThreeDrawPlanner().plan(fixture.state());
      final draw = plan.opaque.single;
      final vertex = debugThreeVertexUniform(
        draw,
        plan,
        2,
        viewportHeight: 1080,
      );
      expect(vertex.getFloat32(192, Endian.little), closeTo(0.1, 1e-6));
      expect(vertex.getFloat32(276, Endian.little), 270);
      expect(vertex.getFloat32(280, Endian.little), 0);
      expect(draw.material.sizeAttenuation, isFalse);
    });

    test('v3 spot lights and clipping sets pack exact GPU uniforms', () {
      final fixture =
          ThreeDrawPlanFixture.withCommands([
              r1Command(4, r1Node(1, objectKind: JsThreeObjectKind.group)),
              r1Command(6, r1Camera(1)),
              r1Command(
                8,
                r1Frame(
                  sceneId: 1,
                  cameraId: 1,
                  shadowMapSize: 1024,
                  shadowLightType: 2,
                ),
              ),
              r1Command(3, r1Material(1, clipId: 5, clipFlags: 2)),
              r1Command(13, r1Clipping(5)),
              r1Command(
                7,
                r1Light(
                  2,
                  JsThreeLightType.spot,
                  intensity: 60,
                  red: 0.25,
                  green: 0.5,
                  blue: 0.75,
                  spotAngle: 0.6283,
                  spotPenumbra: 0.2,
                  spotDistance: 12,
                  spotDecay: 2,
                ),
              ),
            ])
            ..r1Version = 3
            ..geometry(1)
            ..node(2, parentId: 1);
      final plan = const ThreeDrawPlanner().plan(fixture.state());

      expect(plan.spotLights, hasLength(1));
      final spot = plan.spotLights.single;
      expect(spot.intensity, 60);
      final frame = plan.frame!;
      expect(frame.hasSpotShadow, isTrue);

      final frameUniform = debugThreeFrameUniform(plan);
      expect(frameUniform.getFloat32(44, Endian.little), 1);
      expect(frameUniform.getFloat32(64, Endian.little), 0);
      expect(frameUniform.getFloat32(72, Endian.little), 1);

      final lights = debugThreeLightsUniform(plan);
      expect(lights.lengthInBytes, 832);
      final cosOuter = math.cos(0.6283);
      final cosInner = math.cos(0.6283 * 0.8);
      for (final expected in <int, double>{
        576: 0.25,
        580: 0.5,
        584: 0.75,
        588: 60,
        640: 0,
        644: 1,
        648: -1,
        652: cosOuter,
        704: 0,
        708: -1,
        712: -0.5,
        716: cosInner,
        768: 2,
        772: 12,
      }.entries) {
        expect(
          lights.getFloat32(expected.key, Endian.little),
          closeTo(expected.value, 1e-4),
        );
      }

      final draw = plan.opaque.single;
      expect(draw.material.clipId, 5);
      expect(draw.material.clipShadows, isTrue);
      final clipping = debugThreeClippingUniform(plan, draw.material);
      expect(clipping.lengthInBytes, 272);
      expect(clipping.getFloat32(4, Endian.little), closeTo(-1, 1e-6));
      // The protocol carries three.js Plane constants verbatim; the GPU
      // binding must NEGATE them because the R1 shaders discard where
      // `dot(normal, p) < w` while three.js keeps the `normal·p + constant
      // >= 0` half-space (webgl_clipping rendered empty before this).
      expect(clipping.getFloat32(7 * 4, Endian.little), closeTo(-0.1, 1e-6));
      expect(clipping.getFloat32(256, Endian.little), 2);
      expect(clipping.getFloat32(260, Endian.little), 0);
      expect(clipping.getFloat32(264, Endian.little), 1);

      final unclipped = ThreeDrawPlanFixture.basic();
      unclipped
        ..geometry(1)
        ..node(2, parentId: 1);
      final plainPlan = const ThreeDrawPlanner().plan(unclipped.state());
      final plainDraw = plainPlan.opaque.single;
      final zero = debugThreeClippingUniform(plainPlan, plainDraw.material);
      for (var offset = 0; offset < 272; offset += 4) {
        expect(zero.getFloat32(offset, Endian.little), 0);
      }
    });

    test('spot light caps exceed four with a warning', () {
      final fixture = ThreeDrawPlanFixture.basic()..r1Version = 3;
      fixture.commands[2] = r1Command(
        8,
        r1Frame(sceneId: 1, cameraId: 1, shadowLightType: 0),
      );
      fixture.commands[3] = r1Command(3, r1Material(1, clipId: 0));
      for (var id = 20; id <= 25; id++) {
        fixture.light(id, JsThreeLightType.spot);
      }
      final plan = const ThreeDrawPlanner().plan(fixture.state());
      expect(plan.spotLights.map((light) => light.lightId), [20, 21, 22, 23]);
      expect(plan.diagnostics.droppedSpotLightCount, 2);
    });

    test(
      'background skybox node sorts before scene draws (v7 renderOrder)',
      () {
        Uint8List v7Node(
          int id, {
          int parentId = 1,
          int geometryId = 0,
          int materialId = 0,
          JsThreeObjectKind objectKind = JsThreeObjectKind.group,
          double renderOrder = 0,
        }) {
          final data = ByteData(104);
          data.setUint32(0, id, Endian.little);
          data.setUint32(4, parentId, Endian.little);
          data.setUint32(8, geometryId, Endian.little);
          data.setUint32(12, materialId, Endian.little);
          data.setUint32(16, 1, Endian.little); // visible
          data.setUint32(20, objectKind.wireValue, Endian.little);
          final matrix = Float32List.fromList(const [
            1, 0, 0, 0, //
            0, 1, 0, 0, //
            0, 0, 1, 0, //
            0, 0, -2, 1, //
          ]);
          for (var i = 0; i < 16; i++) {
            data.setFloat32(24 + i * 4, matrix[i], Endian.little);
          }
          data.setUint32(88, 0, Endian.little); // shadow flags
          data.setFloat32(92, 0.5, Endian.little); // sprite center x
          data.setFloat32(96, 0.5, Endian.little); // sprite center y
          data.setFloat32(100, renderOrder, Endian.little);
          return Uint8List.view(data.buffer);
        }

        // Regression for the watch white-slab / clearcoat missing-spheres
        // captures: the injected scene.background skybox sorts with the opaque
        // draws, so when its material id happens to be the highest it drew
        // LAST and its near-plane fragments painted the whole frame over the
        // scene. The encoder now pins the skybox node's renderOrder first
        // (upstream WebGLBackground order) and the planner must honor it.
        // The v7 frame body = the fixture's v3 body with the v4 tone tail and
        // the v5 point-shadow tail spliced in before the shadow-map fields;
        // all tail values stay at their neutral zeros.
        Uint8List v7Frame() {
          final base = r1Frame(sceneId: 1, cameraId: 1, shadowLightType: 0);
          final data = ByteData(base.length + 32);
          data.buffer.asUint8List().setAll(0, base.sublist(0, 52));
          // bytes 52..84 stay zero: tone mapping none + density 0, point
          // shadow flag 0 + reserved 0 + inactive light xyz/far.
          data.buffer.asUint8List().setAll(84, base.sublist(52));
          return Uint8List.view(data.buffer);
        }

        // Minimal v7 material body for an unlit kind: base fields, neutral
        // clip tail, v4 slot tail (identity UV matrices, env intensity 1),
        // zeroed v5 (16 bytes incl. reserved pad) / v6 tails and an all-zero
        // Dubois tail.
        Uint8List v7Material(int id, JsThreeMaterialKind kind) {
          final data = ByteData(304);
          data.setUint32(0, id, Endian.little);
          data.setUint32(4, 1, Endian.little); // version
          data.setUint32(8, kind.wireValue, Endian.little);
          data.setUint32(12, 0, Endian.little); // map texture id
          data.setUint32(16, 0, Endian.little); // flags
          data.setUint32(20, 0, Endian.little); // side: front
          final color = kind == JsThreeMaterialKind.background
              ? [1.0, 1.0, 1.0]
              : [1.0, 1.0, 1.0];
          for (var i = 0; i < 3; i++) {
            data.setFloat32(24 + i * 4, color[i], Endian.little);
          }
          data.setFloat32(36, 1, Endian.little); // opacity
          data.setFloat32(40, 1, Endian.little); // roughness
          data.setFloat32(44, 0, Endian.little); // metalness
          data.setFloat32(48, 0, Endian.little); // alphaTest
          data.setFloat32(52, 1, Endian.little); // point size
          // 56: clip id/flags zero. 64: alpha map 0, env map 0, intensity 1.
          data.setFloat32(72, 1, Endian.little);
          const identity = <double>[1.0, 0, 0, 0, 1.0, 0, 0, 0, 1.0];
          for (var i = 0; i < 9; i++) {
            data.setFloat32(76 + i * 4, identity[i], Endian.little);
            data.setFloat32(112 + i * 4, identity[i], Endian.little);
          }
          // 148: v5 tail = matcap/gradient ids, rotation, reserved pad (16
          // bytes). 164: v6 normal/bump tails with unit scales. 192: Dubois
          // right id, reserved, matrices zero.
          data.setFloat32(168, 1, Endian.little); // normal scale x
          data.setFloat32(172, 1, Endian.little); // normal scale y
          data.setFloat32(180, 1, Endian.little); // bump scale
          return Uint8List.view(data.buffer);
        }

        final fixture = ThreeDrawPlanFixture.withCommands([
          r1Command(
            4,
            v7Node(1, parentId: 0, objectKind: JsThreeObjectKind.group),
          ),
          r1Command(6, r1Camera(1)),
          r1Command(8, v7Frame()),
          r1Command(3, v7Material(9, JsThreeMaterialKind.background)),
          r1Command(3, v7Material(2, JsThreeMaterialKind.meshBasic)),
        ]);
        fixture.geometry(1);
        fixture.r1Version = 7;
        fixture.commands.addAll([
          r1Command(
            4,
            v7Node(
              10,
              geometryId: 1,
              materialId: 9,
              objectKind: JsThreeObjectKind.mesh,
              renderOrder: -1e6,
            ),
          ),
          r1Command(
            4,
            v7Node(
              11,
              geometryId: 1,
              materialId: 2,
              objectKind: JsThreeObjectKind.mesh,
            ),
          ),
        ]);

        final plan = const ThreeDrawPlanner().plan(fixture.state());
        expect(plan.canRender, isTrue);
        expect(plan.opaque, isNotEmpty);
        expect(plan.opaque.first.material.kind, JsThreeMaterialKind.background);
        expect(plan.opaque.first.node.renderOrder, -1e6);
        expect(plan.opaque.last.material.kind, JsThreeMaterialKind.meshBasic);
        expect(plan.diagnostics.warnings, isEmpty);
      },
    );
  });

  group('R1 v8 stencil draw state and clear markers', () {
    Iterable<ThreeStencilClearMarker> markers(ThreeDrawPlan plan) =>
        plan.mainStream
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

    void v8Frame(ThreeDrawPlanFixture fixture,
        {List<int> culledNodeIds = const []}) {
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
        plan.stream
            .whereType<ThreeDrawStreamDraw>()
            .map((entry) => entry.draw.node.nodeId),
        [10, 11],
      );
      expect(
        plan.mainStream
            .whereType<ThreeDrawStreamDraw>()
            .every((entry) => entry.draw.stencil == null),
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
        plan.mainStream.map((entry) => entry is ThreeDrawStreamDraw
            ? 'd${entry.draw.node.nodeId}'
            : 'c${(entry as ThreeDrawStreamStencilClear).clear.value}'),
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
        plan.mainStream
            .whereType<ThreeDrawStreamDraw>()
            .map((entry) => entry.draw.node.nodeId),
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
