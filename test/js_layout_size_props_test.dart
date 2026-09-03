import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/json_widget_renderer.dart';

/// Layout probes for size/align props on flex + text nodes.
///
/// Background (yoclip deck bug hand-off, 2026-09-03): a JS scene put
/// `width` + `textAlign: 'center'` on a `text` node nested in columns and
/// expected the text box to be that wide and centered over a sibling tile.
/// JWR historically honored `width` only on `sizedBox`/`container`-style
/// boxes; on `text`/`column`/`row` it was silently dropped, so centering
/// resolved against the intrinsic text width or the full parent width.
///
/// These tests pin the semantics:
/// 1. `text` honors `width`/`height` (the text box gets that size, so
///    `textAlign` centers within it) at any nesting depth.
/// 2. `column`/`row` honor `width`/`height` (flex box capped to that size,
///    same loose-constraint semantics as `container`), so siblings center
///    across the requested span.
/// 3. The universal `scale` effect prop never disturbs flex cross-axis
///    centering (Transform is layout-invariant).
void main() {
  late JsonWidgetRenderer renderer;
  setUp(() {
    renderer = JsonWidgetRenderer(onEvent: (_, __) {});
  });

  // A host panel: bounded but LOOSE constraints (Align under a fixed-size
  // scaffold), the typical embedding for a widget root.
  Widget harness(Widget child) => MaterialApp(
    home: Scaffold(
      body: SizedBox(
        width: 1920,
        height: 1080,
        child: Align(alignment: Alignment.topLeft, child: child),
      ),
    ),
  );

  RenderParagraph paragraphOf(WidgetTester tester, String label) =>
      tester.renderObject<RenderParagraph>(find.text(label));

  group('text width/height', () {
    testWidgets('text honors width and centers within it (nested column)', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          renderer.build({
            'type': 'column',
            'crossAxisAlignment': 'center',
            'children': [
              {
                'type': 'text',
                'data': 'WATCH THE TALK',
                'width': 240,
                'textAlign': 'center',
              },
            ],
          }),
        ),
      );
      // The text box is exactly 240 wide (not the intrinsic label width),
      // giving the column a well-defined box to center.
      expect(paragraphOf(tester, 'WATCH THE TALK').size.width, 240);
    });

    testWidgets('text honors height', (tester) async {
      await tester.pumpWidget(
        harness(
          renderer.build({
            'type': 'column',
            'children': [
              {'type': 'text', 'data': 'hi', 'height': 80},
            ],
          }),
        ),
      );
      expect(paragraphOf(tester, 'hi').size.height, 80);
    });
  });

  group('flex node width/height', () {
    testWidgets('column honors width; narrow siblings center across it', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          renderer.build({
            'type': 'column',
            'width': 680,
            'crossAxisAlignment': 'center',
            'children': [
              {
                'type': 'container',
                'width': 160,
                'height': 40,
                'color': '#ff0000',
                'child': {'type': 'text', 'data': 'AAA', 'textAlign': 'left'},
              },
              {
                'type': 'container',
                'width': 100,
                'height': 40,
                'color': '#0000ff',
                'child': {'type': 'text', 'data': 'BBB', 'textAlign': 'left'},
              },
            ],
          }),
        ),
      );
      // Without the width cap the column hug-wraps its widest child (160);
      // with it the column spans exactly 680.
      final column = tester.renderObject<RenderBox>(find.byType(Column));
      expect(column.size.width, 680);
      // Markers hug their container's top-left (no alignment on the
      // containers), so marker x == container x.
      final aaaX = paragraphOf(tester, 'AAA').localToGlobal(Offset.zero).dx;
      final bbbX = paragraphOf(tester, 'BBB').localToGlobal(Offset.zero).dx;
      // Both children centered across the 680 span.
      expect(aaaX, closeTo((680 - 160) / 2, 0.5));
      expect(bbbX, closeTo((680 - 100) / 2, 0.5));
    });

    testWidgets('row honors height', (tester) async {
      await tester.pumpWidget(
        harness(
          renderer.build({
            'type': 'row',
            'height': 120,
            'children': [
              {'type': 'text', 'data': 'cell'},
            ],
          }),
        ),
      );
      final row = tester.renderObject<RenderBox>(find.byType(Row));
      expect(row.size.height, 120);
    });
  });

  group('universal scale effect', () {
    testWidgets('scale on a child keeps parent column centering', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          renderer.build({
            'type': 'column',
            'width': 680,
            'crossAxisAlignment': 'center',
            'children': [
              {
                'type': 'container',
                'width': 160,
                'height': 40,
                'color': '#ff0000',
                'child': {'type': 'text', 'data': 'AAA', 'textAlign': 'left'},
              },
              {
                'type': 'container',
                'width': 160,
                'height': 40,
                'color': '#0000ff',
                'scale': 1.5,
                'child': {'type': 'text', 'data': 'BBB', 'textAlign': 'left'},
              },
            ],
          }),
        ),
      );
      // The scaled child is wrapped in a Transform (paint-only). Measure the
      // Transform's own LAYOUT box — marker paragraphs would report paint
      // coordinates through the scale matrix instead.
      final transform = tester.renderObject<RenderBox>(
        find.byWidgetPredicate((w) => w is Transform && w.child is Container),
      );
      // Layout footprint is identical to the unscaled sibling (160x40) and
      // centered across the 680 column like every other child.
      expect(transform.size, const Size(160, 40));
      expect(
        transform.localToGlobal(Offset.zero).dx,
        closeTo((680 - 160) / 2, 0.5),
      );
    });
  });
}
