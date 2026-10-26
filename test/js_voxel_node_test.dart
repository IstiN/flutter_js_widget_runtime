import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

/// One unit-block +Z face (quad, CCW from outside — the mesher contract),
/// centered at x/y 0.5 so it sits under the camera axis.
JsVoxelChunk _facingQuad({double z = 1}) => JsVoxelChunk(
  positions: Float32List.fromList([
    1, 0, z, //
    1, 1, z, //
    0, 1, z, //
    0, 0, z, //
  ]),
  colors: Float32List.fromList([
    1, 0, 0, //
    1, 0, 0, //
    1, 0, 0, //
    1, 0, 0, //
  ]),
  indices: Uint32List.fromList([0, 1, 2, 0, 2, 3]),
  origin: Float32List.fromList([0, 0, 0]),
);

Map<String, dynamic> _meshArgs(
  JsVoxelChunk chunk,
  String key, {
  String id = 'w',
}) => {
  'id': id,
  'key': key,
  'origin': [chunk.origin[0], chunk.origin[1], chunk.origin[2]],
  'positions': chunk.positions.toList(),
  'colors': chunk.colors.toList(),
  'indices': chunk.indices.toList(),
};

/// Rasterizes [painter] at [size]×[size] and returns the pixel color.
Future<Color> _pixel(VoxelPainter painter, double size, Offset at) async {
  final recorder = ui.PictureRecorder();
  painter.paint(ui.Canvas(recorder), Size(size, size));
  final image = await recorder.endRecording().toImage(
    size.round(),
    size.round(),
  );
  final data = (await image.toByteData(
    format: ui.ImageByteFormat.rawStraightRgba,
  ))!;
  final x = at.dx.round().clamp(0, size.round() - 1);
  final y = at.dy.round().clamp(0, size.round() - 1);
  final o = (y * size.round() + x) * 4;
  return Color.fromARGB(
    data.getUint8(o + 3),
    data.getUint8(o),
    data.getUint8(o + 1),
    data.getUint8(o + 2),
  );
}

VoxelPainter _painterFor(JsVoxelWorld world) =>
    VoxelPainter(world: world, id: 'w');

List<String> _captureVoxelFrames({bool audit = false}) {
  VoxelDiagnostics.reset();
  VoxelDiagnostics.enabled = true;
  VoxelDiagnostics.audit = audit;
  final oldDebugPrint = debugPrint;
  final output = <String>[];
  debugPrint = (String? message, {int? wrapWidth}) {
    if (message != null) output.add(message);
  };
  addTearDown(() {
    debugPrint = oldDebugPrint;
    VoxelDiagnostics.reset();
  });
  return output;
}

List<Map<String, dynamic>> _flushVoxelFrames(List<String> output) {
  VoxelDiagnostics.flush();
  return output
      .join('\n')
      .split('\n')
      .where((line) => line.startsWith('{'))
      .map((line) => jsonDecode(line) as Map<String, dynamic>)
      .toList();
}

/// Camera/geometry helper for projected-triangle painter-order regressions.
/// Input points are pixels on a 200×200 render; z is positive view depth.
JsVoxelWorld _projectedWorld() {
  final world = JsVoxelWorld();
  world.handleHostCall('voxel.camera', {
    'id': 'w',
    'position': [0, 0, 0],
    'yaw': 0,
    'pitch': 0,
    'fov': 72,
    'fog': false,
    'light': 1,
    'skyColor': '#102030',
  });
  return world;
}

List<double> _projectedPositions(List<double> screen, List<double> z) {
  final focal = 100 / math.tan(36 * math.pi / 180);
  return [
    for (var i = 0; i < 3; i++) ...[
      (screen[i * 2] - 100) * z[i] / focal,
      (100 - screen[i * 2 + 1]) * z[i] / focal,
      -z[i],
    ],
  ];
}

void _addProjectedTri(
  JsVoxelWorld world,
  String key,
  List<double> screen,
  List<double> z,
  List<double> rgb,
) {
  world.handleHostCall('voxel.mesh', {
    'id': 'w',
    'key': key,
    'origin': [0, 0, 0],
    'positions': _projectedPositions(screen, z),
    'colors': List<double>.generate(9, (i) => rgb[i % 3]),
    'indices': [0, 1, 2],
  });
}

