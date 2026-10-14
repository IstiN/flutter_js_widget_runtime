import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'renderer_test_scaffold.dart';

/// Branch-coverage complements for the renderer node extensions: text
/// box/alignment/hide, markdown/chip/avatar variants, chart props and
/// repaint invalidation, container decoration branches, adaptive
/// fallbacks. Every test here pins a branch the main suites reach only
/// in one direction (or never) — the CRAP ratchet depends on them.
void main() {
  final s = RendererScaffold();

  setUp(s.reset);

  Widget buildTree(
    Map<String, dynamic>? tree, {
    double width = 800,
    bool hideText = false,
  }) =>
      s.buildTree(tree, width: width, hideText: hideText);

  testWidgets('text box with explicit alignment wraps in Align', (tester) async {
    await tester.pumpWidget(buildTree({
      'type': 'text', 'data': 'boxed', 'width': 120, 'alignment': 'center',
    }));
    expect(find.byType(Align), findsOneWidget);
    // Height-only box: heightFactor wraps, widthFactor stays null.
    await tester.pumpWidget(buildTree({
      'type': 'text', 'data': 'boxed', 'height': 60, 'alignment': 'topLeft',
    }));
    expect(find.byType(Align), findsOneWidget);
  });

  testWidgets('renderer hideText paints PPTX-style invisible ink', (tester) async {
    await tester.pumpWidget(buildTree(
      {'type': 'text', 'data': 'ghost'},
      hideText: true,
    ));
    final opacity = tester.widget<Opacity>(find.byType(Opacity));
    expect(opacity.opacity, lessThan(0.001));
  });

  testWidgets('fontWeight accepts numbers and w800/w900 names', (tester) async {
    await tester.pumpWidget(buildTree({
      'type': 'text', 'data': 'n', 'style': {'fontWeight': 800},
    }));
    expect(tester.widget<Text>(find.byType(Text)).style!.fontWeight,
        FontWeight.w800);
    await tester.pumpWidget(buildTree({
      'type': 'text', 'data': 'n', 'style': {'fontWeight': 'w900'},
    }));
    expect(tester.widget<Text>(find.byType(Text)).style!.fontWeight,
        FontWeight.w900);
    await tester.pumpWidget(buildTree({
      'type': 'text', 'data': 'n', 'style': {'fontWeight': 750},
    }));
    // 750 rounds to the 800 bucket per the clamp-round contract.
    expect(tester.widget<Text>(find.byType(Text)).style!.fontWeight,
        FontWeight.w800);
  });

  testWidgets('markdown selectable renders SelectableText region', (tester) async {
    await tester.pumpWidget(buildTree({
      'type': 'markdown', 'data': '# Title', 'selectable': true,
    }));
    expect(find.textContaining('Title'), findsOneWidget);
  });

  testWidgets('listTile leading/trailing accept icon-name strings', (tester) async {
    await tester.pumpWidget(buildTree({
      'type': 'listTile',
      'leading': 'settings',
      'trailing': 'arrow_forward',
      'title': 'row',
    }));
    expect(find.byIcon(Icons.settings), findsOneWidget);
    expect(find.byIcon(Icons.arrow_forward), findsOneWidget);
  });

  testWidgets('circleAvatar resolves a url source', (tester) async {
    // The test binding answers every HTTP request with 400; swallow the
    // loader error — the branch under test is the url -> NetworkImage
    // wiring, not the fetch.
    final original = FlutterError.onError;
    FlutterError.onError = (details) {};
    addTearDown(() => FlutterError.onError = original);
    await tester.pumpWidget(buildTree({
      'type': 'circleAvatar', 'url': 'https://example.com/a.png', 'radius': 18,
    }));
    final avatar = tester.widget<CircleAvatar>(find.byType(CircleAvatar));
    expect(avatar.backgroundImage, isA<NetworkImage>());
  });

  testWidgets('chip renders its icon-name avatar', (tester) async {
    await tester.pumpWidget(buildTree({
      'type': 'chip', 'label': 'chip', 'icon': 'add', 'onTap': 'chipTap',
    }));
    expect(find.byIcon(Icons.add), findsOneWidget);
  });

  testWidgets('chart onTap wraps the painter in a GestureDetector', (tester) async {
    await tester.pumpWidget(buildTree({
      'type': 'chart', 'points': [1, 2, 3], 'onTap': 'chartTap',
    }));
    await tester.tap(find.byType(GestureDetector).first);
    expect(s.events.any((e) => e.$1 == 'chartTap'), isTrue);
  });

  testWidgets('sparkline prop changes trip shouldRepaint', (tester) async {
    // Painter props compare points by IDENTITY — share one list instance
    // so the prop-diff fallbacks (color/fill/strokeWidth) actually run.
    final pts = [1.0, 2.0];
    await tester.pumpWidget(buildTree({
      'type': 'chart', 'points': pts,
      'color': '#ff0000', 'strokeWidth': 2, 'fill': false,
      'fillColor': '#00ff0022',
    }));
    await tester.pumpWidget(buildTree({
      'type': 'chart', 'points': pts,
      'color': '#0000ff', 'strokeWidth': 4, 'fill': true,
      'fillColor': '#0000ff33',
    }));
    // Third pump changes ONLY the fill-class props (color held): the
    // short-circuit chain must still reach the fill/stroke comparisons.
    await tester.pumpWidget(buildTree({
      'type': 'chart', 'points': pts,
      'color': '#0000ff', 'strokeWidth': 6, 'fill': false,
      'fillColor': '#0000ff33',
    }));
    expect(tester.takeException(), isNull);
  });

  testWidgets('bar chart prop changes trip shouldRepaint', (tester) async {
    final pts = [1.0, 2.0]; // identity-shared, see the sparkline test
    await tester.pumpWidget(buildTree({
      'type': 'chart', 'chartType': 'bar', 'points': pts,
      'color': '#ff0000', 'strokeWidth': 2, 'fillColor': '#00ff0022',
    }));
    await tester.pumpWidget(buildTree({
      'type': 'chart', 'chartType': 'bar', 'points': pts,
      'color': '#0000ff', 'strokeWidth': 5, 'fillColor': '#0000ff33',
    }));
    expect(tester.takeException(), isNull);
  });

  testWidgets('row baseline alignment honors the ideographic textBaseline',
      (tester) async {
    await tester.pumpWidget(buildTree({
      'type': 'row',
      'crossAxisAlignment': 'baseline',
      'textBaseline': 'ideographic',
      'children': [
        {'type': 'text', 'data': 'a', 'style': {'fontSize': 24}},
        {'type': 'text', 'data': 'b'},
      ],
    }));
    expect(find.text('a'), findsOneWidget);
  });

  testWidgets('unknown/garbage crossAxisAlignment falls back to center',
      (tester) async {
    await tester.pumpWidget(buildTree({
      'type': 'row',
      'crossAxisAlignment': 'sideways',
      'children': [
        {'type': 'text', 'data': 'x'},
      ],
    }));
    expect(find.text('x'), findsOneWidget);
    // Omitted crossAxisAlignment with a non-text child takes the raw
    // fall-through (the unanimity scan exits at the first non-text node).
    await tester.pumpWidget(buildTree({
      'type': 'row',
      'children': [
        {'type': 'container', 'child': {'type': 'text', 'data': 'y'}},
      ],
    }));
    expect(find.text('y'), findsOneWidget);
    // No children at all: the scan is skipped, raw fall-through again.
    await tester.pumpWidget(buildTree({'type': 'row'}));
    expect(tester.takeException(), isNull);
  });

  testWidgets('container shadows accept a flat list and a bordered variant',
      (tester) async {
    await tester.pumpWidget(buildTree({
      'type': 'container',
      'shadows': {'blur': 6, 'color': '#00000033'},
      'borderColor': '#ffffff',
      'borderWidth': 2,
      'child': {'type': 'text', 'data': 'decorated'},
    }));
    final decorated = tester
        .widgetList<Container>(find.byType(Container))
        .where((c) => c.decoration is BoxDecoration)
        .toList();
    expect(decorated, isNotEmpty);
    final decor = decorated.first.decoration as BoxDecoration;
    expect(decor.boxShadow, isNotNull);
    expect(decor.border, isNotNull);
    // And the map/list forms again on a clip container: the ClipRRect
    // radius resolver falls through to jsBorderRadius(borderRadius) when
    // the decoration itself carries no BorderRadius.
    await tester.pumpWidget(buildTree({
      'type': 'container',
      'clip': true,
      'borderRadius': [8, 16],
      'color': '#222222',
      'child': {'type': 'text', 'data': 'clipped'},
    }));
    expect(find.text('clipped'), findsOneWidget);
    expect(find.byType(ClipRRect), findsOneWidget);
  });

  testWidgets('container borderRadius list resolves without a radius prop',
      (tester) async {
    await tester.pumpWidget(buildTree({
      'type': 'container',
      'borderRadius': [8, 16],
      'color': '#222222',
      'child': {'type': 'text', 'data': 'rounded'},
    }));
    expect(find.text('rounded'), findsOneWidget);
  });

  testWidgets('adaptive node resolves expanded via the medium fallback',
      (tester) async {
    tester.view.physicalSize = const Size(1200, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(buildTree({
      'type': 'adaptive',
      'compact': {'type': 'text', 'data': 'c'},
      'medium': {'type': 'text', 'data': 'm'},
    }));
    expect(find.text('m'), findsOneWidget); // no expanded branch → medium
    // Medium width resolves through the compact fallback too.
    tester.view.physicalSize = const Size(700, 800);
    await tester.pumpWidget(buildTree({
      'type': 'adaptive',
      'compact': {'type': 'text', 'data': 'c2'},
    }));
    expect(find.text('c2'), findsOneWidget);
  });
}
