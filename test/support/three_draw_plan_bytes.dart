// R1 byte builders shared by the draw-plan planner tests: exact little-
// endian command bodies plus the [ThreeDrawPlanFixture] that decodes a
// synthesized R1 stream into a [JsThreeSurfaceState].
import 'dart:convert';
import 'dart:typed_data';

import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';

final class ThreeDrawPlanFixture {
  ThreeDrawPlanFixture(this.commands);

  factory ThreeDrawPlanFixture.basic() => ThreeDrawPlanFixture([
    r1Command(4, r1Node(1, objectKind: JsThreeObjectKind.group)),
    r1Command(6, r1Camera(1)),
    r1Command(8, r1Frame(sceneId: 1, cameraId: 1)),
    r1Command(3, r1Material(1)),
  ]);

  factory ThreeDrawPlanFixture.withCommands(List<Uint8List> commands, {int sequence = 1}) =>
      ThreeDrawPlanFixture(commands)..sequence = sequence;

  final List<Uint8List> commands;
  int sequence = 1;
  int r1Version = 2;

  void geometry(
    int id, {
    int version = 1,
    JsThreePrimitive primitive = JsThreePrimitive.triangles,
    List<double> positions = const [0, 0, 0, 1, 0, 0, 0, 1, 0],
    List<double>? normals,
    List<double>? uvs,
    List<double>? colors,
    List<int> indices = const [],
    List<int>? wireIndices,
  }) {
    commands.add(
      r1Command(
        1,
        r1Geometry(
          id,
          version: version,
          primitive: primitive,
          positions: positions,
          normals: normals,
          uvs: uvs,
          colors: colors,
          indices: indices,
          wireIndices: wireIndices,
        ),
      ),
    );
  }

  void material(
    int id, {
    int version = 1,
    JsThreeMaterialKind kind = JsThreeMaterialKind.meshBasic,
    bool transparent = false,
    bool wireframe = false,
    bool vertexColors = false,
    bool flatShading = false,
    JsThreeSide side = JsThreeSide.front,
    int mapTextureId = 0,
    bool emissive = false,
    List<double> color = const [1, 1, 1],
    double opacity = 1,
    bool depthTest = true,
    bool depthWrite = true,
  }) {
    commands.add(
      r1Command(
        3,
        r1Material(
          id,
          version: version,
          kind: kind,
          transparent: transparent,
          wireframe: wireframe,
          vertexColors: vertexColors,
          flatShading: flatShading,
          side: side,
          mapTextureId: mapTextureId,
          emissive: emissive,
          color: color,
          opacity: opacity,
          depthTest: depthTest,
          depthWrite: depthWrite,
        ),
      ),
    );
  }

  void node(
    int id, {
    int parentId = 0,
    int geometryId = 1,
    int materialId = 1,
    JsThreeObjectKind objectKind = JsThreeObjectKind.mesh,
    bool visible = true,
    double z = 0,
    bool castShadow = false,
    bool receiveShadow = false,
  }) {
    commands.add(
      r1Command(
        4,
        r1Node(
          id,
          parentId: parentId,
          geometryId: objectKind == JsThreeObjectKind.group ? 0 : geometryId,
          materialId: objectKind == JsThreeObjectKind.group ? 0 : materialId,
          objectKind: objectKind,
          visible: visible,
          matrixWorld: _translation(0, 0, z),
          castShadow: castShadow,
          receiveShadow: receiveShadow,
        ),
      ),
    );
  }

  void batch(
    int id, {
    int parentId = 1,
    int version = 1,
    int instanceCount = 1,
    bool instanced = false,
    int geometryId = 0,
    List<(int, int, int, int)> parts = const [(1, 1, 0, 3)],
    List<double>? matrices,
    List<double>? colors,
    double z = 0,
  }) {
    commands.add(
      r1Command(
        4,
        r1Node(
          id,
          parentId: parentId,
          geometryId: geometryId,
          objectKind: JsThreeObjectKind.mesh,
          matrixWorld: _translation(0, 0, z),
        ),
      ),
    );
    commands.add(
      r1Command(
        11,
        r1DrawBatch(
          id,
          version: version,
          instanceCount: instanceCount,
          instanced: instanced,
          parts: parts,
          matrices: matrices,
          colors: colors,
        ),
      ),
    );
  }

  void camera(int id) => commands.add(r1Command(6, r1Camera(id)));

  void light(
    int id,
    JsThreeLightType type, {
    double intensity = 1,
    double red = 1,
    double green = 1,
    double blue = 1,
    double groundRed = 0,
    double groundGreen = 0,
    double groundBlue = 0,
    List<double>? direction,
    double spotAngle = 0.6283,
    double spotPenumbra = 0.2,
    double spotDistance = 12,
    double spotDecay = 2,
  }) {
    commands.add(
      r1Command(
        7,
        r1Light(
          id,
          type,
          intensity: intensity,
          red: red,
          green: green,
          blue: blue,
          groundRed: groundRed,
          groundGreen: groundGreen,
          groundBlue: groundBlue,
          direction: direction,
          spotAngle: spotAngle,
          spotPenumbra: spotPenumbra,
          spotDistance: spotDistance,
          spotDecay: spotDecay,
        ),
      ),
    );
  }

