import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// Runs a slice corpus driver end to end inside the flutter test suite and
/// asserts its acceptance gate. The CI corpus steps run the full id matrix
/// in the `quality-macos` job; these in-suite proofs execute the SAME
/// driver script on a subset and require: exit 0, every id ran (no
/// skips), no failures, no tier-gate violations, and a clean E2E_WEB
/// direct-web probe on every leg, with every id landing in an accepted
/// tier (`exact` + `tolerance` counts).
///
/// Drivers print a `<summaryLine> total=.. exact=.. tolerance=..
/// documented_limit=.. fail=.. skip=.. gate_fail=.. direct_fail=..` line.
///
/// Needs the prerequisites of the driver being invoked (for the 1B corpus
/// drivers: the ANGLE 1B dylib and a WebGL2-capable browser channel; the
/// CI quality-macos runner has both, locally set
/// JSR_WEBGL_REF_CHANNEL=chromium).
Future<void> expectCorpusDriverGate({
  required String driver,
  required List<String> ids,
  required String summaryLine,
  String? reason,
}) async {
  final pr = Process.run(
    'bash',
    [driver, ...ids],
    environment: Platform.environment,
    runInShell: false,
  );
  final r = await pr.timeout(const Duration(minutes: 6));
  // ignore: avoid_print
  print('$driver exit=${r.exitCode}');
  // ignore: avoid_print
  print(r.stdout);
  if (r.exitCode != 0) {
    // ignore: avoid_print
    print(r.stderr);
  }
  expect(r.exitCode, 0, reason: reason ?? 'corpus driver gate failed');
  final out = r.stdout as String;
  final groups = RegExp(
    '$summaryLine total=(\\d+) exact=(\\d+) tolerance=(\\d+) '
    r'documented_limit=(\d+) fail=(\d+) skip=(\d+) gate_fail=(\d+) direct_fail=(\d+)',
  ).firstMatch(out);
  expect(groups, isNotNull, reason: '$summaryLine line present');
  final g = groups!
      .groups(const [1, 2, 3, 4, 5, 6, 7, 8])
      .map((v) => int.parse(v!))
      .toList();
  expect(g[0], ids.length, reason: 'every id ran');
  expect(g[4], 0, reason: 'no failures');
  expect(g[5], 0, reason: 'no skips');
  expect(g[6], 0, reason: 'no tier-gate violations');
  expect(g[7], 0, reason: 'E2E_WEB_DIRECT probe clean');
  expect(g[1] + g[2], ids.length, reason: 'every id in an accepted tier');
}
