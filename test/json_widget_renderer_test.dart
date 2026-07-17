import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

void main() {
  group('JsonWidgetRenderer', () {
    late List<(String, Map<String, dynamic>)> events;
    late JsonWidgetRenderer renderer;

    setUp(() {
      events = [];
      renderer = JsonWidgetRenderer(
        onEvent: (id, payload) => events.add((id, payload)),
      );
    });

    Widget buildTree(Map<String, dynamic>? tree) {
      return MaterialApp(
        home: Scaffold(body: renderer.build(tree)),
      );
    }

    testWidgets('build returns SizedBox.shrink for null', (tester) async {
      await tester.pumpWidget(buildTree(null));
      expect(find.byType(SizedBox), findsOneWidget);
    });

    testWidgets('renders Text node', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'text',
        'data': 'Hello world',
        'style': {'fontSize': 18, 'color': '#ffffff'},
      }));
      expect(find.text('Hello world'), findsOneWidget);
    });

    testWidgets('renders column with children', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'column',
        'children': [
          {'type': 'text', 'data': 'first'},
          {'type': 'text', 'data': 'second'},
        ],
      }));
      expect(find.text('first'), findsOneWidget);
      expect(find.text('second'), findsOneWidget);
    });

    testWidgets('renders row with children', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'row',
        'children': [
          {'type': 'text', 'data': 'a'},
          {'type': 'text', 'data': 'b'},
        ],
      }));
      expect(find.text('a'), findsOneWidget);
      expect(find.text('b'), findsOneWidget);
    });

    testWidgets('button fires onEvent with payload', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'button',
        'text': 'Tap me',
        'onTap': 'submit',
        'payload': {'id': 42},
      }));
      await tester.tap(find.text('Tap me'));
      await tester.pump();
      expect(events.length, 1);
      expect(events.first.$1, 'submit');
      expect(events.first.$2['id'], 42);
    });

    testWidgets('iconButton renders Icon and fires event', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'iconButton',
        'icon': 'add',
        'onTap': 'add_item',
      }));
      expect(find.byType(IconButton), findsOneWidget);
      await tester.tap(find.byType(IconButton));
      await tester.pump();
      expect(events.length, 1);
      expect(events.first.$1, 'add_item');
      expect(events.first.$2, isEmpty);
    });

    testWidgets('emoji icon renders Text', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'icon',
        'icon': '🚀',
        'size': 24,
      }));
      expect(find.text('🚀'), findsOneWidget);
    });

    testWidgets('named icon renders Icon widget', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'icon',
        'icon': 'star',
      }));
      expect(find.byType(Icon), findsOneWidget);
    });

    testWidgets('container with background color', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'container',
        'backgroundColor': '#FF5733',
        'width': 100,
        'height': 100,
      }));
      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration! as BoxDecoration;
      expect(decoration.color, const Color(0xFFFF5733));
    });

    testWidgets('textField registers value with field registry', (tester) async {
      final registry = UiViewFieldRegistry();
      final fieldRenderer = JsonWidgetRenderer(
        onEvent: (id, payload) => events.add((id, payload)),
        fieldRegistry: registry,
      );
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: fieldRenderer.build({
              'type': 'textField',
              'id': 'email',
              'initialValue': 'a@b.com',
            }),
          ),
        ),
      );
      expect(registry.snapshot()['email'], 'a@b.com');

      await tester.enterText(find.byType(TextField), 'c@d.com');
      await tester.pump();
      expect(registry.snapshot()['email'], 'c@d.com');
    });

    testWidgets('switch fires onChanged event', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'switch',
        'value': false,
        'onChange': 'toggle',
      }));
      await tester.tap(find.byType(Switch));
      await tester.pump();
      expect(events.length, 1);
      expect(events.first.$1, 'toggle');
      expect(events.first.$2['value'], true);
    });

    testWidgets('checkbox fires onChanged event', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'checkbox',
        'value': false,
        'onChange': 'check',
      }));
      await tester.tap(find.byType(Checkbox));
      await tester.pump();
      expect(events.length, 1);
      expect(events.first.$1, 'check');
      expect(events.first.$2['value'], true);
    });

    testWidgets('slider fires onChanged event', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'slider',
        'value': 0.5,
        'onChange': 'slide',
      }));
      await tester.drag(find.byType(Slider), const Offset(50, 0));
      await tester.pump();
      expect(events.any((e) => e.$1 == 'slide'), isTrue);
    });

    testWidgets('dropdown renders items and fires event', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'dropdown',
        'value': 'b',
        'items': ['a', 'b', 'c'],
        'onChange': 'select',
      }));
      await tester.tap(find.byType(DropdownButton<String>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('c').last);
      await tester.pumpAndSettle();
      expect(events.any((e) => e.$1 == 'select' && e.$2['value'] == 'c'), isTrue);
    });

    testWidgets('markdown renders MarkdownBody', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'markdown',
        'data': '# Title',
      }));
      expect(find.byType(MarkdownBody), findsOneWidget);
    });

    testWidgets('svg renders SvgPicture from path data', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'svg',
        'data': 'M0 0 L10 10',
        'viewBox': '0 0 100 100',
        'fill': '#00FF00',
      }));
      expect(find.byType(SvgPicture), findsOneWidget);
    });

    testWidgets('unknown type renders warning container', (tester) async {
      await tester.pumpWidget(buildTree({'type': 'unknownThing'}));
      expect(find.textContaining('Unknown type'), findsOneWidget);
    });

    testWidgets('listView renders children', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'listView',
        'shrinkWrap': true,
        'children': [
          {'type': 'text', 'data': 'one'},
          {'type': 'text', 'data': 'two'},
        ],
      }));
      expect(find.text('one'), findsOneWidget);
      expect(find.text('two'), findsOneWidget);
    });

    testWidgets('chip fires onPressed', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'chip',
        'label': 'tag',
        'onTap': 'filter',
      }));
      await tester.tap(find.text('tag'));
      await tester.pump();
      expect(events.length, 1);
      expect(events.first.$1, 'filter');
      expect(events.first.$2, isEmpty);
    });
  });
}
