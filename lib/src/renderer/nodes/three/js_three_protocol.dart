import 'dart:convert';
import 'dart:typed_data';

/// A malformed T1 envelope or R1 payload.
final class JsThreeProtocolException extends FormatException {
  const JsThreeProtocolException(super.message, [super.source, super.offset]);
}

enum JsThreePrimitive {
  triangles(0),
  lines(1),
  points(2);

  const JsThreePrimitive(this.wireValue);
  final int wireValue;
}

enum JsThreeTextureEncoding {
  rawRgba8(0),
  png(1),
  jpeg(2);

  const JsThreeTextureEncoding(this.wireValue);
  final int wireValue;
}

enum JsThreeMaterialKind {
  meshBasic(0),
  meshLambert(1),
  meshStandard(2),
  lineBasic(3),
  pointsBasic(4);

  const JsThreeMaterialKind(this.wireValue);
  final int wireValue;
}

enum JsThreeSide {
  front(0),
  back(1),
  double(2);

  const JsThreeSide(this.wireValue);
  final int wireValue;
}

enum JsThreeObjectKind {
  group(0),
  mesh(1),
  line(2),
  points(3);

  const JsThreeObjectKind(this.wireValue);
  final int wireValue;
}

enum JsThreeCameraType {
  perspective(0),
  orthographic(1);

  const JsThreeCameraType(this.wireValue);
  final int wireValue;
}

enum JsThreeLightType {
  ambient(0),
  directional(1),
  point(2);

  const JsThreeLightType(this.wireValue);
  final int wireValue;
}

enum JsThreeFogMode {
  none(0),
  linear(1);

  const JsThreeFogMode(this.wireValue);
  final int wireValue;
}

enum JsThreeResourceKind {
  geometry(1),
  texture(2),
  material(3),
  node(4),
  light(5),
  camera(6);

  const JsThreeResourceKind(this.wireValue);
  final int wireValue;
}

final class JsThreeT1Envelope {
  const JsThreeT1Envelope._({
    required this.protocolVersion,
    required this.kind,
    required this.headerBytes,
    required this.sequence,
    required this.engineId,
    required this.surfaceId,
    required this.payload,
    required this.totalBytes,
  });

  final int protocolVersion;
  final int kind;
  final int headerBytes;
  final int sequence;
  final String engineId;
  final String surfaceId;
  final Uint8List payload;
  final int totalBytes;

  int get payloadBytes => payload.length;
}

final class JsThreeDecodedR1 {
  const JsThreeDecodedR1._(this.envelope, this.stream);

  final JsThreeT1Envelope envelope;
  final JsThreeR1Stream stream;
}

final class JsThreeR1Stream {
  const JsThreeR1Stream._(this.commands);

  final List<JsThreeCommand> commands;

  int get commandCount => commands.length;
}

sealed class JsThreeCommand {
  const JsThreeCommand._(this.opcode);

  final int opcode;
}

final class JsThreeGeometryUpsert extends JsThreeCommand {
  JsThreeGeometryUpsert._({
    required this.geometryId,
    required this.version,
    required this.attributeMask,
    required this.vertexCount,
    required this.indexCount,
    required this.primitive,
    required this.positions,
    required this.normals,
    required this.uvs,
    required this.colors,
    required this.colorStride,
    required this.indices,
  }) : super._(1);

  final int geometryId;
  final int version;
  final int attributeMask;
  final int vertexCount;
  final int indexCount;
  final JsThreePrimitive primitive;
  final Float32List positions;
  final Float32List? normals;
  final Float32List? uvs;
  final Float32List? colors;
  final int colorStride;
  final Uint32List indices;
}

final class JsThreeTextureUpsert extends JsThreeCommand {
  JsThreeTextureUpsert._({
    required this.textureId,
    required this.version,
    required this.width,
    required this.height,
    required this.encoding,
    required this.flags,
    required this.data,
  }) : super._(2);

  final int textureId;
  final int version;
  final int width;
  final int height;
  final JsThreeTextureEncoding encoding;
  final int flags;
  final Uint8List data;

  bool get srgb => flags & 0x01 != 0;
  bool get flipY => flags & 0x02 != 0;
  bool get nearestMag => flags & 0x04 != 0;
  bool get nearestMin => flags & 0x08 != 0;
  bool get mipmaps => flags & 0x10 != 0;
  bool get repeatS => flags & 0x20 != 0;
  bool get repeatT => flags & 0x40 != 0;
  bool get isEncoded => encoding != JsThreeTextureEncoding.rawRgba8;
}

