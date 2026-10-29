import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

final _decoder = JsThreeProtocolDecoder();

ByteData _view(Uint8List bytes) => ByteData.sublistView(bytes);

void _u16(Uint8List bytes, int offset, int value) =>
    _view(bytes).setUint16(offset, value, Endian.little);
void _u32(Uint8List bytes, int offset, int value) =>
    _view(bytes).setUint32(offset, value, Endian.little);
void _f32(Uint8List bytes, int offset, double value) =>
    _view(bytes).setFloat32(offset, value, Endian.little);
void _ascii(Uint8List bytes, int offset, String value) =>
    bytes.setAll(offset, ascii.encode(value));

Uint8List _command(int opcode, Uint8List body) {
  final out = Uint8List(8 + body.length);
  out[0] = opcode;
  _u32(out, 4, body.length);
  out.setAll(8, body);
  return out;
}

Uint8List _r1(
  List<(int, Uint8List)> commands, {
  int version = 1,
  int flags = 0,
  int? commandCount,
}) {
  final length = commands.fold<int>(
    12,
    (total, command) => total + 8 + command.$2.length,
  );
  final out = Uint8List(length);
  _ascii(out, 0, 'JSR1');
  _u16(out, 4, version);
  _u16(out, 6, flags);
  _u32(out, 8, commandCount ?? commands.length);
  var offset = 12;
  for (final (opcode, body) in commands) {
    final command = _command(opcode, body);
    out.setAll(offset, command);
    offset += command.length;
  }
  return out;
}

Uint8List _t1(
  Uint8List payload, {
  int sequence = 1,
  String engine = 'engine',
  String surface = 'surface',
}) {
  final engineBytes = utf8.encode(engine);
  final surfaceBytes = utf8.encode(surface);
  final headerBytes = 32 + engineBytes.length + surfaceBytes.length;
  final out = Uint8List(headerBytes + payload.length);
  _ascii(out, 0, 'JSR3');
  out[4] = 1;
  out[5] = 1;
  _u16(out, 6, headerBytes);
  _u32(out, 8, sequence);
  _u32(out, 12, payload.length);
  _u16(out, 16, engineBytes.length);
  _u16(out, 18, surfaceBytes.length);
  _u32(out, 24, out.length);
  out.setAll(32, engineBytes);
  out.setAll(32 + engineBytes.length, surfaceBytes);
  out.setAll(headerBytes, payload);
  return out;
}

Uint8List _geometry({
  int id = 1,
  int version = 1,
  int mask = 15,
  int vertexCount = 3,
  int primitive = 0,
  int colorComponents = 4,
  List<int> indices = const [0, 1, 2],
  List<int>? wireIndices,
}) {
  final attributes = <List<double>>[
    if (mask & 1 != 0) List<double>.generate(vertexCount * 3, (i) => i + 0.25),
    if (mask & 2 != 0) List<double>.generate(vertexCount * 3, (i) => i + 0.5),
    if (mask & 4 != 0) List<double>.generate(vertexCount * 2, (i) => i + 0.75),
    if (mask & 8 != 0)
      List<double>.generate(vertexCount * colorComponents, (i) => i + 0.125),
  ];
  final length =
      28 +
      attributes.fold<int>(0, (n, a) => n + 4 + a.length * 4) +
      indices.length * 4 +
      (wireIndices == null ? 0 : 4 + wireIndices.length * 4);
  final out = Uint8List(length);
  _u32(out, 0, id);
  _u32(out, 4, version);
  _u32(out, 8, mask);
  _u32(out, 12, vertexCount);
  _u32(out, 16, indices.length);
  _u32(out, 20, primitive);
  var offset = 28;
  for (final attribute in attributes) {
    _u32(out, offset, attribute.length * 4);
    offset += 4;
    for (final value in attribute) {
      _f32(out, offset, value);
      offset += 4;
    }
  }
  for (final index in indices) {
    _u32(out, offset, index);
    offset += 4;
  }
  if (wireIndices != null) {
    _u32(out, offset, wireIndices.length);
    offset += 4;
    for (final index in wireIndices) {
      _u32(out, offset, index);
      offset += 4;
    }
  }
  return out;
}

Uint8List _texture({
  int id = 2,
  int version = 1,
  int width = 1,
  int height = 1,
  int encoding = 0,
  int flags = 127,
  List<int> data = const [1, 2, 3, 4],
}) {
  final out = Uint8List(28 + data.length);
  _u32(out, 0, id);
  _u32(out, 4, version);
  _u32(out, 8, width);
  _u32(out, 12, height);
  _u32(out, 16, encoding);
  _u32(out, 20, flags);
  _u32(out, 24, data.length);
  out.setAll(28, data);
  return out;
}

