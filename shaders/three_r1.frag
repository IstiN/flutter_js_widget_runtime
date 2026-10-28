#version 460 core

#define MAX_DIRECTIONAL_LIGHTS 4
#define MAX_POINT_LIGHTS 8
#define PI 3.14159265358979323846
#define EPSILON 0.0001

in vec3 worldPosition;
in vec3 worldNormal;
in vec2 textureUv;
in vec4 vertexColor;
in float viewDepth;
layout(location = 5) in vec4 shadowPosition;

out vec4 outColor;

uniform sampler2D mapTexture;
uniform sampler2D shadowMapTexture;

uniform FrameInfo {
  vec4 cameraPositionExposure;
  vec4 ambientColor;
  vec4 lightCounts;
  vec4 fogColorNear;
  vec4 fogFarModeReserved;
  vec4 shadowBiasTexelRadius;
} frame_info;

uniform Lights {
  vec4 directionalDirectionIntensity[MAX_DIRECTIONAL_LIGHTS];
  vec4 directionalColor[MAX_DIRECTIONAL_LIGHTS];
  vec4 pointPositionIntensity[MAX_POINT_LIGHTS];
  vec4 pointColor[MAX_POINT_LIGHTS];
} lights;

uniform MaterialInfo {
  vec4 colorOpacity;
  vec4 roughnessMetalnessAlphaTestKind;
  vec4 vertexColorsFlatShadingHasMapReserved;
  vec4 specularShininess;
} material_info;

float distributionGgx(vec3 n, vec3 h, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float nDotH = max(dot(n, h), 0.0);
  float denominator = nDotH * nDotH * (a2 - 1.0) + 1.0;
  return a2 / max(PI * denominator * denominator, EPSILON);
}

float geometrySchlickGgx(float nDotV, float roughness) {
  float r = roughness + 1.0;
  float k = r * r / 8.0;
  return nDotV / max(nDotV * (1.0 - k) + k, EPSILON);
}

