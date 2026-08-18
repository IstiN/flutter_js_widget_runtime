import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

void main() {
  group('JsonWidgetRenderer M3 nodes', () {
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

    testWidgets('appBar renders title and fires action taps', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'appBar',
          'title': 'Dashboard',
          'leading': {'icon': 'arrow_back', 'onTap': 'back'},
          'actions': [
            {'icon': 'search', 'onTap': 'search', 'tooltip': 'Search'},
          ],
          'color': '#112233',
        }),
      );
      expect(find.byType(AppBar), findsOneWidget);
      expect(find.text('Dashboard'), findsOneWidget);

      await tester.tap(find.byIcon(Icons.arrow_back));
      expect(events.single.$1, 'back');

      await tester.tap(find.byIcon(Icons.search));
      expect(events.last.$1, 'search');
    });

    testWidgets('navigationBar posts selected index', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'navigationBar',
          'selectedIndex': 0,
          'onChanged': 'nav_changed',
          'destinations': [
            {'icon': 'home', 'label': 'Home'},
            {'icon': 'settings', 'label': 'Settings'},
          ],
        }),
      );
      expect(find.byType(NavigationBar), findsOneWidget);
      expect(find.text('Home'), findsOneWidget);
      expect(find.text('Settings'), findsOneWidget);

      await tester.tap(find.text('Settings'));
      await tester.pump();
      expect(events.single.$1, 'nav_changed');
      expect(events.single.$2, {'value': 1});
    });

    testWidgets('tabBar renders tabs and pads missing children', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'tabBar',
          'tabs': ['One', 'Two', 'Three'],
          'children': [
            {'type': 'text', 'data': 'first tab'},
          ],
        }),
      );
      expect(find.byType(TabBar), findsOneWidget);
      expect(find.byType(TabBarView), findsOneWidget);
      expect(find.text('One'), findsOneWidget);
      expect(find.text('Three'), findsOneWidget);
      expect(find.text('first tab'), findsOneWidget);

      await tester.tap(find.text('Two'));
      await tester.pumpAndSettle();
    });

    testWidgets('fab fires onTap', (tester) async {
      await tester.pumpWidget(
        buildTree({'type': 'fab', 'icon': 'add', 'onTap': 'add_item'}),
      );
      expect(find.byType(FloatingActionButton), findsOneWidget);
      await tester.tap(find.byType(FloatingActionButton));
      await tester.pump();
      expect(events.single.$1, 'add_item');
    });

    testWidgets('fab with label renders extended variant', (tester) async {
      await tester.pumpWidget(
        buildTree({'type': 'fab', 'label': 'Compose', 'onTap': 'compose'}),
      );
      expect(find.text('Compose'), findsOneWidget);
      await tester.tap(find.text('Compose'));
      await tester.pump();
      expect(events.single.$1, 'compose');
    });

    testWidgets('segmentedButton posts single selection value', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'segmentedButton',
          'onChanged': 'size_changed',
          'selected': ['s'],
          'segments': [
            {'value': 's', 'label': 'Small'},
            {'value': 'm', 'label': 'Medium', 'icon': 'star'},
          ],
        }),
      );
      expect(find.byType(SegmentedButton<String>), findsOneWidget);
      await tester.tap(find.text('Medium'));
      await tester.pump();
      expect(events.single.$1, 'size_changed');
      expect(events.single.$2, {'value': 'm'});
    });

    testWidgets('segmentedButton multiSelect posts value list', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'segmentedButton',
          'multiSelect': true,
          'onChanged': 'filters_changed',
          'selected': ['a'],
          'segments': [
            {'value': 'a', 'label': 'A'},
            {'value': 'b', 'label': 'B'},
          ],
        }),
      );
      await tester.tap(find.text('B'));
      await tester.pump();
      expect(events.single.$1, 'filters_changed');
      expect(events.single.$2, {
        'value': ['a', 'b'],
      });
    });

    testWidgets('radio posts its value and renders label', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'radio',
          'value': 'a',
          'groupValue': 'b',
          'label': 'Option A',
          'onChanged': 'picked',
        }),
      );
      expect(find.byType(Radio<String>), findsOneWidget);
      expect(find.text('Option A'), findsOneWidget);

      await tester.tap(find.byType(Radio<String>));
      await tester.pump();
      expect(events.single.$1, 'picked');
      expect(events.single.$2, {'value': 'a'});
    });

    testWidgets('searchBar posts changed text', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'searchBar',
          'hint': 'Search…',
          'onChanged': 'query',
        }),
      );
      expect(find.byType(SearchBar), findsOneWidget);
      await tester.enterText(find.byType(SearchBar), 'hello');
      await tester.pump();
      expect(events.last.$1, 'query');
      expect(events.last.$2, {'value': 'hello'});
    });

    testWidgets('tooltip wraps child', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'tooltip',
          'message': 'More info',
          'child': {'type': 'text', 'data': 'hover me'},
        }),
      );
      expect(find.byType(Tooltip), findsOneWidget);
      expect(find.text('hover me'), findsOneWidget);
    });

    testWidgets('popupMenu posts selected value', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'popupMenu',
          'icon': 'more_vert',
          'onSelected': 'menu_pick',
          'items': [
            {'value': 'edit', 'label': 'Edit', 'icon': 'edit'},
            {'value': 'delete', 'label': 'Delete'},
          ],
        }),
      );
      expect(find.byType(PopupMenuButton<String>), findsOneWidget);
      await tester.tap(find.byType(PopupMenuButton<String>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Delete'));
      await tester.pumpAndSettle();
      expect(events.single.$1, 'menu_pick');
      expect(events.single.$2, {'value': 'delete'});
    });

    testWidgets('banner renders message and action taps', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'banner',
          'message': 'Update available',
          'icon': 'notifications',
          'actions': [
            {'label': 'Dismiss', 'onTap': 'dismiss'},
          ],
        }),
      );
      expect(find.byType(MaterialBanner), findsOneWidget);
      expect(find.text('Update available'), findsOneWidget);

      await tester.tap(find.text('Dismiss'));
      await tester.pump();
      expect(events.single.$1, 'dismiss');
    });

    testWidgets('bottomAppBar renders children in a row', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'bottomAppBar',
          'color': '#223344',
          'height': 56,
          'children': [
            {'type': 'text', 'data': 'left'},
            {'type': 'text', 'data': 'right'},
          ],
        }),
      );
      expect(find.byType(BottomAppBar), findsOneWidget);
      expect(find.text('left'), findsOneWidget);
      expect(find.text('right'), findsOneWidget);
    });
  });
}