final class JsThreeMaterialUpsert extends JsThreeCommand {
  const JsThreeMaterialUpsert._({
    required this.materialId,
    required this.version,
    required this.kind,
    required this.mapTextureId,
    required this.flags,
    required this.side,
    required this.colorR,
    required this.colorG,
    required this.colorB,
    required this.opacity,
    required this.roughness,
    required this.metalness,
    required this.alphaTest,
    required this.pointSize,
  }) : super._(3);

  final int materialId;
  final int version;
  final JsThreeMaterialKind kind;
  final int mapTextureId;
  final int flags;
  final JsThreeSide side;
  final double colorR;
  final double colorG;
  final double colorB;
  final double opacity;
  final double roughness;
  final double metalness;
  final double alphaTest;
  final double pointSize;

  bool get vertexColors => flags & 0x01 != 0;
  bool get flatShading => flags & 0x02 != 0;
  bool get transparent => flags & 0x04 != 0;
  bool get depthTest => flags & 0x08 != 0;
  bool get depthWrite => flags & 0x10 != 0;
}

final class JsThreeNodeUpsert extends JsThreeCommand {
  JsThreeNodeUpsert._({
    required this.nodeId,
    required this.parentId,
    required this.geometryId,
    required this.materialId,
    required this.flags,
    required this.objectKind,
    required this.matrixWorld,
    required this.shadowFlags,
  }) : super._(4);

  final int nodeId;
  final int parentId;
  final int geometryId;
  final int materialId;
  final int flags;
  final JsThreeObjectKind objectKind;
  final Float32List matrixWorld;
  final int shadowFlags;

  bool get visible => flags & 1 != 0;
  bool get castShadow => shadowFlags & 1 != 0;
  bool get receiveShadow => shadowFlags & 2 != 0;
}

final class JsThreeRemoveNode extends JsThreeCommand {
  const JsThreeRemoveNode._(this.nodeId) : super._(5);

  final int nodeId;
}

final class JsThreeCameraUpsert extends JsThreeCommand {
  JsThreeCameraUpsert._({
    required this.cameraId,
    required this.type,
    required this.matrixWorldInverse,
    required this.projectionMatrix,
    required this.matrixWorld,
  }) : super._(6);

  final int cameraId;
  final JsThreeCameraType type;
  final Float32List matrixWorldInverse;
  final Float32List projectionMatrix;
  final Float32List matrixWorld;
}

final class JsThreeLightUpsert extends JsThreeCommand {
  JsThreeLightUpsert._({
    required this.lightId,
    required this.type,
    required this.colorR,
    required this.colorG,
    required this.colorB,
    required this.intensity,
    required this.worldPosition,
    required this.worldDirection,
  }) : super._(7);

  final int lightId;
  final JsThreeLightType type;
  final double colorR;
  final double colorG;
  final double colorB;
  final double intensity;
  final Float32List worldPosition;
  final Float32List worldDirection;
}

final class JsThreeSubmitFrame extends JsThreeCommand {
  const JsThreeSubmitFrame._({
    required this.sceneId,
    required this.cameraId,
    required this.backgroundR,
    required this.backgroundG,
    required this.backgroundB,
    required this.backgroundA,
    required this.exposure,
    required this.fogMode,
    required this.fogColorR,
    required this.fogColorG,
    required this.fogColorB,
    required this.fogNear,
    required this.fogFar,
    required this.shadowMapWidth,
    required this.shadowMapHeight,
    required this.shadowBias,
    required this.shadowNormalBias,
    required this.shadowRadius,
    required this.shadowMatrix,
    this.shadowContentRevision,
    this.culledNodeIds = const <int>{},
    this.culledShadowNodeIds = const <int>{},
  }) : super._(8);

  final int sceneId;
  final int cameraId;
  final double backgroundR;
  final double backgroundG;
  final double backgroundB;
  final double backgroundA;
  final double exposure;
  final JsThreeFogMode fogMode;
  final double fogColorR;
  final double fogColorG;
  final double fogColorB;
  final double fogNear;
  final double fogFar;
  final int shadowMapWidth;
  final int shadowMapHeight;
  final double shadowBias;
  final double shadowNormalBias;
  final double shadowRadius;
  final Float32List shadowMatrix;

  /// Manual THREE shadow revision; null follows global scene content changes.
  final int? shadowContentRevision;

  /// Main-camera-culled nodes. Shadow rendering still considers these nodes.
  final Set<int> culledNodeIds;

  /// Nodes outside the directional shadow camera, independent of main culling.
  final Set<int> culledShadowNodeIds;

  bool get hasShadow => shadowMapWidth > 0;
}

final class JsThreeDisposeResource extends JsThreeCommand {
  const JsThreeDisposeResource._(this.resourceId, this.resourceKind)
    : super._(9);

  final int resourceId;
  final JsThreeResourceKind resourceKind;
}

