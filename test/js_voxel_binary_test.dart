import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bridge.dart';

import 'support/jsr_quickjs_harness.dart';

/// The zero-JSON voxel lane: `jsr.hostCallBinary('voxel.mesh.bin', …)`
/// delivers a packed chunk (tiny JSON header + raw f32/u32 buffers) that
/// lands straight in the bridge-owned [JsVoxelWorld] — no host handler
/// involved, no per-number boxing.
const int kVoxelMeshMagic = 0x4A56584D; // 'JVXM'

Uint8List packMesh({
  String id = 'fa-craft',
  String key = '1,2',
  List<double> origin = const [16, 0, 32],
  required Float32List positions,
  required Float32List colors,
  required Uint32List indices,
  bool overlay = false,
}) {
  final header = jsonEncode({
    'id': id,
    'key': key,
    'origin': origin,
    'ni': indices.length,
    if (overlay) 'overlay': true,
  });
  final headerBytes = utf8.encode(header);
  // Pad the header to a 4-byte boundary so the f32 body stays aligned
  // (the JS packer does the same — TypedData views require alignment).
  final padded = headerBytes.length + ((4 - headerBytes.length % 4) % 4);
  final out = Uint8List(12 + padded + positions.length * 4 +
      colors.length * 4 + indices.length * 4);
  final bd = ByteData.view(out.buffer);
  bd.setUint32(0, kVoxelMeshMagic, Endian.little);
  bd.setUint32(4, 1, Endian.little);
  bd.setUint32(8, headerBytes.length, Endian.little);
  out.setAll(12, headerBytes);
  var off = 12 + padded;
  for (var i = 0; i < positions.length; i++) {
    bd.setFloat32(off, positions[i], Endian.little);
    off += 4;
  }
  for (var i = 0; i < colors.length; i++) {
    bd.setFloat32(off, colors[i], Endian.little);
    off += 4;
  }
  for (var i = 0; i < indices.length; i++) {
    bd.setUint32(off, indices[i], Endian.little);
    off += 4;
  }
  return out;
}

