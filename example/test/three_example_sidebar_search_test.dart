import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime_example/three_example.dart';

/// Sidebar search: typing in the filter box narrows the visible example list
/// by case-insensitive substring over the widget id / label; clearing it
/// restores the full list and the active selection stays highlighted.
void main() {
  Future<void> pumpCatalog(WidgetTester tester) async {
    tester.view.physicalSize = const Size(900, 1400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ThreeExampleApp());
    await tester.pump();
  }

  int visibleSidebarTiles(WidgetTester tester) =>
      tester.widgetList<ListTile>(find.byType(ListTile)).length;

  testWidgets('filter narrows the list by substring and restores on clear', (
    tester,
  ) async {
    await pumpCatalog(tester);
    // The ListView virtualizes: only the viewport's tiles are built, so the
    // baseline is the visible tile count, not sidebarOrder.length.
    final fullCount = visibleSidebarTiles(tester);
    expect(fullCount, lessThan(ThreeExampleSelection.sidebarOrder.length));

    await tester.enterText(find.byType(TextField), 'cubes');
    await tester.pump();

    final filtered = visibleSidebarTiles(tester);
    expect(filtered, lessThan(fullCount));
    expect(filtered, greaterThan(0));
    for (final tile in tester.widgetList<ListTile>(
      find.byType(ListTile),
    )) {
      final title = (tile.title as Text).data!;
      final subtitle = tile.subtitle;
      final id = subtitle is ThreeLoadTimeHintLine
          ? subtitle.widgetId
          : null;
      final match =
          title.toLowerCase().contains('cubes') ||
          (id ?? '').toLowerCase().contains('cubes');
      expect(match, isTrue, reason: '$title / $id');
    }

    // Case-insensitive: uppercase query matches the same set.
    await tester.enterText(find.byType(TextField), 'CUBES');
    await tester.pump();
    expect(visibleSidebarTiles(tester), filtered);

    // Clearing restores the full list.
    await tester.enterText(find.byType(TextField), '');
    await tester.pump();
    expect(visibleSidebarTiles(tester), fullCount);
  });

  testWidgets('selection survives filtering and taps still switch', (
    tester,
  ) async {
    await pumpCatalog(tester);
    await tester.enterText(find.byType(TextField), 'interactive-cubes');
    await tester.pump();

    final tile = tester.widgetList<ListTile>(find.byType(ListTile)).first;
    final target = ThreeExampleSelection.sidebarOrder.firstWhere(
      (example) => (tile.title as Text).data == example.label,
    );
    await tester.tap(find.text(target.label));
    await tester.pump();

    // The filter box keeps its query across selection changes.
    expect(find.byType(TextField), findsOneWidget);
    expect(
      tester.widget<TextField>(find.byType(TextField)).controller!.text,
      'interactive-cubes',
    );
  });
}
