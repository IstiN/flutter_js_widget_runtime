import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:js_widget_runtime/src/renderer/json_widget_renderer.dart';

/// Regression: a `container` node with `children` renders them as a column
/// inside the box decoration (conformance kit finding, F2a). `child` keeps
/// its behavior.
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

  testWidgets('container with children renders every child', (tester) async {
    final (dump, _) = await pumpAndDump(tester, <String, dynamic>{
      'type': 'container',
      'color': '#abc',
      'padding': 16,
      'children': [
        {'type': 'text', 'data': 'first'},
        {'type': 'text', 'data': 'second'},
      ],
    });

    expect(find.text('first'), findsOneWidget);
    expect(find.text('second'), findsOneWidget);

    final children = dump['children'] as List;
    expect(children, hasLength(2));
    expect(children[0]['type'], 'text');
    expect(children[0]['nodeId'], 'n1');
    expect(children[1]['nodeId'], 'n2');
    expect((dump['props'] as Map)['color'], '#AABBCC');
  });

  testWidgets('container with child keeps its behavior', (tester) async {
    final (dump, _) = await pumpAndDump(tester, <String, dynamic>{
      'type': 'container',
      'color': '#123456',
      'child': {'type': 'text', 'data': 'only'},
    });

    expect(find.text('only'), findsOneWidget);
    expect((dump['children'] as List), hasLength(1));
  });

  testWidgets('child wins over children when both are authored', (
    tester,
  ) async {
    final (dump, _) = await pumpAndDump(tester, <String, dynamic>{
      'type': 'container',
      'child': {'type': 'text', 'data': 'the child'},
      'children': [
        {'type': 'text', 'data': 'ignored'},
      ],
    });

    expect(find.text('the child'), findsOneWidget);
    expect(find.text('ignored'), findsNothing);
    expect((dump['children'] as List), hasLength(1));
  });
}
