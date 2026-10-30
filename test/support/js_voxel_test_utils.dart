import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:js_widget_runtime/js_widget_runtime.dart';

VoxelPainter voxelPainterFor(JsVoxelWorld world) =>
    VoxelPainter(world: world, id: 'w');

/// One paint pass at [size], returned as raw RGBA bytes.
Future<ByteData> renderVoxelFrame(JsVoxelWorld world, double size) async {
  final recorder = ui.PictureRecorder();
  voxelPainterFor(world).paint(ui.Canvas(recorder), ui.Size(size, size));
  final image = await recorder.endRecording().toImage(
    size.toInt(),
    size.toInt(),
  );
  return (await image.toByteData(format: ui.ImageByteFormat.rawStraightRgba))!;
}