  JsThreeSurfaceState state() {
    final engine = utf8.encode('engine');
    final surface = utf8.encode('surface');
    final payload = r1Envelope(commands, version: r1Version);
    final headerBytes = 32 + engine.length + surface.length;
    final result = Uint8List(headerBytes + payload.length);
    final data = ByteData.sublistView(result);
    result.setRange(0, 4, ascii.encode('JSR3'));
    data.setUint8(4, 1);
    data.setUint8(5, 1);
    data.setUint16(6, headerBytes, Endian.little);
    data.setUint32(8, sequence, Endian.little);
    data.setUint32(12, payload.length, Endian.little);
    data.setUint16(16, engine.length, Endian.little);
    data.setUint16(18, surface.length, Endian.little);
    data.setUint32(24, result.length, Endian.little);
    result.setRange(32, 32 + engine.length, engine);
    result.setRange(32 + engine.length, headerBytes, surface);
    result.setRange(headerBytes, result.length, payload);
    return JsThreeStateStore().apply(result).surface;
  }
}

Uint8List r1Envelope(List<Uint8List> commands, {int version = 2}) {
  final builder = BytesBuilder(copy: false)
    ..add(ascii.encode('JSR1'))
    ..add(_u16(version))
    ..add(_u16(0))
    ..add(_u32(commands.length));
  for (final command in commands) {
    builder.add(command);
  }
  return builder.takeBytes();
}

Uint8List r1Command(int opcode, Uint8List body) =>
    (BytesBuilder(copy: false)
          ..add(Uint8List.fromList([opcode, 0]))
          ..add(_u16(0))
          ..add(_u32(body.length))
          ..add(body))
        .takeBytes();

Uint8List r1Geometry(
  int id, {
  required int version,
  required JsThreePrimitive primitive,
  required List<double> positions,
  required List<double>? normals,
  required List<double>? uvs,
  required List<double>? colors,
  required List<int> indices,
  List<int>? wireIndices,
}) {
  final vertexCount = positions.length ~/ 3;
  final mask =
      1 |
      (normals == null ? 0 : 2) |
      (uvs == null ? 0 : 4) |
      (colors == null ? 0 : 8);
  final builder = R1BodyBuilder()
    ..u32(id)
    ..u32(version)
    ..u32(mask)
    ..u32(vertexCount)
    ..u32(indices.length)
    ..u32(primitive.wireValue)
    ..u32(0)
    ..floats(positions, byteLengthPrefix: true);
  if (normals != null) builder.floats(normals, byteLengthPrefix: true);
  if (uvs != null) builder.floats(uvs, byteLengthPrefix: true);
  if (colors != null) builder.floats(colors, byteLengthPrefix: true);
  for (final index in indices) {
    builder.u32(index);
  }
  if (wireIndices != null) {
    builder.u32(wireIndices.length);
    for (final index in wireIndices) {
      builder.u32(index);
    }
  }
  return builder.bytes;
}

Uint8List r1Material(
  int id, {
  int version = 1,
  JsThreeMaterialKind kind = JsThreeMaterialKind.meshBasic,
  bool transparent = false,
  bool wireframe = false,
  bool vertexColors = false,
  bool flatShading = false,
  bool sizeAttenuation = true,
  double pointSize = 1,
  JsThreeSide side = JsThreeSide.front,
  int mapTextureId = 0,
  bool emissive = false,
  List<double> color = const [1, 1, 1],
  double opacity = 1,
  bool depthTest = true,
  bool depthWrite = true,
  int? clipId,
  int clipFlags = 0,
}) {
  final phong = kind == JsThreeMaterialKind.meshPhong;
  final v3 = clipId != null;
  final clipBytes = v3 ? 8 : 0;
  final base = (phong ? 72 : 56) + clipBytes;
  final data = ByteData(base + (emissive ? 16 : 0));
  data.setUint32(0, id, Endian.little);
  data.setUint32(4, version, Endian.little);
  data.setUint32(8, kind.wireValue, Endian.little);
  data.setUint32(12, mapTextureId, Endian.little);
  data.setUint32(
    16,
    (transparent ? 4 : 0) |
        (depthTest ? 8 : 0) |
        (depthWrite ? 16 : 0) |
        (vertexColors ? 1 : 0) |
        (flatShading ? 2 : 0) |
        (wireframe ? 32 : 0) |
        (sizeAttenuation ? 0 : 64),
    Endian.little,
  );
  data.setUint32(20, side.wireValue, Endian.little);
  data.setFloat32(24, color[0], Endian.little);
  data.setFloat32(28, color[1], Endian.little);
  data.setFloat32(32, color[2], Endian.little);
  data.setFloat32(36, opacity, Endian.little);
  data.setFloat32(40, 0.5, Endian.little);
  data.setFloat32(44, 0, Endian.little);
  data.setFloat32(48, 0, Endian.little);
  data.setFloat32(52, pointSize, Endian.little);
  if (v3) {
    data.setUint32(56, clipId, Endian.little);
    data.setUint32(60, clipFlags, Endian.little);
  }
  if (phong) {
    data.setFloat32(56 + clipBytes, 0.125, Endian.little);
    data.setFloat32(60 + clipBytes, 0.25, Endian.little);
    data.setFloat32(64 + clipBytes, 0.5, Endian.little);
    data.setFloat32(68 + clipBytes, 64, Endian.little);
  }
  if (emissive) {
    final offset = base;
    data.setFloat32(offset, 0.125, Endian.little);
    data.setFloat32(offset + 4, 0.25, Endian.little);
    data.setFloat32(offset + 8, 0.5, Endian.little);
    data.setFloat32(offset + 12, 3, Endian.little);
  }
  return Uint8List.view(data.buffer);
}

