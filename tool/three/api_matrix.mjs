// THREE r186 official-example API matrix generator.
//
// Scans the pinned source tree's examples for the THREE.* classes and
// three/addons imports each module uses, maps them onto the R1 native
// facade's supported surface, and emits:
//   - tool/three/api_matrix.json  (committed snapshot; the test diffs it)
//   - a markdown table on stdout (human diff of ported vs not)
//
// Usage: node tool/three/api_matrix.mjs [--source /tmp/jsr-three-r186]
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const SOURCE = path.resolve(
  process.argv.includes('--source')
    ? process.argv[process.argv.indexOf('--source') + 1]
    : process.env.THREE_SRC || '/tmp/jsr-three-r186'
);
const EXAMPLES = path.join(SOURCE, 'examples');

// ---------------------------------------------------------------------------
// R1 facade support map. Keep in sync with tool/three/src/native_renderer.js
// (materialKind/validateMaterial), runtime.js, native_loaders.js and the
// prepared registry in bin/jsr_three_example.dart.
//
// Entry shape: { status: 'ok'|'bounded'|'no'|'unverified', note?, webLane? }.
//   - 'ok'/'bounded'/'no': the native R1 facade verdict.
//   - 'unverified': known API, deliberately NOT probed yet — keeps the
//     example in 'unknown-api' instead of silently promoting it, and the
//     note says what needs a probe.
//   - webLane: true on a 'no' entry marks a DELIBERATE web-lane verdict:
//     the capability needs GLSL passes / offscreen render targets the native
//     R1 lane will not implement, and the real upstream renderer covers it
//     on the web build (Worker OffscreenCanvas). Examples whose only
//     blockers are web-lane get verdict 'web-lane' (not plain 'blocked').
// ---------------------------------------------------------------------------

