#version 460 core

layout(location = 5) in vec4 shadowPosition;
in vec3 worldPosition;
out vec4 outColor;

uniform ClippingInfo {
  vec4 clipPlanes[8];
  // x: plane count, y: intersection flag, z: clip shadows flag.
  vec4 clipCountFlags;
} clipping_info;

void main() {
  int clipCount = int(clipping_info.clipCountFlags.x + 0.5);
  bool clipShadows = clipping_info.clipCountFlags.z > 0.5;
  if (clipCount > 0 && clipShadows) {
    bool intersection = clipping_info.clipCountFlags.y > 0.5;
    int clippedCount = 0;
    for (int i = 0; i < 8; ++i) {
      if (i < clipCount) {
        bool clipped = dot(clipping_info.clipPlanes[i].xyz, worldPosition) <
                       clipping_info.clipPlanes[i].w;
        if (clipped && !intersection) discard;
        if (clipped) clippedCount++;
      }
    }
    if (intersection && clippedCount == clipCount) discard;
  }
  float depth = shadowPosition.z / shadowPosition.w;
  outColor = vec4(depth, depth, depth, 1.0);
}
