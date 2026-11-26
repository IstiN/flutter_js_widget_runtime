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
import { existsSync } from 'node:fs';
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
  apiMap[m[1]] = {
    status: m[2],
    note: note ? note[1] : '',
    // Deliberate web-lane verdict: capability needs GLSL passes / offscreen
    // render targets the native R1 lane will not implement; the upstream
    // renderer covers it on the web build (Worker OffscreenCanvas).
    webLane: /webLane:\s*true/.test(m[3]),
  };
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
  ['FogExp2', { status: 'ok', note: 'R1 v4 frame fog mode + density (exp2 in three_r1.frag)' }],
  ['MeshMatcapMaterial', { status: 'ok', note: 'R1 v5 matcap kind + matcap texture slot (EXR decode lane)' }],
  // Deliberate web-lane: GLSL passes / offscreen render targets — the
  // native R1 lane renders only to the surface; the upstream renderer on
  // the web build (Worker OffscreenCanvas) is the lane for these. Kept as
  // render-not-honored WITH this documented reason, never unclassified.
  ['ShaderChunk', { status: 'no', webLane: true, note: 'web-lane: GLSL chunk map — upstream renderer on the web build' }],
  ['ShaderLib', { status: 'no', webLane: true, note: 'web-lane: GLSL program library — upstream renderer on the web build' }],
  ['Uniform', { status: 'no', webLane: true, note: 'web-lane: GLSL uniform container — upstream renderer on the web build' }],
  ['UniformsLib', { status: 'no', webLane: true, note: 'web-lane: GLSL uniform templates — upstream renderer on the web build' }],
  ['WebGL3DRenderTarget', { status: 'no', webLane: true, note: 'web-lane: render targets — upstream renderer on the web build' }],
  ['WebGLArrayRenderTarget', { status: 'no', webLane: true, note: 'web-lane: render targets — upstream renderer on the web build' }],
  ['WebGLUtils', { status: 'no', webLane: true, note: 'web-lane: live WebGL context enum conversion — upstream renderer on the web build' }],
  ['UniformsGroup', { status: 'no', note: 'WebGPU uniform buffer group — WebGPU lane' }],
  ['UniformsUtils', { status: 'ok', note: 'upstream JS utility runs in QuickJS (GLSL consumers are web-lane)' }],
  ['TextureUtils', { status: 'upstream', note: 'contain/cover adjust repeat/offset — render-honored through R1 v4 UV transforms' }],
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
    'CompressedTexture', 'VideoTexture',
  ].map((n) => [n, { status: 'bounded', note: 'IO/decode lane bounded (asset lane, OffscreenCanvas guard)' }]),
  ['DataTexture', { status: 'ok', note: 'R1 v5 data texture uploads (gradient maps, EXR decode lane)' }],
  ['CubeTexture', { status: 'bounded', note: 'R1 v5 cube texture lane (CubeReflectionMapping only)' }],
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
  // multi-view culling math for ArrayCamera-style renderers
  'FrustumArray',
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
  'WebXRManager', 'XRControllerModelFactory', 'WebXRController',
  'VideoFrameTexture',
]);

// api_matrix 'ok' entries that are pure CPU utilities or plain constant
// maps (no render surface of their own). Engine coverage keeps them out of
// render-honored so the headline stays honest; the api matrix lists them ok
// because official examples only need them as CPU JS.
const UTILITY_ONLY = new Map([
  ['Cache', { status: 'upstream', note: 'CPU loader cache (upstream JS)' }],
  ['TOUCH', { status: 'constant', note: 'input constant map; the lane reads host pointer events' }],
]);

// --- 2b. Native-1B promotions (issue #8 AC13, segment F4h) ------------------
// The MEASURED native-1B lane: the original WebGLRenderer over the WebGL2
// facade + ANGLE (the angle1b backend). A row is promoted or annotated only
// with green-test evidence; test/engine_coverage_test.mjs validates every
// evidence object (files exist, ids contained) and every promoted row carries
// one. Engine exports move from web-only to the '1b' lane; the addon symbols
// the cinematic pipeline is composed of join as kind:'addon' rows (they are
// three/addons modules, not engine exports).

