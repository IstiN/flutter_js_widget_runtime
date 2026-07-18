import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_path_node.dart';

void main() {
  final pathFinder = find.byWidgetPredicate(
    (w) => w is CustomPaint && w.painter is JsPathPainter,
  );

  group('buildJsPathNode', () {
    Widget buildNode(Map<String, dynamic> props) {
      return MaterialApp(
        home: Scaffold(body: buildJsPathNode(props)),
      );
    }

    testWidgets('returns SizedBox.shrink for empty path', (tester) async {
      await tester.pumpWidget(buildNode({'path': ''}));
      final shrinkFinder = find.byWidgetPredicate(
        (w) =>
            w is SizedBox &&
            w.width == 0.0 &&
            w.height == 0.0 &&
            w.child == null,
      );
      expect(shrinkFinder, findsOneWidget);
    });

    testWidgets('omits SizedBox when no size is given', (tester) async {
      await tester.pumpWidget(buildNode({'path': 'M0 0 L10 10'}));
      expect(pathFinder, findsOneWidget);
      expect(
        find.ancestor(of: pathFinder, matching: find.byType(SizedBox)),
        findsNothing,
      );
    });

    testWidgets('wraps in SizedBox when width/height are given',
        (tester) async {
      await tester.pumpWidget(buildNode({
        'path': 'M0 0 L10 10',
        'width': 64,
        'height': 64,
      }));
      final sizedBoxFinder = find.ancestor(
        of: pathFinder,
        matching: find.byType(SizedBox),
      );
      expect(sizedBoxFinder, findsOneWidget);
      final sizedBox = tester.widget<SizedBox>(sizedBoxFinder);
      expect(sizedBox.width, 64);
      expect(sizedBox.height, 64);
    });

    testWidgets('passes cap/join to painter', (tester) async {
      await tester.pumpWidget(buildNode({
        'path': 'M0 0 L10 10',
        'cap': 'butt',
        'join': 'miter',
      }));
      final customPaint = tester.widget<CustomPaint>(pathFinder);
      final painter = customPaint.painter! as JsPathPainter;
      expect(painter.cap, StrokeCap.butt);
      expect(painter.join, StrokeJoin.miter);
    });
  });

  group('parseSvgPathData', () {
    test('parses absolute line commands', () {
      final path = parseSvgPathData('M10 10 L20 20 H30 V40');
      expect(path.getBounds().isEmpty, isFalse);
    });

    test('parses relative line commands', () {
      final path = parseSvgPathData('M10 10 l10 10 h10 v10');
      expect(path.getBounds().isEmpty, isFalse);
    });

    test('parses implicit lineTo after M', () {
      final path = parseSvgPathData('M0 0 10 10 20 0');
      expect(path.getBounds().isEmpty, isFalse);
    });

    test('parses cubic and smooth cubic curves', () {
      final path = parseSvgPathData(
        'M0 0 C10 10 20 10 30 0 S50 -10 60 0',
      );
      expect(path.getBounds().isEmpty, isFalse);
    });

    test('parses relative cubic curves', () {
      final path = parseSvgPathData('M0 0 c10 10 20 10 30 0 s20 -10 30 0');
      expect(path.getBounds().isEmpty, isFalse);
    });

    test('parses quadratic and smooth quadratic curves', () {
      final path = parseSvgPathData('M0 0 Q10 20 20 0 T40 0');
      expect(path.getBounds().isEmpty, isFalse);
    });

    test('parses relative quadratic curves', () {
      final path = parseSvgPathData('M0 0 q10 20 20 0 t20 0');
      expect(path.getBounds().isEmpty, isFalse);
    });

    test('parses elliptical arcs', () {
      final path = parseSvgPathData('M0 0 A20 20 0 0 1 20 20');
      expect(path.getBounds().isEmpty, isFalse);
    });

    test('parses relative elliptical arcs', () {
      final path = parseSvgPathData('M10 10 a10 10 0 1 0 10 10');
      expect(path.getBounds().isEmpty, isFalse);
    });

    test('parses close path', () {
      final path = parseSvgPathData('M0 0 L10 0 L10 10 Z');
      expect(path.getBounds().isEmpty, isFalse);
    });

    test('ignores unknown commands without trailing numbers', () {
      final path = parseSvgPathData('M0 0 L10 10 Z X');
      expect(path.getBounds().isEmpty, isFalse);
    });

    test('handles whitespace and commas in data', () {
      final path = parseSvgPathData('M 0,0\tL10,10\nV20');
      expect(path.getBounds().isEmpty, isFalse);
    });

    test('handles arc with zero radii as line', () {
      final path = parseSvgPathData('M0 0 A0 0 0 0 0 10 10');
      expect(path.getBounds().isEmpty, isFalse);
    });

    test('handles arc with identical endpoints as line', () {
      final path = parseSvgPathData('M5 5 A10 10 0 0 1 5 5');
      expect(path.getBounds().isEmpty, isTrue);
    });

    test('throws on invalid number', () {
      expect(
        () => parseSvgPathData('M0 0 Labc def'),
        throwsA(isA<FormatException>()),
      );
    });
  });

  group('JsPathPainter', () {
    testWidgets('paints path without errors', (tester) async {
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 100,
            height: 100,
            child: buildJsPathNode({
              'path': 'M0 0 L50 50 L100 0 Z',
              'color': '#00FF00',
              'strokeWidth': 2,
            }),
          ),
        ),
      ));
      expect(pathFinder, findsOneWidget);
      await tester.pumpAndSettle();
    });

    testWidgets('paints complex path with arcs and curves',
        (tester) async {
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 200,
            height: 200,
            child: buildJsPathNode({
              'path':
                  'M10 80 C40 10 65 10 95 80 S150 150 180 80 '
                  'Q100 150 20 80 A30 30 0 1 1 70 80 Z',
              'progress': 0.8,
              'cap': 'square',
              'join': 'bevel',
            }),
          ),
        ),
      ));
      await tester.pumpAndSettle();
      final customPaint = tester.widget<CustomPaint>(pathFinder);
      final painter = customPaint.painter! as JsPathPainter;
      expect(painter.cap, StrokeCap.square);
      expect(painter.join, StrokeJoin.bevel);
    });

    JsPathPainter samplePainter({
      String? path,
      double? progress,
      Color? color,
      double? strokeWidth,
      StrokeCap? cap,
      StrokeJoin? join,
    }) =>
        JsPathPainter(
          path: path ?? 'M0 0 L10 10',
          progress: progress ?? 1,
          color: color ?? Colors.white,
          strokeWidth: strokeWidth ?? 2,
          cap: cap ?? StrokeCap.round,
          join: join ?? StrokeJoin.round,
        );

    test('shouldRepaint returns true when properties change', () {
      final painter = samplePainter();
      expect(painter.shouldRepaint(samplePainter(path: 'M0 0 L20 20')), isTrue);
      expect(painter.shouldRepaint(samplePainter(progress: 0.5)), isTrue);
      expect(painter.shouldRepaint(samplePainter(color: Colors.black)), isTrue);
      expect(painter.shouldRepaint(samplePainter(strokeWidth: 4)), isTrue);
      expect(painter.shouldRepaint(samplePainter(cap: StrokeCap.butt)), isTrue);
      expect(
        painter.shouldRepaint(samplePainter(join: StrokeJoin.bevel)),
        isTrue,
      );
    });

    test('shouldRepaint returns false for identical painter', () {
      final painter = samplePainter();
      expect(painter.shouldRepaint(samplePainter()), isFalse);
    });
  });

  group('color via node', () {
    Future<JsPathPainter> pumpPainter(
      WidgetTester tester, {
      required String color,
    }) async {
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: buildJsPathNode({
            'path': 'M0 0 L10 10',
            'color': color,
          }),
        ),
      ));
      final customPaint = tester.widget<CustomPaint>(pathFinder);
      return customPaint.painter! as JsPathPainter;
    }

    testWidgets('parses 6-digit hex color', (tester) async {
      final painter = await pumpPainter(tester, color: '#FF5733');
      expect(painter.color, const Color(0xFFFF5733));
    });

    testWidgets('parses 3-digit hex color', (tester) async {
      final painter = await pumpPainter(tester, color: '#ABC');
      expect(painter.color, const Color(0xFFAABBCC));
    });

    testWidgets('parses named colors', (tester) async {
      final red = await pumpPainter(tester, color: 'red');
      expect(red.color, Colors.red);
      final gray = await pumpPainter(tester, color: 'gray');
      expect(gray.color, Colors.grey);
    });

    testWidgets('falls back to white for unknown color', (tester) async {
      final painter = await pumpPainter(tester, color: 'magentaish');
      expect(painter.color, Colors.white);
    });
  });
}
