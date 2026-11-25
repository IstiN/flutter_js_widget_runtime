import 'package:flutter_test/flutter_test.dart';

import '../../tool/three/bench_1b.dart';

// PERF-2 (issue #7, F2 batching row): p95 of a 500-draw-call frame
// (encode + transport + native submit) is within the 4 ms budget on the
// macOS host that runs the bench (also asserted by the bench tool itself —
// `dart run tool/three/bench_1b.dart` exits nonzero on violation).
void main() {
  final missing = Shim.resolveProblem();
  test('PERF-2: p95 of a 500-draw frame stays within the 4 ms budget', () async {
    final report = await run1bBench();
    // ignore: avoid_print
    print('PERF-2 bench: $report');
    expect(report.p95Ms, lessThanOrEqualTo(kP95BudgetMs));
  }, skip: missing);
}