// Engine exports proven on native 1B (lane promotion web-only -> 1b).
const ONE_B_ENGINE = {
  PMREMGenerator: {
    analog: '1B: upstream PMREM passes over the WebGL2 facade + ANGLE (envmaps_hdr/exr exact)',
    evidence: {
      ids: ['E2E-ENV', 'three-materials-envmaps-hdr', 'three-materials-envmaps-exr'],
      tests: ['tool/three/cases_f4d.sh'],
    },
  },
  CubeCamera: {
    analog: '1B: upstream cube-camera passes over the facade + ANGLE (cubemap-dynamic renders, 0xf908b0d1)',
    evidence: {
      ids: ['E2E-ENV', 'three-materials-cubemap-dynamic'],
      tests: ['tool/three/cases_f4d.sh'],
    },
  },
  WebGLCubeRenderTarget: {
    analog: '1B: upstream cube render targets over the facade + ANGLE',
    evidence: {
      ids: ['E2E-ENV', 'three-materials-cubemap-dynamic'],
      tests: ['tool/three/cases_f4d.sh'],
    },
  },
};

// Evidence-only attachments on rows that keep their lane (already ok on R1;
// the 1B render-target capabilities are what F4b/F4c2 measured).
const ONE_B_EVIDENCE = {
  HalfFloatType: {
    evidence: {
      ids: ['E2E-TARGET-1', 'UT-GL-READBACK-1', 'E2E-BLOOM-1'],
      tests: ['test/angle1b/f4b_e2e_target_test.dart', 'tool/three/test/ut_gl_1_test.js', 'test/angle1b/f4b_e2e_bloom_test.dart'],
    },
  },
  WebGLRenderTarget: {
    evidence: {
      ids: ['E2E-TARGET-1', 'IT-TARGET-1', 'cases-f4c2-msaa'],
      tests: ['test/angle1b/f4b_e2e_target_test.dart', 'tool/three/cases_f4c2.sh'],
    },
  },
};

