import 'package:flutter_test/flutter_test.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

import 'runner_fixture.dart';

/// `scroll_list` seed end to end through the conformance runner
/// (issue #9 / F1; container-children dump since the F2a renderer fix).
void main() {
  if (!QuickjsFfi.isAvailable) {
    return; // CI builds the bridge first (see pr.yml job conformance).
  }

  testWidgets('scroll_list keeps one render across three swipes', (
    tester,
  ) async {
    final result = await runSeedFixture(tester, 'scroll_list');

    expect((result['renders'] as List).length, 1);
    expect(result['title'], 'JSR: список 30');
    expect(
      (result['trace'] as List).cast<String>(),
      ['render', 'set_title'],
    );

    final dump = result['dump'] as Map<String, dynamic>;
    expect(dump['type'], 'scroll');
    expect(dump['nodeId'], 'n0');
    final column = (dump['children'] as List)[0] as Map<String, dynamic>;
    expect(column['type'], 'column');
    expect((column['children'] as List).length, 30);
    final container = (column['children'] as List)[0] as Map<String, dynamic>;
    expect(container['nodeId'], 'n2');
    expect((container['props'] as Map)['color'], '#293548');
    // Since the F2a container-children fix the two texts of every item
    // mount and dump inside their container.
    expect((container['children'] as List), hasLength(2));
    expect(
      collectNodes(dump, 'text').length,
      60,
      reason: '30 containers × 2 texts, all counted in the dump',
    );
    final firstText = (container['children'] as List)[0] as Map<String, dynamic>;
    expect((firstText['props'] as Map)['data'], 'Item #1');
  });
}
