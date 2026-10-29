import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime_example/three_example.dart';

void main() {
  test('generated official examples have selectable runtime paths', () {
    const examples = {
      ThreeExampleSelection.minecraft: 'webgl_geometry_minecraft',
      ThreeExampleSelection.geometryColors: 'webgl_geometry_colors',
      ThreeExampleSelection.linesColors: 'webgl_lines_colors',
      ThreeExampleSelection.bufferGeometryUint: 'webgl_buffergeometry_uint',
      ThreeExampleSelection.bufferGeometryIndexed:
          'webgl_buffergeometry_indexed',
      ThreeExampleSelection.bufferGeometryLinesIndexed:
          'webgl_buffergeometry_lines_indexed',
      ThreeExampleSelection.bufferGeometryPoints: 'webgl_buffergeometry_points',
      ThreeExampleSelection.geometryTerrainRaycast:
          'webgl_geometry_terrain_raycast',
      ThreeExampleSelection.mathOrientationTransform:
          'webgl_math_orientation_transform',
    };
    const requestedExample = String.fromEnvironment('JSR_THREE_EXAMPLE');
    expect(ThreeExampleSelection.values, hasLength(examples.length));
    expect(
      ThreeExampleSelection.initial.exampleId,
      requestedExample.isEmpty ? 'webgl_geometry_minecraft' : requestedExample,
    );
    expect(ThreeExampleSelection.geometryColors.label, 'Vertex Colors');
    expect(
      ThreeExampleSelection.values
          .map((selection) => selection.widgetId)
          .toSet(),
      hasLength(examples.length),
    );
    expect(
      ThreeExampleSelection.values
          .map((selection) => selection.exampleId)
          .toSet(),
      hasLength(examples.length),
    );

    for (final selection in ThreeExampleSelection.values) {
      final widget = File(selection.assetPath);
      expect(widget.existsSync(), isTrue, reason: selection.assetPath);
      final prepareManifest =
          jsonDecode(
                File(
                  '${widget.parent.path}/prepare_manifest.json',
                ).readAsStringSync(),
              )
              as Map<String, dynamic>;
      expect(prepareManifest['id'], selection.widgetId);
      expect(prepareManifest['example'], selection.exampleId);
      expect(prepareManifest['example'], examples[selection]);
      expect(prepareManifest['build']['offline'], isTrue);
    }
  });

  test('FPS sampler uses presented frames and handles counter resets', () {
    final sampler = ThreeFpsSampler();
    final start = DateTime.utc(2026);

    expect(sampler.sample(100, start), isNull);
    expect(
      sampler.sample(130, start.add(const Duration(milliseconds: 500))),
      60,
    );
    expect(sampler.sample(160, start.add(const Duration(seconds: 1))), 60);
    expect(sampler.sample(160, start.add(const Duration(seconds: 1))), 60);
    expect(sampler.sample(2, start.add(const Duration(seconds: 2))), isNull);
    expect(sampler.sample(62, start.add(const Duration(seconds: 3))), 60);
  });

  testWidgets('official widget sources are declared in the asset bundle', (
    tester,
  ) async {
    for (final selection in ThreeExampleSelection.values) {
      final source = await tester.runAsync(
        () => rootBundle.loadString(selection.assetPath),
      );
      expect(source, isNotEmpty, reason: selection.assetPath);
    }
  });
}