Uint8List r1Node(
  int id, {
  int parentId = 0,
  int geometryId = 0,
  int materialId = 0,
  JsThreeObjectKind objectKind = JsThreeObjectKind.group,
  bool visible = true,
  List<double>? matrixWorld,
  bool castShadow = false,
  bool receiveShadow = false,
}) {
  final data = ByteData(92);
  data.setUint32(0, id, Endian.little);
  data.setUint32(4, parentId, Endian.little);
  data.setUint32(8, geometryId, Endian.little);
  data.setUint32(12, materialId, Endian.little);
  data.setUint32(16, visible ? 1 : 0, Endian.little);
  data.setUint32(20, objectKind.wireValue, Endian.little);
  _writeFloats(data, 24, matrixWorld ?? _identity());
  data.setUint32(
    88,
    (castShadow ? 1 : 0) | (receiveShadow ? 2 : 0),
    Endian.little,
  );
  return Uint8List.view(data.buffer);
}

Uint8List r1DrawBatch(
  int nodeId, {
  required int version,
  required int instanceCount,
  required bool instanced,
  required List<(int, int, int, int)> parts,
  required List<double>? matrices,
  List<double>? colors,
}) {
  final matrixValues =
      matrices ??
      (instanced
          ? [
              for (var instance = 0; instance < instanceCount; instance++)
                ..._identity(),
            ]
          : const <double>[]);
  // Wire convention: flags bit 0 = instancing, bit 1 = per-instance colors.
  final flags = (instanced ? 1 : 0) | (colors != null ? 2 : 0);
  final builder = R1BodyBuilder()
    ..u32(nodeId)
    ..u32(version)
    ..u32(instanceCount)
    ..u32(flags)
    ..u32(parts.length);
  for (final (geometryId, materialId, offset, count) in parts) {
    builder
      ..u32(geometryId)
      ..u32(materialId)
      ..u32(offset)
      ..u32(count);
  }
  builder.floats(matrixValues);
  builder.floats(colors ?? const <double>[]);
  return builder.bytes;
}

Uint8List r1Camera(int id) {
  final data = ByteData(200);
  data.setUint32(0, id, Endian.little);
  data.setUint32(4, JsThreeCameraType.perspective.wireValue, Endian.little);
  _writeFloats(data, 8, _identity());
  _writeFloats(data, 72, _identity());
  _writeFloats(data, 136, _identity());
  return Uint8List.view(data.buffer);
}

Uint8List r1Light(
  int id,
  JsThreeLightType type, {
  double intensity = 1,
  double red = 1,
  double green = 1,
  double blue = 1,
  double groundRed = 0,
  double groundGreen = 0,
  double groundBlue = 0,
  List<double>? direction,
  double spotAngle = 0.6283,
  double spotPenumbra = 0.2,
  double spotDistance = 12,
  double spotDecay = 2,
}) {
  final hemisphere = type == JsThreeLightType.hemisphere;
  final spot = type == JsThreeLightType.spot;
  final data = ByteData(hemisphere || spot ? 64 : 48);
  data.setUint32(0, id, Endian.little);
  data.setUint32(4, type.wireValue, Endian.little);
  data.setFloat32(8, red, Endian.little);
  data.setFloat32(12, green, Endian.little);
  data.setFloat32(16, blue, Endian.little);
  data.setFloat32(20, intensity, Endian.little);
  data.setFloat32(24, 0, Endian.little);
  data.setFloat32(28, 1, Endian.little);
  data.setFloat32(32, -1, Endian.little);
  final worldDirection = direction ?? const [0.0, -1.0, -0.5];
  for (var index = 0; index < 3; index++) {
    data.setFloat32(36 + index * 4, worldDirection[index], Endian.little);
  }
  if (hemisphere) {
    data.setFloat32(48, groundRed, Endian.little);
    data.setFloat32(52, groundGreen, Endian.little);
    data.setFloat32(56, groundBlue, Endian.little);
  }
  if (spot) {
    data.setFloat32(48, spotAngle, Endian.little);
    data.setFloat32(52, spotPenumbra, Endian.little);
    data.setFloat32(56, spotDistance, Endian.little);
    data.setFloat32(60, spotDecay, Endian.little);
  }
  return Uint8List.view(data.buffer);
}

