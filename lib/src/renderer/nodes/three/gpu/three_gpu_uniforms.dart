part of '../flutter_gpu_three_backend.dart';

gpu.BufferView _emplaceThreeUniform(
  FlutterGpuThreeBackend backend,
  ByteData data,
) {
  final padded = debugThreeAlignedUniform(
    data,
    backend._context.minimumUniformByteAlignment,
  );
  final blockLength = backend._hostBuffer.blockLengthInBytes;
  if (backend._uniformOffset >= blockLength) backend._uniformOffset = 0;
  final fillerLength = debugThreeUniformFillerLength(
    backend._uniformOffset,
    padded.lengthInBytes,
    blockLength,
  );
  if (fillerLength > 0) {
    backend._hostBuffer.emplace(ByteData(fillerLength));
    backend._uniformOffset = 0;
  }
  backend._uniformOffset += padded.lengthInBytes;
  return backend._hostBuffer.emplace(padded);
}

void _bindThreeDrawUniforms(
  FlutterGpuThreeBackend backend,
  gpu.RenderPass pass,
  _ThreeUniformSlots slots,
  ThreeDrawItem draw,
  ThreeDrawPlan plan,
  double pointSizeScale,
  double viewportHeight,
  gpu.BufferView frameUniform,
  gpu.BufferView lightsUniform,
) {
  pass.bindUniform(
    slots.vertex,
    _emplaceThreeUniform(
      backend,
      _threeVertexUniform(
        draw,
        plan,
        pointSizeScale,
        viewportHeight: viewportHeight,
      ),
    ),
  );
  pass.bindUniform(slots.frame, frameUniform);
  pass.bindUniform(slots.lights, lightsUniform);
  pass.bindUniform(
    slots.material,
    _emplaceThreeUniform(backend, _threeMaterialUniform(draw, plan)),
  );
  pass.bindUniform(
    slots.clipping,
    _emplaceThreeUniform(backend, _threeClippingUniform(plan, draw.material)),
  );
  final binding = backend._textureBinding(draw.material.mapTextureId);
  pass.bindTexture(slots.map, binding.texture, sampler: binding.sampler());
  final alphaBinding = backend._textureBinding(draw.material.alphaMapTextureId);
  pass.bindTexture(
    slots.alphaMap,
    alphaBinding.texture,
    sampler: alphaBinding.sampler(),
  );
  final envBinding = backend._textureBinding(draw.material.envMapTextureId);
  pass.bindTexture(
    slots.envMap,
    envBinding.texture,
    sampler: envBinding.sampler(),
  );
  final matcapBinding = backend._textureBinding(draw.material.matcapTextureId);
  pass.bindTexture(
    slots.matcap,
    matcapBinding.texture,
    sampler: matcapBinding.sampler(),
  );
  final gradientBinding = backend._textureBinding(
    draw.material.gradientMapTextureId,
  );
  pass.bindTexture(
    slots.gradientMap,
    gradientBinding.texture,
    sampler: gradientBinding.sampler(),
  );
}

gpu.BufferView _bindThreeUniform(
  FlutterGpuThreeBackend backend,
  gpu.RenderPass pass,
  gpu.UniformSlot slot,
  ByteData data,
) {
  final reflected = slot.sizeInBytes;
  if (reflected != data.lengthInBytes) {
    throw FlutterGpuThreeException(
      'shaderAbi',
      '${slot.uniformName} expects $reflected bytes, got ${data.lengthInBytes}',
    );
  }
  final view = _emplaceThreeUniform(backend, data);
  pass.bindUniform(slot, view);
  return view;
}

/// Converts the WebGL-style shadow UV matrix to Flutter GPU render-target UVs.
///
/// Impeller render targets have a top-left texel origin. Shadow rendering uses
/// the original matrix to produce clip coordinates; only the sampling matrix
/// used by the main pass flips V. Keeping the two matrices identical makes a
/// moving shadow camera sample a mirrored, incorrectly translated depth map.
@visibleForTesting
Float32List threeShadowSamplingMatrix(List<double> matrix) {
  final result = Float32List.fromList(matrix);
  result[1] = -result[1];
  result[5] = -result[5];
  result[9] = -result[9];
  result[13] = 1 - result[13];
  return result;
}

