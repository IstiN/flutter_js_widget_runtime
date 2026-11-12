part of 'js_three_protocol.dart';


/// A malformed T1 envelope or R1 payload.
final class JsThreeProtocolException extends FormatException {
  const JsThreeProtocolException(super.message, [super.source, super.offset]);
}

enum JsThreePrimitive {
  triangles(0),
  lines(1),
  points(2);

  const JsThreePrimitive(this.wireValue);
  final int wireValue;
}

enum JsThreeTextureEncoding {
  rawRgba8(0),
  png(1),
  jpeg(2);

  const JsThreeTextureEncoding(this.wireValue);
  final int wireValue;
}

enum JsThreeMaterialKind {
  meshBasic(0),
  meshLambert(1),
  meshStandard(2),
  lineBasic(3),
  pointsBasic(4),
  meshPhong(5),
  meshNormal(6),
  shadow(7),
  meshTon(8),
  meshMatcap(9),
  background(10),
  anaglyph(11),
  // R1 v7: MeshDepthMaterial (BasicDepthPacking only) — the fragment lane
  // writes grayscale linearized view depth into the color attachment so the
  // bounded RT lane (DepthTexture aliased to RT color) still renders depth
  // visualizations through the color channel.
  meshDepth(12);

  const JsThreeMaterialKind(this.wireValue);
  final int wireValue;
}

enum JsThreeSide {
  front(0),
  back(1),
  double(2);

  const JsThreeSide(this.wireValue);
  final int wireValue;
}

enum JsThreeObjectKind {
  group(0),
  mesh(1),
  line(2),
  points(3),
  sprite(4);

  const JsThreeObjectKind(this.wireValue);
  final int wireValue;
}

enum JsThreeCameraType {
  perspective(0),
  orthographic(1);

  const JsThreeCameraType(this.wireValue);
  final int wireValue;
}

enum JsThreeLightType {
  ambient(0),
  directional(1),
  point(2),
  hemisphere(3),
  spot(4);

  const JsThreeLightType(this.wireValue);
  final int wireValue;
}

enum JsThreeFogMode {
  none(0),
  linear(1),
  exp2(2);

  const JsThreeFogMode(this.wireValue);
  final int wireValue;
}

/// Frame-level tone mapping; wire values are the upstream three.js
/// constants (src/constants.js r186) so the facade forwards them verbatim.
enum JsThreeToneMapping {
  none(0),
  linear(1),
  reinhard(2),
  cineon(3),
  acesFilmic(4),
  custom(5),
  agx(6),
  neutral(7);

  const JsThreeToneMapping(this.wireValue);
  final int wireValue;
}

/// Which light owns the frame's single shadow map (R1 v3 frame trailer).
enum JsThreeShadowLightType {
  none(0),
  directional(1),
  spot(2),
  point(3);

  const JsThreeShadowLightType(this.wireValue);
  final int wireValue;
}

/// Raw GL stencil test functions (R1 v8 material stencil tail): the
/// upstream THREE.NeverStencilFunc..AlwaysStencilFunc constants forwarded
/// verbatim so the native pass can map them straight onto the platform
/// stencil state. The wire values are sparse GL enums, so decoding uses the
/// [tryWire] table instead of [enumValue].
enum JsThreeStencilFunc {
  never(0x0200),
  less(0x0201),
  equal(0x0202),
  lessEqual(0x0203),
  greater(0x0204),
  notEqual(0x0205),
  greaterEqual(0x0206),
  always(0x0207);

  const JsThreeStencilFunc(this.wireValue);
  final int wireValue;

  static final Map<int, JsThreeStencilFunc> _byWire = {
    for (final value in values) value.wireValue: value,
  };

  /// Null for any value outside the GL table; decoders reject loudly.
  static JsThreeStencilFunc? tryWire(int wireValue) => _byWire[wireValue];
}

