import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../../tool/conformance/conformance_runner.dart';

/// A fixture whose capabilities the runner does not serve yet SKIPs with
/// the reason (issue #9 / F1 runner contract).
void main() {
  testWidgets('scene3d_hostcontract skips with the capability reason', (
    tester,
  ) async {
    final out = Directory.systemTemp.createTempSync('jsr-conf-skip-');
    addTearDown(() => out.deleteSync(recursive: true));
    const id = 'scene3d_hostcontract';
    final spec = ConformanceSpec(
      fixturesDir: 'test/conformance/fixtures',
      outDir: out.path,
      fixtures: [
        ConformanceFixtureSpec(id: id, dir: 'test/conformance/fixtures/$id'),
      ],
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
