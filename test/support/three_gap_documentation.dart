import 'package:flutter_test/flutter_test.dart';

import 'three_quickjs_example_harness.dart';

/// Shared assertions for the documented 1B-only ShaderMaterial gap tests
/// (`three-interactive-points`, `three-lights-hemisphere`): the module boots
/// completely (canvas mounted, exports live) but every renderer.render()
/// throws the R1 capability error, so no frame is ever submitted.
void expectShaderMaterialGapBoot(
  ThreeQuickjsExampleHarness harness,
  String exampleId,
) {
  final exported = harness.engine.exportedState!;
  expect(exported['example'], exampleId);
  expect(exported['backend'], 'flutterGpu');
  expect(exported['canvasCount'], 1);
  expect(exported['mounted'], isTrue);
  expect(harness.renderTrees.first['type'], 'three');
  expect(harness.renderTrees.first['canvasId'], 'main');
  expect(
    harness.renderTrees.last.toString(),
    contains('material (ShaderMaterial)'),
  );
  expect(harness.surface, isNull);
  expect((exported['renderer'] as Map<String, dynamic>)['frame'], 0);
  expect((exported['stats'] as Map<String, dynamic>)['updates'], 0);
}

/// The instrumented probe log must carry the exact per-frame capability
/// failure from the shared JSR_RENDERFAIL console marker.
/// Extracts the shared JSR_RENDERFAIL console marker and asserts the exact
/// capability failure envelope for [feature] (used by the per-module gap
/// probes; keeps the marker contract in one place).
String expectRenderFailFeature(Iterable<String> logs, String feature) {
  final failure = logs.firstWhere(
    (msg) => msg.contains('JSR_RENDERFAIL'),
    orElse: () => '',
  );
  expect(failure, isNotEmpty);
  expect(failure, contains('code=three.unsupported'));
  expect(failure, contains('feature=$feature'));
  expect(failure, contains('native R1 does not provide this capability'));
  return failure;
}

void expectRenderFailLog(Iterable<String> logs) {
  final failure = logs.firstWhere(
    (msg) => msg.contains('JSR_RENDERFAIL'),
    orElse: () => '',
  );
  expect(failure, isNotEmpty);
  expect(failure, contains('code=three.unsupported'));
  expect(failure, contains('feature=material'));
  expect(
    failure,
    contains('three.unsupported: material (ShaderMaterial)'),
  );
  expect(failure, contains('native R1 does not provide this capability'));
}
