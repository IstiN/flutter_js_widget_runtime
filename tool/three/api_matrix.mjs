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
// ---------------------------------------------------------------------------

/** @type {Record<string, {status: 'ok'|'bounded'|'no', note?: string}>} */
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
  ShaderMaterial: { status: 'no', note: '1B only: arbitrary shaders' },
  RawShaderMaterial: { status: 'no', note: '1B only: arbitrary shaders' },
  MeshPhysicalMaterial: { status: 'no', note: 'physical extensions unsupported' },
  MeshDepthMaterial: { status: 'no' },
  MeshDistanceMaterial: { status: 'no' },
  SpriteMaterial: { status: 'no', note: 'no sprite batching in R1' },

  // Lights.
  AmbientLight: { status: 'ok' },
  DirectionalLight: { status: 'ok' },
  PointLight: { status: 'ok' },
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
  Sprite: { status: 'no' },
  SkinnedMesh: { status: 'no', note: 'skinning unsupported in R1' },
  Bone: { status: 'no' },
  Skeleton: { status: 'no' },
  WebGLRenderTarget: { status: 'no', note: 'R1 renders only the surface' },
  WebGLCubeRenderTarget: { status: 'no' },
  WebGLMultipleRenderTargets: { status: 'no' },

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
  CatmullRomCurve3: { status: 'ok' }, Curve: { status: 'ok' },
  SplineCurve: { status: 'ok' }, CubicBezierCurve: { status: 'ok' },
  CatmullRomCurve: { status: 'ok' },
  Object3D: { status: 'ok' }, Scene: { status: 'ok' },
  PerspectiveCamera: { status: 'ok' }, OrthographicCamera: { status: 'ok' },
  CubeCamera: { status: 'no' },
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
  CubeRefractionMapping: { status: 'ok' }, ColorManagement: { status: 'ok' },
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
  Sprite: { status: 'no', note: 'R1 rejects isSprite objects (objectType)' },
  SpriteMaterial: { status: 'no', note: 'requires Sprite support in the R1 draw plan' },
  Curve: { status: 'ok' }, CatmullRomCurve3: { status: 'ok' },
  SplineCurve: { status: 'ok' }, CubicBezierCurve: { status: 'ok' },
  QuadraticBezierCurve: { status: 'ok' }, LineCurve3: { status: 'ok' },
  Shape: { status: 'ok' }, Path: { status: 'ok' },
  WebGLRenderTarget: { status: 'no', note: 'render targets 1B only' },
  LOD: { status: 'ok' },
  MeshDepthMaterial: { status: 'no' }, MeshDistanceMaterial: { status: 'no' },
  RawShaderMaterial: { status: 'no' },
  AddEquation: { status: 'no' },
  PCFSoftShadowMap: { status: 'ok' },
  CubeCamera: { status: 'no' }, AudioListener: { status: 'no' }, Audio: { status: 'no' },

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
  PMREMGenerator: { status: 'no', note: 'no env prefilter in R1' },
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
  GLSL3: { status: 'no' },
  Data3DTexture: { status: 'no' },
  RenderPipeline: { status: 'no', note: 'WebGPU pipeline nodes' },
  NodeMaterial: { status: 'no', note: 'WebGPU/TSL' },
  CubeCamera: { status: 'no' },
  BatchedMesh: { status: 'no' },
  MORPHTARGETS_NORMAL: { status: 'no' },
};

// Bare npm imports (importmap "imports" keys beyond three) — none are bundled.
const BARE_IMPORTS = {
  'three-subdivide': { status: 'no', note: 'npm package, not a three addon' },
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
  'postprocessing/EffectComposer.js': { status: 'no', note: 'render targets' },
  'postprocessing/RenderPass.js': { status: 'no' },
  'postprocessing/OutputPass.js': { status: 'no' },
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

function classify(uses) {
  const missing = uses.filter(u => !API[u.name] && !ADDONS[u.import] && !BARE_IMPORTS[u.bare]);
  const blockers = uses.filter(u => {
    const entry = u.name ? API[u.name] : (u.import ? ADDONS[u.import] : BARE_IMPORTS[u.bare]);
    return entry && entry.status === 'no';
  });
  if (missing.length === 0 && blockers.length === 0) return 'supported';
  if (blockers.length === 0) return 'unknown-api';
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
    if (m[1] === 'three' || mapped.includes(`"\${m[1]}"`)) {
      const key = `b:${m[1]}`;
      if (!seen.has(key)) { seen.add(key); uses.push({ bare: m[1] }); }
    }
  }
  // R1 rejects morph attributes at the protocol level — surface it as a
  // blocker rather than letting these masquerade as 'supported'.
  const usesMorph = /morphAttributes|morphTargetsRelative|\.morphTargetInfluences/.test(code);
  const verdict = usesMorph ? 'blocked' : classify(uses);
  rows.push({
    id,
    prepared: registryIds.has(id),
    verdict,
    uses: uses.map(u => u.name ?? `addon:${u.import}`),
    blockers: uses
      .filter(u => {
        const entry = u.name ? API[u.name] : ADDONS[u.import];
        return entry && entry.status === 'no';
      })
      .map(u => `${u.name ?? u.import}${(u.name ? API[u.name] : ADDONS[u.import]).note ? ` (${(u.name ? API[u.name] : ADDONS[u.import]).note})` : ''}`),
    unknown: uses.filter(u => !API[u.name ?? ''] && !ADDONS[u.import ?? '']).map(u => u.name ?? `addon:${u.import}`),
  });
}

const matrix = {
  source: 'three r186 pinned',
  generatedAt: new Date().toISOString().slice(0, 10),
  totals: {
    examples: rows.length,
    supported: rows.filter(r => r.verdict === 'supported').length,
    blocked: rows.filter(r => r.verdict === 'blocked').length,
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
