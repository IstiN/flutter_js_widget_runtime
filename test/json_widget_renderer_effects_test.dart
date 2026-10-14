import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_path_node.dart';

void main() {
  group('JsonWidgetRenderer effects, inputs and scrolling', () {
    late List<(String, Map<String, dynamic>)> events;
    late JsonWidgetRenderer renderer;

    setUp(() {
      events = [];
      renderer = JsonWidgetRenderer(
        onEvent: (id, payload) => events.add((id, payload)),
      );
    });

    Widget buildTree(
      Map<String, dynamic>? tree, {
      void Function(String, Map<String, dynamic>)? onGestureEvent,
    }) {
      final r = onGestureEvent == null
          ? renderer
          : JsonWidgetRenderer(
              onEvent: (id, payload) => events.add((id, payload)),
              onGestureEvent: onGestureEvent,
            );
      return MaterialApp(home: Scaffold(body: r.build(tree)));
    }

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
      await tester.pumpWidget(
        buildTree({
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
        }),
      );
      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.gradient, isA<RadialGradient>());
    });

    testWidgets('container supports box shadows', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'container',
          'width': 100,
          'height': 100,
          'decoration': {
            'color': '#ffffff',
            'shadows': [
              {'color': '#000000', 'blur': 8, 'offsetX': 2, 'offsetY': 2},
            ],
          },
        }),
      );
      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.boxShadow, isNotNull);
      expect(decoration.boxShadow!.length, 1);
    });

    testWidgets('container clips child when clip is true', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'container',
          'width': 100,
          'height': 100,
          'borderRadius': 16,
          'clip': true,
          'child': {'type': 'text', 'data': 'clipped'},
        }),
      );
      expect(find.byType(ClipRRect), findsOneWidget);
    });

    testWidgets('decoration accepts CSS-style borderRadius list', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'container',
          'width': 100,
          'height': 100,
          'decoration': {
            'color': '#ffffff',
            'borderRadius': [14, 14, 0, 0],
          },
        }),
      );
      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      final br = decoration.borderRadius as BorderRadius;
      expect(br.topLeft, const Radius.circular(14));
      expect(br.topRight, const Radius.circular(14));
      expect(br.bottomRight, Radius.zero);
      expect(br.bottomLeft, Radius.zero);
    });

    testWidgets('decoration accepts two-value borderRadius list', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'container',
          'width': 100,
          'height': 100,
          'decoration': {
            'color': '#ffffff',
            'borderRadius': [10, 4],
          },
        }),
      );
      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      final br = decoration.borderRadius as BorderRadius;
      expect(br.topLeft, const Radius.circular(10));
      expect(br.bottomRight, const Radius.circular(10));
      expect(br.topRight, const Radius.circular(4));
      expect(br.bottomLeft, const Radius.circular(4));
    });

    testWidgets('numeric props tolerate strings, lists and garbage', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'container',
          'width': '120',
          'height': [80, 40],
          'decoration': {
            'color': '#ffffff',
            'borderRadius': 'oops',
            'borderWidth': 'two',
          },
        }),
      );
      final container = tester.widget<Container>(find.byType(Container));
      expect(container.constraints!.maxWidth, 120);
      expect(container.constraints!.maxHeight, 80);
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.borderRadius, isNull);
    });

    testWidgets('container applies static transform', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'container',
          'width': 100,
          'height': 100,
          'transform': {'scale': 1.5, 'rotate': 0.5},
        }),
      );
      final container = tester.widget<Container>(find.byType(Container));
      expect(container.transform, isNotNull);
    });

    testWidgets('blur node wraps child in ImageFiltered', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'blur',
          'sigma': 4,
          'child': {'type': 'text', 'data': 'fuzzy'},
        }),
      );
      expect(find.byType(ImageFiltered), findsOneWidget);
      expect(find.text('fuzzy'), findsOneWidget);
    });

    testWidgets('text supports textShadows and uppercase transform', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'text',
          'data': 'hello',
          'style': {
            'textTransform': 'uppercase',
            'textShadows': [
              {'color': '#000000', 'blur': 2, 'offsetX': 1, 'offsetY': 1},
            ],
          },
        }),
      );
      expect(find.text('HELLO'), findsOneWidget);
      final text = tester.widget<Text>(find.text('HELLO'));
      expect(text.style?.shadows, isNotNull);
    });

    testWidgets('path renders CustomPaint and respects progress/color', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'path',
          'path': 'M0 0 L10 10',
          'progress': 0.5,
          'color': '#FF5733',
          'strokeWidth': 3,
          'width': 48,
          'height': 48,
        }),
      );
      final customPaintFinder = find.byWidgetPredicate(
        (w) => w is CustomPaint && w.painter is JsPathPainter,
      );
      expect(customPaintFinder, findsOneWidget);
      final sizedBox = tester.widget<SizedBox>(find.byType(SizedBox));
      expect(sizedBox.width, 48);
      expect(sizedBox.height, 48);
      final customPaint = tester.widget<CustomPaint>(customPaintFinder);
      final painter = customPaint.painter! as JsPathPainter;
      expect(painter.progress, 0.5);
      expect(painter.color, const Color(0xFFFF5733));
      expect(painter.strokeWidth, 3);
    });

    testWidgets('absoluteFill expands and shows child', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'absoluteFill',
          'color': '#0000FF',
          'child': {'type': 'text', 'data': 'filled'},
        }),
      );
      expect(find.text('filled'), findsOneWidget);
      final container = tester.widget<Container>(find.byType(Container));
      expect(container.constraints, const BoxConstraints.expand());
      expect(container.color, const Color(0xFF0000FF));
    });

    testWidgets('fill alias renders absoluteFill', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'fill',
          'child': {'type': 'text', 'data': 'alias'},
        }),
      );
      expect(find.text('alias'), findsOneWidget);
      final container = tester.widget<Container>(find.byType(Container));
      expect(container.constraints, const BoxConstraints.expand());
    });

    testWidgets('stack.fit expand sets StackFit.expand', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'stack',
          'fit': 'expand',
          'children': [
            {'type': 'text', 'data': 'expand'},
          ],
        }),
      );
      final stackFinder = find.byWidgetPredicate(
        (w) => w is Stack && w.fit == StackFit.expand,
      );
      expect(stackFinder, findsOneWidget);
    });

    testWidgets('universal effect props wrap node', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'text',
          'data': 'fx',
          'offsetX': 10,
          'offsetY': 20,
          'scale': 1.5,
          'rotation': 0.5,
          'opacity': 0.6,
          'blur': 4,
        }),
      );
      final textFinder = find.text('fx');
      expect(
        find.ancestor(of: textFinder, matching: find.byType(Transform)),
        findsOneWidget,
      );
      expect(
        find.ancestor(of: textFinder, matching: find.byType(ImageFiltered)),
        findsOneWidget,
      );
      final opacityFinder = find.ancestor(
        of: textFinder,
        matching: find.byType(Opacity),
      );
      expect(opacityFinder, findsOneWidget);
      final opacity = tester.widget<Opacity>(opacityFinder);
      expect(opacity.opacity, 0.6);
    });

    testWidgets('text gradient uses ShaderMask', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'text',
          'data': 'gradient text',
          'style': {
            'gradient': {
              'colors': ['#ff0000', '#0000ff'],
            },
          },
        }),
      );
      expect(find.byType(ShaderMask), findsOneWidget);
      expect(find.text('gradient text'), findsOneWidget);
    });

    testWidgets('text fontStyle italic and lineHeight', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'text',
          'data': 'styled',
          'style': {'fontStyle': 'italic', 'lineHeight': 1.5},
        }),
      );
      final text = tester.widget<Text>(find.text('styled'));
      expect(text.style?.fontStyle, FontStyle.italic);
      expect(text.style?.height, 1.5);
    });

    testWidgets('lineHeightPx converts to a fontSize-relative multiplier', (
      tester,
      ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'text',
          'data': 'px line',
          'style': {'fontSize': 16, 'lineHeightPx': 24},
        }),
      );
      final text = tester.widget<Text>(find.text('px line'));
      expect(text.style?.height, closeTo(1.5, 1e-9));
    });

    testWidgets('sized box keeps its size under tight constraints', (
      tester,
    ) async {
      // CSS sizing shield: {width: 400} must win even when the parent is
      // tight (Scaffold body), not stretch to the parent like a bare
      // Flutter Container.
      await tester.pumpWidget(
        buildTree({
          'type': 'container',
          'width': 400,
          'height': 80,
          'color': '#222222',
        }),
      );
      final box = tester.getRect(
        find.byWidgetPredicate(
          (w) =>
              w is Container &&
              (w.decoration as BoxDecoration?)?.color ==
              const Color(0xFF222222),
        ),
      );
      expect(box.width, 400);
      expect(box.height, 80);
    });

    testWidgets('sized box centers a lone text child (no alignment)', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'container',
          'width': 400,
          'height': 80,
          'color': '#222222',
          'child': {
            'type': 'text',
            'text': 'Centered?',
            'textAlign': 'center',
            'style': {'fontSize': 28, 'color': '#ffffff'},
          },
        }),
      );
      final text = tester.getRect(find.text('Centered?'));
      // Vertically centered in the 80-high box; textAlign keeps glyphs
      // centered horizontally.
      expect(text.center.dy, moreOrLessEquals(40.0, epsilon: 0.5));
    });

    testWidgets('row adopts unanimous child textAlign as cross axis', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'container',
          'width': 400,
          'height': 120,
          'color': '#222222',
          'child': {
            'type': 'row',
            'children': [
              {
                'type': 'text',
                'text': 'A',
                'textAlign': 'center',
                'style': {'fontSize': 24, 'color': '#ffffff'},
              },
              {
                'type': 'text',
                'text': 'B',
                'textAlign': 'center',
                'style': {'fontSize': 24, 'color': '#ffffff'},
              },
            ],
          },
        }),
      );
      final a = tester.getRect(find.text('A'));
      // Cross-axis adoption centers the 24-high labels in the 120-high row.
      expect(a.center.dy, moreOrLessEquals(60.0, epsilon: 0.5));
    });

    testWidgets('rotate alias applies degrees tilt', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'container',
          'width': 200,
          'height': 100,
          'color': '#222222',
          'rotate': 90,
          'child': {
            'type': 'text',
            'text': 'Tilted',
            'style': {'fontSize': 24, 'color': '#ffffff'},
          },
        }),
      );
      final box = tester.getRect(
        find.byWidgetPredicate(
          (w) =>
              w is Container &&
              (w.decoration as BoxDecoration?)?.color ==
              const Color(0xFF222222),
        ),
      );
      // A 90-degree tilt swaps the painted aspect (200x100 -> ~100x200).
      expect(box.width, moreOrLessEquals(100.0, epsilon: 1.0));
      expect(box.height, moreOrLessEquals(200.0, epsilon: 1.0));
    });

    testWidgets('container alignment centers a default row child', (
      tester,
    ) async {
      // CSS-authored {width, alignment: 'center', child: {type: 'row'}}:
      // the row shrinks to its content and centers in the box, instead of
      // stretching across it and pinning children to the start edge.
      await tester.pumpWidget(
        buildTree({
          'type': 'container',
          'width': 300,
          'height': 52,
          'alignment': 'center',
          'child': {
            'type': 'row',
            'children': [
              {'type': 'container', 'width': 100, 'height': 30, 'color': '#333'},
              {'type': 'container', 'width': 100, 'height': 30, 'color': '#555',
               'margin': {'left': 18}},
            ],
          },
        }),
      );
      Color pill(String hex) => Color(int.parse('FF$hex', radix: 16));
      final first = tester.getRect(
        find.byWidgetPredicate(
          (w) =>
              w is Container &&
              (w.decoration as BoxDecoration?)?.color == pill('333333'),
        ),
      );
      // Row content = 218 wide; centered in 300 → left = 41.
      expect(first.left, moreOrLessEquals(41.0, epsilon: 0.5));
      final second = tester.getRect(
        find.byWidgetPredicate(
          (w) =>
              w is Container &&
              (w.decoration as BoxDecoration?)?.color == pill('555555'),
        ),
      );
      // Container's rect spans content + its own left margin (100 + 18).
      expect(second.left, moreOrLessEquals(141.0, epsilon: 0.5));
    });

    testWidgets('explicit mainAxisSize still stretches the row', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'container',
          'width': 300,
          'height': 52,
          'alignment': 'center',
          'child': {
            'type': 'row',
            'mainAxisSize': 'max',
            'children': [
              {'type': 'container', 'width': 100, 'height': 30, 'color': '#333'},
            ],
          },
        }),
      );
      final pill1 = tester.getRect(
        find.byWidgetPredicate(
          (w) =>
              w is Container &&
              (w.decoration as BoxDecoration?)?.color ==
                  const Color(0xFF333333),
        ),
      );
      expect(pill1.left, moreOrLessEquals(0.0, epsilon: 0.5));
    });

    testWidgets('lineHeight stays a multiplier (canonical samples)', (
      tester,
      ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'text',
          'data': 'mult',
          'style': {'fontSize': 16, 'lineHeight': 1.35},
        }),
      );
      final text = tester.widget<Text>(find.text('mult'));
      expect(text.style?.height, 1.35);
    });

    testWidgets('lineHeight above the sane-multiplier range means pixels', (
      tester,
      ) async {
      // The CSS-trained authoring style: lineHeight: 24 means a 24-px line.
      await tester.pumpWidget(
        buildTree({
          'type': 'text',
          'data': 'css style',
          'style': {'fontSize': 16, 'lineHeight': 24},
        }),
      );
      final text = tester.widget<Text>(find.text('css style'));
      expect(text.style?.height, closeTo(1.5, 1e-9));
    });

    testWidgets('height stays a strict Flutter multiplier', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'text',
          'data': 'native',
          'style': {'fontSize': 16, 'height': 24},
        }),
      );
      final text = tester.widget<Text>(find.text('native'));
      expect(text.style?.height, 24);
    });

    testWidgets('image with asset prefix renders Image', (tester) async {
      await tester.pumpWidget(
        buildTree({'type': 'image', 'url': 'asset:test/assets/sample.png'}),
      );
      final image = tester.widget<Image>(find.byType(Image));
      expect(image.image, isA<AssetImage>());
    });

    testWidgets('image URL sends a browser-ish User-Agent', (tester) async {
      await tester.pumpWidget(
        buildTree({'type': 'image', 'url': 'https://example.com/a.png'}),
      );
      final image = tester.widget<Image>(find.byType(Image));
      final provider = image.image as NetworkImage;
      expect(provider.headers?['User-Agent'], contains('AppleWebKit'));
    });

    testWidgets('custom builder for video node', (tester) async {
      final customRenderer = JsonWidgetRenderer(
        onEvent: (id, payload) => events.add((id, payload)),
        customBuilders: {
          'video': (context, m) => Text('custom video: ${m['src']}'),
        },
      );
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: customRenderer.build({'type': 'video', 'src': 'movie.mp4'}),
          ),
        ),
      );
      expect(find.text('custom video: movie.mp4'), findsOneWidget);
    });

    testWidgets('unregistered audio node renders placeholder icon', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({'type': 'audio', 'label': 'My Track'}),
      );
      expect(find.byType(Icon), findsOneWidget);
      expect(find.text('My Track'), findsOneWidget);
    });

    // ── textArea ────────────────────────────────────────────────────────────

    testWidgets('textArea renders multiline with default line bounds', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({'type': 'textArea', 'hint': 'notes', 'value': 'draft'}),
      );
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.minLines, 3);
      expect(field.maxLines, 8);
      expect(field.keyboardType, TextInputType.multiline);
      expect(field.textInputAction, TextInputAction.newline);
      expect(field.controller?.text, 'draft');
    });

    testWidgets('textArea honors minLines/maxLines and clamps max >= min', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'column',
          'children': [
            {'type': 'textArea', 'minLines': 4, 'maxLines': 10},
            {'type': 'textArea', 'minLines': 6, 'maxLines': 2},
          ],
        }),
      );
      final fields = tester.widgetList<TextField>(find.byType(TextField));
      expect(fields.first.minLines, 4);
      expect(fields.first.maxLines, 10);
      expect(fields.last.minLines, 6);
      expect(fields.last.maxLines, 6);
    });

    testWidgets('textArea tolerates numeric strings and garbage', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'column',
          'children': [
            {'type': 'textArea', 'minLines': '5', 'maxLines': '12'},
            {
              'type': 'textArea',
              'minLines': {'bad': true},
              'maxLines': 'oops',
            },
          ],
        }),
      );
      final fields = tester.widgetList<TextField>(find.byType(TextField));
      expect(fields.first.minLines, 5);
      expect(fields.first.maxLines, 12);
      expect(fields.last.minLines, 3);
      expect(fields.last.maxLines, 8);
    });

    testWidgets('textArea fires onChange per keystroke with value', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({'type': 'textArea', 'id': 'body', 'onChange': 'edited'}),
      );
      await tester.enterText(find.byType(TextField), 'line one\nline two');
      await tester.pump();
      final change = events.firstWhere((e) => e.$1 == 'edited');
      expect(change.$2['value'], 'line one\nline two');
      final fieldEvent = events.firstWhere((e) => e.$1 == '_field');
      expect(fieldEvent.$2['key'], 'body');
      expect(fieldEvent.$2['value'], 'line one\nline two');
    });

    testWidgets('textArea with onSubmit uses done action and fires it', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({'type': 'textArea', 'onSubmit': 'submitted'}),
      );
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.textInputAction, TextInputAction.done);
      await tester.enterText(find.byType(TextField), 'multi\nline');
      await tester.testTextInput.receiveAction(TextInputAction.done);
      await tester.pump();
      final submit = events.firstWhere((e) => e.$1 == 'submitted');
      expect(submit.$2['value'], 'multi\nline');
    });

    // ── listView / gridView scrolling ───────────────────────────────────────

    testWidgets('listView defaults to always-scrollable physics', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'listView',
          'children': [
            {'type': 'text', 'data': 'a'},
          ],
        }),
      );
      final list = tester.widget<ListView>(find.byType(ListView));
      expect(list.shrinkWrap, isTrue);
      expect(list.physics, isA<AlwaysScrollableScrollPhysics>());
    });

    testWidgets('listView physics never disables scrolling', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'sizedBox',
          'height': 200,
          'child': {
            'type': 'listView',
            'shrinkWrap': false,
            'physics': 'never',
            'children': [
              for (var i = 0; i < 50; i++) {'type': 'text', 'data': 'item $i'},
            ],
          },
        }),
      );
      final list = tester.widget<ListView>(find.byType(ListView));
      expect(list.physics, isA<NeverScrollableScrollPhysics>());
    });

    testWidgets('bounded listView with 50 items drag-scrolls to last item', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'sizedBox',
          'height': 200,
          'child': {
            'type': 'listView',
            'shrinkWrap': false,
            'children': [
              for (var i = 0; i < 50; i++) {'type': 'text', 'data': 'item $i'},
            ],
          },
        }),
      );
      expect(find.text('item 0'), findsOneWidget);
      expect(find.text('item 49'), findsNothing);
      await tester.drag(find.byType(ListView), const Offset(0, -2000));
      await tester.pumpAndSettle();
      expect(find.text('item 49'), findsOneWidget);
    });

    testWidgets('gridView defaults stay back-compat (shrinkWrap + never)', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'gridView',
          'children': [
            {'type': 'text', 'data': 'a'},
          ],
        }),
      );
      final grid = tester.widget<GridView>(find.byType(GridView));
      expect(grid.shrinkWrap, isTrue);
      expect(grid.physics, isA<NeverScrollableScrollPhysics>());
    });

    testWidgets('gridView shrinkWrap and physics props are configurable', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'sizedBox',
          'height': 200,
          'child': {
            'type': 'gridView',
            'shrinkWrap': false,
            'physics': 'always',
            'children': [
              for (var i = 0; i < 40; i++) {'type': 'text', 'data': 'cell $i'},
            ],
          },
        }),
      );
      final grid = tester.widget<GridView>(find.byType(GridView));
      expect(grid.shrinkWrap, isFalse);
      expect(grid.physics, isA<AlwaysScrollableScrollPhysics>());
      expect(find.text('cell 0'), findsOneWidget);
      expect(find.text('cell 39'), findsNothing);
      await tester.drag(find.byType(GridView), const Offset(0, -10000));
      await tester.pumpAndSettle();
      expect(find.text('cell 39'), findsOneWidget);
    });

    testWidgets('listView and gridView tolerate string/number bool props', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'column',
          'children': [
            {
              'type': 'sizedBox',
              'height': 200,
              'child': {
                'type': 'listView',
                'shrinkWrap': 'false',
                'children': [
                  {'type': 'text', 'data': 'a'},
                ],
              },
            },
            {
              'type': 'sizedBox',
              'height': 200,
              'child': {
                'type': 'gridView',
                'shrinkWrap': 0,
                'physics': 'platform',
                'children': [
                  {'type': 'text', 'data': 'b'},
                ],
              },
            },
          ],
        }),
      );
      expect(
        tester.widget<ListView>(find.byType(ListView)).shrinkWrap,
        isFalse,
      );
      final grid = tester.widget<GridView>(find.byType(GridView));
      expect(grid.shrinkWrap, isFalse);
      // 'platform' passes physics: null through; the framework then applies
      // its own default (AlwaysScrollable for a primary vertical view).
      expect(grid.physics, isNot(isA<NeverScrollableScrollPhysics>()));
    });
  });
}