final class JsThreeDisposeSurface extends JsThreeCommand {
  const JsThreeDisposeSurface._() : super._(10);
}

/// One geometry/material range in a [JsThreeDrawBatchUpsert].
final class JsThreeDrawBatchPart {
  const JsThreeDrawBatchPart._({
    required this.geometryId,
    required this.materialId,
    required this.offset,
    required this.count,
  });

  final int geometryId;
  final int materialId;

  /// An index offset for indexed geometry, otherwise a vertex offset.
  final int offset;
  final int count;
}

/// A versioned set of draws and optional local instance matrices for one node.
final class JsThreeDrawBatchUpsert extends JsThreeCommand {
  const JsThreeDrawBatchUpsert._({
    required this.nodeId,
    required this.version,
    required this.instanceCount,
    required this.flags,
    required this.parts,
    required this.instanceMatrices,
  }) : super._(11);

  final int nodeId;
  final int version;
  final int instanceCount;
  final int flags;
  final List<JsThreeDrawBatchPart> parts;

  /// Sixteen column-major floats per instance, with no per-instance colors.
  final Float32List instanceMatrices;

  bool get instanced => flags & 1 != 0;
}

final class JsThreeRemoveBatch extends JsThreeCommand {
  const JsThreeRemoveBatch._(this.nodeId) : super._(12);

  final int nodeId;
}

/// Checked T1/R1 v1 decoding. No surface state is changed by this class.
final class JsThreeProtocolDecoder {
  JsThreeProtocolDecoder({this.maxEnvelopeBytes = defaultMaxEnvelopeBytes}) {
    if (maxEnvelopeBytes < t1HeaderBytes) {
      throw ArgumentError.value(
        maxEnvelopeBytes,
        'maxEnvelopeBytes',
        'must hold a T1 header',
      );
    }
  }

  static const int t1HeaderBytes = 32;
  static const int r1HeaderBytes = 12;
  static const int defaultMaxEnvelopeBytes = 64 * 1024 * 1024;
  static const int maxEncodedTextureBytes = 64 * 1024 * 1024;
  static const int maxCommandCount = 100000;
  static const int maxVertexCount = 4000000;
  static const int maxIndexCount = 12000000;
  static const int maxDrawBatchPartCount = 65536;
  static const int maxDrawBatchInstanceCount = 1000000;

  final int maxEnvelopeBytes;

  JsThreeDecodedR1 decode(Uint8List bytes) {
    final envelope = decodeEnvelope(bytes);
    return JsThreeDecodedR1._(envelope, decodeR1(envelope.payload));
  }

  JsThreeT1Envelope decodeEnvelope(Uint8List bytes) {
    _checkEnvelopeLength(bytes);
    final header = _readT1Header(bytes);
    final expectedTotal = _validateT1Header(header, bytes.length);
    final engineId = _decodeUtf8(bytes, 32, header.engineBytes, 'engine');
    final surfaceId = _decodeUtf8(
      bytes,
      32 + header.engineBytes,
      header.surfaceBytes,
      'surface',
    );
    final payload = Uint8List.fromList(
      Uint8List.sublistView(bytes, header.headerBytes, expectedTotal),
    ).asUnmodifiableView();
    return JsThreeT1Envelope._(
      protocolVersion: header.version,
      kind: header.kind,
      headerBytes: header.headerBytes,
      sequence: header.sequence,
      engineId: engineId,
      surfaceId: surfaceId,
      payload: payload,
      totalBytes: header.totalBytes,
    );
  }

  void _checkEnvelopeLength(Uint8List bytes) {
    if (bytes.length > maxEnvelopeBytes) {
      _fail('T1 envelope exceeds $maxEnvelopeBytes bytes', 0);
    }
    if (bytes.length < t1HeaderBytes) {
      _fail('truncated T1 header', bytes.length);
    }
  }

  _T1Header _readT1Header(Uint8List bytes) {
    final reader = _Reader(bytes, 0, t1HeaderBytes);
    reader.expectAscii('JSR3');
    final version = reader.u8('protocol version');
    if (version != 1) reader.fail('unsupported T1 version $version');
    final kind = reader.u8('stream kind');
    if (kind != 1) reader.fail('unsupported stream kind $kind');
    final header = _T1Header.read(reader, version, kind);
    reader.requireEnd('T1 header');
    if (header.flags != 0 || header.reserved != 0) {
      reader.fail('T1 flags and reserved field must be zero');
    }
    validateSequence(header.sequence);
    return header;
  }

