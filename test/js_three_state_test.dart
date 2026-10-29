import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';

ByteData _view(Uint8List bytes) => ByteData.sublistView(bytes);
void _u16(Uint8List b, int o, int v) => _view(b).setUint16(o, v, Endian.little);
void _u32(Uint8List b, int o, int v) => _view(b).setUint32(o, v, Endian.little);
void _f32(Uint8List b, int o, double v) =>
    _view(b).setFloat32(o, v, Endian.little);
void _ascii(Uint8List b, int o, String s) => b.setAll(o, ascii.encode(s));

Uint8List _r1(List<(int, Uint8List)> commands) {
  final out = Uint8List(commands.fold<int>(12, (n, c) => n + 8 + c.$2.length));
  _ascii(out, 0, 'JSR1');
  _u16(out, 4, 1);
  _u32(out, 8, commands.length);
  var offset = 12;
  for (final (opcode, body) in commands) {
    out[offset] = opcode;
    _u32(out, offset + 4, body.length);
    out.setAll(offset + 8, body);
    offset += 8 + body.length;
  }
  return out;
}

Uint8List _envelope(
  int sequence,
  List<(int, Uint8List)> commands, {
  String engine = 'engine',
  String surface = 'surface',
}) {
  final payload = _r1(commands);
  final e = utf8.encode(engine);
  final s = utf8.encode(surface);
  final header = 32 + e.length + s.length;
  final out = Uint8List(header + payload.length);
  _ascii(out, 0, 'JSR3');
  out[4] = 1;
  out[5] = 1;
  _u16(out, 6, header);
  _u32(out, 8, sequence);
  _u32(out, 12, payload.length);
  _u16(out, 16, e.length);
  _u16(out, 18, s.length);
  _u32(out, 24, out.length);
  out
    ..setAll(32, e)
    ..setAll(32 + e.length, s)
    ..setAll(header, payload);
  return out;
}

Uint8List _geometry(int id, int version, {double value = 0.25}) {
  final out = Uint8List(68);
  _u32(out, 0, id);
  _u32(out, 4, version);
  _u32(out, 8, 1);
  _u32(out, 12, 3);
  _u32(out, 20, 0);
  _u32(out, 28, 36);
  for (var i = 0; i < 9; i++) {
    _f32(out, 32 + i * 4, value + i);
  }
  return out;
}

Uint8List _texture(int id, int version, {int value = 1}) {
  final out = Uint8List(32);
  _u32(out, 0, id);
  _u32(out, 4, version);
  _u32(out, 8, 1);
  _u32(out, 12, 1);
  _u32(out, 24, 4);
  out.setAll(28, [value, 2, 3, 4]);
  return out;
}

Uint8List _material(
  int id,
  int version, {
  double color = 0.5,
  JsThreeMaterialKind kind = JsThreeMaterialKind.meshBasic,
  bool emissive = false,
  double emissiveR = 0,
  double emissiveG = 0,
  double emissiveB = 0,
  double emissiveIntensity = 1,
}) {
  final out = Uint8List(56 + (emissive ? 16 : 0));
  _u32(out, 0, id);
  _u32(out, 4, version);
  _u32(out, 8, kind.wireValue);
  _u32(out, 20, 0);
  _f32(out, 24, color);
  _f32(out, 28, 0.5);
  _f32(out, 32, 0.5);
  _f32(out, 36, 1);
  _f32(out, 40, 0.5);
  _f32(out, 44, 0.5);
  _f32(out, 48, 0);
  _f32(out, 52, 1);
  if (emissive) {
    _f32(out, 56, emissiveR);
    _f32(out, 60, emissiveG);
    _f32(out, 64, emissiveB);
    _f32(out, 68, emissiveIntensity);
  }
  return out;
}

Uint8List _node(int id, {int parent = 0, double matrix = 0, int shadow = 0}) {
  final out = Uint8List(92);
  _u32(out, 0, id);
  _u32(out, 4, parent);
  _u32(out, 8, id == 7 ? 0 : 1);
  _u32(out, 12, id == 7 ? 0 : 1);
  _u32(out, 16, 1);
  _u32(out, 20, id == 7 ? 0 : 1);
  for (var i = 0; i < 16; i++) {
    _f32(out, 24 + i * 4, matrix + i);
  }
  _u32(out, 88, shadow);
  return out;
}