Uint8List r1Clipping(int id, {int version = 1}) {
  final planes = <double>[0, -1, 0, 0.8, -1, 0, 0, 0.1];
  final data = ByteData(12 + planes.length * 4);
  data.setUint32(0, id, Endian.little);
  data.setUint32(4, version, Endian.little);
  data.setUint32(8, planes.length ~/ 4, Endian.little);
  for (var index = 0; index < planes.length; index++) {
    data.setFloat32(12 + index * 4, planes[index], Endian.little);
  }
  return Uint8List.view(data.buffer);
}

Uint8List r1Frame({
  required int sceneId,
  required int cameraId,
  double exposure = 1,
  int shadowMapSize = 0,
  List<int> culledNodeIds = const [],
  List<int> culledShadowNodeIds = const [],
  int? shadowLightType,
}) {
  final hasCulling = culledNodeIds.isNotEmpty || culledShadowNodeIds.isNotEmpty;
  final v3 = shadowLightType != null;
  final base = v3 ? 140 : 136;
  final data = ByteData(
    base +
        (hasCulling ? 4 + culledNodeIds.length * 4 : 0) +
        (culledShadowNodeIds.isEmpty ? 0 : 4 + culledShadowNodeIds.length * 4),
  );
  data.setUint32(0, sceneId, Endian.little);
  data.setUint32(4, cameraId, Endian.little);
  data.setFloat32(8, 0.1, Endian.little);
  data.setFloat32(12, 0.2, Endian.little);
  data.setFloat32(16, 0.3, Endian.little);
  data.setFloat32(20, 1, Endian.little);
  data.setFloat32(24, exposure, Endian.little);
  data.setUint32(52, shadowMapSize, Endian.little);
  data.setUint32(56, shadowMapSize, Endian.little);
  data.setFloat32(60, -0.0001, Endian.little);
  data.setFloat32(64, 0.02, Endian.little);
  data.setFloat32(68, 1, Endian.little);
  for (final index in [0, 5, 10, 15]) {
    data.setFloat32(72 + index * 4, 1, Endian.little);
  }
  if (v3) data.setUint32(136, shadowLightType, Endian.little);
  var offset = base;
  if (hasCulling) {
    data.setUint32(offset, culledNodeIds.length, Endian.little);
    offset += 4;
    for (final id in culledNodeIds) {
      data.setUint32(offset, id, Endian.little);
      offset += 4;
    }
  }
  if (culledShadowNodeIds.isNotEmpty) {
    data.setUint32(offset, culledShadowNodeIds.length, Endian.little);
    offset += 4;
    for (final id in culledShadowNodeIds) {
      data.setUint32(offset, id, Endian.little);
      offset += 4;
    }
  }
  return Uint8List.view(data.buffer);
}

List<double> _identity() => [
  1, 0, 0, 0, //
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
];

List<double> _translation(double x, double y, double z) => [
  1, 0, 0, 0, //
  0, 1, 0, 0,
  0, 0, 1, 0,
  x, y, z, 1,
];

void _writeFloats(ByteData data, int offset, List<double> values) {
  for (var index = 0; index < values.length; index++) {
    data.setFloat32(offset + index * 4, values[index], Endian.little);
  }
}

Uint8List _u16(int value) {
  final data = ByteData(2)..setUint16(0, value, Endian.little);
  return Uint8List.view(data.buffer);
}

Uint8List _u32(int value) {
  final data = ByteData(4)..setUint32(0, value, Endian.little);
  return Uint8List.view(data.buffer);
}

final class R1BodyBuilder {
  final BytesBuilder _builder = BytesBuilder(copy: false);

  void u32(int value) => _builder.add(_u32(value));

  void floats(List<double> values, {bool byteLengthPrefix = false}) {
    final data = ByteData(values.length * 4);
    _writeFloats(data, 0, values);
    if (byteLengthPrefix) u32(data.lengthInBytes);
    _builder.add(Uint8List.view(data.buffer));
  }

  Uint8List get bytes => _builder.takeBytes();
}
