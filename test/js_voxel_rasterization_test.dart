import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'support/js_voxel_test_utils.dart';

/// The common 'one flat quad, camera above it' world used by the
/// paint-smoke tests.
JsVoxelWorld _quadWorld({
  String key = '0,0',
  bool overlay = false,
  List<double> colors = const [
    0.2,
    0.8,
    0.2,
    0.2,
    0.8,
    0.2,
    0.2,
    0.8,
    0.2,
    0.2,
    0.8,
    0.2,
  ],
  List<double> positions = const [
    -64,
    0,
    -64,
    -64,
    0,
    80,
    80,
    0,
    80,
    80,
    0,
    -64,
  ],
  bool texture = false,
}) {
  final world = JsVoxelWorld();
  world.handleHostCall('voxel.attach', {'id': 'w'});
  world.handleHostCall('voxel.mesh', {
    'id': 'w',
    'key': key,
    'origin': [0, 0, 0],
    if (overlay) 'overlay': true,
    'positions': positions,
    'colors': colors,
    'indices': [0, 1, 2, 0, 2, 3],
  });
  world.handleHostCall('voxel.camera', {
    'id': 'w',
    'position': [8, 6, 8],
    'yaw': 0,
    'pitch': -0.6,
    'light': 1,
    'skyColor': '#102030',
    if (texture) 'texture': true,
  });
  return world;
}

/// Paints the world's current camera at [size]x[size] and counts pixels
/// exactly equal to [sky] inside the (x0..x1, y0..y1) window — the
/// shared hole/crack probe for the rasterization robustness tests.
Future<int> _skyPixelsInWindow(
  JsVoxelWorld world,
  int size,
  int x0,
  int y0,
  int x1,
  int y1,
  int step,
  int sky,
) async {
  final recorder = ui.PictureRecorder();
  voxelPainterFor(
    world,
  ).paint(ui.Canvas(recorder), Size(size.toDouble(), size.toDouble()));
  final image = await recorder.endRecording().toImage(size, size);
  final data = (await image.toByteData(
    format: ui.ImageByteFormat.rawStraightRgba,
  ))!;
  var count = 0;
  for (var y = y0; y < y1; y += step) {
    for (var x = x0; x < x1; x += step) {
      final o = (y * size + x) * 4;
      final argb =
          (data.getUint8(o + 3) << 24) |
          (data.getUint8(o) << 16) |
          (data.getUint8(o + 1) << 8) |
          data.getUint8(o + 2);
      if (argb == sky) count++;
    }
  }
  return count;
}

/// One greedy-merged green mega-plate under the camera: positions span
/// behind the eye, exercising the near-plane clip of huge quads.
void _plateUnderCamera(JsVoxelWorld world) {
  world.handleHostCall('voxel.mesh', {
    'id': 'w',
    'key': '0,0',
    'origin': [0, 0, 0],
    'positions': [-64, 0, -64, -64, 0, 80, 80, 0, 80, 80, 0, -64],
    'colors': [0.2, 0.8, 0.2, 0.2, 0.8, 0.2, 0.2, 0.8, 0.2, 0.2, 0.8, 0.2],
    'indices': [0, 1, 2, 0, 2, 3],
  });
}