Uint8List _material({
  int id = 3,
  int version = 1,
  JsThreeMaterialKind kind = JsThreeMaterialKind.meshStandard,
  bool wireframe = false,
  double specularR = 0.125,
  double specularG = 0.25,
  double specularB = 0.5,
  double shininess = 64,
  bool emissive = false,
  double emissiveR = 0.125,
  double emissiveG = 0.25,
  double emissiveB = 0.5,
  double emissiveIntensity = 2,
}) {
  final phong = kind == JsThreeMaterialKind.meshPhong;
  final out = Uint8List((phong ? 72 : 56) + (emissive ? 16 : 0));
  _u32(out, 0, id);
  _u32(out, 4, version);
  _u32(out, 8, kind.wireValue);
  _u32(out, 12, 2);
  _u32(out, 16, 31 | (wireframe ? 32 : 0));
  _u32(out, 20, 2);
  _f32(out, 24, 0.25);
  _f32(out, 28, 0.5);
  _f32(out, 32, 0.75);
  _f32(out, 36, 0.8);
  _f32(out, 40, 0.4);
  _f32(out, 44, 0.3);
  _f32(out, 48, 0.2);
  _f32(out, 52, 2.5);
  if (phong) {
    _f32(out, 56, specularR);
    _f32(out, 60, specularG);
    _f32(out, 64, specularB);
    _f32(out, 68, shininess);
  }
  if (emissive) {
    final offset = phong ? 72 : 56;
    _f32(out, offset, emissiveR);
    _f32(out, offset + 4, emissiveG);
    _f32(out, offset + 8, emissiveB);
    _f32(out, offset + 12, emissiveIntensity);
  }
  return out;
}

Uint8List _node({int id = 7}) {
  final out = Uint8List(92);
  _u32(out, 0, id);
  _u32(out, 8, 1);
  _u32(out, 12, 3);
  _u32(out, 16, 1);
  _u32(out, 20, 1);
  for (var i = 0; i < 16; i++) {
    _f32(out, 24 + i * 4, i % 5 == 0 ? 1 : 0);
  }
  _u32(out, 88, 3);
  return out;
}

Uint8List _drawBatch({
  int nodeId = 7,
  int version = 1,
  int instanceCount = 1,
  int flags = 0,
  int? partCount,
  List<(int, int, int, int)> parts = const [(1, 3, 0, 3)],
  List<double>? matrices,
}) {
  final matrixValues =
      matrices ??
      (flags & 1 != 0
          ? [
              for (var instance = 0; instance < instanceCount; instance++)
                for (var component = 0; component < 16; component++)
                  component % 5 == 0 ? 1.0 : 0.0,
            ]
          : const <double>[]);
  final out = Uint8List(20 + parts.length * 16 + matrixValues.length * 4);
  _u32(out, 0, nodeId);
  _u32(out, 4, version);
  _u32(out, 8, instanceCount);
  _u32(out, 12, flags);
  _u32(out, 16, partCount ?? parts.length);
  var offset = 20;
  for (final (geometryId, materialId, partOffset, count) in parts) {
    _u32(out, offset, geometryId);
    _u32(out, offset + 4, materialId);
    _u32(out, offset + 8, partOffset);
    _u32(out, offset + 12, count);
    offset += 16;
  }
  for (final value in matrixValues) {
    _f32(out, offset, value);
    offset += 4;
  }
  return out;
}

Uint8List _camera({int id = 9}) {
  final out = Uint8List(200);
  _u32(out, 0, id);
  _u32(out, 4, 1);
  for (var i = 0; i < 48; i++) {
    _f32(out, 8 + i * 4, i + 0.5);
  }
  return out;
}

Uint8List _light({int id = 4}) {
  final out = Uint8List(48);
  _u32(out, 0, id);
  _u32(out, 4, 2);
  _f32(out, 8, 0.1);
  _f32(out, 12, 0.2);
  _f32(out, 16, 0.3);
  _f32(out, 20, 2);
  for (var i = 0; i < 6; i++) {
    _f32(out, 24 + i * 4, i - 0.5);
  }
  return out;
}

Uint8List _frame({
  int scene = 7,
  int camera = 9,
  double exposure = 1.25,
  int fogMode = 1,
  double fogNear = 50,
  double fogFar = 75,
  int shadowWidth = 0,
  int shadowHeight = 0,
  List<int> culledNodeIds = const [],
  List<int> culledShadowNodeIds = const [],
}) {
  final mainLength = culledNodeIds.isEmpty && culledShadowNodeIds.isEmpty
      ? 0
      : 4 + culledNodeIds.length * 4;
  final shadowLength = culledShadowNodeIds.isEmpty
      ? 0
      : 4 + culledShadowNodeIds.length * 4;
  final out = Uint8List(136 + mainLength + shadowLength);
  _u32(out, 0, scene);
  _u32(out, 4, camera);
  _f32(out, 8, 0.1);
  _f32(out, 12, 0.2);
  _f32(out, 16, 0.3);
  _f32(out, 20, 0.4);
  _f32(out, 24, exposure);
  _u32(out, 28, fogMode);
  _f32(out, 32, 0.5);
  _f32(out, 36, 0.6);
  _f32(out, 40, 0.7);
  _f32(out, 44, fogNear);
  _f32(out, 48, fogFar);
  _u32(out, 52, shadowWidth);
  _u32(out, 56, shadowHeight);
  _f32(out, 60, -0.0001);
  _f32(out, 64, 0.02);
  _f32(out, 68, 1);
  for (final index in [0, 5, 10, 15]) {
    _f32(out, 72 + index * 4, 1);
  }
  if (culledNodeIds.isNotEmpty || culledShadowNodeIds.isNotEmpty) {
    _u32(out, 136, culledNodeIds.length);
    for (var index = 0; index < culledNodeIds.length; index++) {
      _u32(out, 140 + index * 4, culledNodeIds[index]);
    }
  }
  if (culledShadowNodeIds.isNotEmpty) {
    final offset = 136 + mainLength;
    _u32(out, offset, culledShadowNodeIds.length);
    for (var index = 0; index < culledShadowNodeIds.length; index++) {
      _u32(out, offset + 4 + index * 4, culledShadowNodeIds[index]);
    }
  }
  return out;
}

