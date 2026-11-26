import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../../tool/three/bench_1b.dart' show Shim;

// E2E-BLOOM-* / REG-VISUAL-BLOOM (issue #8, F4b, AC1): the STOCK pinned
// `webgl_postprocessing_unreal_bloom` example — unchanged upstream scene and
// addon logic — runs through the full 1B stack (facade -> G1 -> ANGLE) and
// in bare headless Chrome WebGL2, in the tiers of the corpus driver
// (`tool/three/corpus_1b.sh`, the exact driver the quality-macos job gates
// with):
//
//   E2E-BLOOM-1       the 1B leg renders non-empty reference image + RGBA
//                     readback over ANGLE
//   E2E-BLOOM-2       the web leg renders non-empty in Chrome on real
//                     WebGL2 with a clean E2E-WEB direct probe
//   REG-VISUAL-BLOOM  the 1B-vs-Chrome compare holds its accepted tier
//                     ("exact": PASS_IDENTICAL, the documented per-GPU
//                     tolerance table in docs/angle_1b.md)
void main() {
  final missing = Shim.resolveProblem();

  Future<ProcessResult>? run;
  Future<ProcessResult> driver() => Process.run(
    'bash',
    ['tool/three/corpus_1b.sh', 'three-postprocessing-unreal-bloom'],
    environment: Platform.environment,
    runInShell: false,
  ).timeout(const Duration(minutes: 6));

  test(
    'E2E-BLOOM-1: the stock unreal-bloom example renders non-empty over '
    'ANGLE on 1B (reference image + RGBA readback)',
    () async {
      if (missing != null) return;
      final r = await (run ??= driver());
      expect(r.exitCode, 0, reason: 'corpus driver gate failed');
      final out = '/tmp/a1b_corpus/three-postprocessing-unreal-bloom';
      final png = File('$out/1b.png');
      final rgba = File('$out/1b_run1.rgba');
      expect(png.existsSync(), isTrue, reason: 'the 1B reference image exists');
      expect(
        png.lengthSync(),
        greaterThan(1000),
        reason: 'the 1B reference image is non-empty',
      );
      expect(rgba.existsSync(), isTrue, reason: 'the RGBA readback exists');
      expect(
        rgba.lengthSync(),
        320 * 240 * 4,
        reason: 'full-frame RGBA readback of the presented surface',
      );
      final bytes = rgba.readAsBytesSync();
      var lit = 0;
      for (var i = 0; i < bytes.length; i += 4) {
        if (bytes[i] > 8 || bytes[i + 1] > 8 || bytes[i + 2] > 8) lit++;
      }
      expect(
        lit,
        greaterThan(500),
        reason: 'the bloom scene has rendered content, not a black frame',
      );
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );

  test(
    'E2E-BLOOM-2: the same stock example renders non-empty in headless '
    'Chrome on real WebGL2 with a clean direct-web probe',
    () async {
      if (missing != null) return;
      final r = await (run ??= driver());
      expect(
        r.exitCode,
        0,
        reason:
            'corpus driver gate failed\n--- stdout ---\n${r.stdout}\n'
            '--- stderr ---\n${r.stderr}',
      );
      final out = '/tmp/a1b_corpus/three-postprocessing-unreal-bloom';
      final web = File('$out/web.rgba');
      expect(
        web.existsSync(),
        isTrue,
        reason: 'the web reference readback exists',
      );
      expect(
        web.lengthSync(),
        greaterThanOrEqualTo(320 * 240 * 4),
        reason: 'the web readback is a full frame',
      );
      final status =
          jsonDecode(File('$out/status_web.json').readAsStringSync())
              as Map<String, dynamic>;
      final direct = status['direct'] as Map<String, dynamic>;
      expect(
        direct['barePage'],
        isTrue,
        reason: 'bare page (no Dart runtime): $status',
      );
      expect(
        direct['no1bLane'],
        isTrue,
        reason: 'no ANGLE 1B lane on the web leg: $status',
      );
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );

  test(
    'REG-VISUAL-BLOOM: the 1B vs Chrome compare holds its accepted tier '
    '(exact: PASS_IDENTICAL, per-GPU table docs/angle_1b.md)',
    () async {
      if (missing != null) return;
      final r = await (run ??= driver());
      final out = r.stdout as String;
      // ignore: avoid_print
      print(
        out
            .split('\n')
            .where(
              (l) =>
                  l.contains('unreal-bloom') || l.startsWith('CORPUS_SUMMARY'),
            )
            .join('\n'),
      );
      final row = out
          .split('\n')
          .firstWhere(
            (l) => l.startsWith('three-postprocessing-unreal-bloom'),
            orElse: () => '',
          );
      expect(row, isNotEmpty, reason: 'the bloom row was measured');
      expect(
        row,
        contains('PASS_IDENTICAL'),
        reason: 'accepted tier exact; measured: $row',
      );
      expect(row, contains('accepted:exact'));
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );
}