void main() {
  setUp(() => VoxelDiagnostics.bsp = false);
  tearDown(VoxelDiagnostics.reset);

  group('rasterization robustness', () {
    test('texture camera flag modulates blocks with the noise tile', () async {
      // The quad sits entirely IN FRONT of the camera (yaw 0 looks down
      // -z) so no vertex crosses the near plane — subdivision requires
      // all view depths > near, and this test must exercise it.
      final world = _quadWorld(
        texture: true,
        positions: const [-32, 0, -60, -32, 0, -0.2, 48, 0, -0.2, 48, 0, -60],
      );
      expect(world.cameraOf('w').texture, isTrue, reason: 'flag parsed');
      // First paint kicks the async noise-tile decode; give it an event
      // loop turn, then paint again with the texture live.
      await renderVoxelFrame(world, 200);
      await Future<void>.delayed(const Duration(milliseconds: 100));
      final data = await renderVoxelFrame(world, 200);
      final g = data.getUint8((100 * 200 + 100) * 4 + 1);
      expect(g, greaterThan(60), reason: 'block rendered, not sky');
      expect(
        g,
        lessThanOrEqualTo(210),
        reason: 'noise tile modulates the green down',
      );
    });

    test('T-junction seams do not leak sky (crack fill)', () async {
      final world = JsVoxelWorld();
      world.handleHostCall('voxel.attach', {'id': 'w'});
      // Quad A spans the full z range on one side of the x=16 seam;
      // quads B and C stack z -48..16 / 16..80 on the other — a classic
      // greedy-meshing T-junction at (16, 0, 16).
      world.handleHostCall('voxel.mesh', {
        'id': 'w',
        'key': '0,0',
        'origin': [0, 0, 0],
        'positions': [
          -48, 0, -48, -48, 0, 80, 16, 0, 80, 16, 0, -48, // A
          16, 0, -48, 16, 0, 16, 80, 0, 16, 80, 0, -48, // B
          16, 0, 16, 16, 0, 80, 80, 0, 80, 80, 0, 16, // C
        ],
        'colors': List<double>.filled(36, 0.5),
        'indices': [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11],
      });
      const sky = 0xFF102030;
      for (var step = 0; step < 36; step++) {
        world.handleHostCall('voxel.camera', {
          'id': 'w',
          'position': [16, 6, 16],
          'yaw': step * math.pi / 18,
          'pitch': -0.7,
          'light': 1,
          'skyColor': '#102030',
        });
        final skyPixels = await _skyPixelsInWindow(
          world,
          200,
          60,
          60,
          140,
          140,
          2,
          sky,
        );
        expect(
          skyPixels,
          0,
          reason: 'yaw step $step: T-junction seam leaks sky',
        );
      }
    });

    test('texture subdivision: big tris split so uv stays faithful', () async {
      final world = JsVoxelWorld();
      world.handleHostCall('voxel.attach', {'id': 'w'});
      _plateUnderCamera(world);
      Map<String, Object?> cam(bool tex) => {
        'id': 'w',
        'position': [8, 6, 8],
        'yaw': 0,
        'pitch': -0.6,
        'light': 1,
        'skyColor': '#102030',
        if (tex) 'texture': true,
      };
      const size = 200.0;
      // Untextured: the mega-quad stays 2 tris. Textured: subdivided.
      world.handleHostCall('voxel.camera', cam(false));
      final rec1 = ui.PictureRecorder();
      voxelPainterFor(world).paint(ui.Canvas(rec1), const Size(size, size));
      await rec1.endRecording().toImage(size.toInt(), size.toInt());
      world.handleHostCall('voxel.camera', cam(true));
      final rec2 = ui.PictureRecorder();
      voxelPainterFor(world).paint(ui.Canvas(rec2), const Size(size, size));
      final image = await rec2.endRecording().toImage(
        size.toInt(),
        size.toInt(),
      );
      final data = (await image.toByteData(
        format: ui.ImageByteFormat.rawStraightRgba,
      ))!;
      // Subdivision must not punch holes: center is green, not sky.
      final o = (100 * size.toInt() + 100) * 4;
      expect(data.getUint8(o + 1), greaterThan(60));
      // …and the uv window matches the tile: adjacent blocks sample
      // DIFFERENT noise values (texture scrolls with the world).
      final o2 = (140 * size.toInt() + 60) * 4;
      expect(
        (data.getUint8(o + 1) - data.getUint8(o2 + 1)).abs() < 200,
        isTrue,
      );
    });

    test('grazing textured terrain keeps the triangle count bounded', () async {
      final world = JsVoxelWorld();
      world.handleHostCall('voxel.attach', {'id': 'w'});
      // Four greedy-merged ground strips (64 wide x 16 deep) ahead of a
      // grazing camera — the worst case for texture subdivision. The old
      // raw screen-edge criterion exploded this to tens of thousands of
      // triangles (30ms+ paints); the warp-weighted criterion must stay
      // in the hundreds.
      final positions = <double>[];
      final indices = <int>[];
      for (var s = 0; s < 4; s++) {
        final zNear = -16.0 * s - 0.5;
        final zFar = zNear - 16;
        final base = positions.length ~/ 3;
        positions.addAll([
          -32,
          0,
          zFar,
          -32,
          0,
          zNear,
          32,
          0,
          zNear,
          32,
          0,
          zFar,
        ]);
        indices.addAll([base, base + 1, base + 2, base, base + 2, base + 3]);
      }
      world.handleHostCall('voxel.mesh', {
        'id': 'w',
        'key': '0,0',
        'origin': [0, 0, 0],
        'positions': positions,
        'colors': List<double>.filled(positions.length, 0.5),
        'indices': indices,
      });
      world.handleHostCall('voxel.camera', {
        'id': 'w',
        'position': [16, 3, 16],
        'yaw': 0,
        'pitch': -0.12,
        'light': 1,
        'skyColor': '#102030',
        'texture': true,
      });
      final painter = voxelPainterFor(world);
      final recorder = ui.PictureRecorder();
      painter.paint(ui.Canvas(recorder), const Size(800, 600));
      await recorder.endRecording().toImage(800, 600);
      expect(
        painter.lastTriCount,
        greaterThan(20),
        reason: 'subdivision actually ran',
      );
      expect(
        painter.lastTriCount,
        lessThan(1500),
        reason: 'grazing ground must not explode the tri count',
      );
    });

    test('overlay chunk renders with AA edge strokes', () async {
      final world = _quadWorld(
        key: '__hl',
        overlay: true,
        positions: const [-16, 0, -16, -16, 0, 32, 32, 0, 32, 32, 0, -16],
        colors: List<double>.filled(12, 1.0),
      );
      final data = await renderVoxelFrame(world, 200);
      final o = (100 * 200 + 100) * 4;
      expect(
        data.getUint8(o),
        greaterThan(200),
        reason: 'white overlay face rendered',
      );
      expect(data.getUint8(o + 3), 255, reason: 'opaque');
    });

    test('no sky holes while sweeping yaw over a merged mega-quad', () async {
      final world = JsVoxelWorld();
      world.handleHostCall('voxel.attach', {'id': 'w'});
      // One greedy-merged mega-plate centered under the camera: every ray
      // in the scanned center window must hit it at ANY yaw (pitch is
      // down). The plate spans behind the eye, exercising the near-plane
      // clip of huge quads — the shape that exposed holes.
      _plateUnderCamera(world);
      const sky = 0xFF102030;
      for (var step = 0; step < 36; step++) {
        world.handleHostCall('voxel.camera', {
          'id': 'w',
          'position': [8, 6, 8],
          'yaw': step * math.pi / 18,
          'pitch': -0.6,
          'light': 1,
          'skyColor': '#102030',
        });
        // Rasterize and scan the center region for sky-colored holes.
        final skyPixels = await _skyPixelsInWindow(
          world,
          200,
          60,
          60,
          140,
          140,
          4,
          sky,
        );
        expect(
          skyPixels,
          0,
          reason: 'yaw ${step * 10}°: sky shows through the plate',
        );
      }
    });
  });
}