  int _validateT1Header(_T1Header header, int actualBytes) {
    final reader = header.reader;
    if (header.engineBytes < 1 || header.engineBytes > 128) {
      reader.fail('engine UTF-8 length must be in 1..128');
    }
    if (header.surfaceBytes < 1 || header.surfaceBytes > 128) {
      reader.fail('surface UTF-8 length must be in 1..128');
    }
    final expectedHeader = _checkedAdd(
      t1HeaderBytes,
      _checkedAdd(header.engineBytes, header.surfaceBytes, 'T1 strings'),
      'T1 header',
    );
    if (header.headerBytes != expectedHeader) {
      reader.fail('T1 headerBytes does not match UTF-8 lengths');
    }
    final expectedTotal = _checkedAdd(
      header.headerBytes,
      header.payloadBytes,
      'T1 total',
    );
    if (header.totalBytes != expectedTotal || actualBytes != expectedTotal) {
      reader.fail('T1 totalBytes/payloadBytes do not match exact input length');
    }
    return expectedTotal;
  }

  /// Validates nonzero syntax and, when supplied, per-surface ordering.
  static void validateSequence(int sequence, {int? lastSequence}) {
    if (sequence == 0) _fail('sequence must be nonzero');
    if (lastSequence == null) return;
    if (lastSequence < 0) {
      throw ArgumentError.value(lastSequence, 'lastSequence');
    }
    if (lastSequence == 0 && sequence != 1) {
      _fail('first surface sequence must be 1');
    }
    if (sequence <= lastSequence) {
      _fail('stale or replayed sequence $sequence after $lastSequence');
    }
  }

  JsThreeR1Stream decodeR1(Uint8List payload) {
    final reader = _Reader(payload);
    reader.expectAscii('JSR1');
    final version = reader.u16('R1 version');
    if (version != 1) reader.fail('unsupported R1 version $version');
    final flags = reader.u16('R1 flags');
    if (flags != 0) reader.fail('R1 flags must be zero');
    final count = reader.u32('command count');
    if (count > maxCommandCount) {
      reader.fail('command count exceeds $maxCommandCount');
    }
    final commands = <JsThreeCommand>[];
    for (var index = 0; index < count; index++) {
      final commandReader = reader;
      final opcode = commandReader.u8('command opcode');
      final commandFlags = commandReader.u8('command flags');
      final reserved = commandReader.u16('command reserved');
      if (commandFlags != 0 || reserved != 0) {
        reader.fail('command flags and reserved field must be zero');
      }
      final bodyBytes = reader.u32('command body bytes');
      reader.require(bodyBytes, 'command body');
      final body = _Reader(payload, reader.offset, reader.offset + bodyBytes);
      reader.skip(bodyBytes);
      commands.add(_decodeCommand(opcode, body));
      body.requireEnd('opcode $opcode body');
    }
    reader.requireEnd('R1 stream');
    return JsThreeR1Stream._(List.unmodifiable(commands));
  }

  JsThreeGeometryUpsert _geometry(_Reader body) {
    final header = _readGeometryHeader(body);
    final positions = body.attribute(header.vertexCount, 3, 'position');
    final normals = header.mask & 2 == 0
        ? null
        : body.attribute(header.vertexCount, 3, 'normal');
    final uvs = header.mask & 4 == 0
        ? null
        : body.attribute(header.vertexCount, 2, 'uv');
    final color = _readGeometryColor(body, header);
    final indices = header.indexCount == 0
        ? Uint32List(0).asUnmodifiableView()
        : body.indices(header.indexCount, header.vertexCount);
    return JsThreeGeometryUpsert._(
      geometryId: header.id,
      version: header.version,
      attributeMask: header.mask,
      vertexCount: header.vertexCount,
      indexCount: header.indexCount,
      primitive: header.primitive,
      positions: positions,
      normals: normals,
      uvs: uvs,
      colors: color.colors,
      colorStride: color.stride,
      indices: indices,
    );
  }

  _GeometryHeader _readGeometryHeader(_Reader body) {
    final id = body.nonzeroId('geometry id');
    final version = body.nonzeroVersion();
    final mask = body.u32('attribute mask');
    if (mask & ~0x0f != 0 || mask & 1 == 0) {
      body.fail('attribute mask requires position and only bits 0..3');
    }
    final vertexCount = body.u32('vertex count');
    if (vertexCount == 0 || vertexCount > maxVertexCount) {
      body.fail('vertex count outside 1..$maxVertexCount');
    }
    final indexCount = body.u32('index count');
    if (indexCount > maxIndexCount) {
      body.fail('index count exceeds $maxIndexCount');
    }
    final primitive = body.enumValue(
      JsThreePrimitive.values,
      body.u32('primitive'),
      'primitive',
    );
    if (body.u32('geometry reserved') != 0) {
      body.fail('geometry reserved field must be zero');
    }
    final vertexMultiple = switch (primitive) {
      JsThreePrimitive.triangles => 3,
      JsThreePrimitive.lines => 2,
      JsThreePrimitive.points => 1,
    };
    final drawCount = indexCount == 0 ? vertexCount : indexCount;
    if (drawCount % vertexMultiple != 0) {
      body.fail('${primitive.name} draw count has an incomplete primitive');
    }
    return _GeometryHeader(
      id,
      version,
      mask,
      vertexCount,
      indexCount,
      primitive,
    );
  }