/// Raw GL stencil operations (R1 v8 material stencil tail): the upstream
/// THREE.ZeroStencilOp..DecrementWrapStencilOp constants forwarded verbatim.
enum JsThreeStencilOp {
  zero(0x0000),
  keep(0x1e00),
  replace(0x1e01),
  increment(0x1e02),
  decrement(0x1e03),
  invert(0x150a),
  incrementWrap(0x8507),
  decrementWrap(0x8508);

  const JsThreeStencilOp(this.wireValue);
  final int wireValue;

  static final Map<int, JsThreeStencilOp> _byWire = {
    for (final value in values) value.wireValue: value,
  };

  /// Null for any value outside the GL table; decoders reject loudly.
  static JsThreeStencilOp? tryWire(int wireValue) => _byWire[wireValue];
}

/// The bounded GPU lane's stencil attachments are 8-bit, so reference
/// values, masks and clear values must fit one byte; anything wider would be
/// silently truncated by the platform stencil state.
const int maxStencilByteValue = 0xff;

/// Identity UV transform (three.js `Matrix3().setUvTransform(0,0,1,1,0,0,0,0)`
/// / untouched `texture.matrix`), column-major like `Matrix3.elements`.
const List<double> _threeIdentityUvMatrixRows = <double>[
  1, 0, 0, //
  0, 1, 0,
  0, 0, 1,
];

final Float32List _threeIdentityUvMatrix = Float32List.fromList(
  _threeIdentityUvMatrixRows,
).asUnmodifiableView();

/// Material flag word validation. v8 adds the colorWrite-off flag (bit 10)
/// and the stencil-tail marker (bit 11); older streams keep the pre-v8 mask
/// word. Bits 7..9 stay THREE blending flags on every version.
void _validateMaterialFlags(_Reader body, int flags, int streamVersion) {
  final flagMask = streamVersion >= 8 ? 0xfff : 0x3ff;
  if (flags & ~flagMask != 0) {
    body.fail('unknown material flag');
  }
}

/// Wireframe only applies to mesh material kinds (R1 v5 adds ton/matcap to
/// the allowed set alongside the v3 mesh kinds).
void _validateMaterialWireframeFlag(
  _Reader body,
  int flags,
  JsThreeMaterialKind kind,
) {
  if (flags & 0x20 == 0) return;
  const meshKinds = {
    JsThreeMaterialKind.meshBasic,
    JsThreeMaterialKind.meshLambert,
    JsThreeMaterialKind.meshStandard,
    JsThreeMaterialKind.meshPhong,
    JsThreeMaterialKind.meshNormal,
    JsThreeMaterialKind.meshTon,
    JsThreeMaterialKind.meshMatcap,
  };
  if (!meshKinds.contains(kind)) {
    body.fail('wireframe requires a mesh material');
  }
}

enum JsThreeResourceKind {
  geometry(1),
  texture(2),
  material(3),
  node(4),
  light(5),
  camera(6),
  renderTarget(7);

  const JsThreeResourceKind(this.wireValue);
  final int wireValue;
}

final class JsThreeT1Envelope {
  const JsThreeT1Envelope._({
    required this.protocolVersion,
    required this.kind,
    required this.headerBytes,
    required this.sequence,
    required this.engineId,
    required this.surfaceId,
    required this.payload,
    required this.totalBytes,
  });

  final int protocolVersion;
  final int kind;
  final int headerBytes;
  final int sequence;
  final String engineId;
  final String surfaceId;
  final Uint8List payload;
  final int totalBytes;

  int get payloadBytes => payload.length;
}

final class JsThreeDecodedR1 {
  const JsThreeDecodedR1._(this.envelope, this.stream);

  final JsThreeT1Envelope envelope;
  final JsThreeR1Stream stream;
}

final class JsThreeR1Stream {
  const JsThreeR1Stream._(this.version, this.commands);

  final int version;
  final List<JsThreeCommand> commands;

  int get commandCount => commands.length;
}

sealed class JsThreeCommand {
  const JsThreeCommand._(this.opcode);

  final int opcode;
}

