// THREE r186 ENGINE API coverage generator (engine-pure, not examples).
//
// Answers: of every symbol the three.js ENGINE exports (three.core.js +
// three.module.js union), what fraction is usable on each lane —
//   - native R1: renders through the bounded QuickJS facade + R1 binary
//     protocol -> ThreeDrawPlanner -> flutter_gpu
//   - web 1B: the real upstream renderer on a Worker OffscreenCanvas
// and what the Flutter-side analog is.
//
// Classification merges the per-class R1 support map from api_matrix.mjs
// (render-relevant symbols) with upstream-nature heuristics for the rest
// (constants, CPU-only classes that run unmodified in QuickJS, audio/XR/DOM
// classes that cannot exist on native).
//
// Usage: node tool/three/engine_coverage.mjs [--source /tmp/jsr-three-r186]
//        [--markdown] [--write]
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const SOURCE = path.resolve(
  process.argv.includes('--source')
    ? process.argv[process.argv.indexOf('--source') + 1]
    : process.env.THREE_SRC || '/tmp/jsr-three-r186'
);

// --- 1. Engine exports: three.core.js ∪ three.module.js --------------------
async function exportsOf(file) {
  const src = await readFile(path.join(SOURCE, 'build', file), 'utf8');
  const idx = src.lastIndexOf('export {');
  const end = src.indexOf('};', idx);
  const parts = src
    .slice(idx, end)
    .replace(/export\s*{/, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.map((p) => {
    const m = p.match(/^([\w$]+)\s+as\s+([\w$]+)$/);
    return m ? m[2] : p;
  });
}
const coreExports = await exportsOf('three.core.js');
const moduleExports = await exportsOf('three.module.js');
const engineExports = [...new Set([...coreExports, ...moduleExports])].sort();

// --- 2. R1 support map (per-class statuses from api_matrix.mjs) -------------
const apiMatrixSrc = await readFile(
  path.join(ROOT, 'tool/three/api_matrix.mjs'),
  'utf8'
);
const apiMap = {};
for (const m of apiMatrixSrc.matchAll(
  /\n\s*([A-Za-z_$][\w$]*):\s*\{\s*status:\s*'(ok|bounded|no)'([^}]*)\}/g
)) {
  const note = m[3].match(/note:\s*'([^']*)'/);
  apiMap[m[1]] = { status: m[2], note: note ? note[1] : '' };
}

// --- 3. Upstream-nature heuristics for the unmapped tail --------------------
const CONSTANT_LIKE =
  /(Mapping|Blending|Factor|Compare|Depth$|DepthPacking|Equation|Operation|Format|Type$|Side|Space|Mode|Order|Pattern|Winding|StencilOp|Filter|ColorSpace|Wrapping|ToneMapping|ShadowMap|Usage|Draw$|StencilFunc|Combine)$/;
