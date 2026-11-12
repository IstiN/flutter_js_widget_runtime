part of 'js_three_protocol.dart';

/// Checked T1/R1 decoding. Legacy v1 and additive v2 streams are accepted.
/// No surface state is changed by this class.
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

  /// R1 stream version of the stream currently being decoded; command
  /// decoders in [_r1CommandDecoders] read it for versioned tails.
  var _streamVersion = 1;

  static const int t1HeaderBytes = 32;
  static const int r1HeaderBytes = 12;
  // v8: material stencil tail + colorWrite flag bit, OPCODE.STENCIL_CLEAR
  // mid-stream markers and the FRAME_TARGET_FLAGS.clearStencil frame bit.
  static const int latestR1Version = 8;
  static const int defaultMaxEnvelopeBytes = 64 * 1024 * 1024;
  static const int maxEncodedTextureBytes = 64 * 1024 * 1024;
  static const int maxCommandCount = 100000;
  static const int maxVertexCount = 4000000;
  static const int maxIndexCount = 12000000;
  static const int maxDrawBatchPartCount = 65536;
  static const int maxDrawBatchInstanceCount = 1000000;
  static const int maxClippingPlaneCount = 16;
  static const int maxRenderTargetSize = 8192;
  static const int maxRenderTargetPixels = 16 * 1024 * 1024;
  static const int maxRenderTargetCount = 16;

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
    if (version < 1 || version > latestR1Version) {
      reader.fail('unsupported R1 version $version');
    }
    _streamVersion = version;
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
      commands.add(_decodeCommand(opcode, body, version));
      body.requireEnd('opcode $opcode body');
    }
    reader.requireEnd('R1 stream');
    return JsThreeR1Stream._(version, List.unmodifiable(commands));
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
    Uint32List? wireIndices;
    if (body.remaining != 0) {
      if (header.primitive != JsThreePrimitive.triangles) {
        body.fail('wire indices require triangle geometry');
      }
      final wireIndexCount = body.u32('wire index count');
      if (wireIndexCount > maxIndexCount) {
        body.fail('wire index count exceeds $maxIndexCount');
      }
      if (wireIndexCount % 2 != 0) {
        body.fail('wire index count has an incomplete line');
      }
      wireIndices = body.indices(wireIndexCount, header.vertexCount);
    }
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
      wireIndices: wireIndices,
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
    if (flags & ~0xff != 0) body.fail('unknown texture flag');
    final cube = flags & 0x80 != 0;
    final byteLength = body.u32('texture data length');
    if (encoding == JsThreeTextureEncoding.rawRgba8) {
      if (width == 0 || height == 0) {
        body.fail('raw RGBA8 texture dimensions must be nonzero');
      }
      final expected = body.product(
        body.product(width, height, 'raw texture pixels'),
        cube ? 24 : 4,
        'raw texture bytes',
      );
      if (byteLength != expected) {
        body.fail(
          cube
              ? 'raw RGBA8 cube byte length must match six faces'
              : 'raw RGBA8 byte length does not match dimensions',
        );
      }
    } else {
      if (cube) body.fail('cube textures require raw RGBA8 encoding');
      if (byteLength == 0 || byteLength > maxEncodedTextureBytes) {
        body.fail('encoded texture data must be nonempty and at most 64 MiB');
      }
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

  JsThreeRenderTargetUpsert _renderTarget(_Reader body, int streamVersion) {
    if (streamVersion < 6) body.fail('render targets require R1 version 6');
    final targetId = body.nonzeroId('render target id');
    final version = body.nonzeroVersion();
    final width = body.u32('render target width');
    final height = body.u32('render target height');
    final textureId = body.nonzeroId('render target texture id');
    final flags = body.u32('render target flags');
    if (body.u32('render target reserved') != 0) {
      body.fail('render target reserved must be zero');
    }
    _validateTargetDimensions(body, width, height);
    if (flags & ~0x17f != 0 || flags & 0x70 != 0) {
      body.fail('invalid bounded render target flags');
    }
    return JsThreeRenderTargetUpsert(
      targetId: targetId,
      version: version,
      width: width,
      height: height,
      textureId: textureId,
      flags: flags,
    );
  }

  JsThreeMaterialUpsert _material(_Reader body, int streamVersion) {
    final id = body.nonzeroId('material id');
    final version = body.nonzeroVersion();
    final kind = body.enumValue(
      JsThreeMaterialKind.values,
      body.u32('material kind'),
      'material kind',
    );
    final mapTextureId = body.u32('map texture id');
    final flags = body.u32('material flags');
    _validateMaterialFlags(body, flags, streamVersion);
    _validateMaterialWireframeFlag(body, flags, kind);
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
    final clip = streamVersion >= 3
        ? _materialClipTail(body)
        : (clipId: 0, clipFlags: 0);
    final clipId = clip.clipId;
    final clipFlags = clip.clipFlags;
    final slots = switch (streamVersion) {
      >= 4 => _materialTextureSlotTail(body),
      _ => (
        alphaMapTextureId: 0,
        envMapTextureId: 0,
        envMapIntensity: 1.0,
        mapUvMatrix: _threeIdentityUvMatrix,
        alphaMapUvMatrix: _threeIdentityUvMatrix,
      ),
    };
    final v5 = switch (streamVersion) {
      >= 5 => _materialV5Tail(body, kind),
      _ => (matcapTextureId: 0, gradientMapTextureId: 0, spriteRotation: 0.0),
    };
    final v6 = switch (streamVersion) {
      >= 6 => _materialV6Tail(body, kind),
      _ => (
        normalMapTextureId: 0,
        normalScaleX: 1.0,
        normalScaleY: 1.0,
        bumpMapTextureId: 0,
        bumpScale: 1.0,
        roughnessMapTextureId: 0,
        metalnessMapTextureId: 0,
      ),
    };
    final stencilBytes = _materialStencilBytes(streamVersion, flags);
    final phong = _phongMaterial(body, kind, stencilBytes);
    final emissive = _emissiveMaterial(body, kind, stencilBytes);
    final dubois = switch (streamVersion) {
      >= 6 => _materialDuboisTail(body, kind, mapTextureId),
      _ => (
        mapRightTextureId: 0,
        left: Float32List(12).asUnmodifiableView(),
        right: Float32List(12).asUnmodifiableView(),
      ),
    };
    final stencil = _materialStencilTail(body, stencilBytes);
    return JsThreeMaterialUpsert._(
      materialId: id,
      version: version,
      kind: kind,
      mapTextureId: mapTextureId,
      mapRightTextureId: dubois.mapRightTextureId,
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
      specularR: phong.r,
      specularG: phong.g,
      specularB: phong.b,
      shininess: phong.shininess,
      emissiveR: emissive.r,
      emissiveG: emissive.g,
      emissiveB: emissive.b,
      emissiveIntensity: emissive.intensity,
      clipId: clipId,
      clipFlags: clipFlags,
      alphaMapTextureId: slots.alphaMapTextureId,
      envMapTextureId: slots.envMapTextureId,
      envMapIntensity: slots.envMapIntensity,
      mapUvMatrix: slots.mapUvMatrix,
      alphaMapUvMatrix: slots.alphaMapUvMatrix,
      duboisLeftMatrix: dubois.left,
      duboisRightMatrix: dubois.right,
      matcapTextureId: v5.matcapTextureId,
      gradientMapTextureId: v5.gradientMapTextureId,
      spriteRotation: v5.spriteRotation,
      normalMapTextureId: v6.normalMapTextureId,
      normalScaleX: v6.normalScaleX,
      normalScaleY: v6.normalScaleY,
      bumpMapTextureId: v6.bumpMapTextureId,
      bumpScale: v6.bumpScale,
      roughnessMapTextureId: v6.roughnessMapTextureId,
      metalnessMapTextureId: v6.metalnessMapTextureId,
      stencilWrite: stencil?.stencilWrite ?? false,
      stencilFunc: stencil?.stencilFunc ?? JsThreeStencilFunc.always,
      stencilRef: stencil?.stencilRef ?? 0,
      stencilFuncMask: stencil?.stencilFuncMask ?? 255,
      stencilWriteMask: stencil?.stencilWriteMask ?? 255,
      stencilFailOp: stencil?.stencilFailOp ?? JsThreeStencilOp.keep,
      stencilZFailOp: stencil?.stencilZFailOp ?? JsThreeStencilOp.keep,
      stencilZPassOp: stencil?.stencilZPassOp ?? JsThreeStencilOp.keep,
    );
  }

  /// The v8 stencil tail size (32 bytes, the LAST bytes of the material
  /// body) or 0: the tail exists only on v8 streams with flag bit 11, and
  /// stenciless v8 bodies stay byte-identical to v7.
  static int _materialStencilBytes(int streamVersion, int flags) =>
      streamVersion >= 8 && flags & 0x800 != 0 ? 32 : 0;

  /// Decodes the R1 v8 stencil tail: the last 32 bytes of the material body
  /// (upstream `Material.stencil*` as raw GL enums). The GL enum tables are
  /// sparse, so unknown encodings are rejected loudly; reference values and
  /// masks must fit the bounded lane's 8-bit stencil attachment.
  ({
    bool stencilWrite,
    JsThreeStencilFunc stencilFunc,
    int stencilRef,
    int stencilFuncMask,
    int stencilWriteMask,
    JsThreeStencilOp stencilFailOp,
    JsThreeStencilOp stencilZFailOp,
    JsThreeStencilOp stencilZPassOp,
  })?
  _materialStencilTail(_Reader body, int stencilBytes) {
    if (stencilBytes == 0) return null;
    if (body.remaining != stencilBytes) {
      body.fail(
        'material stencil tail must be the last $stencilBytes body bytes',
      );
    }
    final stencilWrite = body.u32('material stencil write');
    if (stencilWrite > 1) body.fail('material stencil write must be 0 or 1');
    final stencilFunc = _stencilEnum(
      body,
      JsThreeStencilFunc.tryWire,
      'material stencil func',
    );
    final stencilRef = _stencilByte(body, 'material stencil reference');
    final stencilFuncMask = _stencilByte(body, 'material stencil func mask');
    final stencilWriteMask = _stencilByte(body, 'material stencil write mask');
    final stencilFailOp = _stencilEnum(
      body,
      JsThreeStencilOp.tryWire,
      'material stencil fail op',
    );
    final stencilZFailOp = _stencilEnum(
      body,
      JsThreeStencilOp.tryWire,
      'material stencil zfail op',
    );
    final stencilZPassOp = _stencilEnum(
      body,
      JsThreeStencilOp.tryWire,
      'material stencil zpass op',
    );
    return (
      stencilWrite: stencilWrite == 1,
      stencilFunc: stencilFunc,
      stencilRef: stencilRef,
      stencilFuncMask: stencilFuncMask,
      stencilWriteMask: stencilWriteMask,
      stencilFailOp: stencilFailOp,
      stencilZFailOp: stencilZFailOp,
      stencilZPassOp: stencilZPassOp,
    );
  }

  /// Reads one u32 GL enum through [tryWire]; unknown encodings fail loudly.
  static T _stencilEnum<T extends Enum>(
    _Reader body,
    T? Function(int wireValue) tryWire,
    String label,
  ) {
    final wire = body.u32(label);
    final value = tryWire(wire);
    if (value == null) {
      body.fail('unknown $label 0x${wire.toRadixString(16)}');
    }
    return value;
  }

  /// Reads one u32 that must fit the 8-bit stencil attachment.
  static int _stencilByte(_Reader body, String label) {
    final value = body.u32(label);
    if (value > maxStencilByteValue) {
      body.fail('$label must fit an 8-bit stencil buffer');
    }
    return value;
  }

  ({int clipId, int clipFlags}) _materialClipTail(_Reader body) {
    final clipId = body.u32('material clip id');
    final clipFlags = body.u32('material clip flags');
    if (clipFlags & ~3 != 0) body.fail('unknown material clip flag');
    return (clipId: clipId, clipFlags: clipFlags);
  }

  ({int mapRightTextureId, Float32List left, Float32List right})
  _materialDuboisTail(_Reader body, JsThreeMaterialKind kind, int mapId) {
    final mapRightTextureId = body.u32('anaglyph right texture id');
    for (var index = 0; index < 3; index++) {
      if (body.u32('anaglyph texture reserved') != 0) {
        body.fail('anaglyph texture reserved fields must be zero');
      }
    }
    final left = body.float32List(12, 'Dubois left matrix');
    final right = body.float32List(12, 'Dubois right matrix');
    _validateDuboisPadding(body, left);
    _validateDuboisPadding(body, right);
    if (kind == JsThreeMaterialKind.anaglyph) {
      if (mapId == 0 || mapRightTextureId == 0) {
        body.fail('anaglyph requires left and right textures');
      }
    } else if (kind != JsThreeMaterialKind.postProcessing &&
        (mapRightTextureId != 0 ||
            left.any((value) => value != 0) ||
            right.any((value) => value != 0))) {
      body.fail('Dubois payload requires an anaglyph/postprocessing material');
    }
    return (mapRightTextureId: mapRightTextureId, left: left, right: right);
  }

  void _validateDuboisPadding(_Reader body, Float32List matrix) {
    if (matrix[3] != 0 || matrix[7] != 0 || matrix[11] != 0) {
      body.fail('Dubois matrix padding must be zero');
    }
  }

  /// Decodes the R1 v6 material tail: tangentless normal-map texture id and
  /// the per-axis normal scale (only lit mesh materials may carry one).
  ({
    int normalMapTextureId,
    double normalScaleX,
    double normalScaleY,
    int bumpMapTextureId,
    double bumpScale,
    int roughnessMapTextureId,
    int metalnessMapTextureId,
  })
  _materialV6Tail(_Reader body, JsThreeMaterialKind kind) {
    final normalMapTextureId = body.u32('material normal map texture id');
    final normalScaleX = body.finiteFloat('material normal scale x');
    final normalScaleY = body.finiteFloat('material normal scale y');
    final bumpMapTextureId = body.u32('material bump map texture id');
    final bumpScale = body.finiteFloat('material bump scale');
    final roughnessMapTextureId = body.u32('material roughness map texture id');
    final metalnessMapTextureId = body.u32('material metalness map texture id');
    if ((roughnessMapTextureId != 0 || metalnessMapTextureId != 0) &&
        kind != JsThreeMaterialKind.meshStandard) {
      body.fail('roughness/metalness maps require a standard material');
    }
    if ((normalMapTextureId != 0 || bumpMapTextureId != 0) &&
        kind != JsThreeMaterialKind.meshLambert &&
        kind != JsThreeMaterialKind.meshPhong &&
        kind != JsThreeMaterialKind.meshStandard) {
      body.fail('normal/bump map requires a lit mesh material');
    }
    return (
      normalMapTextureId: normalMapTextureId,
      normalScaleX: normalScaleX,
      normalScaleY: normalScaleY,
      bumpMapTextureId: bumpMapTextureId,
      bumpScale: bumpScale,
      roughnessMapTextureId: roughnessMapTextureId,
      metalnessMapTextureId: metalnessMapTextureId,
    );
  }

  /// Decodes the R1 v5 material tail: matcap + gradient-map texture ids and
  /// the SpriteMaterial rotation (radians; zero for non-sprite materials).
  ({int matcapTextureId, int gradientMapTextureId, double spriteRotation})
  _materialV5Tail(_Reader body, JsThreeMaterialKind kind) {
    final matcapTextureId = body.u32('material matcap texture id');
    final gradientMapTextureId = body.u32('material gradient map texture id');
    final spriteRotation = body.finiteFloat('material sprite rotation');
    if (body.u32('material v5 reserved') != 0) {
      body.fail('material v5 reserved field must be zero');
    }
    if (matcapTextureId != 0 && kind != JsThreeMaterialKind.meshMatcap) {
      body.fail('matcap texture requires a matcap material');
    }
    if (gradientMapTextureId != 0 && kind != JsThreeMaterialKind.meshTon) {
      body.fail('gradient map requires a ton material');
    }
    if (spriteRotation != 0 && kind != JsThreeMaterialKind.meshBasic) {
      // SpriteMaterial rides the meshBasic kind; a rotation on any other
      // kind means the encoder and decoder disagree about the tail.
      body.fail('sprite rotation requires a sprite material');
    }
    return (
      matcapTextureId: matcapTextureId,
      gradientMapTextureId: gradientMapTextureId,
      spriteRotation: spriteRotation,
    );
  }

  ({double r, double g, double b, double shininess}) _phongMaterial(
    _Reader body,
    JsThreeMaterialKind kind,
    int stencilBytes,
  ) {
    if (kind != JsThreeMaterialKind.meshPhong) {
      return (r: 0.0, g: 0.0, b: 0.0, shininess: 0.0);
    }
    // The v8 stencil tail rides AFTER this payload; compare against the
    // pre-tail size so the stencil extension never rewrites these checks.
    final payloadBytes = body.remaining - stencilBytes;
    if (payloadBytes != 16 &&
        payloadBytes != 32 &&
        payloadBytes != 128 &&
        payloadBytes != 144) {
      body.fail('Phong material requires specular RGB and shininess');
    }
    final r = body.finiteFloat('material specular red');
    final g = body.finiteFloat('material specular green');
    final b = body.finiteFloat('material specular blue');
    final shininess = body.finiteFloat('material shininess');
    if (shininess < 0) body.fail('material shininess must be nonnegative');
    return (r: r, g: g, b: b, shininess: shininess);
  }

  ({double r, double g, double b, double intensity}) _emissiveMaterial(
    _Reader body,
    JsThreeMaterialKind kind,
    int stencilBytes,
  ) {
    final payloadBytes = body.remaining - stencilBytes;
    if (payloadBytes == 0 || payloadBytes == 112) {
      return (r: 0.0, g: 0.0, b: 0.0, intensity: 1.0);
    }
    if (kind != JsThreeMaterialKind.meshLambert &&
        kind != JsThreeMaterialKind.meshStandard &&
        kind != JsThreeMaterialKind.meshPhong &&
        kind != JsThreeMaterialKind.meshTon) {
      body.fail('emissive payload requires a lit mesh material');
    }
    if (payloadBytes != 16 && payloadBytes != 128) {
      body.fail('emissive payload requires RGB and intensity');
    }
    final r = body.finiteFloat('material emissive red');
    final g = body.finiteFloat('material emissive green');
    final b = body.finiteFloat('material emissive blue');
    final intensity = body.finiteFloat('material emissive intensity');
    if (intensity < 0) {
      body.fail('material emissive intensity must be nonnegative');
    }
    return (r: r, g: g, b: b, intensity: intensity);
  }

  JsThreeNodeUpsert _node(_Reader body, int streamVersion) {
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
    final sprite = _spriteCenter(body, streamVersion, kind);
    if (kind == JsThreeObjectKind.sprite &&
        (geometryId == 0 || materialId == 0)) {
      body.fail('sprite node requires geometry and material ids');
    }
    return JsThreeNodeUpsert._(
      nodeId: id,
      parentId: parentId,
      geometryId: geometryId,
      materialId: materialId,
      flags: flags,
      objectKind: kind,
      matrixWorld: matrixWorld,
      shadowFlags: shadowFlags,
      spriteCenterX: sprite.x,
      spriteCenterY: sprite.y,
      renderOrder: sprite.renderOrder,
    );
  }

  /// Reads the sprite center and render order (R1 v5+, render order from
  /// v7) and validates the center is only customized on sprites.
  ({double x, double y, double renderOrder}) _spriteCenter(
    _Reader body,
    int streamVersion,
    JsThreeObjectKind kind,
  ) {
    var x = 0.5;
    var y = 0.5;
    var renderOrder = 0.0;
    if (streamVersion < 5) return (x: x, y: y, renderOrder: renderOrder);
    x = body.finiteFloat('node sprite center x');
    y = body.finiteFloat('node sprite center y');
    if (streamVersion >= 7) {
      renderOrder = body.finiteFloat('node render order');
    } else if (body.u32('node reserved') != 0) {
      body.fail('node reserved field must be zero');
    }
    if (kind != JsThreeObjectKind.sprite && (x != 0.5 || y != 0.5)) {
      body.fail('sprite center requires a sprite node');
    }
    return (x: x, y: y, renderOrder: renderOrder);
  }

  JsThreeDrawBatchUpsert _drawBatch(_Reader body) {
    final nodeId = body.nonzeroId('batch node id');
    final version = body.nonzeroVersion();
    final instanceCount = body.u32('batch instance count');
    final flags = body.u32('batch flags');
    if (flags & ~3 != 0) {
      body.fail('only batch instancing and color flags are valid');
    }
    final instanced = flags & 1 != 0;
    final hasColors = flags & 2 != 0;
    if (!instanced && hasColors) {
      body.fail('instance colors require an instanced batch');
    }
    if (!instanced && instanceCount != 1) {
      body.fail('a non-instanced batch must have exactly one instance');
    }
    if (instanceCount > maxDrawBatchInstanceCount) {
      body.fail('batch instance count exceeds $maxDrawBatchInstanceCount');
    }
    final parts = _decodeBatchParts(body);
    final matrices = instanced
        ? body.float32List(
            body.product(instanceCount, 16, 'batch matrix floats'),
            'batch instance matrices',
          )
        : Float32List(0).asUnmodifiableView();
    final colors = hasColors
        ? body.float32List(
            body.product(instanceCount, 3, 'batch color floats'),
            'batch instance colors',
          )
        : Float32List(0).asUnmodifiableView();
    return JsThreeDrawBatchUpsert._(
      nodeId: nodeId,
      version: version,
      instanceCount: instanceCount,
      flags: flags,
      parts: List.unmodifiable(parts),
      instanceMatrices: matrices,
      instanceColors: colors,
    );
  }

  List<JsThreeDrawBatchPart> _decodeBatchParts(_Reader body) {
    final partCount = body.u32('batch part count');
    if (partCount == 0 || partCount > maxDrawBatchPartCount) {
      body.fail('batch part count outside 1..$maxDrawBatchPartCount');
    }
    final parts = <JsThreeDrawBatchPart>[];
    for (var index = 0; index < partCount; index++) {
      parts.add(_decodeBatchPart(body));
    }
    return parts;
  }

  JsThreeDrawBatchPart _decodeBatchPart(_Reader body) {
    final geometryId = body.nonzeroId('batch part geometry id');
    final materialId = body.nonzeroId('batch part material id');
    final offset = body.u32('batch part offset');
    final count = body.u32('batch part count');
    if (count == 0) body.fail('batch part count must be nonzero');
    if (offset > 0xffffffff - count) {
      body.fail('batch part offset/count overflows u32');
    }
    return JsThreeDrawBatchPart._(
      geometryId: geometryId,
      materialId: materialId,
      offset: offset,
      count: count,
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

  JsThreeLightUpsert _light(_Reader body, int version) {
    final id = body.nonzeroId('light id');
    final type = body.enumValue(
      JsThreeLightType.values,
      body.u32('light type'),
      'light type',
    );
    _checkLightVersion(type, version, body);
    final red = body.finiteFloat('light color red');
    final green = body.finiteFloat('light color green');
    final blue = body.finiteFloat('light color blue');
    final intensity = body.finiteFloat('light intensity');
    if (intensity < 0) body.fail('light intensity must be nonnegative');
    final position = body.float32List(3, 'light world position');
    final direction = body.float32List(3, 'light world direction');
    var groundRed = 0.0;
    var groundGreen = 0.0;
    var groundBlue = 0.0;
    var spotAngle = 0.0;
    var spotPenumbra = 0.0;
    var spotDistance = 0.0;
    var spotDecay = 0.0;
    if (type == JsThreeLightType.hemisphere) {
      final ground = _hemisphereGround(body);
      groundRed = ground.r;
      groundGreen = ground.g;
      groundBlue = ground.b;
    }
    if (type == JsThreeLightType.spot) {
      final spot = _spotLightParams(body);
      spotAngle = spot.angle;
      spotPenumbra = spot.penumbra;
      spotDistance = spot.distance;
      spotDecay = spot.decay;
    }
    if (type == JsThreeLightType.point && version >= 7) {
      // Point lights have no world direction: R1 v7 uses those legacy zero
      // lanes for decay and cutoff distance. Older streams retain their
      // direction payload verbatim and the previous zero-decay behavior.
      final point = _pointLightDistanceDecay(direction, body);
      spotDecay = point.decay;
      spotDistance = point.distance;
    }
    return JsThreeLightUpsert._(
      lightId: id,
      type: type,
      colorR: red,
      colorG: green,
      colorB: blue,
      intensity: intensity,
      worldPosition: position,
      worldDirection: direction,
      groundColorR: groundRed,
      groundColorG: groundGreen,
      groundColorB: groundBlue,
      spotAngle: spotAngle,
      spotPenumbra: spotPenumbra,
      spotDistance: spotDistance,
      spotDecay: spotDecay,
    );
  }

  /// Fails the stream when the light type needs a newer R1 version.
  void _checkLightVersion(JsThreeLightType type, int version, _Reader body) {
    final minVersion = switch (type) {
      JsThreeLightType.hemisphere => 2,
      JsThreeLightType.spot => 3,
      _ => 0,
    };
    if (minVersion == 0 || version >= minVersion) return;
    body.fail('${type.name} lights require R1 version $minVersion');
  }

  ({double r, double g, double b}) _hemisphereGround(_Reader body) {
    final red = body.finiteFloat('light ground color red');
    final green = body.finiteFloat('light ground color green');
    final blue = body.finiteFloat('light ground color blue');
    if (body.u32('light reserved') != 0) {
      body.fail('light reserved field must be zero');
    }
    return (r: red, g: green, b: blue);
  }

  /// R1 v7 point lights reuse the direction lanes for decay and cutoff
  /// distance; both must be nonnegative.
  ({double decay, double distance}) _pointLightDistanceDecay(
    Float32List direction,
    _Reader body,
  ) {
    final decay = direction[0];
    final distance = direction[1];
    if (decay < 0 || distance < 0) {
      body.fail('point light distance/decay must be nonnegative');
    }
    return (decay: decay, distance: distance);
  }

  ({double angle, double penumbra, double distance, double decay})
  _spotLightParams(_Reader body) {
    final angle = body.finiteFloat('spot light angle');
    final penumbra = body.finiteFloat('spot light penumbra');
    final distance = body.finiteFloat('spot light distance');
    final decay = body.finiteFloat('spot light decay');
    if (angle <= 0 || angle > math.pi / 2) {
      body.fail('spot light angle must be within (0, PI/2]');
    }
    if (penumbra < 0 || penumbra > 8) {
      // Upstream does not clamp penumbra; official examples tween above 1
      // (webgl_lights_spotlights: `penumbra: Math.random() + 1`).
      body.fail('spot light penumbra must be within [0, 8]');
    }
    if (distance < 0 || decay < 0) {
      body.fail('spot light distance/decay must be nonnegative');
    }
    return (angle: angle, penumbra: penumbra, distance: distance, decay: decay);
  }

  JsThreeSubmitFrame _frame(_Reader body, int version) {
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
    _validateFog(body, fogMode, fogNear, fogFar, version);
    final (toneMapping, fogDensity) = switch (version) {
      >= 4 => _frameToneFogTail(body, fogMode),
      _ => (JsThreeToneMapping.none, 0.0),
    };
    final pointShadow = switch (version) {
      >= 5 => _framePointShadowTail(body),
      _ => _noPointShadow,
    };
    final shadowWidth = body.u32('shadow map width');
    final shadowHeight = body.u32('shadow map height');
    final shadowBias = body.finiteFloat('shadow bias');
    final shadowNormalBias = body.finiteFloat('shadow normal bias');
    final shadowRadius = body.finiteFloat('shadow radius');
    final shadowMatrix = body.float32List(16, 'shadow matrix');
    final shadowLightType = _shadowLightType(body, version);
    _validateShadowMapDimensions(body, shadowWidth, shadowHeight);
    // A negative magnitude is the R1 marker for the recognised ShaderChunk
    // PCSS kernel; ordinary Basic/PCF shadows keep a positive radius.
    if (shadowRadius == 0) body.fail('shadow radius must be nonzero');
    if (shadowLightType != JsThreeShadowLightType.none.wireValue &&
        shadowWidth == 0) {
      body.fail('shadow light type requires a shadow map');
    }
    _validatePointShadowLight(
      body,
      pointShadow.hasPointShadow,
      shadowLightType,
    );
    final culledNodeIds = _optionalCulledIds(body, 'culled');
    final culledShadowNodeIds = _optionalCulledIds(body, 'culled shadow');
    final shadowContentRevision = body.remaining == 0
        ? null
        : body.u32('shadow content revision');
    final target = body.remaining == 0
        ? _legacyFrameTarget
        : _frameTargetTail(body, version);
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
      shadowLightType: shadowLightType,
      shadowMatrix: shadowMatrix,
      shadowContentRevision: shadowContentRevision,
      culledNodeIds: culledNodeIds,
      culledShadowNodeIds: culledShadowNodeIds,
      toneMapping: toneMapping,
      toneMappingExposure: exposure,
      fogDensity: fogDensity,
      hasPointShadow: pointShadow.hasPointShadow,
      pointShadowLightX: pointShadow.lightX,
      pointShadowLightY: pointShadow.lightY,
      pointShadowLightZ: pointShadow.lightZ,
      pointShadowFar: pointShadow.far,
      renderTargetId: target.targetId,
      targetWidth: target.width,
      targetHeight: target.height,
      viewportX: target.viewportX,
      viewportY: target.viewportY,
      viewportWidth: target.viewportWidth,
      viewportHeight: target.viewportHeight,
      scissorX: target.scissorX,
      scissorY: target.scissorY,
      scissorWidth: target.scissorWidth,
      scissorHeight: target.scissorHeight,
      frameFlags: target.flags,
      frameStartClearStencil: target.clearStencil,
    );
  }

  static const _FrameTarget _legacyFrameTarget = _FrameTarget(
    targetId: 0,
    width: 0,
    height: 0,
    viewportX: 0,
    viewportY: 0,
    viewportWidth: 0,
    viewportHeight: 0,
    scissorX: 0,
    scissorY: 0,
    scissorWidth: 0,
    scissorHeight: 0,
    flags: 3,
    clearStencil: true,
  );

  _FrameTarget _frameTargetTail(_Reader body, int streamVersion) {
    if (streamVersion < 6 || body.remaining != 60) {
      body.fail('invalid frame target trailer');
    }
    if (body.u32('frame target magic') != 0x4658534a) {
      body.fail('invalid frame target magic');
    }
    if (body.u32('frame target version') != 1) {
      body.fail('unsupported frame target version');
    }
    final targetId = body.u32('frame render target id');
    final width = body.u32('frame target width');
    final height = body.u32('frame target height');
    final viewport = _frameRect(body, 'viewport');
    final scissor = _frameRect(body, 'scissor');
    final flags = body.u32('frame target flags');
    // v8 adds the frame-start stencil-clear bit; older streams keep the
    // pre-v8 mask word.
    final flagMask = streamVersion >= 8 ? 0x1f : 0x0f;
    if (flags & ~flagMask != 0 || flags & 8 == 0) {
      body.fail('invalid frame target flags');
    }
    if (body.u32('frame target reserved') != 0) {
      body.fail('frame target reserved must be zero');
    }
    _validateFrameTargetDimensions(body, targetId, width, height);
    return _FrameTarget(
      targetId: targetId,
      width: width,
      height: height,
      viewportX: viewport.x,
      viewportY: viewport.y,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      scissorX: scissor.x,
      scissorY: scissor.y,
      scissorWidth: scissor.width,
      scissorHeight: scissor.height,
      flags: flags,
      clearStencil: streamVersion >= 8 ? flags & 0x10 != 0 : true,
    );
  }

  ({double x, double y, double width, double height}) _frameRect(
    _Reader body,
    String label,
  ) {
    final x = body.finiteFloat('$label x');
    final y = body.finiteFloat('$label y');
    final width = body.finiteFloat('$label width');
    final height = body.finiteFloat('$label height');
    if (x < 0 || y < 0 || width < 0 || height < 0) {
      body.fail('$label must be a nonnegative rectangle');
    }
    return (x: x, y: y, width: width, height: height);
  }

  void _validateFrameTargetDimensions(
    _Reader body,
    int targetId,
    int width,
    int height,
  ) {
    if (targetId == 0) {
      if (width != 0 || height != 0) {
        body.fail('main frame target dimensions must be zero');
      }
      return;
    }
    _validateTargetDimensions(body, width, height);
  }

  void _validateTargetDimensions(_Reader body, int width, int height) {
    if (width == 0 ||
        height == 0 ||
        width > JsThreeProtocolDecoder.maxRenderTargetSize ||
        height > JsThreeProtocolDecoder.maxRenderTargetSize ||
        width * height > JsThreeProtocolDecoder.maxRenderTargetPixels) {
      body.fail('render target dimensions exceed the bounded 2D budget');
    }
  }

  static const ({
    int hasPointShadow,
    double lightX,
    double lightY,
    double lightZ,
    double far,
  })
  _noPointShadow = (hasPointShadow: 0, lightX: 0, lightY: 0, lightZ: 0, far: 0);

  static void _validateShadowMapDimensions(
    _Reader body,
    int shadowWidth,
    int shadowHeight,
  ) {
    if ((shadowWidth == 0) != (shadowHeight == 0) ||
        shadowWidth > 8192 ||
        shadowHeight > 8192) {
      body.fail('shadow map dimensions must be zero or within 1..8192');
    }
  }

  static void _validatePointShadowLight(
    _Reader body,
    int hasPointShadow,
    int shadowLightType,
  ) {
    if (hasPointShadow != 0 &&
        shadowLightType != JsThreeShadowLightType.point.wireValue) {
      body.fail('point shadow fields require a point shadow light');
    }
    if (hasPointShadow == 0 &&
        shadowLightType == JsThreeShadowLightType.point.wireValue) {
      body.fail('point shadow light requires the point shadow fields');
    }
  }

  /// Decodes the R1 v5 frame tail naming the shadow-casting point light:
  /// flag + reserved u32, light world position and the depth-normalizing
  /// far plane used by the dual-paraboloid shadow pass.
  ({
    int hasPointShadow,
    double lightX,
    double lightY,
    double lightZ,
    double far,
  })
  _framePointShadowTail(_Reader body) {
    final hasPointShadow = body.u32('point shadow flag');
    if (hasPointShadow != 0 && hasPointShadow != 1) {
      body.fail('point shadow flag must be 0 or 1');
    }
    if (body.u32('point shadow reserved') != 0) {
      body.fail('point shadow reserved field must be zero');
    }
    final lightX = body.finiteFloat('point shadow light x');
    final lightY = body.finiteFloat('point shadow light y');
    final lightZ = body.finiteFloat('point shadow light z');
    final far = body.finiteFloat('point shadow far');
    if (hasPointShadow == 0 &&
        (lightX != 0 || lightY != 0 || lightZ != 0 || far != 0)) {
      body.fail('point shadow fields require an active point shadow');
    }
    if (hasPointShadow != 0 && far <= 0) {
      body.fail('point shadow far must be positive');
    }
    return (
      hasPointShadow: hasPointShadow,
      lightX: lightX,
      lightY: lightY,
      lightZ: lightZ,
      far: far,
    );
  }

  /// Linear fog needs an ordered range; FogExp2 arrived with R1 v4.
  void _validateFog(
    _Reader body,
    JsThreeFogMode fogMode,
    double fogNear,
    double fogFar,
    int version,
  ) {
    if (fogMode == JsThreeFogMode.linear &&
        (fogNear < 0 || fogFar <= fogNear)) {
      body.fail('linear fog requires 0 <= near < far');
    }
    if (fogMode == JsThreeFogMode.exp2 && version < 4) {
      body.fail('exp2 fog requires R1 version 4');
    }
  }

  /// Decodes the R1 v4 frame tail: tone mapping mode + FogExp2 density.
  (JsThreeToneMapping, double) _frameToneFogTail(
    _Reader body,
    JsThreeFogMode fogMode,
  ) {
    final toneMapping = body.enumValue(
      JsThreeToneMapping.values,
      body.u32('tone mapping'),
      'tone mapping',
    );
    final fogDensity = body.finiteFloat('fog density');
    if (fogDensity < 0) body.fail('fog density must be nonnegative');
    if (fogMode != JsThreeFogMode.exp2 && fogDensity != 0) {
      body.fail('fog density requires exp2 fog');
    }
    return (toneMapping, fogDensity);
  }

  /// Decodes the R1 v4 material texture-slot tail: alpha/env map ids,
  /// envMapIntensity and the two column-major 3x3 per-map UV transforms.
  ({
    int alphaMapTextureId,
    int envMapTextureId,
    double envMapIntensity,
    Float32List mapUvMatrix,
    Float32List alphaMapUvMatrix,
  })
  _materialTextureSlotTail(_Reader body) {
    final alphaMapTextureId = body.u32('material alpha map texture id');
    final envMapTextureId = body.u32('material env map texture id');
    final envMapIntensity = body.finiteFloat('material env map intensity');
    // Nonnegative = upstream reflection intensity. Negative = sign-encoded
    // CubeRefractionMapping refraction: |v| is material.refractionRatio
    // (three.js clamps it to [0, 1], so -1 is the valid floor) and the
    // fragment stage refracts the env sample instead of reflecting it.
    if (envMapIntensity < -1) {
      body.fail(
        'material env map intensity must be >= -1 (reflection intensity, or negative refraction ratio)',
      );
    }
    return (
      alphaMapTextureId: alphaMapTextureId,
      envMapTextureId: envMapTextureId,
      envMapIntensity: envMapIntensity,
      mapUvMatrix: body.float32List(9, 'material map uv matrix'),
      alphaMapUvMatrix: body.float32List(9, 'material alpha map uv matrix'),
    );
  }

  int _shadowLightType(_Reader body, int version) => version < 3
      ? JsThreeShadowLightType.none.wireValue
      : body
            .enumValue(
              JsThreeShadowLightType.values,
              body.u32('shadow light type'),
              'shadow light type',
            )
            .wireValue;

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
  4: (decoder, body) => decoder._node(body, decoder._streamVersion),
  5: (decoder, body) => JsThreeRemoveNode._(body.nonzeroId('node id')),
  6: (decoder, body) => decoder._camera(body),
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
