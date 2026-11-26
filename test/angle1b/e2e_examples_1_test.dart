import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

// E2E-EXAMPLES-RAWGL / E2E-EXAMPLES-READBACK (issue #7 AC5, F2d): the raw
// fixtures of the starter corpus run through the REAL 1B stack (facade ->
// G1 -> ANGLE) and the bare-Chrome WebGL2 reference in the SAME corpus
// driver the quality-macos job gates with (`tool/three/corpus_1b.sh`).
// The full named-scene matrix runs as the CI corpus step; this test proves
// the fixture tier gate end to end inside the suite: the driver exits 0 and
// both fixtures measure PASS_IDENTICAL with a clean E2E_WEB_DIRECT probe.
//
// Needs the ANGLE 1B dylib + a WebGL2-capable browser channel (the CI
// quality-macos runner has both; locally set JSR_WEBGL_REF_CHANNEL=chromium).
void main() {
  final dylib = File(
    'packages/jsr_three_angle/native/angle/libangle_1b.dylib',
  ).existsSync();
  test(
    'E2E-EXAMPLES: raw GL + readback fixtures match Chrome WebGL2 '
    '(PASS_IDENTICAL, direct web probe clean)',
    () async {
      final pr = Process.run(
        'bash',
        ['tool/three/corpus_1b.sh', 'fixture-rawgl', 'fixture-readback'],
        environment: Platform.environment,
        runInShell: false,
      );
      final r = await pr.timeout(const Duration(minutes: 6));
      // ignore: avoid_print
      print('E2E-EXAMPLES corpus driver exit=${r.exitCode}');
      // ignore: avoid_print
      print(r.stdout);
      if (r.exitCode != 0) {
        // ignore: avoid_print
        print(r.stderr);
      }
      expect(r.exitCode, 0, reason: 'corpus driver gate failed');
      final out = r.stdout as String;
      final summary = RegExp(
        r'CORPUS_SUMMARY total=(\d+) exact=(\d+) tolerance=(\d+) '
        r'documented_limit=(\d+) fail=(\d+) skip=(\d+) gate_fail=(\d+) direct_fail=(\d+)',
      ).firstMatch(out);
      expect(summary, isNotNull, reason: 'CORPUS_SUMMARY line present');
      final groups = summary!.groups(
        const [1, 2, 3, 4, 5, 6, 7, 8],
      ).map((g) => int.parse(g!)).toList();
      expect(groups[0], 2, reason: 'both fixtures ran');
      expect(groups[4], 0, reason: 'no failures');
      expect(groups[5], 0, reason: 'no skips');
      expect(groups[6], 0, reason: 'no tier-gate violations');
      expect(groups[7], 0, reason: 'E2E_WEB_DIRECT probe clean');
      expect(groups[1] + groups[2], 2, reason: 'both fixtures accepted tiers');
    },
    // The driver spawns npm/esbuild + dart + Chrome per fixture; on a
    // contended CI instance that takes well over flutter_test's default
    // 30 s per test (measured: TimeoutException after 30 s on run
    // 45734063417 while the subprocess itself was inside its own 6-minute
    // budget). The tier gate itself is unaffected — the assertions below
    // stay strict.
    timeout: const Timeout(Duration(minutes: 6)),
    skip: dylib ? null : 'requires the ANGLE 1B dylib (JSR_REQUIRE_ANGLE hosts)',
  );
}