final class JsThreeGeometryUpsert extends JsThreeCommand {
  JsThreeGeometryUpsert._({
    required this.geometryId,
    required this.version,
    required this.attributeMask,
    required this.vertexCount,
    required this.indexCount,
    required this.primitive,
    required this.positions,
    required this.normals,
    required this.uvs,
    required this.colors,
    required this.colorStride,
    required this.indices,
    required this.wireIndices,
  }) : super._(1);

  final int geometryId;
  final int version;
  final int attributeMask;
  final int vertexCount;
  final int indexCount;
  final JsThreePrimitive primitive;
  final Float32List positions;
  final Float32List? normals;
  final Float32List? uvs;
  final Float32List? colors;
  final int colorStride;
  final Uint32List indices;

  /// Optional unique-edge indices for Mesh.material.wireframe on triangles.
  /// Null is the legacy/no-wire payload; an empty list is an explicit empty draw.
  final Uint32List? wireIndices;

  bool get hasWireIndices => wireIndices != null;
  int get wireIndexCount => wireIndices?.length ?? 0;
}

final class JsThreeTextureUpsert extends JsThreeCommand {
  JsThreeTextureUpsert._({
    required this.textureId,
    required this.version,
    required this.width,
    required this.height,
    required this.encoding,
    required this.flags,
    required this.data,
  }) : super._(2);

  final int textureId;
  final int version;
  final int width;
  final int height;
  final JsThreeTextureEncoding encoding;
  final int flags;
  final Uint8List data;

  bool get srgb => flags & 0x01 != 0;
  bool get flipY => flags & 0x02 != 0;
  bool get nearestMag => flags & 0x04 != 0;
  bool get nearestMin => flags & 0x08 != 0;
  bool get mipmaps => flags & 0x10 != 0;
  bool get repeatS => flags & 0x20 != 0;
  bool get repeatT => flags & 0x40 != 0;

  /// Six-face cube payload (R1 v5): `data` concatenates +X,-X,+Y,-Y,+Z,-Z
  /// raw RGBA8 faces of `width` x `height` each (6*w*h*4 bytes).
  bool get isCube => flags & 0x80 != 0;
  bool get isEncoded => encoding != JsThreeTextureEncoding.rawRgba8;
}

final class JsThreeRenderTargetUpsert extends JsThreeCommand {
  JsThreeRenderTargetUpsert({
    required this.targetId,
    required this.version,
    required this.width,
    required this.height,
    required this.textureId,
    required this.flags,
  }) : super._(14);

  final int targetId;
  final int version;
  final int width;
  final int height;
  final int textureId;
  final int flags;

  bool get nearestMag => flags & 1 != 0;
  bool get nearestMin => flags & 2 != 0;
  bool get repeatU => flags & 4 != 0;
  bool get repeatV => flags & 8 != 0;
  bool get srgb => flags & 16 != 0;
  bool get flipY => flags & 32 != 0;
  bool get generateMipmaps => flags & 64 != 0;
  bool get hasDepth => flags & 256 != 0;
}

class JsThreeMaterialUpsert extends JsThreeCommand {
  const JsThreeMaterialUpsert._({
    required this.materialId,
    required this.version,
    required this.kind,
    required this.mapTextureId,
    this.mapRightTextureId = 0,
    required this.flags,
    required this.side,
    required this.colorR,
    required this.colorG,
    required this.colorB,
    required this.opacity,
    required this.roughness,
    required this.metalness,
    required this.alphaTest,
    required this.pointSize,
    required this.specularR,
    required this.specularG,
    required this.specularB,
    required this.shininess,
    required this.emissiveR,
    required this.emissiveG,
    required this.emissiveB,
    required this.emissiveIntensity,
    required this.clipId,
    required this.clipFlags,
    required this.alphaMapTextureId,
    required this.envMapTextureId,
    required this.envMapIntensity,
    required this.mapUvMatrix,
    required this.alphaMapUvMatrix,
    required this.duboisLeftMatrix,
    required this.duboisRightMatrix,
    required this.matcapTextureId,
    required this.gradientMapTextureId,
    required this.spriteRotation,
    this.normalMapTextureId = 0,
    this.normalScaleX = 1.0,
    this.normalScaleY = 1.0,
    this.bumpMapTextureId = 0,
    this.bumpScale = 1.0,
    this.roughnessMapTextureId = 0,
    this.metalnessMapTextureId = 0,
    this.stencilWrite = false,
    this.stencilFunc = JsThreeStencilFunc.always,
    this.stencilRef = 0,
    this.stencilFuncMask = 255,
    this.stencilWriteMask = 255,
    this.stencilFailOp = JsThreeStencilOp.keep,
    this.stencilZFailOp = JsThreeStencilOp.keep,
    this.stencilZPassOp = JsThreeStencilOp.keep,
  }) : super._(3);

