#version 460 core

layout(location = 5) in vec4 shadowPosition;
out vec4 outColor;

void main() {
  float depth = shadowPosition.z / shadowPosition.w;
  outColor = vec4(depth, depth, depth, 1.0);
}