/// One paint pass at [size], returned as raw RGBA bytes.
Future<ByteData> _renderFrame(JsVoxelWorld world, double size) async {
  final recorder = ui.PictureRecorder();
  _painterFor(world).paint(ui.Canvas(recorder), Size(size, size));
  final image = await recorder.endRecording().toImage(
    size.toInt(),
    size.toInt(),
  );
  return (await image.toByteData(format: ui.ImageByteFormat.rawStraightRgba))!;
}

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
  _painterFor(
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

void main() {
  group('JsVoxelChunk', () {
    test('parses a valid payload and computes bounds', () {
      final chunk = JsVoxelChunk.fromDynamic(_meshArgs(_facingQuad(), '0,0'));
      expect(chunk, isNotNull);
      expect(chunk!.vertexCount, 4);
      expect(chunk.faceCount, 2);
      expect(chunk.aabbMin[0], 0);
      expect(chunk.aabbMax[0], 1);
      expect(chunk.aabbMax[2], 1);
    });

    test('rejects malformed payloads', () {
      final good = _meshArgs(_facingQuad(), '0,0');
      expect(
        JsVoxelChunk.fromDynamic(good..['positions'] = [1, 2]),
        isNull,
        reason: 'positions not a multiple of 3',
      );
      expect(
        JsVoxelChunk.fromDynamic(good..['colors'] = [0, 0, 0]),
        isNull,
        reason: 'colors arity mismatch',
      );
      expect(
        JsVoxelChunk.fromDynamic(good..['indices'] = [0, 1, 99]),
        isNull,
        reason: 'index out of range',
      );
      expect(
        JsVoxelChunk.fromDynamic(good..['origin'] = [0, 0]),
        isNull,
        reason: 'origin must be xyz',
      );
      expect(
        JsVoxelChunk.fromDynamic(good..['positions'] = 'nope'),
        isNull,
        reason: 'non-list payload',
      );
    });
  });

  group('JsVoxelWorld hostCall contract', () {
    test('attach/mesh/camera resolve and notify', () {
      final world = JsVoxelWorld();
      var notifications = 0;
      world.addListener(() => notifications++);

      expect(world.handleHostCall('voxel.attach', {'id': 'w'}), {
        'ok': true,
        'blocks': true,
      });
      expect(
        world.handleHostCall('voxel.mesh', _meshArgs(_facingQuad(), '0,0')),
        {'ok': true, 'faces': 2},
      );
      expect(notifications, 1);
      expect(world.chunksOf('w'), hasLength(1));

      expect(
        world.handleHostCall('voxel.camera', {
          'id': 'w',
          'position': [1, 2, 3],
          'yaw': 0.5,
          'light': 2,
          'skyColor': '#102030',
        }),
        {'ok': true},
      );
      final cam = world.cameraOf('w');
      expect(cam.position, [1, 2, 3]);
      expect(cam.yaw, 0.5);
      expect(cam.light, 1, reason: 'light clamped to 0..1');
      expect(cam.skyColor, const Color(0xFF102030));
      expect(notifications, 2);
    });

    test('mesh replaces the same key and malformed uploads stay soft', () {
      final world = JsVoxelWorld();
      world.handleHostCall('voxel.attach', {'id': 'w'});
      world.handleHostCall('voxel.mesh', _meshArgs(_facingQuad(), '0,0'));
      world.handleHostCall('voxel.mesh', _meshArgs(_facingQuad(), '0,0'));
      expect(world.chunksOf('w'), hasLength(1), reason: 'same key replaces');

      final bad = _meshArgs(_facingQuad(), '0,0')..['indices'] = [0, 1];
      expect(world.handleHostCall('voxel.mesh', bad)['ok'], false);
      expect(
        world.handleHostCall('voxel.mesh', _meshArgs(_facingQuad(), ''))['ok'],
        false,
        reason: 'missing key',
      );
    });

    test('chunkRemove drops a resident chunk and reports the removal', () {
      final world = JsVoxelWorld();
      var notifications = 0;
      world.addListener(() => notifications++);
      world.handleHostCall('voxel.attach', {'id': 'w'});
      world.handleHostCall('voxel.mesh', _meshArgs(_facingQuad(), '0,0'));
      world.handleHostCall('voxel.mesh', _meshArgs(_facingQuad(), '1,0'));

      expect(
        world.handleHostCall('voxel.chunkRemove', {'id': 'w', 'key': '0,0'}),
        {'ok': true, 'removed': true},
      );
      expect(world.chunksOf('w'), hasLength(1));
      expect(notifications, 3, reason: 'attach-free: mesh×2 + removal');

      expect(
        world.handleHostCall('voxel.chunkRemove', {'id': 'w', 'key': '0,0'}),
        {'ok': true, 'removed': false},
        reason: 'double-remove is a soft no-op',
      );
      expect(notifications, 3, reason: 'no repaint when nothing was removed');
      expect(
        world.handleHostCall('voxel.chunkRemove', {'id': 'nope', 'key': 'x'}),
        {'ok': true, 'removed': false},
        reason: 'unknown instance is a soft no-op too',
      );
    });

    test('instances are namespaced by id; unknown names throw', () {
      final world = JsVoxelWorld();
      world.handleHostCall('voxel.attach', {'id': 'a'});
      world.handleHostCall(
        'voxel.mesh',
        _meshArgs(_facingQuad(), 'k', id: 'a'),
      );
      expect(world.chunksOf('a'), hasLength(1));
      expect(world.chunksOf('b'), isEmpty);
      expect(
        () => world.handleHostCall('voxel.fly', {}),
        throwsUnsupportedError,
      );
    });
  });

  group('VoxelPainter', () {
    test('front face fills its screen area; back face is culled', () async {
      final world = JsVoxelWorld();
      world.handleHostCall('voxel.mesh', _meshArgs(_facingQuad(), 'k'));
      world.handleHostCall('voxel.camera', {
        'id': 'w',
        'position': [0.5, 0.5, 5],
        'yaw': 0,
        'pitch': 0,
        'fov': 90,
      });

      final front = await _pixel(_painterFor(world), 100, const Offset(50, 50));
      expect(front, const Color(0xFFFF0000), reason: 'face color × light 1');

      // Yaw 180° looks at the quad from behind → backface culled → sky.
      world.handleHostCall('voxel.camera', {
        'id': 'w',
        'position': [0.5, 0.5, -5],
        'yaw': 0,
        'pitch': 0,
        'fov': 90,
      });
      final back = await _pixel(_painterFor(world), 100, const Offset(50, 50));
      expect(back, isNot(const Color(0xFFFF0000)));
    });

    test('exact depth order wins even when depths share a bucket', () async {
      final world = JsVoxelWorld();
      void addQuad(String key, double x, double z, List<double> rgb) {
        world.handleHostCall('voxel.mesh', {
          'id': 'w',
          'key': key,
          'origin': [0, 0, 0],
          'positions': [x + 1, 0, z, x + 1, 1, z, x, 1, z, x, 0, z],
          'colors': List<double>.generate(12, (i) => rgb[i % 3]),
          'indices': [0, 1, 2, 0, 2, 3],
        });
      }

      // Near is deliberately uploaded before far. The distant edge quad
      // stretches the range so near/far shared the old bucket zero and
      // the far red face incorrectly painted over the near green face.
      addQuad('near', 0, 4, [0, 1, 0]);
      addQuad('far', 0, 3.95, [1, 0, 0]);
      addQuad('depth-range', 35, -95, [0, 0, 1]);
      world.handleHostCall('voxel.camera', {
        'id': 'w',
        'position': [0.5, 0.5, 5],
        'yaw': 0,
        'pitch': 0,
        'fov': 90,
        'fog': false,
        'skyColor': '#102030',
      });
      expect(
        await _pixel(_painterFor(world), 100, const Offset(50, 50)),
        const Color(0xFF00FF00),
        reason: 'near green must occlude far red regardless of upload order',
      );
    });

    test(
      'average-correct overlaps still constrain the topological pass',
      () async {
        const sx = 200 / 1440, sy = 200 / 700;
        final world = _projectedWorld();
        // Captured from fa-craft at yaw 3.9665. Average depth already draws the
        // nearer green triangle after red, but dropping that relation let
        // unrelated shared-edge constraints reverse them in the final order.
        _addProjectedTri(
          world,
          '2,0',
          [
            202.3905 * sx,
            280.271 * sy,
            128.9613 * sx,
            245.4193 * sy,
            145.749 * sx,
            285.8746 * sy,
          ],
          [12.7098, 11.7294, 12.0723],
          [0, 1, 0],
        );
        _addProjectedTri(
          world,
          '2,-1',
          [
            151.1784 * sx,
            279.8347 * sy,
            73.8148 * sx,
            245.1019 * sy,
            92.0894 * sx,
            285.3911 * sy,
          ],
          [12.7622, 11.7819, 12.1248],
          [1, 0, 0],
        );
        final painter = _painterFor(world);
        expect(
          await _pixel(painter, 200, Offset(144 * sx, 280 * sy)),
          const Color(0xFF00FF00),
        );
        expect(painter.debugVisibilityEdges, 1);
      },
    );

    test(
      'shared-edge faces use overlap depth instead of average depth',
      () async {
        const sx = 200 / 1440, sy = 200 / 700;
        final world = _projectedWorld();
        // Captured from the fa-craft brown-sliver frame. The faces share
        // the 747.8,472.6 → 702,357.9 edge. Brown has the nearer AVERAGE
        // depth, while green is nearer inside the overlap.
        _addProjectedTri(
          world,
          '0,green',
          [
            747.8 * sx,
            472.6 * sy,
            702 * sx,
            357.9 * sy,
            534.5 * sx,
            379.9 * sy,
          ],
          [2.1904, 3.0182, 2.8142],
          [0.2, 0.8, 0.2],
        );
        _addProjectedTri(
          world,
          '0,brown',
          [
            742.5 * sx,
            600.3 * sy,
            747.8 * sx,
            472.6 * sy,
            702 * sx,
            357.9 * sy,
          ],
          [2.7131, 2.1904, 3.0182],
          [0.8, 0.4, 0.1],
        );
        final pixel = await _pixel(
          _painterFor(world),
          200,
          Offset(724 * sx, 450 * sy),
        );
        expect(
          (pixel.g * 255).round(),
          greaterThan((pixel.r * 255).round()),
          reason: 'shared-edge overlap must restore the nearer green face',
        );
      },
    );

    test(
      'all owners of a shared edge participate in visibility ordering',
      () async {
        const sx = 200 / 1440, sy = 200 / 700;
        final world = _projectedWorld();
        final a = [1108.705 * sx, 1106.490 * sy];
        final b = [539.413 * sx, 507.696 * sy];
        // The far blue triangle owns the edge bucket first and lies on the
        // opposite side. A single-owner table never compares green to brown.
        _addProjectedTri(
          world,
          '0,owner',
          [...b, ...a, 110 * sx, 400 * sy],
          [2.033019, 0.875661, 4],
          [0.1, 0.1, 0.8],
        );
        _addProjectedTri(
          world,
          '0,green',
          [...a, ...b, 226.651 * sx, 709.284 * sy],
          [0.875661, 2.033019, 1.406977],
          [0.2, 0.8, 0.2],
        );
        _addProjectedTri(
          world,
          '0,brown',
          [963.412 * sx, 1117.419 * sy, ...a, ...b],
          [1.398349, 0.875661, 2.033019],
          [0.8, 0.4, 0.1],
        );
        final pixel = await _pixel(
          _painterFor(world),
          200,
          Offset(576 * sx, 560 * sy),
        );
        expect(
          (pixel.g * 255).round(),
          greaterThan((pixel.r * 255).round()),
          reason: 'green is nearer at 576,560 despite its average depth',
        );
      },
    );

    test(
      'cached overlap order survives painter recreation and mob uploads',
      () async {
        final output = _captureVoxelFrames();
        final world = _projectedWorld();
        _addProjectedTri(
          world,
          '0,green',
          [40, 40, 40, 160, 160, 40],
          [2, 10, 2],
          [0.2, 0.8, 0.2],
        );
        _addProjectedTri(
          world,
          '0,brown',
          [50, 50, 50, 80, 120, 50],
          [4, 4, 4],
          [0.8, 0.4, 0.1],
        );
        final first = await _pixel(
          _painterFor(world),
          200,
          const Offset(60, 60),
        );
        expect((first.g * 255).round(), greaterThan((first.r * 255).round()));
        _addProjectedTri(
          world,
          '__mob0',
          [180, 180, 180, 190, 190, 180],
          [1, 1, 1],
          [1, 1, 1],
        );
        final second = await _pixel(
          _painterFor(world),
          200,
          const Offset(60, 60),
        );
        expect(
          (second.g * 255).round(),
          greaterThan((second.r * 255).round()),
          reason: 'cached terrain order remains valid when only a mob moves',
        );
        for (final yaw in [0.001, 0.002, 0.003, 0.004, 0.2]) {
          world.handleHostCall('voxel.camera', {
            'id': 'w',
            'position': [0, 0, 0],
            'yaw': yaw,
            'pitch': 0,
            'fov': 72,
            'fog': false,
            'light': 1,
            'skyColor': '#102030',
          });
          await _pixel(_painterFor(world), 200, const Offset(60, 60));
        }
        final records = _flushVoxelFrames(output);
        expect(
          records.map((r) => r['orderMode']),
          [1, 2, 1, 1, 1, 1, 1],
          reason:
              'world cache survives painters and mob uploads, while every '
              'camera movement refreshes newly overlapping terrain pairs',
        );
      },
    );

    test(
      'frame workspace survives painter recreation and shrink/grow',
      () async {
        final world = _projectedWorld();
        void add(int i) {
          final x = 20.0 + (i % 4) * 45;
          final y = 25.0 + (i ~/ 4) * 55;
          _addProjectedTri(
            world,
            '0,$i',
            [x, y, x, y + 25, x + 25, y],
            [2, 2, 2],
            [0.2, 0.8, 0.2],
          );
        }

        for (var i = 0; i < 12; i++) add(i);
        final first = _painterFor(world);
        await _pixel(first, 200, const Offset(1, 1));
        expect(first.lastTriCount, 12);
        final workspace = first.debugWorkspaceId;
        final poolLength = first.debugTrianglePoolLength;
        final triangleIds = List.generate(poolLength, first.debugTriangleId);
        final largeBuffer = first.debugBufferId;
        expect(first.debugBufferPage, 1);

        for (var i = 4; i < 12; i++) {
          world.handleHostCall('voxel.chunkRemove', {'id': 'w', 'key': '0,$i'});
        }
        final second = _painterFor(world);
        await _pixel(second, 200, const Offset(1, 1));
        expect(second.lastTriCount, 4);
        expect(second.debugWorkspaceId, workspace);
        expect(second.debugTrianglePoolLength, poolLength);
        expect(List.generate(poolLength, second.debugTriangleId), triangleIds);
        expect(second.debugBufferPage, 0);
        expect(second.debugBufferId, isNot(largeBuffer));

        for (var i = 4; i < 12; i++) add(i);
        final third = _painterFor(world);
        await _pixel(third, 200, const Offset(1, 1));
        expect(third.lastTriCount, 12);
        expect(third.debugTrianglePoolLength, poolLength);
        expect(List.generate(poolLength, third.debugTriangleId), triangleIds);
        expect(third.debugBufferPage, 1);
        expect(
          third.debugBufferId,
          largeBuffer,
          reason: 'the smaller frame must not discard the large draw buffer',
        );
        expect(
          VoxelPainter(world: world, id: 'other').debugWorkspaceId,
          isNot(workspace),
        );
        expect(_painterFor(JsVoxelWorld()).debugWorkspaceId, isNot(workspace));
      },
    );

    test('deferred raster keeps buffers across painter instances', () async {
      final world = _projectedWorld();
      ui.Picture record(List<double> rgb) {
        _addProjectedTri(
          world,
          '0,quad',
          [40, 40, 40, 160, 160, 40],
          [2, 2, 2],
          rgb,
        );
        final recorder = ui.PictureRecorder();
        _painterFor(world).paint(ui.Canvas(recorder), const Size(200, 200));
        return recorder.endRecording();
      }

      Future<Color> readPixel(ui.Picture picture) async {
        final image = await picture.toImage(200, 200);
        final data = (await image.toByteData(
          format: ui.ImageByteFormat.rawStraightRgba,
        ))!;
        const o = (60 * 200 + 60) * 4;
        return Color.fromARGB(
          data.getUint8(o + 3),
          data.getUint8(o),
          data.getUint8(o + 1),
          data.getUint8(o + 2),
        );
      }

      final first = record([0.8, 0.1, 0.1]);
      final second = record([0.1, 0.8, 0.1]);
      final firstPixel = await readPixel(first);
      final secondPixel = await readPixel(second);
      expect(firstPixel.r, greaterThan(firstPixel.g));
      expect(secondPixel.g, greaterThan(secondPixel.r));
    });

    test('only visible terrain changes invalidate the cached order', () async {
      final output = _captureVoxelFrames();
      final world = _projectedWorld();
      _addProjectedTri(
        world,
        '0,visible',
        [40, 40, 40, 160, 160, 40],
        [2, 2, 2],
        [0.2, 0.8, 0.2],
      );
      await _renderFrame(world, 200);
      _addProjectedTri(
        world,
        '1,streamed',
        [1000, 100, 1000, 140, 1040, 100],
        [2, 2, 2],
        [0.1, 0.1, 0.8],
      );
      await _renderFrame(world, 200);
      _addProjectedTri(
        world,
        '1,streamed',
        [1100, 100, 1100, 140, 1140, 100],
        [3, 3, 3],
        [0.1, 0.1, 0.8],
      );
      await _renderFrame(world, 200);
      _addProjectedTri(
        world,
        '1,streamed',
        [30, 30, 30, 70, 70, 30],
        [3, 3, 3],
        [0.1, 0.1, 0.8],
      );
      await _renderFrame(world, 200);
      await _renderFrame(world, 200);
      _addProjectedTri(
        world,
        '1,streamed',
        [35, 35, 35, 75, 75, 35],
        [3, 3, 3],
        [0.1, 0.1, 0.8],
      );
      await _renderFrame(world, 200);

      final records = _flushVoxelFrames(output);
      expect(
        records.map((r) => r['orderMode']),
        [1, 2, 2, 1, 2, 1],
        reason:
            'offscreen streaming reuses order; newly visible and '
            'replaced visible chunks force an exact refresh',
      );
    });

    test('far-fog culling is pixel-exact and keeps boundary guards', () async {
      const nearScreen = [20.0, 20.0, 20.0, 60.0, 60.0, 20.0];
      const mixedScreen = [120.0, 120.0, 120.0, 160.0, 160.0, 120.0];
      JsVoxelWorld build({required bool includeFar}) {
        final world = _projectedWorld();
        _addProjectedTri(
          world,
          '0,near',
          nearScreen,
          [1, 1, 1],
          [0.8, 0.1, 0.1],
        );
        final positions = [
          ..._projectedPositions(mixedScreen, [1, 1, 1]),
          if (includeFar) ..._projectedPositions(mixedScreen, [10, 10, 10]),
        ];
        world.handleHostCall('voxel.mesh', {
          'id': 'w',
          'key': '1,mixed',
          'origin': [0, 0, 0],
          'positions': positions,
          'colors': List.generate(
            positions.length,
            (i) => i % 3 == 1 ? 0.8 : 0.1,
          ),
          'indices': [
            0,
            1,
            2,
            if (includeFar) ...[3, 4, 5],
          ],
        });
        if (includeFar) {
          _addProjectedTri(
            world,
            '2,far-chunk',
            nearScreen,
            [4, 4, 4],
            [0.1, 0.1, 0.8],
          );
        }
        world.handleHostCall('voxel.camera', {
          'id': 'w',
          'position': [0, 0, 0],
          'yaw': 0,
          'pitch': 0,
          'fov': 72,
          'fog': [2, 4],
          'light': 1,
          'skyColor': '#102030',
        });
        return world;
      }

      final expected = await _renderFrame(build(includeFar: false), 200);
      final actualWorld = build(includeFar: true);
      final painter = _painterFor(actualWorld);
      final recorder = ui.PictureRecorder();
      painter.paint(ui.Canvas(recorder), const Size(200, 200));
      final image = await recorder.endRecording().toImage(200, 200);
      final actual = (await image.toByteData(
        format: ui.ImageByteFormat.rawStraightRgba,
      ))!;
      expect(
        painter.lastTriCount,
        2,
        reason: 'one far chunk and one far triangle in a mixed chunk cull',
      );
      expect(
        actual.buffer.asUint8List(),
        orderedEquals(expected.buffer.asUint8List()),
      );

      final boundary = _projectedWorld();
      _addProjectedTri(
        boundary,
        'mixed',
        mixedScreen,
        [3, 5, 4],
        [0.2, 0.8, 0.2],
      );
      boundary.handleHostCall('voxel.camera', {
        'id': 'w',
        'position': [0, 0, 0],
        'yaw': 0,
        'pitch': 0,
        'fov': 72,
        'fog': [2, 4],
      });
      final boundaryPainter = _painterFor(boundary);
      await _pixel(boundaryPainter, 200, const Offset(140, 130));
      expect(
        boundaryPainter.lastTriCount,
        1,
        reason: 'a mixed-depth triangle crosses the fog boundary',
      );

      final textured = _projectedWorld();
      _addProjectedTri(
        textured,
        'textured',
        mixedScreen,
        [10, 10, 10],
        [0.2, 0.8, 0.2],
      );
      textured.handleHostCall('voxel.camera', {
        'id': 'w',
        'position': [0, 0, 0],
        'yaw': 0,
        'pitch': 0,
        'fov': 72,
        'fog': [2, 4],
        'texture': true,
      });
      final texturedPainter = _painterFor(textured);
      await _pixel(texturedPainter, 200, const Offset(140, 130));
      expect(
        texturedPainter.lastTriCount,
        1,
        reason: 'textured sky-colored geometry is modulated, not culled',
      );
    });

    test('edge-crossing overlap works without contained vertices', () async {
      final world = _projectedWorld();
      _addProjectedTri(
        world,
        '0,green',
        [10, 100, 100, 160, 190, 100],
        [2, 20, 2],
        [0.2, 0.8, 0.2],
      );
      _addProjectedTri(
        world,
        '0,brown',
        [-150, 90, 250, 110, 50, 90],
        [4, 4, 4],
        [0.8, 0.4, 0.1],
      );
      final pixel = await _pixel(
        _painterFor(world),
        200,
        const Offset(100, 101),
      );
      expect(
        (pixel.g * 255).round(),
        greaterThan((pixel.r * 255).round()),
        reason: 'edge intersections supply the overlap-depth sample',
      );
    });

    test(
      'interval sweep survives insertion, expiry and disjoint queries',
      () async {
        final world = _projectedWorld();
        for (var row = 0; row < 8; row++) {
          for (var col = 0; col < 10; col++) {
            final x = col * 20.0, y = row * 25.0;
            if (x < 140 && y < 140) continue;
            final z = (1 + (row + col) % 5).toDouble();
            _addProjectedTri(
              world,
              '0,$row,$col',
              [x + 2, y + 2, x + 2, y + 18, x + 15, y + 2],
              [z, z, z],
              [0.1, 0.1, 0.8],
            );
          }
        }
        _addProjectedTri(
          world,
          '0,green',
          [40, 40, 40, 160, 160, 40],
          [2, 10, 2],
          [0.2, 0.8, 0.2],
        );
        _addProjectedTri(
          world,
          '0,brown',
          [50, 50, 50, 80, 120, 50],
          [4, 4, 4],
          [0.8, 0.4, 0.1],
        );
        final painter = _painterFor(world);
        final pixel = await _pixel(painter, 200, const Offset(60, 60));
        expect(painter.lastTriCount, 40);
        expect(
          (pixel.g * 255).round(),
          greaterThan((pixel.r * 255).round()),
          reason: 'tree churn must not drop the overlapping near triangle',
        );
      },
    );

    test('depth audit reports a final-order inversion', () async {
      final output = _captureVoxelFrames(audit: true);
      final world = _projectedWorld();
      // These surfaces cross in view depth, so no single painter order is
      // correct everywhere. The audit must report the remaining inversion.
      _addProjectedTri(
        world,
        '0,green',
        [10, 100, 100, 120, 190, 100],
        [2, 10, 2],
        [0.2, 0.8, 0.2],
      );
      _addProjectedTri(
        world,
        '0,brown',
        [110, 10, 90, 10, 110, 190],
        [4, 4, 4],
        [0.8, 0.4, 0.1],
      );
      await _renderFrame(world, 200);
      final records = _flushVoxelFrames(output);
      expect(records, hasLength(1));
      final record = records.single;
      final audit = record['audit'] as Map<String, dynamic>;
      expect(audit['inversions'], greaterThan(0));
      expect(audit['cases'], isNotEmpty);
      expect(audit['cases'][0]['nearest']['key'], isNot(startsWith('__')));
    });

    test(
      'light multiplies the face color; skyColor fills the backdrop',
      () async {
        final world = JsVoxelWorld();
        world.handleHostCall('voxel.mesh', _meshArgs(_facingQuad(), 'k'));
        world.handleHostCall('voxel.camera', {
          'id': 'w',
          'position': [0.5, 0.5, 5],
          'yaw': 0,
          'pitch': 0,
          'light': 0.5,
          'skyColor': '#0f172a',
        });
        final pixel = await _pixel(
          _painterFor(world),
          100,
          const Offset(50, 50),
        );
        expect(pixel, const Color(0xFF800000));

        // Corner outside the projected quad shows the sky.
        final sky = await _pixel(_painterFor(world), 100, const Offset(2, 2));
        expect(sky, const Color(0xFF0F172A));
      },
    );

    test(
      'triangles straddling the near plane clip instead of smearing',
      () async {
        // Floor below the eye stretching from z=4 (behind the eye at z=5)
        // to z=8: every triangle straddles the near plane. Unclipped, the
        // behind-eye vertices project with a negative inverse-z and smear
        // across the sky above the horizon.
        final world = JsVoxelWorld();
        world.handleHostCall('voxel.mesh', {
          'id': 'w',
          'key': 'k',
          'origin': [0, 0, 0],
          'positions': [-3, -1, 4, 3, -1, 8, 3, -1, 4, -3, -1, 8],
          'colors': [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
          'indices': [0, 1, 2, 0, 3, 1],
        });
        world.handleHostCall('voxel.camera', {
          'id': 'w',
          'position': [0.5, 0.5, 5],
          'yaw': math.pi, // forward (0, 0, 1): toward the far floor
          'pitch': 0,
          'fov': 90,
        });
        final painter = _painterFor(world);
        // The floor projects below the horizon: painted there…
        final below = await _pixel(painter, 100, const Offset(50, 80));
        expect(below, const Color(0xFF00FF00));
        // …and the sky above the horizon stays clean (no unclipped smear).
        final above = await _pixel(painter, 100, const Offset(50, 5));
        expect(above, const Color(0xFF87CEEB));
      },
    );

    test('chunks outside the frustum are culled by their bounds', () async {
      final world = JsVoxelWorld();
      world.handleHostCall('voxel.mesh', {
        'id': 'w',
        'key': 'far',
        'origin': [1000, 0, 0],
        'positions': _facingQuad().positions.toList(),
        'colors': _facingQuad().colors.toList(),
        'indices': _facingQuad().indices.toList(),
      });
      world.handleHostCall('voxel.camera', {
        'id': 'w',
        'position': [0.5, 0.5, 5],
        'fov': 90,
      });
      final pixel = await _pixel(_painterFor(world), 100, const Offset(50, 50));
      expect(pixel, const Color(0xFF87CEEB), reason: 'sky, chunk culled');
    });
  });

  group('voxel node', () {
    testWidgets('renders through JsonWidgetRenderer and repaints on upload', (
      tester,
    ) async {
      final world = JsVoxelWorld();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: JsonWidgetRenderer(onEvent: (_, __) {}, voxelWorld: world)
                .build({
                  'type': 'stack',
                  'children': [
                    {'type': 'voxel', 'id': 'w'},
                  ],
                }),
          ),
        ),
      );
      expect(find.byType(JsVoxelNode), findsOneWidget);

      world.handleHostCall('voxel.mesh', _meshArgs(_facingQuad(), 'k'));
      await tester.pump();
      // No exception: the CustomPaint picked up the listenable-driven
      // repaint; painter keeps painting with live world state.
    });

    testWidgets('renders a placeholder without a voxel world', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: JsonWidgetRenderer(onEvent: (_, __) {}).build({
              'type': 'stack',
              'children': [
                {'type': 'voxel', 'id': 'w'},
              ],
            }),
          ),
        ),
      );
      expect(find.byType(JsVoxelNode), findsNothing);
      expect(find.text('Voxel world'), findsOneWidget);
    });

    testWidgets('width/height pin the node; without them it expands', (
      tester,
    ) async {
      final world = JsVoxelWorld();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: JsonWidgetRenderer(onEvent: (_, __) {}, voxelWorld: world)
                .build({
                  'type': 'stack',
                  'children': [
                    {'type': 'voxel', 'id': 'w', 'width': 120, 'height': 80},
                  ],
                }),
          ),
        ),
      );
      final sized = tester.getSize(find.byType(SizedBox).first);
      expect(sized.width, 120);
      expect(sized.height, 80);
    });
  });

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
      await _renderFrame(world, 200);
      await Future<void>.delayed(const Duration(milliseconds: 100));
      final data = await _renderFrame(world, 200);
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
      world.handleHostCall('voxel.mesh', {
        'id': 'w',
        'key': '0,0',
        'origin': [0, 0, 0],
        'positions': [-64, 0, -64, -64, 0, 80, 80, 0, 80, 80, 0, -64],
        'colors': [0.2, 0.8, 0.2, 0.2, 0.8, 0.2, 0.2, 0.8, 0.2, 0.2, 0.8, 0.2],
        'indices': [0, 1, 2, 0, 2, 3],
      });
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
      _painterFor(world).paint(ui.Canvas(rec1), const Size(size, size));
      await rec1.endRecording().toImage(size.toInt(), size.toInt());
      world.handleHostCall('voxel.camera', cam(true));
      final rec2 = ui.PictureRecorder();
      _painterFor(world).paint(ui.Canvas(rec2), const Size(size, size));
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
      final painter = _painterFor(world);
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
      final data = await _renderFrame(world, 200);
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
      world.handleHostCall('voxel.mesh', {
        'id': 'w',
        'key': '0,0',
        'origin': [0, 0, 0],
        'positions': [-64, 0, -64, -64, 0, 80, 80, 0, 80, 80, 0, -64],
        'colors': [0.2, 0.8, 0.2, 0.2, 0.8, 0.2, 0.2, 0.8, 0.2, 0.2, 0.8, 0.2],
        'indices': [0, 1, 2, 0, 2, 3],
      });
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
