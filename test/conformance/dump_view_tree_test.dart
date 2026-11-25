import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:js_widget_runtime/src/renderer/json_widget_renderer.dart';

/// `dumpViewTree` normalization (issue #9 / F1): style merged into props
/// (node keys win), `on*` string props moved to `events`, colors
/// `#RRGGBB[AA]`, type aliases resolved, text-bearing props read live.
void main() {
  Future<(Map<String, dynamic>, JsonWidgetRenderer)> pumpAndDump(
    WidgetTester tester,
    Map<String, dynamic> tree,
  ) async {
    final renderer = JsonWidgetRenderer(onEvent: (_, __) {});
    BuildContext? captured;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Builder(
            builder: (context) {
              captured = context;
              return renderer.build(tree, context);
            },
          ),
        ),
      ),
    );
    return (renderer.dumpViewTree(captured!), renderer);
  }

  testWidgets('style merges into props with node keys winning', (
    tester,
  ) async {
    final (dump, _) = await pumpAndDump(tester, <String, dynamic>{
      'type': 'center',
      'child': {
        'type': 'text',
        'data': 'styled',
        'fontSize': 30,
        'style': {'fontSize': 12, 'color': '#f1f5f9', 'fontWeight': 'bold'},
      },
    });

    final text = (dump['children'] as List)[0] as Map<String, dynamic>;
    final props = text['props'] as Map<String, dynamic>;
    expect(props['fontSize'], 30, reason: 'node keys win over style keys');
    expect(props['color'], '#F1F5F9');
    expect(props['fontWeight'], 'bold');
    expect(props.containsKey('style'), isFalse);
  });

  testWidgets('on* string props move to events', (tester) async {
    final (dump, _) = await pumpAndDump(tester, <String, dynamic>{
      'type': 'textButton',
      'text': 'Go',
      'onTap': 'go',
      'payload': 1,
    });

    expect(dump['events'], {'onTap': 'go'});
    expect(dump['props']['onTap'], isNull);
    expect(dump['props']['text'], 'Go');
  });

  testWidgets('colors normalize to upper-case RRGGBB(AA)', (tester) async {
    final (dump, _) = await pumpAndDump(tester, <String, dynamic>{
      'type': 'column',
      'children': [
        {'type': 'container', 'color': '#abc', 'child': {'type': 'text', 'data': 'boxed'}},
        {
          'type': 'text',
          'data': 'tinted',
          'style': {
            'color': '#94a3b8',
            'shadows': [{'color': '#80f0f0f0'}],
          },
        },
      ],
    });

    final children = dump['children'] as List;
    expect((children[0]['props'] as Map)['color'], '#AABBCC');
    final style = children[1]['props'] as Map<String, dynamic>;
    expect(style['color'], '#94A3B8');
    expect(style['shadows'][0]['color'], '#80F0F0F0');
  });

  testWidgets('type aliases resolve to canonical types in the dump', (
    tester,
  ) async {
    // The renderer dispatches the RAW type ('View' builds the unknown-type
    // card) but the dump reports the resolved alias, per plan 1.3.
    final (dump, _) = await pumpAndDump(tester, <String, dynamic>{
      'type': 'View',
      'child': {'type': 'Label', 'data': 'aliased'},
    });

    expect(dump['type'], 'column');
    expect(dump['nodeId'], 'n0');
  });

  testWidgets('text data is read live from the built widget', (tester) async {
    final (dump, _) = await pumpAndDump(tester, <String, dynamic>{
      'type': 'column',
      'children': [
        {'type': 'text', 'data': 'on screen', 'key': 'reconciler-hint'},
        {
          'type': 'textField',
          'hint': 'name',
          'value': 'prefilled',
        },
        {
          'type': 'tooltip',
          'message': 'helpful',
          'child': {'type': 'text', 'data': 'hover me'},
        },
      ],
    });

    final children = dump['children'] as List;
    expect((children[0]['props'] as Map)['data'], 'on screen');
    expect((children[0]['props']).containsKey('key'), isFalse);
    expect((children[1]['props'] as Map)['text'], 'prefilled');
    expect((children[1]['props'] as Map)['hint'], 'name');
    expect((children[2]['props'] as Map)['message'], 'helpful');
  });

  testWidgets('the universal key prop is never dumped', (tester) async {
    final (dump, _) = await pumpAndDump(tester, <String, dynamic>{
      'type': 'column',
      'children': [
        {'type': 'text', 'data': 'a', 'key': 'item-a'},
      ],
    });

    expect(dump.toString(), isNot(contains('item-a')));
  });
}
