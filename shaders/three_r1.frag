#version 460 core

#define MAX_DIRECTIONAL_LIGHTS 4
#define MAX_POINT_LIGHTS 8
#define MAX_HEMISPHERE_LIGHTS 4
#define MAX_SPOT_LIGHTS 4
#define PI 3.14159265358979323846
#define EPSILON 0.0001

layout(location = 0) in vec3 worldPosition;
layout(location = 1) in vec3 worldNormal;
layout(location = 6) in vec3 viewNormal;
layout(location = 7) in vec3 viewPosition;
layout(location = 8) in vec2 materialState;
layout(location = 2) in vec2 textureUv;
layout(location = 3) in vec4 vertexColor;
layout(location = 9) in vec4 instanceDiffuse;
layout(location = 4) in float viewDepth;
layout(location = 5) in vec4 shadowPosition;
// R1 v7: MeshDepthMaterial (kind 12) depth-viz lane — the vertex stage
// normalizes view depth over the camera's near..far range (recovered from
// the projection matrix; see three_r1.vert jsrDepthClipRange).
layout(location = 11) in float depthLinear01;

out vec4 outColor;

uniform sampler2D mapTexture;
uniform sampler2D mapRightTexture;
uniform sampler2D shadowMapTexture;
uniform sampler2D alphaMapTexture;
uniform sampler2D envMapTexture;
// R1 v5 tails: toon gradient ramp + matcap lookup, and the two paraboloid
// faces of the point-light shadow map (front = z <= 0 hemisphere).
uniform sampler2D gradientMapTexture;
uniform sampler2D matcapTexture;
uniform sampler2D pointShadowFrontTexture;
uniform sampler2D pointShadowBackTexture;
// R1 v6 tangent-space normal map (derivative TBN, no tangent attributes)
// and the derivative bump map sharing the same UV lane.
uniform sampler2D normalMapTexture;
uniform sampler2D bumpMapTexture;
uniform sampler2D roughnessMapTexture;
uniform sampler2D metalnessMapTexture;

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
  // R1 v5 point-light shadow tail: x = enabled, yzw = light world position.
  vec4 pointShadowLight;
  // x = 1/far depth normalization, y = paraboloid texel size (1/mapWidth).
  vec4 pointShadowParams;
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
  mat3 duboisLeft;
  mat3 duboisRight;
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

// R1 v5 point-light shadow sampling — the decode half of the dual
// paraboloid map (see three_r1.vert): pick the face by the major
// hemisphere of (fragment - light), rebuild the disk UV with the same
// formula the vertex warp used, and PCF-compare light-space distances.
// Depth is normalized by 1/far; fragments beyond far are fully lit.
// Branch-free throughout (step/select instead of if): this function is
// called inside the per-light loops, and spirv-cross recursed to a crash
// on the added nesting depth.
float pointShadowVisibility(vec3 fragmentWorldPosition, float receiveShadow) {
  float enabled = step(0.5, frame_info.pointShadowLight.x) *
                  step(0.499, receiveShadow);
  vec3 delta = fragmentWorldPosition - frame_info.pointShadowLight.yzw;
  float distance = length(delta);
  float far = 1.0 / max(frame_info.pointShadowParams.x, 0.000001);
  float withinFar = step(distance, far);
  vec3 dir = delta / max(distance, EPSILON);
  float frontFace = step(dir.z, 0.0);
  // front face encodes (x, y) / (len - z); back (x, -y) / (len + z).
  vec2 diskFront = dir.xy / (1.0 - dir.z);
  vec2 diskBack = vec2(dir.x, -dir.y) / (1.0 + dir.z);
  vec2 uv = mix(diskBack, diskFront, frontFace) * 0.5 + 0.5;
  float texel = frame_info.pointShadowParams.y;
  float compare = distance + frame_info.shadowBiasTexelRadius.x;
  float visibility = 0.0;
  for (int x = -1; x <= 1; ++x) {
    for (int y = -1; y <= 1; ++y) {
      // Clamp to the cleared rim (depth 1.0 = far) like upstream cube
      // shadow border handling; both faces are always bound, picking the
      // sample with a select keeps the loop uniform-control-flow friendly.
      vec2 sampleUv = clamp(uv + vec2(float(x), float(y)) * texel,
                            vec2(0.0), vec2(1.0));
      float storedFront = texture(pointShadowFrontTexture, sampleUv).r;
      float storedBack = texture(pointShadowBackTexture, sampleUv).r;
      float stored = mix(storedBack, storedFront, frontFace);
      visibility += step(compare, stored);
    }
  }
  visibility /= 9.0;
  return mix(1.0, visibility, enabled * withinFar);
}

