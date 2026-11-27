import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../../tool/three/bench_1b.dart' show Shim;

// E2E-AA / REG-TEMPORAL (issue #8, segment F4d): the deterministic TAA/SSAA
// + presets battery, driven unchanged through BOTH legs by
// `tool/three/cases_f4d.sh battery` — native 1B (original r186 WebGLRenderer
// over the WebGL2 facade + ANGLE Metal) and the bare-Chrome WebGL2 reference
// (E2E-WEB direct probe). The battery scene
// (tool/three/cases_f4d/f4d_battery/official_module.js) self-verifies and
// publishes its named checks through __corpusExtra:
// - TAA: a direct seek (re-render of the declared 0..7 window + the target
//   frame) equals the sequential run at the f20/f24 checkpoints (hash
//   equality); a history reset reproduces a fresh accumulation of the same
//   window and provably clears (the frozen image differs); clearing history
//   and capturing once is NOT equivalent (E1).
// - SSAA: repeated fresh runs give the same image for the same clock; the
//   clock changes the image.
// - Presets: the documented settings table, an applied preset reports it,
//   and the rendered frame follows the settings.
void main() {
  final missing = Shim.resolveProblem();

  test(
    'E2E-AA/REG-TEMPORAL: the f4d battery is green on the native 1B and '
    'web legs (determinism + presets)',
    () async {
      final pr = Process.run(
        'bash',
        ['tool/three/cases_f4d.sh', 'battery'],
        environment: Platform.environment,
        runInShell: false,
      );
      final r = await pr.timeout(const Duration(minutes: 8));
      // ignore: avoid_print
      print(r.stdout);
      if (r.exitCode != 0) {
        // ignore: avoid_print
        print(r.stderr);
      }
      expect(r.exitCode, 0, reason: 'f4d battery driver gate failed');
      final summary = RegExp(
        r'F4D_SUMMARY battery_checks=(\d+) battery_gate=(\S+)',
      ).firstMatch(r.stdout as String);
      expect(summary, isNotNull, reason: 'F4D_SUMMARY line present');
      expect(
        int.parse(summary!.group(1)!),
        greaterThanOrEqualTo(15),
        reason: 'every named battery check ran (15 total)',
      );
      expect(summary.group(2), 'OK', reason: 'every check passed on both legs');
    },
    // The battery drives the real ANGLE 1B stack; without the dylib the
    // whole file skips on ubuntu, matching the e2e angle1b convention.
    skip: missing,
    timeout: const Timeout(Duration(minutes: 10)),
  );
}