  ({Float32List? colors, int stride}) _readGeometryColor(
    _Reader body,
    _GeometryHeader header,
  ) {
    if (header.mask & 8 == 0) return (colors: null, stride: 0);
    final byteLength = body.u32('color byte length');
    final rgbBytes = body.product(header.vertexCount, 12, 'RGB color bytes');
    final rgbaBytes = body.product(header.vertexCount, 16, 'RGBA color bytes');
    if (byteLength != rgbBytes && byteLength != rgbaBytes) {
      body.fail('color byte length must select a 3- or 4-float stride');
    }
    final stride = byteLength == rgbBytes ? 3 : 4;
    final colors = body.float32List(
      stride * header.vertexCount,
      'color attribute',
    );
    return (colors: colors, stride: stride);
  }

  JsThreeTextureUpsert _texture(_Reader body) {
    final id = body.nonzeroId('texture id');
    final version = body.nonzeroVersion();
    final width = body.u32('texture width');
    final height = body.u32('texture height');
    final encoding = body.enumValue(
      JsThreeTextureEncoding.values,
      body.u32('texture encoding'),
      'texture encoding',
    );
    final flags = body.u32('texture flags');
    if (flags & ~0x7f != 0) body.fail('unknown texture flag');
    final byteLength = body.u32('texture data length');
    if (encoding == JsThreeTextureEncoding.rawRgba8) {
      if (width == 0 || height == 0) {
        body.fail('raw RGBA8 texture dimensions must be nonzero');
      }
      final expected = body.product(
        body.product(width, height, 'raw texture pixels'),
        4,
        'raw texture bytes',
      );
      if (byteLength != expected) {
        body.fail('raw RGBA8 byte length does not match dimensions');
      }
    } else if (byteLength == 0 || byteLength > maxEncodedTextureBytes) {
      body.fail('encoded texture data must be nonempty and at most 64 MiB');
    }
    return JsThreeTextureUpsert._(
      textureId: id,
      version: version,
      width: width,
      height: height,
      encoding: encoding,
      flags: flags,
      data: body.byteList(byteLength, 'texture data'),
    );
  }

  JsThreeMaterialUpsert _material(_Reader body) {
    final id = body.nonzeroId('material id');
    final version = body.nonzeroVersion();
    final kind = body.enumValue(
      JsThreeMaterialKind.values,
      body.u32('material kind'),
      'material kind',
    );
    final mapTextureId = body.u32('map texture id');
    final flags = body.u32('material flags');
    if (flags & ~0x1f != 0) body.fail('unknown material flag');
    final side = body.enumValue(
      JsThreeSide.values,
      body.u32('material side'),
      'material side',
    );
    final colorR = body.finiteFloat('material color red');
    final colorG = body.finiteFloat('material color green');
    final colorB = body.finiteFloat('material color blue');
    final opacity = body.unitFloat('material opacity');
    final roughness = body.unitFloat('material roughness');
    final metalness = body.unitFloat('material metalness');
    final alphaTest = body.unitFloat('material alpha test');
    final pointSize = body.finiteFloat('point size');
    if (pointSize <= 0) body.fail('point size must be positive');
    return JsThreeMaterialUpsert._(
      materialId: id,
      version: version,
      kind: kind,
      mapTextureId: mapTextureId,
      flags: flags,
      side: side,
      colorR: colorR,
      colorG: colorG,
      colorB: colorB,
      opacity: opacity,
      roughness: roughness,
      metalness: metalness,
      alphaTest: alphaTest,
      pointSize: pointSize,
    );
  }

  JsThreeNodeUpsert _node(_Reader body) {
    final id = body.nonzeroId('node id');
    final parentId = body.u32('parent id');
    final geometryId = body.u32('node geometry id');
    final materialId = body.u32('node material id');
    final flags = body.u32('node flags');
    if (flags & ~1 != 0) body.fail('only node visibility flag is valid');
    final kind = body.enumValue(
      JsThreeObjectKind.values,
      body.u32('object kind'),
      'object kind',
    );
    final matrixWorld = body.float32List(16, 'world matrix');
    final shadowFlags = body.u32('node shadow flags');
    if (shadowFlags & ~3 != 0) body.fail('invalid node shadow flags');
    return JsThreeNodeUpsert._(
      nodeId: id,
      parentId: parentId,
      geometryId: geometryId,
      materialId: materialId,
      flags: flags,
      objectKind: kind,
      matrixWorld: matrixWorld,
      shadowFlags: shadowFlags,
    );
  }