  final int materialId;
  final int version;
  final JsThreeMaterialKind kind;
  final int mapTextureId;

  /// Second eye texture for the recognized Dubois anaglyph composite.
  final int mapRightTextureId;
  final int flags;
  final JsThreeSide side;
  final double colorR;
  final double colorG;
  final double colorB;
  final double opacity;
  final double roughness;
  final double metalness;
  final double alphaTest;
  final double pointSize;
  final double specularR;
  final double specularG;
  final double specularB;
  final double shininess;
  final double emissiveR;
  final double emissiveG;
  final double emissiveB;
  final double emissiveIntensity;

  /// Resolved clipping set (R1 v3); zero when the material is unclipped.
  final int clipId;

  /// [clipIntersection] bit 0, [clipShadows] bit 1.
  final int clipFlags;

  /// Alpha-map texture (R1 v4) sampling the green channel; zero when unset.
  final int alphaMapTextureId;

  /// Equirectangular environment texture (R1 v4); zero when unset.
  final int envMapTextureId;

  /// Upstream `Material.envMapIntensity` (R1 v4). Nonnegative = reflection
  /// intensity; negative sign-encodes CubeRefractionMapping refraction and
  /// |v| is `Material.refractionRatio` (three.js range [0, 1]).
  final double envMapIntensity;

  /// Column-major 3x3 UV transform composed from the map texture's
  /// offset/repeat/rotation/center (R1 v4). Identity for v3 streams.
  final Float32List mapUvMatrix;

  /// Same composition for [alphaMapTextureId] (R1 v4).
  final Float32List alphaMapUvMatrix;

  /// Column-major Dubois 3x3 matrices (std140 padded columns).
  final Float32List duboisLeftMatrix;
  final Float32List duboisRightMatrix;

  /// Matcap texture (R1 v5), sampled by view-space normal UV; zero unset.
  final int matcapTextureId;

  /// Toon gradient map (R1 v5), one luminance stop per texel; zero unset.
  final int gradientMapTextureId;

  /// SpriteMaterial rotation in radians (R1 v5), zero for non-sprites.
  final double spriteRotation;

  /// R1 v6 tangentless normal-map texture (zero unset) and XY scale.
  final int normalMapTextureId;
  final double normalScaleX;
  final double normalScaleY;

  /// R1 v6 derivative bump-map texture (zero unset) and its height scale.
  final int bumpMapTextureId;
  final double bumpScale;

  /// R1 v6 PBR factor-map textures (zero unset): roughness G / metalness B.
  final int roughnessMapTextureId;
  final int metalnessMapTextureId;

  /// R1 v8 stencil tail (upstream `Material.stencil*`); the neutral
  /// defaults below match a stenciless material exactly. Upstream gates the
  /// whole stencil block on [stencilWrite] (WebGLState.setMaterial), so
  /// consumers must gate both test and write on it as well.
  final bool stencilWrite;
  final JsThreeStencilFunc stencilFunc;
  final int stencilRef;
  final int stencilFuncMask;
  final int stencilWriteMask;
  final JsThreeStencilOp stencilFailOp;
  final JsThreeStencilOp stencilZFailOp;
  final JsThreeStencilOp stencilZPassOp;

  bool get hasAlphaMap => alphaMapTextureId != 0;
  bool get hasEnvMap => envMapTextureId != 0;
  bool get hasClipping => clipId != 0;
  bool get clipIntersection => clipFlags & 1 != 0;
  bool get clipShadows => clipFlags & 2 != 0;