/** @type {Record<string, {status: 'ok'|'bounded'|'no'|'unverified', note?: string, webLane?: boolean}>} */
const API = {
  // Materials.
  MeshBasicMaterial: { status: 'ok' },
  MeshLambertMaterial: { status: 'ok' },
  MeshStandardMaterial: { status: 'ok' },
  MeshPhongMaterial: { status: 'ok' },
  MeshNormalMaterial: { status: 'ok' },
  ShadowMaterial: { status: 'ok', note: 'kind 7, shadow-factor-as-alpha' },
  LineBasicMaterial: { status: 'ok' },
  LineDashedMaterial: { status: 'no', note: 'R1 line kind excludes dashed' },
  PointsMaterial: { status: 'ok' },
  ShaderMaterial: { status: 'no', webLane: true, note: 'web-lane: GLSL passes — upstream renderer on the web build' },
  RawShaderMaterial: { status: 'no', webLane: true, note: 'web-lane: GLSL passes — upstream renderer on the web build' },
  MeshPhysicalMaterial: { status: 'no', note: 'physical extensions unsupported' },
  MeshToonMaterial: { status: 'ok', note: 'R1 v5 ton kind + gradientMap steps' },
  CubeTexture: { status: 'bounded', note: 'R1 v5 cube texture lane (CubeReflectionMapping only)' },
  MeshDepthMaterial: { status: 'no' },
  MeshDistanceMaterial: { status: 'no' },
  SpriteMaterial: { status: 'ok', note: 'R1 v5 sprite material (rotation, fog, tone mapping)' },

  // Lights.
  AmbientLight: { status: 'ok' },
  DirectionalLight: { status: 'ok' },
  PointLight: { status: 'ok', note: 'point shadows via dual-paraboloid shadow map (R1 v5, bounded)' },
  HemisphereLight: { status: 'ok' },
  SpotLight: { status: 'ok', note: 'capped at 4 visible, PCF shadow' },
  RectAreaLight: { status: 'no' },

  // Geometry (BufferGeometry family renders through the same upload path).
  BufferGeometry: { status: 'ok' },
  BoxGeometry: { status: 'ok' },
  SphereGeometry: { status: 'ok' },
  PlaneGeometry: { status: 'ok' },
  CylinderGeometry: { status: 'ok' },
  ConeGeometry: { status: 'ok' },
  TorusGeometry: { status: 'ok' },
  TorusKnotGeometry: { status: 'ok' },
  CircleGeometry: { status: 'ok' },
  RingGeometry: { status: 'ok' },
  TubeGeometry: { status: 'ok' },
  LatheGeometry: { status: 'ok' },
  ExtrudeGeometry: { status: 'ok' },
  TextGeometry: { status: 'ok', note: 'via FontLoader' },
  IcosahedronGeometry: { status: 'ok' },
  DodecahedronGeometry: { status: 'ok' },
  OctahedronGeometry: { status: 'ok' },
  TetrahedronGeometry: { status: 'ok' },
  CapsuleGeometry: { status: 'ok' },
  EdgesGeometry: { status: 'ok' },
  WireframeGeometry: { status: 'ok' },
  InstancedBufferGeometry: { status: 'ok' },
  MorphAnimMesh: { status: 'no', note: 'morph animation unsupported' },

  // Core objects.
  Mesh: { status: 'ok' },
  Points: { status: 'ok' },
  Line: { status: 'ok' },
  LineLoop: { status: 'ok' },
  LineSegments: { status: 'ok' },
  Group: { status: 'ok' },
  InstancedMesh: { status: 'ok', note: 'DRAW_BATCH GPU instancing' },
  Sprite: { status: 'ok', note: 'R1 v5 sprite billboard kind' },
  SkinnedMesh: { status: 'no', note: 'skinning unsupported in R1' },
  Bone: { status: 'no' },
  Skeleton: { status: 'no' },
  WebGLRenderTarget: { status: 'no', webLane: true, note: 'web-lane: render targets — upstream renderer on the web build' },
  WebGLCubeRenderTarget: { status: 'no', webLane: true, note: 'web-lane: render targets — upstream renderer on the web build' },
  WebGLMultipleRenderTargets: { status: 'no', webLane: true, note: 'web-lane: render targets — upstream renderer on the web build' },
  FramebufferTexture: { status: 'no', webLane: true, note: 'web-lane: framebuffer readback — upstream renderer on the web build' },

  // Textures and loaders.
  CanvasTexture: { status: 'bounded', note: 'radial gradients + fillRect only' },
  DataTexture: { status: 'ok' },
  TextureLoader: { status: 'ok', note: 'registered prepared assets' },
  Texture: { status: 'ok' },
  CompressedTexture: { status: 'no' },
  GLTFLoader: { status: 'bounded', note: 'static meshes; no skin' },
  DRACOLoader: { status: 'no' },
  FontLoader: { status: 'ok' },
  OrbitControls: { status: 'bounded', note: 'pinned addon + host events' },
  TransformControls: { status: 'no' },

  // Systems.
  Raycaster: { status: 'ok', note: 'cached BVH on large indexed meshes' },
  Clock: { status: 'ok' },
  Vector2: { status: 'ok' }, Vector3: { status: 'ok' },
  Vector4: { status: 'ok' }, Color: { status: 'ok' },
  Matrix3: { status: 'ok' }, Matrix4: { status: 'ok' },
  Quaternion: { status: 'ok' }, Euler: { status: 'ok' },
  Frustum: { status: 'ok' }, Box2: { status: 'ok' }, Box3: { status: 'ok' },
  Sphere: { status: 'ok' }, Ray: { status: 'ok' }, Triangle: { status: 'ok' },
  Spherical: { status: 'ok' },
  CatmullRomCurve3: { status: 'ok' }, Curve: { status: 'ok' },
  SplineCurve: { status: 'ok' }, CubicBezierCurve: { status: 'ok' },
  CatmullRomCurve: { status: 'ok' },
  Object3D: { status: 'ok' }, Scene: { status: 'ok' },
  PerspectiveCamera: { status: 'ok' }, OrthographicCamera: { status: 'ok' },
  CubeCamera: { status: 'no', webLane: true, note: 'web-lane: renders into a cube render target' },
  Fog: { status: 'ok' }, FogExp2: { status: 'ok' },
  Plane: { status: 'ok', note: 'clipping planes' },
  DoubleSide: { status: 'ok' }, FrontSide: { status: 'ok' }, BackSide: { status: 'ok' },
  RepeatWrapping: { status: 'ok' }, ClampToEdgeWrapping: { status: 'ok' },
  MirroredRepeatWrapping: { status: 'ok' },
  SRGBColorSpace: { status: 'ok' }, LinearSRGBColorSpace: { status: 'ok' },
  LinearFilter: { status: 'ok' }, NearestFilter: { status: 'ok' },
  PCFSoftShadowMap: { status: 'ok' }, PCFShadowMap: { status: 'ok' },
  AdditiveBlending: { status: 'no', note: 'NormalBlending only' },
  MultiplyBlending: { status: 'no' }, SubtractiveBlending: { status: 'no' },
  CustomBlending: { status: 'no' },
  PCFShadowMap: { status: 'ok' }, BasicShadowMap: { status: 'ok' },
  NearestFilter: { status: 'ok' }, UVMapping: { status: 'ok' },
  CubeRefractionMapping: { status: 'no', webLane: true, note: 'web-lane: refracted cube sampling — upstream renderer on the web build' }, ColorManagement: { status: 'ok' },
  BufferGeometryLoader: { status: 'ok' }, SkeletonHelper: { status: 'no', note: 'skinning' },
  QuaternionKeyframeTrack: { status: 'no', note: 'bounded animation' },
  ColorKeyframeTrack: { status: 'no' }, NumberKeyframeTrack: { status: 'no' },
  VectorKeyframeTrack: { status: 'no' }, InterpolateDiscrete: { status: 'no' },
  InterpolateLinear: { status: 'no' }, BooleanKeyframeTrack: { status: 'no' },
  StringKeyframeTrack: { status: 'no' },

  // Core scene graph / geometry / material basics used by nearly every
  // classic example — all on the R1 wire.
  Scene: { status: 'ok' }, PerspectiveCamera: { status: 'ok' },
  OrthographicCamera: { status: 'ok' }, Mesh: { status: 'ok' },
  Color: { status: 'ok' }, Group: { status: 'ok' }, Fog: { status: 'ok' },
  Object3D: { status: 'ok' }, Raycaster: { status: 'ok' },
  Vector2: { status: 'ok' }, Vector3: { status: 'ok' }, Vector4: { status: 'ok' },
  Matrix3: { status: 'ok' }, Matrix4: { status: 'ok' }, Euler: { status: 'ok' },
  Quaternion: { status: 'ok' }, Box3: { status: 'ok' }, Sphere: { status: 'ok' },
  Clock: { status: 'ok' },
  PlaneGeometry: { status: 'ok' }, BoxGeometry: { status: 'ok' },
  SphereGeometry: { status: 'ok' }, CylinderGeometry: { status: 'ok' },
  ConeGeometry: { status: 'ok' }, TorusGeometry: { status: 'ok' },
  TorusKnotGeometry: { status: 'ok' }, IcosahedronGeometry: { status: 'ok' },
  OctahedronGeometry: { status: 'ok' }, DodecahedronGeometry: { status: 'ok' },
  TetrahedronGeometry: { status: 'ok' }, CircleGeometry: { status: 'ok' },
  RingGeometry: { status: 'ok' }, CapsuleGeometry: { status: 'ok' },
  LatheGeometry: { status: 'ok' }, ExtrudeGeometry: { status: 'ok' },
  TubeGeometry: { status: 'ok' }, ShapeGeometry: { status: 'ok' },
  WireframeGeometry: { status: 'ok' }, EdgesGeometry: { status: 'ok' },
  Points: { status: 'ok' }, Line: { status: 'ok' },
  LineSegments: { status: 'ok' }, LineLoop: { status: 'ok' },
  MeshPhongMaterial: { status: 'ok' }, MeshBasicMaterial: { status: 'ok' },
  MeshStandardMaterial: { status: 'ok' }, MeshLambertMaterial: { status: 'ok' },
  MeshNormalMaterial: { status: 'ok' }, MeshMatcapMaterial: { status: 'ok' },
  PointsMaterial: { status: 'ok' }, LineBasicMaterial: { status: 'ok' },
  ShadowMaterial: { status: 'ok' },
  InstancedMesh: { status: 'bounded', note: 'opaque DRAW_BATCH instancing' },
  SRGBColorSpace: { status: 'ok' }, LinearSRGBColorSpace: { status: 'ok' },
  RepeatWrapping: { status: 'ok' }, ClampToEdgeWrapping: { status: 'ok' },
  MirroredRepeatWrapping: { status: 'ok' },
  DoubleSide: { status: 'ok' }, FrontSide: { status: 'ok' }, BackSide: { status: 'ok' },
  TextureLoader: { status: 'ok' }, Texture: { status: 'ok' },
  DataTexture: { status: 'ok' }, CompressedTexture: { status: 'no' },
  Sprite: { status: 'ok', note: 'R1 v5 sprite billboard kind' },
  SpriteMaterial: { status: 'ok', note: 'R1 v5 sprite material (rotation, fog, tone mapping)' },
  Curve: { status: 'ok' }, CatmullRomCurve3: { status: 'ok' },
  SplineCurve: { status: 'ok' }, CubicBezierCurve: { status: 'ok' },
  QuadraticBezierCurve: { status: 'ok' }, LineCurve3: { status: 'ok' },
  Shape: { status: 'ok' }, Path: { status: 'ok' },
  LOD: { status: 'ok' },
  MeshDepthMaterial: { status: 'no' }, MeshDistanceMaterial: { status: 'no' },
  AddEquation: { status: 'no' },
  PCFSoftShadowMap: { status: 'ok' },
  AudioListener: { status: 'no' }, Audio: { status: 'no' },

  // Renderer + tone mapping + core odds seen across the classic examples.
  WebGLRenderer: { status: 'ok', note: 'R1 alias' },
  WebGPURenderer: { status: 'no', note: 'WebGPU outside R1' },
  ACESFilmicToneMapping: { status: 'ok', note: 'R1 v4 frame toneMapping (frag tonemapping_fragment math)' },
  NeutralToneMapping: { status: 'ok', note: 'R1 v4 frame toneMapping' },
  ReinhardToneMapping: { status: 'ok', note: 'R1 v4 frame toneMapping' },
  NoToneMapping: { status: 'ok' },
  LinearToneMapping: { status: 'ok', note: 'R1 v4 frame toneMapping' },
  AgXToneMapping: { status: 'ok', note: 'R1 v4 frame toneMapping' },
  CineonToneMapping: { status: 'ok', note: 'R1 v4 frame toneMapping' },
  Timer: { status: 'ok' },
  MathUtils: { status: 'ok' },
  AnimationMixer: { status: 'bounded', note: 'GLTF clip weights (morph)' },
  AnimationClip: { status: 'bounded', note: 'morph weights only' },
  AnimationAction: { status: 'bounded' },
  KeyframeTrack: { status: 'no' },
  Float32BufferAttribute: { status: 'ok' },
  BufferAttribute: { status: 'ok' },
  InstancedBufferAttribute: { status: 'ok' },
  PMREMGenerator: { status: 'no', webLane: true, note: 'web-lane: prefiltered env passes — upstream renderer on the web build' },
  GridHelper: { status: 'ok' },
  PolarGridHelper: { status: 'ok' },
  AxesHelper: { status: 'ok' },
  PointLightHelper: { status: 'ok' },
  SpotLightHelper: { status: 'ok' },
  DirectionalLightHelper: { status: 'ok' },
  CameraHelper: { status: 'ok' },
  BoxHelper: { status: 'ok' },
  Box3Helper: { status: 'ok' },
  VertexNormalsHelper: { status: 'ok' },
  VertexTangentsHelper: { status: 'ok' },
  EquirectangularReflectionMapping: { status: 'ok' },
  CubeReflectionMapping: { status: 'ok' },
  CubeTextureLoader: { status: 'ok', note: 'prepared cube assets' },
  VideoTexture: { status: 'no' },
  LoadingManager: { status: 'ok' },
  HalfFloatType: { status: 'ok' },
  FloatType: { status: 'ok' },
  UnsignedByteType: { status: 'ok' },
  RedFormat: { status: 'ok' },
  RGBAFormat: { status: 'ok' },
  RGFormat: { status: 'ok' },
  DynamicDrawUsage: { status: 'ok' },
  GLSL3: { status: 'no', webLane: true, note: 'web-lane: GLSL3 shader variant' },
  Data3DTexture: { status: 'no' },
  RenderPipeline: { status: 'no', note: 'WebGPU pipeline nodes' },
  NodeMaterial: { status: 'no', note: 'WebGPU/TSL' },
  BatchedMesh: { status: 'no' },
  MORPHTARGETS_NORMAL: { status: 'no' },

  // Wave-3 batch 4 finalization: engine APIs previously counted as
  // unknown-api, classified against the pinned sources and the native
  // facade. CPU classes that only feed R1 uploads are ok; GLSL/render
  // target machinery is deliberate web-lane; the rest is an honest no.
  InterleavedBuffer: { status: 'ok', note: 'decoded per-component via getComponent into the R1 upload' },
  InterleavedBufferAttribute: { status: 'ok', note: 'decoded per-component via getComponent into the R1 upload' },
  Int16BufferAttribute: { status: 'ok', note: 'typed buffer attribute → R1 upload' },
  Uint8BufferAttribute: { status: 'ok', note: 'typed buffer attribute → R1 upload' },
  GLBufferAttribute: { status: 'no', note: 'GPU-resident buffer; R1 owns buffer uploads' },
  ArrayCamera: { status: 'no', note: 'multiview per-camera viewports outside R1; only the base perspective matrices would render' },
  PlaneHelper: { status: 'ok', note: 'line/mesh helper children render through the helpers lane' },
  ArrowHelper: { status: 'ok', note: 'line/mesh helper children render through the helpers lane' },
  ImageLoader: { status: 'bounded', note: 'host asset decode lane (prepared assets)' },
  ImageBitmapLoader: { status: 'bounded', note: 'host asset decode lane (OffscreenCanvas guard)' },
  Cache: { status: 'ok', note: 'CPU loader cache (upstream JS)' },
  TextureUtils: { status: 'ok', note: 'contain/cover set repeat/offset — honored by R1 v4 UV transforms' },
  LightProbe: { status: 'ok', note: 'CPU SH light-probe data; lighting contribution stays CPU-side' },
  NoBlending: { status: 'bounded', note: 'honored on opaque draws; the transparent pass always normal-blends' },
  LinearMipMapLinearFilter: { status: 'bounded', note: 'collapsed to nearest/linear min filter; mip filtering derived, not per-mip exact' },
  NearestMipmapNearestFilter: { status: 'bounded', note: 'collapsed to nearest/linear min filter; mip filtering derived, not per-mip exact' },
  VSMShadowMap: { status: 'no', webLane: true, note: 'web-lane: VSM blur passes — upstream renderer on the web build' },
  ObjectSpaceNormalMap: { status: 'no', note: 'R1 frag has no normal-map sampling' },
  EquirectangularRefractionMapping: { status: 'no', note: 'envMap reflection sampling only; refraction not modeled' },
  MixOperation: { status: 'no', note: 'legacy combine operations outside R1' },
  AlwaysStencilFunc: { status: 'no', note: 'stencil state outside R1' },
  NotEqualStencilFunc: { status: 'no', note: 'stencil state outside R1' },
  IncrementWrapStencilOp: { status: 'no', note: 'stencil state outside R1' },
  DecrementWrapStencilOp: { status: 'no', note: 'stencil state outside R1' },
  ReplaceStencilOp: { status: 'no', note: 'stencil state outside R1' },
  ShaderChunk: { status: 'no', webLane: true, note: 'web-lane: GLSL chunk map — upstream renderer on the web build' },
  MeshBasicNodeMaterial: { status: 'no', note: 'WebGPU/TSL node materials' },
  MeshPhysicalNodeMaterial: { status: 'no', note: 'WebGPU/TSL node materials' },
  MeshPhongNodeMaterial: { status: 'no', note: 'WebGPU/TSL node materials' },
};