  JsThreeDrawBatchUpsert _drawBatch(_Reader body) {
    final nodeId = body.nonzeroId('batch node id');
    final version = body.nonzeroVersion();
    final instanceCount = body.u32('batch instance count');
    final flags = body.u32('batch flags');
    if (flags & ~1 != 0) body.fail('only batch instancing flag is valid');
    final instanced = flags & 1 != 0;
    if (!instanced && instanceCount != 1) {
      body.fail('a non-instanced batch must have exactly one instance');
    }
    if (instanceCount > maxDrawBatchInstanceCount) {
      body.fail('batch instance count exceeds $maxDrawBatchInstanceCount');
    }
    final partCount = body.u32('batch part count');
    if (partCount == 0 || partCount > maxDrawBatchPartCount) {
      body.fail('batch part count outside 1..$maxDrawBatchPartCount');
    }
    final parts = <JsThreeDrawBatchPart>[];
    for (var index = 0; index < partCount; index++) {
      final geometryId = body.nonzeroId('batch part geometry id');
      final materialId = body.nonzeroId('batch part material id');
      final offset = body.u32('batch part offset');
      final count = body.u32('batch part count');
      if (count == 0) body.fail('batch part count must be nonzero');
      if (offset > 0xffffffff - count) {
        body.fail('batch part offset/count overflows u32');
      }
      parts.add(
        JsThreeDrawBatchPart._(
          geometryId: geometryId,
          materialId: materialId,
          offset: offset,
          count: count,
        ),
      );
    }
    final matrices = instanced
        ? body.float32List(
            body.product(instanceCount, 16, 'batch matrix floats'),
            'batch instance matrices',
          )
        : Float32List(0).asUnmodifiableView();
    return JsThreeDrawBatchUpsert._(
      nodeId: nodeId,
      version: version,
      instanceCount: instanceCount,
      flags: flags,
      parts: List.unmodifiable(parts),
      instanceMatrices: matrices,
    );
  }

  JsThreeCameraUpsert _camera(_Reader body) {
    final id = body.nonzeroId('camera id');
    final type = body.enumValue(
      JsThreeCameraType.values,
      body.u32('camera type'),
      'camera type',
    );
    return JsThreeCameraUpsert._(
      cameraId: id,
      type: type,
      matrixWorldInverse: body.float32List(16, 'inverse world matrix'),
      projectionMatrix: body.float32List(16, 'projection matrix'),
      matrixWorld: body.float32List(16, 'camera world matrix'),
    );
  }

  JsThreeLightUpsert _light(_Reader body) {
    final id = body.nonzeroId('light id');
    final type = body.enumValue(
      JsThreeLightType.values,
      body.u32('light type'),
      'light type',
    );
    final red = body.finiteFloat('light color red');
    final green = body.finiteFloat('light color green');
    final blue = body.finiteFloat('light color blue');
    final intensity = body.finiteFloat('light intensity');
    if (intensity < 0) body.fail('light intensity must be nonnegative');
    return JsThreeLightUpsert._(
      lightId: id,
      type: type,
      colorR: red,
      colorG: green,
      colorB: blue,
      intensity: intensity,
      worldPosition: body.float32List(3, 'light world position'),
      worldDirection: body.float32List(3, 'light world direction'),
    );
  }

