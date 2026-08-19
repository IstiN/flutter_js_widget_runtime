import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_node_helpers.dart';

void main() {
  group('JsonWidgetRenderer M3 overlay nodes', () {
    late List<(String, Map<String, dynamic>)> events;
    late JsonWidgetRenderer renderer;

    setUp(() {
      events = [];
      renderer = JsonWidgetRenderer(
        onEvent: (id, payload) => events.add((id, payload)),
      );
    });

    Widget buildTree(Map<String, dynamic>? tree) {
      return MaterialApp(home: Scaffold(body: renderer.build(tree)));
    }

    testWidgets('bottomSheet shows child and fires dismiss on drag close', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'bottomSheet',
          'height': 200,
          'color': '#FFFFFF',
          'child': {'type': 'text', 'data': 'sheet body'},
        }),
      );
      await tester.pump();
      await tester.pumpAndSettle();
      expect(find.text('sheet body'), findsOneWidget);

      await tester.drag(find.text('sheet body'), const Offset(0, 400));
      await tester.pumpAndSettle();
      expect(find.text('sheet body'), findsNothing);
      expect(events.single.$1, 'bottomSheetDismiss');
      expect(events.single.$2, <String, dynamic>{});
    });

    testWidgets('bottomSheet fires custom onDismiss on barrier tap', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'bottomSheet',
          'onDismiss': 'sheet_closed',
          'child': {'type': 'text', 'data': 'sheet body'},
        }),
      );
      await tester.pump();
      await tester.pumpAndSettle();
      expect(find.text('sheet body'), findsOneWidget);

      await tester.tapAt(const Offset(10, 10));
      await tester.pumpAndSettle();
      expect(events.single.$1, 'sheet_closed');
    });

    testWidgets('removing bottomSheet node pops the sheet without throwing', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'column',
          'children': [
            {
              'type': 'bottomSheet',
              'child': {'type': 'text', 'data': 'sheet body'},
            },
          ],
        }),
      );
      await tester.pump();
      await tester.pumpAndSettle();
      expect(find.text('sheet body'), findsOneWidget);

      await tester.pumpWidget(
        buildTree({
          'type': 'column',
          'children': [
            {'type': 'text', 'data': 'no sheet'},
          ],
        }),
      );
      await tester.pumpAndSettle();
      expect(find.text('sheet body'), findsNothing);
      expect(find.text('no sheet'), findsOneWidget);
      // The node was unmounted when the sheet closed: no dismiss event.
      expect(events, isEmpty);
    });

    testWidgets('dialog action pops the dialog and fires onTap only', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'dialog',
          'title': 'Confirm',
          'message': 'Delete the file?',
          'actions': [
            {'label': 'Cancel', 'onTap': 'cancel'},
            {'label': 'Delete', 'onTap': 'delete'},
          ],
        }),
      );
      await tester.pump();
      await tester.pumpAndSettle();
      expect(find.text('Confirm'), findsOneWidget);
      expect(find.text('Delete the file?'), findsOneWidget);

      await tester.tap(find.text('Delete'));
      await tester.pumpAndSettle();
      expect(find.text('Confirm'), findsNothing);
      expect(events.single.$1, 'delete');
    });

    testWidgets('dialog barrier dismiss fires dialogDismiss', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'dialog',
          'title': 'Info',
          'child': {'type': 'text', 'data': 'custom body'},
        }),
      );
      await tester.pump();
      await tester.pumpAndSettle();
      expect(find.text('custom body'), findsOneWidget);

      await tester.tapAt(const Offset(10, 10));
      await tester.pumpAndSettle();
      expect(find.text('custom body'), findsNothing);
      expect(events.single.$1, 'dialogDismiss');
    });

    testWidgets('removing dialog node closes it without firing dismiss', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'dialog',
          'title': 'Confirm',
          'message': 'Close me by removal',
        }),
      );
      await tester.pump();
      await tester.pumpAndSettle();
      expect(find.text('Confirm'), findsOneWidget);

      await tester.pumpWidget(buildTree({'type': 'text', 'data': 'gone'}));
      await tester.pumpAndSettle();
      expect(find.text('Confirm'), findsNothing);
      expect(events, isEmpty);
    });

    testWidgets('snackBar shows message and action fires onAction', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'snackBar',
          'message': 'Item archived',
          'actionLabel': 'Undo',
          'onAction': 'undo',
        }),
      );
      await tester.pump();
      await tester.pumpAndSettle();
      expect(find.text('Item archived'), findsOneWidget);

      await tester.tap(find.text('Undo'));
      await tester.pump();
      expect(events.single.$1, 'undo');
    });

    testWidgets('snackBar without messenger ancestor is a no-op', (
      tester,
    ) async {
      await tester.pumpWidget(
        Directionality(
          textDirection: TextDirection.ltr,
          child: renderer.build({'type': 'snackBar', 'message': 'never shown'}),
        ),
      );
      await tester.pump();
      await tester.pump();
      expect(find.text('never shown'), findsNothing);
    });

    testWidgets('navigationRail posts selected index', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'row',
          'children': [
            {
              'type': 'navigationRail',
              'selectedIndex': 5,
              'onChanged': 'rail_changed',
              'destinations': [
                {'icon': 'home', 'label': 'Home'},
                {'icon': 'settings', 'label': 'Settings'},
              ],
            },
          ],
        }),
      );
      expect(find.byType(NavigationRail), findsOneWidget);
      // selectedIndex is clamped to the last valid destination.
      final rail = tester.widget<NavigationRail>(find.byType(NavigationRail));
      expect(rail.selectedIndex, 1);

      await tester.tap(find.byIcon(Icons.home));
      await tester.pump();
      expect(events.single.$1, 'rail_changed');
      expect(events.single.$2, {'value': 0});
    });

    testWidgets('carousel renders children', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'sizedBox',
          'height': 220,
          'child': {
            'type': 'carousel',
            'itemExtent': 160,
            'children': [
              {'type': 'text', 'data': 'card one'},
              {'type': 'text', 'data': 'card two'},
            ],
          },
        }),
      );
      expect(find.byType(CarouselView), findsOneWidget);
      expect(find.text('card one'), findsOneWidget);
      expect(find.text('card two'), findsOneWidget);
    });

    testWidgets('carousel with no children renders nothing', (tester) async {
      await tester.pumpWidget(buildTree({'type': 'carousel'}));
      expect(find.byType(CarouselView), findsNothing);
    });
  });

  group('jsCurve M3 motion aliases', () {
    test('maps emphasized aliases', () {
      expect(jsCurve('emphasized'), Curves.easeInOutCubicEmphasized);
      expect(jsCurve('emphasizedAccelerate'), Curves.easeInCubic);
      expect(jsCurve('emphasizedDecelerate'), Curves.easeOutCubic);
    });

    test('maps standard aliases', () {
      expect(jsCurve('standard'), Curves.fastOutSlowIn);
      expect(jsCurve('standardAccelerate'), Curves.easeIn);
      expect(jsCurve('standardDecelerate'), Curves.easeOut);
    });

    test('unknown values still fall back to easeInOut', () {
      expect(jsCurve(null), Curves.easeInOut);
      expect(jsCurve('nope'), Curves.easeInOut);
    });
  });
}
