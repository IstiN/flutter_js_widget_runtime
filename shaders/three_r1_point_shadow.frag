#version 460 core

// R1 v5 point-light dual-paraboloid shadow pass: the vertex stage warped
// each caster into one light-space paraboloid disk (front face = z <= 0
// hemisphere, back face = z >= 0) and this stage stores the exact
// light-space DISTANCE per texel. The main pass reconstructs the same
// paraboloid UV from (fragment - light) and compares distances.
// The material block is declared stage-locally (like ClippingInfo in the
// directional/spot shadow shader): alphaTest cutouts must discard in the
// shadow pass too (upstream depth materials honor alphaTest; the official
// webgl_shadowmap_pointlight alpha shells rely on it). Per-map UV matrix
// transforms are NOT applied here — the shadow lane samples the alphaMap at
// raw geometry UVs.

layout(location = 10) in vec3 pointShadowPosition;
layout(location = 0) in vec3 worldPosition;
layout(location = 2) in vec2 textureUv;
layout(location = 3) in vec4 vertexColor;
layout(location = 9) in vec4 instanceDiffuse;

out vec4 outColor;

uniform sampler2D alphaMapTexture;

uniform ClippingInfo {
  vec4 clipPlanes[16];
  // x: plane count, y: intersection flag, z: clip shadows flag.
  vec4 clipCountFlags;
} clipping_info;

uniform MaterialInfo {
  vec4 colorOpacity;
  vec4 roughnessMetalnessAlphaTestKind;
  vec4 vertexColorsFlatShadingHasMapReserved;
  vec4 specularShininess;
  vec4 emissiveIntensity;
  // x: has alphaMap, y: has envMap, z: envMapIntensity.
  vec4 alphaEnvIntensity;
  // Per-map UV transforms (R1 v4), three.js Matrix3 column-major with one
  // vec4 per column; w padding is unused.
  vec4 mapUvColumn0;
  vec4 mapUvColumn1;
  vec4 mapUvColumn2;
  vec4 alphaMapUvColumn0;
  vec4 alphaMapUvColumn1;
  vec4 alphaMapUvColumn2;
  // R1 v5 tail: x = has matcap, y = has gradientMap, z = cube envMap atlas,
  // w = cube atlas width in texels (textureSize() is unusable: it crashes
  // the bundled spirv-cross, so dims ride the uniform).
  vec4 matcapGradientCube;
  // x = cube atlas height in texels; yzw reserved.
  vec4 atlasParams;
  // Recognized Dubois composite: right texture presence and two std140 mat3s.
  vec4 mapRightHas;
  vec4 duboisLeft0;
  vec4 duboisLeft1;
  vec4 duboisLeft2;
  vec4 duboisRight0;
  vec4 duboisRight1;
  vec4 duboisRight2;
  // R1 v9 tail: post params 18..33. Unused by the point-shadow stage, but
  // the declaration MUST match the main three_r1.frag MaterialInfo layout
  // exactly — the host encoder always writes the full 400-byte block and
  // the ABI check compares against this stage's reflected size (a missing
  // tail reflected 336 and failed every point-shadow draw, e.g. godrays).
  vec4 postParams[4];
} material_info;

void main() {
  int clipCount = int(clipping_info.clipCountFlags.x + 0.5);
  bool clipShadows = clipping_info.clipCountFlags.z > 0.5;
  if (clipCount > 0 && clipShadows) {
    bool intersection = clipping_info.clipCountFlags.y > 0.5;
    int clippedCount = 0;
    for (int i = 0; i < 16; ++i) {
      if (i < clipCount) {
        bool clipped = dot(clipping_info.clipPlanes[i].xyz, worldPosition) <
                       clipping_info.clipPlanes[i].w;
        if (clipped && !intersection) discard;
        if (clipped) clippedCount++;
      }
    }
    if (intersection && clippedCount == clipCount) discard;
  }
  vec4 albedo = material_info.colorOpacity * instanceDiffuse;
  if (material_info.vertexColorsFlatShadingHasMapReserved.x > 0.5) {
    albedo *= vertexColor;
  }
  // THREE alphamap_fragment: alpha modulates through the GREEN channel.
  if (material_info.alphaEnvIntensity.x > 0.5) {
    albedo.a *= texture(alphaMapTexture, textureUv).g;
  }
  if (albedo.a < material_info.roughnessMetalnessAlphaTestKind.z) {
    discard;
  }
  outColor = vec4(length(pointShadowPosition), 0.0, 0.0, 1.0);
}
