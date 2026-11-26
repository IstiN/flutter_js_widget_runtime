import 'package:flutter_test/flutter_test.dart';

import '../../tool/three/bench_1b.dart' show Shim;
import '../support/f4c1_widget_helper.dart';

// E2E-DOF-* (issue #8, segment F4c1, AC6): the stock r186 BokehPass on 1B —
// focus, aperture and maxblur each change the image (visible, measured as
// differing-pixel counts) — plus the Bokeh fringe helper on and off (the
// BokehShader2 chromatic-aberration formula as a standalone ShaderPass).
//
// 1. focus 7 (front plane) vs focus 14 (back plane) differ visibly;
// 2. aperture 0 vs aperture 0.03 differ (the blur amount responds);
// 3. maxblur 0.001 vs 0.01 differ (the clamp responds);
// 4. fringe amount 3 changes the image; amount 0 is identity; disabling the
//    pass restores the un-fringed frame exactly;
// 5. web tier: the DOF checkpoint matches Chrome within the corpus tier
//    logic.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final missing = Shim.resolveProblem();
  tearDownAll(disposeF4c1Wires);

  Future<Map<String, dynamic>> run1b() => runF4c1On1B(missing);

  test(
    'E2E-DOF-1: focus/aperture/maxblur each change the rendered image '
    '(visible differences on 1B)',
    () async {
      final state = await run1b();
      final hashes = state['hashes'] as Map<String, dynamic>;
      final diffs = state['diffs'] as Map<String, dynamic>;
      expect(
        hashes['dof_near'],
        isNot(equals(hashes['dof_far'])),
        reason: 'focus 7 vs 14 moves the sharp plane',
      );
      expect(diffs['dof_near_vs_far'] as int, greaterThan(0));
      expect(
        hashes['dof_ap0'],
        isNot(equals(hashes['dof_far'])),
        reason: 'aperture 0 vs 0.03 differs',
      );
      expect(diffs['dof_ap0_vs_far'] as int, greaterThan(0));
      expect(
        hashes['dof_mb'],
        isNot(equals(hashes['dof_far'])),
        reason: 'maxblur 0.001 vs 0.01 differs',
      );
      expect(diffs['dof_mb_vs_far'] as int, greaterThan(0));
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );

  test(
    'E2E-DOF-2: the Bokeh fringe helper responds to the amount and is an '
    'exact identity at 0 / when disabled',
    () async {
      final state = await run1b();
      final hashes = state['hashes'] as Map<String, dynamic>;
      final flags = state['flags'] as Map<String, dynamic>;
      final diffs = state['diffs'] as Map<String, dynamic>;
      expect(
        diffs['fr_on_vs_dof_far'] as int,
        greaterThan(0),
        reason: 'fringe amount 3 changes the image',
      );
      expect(
        flags['fr_zero_amount_equals_off'],
        isTrue,
        reason: 'fringe amount 0 is an identity',
      );
      expect(hashes['fr_off'], equals(hashes['dof_far']));
      expect(
        flags['fr_disabled_equals_off'],
        isTrue,
        reason: 'disabling the pass restores the un-fringed frame',
      );
      expect(hashes['fr_disabled'], equals(hashes['dof_far']));
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );

  test(
    'E2E-DOF-3: the DOF checkpoint matches the Chrome WebGL2 reference '
    'within the corpus tier logic',
    () async {
      final state = await run1b();
      writeOnebDumps(state, ['dof_near', 'fr_on']);
      final webOut = await runF4c1WebAndCompare();
      expect(webOut, contains('F4C1_WEB_OK'));
      final cmpOut = await runF4c1Compare(['dof_near', 'fr_on']);
      final summary = RegExp(
        r'F4C1_SUMMARY total=(\d+) identical=(\d+) tolerance=(\d+) fail=(\d+) missing=(\d+)',
      ).firstMatch(cmpOut);
      expect(summary, isNotNull);
      expect(int.parse(summary!.group(4)!), 0, reason: 'no tier failures');
      expect(int.parse(summary.group(5)!), 0, reason: 'no missing legs');
      final tiers = f4c1Tiers();
      for (final cp in ['dof_near', 'fr_on']) {
        final tier = tiers[cp];
        expect(tier, isNotNull);
        expect(
          tier!['tier'] as String,
          anyOf('PASS_IDENTICAL', 'PASS_TOLERANCE'),
          reason: '$cp tier accepted',
        );
      }
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );
}