// R1 v5 cube env lane: the six +X,-X,+Y,-Y,+Z,-Z faces arrive as one 3x2
// atlas (row 0: +X,-X,+Y; row 1: -Y,+Z,-Z). Major-axis selection mirrors
// the GL cube face conventions three.js samples hardware cubemaps with;
// the half-texel inset keeps linear filtering from bleeding across cells.
// Written branch-free (step/ternary selects) — spirv-cross recursed to a
// crash on the nested if/else face ladder.
vec2 cubeAtlasUv(vec3 dir) {
  vec3 a = abs(dir);
  float xMajor = step(max(a.y, a.z), a.x);
  float yMajor = (1.0 - xMajor) * step(a.z, a.y);
  float zMajor = 1.0 - xMajor - yMajor;
  vec2 uvX = dir.x > 0.0 ? vec2(-dir.z, -dir.y) : vec2(dir.z, -dir.y);
  vec2 uvY = dir.y > 0.0 ? vec2(dir.x, dir.z) : vec2(dir.x, -dir.z);
  vec2 uvZ = dir.z > 0.0 ? vec2(dir.x, -dir.y) : vec2(-dir.x, -dir.y);
  vec2 faceUv = uvX / max(a.x, EPSILON) * xMajor +
                uvY / max(a.y, EPSILON) * yMajor +
                uvZ / max(a.z, EPSILON) * zMajor;
  float face = xMajor * (dir.x > 0.0 ? 0.0 : 1.0) +
               yMajor * (dir.y > 0.0 ? 2.0 : 3.0) +
               zMajor * (dir.z > 0.0 ? 4.0 : 5.0);
  vec2 atlas = vec2(material_info.matcapGradientCube.w, material_info.atlasParams.x);
  vec2 faceSize = atlas / vec2(3.0, 2.0);
  vec2 origin = vec2(mod(face, 3.0), floor(face / 3.0)) * faceSize;
  vec2 inCell = clamp(faceUv * 0.5 + 0.5, vec2(0.5) / faceSize,
                      vec2(1.0) - vec2(0.5) / faceSize);
  return (origin + inCell * faceSize) / atlas;
}

// THREE r186 gradientmap_pars_fragment: without a gradientMap the toon ramp
// is the built-in two-stop 0.7/1.0 step (antialiased with fwidth), with one
// the red channel of the 1D ramp texture drives the band.
vec3 toonGradientIrradiance(float dotNL) {
  float coord = dotNL * 0.5 + 0.5;
  if (material_info.matcapGradientCube.y > 0.5) {
    return vec3(texture(gradientMapTexture, vec2(coord, 0.5)).r);
  }
  float width = fwidth(coord) * 0.5;
  return mix(vec3(0.7), vec3(1.0), smoothstep(0.7 - width, 0.7 + width, coord));
}