// The cinematic-pipeline addon symbols (three/addons modules) proven on
// native 1B, plus the two JSR-owned pieces. Module paths resolve against the
// pinned three tree; paths starting with `tool/` resolve inside the repo.
const ONE_B_ADDONS = {
  EffectComposer: {
    module: 'examples/jsm/postprocessing/EffectComposer.js',
    evidence: {
      ids: ['E2E-BLOOM-1', 'E2E-BLOOM-2', 'REG-VISUAL-BLOOM'],
      tests: ['test/angle1b/f4b_e2e_bloom_test.dart'],
    },
  },
  RenderPass: {
    module: 'examples/jsm/postprocessing/RenderPass.js',
    evidence: {
      ids: ['E2E-BLOOM-1', 'UT-PIPELINE-1'],
      tests: ['test/angle1b/f4b_e2e_bloom_test.dart', 'tool/three/test/f4b_ut_pipeline_test.js'],
    },
  },
  ShaderPass: {
    module: 'examples/jsm/postprocessing/ShaderPass.js',
    evidence: {
      ids: ['E2E-BLOOM-1', 'cases-f4c2-vignette'],
      tests: ['test/angle1b/f4b_e2e_bloom_test.dart', 'tool/three/cases_f4c2.sh'],
    },
  },
  UnrealBloomPass: {
    module: 'examples/jsm/postprocessing/UnrealBloomPass.js',
    evidence: {
      ids: ['E2E-BLOOM-1', 'E2E-BLOOM-2', 'three-postprocessing-unreal-bloom'],
      tests: ['test/angle1b/f4b_e2e_bloom_test.dart'],
    },
  },
  BokehPass: {
    module: 'examples/jsm/postprocessing/BokehPass.js',
    evidence: {
      ids: ['E2E-DOF-1', 'dof_near'],
      tests: ['test/angle1b/f4c1_e2e_dof_test.dart'],
    },
  },
  AfterimagePass: {
    module: 'examples/jsm/postprocessing/AfterimagePass.js',
    evidence: {
      ids: ['IT-HISTORY-1', 'ai_seq24'],
      tests: ['test/angle1b/f4c1_it_history_test.dart'],
    },
  },
  OutputPass: {
    module: 'examples/jsm/postprocessing/OutputPass.js',
    evidence: {
      ids: ['E2E-BLOOM-1', 'UT-PIPELINE-1'],
      tests: ['test/angle1b/f4b_e2e_bloom_test.dart', 'tool/three/test/f4b_ut_pipeline_test.js'],
    },
  },
  SMAAPass: {
    module: 'examples/jsm/postprocessing/SMAAPass.js',
    evidence: {
      ids: ['cases-f4c2-lines', 'E2E-FINISH'],
      tests: ['tool/three/cases_f4c2.sh', 'test/angle1b/f4c2_finish_passes_test.dart'],
    },
  },
  FilmPass: {
    module: 'examples/jsm/postprocessing/FilmPass.js',
    evidence: {
      ids: ['cases-f4c2-film', 'E2E-FINISH'],
      tests: ['tool/three/cases_f4c2.sh', 'test/angle1b/f4c2_finish_passes_test.dart'],
    },
  },
  VignetteShader: {
    module: 'examples/jsm/shaders/VignetteShader.js',
    note: 'vignette ships as VignetteShader via ShaderPass (no VignettePass class exists at the pin)',
    evidence: {
      ids: ['cases-f4c2-vignette', 'E2E-FINISH'],
      tests: ['tool/three/cases_f4c2.sh', 'test/angle1b/f4c2_finish_passes_test.dart'],
    },
  },
  LUTPass: {
    module: 'examples/jsm/postprocessing/LUTPass.js',
    note: 'LUTCubeLoader/LUTImageLoader stay unpromoted: the stock 3dlut example is the documented prepare-container limit; no green test parses real LUT bytes on the 1B lane',
    evidence: {
      ids: ['cases-f4c2-lut', 'E2E-FINISH'],
      tests: ['tool/three/cases_f4c2.sh', 'test/angle1b/f4c2_finish_passes_test.dart'],
    },
  },
  SSAOPass: {
    module: 'examples/jsm/postprocessing/SSAOPass.js',
    evidence: {
      ids: ['E2E-FINISH', 'three-postprocessing-ssao'],
      tests: ['tool/three/cases_f4c2.sh'],
    },
  },
  GTAOPass: {
    module: 'examples/jsm/postprocessing/GTAOPass.js',
    evidence: {
      ids: ['E2E-FINISH', 'three-postprocessing-gtao'],
      tests: ['tool/three/cases_f4c2.sh'],
    },
  },
  TAARenderPass: {
    module: 'examples/jsm/postprocessing/TAARenderPass.js',
    note: 'deterministic seek/reset proven by the f4d battery; the stock example diff is the documented TAA jitter limit',
    evidence: {
      ids: ['E2E-AA', 'REG-TEMPORAL', 'IT-LIFE-CINE-1'],
      tests: ['tool/three/cases_f4d.sh', 'test/angle1b/f4d_aa_battery_test.dart', 'test/angle1b/f4eg_life_test.dart'],
    },
  },
  SSAARenderPass: {
    module: 'examples/jsm/postprocessing/SSAARenderPass.js',
    evidence: {
      ids: ['E2E-AA', 'three-postprocessing-ssaa'],
      tests: ['tool/three/cases_f4d.sh'],
    },
  },
  HDRLoader: {
    module: 'examples/jsm/loaders/HDRLoader.js',
    evidence: {
      ids: ['E2E-ENV', 'three-materials-envmaps-hdr'],
      tests: ['tool/three/cases_f4d.sh'],
    },
  },
  EXRLoader: {
    module: 'examples/jsm/loaders/EXRLoader.js',
    evidence: {
      ids: ['E2E-ENV', 'three-materials-envmaps-exr'],
      tests: ['tool/three/cases_f4d.sh'],
    },
  },
  CinematicMotionBlurPass: {
    module: 'tool/three/src/cinematic_motion_blur.js',
    note: 'JSR-owned (ADR-0005); GPU accumulation bit-exact vs the linear JS reference',
    evidence: {
      ids: ['E2E-MOTION-1', 'E2E-MOTION-2'],
      tests: ['test/angle1b/f4c1_e2e_motion_test.dart'],
    },
  },
  'jsr.three.cinematic': {
    module: 'tool/three/src/cinematic.js',
    note: 'JSR-owned surface (ADR-0004 decisions 2-4); built into jsr_three_native.js and jsr_three_web.js',
    evidence: {
      ids: ['UT-HELPER-1', 'IT-HELPER-1', 'E2E-SHOWCASE-1'],
      tests: ['tool/three/test/ut_helper_cinematic_test.js', 'test/angle1b/it_helper_cinematic_test.dart', 'test/angle1b/e2e_showcase_1_cinematic_test.dart'],
    },
  },
};

// A promoted engine export must exist in the engine-export union (a typo
// must fail generation, not silently drop a row).
for (const name of Object.keys(ONE_B_ENGINE)) {
  if (!engineExports.includes(name)) {
    throw new Error(`1B promotion of ${name}: not an engine export of the pinned tree`);
  }
}
for (const [name, spec] of Object.entries(ONE_B_ADDONS)) {
  const file = spec.module.startsWith('tool/')
    ? path.join(ROOT, spec.module)
    : path.join(SOURCE, spec.module);
  if (!existsSync(file)) {
    throw new Error(`1B promotion of ${name}: module missing at ${file}`);
  }
}