  bool get vertexColors => flags & 0x01 != 0;
  bool get flatShading => flags & 0x02 != 0;
  bool get transparent => flags & 0x04 != 0;

  /// THREE material.blending (0 No, 1 Normal, 2 Additive, 3 Subtractive,
  /// 4 Multiply; Custom is rejected JS-side), packed into flags bits 7..9.
  int get blending => (flags >> 7) & 0x07;
  bool get depthTest => flags & 0x08 != 0;
  bool get depthWrite => flags & 0x10 != 0;
  bool get wireframe => flags & 0x20 != 0;
  bool get sizeAttenuation => flags & 0x40 == 0;

  /// Upstream `Material.colorWrite` (R1 v8 flag bit 10): false disables all
  /// color-attachment writes for draws using this material.
  bool get colorWrite => flags & 0x400 == 0;

  /// R1 v8: the stencil tail is present (flag bit 11).
  bool get hasStencil => flags & 0x800 != 0;
}

final class JsThreeNodeUpsert extends JsThreeCommand {
  JsThreeNodeUpsert._({
    required this.nodeId,
    required this.parentId,
    required this.geometryId,
    required this.materialId,
    required this.flags,
    required this.objectKind,
    required this.matrixWorld,
    required this.shadowFlags,
    required this.spriteCenterX,
    required this.spriteCenterY,
    required this.renderOrder,
  }) : super._(4);

  final int nodeId;
  final int parentId;
  final int geometryId;
  final int materialId;
  final int flags;
  final JsThreeObjectKind objectKind;
  final Float32List matrixWorld;
  final int shadowFlags;

  /// Sprite anchor X/Y (R1 v5), upstream `Sprite.center` in [0, 1]; both
  /// default to 0.5 for v3/v4 streams and non-sprite nodes.
  final double spriteCenterX;
  final double spriteCenterY;

  /// Upstream Object3D.renderOrder (R1 v7), zero for older streams.
  final double renderOrder;

  bool get visible => flags & 1 != 0;
  bool get castShadow => shadowFlags & 1 != 0;
  bool get receiveShadow => shadowFlags & 2 != 0;
}

final class JsThreeRemoveNode extends JsThreeCommand {
  const JsThreeRemoveNode._(this.nodeId) : super._(5);

  final int nodeId;
}

final class JsThreeCameraUpsert extends JsThreeCommand {
  JsThreeCameraUpsert._({
    required this.cameraId,
    required this.type,
    required this.matrixWorldInverse,
    required this.projectionMatrix,
    required this.matrixWorld,
  }) : super._(6);

  final int cameraId;
  final JsThreeCameraType type;
  final Float32List matrixWorldInverse;
  final Float32List projectionMatrix;
  final Float32List matrixWorld;
}

final class JsThreeLightUpsert extends JsThreeCommand {
  JsThreeLightUpsert._({
    required this.lightId,
    required this.type,
    required this.colorR,
    required this.colorG,
    required this.colorB,
    required this.intensity,
    required this.worldPosition,
    required this.worldDirection,
    required this.groundColorR,
    required this.groundColorG,
    required this.groundColorB,
    required this.spotAngle,
    required this.spotPenumbra,
    required this.spotDistance,
    required this.spotDecay,
  }) : super._(7);

  final int lightId;
  final JsThreeLightType type;

  /// Sky color for hemisphere lights, ordinary color for all other types.
  final double colorR;
  final double colorG;
  final double colorB;
  final double intensity;
  final Float32List worldPosition;
  final Float32List worldDirection;

  /// Zero for legacy light types; finite ground RGB for hemisphere lights.
  final double groundColorR;
  final double groundColorG;
  final double groundColorB;

  /// Zero for non-spot types; cone parameters for spot lights.
  final double spotAngle;
  final double spotPenumbra;
  final double spotDistance;
  final double spotDecay;
}

