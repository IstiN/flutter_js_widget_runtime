import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../../tool/conformance/conformance_runner.dart';

/// A fixture whose capabilities the runner does not serve yet SKIPs with
/// the reason (issue #9 / F1 runner contract).
/// Writes a minimal fixture declaring an unserved capability.
Directory _tempFixture(Directory out, String id) {
  final dir = Directory('${out.path}/$id')..createSync();
  File('${dir.path}/widget.js').writeAsStringSync(
    "jsr.render({type: 'text', data: 'x'});",
  );
  File(
    '${dir.path}/meta.json',
  ).writeAsStringSync('{"capabilities":["scene3d"]}');
  File('${dir.path}/expected.json').writeAsStringSync('{"actions":[],"expect":{}}');
  return dir;
}

void main() {
  testWidgets('a fixture with an unserved capability skips with the reason', (
    tester,
  ) async {
    final out = Directory.systemTemp.createTempSync('jsr-conf-skip-');
    addTearDown(() => out.deleteSync(recursive: true));
    const id = 'unserved_scene3d';
    final spec = ConformanceSpec(
      fixturesDir: out.parent.path,
      outDir: out.path,
      fixtures: [ConformanceFixtureSpec(id: id, dir: _tempFixture(out, id).path)],
    );

    final outcome = await runConformanceFixture(tester, spec, spec.fixtures.single);

    expect(outcome.status, 'SKIP');
    expect(outcome.error, isNull);
    expect(outcome.skippedReason, contains('scene3d'));

    final result =
        jsonDecode(File('${out.path}/$id.result.json').readAsStringSync())
            as Map<String, dynamic>;
    expect(result['status'], 'SKIP');
    expect(result['platform'], 'flutter');
    expect(result['skippedReason'], contains('scene3d'));
    expect(result['error'], isNull);
  });
}
