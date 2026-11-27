import 'package:flutter_test/flutter_test.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

import 'runner_fixture.dart';

/// l1_on_changed / l1_on_changed_dropdown: the AUI dump must carry the
/// canonical event key `onChange` for the reference's onChanged→onChange
/// alias families (input, value, dropdown) — the kit's normalizer folds
/// the payload alias, so the dump side must fold it too or the compare
/// sees onChanged where the contract expects onChange.
void main() {
  if (!QuickjsFfi.isAvailable) {
    return; // CI builds the bridge first (see pr.yml job conformance).
  }

  testWidgets('dump events fold onChanged into onChange for aliased types', (
    tester,
  ) async {
    final result = await runInlineFixture(
      tester,
      id: 'l1_on_changed_alias',
      widgetJs: '''
(function() {
  jsr.render({type: 'column', children: [
    {type: 'textField', hint: 'Field', onChanged: 'h1'},
  ]});
})();
''',
      expected: <String, dynamic>{
        'actions': <dynamic>[
          <String, dynamic>{
            'input': <String, dynamic>{'node': 'n1', 'value': 'H1'},
          },
        ],
      },
    );

    final dump = result['finalDump'] as Map<String, dynamic>;
    final columnChildren = (dump['children'] as List).cast<Map<String, dynamic>>();
    final field = columnChildren
        .map((n) => n['type'] == 'textField' ? n : null)
        .whereType<Map<String, dynamic>>()
        .single;
    expect(field['events'], <String, dynamic>{'onChange': 'h1'},
        reason: 'onChanged is alias-folded into the canonical onChange key');
  });
}
