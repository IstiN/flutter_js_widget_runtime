import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart'
    show JsThreeMaterialKind, JsThreeMaterialUpsert, JsThreeObjectKind;
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'support/three_gap_documentation.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

// LineBasicMaterial({ vertexColors: true }) with defaults elsewhere —
// shared by both buffergeometry-lines testWidgets.
void expectLineBasicVertexColorsMaterial(JsThreeMaterialUpsert material) {
  expect(material.kind, JsThreeMaterialKind.lineBasic);
  expect(material.vertexColors, isTrue);
  expect(material.mapTextureId, 0);
  expect(material.opacity, 1);
  expect(material.transparent, isFalse);
  expect(material.wireframe, isFalse);
  expect(material.depthTest, isTrue);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'buffergeometry lines example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_buffergeometry_lines_indexed renders indexed Koch line '
      'segments', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-buffergeometry-lines-indexed',
      instanceId: 'three-buffergeometry-lines-indexed-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount == 1 &&
          plan.draws.length == 1 &&
          state.submittedFrameCount >= 3,
    );
    harness.expectHealthy('webgl_buffergeometry_lines_indexed');

    final state = harness.state!;
    final plan = harness.plan!;

    // One indexed BufferGeometry, one LineBasicMaterial, no textures: the
    // module builds a single snowflake LineSegments and nothing else.
    expect(state.geometryUploadCount, 1);
    expect(state.textureUploadCount, 0);
    expect(state.materialUploadCount, 1);
    expect(state.materials, hasLength(1));

    // Koch arithmetic from the module: 4 shape variants (open 2-point line,
    // closed triangle, closed square, open 9-point star) each iterated
    // depth 0..3, i.e. 1+4+16+64 = 85 segments per input edge and 1 seed
    // vertex per iteration. Edges: 1 + 3 + 4 + 8 = 16.
    //   segments = 16 * 85                 = 1360 -> 2720 indices
    //   vertices = 4 shapes * 4 seeds + 1360 = 1376
    expect(plan.draws, hasLength(1));
    final draw = plan.draws.single;
    expect(draw.primitive, ThreeDrawPrimitive.lines);
    expect(draw.indexed, isTrue);
    expect(draw.drawCount, 2720);
    expect(draw.drawCount ~/ 2, 1360); // rendered line segments
    expect(draw.instanceCount, 1);
    expect(draw.instanced, isFalse);
    expect(draw.geometry.vertexCount, 1376);
    expect(draw.geometry.indexCount, 2720);
    expect(draw.geometry.normals, isNull); // position + color attributes only
    expect(draw.geometry.colors, isNotNull);

    // The per-vertex palette is random red/green in [0.5, 1.0] with the
    // blue channel pinned to 1.0 (add_vertex pushes `..., ..., 1`).
    final colors = draw.geometry.colors!;
    expect(colors.length, 1376 * 3);
    for (var i = 0; i + 2 < colors.length; i += 3) {
      expect(colors[i], inInclusiveRange(0.5, 1.0));
      expect(colors[i + 1], inInclusiveRange(0.5, 1.0));
      expect(colors[i + 2], 1.0);
    }

    expectLineBasicVertexColorsMaterial(draw.material);

    // The module adds no lights and casts no shadows; the whole scene is the
    // single unlit line draw.
    expect(plan.triangleCount, 0);
    expect(plan.spotLights, isEmpty);
    expect(plan.directionalLights, isEmpty);
    expect(plan.pointLights, isEmpty);
    expect(plan.hemisphereLights, isEmpty);
    expect(plan.frame!.hasShadow, isFalse);
    expect(draw.node.castShadow, isFalse);
    expect(draw.node.receiveShadow, isFalse);

    // Topology: exactly one line node, parented under the rotating
    // parent_node Object3D (a group), which hangs off the scene root.
    final lineNodes = state.nodes.values
        .where((node) => node.objectKind == JsThreeObjectKind.line)
        .toList();
    expect(lineNodes, hasLength(1));
    final lineNode = lineNodes.single;
    expect(lineNode, same(draw.node));
    expect(lineNode.visible, isTrue);
    final parent = state.nodes[lineNode.parentId];
    expect(parent, isNotNull);
    expect(parent!.objectKind, JsThreeObjectKind.group);
    expect(state.nodes[parent.parentId], isNotNull); // scene root

    // animate() spins parent_node.rotation.z = time * 0.5 every frame: the
    // world matrix of the line must keep changing without re-uploading
    // geometry or material.
    final nodeId = lineNode.nodeId;
    final before = List<double>.from(lineNode.matrixWorld);
    final uploadsBefore = (
      state.geometryUploadCount,
      state.materialUploadCount,
    );
    final framesBefore = state.submittedFrameCount;
    await harness.pumpFrames(tester, 5);
    expect(state.submittedFrameCount, greaterThan(framesBefore));
    expect(state.geometryUploadCount, uploadsBefore.$1);
    expect(state.materialUploadCount, uploadsBefore.$2);
    // Node upserts are immutable snapshots: re-read the live node.
    final after = List<double>.from(state.nodes[nodeId]!.matrixWorld);
    expect(after, isNot(equals(before)));

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 120)));

  // webgl_buffergeometry_lines — DOCUMENTED FACADE GAP (not a widget bug).
  //
  // The official module builds ONE non-indexed THREE.Line of 10000 random
  // points (r = 800) with per-vertex colors color = coord / 800 + 0.5 and a
  // single position morph target (generateMorphTargets sets
  // geometry.morphAttributes.position = [target1], and animate() drives
  // morphTargetInfluences[0] = |sin(t)| every frame). The shared R1 native
  // renderer rejects morph targets by design:
  //
  // - tool/three/src/native_renderer.js:641 — _ensureGeometry throws
  //   `ThreeCapabilityError: three.unsupported: morphTargets; native R1
  //   does not provide this capability; use the 1B backend where available`
  //   as soon as any geometry.morphAttributes array is non-empty.
  // - tool/three/src/native_renderer.js:230 — capabilities.features has no
  //   morphTargets entry (unsupported, like shaderMaterial: false).
  //
  // The throw fires inside the setAnimationLoop callback on every RAF tick
  // (and in the mount render), so no frame is ever submitted. Part 3 below
  // proves morphTargets is the ONLY blocker: the same widget with just the
  // morph attributes stripped renders a full healthy draw plan. If R1 ever
  // gains morph target support, this test should collapse into part 3's
  // assertions run against the unmodified widget.
  testWidgets('webgl_buffergeometry_lines renders with CPU morph targets',
      (tester) async {
    // R1 applies morphTargetInfluences on the CPU in the scene serializer
    // (native_renderer._applyMorphTargets): the same widget that used to
    // fail with three.unsupported: morphTargets now renders every frame.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-buffergeometry-lines',
      instanceId: 'three-buffergeometry-lines-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount >= 1 &&
          plan.draws.length == 1 &&
          state.submittedFrameCount >= 3,
    );
    harness.expectHealthy('webgl_buffergeometry_lines');

    final state = harness.state!;
    final plan = harness.plan!;
    expect(state.textureUploadCount, 0);
    expect(state.materialUploadCount, 1);
    expect(plan.draws, hasLength(1));
    final draw = plan.draws.single;
    expect(draw.primitive, ThreeDrawPrimitive.lines);
    expect(draw.indexed, isTrue);
    expect(draw.geometry.indexCount, 19998);
    expect(draw.drawCount, 19998);
    expect(draw.geometry.vertexCount, 10000);
    expect(draw.geometry.normals, isNull);
    expect(draw.geometry.colors, isNotNull);
    expectLineBasicVertexColorsMaterial(draw.material);

    // The morphed positions animate with |sin(time)| influences: positions
    // change across frames while the palette attribute stays constant.
    final positionsBefore = List<double>.from(draw.geometry.positions);
    final colorsBefore = List<double>.from(draw.geometry.colors!);
    final framesBefore = state.submittedFrameCount;
    final lineNode = state.nodes.values
        .where((node) => node.objectKind == JsThreeObjectKind.line)
        .single;
    final matrixBefore = List<double>.from(lineNode.matrixWorld);
    // |sin(Date.now() * 0.001)| drives the influence: advance the wall
    // clock so the sampled influence provably changes between snapshots.
    await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 120)));
    await harness.pumpFrames(tester, 8);
    expect(state.submittedFrameCount, greaterThan(framesBefore));
    // harness.plan is only rebuilt inside pumpUntil: re-plan explicitly to
    // observe the freshly uploaded morphed geometry.
    final afterPlan = const ThreeDrawPlanner().plan(harness.state!);
    final positionsAfter = afterPlan.draws.single.geometry.positions;
    expect(positionsAfter, isNot(equals(positionsBefore)));
    expect(afterPlan.draws.single.geometry.colors!, equals(colorsBefore));
    expect(
      state.nodes[lineNode.nodeId]!.matrixWorld,
      isNot(equals(matrixBefore)),
    );
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
