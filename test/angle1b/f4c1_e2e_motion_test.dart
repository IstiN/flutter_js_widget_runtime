import 'package:flutter_test/flutter_test.dart';

import '../../tool/three/bench_1b.dart' show Shim;
import '../support/f4c1_widget_helper.dart';

// E2E-MOTION-* (issue #8, segment F4c1, ADR-0004 decision 5, ADR-0005): the
// JSR-owned CinematicMotionBlurPass on native 1B (real ANGLE wire) and on
// Web (Chrome WebGL2 through tool/three/cases_f4c1.sh — the SAME checkpoint
// program on both lanes).
//
// 1. the pass runs on 1B with the committed bundle (named-unsupported is
//    absent, all motion artifacts exported);
// 2. shutter 0.1 / 0.5 / 1.0 give distinct images, the blurred-pixel count
//    grows monotonically with the shutter (visible, ordered effect);
// 3. a direct seek to frame 12 equals the sequential run 0..12 (hash);
// 4. a frozen clock repeats identically, the pass carries no cross-frame
//    state (seek-after-sequence == fresh direct), and the GPU accumulation
//    is bit-exact against the linear JS reference (max half-LSB);
// 5. web leg + tier: the same checkpoints in Chrome match the 1B pixels
//    within the corpus tier logic (PASS_IDENTICAL or PASS_TOLERANCE).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final missing = Shim.resolveProblem();
  tearDownAll(disposeF4c1Wires);

  Future<Map<String, dynamic>> run1b() => runF4c1On1B(missing);

  test(
    'E2E-MOTION-1: the CinematicMotionBlurPass runs on native 1B '
    '(named-unsupported absent, motion artifacts exported)',
    () async {
      final state = await run1b();
      final unsupported = (state['unsupported'] as List).cast<String>();
      expect(
        unsupported.where((u) => u.startsWith('motion')),
        isEmpty,
        reason: 'the motion pass must not be named-unsupported on 1B',
      );
      final hashes = state['hashes'] as Map<String, dynamic>;
      for (final key in ['m_sh01', 'm_sh05', 'm_sh10', 'm_seq', 'm_sharp']) {
        expect(hashes[key], isNotNull, reason: '$key exported');
      }
      expect(
        state['historyDepth'],
        40,
        reason: 'the afterimage window declared',
      );
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );

  test(
    'E2E-MOTION-2: shutter 0.1/0.5/1.0 give distinct, monotonically larger '
    'blurs (direct hashes + blurred-pixel counts vs the sharp reference)',
    () async {
      final state = await run1b();
      final hashes = state['hashes'] as Map<String, dynamic>;
      final diffs = state['diffs'] as Map<String, dynamic>;
      final h01 = hashes['m_sh01'],
          h05 = hashes['m_sh05'],
          h10 = hashes['m_sh10'];
      expect(h01, isNot(equals(h05)), reason: 'shutter 0.1 != 0.5');
      expect(h05, isNot(equals(h10)), reason: 'shutter 0.5 != 1.0');
      expect(
        h10,
        isNot(equals(hashes['m_sharp'])),
        reason: 'shutter 1.0 != sharp',
      );
      final d01 = diffs['m_sh01_vs_sharp'] as int;
      final d05 = diffs['m_sh05_vs_sharp'] as int;
      final d10 = diffs['m_sh10_vs_sharp'] as int;
      expect(d01, greaterThan(0), reason: 'shutter 0.1 blurs something');
      expect(d01, lessThan(d05), reason: '0.5 blurs more than 0.1');
      expect(d05, lessThan(d10), reason: '1.0 blurs more than 0.5');
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );

  test(
    'E2E-MOTION-3: a direct seek to frame 12 equals the sequential 0..12 run '
    '(hash equality on 1B)',
    () async {
      final state = await run1b();
      final flags = state['flags'] as Map<String, dynamic>;
      final hashes = state['hashes'] as Map<String, dynamic>;
      expect(
        flags['m_direct_equals_seq'],
        isTrue,
        reason: 'direct(12) must equal sequential 0..12',
      );
      expect(hashes['m_seq'], equals(hashes['m_sh05']));
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );

  test(
    'E2E-MOTION-4: frozen clock is stable, the pass is stateless, and the '
    'GPU accumulation is exact against the linear JS reference',
    () async {
      final state = await run1b();
      final flags = state['flags'] as Map<String, dynamic>;
      final diffs = state['diffs'] as Map<String, dynamic>;
      expect(
        flags['m_frozen_equal'],
        isTrue,
        reason: 'a frozen clock changes nothing',
      );
      expect(
        flags['m_stateless_equal'],
        isTrue,
        reason: 'seek-after-sequence equals a fresh direct render',
      );
      expect(
        flags['m_accumulation_exact'],
        isTrue,
        reason: 'the accumulation target equals the linear JS average',
      );
      expect(diffs['m_pass_vs_linear_ref'], 0);
      expect(
        diffs['m_pass_vs_linear_ref_max'],
        lessThan(0.6),
        reason: 'max half-float LSB',
      );
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );

  test(
    'E2E-MOTION-5: the same motion checkpoints on Web (Chrome WebGL2) match '
    'the 1B pixels within the corpus tier logic',
    () async {
      final state = await run1b();
      writeOnebDumps(state, ['m_sh05']);
      final webOut = await runF4c1WebAndCompare();
      expect(webOut, contains('F4C1_WEB_OK'));
      final cmpOut = await runF4c1Compare(['m_sh05']);
      final summary = RegExp(
        r'F4C1_SUMMARY total=(\d+) identical=(\d+) tolerance=(\d+) fail=(\d+) missing=(\d+)',
      ).firstMatch(cmpOut);
      expect(summary, isNotNull, reason: 'F4C1_SUMMARY line present');
      expect(int.parse(summary!.group(4)!), 0, reason: 'no tier failures');
      expect(int.parse(summary.group(5)!), 0, reason: 'no missing legs');
      final tiers = f4c1Tiers();
      final tier = tiers['m_sh05'];
      expect(tier, isNotNull);
      expect(
        (tier!['tier'] as String),
        anyOf('PASS_IDENTICAL', 'PASS_TOLERANCE'),
        reason: 'motion tier accepted',
      );
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );
}
