import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

const _assetNames = <String>[
  'Samba Dancing',
  'morph_test',
  'monkey',
  'monkey_embedded_texture',
  'vCube',
  'archer/ArcherRi01',
  'warrior/Warrior',
  'stanford-bunny',
  'mixamo',
  'RotationTest',
  'exampleWindow',
  'Head_69',
  'morph-translation',
  'ball_anims_asc_2018',
];

bool _treeContainsAction(Object? node, String action) {
  if (node is Map) {
    if (node['onChanged'] == action) return true;
    return node.values.any((value) => _treeContainsAction(value, action));
  }
  if (node is Iterable) {
    return node.any((value) => _treeContainsAction(value, action));
  }
  return false;
}

int _sceneSignature(ThreeDrawPlan plan) {
  var hash = 0x811c9dc5;
  for (final draw in plan.draws) {
    hash = (hash ^ draw.node.nodeId) * 0x01000193;
    hash = (hash ^ draw.geometry.geometryId) * 0x01000193;
    hash = (hash ^ draw.geometry.vertexCount) * 0x01000193;
    hash = (hash ^ draw.material.materialId) * 0x01000193;
    hash &= 0x7fffffff;
  }
  return hash;
}

int _nodeSkinPoseSignature(ThreeDrawPlan plan, int nodeId) {
  var hash = 0x811c9dc5;
  for (final draw in plan.draws) {
    if (draw.node.nodeId != nodeId) continue;
    final matrices = draw.node.skinBoneMatrices;
    if (matrices == null) continue;
    for (final value in matrices) {
      hash = (hash ^ value.hashCode) * 0x01000193;
      hash &= 0x7fffffff;
    }
    break; // Every material part of this node carries the same matrices.
  }
  return hash;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets('every official FBX dropdown asset loads and renders', (
    tester,
  ) async {
    final servedAssets = <String>{};
    final delegate = widgetDirAssetLoader('example/widgets/three-loader-fbx');
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-loader-fbx',
      instanceId: 'three-fbx-all-assets',
      assetLoader: (engineId, url) async {
        final asset = await delegate(engineId, url);
        servedAssets.add(url);
        return asset;
      },
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount >= 4 &&
          plan.draws.isNotEmpty &&
          harness.engine.exportedState?['gui'] != null,
      attempts: 400,
    );
    harness.expectHealthy('webgl_loader_fbx');

    Map<String, dynamic> assetControl() {
      final values =
          harness.engine.exportedState!['gui']['values'] as List<dynamic>;
      return values.singleWhere((value) => value['property'] == 'asset')
          as Map<String, dynamic>;
    }

    final action = assetControl()['action'] as String;
    for (final name in _assetNames.skip(1)) {
      final url = 'models/fbx/$name.fbx';
      final beforeUploads = harness.state!.geometryUploadCount;
      final beforeScene = _sceneSignature(harness.plan!);
      final errorCount = harness.engine
          .peekLogs()
          .where((entry) => (entry['msg'] as String).startsWith('[E]'))
          .length;

      await harness.backend.callEvent(action, {'value': name});
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            servedAssets.contains(url) &&
            state.geometryUploadCount > beforeUploads &&
            _sceneSignature(plan) != beforeScene,
        attempts: 600,
      );

      final errors = harness.engine
          .peekLogs()
          .where((entry) => (entry['msg'] as String).startsWith('[E]'))
          .toList();
      expect(
        servedAssets,
        contains(url),
        reason: '$name must resolve its pinned FBX bytes',
      );
      expect(
        harness.state!.geometryUploadCount,
        greaterThan(beforeUploads),
        reason:
            '$name must upload new geometry rather than only changing the label',
      );
      expect(
        _sceneSignature(harness.plan!),
        isNot(beforeScene),
        reason: '$name must replace the rendered scene',
      );
      expect(
        harness.plan!.draws,
        isNotEmpty,
        reason: '$name must leave a renderable scene',
      );
      expect(
        harness.plan!.diagnostics.warnings,
        isEmpty,
        reason: '$name must not require planner degrades',
      );
      expect(
        errors.length,
        errorCount,
        reason: '$name emitted new JS/asset errors: $errors',
      );
      expect(assetControl()['value'], name);
      if (name == 'morph_test') {
        final gui =
            harness.engine.exportedState!['gui'] as Map<String, dynamic>;
        final morphControls = (gui['values'] as List<dynamic>)
            .cast<Map<String, dynamic>>()
            .where(
              (value) =>
                  value['kind'] == 'number' && value['folder'] != 'Morphs',
            )
            .toList();
        expect(
          morphControls,
          isNotEmpty,
          reason: 'nested mesh folders must expose their morph sliders',
        );
        for (final control in morphControls) {
          expect(
            _treeContainsAction(
              harness.renderTrees.last,
              control['action'] as String,
            ),
            isTrue,
            reason: 'nested morph sliders must be rendered, not only created',
          );
        }
        final control = morphControls.first;
        final beforeChanges = gui['changes'] as int;
        await harness.backend.callEvent(control['action'] as String, {
          'value': 0.73,
        });
        await harness.pumpFrames(tester, 1);
        final updatedGui =
            harness.engine.exportedState!['gui'] as Map<String, dynamic>;
        final updated = (updatedGui['values'] as List<dynamic>)
            .cast<Map<String, dynamic>>()
            .singleWhere((value) => value['action'] == control['action']);
        expect(updated['value'], closeTo(0.73, 0.00001));
        expect(updatedGui['changes'], greaterThan(beforeChanges));
      }
      if (name == 'Head_69') {
        // One 215,931-vertex SkinnedMesh is partitioned into 266 material
        // parts. Every part must consume the same node-level GPU bone pose;
        // the old multi-material exclusion CPU-skinned all 25 bones and
        // re-uploaded 5,182,344 position/normal bytes on every frame.
        final headDraws = harness.plan!.draws
            .where((draw) => draw.geometry.vertexCount == 215931)
            .toList();
        expect(headDraws, hasLength(266));
        expect(
          headDraws.every((draw) => draw.node.skinBoneCount == 25),
          isTrue,
          reason: 'all Head_69 material parts must retain GPU skinning',
        );
        expect(
          headDraws.every(
            (draw) =>
                draw.geometry.skinIndices != null &&
                draw.geometry.skinWeights != null,
          ),
          isTrue,
          reason: 'GPU draws must read immutable bind-pose skin attributes',
        );
        final headNodeId = headDraws.first.node.nodeId;
        expect(
          headDraws.every((draw) => draw.node.nodeId == headNodeId),
          isTrue,
        );
        final firstPose = _nodeSkinPoseSignature(harness.plan!, headNodeId);
        await harness.pumpUntil(
          tester,
          (state, plan) =>
              _nodeSkinPoseSignature(plan, headNodeId) != firstPose,
          attempts: 100,
        );
        expect(
          _nodeSkinPoseSignature(harness.plan!, headNodeId),
          isNot(firstPose),
          reason: 'Head_69 bone uniforms must continue animating',
        );
        final settledUploads = harness.state!.geometryUploadCount;
        await harness.pumpFrames(tester, 5);
        expect(
          harness.state!.geometryUploadCount,
          settledUploads,
          reason: 'animated bone poses must not re-upload Head_69 geometry',
        );
      }
      await harness.pumpFrames(tester, 3);
    }

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(minutes: 6)));
}