// Bare npm imports (importmap "imports" keys beyond three) — none are bundled.
const BARE_IMPORTS = {
  'three-subdivide': { status: 'no', note: 'npm package, not a three addon' },
  'three/webgpu': { status: 'no', note: 'WebGPU/TSL build lane' },
  'three/tsl': { status: 'no', note: 'WebGPU/TSL build lane' },
  'three-mesh-bvh': { status: 'no', note: 'npm CDN package, not bundled' },
  'three-bvh-csg': { status: 'no', note: 'npm CDN package, not bundled' },
  'web-ifc': { status: 'no', note: 'npm CDN WASM package, not bundled' },
  'postprocessing': { status: 'no', webLane: true, note: 'web-lane: npm postprocessing passes — upstream renderer on the web build' },
  'goodrays': { status: 'no', webLane: true, note: 'web-lane: npm god-ray passes — upstream renderer on the web build' },
};


// Addon imports (three/addons/...) map to support the same way.
const ADDONS = {
  'controls/OrbitControls.js': { status: 'bounded', note: 'host pointer/wheel events' },
  'controls/TransformControls.js': { status: 'no' },
  'loaders/GLTFLoader.js': { status: 'bounded', note: 'static meshes only' },
  'loaders/DRACOLoader.js': { status: 'no' },
  'loaders/FontLoader.js': { status: 'ok' },
  'utils/BufferGeometryUtils.js': { status: 'ok' },
  'libs/lil-gui.module.min.js': { status: 'bounded', note: 'bool/number/step/function' },
  'libs/stats.module.js': { status: 'ok' },
  'math/ConvexHull.js': { status: 'ok' },
  'libs/tween.module.js': { status: 'ok' },
  'geometries/TeapotGeometry.js': { status: 'ok' },
  'loaders/OBJLoader.js': { status: 'ok' },
  'loaders/STLLoader.js': { status: 'ok' },
  'loaders/PLYLoader.js': { status: 'ok' },
  'math/ImprovedNoise.js': { status: 'ok' },
  'environments/RoomEnvironment.js': { status: 'no', note: 'needs PMREM' },
  'postprocessing/EffectComposer.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/RenderPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/OutputPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/ShaderPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/UnrealBloomPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/BloomPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/TexturePass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/TAARenderPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/MaskPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/FXAAPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/FilmPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/ClearPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/SSRPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/SSAOPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/SSAARenderPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/SMAAPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/SAOPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/RenderTransitionPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/RenderPixelatedPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/OutlinePass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/LUTPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/HalftonePass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/GTAOPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/GlitchPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/DotScreenPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/CubeTexturePass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/BokehPass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'postprocessing/AfterimagePass.js': { status: 'no', webLane: true, note: 'web-lane: GLSL postprocessing passes — upstream renderer on the web build' },
  'loaders/HDRLoader.js': { status: 'no' },
  'loaders/KTX2Loader.js': { status: 'no' },
  'webxr/XRButton.js': { status: 'no' },
  'webxr/VRButton.js': { status: 'no' },
  'controls/FirstPersonControls.js': { status: 'no' },
  'controls/FlyControls.js': { status: 'no' },
  'controls/MapControls.js': { status: 'bounded' },
  'geometries/TextGeometry.js': { status: 'ok' },
  'geometries/ParametricGeometry.js': { status: 'ok' },
  'geometries/ConvexGeometry.js': { status: 'ok' },
  'loaders/ColladaLoader.js': { status: 'no' },
  'loaders/SVGLoader.js': { status: 'no' },
  'loaders/3MFLoader.js': { status: 'no' },
  'loaders/FBXLoader.js': { status: 'no' },
  'loaders/MTLLoader.js': { status: 'no' },
  'loaders/VRMLLoader.js': { status: 'no' },
  'loaders/XYZLoader.js': { status: 'ok' },
  'exporters/GLTFExporter.js': { status: 'no' },
  'exporters/OBJExporter.js': { status: 'no' },
  'exporters/PLYExporter.js': { status: 'no' },
  'physics/RapierPhysics.js': { status: 'no', note: 'WASM' },
  'helpers/RapierHelper.js': { status: 'no', note: 'WASM' },
  'lights/SunLight.js': { status: 'no', note: 'WebGPU' },
  'webxr/ARButton.js': { status: 'no' },
  'controls/TrackballControls.js': { status: 'no' },

  // Wave-3 batch 4 finalization of the remaining addon imports.
  // GLSL chunk sources consumed by ShaderMaterial/ShaderPass — web-lane.
  ...Object.fromEntries([
    'shaders/VerticalBlurShader.js', 'shaders/HorizontalBlurShader.js',
    'shaders/BleachBypassShader.js', 'shaders/WaterRefractionShader.js',
    'shaders/VolumeShader.js', 'shaders/VignetteShader.js',
    'shaders/VelocityShader.js', 'shaders/ToonShader.js',
    'shaders/SubsurfaceScatteringShader.js', 'shaders/SobelOperatorShader.js',
    'shaders/CopyShader.js', 'shaders/LuminosityHighPassShader.js',
  ].map((n) => [n, { status: 'no', webLane: true, note: 'web-lane: GLSL shader source — upstream renderer on the web build' }])),
  // Render-target / multi-pass effects — web-lane.
  'effects/AnaglyphEffect.js': { status: 'no', webLane: true, note: 'web-lane: render-target effect — upstream renderer on the web build' },
  'effects/ParallaxBarrierEffect.js': { status: 'no', webLane: true, note: 'web-lane: render-target effect — upstream renderer on the web build' },
  'effects/OutlineEffect.js': { status: 'bounded', note: 'stock-boots on R1 v5 (three-materials-toon); the GLSL displacement outline pass degrades — exact outlines stay web-lane' },
  'effects/StereoEffect.js': { status: 'no', note: 'stereo rendering outside R1' },
  'effects/AsciiEffect.js': { status: 'no', note: 'DOM text renderer — browser only' },
  // Fat lines render through LineMaterial (a ShaderMaterial) — web-lane.
  'lines/LineMaterial.js': { status: 'no', webLane: true, note: 'web-lane: fat-line GLSL passes — upstream renderer on the web build' },
  'lines/Line2.js': { status: 'no', webLane: true, note: 'web-lane: fat-line GLSL passes — upstream renderer on the web build' },
  'lines/LineSegments2.js': { status: 'no', webLane: true, note: 'web-lane: fat-line GLSL passes — upstream renderer on the web build' },
  'lines/LineSegmentsGeometry.js': { status: 'no', webLane: true, note: 'web-lane: fat-line GLSL passes — upstream renderer on the web build' },
  'lines/LineGeometry.js': { status: 'no', webLane: true, note: 'web-lane: fat-line GLSL passes — upstream renderer on the web build' },
  // Render-target based lights/helpers.
  'lights/LightProbeGenerator.js': { status: 'no', webLane: true, note: 'web-lane: PMREM extraction passes — upstream renderer on the web build' },
  'lighting/LightProbeGridWebGL.js': { status: 'no', webLane: true, note: 'web-lane: probe-grid render passes — upstream renderer on the web build' },
  'helpers/LightProbeGridHelperWebGL.js': { status: 'no', webLane: true, note: 'web-lane: probe-grid render passes — upstream renderer on the web build' },
  'objects/Reflector.js': { status: 'no', webLane: true, note: 'web-lane: render-target mirror — upstream renderer on the web build' },
  'objects/Refractor.js': { status: 'no', webLane: true, note: 'web-lane: render-target refraction — upstream renderer on the web build' },
  'csm/CSM.js': { status: 'no', webLane: true, note: 'web-lane: cascaded shadow render targets — upstream renderer on the web build' },
  'utils/ShadowMapViewer.js': { status: 'no', webLane: true, note: 'web-lane: shadow-map render target display — upstream renderer on the web build' },
  'tsl/WebGLNodesHandler.js': { status: 'no', note: 'WebGPU/TSL' },
  // CPU math / geometry / helper modules that run unmodified in QuickJS and
  // feed R1 geometry or line draws.
  'math/Octree.js': { status: 'ok', note: 'CPU collision math' },
  'math/Capsule.js': { status: 'ok', note: 'CPU collision math' },
  'math/OBB.js': { status: 'ok', note: 'CPU collision math' },
  'math/MeshSurfaceSampler.js': { status: 'ok', note: 'CPU surface sampling' },
  'math/ColorSpaces.js': { status: 'ok', note: 'CPU color conversion' },
  'helpers/OctreeHelper.js': { status: 'ok', note: 'line helper children' },
  'helpers/LightProbeHelper.js': { status: 'ok', note: 'line helper children' },
  'helpers/VertexNormalsHelper.js': { status: 'ok', note: 'line helper children' },
  'helpers/VertexTangentsHelper.js': { status: 'ok', note: 'line helper children' },
  'csm/CSMHelper.js': { status: 'ok', note: 'line helper children' },
  'geometries/DecalGeometry.js': { status: 'ok', note: 'CPU projection into a BufferGeometry' },
  'geometries/ParametricFunctions.js': { status: 'ok', note: 'CPU parametric math' },
  'curves/NURBSCurve.js': { status: 'ok', note: 'CPU spline math' },
  'curves/NURBSSurface.js': { status: 'ok', note: 'CPU spline math' },
  'curves/NURBSVolume.js': { status: 'ok', note: 'CPU spline math' },
  'misc/ConvexObjectBreaker.js': { status: 'ok', note: 'CPU mesh split (uses ConvexHull)' },
  'modifiers/EdgeSplitModifier.js': { status: 'ok', note: 'CPU mesh edit' },
  'modifiers/SimplifyModifier.js': { status: 'ok', note: 'CPU mesh decimation' },
  'objects/ShadowMesh.js': { status: 'ok', note: 'CPU-positioned mesh' },
  'textures/FlakesTexture.js': { status: 'ok', note: 'procedural DataTexture (CPU)' },
  'exporters/STLExporter.js': { status: 'ok', note: 'CPU string export' },
  'offscreen/jank.js': { status: 'ok', note: 'plain CPU harness module' },
  'offscreen/scene.js': { status: 'no', note: 'browser Worker entry (self.onmessage harness)' },
  // Honest no: browser-only capabilities.
  'renderers/CSS3DRenderer.js': { status: 'no', note: 'browser DOM renderer' },
  'renderers/CSS2DRenderer.js': { status: 'no', note: 'browser DOM renderer' },
  'capabilities/WebGL.js': { status: 'no', note: 'browser capability probe' },
  'controls/PointerLockControls.js': { status: 'no', note: 'Pointer Lock API — browser only' },
  'interactive/SelectionHelper.js': { status: 'no', note: 'DOM overlay rectangle' },
  'physics/AmmoPhysics.js': { status: 'no', note: 'WASM' },
  'exporters/DRACOExporter.js': { status: 'no', note: 'WASM encoder' },
  'loaders/KTXLoader.js': { status: 'no', note: 'basis/KTX2 WASM decode' },
  'loaders/HDRCubeTextureLoader.js': { status: 'no', note: 'RGBE float lane (HDRLoader family)' },
  'misc/MD2Character.js': { status: 'no', note: 'morph-frame animation outside R1' },
  'utils/UVsDebug.js': { status: 'no', note: 'canvas lane covers fillRect/gradient only' },
  'transpiler/Transpiler.js': { status: 'no', note: 'WebGPU/TSL toolchain' },
  'transpiler/GLSLDecoder.js': { status: 'no', note: 'WebGPU/TSL toolchain' },
  'transpiler/WGSLEncoder.js': { status: 'no', note: 'WebGPU/TSL toolchain' },
  'transpiler/TSLEncoder.js': { status: 'no', note: 'WebGPU/TSL toolchain' },
  // Known but deliberately unverified: decode/input lanes that plausibly
  // run in QuickJS but have no probe yet — kept out of 'supported'.
  'loaders/UltraHDRLoader.js': { status: 'unverified', note: 'gain-map HDR decode lane — needs a probe' },
  'loaders/EXRLoader.js': { status: 'bounded', note: 'pure-JS RGBE/zip decode (fflate) → DataTexture upload — proven by three-materials-matcap stock boot' },
  'loaders/TGALoader.js': { status: 'unverified', note: 'pure-JS decode — needs a probe' },
  'loaders/PVRLoader.js': { status: 'unverified', note: 'pure-JS decode — needs a probe' },
  'loaders/TIFFLoader.js': { status: 'unverified', note: 'pure-JS decode — needs a probe' },
  'loaders/TTFLoader.js': { status: 'unverified', note: 'pure-JS font decode — needs a probe' },
  'loaders/VOXLoader.js': { status: 'unverified', note: 'pure-JS voxel decode — needs a probe' },
  'loaders/3DMLoader.js': { status: 'unverified', note: 'pure-JS zip decode — needs a probe' },
  'loaders/AMFLoader.js': { status: 'unverified', note: 'pure-JS zip decode — needs a probe' },
  'loaders/GCodeLoader.js': { status: 'unverified', note: 'pure-JS decode — needs a probe' },
  'loaders/KMZLoader.js': { status: 'unverified', note: 'pure-JS zip decode — needs a probe' },
  'loaders/PCDLoader.js': { status: 'unverified', note: 'pure-JS point-cloud decode — needs a probe' },
  'controls/DragControls.js': { status: 'unverified', note: 'plausible on the input lane — needs a probe' },
  'interactive/SelectionBox.js': { status: 'unverified', note: 'reads renderer.domElement geometry — needs a facade probe' },
};

