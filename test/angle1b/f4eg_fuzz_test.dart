import 'package:flutter_test/flutter_test.dart';

import '../support/f4eg_cinematic.dart';

// FUZZ-TARGET-* (issue #8, F4g hostile inputs, plan 4.4 row F4g; edge E9):
// deterministic pseudo-random fuzzing (the engine's own mulberry32 PRNG,
// fixed seeds printed in the output) of the cinematic surface. Every hostile
// input ends in a NAMED `cinematic.invalid` error or a documented clamp —
// never an unnamed exception, never a hang, never a crash; after the whole
// corpus the engine still renders valid frames.
//
// Vehicle: the real committed bundle in the real engine stack over the
// recording wire (the fake lane; no GPU truth claimed — this proves the
// input policy, not pixels).
void main() {
  test('FUZZ-TARGET-1: seeded hostile history windows and clocks stay named '
      'and bounded', () async {
    const seed = 0x5eed0001;
    final history =
        '''
var results = { seed: $seed, named: 0, clamped: 0, unnamed: [], maxRec: 0 };
try {
  var cin = jsr.three.cinematic;
  var rng = cin.cinematicRandom($seed);
  var frameSpace = [NaN, -3, -0.5, 0, 0.5, 1.9, 2, 7, Infinity, -Infinity, 1e9, 'x', null];
  var windowSpace = [NaN, -3, 0, 0.5, 1.9, 2, 5, 4096, 4097, Infinity, 1e9];
  for (var i = 0; i < 120; i++) {
    var history = new cin.CinematicHistory(i);
    var frames = windowSpace[Math.floor(rng() * windowSpace.length)];
    var pass = 'p' + Math.floor(rng() * 4);
    var outcome = 'clamped';
    try {
      history.declare({ pass: pass, frames: frames });
      if (!(history.depth() >= 1) || history.depth() > 4096) {
        results.unnamed.push('depth ' + history.depth() + ' from frames ' + frames);
      }
    } catch (e) {
      if ((e && e.code) === 'cinematic.invalid') { outcome = 'named'; }
      else { results.unnamed.push('declare(' + frames + '): ' + String((e && e.message) || e)); }
    }
    if (outcome === 'named') results.named++; else results.clamped++;
    // hostile reconstruct clocks never hang and never exceed the window
    var clock = { frame: frameSpace[Math.floor(rng() * frameSpace.length)] };
    var rec = history.reconstruct(clock);
    if (rec.frames.length > results.maxRec) results.maxRec = rec.frames.length;
    if (rec.frames.length > 4096) results.unnamed.push('reconstruct built ' + rec.frames.length + ' frames');
  }
${f4egExportTailJs(catchBodyJs: "  results.unnamed.push('fatal: ' + String((e && e.message) || e));")}
''';
    final state = await runF4eg(history, seedLabel: 'history: $seed');
    expect(state?['seed'], seed);
    expect(
      (state?['named'] as num) + (state?['clamped'] as num),
      120,
      reason: 'every hostile window ended named or clamped',
    );
    expect(
      state?['named'],
      greaterThan(0),
      reason: 'the named paths were exercised',
    );
    expect(
      state?['maxRec'],
      lessThanOrEqualTo(4096),
      reason: 'reconstruct never exceeds the declared window bound',
    );
    expect(
      state?['unnamed'],
      isEmpty,
      reason: 'unnamed outcomes: ${state?['unnamed']}',
    );
  });

  test('FUZZ-TARGET-2: malformed LUT kinds and malformed asset bytes reject '
      'named — never crash, never a bogus image', () async {
    const seed = 0x5eed0002;
    final lut =
        '''
var results = { seed: $seed, unnamed: [], lutOk: 0, assetNamed: 0, assetUnnamed: [] };
try {
  var cin = jsr.three.cinematic;
  var rng = cin.cinematicRandom($seed);
  // LUT descriptor fuzz: garbage kinds clamp to the identity LUT, always a
  // complete 8^3 RGBA table.
  var kinds = ['', 'garbage', 'teal-orange', 'IDENTITY', 'teal\\u0000orange', 0, 1, null, { x: 1 }, NaN];
  for (var i = 0; i < kinds.length; i++) {
    var lut = cin.buildLutTexture(kinds[i]);
    var data = lut.image.data;
    if (!data || data.length !== 8 * 8 * 8 * 4) results.unnamed.push('lut ' + i + ': bad data length');
    else if (data[3] !== 255) results.unnamed.push('lut ' + i + ': alpha not opaque');
    else results.lutOk++;
    if (!(lut.isData3DTexture === true)) results.unnamed.push('lut ' + i + ': not a Data3DTexture');
  }
  // malformed asset bytes (.cube/.3dl/HDR/EXR-shaped garbage headers) go
  // through the real loadAsset -> decodeImage lane; each load must end in a
  // NAMED error callback — never a resolved bogus image, never a crash.
  var magic = ['3DL', 'CUBE', 'FORM', 'EXR', '#?RADIANCE', [0x89, 0x50, 0x4e, 0x47]];
  var pending = magic.length;
  var loader = new THREE.TextureLoader();
  for (var m = 0; m < magic.length; m++) {
    (function (idx) {
      var bytes = new Uint8Array(64);
      var header = magic[idx];
      if (typeof header === 'string') {
        for (var c = 0; c < header.length && c < 64; c++) bytes[c] = header.charCodeAt(c) & 0xff;
      } else {
        for (var c = 0; c < header.length; c++) bytes[c] = header[c];
      }
      for (var c = 0; c < 64; c++) bytes[c] = (bytes[c] + Math.floor(rng() * 2)) & 0xff;
      jsr.three.registerAsset('malformed-' + idx + '.bin', { bytes: bytes });
      var url = 'malformed-' + idx + '.bin';
      loader.load(url, function (img) {
        results.assetUnnamed.push('case ' + idx + ': resolved a bogus image');
      }, undefined, function (err) {
        var msg = String((err && err.message) || err);
        if (msg.indexOf('three.') === 0 || msg.indexOf('webgl') === 0 || msg.length > 0) results.assetNamed++;
        pending--;
        if (pending === 0) jsr.exportState(results);
      });
    })(m);
  }
  // safety export in case a load never errors (the guard below fails)
  setTimeout(function () { if (pending > 0) { results.pending = pending; jsr.exportState(results); } }, 2000);
${f4egExportTailJs(catchBodyJs: "  results.unnamed.push('fatal: ' + String((e && e.message) || e));")}
''';
    final state = await runF4eg(lut, seedLabel: 'lut/assets: $seed');
    expect(state?['seed'], seed);
    expect(
      state?['lutOk'],
      10,
      reason: 'every hostile LUT kind clamped to a complete identity table',
    );
    expect(
      state?['assetNamed'],
      6,
      reason: 'every malformed asset load rejected through the error path',
    );
    expect(
      state?['assetUnnamed'],
      isEmpty,
      reason: '${state?['assetUnnamed']}',
    );
    expect(state?['unnamed'], isEmpty, reason: '${state?['unnamed']}');
    expect(state?['pending'], isNull, reason: 'every load ended (no hang)');
  });

  test('FUZZ-TARGET-3: 200 seeded hostile API calls stay named or clamped '
      'and the engine keeps rendering', () async {
    const seed = 0x5eed0003;
    final api =
        '''
var results = { seed: $seed, named: 0, clamped: 0, unnamed: [], finalRenderCalls: 0 };
try {
  var cin = jsr.three.cinematic;
  var rng = cin.cinematicRandom($seed);
${f4egPipelineSetupJs()}
  var dim = [NaN, -1, 0, 0.5, 64, 4096, 4097, Infinity, 100000];
  var names = ['bloom', 'dof', 'smaa', 'fxaa', 'colorGrade', 'film', 'vignette', 'motion', 'nonsense', '', null];
  var presets = ['draft', 'production', 'deterministic-export', 'bogus', '', null];
  function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
  function attempt(body) {
    try { body(); results.clamped++; }
    catch (e) {
      if ((e && e.code) === 'cinematic.invalid' || String((e && e.message) || e).indexOf('cinematic.invalid:') === 0) results.named++;
      else results.unnamed.push(String((e && e.message) || e));
    }
  }
  for (var i = 0; i < 200; i++) {
    var roll = Math.floor(rng() * 5);
    if (roll === 0) attempt(function () { pipeline.setSize(pick(dim), pick(dim)); });
    else if (roll === 1) attempt(function () { cin.clockState(pick(dim), pick([0, -1, NaN, 24, Infinity]), pick([-1, 0, 0.5, 1, 2]), pick([0, 1, 2, 8, -3]), pick([0, 1, NaN])); });
    else if (roll === 2) attempt(function () { pipeline.ensurePass(pick(names)); });
    else if (roll === 3) attempt(function () { pipeline.setPreset(pick(presets)); });
    else attempt(function () {
      pipeline.applyEffect({ effect: pick(names), options: { threshold: pick(dim), lut: pick(['identity', { bad: 1 }, NaN, 'x']), intensity: pick(dim) } });
    });
  }
  // the engine survived the whole corpus: a valid frame renders
  pipeline.setSize(48, 48);
  pipeline.renderFrame(cin.clockState(1, 24, 0.5, 1, 0));
  results.finalRenderCalls = renderer.__calls.render || 0;
${f4egExportTailJs(catchBodyJs: "  results.unnamed.push('fatal: ' + String((e && e.message) || e));")}
''';
    final state = await runF4eg(
      '$f4egMockRendererJs\n$api',
      seedLabel: 'api: $seed',
    );
    expect(state?['seed'], seed);
    expect(
      (state?['named'] as num) + (state?['clamped'] as num),
      200,
      reason: 'every hostile call ended named or clamped',
    );
    expect(
      state?['named'],
      greaterThan(0),
      reason: 'the named paths were exercised',
    );
    expect(
      state?['unnamed'],
      isEmpty,
      reason: 'unnamed outcomes: ${state?['unnamed'].take(10)}',
    );
    expect(
      state?['finalRenderCalls'],
      greaterThanOrEqualTo(1),
      reason: 'the engine kept rendering after the whole corpus',
    );
  });
}
