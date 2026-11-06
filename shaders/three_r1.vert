#version 460 core

in vec3 position;
in vec3 normal;
in vec2 uv;
in vec4 color;
in vec4 instanceModel0;
in vec4 instanceModel1;
in vec4 instanceModel2;
in vec4 instanceModel3;
in vec4 instanceColor;

layout(location = 0) out vec3 worldPosition;
layout(location = 1) out vec3 worldNormal;
layout(location = 6) out vec3 viewNormal;
layout(location = 7) out vec3 viewPosition;
layout(location = 8) out vec2 materialState;
layout(location = 2) out vec2 textureUv;
layout(location = 3) out vec4 vertexColor;
layout(location = 9) out vec4 instanceDiffuse;
layout(location = 4) out float viewDepth;
layout(location = 5) out vec4 shadowPosition;
// R1 v5: light-space position for the point-light dual-paraboloid shadow pass.
layout(location = 10) out vec3 pointShadowPosition;
// R1 v7: MeshDepthMaterial (kind 12) depth-viz lane — view depth normalized
// to [0, 1] over the camera's near..far range. The range is recovered here
// from the projection matrix because FrameInfo carries no camera near/far.
layout(location = 11) out float depthLinear01;

uniform VertexInfo {
  mat4 model;
  mat4 view;
  mat4 projection;
  vec4 pointSize;
  mat4 shadowMatrix;
  vec4 shadowNormalBiasReserved;
  // R1 v5: x sprite rotation (radians), y/z Sprite.center, w sprite flag.
  // For point-shadow passes the base uniforms change meaning instead:
  // shadowMatrix carries the light VIEW matrix and pointSize.y selects
  // 2.0 = front / 3.0 = back paraboloid face with the far plane in
  // shadowNormalBiasReserved.w.
  vec4 spriteParams;
} vertex_info;

// R1 v7 MeshDepthMaterial: recover (near, far) from the column-major
// projection matrix. Perspective (projection[2][3] = -1): m[2][2] =
// (f+n)/(n-f), m[3][2] = 2fn/(n-f), so near = B/(A-1), far = B/(A+1).
// Orthographic (projection[2][3] = 0): m[2][2] = 2/(n-f), m[3][2] =
// (f+n)/(n-f), so near = (B+1)/A, far = (B-1)/A.
vec2 jsrDepthClipRange() {
  float a = vertex_info.projection[2][2];
  float b = vertex_info.projection[3][2];
  bool perspective = vertex_info.projection[2][3] < -0.5;
  float near = perspective ? b / (a - 1.0) : (b + 1.0) / a;
  float far = perspective ? b / (a + 1.0) : (b - 1.0) / a;
  return vec2(near, far);
}