ByteData _threeVertexUniform(
  ThreeDrawItem draw,
  ThreeDrawPlan plan,
  double pointSizeScale, {
  double viewportHeight = 1,
  bool shadowPass = false,
  int pointShadowFace = 0,
}) {
  // ABI: 19 used vec4s (304 bytes) padded to the 320-byte VertexInfo the
  // ThreeR1Vertex spirv reflects (std140 rounds the struct to 5 mat4/vec4
  // multiples). The v5 lane shipped 336 bytes here, which the shadow-pass
  // ABI check rejects — 320 matches every pipeline's reflection.
  final data = ByteData(320);
  final frame = plan.frame!;
  _writeFloats(
    data,
    0,
    draw.autoInstanced ? _threeIdentityMatrix : draw.node.matrixWorld,
  );
  _writeFloats(data, 64, plan.camera!.matrixWorldInverse);
  _writeFloats(data, 128, plan.camera!.projectionMatrix);
  _writeFloats(data, 192, [
    draw.material.pointSize * pointSizeScale,
    // pointSize.y selects the pass: 0 main, 1 projected (directional/spot)
    // shadow, 2 point front paraboloid, 3 point back paraboloid (R1 v5).
    pointShadowFace > 0 ? 1.0 + pointShadowFace : (shadowPass ? 1 : 0),
    draw.material.side.wireValue.toDouble(),
    draw.material.transparent ? 1 : 0,
  ]);
  final shadowMatrix = shadowPass
      ? frame.shadowMatrix
      : threeShadowSamplingMatrix(frame.shadowMatrix);
  _writeFloats(data, 208, shadowMatrix);
  _writeFloats(data, 272, [
    frame.shadowNormalBias,
    viewportHeight / (2 * pointSizeScale),
    draw.material.sizeAttenuation ? 1 : 0,
    pointShadowFace > 0 && frame.hasPointShadow != 0
        ? 1 / frame.pointShadowFar
        : 0,
  ]);
  // R1 v5 spriteParams: SpriteMaterial rotation (radians), Sprite.center
  // pivot, w = billboard flag. Three r186 sprite_vertex shape; for
  // sizeAttenuation=false the quad keeps a constant screen size (see
  // three_r1.vert).
  final sprite = draw.node.objectKind == JsThreeObjectKind.sprite;
  _writeFloats(data, 288, [
    sprite ? draw.material.spriteRotation : 0,
    draw.node.spriteCenterX,
    draw.node.spriteCenterY,
    sprite ? 1 : 0,
  ]);
  return data;
}

bool _threeShadowActive(bool enabled, JsThreeSubmitFrame frame) =>
    enabled && frame.hasShadow;

double _threeShadowTexelSize(bool active, int dimension) =>
    active ? 1 / dimension : 0;