vec3 fresnelSchlick(float cosTheta, vec3 f0) {
  return f0 + (1.0 - f0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 standardLight(
  vec3 n,
  vec3 v,
  vec3 l,
  vec3 radiance,
  vec3 baseColor,
  vec3 f0,
  float roughness,
  float metalness
) {
  vec3 h = normalize(v + l);
  float nDotL = max(dot(n, l), 0.0);
  float nDotV = max(dot(n, v), 0.0);
  float d = distributionGgx(n, h, roughness);
  float g = geometrySchlickGgx(nDotV, roughness) *
            geometrySchlickGgx(nDotL, roughness);
  vec3 f = fresnelSchlick(max(dot(h, v), 0.0), f0);
  vec3 specular = d * g * f /
      max(4.0 * nDotV * nDotL, EPSILON);
  vec3 diffuse = (vec3(1.0) - f) * (1.0 - metalness) * baseColor / PI;
  return (diffuse + specular) * radiance * nDotL;
}

vec3 blinnPhongSpecular(vec3 n, vec3 v, vec3 l, vec3 specularColor, float shininess) {
  vec3 h = normalize(v + l);
  float nDotH = max(dot(n, h), 0.0);
  float vDotH = max(dot(v, h), 0.0);
  vec3 f = fresnelSchlick(vDotH, specularColor);
  float d = (shininess * 0.5 + 1.0) * pow(nDotH, shininess) / PI;
  return f * (0.25 * d);
}

vec3 linearToSrgb(vec3 value) {
  vec3 clamped = clamp(value, vec3(0.0), vec3(1.0));
  vec3 low = clamped * 12.92;
  vec3 high = 1.055 * pow(clamped, vec3(1.0 / 2.4)) - 0.055;
  return mix(low, high, step(vec3(0.0031308), clamped));
}

float directionalShadow() {
  if (frame_info.shadowBiasTexelRadius.y <= 0.0 ||
      material_info.vertexColorsFlatShadingHasMapReserved.w < 0.5) {
    return 1.0;
  }
  vec3 coord = shadowPosition.xyz / shadowPosition.w;
  if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0 ||
      coord.z < 0.0 || coord.z > 1.0) {
    return 1.0;
  }
  float currentDepth = coord.z + frame_info.shadowBiasTexelRadius.x;
  vec2 texel = frame_info.shadowBiasTexelRadius.yz *
               frame_info.shadowBiasTexelRadius.w;
  float visibility = 0.0;
  for (int x = -1; x <= 1; ++x) {
    for (int y = -1; y <= 1; ++y) {
      float depth = texture(
          shadowMapTexture, coord.xy + vec2(float(x), float(y)) * texel).r;
      visibility += currentDepth <= depth ? 1.0 : 0.0;
    }
  }
  return visibility / 9.0;
}

void main() {
  vec4 albedo = material_info.colorOpacity;
  if (material_info.vertexColorsFlatShadingHasMapReserved.x > 0.5) {
    albedo *= vertexColor;
  }
  if (material_info.vertexColorsFlatShadingHasMapReserved.z > 0.5) {
    albedo *= texture(mapTexture, textureUv);
  }
  if (albedo.a < material_info.roughnessMetalnessAlphaTestKind.z) {
    discard;
  }

  int kind = int(material_info.roughnessMetalnessAlphaTestKind.w + 0.5);
  vec3 color = albedo.rgb;
  if (kind != 0 && kind != 3 && kind != 4) {
    float normalLength = length(worldNormal);
    vec3 smoothNormal = normalLength > EPSILON
        ? worldNormal / normalLength
        : vec3(0.0, 0.0, 1.0);
    vec3 n = smoothNormal;
    if (material_info.vertexColorsFlatShadingHasMapReserved.y > 0.5) {
      vec3 faceNormal = normalize(cross(dFdx(worldPosition), dFdy(worldPosition)));
      float orientation = dot(faceNormal, smoothNormal);
      n = abs(orientation) < EPSILON
          ? faceNormal
          : faceNormal * sign(orientation);
    }
    if (!gl_FrontFacing) {
      n = -n;
    }
    vec3 v = normalize(frame_info.cameraPositionExposure.xyz - worldPosition);
    vec3 baseColor = albedo.rgb;
    color = baseColor * frame_info.ambientColor.rgb / PI;

    int directionalCount = int(frame_info.lightCounts.x + 0.5);
    int pointCount = int(frame_info.lightCounts.y + 0.5);
    float shadow = directionalShadow();
    if (kind == 1 || kind == 5) {
      for (int i = 0; i < MAX_DIRECTIONAL_LIGHTS; ++i) {
        if (i < directionalCount) {
          vec3 l = normalize(lights.directionalDirectionIntensity[i].xyz);
          vec3 radiance = lights.directionalColor[i].rgb *
                          lights.directionalDirectionIntensity[i].w;
          float nDotL = max(dot(n, l), 0.0);
          vec3 direct = baseColor / PI;
          if (kind == 5) {
            direct += blinnPhongSpecular(
                n, v, l, material_info.specularShininess.rgb,
                material_info.specularShininess.w);
          }
          color += direct * radiance * shadow * nDotL;
        }
      }
      for (int i = 0; i < MAX_POINT_LIGHTS; ++i) {
        if (i < pointCount) {
          vec3 delta = lights.pointPositionIntensity[i].xyz - worldPosition;
          float distanceSquared = max(dot(delta, delta), EPSILON);
          vec3 l = delta * inversesqrt(distanceSquared);
          vec3 radiance = lights.pointColor[i].rgb *
                          lights.pointPositionIntensity[i].w / distanceSquared;
          float nDotL = max(dot(n, l), 0.0);
          vec3 direct = baseColor / PI;
          if (kind == 5) {
            direct += blinnPhongSpecular(
                n, v, l, material_info.specularShininess.rgb,
                material_info.specularShininess.w);
          }
          color += direct * radiance * nDotL;
        }
      }
    } else {
      float roughness = clamp(
          material_info.roughnessMetalnessAlphaTestKind.x, 0.045, 1.0);
      float metalness = clamp(
          material_info.roughnessMetalnessAlphaTestKind.y, 0.0, 1.0);
      vec3 f0 = mix(vec3(0.04), baseColor, metalness);
      vec3 ambientF = fresnelSchlick(max(dot(n, v), 0.0), f0);
      color = baseColor * (1.0 - ambientF) * (1.0 - metalness) *
              frame_info.ambientColor.rgb / PI;
      for (int i = 0; i < MAX_DIRECTIONAL_LIGHTS; ++i) {
        if (i < directionalCount) {
          vec3 l = normalize(lights.directionalDirectionIntensity[i].xyz);
          vec3 radiance = lights.directionalColor[i].rgb *
                          lights.directionalDirectionIntensity[i].w;
          color += standardLight(
              n, v, l, radiance, baseColor, f0, roughness, metalness) * shadow;
        }
      }
      for (int i = 0; i < MAX_POINT_LIGHTS; ++i) {
        if (i < pointCount) {
          vec3 delta = lights.pointPositionIntensity[i].xyz - worldPosition;
          float distanceSquared = max(dot(delta, delta), EPSILON);
          vec3 l = delta * inversesqrt(distanceSquared);
          vec3 radiance = lights.pointColor[i].rgb *
                          lights.pointPositionIntensity[i].w / distanceSquared;
          color += standardLight(
              n, v, l, radiance, baseColor, f0, roughness, metalness);
        }
      }
    }
  }

  color *= frame_info.cameraPositionExposure.w;
  if (frame_info.fogFarModeReserved.y > 0.5) {
    float fogFactor = smoothstep(
        frame_info.fogColorNear.w, frame_info.fogFarModeReserved.x, viewDepth);
    // Match THREE: fog is mixed in linear space before output color conversion.
    color = mix(color, frame_info.fogColorNear.rgb, fogFactor);
  }
  color = linearToSrgb(color);
  outColor = vec4(color, albedo.a);
}
