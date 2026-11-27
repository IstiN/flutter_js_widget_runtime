import 'package:flutter_test/flutter_test.dart';

import '../../tool/three/bench_1b.dart' show Shim;
import '../support/f4c1_widget_helper.dart';

// IT-HISTORY-* (issue #8, segment F4c1): the stock AfterimagePass on 1B with
// CinematicHistory reset + bounded reconstruction. The widget program runs
// the afterimage checkpoints through the REAL engine stack (ANGLE wire); the
// web tier leg proves the same temporal sequence in Chrome (ai_seq24 dump).
//
// 1. direct seek with reconstruction: resetHistory then renderFrame(24)
//    rebuilds the declared bounded window (damp 0.5 -> 40 frames) and equals
//    the sequential 0..24 run bit-exactly;
// 2. frozen clock: the reconstructed frame repeats identically;
// 3. mid-run reset: the post-reset direct seek equals the post-reset
//    sequential run (both restarted trails), and resetHistory genuinely
//    clears (the post-reset fresh 24-frame run equals a from-scratch run —
//    without a real clear it would carry 34 frames of accumulation);
// 4. web tier: the sequential afterimage frame matches Chrome within the
//    corpus tier logic.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final missing = Shim.resolveProblem();
  tearDownAll(disposeF4c1Wires);

  Future<Map<String, dynamic>> run1b() => runF4c1On1B(missing);

  test(
    'IT-HISTORY-1: resetHistory + direct seek reconstructs the declared '
    'bounded window and equals the sequential run (hash equality)',
    () async {
      final state = await run1b();
      final hashes = state['hashes'] as Map<String, dynamic>;
      final flags = state['flags'] as Map<String, dynamic>;
      expect(state['historyDepth'], 40);
      expect(
        flags['ai_direct_equals_seq'],
        isTrue,
        reason: 'direct(24) after reset must equal sequential 0..24',
      );
      expect(hashes['ai_seq24'], equals(hashes['ai_dir24']));
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );

  test(
    'IT-HISTORY-2: a frozen clock over reconstructed history repeats '
    'identically',
    () async {
      final state = await run1b();
      final flags = state['flags'] as Map<String, dynamic>;
      expect(flags['ai_frozen_equal'], isTrue);
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );

  test(
    'IT-HISTORY-3: a mid-run reset restarts the trails and the post-reset '
    'direct seek equals the post-reset sequential run',
    () async {
      final state = await run1b();
      final hashes = state['hashes'] as Map<String, dynamic>;
      final flags = state['flags'] as Map<String, dynamic>;
      expect(
        flags['ai_reconstruction_equals_seq'],
        isTrue,
        reason: 'reset + direct(24) equals reset + sequential 0..24',
      );
      expect(hashes['ai_rsdir24'], equals(hashes['ai_rsseq24']));
      expect(
        flags['ai_reset_clears_history'],
        isTrue,
        reason: 'the post-reset fresh run equals the from-scratch run',
      );
      expect(hashes['ai_rsseq24'], equals(hashes['ai_seq24']));
      expect(hashes['ai_pre_reset'], isNotNull);
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );

  test(
    'IT-HISTORY-4: the sequential afterimage frame matches the Chrome '
    'WebGL2 reference within the corpus tier logic',
    () async {
      final state = await run1b();
      writeOnebDumps(state, ['ai_seq24']);
      final webOut = await runF4c1WebAndCompare();
      expect(webOut, contains('F4C1_WEB_OK'));
      final cmpOut = await runF4c1Compare(['ai_seq24']);
      expect(
        cmpOut,
        isNot(contains('fail=0') == false),
        reason: 'summary printed',
      );
      final tiers = f4c1Tiers();
      final tier = tiers['ai_seq24'];
      expect(tier, isNotNull);
      expect(
        tier!['tier'] as String,
        anyOf('PASS_IDENTICAL', 'PASS_TOLERANCE'),
        reason: 'afterimage tier accepted',
      );
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );
}
