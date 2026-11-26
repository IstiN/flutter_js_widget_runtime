import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../../tool/three/bench_1b.dart' show Shim;
import '../support/three_1b_engine.dart';

// E2E-SHOWCASE-1 (issue #8, F4a, ADR-0004 decisions 2+3): the showcase
// renders from the CORE copy. Two legs:
//
// 1. Native 1B (quality-macos, real ANGLE wire): the committed showcase
//    widget — which reads `jsr.three.cinematic` since F4a — boots through
//    the real engine stack with the committed three bundle and renders over
//    ANGLE. The exported `surface: 'core'` marker proves there is no
//    private pipeline copy left in the example.
// 2. Web (headless Chrome through tool/three/showcase_1b.sh): the CORE
//    cinematic module and the LEGACY private copy (materialized from the
//    pinned base commit) render the same named checkpoints HASH-EQUAL in
//    the same Chrome session.
void main() {
  // The showcase widget's boot line calls requestAnimationFrame; the RAF
  // scheduler reads WidgetsBinding.instance, so the test binding must exist
  // even though this file only uses plain `test`s.
  TestWidgetsFlutterBinding.ensureInitialized();
  final bundle = File('assets/three/jsr_three_web.js').readAsStringSync();
  final showcaseWidget = File(
    'example/widgets/three-cinematic-showcase/widget.js',
  ).readAsStringSync();
  // The widget derives its canvas from jsr.viewport (320x198 here); the ANGLE
  // IOSurface below is created at exactly that size — a larger canvas than
  // the surface crashes the shell process on present.
  const viewportPrelude =
      "jsr.viewport = function () { return { width: 344, height: 214 }; };\n";
  final missing = Shim.resolveProblem();

  test(
    'E2E-SHOWCASE-1: the showcase widget renders from the core copy on '
    'native 1B (surface marker core, frame 0 presented over ANGLE)',
    () async {
      final (wire, reported, state, logs) = await run1bRealEngine(
        '$viewportPrelude$showcaseWidget',
        bundle,
        width: 320,
        height: 198,
      );
      addTearDown(wire.dispose);
      expect(reported?.isAngle1b, isTrue);
      expect(wire.bootstrapEnsured, isTrue);
      expect(
        state?['surface'],
        'core',
        reason: 'the widget must run on jsr.three.cinematic (no private copy)',
      );
      expect(
        state?['status'],
        startsWith('lane:'),
        reason: 'the first paint went through the core pipeline',
      );
      expect(state?['error'], isNull);
      expect(
        widgetErrorLogs(logs),
        isEmpty,
        reason: 'no composite error may reach the __jsr_log lane',
      );
      expect(
        wire.dispatches1B,
        isNotEmpty,
        reason: 'the presented frame reached the ANGLE wire',
      );
      expect(
        state?['frame'],
        isNonNegative,
        reason: 'the RAF loop kept presenting after the first paint',
      );
    },
    skip: missing,
  );

  test(
    'E2E-SHOWCASE-1: the core pipeline and the legacy private copy render '
    'hash-equal frames at named checkpoints (same Chrome session)',
    () async {
      final pr = Process.run(
        'bash',
        ['tool/three/showcase_1b.sh'],
        environment: Platform.environment,
        runInShell: false,
      );
      final r = await pr.timeout(const Duration(minutes: 6));
      // ignore: avoid_print
      print('E2E-SHOWCASE-1 web driver exit=${r.exitCode}');
      // ignore: avoid_print
      print(r.stdout);
      if (r.exitCode != 0) {
        // ignore: avoid_print
        print(r.stderr);
      }
      expect(r.exitCode, 0, reason: 'showcase driver gate failed');
      final summary = RegExp(
        r'SHOWCASE_SUMMARY checkpoints=(\d+) match=(\d+)',
      ).firstMatch(r.stdout as String);
      expect(summary, isNotNull, reason: 'SHOWCASE_SUMMARY line present');
      final checks = int.parse(summary!.group(1)!);
      final match = int.parse(summary.group(2)!);
      expect(
        checks,
        greaterThanOrEqualTo(4),
        reason: 'the named checkpoints ran',
      );
      expect(match, checks, reason: 'every checkpoint is hash-equal');
    },
    // The web leg needs the Chrome reference channel; it runs where the
    // corpus runs (quality-macos). Without the ANGLE dylib the whole
    // file skips on ubuntu, matching e2e_examples_1_test.dart.
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );
}