  JsThreeSubmitFrame _frame(_Reader body) {
    final sceneId = body.nonzeroId('scene id');
    final cameraId = body.nonzeroId('frame camera id');
    final red = body.finiteFloat('background red');
    final green = body.finiteFloat('background green');
    final blue = body.finiteFloat('background blue');
    final alpha = body.finiteFloat('background alpha');
    final exposure = body.finiteFloat('exposure');
    if (exposure <= 0) body.fail('exposure must be positive');
    final fogMode = body.enumValue(
      JsThreeFogMode.values,
      body.u32('fog mode'),
      'fog mode',
    );
    final fogRed = body.finiteFloat('fog color red');
    final fogGreen = body.finiteFloat('fog color green');
    final fogBlue = body.finiteFloat('fog color blue');
    final fogNear = body.finiteFloat('fog near');
    final fogFar = body.finiteFloat('fog far');
    if (fogMode == JsThreeFogMode.linear &&
        (fogNear < 0 || fogFar <= fogNear)) {
      body.fail('linear fog requires 0 <= near < far');
    }
    final shadowWidth = body.u32('shadow map width');
    final shadowHeight = body.u32('shadow map height');
    final shadowBias = body.finiteFloat('shadow bias');
    final shadowNormalBias = body.finiteFloat('shadow normal bias');
    final shadowRadius = body.finiteFloat('shadow radius');
    final shadowMatrix = body.float32List(16, 'shadow matrix');
    if ((shadowWidth == 0) != (shadowHeight == 0) ||
        shadowWidth > 8192 ||
        shadowHeight > 8192) {
      body.fail('shadow map dimensions must be zero or within 1..8192');
    }
    if (shadowRadius <= 0) body.fail('shadow radius must be positive');
    final culledNodeIds = _optionalCulledIds(body, 'culled');
    final culledShadowNodeIds = _optionalCulledIds(body, 'culled shadow');
    final shadowContentRevision = body.remaining == 0
        ? null
        : body.u32('shadow content revision');
    return JsThreeSubmitFrame._(
      sceneId: sceneId,
      cameraId: cameraId,
      backgroundR: red,
      backgroundG: green,
      backgroundB: blue,
      backgroundA: alpha,
      exposure: exposure,
      fogMode: fogMode,
      fogColorR: fogRed,
      fogColorG: fogGreen,
      fogColorB: fogBlue,
      fogNear: fogNear,
      fogFar: fogFar,
      shadowMapWidth: shadowWidth,
      shadowMapHeight: shadowHeight,
      shadowBias: shadowBias,
      shadowNormalBias: shadowNormalBias,
      shadowRadius: shadowRadius,
      shadowMatrix: shadowMatrix,
      shadowContentRevision: shadowContentRevision,
      culledNodeIds: culledNodeIds,
      culledShadowNodeIds: culledShadowNodeIds,
    );
  }

  Set<int> _optionalCulledIds(_Reader body, String label) {
    if (body.remaining == 0) return const <int>{};
    final count = body.u32('$label node count');
    if (count > 100000) body.fail('too many $label nodes');
    final ids = <int>{};
    for (var index = 0; index < count; index++) {
      ids.add(body.nonzeroId('$label node id'));
    }
    return Set.unmodifiable(ids);
  }

  static String _decodeUtf8(
    Uint8List bytes,
    int offset,
    int length,
    String label,
  ) {
    try {
      return utf8.decode(Uint8List.sublistView(bytes, offset, offset + length));
    } on FormatException {
      _fail('invalid $label UTF-8', offset);
    }
  }

  static int _checkedAdd(int left, int right, String label) {
    if (left < 0 || right < 0 || left > 0xffffffff - right) {
      _fail('$label length overflows u32');
    }
    return left + right;
  }

  static Never _fail(String message, [int? offset]) {
    throw JsThreeProtocolException(message, null, offset);
  }
}

typedef _R1CommandDecode =
    JsThreeCommand Function(JsThreeProtocolDecoder decoder, _Reader body);

final _r1CommandDecoders = <int, _R1CommandDecode>{
  1: (decoder, body) => decoder._geometry(body),
  2: (decoder, body) => decoder._texture(body),
  3: (decoder, body) => decoder._material(body),
  4: (decoder, body) => decoder._node(body),
  5: (decoder, body) => JsThreeRemoveNode._(body.nonzeroId('node id')),
  6: (decoder, body) => decoder._camera(body),
  7: (decoder, body) => decoder._light(body),
  8: (decoder, body) => decoder._frame(body),
  9: (decoder, body) {
    final id = body.nonzeroId('resource id');
    final wireKind = body.u32('resource kind');
    final kind = body.enumValue(
      JsThreeResourceKind.values,
      wireKind,
      'resource kind',
      firstWireValue: 1,
    );
    return JsThreeDisposeResource._(id, kind);
  },
  10: (decoder, body) => const JsThreeDisposeSurface._(),
  11: (decoder, body) => decoder._drawBatch(body),
  12: (decoder, body) => JsThreeRemoveBatch._(body.nonzeroId('batch node id')),
};

extension _JsThreeR1CommandDecoder on JsThreeProtocolDecoder {
  JsThreeCommand _decodeCommand(int opcode, _Reader body) {
    final decode = _r1CommandDecoders[opcode];
    if (decode == null) body.fail('unknown R1 opcode $opcode');
    return decode(this, body);
  }
}

final class _T1Header {
  _T1Header.read(this.reader, this.version, this.kind)
    : headerBytes = reader.u16('header bytes'),
      sequence = reader.u32('sequence'),
      payloadBytes = reader.u32('payload bytes'),
      engineBytes = reader.u16('engine byte length'),
      surfaceBytes = reader.u16('surface byte length'),
      flags = reader.u32('flags'),
      totalBytes = reader.u32('total bytes'),
      reserved = reader.u32('reserved');

  final _Reader reader;
  final int version;
  final int kind;
  final int headerBytes;
  final int sequence;
  final int payloadBytes;
  final int engineBytes;
  final int surfaceBytes;
  final int flags;
  final int totalBytes;
  final int reserved;
}

