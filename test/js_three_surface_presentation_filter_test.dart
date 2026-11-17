import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_host.dart'
    show threeSurfacePreview;

Future<ui.Image> _solidImage(int width, int height, ui.Color color) async {
  final recorder = ui.PictureRecorder();
  final canvas = ui.Canvas(recorder);
  canvas.drawRect(
    ui.Offset.zero & ui.Size(width.toDouble(), height.toDouble()),
    ui.Paint()..color = color,
  );
  return recorder.endRecording().toImage(width, height);
}

/// Preview presentation quality for the Flutter GPU THREE surface.
///
/// The on-screen RawImage downscales compositions far larger than the
/// viewport (native 8K in a Studio preview pane); nearest-neighbour
/// sampling made that preview pixelated. The production presentation
/// widget (`threeSurfacePreview`, the builder `_threeSurfaceContent` uses
/// for every presented frame) must therefore downsample with mip-mapped
/// medium filtering, never `FilterQuality.none`. Export capture keeps
/// encoding the retained GPU image directly and never routes through this
/// widget, so captured bytes are unaffected by presentation filtering.
void main() {
  testWidgets('THREE surface preview downsamples with medium filtering', (
    tester,
  ) async {
    final image = await _solidImage(24, 16, const ui.Color(0xFF3366AA));
    addTearDown(image.dispose);

    await tester.pumpWidget(
      MaterialApp(
        home: Center(
          child: SizedBox(
            width: 256,
            height: 144,
            child: threeSurfacePreview(image),
          ),
        ),
      ),
    );

    // The preview is the only RawImage in this tree, presents the exact
    // presented frame, and filters with mip-mapped medium quality — never
    // nearest-neighbour, which pixelates large downscales.
    final rawImage = tester.widget<RawImage>(find.byType(RawImage));
    expect(rawImage.image, same(image));
    expect(rawImage.fit, BoxFit.fill);
    expect(rawImage.filterQuality, isNot(FilterQuality.none));
    expect(rawImage.filterQuality, FilterQuality.medium);
  });
}
