import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime_example/three_example.dart';

void main() {
  test('generated official examples have selectable runtime paths', () {
    const examples = {
      ThreeExampleSelection.minecraft: 'webgl_geometry_minecraft',
      ThreeExampleSelection.geometryColors: 'webgl_geometry_colors',
      ThreeExampleSelection.linesColors: 'webgl_lines_colors',
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
}