const engineRows = engineExports.map((name) => {
  const mapped = UTILITY_ONLY.get(name) ?? apiMap[name] ?? EXPLICIT.get(name);
  if (mapped) {
    const lane =
      mapped.status === 'no' ? 'web-only'
      : mapped.status === 'upstream' ? 'upstream-cpu'
      : mapped.status === 'constant' ? 'constant'
      : 'r1';
    const row = {
      symbol: name,
      lane,
      status: mapped.status,
      ...(mapped.webLane ? { webLane: true } : {}),
      flutterAnalog: mapped.note
        || (mapped.status === 'ok'
          ? 'R1 protocol opcode → ThreeDrawPlanner → flutter_gpu'
          : mapped.status === 'bounded'
            ? 'R1 bounded subset (see api_matrix note)'
            : 'no native analog — 1B web renderer only'),
    };
    // F4h: a measured 1B promotion moves the row out of web-only onto the
    // '1b' lane (upstream renderer over the facade + ANGLE); the webLane
    // marker only annotated deliberate 'no' rows and no longer applies.
    const oneB = ONE_B_ENGINE[name];
    if (oneB) {
      row.lane = '1b';
      row.status = 'ok';
      delete row.webLane;
      row.flutterAnalog = oneB.analog;
      row.evidence = oneB.evidence;
    } else if (ONE_B_EVIDENCE[name]) {
      row.evidence = ONE_B_EVIDENCE[name].evidence;
    }
    return row;
  }
  if (NATIVE_ABSENT.has(name)) {
    return {
      symbol: name,
      lane: 'native-absent',
      status: 'no-native',
      flutterAnalog: 'browser-only capability (audio/XR/WebCodecs) — no QuickJS/host lane',
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
  if (CONSTANT_LIKE.test(name) || /^(MOUSE|TOUCH|REVISION|RAD2DEG|DEG2RAD|GLSL|LEGACY|Interpolate|Loop|NoNormalPacking|NormalGA|NormalRG|ObjectSpace|TangentSpace|SRGBTransfer|LinearTransfer|CullFace|WrapAroundEnding|ZeroCurvatureEnding|ZeroSlopeEnding|.*CoordinateSystem$|ReversedDepthFuncs)/.test(name)) {
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

// The proven cinematic addon symbols join as kind:'addon' rows (sorted,
// deterministic order).
const addonRows = Object.keys(ONE_B_ADDONS).sort().map((name) => ({
  symbol: name,
  kind: 'addon',
  lane: '1b',
  status: 'ok',
  module: ONE_B_ADDONS[name].module,
  ...(ONE_B_ADDONS[name].note ? { note: ONE_B_ADDONS[name].note } : {}),
  flutterAnalog: ONE_B_ADDONS[name].note
    ?? '1B: upstream addon runs over the WebGL2 facade + ANGLE',
  evidence: ONE_B_ADDONS[name].evidence,
}));

const rows = [...engineRows, ...addonRows];

const engineRowCount = engineRows.length;
const tally = (fn) => rows.filter(fn).length;
const engineTally = (fn) => engineRows.filter(fn).length;
const totals = {
  engineExports: engineRowCount,
  addonsOneB: addonRows.length,
  r1Ok: engineTally((r) => r.lane === 'r1' && r.status === 'ok'),
  r1Bounded: engineTally((r) => r.lane === 'r1' && r.status === 'bounded'),
  r1No: engineTally((r) => r.lane === 'web-only' && r.status === 'no'),
  oneBOk: tally((r) => r.lane === '1b'),
  upstreamCpu: engineTally((r) => r.lane === 'upstream-cpu'),
  constants: engineTally((r) => r.lane === 'constant'),
  nativeAbsent: engineTally((r) => r.lane === 'native-absent'),
  unclassified: engineTally((r) => r.lane === 'unclassified'),
};
// Deliberate web-lane entries: the 'no' bucket split by documented intent —
// GLSL passes / offscreen render targets the native lane will not implement.
totals.webLane = engineTally((r) => r.webLane);
// Honest headline numbers (engine rows only — the addon rows are measured
// 1B evidence rows, not part of the engine-export population):
//  - render-honored = R1 ok + bounded (of the render-relevant classified set)
//  - quickjs-usable = everything that materializes and runs on native
totals.renderHonored = totals.r1Ok + totals.r1Bounded;
totals.renderRelevantClassified =
  totals.renderHonored + totals.r1No;
totals.quickjsUsable =
  totals.renderHonored + totals.upstreamCpu + totals.constants;
totals.renderHonoredPct = +((totals.renderHonored / engineRowCount) * 100).toFixed(1);
totals.quickjsUsablePct = +((totals.quickjsUsable / engineRowCount) * 100).toFixed(1);
totals.webLanePct = 100; // real upstream renderer on Worker OffscreenCanvas

const matrix = {
  source: 'three r186 pinned (three.core.js ∪ three.module.js exports; + the measured 1B cinematic addon set, kind "addon")',
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
