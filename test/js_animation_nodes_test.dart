import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_animation_nodes.dart';

void main() {
  group('animation nodes', () {
    late JsonWidgetRenderer renderer;

    setUp(() {
      renderer = JsonWidgetRenderer(onEvent: (_, __) {});
    });

    Widget buildTree(Map<String, dynamic>? tree) {
      return MaterialApp(home: Scaffold(body: renderer.build(tree)));
    }

    Finder entranceOpacity() => find.descendant(
      of: find.byType(JsEntranceAnimation),
      matching: find.byType(Opacity),
    );

    Finder entranceTransform() => find.descendant(
      of: find.byType(JsEntranceAnimation),
      matching: find.byType(Transform),
    );

    double opacityOf(WidgetTester tester) =>
        tester.widget<Opacity>(entranceOpacity()).opacity;

    group('entrance', () {
      testWidgets(
        'fade starts transparent and completes after delay+duration',
        (tester) async {
          await tester.pumpWidget(
            buildTree({
              'type': 'entrance',
              'animation': 'fade',
              'delay': 200,
              'duration': 300,
              'child': {'type': 'text', 'data': 'hi'},
            }),
          );
          expect(find.text('hi'), findsOneWidget);
          expect(opacityOf(tester), 0.0);

          // Still hidden while the delay hold runs.
          await tester.pump(const Duration(milliseconds: 100));
          expect(opacityOf(tester), 0.0);

          await tester.pump(const Duration(milliseconds: 400));
          expect(opacityOf(tester), 1.0);
        },
      );

      testWidgets('slideUp starts at offset and settles at identity', (
        tester,
      ) async {
        await tester.pumpWidget(
          buildTree({
            'type': 'entrance',
            'animation': 'slideUp',
            'duration': 300,
            'child': {'type': 'text', 'data': 'hi'},
          }),
        );
        final startMatrix = tester
            .widget<Transform>(entranceTransform())
            .transform;
        expect(startMatrix.getTranslation().y, 24.0);

        await tester.pump(const Duration(milliseconds: 300));
        final endMatrix = tester
            .widget<Transform>(entranceTransform())
            .transform;
        expect(endMatrix.getTranslation().y, 0.0);
        expect(endMatrix.getTranslation().x, 0.0);
      });

      testWidgets('all 7 variants construct without error', (tester) async {
        for (final variant in [
          'fade',
          'slideUp',
          'slideDown',
          'slideLeft',
          'slideRight',
          'scale',
          'fadeScale',
        ]) {
          await tester.pumpWidget(
            buildTree({
              'type': 'entrance',
              'animation': variant,
              'duration': 300,
              'child': {'type': 'text', 'data': variant},
            }),
          );
          expect(find.text(variant), findsOneWidget);
          await tester.pump(const Duration(milliseconds: 300));
          expect(find.text(variant), findsOneWidget);
        }
      });

      testWidgets('staggered delays all complete with no timers left pending', (
        tester,
      ) async {
        await tester.pumpWidget(
          buildTree({
            'type': 'column',
            'children': [
              for (var i = 0; i < 3; i++)
                {
                  'type': 'entrance',
                  'animation': 'slideUp',
                  'delay': i * 60,
                  'duration': 300,
                  'child': {'type': 'text', 'data': 'row $i'},
                },
            ],
          }),
        );
        // Longest entrance: 120ms delay + 300ms duration.
        await tester.pump(const Duration(milliseconds: 420));
        for (var i = 0; i < 3; i++) {
          expect(find.text('row $i'), findsOneWidget);
        }
        final transforms = tester.widgetList<Transform>(entranceTransform());
        for (final t in transforms) {
          expect(t.transform.getTranslation().y, 0.0);
        }
      });

      testWidgets('zero duration renders child directly', (tester) async {
        await tester.pumpWidget(
          buildTree({
            'type': 'entrance',
            'animation': 'fade',
            'duration': 0,
            'child': {'type': 'text', 'data': 'hi'},
          }),
        );
        expect(find.text('hi'), findsOneWidget);
        expect(find.byType(TweenAnimationBuilder<double>), findsNothing);
      });

      testWidgets('tolerant input: unknown variant and garbage props', (
        tester,
      ) async {
        await tester.pumpWidget(
          buildTree({
            'type': 'entrance',
            'animation': 'wobble', // unknown -> fade
            'delay': 'abc', // garbage -> 0
            'duration': '300', // numeric string parses
            'curve': {'nope': true}, // garbage -> default curve
            'child': {'type': 'text', 'data': 'hi'},
          }),
        );
        expect(find.text('hi'), findsOneWidget);
        expect(opacityOf(tester), 0.0);
        await tester.pump(const Duration(milliseconds: 300));
        expect(opacityOf(tester), 1.0);
      });
    });

    group('animatedSwitcher', () {
      Map<String, dynamic> switcherTree(String key, String label) => {
        'type': 'animatedSwitcher',
        'switchKey': key,
        'duration': 300,
        'child': {'type': 'text', 'data': label},
      };

      testWidgets('initial render shows child', (tester) async {
        await tester.pumpWidget(buildTree(switcherTree('list', 'List view')));
        expect(find.text('List view'), findsOneWidget);
        expect(find.byType(AnimatedSwitcher), findsOneWidget);
      });

      testWidgets('changing switchKey cross-fades old child out', (
        tester,
      ) async {
        await tester.pumpWidget(buildTree(switcherTree('list', 'List view')));
        await tester.pumpWidget(
          buildTree(switcherTree('detail', 'Detail view')),
        );

        // Mid-transition: both children present (no ghost stacking after).
        await tester.pump(const Duration(milliseconds: 100));
        expect(find.text('List view'), findsOneWidget);
        expect(find.text('Detail view'), findsOneWidget);

        await tester.pump(const Duration(milliseconds: 300));
        expect(find.text('List view'), findsNothing);
        expect(find.text('Detail view'), findsOneWidget);
      });

      testWidgets('numeric switchKey triggers transition on change', (
        tester,
      ) async {
        await tester.pumpWidget(buildTree(switcherTree('1', 'Page 1')));
        // switchKey as num, not string.
        await tester.pumpWidget(
          buildTree({
            'type': 'animatedSwitcher',
            'switchKey': 2,
            'duration': 300,
            'child': {'type': 'text', 'data': 'Page 2'},
          }),
        );
        await tester.pump(const Duration(milliseconds: 100));
        expect(find.text('Page 1'), findsOneWidget);
        expect(find.text('Page 2'), findsOneWidget);
        await tester.pump(const Duration(milliseconds: 300));
        expect(find.text('Page 1'), findsNothing);
      });

      testWidgets('same switchKey does NOT re-animate', (tester) async {
        await tester.pumpWidget(buildTree(switcherTree('list', 'Old text')));
        await tester.pumpWidget(buildTree(switcherTree('list', 'New text')));
        await tester.pump();
        // In-place update: no stacking, old child is immediately gone.
        expect(find.text('Old text'), findsNothing);
        expect(find.text('New text'), findsOneWidget);
      });

      testWidgets('all variants build and settle', (tester) async {
        for (final variant in [
          'fade',
          'slideLeft',
          'slideRight',
          'slideUp',
          'scale',
          'fadeScale',
        ]) {
          await tester.pumpWidget(
            buildTree({
              'type': 'animatedSwitcher',
              'switchKey': 'a',
              'animation': variant,
              'duration': 300,
              'child': {'type': 'text', 'data': variant},
            }),
          );
          await tester.pumpWidget(
            buildTree({
              'type': 'animatedSwitcher',
              'switchKey': 'b',
              'animation': variant,
              'duration': 300,
              'child': {'type': 'text', 'data': '$variant b'},
            }),
          );
          await tester.pump(const Duration(milliseconds: 400));
          expect(find.text('$variant b'), findsOneWidget);
          expect(find.text(variant), findsNothing);
        }
      });

      testWidgets('tolerant input: unknown variant and string duration', (
        tester,
      ) async {
        await tester.pumpWidget(
          buildTree({
            'type': 'animatedSwitcher',
            'switchKey': 'a',
            'animation': 'teleport', // unknown -> fade
            'duration': '300', // numeric string parses
            'curve': 42, // garbage -> default curve
            'child': {'type': 'text', 'data': 'A'},
          }),
        );
        expect(find.text('A'), findsOneWidget);
        expect(find.byType(FadeTransition), findsWidgets);

        await tester.pumpWidget(
          buildTree({
            'type': 'animatedSwitcher',
            'switchKey': 'b',
            'animation': 'teleport',
            'duration': '300',
            'child': {'type': 'text', 'data': 'B'},
          }),
        );
        await tester.pump(const Duration(milliseconds: 400));
        expect(find.text('A'), findsNothing);
        expect(find.text('B'), findsOneWidget);
      });

      testWidgets('garbage duration falls back to default 300ms', (
        tester,
      ) async {
        await tester.pumpWidget(
          buildTree({
            'type': 'animatedSwitcher',
            'switchKey': 'a',
            'duration': [null], // garbage -> 300
            'child': {'type': 'text', 'data': 'A'},
          }),
        );
        final switcher = tester.widget<AnimatedSwitcher>(
          find.byType(AnimatedSwitcher),
        );
        expect(switcher.duration, const Duration(milliseconds: 300));
      });
    });
  });
}
