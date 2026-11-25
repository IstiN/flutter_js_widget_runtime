import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:js_widget_runtime/src/renderer/json_widget_renderer.dart';

/// Node id stamping (issue #9 / F1): every node root widget carries
/// `ValueKey('jsr:<nodeId>')`; `nodeId` is the depth-first pre-order index
/// of the node in the render payload (root `n0`, every node counted —
/// layout-only nodes too).
void main() {
  /// Pumps [tree] through the production renderer and returns the dump,
  /// using the Builder context below the host as the dump root.
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

  testWidgets('root node is n0 and every node is keyed uniquely', (
    tester,
  ) async {
    final (dump, _) = await pumpAndDump(tester, <String, dynamic>{
      'type': 'center',
      'child': {
        'type': 'column',
        'children': [
          {'type': 'text', 'data': 'a'},
          {'type': 'sizedBox', 'height': 8},
          {
            'type': 'row',
            'children': [
              {'type': 'text', 'data': 'b'},
              {'type': 'text', 'data': 'c'},
            ],
          },
        ],
      },
    });

    // Depth-first pre-order walk of the dump must yield n0..n6 in order.
    final ids = <String>[];
    void visit(Map<String, dynamic> node) {
      ids.add(node['nodeId'] as String);
      for (final child in (node['children'] as List).cast<Map>()) {
        visit(child.cast<String, dynamic>());
      }
    }

    visit(dump);
    expect(ids, ['n0', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6']);
    expect(ids.first, 'n0', reason: 'root is n0');
  });

  testWidgets('layout-only nodes are counted', (tester) async {
    final (dump, _) = await pumpAndDump(tester, <String, dynamic>{
      'type': 'center',
      'child': {
        'type': 'column',
        'children': [
          {'type': 'text', 'data': 'x'},
          {'type': 'sizedBox', 'height': 4},
          {'type': 'text', 'data': 'y'},
        ],
      },
    });

    final column = (dump['children'] as List)[0] as Map<String, dynamic>;
    expect(column['type'], 'column');
    expect(column['nodeId'], 'n1');
    expect((column['children'] as List)[0]['nodeId'], 'n2');
    expect((column['children'] as List)[1]['type'], 'sizedBox');
    expect((column['children'] as List)[1]['nodeId'], 'n3');
    expect((column['children'] as List)[2]['nodeId'], 'n4');
  });

  testWidgets('a second render re-indexes the fresh payload', (tester) async {
    Map<String, dynamic> payload(String text) => <String, dynamic>{
      'type': 'center',
      'child': {
        'type': 'column',
        'children': [
          {'type': 'text', 'data': text},
        ],
      },
    };
    final renderer = JsonWidgetRenderer(onEvent: (_, __) {});
    BuildContext? captured;
    Widget host(String text) => MaterialApp(
      home: Scaffold(
        body: Builder(
          builder: (context) {
            captured = context;
            return renderer.build(payload(text), context);
          },
        ),
      ),
    );
    await tester.pumpWidget(host('one'));
    final firstDump = jsonEncode(renderer.dumpViewTree(captured!));
    await tester.pumpWidget(host('two'));
    final secondDump = renderer.dumpViewTree(captured!);

    expect(firstDump, contains('"nodeId":"n0"'));
    expect(secondDump['nodeId'], 'n0');
    final column = secondDump['children'][0] as Map<String, dynamic>;
    expect(column['nodeId'], 'n1');
    expect(column['children'][0]['props']['data'], 'two');
  });
}
