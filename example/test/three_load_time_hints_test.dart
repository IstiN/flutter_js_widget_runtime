import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime_example/three_example.dart';
import 'package:js_widget_runtime_example/three_load_time_hints.dart';

/// The catalog first-paint annotation is data-driven: only widget ids present
/// in the generated `three_load_time_hints.dart` map render the muted
/// "≈8s — reason" line under their sidebar entry; everything else stays clean.
void main() {
  Future<String?> renderedHintText(WidgetTester tester, String widgetId) async {
    tester.view.physicalSize = const Size(600, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ListView(
            children: [
              ListTile(
                dense: true,
                title: const Text('entry-title'),
                subtitle: ThreeLoadTimeHintLine(widgetId: widgetId),
              ),
            ],
          ),
        ),
      ),
    );
    await tester.pump();
    final texts = tester
        .widgetList<Text>(
          find.descendant(
            of: find.byType(ListTile),
            matching: find.byType(Text),
          ),
        )
        .toList();
    // [0] is the title; the hint line is the subtitle text, if any.
    return texts.length > 1 ? texts[1].data : null;
  }

  test('hint map only covers three-* widget ids with label + reason', () {
    expect(kThreeLoadTimeHints, isNotEmpty);
    kThreeLoadTimeHints.forEach((id, hint) {
      expect(id, startsWith('three-'), reason: id);
      expect(hint.label, matches(RegExp(r'^(≈\d+s|no frame)$')), reason: id);
      expect(hint.reason, isNotEmpty, reason: id);
    });
  });

  test('every annotated id is reachable from the catalog sidebar', () {
    final sidebarIds = ThreeExampleSelection.sidebarOrder
        .map((selection) => selection.widgetId)
        .toSet();
    for (final id in kThreeLoadTimeHints.keys) {
      expect(sidebarIds, contains(id), reason: id);
    }
  });

  testWidgets('annotation renders for the slow class and not for fast ones', (
    tester,
  ) async {
    final slowId = kThreeLoadTimeHints.keys.first;
    final slowText = await renderedHintText(tester, slowId);
    expect(slowText, isNotNull);
    expect(slowText, contains(kThreeLoadTimeHints[slowId]!.label));
    expect(slowText, contains(kThreeLoadTimeHints[slowId]!.reason));

    // A sidebar widget without a measured >5s first paint renders no line.
    final fastId = ThreeExampleSelection.sidebarOrder
        .map((selection) => selection.widgetId)
        .firstWhere((id) => !kThreeLoadTimeHints.containsKey(id));
    expect(await renderedHintText(tester, fastId), isNull);
  });
}