// Explicit per-symbol overrides for classes the heuristics cannot infer.
const EXPLICIT = new Map([
  // CPU data containers that feed R1 uploads (proven by buffergeometry tests).
  ...[
    'InterleavedBuffer', 'InterleavedBufferAttribute', 'InstancedInterleavedBuffer',
    'Int8BufferAttribute', 'Int16BufferAttribute', 'Int32BufferAttribute',
    'Uint8BufferAttribute', 'Uint16BufferAttribute', 'Uint32BufferAttribute',
    'Float16BufferAttribute', 'Float32BufferAttribute',
  ].map((n) => [n, { status: 'ok', note: 'CPU buffer → R1 geometry upload (opcode 2)' }]),
  ...[
    'Camera', 'Light', 'LightShadow', 'Material', 'Object3D', 'Scene',
    'BufferAttribute', 'BufferGeometry', 'InstancedBufferAttribute',
    'InstancedBufferGeometry',
  ].map((n) => [n, { status: 'ok', note: 'upstream base class; R1 encodes derived kinds' }]),
  ...[
    'ArrowHelper', 'BoxHelper', 'Box3Helper', 'CameraHelper', 'DirectionalLightHelper',
    'GridHelper', 'HemisphereLightHelper', 'PlaneHelper', 'PointLightHelper',
    'PolarGridHelper', 'SkeletonHelper', 'SpotLightHelper',
  ].map((n) => [n, { status: 'ok', note: 'rendered as line draws (helpers module)' }]),
  ['Raycaster', { status: 'ok', note: 'CPU ray math in JS; picking via three.input lane' }],
  ['Uint8ClampedBufferAttribute', { status: 'ok', note: 'CPU buffer → R1 geometry upload (opcode 2)' }],
  ['BezierInterpolant', { status: 'ok', note: 'CPU animation interpolant (upstream JS)' }],
  ['Controls', { status: 'ok', note: 'upstream base class; OrbitControls runs on the input lane' }],
  ['SphericalHarmonics3', { status: 'ok', note: 'CPU light-probe data (upstream JS)' }],
  ['LightProbe', { status: 'ok', note: 'CPU light-probe data (upstream JS)' }],
  ...['cloneUniforms', 'mergeUniforms', 'log', 'warn', 'warnOnce', 'error',
    'getConsoleFunction', 'setConsoleFunction', 'isTypedArray', 'getByteLength',
    'createCanvasElement', 'createElementNS', 'yieldToMain', 'probeAsync',
    'ImageUtils', 'ColorManagement', 'Compatibility', 'Source',
  ].map((n) => [n, { status: 'ok', note: 'upstream JS utility runs in QuickJS' }]),
  ['ShapeGeometry', { status: 'ok', note: 'generateShapes triangulated in JS' }],
  ['PolyhedronGeometry', { status: 'ok', note: 'CPU-generated geometry' }],
  ['FogExp2', { status: 'no', note: 'R1 supports linear Fog only (points_billboards gap)' }],
  ['MeshMatcapMaterial', { status: 'no', note: 'material kind outside R1 kinds' }],
  ['MeshToonMaterial', { status: 'no', note: 'material kind outside R1 kinds' }],
  ['StereoCamera', { status: 'no', note: 'stereo rendering outside R1' }],
  ['GLBufferAttribute', { status: 'no', note: 'GPU-resident buffer; R1 owns buffers' }],
  ...[
    'CompressedArrayTexture', 'CompressedCubeTexture', 'CubeDepthTexture',
    'DataArrayTexture', 'DepthTexture', 'ExternalTexture', 'FramebufferTexture',
    'HTMLTexture', 'RenderTarget', 'RenderTarget3D', 'TextureSource',
  ].map((n) => [n, { status: 'no', note: 'texture class outside the R1 texture lanes' }]),
  ...[
    'FileLoader', 'ImageLoader', 'ImageBitmapLoader', 'ObjectLoader',
    'MaterialLoader', 'CompressedTextureLoader', 'DataTextureLoader',
    'CompressedTexture', 'DataTexture', 'VideoTexture', 'CubeTexture',
  ].map((n) => [n, { status: 'bounded', note: 'IO/decode lane bounded (asset lane, OffscreenCanvas guard)' }]),
  ['PositionalAudio', { status: 'no', note: 'WebAudio' }],
  ['AudioContext', { status: 'no', note: 'WebAudio' }],
  ['TimestampQuery', { status: 'no', note: 'GPU timing query' }],
]);
// Classes that run as plain CPU JS inside QuickJS and never touch the lane.
const CPU_OK = new Set([
  // math & geometry primitives
  'Box2', 'Box3', 'Sphere', 'Plane', 'Ray', 'Frustum', 'Matrix2', 'Matrix3',
  'Matrix4', 'Quaternion', 'Euler', 'Vector2', 'Vector3', 'Vector4',
  'Spherical', 'Cylindrical', 'Color', 'Layers', 'Clock', 'MathUtils',
  'DataUtils', 'EventDispatcher', 'SplineCurve', 'CubicBezierCurve',
  'CubicBezierCurve3', 'LineCurve', 'LineCurve3', 'QuadraticBezierCurve',
  'QuadraticBezierCurve3', 'ArcCurve', 'EllipseCurve', 'CatmullRomCurve3',
  'CurvePath', 'Path', 'Shape', 'ShapePath', 'ShapeUtils', 'Triangle',
  'Line3', 'Cylinder', 'Decompose',
  // animation CPU machinery
  'AnimationUtils', 'KeyframeTrack', 'BooleanKeyframeTrack',
  'ColorKeyframeTrack', 'NumberKeyframeTrack', 'QuaternionKeyframeTrack',
  'StringKeyframeTrack', 'VectorKeyframeTrack', 'QuaternionLinearInterpolant',
  'LinearInterpolant', 'CubicInterpolant', 'DiscreteInterpolant',
  'Interpolant', 'AnimationClip', 'AnimationMixer', 'AnimationAction',
  'AnimationObjectGroup', 'AnimationBindingGroup', 'PropertyBinding',
  'PropertyMixer',
  // loaders that decode as pure JS/JSON
  'AnimationLoader', 'BufferGeometryLoader', 'FontLoader', 'Loader',
  'LoaderUtils', 'Cache', 'LoadingManager', 'DefaultLoadingManager',
]);
// Never available on native (browser-only capability classes).
const NATIVE_ABSENT = new Set([
  'Audio', 'AudioAnalyser', 'AudioContext', 'AudioListener', 'AudioLoader',
  'WebXRManager', 'XRControllerModelFactory',
]);

