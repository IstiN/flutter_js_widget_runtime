#version 460 core

#define MAX_DIRECTIONAL_LIGHTS 4
#define MAX_POINT_LIGHTS 8
#define MAX_HEMISPHERE_LIGHTS 4
#define MAX_SPOT_LIGHTS 4
#define PI 3.14159265358979323846
#define EPSILON 0.0001

in vec3 worldPosition;
in vec3 worldNormal;
layout(location = 6) in vec3 viewNormal;
layout(location = 7) in vec3 viewPosition;
layout(location = 8) in vec2 materialState;
in vec2 textureUv;
in vec4 vertexColor;
layout(location = 9) in vec4 instanceDiffuse;
in float viewDepth;
layout(location = 5) in vec4 shadowPosition;

out vec4 outColor;

uniform sampler2D mapTexture;
uniform sampler2D shadowMapTexture;
uniform sampler2D alphaMapTexture;
uniform sampler2D envMapTexture;

uniform FrameInfo {
  vec4 cameraPositionExposure;
  vec4 ambientColor;
  vec4 lightCounts;
  vec4 fogColorNear;
  vec4 fogFarModeReserved;
  vec4 shadowBiasTexelRadius;
  // x: tone mapping mode (three.js constants: 0 none, 1 linear, 2 reinhard,
  // 3 cineon, 4 ACES filmic, 5 custom, 6 AgX, 7 neutral), y: FogExp2 density.
  vec4 toneMappingFogDensity;
} frame_info;

uniform Lights {
  vec4 directionalDirectionIntensity[MAX_DIRECTIONAL_LIGHTS];
  vec4 directionalColor[MAX_DIRECTIONAL_LIGHTS];
  vec4 pointPositionIntensity[MAX_POINT_LIGHTS];
  vec4 pointColor[MAX_POINT_LIGHTS];
  vec4 hemisphereDirectionIntensity[MAX_HEMISPHERE_LIGHTS];
  vec4 hemisphereSkyColor[MAX_HEMISPHERE_LIGHTS];
  vec4 hemisphereGroundColor[MAX_HEMISPHERE_LIGHTS];
  vec4 spotColorIntensity[MAX_SPOT_LIGHTS];
  vec4 spotPositionCosOuter[MAX_SPOT_LIGHTS];
  vec4 spotDirectionCosInner[MAX_SPOT_LIGHTS];
  vec4 spotDecayDistance[MAX_SPOT_LIGHTS];
} lights;

