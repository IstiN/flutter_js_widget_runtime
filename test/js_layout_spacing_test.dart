import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/json_widget_renderer.dart';

/// Pins `spacing` on `column`/`row` nodes.
///
/// Background (yoclip music_animation, 2026-10-25): JS scenes used
/// `spacing` for word gaps in kinetic lyrics, but the renderer silently
/// dropped it, so words touched. The fix forwards the prop to Flutter
/// `Flex.spacing`; these tests pin the actual pixel gaps.
void main() {
  late JsonWidgetRenderer renderer;
  setUp(() {
    renderer = JsonWidgetRenderer(onEvent: (_, __) {});
  });

  Widget harness(Widget child) => MaterialApp(
    home: Scaffold(
      body: SizedBox(
        width: 800,
        height: 600,
        child: Align(alignment: Alignment.topLeft, child: child),
      ),
    ),
  );

  // Text-only children: intrinsic bounds touch exactly, so the measured
  // gap equals `spacing` (container nodes carry a default padding).
  Map<String, Object?> box(String label) => {'type': 'text', 'data': label};

  testWidgets('column spacing inserts a fixed vertical gap', (tester) async {
    await tester.pumpWidget(
      harness(
        renderer.build({
          'type': 'column',
          'spacing': 12,
          'children': [box('A'), box('B'), box('C')],
        }),
      ),
    );
    final aBottom = tester.getBottomLeft(find.text('A')).dy;
    final bTop = tester.getTopLeft(find.text('B')).dy;
    final bBottom = tester.getBottomLeft(find.text('B')).dy;
    final cTop = tester.getTopLeft(find.text('C')).dy;
    expect(bTop - aBottom, closeTo(12, 0.01));
    expect(cTop - bBottom, closeTo(12, 0.01));
  });

  testWidgets('row spacing inserts a fixed horizontal gap', (tester) async {
    await tester.pumpWidget(
      harness(
        renderer.build({
          'type': 'row',
          'spacing': 18,
          'children': [box('A'), box('B')],
        }),
      ),
    );
    final aRight = tester.getBottomRight(find.text('A')).dx;
    final bLeft = tester.getTopLeft(find.text('B')).dx;
    expect(bLeft - aRight, closeTo(18, 0.01));
  });

  testWidgets('missing spacing keeps children adjacent', (tester) async {
    await tester.pumpWidget(
      harness(
        renderer.build({
          'type': 'column',
          'children': [box('A'), box('B')],
        }),
      ),
    );
    final aBottom = tester.getBottomLeft(find.text('A')).dy;
    final bTop = tester.getTopLeft(find.text('B')).dy;
    expect(bTop - aBottom, closeTo(0, 0.01));
  });
}
