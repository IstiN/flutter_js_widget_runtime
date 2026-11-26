import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../support/f4eg_cinematic.dart';
import '../support/three_1b_engine.dart';

// SEC-CINEMATIC-* and E2E-FALLBACK-* (issue #8, F4g security and honest
// degradation, plan 4.4 row F4g; edges E5, E7, E14's named-error rule).
//
// All tests run the real committed bundle in the real engine stack over the
// recording wire — no GPU truth is claimed on this lane; what is proven is
// the named-error policy, the chain composition and the metadata hygiene:
//
// - SEC-CINEMATIC-1: denied custom shaders (host policy default) fail at
//   construction, through a live pipeline, before the renderer allocates —
//   with `allowCustomShaders: true` the same constructions succeed.
// - SEC-CINEMATIC-2: hostile canvas and pipeline dimensions are named
//   errors or documented clamps — never a poisoned target (E4/E9).
// - SEC-CINEMATIC-3: the oversized-target quota refuses the descriptor
//   BEFORE any target is resized; the previous coherent size stays.
// - E2E-FALLBACK-1/2: with the GL2-gated capabilities forced absent, the
//   probe reports them absent, the preset runs a REDUCED set, the missing
//   features are named before capture (assertCapturable), and the capture
//   still returns after the final pass with the reduced set.
// - SEC-CINEMATIC-4: the capture barrier metadata carries no runtime secret
//   and no asset-URL token.
void main() {
  final bundle = File('assets/three/jsr_three_native.js').readAsStringSync();

  const policyMessage =
      'three.unsupported: custom shaders are disabled by host policy';

  test('SEC-CINEMATIC-1: denied shaders fail before the renderer allocates, '
      'through a live pipeline; the stock pass set is unaffected', () async {
    final denied = '''
var results = {};
try {
  var cin = jsr.three.cinematic;
  if (!cin || typeof cin.createPipeline !== 'function') {
    throw new Error('cinematic.surfaceMissing: jsr.three.cinematic is not installed');
  }
  var renderer = f4egMockRenderer();
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera();
  // a live pipeline with the stock bloom pass (internal materials — the
  // policy blocks only widget-level custom shaders)
  var pipeline = cin.createPipeline({
    renderer: renderer, scene: scene, camera: camera, effects: { bloom: true }
  });
  results.stockBloomPass = !!pipeline.passes.bloom;
  try { new THREE.ShaderMaterial({ fragmentShader: 'void main() {}' }); results.shaderMaterial = 'constructed'; }
  catch (e) { results.shaderMaterial = String(e.message); }
  try { new THREE.RawShaderMaterial(); results.rawShaderMaterial = 'constructed'; }
  catch (e) { results.rawShaderMaterial = String(e.message); }
  try { var m = new THREE.MeshBasicMaterial(); m.onBeforeCompile = function () {}; results.onBeforeCompile = 'set'; }
  catch (e) { results.onBeforeCompile = String(e.message); }
  // a custom pass never reaches the composer chain: its material
  // construction throws the policy error before insertPass runs
  var chainBefore = pipeline.composer.passes.length;
  try {
    var customMaterial = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: 'void main() { gl_Position = vec4(0.0); }',
      fragmentShader: 'void main() { gl_FragColor = vec4(1.0); }'
    });
    pipeline.composer.insertPass({ render: function () {}, setSize: function () {}, material: customMaterial }, 1);
    results.customPass = 'inserted';
  } catch (e) { results.customPass = String(e.message); }
  results.chainBefore = chainBefore;
  results.chainAfter = pipeline.composer.passes.length;
  // the renderer the pipeline holds recorded zero work: every denial fired
  // at construction, before the renderer allocated anything
  results.rendererCalls = JSON.stringify(renderer.__calls);
  jsr.exportState(results);
} catch (e) {
  results.error = String((e && e.message) || e);
  jsr.exportState(results);
}
''';
    final (_, reported, state) = await run1bWidgetEngine(
      '$f4egMockRendererJs\n$denied',
      threeSource: bundle,
      allowCustomShaders: false,
    );
    expect(reported?.isAngle1b, isTrue);
    expect(state?['error'], isNull, reason: '${state?['error']}');
    expect(
      state?['stockBloomPass'],
      isTrue,
      reason: 'the stock internal pass set is unaffected by the policy',
    );
    expect(state?['shaderMaterial'], policyMessage);
    expect(state?['rawShaderMaterial'], policyMessage);
    expect(state?['onBeforeCompile'], policyMessage);
    expect(
      state?['customPass'],
      policyMessage,
      reason: 'the custom pass dies at material construction',
    );
    expect(
      state?['chainAfter'],
      state?['chainBefore'],
      reason: 'the composer chain is unchanged — nothing was inserted',
    );
    final calls = state?['rendererCalls'];
    expect(
      calls,
      isNot(contains('"render"')),
      reason:
          'the renderer allocated nothing: every denial fired before '
          'any render or allocation call ($calls)',
    );
  });

  test('SEC-CINEMATIC-1b: allowCustomShaders: true permits the same '
      'constructions through the same pipeline path', () async {
    final allowed = '''
var results = {};
try {
  var cin = jsr.three.cinematic;
  var renderer = f4egMockRenderer();
  var pipeline = cin.createPipeline({
    renderer: renderer, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(),
    effects: { bloom: true }
  });
  var sm = new THREE.ShaderMaterial({ fragmentShader: 'void main() {}' });
  results.shaderMaterial = sm.isShaderMaterial === true ? 'constructed' : 'wrong-identity';
  var rsm = new THREE.RawShaderMaterial();
  results.rawShaderMaterial = rsm.isRawShaderMaterial === true ? 'constructed' : 'wrong-identity';
  var m = new THREE.MeshBasicMaterial();
  m.onBeforeCompile = function () {};
  results.onBeforeCompile = 'set';
  var customMaterial = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: 'void main() { gl_Position = vec4(0.0); }',
    fragmentShader: 'void main() { gl_FragColor = vec4(1.0); }'
  });
  pipeline.composer.insertPass({ render: function () {}, setSize: function () {}, material: customMaterial }, 1);
  results.customPass = 'inserted';
  results.chainAfter = pipeline.composer.passes.length;
  jsr.exportState(results);
} catch (e) {
  results.error = String((e && e.message) || e);
  jsr.exportState(results);
}
''';
    final (_, reported, state) = await run1bWidgetEngine(
      '$f4egMockRendererJs\n$allowed',
      threeSource: bundle,
      allowCustomShaders: true,
    );
    expect(reported?.isAngle1b, isTrue);
    expect(state?['error'], isNull, reason: '${state?['error']}');
    expect(state?['shaderMaterial'], 'constructed');
    expect(state?['rawShaderMaterial'], 'constructed');
    expect(state?['onBeforeCompile'], 'set');
    expect(state?['customPass'], 'inserted');
    expect(
      state?['chainAfter'],
      4,
      reason: 'render + bloom + custom + output on the open policy',
    );
  });

  test('SEC-CINEMATIC-2: hostile canvas and pipeline dimensions are named '
      'errors or documented clamps; the pipeline keeps rendering', () async {
    final hostile = '''
var results = { canvas: {}, pipeline: {}, errors: [] };
try {
  var cin = jsr.three.cinematic;
  var canvas = jsr.three.createCanvas('hostile');
  function trySet(prop, value) {
    try { canvas[prop] = value; return 'ok:' + canvas[prop]; }
    catch (e) { return String(e.message); }
  }
  results.canvas.nan = trySet('width', NaN);
  results.canvas.inf = trySet('height', Infinity);
  results.canvas.negative = trySet('width', -5);
  results.canvas.fraction = trySet('width', 32.9);
  results.canvas.zero = trySet('height', 0);
  results.canvas.oversize = trySet('width', 999999);
  var renderer = f4egMockRenderer();
  var pipeline = cin.createPipeline({
    renderer: renderer, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera()
  });
  pipeline.setSize(48, 48);
  function trySize(w, h) {
    try { pipeline.setSize(w, h); return 'ok:' + pipeline.composer.renderTarget1.width + 'x' + pipeline.composer.renderTarget1.height; }
    catch (e) { return String((e && e.message) || e); }
  }
  results.pipeline.nan = trySize(NaN, 64);
  results.pipeline.negative = trySize(64, -1);
  results.pipeline.infinity = trySize(Infinity, 64);
  results.pipeline.fraction = trySize(64.9, 48.2);
  results.pipeline.zero = trySize(0, 0);
  results.widthBeforeRejection = pipeline.composer.renderTarget1.width;
  results.pipeline.oversize = trySize(4097, 4097);
  results.targetAfterRejection = pipeline.composer.renderTarget1.width;
  results.pipeline.beyondMaxTex = trySize(99999, 100);
  results.pipeline.restore = trySize(48, 48);
  pipeline.renderFrame(cin.clockState(1, 24, 0.5, 1, 0));
  results.renderedAfter = renderer.__calls.render || 0;
  jsr.exportState(results);
} catch (e) {
  results.errors.push(String((e && e.message) || e));
  jsr.exportState(results);
}
''';
    final (_, reported, state) = await run1bWidgetEngine(
      '$f4egMockRendererJs\n$hostile',
      threeSource: bundle,
    );
    expect(reported?.isAngle1b, isTrue);
    expect(state?['errors'], isEmpty, reason: '${state?['errors']}');
    // Canvas: named error for non-finite and negative, documented clamp for
    // fractional (floor), zero and beyond the GL max (16384 cap).
    expect(
      state?['canvas']?['nan'],
      'three.invalid: canvas dimensions must be non-negative finite numbers',
    );
    expect(
      state?['canvas']?['inf'],
      'three.invalid: canvas dimensions must be non-negative finite numbers',
    );
    expect(
      state?['canvas']?['negative'],
      'three.invalid: canvas dimensions must be non-negative finite numbers',
    );
    expect(state?['canvas']?['fraction'], 'ok:32');
    expect(state?['canvas']?['zero'], 'ok:0');
    expect(state?['canvas']?['oversize'], 'ok:16384');
    // Pipeline: named cinematic.invalid for non-finite, negative and the
    // target-budget quota; documented clamps for fractional, zero and the
    // max-texture-size clamp.
    final pipeline = state?['pipeline'] ?? {};
    expect(pipeline['nan'], startsWith('cinematic.invalid:'));
    expect(pipeline['negative'], startsWith('cinematic.invalid:'));
    expect(pipeline['infinity'], startsWith('cinematic.invalid:'));
    expect(pipeline['fraction'], 'ok:64x48');
    expect(pipeline['zero'], 'ok:1x1');
    expect(
      pipeline['oversize'],
      startsWith('cinematic.invalid:'),
      reason: '4097x4097 exceeds the JSR target budget — the checked quota',
    );
    expect(
      pipeline['beyondMaxTex'],
      'ok:16384x100',
      reason: 'clamped to the renderer maxTextureSize',
    );
    // A rejected resize leaves the previous coherent size on the targets
    // (E4: mixed-size targets are never sampled).
    expect(
      state?['targetAfterRejection'],
      state?['widthBeforeRejection'],
      reason: 'the quota refusal resized nothing',
    );
    // The pipeline kept rendering after the whole hostile barrage.
    expect(state?['renderedAfter'], greaterThanOrEqualTo(1));
  });

  test('SEC-CINEMATIC-3: the oversized target quota refuses before any '
      'target resize; oversized history descriptors stay bounded', () async {
    final quotas = '''
var results = { history: {} };
try {
  var cin = jsr.three.cinematic;
  var renderer = f4egMockRenderer();
  var pipeline = cin.createPipeline({
    renderer: renderer, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera()
  });
  pipeline.setSize(32, 32);
  var before = {
    w: pipeline.composer.renderTarget1.width,
    h: pipeline.composer.renderTarget1.height
  };
  try { pipeline.setSize(8192, 8192); results.targetQuota = 'resized'; }
  catch (e) { results.targetQuota = String((e && e.message) || e); }
  results.targetStill = pipeline.composer.renderTarget1.width === before.w &&
      pipeline.composer.renderTarget1.height === before.h;
  var history = pipeline.history;
  history.declare({ pass: 'ok', frames: 600 });
  results.history.maxDepth = history.depth();
  try { history.declare({ pass: 'huge', frames: 601 }); results.history.over = 'declared'; }
  catch (e) { results.history.over = String((e && e.message) || e); }
  try { history.declare({ pass: 'inf', frames: Infinity }); results.history.inf = 'declared'; }
  catch (e) { results.history.inf = String((e && e.message) || e); }
  try { history.declare({ pass: 'nan', frames: NaN }); results.history.nan = 'declared'; }
  catch (e) { results.history.nan = String((e && e.message) || e); }
  var rec = history.reconstruct({ frame: 100000 });
  results.history.recLen = rec.frames.length;
  jsr.exportState(results);
} catch (e) {
  results.error = String((e && e.message) || e);
  jsr.exportState(results);
}
''';
    final (_, reported, state) = await run1bWidgetEngine(
      '$f4egMockRendererJs\n$quotas',
      threeSource: bundle,
    );
    expect(reported?.isAngle1b, isTrue);
    expect(state?['error'], isNull, reason: '${state?['error']}');
    expect(
      state?['targetQuota'],
      startsWith('cinematic.invalid:'),
      reason: 'the 4096x4096 target budget is a checked quota',
    );
    expect(
      state?['targetStill'],
      isTrue,
      reason: 'the refusal happened BEFORE any target resize (32x32 stays)',
    );
    expect(state?['history']?['maxDepth'], 600);
    expect(state?['history']?['over'], startsWith('cinematic.invalid:'));
    expect(state?['history']?['inf'], startsWith('cinematic.invalid:'));
    expect(state?['history']?['nan'], startsWith('cinematic.invalid:'));
    expect(
      state?['history']?['recLen'],
      600,
      reason:
          'reconstruct stays bounded at the declared window (no hang, '
          'no unbounded frame list)',
    );
  });

  test('E2E-FALLBACK-1: with GL2 capabilities forced absent the probe '
      'reports them absent, the preset runs a reduced set, and the missing '
      'features are named before capture', () async {
    final fallback = '''
var results = {};
try {
  var cin = jsr.three.cinematic;
  var renderer = f4egWebMockRenderer();
  var caps = cin.probeCapabilities(renderer);
  results.probe = {
    smaa: caps.supports('smaa'),
    colorGrade: caps.supports('colorGrade'),
    film: caps.supports('film'),
    vignette: caps.supports('vignette'),
    multisample: caps.supports('multisample'),
    bloom: caps.supports('bloom'),
    fxaa: caps.supports('fxaa'),
    dof: caps.supports('depthOfField')
  };
  var pipeline = cin.createPipeline({
    renderer: renderer,
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    effects: {}
  });
  pipeline.setPreset('production');
  results.unsupported = pipeline.unsupported.map(function (u) { return u.effect; });
  results.passes = Object.keys(pipeline.passes).sort();
  var capturable = 'ok';
  try { pipeline.assertCapturable(); }
  catch (e) { capturable = (e && e.name ? e.name : String(e)) + ': ' + String((e && e.message) || e); }
  results.assertCapturable = capturable;
  jsr.exportState(results);
} catch (e) {
  results.error = String((e && e.message) || e);
  jsr.exportState(results);
}
''';
    final (_, reported, state) = await run1bWidgetEngine(
      '$f4egWebMockRendererJs\n$fallback',
      threeSource: bundle,
    );
    expect(reported?.isAngle1b, isTrue);
    expect(state?['error'], isNull, reason: '${state?['error']}');
    final probe = state?['probe'] ?? {};
    expect(probe['smaa'], isFalse);
    expect(probe['colorGrade'], isFalse);
    expect(probe['film'], isFalse);
    expect(probe['vignette'], isFalse);
    expect(probe['multisample'], isFalse);
    expect(probe['bloom'], isTrue);
    expect(probe['fxaa'], isTrue);
    expect(probe['dof'], isTrue);
    final unsupported = (state?['unsupported'] as List? ?? [])
        .cast<String>()
        .toSet();
    expect(
      unsupported,
      containsAll(<String>['smaa', 'colorGrade', 'film', 'vignette']),
      reason: 'every GL2-gated effect the preset requested is NAMED absent',
    );
    expect(state?['passes'], <String>[
      'bloom',
      'dof',
      'fxaa',
    ], reason: 'the reduced effect set still runs its supported passes');
    expect(
      state?['assertCapturable'],
      startsWith('cinematic.notCapturable'),
      reason: 'capture is refused BEFORE it would silently drop effects',
    );
  });

  test('E2E-FALLBACK-2: the capture still returns after the final pass with '
      'the reduced set', () async {
    final capture = '''
var results = {};
try {
  var cin = jsr.three.cinematic;
  var renderer = f4egWebMockRenderer();
  var pipeline = cin.createPipeline({
    renderer: renderer, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(),
    effects: {}
  });
  pipeline.setPreset('production');
  pipeline.renderFrame(cin.clockState(3, 24, 0.5, 1, 0));
  results.passes = Object.keys(pipeline.passes).sort();
  pipeline.captureFrame(cin.clockState(3, 24, 0.5, 1, 0)).then(function (r) {
    results.captured = { path: r.path || null, width: r.width || null };
    jsr.exportState(results);
  }, function (e) {
    results.captureError = String((e && e.message) || e);
    jsr.exportState(results);
  });
} catch (e) {
  results.error = String((e && e.message) || e);
  jsr.exportState(results);
}
''';
    final host = F4egRecordingCaptureHost();
    final (_, reported, state) = await run1bWidgetEngine(
      '$f4egWebMockRendererJs\n$capture',
      threeSource: bundle,
      cinematicCaptureHost: host,
    );
    expect(reported?.isAngle1b, isTrue);
    expect(state?['error'], isNull, reason: '${state?['error']}');
    expect(state?['captureError'], isNull, reason: '${state?['captureError']}');
    expect(
      (state?['captured'] ?? <String, dynamic>{})['path'],
      isNotNull,
      reason: 'the reduced-set capture returned',
    );
    expect(state?['passes'], <String>['bloom', 'dof', 'fxaa']);
    expect(host.calls, hasLength(1));
    expect(
      host.calls.single['barrier'],
      isNull,
      reason:
          'the barrier tag is checked at the bridge; the host '
          'record carries the clock',
    );
    expect(host.calls.single['frame'], 3);
  });

  test('SEC-CINEMATIC-4: capture metadata carries no runtime secret and no '
      'asset-URL token', () async {
    const secret = 'sentinel-secret-42';
    const token = 'hush-token';
    final capture = '''
var results = {};
try {
  var cin = jsr.three.cinematic;
  // a runtime secret through the host secret mechanism
  jsr.secrets.set('apiKey', 'sentinel-secret-42');
  // the asset URL carries a token and rides an effect descriptor
  var lutUrl = 'https://assets.example/lut.3dl?token=hush-token';
  var renderer = f4egMockRenderer();
  var pipeline = cin.createPipeline({
    renderer: renderer, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(),
    effects: { bloom: true }
  });
  pipeline.applyEffect({ effect: 'colorGrade', options: { lut: lutUrl } });
  pipeline.renderFrame(cin.clockState(4, 24, 0.5, 1, 0));
  pipeline.captureFrame(cin.clockState(4, 24, 0.5, 1, 0)).then(function (r) {
    results.captured = JSON.stringify(r);
    results.config = JSON.stringify(pipeline.getConfig());
    jsr.exportState(results);
  }, function (e) {
    results.captureError = String((e && e.message) || e);
    jsr.exportState(results);
  });
} catch (e) {
  results.error = String((e && e.message) || e);
  jsr.exportState(results);
}
''';
    final secretsSeen = <(String, dynamic)>[];
    final host = F4egRecordingCaptureHost();
    final (_, reported, state) = await run1bWidgetEngine(
      '$f4egMockRendererJs\n$capture',
      threeSource: bundle,
      instanceId: 'f4eg-secret-engine',
      secretsSetHandler: (id, key, value) async {
        secretsSeen.add((key, value));
      },
      cinematicCaptureHost: host,
    );
    expect(reported?.isAngle1b, isTrue);
    expect(state?['error'], isNull, reason: '${state?['error']}');
    expect(state?['captureError'], isNull, reason: '${state?['captureError']}');
    // The secret crossed the real channel to the host (the mechanism is
    // live), and the token rode the effect descriptor.
    expect(secretsSeen, hasLength(1));
    expect(secretsSeen.single.$1, 'apiKey');
    expect(secretsSeen.single.$2, secret);
    expect(
      (state?['config'] as String?)?.contains(token),
      isTrue,
      reason: 'precondition: the token really rides the effect config',
    );
    // The capture barrier metadata: engine id + clock only — no secret
    // value, no URL token, no effect config.
    final metadata = host.metadataJson();
    expect(
      metadata,
      isNot(contains(secret)),
      reason: 'the secret value never reaches the capture metadata',
    );
    expect(
      metadata,
      isNot(contains(token)),
      reason: 'the asset-URL token never reaches the capture metadata',
    );
    expect(host.calls.single['engineId'], 'f4eg-secret-engine');
    expect(host.calls.single.keys.toSet(), <String>{
      'engineId',
      'frame',
      'fps',
      'shutter',
      'samples',
      'epoch',
    }, reason: 'the metadata carries exactly the documented clock fields');
    // The capture RESULT returned to JS carries neither value either.
    final captured = state?['captured'] as String?;
    expect(captured, isNotNull);
    expect(captured, isNot(contains(secret)));
    expect(captured, isNot(contains(token)));
    expect(jsonEncode(jsonDecode(captured!)), captured);
  });
}