final class JsThreeSubmitFrame extends JsThreeCommand {
  // Not const: batchSequence is stamped per envelope at decode-apply time.
  JsThreeSubmitFrame._({
    required this.sceneId,
    required this.cameraId,
    required this.backgroundR,
    required this.backgroundG,
    required this.backgroundB,
    required this.backgroundA,
    required this.exposure,
    required this.fogMode,
    required this.fogColorR,
    required this.fogColorG,
    required this.fogColorB,
    required this.fogNear,
    required this.fogFar,
    required this.shadowMapWidth,
    required this.shadowMapHeight,
    required this.shadowBias,
    required this.shadowNormalBias,
    required this.shadowRadius,
    required this.shadowLightType,
    required this.shadowMatrix,
    this.shadowContentRevision,
    this.culledNodeIds = const <int>{},
    this.culledShadowNodeIds = const <int>{},
    this.toneMapping = JsThreeToneMapping.none,
    this.toneMappingExposure = 1,
    this.fogDensity = 0,
    this.hasPointShadow = 0,
    this.pointShadowLightX = 0,
    this.pointShadowLightY = 0,
    this.pointShadowLightZ = 0,
    this.pointShadowFar = 0,
    this.renderTargetId = 0,
    this.targetWidth = 0,
    this.targetHeight = 0,
    this.viewportX = 0,
    this.viewportY = 0,
    this.viewportWidth = 0,
    this.viewportHeight = 0,
    this.scissorX = 0,
    this.scissorY = 0,
    this.scissorWidth = 0,
    this.scissorHeight = 0,
    this.frameFlags = 3,
    this.frameStartClearStencil = true,
  }) : super._(8);

  /// Envelope sequence this frame was decoded from. Frames of one JS tick
  /// share the value, letting the pump drop whole superseded ticks.
  int batchSequence = 0;

  final int sceneId;
  final int cameraId;
  final double backgroundR;
  final double backgroundG;
  final double backgroundB;
  final double backgroundA;
  final double exposure;
  final JsThreeFogMode fogMode;
  final double fogColorR;
  final double fogColorG;
  final double fogColorB;
  final double fogNear;
  final double fogFar;
  final int shadowMapWidth;
  final int shadowMapHeight;
  final double shadowBias;
  final double shadowNormalBias;
  final double shadowRadius;
  final Float32List shadowMatrix;

  /// Which light owns the frame's single shadow map (R1 v3).
  final int shadowLightType;

  /// Frame tone mapping mode (R1 v4); [JsThreeToneMapping.none] for v3
  /// streams, matching the pre-v4 NoToneMapping-only renderer.
  final JsThreeToneMapping toneMapping;

  /// Upstream `WebGLRenderer.toneMappingExposure` (R1 v4). Kept in sync with
  /// [exposure]; both carry the same value, [exposure] predates v4.
  final double toneMappingExposure;

  /// FogExp2 density (R1 v4); zero unless [fogMode] is exp2.
  final double fogDensity;

  /// Whether the shadow map is a point-light dual-paraboloid pair (R1 v5);
  /// 1 when [shadowLightType] is [JsThreeShadowLightType.point], else 0.
  final int hasPointShadow;

  /// Shadow-casting point light world position (R1 v5); zeros when inactive.
  final double pointShadowLightX;
  final double pointShadowLightY;
  final double pointShadowLightZ;

  /// Point shadow depth normalization range in world units (R1 v5); the
  /// shadow pass maps light-space distance into [0, 1] with this far plane.
  final double pointShadowFar;

  /// Optional R1 v6 frame trailer. Zero selects the default framebuffer.
  final int renderTargetId;
  final int targetWidth;
  final int targetHeight;
  final double viewportX;
  final double viewportY;
  final double viewportWidth;
  final double viewportHeight;
  final double scissorX;
  final double scissorY;
  final double scissorWidth;
  final double scissorHeight;
  final int frameFlags;

