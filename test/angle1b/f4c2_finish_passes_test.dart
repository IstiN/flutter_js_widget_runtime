import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../support/corpus_driver.dart';

// E2E-FINISH / REG-VISUAL-FINISH (issue #8 AC5, F4c2): the finishing-pass
// corpus gate runs end to end inside the suite through the SAME slice
// driver the quality-macos job gates with (`tool/three/cases_f4c2.sh`).
// The full nine-pass matrix (six stock examples plus five case scenes,
// SMAA/FXAA/MSAA/LUT/Film/Vignette/selective bloom/SSAO/GTAO) runs as the
// CI corpus step; this proof executes two stock-pass case scenes with no
// external assets (FilmPass grain at a fixed 1/24 s composer delta,
// VignetteShader at offset 0.95 / darkness 1.2) through the real 1B stack
// (facade -> G1 -> ANGLE) and the bare-Chrome WebGL2 reference; both
// measure PASS_IDENTICAL locally.
void main() {
  test(
    'E2E-FINISH: film + vignette case scenes match Chrome WebGL2 '
    '(PASS_IDENTICAL, direct web probe clean)',
    () async {
      await expectCorpusDriverGate(
        driver: 'tool/three/cases_f4c2.sh',
        ids: const ['cases-f4c2-film', 'cases-f4c2-vignette'],
        summaryLine: 'F4C2_SUMMARY',
        reason: 'f4c2 driver gate failed',
      );
    },
    // The driver spawns esbuild + dart + a browser per scene; on a
    // contended CI instance that exceeds flutter_test's default 30 s
    // (same reasoning as the corpus fixture proof). Assertions stay
    // strict.
    timeout: const Timeout(Duration(minutes: 6)),
    skip:
        File(
          'packages/jsr_three_angle/native/angle/libangle_1b.dylib',
        ).existsSync()
        ? null
        : 'requires the ANGLE 1B dylib (JSR_REQUIRE_ANGLE hosts)',
  );
}
