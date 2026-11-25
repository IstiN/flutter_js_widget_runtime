import 'package:flutter_test/flutter_test.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

import 'runner_fixture.dart';

/// `counter` seed end to end through the conformance runner (issue #9 / F1).
void main() {
  if (!QuickjsFfi.isAvailable) {
    return; // CI builds the bridge first (see pr.yml job conformance).
  }

  testWidgets('counter re-renders per tap and dumps the live count', (
    tester,
  ) async {
    final result = await runSeedFixture(tester, 'counter');

    expect((result['renders'] as List).length, 4);
    expect(result['title'], isNull, reason: 'counter never sets a title');
    expect(
      (result['trace'] as List).cast<String>(),
      ['render', 'render', 'render', 'render'],
    );

    final finalDump = result['finalDump'] as Map<String, dynamic>;
    final texts = collectNodes(finalDump, 'text');
    expect(texts.length, 3,
        reason: 'counter, count and footer — the buttons are textButton nodes');
    expect((texts[1]['props'] as Map)['data'], '1',
        reason: 'text[1].data after +1 +1 -1');
    expect(texts[1]['nodeId'], startsWith('n'));
  });
}
