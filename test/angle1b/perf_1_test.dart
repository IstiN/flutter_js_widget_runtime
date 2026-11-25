import 'package:flutter_test/flutter_test.dart';

import '../../tool/three/bench_1b.dart';

// PERF-1 (issue #7, F2 batching row): ordinary frames batch — the bench runs
// 500-draw-call frames of the REAL stack (QuickJS -> real facade, batching ON
// -> FFI -> a1b_gl_dispatch -> pinned ANGLE) and asserts at most one flush
// per frame. The printed numbers land in the quality-macos CI log
// (`dart run tool/three/bench_1b.dart` runs the same phases).
void main() {
  final missing = Shim.resolveProblem();
  test('PERF-1: flush count per 500-draw frame is at most one', () async {
    final report = await run1bBench();
    // ignore: avoid_print
    print('PERF-1 bench: $report');
    expect(report.flushesPerFrame, lessThanOrEqualTo(1));
  }, skip: missing);
}
