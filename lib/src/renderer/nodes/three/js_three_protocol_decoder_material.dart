part of 'js_three_protocol.dart';

const _matcapOrEmissiveMaterialKinds = <JsThreeMaterialKind>{
  JsThreeMaterialKind.meshMatcap,
  JsThreeMaterialKind.meshLambert,
  JsThreeMaterialKind.meshStandard,
  JsThreeMaterialKind.meshPhong,
};

extension on JsThreeProtocolDecoder {
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
    final v5 = _materialV5ForVersion(body, streamVersion, kind);
    final v6 = _materialV6ForVersion(body, streamVersion, kind);
    final stencilBytes = _materialStencilBytes(streamVersion, flags);
    final postBytes =
        streamVersion >= 9 && kind == JsThreeMaterialKind.postProcessing
        ? 80
        : 0;
    final trailingBytes = stencilBytes + postBytes;
    final phong = _phongMaterial(body, kind, trailingBytes);
    final emissive = _emissiveMaterial(body, kind, trailingBytes);
    final post = postBytes == 0 ? null : _materialPostTail(body);
    final dubois = switch (streamVersion) {
      >= 6 => _materialDuboisTail(body, kind, mapTextureId),
      _ => (
        mapRightTextureId: 0,
        left: Float32List(12).asUnmodifiableView(),
        right: Float32List(12).asUnmodifiableView(),
      ),
    };
    if (post != null) {
      _validateMaterialPostOperation(body, dubois, post, mapTextureId);
    }
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
      postTexture3Id: post?.texture3Id ?? 0,
      postTexture4Id: post?.texture4Id ?? 0,
      postTexture5Id: post?.texture5Id ?? 0,
      postParams: post?.params ?? const <double>[],
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

  ({int texture3Id, int texture4Id, int texture5Id, Float32List params})
  _materialPostTail(_Reader body) {
    final texture3Id = body.u32('post texture 3 id');
    final texture4Id = body.u32('post texture 4 id');
    final texture5Id = body.u32('post texture 5 id');
    if (body.u32('post reserved') != 0) {
      body.fail('post reserved field must be zero');
    }
    final params = body.float32List(16, 'post params 18 through 33');
    return (
      texture3Id: texture3Id,
      texture4Id: texture4Id,
      texture5Id: texture5Id,
      params: params,
    );
  }

  void _validateMaterialPostOperation(
    _Reader body,
    ({int mapRightTextureId, Float32List left, Float32List right}) dubois,
    ({int texture3Id, int texture4Id, int texture5Id, Float32List params}) post,
    int mapId,
  ) {
    final wireOp = dubois.left[0];
    final op = wireOp.round();
    if (wireOp != op || op < 1 || op > 18) {
      body.fail('postprocessing operation must be an integer in 1..18');
    }
    if (op == 17 &&
        (mapId == 0 ||
            dubois.left[1] < 0 ||
            dubois.left[1] > 256 ||
            dubois.left[1] != dubois.left[1].round() ||
            (dubois.left[1] == 0) != (dubois.mapRightTextureId == 0))) {
      body.fail(
        'LUT postprocessing requires tDiffuse and matching size/atlas state',
      );
    }
    _validateBloomCompositeTextures(body, op, dubois, post, mapId);
    _validateBloomGaussianPairs(body, op, dubois.left);
  }

  void _validateBloomCompositeTextures(
    _Reader body,
    int op,
    ({int mapRightTextureId, Float32List left, Float32List right}) dubois,
    ({int texture3Id, int texture4Id, int texture5Id, Float32List params}) post,
    int mapId,
  ) {
    final extraTextures =
        post.texture3Id != 0 || post.texture4Id != 0 || post.texture5Id != 0;
    if (op == 15) {
      if (mapId == 0 ||
          dubois.mapRightTextureId == 0 ||
          post.texture3Id == 0 ||
          post.texture4Id == 0 ||
          post.texture5Id == 0) {
        body.fail('bloom composite requires all five mip textures');
      }
    } else if (extraTextures) {
      body.fail('extra post textures require the bloom composite operation');
    }
  }

  void _validateBloomGaussianPairs(_Reader body, int op, Float32List left) {
    if (op == 14) {
      final pairs = left[8];
      if (pairs != pairs.round() || pairs < 1 || pairs > 11) {
        body.fail('bloom Gaussian pair count must be an integer in 1..11');
      }
    }
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

  ({
    int normalMapTextureId,
    double normalScaleX,
    double normalScaleY,
    int bumpMapTextureId,
    double bumpScale,
    int roughnessMapTextureId,
    int metalnessMapTextureId,
  })
  _materialV6ForVersion(
    _Reader body,
    int streamVersion,
    JsThreeMaterialKind kind,
  ) => switch (streamVersion) {
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

  ({int matcapTextureId, int gradientMapTextureId, double spriteRotation})
  _materialV5ForVersion(
    _Reader body,
    int streamVersion,
    JsThreeMaterialKind kind,
  ) => switch (streamVersion) {
    >= 5 => _materialV5Tail(body, kind),
    _ => (matcapTextureId: 0, gradientMapTextureId: 0, spriteRotation: 0.0),
  };

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
    _validateMaterialV5Kind(
      body,
      kind,
      matcapTextureId,
      gradientMapTextureId,
      spriteRotation,
    );
    return (
      matcapTextureId: matcapTextureId,
      gradientMapTextureId: gradientMapTextureId,
      spriteRotation: spriteRotation,
    );
  }

  void _validateMaterialV5Kind(
    _Reader body,
    JsThreeMaterialKind kind,
    int matcapTextureId,
    int gradientMapTextureId,
    double spriteRotation,
  ) {
    if (matcapTextureId != 0 &&
        !_matcapOrEmissiveMaterialKinds.contains(kind)) {
      body.fail('matcap/emissive texture requires a compatible material');
    }
    if (gradientMapTextureId != 0 && kind != JsThreeMaterialKind.meshTon) {
      body.fail('gradient map requires a ton material');
    }
    if (spriteRotation != 0 && kind != JsThreeMaterialKind.meshBasic) {
      // SpriteMaterial rides the meshBasic kind; a rotation on any other
      // kind means the encoder and decoder disagree about the tail.
      body.fail('sprite rotation requires a sprite material');
    }
  }

  ({double r, double g, double b, double shininess}) _phongMaterial(
    _Reader body,
    JsThreeMaterialKind kind,
    int trailingBytes,
  ) {
    if (kind != JsThreeMaterialKind.meshPhong) {
      return (r: 0.0, g: 0.0, b: 0.0, shininess: 0.0);
    }
    // Versioned tails ride AFTER this payload; compare against the pre-tail
    // size so stencil/post extensions never rewrite these checks.
    final payloadBytes = body.remaining - trailingBytes;
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
    int trailingBytes,
  ) {
    final payloadBytes = body.remaining - trailingBytes;
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
}