Uint8List _batch(
  int nodeId,
  int version, {
  int instanceCount = 2,
  bool instanced = true,
  int geometryId = 1,
  int materialId = 3,
  int offset = 0,
  int count = 3,
  double matrix = 0,
}) {
  final matrixValues = instanced ? instanceCount * 16 : 0;
  final out = Uint8List(36 + matrixValues * 4);
  _u32(out, 0, nodeId);
  _u32(out, 4, version);
  _u32(out, 8, instanceCount);
  _u32(out, 12, instanced ? 1 : 0);
  _u32(out, 16, 1);
  _u32(out, 20, geometryId);
  _u32(out, 24, materialId);
  _u32(out, 28, offset);
  _u32(out, 32, count);
  for (var index = 0; index < matrixValues; index++) {
    _f32(out, 36 + index * 4, matrix + index);
  }
  return out;
}

Uint8List _camera(int id, {double matrix = 0}) {
  final out = Uint8List(200);
  _u32(out, 0, id);
  _u32(out, 4, 0);
  for (var i = 0; i < 48; i++) {
    _f32(out, 8 + i * 4, matrix + i);
  }
  return out;
}

Uint8List _light(int id, {double intensity = 1}) {
  final out = Uint8List(48);
  _u32(out, 0, id);
  _u32(out, 4, 0);
  _f32(out, 8, 1);
  _f32(out, 12, 1);
  _f32(out, 16, 1);
  _f32(out, 20, intensity);
  return out;
}

Uint8List _frame(int scene, int camera, {double exposure = 1}) {
  final out = Uint8List(136);
  _u32(out, 0, scene);
  _u32(out, 4, camera);
  _f32(out, 8, 0.1);
  _f32(out, 12, 0.2);
  _f32(out, 16, 0.3);
  _f32(out, 20, 1);
  _f32(out, 24, exposure);
  _f32(out, 68, 1);
  return out;
}

Uint8List _remove(int id) {
  final out = Uint8List(4);
  _u32(out, 0, id);
  return out;
}

Uint8List _dispose(int id, int kind) {
  final out = Uint8List(8);
  _u32(out, 0, id);
  _u32(out, 4, kind);
  return out;
}

List<(int, Uint8List)> _resources() => [
  (1, _geometry(1, 1)),
  (2, _texture(2, 1)),
  (3, _material(3, 1)),
  (4, _node(7)),
  (6, _camera(9)),
  (7, _light(4)),
];

void _bad(void Function() action) {
  expect(action, throwsA(isA<JsThreeProtocolException>()));
}

