import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../support/corpus_driver.dart';

// E2E-EXAMPLES-RAWGL / E2E-EXAMPLES-READBACK (issue #7 AC5, F2d): the raw
// fixtures of the starter corpus run through the REAL 1B stack (facade ->
// G1 -> ANGLE) and the bare-Chrome WebGL2 reference in the SAME corpus
// driver the quality-macos job gates with (`tool/three/corpus_1b.sh`).
// The full named-scene matrix runs as the CI corpus step; this proof runs
// the two fixtures inside the suite: the driver exits 0 and both fixtures
// measure PASS_IDENTICAL with a clean E2E_WEB_DIRECT probe.
void main() {
  test(
    'E2E-EXAMPLES: raw GL + readback fixtures match Chrome WebGL2 '
    '(PASS_IDENTICAL, direct web probe clean)',
    () async {
      await expectCorpusDriverGate(
        driver: 'tool/three/corpus_1b.sh',
        ids: const ['fixture-rawgl', 'fixture-readback'],
        summaryLine: 'CORPUS_SUMMARY',
      );
    },
    // The driver spawns npm/esbuild + dart + Chrome per fixture; on a
    // contended CI instance that takes well over flutter_test's default
    // 30 s per test (measured: TimeoutException after 30 s on run
    // 45734063417 while the subprocess itself was inside its own 6-minute
    // budget). The tier gate itself is unaffected — the assertions live in
    // the shared helper and stay strict.
    timeout: const Timeout(Duration(minutes: 6)),
    skip:
        !File(
          'packages/jsr_three_angle/native/angle/libangle_1b.dylib',
        ).existsSync()
        ? 'requires the ANGLE 1B dylib (JSR_REQUIRE_ANGLE hosts)'
        : null,
  );
}
