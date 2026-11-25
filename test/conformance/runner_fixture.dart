import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../../tool/conformance/conformance_runner.dart';

/// Shared helpers of the seed end-to-end tests (issue #9 / F1).

/// Runs one seed fixture through the runner and returns its `result.json`.
Future<Map<String, dynamic>> runSeedFixture(WidgetTester tester, String id) async {
  final out = Directory.systemTemp.createTempSync('jsr-conf-');
  addTearDown(() => out.deleteSync(recursive: true));
  final dir = 'test/conformance/fixtures/$id';
  final spec = ConformanceSpec(
    fixturesDir: 'test/conformance/fixtures',
    outDir: out.path,
    fixtures: [ConformanceFixtureSpec(id: id, dir: dir)],
  );
  final outcome = await runConformanceFixture(tester, spec, spec.fixtures.single);
  expect(outcome.status, 'DONE', reason: '$id: ${outcome.skippedReason}');
  expect(outcome.error, isNull, reason: '$id: ${outcome.error}');
  return jsonDecode(File('${out.path}/$id.result.json').readAsStringSync())
      as Map<String, dynamic>;
}

/// Depth-first collection of every node with [type].
List<Map<String, dynamic>> collectNodes(Map<String, dynamic> node, String type) {
  final found = <Map<String, dynamic>>[];
  void visit(Map<String, dynamic> current) {
    if (current['type'] == type) found.add(current);
    for (final child in (current['children'] as List).cast<Map>()) {
      visit(child.cast<String, dynamic>());
    }
  }

  visit(node);
  return found;
}
