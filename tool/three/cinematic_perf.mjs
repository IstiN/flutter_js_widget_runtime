// cinematic_perf.mjs — F4f cinematic performance matrix orchestrator
// (issue #8, PERF-CINEMATIC-*, REG-UPLOADS). Builds and runs the perf scene
// through the public helper API only (jsr.three.cinematic), on both legs:
//
//   native 1B : `dart run tool/three/cinematic_perf_1b.dart` — the existing
//               bench/corpus wire (bench_1b timing method, corpus boot), no
//               second wire.
//   web       : headless Chrome WebGL2 (Playwright) over the SAME scene file
//               and the SAME wrapped bundles the corpus web leg loads.
//
// Writes docs/cinematic_perf.md (the committed report; CI runs a reduced
// matrix and prints its runner's numbers informationally — they never enter
// the committed report, which is regenerated on the measurement host).
//
// Exit codes: 0 when both legs produced cells and every STRUCTURAL check
// passed; 1 on harness/leg failure or a structural failure. Timing numbers
// NEVER affect the exit code.
//
// Usage (from the repo root):
//   node tool/three/cinematic_perf.mjs                 # full matrix, writes docs/cinematic_perf.md
//   node tool/three/cinematic_perf.mjs --ci            # reduced matrix (structural gated, timing printed)
//   node tool/three/cinematic_perf.mjs --legs 1b       # native leg only
//   node tool/three/cinematic_perf.mjs --sizes 1280x720
import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require_ = createRequire(import.meta.url);
const SCENE = path.join(ROOT, 'tool/three/perf/perf_scene.js');

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : dflt;
};
const has = (name) => args.includes('--' + name);
const CI = has('ci');

const PRESETS = opt('presets', 'draft,production,deterministic-export').split(',').map((s) => s.trim());
const SIZES = (opt('sizes', CI ? '1280x720' : '1280x720,1920x1080,3840x2160'))
  .split(',').map((s) => {
    const m = /^(\d+)x(\d+)$/.exec(s.trim());
    if (!m) throw new Error('bad size: ' + s);
    return { width: +m[1], height: +m[2] };
  });
const FRAMES = +opt('frames', CI ? '150' : '300');
const WINDOWS = +opt('windows', CI ? '1' : '3');
const LEGS = opt('legs', 'both').split(',');
const REPORT = path.resolve(ROOT, opt('out', 'docs/cinematic_perf.md'));
if (!fs.existsSync(SCENE)) throw new Error('perf scene missing: ' + SCENE);

const log = (...a) => console.log('[cinematic-perf]', ...a);

// ---- host identity ---------------------------------------------------------

function hostIdentity() {
  const sysctl = (k) => {
    try { return execFileSync('sysctl', ['-n', k]).toString().trim(); } catch { return null; }
  };
  const swVers = (k) => {
    try { return execFileSync('sw_vers', ['-' + k]).toString().trim(); } catch { return null; }
  };
  let anglePin = null, threePin = null;
  try { anglePin = JSON.parse(fs.readFileSync(path.join(ROOT, 'tool/three/pins/angle_pin.json'), 'utf8')).revision; } catch {}
  try { threePin = JSON.parse(fs.readFileSync(path.join(ROOT, 'tool/three/source-pin.json'), 'utf8')).commit; } catch {}
  return {
    date: new Date().toISOString(),
    cpu: sysctl('machdep.cpu.brand_string'),
    macOS: swVers('productVersion') ? `macOS ${swVers('productVersion')} (${swVers('buildVersion')})` : null,
    anglePin, threePin,
    quickjs: 'QuickJS 2024-01-13 (quickjs_runtime bridge)',
  };
}

// ---- native 1B leg ---------------------------------------------------------