Uint8List _u32Body(int value) {
  final out = Uint8List(4);
  _u32(out, 0, value);
  return out;
}

Uint8List _disposal({int id = 1, int kind = 1}) {
  final out = Uint8List(8);
  _u32(out, 0, id);
  _u32(out, 4, kind);
  return out;
}

List<(int, Uint8List)> _allCommands() => [
  (1, _geometry()),
  (2, _texture()),
  (3, _material()),
  (4, _node()),
  (5, _u32Body(7)),
  (6, _camera()),
  (7, _light()),
  (8, _frame()),
  (9, _disposal()),
  (10, Uint8List(0)),
  (11, _drawBatch()),
  (12, _u32Body(7)),
];

void _bad(void Function() action) {
  expect(action, throwsA(isA<JsThreeProtocolException>()));
}

void main() {
  test('decodes T1 metadata and every R1 opcode into immutable values', () {
    final bytes = _t1(
      _r1(_allCommands()),
      sequence: 7,
      engine: 'enginæ',
      surface: '表面',
    );
    final decoded = _decoder.decode(bytes);
    expect(decoded.envelope.protocolVersion, 1);
    expect(decoded.envelope.kind, 1);
    expect(decoded.envelope.sequence, 7);
    expect(decoded.envelope.engineId, 'enginæ');
    expect(decoded.envelope.surfaceId, '表面');
    expect(decoded.envelope.totalBytes, bytes.length);
    expect(decoded.envelope.payloadBytes, decoded.envelope.payload.length);
    expect(decoded.stream.commands.map((c) => c.opcode), [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
    ]);

    final geometry = decoded.stream.commands[0] as JsThreeGeometryUpsert;
    expect(geometry.attributeMask, 15);
    expect(geometry.vertexCount, 3);
    expect(geometry.indexCount, 3);
    expect(geometry.positions, hasLength(9));
    expect(geometry.normals, hasLength(9));
    expect(geometry.uvs, hasLength(6));
    expect(geometry.colors, hasLength(12));
    expect(geometry.colorStride, 4);
    expect(geometry.indices, [0, 1, 2]);
    final texture = decoded.stream.commands[1] as JsThreeTextureUpsert;
    expect(texture.encoding, JsThreeTextureEncoding.rawRgba8);
    expect(texture.srgb && texture.flipY && texture.nearestMag, isTrue);
    expect(texture.nearestMin && texture.mipmaps, isTrue);
    expect(texture.repeatS && texture.repeatT && !texture.isEncoded, isTrue);
    final material = decoded.stream.commands[2] as JsThreeMaterialUpsert;
    expect(material.kind, JsThreeMaterialKind.meshStandard);
    expect(material.side, JsThreeSide.double);
    expect(material.vertexColors && material.flatShading, isTrue);
    expect(
      material.transparent && material.depthTest && material.depthWrite,
      isTrue,
    );
    final node = decoded.stream.commands[3] as JsThreeNodeUpsert;
    expect(node.visible, isTrue);
    expect(node.castShadow && node.receiveShadow, isTrue);
    expect(node.matrixWorld, hasLength(16));
    expect(decoded.stream.commands[4], isA<JsThreeRemoveNode>());
    final camera = decoded.stream.commands[5] as JsThreeCameraUpsert;
    expect(camera.type, JsThreeCameraType.orthographic);
    expect(camera.matrixWorldInverse, hasLength(16));
    expect(camera.projectionMatrix, hasLength(16));
    expect(camera.matrixWorld, hasLength(16));
    final light = decoded.stream.commands[6] as JsThreeLightUpsert;
    expect(light.type, JsThreeLightType.point);
    expect(light.worldPosition, hasLength(3));
    expect(light.worldDirection, hasLength(3));
    final frame = decoded.stream.commands[7] as JsThreeSubmitFrame;
    expect(frame.sceneId, 7);
    expect(frame.cameraId, 9);
    expect(frame.exposure, closeTo(1.25, 0.00001));
    expect(frame.fogMode, JsThreeFogMode.linear);
    expect(frame.fogColorR, closeTo(0.5, 0.00001));
    expect(frame.fogColorG, closeTo(0.6, 0.00001));
    expect(frame.fogColorB, closeTo(0.7, 0.00001));
    expect(frame.fogNear, 50);
    expect(frame.fogFar, 75);
    final disposal = decoded.stream.commands[8] as JsThreeDisposeResource;
    expect(disposal.resourceKind, JsThreeResourceKind.geometry);
    expect(decoded.stream.commands[9], isA<JsThreeDisposeSurface>());
    final batch = decoded.stream.commands[10] as JsThreeDrawBatchUpsert;
    expect(batch.nodeId, 7);
    expect(batch.version, 1);
    expect(batch.instanceCount, 1);
    expect(batch.instanced, isFalse);
    expect(batch.parts.single.geometryId, 1);
    expect(batch.parts.single.materialId, 3);
    expect(batch.parts.single.offset, 0);
    expect(batch.parts.single.count, 3);
    expect(batch.instanceMatrices, isEmpty);
    expect(decoded.stream.commands[11], isA<JsThreeRemoveBatch>());

    expect(() => decoded.envelope.payload[0] = 0, throwsUnsupportedError);
    expect(() => geometry.positions[0] = 0, throwsUnsupportedError);
    expect(() => geometry.indices[0] = 0, throwsUnsupportedError);
    expect(() => texture.data[0] = 0, throwsUnsupportedError);
    expect(
      () => decoded.stream.commands.add(decoded.stream.commands.first),
      throwsUnsupportedError,
    );
    expect(() => batch.parts.add(batch.parts.single), throwsUnsupportedError);
  });

  test(
    'accepts primitive, color stride, encoded texture, and empty variants',
    () {
      final variants = <JsThreeCommand>[
        ..._decoder
            .decodeR1(
              _r1([
                (1, _geometry(mask: 1, vertexCount: 3, indices: const [])),
                (
                  1,
                  _geometry(
                    mask: 1,
                    vertexCount: 4,
                    primitive: 1,
                    indices: const [],
                  ),
                ),
                (
                  1,
                  _geometry(
                    mask: 9,
                    vertexCount: 1,
                    primitive: 2,
                    colorComponents: 3,
                    indices: const [],
                  ),
                ),
                (
                  2,
                  _texture(width: 0, height: 0, encoding: 1, data: const [9]),
                ),
                (
                  2,
                  _texture(
                    width: 0,
                    height: 0,
                    encoding: 2,
                    data: const [8, 7],
                  ),
                ),
              ]),
            )
            .commands,
      ];
      expect(
        (variants[0] as JsThreeGeometryUpsert).primitive,
        JsThreePrimitive.triangles,
      );
      expect(
        (variants[1] as JsThreeGeometryUpsert).primitive,
        JsThreePrimitive.lines,
      );
      final points = variants[2] as JsThreeGeometryUpsert;
      expect(points.primitive, JsThreePrimitive.points);
      expect(points.colorStride, 3);
      expect(points.colors, hasLength(3));
      expect(
        (variants[3] as JsThreeTextureUpsert).encoding,
        JsThreeTextureEncoding.png,
      );
      expect(
        (variants[4] as JsThreeTextureUpsert).encoding,
        JsThreeTextureEncoding.jpeg,
      );
      expect(_decoder.decodeR1(_r1(const [])).commands, isEmpty);
    },
  );

  test('decodes Phong scalars and optional unique-edge wire indices', () {
    final commands = _decoder
        .decodeR1(
          _r1([
            (
              3,
              _material(
                kind: JsThreeMaterialKind.meshPhong,
                wireframe: true,
                shininess: 0,
              ),
            ),
            (
              1,
              _geometry(
                mask: 1,
                wireIndices: const [0, 1, 1, 2, 2, 0],
              ),
            ),
          ]),
        )
        .commands;
    final material = commands[0] as JsThreeMaterialUpsert;
    expect(material.kind, JsThreeMaterialKind.meshPhong);
    expect(material.wireframe, isTrue);
    expect(material.specularR, 0.125);
    expect(material.specularG, 0.25);
    expect(material.specularB, 0.5);
    expect(material.shininess, 0);
    final geometry = commands[1] as JsThreeGeometryUpsert;
    expect(geometry.hasWireIndices, isTrue);
    expect(geometry.wireIndexCount, 6);
    expect(geometry.wireIndices, [0, 1, 1, 2, 2, 0]);
    expect(() => geometry.wireIndices![0] = 0, throwsUnsupportedError);
    expect(
      (_decoder.decodeR1(_r1([(1, _geometry())])).commands.single
              as JsThreeGeometryUpsert)
          .wireIndices,
      isNull,
    );
  });

  test('decodes Normal distinctly and additive lit emissive payloads', () {
    final commands = _decoder
        .decodeR1(
          _r1([
            (
              3,
              _material(
                kind: JsThreeMaterialKind.meshNormal,
                wireframe: true,
              ),
            ),
            for (final kind in [
              JsThreeMaterialKind.meshLambert,
              JsThreeMaterialKind.meshStandard,
              JsThreeMaterialKind.meshPhong,
            ])
              (3, _material(kind: kind, emissive: true)),
          ]),
        )
        .commands;
    final normal = commands[0] as JsThreeMaterialUpsert;
    expect(normal.kind, JsThreeMaterialKind.meshNormal);
    expect(normal.kind.wireValue, 6);
    expect(normal.wireframe, isTrue);
    expect(normal.emissiveR, 0);
    expect(normal.emissiveG, 0);
    expect(normal.emissiveB, 0);
    expect(normal.emissiveIntensity, 1);
    for (var index = 1; index < commands.length; index++) {
      final material = commands[index] as JsThreeMaterialUpsert;
      expect(material.emissiveR, 0.125);
      expect(material.emissiveG, 0.25);
      expect(material.emissiveB, 0.5);
      expect(material.emissiveIntensity, 2);
    }
    final legacy =
        _decoder
                .decodeR1(_r1([(3, _material())]))
                .commands
                .single
            as JsThreeMaterialUpsert;
    expect(legacy.emissiveR, 0);
    expect(legacy.emissiveIntensity, 1);
  });

  test('rejects malformed or unsupported emissive extensions', () {
    for (final kind in [
      JsThreeMaterialKind.meshBasic,
      JsThreeMaterialKind.lineBasic,
      JsThreeMaterialKind.pointsBasic,
      JsThreeMaterialKind.meshNormal,
    ]) {
      _bad(
        () => _decoder.decodeR1(
          _r1([(3, _material(kind: kind, emissive: true))]),
        ),
      );
    }
    for (final kind in [
      JsThreeMaterialKind.meshLambert,
      JsThreeMaterialKind.meshStandard,
      JsThreeMaterialKind.meshPhong,
    ]) {
      final truncated = _material(kind: kind, emissive: true);
      _bad(
        () => _decoder.decodeR1(
          _r1([
            (3, Uint8List.sublistView(truncated, 0, truncated.length - 1)),
          ]),
        ),
      );
      final negative = _material(kind: kind, emissive: true);
      _f32(negative, negative.length - 4, -0.01);
      _bad(() => _decoder.decodeR1(_r1([(3, negative)])));
      final nonFinite = _material(kind: kind, emissive: true);
      _f32(nonFinite, nonFinite.length - 16, double.nan);
      _bad(() => _decoder.decodeR1(_r1([(3, nonFinite)])));
    }
  });

  test('rejects malformed Phong and wireframe extensions', () {
    final phong = _material(kind: JsThreeMaterialKind.meshPhong);
    _bad(
      () => _decoder.decodeR1(
        _r1([(3, Uint8List.sublistView(phong, 0, 56))]),
      ),
    );
    _f32(phong, 68, -1);
    _bad(() => _decoder.decodeR1(_r1([(3, phong)])));
    _bad(
      () => _decoder.decodeR1(
        _r1([
          (
            3,
            _material(
              kind: JsThreeMaterialKind.lineBasic,
              wireframe: true,
            ),
          ),
        ]),
      ),
    );
    for (final wireIndices in [
      const [0],
      const [0, 3],
    ]) {
      _bad(
        () => _decoder.decodeR1(
          _r1([(1, _geometry(mask: 1, wireIndices: wireIndices))]),
        ),
      );
    }
    _bad(
      () => _decoder.decodeR1(
        _r1([
          (
            1,
            _geometry(
              mask: 1,
              vertexCount: 4,
              primitive: 1,
              indices: const [],
              wireIndices: const [0, 1],
            ),
          ),
        ]),
      ),
    );
    final quota = _geometry(mask: 1, wireIndices: const []);
    _u32(quota, quota.length - 4, JsThreeProtocolDecoder.maxIndexCount + 1);
    _bad(() => _decoder.decodeR1(_r1([(1, quota)])));
  });

  test('frame validates fog mode and linear fog range', () {
    final frame =
        _decoder
                .decodeR1(_r1([(8, _frame(fogMode: 0, fogNear: 0, fogFar: 0))]))
                .commands
                .single
            as JsThreeSubmitFrame;
    expect(frame.fogMode, JsThreeFogMode.none);
    _bad(() => _decoder.decodeR1(_r1([(8, _frame(fogNear: -1))])));
    _bad(() => _decoder.decodeR1(_r1([(8, _frame(fogNear: 50, fogFar: 50))])));
    _bad(() => _decoder.decodeR1(_r1([(8, _frame(fogMode: 2))])));
  });

  test('frame decodes directional shadows and validates their limits', () {
    final frame =
        _decoder
                .decodeR1(
                  _r1([(8, _frame(shadowWidth: 2048, shadowHeight: 2048))]),
                )
                .commands
                .single
            as JsThreeSubmitFrame;
    expect(frame.hasShadow, isTrue);
    expect(frame.shadowMapWidth, 2048);
    expect(frame.shadowMapHeight, 2048);
    expect(frame.shadowBias, closeTo(-0.0001, 0.000001));
    expect(frame.shadowNormalBias, closeTo(0.02, 0.000001));
    expect(frame.shadowRadius, 1);
    expect(frame.shadowMatrix, hasLength(16));
    _bad(
      () => _decoder.decodeR1(
        _r1([(8, _frame(shadowWidth: 2048, shadowHeight: 0))]),
      ),
    );
    _bad(
      () => _decoder.decodeR1(
        _r1([(8, _frame(shadowWidth: 8193, shadowHeight: 8193))]),
      ),
    );
    final noRadius = _frame();
    _f32(noRadius, 68, 0);
    _bad(() => _decoder.decodeR1(_r1([(8, noRadius)])));
  });

  test('frame decodes independent main and shadow culled node ids', () {
    final frame =
        _decoder
                .decodeR1(
                  _r1([
                    (
                      8,
                      _frame(
                        culledNodeIds: const [7, 11, 7],
                        culledShadowNodeIds: const [13, 17, 13],
                      ),
                    ),
                  ]),
                )
                .commands
                .single
            as JsThreeSubmitFrame;
    expect(frame.culledNodeIds, {7, 11});
    expect(frame.culledShadowNodeIds, {13, 17});

    final shadowOnly =
        _decoder
                .decodeR1(
                  _r1([
                    (8, _frame(culledShadowNodeIds: const [19])),
                  ]),
                )
                .commands
                .single
            as JsThreeSubmitFrame;
    expect(shadowOnly.culledNodeIds, isEmpty);
    expect(shadowOnly.culledShadowNodeIds, {19});
  });

  test('node rejects unknown shadow flags', () {
    final node = _node();
    _u32(node, 88, 4);
    _bad(() => _decoder.decodeR1(_r1([(4, node)])));
  });

  test('decodes instanced and empty batches with exact matrix payloads', () {
    final matrices = List<double>.generate(32, (index) => index + 0.5);
    final commands = _decoder
        .decodeR1(
          _r1([
            (
              11,
              _drawBatch(
                instanceCount: 2,
                flags: 1,
                parts: const [(1, 3, 3, 6), (2, 4, 0, 3)],
                matrices: matrices,
              ),
            ),
            (11, _drawBatch(instanceCount: 0, flags: 1)),
          ]),
        )
        .commands;
    final instanced = commands[0] as JsThreeDrawBatchUpsert;
    expect(instanced.instanced, isTrue);
    expect(instanced.instanceCount, 2);
    expect(instanced.parts, hasLength(2));
    expect(instanced.parts[1].offset, 0);
    expect(instanced.parts[0].count, 6);
    expect(instanced.instanceMatrices, matrices);
    expect(() => instanced.instanceMatrices[0] = 0, throwsUnsupportedError);
    final empty = commands[1] as JsThreeDrawBatchUpsert;
    expect(empty.instanceCount, 0);
    expect(empty.parts, hasLength(1));
    expect(empty.instanceMatrices, isEmpty);
  });

  test('DRAW_BATCH and REMOVE_BATCH reject malformed bounded bodies', () {
    final mutations = <void Function(Uint8List)>[
      (body) => _u32(body, 0, 0),
      (body) => _u32(body, 4, 0),
      (body) => _u32(body, 8, 0),
      (body) => _u32(body, 8, 2),
      (body) => _u32(body, 12, 2),
      (body) => _u32(body, 16, 0),
      (body) => _u32(body, 16, 65537),
      (body) => _u32(body, 20, 0),
      (body) => _u32(body, 24, 0),
      (body) => _u32(body, 32, 0),
      (body) {
        _u32(body, 28, 0xffffffff);
        _u32(body, 32, 2);
      },
    ];
    for (final mutate in mutations) {
      final body = _drawBatch();
      mutate(body);
      _bad(() => _decoder.decodeR1(_r1([(11, body)])));
    }
    _bad(
      () => _decoder.decodeR1(
        _r1([
          (
            11,
            _drawBatch(instanceCount: 1000001, flags: 1, matrices: const []),
          ),
        ]),
      ),
    );
    _bad(() => _decoder.decodeR1(_r1([(11, _drawBatch(partCount: 2))])));
    _bad(
      () => _decoder.decodeR1(
        _r1([(11, _drawBatch(flags: 1, matrices: const []))]),
      ),
    );
    _bad(
      () => _decoder.decodeR1(
        _r1([
          (11, _drawBatch(matrices: const [1])),
        ]),
      ),
    );
    _bad(
      () => _decoder.decodeR1(
        _r1([
          (11, _drawBatch(instanceCount: 0, flags: 1, matrices: const [1])),
        ]),
      ),
    );
    _bad(() => _decoder.decodeR1(_r1([(12, _u32Body(0))])));
  });

  test(
    'T1 rejects bad metadata, integer overflow, invalid UTF-8, and trailing data',
    () {
      final mutations = <void Function(Uint8List)>[
        (b) => b[0] = 0,
        (b) => b[4] = 2,
        (b) => b[5] = 0x1b,
        (b) => _u16(b, 6, 32),
        (b) => _u32(b, 8, 0),
        (b) => _u32(b, 12, 1),
        (b) => _u16(b, 16, 0),
        (b) => _u16(b, 16, 129),
        (b) => _u16(b, 18, 0),
        (b) => _u16(b, 18, 129),
        (b) => _u32(b, 20, 1),
        (b) => _u32(b, 24, 0),
        (b) => _u32(b, 28, 1),
      ];
      for (final mutate in mutations) {
        final bytes = _t1(_r1(const []));
        mutate(bytes);
        _bad(() => _decoder.decodeEnvelope(bytes));
      }
      final valid = _t1(_r1(_allCommands()));
      for (var length = 0; length < valid.length; length++) {
        final truncated = Uint8List.sublistView(valid, 0, length);
        _bad(() => _decoder.decodeEnvelope(truncated));
      }
      _bad(() => _decoder.decodeEnvelope(Uint8List.fromList([...valid, 0])));
      _bad(
        () => JsThreeProtocolDecoder(
          maxEnvelopeBytes: valid.length - 1,
        ).decodeEnvelope(valid),
      );

      final badEngine = _t1(_r1(const []));
      badEngine[32] = 0xff;
      _bad(() => _decoder.decodeEnvelope(badEngine));
      final badSurface = _t1(_r1(const []));
      badSurface[32 + utf8.encode('engine').length] = 0xff;
      _bad(() => _decoder.decodeEnvelope(badSurface));
      final overflow = _t1(_r1(const []));
      _u32(overflow, 12, 0xffffffff);
      _bad(() => _decoder.decodeEnvelope(overflow));
    },
  );

  test(
    'sequence helper distinguishes syntax, first sequence, and stale work',
    () {
      JsThreeProtocolDecoder.validateSequence(9);
      JsThreeProtocolDecoder.validateSequence(1, lastSequence: 0);
      JsThreeProtocolDecoder.validateSequence(8, lastSequence: 7);
      _bad(() => JsThreeProtocolDecoder.validateSequence(0));
      _bad(() => JsThreeProtocolDecoder.validateSequence(2, lastSequence: 0));
      _bad(() => JsThreeProtocolDecoder.validateSequence(7, lastSequence: 7));
      _bad(() => JsThreeProtocolDecoder.validateSequence(6, lastSequence: 7));
    },
  );

  test(
    'R1 rejects unknown headers, command metadata, truncation, and trailing bytes',
    () {
      final valid = _r1(_allCommands());
      for (var length = 0; length < valid.length; length++) {
        final truncated = Uint8List.sublistView(valid, 0, length);
        _bad(() => _decoder.decodeR1(truncated));
      }
      _bad(() => _decoder.decodeR1(Uint8List.fromList([...valid, 0])));
      _bad(() => _decoder.decodeR1(_r1(const [], version: 2)));
      _bad(() => _decoder.decodeR1(_r1(const [], flags: 1)));
      _bad(() => _decoder.decodeR1(_r1(const [], commandCount: 100001)));
      _bad(() => _decoder.decodeR1(_r1([(13, Uint8List(0))])));
      _bad(() => _decoder.decodeR1(_r1([(1, _geometry())], commandCount: 0)));

      final commandCases = <Uint8List>[
        _r1([(10, Uint8List(0))]),
        _r1([(10, Uint8List(0))]),
        _r1([(10, Uint8List(0))]),
        _r1([(10, Uint8List(0))]),
      ];
      commandCases[0][0] = 0;
      commandCases[1][13] = 1;
      _u16(commandCases[2], 14, 1);
      _u32(commandCases[3], 16, 0xffffffff);
      for (final bytes in commandCases) {
        _bad(() => _decoder.decodeR1(bytes));
      }
    },
  );

  test('every opcode rejects short and overlong bodies', () {
    for (final (opcode, body) in _allCommands()) {
      for (var length = 0; length < body.length; length++) {
        final short = Uint8List.sublistView(body, 0, length);
        _bad(() => _decoder.decodeR1(_r1([(opcode, short)])));
      }
      final long = Uint8List.fromList([...body, 0]);
      _bad(() => _decoder.decodeR1(_r1([(opcode, long)])));
    }
  });

  test(
    'geometry enforces quotas, masks, primitive counts, strides, and indices',
    () {
      final mutations = <void Function(Uint8List)>[
        (b) => _u32(b, 0, 0),
        (b) => _u32(b, 4, 0),
        (b) => _u32(b, 8, 0),
        (b) => _u32(b, 8, 16),
        (b) => _u32(b, 12, 0),
        (b) => _u32(b, 12, 4000001),
        (b) => _u32(b, 16, 12000001),
        (b) => _u32(b, 16, 2),
        (b) => _u32(b, 20, 3),
        (b) => _u32(b, 24, 1),
        (b) => _u32(b, 28, 12),
        (b) => _u32(b, 68, 12),
        (b) => _u32(b, 108, 12),
        (b) => _u32(b, 136, 12),
      ];
      for (final mutate in mutations) {
        final body = _geometry();
        mutate(body);
        _bad(() => _decoder.decodeR1(_r1([(1, body)])));
      }
      _bad(
        () => _decoder.decodeR1(
          _r1([
            (1, _geometry(indices: const [0, 1, 3])),
          ]),
        ),
      );
      _bad(
        () => _decoder.decodeR1(
          _r1([(1, _geometry(mask: 1, vertexCount: 4, indices: const []))]),
        ),
      );
      _bad(
        () => _decoder.decodeR1(
          _r1([
            (
              1,
              _geometry(
                mask: 1,
                vertexCount: 3,
                primitive: 1,
                indices: const [],
              ),
            ),
          ]),
        ),
      );
    },
  );

  test(
    'texture enforces encoding, dimensions, flags, exact data, and quotas',
    () {
      final mutations = <void Function(Uint8List)>[
        (b) => _u32(b, 0, 0),
        (b) => _u32(b, 4, 0),
        (b) => _u32(b, 8, 0),
        (b) => _u32(b, 12, 0),
        (b) => _u32(b, 16, 3),
        (b) => _u32(b, 20, 128),
        (b) => _u32(b, 24, 3),
      ];
      for (final mutate in mutations) {
        final body = _texture();
        mutate(body);
        _bad(() => _decoder.decodeR1(_r1([(2, body)])));
      }
      for (final encoding in [1, 2]) {
        _bad(
          () => _decoder.decodeR1(
            _r1([(2, _texture(encoding: encoding, data: const []))]),
          ),
        );
        final excessive = _texture(encoding: encoding);
        _u32(excessive, 24, 64 * 1024 * 1024 + 1);
        _bad(() => _decoder.decodeR1(_r1([(2, excessive)])));
      }
      final overflow = _texture();
      _u32(overflow, 8, 0x3fffffff);
      _u32(overflow, 12, 0x3fffffff);
      _bad(() => _decoder.decodeR1(_r1([(2, overflow)])));
    },
  );

  test(
    'scalar bodies reject unknown kinds, flags, zero IDs, and invalid ranges',
    () {
      final cases = <(int, Uint8List, int, int)>[
        (3, _material(), 0, 0),
        (3, _material(), 4, 0),
        (3, _material(), 8, 7),
        (3, _material(), 16, 64),
        (3, _material(), 20, 3),
        (3, _material(), 52, 0),
        (4, _node(), 0, 0),
        (4, _node(), 16, 2),
        (4, _node(), 20, 4),
        (6, _camera(), 0, 0),
        (6, _camera(), 4, 2),
        (7, _light(), 0, 0),
        (7, _light(), 4, 3),
        (8, _frame(), 0, 0),
        (8, _frame(), 4, 0),
        (9, _disposal(), 0, 0),
        (9, _disposal(), 4, 0),
        (9, _disposal(), 4, 7),
      ];
      for (final (opcode, original, offset, value) in cases) {
        final body = Uint8List.fromList(original);
        _u32(body, offset, value);
        _bad(() => _decoder.decodeR1(_r1([(opcode, body)])));
      }
      _bad(() => _decoder.decodeR1(_r1([(5, _u32Body(0))])));
      for (final offset in [36, 40, 44, 48]) {
        for (final value in [-0.01, 1.01]) {
          final body = _material();
          _f32(body, offset, value);
          _bad(() => _decoder.decodeR1(_r1([(3, body)])));
        }
      }
      for (final value in [0.0, -1.0]) {
        final material = _material();
        _f32(material, 52, value);
        _bad(() => _decoder.decodeR1(_r1([(3, material)])));
        final frame = _frame();
        _f32(frame, 24, value);
        _bad(() => _decoder.decodeR1(_r1([(8, frame)])));
      }
      final light = _light();
      _f32(light, 20, -0.01);
      _bad(() => _decoder.decodeR1(_r1([(7, light)])));
    },
  );

  test('every floating field rejects NaN and both infinities', () {
    final cases = <(int, Uint8List Function(), List<int>)>[
      (
        1,
        () => _geometry(mask: 1, indices: const []),
        [for (var offset = 32; offset < 64; offset += 4) offset],
      ),
      (3, _material, [for (var offset = 24; offset < 56; offset += 4) offset]),
      (4, _node, [for (var offset = 24; offset < 88; offset += 4) offset]),
      (6, _camera, [for (var offset = 8; offset < 200; offset += 4) offset]),
      (7, _light, [for (var offset = 8; offset < 48; offset += 4) offset]),
      (
        8,
        _frame,
        [
          for (var offset = 8; offset < 28; offset += 4) offset,
          for (var offset = 32; offset < 52; offset += 4) offset,
          for (var offset = 60; offset < 136; offset += 4) offset,
        ],
      ),
      (
        11,
        () => _drawBatch(flags: 1),
        [for (var offset = 36; offset < 100; offset += 4) offset],
      ),
    ];
    for (final (opcode, build, offsets) in cases) {
      for (final offset in offsets) {
        for (final value in [
          double.nan,
          double.infinity,
          double.negativeInfinity,
        ]) {
          final body = build();
          _f32(body, offset, value);
          _bad(() => _decoder.decodeR1(_r1([(opcode, body)])));
        }
      }
    }
  });

  test('geometry attribute lengths and all attribute floats are checked', () {
    final offsets = <int>[];
    final body = _geometry();
    for (final start in [32, 72, 112, 140]) {
      final end = switch (start) {
        32 => 68,
        72 => 108,
        112 => 136,
        _ => 188,
      };
      offsets.addAll([
        for (var offset = start; offset < end; offset += 4) offset,
      ]);
    }
    for (final offset in offsets) {
      final invalid = Uint8List.fromList(body);
      _f32(invalid, offset, double.nan);
      _bad(() => _decoder.decodeR1(_r1([(1, invalid)])));
    }
  });
}
