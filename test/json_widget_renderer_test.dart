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

    testWidgets('renders padding and sizedBox', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'padding',
        'padding': 16,
        'child': {
          'type': 'sizedBox',
          'width': 50,
          'height': 50,
          'child': {'type': 'text', 'data': 'in box'},
        },
      }));
      expect(find.byType(Padding), findsOneWidget);
      final sizedBox = tester.widget<SizedBox>(find.byType(SizedBox));
      expect(sizedBox.width, 50);
      expect(sizedBox.height, 50);
      expect(find.text('in box'), findsOneWidget);
    });

    testWidgets('expanded and flexible fill space', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'row',
        'children': [
          {'type': 'expanded', 'child': {'type': 'text', 'data': 'a'}},
          {'type': 'flexible', 'child': {'type': 'text', 'data': 'b'}},
        ],
      }));
      expect(find.byType(Expanded), findsOneWidget);
      expect(find.byType(Flexible), findsOneWidget);
    });

    testWidgets('wrap renders children', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'wrap',
        'children': [
          {'type': 'text', 'data': 'one'},
          {'type': 'text', 'data': 'two'},
        ],
      }));
      expect(find.byType(Wrap), findsOneWidget);
      expect(find.text('one'), findsOneWidget);
    });

    testWidgets('align centers child', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'align',
        'alignment': 'center',
        'child': {'type': 'text', 'data': 'centered'},
      }));
      final align = tester.widget<Align>(find.byType(Align));
      expect(align.alignment, Alignment.center);
    });

    testWidgets('safeArea wraps child', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'safeArea',
        'child': {'type': 'text', 'data': 'safe'},
      }));
      expect(find.byType(SafeArea), findsOneWidget);
      expect(find.text('safe'), findsOneWidget);
    });

    testWidgets('scroll wraps child', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'scroll',
        'padding': 8,
        'child': {'type': 'text', 'data': 'scrollable'},
      }));
      expect(find.byType(SingleChildScrollView), findsOneWidget);
    });

    testWidgets('divider and spacer render', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'column',
        'children': [
          {'type': 'divider'},
          {'type': 'spacer'},
        ],
      }));
      expect(find.byType(Divider), findsOneWidget);
      expect(find.byType(Spacer), findsOneWidget);
    });

    testWidgets('linear and circular progress render', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'column',
        'children': [
          {'type': 'linearProgressIndicator', 'value': 0.5},
          {'type': 'circularProgressIndicator'},
        ],
      }));
      expect(find.byType(LinearProgressIndicator), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('card renders child', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'card',
        'child': {'type': 'text', 'data': 'in card'},
      }));
      expect(find.byType(Card), findsOneWidget);
      expect(find.text('in card'), findsOneWidget);
    });

    testWidgets('inkWell fires onTap', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'inkWell',
        'onTap': 'tap',
        'child': {'type': 'text', 'data': 'tap me'},
      }));
      await tester.tap(find.text('tap me'));
      await tester.pump();
      expect(events.first.$1, 'tap');
    });

    testWidgets('gridView renders children', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'gridView',
        'crossAxisCount': 2,
        'children': [
          {'type': 'text', 'data': 'a'},
          {'type': 'text', 'data': 'b'},
        ],
      }));
      expect(find.byType(GridView), findsOneWidget);
      expect(find.text('a'), findsOneWidget);
      expect(find.text('b'), findsOneWidget);
    });

    testWidgets('listTile renders and fires onTap', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'listTile',
        'title': 'Tile',
        'subtitle': 'Subtitle',
        'onTap': 'tile_tap',
      }));
      expect(find.text('Tile'), findsOneWidget);
      expect(find.text('Subtitle'), findsOneWidget);
      await tester.tap(find.text('Tile'));
      await tester.pump();
      expect(events.first.$1, 'tile_tap');
    });

    testWidgets('badge renders label', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'badge',
        'label': '3',
        'child': {'type': 'icon', 'icon': 'notifications'},
      }));
      expect(find.text('3'), findsOneWidget);
    });

    testWidgets('circleAvatar renders image', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'circleAvatar',
        'label': 'A',
        'backgroundColor': '#FF0000',
      }));
      expect(find.byType(CircleAvatar), findsOneWidget);
      expect(find.text('A'), findsOneWidget);
    });

    testWidgets('image renders network image', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'image',
        'url': 'https://example.com/a.png',
        'width': 100,
        'height': 100,
      }));
      expect(find.byType(Image), findsOneWidget);
    });

    testWidgets('aspectRatio wraps child', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'aspectRatio',
        'aspectRatio': 16 / 9,
        'child': {'type': 'text', 'data': 'wide'},
      }));
      expect(find.byType(AspectRatio), findsOneWidget);
    });

    testWidgets('opacity and clipRRect wrap child', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'clipRRect',
        'borderRadius': 12,
        'child': {
          'type': 'opacity',
          'opacity': 0.5,
          'child': {'type': 'text', 'data': 'faded'},
        },
      }));
      expect(find.byType(ClipRRect), findsOneWidget);
      expect(find.byType(Opacity), findsOneWidget);
      final opacity = tester.widget<Opacity>(find.byType(Opacity));
      expect(opacity.opacity, 0.5);
    });

    testWidgets('animatedContainer renders', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'animatedContainer',
        'duration': 200,
        'width': 50,
        'height': 50,
        'backgroundColor': '#FF0000',
      }));
      expect(find.byType(AnimatedContainer), findsOneWidget);
    });

    testWidgets('animatedOpacity renders', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'animatedOpacity',
        'duration': 200,
        'opacity': 0.5,
        'child': {'type': 'text', 'data': 'fading'},
      }));
      expect(find.byType(AnimatedOpacity), findsOneWidget);
    });

    testWidgets('gestureDetector fires tap and pan events', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'gestureDetector',
        'onTap': 'tap',
        'onTapDown': 'tapDown',
        'onPanUpdate': 'pan',
        'child': {'type': 'text', 'data': 'touch'},
      }));
      await tester.tap(find.text('touch'));
      await tester.pump();
      expect(events.any((e) => e.$1 == 'tap'), isTrue);
      expect(events.any((e) => e.$1 == 'tapDown'), isTrue);
    });

    testWidgets('chart renders CustomPaint', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'chart',
        'points': [1, 2, 3, 4],
        'height': 80,
        'fill': true,
      }));
      expect(
        find.byWidgetPredicate(
          (w) => w is CustomPaint && w.size == Size.infinite,
        ),
        findsOneWidget,
      );
    });

    testWidgets('textField fires onSubmit and onChange', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'textField',
        'id': 'name',
        'onSubmit': 'submit_name',
        'onChange': 'change_name',
      }));
      await tester.enterText(find.byType(TextField), 'Al');
      await tester.pump();
      expect(events.any((e) => e.$1 == 'change_name'), isTrue);
      await tester.enterText(find.byType(TextField), 'Alice');
      await tester.testTextInput.receiveAction(TextInputAction.done);
      await tester.pump();
      expect(events.any((e) => e.$1 == 'submit_name'), isTrue);
    });

    testWidgets('outlinedButton and textButton render', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'column',
        'children': [
          {
            'type': 'outlinedButton',
            'text': 'Outline',
            'onTap': 'o',
            'style': {'borderColor': '#fff'},
          },
          {
            'type': 'textButton',
            'text': 'Text',
            'onTap': 't',
          },
        ],
      }));
      expect(find.byType(OutlinedButton), findsOneWidget);
      expect(find.byType(TextButton), findsOneWidget);
      await tester.tap(find.text('Outline'));
      await tester.pump();
      expect(events.any((e) => e.$1 == 'o'), isTrue);
    });

    testWidgets('button with icon and label renders', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'button',
        'text': 'Save',
        'icon': 'check',
        'onTap': 'save',
      }));
      expect(find.text('Save'), findsOneWidget);
      expect(find.byType(Icon), findsWidgets);
    });

    testWidgets('stack with positioned child', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'stack',
        'children': [
          {
            'type': 'text',
            'data': 'pos',
            'positioned': {'top': 0, 'left': 0},
          },
        ],
      }));
      expect(
        find.byWidgetPredicate(
          (w) =>
              w is Stack &&
              w.children.any((child) => child is Positioned),
        ),
        findsOneWidget,
      );
      expect(find.byType(Positioned), findsOneWidget);
    });

    testWidgets('dropdown returns empty when items missing', (tester) async {
      await tester.pumpWidget(buildTree({'type': 'dropdown'}));
      expect(find.byType(DropdownButton<String>), findsNothing);
    });

    testWidgets('image with empty url is hidden', (tester) async {
      await tester.pumpWidget(buildTree({'type': 'image', 'url': ''}));
      expect(find.byType(Image), findsNothing);
    });

    testWidgets('svg with empty data shows placeholder', (tester) async {
      await tester.pumpWidget(buildTree({'type': 'svg', 'data': ''}));
      expect(find.byType(Icon), findsOneWidget);
    });

    testWidgets('circleAvatar shows placeholder when no data', (tester) async {
      await tester.pumpWidget(buildTree({'type': 'circleAvatar'}));
      expect(find.text('?'), findsOneWidget);
    });

    testWidgets('animatedPositioned renders', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'stack',
        'children': [
          {
            'type': 'animatedPositioned',
            'duration': 200,
            'left': 0,
            'top': 0,
            'child': {'type': 'text', 'data': 'moving'},
          },
        ],
      }));
      expect(find.byType(AnimatedPositioned), findsOneWidget);
    });

    testWidgets('gestureDetector reports pan start and end', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'gestureDetector',
        'onPanStart': 'panStart',
        'onPanEnd': 'panEnd',
        'child': {'type': 'text', 'data': 'drag'},
      }));
      await tester.drag(find.text('drag'), const Offset(50, 0));
      await tester.pump();
      expect(events.any((e) => e.$1 == 'panStart'), isTrue);
      expect(events.any((e) => e.$1 == 'panEnd'), isTrue);
    });

    testWidgets('chart is empty without points', (tester) async {
      await tester.pumpWidget(buildTree({'type': 'chart'}));
      expect(
        find.byWidgetPredicate(
          (w) => w is CustomPaint && w.size == Size.infinite,
        ),
        findsNothing,
      );
    });

    testWidgets('container supports radial gradient', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'container',
        'width': 100,
        'height': 100,
        'decoration': {
          'gradient': {
            'type': 'radial',
            'colors': ['#ff0000', '#0000ff'],
            'center': 'center',
            'radius': 0.8,
          },
        },
      }));
      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.gradient, isA<RadialGradient>());
    });

    testWidgets('container supports box shadows', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'container',
        'width': 100,
        'height': 100,
        'decoration': {
          'color': '#ffffff',
          'shadows': [
            {'color': '#000000', 'blur': 8, 'offsetX': 2, 'offsetY': 2},
          ],
        },
      }));
      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.boxShadow, isNotNull);
      expect(decoration.boxShadow!.length, 1);
    });

    testWidgets('container clips child when clip is true', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'container',
        'width': 100,
        'height': 100,
        'borderRadius': 16,
        'clip': true,
        'child': {'type': 'text', 'data': 'clipped'},
      }));
      expect(find.byType(ClipRRect), findsOneWidget);
    });

    testWidgets('container applies static transform', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'container',
        'width': 100,
        'height': 100,
        'transform': {'scale': 1.5, 'rotate': 0.5},
      }));
      final container = tester.widget<Container>(find.byType(Container));
      expect(container.transform, isNotNull);
    });

    testWidgets('blur node wraps child in ImageFiltered', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'blur',
        'sigma': 4,
        'child': {'type': 'text', 'data': 'fuzzy'},
      }));
      expect(find.byType(ImageFiltered), findsOneWidget);
      expect(find.text('fuzzy'), findsOneWidget);
    });

    testWidgets('text supports textShadows and uppercase transform', (tester) async {
      await tester.pumpWidget(buildTree({
        'type': 'text',
        'data': 'hello',
        'style': {
          'textTransform': 'uppercase',
          'textShadows': [
            {'color': '#000000', 'blur': 2, 'offsetX': 1, 'offsetY': 1},
          ],
        },
      }));
      expect(find.text('HELLO'), findsOneWidget);
      final text = tester.widget<Text>(find.text('HELLO'));
      expect(text.style?.shadows, isNotNull);
    });
  });
}
