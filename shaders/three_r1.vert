#version 460 core

in vec3 position;
in vec3 normal;
in vec2 uv;
in vec4 color;
in vec4 instanceModel0;
in vec4 instanceModel1;
in vec4 instanceModel2;
in vec4 instanceModel3;

out vec3 worldPosition;
out vec3 worldNormal;
out vec2 textureUv;
out vec4 vertexColor;
out float viewDepth;
layout(location = 5) out vec4 shadowPosition;

uniform VertexInfo {
  mat4 model;
  mat4 view;
  mat4 projection;
  vec4 pointSize;
  mat4 shadowMatrix;
  vec4 shadowNormalBiasReserved;
} vertex_info;

void main() {
  mat4 instanceModel = mat4(
    instanceModel0,
    instanceModel1,
    instanceModel2,
    instanceModel3
  );
  mat4 worldModel = vertex_info.model * instanceModel;
  vec4 world = worldModel * vec4(position, 1.0);
  worldPosition = world.xyz;
  worldNormal = mat3(transpose(inverse(worldModel))) * normal;
  vec3 shadowNormal = length(worldNormal) > 0.0 ? normalize(worldNormal) : vec3(0.0);
  shadowPosition = vertex_info.shadowMatrix *
      vec4(world.xyz + shadowNormal * vertex_info.shadowNormalBiasReserved.x, 1.0);
  textureUv = uv;
  vertexColor = color;
  gl_PointSize = vertex_info.pointSize.x;
  vec4 viewPosition = vertex_info.view * world;
  viewDepth = -viewPosition.z;
  gl_Position = vertex_info.projection * viewPosition;
  if (vertex_info.pointSize.y > 0.5) {
    gl_Position = vec4(
        shadowPosition.xy * 2.0 - 1.0, shadowPosition.z, 1.0);
  }
}
