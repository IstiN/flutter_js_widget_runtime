import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/json_widget_renderer.dart';
import 'package:js_widget_runtime/src/renderer/ui_view_tree_normalizer.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_shape_nodes.dart';

/// Tests for the declarative shape nodes (`rect`, `circle`, `line`,
/// `polygon`) — pinned semantics from the Motion-Canvas port coordination
/// (yoclip#1): flat polygon points, canonical x1/y1/x2/y2 lines, content-
/// bounds sizing, inside strokes on rect/circle, opacity via ink alpha.
void main() {
  Widget wrap(Map<String, dynamic> node) => MaterialApp(
    home: Scaffold(
      body: JsonWidgetRenderer(onEvent: (_, __) {}).build(node),
    ),
  );

  final rectFinder = find.byWidgetPredicate(
    (w) => w is CustomPaint && w.painter is JsRectPainter,
  );
  final circleFinder = find.byWidgetPredicate(
    (w) => w is CustomPaint && w.painter is JsCirclePainter,
  );
  final lineFinder = find.byWidgetPredicate(
    (w) => w is CustomPaint && w.painter is JsLinePainter,
  );
  final polygonFinder = find.byWidgetPredicate(
    (w) => w is CustomPaint && w.painter is JsPolygonPainter,
  );

  group('rect', () {
    testWidgets('builds with intrinsic size and default ink', (tester) async {
      await tester.pumpWidget(wrap({
        'type': 'rect',
        'width': 120,
        'height': 40,
        'fill': '#ff0000',
      }));
      final painter = tester.widget<CustomPaint>(rectFinder).painter
          as JsRectPainter;
      expect(tester.getSize(rectFinder), const Size(120, 40));
      expect(painter.fill, const Color(0xFFFF0000));
      expect(painter.stroke, isNull);
    });

    testWidgets('stroke and radius reach the painter', (tester) async {
      await tester.pumpWidget(wrap({
        'type': 'rect',
        'width': 50,
        'height': 50,
        'radius': 8,
        'fill': 'white',
        'stroke': 'black',
        'strokeWidth': 4,
        'opacity': 0.5,
      }));
      final painter = tester.widget<CustomPaint>(rectFinder).painter
          as JsRectPainter;
      expect(painter.radius, 8);
      expect(painter.stroke!.a, closeTo(0.5, 0.001)); // 50% black
      expect(painter.strokeWidth, 4);
    });

    testWidgets('zero/missing size and no ink shrink away', (tester) async {
      for (final props in [
        {'type': 'rect', 'width': 0, 'height': 10, 'fill': 'red'},
        {'type': 'rect', 'height': 10, 'fill': 'red'},
        {'type': 'rect', 'width': 10, 'height': 10}, // no fill/stroke
        {'type': 'rect', 'width': 10, 'height': 10, 'stroke': 'red'},
      ]) {
        await tester.pumpWidget(wrap(Map<String, dynamic>.from(props)));
        expect(rectFinder, findsNothing, reason: 'props: $props');
      }
      // stroke without fill paints (outline-only rect).
      await tester.pumpWidget(wrap({
        'type': 'rect',
        'width': 10,
        'height': 10,
        'stroke': 'red',
        'strokeWidth': 2,
      }));
      expect(rectFinder, findsOneWidget);
    });
  });

  group('circle', () {
    testWidgets('builds with size x size intrinsic box', (tester) async {
      await tester.pumpWidget(wrap({
        'type': 'circle',
        'size': 36,
        'fill': '#00ff00',
      }));
      expect(tester.getSize(circleFinder), const Size(36, 36));
    });

    testWidgets('missing size or ink shrinks', (tester) async {
      await tester.pumpWidget(wrap({'type': 'circle', 'fill': 'red'}));
      expect(circleFinder, findsNothing);
      await tester.pumpWidget(wrap({'type': 'circle', 'size': 20}));
      expect(circleFinder, findsNothing);
    });
  });

  group('line', () {
    testWidgets('sizes to tight bounds plus stroke inset', (tester) async {
      await tester.pumpWidget(wrap({
        'type': 'line',
        'x1': 10,
        'y1': 20,
        'x2': 50,
        'y2': 60,
        'stroke': '#ffffff',
        'strokeWidth': 4,
      }));
      final custom = tester.widget<CustomPaint>(lineFinder);
      expect(custom.size, const Size(44, 44)); // 40x40 bounds + 4 inset
      final painter = custom.painter as JsLinePainter;
      expect(painter.start, const Offset(10, 20));
      expect(painter.end, const Offset(50, 60));
      expect(painter.origin, const Offset(-10, -20));
      expect(painter.strokeWidth, 4);
    });

    testWidgets('defaults strokeWidth to 2', (tester) async {
      await tester.pumpWidget(wrap({
        'type': 'line',
        'x1': 0,
        'y1': 0,
        'x2': 30,
        'y2': 0,
        'stroke': 'red',
      }));
      final custom = tester.widget<CustomPaint>(lineFinder);
      expect((custom.painter as JsLinePainter).strokeWidth, 2);
      expect(custom.size, const Size(32, 2));
    });
  });

  group('polygon', () {
    testWidgets('flat points, tight bounds, fill and stroke', (tester) async {
      await tester.pumpWidget(wrap({
        'type': 'polygon',
        'points': [50, 0, 100, 40, 0, 40],
        'fill': '#0000ff',
        'stroke': '#ffff00',
        'strokeWidth': 6,
      }));
      final custom = tester.widget<CustomPaint>(polygonFinder);
      // Bounds 100x40 + 6 stroke inset.
      expect(custom.size, const Size(106, 46));
      final painter = custom.painter as JsPolygonPainter;
      expect(painter.points.length, 3);
      expect(painter.origin, Offset.zero); // minX/minY both 0 in these points
      expect(painter.fill, const Color(0xFF0000FF));
      expect(painter.stroke, const Color(0xFFFFFF00));
    });

    testWidgets('degenerate inputs shrink', (tester) async {
      for (final props in [
        {'type': 'polygon', 'points': [0, 0, 10, 10], 'fill': 'red'},
        {'type': 'polygon', 'points': [], 'fill': 'red'},
        {'type': 'polygon', 'fill': 'red'},
        {'type': 'polygon', 'points': '0,0,10,10,5,10', 'fill': 'red'},
        {'type': 'polygon', 'points': [0, 0, 10, 10, 5, 10]}, // no ink
      ]) {
        await tester.pumpWidget(wrap(Map<String, dynamic>.from(props)));
        expect(polygonFinder, findsNothing, reason: 'props: $props');
      }
    });

    testWidgets('numeric strings and trailing odd point are tolerated',
        (tester) async {
      await tester.pumpWidget(wrap({
        'type': 'polygon',
        'points': ['0', '0', '20', '0', '10', '20', '99'],
        'fill': 'red',
      }));
      final painter = tester.widget<CustomPaint>(polygonFinder).painter
          as JsPolygonPainter;
      expect(painter.points.length, 3);
      expect(tester.getSize(polygonFinder), const Size(20, 20));
    });
  });

  group('painter repaint semantics', () {
    // Full branch coverage of shouldRepaint (CRAP ratchet): identical props
    // -> false; each changed prop -> true.
    test('JsRectPainter', () {
      JsRectPainter rect({
        double radius = 4,
        Color? fill,
        Color? stroke,
        double strokeWidth = 0,
      }) => JsRectPainter(
        radius: radius,
        fill: fill ?? const Color(0xFFFF0000),
        stroke: stroke,
        strokeWidth: strokeWidth,
      );
      final base = rect();
      expect(base.shouldRepaint(rect()), isFalse);
      expect(base.shouldRepaint(rect(radius: 8)), isTrue);
      expect(base.shouldRepaint(rect(fill: const Color(0xFF00FF00))), isTrue);
      expect(base.shouldRepaint(rect(stroke: const Color(0xFF0000FF))), isTrue);
      expect(base.shouldRepaint(rect(strokeWidth: 2)), isTrue);
    });

    test('JsCirclePainter', () {
      JsCirclePainter circle({Color? fill, Color? stroke, double strokeWidth = 0}) =>
          JsCirclePainter(
            fill: fill ?? const Color(0xFFFF0000),
            stroke: stroke,
            strokeWidth: strokeWidth,
          );
      final base = circle();
      expect(base.shouldRepaint(circle()), isFalse);
      expect(base.shouldRepaint(circle(fill: const Color(0xFF00FF00))), isTrue);
      expect(
        base.shouldRepaint(circle(stroke: const Color(0xFF0000FF))),
        isTrue,
      );
      expect(base.shouldRepaint(circle(strokeWidth: 2)), isTrue);
    });

    test('JsLinePainter', () {
      JsLinePainter line({
        Offset? start,
        Offset? end,
        Offset? origin,
        Color? stroke,
        double strokeWidth = 2,
      }) => JsLinePainter(
        start: start ?? Offset.zero,
        end: end ?? const Offset(10, 0),
        origin: origin ?? Offset.zero,
        stroke: stroke ?? const Color(0xFFFF0000),
        strokeWidth: strokeWidth,
      );
      final base = line();
      expect(base.shouldRepaint(line()), isFalse);
      expect(base.shouldRepaint(line(start: const Offset(1, 0))), isTrue);
      expect(base.shouldRepaint(line(end: const Offset(0, 10))), isTrue);
      expect(base.shouldRepaint(line(origin: const Offset(1, 1))), isTrue);
      expect(
        base.shouldRepaint(line(stroke: const Color(0xFF00FF00))),
        isTrue,
      );
      expect(base.shouldRepaint(line(strokeWidth: 6)), isTrue);
    });

    test('JsPolygonPainter', () {
      final points = <Offset>[Offset.zero, const Offset(10, 0), const Offset(5, 10)];
      JsPolygonPainter polygon({
        List<Offset>? pointsArg,
        Offset? origin,
        Color? fill,
        Color? stroke,
        double strokeWidth = 0,
      }) => JsPolygonPainter(
        // Reuse the SAME list instance so the identity comparison in
        // shouldRepaint can be exercised both ways.
        points: pointsArg ?? points,
        origin: origin ?? Offset.zero,
        fill: fill ?? const Color(0xFFFF0000),
        stroke: stroke,
        strokeWidth: strokeWidth,
      );
      final base = polygon();
      expect(base.shouldRepaint(polygon()), isFalse);
      expect(
        base.shouldRepaint(polygon(pointsArg: [...points])),
        isTrue,
      ); // new list instance repaints
      expect(base.shouldRepaint(polygon(origin: const Offset(1, 1))), isTrue);
      expect(
        base.shouldRepaint(polygon(fill: const Color(0xFF00FF00))),
        isTrue,
      );
      expect(
        base.shouldRepaint(polygon(stroke: const Color(0xFF0000FF))),
        isTrue,
      );
      expect(base.shouldRepaint(polygon(strokeWidth: 2)), isTrue);
    });
  });

  group('normalizer', () {
    // The render switch is exact-match (hosts render canonical types); the
    // UiViewTreeNormalizer maps LLM-style PascalCase for the bindings walk.
    test('maps PascalCase shape aliases', () {
      expect(
        UiViewTreeNormalizer.normalize({'type': 'Rect'})['type'],
        'rect',
      );
      expect(
        UiViewTreeNormalizer.normalize({'type': 'Circle'})['type'],
        'circle',
      );
      expect(
        UiViewTreeNormalizer.normalize({'type': 'Line'})['type'],
        'line',
      );
      expect(
        UiViewTreeNormalizer.normalize({'type': 'Polygon'})['type'],
        'polygon',
      );
    });
  });
}