/// A 2-quad / 8-vertex chunk with distinct values per slot.
(Float32List, Float32List, Uint32List) sampleMesh() {
  final positions = Float32List(8 * 3);
  final colors = Float32List(8 * 3);
  final indices = Uint32List.fromList([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  for (var v = 0; v < 8; v++) {
    positions[v * 3] = v * 1.5;
    positions[v * 3 + 1] = v % 2 == 0 ? 0 : 1;
    positions[v * 3 + 2] = v * 0.25;
    final c = (v % 3) / 3;
    colors[v * 3] = c;
    colors[v * 3 + 1] = 0.5;
    colors[v * 3 + 2] = 1 - c;
  }
  return (positions, colors, indices);
}

void main() {
  test('binary chunk upload lands in the world with byte-exact buffers',
      () {
    final bridge = buildBinaryTestBridge(onHostCallBinary: (_, __) {
      fail('voxel.* binary traffic must not reach the host handler');
    });
    addTearDown(bridge.dispose);
    final (positions, colors, indices) = sampleMesh();
    bridge.dispatchBinary(
      'voxel.mesh.bin',
      packMesh(
        positions: positions,
        colors: colors,
        indices: indices,
        overlay: true,
      ),
    );
    final chunks = bridge.voxelWorld.chunksOf('fa-craft');
    final chunk = chunks['1,2'];
    expect(chunk, isNotNull);
    expect(chunk!.positions, positions);
    expect(chunk.colors, colors);
    expect(chunk.indices, indices);
    expect(chunk.origin, [16, 0, 32]);
    expect(chunk.overlay, isTrue);
    expect(chunk.vertexCount, 8);
    expect(chunk.faceCount, 4);
  });

  test('foreign names keep flowing to the host binary handler', () {
    Uint8List? delivered;
    final bridge = buildBinaryTestBridge(
      onHostCallBinary: (_, data) => delivered = data,
    );
    addTearDown(bridge.dispose);
    bridge.dispatchBinary('kart.f32', Uint8List.fromList([1, 2, 3]));
    expect(delivered, [1, 2, 3]);
  });

  test('malformed packed chunks are dropped without wedging the world',
      () {
    final bridge = buildBinaryTestBridge(onHostCallBinary: null);
    addTearDown(bridge.dispose);
    final (positions, colors, indices) = sampleMesh();
    // Bad magic.
    final bad = packMesh(
      positions: positions,
      colors: colors,
      indices: indices,
    );
    bad[0] = 0x00;
    bridge.dispatchBinary('voxel.mesh.bin', bad);
    // Truncated body.
    final short = Uint8List.sublistView(
      packMesh(positions: positions, colors: colors, indices: indices),
      0,
      24,
    );
    bridge.dispatchBinary('voxel.mesh.bin', short);
    // Out-of-bounds indices (header lies about the vertex count).
    final oob = packMesh(
      positions: positions,
      colors: colors,
      indices: Uint32List.fromList([0, 1, 999]),
    );
    bridge.dispatchBinary('voxel.mesh.bin', oob);
    expect(bridge.voxelWorld.chunksOf('fa-craft'), isEmpty);
  });

  test('re-upload replaces the chunk wholesale (edit remesh contract)',
      () {
    final bridge = buildBinaryTestBridge(onHostCallBinary: null);
    addTearDown(bridge.dispose);
    final (positions, colors, indices) = sampleMesh();
    bridge.dispatchBinary(
      'voxel.mesh.bin',
      packMesh(positions: positions, colors: colors, indices: indices),
    );
    bridge.dispatchBinary(
      'voxel.mesh.bin',
      packMesh(
        key: '1,2',
        positions: Float32List.fromList([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        colors: Float32List.fromList(const [
          1, 0, 0, 1, 0, 0, 1, 0, 0, //
        ]),
        indices: Uint32List.fromList([0, 1, 2]),
      ),
    );
    final chunk = bridge.voxelWorld.chunksOf('fa-craft')['1,2']!;
    expect(chunk.vertexCount, 3);
    expect(chunk.faceCount, 1);
  });

  test('voxel.blocks.bin: raw block bytes mesh through the Dart mesher',
      () {
    final bridge = buildBinaryTestBridge(onHostCallBinary: (_, __) {
      fail('voxel.* binary traffic must not reach the host handler');
    });
    addTearDown(bridge.dispose);
    Uint8List packBlocks({
      String id = 'fa-craft',
      String key = '0,0',
      dynamic palette,
    }) {
      final header = jsonEncode({
        'id': id,
        'key': key,
        'origin': [0, 0, 0],
        'size': [2, 2, 2],
        if (palette != null) 'palette': palette,
      });
      final hb = utf8.encode(header);
      final pad = (4 - hb.length % 4) % 4;
      final body = Uint8List(8);
      body[0] = 7; // one non-air block, rest air
      final out = Uint8List(12 + hb.length + pad + 8);
      final bd = ByteData.view(out.buffer);
      bd.setUint32(0, kVoxelMeshMagic, Endian.little);
      bd.setUint32(4, 1, Endian.little);
      bd.setUint32(8, hb.length, Endian.little);
      out.setAll(12, hb);
      out.setAll(12 + hb.length + pad, body);
      return out;
    }
    // Palette spec: entry k colors block type k (0 = air placeholder),
    // four deterministic hex tones per entry — the runtime's greedy
    // mesher picks one per face from its own position hash.
    final dummy = ['#111111', '#222222', '#333333', '#444444'];
    final paletteSpec = <dynamic>[
      for (var i = 0; i < 8; i++)
        i == 7 ? ['#cc4444', '#bb3333', '#aa2222', '#991111'] : dummy,
    ];
    bridge.dispatchBinary('voxel.blocks.bin',
        packBlocks(palette: paletteSpec));
    final chunk = bridge.voxelWorld.chunksOf('fa-craft')['0,0'];
    expect(chunk, isNotNull,
        reason: 'the raw bytes meshed into a resident chunk');
    expect(chunk!.faceCount, greaterThan(0));
    // A re-upload WITHOUT the palette must still mesh (palette cached).
    bridge.dispatchBinary('voxel.blocks.bin', packBlocks());
    expect(bridge.voxelWorld.chunksOf('fa-craft')['0,0'], isNotNull);
    // Garbage is dropped silently.
    final bad = packBlocks();
    bad[0] = 0;
    bridge.dispatchBinary('voxel.blocks.bin', bad);
    expect(bridge.voxelWorld.chunksOf('fa-craft')['0,0'], isNotNull);
  });

  test('attach advertises the bin lane only when it is wired', () async {
    // Direct world contract: the flag is engine-wired, attach mirrors it.
    final bridge = buildBinaryTestBridge(onHostCallBinary: null);
    addTearDown(bridge.dispose);
    expect(
      bridge.voxelWorld.handleHostCall('voxel.attach', {'id': 'x'})['bin'],
      isNull,
    );
    bridge.voxelWorld.binaryLaneAvailable = true;
    expect(
      bridge.voxelWorld.handleHostCall('voxel.attach', {'id': 'x'})['bin'],
      isTrue,
    );
    expect(
      bridge.voxelWorld.handleHostCall('voxel.attach', {'id': 'x'})['blocks'],
      isTrue,
    );
  });

  test('engine-level: the widget shim delivers a packed chunk end to end',
      () async {
    // Full path through the real bootstrap: JS packs bytes in a
    // Uint8Array, __jsrSendBytes crosses (pointer, length), the bridge
    // routes voxel.mesh.bin into the world.
    final source = '''
      handleEvent = function(id, payload) {
        try {
        var head = JSON.stringify(payload.header);
        var hb = [];
        for (var i = 0; i < head.length; i++) hb.push(head.charCodeAt(i) & 255);
        var pad = (4 - (hb.length % 4)) % 4;
        var total = 12 + hb.length + pad + payload.np * 4 + payload.nc * 4 + payload.ni * 4;
        var buf = new ArrayBuffer(total);
        var dv = new DataView(buf);
        dv.setUint32(0, ${kVoxelMeshMagic}, true);
        dv.setUint32(4, 1, true);
        dv.setUint32(8, hb.length, true);
        new Uint8Array(buf, 12, hb.length).set(hb);
        var off = 12 + hb.length + pad;
        var P = new Float32Array(buf, off, payload.np); off += payload.np * 4;
        for (var k = 0; k < payload.np; k++) P[k] = k * 0.5;
        var C = new Float32Array(buf, off, payload.nc); off += payload.nc * 4;
        for (var k2 = 0; k2 < payload.nc; k2++) C[k2] = 0.25;
        var I = new Uint32Array(buf, off, payload.ni);
        for (var k3 = 0; k3 < payload.ni; k3++) I[k3] = k3;
        jsr.hostCallBinary('voxel.mesh.bin', new Uint8Array(buf));
        jsr.exportState({ sent: total });
        } catch (e) { jsr.exportState({ err: String(e) }); }
        return Promise.resolve();
      };
    ''';
    final backend = await bootQuickjsWidget(source);
    await backend.callEvent('upload', {
      'header': {'id': 'e2e', 'key': '0,0', 'origin': [0, 0, 0], 'ni': 6},
      'np': 18,
      'nc': 18,
      'ni': 6,
    });
    // Let the fire-and-forget delivery drain.
    await Future<void>.delayed(const Duration(milliseconds: 100));
    final chunk = backend.voxelWorld!.chunksOf('e2e')['0,0'];
    expect(chunk, isNotNull);
    expect(chunk!.vertexCount, 6);
    expect(chunk.faceCount, 2);
    expect(
      chunk.positions,
      Float32List.fromList(
        List.generate(18, (i) => i * 0.5),
      ),
    );
  });
}