uniform ClippingInfo {
  vec4 clipPlanes[8];
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

vec3 hemisphereIrradiance(vec3 n, int hemisphereCount) {
  vec3 irradiance = vec3(0.0);
  for (int i = 0; i < MAX_HEMISPHERE_LIGHTS; ++i) {
    if (i < hemisphereCount) {
      vec4 directionIntensity = lights.hemisphereDirectionIntensity[i];
      float weight = 0.5 * dot(n, directionIntensity.xyz) + 0.5;
      vec3 sky = lights.hemisphereSkyColor[i].rgb;
      vec3 ground = lights.hemisphereGroundColor[i].rgb;
      irradiance += mix(ground, sky, weight) * directionIntensity.w;
    }
  }
  return irradiance;
}

vec3 linearToSrgb(vec3 value) {
  vec3 clamped = clamp(value, vec3(0.0), vec3(1.0));
  vec3 low = clamped * 12.92;
  vec3 high = 1.055 * pow(clamped, vec3(1.0 / 2.4)) - 0.055;
  return mix(low, high, step(vec3(0.0031308), clamped));
}

// Applies the material's map UV transform (three.js uvTransform: the
// identity leaves textureUv numerically untouched).
vec2 transformedMapUv(vec2 uv) {
  mat3 transform = mat3(
    material_info.mapUvColumn0.xyz,
    material_info.mapUvColumn1.xyz,
    material_info.mapUvColumn2.xyz
  );
  return (transform * vec3(uv, 1.0)).xy;
}

vec2 transformedAlphaMapUv(vec2 uv) {
  mat3 transform = mat3(
    material_info.alphaMapUvColumn0.xyz,
    material_info.alphaMapUvColumn1.xyz,
    material_info.alphaMapUvColumn2.xyz
  );
  return (transform * vec3(uv, 1.0)).xy;
}

// Equirectangular direction -> uv, exactly three.js equirectUv(): the R1
// env lane samples a single 2D equirect texture (cube faces are not a
// protocol texture lane).
vec2 equirectUv(vec3 dir) {
  float u = atan(dir.z, dir.x) * 0.15915494309189535 + 0.5;
  float v = asin(clamp(dir.y, -1.0, 1.0)) * 0.3183098861837907 + 0.5;
  return vec2(u, v);
}

// THREE r186 tonemapping_pars_fragment math, verbatim EXCEPT the leading
// `color *= toneMappingExposure`: the R1 pipeline already multiplies the
// frame exposure unconditionally (pre-v4 behavior kept byte-identical for
// NoToneMapping goldens), so applying it again here would double it.
vec3 linearToneMapping(vec3 color) {
  return clamp(color, vec3(0.0), vec3(1.0));
}

vec3 reinhardToneMapping(vec3 color) {
  return clamp(color / (vec3(1.0) + color), vec3(0.0), vec3(1.0));
}

vec3 cineonToneMapping(vec3 color) {
  color = max(vec3(0.0), color - 0.004);
  return pow(
      (color * (6.2 * color + 0.5)) / (color * (6.2 * color + 1.7) + 0.06),
      vec3(2.2));
}

vec3 rrtAndOdtFit(vec3 v) {
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return a / b;
}

vec3 acesFilmicToneMapping(vec3 color) {
  // sRGB => XYZ => D65_2_D60 => AP1 => RRT_SAT (transposed from source)
  const mat3 acesInputMat = mat3(
      vec3(0.59719, 0.07600, 0.02840),
      vec3(0.35458, 0.90834, 0.13383),
      vec3(0.04823, 0.01566, 0.83777));
  // ODT_SAT => XYZ => D60_2_D65 => sRGB (transposed from source)
  const mat3 acesOutputMat = mat3(
      vec3(1.60475, -0.10208, -0.00327),
      vec3(-0.53108, 1.10813, -0.07276),
      vec3(-0.07367, -0.00605, 1.07602));
  color *= 1.0 / 0.6;
  color = acesInputMat * color;
  color = rrtAndOdtFit(color);
  color = acesOutputMat * color;
  return clamp(color, vec3(0.0), vec3(1.0));
}

const mat3 linearRec2020ToLinearSrgb = mat3(
    vec3(1.6605, -0.1246, -0.0182),
    vec3(-0.5876, 1.1329, -0.1006),
    vec3(-0.0728, -0.0083, 1.1187));

const mat3 linearSrgbToLinearRec2020 = mat3(
    vec3(0.6274, 0.0691, 0.0164),
    vec3(0.3293, 0.9195, 0.0880),
    vec3(0.0433, 0.0113, 0.8956));

vec3 agxDefaultContrastApprox(vec3 x) {
  vec3 x2 = x * x;
  vec3 x4 = x2 * x2;
  return +15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x +
      0.4298 * x2 + 0.1191 * x - 0.00232;
}

vec3 agxToneMapping(vec3 color) {
  const mat3 agxInsetMatrix = mat3(
      vec3(0.856627153315983, 0.137318972929847, 0.11189821299995),
      vec3(0.0951212405381588, 0.761241990602591, 0.0767994186031903),
      vec3(0.0482516061458583, 0.101439036467562, 0.811302368396859));
  const mat3 agxOutsetMatrix = mat3(
      vec3(1.1271005818144368, -0.1413297634984383, -0.14132976349843826),
      vec3(-0.11060664309660323, 1.157823702216272, -0.11060664309660294),
      vec3(-0.016493938717834573, -0.016493938717834257, 1.2519364065950405));
  // log2(2^-10 * 0.18) and log2(2^6.5 * 0.18)
  const float agxMinEv = -12.47393;
  const float agxMaxEv = 4.026069;
  color = linearSrgbToLinearRec2020 * color;
  color = agxInsetMatrix * color;
  color = max(color, 1e-10);
  color = log2(color);
  color = (color - agxMinEv) / (agxMaxEv - agxMinEv);
  color = clamp(color, 0.0, 1.0);
  color = agxDefaultContrastApprox(color);
  color = agxOutsetMatrix * color;
  color = pow(max(vec3(0.0), color), vec3(2.2));
  color = linearRec2020ToLinearSrgb * color;
  return clamp(color, 0.0, 1.0);
}

vec3 neutralToneMapping(vec3 color) {
  const float startCompression = 0.8 - 0.04;
  const float desaturation = 0.15;
  float x = min(color.r, min(color.g, color.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;
  float peak = max(color.r, max(color.g, color.b));
  if (peak < startCompression) return color;
  float d = 1.0 - startCompression;
  float newPeak = 1.0 - d * d / (peak + d - startCompression);
  color *= newPeak / peak;
  float g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
  return mix(color, vec3(newPeak), g);
}

// Mode-guarded tone mapping (three.js tonemapping_fragment): mode 0 (none)
// and 5 (custom, upstream no-op without a patched shader) leave color as-is.
vec3 applyToneMapping(vec3 color) {
  int mode = int(frame_info.toneMappingFogDensity.x + 0.5);
  if (mode == 1) return linearToneMapping(color);
  if (mode == 2) return reinhardToneMapping(color);
  if (mode == 3) return cineonToneMapping(color);
  if (mode == 4) return acesFilmicToneMapping(color);
  if (mode == 6) return agxToneMapping(color);
  if (mode == 7) return neutralToneMapping(color);
  return color;
}

float directionalShadow() {
  if (frame_info.shadowBiasTexelRadius.y <= 0.0 ||
      material_info.vertexColorsFlatShadingHasMapReserved.w < 0.5) {
    return 1.0;
  }
  if (shadowPosition.w <= 0.0) {
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

void applyClipping() {
  int clipCount = int(clipping_info.clipCountFlags.x + 0.5);
  if (clipCount <= 0) return;
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

// THREE r186 physical spot falloff: inverse square, windowed by the cutoff
// distance when one is set.
float spotDistanceFalloff(float lightDistance, float cutoffDistance) {
  float falloff = 1.0 / max(lightDistance * lightDistance, 0.01);
  if (cutoffDistance > 0.0) {
    float ratio = clamp(lightDistance / cutoffDistance, 0.0, 1.0);
    float window = 1.0 - ratio * ratio * ratio * ratio;
    falloff *= window * window;
  }
  return falloff;
}

void main() {
  applyClipping();
  int kind = int(material_info.roughnessMetalnessAlphaTestKind.w + 0.5);
  if (kind == 6) {
    vec3 n;
    if (material_info.vertexColorsFlatShadingHasMapReserved.y > 0.5) {
      n = normalize(cross(dFdx(viewPosition), dFdy(viewPosition)));
    } else {
      float normalLength = length(viewNormal);
      n = normalLength > EPSILON ? viewNormal / normalLength : vec3(0.0, 0.0, 1.0);
      if (materialState.x > 1.5 && !gl_FrontFacing) {
        n = -n;
      }
    }
    float opacity = materialState.y > 0.5 ? material_info.colorOpacity.a : 1.0;
    outColor = vec4(normalize(n) * 0.5 + 0.5, opacity);
    return;
  }

  vec4 albedo = material_info.colorOpacity * instanceDiffuse;
  if (material_info.vertexColorsFlatShadingHasMapReserved.x > 0.5) {
    albedo *= vertexColor;
  }
  if (material_info.vertexColorsFlatShadingHasMapReserved.z > 0.5) {
    albedo *= texture(mapTexture, transformedMapUv(textureUv));
  }
  // THREE alphamap_fragment: the alpha map modulates alpha through its
  // GREEN channel (an upstream grayscale convention), before alphaTest.
  if (material_info.alphaEnvIntensity.x > 0.5) {
    albedo.a *= texture(alphaMapTexture, transformedAlphaMapUv(textureUv)).g;
  }
  if (albedo.a < material_info.roughnessMetalnessAlphaTestKind.z) {
    discard;
  }

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
    int hemisphereCount = int(frame_info.lightCounts.z + 0.5);
    vec3 indirect = frame_info.ambientColor.rgb +
                    hemisphereIrradiance(n, hemisphereCount);
    color = baseColor * indirect / PI;

    int directionalCount = int(frame_info.lightCounts.x + 0.5);
    int pointCount = int(frame_info.lightCounts.y + 0.5);
    int spotCount = int(frame_info.lightCounts.w + 0.5);
    float shadow = directionalShadow();
    float shadowFactor = frame_info.fogFarModeReserved.z > 0.5 ? 1.0 : shadow;
    float spotShadowFactor = frame_info.fogFarModeReserved.z > 0.5 ? shadow : 1.0;
    if (kind == 7) {
      // ShadowMaterial: invisible where lit, opacity-colored where shadowed
      // (upstream: vec4(color, opacity * (1 - getShadowMask()))).
      float mask = min(shadowFactor, spotShadowFactor);
      outColor = vec4(albedo.rgb, albedo.a * (1.0 - mask));
      return;
    }
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
          color += direct * radiance * shadowFactor * nDotL;
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
      for (int i = 0; i < MAX_SPOT_LIGHTS; ++i) {
        if (i < spotCount) {
          vec3 delta = lights.spotPositionCosOuter[i].xyz - worldPosition;
          float lightDistance = length(delta);
          vec3 l = delta / max(lightDistance, EPSILON);
          float angleCos = dot(l, lights.spotDirectionCosInner[i].xyz);
          float cone = smoothstep(lights.spotPositionCosOuter[i].w,
                                  lights.spotDirectionCosInner[i].w, angleCos);
          vec3 radiance = lights.spotColorIntensity[i].rgb *
                          lights.spotColorIntensity[i].w * cone *
                          spotDistanceFalloff(lightDistance,
                                              lights.spotDecayDistance[i].y);
          float nDotL = max(dot(n, l), 0.0);
          vec3 direct = baseColor / PI;
          if (kind == 5) {
            direct += blinnPhongSpecular(
                n, v, l, material_info.specularShininess.rgb,
                material_info.specularShininess.w);
          }
          color += direct * radiance * spotShadowFactor * nDotL;
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
              indirect / PI;
      for (int i = 0; i < MAX_DIRECTIONAL_LIGHTS; ++i) {
        if (i < directionalCount) {
          vec3 l = normalize(lights.directionalDirectionIntensity[i].xyz);
          vec3 radiance = lights.directionalColor[i].rgb *
                          lights.directionalDirectionIntensity[i].w;
          color += standardLight(
              n, v, l, radiance, baseColor, f0, roughness, metalness) * shadowFactor;
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
      for (int i = 0; i < MAX_SPOT_LIGHTS; ++i) {
        if (i < spotCount) {
          vec3 delta = lights.spotPositionCosOuter[i].xyz - worldPosition;
          float lightDistance = length(delta);
          vec3 l = delta / max(lightDistance, EPSILON);
          float angleCos = dot(l, lights.spotDirectionCosInner[i].xyz);
          float cone = smoothstep(lights.spotPositionCosOuter[i].w,
                                  lights.spotDirectionCosInner[i].w, angleCos);
          vec3 radiance = lights.spotColorIntensity[i].rgb *
                          lights.spotColorIntensity[i].w * cone *
                          spotDistanceFalloff(lightDistance,
                                              lights.spotDecayDistance[i].y);
          color += standardLight(
              n, v, l, radiance, baseColor, f0, roughness, metalness) * spotShadowFactor;
        }
      }
    }
  }

  if (kind == 1 || kind == 2 || kind == 5) {
    color += material_info.emissiveIntensity.rgb * material_info.emissiveIntensity.a;
  }
  // R1 basic env reflection (three.js envmap_fragment shape): sample the
  // equirect environment at reflect(fragment->camera inverted, normal) and
  // add it scaled by envMapIntensity and (1 - roughness). Upstream PMREM
  // prefiltered IBL and cube-face envMaps stay on the 1B web lane.
  if (material_info.alphaEnvIntensity.y > 0.5 && kind != 3 && kind != 4) {
    vec3 envView = normalize(
        frame_info.cameraPositionExposure.xyz - worldPosition);
    float envNormalLength = length(worldNormal);
    vec3 envNormal = envNormalLength > EPSILON
        ? worldNormal / envNormalLength
        : vec3(0.0, 0.0, 1.0);
    vec3 reflectVec = reflect(-envView, envNormal);
    vec3 envColor = texture(envMapTexture, equirectUv(reflectVec)).rgb;
    color += envColor * material_info.alphaEnvIntensity.z *
        (1.0 - clamp(material_info.roughnessMetalnessAlphaTestKind.x,
                     0.0, 1.0));
  }
  color *= frame_info.cameraPositionExposure.w;
  color = applyToneMapping(color);
  int fogMode = int(frame_info.fogFarModeReserved.y + 0.5);
  if (fogMode == 1) {
    float fogFactor = smoothstep(
        frame_info.fogColorNear.w, frame_info.fogFarModeReserved.x, viewDepth);
    // Match THREE: fog is mixed in linear space before output color conversion.
    color = mix(color, frame_info.fogColorNear.rgb, fogFactor);
  } else if (fogMode == 2) {
    // THREE fog_fragment FOG_EXP2: 1 - exp(-density^2 * depth^2).
    float fogFactor = 1.0 - exp(-frame_info.toneMappingFogDensity.y *
                                frame_info.toneMappingFogDensity.y *
                                viewDepth * viewDepth);
    color = mix(color, frame_info.fogColorNear.rgb, fogFactor);
  }
  color = linearToSrgb(color);
  outColor = vec4(color, albedo.a);
}