const rows = engineExports.map((name) => {
  const mapped = apiMap[name] ?? EXPLICIT.get(name);
  if (mapped) {
    return {
      symbol: name,
      lane: mapped.status === 'no' ? 'web-only' : 'r1',
      status: mapped.status,
      flutterAnalog: mapped.note
        || (mapped.status === 'ok'
          ? 'R1 protocol opcode → ThreeDrawPlanner → flutter_gpu'
          : mapped.status === 'bounded'
            ? 'R1 bounded subset (see api_matrix note)'
            : 'no native analog — 1B web renderer only'),
    };
  }
  if (NATIVE_ABSENT.has(name)) {
    return {
      symbol: name,
      lane: 'native-absent',
      status: 'no-native',
      flutterAnalog: 'browser-only capability (audio/XR) — no QuickJS/host lane',
    };
  }
  if (CPU_OK.has(name)) {
    return {
      symbol: name,
      lane: 'upstream-cpu',
      status: 'upstream',
      flutterAnalog: 'upstream JS runs in QuickJS (CPU-only; no render surface)',
    };
  }
  if (CONSTANT_LIKE.test(name) || /^(MOUSE|TOUCH|REVISION|RAD2DEG|DEG2RAD|GLSL|LEGACY|Interpolate|Loop|NoNormalPacking|NormalGA|NormalRG|ObjectSpace|TangentSpace|SRGBTransfer|LinearTransfer|CullFace|WrapAroundEnding|ZeroCurvatureEnding|ZeroSlopeEnding|.*CoordinateSystem$)/.test(name)) {
    return {
      symbol: name,
      lane: 'constant',
      status: 'constant',
      flutterAnalog: 'enum value accepted; only the R1-honored subset changes pixels',
    };
  }
  // Everything else: materialized upstream in QuickJS but with a render- or
  // IO-dependent part our facade has not classified yet.
  return {
    symbol: name,
    lane: 'unclassified',
    status: 'unclassified',
    flutterAnalog: 'present as upstream JS; render/IO behavior unverified',
  };
});

const tally = (fn) => rows.filter(fn).length;
const totals = {
  engineExports: rows.length,
  r1Ok: tally((r) => r.status === 'ok'),
  r1Bounded: tally((r) => r.status === 'bounded'),
  r1No: tally((r) => r.status === 'no'),
  upstreamCpu: tally((r) => r.status === 'upstream'),
  constants: tally((r) => r.status === 'constant'),
  nativeAbsent: tally((r) => r.status === 'no-native'),
  unclassified: tally((r) => r.status === 'unclassified'),
};
// Honest headline numbers:
//  - render-honored = R1 ok + bounded (of the render-relevant classified set)
//  - quickjs-usable = everything that materializes and runs on native
totals.renderHonored = totals.r1Ok + totals.r1Bounded;
totals.renderRelevantClassified =
  totals.renderHonored + totals.r1No;
totals.quickjsUsable =
  totals.renderHonored + totals.upstreamCpu + totals.constants;
totals.renderHonoredPct = +((totals.renderHonored / rows.length) * 100).toFixed(1);
totals.quickjsUsablePct = +((totals.quickjsUsable / rows.length) * 100).toFixed(1);
totals.webLanePct = 100; // real upstream renderer on Worker OffscreenCanvas

const matrix = {
  source: 'three r186 pinned (three.core.js ∪ three.module.js exports)',
  generatedAt: new Date().toISOString().slice(0, 10),
  totals,
  rows,
};

if (process.argv.includes('--write')) {
  await writeFile(
    path.join(ROOT, 'tool/three/engine_coverage.json'),
    JSON.stringify(matrix, null, 2) + '\n'
  );
}

if (process.argv.includes('--markdown')) {
  console.log('| symbol | lane | status | flutter analog |');
  console.log('|---|---|---|---|');
  for (const r of rows) {
    console.log(`| ${r.symbol} | ${r.lane} | ${r.status} | ${r.flutterAnalog} |`);
  }
}
console.error(JSON.stringify(totals, null, 2));
export { matrix };
