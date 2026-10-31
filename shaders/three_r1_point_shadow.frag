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
in vec3 worldPosition;
in vec2 textureUv;
in vec4 vertexColor;
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
  // z: alphaTest.
  vec4 roughnessMetalnessAlphaTestKind;
  // x: vertexColors flag.
  vec4 vertexColorsFlatShadingHasMapReserved;
  // x: hasAlphaMap.
  vec4 alphaEnvIntensity;
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
