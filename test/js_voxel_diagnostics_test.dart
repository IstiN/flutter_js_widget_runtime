import 'dart:convert';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

void main() {
  test(
    'copy mode preserves deferred frames and emits comparable frame logs',
    () async {
      VoxelDiagnostics.reset();
      VoxelDiagnostics.enabled = true;
      VoxelDiagnostics.copyBuffers = true;
      final oldDebugPrint = debugPrint;
      final output = <String>[];
      debugPrint = (String? message, {int? wrapWidth}) {
        if (message != null) output.add(message);
      };
      addTearDown(() {
        debugPrint = oldDebugPrint;
        VoxelDiagnostics.reset();
      });

      final world = JsVoxelWorld();
      world.handleHostCall('voxel.camera', {
        'id': 'w',
        'position': [0.5, 0.5, 5],
        'yaw': 0,
        'pitch': 0,
        'fov': 90,
        'fog': false,
      });
      const positions = [1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1];
      const indices = [0, 1, 2, 0, 2, 3];
      void color(List<double> rgb) {
        world.handleHostCall('voxel.mesh', {
          'id': 'w',
          'key': 'k',
          'origin': [0, 0, 0],
          'positions': positions,
          'colors': List<double>.generate(12, (i) => rgb[i % 3]),
          'indices': indices,
        });
      }

      final painter = VoxelPainter(world: world, id: 'w');
      final pictures = <ui.Picture>[];
      for (final rgb in [
        [1.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
      ]) {
        color(rgb);
        final recorder = ui.PictureRecorder();
        painter.paint(ui.Canvas(recorder), const Size(100, 100));
        pictures.add(recorder.endRecording());
      }

      final pixels = <List<int>>[];
      for (final picture in pictures) {
        final image = await picture.toImage(100, 100);
        final data = (await image.toByteData(
          format: ui.ImageByteFormat.rawStraightRgba,
        ))!;
        final o = (50 * 100 + 50) * 4;
        pixels.add([data.getUint8(o), data.getUint8(o + 1)]);
      }
      VoxelDiagnostics.flush();

      expect(pixels[0][0], greaterThan(200));
      expect(pixels[0][1], lessThan(50));
      expect(pixels[1][0], lessThan(50));
      expect(pixels[1][1], greaterThan(200));

      final records = output
          .join('\n')
          .split('\n')
          .where((line) => line.startsWith('{'))
          .map((line) => jsonDecode(line) as Map<String, dynamic>)
          .toList();
      expect(records, hasLength(2));
      expect(records[0]['copy'], 1);
      expect(records[0]['tris'], 2);
      expect(records[0]['sortErrors'], 0);
      expect(records[0]['visibleChunks'], 1);
      expect(records[0]['positionHash'], records[1]['positionHash']);
      expect(records[0]['colorHash'], isNot(records[1]['colorHash']));
      expect(records[0]['painter'], records[1]['painter']);
      expect(records[0]['largest'], isNotNull);
    },
  );
}
