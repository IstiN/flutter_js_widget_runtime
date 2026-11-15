import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

Iterable<Map<dynamic, dynamic>> _treeMaps(dynamic value) sync* {
  if (value is Map) {
    yield value;
    for (final child in value.values) {
      yield* _treeMaps(child);
    }
  } else if (value is Iterable) {
    for (final child in value) {
      yield* _treeMaps(child);
    }
  }
}

int _skinPoseSignature(ThreeDrawPlan plan) {
  var hash = 0x811c9dc5;
  var found = false;
  for (final draw in plan.draws) {
    final matrices = draw.node.skinBoneMatrices;
    if (matrices == null) continue;
    found = true;
    for (final value in matrices) {
      hash = (hash ^ value.hashCode) * 0x01000193;
      hash &= 0x7fffffff;
    }
  }
  expect(found, isTrue, reason: 'the FBX mesh must use the GPU skin lane');
  return hash;
}

int _skinnedPayloadSignature(ThreeDrawPlan plan) {
  var hash = 0x811c9dc5;
  var found = false;
  for (final draw in plan.draws) {
    if (draw.geometry.vertexCount < 1000) continue;
    found = true;
    final positions = draw.geometry.positions;
    final stride = positions.length ~/ 17;
    for (var index = 0; index < positions.length; index += stride) {
      hash = (hash ^ positions[index].toDouble().toInt()) * 0x01000193;
      hash = (hash ^ positions[index].toDouble().toInt()) & 0x7fffffff;
    }
  }
  expect(found, isTrue, reason: 'the FBX model must retain its full mesh');
  return hash;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets(
    'official FBX model and clip selectors change rendered animation',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-loader-fbx',
        instanceId: 'three-fbx-official-selectors',
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

      // Presented-pose prerequisite: with a constant rigid matrixWorld, the
      // animated bone uniforms themselves must reach the current draw plan.
      // The old state equality dropped every update after the bind pose.
      final firstPose = _skinPoseSignature(harness.plan!);
      await harness.pumpUntil(
        tester,
        (state, plan) => _skinPoseSignature(plan) != firstPose,
        attempts: 100,
      );
      expect(
        _skinPoseSignature(harness.plan!),
        isNot(firstPose),
        reason: 'Samba must keep dancing after the first GPU-skinned frame',
      );

      List<dynamic> guiValues() =>
          harness.engine.exportedState!['gui']['values'] as List<dynamic>;
      Map<String, dynamic> control(String property, {String? folder}) {
        return guiValues().firstWhere((value) {
              if (value['property'] != property) return false;
              return folder == null || value['folder'] == folder;
            })
            as Map<String, dynamic>;
      }

      List<String> clipItems() {
        final dropdown = _treeMaps(harness.renderTrees.last).firstWhere(
          (node) => node['type'] == 'dropdown' && node['label'] == 'clip',
        );
        return List<String>.from(dropdown['items'] as List);
      }

      expect(control('asset')['value'], 'Samba Dancing');
      final sambaVertices = harness.state!.geometries.values
          .map((geometry) => geometry.vertexCount)
          .toList();

      final sambaClipAction =
          control('clip', folder: 'Animations')['action'] as String;
      final sambaSignature = _skinnedPayloadSignature(harness.plan!);
      await harness.backend.callEvent(control('asset')['action'] as String, {
        'value': 'warrior/Warrior',
      });
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            control('asset')['value'] == 'warrior/Warrior' &&
            control('clip', folder: 'Animations')['action'] !=
                sambaClipAction &&
            _skinnedPayloadSignature(plan) != sambaSignature,
        attempts: 400,
      );
      final warriorVertices = harness.state!.geometries.values
          .map((geometry) => geometry.vertexCount)
          .toList();
      expect(warriorVertices, isNot(sambaVertices));
      expect(harness.plan!.diagnostics.warnings, isEmpty);

      final clips = clipItems();
      expect(clips.length, greaterThanOrEqualTo(2));
      final firstClip =
          control('clip', folder: 'Animations')['value'] as String;
      final secondClip = clips.firstWhere((clip) => clip != firstClip);

      Future<void> expectClipSwitch(String clip) async {
        final before = _skinnedPayloadSignature(harness.plan!);
        await harness.backend.callEvent(
          control('clip', folder: 'Animations')['action'] as String,
          {'value': clip},
        );
        await harness.pumpUntil(
          tester,
          (state, plan) =>
              control('clip', folder: 'Animations')['value'] == clip &&
              _skinnedPayloadSignature(plan) != before,
          attempts: 150,
        );
        expect(control('clip', folder: 'Animations')['value'], clip);
        expect(harness.plan!.diagnostics.warnings, isEmpty);
      }

      await expectClipSwitch(secondClip);
      await expectClipSwitch(firstClip);

      await harness.backend.callEvent(control('asset')['action'] as String, {
        'value': 'Samba Dancing',
      });
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            control('asset')['value'] == 'Samba Dancing' &&
            control('clip', folder: 'Animations')['value'] == 'mixamo.com' &&
            plan.draws.any((draw) => draw.geometry.vertexCount >= 1000),
        attempts: 400,
      );
      expect(harness.plan!.diagnostics.warnings, isEmpty);
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );
}
