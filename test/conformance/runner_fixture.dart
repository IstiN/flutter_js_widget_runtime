import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import '../../tool/conformance/conformance_runner.dart';

/// Minimal backend stub for action-verb tests (unused verbs are no-ops).
class RecordingBackend implements JsWidgetEngineBackend {
  final hostEvents = <String>[];

  @override
  void dispatchHostEvent(String target, Map<String, dynamic> payload) {
    hostEvents.add(target);
  }

  @override
  Future<void> callEvent(
    String actionId, [
    Map<String, dynamic>? payload,
  ]) async {}

  @override
  void setEngineInstanceId(String instanceId) {}

  @override
  bool get hasSyncBinaryLane => false;

  @override
  void prepareThreeBackend(JsThreeBackendSelection selection) {}

  @override
  List<Map<String, dynamic>> peekLogs() => const [];

  @override
  JsVoxelWorld get voxelWorld => JsVoxelWorld();

  @override
  Future<void> init() async {}
  @override
  Future<void> run(
    String widgetJs, {
    String? hostBootstrapJs,
    Map<String, dynamic> initialTheme = const {},
  }) async {}
  @override
  void updateTheme(Map<String, dynamic> colors) {}
  @override
  Future<void> dispose() async {}
  @override
  List<Map<String, dynamic>> flushLogs() => const [];
  @override
  Map<String, dynamic>? get exportedState => null;
}

/// Shared helpers of the seed end-to-end tests (issue #9 / F1).

/// Builds a throwaway fixture directory on the fly and runs it through the
/// runner. Used by the issue regression tests (no kit fixture needed).
Future<Map<String, dynamic>> runInlineFixture(
  WidgetTester tester, {
  required String id,
  required String widgetJs,
  Map<String, dynamic> meta = const <String, dynamic>{},
  Map<String, dynamic> expected = const <String, dynamic>{},
  Map<String, String> files = const <String, String>{},
}) async {
  final root = Directory.systemTemp.createTempSync('jsr-inline-');
  addTearDown(() => root.deleteSync(recursive: true));
  final dir = Directory('${root.path}/$id')..createSync();
  File('${dir.path}/widget.js').writeAsStringSync(widgetJs);
  File('${dir.path}/meta.json').writeAsStringSync(
    jsonEncode(<String, dynamic>{
      'categories': <String>['L1'],
      'capabilities': <String>[],
      'ignore': <String>[],
      'nodes': <String>[],
      'mock': <String, dynamic>{},
      ...meta,
    }),
  );
  File('${dir.path}/expected.json').writeAsStringSync(
    jsonEncode(<String, dynamic>{
      'actions': <dynamic>[],
      'expect': <String, dynamic>{},
      ...expected,
    }),
  );
  for (final entry in files.entries) {
    File('${dir.path}/${entry.key}').writeAsStringSync(entry.value);
  }
  final spec = ConformanceSpec(
    fixturesDir: root.path,
    outDir: root.path,
    fixtures: [ConformanceFixtureSpec(id: id, dir: dir.path)],
  );
  final outcome = await runConformanceFixture(
    tester,
    spec,
    spec.fixtures.single,
  );
  expect(outcome.status, 'DONE', reason: '$id: ${outcome.skippedReason}');
  return jsonDecode(File('${dir.path}/../$id.result.json').readAsStringSync())
      as Map<String, dynamic>;
}

/// Depth-first collection of every node with [type].
List<Map<String, dynamic>> collectNodes(
  Map<String, dynamic> node,
  String type,
) {
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