function runNativeLeg() {
  const cellArgs = [
    'run', 'tool/three/cinematic_perf_1b.dart',
    '--scene', SCENE,
    '--presets', PRESETS.join(','),
    '--sizes', SIZES.map((s) => `${s.width}x${s.height}`).join(','),
    '--windows', String(WINDOWS),
    '--frames', String(FRAMES),
  ];
  log('native leg: dart', cellArgs.join(' '));
  const r = spawnSync('dart', cellArgs, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const cells = [];
  for (const line of (r.stdout || '').split('\n')) {
    if (line.startsWith('PERF_CELL ')) {
      try { cells.push(JSON.parse(line.slice('PERF_CELL '.length))); } catch (e) { log('bad PERF_CELL line:', e.message); }
    }
  }
  if (r.status !== 0) {
    log('native leg FAILED (status', r.status, '):', (r.stderr || '').split('\n').slice(-6).join('\n'));
    return { cells, failed: true };
  }
  return { cells, failed: false };
}

// ---- web leg (Chrome WebGL2) ----------------------------------------------

async function runWebLeg() {
  // Same playwright resolution as the corpus web driver (ref_1b_corpus.cjs):
  // installed into /tmp/node_modules by the CI corpus step / local setup;
  // channel: env override (JSR_WEBGL_REF_CHANNEL), default 'chrome' — never
  // hard-coded in a committed caller.
  const playwrightPath = process.env.JSR_PLAYWRIGHT_PATH || '/tmp/node_modules/playwright';
  const { chromium } = require_(playwrightPath);
  const channel = process.env.JSR_WEBGL_REF_CHANNEL || 'chrome';
  // The bundle of record (assets/three) is an IIFE that defines
  // globalThis.THREE and installs jsr.three at evaluation — no ESM wrapping
  // (the example/web modules are the older renderer-only copies without the
  // F4a runtime install; the scene needs jsr.three.cinematic).
  const scripts = [
    ['jsr_three_web.js', fs.readFileSync(path.join(ROOT, 'assets/three/jsr_three_web.js'), 'utf8')],
  ];

  const scene = fs.readFileSync(SCENE, 'utf8');
  const cells = [];
  let failed = false;
  // One BROWSER per cell: sequential pages in one headless browser crashed
  // the GPU process on this host after a 300-frame cell + events (SIGSEGV in
  // the Chromium GPU process at teardown); per-cell isolation keeps one bad
  // cell from killing the rest. Launch cost ~1 s per cell.
  for (const preset of PRESETS) {
    for (const size of SIZES) {
      const browser = await chromium.launch({ channel, headless: true });
      try {
        const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
        const cell = await webCell(page, preset, size, { scripts, scene });
        if (cell) cells.push(cell); else failed = true;
        await page.close();
      } catch (e) {
        log(`web cell ${preset} ${size.width}x${size.height} launch FAILED: ${e.message.split('\n')[0]}`);
        failed = true;
      } finally {
        await browser.close().catch(() => {});
      }
    }
  }
  return { cells, failed };
}

async function webCell(page, preset, size, src) {
  try {
    // Same injection as the corpus web driver (ref_1b_corpus.cjs): this
    // Playwright build lacks page.addScriptTag; eval-in-page is equivalent.
    const inject = (code) => page.evaluate((c) => { (0, eval)(c); }, code);
    for (const [name, body] of [...src.scripts, ['perf_scene.js', src.scene]]) {
      try {
        await inject(body);
      } catch (e) {
        throw new Error(`script inject failed (${name}): ${e.message}`);
      }
    }
    const info = await page.evaluate((opts) => globalThis.__perfCellSetup(opts), {
      preset, width: size.width, height: size.height,
    });
    if (!info || info.ok !== true) throw new Error('setup failed: ' + JSON.stringify(info));
    // QUIET warm-up + windows + events — the identical event sequence as the
    // native driver, timed with performance.now (JS-side encode+render; the
    // browser submits asynchronously, so wall CPU time is not observable).
    const result = await page.evaluate((cfg) => {
      const QUIET = 10, BOUND = 200, FRAMES = cfg.frames, WINDOWS = cfg.windows;
      const counters = () => {
        const c = JSON.parse(globalThis.__perfFrameCounters());
        return { c: c.c, l: c.l, u: c.u, au: c.au };
      };
      let warmFrames = 0, quietRun = 0, prev = counters();
      while (quietRun < QUIET) {
        if (warmFrames >= BOUND) throw new Error('warm-up never went quiet after ' + BOUND + ' frames');
        globalThis.__perfRender(warmFrames);
        const cur = counters();
        quietRun = (cur.c === prev.c && cur.l === prev.l && cur.u === prev.u) ? quietRun + 1 : 0;
        prev = cur;
        warmFrames++;
      }
      const start = JSON.parse(globalThis.__perfCounters());
      const windows = [];
      let compilesMax = 0, linksMax = 0, uploadsMax = 0, lastFrame = 0;
      for (let w = 0; w < WINDOWS; w++) {
        const wall = [];
        for (let f = 0; f < FRAMES; f++) {
          lastFrame = warmFrames + w * FRAMES + f;
          const t0 = performance.now();
          globalThis.__perfRender(lastFrame);
          wall.push(performance.now() - t0);
          const cur = counters();
          compilesMax = Math.max(compilesMax, cur.c - prev.c);
          linksMax = Math.max(linksMax, cur.l - prev.l);
          uploadsMax = Math.max(uploadsMax, cur.u - prev.u);
          prev = cur;
        }
        wall.sort((a, b) => a - b);
        const pct = (q) => wall[Math.round(q * (wall.length - 1))];
        windows.push({ frames: FRAMES, wallP50Ms: pct(0.50), wallP95Ms: pct(0.95), wallP99Ms: pct(0.99) });
      }
      const end = JSON.parse(globalThis.__perfCounters());
      const runEvent = (name, fns) => {
        const before = JSON.parse(globalThis.__perfCounters());
        fns.forEach((fn) => fn());
        const after = JSON.parse(globalThis.__perfCounters());
        // 'uploads' is a per-call-name dict in full snapshots — sum it (the
        // frame counters carry a plain total).
        const total = (v) => (v && typeof v === 'object' && !Array.isArray(v))
          ? Object.values(v).reduce((a, x) => a + x, 0)
          : (v || 0);
        const d = (k, bk) => total(after[k]) - total(before[bk || k]);
        const deltas = { compiles: d('compiles'), links: d('links'), uploads: d('uploads'), assetUploads: d('assets') };
        return { event: name, ok: deltas.compiles === 0 && deltas.links === 0 && deltas.assetUploads === 0, deltas };
      };
      const events = {};
      events.seek = runEvent('seek', [() => globalThis.__perfRender(lastFrame + 10000)]);
      const halfW = Math.max(1, Math.floor(cfg.width / 2)), halfH = Math.max(1, Math.floor(cfg.height / 2));
      events.resize = runEvent('resize', [
        () => globalThis.__perfResize(halfW, halfH),
        () => globalThis.__perfRender(lastFrame + 10001),
        () => globalThis.__perfRender(lastFrame + 10002),
        () => globalThis.__perfResize(cfg.width, cfg.height),
        () => globalThis.__perfRender(lastFrame + 10003),
        () => globalThis.__perfRender(lastFrame + 10004),
      ]);
      events.resetHistory = runEvent('resetHistory', [
        () => globalThis.__perfResetHistory(1),
        () => globalThis.__perfRender(lastFrame + 10005),
      ]);
      const median = (key) => {
        const v = windows.map((x) => x[key]).sort((a, b) => a - b);
        return v[v.length >> 1];
      };
      const total = (v) => (v && typeof v === 'object' && !Array.isArray(v))
        ? Object.values(v).reduce((a, x) => a + x, 0)
        : (v || 0);
      const steadyDelta = (k, bk) => total(end[k]) - total(start[bk || k]);
      return {
        leg: 'web',
        cell: { preset: cfg.preset, width: cfg.width, height: cfg.height },
        warmup: { frames: warmFrames, quietFrames: QUIET, bound: BOUND },
        windows,
        frames: FRAMES * WINDOWS,
        wallP50Ms: median('wallP50Ms'),
        wallP95Ms: median('wallP95Ms'),
        cpuP50Ms: null,
        cpuP95Ms: null,
        compilesPerFrameMax: compilesMax,
        linksPerFrameMax: linksMax,
        uploadsPerFrameMax: uploadsMax,
        steady: {
          compiles: steadyDelta('compiles'), links: steadyDelta('links'),
          uploads: steadyDelta('uploads'), assetUploads: steadyDelta('assets'),
        },
        events,
        rendererString: cfg.rendererString,
        vendorString: cfg.vendorString,
        glVersion: cfg.glVersion,
        lane: cfg.lane,
        capabilities: cfg.capabilities,
        unsupported: cfg.unsupported,
        applied: cfg.applied,
        objects: { steady: end.objects, afterDispose: JSON.parse(globalThis.__perfDispose()).objectsAfterDispose },
        targets: end.targets,
        rssKb: null,
        structuralOk: compilesMax === 0 && linksMax === 0 && uploadsMax === 0 &&
          steadyDelta('assets') === 0 &&
          Object.values(events).every((e) => e.ok === true),
      };
    }, {
      preset, width: size.width, height: size.height, frames: FRAMES, windows: WINDOWS,
      rendererString: info.rendererString, vendorString: info.vendorString, glVersion: info.glVersion,
      lane: info.lane, capabilities: info.capabilities, unsupported: info.unsupported, applied: info.applied,
    });
    // Round-trip doubles: page.evaluate serializes numbers losslessly (doubles) —
    // keep the 3-decimal convention of the native leg.
    for (const k of ['wallP50Ms', 'wallP95Ms']) {
      result[k] = Math.round(result[k] * 1000) / 1000;
    }
    log('web cell ok:', JSON.stringify(result).slice(0, 160));
    return result;
  } catch (e) {
    log(`web cell ${preset} ${size.width}x${size.height} FAILED: ${e.message.split('\n')[0]}`);
    return null;
  }
}

// ---- report ----------------------------------------------------------------

const fmtMs = (v) => (v === null || v === undefined) ? 'n/a' : v.toFixed(2);
const fmtMiB = (bytes) => bytes == null ? 'n/a' : (bytes / (1024 * 1024)).toFixed(2);
const okMark = (ok) => (ok ? 'PASS' : 'FAIL');

function cellTableRow(c) {
  const targetsBytes = (c.targets || []).reduce((a, t) => a + t.bytes, 0);
  return `| ${c.cell.preset} | ${c.cell.width}x${c.cell.height} | ${fmtMs(c.wallP50Ms)} | ${fmtMs(c.wallP95Ms)} | ` +
    `${fmtMs(c.cpuP50Ms)} | ${fmtMs(c.cpuP95Ms)} | ${c.compilesPerFrameMax} | ${c.linksPerFrameMax} | ` +
    `${c.uploadsPerFrameMax} | ${fmtMiB(targetsBytes)} | ${c.rssKb ? fmtMiB(c.rssKb * 1024) : 'n/a'} | ${okMark(c.structuralOk)} |`;
}

function eventsTable(cells, leg) {
  const rows = [];
  for (const c of cells) {
    for (const [name, e] of Object.entries(c.events || {})) {
      const d = e.deltas;
      rows.push(`| ${leg} | ${c.cell.preset} | ${c.cell.width}x${c.cell.height} | ${name} | ` +
        `${d.compiles} | ${d.links} | ${d.uploads} | ${d.assetUploads} | ${okMark(e.ok)} |`);
    }
  }
  return rows;
}

function writeReport(identity, native, web) {
  const all = [...native.cells, ...web.cells];
  const structuralOk = all.every((c) => c.structuralOk === true);
  const lines = [];
  lines.push('# Cinematic performance matrix (F4f, issue #8)');
  lines.push('');
  lines.push(`Measured ${identity.date}. Generated by \`node tool/three/cinematic_perf.mjs\` — regenerate with that command on the measurement host; the numbers below are host numbers (reported, never gated).`);
  lines.push('');
  lines.push('## Host identity');
  lines.push('');
  lines.push(`- CPU: ${identity.cpu}`);
  lines.push(`- OS: ${identity.macOS}`);
  lines.push(`- Native leg renderer: ${native.cells[0]?.rendererString || 'n/a'} (vendor ${native.cells[0]?.vendorString || 'n/a'}, ${native.cells[0]?.glVersion || ''})`);
  lines.push(`- Web leg renderer: ${web.cells[0]?.rendererString || 'n/a'} (vendor ${web.cells[0]?.vendorString || 'n/a'}, ${web.cells[0]?.glVersion || ''})`);
  lines.push(`- Native engine: ${identity.quickjs}; three r186 pin ${identity.threePin}; ANGLE pin ${identity.anglePin}`);
  lines.push('');
  lines.push('## What each number is');
  lines.push('');
  lines.push('- Scene: `tool/three/perf/perf_scene.js` (byte-identical on both legs), 9 shared-material boxes over one static 256x256 DataTexture color map, static lights, animation driven by the explicit clock frame. One pipeline per preset via `jsr.three.cinematic.createPipeline` + `setPreset`; nothing asset-like changes between frames.');
  lines.push(`- Frames: ${FRAMES} per measurement window, ${WINDOWS} windows per cell, after a QUIET warm-up (frames until compiles/links/uploads deltas are zero for 10 consecutive frames, bounded at 200 — exceeding the bound is a structural failure). Reported p50/p95 are the MEDIAN over the windows (never a best-of-N pick); a measurement is never repeated because a number looked bad.`);
  lines.push('- Native wall time: one `rt.eval` per frame on the bench_1b wire — QuickJS encode + facade transport + native ANGLE submit, drained flush microtask included. Native CPU: the same frames on `CLOCK_THREAD_CPUTIME_ID` (thread CPU time; excludes scheduler preemption). Transport: the BATCHED wire (F2b facade batching), the engine default lane; `JSR_PERF_BATCHED=0` selects the per-command dispatch as a diagnostic. The F4f transport defect (null/size-only uploads mid-batch) is fixed at the wire protocol layer — see docs/angle_1b.md.');
  lines.push('- Web wall time: `performance.now` around `pipeline.renderFrame` in the page (JS-side encode + render; the browser submits asynchronously). Web CPU: not observable in-page — reported n/a.');
  lines.push('- compiles/links/uploads per frame: deltas of the facade `__stats.used` counters (`compileShader`, `linkProgram`, `texImage2D`, `texSubImage2D`, `texImage3D`, `texSubImage3D`, `compressedTex*`) — the facade call counters, cross-checked against a per-texture attribution wrapper around the context (`countersAgree` must be true on the native leg).');
  lines.push('- Offscreen target bytes: the composer read/write targets plus every render target reachable from the passes plus the subframe accumulation target (HalfFloat RGBA of the drawing buffer, cinematic.js ensureAccum descriptor); bytes = width x height x bytes-per-pixel (+ depth attachment when enabled).');
  lines.push('- RSS: resident set size of the native driver process via mach `task_info` (TASK_TASK_BASIC_INFO resident_size), which hosts QuickJS, the facade and ANGLE. Web leg: not attributable (multi-process browser) — n/a.');
  lines.push('');
  lines.push('## Matrix');
  lines.push('');
  lines.push('| Leg | Preset | Resolution | wall p50 ms | wall p95 ms | cpu p50 ms | cpu p95 ms | compiles/frame | links/frame | uploads/frame | targets MiB | RSS MiB | structural |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const c of native.cells) lines.push('| 1b ' + cellTableRow(c));
  for (const c of web.cells) lines.push('| web ' + cellTableRow(c));
  lines.push('');
  lines.push('## Structural counters (REG-UPLOADS, gated)');
  lines.push('');
  lines.push('After the quiet warm-up, over the measured windows: 0 shader compilations, 0 program links and 0 uploads per frame — including the unchanged LUT and scene textures. The seek / resize / resetHistory events must likewise show 0 compiles, 0 links and 0 uploads of the unchanged assets; a resize may legitimately re-upload re-allocated render targets (shown in the uploads column, attributed per texture).');
  lines.push('');
  lines.push('| Leg | Preset | Resolution | Event | compiles | links | uploads (all) | uploads (assets) | Verdict |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (const row of eventsTable(native.cells, '1b')) lines.push(row);
  for (const row of eventsTable(web.cells, 'web')) lines.push(row);
  lines.push('');
  lines.push('## Lane resolution per cell');
  lines.push('');
  lines.push('| Leg | Preset | Lane | motionBlurAccum | Applied effects | Named unsupported |');
  lines.push('|---|---|---|---|---|---|');
  for (const c of all) {
    const applied = Object.entries(c.applied?.effects || {})
      .filter(([, v]) => v === true || typeof v === 'string')
      .map(([k, v]) => `${k}${typeof v === 'string' ? ':' + v : ''}`).join(', ') || 'none';
    lines.push(`| ${c.leg} | ${c.cell.preset} | ${c.lane} | ${c.capabilities?.motionBlurAccum === true ? 'yes' : 'no'} | ${applied} | ${(c.unsupported || []).map((u) => u.effect).join(', ') || 'none'} |`);
  }
  lines.push('');
  lines.push('## Reproduce');
  lines.push('');
  lines.push('```bash');
  lines.push('node tool/three/cinematic_perf.mjs              # full matrix (3 presets x 3 resolutions, both legs)');
  lines.push('node tool/three/cinematic_perf.mjs --ci        # reduced matrix (CI: structural gated, timing informational)');
  lines.push('dart run tool/three/cinematic_perf_1b.dart     # native leg alone');
  lines.push('```');
  lines.push('');
  lines.push(`Structural verdict of this report's run: **${okMark(structuralOk)}**`);
  lines.push('');
  return lines.join('\n');
}

// ---- main ------------------------------------------------------------------

const identity = hostIdentity();
let nativeLeg = { cells: [], failed: false };
let webLeg = { cells: [], failed: false };
if (LEGS.includes('1b') || LEGS.includes('both')) nativeLeg = runNativeLeg();
if (LEGS.includes('web') || LEGS.includes('both')) webLeg = await runWebLeg();
if (nativeLeg.cells.length === 0 && webLeg.cells.length === 0) {
  log('no cells produced on either leg — failing');
  process.exit(1);
}
if (!CI) {
  const md = writeReport(identity, nativeLeg, webLeg);
  fs.writeFileSync(REPORT, md);
  log('report written:', REPORT);
}
const structuralOk = [...nativeLeg.cells, ...webLeg.cells].every((c) => c.structuralOk === true);
const legFailed = nativeLeg.failed || webLeg.failed;
log(`structural ${okMark(structuralOk)}, leg failures: ${legFailed ? 'yes' : 'no'}, cells: ${nativeLeg.cells.length} native + ${webLeg.cells.length} web`);
process.exit(structuralOk && !legFailed ? 0 : 1);
