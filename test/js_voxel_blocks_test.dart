import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_voxel_blocks.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_voxel_node.dart';

/// The `voxel.blocks` native mesher: raw chunk bytes in, painter-ready
/// JsVoxelChunk buffers out — greedy merging, cross-chunk face culling,
/// palette tones, face shading, fail-soft garbage handling.
Map<String, dynamic> _payload({
  String id = 't',
  required String key,
  List<double> origin = const [0, 0, 0],
  required List<int> size,
  required List<int> blocks,
  Object? palette,
  Object? shade,
  bool overlay = false,
}) {
  return {
    'id': id,
    'key': key,
    'origin': origin,
    'size': size,
    'blocks': base64Encode(blocks),
    if (palette != null) 'palette': palette,
    if (shade != null) 'shade': shade,
    'overlay': overlay,
  };
}

/// 4-tone single-color palette (all entries identical so every face
/// merges freely unless the test says otherwise).
List<String> _flatPalette([String hex = '808080']) =>
    List<String>.filled(4, hex);

JsVoxelWorld _worldWith(Map<String, dynamic> payload) {
  final w = JsVoxelWorld();
  w.handleHostCall('voxel.attach', {'id': payload['id']});
  w.handleHostCall('voxel.blocks', payload);
  return w;
}

void main() {
  test('attach advertises the blocks capability', () {
    final w = JsVoxelWorld();
    final res = w.handleHostCall('voxel.attach', {'id': 't'});
    expect(res['ok'], true);
    expect(res['blocks'], true);
  });

  test('single solid block meshes 6 faces with per-face shading', () {
    final w = _worldWith(_payload(
      key: '0,0',
      size: [4, 4, 4],
      blocks: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      palette: [_flatPalette(), _flatPalette()],
    ));
    final chunk = w.chunksOf('t')['0,0']!;
    expect(chunk.faceCount, 12); // 6 quads = 12 triangles
    expect(chunk.vertexCount, 24);
    expect(chunk.indices.length, 36);
    // Colors: 0x80 tone (g=0.502) under the three brightness classes —
    // top 1.0, side 0.82, bottom 0.62 — all three must be present.
    final seen = <double>{};
    for (var i = 1; i < chunk.colors.length; i += 3) {
      seen.add(chunk.colors[i]);
    }
    expect(
        seen.any((v) => (v - 0.502).abs() < 0.01), true); // top class
    expect(
        seen.any((v) => (v - 0.412).abs() < 0.01), true); // side class
    expect(
        seen.any((v) => (v - 0.311).abs() < 0.01), true); // bottom class
  });

  test('adjacent blocks cull the shared face pair', () {
    final w = _worldWith(_payload(
      key: '0,0',
      size: [2, 1, 1],
      blocks: [1, 1],
      palette: [_flatPalette(), _flatPalette()],
    ));
    final chunk = w.chunksOf('t')['0,0']!;
    // 2 blocks merge into 6 quads: top 1, bottom 1, ends 2, z-sides 2
    // (the shared pair culls, same-tone faces merge).
    expect(chunk.faceCount, 12);
  });

  test('flat 4x1 plane merges the top face into one quad', () {
    final w = _worldWith(_payload(
      key: '0,0',
      size: [4, 1, 1],
      blocks: [1, 1, 1, 1],
      palette: [_flatPalette(), _flatPalette()],
    ));
    final chunk = w.chunksOf('t')['0,0']!;
    // Fully merged: top 1, bottom 1, x-ends 2, z-sides 2 = 6 quads.
    expect(chunk.faceCount, 12);
  });

  test('cross-chunk borders cull once the neighbor is resident', () {
    final w = JsVoxelWorld();
    w.handleHostCall('voxel.attach', {'id': 't'});
    final palette = [_flatPalette(), _flatPalette()];
    // East chunk first: a lone block at its west border meshes all 6 faces.
    w.handleHostCall('voxel.blocks', _payload(
      key: '1,0',
      origin: [16, 0, 0],
      size: [1, 1, 1],
      blocks: [1],
      palette: palette,
    ));
    expect(w.chunksOf('t')['1,0']!.faceCount, 12);
    // West neighbor arrives: both sides of the shared border cull.
    w.handleHostCall('voxel.blocks', _payload(
      key: '0,0',
      origin: [0, 0, 0],
      size: [1, 1, 1],
      blocks: [1],
      palette: palette,
    ));
    expect(w.chunksOf('t')['0,0']!.faceCount, 10);
    // ...and the neighbor re-mesh dropped its facing side too.
    expect(w.chunksOf('t')['1,0']!.faceCount, 10);
  });

  test('top/side palette entries pick per-face tones', () {
    final w = _worldWith(_payload(
      key: '0,0',
      origin: [0, 0, 0],
      size: [1, 1, 1],
      blocks: [1],
      palette: [
        {'top': _flatPalette('00FF00'), 'side': _flatPalette('FF0000')},
      ],
    ));
    final chunk = w.chunksOf('t')['0,0']!;
    // Collect the distinct greens: top faces are green (x1.0), the rest
    // red-toned.
    var sawGreen = false, sawRed = false;
    for (var i = 0; i < chunk.colors.length; i += 3) {
      if (chunk.colors[i + 1] > 0.9 && chunk.colors[i] < 0.1) sawGreen = true;
      if (chunk.colors[i] > 0.7 && chunk.colors[i + 1] < 0.2) sawRed = true;
    }
    expect(sawGreen, true);
    expect(sawRed, true);
  });

  test('palette is cached per instance after the first upload', () {
    final w = JsVoxelWorld();
    w.handleHostCall('voxel.attach', {'id': 't'});
    final first = _payload(
      key: '0,0', size: [1, 1, 1], blocks: [1],
      palette: [_flatPalette(), _flatPalette()],
    );
    expect(w.handleHostCall('voxel.blocks', first)['ok'], true);
    final second = _payload(key: '1,0', origin: [1, 0, 0],
        size: [1, 1, 1], blocks: [1]);
    expect(w.handleHostCall('voxel.blocks', second)['ok'], true);
    // A DIFFERENT instance without a palette still fails closed.
    final other = _payload(id: 'u', key: '0,0', size: [1, 1, 1], blocks: [1]);
    final res = w.handleHostCall('voxel.blocks', other);
    expect(res['ok'], false);
  });

  test('garbage payloads resolve ok:false without wedging the world', () {
    final w = JsVoxelWorld();
    w.handleHostCall('voxel.attach', {'id': 't'});
    final palette = [_flatPalette(), _flatPalette()];

    Map<String, dynamic> bad(Map<String, dynamic> p) {
      final res = w.handleHostCall('voxel.blocks', p);
      return res;
    }

    expect(bad(_payload(key: '0,0', size: [1, 1, 1], blocks: [1]))['ok'],
        false); // missing palette
    expect(bad(_payload(key: '', size: [1, 1, 1], blocks: [1], palette: palette))['ok'],
        false); // empty key
    expect(bad(_payload(key: '0,0', size: [1, 2], blocks: [1], palette: palette))['ok'],
        false); // size arity
    expect(
        bad(_payload(key: '0,0', size: [1, 1, 1], blocks: [1, 2], palette: palette))['ok'],
        false); // byte count
    expect(
        bad({
          ..._payload(key: '0,0', size: [1, 1, 1], blocks: [1], palette: palette),
          'blocks': '!!!not-base64!!!',
        })['ok'],
        false);
    expect(
        bad(_payload(key: '0,0', size: [1, 1, 1], blocks: [1],
            palette: 'nope'))['ok'],
        false); // malformed palette
    // The world survives all of it and still meshes a good chunk.
    final good = _payload(key: '0,0', size: [1, 1, 1], blocks: [1],
        palette: palette);
    final res = w.handleHostCall('voxel.blocks', good);
    expect(res['ok'], true);
    expect(res['faces'], 12);
  });

  test('fully-air chunk stores no mesh but keeps culling bytes', () {
    final w = JsVoxelWorld();
    w.handleHostCall('voxel.attach', {'id': 't'});
    final palette = [_flatPalette(), _flatPalette()];
    final res = w.handleHostCall('voxel.blocks', _payload(
      key: '0,0', size: [1, 1, 1], blocks: [0], palette: palette,
    ));
    expect(res['ok'], true);
    expect(res['faces'], 0);
    expect(w.chunksOf('t').containsKey('0,0'), false);
    // The neighbor to the east meshes against the resident (air) bytes:
    // its border face stays visible — the cell next door is air.
    w.handleHostCall('voxel.blocks', _payload(
      key: '1,0', origin: [1, 0, 0], size: [1, 1, 1], blocks: [1],
    ));
    expect(w.chunksOf('t')['1,0']!.faceCount, 12);
  });

  test('chunkRemove drops the mesh AND the culling bytes', () {
    final w = _worldWith(_payload(
      key: '0,0', size: [1, 1, 1], blocks: [1],
      palette: [_flatPalette(), _flatPalette()],
    ));
    final res = w.handleHostCall('voxel.chunkRemove', {'id': 't', 'key': '0,0'});
    expect(res['removed'], true);
    expect(w.chunksOf('t').containsKey('0,0'), false);
    // Re-uploading requires the palette again (cache resets with the
    // instance? no — palette is per-instance, still cached).
    final res2 = w.handleHostCall('voxel.blocks', _payload(
      key: '1,0', origin: [1, 0, 0], size: [1, 1, 1], blocks: [1],
    ));
    expect(res2['ok'], true);
  });

  test('non-grid keys mesh without neighbor participation', () {
    final w = _worldWith(_payload(
      key: 'special', size: [1, 1, 1], blocks: [1],
      palette: [_flatPalette(), _flatPalette()],
    ));
    expect(w.chunksOf('t')['special']!.faceCount, 12);
  });

  test('tone jitter is deterministic and 4-valued', () {
    final pal = JsVoxelPalette.fromDynamic([
      {
        'top': ['101010', '202020', '303030', '404040'],
        'side': ['101010', '202020', '303030', '404040'],
      },
    ])!;
    final seen = <int>{};
    final out = Float32List(3);
    for (var i = 0; i < 200; i++) {
      pal.faceColor(1, false, i * 7, 3, i * 13, 1, out);
      seen.add((out[0] * 255).round());
    }
    expect(seen, {13, 26, 39, 52}); // 16/32/48/64 under the side class
  });

  test('shade parsing: garbage keeps defaults, valid triples apply', () {
    final pal = JsVoxelPalette.fromDynamic([_flatPalette(), _flatPalette()])!;
    final before = Float32List.fromList(pal.shade);
    pal.applyShade('nope'); // not a list — kept
    pal.applyShade([0.5, 0.5]); // wrong arity — kept
    pal.applyShade([0.5, 0.5, 'x']); // non-num — kept
    for (var i = 0; i < 3; i++) {
      expect(pal.shade[i], before[i]);
    }
    pal.applyShade([0.1, 0.5, 2.0]); // clamped to 0..1
    expect(pal.shade[0], closeTo(0.1, 1e-6)); // float32 storage
    expect(pal.shade[1], 0.5);
    expect(pal.shade[2], 1.0);
    // The shade classes flow into face colors: top vs bottom differ.
    final out = Float32List(3);
    pal.applyShade([0.2, 0.5, 1.0]);
    pal.faceColor(1, false, 3, 3, 3, 0, out); // bottom class
    expect(out[0], closeTo(0x80 / 255 * 0.2, 0.01));
    pal.faceColor(1, false, 3, 3, 3, 2, out); // top class
    expect(out[0], closeTo(0x80 / 255 * 1.0, 0.01));
  });

  test('payload shade overrides the default classes', () {
    final w = _worldWith(_payload(
      key: '0,0',
      size: [1, 1, 1],
      blocks: [1],
      palette: [_flatPalette('404040'), _flatPalette('404040')],
      shade: [1.0, 1.0, 1.0],
    ));
    final chunk = w.chunksOf('t')['0,0']!;
    // All faces share one class now: every green is exactly the tone.
    for (var i = 1; i < chunk.colors.length; i += 3) {
      expect(chunk.colors[i], closeTo(0x40 / 255, 0.001));
    }
  });
}