ByteData _threeFrameUniform(ThreeDrawPlan plan, {bool shadowEnabled = true}) {
  // 9 vec4s: camera/exposure, ambient, light counts, fog color+near,
  // fog far+mode+spot-shadow, shadow bias/texel/radius, tone mapping+fog
  // density (R1 v4 tail), point-light shadow light position + params
  // (R1 v5 tail; the shadow pass never binds FrameInfo).
  final data = ByteData(144);
  final frame = plan.frame!;
  final camera = plan.cameraPosition;
  _writeFloats(data, 0, [camera.x, camera.y, camera.z, frame.exposure]);
  _writeFloats(data, 16, [plan.ambient.r, plan.ambient.g, plan.ambient.b, 1]);
  _writeFloats(data, 32, [
    plan.directionalLights.length.toDouble(),
    plan.pointLights.length.toDouble(),
    plan.hemisphereLights.length.toDouble(),
    plan.spotLights.length.toDouble(),
  ]);
  _writeFloats(data, 48, [
    frame.fogColorR,
    frame.fogColorG,
    frame.fogColorB,
    frame.fogNear,
  ]);
  _writeFloats(data, 64, [
    frame.fogFar,
    frame.fogMode.index.toDouble(),
    frame.hasSpotShadow ? 1 : 0,
    0,
  ]);
  final shadowActive = _threeShadowActive(shadowEnabled, frame);
  _writeFloats(data, 80, [
    frame.shadowBias,
    _threeShadowTexelSize(shadowActive, frame.shadowMapWidth),
    _threeShadowTexelSize(shadowActive, frame.shadowMapHeight),
    frame.shadowRadius,
  ]);
  // Tone mapping mode carries the three.js constant verbatim (0 none,
  // 1 linear, 2 reinhard, 3 cineon, 4 ACES, 6 AgX, 7 neutral); fog density
  // is only meaningful for mode 2 (exp2) fog.
  _writeFloats(data, 96, [
    frame.toneMapping.wireValue.toDouble(),
    frame.fogMode == JsThreeFogMode.exp2 ? frame.fogDensity : 0,
    0,
    0,
  ]);
  final pointShadowActive = shadowEnabled && frame.hasPointShadow != 0;
  _writeFloats(data, 112, [
    pointShadowActive ? 1 : 0,
    frame.pointShadowLightX,
    frame.pointShadowLightY,
    frame.pointShadowLightZ,
  ]);
  // x = 1/far depth normalization, y = paraboloid texel footprint.
  _writeFloats(data, 128, [
    pointShadowActive && frame.pointShadowFar > 0
        ? 1 / frame.pointShadowFar
        : 0,
    _threeShadowTexelSize(pointShadowActive, frame.shadowMapWidth),
    0,
    0,
  ]);
  return data;
}

ByteData _threeLightsUniform(ThreeDrawPlan plan) {
  final data = ByteData(832);
  for (var index = 0; index < plan.directionalLights.length; index++) {
    final light = plan.directionalLights[index];
    _writeFloats(data, index * 16, [
      light.worldDirection[0],
      light.worldDirection[1],
      light.worldDirection[2],
      light.intensity,
    ]);
    _writeFloats(data, 64 + index * 16, [
      light.colorR,
      light.colorG,
      light.colorB,
      1,
    ]);
  }
  for (var index = 0; index < plan.pointLights.length; index++) {
    final light = plan.pointLights[index];
    _writeFloats(data, 128 + index * 16, [
      light.worldPosition[0],
      light.worldPosition[1],
      light.worldPosition[2],
      light.intensity,
    ]);
    _writeFloats(data, 256 + index * 16, [
      light.colorR,
      light.colorG,
      light.colorB,
      1,
    ]);
  }
  for (var index = 0; index < plan.hemisphereLights.length; index++) {
    final light = plan.hemisphereLights[index];
    _writeFloats(data, 384 + index * 16, [
      light.worldDirection[0],
      light.worldDirection[1],
      light.worldDirection[2],
      light.intensity,
    ]);
    _writeFloats(data, 448 + index * 16, [
      light.colorR,
      light.colorG,
      light.colorB,
      1,
    ]);
    _writeFloats(data, 512 + index * 16, [
      light.groundColorR,
      light.groundColorG,
      light.groundColorB,
      1,
    ]);
  }
  for (var index = 0; index < plan.spotLights.length; index++) {
    final light = plan.spotLights[index];
    final cosOuter = math.cos(light.spotAngle);
    final cosInner = math.cos(light.spotAngle * (1 - light.spotPenumbra));
    final base = 576 + index * 16;
    _writeFloats(data, base, [
      light.colorR,
      light.colorG,
      light.colorB,
      light.intensity,
    ]);
    _writeFloats(data, base + 64, [
      light.worldPosition[0],
      light.worldPosition[1],
      light.worldPosition[2],
      cosOuter,
    ]);
    _writeFloats(data, base + 128, [
      light.worldDirection[0],
      light.worldDirection[1],
      light.worldDirection[2],
      cosInner,
    ]);
    _writeFloats(data, base + 192, [
      light.spotDecay,
      light.spotDistance,
      0,
      0,
    ]);
  }
  return data;
}

const _threeBooleanFloat = <bool, double>{false: 0, true: 1};

const int threeMaxClippingPlanes = 8;

