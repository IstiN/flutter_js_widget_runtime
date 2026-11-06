import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_protocol_bytes.dart';

final _decoder = JsThreeProtocolDecoder();

Uint8List _command(int opcode, Uint8List body) {
  final out = Uint8List(8 + body.length);
  out[0] = opcode;
  setU32(out, 4, body.length);
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
  setAscii(out, 0, 'JSR1');
  setU16(out, 4, version);
  setU16(out, 6, flags);
  setU32(out, 8, commandCount ?? commands.length);
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
  setAscii(out, 0, 'JSR3');
  out[4] = 1;
  out[5] = 1;
  setU16(out, 6, headerBytes);
  setU32(out, 8, sequence);
  setU32(out, 12, payload.length);
  setU16(out, 16, engineBytes.length);
  setU16(out, 18, surfaceBytes.length);
  setU32(out, 24, out.length);
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
  setU32(out, 0, id);
  setU32(out, 4, version);
  setU32(out, 8, mask);
  setU32(out, 12, vertexCount);
  setU32(out, 16, indices.length);
  setU32(out, 20, primitive);
  var offset = 28;
  for (final attribute in attributes) {
    setU32(out, offset, attribute.length * 4);
    offset += 4;
    for (final value in attribute) {
      setF32(out, offset, value);
      offset += 4;
    }
  }
  for (final index in indices) {
    setU32(out, offset, index);
    offset += 4;
  }
  if (wireIndices != null) {
    setU32(out, offset, wireIndices.length);
    offset += 4;
    for (final index in wireIndices) {
      setU32(out, offset, index);
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
  setU32(out, 0, id);
  setU32(out, 4, version);
  setU32(out, 8, width);
  setU32(out, 12, height);
  setU32(out, 16, encoding);
  setU32(out, 20, flags);
  setU32(out, 24, data.length);
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
  setU32(out, 0, id);
  setU32(out, 4, version);
  setU32(out, 8, kind.wireValue);
  setU32(out, 12, 2);
  setU32(out, 16, 31 | (wireframe ? 32 : 0));
  setU32(out, 20, 2);
  setF32(out, 24, 0.25);
  setF32(out, 28, 0.5);
  setF32(out, 32, 0.75);
  setF32(out, 36, 0.8);
  setF32(out, 40, 0.4);
  setF32(out, 44, 0.3);
  setF32(out, 48, 0.2);
  setF32(out, 52, 2.5);
  if (phong) {
    setF32(out, 56, specularR);
    setF32(out, 60, specularG);
    setF32(out, 64, specularB);
    setF32(out, 68, shininess);
  }
  if (emissive) {
    final offset = phong ? 72 : 56;
    setF32(out, offset, emissiveR);
    setF32(out, offset + 4, emissiveG);
    setF32(out, offset + 8, emissiveB);
    setF32(out, offset + 12, emissiveIntensity);
  }
  return out;
}

/// R1 v4 frame body: the v3 layout with the tone-mapping u32 + FogExp2
/// density f32 tail inserted right after fogFar (offsets 52/56) and a
/// shadow content revision u32 at the end (matches frameCommand in
/// tool/three/src/r1.js).
Uint8List _frameV4({
  int scene = 7,
  int camera = 9,
  double exposure = 2.5,
  int toneMapping = 4,
  int fogMode = 2,
  double fogDensity = 0.0025,
  double fogNear = 50,
  double fogFar = 75,
}) {
  final out = Uint8List(148);
  setU32(out, 0, scene);
  setU32(out, 4, camera);
  setF32(out, 8, 0.1);
  setF32(out, 12, 0.2);
  setF32(out, 16, 0.3);
  setF32(out, 20, 0.4);
  setF32(out, 24, exposure);
  setU32(out, 28, fogMode);
  setF32(out, 32, 0.5);
  setF32(out, 36, 0.6);
  setF32(out, 40, 0.7);
  setF32(out, 44, fogNear);
  setF32(out, 48, fogFar);
  setU32(out, 52, toneMapping);
  setF32(out, 56, fogDensity);
  setU32(out, 60, 0);
  setU32(out, 64, 0);
  setF32(out, 68, -0.0001);
  setF32(out, 72, 0.02);
  setF32(out, 76, 1);
  for (final index in [0, 5, 10, 15]) {
    setF32(out, 80 + index * 4, 1);
  }
  setU32(out, 144, 0);
  return out;
}

/// R1 v4 material body: the v3 layout with the texture-slot tail
/// (alphaMapId, envMapId, envMapIntensity and two column-major 3x3 UV
/// matrices) between the clip fields and the Phong payload — matches
/// materialCommand in tool/three/src/r1.js.
Uint8List _materialV4({
  int id = 3,
  int kind = 0,
  int mapId = 11,
  int alphaMapId = 12,
  int envMapId = 13,
  double envMapIntensity = 1.75,
  List<double>? mapUv,
  List<double>? alphaMapUv,
}) {
  final phong = kind == 5;
  final out = Uint8List((phong ? 164 : 148));
  setU32(out, 0, id);
  setU32(out, 4, 1);
  setU32(out, 8, kind);
  setU32(out, 12, mapId);
  setU32(out, 16, 31);
  setU32(out, 20, 2);
  setF32(out, 24, 0.25);
  setF32(out, 28, 0.5);
  setF32(out, 32, 0.75);
  setF32(out, 36, 0.8);
  setF32(out, 40, 0.4);
  setF32(out, 44, 0.3);
  setF32(out, 48, 0.2);
  setF32(out, 52, 2.5);
  setU32(out, 56, 0);
  setU32(out, 60, 0);
  setU32(out, 64, alphaMapId);
  setU32(out, 68, envMapId);
  setF32(out, 72, envMapIntensity);
  final map = mapUv ?? [for (var i = 0; i < 9; i++) i % 4 == 0 ? 1 : 0];
  final alpha = alphaMapUv ?? [for (var i = 0; i < 9; i++) i % 4 == 0 ? 1 : 0];
  for (var i = 0; i < 9; i++) {
    setF32(out, 76 + i * 4, map[i]);
    setF32(out, 112 + i * 4, alpha[i]);
  }
  if (phong) {
    setF32(out, 148, 0.125);
    setF32(out, 152, 0.25);
    setF32(out, 156, 0.5);
    setF32(out, 160, 64);
  }
  return out;
}

Uint8List _materialV6({
  JsThreeMaterialKind kind = JsThreeMaterialKind.meshStandard,
  bool emissive = false,
  bool anaglyph = false,
}) {
  final legacy = _material(kind: kind);
  final phong = kind == JsThreeMaterialKind.meshPhong;
  final out = Uint8List(304 + (phong ? 16 : 0) + (emissive ? 16 : 0));
  out.setAll(0, legacy.sublist(0, 56));
  var offset = 56;
  offset += 8; // v3 clip id + flags
  offset += 8; // v4 alpha/env ids
  setF32(out, offset, 1); // env intensity
  offset += 4;
  for (var matrix = 0; matrix < 2; matrix++) {
    for (var index = 0; index < 9; index++) {
      setF32(out, offset, index % 4 == 0 ? 1 : 0);
      offset += 4;
    }
  }
  offset += 16; // v5 matcap/gradient/rotation/reserved
  offset += 4; // normal map id
  setF32(out, offset, 1);
  setF32(out, offset + 4, 1);
  offset += 8;
  offset += 4; // bump map id
  setF32(out, offset, 1);
  offset += 12; // bump scale + roughness/metalness ids
  if (phong) {
    out.setAll(offset, legacy.sublist(56, 72));
    offset += 16;
  }
  if (emissive) {
    for (final value in [0.125, 0.25, 0.5, 2.0]) {
      setF32(out, offset, value);
      offset += 4;
    }
  }
  setU32(out, offset, anaglyph ? 9 : 0);
  offset += 16; // right id + three reserved fields
  for (var matrix = 0; matrix < 2; matrix++) {
    for (var column = 0; column < 3; column++) {
      for (var row = 0; row < 3; row++) {
        setF32(
          out,
          offset,
          anaglyph ? (matrix * 9 + column * 3 + row + 1) / 10 : 0,
        );
        offset += 4;
      }
      setF32(out, offset, 0);
      offset += 4;
    }
  }
  expect(offset, out.length);
  return out;
}

/// R1 v8 material body: the full v6 layout with flag bits 10/11 in the
/// flags word and the optional 32-byte stencil tail appended LAST
/// (matches materialCommand in tool/three/src/r1.js). The tail exists only
/// when [stencil] is set and its flag bit is present.
Uint8List _materialV8({
  bool stencil = false,
  bool colorWriteOff = false,
  int stencilWrite = 1,
  int func = 0x0205,
  int ref = 3,
  int funcMask = 15,
  int writeMask = 240,
  int failOp = 0x1e00,
  int zFailOp = 0x1e01,
  int zPassOp = 0x8507,
}) {
  final base = _materialV6();
  final flags =
      31 | (stencil ? 0x800 : 0) | (colorWriteOff ? 0x400 : 0);
  setU32(base, 16, flags);
  if (!stencil) return base;
  final out = Uint8List(base.length + 32);
  out.setAll(0, base);
  final tail = out.length - 32;
  setU32(out, tail, stencilWrite);
  setU32(out, tail + 4, func);
  setU32(out, tail + 8, ref);
  setU32(out, tail + 12, funcMask);
  setU32(out, tail + 16, writeMask);
  setU32(out, tail + 20, failOp);
  setU32(out, tail + 24, zFailOp);
  setU32(out, tail + 28, zPassOp);
  return out;
}

Uint8List _renderTarget({
  int id = 2,
  int version = 1,
  int width = 640,
  int height = 360,
  int textureId = 2,
  int flags = 256,
}) {
  final out = Uint8List(28);
  setU32(out, 0, id);
  setU32(out, 4, version);
  setU32(out, 8, width);
  setU32(out, 12, height);
  setU32(out, 16, textureId);
  setU32(out, 20, flags);
  return out;
}

Uint8List _node({int id = 7}) {
  final out = Uint8List(92);
  setU32(out, 0, id);
  setU32(out, 8, 1);
  setU32(out, 12, 3);
  setU32(out, 16, 1);
  setU32(out, 20, 1);
  for (var i = 0; i < 16; i++) {
    setF32(out, 24 + i * 4, i % 5 == 0 ? 1 : 0);
  }
  setU32(out, 88, 3);
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
  List<double>? colors,
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
  final colorValues =
      colors ??
      (flags & 2 != 0
          ? [
              for (var instance = 0; instance < instanceCount; instance++) ...[
                0.25,
                0.5,
                0.75,
              ],
            ]
          : const <double>[]);
  final out = Uint8List(
    20 + parts.length * 16 + matrixValues.length * 4 + colorValues.length * 4,
  );
  setU32(out, 0, nodeId);
  setU32(out, 4, version);
  setU32(out, 8, instanceCount);
  setU32(out, 12, flags);
  setU32(out, 16, partCount ?? parts.length);
  var offset = 20;
  for (final (geometryId, materialId, partOffset, count) in parts) {
    setU32(out, offset, geometryId);
    setU32(out, offset + 4, materialId);
    setU32(out, offset + 8, partOffset);
    setU32(out, offset + 12, count);
    offset += 16;
  }
  for (final value in matrixValues) {
    setF32(out, offset, value);
    offset += 4;
  }
  for (final value in colorValues) {
    setF32(out, offset, value);
    offset += 4;
  }
  return out;
}

Uint8List _camera({int id = 9}) {
  final out = Uint8List(200);
  setU32(out, 0, id);
  setU32(out, 4, 1);
  for (var i = 0; i < 48; i++) {
    setF32(out, 8 + i * 4, i + 0.5);
  }
  return out;
}

Uint8List _light({
  int id = 4,
  JsThreeLightType type = JsThreeLightType.point,
  double groundR = 0.75,
  double groundG = 0.5,
  double groundB = 0.25,
}) {
  final hemisphere = type == JsThreeLightType.hemisphere;
  final out = Uint8List(hemisphere ? 64 : 48);
  setU32(out, 0, id);
  setU32(out, 4, type.wireValue);
  setF32(out, 8, 0.1);
  setF32(out, 12, 0.2);
  setF32(out, 16, 0.3);
  setF32(out, 20, 2);
  for (var i = 0; i < 6; i++) {
    setF32(out, 24 + i * 4, i - 0.5);
  }
  if (hemisphere) {
    setF32(out, 48, groundR);
    setF32(out, 52, groundG);
    setF32(out, 56, groundB);
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
  int? shadowLightType,
}) {
  final v3 = shadowLightType != null;
  final base = v3 ? 140 : 136;
  final mainLength = culledNodeIds.isEmpty && culledShadowNodeIds.isEmpty
      ? 0
      : 4 + culledNodeIds.length * 4;
  final shadowLength = culledShadowNodeIds.isEmpty
      ? 0
      : 4 + culledShadowNodeIds.length * 4;
  final out = Uint8List(base + mainLength + shadowLength);
  setU32(out, 0, scene);
  setU32(out, 4, camera);
  setF32(out, 8, 0.1);
  setF32(out, 12, 0.2);
  setF32(out, 16, 0.3);
  setF32(out, 20, 0.4);
  setF32(out, 24, exposure);
  setU32(out, 28, fogMode);
  setF32(out, 32, 0.5);
  setF32(out, 36, 0.6);
  setF32(out, 40, 0.7);
  setF32(out, 44, fogNear);
  setF32(out, 48, fogFar);
  setU32(out, 52, shadowWidth);
  setU32(out, 56, shadowHeight);
  setF32(out, 60, -0.0001);
  setF32(out, 64, 0.02);
  setF32(out, 68, 1);
  for (final index in [0, 5, 10, 15]) {
    setF32(out, 72 + index * 4, 1);
  }
  if (v3) setU32(out, 136, shadowLightType);
  if (culledNodeIds.isNotEmpty || culledShadowNodeIds.isNotEmpty) {
    setU32(out, base, culledNodeIds.length);
    for (var index = 0; index < culledNodeIds.length; index++) {
      setU32(out, base + 4 + index * 4, culledNodeIds[index]);
    }
  }
  if (culledShadowNodeIds.isNotEmpty) {
    final offset = base + mainLength;
    setU32(out, offset, culledShadowNodeIds.length);
    for (var index = 0; index < culledShadowNodeIds.length; index++) {
      setU32(out, offset + 4 + index * 4, culledShadowNodeIds[index]);
    }
  }
  return out;
}

Uint8List _u32Body(int value) {
  final out = Uint8List(4);
  setU32(out, 0, value);
  return out;
}

Uint8List _disposal({int id = 1, int kind = 1}) {
  final out = Uint8List(8);
  setU32(out, 0, id);
  setU32(out, 4, kind);
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

/// Copy of [body] with the u32/f32 at [offset] overwritten by [value].
Uint8List _frameVariant(Uint8List body, int offset, num value) {
  final out = Uint8List.fromList(body);
  if (value is int) {
    setU32(out, offset, value);
  } else {
    setF32(out, offset, value.toDouble());
  }
  return out;
}

/// R1 v5 frame body: the v4 layout with the point-shadow tail (flag +
/// reserved u32, light position and far plane) inserted right after the
/// v4 tone/fog tail — the projected-shadow fields then shift by 24 bytes;
/// matches frameCommand in tool/three/src/r1.js.
Uint8List _frameV5Point({
  int flag = 1,
  int reserved = 0,
  double x = 1.5,
  double y = -2,
  double z = 3.25,
  double far = 500,
  int? lightType,
}) {
  final v4 = _frameV4();
  final out = Uint8List(v4.length + 24);
  out.setAll(0, v4.sublist(0, 60));
  out.setAll(84, v4.sublist(60));
  setU32(out, 60, flag);
  setU32(out, 64, reserved);
  setF32(out, 68, x);
  setF32(out, 72, y);
  setF32(out, 76, z);
  setF32(out, 80, far);
  out.setAll(84, v4.sublist(60));
  // A point shadow light needs nonzero shadow map dimensions (v5 offsets:
  // width 84, height 88 after the inserted tail) — set them AFTER the
  // v4 tail copy, which would otherwise overwrite them with zeros.
  setU32(out, 84, 512);
  setU32(out, 88, 512);
  setU32(out, v4.length + 20, lightType ?? (flag == 1 ? 3 : 0));
  return out;
}

Uint8List _frameV6Target({
  int targetId = 2,
  int width = 640,
  int height = 360,
  int flags = 15,
}) {
  final v5 = _frameV5Point(flag: 0, x: 0, y: 0, z: 0, far: 0, lightType: 0);
  final out = Uint8List(v5.length + 72);
  out.setAll(0, v5);
  var offset = v5.length;
  offset += 12; // empty culled lists + automatic shadow revision marker
  setU32(out, offset, 0x4658534a);
  setU32(out, offset + 4, 1);
  setU32(out, offset + 8, targetId);
  setU32(out, offset + 12, width);
  setU32(out, offset + 16, height);
  final rectangles = targetId == 0
      ? [0.0, 0.0, 320.0, 360.0, 0.0, 0.0, 320.0, 360.0]
      : [
          0.0,
          0.0,
          width.toDouble(),
          height.toDouble(),
          0.0,
          0.0,
          width.toDouble(),
          height.toDouble(),
        ];
  for (var index = 0; index < rectangles.length; index++) {
    setF32(out, offset + 20 + index * 4, rectangles[index]);
  }
  setU32(out, offset + 52, flags);
  setU32(out, offset + 56, 0);
  return out;
}

void _bad(void Function() action) {
  expect(action, throwsA(isA<JsThreeProtocolException>()));
}

void main() {
  test('decodes the R1 v4 frame tone mapping + FogExp2 tail', () {
    final decoded = _decoder.decodeR1(_r1([(8, _frameV4())], version: 4));
    final frame = decoded.commands.whereType<JsThreeSubmitFrame>().single;
    expect(frame.toneMapping, JsThreeToneMapping.acesFilmic);
    expect(frame.exposure, 2.5);
    expect(frame.toneMappingExposure, 2.5);
    expect(frame.fogMode, JsThreeFogMode.exp2);
    expect(frame.fogDensity, closeTo(0.0025, 1e-9));
    // The rest of the frame still decodes identically to v3.
    expect(frame.sceneId, 7);
    expect(frame.fogNear, 50);
    expect(frame.fogFar, 75);
    expect(frame.shadowContentRevision, isNull);
  });

  test('v3 streams still decode with v4-default tone/fog fields', () {
    final decoded = _decoder.decodeR1(
      _r1([
        (8, _frame(shadowLightType: 1, shadowWidth: 1024, shadowHeight: 1024)),
      ], version: 3),
    );
    final frame = decoded.commands.whereType<JsThreeSubmitFrame>().single;
    expect(frame.toneMapping, JsThreeToneMapping.none);
    // v3 streams carry exposure through; tone mapping stays none.
    expect(frame.toneMappingExposure, 1.25);
    expect(frame.fogDensity, 0);
    expect(frame.shadowLightType, 1);
    _bad(
      () => _decoder.decodeR1(
        _r1([(8, _frameVariant(_frameV4(), 28, 2))], version: 3),
      ),
    );
  });

  test('validates the R1 v4 tone/fog tail ranges', () {
    _bad(
      () => _decoder.decodeR1(
        _r1([(8, _frameVariant(_frameV4(), 56, -1))], version: 4),
      ),
    );
    _bad(
      () => _decoder.decodeR1(
        // linear fog (mode 1) with a nonzero density
        _r1([
          (8, _frameVariant(_frameVariant(_frameV4(), 28, 1), 56, 0.5)),
        ], version: 4),
      ),
    );
    _bad(
      () => _decoder.decodeR1(
        _r1([(8, _frameVariant(_frameV4(), 52, 99))], version: 4),
      ),
    );
  });

  test('decodes the R1 v5 point-shadow frame tail', () {
    final decoded = _decoder.decodeR1(_r1([(8, _frameV5Point())], version: 5));
    final frame = decoded.commands.whereType<JsThreeSubmitFrame>().single;
    expect(frame.hasPointShadow, 1);
    expect(frame.pointShadowLightX, 1.5);
    expect(frame.pointShadowLightY, -2);
    expect(frame.pointShadowLightZ, 3.25);
    expect(frame.pointShadowFar, 500);
    expect(frame.shadowLightType, JsThreeShadowLightType.point.wireValue);
    expect(frame.hasShadow, isTrue);
    // The v4 tone/fog tail still decodes in front of it.
    expect(frame.toneMapping, JsThreeToneMapping.acesFilmic);
    expect(frame.fogMode, JsThreeFogMode.exp2);
  });

  test('v4 streams decode with v5-default (inactive) point-shadow fields', () {
    final decoded = _decoder.decodeR1(_r1([(8, _frameV4())], version: 4));
    final frame = decoded.commands.whereType<JsThreeSubmitFrame>().single;
    expect(frame.hasPointShadow, 0);
    expect(frame.pointShadowLightX, 0);
    expect(frame.pointShadowFar, 0);
  });

  test('inactive v5 point-shadow tail requires zeroed fields', () {
    // flag 0 with a light position set.
    _bad(
      () => _decoder.decodeR1(
        _r1([(8, _frameV5Point(flag: 0, x: 1, lightType: 0))], version: 5),
      ),
    );
  });

  test('validates the R1 v5 point-shadow tail ranges', () {
    // flag must be 0 or 1.
    _bad(
      () => _decoder.decodeR1(_r1([(8, _frameV5Point(flag: 2))], version: 5)),
    );
    // reserved field must stay zero.
    _bad(
      () =>
          _decoder.decodeR1(_r1([(8, _frameV5Point(reserved: 1))], version: 5)),
    );
    // active shadow needs a positive far plane.
    _bad(
      () => _decoder.decodeR1(_r1([(8, _frameV5Point(far: 0))], version: 5)),
    );
    // the point-shadow fields require a point shadow light type.
    _bad(
      () => _decoder.decodeR1(
        _r1([(8, _frameV5Point(lightType: 0))], version: 5),
      ),
    );
    // a point shadow light requires the point-shadow fields.
    _bad(
      () => _decoder.decodeR1(
        _r1([
          (
            8,
            _frameV5Point(
              flag: 0,
              lightType: JsThreeShadowLightType.point.wireValue,
            ),
          ),
        ], version: 5),
      ),
    );
  });

  test('decodes the R1 v4 material texture-slot tail', () {
    final decoded = _decoder.decodeR1(
      _r1([
        (
          3,
          _materialV4(
            mapUv: [0.008, 0, 0, 0, 0.008, 0, 0.5, 0.25, 1],
            alphaMapUv: [2, 0, 0, 0, 2, 0, 0, 0, 1],
          ),
        ),
      ], version: 4),
    );
    final material = decoded.commands.whereType<JsThreeMaterialUpsert>().single;
    expect(material.mapTextureId, 11);
    expect(material.alphaMapTextureId, 12);
    expect(material.hasAlphaMap, isTrue);
    expect(material.envMapTextureId, 13);
    expect(material.hasEnvMap, isTrue);
    expect(material.envMapIntensity, 1.75);
    // Column-major three.js Matrix3 elements round-trip byte-exact.
    expect(material.mapUvMatrix[0], closeTo(0.008, 1e-7));
    expect(material.mapUvMatrix[4], closeTo(0.008, 1e-7));
    expect(material.mapUvMatrix[6], 0.5);
    expect(material.mapUvMatrix[7], 0.25);
    expect(material.alphaMapUvMatrix[0], 2);
    // v3 materials decode with the identity/default slot tail.
    final legacy = _decoder
        .decodeR1(_r1([(3, _material())]))
        .commands
        .whereType<JsThreeMaterialUpsert>()
        .single;
    expect(legacy.alphaMapTextureId, 0);
    expect(legacy.hasAlphaMap, isFalse);
    expect(legacy.envMapTextureId, 0);
    expect(legacy.envMapIntensity, 1);
    expect(legacy.mapUvMatrix, everyElement(isNotNull));
    expect(legacy.mapUvMatrix[0], 1);
    expect(legacy.mapUvMatrix[1], 0);
    // Negative envMapIntensity is rejected.
    _bad(
      () =>
          _decoder.decodeR1(_r1([(3, _frameVariant(_materialV4(), 72, -0.5))])),
    );
  });

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
    'R1 v2 adds strict HemisphereLight payloads without invalidating v1',
    () {
      final legacy = _decoder.decodeR1(_r1([(7, _light())]));
      expect(legacy.version, 1);
      final legacyLight = legacy.commands.single as JsThreeLightUpsert;
      expect(legacyLight.type, JsThreeLightType.point);
      expect(legacyLight.groundColorR, 0);
      expect(legacyLight.groundColorG, 0);
      expect(legacyLight.groundColorB, 0);

      final legacyInV2 = _decoder.decodeR1(_r1([(7, _light())], version: 2));
      expect(legacyInV2.version, 2);
      expect(legacyInV2.commands.single, isA<JsThreeLightUpsert>());

      final body = _light(type: JsThreeLightType.hemisphere);
      final decoded = _decoder.decodeR1(_r1([(7, body)], version: 2));
      final light = decoded.commands.single as JsThreeLightUpsert;
      expect(decoded.version, 2);
      expect(light.type, JsThreeLightType.hemisphere);
      expect(light.type, isNot(JsThreeLightType.ambient));
      expect(light.colorR, closeTo(0.1, 1e-6));
      expect(light.colorG, closeTo(0.2, 1e-6));
      expect(light.colorB, closeTo(0.3, 1e-6));
      expect(light.intensity, 2);
      expect(light.worldPosition, hasLength(3));
      expect(light.worldDirection, hasLength(3));
      expect(light.groundColorR, 0.75);
      expect(light.groundColorG, 0.5);
      expect(light.groundColorB, 0.25);

      _bad(() => _decoder.decodeR1(_r1([(7, body)])));
      _bad(
        () => _decoder.decodeR1(
          _r1([(7, Uint8List.sublistView(body, 0, 60))], version: 2),
        ),
      );
      _bad(
        () => _decoder.decodeR1(
          _r1([
            (7, Uint8List.fromList([...body, 0])),
          ], version: 2),
        ),
      );
      final reserved = Uint8List.fromList(body);
      setU32(reserved, 60, 1);
      _bad(() => _decoder.decodeR1(_r1([(7, reserved)], version: 2)));
      final legacyExtended = Uint8List.fromList([
        ..._light(),
        ...Uint8List(16),
      ]);
      _bad(() => _decoder.decodeR1(_r1([(7, legacyExtended)], version: 2)));
      for (final offset in [48, 52, 56]) {
        for (final value in [double.nan, double.infinity]) {
          final invalid = Uint8List.fromList(body);
          setF32(invalid, offset, value);
          _bad(() => _decoder.decodeR1(_r1([(7, invalid)], version: 2)));
        }
      }
    },
  );

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

  test('decodes the ShadowMaterial kind with its color/opacity payload', () {
    final commands = _decoder
        .decodeR1(_r1([(3, _material(kind: JsThreeMaterialKind.shadow))]))
        .commands;
    final material = commands[0] as JsThreeMaterialUpsert;
    expect(material.kind, JsThreeMaterialKind.shadow);
    expect(material.transparent, isTrue);
    expect(material.opacity, closeTo(0.8, 1e-6));
  });

  test('decodes THREE blending from material flags bits 7..9', () {
    for (final mode in [0, 1, 2, 3, 4]) {
      final body = _material();
      setU32(body, 16, mode << 7);
      final commands = _decoder.decodeR1(_r1([(3, body)])).commands;
      final material = commands[0] as JsThreeMaterialUpsert;
      expect(material.blending, mode, reason: 'blending mode $mode');
    }
  });

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
            (1, _geometry(mask: 1, wireIndices: const [0, 1, 1, 2, 2, 0])),
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
              _material(kind: JsThreeMaterialKind.meshNormal, wireframe: true),
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
        _decoder.decodeR1(_r1([(3, _material())])).commands.single
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
          _r1([(3, Uint8List.sublistView(truncated, 0, truncated.length - 1))]),
        ),
      );
      final negative = _material(kind: kind, emissive: true);
      setF32(negative, negative.length - 4, -0.01);
      _bad(() => _decoder.decodeR1(_r1([(3, negative)])));
      final nonFinite = _material(kind: kind, emissive: true);
      setF32(nonFinite, nonFinite.length - 16, double.nan);
      _bad(() => _decoder.decodeR1(_r1([(3, nonFinite)])));
    }
  });

  test('rejects malformed Phong and wireframe extensions', () {
    final phong = _material(kind: JsThreeMaterialKind.meshPhong);
    _bad(
      () => _decoder.decodeR1(_r1([(3, Uint8List.sublistView(phong, 0, 56))])),
    );
    setF32(phong, 68, -1);
    _bad(() => _decoder.decodeR1(_r1([(3, phong)])));
    _bad(
      () => _decoder.decodeR1(
        _r1([
          (3, _material(kind: JsThreeMaterialKind.lineBasic, wireframe: true)),
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
    setU32(quota, quota.length - 4, JsThreeProtocolDecoder.maxIndexCount + 1);
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
    setF32(noRadius, 68, 0);
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
    setU32(node, 88, 4);
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
    expect(empty.hasInstanceColors, isFalse);
    expect(empty.instanceColors, isEmpty);
  });

  test('decodes per-instance colors behind flag bit 2', () {
    final commands = _decoder
        .decodeR1(
          _r1([
            (
              11,
              _drawBatch(
                instanceCount: 2,
                flags: 3,
                matrices: List<double>.filled(32, 0.5),
                colors: const [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
              ),
            ),
          ]),
        )
        .commands;
    final batch = commands.single as JsThreeDrawBatchUpsert;
    expect(batch.instanced, isTrue);
    expect(batch.hasInstanceColors, isTrue);
    final expected = const [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
    for (var index = 0; index < expected.length; index++) {
      expect(batch.instanceColors[index], closeTo(expected[index], 1e-6));
    }
    expect(() => batch.instanceColors[0] = 0, throwsUnsupportedError);
  });

  // Back-compat pin: the color flag is a DRAW_BATCH body field, not a
  // versioned tail — every stream version v3..v5 decodes the same payload,
  // and older-looking streams without the flag stay color-neutral (the
  // material color wins, byte-identical goldens depend on it).
  test(
    'instance colors decode identically on v3/v4/v5 and stay neutral without the flag',
    () {
      List<double> colorsAt(int version) {
        final commands = _decoder
            .decodeR1(
              _r1([
                (
                  11,
                  _drawBatch(
                    instanceCount: 2,
                    flags: 3,
                    matrices: List<double>.filled(32, 0.5),
                    colors: const [0.75, 0.5, 0.25, 0.125, 0.1, 0.2],
                  ),
                ),
              ], version: version),
            )
            .commands;
        final batch = commands.single as JsThreeDrawBatchUpsert;
        return batch.instanceColors.toList();
      }

      const expected = [0.75, 0.5, 0.25, 0.125, 0.1, 0.2];
      for (final version in [3, 4, 5]) {
        final colors = colorsAt(version);
        for (var index = 0; index < expected.length; index++) {
          expect(
            colors[index],
            closeTo(expected[index], 1e-6),
            reason: 'v$version',
          );
        }
      }

      for (final version in [3, 4, 5]) {
        final neutral =
            _decoder
                    .decodeR1(
                      _r1([
                        (11, _drawBatch(instanceCount: 2, flags: 1)),
                      ], version: version),
                    )
                    .commands
                    .single
                as JsThreeDrawBatchUpsert;
        expect(neutral.instanced, isTrue, reason: 'v$version');
        expect(neutral.hasInstanceColors, isFalse, reason: 'v$version');
        expect(neutral.instanceColors, isEmpty, reason: 'v$version');
      }
    },
  );

  test('DRAW_BATCH and REMOVE_BATCH reject malformed bounded bodies', () {
    final mutations = <void Function(Uint8List)>[
      (body) => setU32(body, 0, 0),
      (body) => setU32(body, 4, 0),
      (body) => setU32(body, 8, 0),
      (body) => setU32(body, 8, 2),
      (body) => setU32(body, 12, 2),
      (body) => setU32(body, 16, 0),
      (body) => setU32(body, 16, 65537),
      (body) => setU32(body, 20, 0),
      (body) => setU32(body, 24, 0),
      (body) => setU32(body, 32, 0),
      (body) {
        setU32(body, 28, 0xffffffff);
        setU32(body, 32, 2);
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
    _bad(() => _decoder.decodeR1(_r1([(11, _drawBatch(flags: 4))])));
    _bad(() => _decoder.decodeR1(_r1([(11, _drawBatch(flags: 2))])));
    _bad(
      () => _decoder.decodeR1(
        _r1([(11, _drawBatch(instanceCount: 2, flags: 3, colors: const []))]),
      ),
    );
    _bad(
      () => _decoder.decodeR1(
        _r1([
          (
            11,
            _drawBatch(
              instanceCount: 2,
              flags: 3,
              colors: const [0.1, 0.2, double.nan],
            ),
          ),
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
        (b) => setU16(b, 6, 32),
        (b) => setU32(b, 8, 0),
        (b) => setU32(b, 12, 1),
        (b) => setU16(b, 16, 0),
        (b) => setU16(b, 16, 129),
        (b) => setU16(b, 18, 0),
        (b) => setU16(b, 18, 129),
        (b) => setU32(b, 20, 1),
        (b) => setU32(b, 24, 0),
        (b) => setU32(b, 28, 1),
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
      setU32(overflow, 12, 0xffffffff);
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
      _bad(() => _decoder.decodeR1(_r1(const [], version: 0)));
      _bad(() => _decoder.decodeR1(_r1(const [], version: 9)));
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
      setU16(commandCases[2], 14, 1);
      setU32(commandCases[3], 16, 0xffffffff);
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
        (b) => setU32(b, 0, 0),
        (b) => setU32(b, 4, 0),
        (b) => setU32(b, 8, 0),
        (b) => setU32(b, 8, 16),
        (b) => setU32(b, 12, 0),
        (b) => setU32(b, 12, 4000001),
        (b) => setU32(b, 16, 12000001),
        (b) => setU32(b, 16, 2),
        (b) => setU32(b, 20, 3),
        (b) => setU32(b, 24, 1),
        (b) => setU32(b, 28, 12),
        (b) => setU32(b, 68, 12),
        (b) => setU32(b, 108, 12),
        (b) => setU32(b, 136, 12),
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
        (b) => setU32(b, 0, 0),
        (b) => setU32(b, 4, 0),
        (b) => setU32(b, 8, 0),
        (b) => setU32(b, 12, 0),
        (b) => setU32(b, 16, 3),
        (b) => setU32(b, 20, 128),
        (b) => setU32(b, 24, 3),
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
        setU32(excessive, 24, 64 * 1024 * 1024 + 1);
        _bad(() => _decoder.decodeR1(_r1([(2, excessive)])));
      }
      final overflow = _texture();
      setU32(overflow, 8, 0x3fffffff);
      setU32(overflow, 12, 0x3fffffff);
      _bad(() => _decoder.decodeR1(_r1([(2, overflow)])));
    },
  );

  test('round-trips the 128-byte emissive-plus-Dubois v6 material layout', () {
    final decoded = _decoder.decodeR1(
      _r1([(3, _materialV6(emissive: true))], version: 6),
    );
    final material = decoded.commands.whereType<JsThreeMaterialUpsert>().single;
    expect(material.emissiveR, closeTo(0.125, 1e-6));
    expect(material.emissiveG, closeTo(0.25, 1e-6));
    expect(material.emissiveB, closeTo(0.5, 1e-6));
    expect(material.emissiveIntensity, 2);
    expect(material.mapRightTextureId, 0);
    expect(material.duboisLeftMatrix.every((value) => value == 0), isTrue);
  });

  test('decodes the bounded v6 Dubois anaglyph material', () {
    final decoded = _decoder.decodeR1(
      _r1([
        (3, _materialV6(kind: JsThreeMaterialKind.anaglyph, anaglyph: true)),
      ], version: 6),
    );
    final material = decoded.commands.whereType<JsThreeMaterialUpsert>().single;
    expect(material.kind, JsThreeMaterialKind.anaglyph);
    expect(material.mapTextureId, 2);
    expect(material.mapRightTextureId, 9);
    expect(material.duboisLeftMatrix[0], closeTo(0.1, 1e-6));
    expect(material.duboisLeftMatrix[1], closeTo(0.2, 1e-6));
    expect(material.duboisLeftMatrix[2], closeTo(0.3, 1e-6));
    expect(material.duboisLeftMatrix[3], 0);
    expect(material.duboisRightMatrix[0], 1);
    expect(material.duboisRightMatrix[1], closeTo(1.1, 1e-6));
    expect(material.duboisRightMatrix[2], closeTo(1.2, 1e-6));
    expect(material.duboisRightMatrix[3], 0);
  });

  test('decodes target upserts and per-pass target rectangles on v6', () {
    final decoded = _decoder.decodeR1(
      _r1([
        (14, _renderTarget(flags: 256 | 1 | 2)),
        (8, _frameV6Target()),
      ], version: 6),
    );
    final target = decoded.commands
        .whereType<JsThreeRenderTargetUpsert>()
        .single;
    expect(target.targetId, 2);
    expect(target.textureId, 2);
    expect((target.width, target.height), (640, 360));
    expect(target.hasDepth, isTrue);
    expect(target.nearestMag && target.nearestMin, isTrue);
    final frame = decoded.commands.whereType<JsThreeSubmitFrame>().single;
    expect(frame.renderTargetId, 2);
    expect((frame.targetWidth, frame.targetHeight), (640, 360));
    expect(
      [
        frame.viewportX,
        frame.viewportY,
        frame.viewportWidth,
        frame.viewportHeight,
      ],
      [0.0, 0.0, 640.0, 360.0],
    );
    expect(frame.clearColor && frame.clearDepth, isTrue);
    expect(frame.scissorTest && frame.hasViewport, isTrue);
  });

  test('v5 frames retain legacy target and viewport defaults', () {
    final decoded = _decoder.decodeR1(
      _r1([
        (8, _frameV5Point(flag: 0, x: 0, y: 0, z: 0, far: 0, lightType: 0)),
      ], version: 5),
    );
    final frame = decoded.commands.whereType<JsThreeSubmitFrame>().single;
    expect(frame.renderTargetId, 0);
    expect(frame.hasViewport, isFalse);
    expect(frame.scissorTest, isFalse);
    expect(frame.clearColor && frame.clearDepth, isTrue);
  });

  test('rejects malformed target and frame-target extensions', () {
    _bad(() => _decoder.decodeR1(_r1([(14, _renderTarget())], version: 5)));
    for (final body in [
      _renderTarget(width: 0),
      _renderTarget(flags: 16),
      _renderTarget(flags: 0x80000000),
    ]) {
      _bad(() => _decoder.decodeR1(_r1([(14, body)], version: 6)));
    }
    final reservedTarget = _renderTarget();
    setU32(reservedTarget, 24, 1);
    _bad(() => _decoder.decodeR1(_r1([(14, reservedTarget)], version: 6)));
    final badMagic = _frameV6Target();
    setU32(badMagic, 184, 0);
    _bad(() => _decoder.decodeR1(_r1([(8, badMagic)], version: 6)));
    final badRect = _frameV6Target();
    setF32(badRect, 204, -1);
    _bad(() => _decoder.decodeR1(_r1([(8, badRect)], version: 6)));
    final badFlags = _frameV6Target(flags: 7);
    _bad(() => _decoder.decodeR1(_r1([(8, badFlags)], version: 6)));
    final reservedFrame = _frameV6Target();
    setU32(reservedFrame, 240, 1);
    _bad(() => _decoder.decodeR1(_r1([(8, reservedFrame)], version: 6)));
    _bad(() => _decoder.decodeR1(_r1([(8, _frameV6Target())], version: 5)));
  });

  test(
    'scalar bodies reject unknown kinds, flags, zero IDs, and invalid ranges',
    () {
      final cases = <(int, Uint8List, int, int)>[
        (3, _material(), 0, 0),
        (3, _material(), 4, 0),
        (3, _material(), 8, 13), // 13 is invalid; 12 is the v7 meshDepth kind
        (
          3,
          _material(),
          16,
          1024,
        ), // bits 7..9 are THREE blending; bit 10 stays invalid
        (3, _material(), 20, 3),
        (3, _material(), 52, 0),
        (4, _node(), 0, 0),
        (4, _node(), 16, 2),
        (4, _node(), 20, 5),
        (6, _camera(), 0, 0),
        (6, _camera(), 4, 2),
        (7, _light(), 0, 0),
        (7, _light(), 4, 4),
        (8, _frame(), 0, 0),
        (8, _frame(), 4, 0),
        (9, _disposal(), 0, 0),
        (9, _disposal(), 4, 0),
        (9, _disposal(), 4, 8),
      ];
      for (final (opcode, original, offset, value) in cases) {
        final body = Uint8List.fromList(original);
        setU32(body, offset, value);
        _bad(() => _decoder.decodeR1(_r1([(opcode, body)])));
      }
      _bad(() => _decoder.decodeR1(_r1([(5, _u32Body(0))])));
      for (final offset in [36, 40, 44, 48]) {
        for (final value in [-0.01, 1.01]) {
          final body = _material();
          setF32(body, offset, value);
          _bad(() => _decoder.decodeR1(_r1([(3, body)])));
        }
      }
      for (final value in [0.0, -1.0]) {
        final material = _material();
        setF32(material, 52, value);
        _bad(() => _decoder.decodeR1(_r1([(3, material)])));
        final frame = _frame();
        setF32(frame, 24, value);
        _bad(() => _decoder.decodeR1(_r1([(8, frame)])));
      }
      final light = _light();
      setF32(light, 20, -0.01);
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
          setF32(body, offset, value);
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
      setF32(invalid, offset, double.nan);
      _bad(() => _decoder.decodeR1(_r1([(1, invalid)])));
    }
  });

  group('R1 v3', () {
    Uint8List spotLight({
      double angle = 0.6283,
      double penumbra = 0.2,
      double distance = 0,
      double decay = 0,
    }) {
      final out = Uint8List(64);
      setU32(out, 0, 4);
      setU32(out, 4, JsThreeLightType.spot.wireValue);
      setF32(out, 8, 0.1);
      setF32(out, 12, 0.2);
      setF32(out, 16, 0.3);
      setF32(out, 20, 60);
      for (var i = 0; i < 6; i++) {
        setF32(out, 24 + i * 4, i - 0.5);
      }
      setF32(out, 48, angle);
      setF32(out, 52, penumbra);
      setF32(out, 56, distance);
      setF32(out, 60, decay);
      return out;
    }

    Uint8List clippedMaterial({int clipId = 11, int clipFlags = 2}) {
      final out = Uint8List(80);
      setU32(out, 0, 3);
      setU32(out, 4, 1);
      setU32(out, 8, JsThreeMaterialKind.meshPhong.wireValue);
      setU32(out, 20, 2);
      setF32(out, 24, 0.25);
      setF32(out, 28, 0.5);
      setF32(out, 32, 0.75);
      setF32(out, 36, 1);
      setF32(out, 40, 0.5);
      setF32(out, 44, 0.5);
      setF32(out, 48, 0);
      setF32(out, 52, 1);
      setU32(out, 56, clipId);
      setU32(out, 60, clipFlags);
      setF32(out, 64, 0.9);
      setF32(out, 68, 0.8);
      setF32(out, 72, 0.7);
      setF32(out, 76, 100);
      return out;
    }

    Uint8List clipping({int id = 11, int version = 1, int count = 1}) {
      final planes = <double>[
        for (var index = 0; index < count; index++) ...[0, -1, 0, 0.8 - index],
      ];
      final out = Uint8List(12 + planes.length * 4);
      setU32(out, 0, id);
      setU32(out, 4, version);
      setU32(out, 8, count);
      for (var index = 0; index < planes.length; index++) {
        setF32(out, 12 + index * 4, planes[index]);
      }
      return out;
    }

    test('spot light decodes cone parameters and validates ranges', () {
      final stream = _decoder.decodeR1(_r1([(7, spotLight())], version: 3));
      final light = stream.commands.single as JsThreeLightUpsert;
      expect(light.type, JsThreeLightType.spot);
      expect(light.intensity, 60);
      expect(light.spotAngle, closeTo(0.6283, 0.0001));
      expect(light.spotPenumbra, closeTo(0.2, 0.0001));
      expect(light.spotDistance, 0);
      expect(light.spotDecay, 0);
      expect(light.groundColorR, 0);

      _bad(() => _decoder.decodeR1(_r1([(7, spotLight())], version: 2)));
      _bad(
        () => _decoder.decodeR1(_r1([(7, spotLight(angle: 0))], version: 3)),
      );
      _bad(
        () =>
            _decoder.decodeR1(_r1([(7, spotLight(angle: 3.1416))], version: 3)),
      );
      _bad(
        () =>
            _decoder.decodeR1(_r1([(7, spotLight(penumbra: 8.5))], version: 3)),
      );
      // Upstream tweens penumbra above 1 (webgl_lights_spotlights); the
      // accepted band is [0, 8].
      final overOne = _decoder
          .decodeR1(_r1([(7, spotLight(penumbra: 1.5))], version: 3))
          .commands;
      final overOneLight = overOne.whereType<JsThreeLightUpsert>().single;
      expect(overOneLight.spotPenumbra, 1.5);
      _bad(
        () =>
            _decoder.decodeR1(_r1([(7, spotLight(distance: -1))], version: 3)),
      );
    });

    test('materials carry clip id and flags', () {
      final stream = _decoder.decodeR1(
        _r1([(3, clippedMaterial())], version: 3),
      );
      final material = stream.commands.single as JsThreeMaterialUpsert;
      expect(material.clipId, 11);
      expect(material.hasClipping, isTrue);
      expect(material.clipShadows, isTrue);
      expect(material.clipIntersection, isFalse);
      expect(material.shininess, 100);

      final badFlags = Uint8List.fromList(clippedMaterial(clipFlags: 4));
      _bad(() => _decoder.decodeR1(_r1([(3, badFlags)], version: 3)));
    });

    test('clipping command decodes normalized planes and bounds counts', () {
      final stream = _decoder.decodeR1(
        _r1([(13, clipping(count: 2))], version: 3),
      );
      final command = stream.commands.single as JsThreeClippingUpsert;
      expect(command.clipId, 11);
      expect(command.planeCount, 2);
      expect(command.planes[1], closeTo(-1, 0.0001));
      expect(command.planes[7], closeTo(-0.2, 0.0001));

      _bad(() => _decoder.decodeR1(_r1([(13, clipping())], version: 2)));
      _bad(
        () => _decoder.decodeR1(_r1([(13, clipping(count: 17))], version: 3)),
      );
      final zeroNormal = clipping();
      setF32(zeroNormal, 12, 0);
      setF32(zeroNormal, 16, 0);
      _bad(() => _decoder.decodeR1(_r1([(13, zeroNormal)], version: 3)));
    });

    test('frame names its shadow light owner and rejects mismatches', () {
      final stream = _decoder.decodeR1(
        _r1([
          (
            8,
            _frame(
              shadowWidth: 1024,
              shadowHeight: 1024,
              shadowLightType: 2,
              culledNodeIds: [4],
            ),
          ),
        ], version: 3),
      );
      final frame = stream.commands.single as JsThreeSubmitFrame;
      expect(frame.hasSpotShadow, isTrue);
      expect(frame.culledNodeIds, [4]);

      _bad(
        () => _decoder.decodeR1(
          _r1([
            (
              8,
              _frame(shadowWidth: 1024, shadowHeight: 1024, shadowLightType: 3),
            ),
          ], version: 3),
        ),
      );
      _bad(
        () => _decoder.decodeR1(
          _r1([(8, _frame(shadowLightType: 1))], version: 3),
        ),
      );
    });
  });

  group('R1 v8', () {
    Uint8List _stencilClear({int nodeId = 0, int value = 0}) {
      final out = Uint8List(8);
      setU32(out, 0, nodeId);
      setU32(out, 4, value);
      return out;
    }

    test('decodes the material stencil tail and the colorWrite flag', () {
      final decoded = _decoder.decodeR1(
        _r1([(3, _materialV8(stencil: true))], version: 8),
      );
      final material = decoded.commands.whereType<JsThreeMaterialUpsert>().single;
      expect(material.flags & 0x800, 0x800);
      expect(material.hasStencil, isTrue);
      expect(material.colorWrite, isTrue);
      expect(material.stencilWrite, isTrue);
      expect(material.stencilFunc, JsThreeStencilFunc.notEqual);
      expect(material.stencilRef, 3);
      expect(material.stencilFuncMask, 15);
      expect(material.stencilWriteMask, 240);
      expect(material.stencilFailOp, JsThreeStencilOp.keep);
      expect(material.stencilZFailOp, JsThreeStencilOp.replace);
      expect(material.stencilZPassOp, JsThreeStencilOp.incrementWrap);
    });

    test('colorWrite-off flag decodes without a stencil tail', () {
      final decoded = _decoder.decodeR1(
        _r1([(3, _materialV8(colorWriteOff: true))], version: 8),
      );
      final material = decoded.commands.whereType<JsThreeMaterialUpsert>().single;
      expect(material.colorWrite, isFalse);
      expect(material.hasStencil, isFalse);
      expect(material.stencilWrite, isFalse);
      expect(material.stencilFunc, JsThreeStencilFunc.always);
      expect(material.stencilRef, 0);
      expect(material.stencilFuncMask, 255);
      expect(material.stencilWriteMask, 255);
      expect(material.stencilFailOp, JsThreeStencilOp.keep);
      expect(material.stencilZFailOp, JsThreeStencilOp.keep);
      expect(material.stencilZPassOp, JsThreeStencilOp.keep);
    });

    test('stenciless v8 materials decode like v7 (byte-identical defaults)', () {
      final v7 = _decoder
          .decodeR1(_r1([(3, _materialV6())], version: 7))
          .commands
          .whereType<JsThreeMaterialUpsert>()
          .single;
      final v8 = _decoder
          .decodeR1(_r1([(3, _materialV8())], version: 8))
          .commands
          .whereType<JsThreeMaterialUpsert>()
          .single;
      expect(v8.flags, v7.flags);
      expect(v8.colorWrite, isTrue);
      expect(v8.hasStencil, isFalse);
      expect(v8.stencilWrite, v7.stencilWrite);
      expect(v8.stencilFunc, v7.stencilFunc);
      expect(v8.stencilRef, v7.stencilRef);
      expect(v8.stencilFuncMask, v7.stencilFuncMask);
      expect(v8.stencilWriteMask, v7.stencilWriteMask);
      expect(v8.stencilFailOp, v7.stencilFailOp);
      expect(v8.stencilZFailOp, v7.stencilZFailOp);
      expect(v8.stencilZPassOp, v7.stencilZPassOp);
      // bits 10/11 stay invalid below v8.
      _bad(
        () => _decoder.decodeR1(
          _r1([(3, _materialV8(colorWriteOff: true))], version: 7),
        ),
      );
      _bad(
        () => _decoder.decodeR1(
          _r1([(3, _materialV8(stencil: true))], version: 7),
        ),
      );
    });

    test('validates the stencil tail: presence, enums, and 8-bit ranges', () {
      // Flag bit 11 without the 32-byte tail.
      final flaggedNoTail = _materialV8();
      setU32(flaggedNoTail, 16, 31 | 0x800);
      _bad(() => _decoder.decodeR1(_r1([(3, flaggedNoTail)], version: 8)));
      // Tail without flag bit 11 (emissive range check rejects the bytes).
      final tailless = _materialV8(stencil: true);
      setU32(tailless, 16, 31);
      _bad(() => _decoder.decodeR1(_r1([(3, tailless)], version: 8)));
      for (final (offset, value) in [
        (4, 0x0208), // unknown stencil func
        (4, 0x0000), // 0 is GL_NEVER-adjacent junk, not in the GL table
        (8, 256), // reference outside the 8-bit attachment
        (12, 256), // func mask outside the 8-bit attachment
        (16, 256), // write mask outside the 8-bit attachment
        (20, 0x0001), // unknown fail op
        (24, 0x150b), // unknown zfail op
        (28, 0x8509), // unknown zpass op
        (0, 2), // stencil write must be 0 or 1
      ]) {
        final body = _materialV8(stencil: true);
        final tail = body.length - 32;
        setU32(body, tail + offset, value);
        _bad(() => _decoder.decodeR1(_r1([(3, body)], version: 8)));
      }
    });

    test('decodes STENCIL_CLEAR markers and their stream order', () {
      final decoded = _decoder.decodeR1(
        _r1([
          (15, _stencilClear(nodeId: 7, value: 2)),
          (15, _stencilClear()),
          (15, _stencilClear(nodeId: 9, value: 255)),
        ], version: 8),
      );
      final clears = decoded.commands.whereType<JsThreeStencilClear>().toList();
      expect(clears, hasLength(3));
      expect(clears[0].nodeId, 7);
      expect(clears[0].value, 2);
      // nodeId 0 is meaningful ("at this stream position").
      expect(clears[1].nodeId, 0);
      expect(clears[1].value, 0);
      expect(clears[2].nodeId, 9);
      expect(clears[2].value, 255);
    });

    test('STENCIL_CLEAR requires v8, a short body, and an 8-bit value', () {
      _bad(
        () => _decoder.decodeR1(
          _r1([(15, _stencilClear(value: 1))], version: 7),
        ),
      );
      _bad(
        () => _decoder.decodeR1(
          _r1([(15, _stencilClear(value: 256))], version: 8),
        ),
      );
      _bad(
        () => _decoder.decodeR1(
          _r1([(15, Uint8List(4))], version: 8),
        ),
      );
      _bad(
        () => _decoder.decodeR1(
          _r1([(15, Uint8List(9))], version: 8),
        ),
      );
    });

    test('frame-target flag bit 0x10 decodes the frame-start stencil clear', () {
      final cleared = _decoder
          .decodeR1(_r1([(8, _frameV6Target(flags: 0x1f))], version: 8))
          .commands
          .whereType<JsThreeSubmitFrame>()
          .single;
      expect(cleared.frameStartClearStencil, isTrue);
      final persisting = _decoder
          .decodeR1(_r1([(8, _frameV6Target(flags: 0x0f))], version: 8))
          .commands
          .whereType<JsThreeSubmitFrame>()
          .single;
      expect(persisting.frameStartClearStencil, isFalse);
      // v7 keeps the legacy always-clear default and rejects the new bit.
      final legacy = _decoder
          .decodeR1(_r1([(8, _frameV6Target(flags: 0x0f))], version: 7))
          .commands
          .whereType<JsThreeSubmitFrame>()
          .single;
      expect(legacy.frameStartClearStencil, isTrue);
      _bad(
        () => _decoder.decodeR1(
          _r1([(8, _frameV6Target(flags: 0x1f))], version: 7),
        ),
      );
    });

    test('latestR1Version is 8', () {
      expect(JsThreeProtocolDecoder.latestR1Version, 8);
      expect(
        _decoder.decodeR1(_r1(const [], version: 8)).version,
        8,
      );
    });
  });
}