  /// Frame-start stencil clear to 0 (R1 v8 FRAME_TARGET_FLAGS bit 0x10 =
  /// upstream autoClearStencil / clear(color, depth, stencil); the encoder
  /// emits the bit only when the frame touches stencil state). Streams
  /// below v8 predate the bit and default to true, preserving the bounded
  /// lane's legacy always-clear attachment behavior.
  final bool frameStartClearStencil;

  bool get clearColor => frameFlags & 1 != 0;
  bool get clearDepth => frameFlags & 2 != 0;
  bool get scissorTest => frameFlags & 4 != 0;
  bool get hasViewport => frameFlags & 8 != 0;

  bool get hasSpotShadow =>
      shadowLightType == JsThreeShadowLightType.spot.wireValue;
  bool get hasPointShadowMap =>
      shadowLightType == JsThreeShadowLightType.point.wireValue;

  /// Manual THREE shadow revision; null follows global scene content changes.
  final int? shadowContentRevision;

  /// Main-camera-culled nodes. Shadow rendering still considers these nodes.
  final Set<int> culledNodeIds;

  /// Nodes outside the directional shadow camera, independent of main culling.
  final Set<int> culledShadowNodeIds;

  bool get hasShadow => shadowMapWidth > 0;
}

final class JsThreeDisposeResource extends JsThreeCommand {
  const JsThreeDisposeResource._(this.resourceId, this.resourceKind)
    : super._(9);

  final int resourceId;
  final JsThreeResourceKind resourceKind;
}

final class JsThreeDisposeSurface extends JsThreeCommand {
  const JsThreeDisposeSurface._() : super._(10);
}

/// One geometry/material range in a [JsThreeDrawBatchUpsert].
final class JsThreeDrawBatchPart {
  const JsThreeDrawBatchPart._({
    required this.geometryId,
    required this.materialId,
    required this.offset,
    required this.count,
  });

  final int geometryId;
  final int materialId;

  /// An index offset for indexed geometry, otherwise a vertex offset.
  final int offset;
  final int count;
}

/// A versioned set of draws and optional local instance matrices for one node.
final class JsThreeDrawBatchUpsert extends JsThreeCommand {
  const JsThreeDrawBatchUpsert._({
    required this.nodeId,
    required this.version,
    required this.instanceCount,
    required this.flags,
    required this.parts,
    required this.instanceMatrices,
    required this.instanceColors,
  }) : super._(11);

  final int nodeId;
  final int version;
  final int instanceCount;
  final int flags;
  final List<JsThreeDrawBatchPart> parts;

  /// Sixteen column-major floats per instance.
  final Float32List instanceMatrices;

  /// Three linear-space RGB floats per instance; empty without flag bit 2.
  final Float32List instanceColors;

  bool get instanced => flags & 1 != 0;
  bool get hasInstanceColors => flags & 2 != 0;
}

final class JsThreeRemoveBatch extends JsThreeCommand {
  const JsThreeRemoveBatch._(this.nodeId) : super._(12);

  final int nodeId;
}

/// A resolved set of world-space clipping planes (R1 v3).
/// Each plane is four floats: unit normal XYZ + constant.
final class JsThreeClippingUpsert extends JsThreeCommand {
  const JsThreeClippingUpsert._({
    required this.clipId,
    required this.version,
    required this.planes,
  }) : super._(13);

  final int clipId;
  final int version;
  final Float32List planes;

  int get planeCount => planes.length ~/ 4;
}

/// A mid-stream stencil-buffer clear (R1 v8, OPCODE.STENCIL_CLEAR): the
/// body is `u32 nodeId + u32 value`. The backend applies the clear after
/// all draws of [nodeId] in its sorted draw order (renderOrder);
/// [nodeId] 0 means "at this stream position" (no owning draw). [value]
/// must fit the bounded lane's 8-bit stencil attachment.
final class JsThreeStencilClear extends JsThreeCommand {
  const JsThreeStencilClear._({
    required this.nodeId,
    required this.value,
  }) : super._(15);

  /// Owning node id; zero when the clear is not bound to a node's draws.
  final int nodeId;

  /// Stencil buffer clear value (0..255).
  final int value;
}
