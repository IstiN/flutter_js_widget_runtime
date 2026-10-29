import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_backend.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

void main() {
  group('ThreeDrawPlanner', () {
    test('sorts opaque by material and transparent far to near', () {
      final fixture = _Fixture.basic()
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
      final fixture = _Fixture.basic()
        ..geometry(1)
        ..node(2, parentId: 1);
      fixture.commands.add(
        _command(8, _frame(sceneId: 1, cameraId: 1, culledNodeIds: const [2])),
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
        final fixture = _Fixture.basic()
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
      final fixture = _Fixture.basic()
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
      final fixture = _Fixture.basic()
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

      final missing = _Fixture.basic()
        ..geometry(1)
        ..material(2, wireframe: true)
        ..node(2, parentId: 1, materialId: 2);
      final invalid = const ThreeDrawPlanner().plan(missing.state());
      expect(invalid.draws, isEmpty);
      expect(invalid.diagnostics.invalidGeometryCount, 1);
      expect(invalid.diagnostics.warnings.join('\n'), contains('wireframe'));
    });

    test('plans Normal independently and forwards side and emissive state', () {
      final fixture = _Fixture.basic()
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
      final fixture = _Fixture.basic()
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
      final fixture = _Fixture.basic()
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
      final fixture = _Fixture.basic()
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

      final empty = _Fixture.basic()
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

    test(
      'rejects invalid batch ranges and incompatible or transparent parts',
      () {
        final invalidRanges = _Fixture.basic()
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
        final invalidPlan = const ThreeDrawPlanner().plan(
          invalidRanges.state(),
        );
        expect(invalidPlan.draws, isEmpty);
        expect(invalidPlan.diagnostics.invalidBatchCount, 3);
        expect(invalidPlan.diagnostics.missingResourceCount, 1);
        expect(invalidPlan.diagnostics.incompatibleMaterialCount, 1);

        final nonIndexed = _Fixture.basic()
          ..geometry(1)
          ..batch(5, parts: const [(1, 1, 1, 2)]);
        final nonIndexedPlan = const ThreeDrawPlanner().plan(
          nonIndexed.state(),
        );
        expect(nonIndexedPlan.draws, isEmpty);
        expect(nonIndexedPlan.diagnostics.invalidBatchCount, 1);
        expect(
          nonIndexedPlan.diagnostics.warnings.join('\n'),
          contains('whole geometry'),
        );

        final transparent = _Fixture.basic()
          ..geometry(1)
          ..material(2, transparent: true)
          ..batch(
            5,
            instanced: true,
            instanceCount: 2,
            parts: const [(1, 2, 0, 3)],
          );
        final transparentPlan = const ThreeDrawPlanner().plan(
          transparent.state(),
        );
        expect(transparentPlan.draws, isEmpty);
        expect(transparentPlan.diagnostics.invalidBatchCount, 1);
        expect(
          transparentPlan.diagnostics.warnings.join('\n'),
          contains('transparent InstancedMesh'),
        );
      },
    );

    test('caps each light family independently and deterministically', () {
      final fixture = _Fixture.basic();
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

    test('keeps HemisphereLight distinct and packs exact GPU light uniforms', () {
      final fixture = _Fixture.basic()
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
      expect(frame.lengthInBytes, 96);
      expect(frame.getFloat32(32, Endian.little), 0);
      expect(frame.getFloat32(36, Endian.little), 0);
      expect(frame.getFloat32(40, Endian.little), 1);
      final lights = debugThreeLightsUniform(plan);
      expect(lights.lengthInBytes, 576);
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
    });

    test(
      'uses selected pending frame camera and exposes camera/background',
      () {
        final fixture = _Fixture.basic()
          ..camera(2)
          ..node(2, parentId: 1)
          ..geometry(1);
        fixture.commands.add(
          _command(8, _frame(sceneId: 1, cameraId: 2, exposure: 2)),
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
      final noFrame = _Fixture.withCommands([_command(6, _camera(1))]).state();
      expect(const ThreeDrawPlanner().plan(noFrame).canRender, isFalse);

      final noCamera = _Fixture.withCommands([
        _command(4, _node(1, objectKind: JsThreeObjectKind.group)),
        _command(8, _frame(sceneId: 1, cameraId: 9)),
      ]).state();
      final plan = const ThreeDrawPlanner().plan(noCamera);
      expect(plan.canRender, isFalse);
      expect(plan.diagnostics.missingResourceCount, 1);
    });

    test('uses node id to break material and view-depth ties', () {
      final fixture = _Fixture.basic()
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
      final state = _Fixture.withCommands([
        _command(4, _node(1, parentId: 2, objectKind: JsThreeObjectKind.group)),
        _command(4, _node(2, parentId: 1, objectKind: JsThreeObjectKind.group)),
        _command(6, _camera(1)),
        _command(8, _frame(sceneId: 1, cameraId: 1)),
      ]).state();

      final plan = const ThreeDrawPlanner().plan(state);

      expect(plan.draws, isEmpty);
      expect(plan.diagnostics.hierarchyCycleCount, 1);
      expect(plan.diagnostics.warnings.join('\n'), contains('cycle'));
    });

    test('diagnoses invalid groups and zero or missing draw resources', () {
      final fixture = _Fixture.basic()
        ..geometry(1)
        ..node(2, parentId: 1, geometryId: 0)
        ..node(3, parentId: 1, materialId: 0)
        ..node(4, parentId: 1, geometryId: 999);
      fixture.commands.add(
        _command(
          4,
          _node(
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
      final fixture = _Fixture.basic()
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
      final disposed = _Fixture.withCommands([
        _command(10, Uint8List(0)),
      ]).state();
      final disposedPlan = const ThreeDrawPlanner().plan(disposed);
      expect(disposedPlan.canRender, isFalse);
      expect(
        disposedPlan.diagnostics.warnings.join('\n'),
        contains('disposed'),
      );

      final missingScene = _Fixture.withCommands([
        _command(6, _camera(1)),
        _command(8, _frame(sceneId: 99, cameraId: 1)),
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
      final fixture = _Fixture.basic()
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
      final fixture = _Fixture.basic()
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
      final fixture = _Fixture.basic();
      fixture.commands[2] = _command(
        8,
        _frame(sceneId: 1, cameraId: 1, shadowMapSize: 2048),
      );
      fixture
        ..geometry(1)
        ..node(2, parentId: 1, castShadow: true, receiveShadow: true);
      final plan = const ThreeDrawPlanner().plan(fixture.state());
      final draw = plan.opaque.single;

      final vertex = debugThreeVertexUniform(draw, plan, 2);
      expect(vertex.lengthInBytes, 320);
      expect(vertex.getFloat32(196, Endian.little), 0);
      expect(vertex.getFloat32(208, Endian.little), 1);
      expect(vertex.getFloat32(272, Endian.little), closeTo(0.02, 1e-6));
      final shadowVertex = debugThreeVertexUniform(
        draw,
        plan,
        2,
        shadowPass: true,
      );
      expect(shadowVertex.getFloat32(196, Endian.little), 1);

      final frame = debugThreeFrameUniform(plan);
      expect(frame.lengthInBytes, 96);
      expect(frame.getFloat32(80, Endian.little), closeTo(-0.0001, 1e-6));
      expect(frame.getFloat32(84, Endian.little), 1 / 2048);
      expect(frame.getFloat32(88, Endian.little), 1 / 2048);
      expect(frame.getFloat32(92, Endian.little), 1);
      expect(debugThreeMaterialUniform(draw).getFloat32(44, Endian.little), 1);
    });
  });
}

final class _Fixture {
  _Fixture(this.commands);

  factory _Fixture.basic() => _Fixture([
    _command(4, _node(1, objectKind: JsThreeObjectKind.group)),
    _command(6, _camera(1)),
    _command(8, _frame(sceneId: 1, cameraId: 1)),
    _command(3, _material(1)),
  ]);

  factory _Fixture.withCommands(List<Uint8List> commands, {int sequence = 1}) =>
      _Fixture(commands)..sequence = sequence;

  final List<Uint8List> commands;
  int sequence = 1;

  void geometry(
    int id, {
    int version = 1,
    JsThreePrimitive primitive = JsThreePrimitive.triangles,
    List<double> positions = const [0, 0, 0, 1, 0, 0, 0, 1, 0],
    List<double>? normals,
    List<double>? uvs,
    List<double>? colors,
    List<int> indices = const [],
    List<int>? wireIndices,
  }) {
    commands.add(
      _command(
        1,
        _geometry(
          id,
          version: version,
          primitive: primitive,
          positions: positions,
          normals: normals,
          uvs: uvs,
          colors: colors,
          indices: indices,
          wireIndices: wireIndices,
        ),
      ),
    );
  }

  void material(
    int id, {
    int version = 1,
    JsThreeMaterialKind kind = JsThreeMaterialKind.meshBasic,
    bool transparent = false,
    bool wireframe = false,
    bool vertexColors = false,
    bool flatShading = false,
    JsThreeSide side = JsThreeSide.front,
    int mapTextureId = 0,
    bool emissive = false,
  }) {
    commands.add(
      _command(
        3,
        _material(
          id,
          version: version,
          kind: kind,
          transparent: transparent,
          wireframe: wireframe,
          vertexColors: vertexColors,
          flatShading: flatShading,
          side: side,
          mapTextureId: mapTextureId,
          emissive: emissive,
        ),
      ),
    );
  }

  void node(
    int id, {
    int parentId = 0,
    int geometryId = 1,
    int materialId = 1,
    JsThreeObjectKind objectKind = JsThreeObjectKind.mesh,
    bool visible = true,
    double z = 0,
    bool castShadow = false,
    bool receiveShadow = false,
  }) {
    commands.add(
      _command(
        4,
        _node(
          id,
          parentId: parentId,
          geometryId: objectKind == JsThreeObjectKind.group ? 0 : geometryId,
          materialId: objectKind == JsThreeObjectKind.group ? 0 : materialId,
          objectKind: objectKind,
          visible: visible,
          matrixWorld: _translation(0, 0, z),
          castShadow: castShadow,
          receiveShadow: receiveShadow,
        ),
      ),
    );
  }

  void batch(
    int id, {
    int parentId = 1,
    int version = 1,
    int instanceCount = 1,
    bool instanced = false,
    List<(int, int, int, int)> parts = const [(1, 1, 0, 3)],
    List<double>? matrices,
  }) {
    commands.add(
      _command(
        4,
        _node(id, parentId: parentId, objectKind: JsThreeObjectKind.mesh),
      ),
    );
    commands.add(
      _command(
        11,
        _drawBatch(
          id,
          version: version,
          instanceCount: instanceCount,
          instanced: instanced,
          parts: parts,
          matrices: matrices,
        ),
      ),
    );
  }

  void camera(int id) => commands.add(_command(6, _camera(id)));

  void light(
    int id,
    JsThreeLightType type, {
    double intensity = 1,
    double red = 1,
    double green = 1,
    double blue = 1,
    double groundRed = 0,
    double groundGreen = 0,
    double groundBlue = 0,
    List<double>? direction,
  }) {
    commands.add(
      _command(
        7,
        _light(
          id,
          type,
          intensity: intensity,
          red: red,
          green: green,
          blue: blue,
          groundRed: groundRed,
          groundGreen: groundGreen,
          groundBlue: groundBlue,
          direction: direction,
        ),
      ),
    );
  }

  JsThreeSurfaceState state() {
    final engine = utf8.encode('engine');
    final surface = utf8.encode('surface');
    final payload = _r1(commands);
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
    return JsThreeStateStore().apply(result).surface;
  }
}

Uint8List _r1(List<Uint8List> commands) {
  final builder = BytesBuilder(copy: false)
    ..add(ascii.encode('JSR1'))
    ..add(_u16(2))
    ..add(_u16(0))
    ..add(_u32(commands.length));
  for (final command in commands) {
    builder.add(command);
  }
  return builder.takeBytes();
}

Uint8List _command(int opcode, Uint8List body) =>
    (BytesBuilder(copy: false)
          ..add(Uint8List.fromList([opcode, 0]))
          ..add(_u16(0))
          ..add(_u32(body.length))
          ..add(body))
        .takeBytes();

Uint8List _geometry(
  int id, {
  required int version,
  required JsThreePrimitive primitive,
  required List<double> positions,
  required List<double>? normals,
  required List<double>? uvs,
  required List<double>? colors,
  required List<int> indices,
  List<int>? wireIndices,
}) {
  final vertexCount = positions.length ~/ 3;
  final mask =
      1 |
      (normals == null ? 0 : 2) |
      (uvs == null ? 0 : 4) |
      (colors == null ? 0 : 8);
  final builder = _BodyBuilder()
    ..u32(id)
    ..u32(version)
    ..u32(mask)
    ..u32(vertexCount)
    ..u32(indices.length)
    ..u32(primitive.wireValue)
    ..u32(0)
    ..floats(positions, byteLengthPrefix: true);
  if (normals != null) builder.floats(normals, byteLengthPrefix: true);
  if (uvs != null) builder.floats(uvs, byteLengthPrefix: true);
  if (colors != null) builder.floats(colors, byteLengthPrefix: true);
  for (final index in indices) {
    builder.u32(index);
  }
  if (wireIndices != null) {
    builder.u32(wireIndices.length);
    for (final index in wireIndices) {
      builder.u32(index);
    }
  }
  return builder.bytes;
}

Uint8List _material(
  int id, {
  int version = 1,
  JsThreeMaterialKind kind = JsThreeMaterialKind.meshBasic,
  bool transparent = false,
  bool wireframe = false,
  bool vertexColors = false,
  bool flatShading = false,
  JsThreeSide side = JsThreeSide.front,
  int mapTextureId = 0,
  bool emissive = false,
}) {
  final phong = kind == JsThreeMaterialKind.meshPhong;
  final data = ByteData((phong ? 72 : 56) + (emissive ? 16 : 0));
  data.setUint32(0, id, Endian.little);
  data.setUint32(4, version, Endian.little);
  data.setUint32(8, kind.wireValue, Endian.little);
  data.setUint32(12, mapTextureId, Endian.little);
  data.setUint32(
    16,
    (transparent ? 4 : 0) |
        8 |
        16 |
        (vertexColors ? 1 : 0) |
        (flatShading ? 2 : 0) |
        (wireframe ? 32 : 0),
    Endian.little,
  );
  data.setUint32(20, side.wireValue, Endian.little);
  data.setFloat32(24, 1, Endian.little);
  data.setFloat32(28, 1, Endian.little);
  data.setFloat32(32, 1, Endian.little);
  data.setFloat32(36, 1, Endian.little);
  data.setFloat32(40, 0.5, Endian.little);
  data.setFloat32(44, 0, Endian.little);
  data.setFloat32(48, 0, Endian.little);
  data.setFloat32(52, 1, Endian.little);
  if (phong) {
    data.setFloat32(56, 0.125, Endian.little);
    data.setFloat32(60, 0.25, Endian.little);
    data.setFloat32(64, 0.5, Endian.little);
    data.setFloat32(68, 64, Endian.little);
  }
  if (emissive) {
    final offset = phong ? 72 : 56;
    data.setFloat32(offset, 0.125, Endian.little);
    data.setFloat32(offset + 4, 0.25, Endian.little);
    data.setFloat32(offset + 8, 0.5, Endian.little);
    data.setFloat32(offset + 12, 3, Endian.little);
  }
  return Uint8List.view(data.buffer);
}

Uint8List _node(
  int id, {
  int parentId = 0,
  int geometryId = 0,
  int materialId = 0,
  JsThreeObjectKind objectKind = JsThreeObjectKind.group,
  bool visible = true,
  List<double>? matrixWorld,
  bool castShadow = false,
  bool receiveShadow = false,
}) {
  final data = ByteData(92);
  data.setUint32(0, id, Endian.little);
  data.setUint32(4, parentId, Endian.little);
  data.setUint32(8, geometryId, Endian.little);
  data.setUint32(12, materialId, Endian.little);
  data.setUint32(16, visible ? 1 : 0, Endian.little);
  data.setUint32(20, objectKind.wireValue, Endian.little);
  _writeFloats(data, 24, matrixWorld ?? _identity());
  data.setUint32(
    88,
    (castShadow ? 1 : 0) | (receiveShadow ? 2 : 0),
    Endian.little,
  );
  return Uint8List.view(data.buffer);
}

Uint8List _drawBatch(
  int nodeId, {
  required int version,
  required int instanceCount,
  required bool instanced,
  required List<(int, int, int, int)> parts,
  required List<double>? matrices,
}) {
  final matrixValues =
      matrices ??
      (instanced
          ? [
              for (var instance = 0; instance < instanceCount; instance++)
                ..._identity(),
            ]
          : const <double>[]);
  final builder = _BodyBuilder()
    ..u32(nodeId)
    ..u32(version)
    ..u32(instanceCount)
    ..u32(instanced ? 1 : 0)
    ..u32(parts.length);
  for (final (geometryId, materialId, offset, count) in parts) {
    builder
      ..u32(geometryId)
      ..u32(materialId)
      ..u32(offset)
      ..u32(count);
  }
  builder.floats(matrixValues);
  return builder.bytes;
}

Uint8List _camera(int id) {
  final data = ByteData(200);
  data.setUint32(0, id, Endian.little);
  data.setUint32(4, JsThreeCameraType.perspective.wireValue, Endian.little);
  _writeFloats(data, 8, _identity());
  _writeFloats(data, 72, _identity());
  _writeFloats(data, 136, _identity());
  return Uint8List.view(data.buffer);
}

Uint8List _light(
  int id,
  JsThreeLightType type, {
  double intensity = 1,
  double red = 1,
  double green = 1,
  double blue = 1,
  double groundRed = 0,
  double groundGreen = 0,
  double groundBlue = 0,
  List<double>? direction,
}) {
  final hemisphere = type == JsThreeLightType.hemisphere;
  final data = ByteData(hemisphere ? 64 : 48);
  data.setUint32(0, id, Endian.little);
  data.setUint32(4, type.wireValue, Endian.little);
  data.setFloat32(8, red, Endian.little);
  data.setFloat32(12, green, Endian.little);
  data.setFloat32(16, blue, Endian.little);
  data.setFloat32(20, intensity, Endian.little);
  data.setFloat32(24, 0, Endian.little);
  data.setFloat32(28, 1, Endian.little);
  data.setFloat32(32, -1, Endian.little);
  final worldDirection = direction ?? const [0.0, -1.0, -0.5];
  for (var index = 0; index < 3; index++) {
    data.setFloat32(36 + index * 4, worldDirection[index], Endian.little);
  }
  if (hemisphere) {
    data.setFloat32(48, groundRed, Endian.little);
    data.setFloat32(52, groundGreen, Endian.little);
    data.setFloat32(56, groundBlue, Endian.little);
  }
  return Uint8List.view(data.buffer);
}

Uint8List _frame({
  required int sceneId,
  required int cameraId,
  double exposure = 1,
  int shadowMapSize = 0,
  List<int> culledNodeIds = const [],
}) {
  final data = ByteData(
    136 + (culledNodeIds.isEmpty ? 0 : 4 + culledNodeIds.length * 4),
  );
  data.setUint32(0, sceneId, Endian.little);
  data.setUint32(4, cameraId, Endian.little);
  data.setFloat32(8, 0.1, Endian.little);
  data.setFloat32(12, 0.2, Endian.little);
  data.setFloat32(16, 0.3, Endian.little);
  data.setFloat32(20, 1, Endian.little);
  data.setFloat32(24, exposure, Endian.little);
  data.setUint32(52, shadowMapSize, Endian.little);
  data.setUint32(56, shadowMapSize, Endian.little);
  data.setFloat32(60, -0.0001, Endian.little);
  data.setFloat32(64, 0.02, Endian.little);
  data.setFloat32(68, 1, Endian.little);
  for (final index in [0, 5, 10, 15]) {
    data.setFloat32(72 + index * 4, 1, Endian.little);
  }
  if (culledNodeIds.isNotEmpty) {
    data.setUint32(136, culledNodeIds.length, Endian.little);
    for (var index = 0; index < culledNodeIds.length; index++) {
      data.setUint32(140 + index * 4, culledNodeIds[index], Endian.little);
    }
  }
  return Uint8List.view(data.buffer);
}

List<double> _identity() => [
  1, 0, 0, 0, //
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
];

List<double> _translation(double x, double y, double z) => [
  1, 0, 0, 0, //
  0, 1, 0, 0,
  0, 0, 1, 0,
  x, y, z, 1,
];

void _writeFloats(ByteData data, int offset, List<double> values) {
  for (var index = 0; index < values.length; index++) {
    data.setFloat32(offset + index * 4, values[index], Endian.little);
  }
}

Uint8List _u16(int value) {
  final data = ByteData(2)..setUint16(0, value, Endian.little);
  return Uint8List.view(data.buffer);
}

Uint8List _u32(int value) {
  final data = ByteData(4)..setUint32(0, value, Endian.little);
  return Uint8List.view(data.buffer);
}

final class _BodyBuilder {
  final BytesBuilder _builder = BytesBuilder(copy: false);

  void u32(int value) => _builder.add(_u32(value));

  void floats(List<double> values, {bool byteLengthPrefix = false}) {
    final data = ByteData(values.length * 4);
    _writeFloats(data, 0, values);
    if (byteLengthPrefix) u32(data.lengthInBytes);
    _builder.add(Uint8List.view(data.buffer));
  }

  Uint8List get bytes => _builder.takeBytes();
}