void applyClipping() {
  int clipCount = int(clipping_info.clipCountFlags.x + 0.5);
  if (clipCount <= 0) return;
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
  if (kind == 10) {
    // scene.background texture: an injected camera-centred skybox samples
    // the environment by view DIRECTION (no reflection, no lighting, no
    // fog/clipping), then follows the same exposure/tone/sRGB tail.
    vec3 bgDir = normalize(worldPosition - frame_info.cameraPositionExposure.xyz);
    vec3 bgColor = material_info.matcapGradientCube.z > 0.5
        ? texture(envMapTexture, cubeAtlasUv(bgDir)).rgb
        : texture(envMapTexture, equirectUv(bgDir)).rgb;
    bgColor *= frame_info.cameraPositionExposure.w;
    bgColor = applyToneMapping(bgColor);
    if (frame_info.fogFarModeReserved.w < 0.5) bgColor = linearToSrgb(bgColor);
    outColor = vec4(bgColor, 1.0);
    return;
  }
  if (kind == 11) {
    vec4 left = texture(mapTexture, transformedMapUv(textureUv));
    vec4 right = texture(mapRightTexture, transformedAlphaMapUv(textureUv));
    vec3 composite = clamp(material_info.duboisLeft * left.rgb +
                           material_info.duboisRight * right.rgb, 0.0, 1.0);
    composite *= frame_info.cameraPositionExposure.w;
    composite = applyToneMapping(composite);
    if (frame_info.fogFarModeReserved.w < 0.5) composite = linearToSrgb(composite);
    outColor = vec4(composite, max(left.a, right.a));
    return;
  }
  if (kind == 12) {
    // R1 v7 MeshDepthMaterial (BasicDepthPacking only). The bounded RT lane
    // aliases target.depthTexture onto the RT color attachment, so upstream's
    // readDepth() overlay keeps sampling blue scene pixels (webgl_depth_texture
    // blue screen). Instead the depth viz rides the color channel: grayscale
    // linearized view depth (0 near, 1 far, clamped) is written into the
    // attachment. Deliberately NOT tone mapped or sRGB encoded — the value is
    // data, and the example's post shader re-maps it per fragment. map/
    // alphaMap and alphaTest stay unapplied in this lane (the bare override
    // material carries none; validateMaterial warns when they are set).
    float depth01 = clamp(depthLinear01, 0.0, 1.0);
    float opacity = materialState.y > 0.5 ? material_info.colorOpacity.a : 1.0;
    outColor = vec4(vec3(depth01), opacity);
    return;
  }
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

  int detailMaps = int(material_info.alphaEnvIntensity.w + 0.5);
  // R1 v6 PBR factor maps (upstream roughnessmap/metalnessmap_fragment):
  // roughness comes from the G channel, metalness from the B channel.
  float roughnessFactor = material_info.roughnessMetalnessAlphaTestKind.x;
  float metalnessFactor = material_info.roughnessMetalnessAlphaTestKind.y;
  if ((detailMaps & 4) != 0) {
    roughnessFactor *= texture(roughnessMapTexture, textureUv).g;
  }
  if ((detailMaps & 8) != 0) {
    metalnessFactor *= texture(metalnessMapTexture, textureUv).b;
  }
  vec4 albedo = material_info.colorOpacity * instanceDiffuse;
  if (material_info.vertexColorsFlatShadingHasMapReserved.x > 0.5) {
    albedo *= vertexColor;
  }
  // THREE map_particle_fragment: Points have no UV attribute; the sprite
  // coordinate is per-fragment gl_PointCoord. Meshes retain their UV lane.
  vec2 mapUv = kind == 4
      ? vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y)
      : textureUv;
  if (material_info.vertexColorsFlatShadingHasMapReserved.z > 0.5) {
    albedo *= texture(mapTexture, transformedMapUv(mapUv));
  }
  // THREE alphamap_fragment: the alpha map modulates alpha through its
  // GREEN channel (an upstream grayscale convention), before alphaTest.
  if (material_info.alphaEnvIntensity.x > 0.5) {
    vec2 alphaUv = kind == 4 ? mapUv : textureUv;
    albedo.a *= texture(alphaMapTexture, transformedAlphaMapUv(alphaUv)).g;
  }
  if (albedo.a < material_info.roughnessMetalnessAlphaTestKind.z) {
    discard;
  }

  vec3 color = albedo.rgb;
  if (kind == 9) {
    // R1 v5 MeshMatcapMaterial — the REAL upstream meshmatcap_frag lookup:
    // build a view-space tangent frame around the view direction and read
    // the matcap at (dot(x,n), dot(y,n)) * 0.495 + 0.5; the 0.495 keeps
    // undersized matcap disks from wrapping. Missing matcap falls back to
    // upstream's mix(0.2, 0.8, uv.y) gray. Unlit, but fog + tone mapped.
    vec3 matcapNormal = viewNormal;
    if (material_info.vertexColorsFlatShadingHasMapReserved.y > 0.5) {
      matcapNormal = cross(dFdx(viewPosition), dFdy(viewPosition));
    }
    float matcapNormalLength = length(matcapNormal);
    matcapNormal = matcapNormalLength > EPSILON
        ? matcapNormal / matcapNormalLength
        : vec3(0.0, 0.0, 1.0);
    if (!gl_FrontFacing) matcapNormal = -matcapNormal;
    vec3 viewDir = normalize(viewPosition);
    vec3 x = normalize(vec3(viewDir.z, 0.0, -viewDir.x));
    vec3 y = cross(viewDir, x);
    vec2 uv = vec2(dot(x, matcapNormal), dot(y, matcapNormal)) * 0.495 + 0.5;
    vec4 matcapColor = material_info.matcapGradientCube.x > 0.5
        ? texture(matcapTexture, uv)
        : vec4(vec3(mix(0.2, 0.8, uv.y)), 1.0);
    color = albedo.rgb * matcapColor.rgb;
  }
  if (kind != 0 && kind != 3 && kind != 4 && kind != 9) {
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
    if ((detailMaps & 1) != 0) {
      // R1 v6 tangentless normal mapping (upstream normal_fragment_maps
      // without tangent attributes): build the derivative TBN around the
      // world-space normal; lighting below already runs in world space.
      // The map samples the plain UV lane (no per-normal-map UV matrix).
      vec3 mapN = texture(normalMapTexture, textureUv).xyz * 2.0 - 1.0;
      mapN.xy *= material_info.atlasParams.yz;
      vec3 q0 = dFdx(worldPosition);
      vec3 q1 = dFdy(worldPosition);
      vec2 st0 = dFdx(textureUv);
      vec2 st1 = dFdy(textureUv);
      float det = st0.x * st1.y - st1.x * st0.y;
      vec3 T = q0 * st1.y - q1 * st0.y;
      if (abs(det) > 1e-12 && dot(T, T) > 1e-12) {
        T = normalize(T);
        vec3 B = -normalize(cross(n, T));
        n = normalize(mat3(T, B, n) * mapN);
      }
    } else if ((detailMaps & 2) != 0) {
      // R1 v6 derivative bump mapping (upstream bumpmap_pars_fragment
      // perturbNormalArb, world space): height gradients tilt the normal
      // against the surface derivative frame.
      float height = texture(bumpMapTexture, textureUv).x;
      vec2 dH = vec2(dFdx(height), dFdy(height)) * material_info.atlasParams.w;
      vec3 sigmaX = dFdx(worldPosition);
      vec3 sigmaY = dFdy(worldPosition);
      vec3 R1 = cross(sigmaY, n);
      vec3 R2 = cross(n, sigmaX);
      float fDet = dot(sigmaX, R1);
      if (abs(fDet) > 1e-12) {
        vec3 vGrad = sign(fDet) * (dH.x * R1 + dH.y * R2);
        n = normalize(abs(fDet) * n - vGrad);
      }
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
    // Evaluated once per fragment: the point shadow covers the frame's
    // single point shadow light, so it is independent of the loop index.
    float pointShadowFactor = pointShadowVisibility(
        worldPosition,
        material_info.vertexColorsFlatShadingHasMapReserved.w);
    if (kind == 7) {
      // ShadowMaterial: invisible where lit, opacity-colored where shadowed
      // (upstream: vec4(color, opacity * (1 - getShadowMask()))).
      float mask = min(shadowFactor, spotShadowFactor);
      outColor = vec4(albedo.rgb, albedo.a * (1.0 - mask));
      return;
    }
    if (kind == 1 || kind == 5 || kind == 8) {
      for (int i = 0; i < MAX_DIRECTIONAL_LIGHTS; ++i) {
        if (i < directionalCount) {
          vec3 l = normalize(lights.directionalDirectionIntensity[i].xyz);
          vec3 radiance = lights.directionalColor[i].rgb *
                          lights.directionalDirectionIntensity[i].w;
          float nDotL = max(dot(n, l), 0.0);
          vec3 direct = baseColor / PI;
          if (kind == 8) {
            // R1 v5 MeshTonMaterial: three.js RE_Direct_Toon — the lambert
            // nDotL factor is replaced by the gradient irradiance ramp.
            direct *= toonGradientIrradiance(dot(n, l)) / max(nDotL, EPSILON);
          }
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
          float decay = lights.pointColor[i].a;
          float attenuation = decay == 0.0
              ? 1.0
              : pow(distanceSquared, -0.5 * decay);
          vec3 radiance = lights.pointColor[i].rgb *
                          lights.pointPositionIntensity[i].w * attenuation;
          float nDotL = max(dot(n, l), 0.0);
          vec3 direct = baseColor / PI;
          if (kind == 8) {
            direct *= toonGradientIrradiance(dot(n, l)) / max(nDotL, EPSILON);
          }
          if (kind == 5) {
            direct += blinnPhongSpecular(
                n, v, l, material_info.specularShininess.rgb,
                material_info.specularShininess.w);
          }
          color += direct * radiance * pointShadowFactor * nDotL;
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
          if (kind == 8) {
            direct *= toonGradientIrradiance(dot(n, l)) / max(nDotL, EPSILON);
          }
          if (kind == 5) {
            direct += blinnPhongSpecular(
                n, v, l, material_info.specularShininess.rgb,
                material_info.specularShininess.w);
          }
          color += direct * radiance * spotShadowFactor * nDotL;
        }
      }
    } else {
      float roughness = clamp(roughnessFactor, 0.045, 1.0);
      float metalness = clamp(metalnessFactor, 0.0, 1.0);
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
          float decay = lights.pointColor[i].a;
          float attenuation = decay == 0.0
              ? 1.0
              : pow(distanceSquared, -0.5 * decay);
          vec3 radiance = lights.pointColor[i].rgb *
                          lights.pointPositionIntensity[i].w * attenuation;
          float pointVisibility = pointShadowFactor;
          color += standardLight(
              n, v, l, radiance, baseColor, f0, roughness, metalness) * pointVisibility;
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
  // R1 env reflection (three.js envmap_fragment shape): sample the
  // environment at reflect(fragment->camera inverted, normal) scaled by
  // envMapIntensity and (1 - roughness). R1 v5 supports two env lanes:
  // equirect (v4) and the 3x2 cube atlas — the material flag selects the
  // sampling function. Upstream PMREM prefiltered IBL stays on the 1B web
  // lane.
  if (material_info.alphaEnvIntensity.y > 0.5 &&
      kind != 3 && kind != 4 && kind != 9) {
    vec3 envView = normalize(
        frame_info.cameraPositionExposure.xyz - worldPosition);
    float envNormalLength = length(worldNormal);
    vec3 envNormal = envNormalLength > EPSILON
        ? worldNormal / envNormalLength
        : vec3(0.0, 0.0, 1.0);
    // R1 v4 envMapIntensity carries the env mode sign-encoded: negative =
    // upstream ENVMAP_MODE_REFRACTION (CubeRefractionMapping), |v| is
    // material.refractionRatio. envmap_fragment: refract(cameraToFrag,
    // worldNormal, refractionRatio) vs reflect(cameraToFrag, worldNormal).
    float encodedEnv = material_info.alphaEnvIntensity.z;
    bool refractingEnv = encodedEnv < 0.0;
    vec3 reflectVec = refractingEnv
        ? refract(-envView, envNormal, -encodedEnv)
        : reflect(-envView, envNormal);
    vec3 envColor = material_info.matcapGradientCube.z > 0.5
        ? texture(envMapTexture, cubeAtlasUv(reflectVec)).rgb
        : texture(envMapTexture, equirectUv(reflectVec)).rgb;
    // Multiply-blend mix factor. Reflection: the encoded intensity (Phong/
    // Basic carry upstream reflectivity, see _ensureMaterial). Refraction:
    // 1.0 — the encoded scalar's magnitude is the refractionRatio, so the
    // mix factor degrades to the reflectivity default (the refraction
    // examples use 1 or 0.9; ratio drives the visible distortion anyway).
    float envIntensity = encodedEnv < 0.0 ? 1.0 : encodedEnv;
    if (kind == 1 || kind == 2) {
      // Approximate split IBL instead of adding a roughness-scaled mirror to
      // every material. Diffuse irradiance survives roughness 1 and preserves
      // albedo/maps; only the specular lobe vanishes at full roughness.
      float metal = clamp(metalnessFactor, 0.0, 1.0);
      float rough = clamp(roughnessFactor, 0.0, 1.0);
      vec3 diffuseIbl = albedo.rgb * (1.0 - metal);
      vec3 f0 = mix(vec3(0.04), albedo.rgb, metal);
      color += envColor * envIntensity *
          (diffuseIbl + f0 * (1.0 - rough));
    } else {
    // Upstream envmap_fragment for the non-IBL materials (Basic/Phong/Toon,
    // combine default MultiplyOperation): outgoingLight = mix(outgoing,
    // outgoing * envColor, specularStrength * reflectivity). The previous ADD
    // shape clipped every lit base above 1.0 (cubemap_refraction's ambient
    // 3.5 statues, cubemap's white busts) to featureless white; multiply
    // keeps the env darkening that reads as reflection/refraction detail.
    color = mix(color, color * envColor,
        clamp(envIntensity, 0.0, 1.0));
    }
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
  if (frame_info.fogFarModeReserved.w < 0.5) color = linearToSrgb(color);
  outColor = vec4(color, albedo.a);
}
