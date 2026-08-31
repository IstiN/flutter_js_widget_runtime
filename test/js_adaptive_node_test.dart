import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

Widget _wrap(Widget child, Size size) => MaterialApp(
      home: Scaffold(
        body: SizedBox(width: size.width, height: size.height, child: child),
      ),
    );

Map<String, dynamic> _adaptiveTree() => {
      'type': 'adaptive',
      'compact': {'type': 'text', 'data': 'C'},
      'medium': {'type': 'text', 'data': 'M'},
      'expanded': {'type': 'text', 'data': 'E'},
    };

void main() {
  group('adaptive node', () {
    Future<void> pumpAt(WidgetTester tester, double width,
        [Map<String, dynamic>? tree]) async {
      // The default test surface is 800x600 — widen it so widths above
      // 800 are not clamped before the LayoutBuilder sees them.
      await tester.binding.setSurfaceSize(Size(width, 400));
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);
      final renderer = JsonWidgetRenderer(onEvent: (_, __) {});
      await tester.pumpWidget(
        _wrap(renderer.build(tree ?? _adaptiveTree(), null), Size(width, 400)),
      );
    }

    testWidgets('picks compact below 600', (tester) async {
      await pumpAt(tester, 500);
      expect(find.text('C'), findsOneWidget);
    });

    testWidgets('picks medium between 600 and 840', (tester) async {
      await pumpAt(tester, 700);
      expect(find.text('M'), findsOneWidget);
    });

    testWidgets('picks expanded at 840+', (tester) async {
      await pumpAt(tester, 1000);
      expect(find.text('E'), findsOneWidget);
    });

    testWidgets('missing tier falls back to the nearest defined one',
        (tester) async {
      await pumpAt(tester, 700, {
        'type': 'adaptive',
        'compact': {'type': 'text', 'data': 'C'},
        'expanded': {'type': 'text', 'data': 'E'},
      });
      // medium tier missing → compact (nearest defined)
      expect(find.text('C'), findsOneWidget);
      await pumpAt(tester, 500, {
        'type': 'adaptive',
        'expanded': {'type': 'text', 'data': 'E'},
      });
      // compact tier missing → expanded (nearest defined)
      expect(find.text('E'), findsOneWidget);
    });

    testWidgets('honours custom breakpoints', (tester) async {
      await pumpAt(tester, 300, {
        'type': 'adaptive',
        'breakpoints': [200, 400],
        'compact': {'type': 'text', 'data': 'C'},
        'medium': {'type': 'text', 'data': 'M'},
        'expanded': {'type': 'text', 'data': 'E'},
      });
      expect(find.text('M'), findsOneWidget); // 200 <= 300 < 400
    });
  });

  group('gridView maxCrossAxisExtent', () {
    Map<String, dynamic> grid() => {
          'type': 'gridView',
          'maxCrossAxisExtent': 200,
          'shrinkWrap': true,
          'children': List.generate(
            6,
            (i) => {'type': 'text', 'data': 'item$i'},
          ),
        };

    testWidgets('column count floats with the allotted width',
        (tester) async {
      await tester.binding.setSurfaceSize(const Size(800, 600));
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);
      final renderer = JsonWidgetRenderer(onEvent: (_, __) {});
      // 380 wide / 200 max extent → 2 columns → item2 lands on row 2.
      await tester.pumpWidget(
        _wrap(renderer.build(grid(), null), const Size(380, 600)),
      );
      final narrowTop = tester.getTopLeft(find.text('item2')).dy;
      // 760 wide / 200 → 4 columns → item2 stays on row 1.
      await tester.pumpWidget(
        _wrap(renderer.build(grid(), null), const Size(760, 600)),
      );
      final wideTop = tester.getTopLeft(find.text('item2')).dy;
      expect(narrowTop, greaterThan(wideTop));
    });
  });
}