void main() {
  mat4 instanceModel = mat4(
    instanceModel0,
    instanceModel1,
    instanceModel2,
    instanceModel3
  );
  mat4 worldModel = vertex_info.model * instanceModel;
  vec4 world = worldModel * vec4(position, 1.0);

  // R1 v5 point-light shadow pass: dual-paraboloid warp. The classic
  // Heidrich/Seidel projection — a ray from the light origin maps to the
  // unit disk regardless of distance, so depth (stored per fragment by the
  // point-shadow fragment shader as the light-space length) stays exact.
  float pointShadowMode = vertex_info.pointSize.y >= 1.5 ? vertex_info.pointSize.y - 1.0 : 0.0;
  if (pointShadowMode >= 1.0) {
    vec4 lightSpace = vertex_info.shadowMatrix * vec4(world.xyz, 1.0);
    pointShadowPosition = lightSpace.xyz;
    float length_ = length(lightSpace.xyz);
    // front (mode 2.0 -> 1.0): z <= 0 hemisphere; back: z >= 0 mirrored on x.
    float sign_ = pointShadowMode < 1.5 ? 1.0 : -1.0;
    float denominator = max(length_ - sign_ * lightSpace.z, 0.0001);
    vec2 disk = vec2(lightSpace.x, sign_ * lightSpace.y) / denominator;
    gl_Position = vec4(disk, length_ * vertex_info.shadowNormalBiasReserved.w, 1.0);
    worldPosition = world.xyz;
    worldNormal = normal;
    viewNormal = vec3(0.0);
    viewPosition = vec3(0.0);
    materialState = vec2(0.0);
    textureUv = uv;
    vertexColor = color;
    instanceDiffuse = instanceColor;
    viewDepth = 0.0;
    depthLinear01 = 0.0;
    shadowPosition = vec4(0.0);
    return;
  }

  worldPosition = world.xyz;
  worldNormal = mat3(transpose(inverse(worldModel))) * normal;
  viewNormal = mat3(vertex_info.view) * worldNormal;
  materialState = vertex_info.pointSize.zw;
  if (materialState.x > 0.5 && materialState.x < 1.5) {
    viewNormal = -viewNormal;
  }
  vec3 shadowNormal = length(worldNormal) > 0.0 ? normalize(worldNormal) : vec3(0.0);
  shadowPosition = vertex_info.shadowMatrix *
      vec4(world.xyz + shadowNormal * vertex_info.shadowNormalBiasReserved.x, 1.0);
  textureUv = uv;
  vertexColor = color;
  instanceDiffuse = instanceColor;

  if (vertex_info.spriteParams.w > 0.5) {
    // THREE r186 sprite vertex math, verbatim shape: billboard the shared
    // quad in view space around the sprite's world origin, scaled by the
    // model matrix column lengths, rotated by SpriteMaterial.rotation and
    // anchored at Sprite.center. sizeAttenuation=false keeps a constant
    // screen size by scaling with the view depth (perspective cameras).
    vec4 mvPosition = vertex_info.view * (vertex_info.model * vec4(0.0, 0.0, 0.0, 1.0));
    vec2 scale = vec2(length(vertex_info.model[0].xyz), length(vertex_info.model[1].xyz));
    if (vertex_info.shadowNormalBiasReserved.z < 0.5) {
      scale *= max(-mvPosition.z, 0.0001);
    }
    vec2 alignedPosition = (position.xy -
        (vertex_info.spriteParams.yz - vec2(0.5))) * scale;
    float rotationCos = cos(vertex_info.spriteParams.x);
    float rotationSin = sin(vertex_info.spriteParams.x);
    vec2 rotatedPosition = vec2(
        rotationCos * alignedPosition.x - rotationSin * alignedPosition.y,
        rotationSin * alignedPosition.x + rotationCos * alignedPosition.y);
    mvPosition.xy += rotatedPosition;
    gl_Position = vertex_info.projection * mvPosition;
    viewPosition = -mvPosition.xyz;
    viewDepth = -mvPosition.z;
    depthLinear01 = (viewDepth - jsrDepthClipRange().x) /
        max(jsrDepthClipRange().y - jsrDepthClipRange().x, 0.0001);
    gl_Position.z = 0.5 * (gl_Position.z + gl_Position.w);
    gl_PointSize = vertex_info.pointSize.x;
    return;
  }

  gl_PointSize = vertex_info.pointSize.x;
  vec4 viewPosition4 = vertex_info.view * world;
  if (vertex_info.shadowNormalBiasReserved.z > 0.5 &&
      vertex_info.projection[2][3] < -0.5) {
    gl_PointSize *= vertex_info.shadowNormalBiasReserved.y / -viewPosition4.z;
  }
  viewPosition = -viewPosition4.xyz;
  viewDepth = -viewPosition4.z;
  vec2 depthRange = jsrDepthClipRange();
  depthLinear01 = (viewDepth - depthRange.x) / max(depthRange.y - depthRange.x, 0.0001);
  gl_Position = vertex_info.projection * viewPosition4;
  // WebGL clips Z to [-w, w], while Flutter GPU expects [0, w].
  // Remap both perspective and orthographic projections before the shadow
  // pass override; shadowPosition already uses the biased [0, 1] depth range.
  gl_Position.z = 0.5 * (gl_Position.z + gl_Position.w);
  if (vertex_info.pointSize.y > 0.5) {
    // Perspective (spot) shadow cameras divide xy by w; orthographic
    // directional cameras have w = 1, so this is a no-op for them.
    gl_Position = vec4(
        shadowPosition.xy * 2.0 - 1.0, shadowPosition.z, shadowPosition.w);
  }
}