void main() {
  test(
    'apply exposes drawing state, selected frame, and effective changes',
    () {
      final store = JsThreeStateStore();
      final result = store.apply(
        _envelope(1, [..._resources(), (8, _frame(7, 9))]),
      );
      final state = result.surface;
      expect(store.surface('engine', 'surface'), same(state));
      expect(store.surfaceByKey(state.key), same(state));
      expect(state.lastSequence, 1);
      expect(state.disposed, isFalse);
      expect(state.geometries[1]!.version, 1);
      expect(state.textures[2]!.version, 1);
      expect(state.materials[3]!.version, 1);
      expect(state.nodes[7], same(state.scene));
      expect(state.cameras[9], same(state.camera));
      expect(state.lights[4]!.type, JsThreeLightType.ambient);
      expect(state.currentFrame, isNotNull);
      expect(state.pendingFrames, [same(state.currentFrame)]);
      expect(result.changes, hasLength(7));
      expect(result.geometryUploads, hasLength(1));
      expect(result.textureUploads, hasLength(1));
      expect(result.materialUploads, hasLength(1));
      expect(result.changedNodes, hasLength(1));
      expect(result.changedCameras, hasLength(1));
      expect(result.changedLights, hasLength(1));
      expect(result.submittedFrames, hasLength(1));
      expect(state.uploadCount, 3);
      expect(state.appliedEnvelopeCount, 1);
      expect(state.appliedCommandCount, 7);
      expect(() => state.nodes[8] = state.nodes[7]!, throwsUnsupportedError);
      expect(() => store.surfaces.clear(), throwsUnsupportedError);
    },
  );

  test('newer emissive material versions replace render state', () {
    final store = JsThreeStateStore();
    store.apply(
      _envelope(1, [
        (
          3,
          _material(
            3,
            1,
            kind: JsThreeMaterialKind.meshLambert,
            emissive: true,
            emissiveR: 0.125,
            emissiveG: 0.25,
            emissiveB: 0.5,
            emissiveIntensity: 2,
          ),
        ),
      ]),
    );
    final state = store.surface('engine', 'surface')!;
    expect(state.materials[3]!.emissiveR, 0.125);
    expect(state.materials[3]!.emissiveIntensity, 2);

    final changed = store.apply(
      _envelope(2, [
        (
          3,
          _material(
            3,
            2,
            kind: JsThreeMaterialKind.meshLambert,
            emissive: true,
            emissiveR: 0.75,
            emissiveG: 0.5,
            emissiveB: 0.25,
            emissiveIntensity: 6,
          ),
        ),
      ]),
    );
    expect(changed.materialUploads, hasLength(1));
    expect(state.materials[3]!.version, 2);
    expect(state.materials[3]!.emissiveR, 0.75);
    expect(state.materials[3]!.emissiveG, 0.5);
    expect(state.materials[3]!.emissiveB, 0.25);
    expect(state.materials[3]!.emissiveIntensity, 6);
  });

  test('geometry, texture, and material upload only for newer versions', () {
    final store = JsThreeStateStore();
    store.apply(
      _envelope(1, [
        (1, _geometry(1, 5)),
        (2, _texture(2, 5)),
        (3, _material(3, 5)),
      ]),
    );
    final state = store.surface('engine', 'surface')!;
    final geometry = state.geometries[1];
    final texture = state.textures[2];
    final material = state.materials[3];
    for (final sequence in [2, 3]) {
      final result = store.apply(
        _envelope(sequence, [
          (1, _geometry(1, sequence == 2 ? 4 : 5)),
          (2, _texture(2, sequence == 2 ? 4 : 5)),
          (3, _material(3, sequence == 2 ? 4 : 5)),
        ]),
      );
      expect(result.changes, isEmpty);
      expect(result.unchangedUploadCount, 3);
      expect(state.geometries[1], same(geometry));
      expect(state.textures[2], same(texture));
      expect(state.materials[3], same(material));
    }
    expect(state.uploadCount, 3);
    expect(state.unchangedUploadCount, 6);
    final newer = store.apply(
      _envelope(4, [
        (1, _geometry(1, 7)),
        (1, _geometry(1, 6)),
        (2, _texture(2, 6)),
      ]),
    );
    expect(newer.geometryUploads, hasLength(1));
    expect(newer.textureUploads, hasLength(1));
    expect(newer.unchangedUploadCount, 1);
    expect(state.geometries[1]!.version, 7);
    expect(state.textures[2]!.version, 6);
    expect(state.geometryUploadCount, 2);
    expect(state.textureUploadCount, 2);
    expect(state.materialUploadCount, 1);
  });

  test(
    'nodes, cameras, and lights are dirty on every upsert; removal is idempotent',
    () {
      final store = JsThreeStateStore();
      store.apply(
        _envelope(1, [(4, _node(7)), (6, _camera(9)), (7, _light(4))]),
      );
      final state = store.surface('engine', 'surface')!;
      final oldNode = state.nodes[7];
      final oldCamera = state.cameras[9];
      final oldLight = state.lights[4];
      final dirty = store.apply(
        _envelope(2, [
          (4, _node(7, matrix: 1)),
          (6, _camera(9, matrix: 1)),
          (7, _light(4, intensity: 2)),
        ]),
      );
      expect(dirty.changedNodes, hasLength(1));
      expect(dirty.changedCameras, hasLength(1));
      expect(dirty.changedLights, hasLength(1));
      expect(state.nodes[7], isNot(same(oldNode)));
      expect(state.cameras[9], isNot(same(oldCamera)));
      expect(state.lights[4], isNot(same(oldLight)));
      final removed = store.apply(_envelope(3, [(5, _remove(7))]));
      expect(removed.nodeRemovals, hasLength(1));
      expect(state.nodes, isEmpty);
      expect(state.disposedResourceCount, 1);
      final repeated = store.apply(_envelope(4, [(5, _remove(7))]));
      expect(repeated.changes, isEmpty);
      expect(state.disposedResourceCount, 1);
    },
  );

  test(
    'resource disposal clears all kinds, is idempotent, and resets versions',
    () {
      final store = JsThreeStateStore();
      store.apply(_envelope(1, _resources()));
      final state = store.surface('engine', 'surface')!;
      final commands = [
        (9, _dispose(1, 1)),
        (9, _dispose(2, 2)),
        (9, _dispose(3, 3)),
        (9, _dispose(7, 4)),
        (9, _dispose(4, 5)),
        (9, _dispose(9, 6)),
      ];
      final disposed = store.apply(_envelope(2, commands));
      expect(disposed.resourceDisposals, hasLength(6));
      expect(state.geometries, isEmpty);
      expect(state.textures, isEmpty);
      expect(state.materials, isEmpty);
      expect(state.nodes, isEmpty);
      expect(state.cameras, isEmpty);
      expect(state.lights, isEmpty);
      expect(state.disposedResourceCount, 6);
      expect(state.disposed, isFalse);
      expect(store.apply(_envelope(3, commands)).changes, isEmpty);
      expect(state.disposedResourceCount, 6);
      final reused = store.apply(_envelope(4, [(1, _geometry(1, 1))]));
      expect(reused.geometryUploads, hasLength(1));
      expect(state.geometries[1]!.version, 1);
      expect(state.geometryUploadCount, 2);
    },
  );

  test('batch versions are idempotent and isolated per surface', () {
    final store = JsThreeStateStore();
    store.apply(_envelope(1, [(4, _node(8)), (11, _batch(8, 5))]));
    final state = store.surface('engine', 'surface')!;
    final original = state.batches[8];
    final unchanged = store.apply(_envelope(2, [(11, _batch(8, 4))]));
    expect(unchanged.changes, isEmpty);
    expect(unchanged.unchangedUploadCount, 1);
    expect(state.batches[8], same(original));

    store.apply(_envelope(1, [(11, _batch(8, 9))], surface: 'other'));
    expect(store.surface('engine', 'other')!.batches[8]!.version, 9);
    expect(state.batches[8], same(original));

    final updated = store.apply(
      _envelope(3, [(11, _batch(8, 6)), (11, _batch(8, 5))]),
    );
    expect(updated.batchUploads, hasLength(1));
    expect(updated.unchangedUploadCount, 1);
    expect(state.batches[8]!.version, 6);
    expect(state.batches[8]!.instanceMatrices, hasLength(32));
    expect(state.batchUploadCount, 2);
    expect(state.unchangedUploadCount, 2);
    expect(() => state.batches.clear(), throwsUnsupportedError);
  });

  test('batch removal, node lifecycle, and surface disposal stay coupled', () {
    final store = JsThreeStateStore();
    store.apply(_envelope(1, [(4, _node(8)), (11, _batch(8, 1))]));
    final state = store.surface('engine', 'surface')!;
    final removed = store.apply(_envelope(2, [(12, _remove(8))]));
    expect(removed.batchRemovals, hasLength(1));
    expect(state.batches, isEmpty);
    expect(store.apply(_envelope(3, [(12, _remove(8))])).changes, isEmpty);

    store.apply(_envelope(4, [(11, _batch(8, 1))]));
    final ordinary = store.apply(
      _envelope(5, [(4, _node(8)), (12, _remove(8))]),
    );
    expect(ordinary.changes.map((command) => command.opcode), [4, 12]);
    expect(state.nodes[8]!.geometryId, 1);
    expect(state.batches, isEmpty);

    store.apply(_envelope(6, [(11, _batch(8, 2))]));
    store.apply(_envelope(7, [(5, _remove(8))]));
    expect(state.nodes, isEmpty);
    expect(state.batches, isEmpty);

    store.apply(_envelope(8, [(4, _node(8)), (11, _batch(8, 3))]));
    store.apply(_envelope(9, [(9, _dispose(8, 4))]));
    expect(state.nodes, isEmpty);
    expect(state.batches, isEmpty);

    store.apply(_envelope(10, [(11, _batch(8, 4))]));
    store.apply(_envelope(11, [(10, Uint8List(0))]));
    expect(state.batches, isEmpty);
    expect(state.disposed, isTrue);
    expect(store.apply(_envelope(12, [(12, _remove(8))])).changes, isEmpty);
    _bad(() => store.apply(_envelope(13, [(11, _batch(8, 5))])));
    expect(state.lastSequence, 12);
  });

  test(
    'frame selection coalesces only presentation and preserves resources',
    () {
      final store = JsThreeStateStore();
      store.apply(_envelope(1, [(8, _frame(1, 9))]));
      store.apply(_envelope(2, [(8, _frame(2, 9))]));
      final third = store.apply(
        _envelope(3, [(1, _geometry(1, 1)), (8, _frame(3, 9))]),
      );
      final state = store.surface('engine', 'surface')!;
      expect(third.coalescedFrameCount, 1);
      expect(third.geometryUploads, hasLength(1));
      expect(state.geometries[1], isNotNull);
      expect(state.currentFrame!.sceneId, 3);
      expect(state.pendingFrames.map((f) => f.sceneId), [1, 3]);
      expect(state.pendingFrameCount, JsThreeSurfaceState.maxPendingFrames);
      expect(state.submittedFrameCount, 3);
      expect(state.coalescedFrameCount, 1);
      expect(
        () => state.pendingFrames.add(state.currentFrame!),
        throwsUnsupportedError,
      );
      expect(state.takePendingFrame()!.sceneId, 1);
      expect(state.takePendingFrame()!.sceneId, 3);
      expect(state.takePendingFrame(), isNull);
      expect(state.currentFrame!.sceneId, 3);
      store.apply(_envelope(4, [(8, _frame(4, 9))]));
      store.apply(_envelope(5, [(8, _frame(5, 9))]));
      store.apply(_envelope(6, [(8, _frame(6, 9))]));
      expect(state.pendingFrames.map((f) => f.sceneId), [4, 6]);
      expect(state.coalescedFrameCount, 2);
    },
  );

  test(
    'sequence ordering is per engine and surface with no mutation on rejection',
    () {
      final store = JsThreeStateStore();
      _bad(() => store.apply(_envelope(2, const [])));
      expect(store.surfaces, isEmpty);
      final first = _envelope(1, [(1, _geometry(1, 1))]);
      store.apply(first);
      store.apply(_envelope(1, [(1, _geometry(1, 8))], surface: 'other'));
      store.apply(_envelope(1, [(1, _geometry(1, 9))], engine: 'other'));
      expect(store.surfaces, hasLength(3));
      store.apply(_envelope(3, [(1, _geometry(1, 2))]));
      final state = store.surface('engine', 'surface')!;
      expect(state.lastSequence, 3);
      expect(state.geometries[1]!.version, 2);
      _bad(() => store.apply(first));
      _bad(() => store.apply(_envelope(2, const [])));
      expect(state.lastSequence, 3);
      expect(state.geometries[1]!.version, 2);
      expect(store.surface('engine', 'other')!.geometries[1]!.version, 8);
      expect(store.surface('other', 'surface')!.geometries[1]!.version, 9);
      final malformed = Uint8List.fromList([
        ..._envelope(4, [(1, _geometry(1, 3))]),
        0,
      ]);
      _bad(() => store.apply(malformed));
      expect(state.lastSequence, 3);
      expect(state.geometries[1]!.version, 2);
      final empty = store.apply(_envelope(4, const []));
      expect(empty.changes, isEmpty);
      expect(empty.acceptedCommandCount, 0);
      expect(state.lastSequence, 4);
    },
  );

  test(
    'malformed streams reject atomically and surface disposal applies last',
    () {
      final store = JsThreeStateStore();
      store.apply(_envelope(1, [(1, _geometry(1, 1)), (4, _node(7))]));
      final state = store.surface('engine', 'surface')!;
      final originalGeometry = state.geometries[1];
      final originalNode = state.nodes[7];
      final badMaterial = _material(3, 1);
      _f32(badMaterial, 24, double.nan);
      _bad(
        () => store.apply(
          _envelope(2, [
            (1, _geometry(1, 2)),
            (4, _node(7, matrix: 5)),
            (3, badMaterial),
          ]),
        ),
      );
      expect(state.lastSequence, 1);
      expect(state.geometries[1], same(originalGeometry));
      expect(state.nodes[7], same(originalNode));
      expect(state.geometryUploadCount, 1);
      expect(state.appliedEnvelopeCount, 1);
      expect(state.appliedCommandCount, 2);

      store.apply(_envelope(2, [(1, _geometry(1, 3))]));
      final decoded = JsThreeProtocolDecoder().decode(
        _envelope(3, [
          (1, _geometry(1, 4)),
          (10, Uint8List(0)),
          (2, _texture(2, 1)),
        ]),
      );
      final applied = store.applyDecoded(decoded);
      expect(applied.changes.map((command) => command.opcode), [1, 2, 10]);
      expect(applied.surfaceDisposed, isTrue);
      expect(state.lastSequence, 3);
      expect(state.geometries, isEmpty);
      expect(state.textures, isEmpty);
      expect(state.nodes, isEmpty);
      expect(state.disposed, isTrue);
      expect(state.geometryUploadCount, 3);
      expect(state.textureUploadCount, 1);
    },
  );

  test('shadow revision ignores non-caster transforms and tracks casters', () {
    final store = JsThreeStateStore();
    store.apply(_envelope(1, [(4, _node(7, shadow: 1))]));
    final state = store.surface('engine', 'surface')!;
    expect(state.contentRevision, 0);

    store.apply(_envelope(2, [(4, _node(7, matrix: 1, shadow: 1))]));
    expect(state.contentRevision, 0);
    store.apply(_envelope(3, [(4, _node(8, shadow: 1))]));
    expect(state.contentRevision, 1);
    store.apply(_envelope(4, [(4, _node(8, matrix: 2, shadow: 1))]));
    expect(state.contentRevision, 2);
    store.apply(_envelope(5, [(4, _node(8, matrix: 3))]));
    expect(state.contentRevision, 3);
    store.apply(_envelope(6, [(6, _camera(9))]));
    expect(state.contentRevision, 3);
  });

  test(
    'dispose surface clears drawing state and accepts only later disposal work',
    () {
      final store = JsThreeStateStore();
      store.apply(_envelope(1, [..._resources(), (8, _frame(7, 9))]));
      final state = store.surface('engine', 'surface')!;
      final disposed = store.apply(_envelope(2, [(10, Uint8List(0))]));
      expect(disposed.surfaceDisposed, isTrue);
      expect(state.disposed, isTrue);
      expect(state.lastSequence, 2);
      expect(state.geometries, isEmpty);
      expect(state.textures, isEmpty);
      expect(state.materials, isEmpty);
      expect(state.nodes, isEmpty);
      expect(state.cameras, isEmpty);
      expect(state.lights, isEmpty);
      expect(state.currentFrame, isNull);
      expect(state.pendingFrames, isEmpty);
      expect(state.scene, isNull);
      expect(state.camera, isNull);
      expect(state.disposedResourceCount, 6);
      expect(state.surfaceDisposalCount, 1);
      expect(state.uploadCount, 3);
      final repeated = store.apply(_envelope(3, [(10, Uint8List(0))]));
      expect(repeated.surfaceDisposed, isTrue);
      expect(state.surfaceDisposalCount, 1);
      expect(state.lastSequence, 3);
      _bad(() => store.apply(_envelope(4, [(1, _geometry(1, 2))])));
      expect(state.lastSequence, 3);
      expect(state.geometries, isEmpty);
      final lateDisposal = store.apply(_envelope(4, [(9, _dispose(1, 1))]));
      expect(lateDisposal.changes, isEmpty);
      expect(state.lastSequence, 4);
      _bad(() => store.apply(_envelope(4, [(10, Uint8List(0))])));
      expect(state.lastSequence, 4);
    },
  );
}
