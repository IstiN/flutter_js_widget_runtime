import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'three_protocol_bytes.dart';
final threeProtocolDecoder = JsThreeProtocolDecoder();
void _writeFrameHead(
  Uint8List out, {
  required int scene,
  required int camera,
  required double exposure,
  required int fogMode,
  required double fogNear,
  required double fogFar,
}) {
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
}


Uint8List threeCommand(int opcode, Uint8List body) {
  final out = Uint8List(8 + body.length);
  out[0] = opcode;
  setU32(out, 4, body.length);
  out.setAll(8, body);
  return out;
}

Uint8List threeR1(
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
    final command = threeCommand(opcode, body);
    out.setAll(offset, command);
    offset += command.length;
  }
  return out;
}

Uint8List threeT1(
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

Uint8List threeGeometry({
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

Uint8List threeTexture({
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

Uint8List threeMaterial({
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
Uint8List threeFrameV4({
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
  _writeFrameHead(
    out,
    scene: scene,
    camera: camera,
    exposure: exposure,
    fogMode: fogMode,
    fogNear: fogNear,
    fogFar: fogFar,
  );
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
Uint8List threeMaterialV4({
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

Uint8List threeMaterialV6({
  JsThreeMaterialKind kind = JsThreeMaterialKind.meshStandard,
  bool emissive = false,
  bool anaglyph = false,
}) {
  final legacy = threeMaterial(kind: kind);
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
Uint8List threeMaterialV8({
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
  final base = threeMaterialV6();
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

Uint8List threeRenderTarget({
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

Uint8List threeNode({int id = 7}) {
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

Uint8List threeDrawBatch({
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

Uint8List threeCamera({int id = 9}) {
  final out = Uint8List(200);
  setU32(out, 0, id);
  setU32(out, 4, 1);
  for (var i = 0; i < 48; i++) {
    setF32(out, 8 + i * 4, i + 0.5);
  }
  return out;
}

Uint8List threeLight({
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

Uint8List threeFrame({
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
  _writeFrameHead(
    out,
    scene: scene,
    camera: camera,
    exposure: exposure,
    fogMode: fogMode,
    fogNear: fogNear,
    fogFar: fogFar,
  );
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

Uint8List threeU32Body(int value) {
  final out = Uint8List(4);
  setU32(out, 0, value);
  return out;
}

Uint8List threeDisposal({int id = 1, int kind = 1}) {
  final out = Uint8List(8);
  setU32(out, 0, id);
  setU32(out, 4, kind);
  return out;
}

List<(int, Uint8List)> threeAllCommands() => [
  (1, threeGeometry()),
  (2, threeTexture()),
  (3, threeMaterial()),
  (4, threeNode()),
  (5, threeU32Body(7)),
  (6, threeCamera()),
  (7, threeLight()),
  (8, threeFrame()),
  (9, threeDisposal()),
  (10, Uint8List(0)),
  (11, threeDrawBatch()),
  (12, threeU32Body(7)),
];

/// Copy of [body] with the u32/f32 at [offset] overwritten by [value].
Uint8List threeFrameVariant(Uint8List body, int offset, num value) {
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
Uint8List threeFrameV5Point({
  int flag = 1,
  int reserved = 0,
  double x = 1.5,
  double y = -2,
  double z = 3.25,
  double far = 500,
  int? lightType,
}) {
  final v4 = threeFrameV4();
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

Uint8List threeFrameV6Target({
  int targetId = 2,
  int width = 640,
  int height = 360,
  int flags = 15,
}) {
  final v5 = threeFrameV5Point(flag: 0, x: 0, y: 0, z: 0, far: 0, lightType: 0);
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

void threeBad(void Function() action) {
  expect(action, throwsA(isA<JsThreeProtocolException>()));
}