/// Per-draw clipping block: 8 world-space planes plus
/// [count, intersection, clipShadows, reserved].
ByteData _threeClippingUniform(
  ThreeDrawPlan plan,
  JsThreeMaterialUpsert material,
) {
  final data = ByteData(144);
  if (!material.hasClipping) return data;
  final set = plan.clippings[material.clipId];
  if (set == null) return data;
  final count = math.min(set.planeCount, threeMaxClippingPlanes);
  for (var index = 0; index < count; index++) {
    final offset = index * 4;
    _writeFloats(data, index * 16, [
      set.planes[offset],
      set.planes[offset + 1],
      set.planes[offset + 2],
      // three.js Plane semantics: the surface is `normal·p + constant = 0`
      // and fragments are kept on the `normal·p + constant >= 0` side. The
      // R1 shaders discard when `dot(normal, p) < w`, so the bound w must be
      // NEGATED — writing the raw constant flips the visible half-space and
      // discards the entire mesh (webgl_clipping showed empty-with-planes).
      -set.planes[offset + 3],
    ]);
  }
  _writeFloats(data, 128, [
    count.toDouble(),
    material.clipIntersection ? 1 : 0,
    material.clipShadows ? 1 : 0,
    0,
  ]);
  return data;
}

ByteData _threeMaterialUniform(ThreeDrawItem draw, [ThreeDrawPlan? plan]) {
  final material = draw.material;
  // 14 vec4s: base 5 (color/kind/flags/specular/emissive, R1 v1..v3 ABI)
  // plus the v4 texture-slot tail — alpha/env flags+intensity and the two
  // column-major 3x3 UV transforms padded to one vec4 per column — plus
  // the v5 tail: matcap/gradient flags with the cube atlas dimensions
  // (textureSize() crashes the bundled spirv-cross, so they ride here).
  final data = ByteData(224);
  _writeFloats(
    data,
    0,
    draw.autoInstanced
        ? _threeWhiteInstanceColor
        : [material.colorR, material.colorG, material.colorB, material.opacity],
  );
  _writeFloats(data, 16, [
    material.roughness,
    material.metalness,
    material.alphaTest,
    material.kind.wireValue.toDouble(),
  ]);
  _writeFloats(data, 32, [
    _threeBooleanFloat[material.vertexColors]!,
    _threeBooleanFloat[material.flatShading]!,
    _threeBooleanFloat[material.mapTextureId != 0]!,
    _threeBooleanFloat[draw.node.receiveShadow]!,
  ]);
  _writeFloats(data, 48, [
    material.specularR,
    material.specularG,
    material.specularB,
    material.shininess,
  ]);
  _writeFloats(data, 64, [
    material.emissiveR,
    material.emissiveG,
    material.emissiveB,
    material.emissiveIntensity,
  ]);
  _writeFloats(data, 80, [
    _threeBooleanFloat[material.alphaMapTextureId != 0]!,
    _threeBooleanFloat[material.envMapTextureId != 0]!,
    material.envMapIntensity,
    0,
  ]);
  // three.js Matrix3.elements arrive column-major; each column is written
  // as one vec4 (w padding) so the shader rebuilds mat3(col0, col1, col2).
  _writeUvMatrix(data, 96, material.mapUvMatrix);
  _writeUvMatrix(data, 144, material.alphaMapUvMatrix);
  final envTexture = material.envMapTextureId == 0
      ? null
      : plan?.textures[material.envMapTextureId];
  final cubeEnv = envTexture?.isCube ?? false;
  _writeFloats(data, 192, [
    _threeBooleanFloat[material.matcapTextureId != 0]!,
    _threeBooleanFloat[material.gradientMapTextureId != 0]!,
    _threeBooleanFloat[cubeEnv]!,
    cubeEnv ? (envTexture!.width * 3).toDouble() : 0,
  ]);
  _writeFloats(data, 208, [
    cubeEnv ? (envTexture!.height * 2).toDouble() : 0,
    0,
    0,
    0,
  ]);
  return data;
}

void _writeUvMatrix(ByteData data, int offset, Float32List matrix) {
  for (var column = 0; column < 3; column++) {
    _writeFloats(data, offset + column * 16, [
      matrix[column * 3],
      matrix[column * 3 + 1],
      matrix[column * 3 + 2],
      0,
    ]);
  }
}