final class _GeometryHeader {
  const _GeometryHeader(
    this.id,
    this.version,
    this.mask,
    this.vertexCount,
    this.indexCount,
    this.primitive,
  );

  final int id;
  final int version;
  final int mask;
  final int vertexCount;
  final int indexCount;
  final JsThreePrimitive primitive;
}

final class _Reader {
  _Reader(Uint8List bytes, [int start = 0, int? end])
    : _bytes = bytes,
      _data = ByteData.sublistView(bytes),
      _offset = start,
      _end = end ?? bytes.length {
    if (start < 0 || _end < start || _end > bytes.length) {
      throw ArgumentError('invalid reader bounds');
    }
  }

  static const int _maxSafeInteger = 0x1fffffffffffff;

  final Uint8List _bytes;
  final ByteData _data;
  final int _end;
  int _offset;

  int get offset => _offset;
  int get remaining => _end - _offset;

  Never fail(String message) {
    throw JsThreeProtocolException(message, null, _offset);
  }

  void require(int byteCount, String label) {
    if (byteCount < 0 || byteCount > _end - _offset) {
      fail('truncated $label');
    }
  }

  void requireEnd(String label) {
    if (_offset != _end) fail('$label has ${_end - _offset} trailing bytes');
  }

  void skip(int byteCount) {
    require(byteCount, 'bytes');
    _offset += byteCount;
  }

  void expectAscii(String expected) {
    for (var index = 0; index < expected.length; index++) {
      if (u8('magic') != expected.codeUnitAt(index)) {
        fail('invalid magic; expected $expected');
      }
    }
  }

  int u8(String label) {
    require(1, label);
    return _data.getUint8(_offset++);
  }

  int u16(String label) {
    require(2, label);
    final value = _data.getUint16(_offset, Endian.little);
    _offset += 2;
    return value;
  }

  int u32(String label) {
    require(4, label);
    final value = _data.getUint32(_offset, Endian.little);
    _offset += 4;
    return value;
  }

  int nonzeroId(String label) {
    final value = u32(label);
    if (value == 0) fail('$label must be nonzero');
    return value;
  }

  int nonzeroVersion() {
    final value = u32('resource version');
    if (value == 0) fail('resource version must be nonzero');
    return value;
  }

  T enumValue<T extends Enum>(
    List<T> values,
    int wireValue,
    String label, {
    int firstWireValue = 0,
  }) {
    final index = wireValue - firstWireValue;
    if (index < 0 || index >= values.length) {
      fail('unknown $label $wireValue');
    }
    return values[index];
  }

  int product(int left, int right, String label) {
    if (left < 0 ||
        right < 0 ||
        (left != 0 && right > _maxSafeInteger ~/ left)) {
      fail('$label overflows checked arithmetic');
    }
    return left * right;
  }

  double finiteFloat(String label) {
    require(4, label);
    final value = _data.getFloat32(_offset, Endian.little);
    _offset += 4;
    if (!value.isFinite) fail('$label must be finite');
    return value;
  }

  double unitFloat(String label) {
    final value = finiteFloat(label);
    if (value < 0 || value > 1) fail('$label must be in [0, 1]');
    return value;
  }

  Float32List float32List(int count, String label) {
    final byteCount = product(count, 4, '$label byte length');
    require(byteCount, label);
    final values = Float32List(count);
    for (var index = 0; index < count; index++) {
      final value = _data.getFloat32(_offset, Endian.little);
      if (!value.isFinite) fail('$label contains a non-finite float');
      values[index] = value;
      _offset += 4;
    }
    return values.asUnmodifiableView();
  }

  Float32List attribute(int vertexCount, int components, String label) {
    final byteLength = u32('$label byte length');
    final expected = product(
      product(vertexCount, components, '$label floats'),
      4,
      '$label bytes',
    );
    if (byteLength != expected) fail('$label byte length is not exact');
    return float32List(vertexCount * components, '$label attribute');
  }

  Uint32List indices(int count, int vertexCount) {
    final byteCount = product(count, 4, 'index byte length');
    require(byteCount, 'indices');
    final values = Uint32List(count);
    for (var index = 0; index < count; index++) {
      final value = _data.getUint32(_offset, Endian.little);
      if (value >= vertexCount) fail('index $value exceeds vertex range');
      values[index] = value;
      _offset += 4;
    }
    return values.asUnmodifiableView();
  }

  Uint8List byteList(int count, String label) {
    require(count, label);
    final values = Uint8List.fromList(
      Uint8List.sublistView(_bytes, _offset, _offset + count),
    );
    _offset += count;
    return values.asUnmodifiableView();
  }
}
