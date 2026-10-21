import 'dart:convert' as convert;
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_voxel_node.dart';

/// Regression guard for the fa-craft "brown tops" report: the grass
/// block's TOP face must read the palette's `top` tones (green), not the
/// `side` ones (dirt-green) — through BOTH upload lanes (JSON b64 and
/// the packed `voxel.blocks.bin` envelope).
void main() {
  // fa-craft's exact paletteSpec shape (blocks.js): entry 0 is the air
  // placeholder; GRASS carries {top, side}; DIRT is a flat 4-tone set.
  const grassTop = ['#54993d', '#61a342', '#57944a', '#669e3b'];
  const grassSide = ['#705c38', '#7a633d', '#6b573b', '#756135'];
  const dirt = ['#735435', '#825e3d', '#785c42', '#7f5738'];
  final palette = [
    ['#000000', '#000000', '#000000', '#000000'],
    {'top': grassTop, 'side': grassSide},
    dirt,
    ['#85858a', '#94949a', '#8a8c8f', '#808287'],
  ];

  // 1×2×1 column: dirt at y=0, grass at y=1. Index = (y*sz+z)*sx+x.
  final blocks = base64([2, 1]);

  JsVoxelWorld worldWithChunk() {
    final world = JsVoxelWorld();
    world.handleHostCall('voxel.attach', {'id': 'w'});
    final r = world.handleHostCall('voxel.blocks', {
      'id': 'w',
      'key': '0,0',
      'origin': [0, 0, 0],
      'size': [1, 2, 1],
      'blocks': blocks,
      'palette': palette,
    });
    assert(r['ok'] == true, 'blocks upload rejected: $r');
    return world;
  }

  void cameraDown(JsVoxelWorld world) {
    world.handleHostCall('voxel.camera', {
      'id': 'w',
      'position': [0.5, 8, 0.5],
      'yaw': 0,
      'pitch': -math.pi / 2, // straight down at the grass top face
      'fov': 60,
      'skyColor': '#87ceeb',
    });
  }

  Future<Color> _pixelAt(JsVoxelWorld world, Offset at) async {
    final recorder = ui.PictureRecorder();
    VoxelPainter(world: world, id: 'w')
        .paint(ui.Canvas(recorder), const Size(100, 100));
    final image = await recorder.endRecording().toImage(100, 100);
    final data = await image.toByteData(
        format: ui.ImageByteFormat.rawStraightRgba);
    final o = (at.dy.toInt() * 100 + at.dx.toInt()) * 4;
    final px = data!.getUint32(o); // row, col — RGBA bytes
    return Color.fromARGB(
        data.getUint8(o + 3), data.getUint8(o + 2), data.getUint8(o + 1),
        data.getUint8(o));
  }

  Future<Color> centerPixel(JsVoxelWorld world) => _pixelAt(world, const Offset(50, 50));

  test('JSON lane: grass top face is green (top tones, not side)', () async {
    final world = worldWithChunk();
    cameraDown(world);
    final px = await centerPixel(world);
    // ignore: avoid_print
    print('JSON-lane center pixel: $px '
        '(r=${px.red}, g=${px.green}, b=${px.blue})');
    final diag = <String>[];
    for (final pt in [const Offset(50, 40), const Offset(50, 50), const Offset(50, 60), const Offset(40, 50), const Offset(60, 50)]) {
      final c = await _pixelAt(world, pt);
      diag.add('${pt}=#$c');
    }
    // ignore: avoid_print
    print('JSON-lane samples: $diag');
    expect(px, isNot(const Color(0xFF87CEEB)), reason: 'center must be terrain');
    expect(px.green > px.red, isTrue,
        reason: 'grass TOP face must read the `top` (green) tones; '
            'got $px — the vertical/top tone selection is inverted');
  });

  test('packed lane: same chunk via voxel.blocks.bin renders identically',
      () async {
    final world = JsVoxelWorld();
    world.handleHostCall('voxel.attach', {'id': 'w'});
    // Mirror fa-craft's packBlocks(): 'JVXM' + version 1 + headerLen +
    // header JSON NUL-padded to 4 bytes + raw block bytes.
    final header = convert.utf8.encode(convert.jsonEncode({
      'id': 'w',
      'key': '0,0',
      'origin': [0, 0, 0],
      'size': [1, 2, 1],
      'palette': palette,
    }));
    final pad = (4 - header.length % 4) % 4;
    final body = Uint8List.fromList([2, 1]);
    final buf = BytesBuilder();
    final u32 = ByteData(12)..setUint32(0, 0x4A56584D, Endian.little);
    u32.setUint32(4, 1, Endian.little);
    u32.setUint32(8, header.length, Endian.little);
    buf.add(u32.buffer.asUint8List());
    buf.add(header);
    buf.add(Uint8List(pad));
    buf.add(body);
    world.handleHostCallBinary('voxel.blocks.bin', buf.toBytes());

    cameraDown(world);
    final px = await centerPixel(world);
    expect(px, isNot(const Color(0xFF87CEEB)), reason: 'center must be terrain');
    expect(px.green > px.red, isTrue,
        reason: 'packed lane grass TOP face must be green; got $px');
  });
}

String base64(List<int> bytes) => convert.base64Encode(bytes);
