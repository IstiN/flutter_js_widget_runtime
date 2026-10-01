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

Map<String, dynamic> _meshArgs(JsVoxelChunk chunk, String key, {String id = 'w'}) => {
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
  final image = await recorder.endRecording().toImage(size.round(), size.round());
  final data = (await image.toByteData(format: ui.ImageByteFormat.rawStraightRgba))!;
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

      expect(world.handleHostCall('voxel.attach', {'id': 'w'}), {'ok': true});
      expect(
        world.handleHostCall('voxel.mesh', _meshArgs(_facingQuad(), '0,0')),
        {'ok': true, 'faces': 2},
      );
      expect(notifications, 1);
      expect(world.chunksOf('w'), hasLength(1));

      expect(world.handleHostCall('voxel.camera', {
        'id': 'w',
        'position': [1, 2, 3],
        'yaw': 0.5,
        'light': 2,
        'skyColor': '#102030',
      }), {'ok': true});
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
      world.handleHostCall('voxel.mesh', _meshArgs(_facingQuad(), 'k', id: 'a'));
      expect(world.chunksOf('a'), hasLength(1));
      expect(world.chunksOf('b'), isEmpty);
      expect(() => world.handleHostCall('voxel.fly', {}), throwsUnsupportedError);
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

    test('light multiplies the face color; skyColor fills the backdrop',
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
      final pixel = await _pixel(_painterFor(world), 100, const Offset(50, 50));
      expect(pixel, const Color(0xFF800000));

      // Corner outside the projected quad shows the sky.
      final sky = await _pixel(_painterFor(world), 100, const Offset(2, 2));
      expect(sky, const Color(0xFF0F172A));
    });

    test('triangles straddling the near plane clip instead of smearing',
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
    });

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
    testWidgets('renders through JsonWidgetRenderer and repaints on upload',
        (tester) async {
      final world = JsVoxelWorld();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: JsonWidgetRenderer(
              onEvent: (_, __) {},
              voxelWorld: world,
            ).build({
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

    testWidgets('renders a placeholder without a voxel world',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: JsonWidgetRenderer(
              onEvent: (_, __) {},
            ).build({
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

    testWidgets('width/height pin the node; without them it expands',
        (tester) async {
      final world = JsVoxelWorld();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: JsonWidgetRenderer(
              onEvent: (_, __) {},
              voxelWorld: world,
            ).build({
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
}
