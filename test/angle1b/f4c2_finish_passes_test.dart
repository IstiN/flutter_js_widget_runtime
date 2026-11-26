import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

// E2E-FINISH / REG-VISUAL-FINISH (issue #8 AC5, F4c2): the finishing-pass
// corpus gate runs end to end inside the suite through the SAME slice
// driver the quality-macos job gates with (`tool/three/cases_f4c2.sh`).
// The full nine-pass matrix runs as the CI corpus step; this test proves
// two stock-pass case scenes (FilmPass grain, VignetteShader) through the
// real 1B stack (facade -> G1 -> ANGLE) and the bare-Chrome WebGL2
// reference: the driver exits 0 and both scenes measure PASS_IDENTICAL
// with a clean E2E_WEB_DIRECT probe.
//
// Needs the ANGLE 1B dylib + a WebGL2-capable browser channel (the CI
// quality-macos runner has both; locally set JSR_WEBGL_REF_CHANNEL=chromium).
void main() {
  final dylib = File(
    'packages/jsr_three_angle/native/angle/libangle_1b.dylib',
  ).existsSync();
  test(
    'E2E-FINISH: film + vignette case scenes match Chrome WebGL2 '
    '(PASS_IDENTICAL, direct web probe clean)',
    () async {
      final pr = Process.run(
        'bash',
        ['tool/three/cases_f4c2.sh', 'cases-f4c2-film', 'cases-f4c2-vignette'],
        environment: Platform.environment,
        runInShell: false,
      );
      final r = await pr.timeout(const Duration(minutes: 6));
      // ignore: avoid_print
      print('E2E-FINISH f4c2 driver exit=${r.exitCode}');
      // ignore: avoid_print
      print(r.stdout);
      if (r.exitCode != 0) {
        // ignore: avoid_print
        print(r.stderr);
      }
      expect(r.exitCode, 0, reason: 'f4c2 driver gate failed');
      final out = r.stdout as String;
      final summary = RegExp(
        r'F4C2_SUMMARY total=(\d+) exact=(\d+) tolerance=(\d+) '
        r'documented_limit=(\d+) fail=(\d+) skip=(\d+) gate_fail=(\d+) direct_fail=(\d+)',
      ).firstMatch(out);
      expect(summary, isNotNull, reason: 'F4C2_SUMMARY line present');
      final groups = summary!
          .groups(const [1, 2, 3, 4, 5, 6, 7, 8])
          .map((g) => int.parse(g!))
          .toList();
      expect(groups[0], 2, reason: 'both case scenes ran');
      expect(groups[4], 0, reason: 'no failures');
      expect(groups[5], 0, reason: 'no skips');
      expect(groups[6], 0, reason: 'no tier-gate violations');
      expect(groups[7], 0, reason: 'E2E_WEB_DIRECT probe clean');
      expect(groups[1] + groups[2], 2, reason: 'both scenes in accepted tiers');
    },
    // The driver spawns esbuild + dart + a browser per scene; on a
    // contended CI instance that exceeds flutter_test's default 30 s
    // (same reasoning as e2e_examples_1_test.dart). Assertions stay strict.
    timeout: const Timeout(Duration(minutes: 6)),
    skip: dylib
        ? null
        : 'requires the ANGLE 1B dylib (JSR_REQUIRE_ANGLE hosts)',
  );
}