// Prepared-widget registry (bin/jsr_three_example.dart _examples) — read
// straight from the source of truth so the matrix can never drift.
import { readFile as _rf } from 'node:fs/promises';
const registrySource = await _rf(path.join(ROOT, 'bin/jsr_three_example.dart'), 'utf8');
const registryIds = new Set();
for (const line of registrySource.split('\n')) {
  const m = line.trim().match(/^'([a-z0-9_]+)',$/);
  if (m) registryIds.add(m[1]);
}

const threeRef = /\bTHREE\.([A-Z][A-Za-z0-9_]*)/g;
const importFrom = /import\s*(?:\{[^}]*\}|[\w$]+)\s*from\s*'three\/addons\/([^']+)'/g;

// Bare specifier imports (three-subdivide etc.) — always from the html importmap.
const bareImport = /import\s*(?:\{[^}]*\}|[\w$]+)\s*from\s*'([^'.\/][^']*)'/g;
const importmapSpec = /"imports"\s*:\s*\{[\s\S]*?\n\s*\}/;

// Per-example overrides where the static API scan cannot see the blocker:
// the module text uses only supported APIs but the render architecture or
// the loaded asset goes beyond the facade. Keyed by example id.
const EXAMPLE_OVERRIDES = {
  // ammo.js (WASM physics) arrives via a classic <script src> tag, invisible
  // to the import scan; the module calls Ammo() directly.
  ...Object.fromEntries([
    'physics_ammo_break', 'physics_ammo_cloth', 'physics_ammo_rope',
    'physics_ammo_terrain', 'physics_ammo_volume',
  ].map((id) => [id, 'ammo.js WASM physics loaded via classic script tag — outside the native lane'])),
  // The horse JSON carries morphAttributes; R1 rejects morphTargets at the
  // protocol level and no code-level reference exists to detect statically.
  webgl_morphtargets_horse: 'geometry JSON carries morphAttributes — R1 rejects morphTargets at the protocol level',
  // Viewport-tiling / multi-canvas harnesses: setViewport/setScissor are
  // documented no-ops on the R1 alias and DOM canvases do not exist natively.
  webgl_multiple_elements: 'tiles one renderer across DOM canvases via setViewport — R1 no-ops viewport tiling',
  webgl_multiple_elements_text: 'tiles one renderer across DOM canvases via setViewport — R1 no-ops viewport tiling',
  webgl_multiple_views: 'setViewport/setScissor view tiling — R1 no-ops viewport tiling',
  webgl_multiple_scenes_comparison: 'compares scenes on separate DOM canvases — single-surface facade',
  // Prepared as a documented web-lane module: the cube faces arrive as
  // OffscreenCanvas-decoded jpgs that stay unregistered on native.
  webgl_materials_cubemap_refraction: { verdict: 'web-lane', note: 'cube faces arrive as OffscreenCanvas-decoded jpgs — assets stay unregistered on native (documented facade gap); runs on the web build' },
};

function classify(uses) {  const entry = (u) =>
    u.name ? API[u.name] : (u.import ? ADDONS[u.import] : BARE_IMPORTS[u.bare]);
  // Missing = no map entry at all, or a deliberate 'unverified' entry
  // (known API, unprobed lane — never silently promoted to supported).
  const missing = uses.filter((u) => {
    const e = entry(u);
    return !e || e.status === 'unverified';
  });
  const blockers = uses.filter((u) => {
    const e = entry(u);
    return e && e.status === 'no';
  });
  if (missing.length === 0 && blockers.length === 0) return 'supported';
  if (blockers.length === 0) return 'unknown-api';
  // Deliberate web-lane verdict: every known blocker needs GLSL passes or
  // offscreen render targets the native R1 lane will not implement; the
  // upstream renderer covers them on the web build.
  if (blockers.every((u) => entry(u).webLane)) return 'web-lane';
  return 'blocked';
}

const files = (await readdir(EXAMPLES)).filter(f => f.endsWith('.html')).sort();
const rows = [];
for (const file of files) {
  const id = file.replace(/\.html$/, '');
  const html = await readFile(path.join(EXAMPLES, file), 'utf8');
  const mod = /<script\b[^>]*type="module"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!mod) continue;
  const code = mod[1];
  const uses = [];
  const seen = new Set();
  for (const m of code.matchAll(threeRef)) {
    const key = `c:${m[1]}`;
    if (!seen.has(key)) { seen.add(key); uses.push({ name: m[1] }); }
  }
  for (const m of code.matchAll(importFrom)) {
    const key = `a:${m[1]}`;
    if (!seen.has(key)) { seen.add(key); uses.push({ import: m[1] }); }
  }
  const importmap = importmapSpec.exec(html);
  const mapped = importmap ? importmap[0] : '';
  for (const m of code.matchAll(bareImport)) {
    if (m[1] === 'three' || mapped.includes(`"${m[1]}"`)) {
      const key = `b:${m[1]}`;
      if (!seen.has(key)) { seen.add(key); uses.push({ bare: m[1] }); }
    }
  }
  // R1 rejects morph attributes at the protocol level — surface it as a
  // blocker rather than letting these masquerade as 'supported'.
  const usesMorph = /morphAttributes|morphTargetsRelative|\.morphTargetInfluences/.test(code);
  let verdict = usesMorph ? 'blocked' : classify(uses);
  let override = null;
  const forced = EXAMPLE_OVERRIDES[id];
  if (typeof forced === 'string') {
    verdict = 'blocked';
    override = forced;
  } else if (forced) {
    verdict = forced.verdict;
    override = forced.note;
  }
  const entry = (u) =>
    u.name ? API[u.name] : (u.import ? ADDONS[u.import] : BARE_IMPORTS[u.bare]);
  const label = (u) => u.name ?? (u.import ? `addon:${u.import}` : `bare:${u.bare}`);
  rows.push({
    id,
    prepared: registryIds.has(id),
    verdict,
    uses: uses.map(label),
    blockers: uses
      .filter(u => {
        const e = entry(u);
        return e && e.status === 'no';
      })
      .map(u => `${label(u)}${entry(u).note ? ` (${entry(u).note})` : ''}${entry(u).webLane ? ' [web-lane]' : ''}`),
    unknown: uses.filter(u => {
      const e = entry(u);
      return !e || e.status === 'unverified';
    }).map(u => {
      const e = entry(u);
      return e ? `${label(u)} (unverified: ${e.note})` : label(u);
    }),
    ...(override ? { override } : {}),
  });
}

const matrix = {
  source: 'three r186 pinned',
  generatedAt: new Date().toISOString().slice(0, 10),
  totals: {
    examples: rows.length,
    supported: rows.filter(r => r.verdict === 'supported').length,
    blocked: rows.filter(r => r.verdict === 'blocked').length,
    webLane: rows.filter(r => r.verdict === 'web-lane').length,
    unknownApi: rows.filter(r => r.verdict === 'unknown-api').length,
    prepared: rows.filter(r => r.prepared).length,
  },
  rows,
};

if (process.argv.includes('--write')) {
  await writeFile(path.join(ROOT, 'tool/three/api_matrix.json'), JSON.stringify(matrix, null, 2) + '\n');
}

const show = process.argv.includes('--markdown');
if (show) {
  console.log(`| example | verdict | prepared | blockers |`);
  console.log(`|---|---|---|---|`);
  for (const r of rows) {
    console.log(`| ${r.id} | ${r.verdict} | ${r.prepared ? 'yes' : ''} | ${r.blockers.slice(0, 3).join(', ')}${r.blockers.length > 3 ? ', …' : ''} |`);
  }
  console.error(JSON.stringify(matrix.totals));
}
export { matrix };
