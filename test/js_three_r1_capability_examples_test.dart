import 'package:flutter_test/flutter_test.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';

Future<void> _expectR1Example(
  WidgetTester tester,
  String id, {
  String? warning,
}) async {
  final harness = await ThreeQuickjsExampleHarness.boot(
    tester,
    widgetId: id,
    instanceId: '$id-r1-test',
  );
  final officialId = id.replaceFirst('three-', 'webgl_').replaceAll('-', '_');
  final plan = await pumpThreeExampleHealthy(
    tester,
    harness,
    officialId,
    targetFrames: 1,
  );
  expect(plan.draws, isNotEmpty);
  final logs = harness.engine
      .peekLogs()
      .map((entry) => entry['msg'] as String)
      .toList(growable: false);
  expect(logs.where((message) => message.contains('RAF tick error')), isEmpty);
  if (warning != null) {
    expect(
      logs.any((message) => message.contains(warning)),
      isTrue,
      reason: '$id must report its bounded native degradation',
    );
  }
  await harness.dispose(tester);
}

void main() {
  const examples = <String, String?>{
    'three-custom-attributes-lines': 'custom line displacement/color',
    'three-loader-gltf-iridescence': 'MeshPhysicalMaterial',
    'three-loader-gltf-sheen': 'MeshPhysicalMaterial',
    'three-materials-cubemap-dynamic': 'WebGLCubeRenderTarget',
    'three-materials-cubemap-mipmaps': 'custom mip levels',
    'three-materials-cubemap-render-to-mipmaps': 'mip levels',
    'three-materials-envmaps-exr': 'PMREM',
    'three-materials-envmaps-hdr': 'PMREM',
    'three-materials-texture-manualmipmap': 'custom mip levels',
    'three-modifier-curve': null,
    'three-modifier-curve-instanced': null,
    'three-multiple-rendertargets': 'MRT attachment 0',
    'three-pmrem-cubemap': 'PMREM',
    'three-pmrem-equirectangular': 'PMREM',
    'three-pmrem-test': 'PMREM',
    'three-postprocessing-3dlut': null,
    'three-rendertarget-texture2darray': 'array render target',
    'three-lightprobe': 'light-probe band 0',
    'three-lightprobe-cubecamera': 'light-probe band 0',
    'three-loader-gltf-anisotropy': 'MeshPhysicalMaterial',
    'three-performance': null,
  };

  for (final entry in examples.entries) {
    testWidgets(
      '${entry.key} renders through its bounded R1 path',
      (tester) => _expectR1Example(tester, entry.key, warning: entry.value),
      timeout: const Timeout(Duration(seconds: 180)),
    );
  }
}
