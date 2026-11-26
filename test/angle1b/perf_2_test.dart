import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../../tool/three/bench_1b.dart';

// PERF-2 (issue #7, F2 batching row): the p95 of a 500-draw-call frame
// (encode + transport + native submit) is within the budget on the macOS
// host that runs the bench. The measurement of record is the standalone
// bench tool (`dart run tool/three/bench_1b.dart`, also its own
// quality-macos CI step): a DEDICATED process. The in-suite measurement
// inside the flutter-test harness is not that host measurement — shared
// runners put ALL of its windows above the budget while the dedicated
// process stays under it on the same runner.
//
// The gate is the MEDIAN window WALL p95 against the CALIBRATED budget
// (BENCH_P95_MS <= BENCH_BUDGET_MS): the CI runner pool's instances swing
// between quiet and CPU-contended (run 45731410438 inflated even thread
// CPU p95 to 4.77 ms with unchanged code), so a fixed budget measures the
// host, not the code. The budget scales with the calibration reference
// taken at bench start (min of 5 runs x 100 no-draw frames through the
// same 1B path) — the draw work is what the reference does not contain,
// so a real regression still fails. No best-of-N: the gate measurement is
// never repeated; only the calibration takes a minimum over its own runs.
void main() {
  final missing = Shim.resolveProblem();
  test('PERF-2: median window wall p95 stays within the calibrated budget',
      () async {
    final r = await Process.run('dart', const ['run', 'tool/three/bench_1b.dart'],
        stdoutEncoding: utf8, stderrEncoding: utf8);
    // ignore: avoid_print
    print(r.stdout);
    // The tool itself exits 1 unless RAWGL_MATCH, flushes <= 1 and the
    // median window wall p95 <= calibrated budget all hold (one
    // measurement, no retries).
    expect(r.exitCode, 0, reason: 'the bench tool enforces the budgets');
    final p95 = RegExp('BENCH_P95_MS ([0-9.]+)').allMatches(r.stdout).last;
    final budget =
        RegExp('BENCH_BUDGET_MS ([0-9.]+)').allMatches(r.stdout).last;
    expect(double.parse(p95.group(1)!),
        lessThanOrEqualTo(double.parse(budget.group(1)!)));
    final flushes =
        RegExp('BENCH_FLUSHES_PER_FRAME (\\d+)').allMatches(r.stdout).last;
    expect(int.parse(flushes.group(1)!), lessThanOrEqualTo(1));
  }, skip: missing, timeout: const Timeout(Duration(minutes: 6)));
}
