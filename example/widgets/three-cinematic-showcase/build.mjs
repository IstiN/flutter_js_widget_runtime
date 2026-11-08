// Build script for three-cinematic-showcase.
//
//   node build.mjs               bundle widget.js + cinematic_bundle.mjs,
//                                materialize pinned addons, copy the web
//                                three bundle next to the reference page
//   node build.mjs --regen-shim  regenerate src/three_global_shim.js export
//                                list from the pinned upstream bundle
//
// Outputs:
//   src/widget.js           -> widget.js            (iife, minified, es2020)
//   src/cinematic_entry.js  -> cinematic_bundle.mjs (esm, UNminified —
//                              deterministic hash ground truth for
//                              example/web/cinematic_reference.html)
//
// Resolution: 'three' is aliased to ./src/three_global_shim.js, which
// re-exports the host-installed globalThis.THREE (the technique used by the
// prepared three widgets' native_three_shim.js, see
// tool/three/src/native_three_shim.js). The pinned r186 addon sources
// (EffectComposer and friends) are materialized BYTE-IDENTICAL into
// src/addons/{postprocessing,shaders}/ and imported RELATIVELY — no bundler
// plugins, no /tmp reads at bundle time. (Aliases plus plugin namespaces
// proved unreliable in this environment; plain relative imports plus a
// single 'three' alias are the boring, deterministic route.)
//
// Esbuild selection: repo installs are probed with a virtual-module smoke
// test; if damaged, a private esbuild@0.25.5 is installed under
// ./tools-esbuild and used instead.

import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WIDGET_SRC = path.join(HERE, 'src');
const REPO_ROOT = path.resolve(HERE, '../../..');
const WEB_DIR = path.join(REPO_ROOT, 'example/web');
const TOOL_THREE = path.join(REPO_ROOT, 'tool/three');
const PINNED_COMMIT = '9b4a2ac29c63ccb43fd51c5661f2f873ac2c39b8';
const DEFAULT_THREE_SRC = '/tmp/jsr-three-r186';
const THREE_SRC = process.env.TREE_SRC || process.env.THREE_SRC || DEFAULT_THREE_SRC;
const LOCAL_ADDONS = path.join(WIDGET_SRC, 'addons');

// Every pinned addon file this widget needs, relative to examples/jsm.
const REQUIRED_ADDON_FILES = [
  'postprocessing/EffectComposer.js',
  'postprocessing/RenderPass.js',
  'postprocessing/ShaderPass.js',
  'postprocessing/OutputPass.js',
  'postprocessing/MaskPass.js',
  'postprocessing/Pass.js',
  'postprocessing/BokehPass.js',
  'postprocessing/UnrealBloomPass.js',
  'postprocessing/LUTPass.js',
  'postprocessing/SMAAPass.js',
  'postprocessing/FilmPass.js',
  'shaders/CopyShader.js',
  'shaders/OutputShader.js',
  'shaders/BokehShader.js',
  'shaders/LuminosityHighPassShader.js',
  'shaders/FXAAShader.js',
  'shaders/VignetteShader.js',
  'shaders/FilmShader.js',
  'shaders/SMAAShader.js'
];

// ── Pinned source materialization. The pinned tree at /tmp/jsr-three-r186
// may be partially extracted; missing files are restored byte-for-byte from
// a local upstream git checkout at the pinned commit (read-only). Files are
// written THROUGH the shell: in this build environment writes made directly
// by node fs are not reliably visible to bundler child processes, while
// shell writes are.
function findReferenceRepo() {
  const candidates = [
    process.env.THREE_REF_REPO,
    path.join(REPO_ROOT, '..', 'references', 'three.js'),
    '/Users/Uladzimir_Klyshevich/git/references/three.js'
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, '.git'))) return candidate;
  }
  return null;
}

function pinnedBytes(rel) {
  const fromTmp = path.join(THREE_SRC, 'examples/jsm', rel);
  if (existsSync(fromTmp)) {
    try { return readFileSync(fromTmp); } catch (e) { /* fall through */ }
  }
  const repo = findReferenceRepo();
  if (!repo) return null;
  try {
    return execFileSync('git', ['-C', repo, 'show', PINNED_COMMIT + ':examples/jsm/' + rel]);
  } catch (e) {
    return null;
  }
}

function shellWrite(target, bytes) {
  mkdirSync(path.dirname(target), { recursive: true });
  execFileSync('/bin/sh', ['-c', 'cat > ' + JSON.stringify(target)], { input: bytes });
}

function ensurePinnedSources() {
  const restored = [];
  for (const rel of REQUIRED_ADDON_FILES) {
    const bytes = pinnedBytes(rel);
    if (!bytes) {
      throw new Error('pinned addon unavailable: examples/jsm/' + rel +
        ' (checked ' + path.join(THREE_SRC, 'examples/jsm', rel) +
        ' and the reference repo; set THREE_SRC / THREE_REF_REPO)');
    }
    const target = path.join(LOCAL_ADDONS, rel);
    let stale = true;
    try { stale = readFileSync(target).equals(bytes) === false; } catch (e) { stale = true; }
    if (stale) {
      shellWrite(target, bytes);
      restored.push(rel);
    }
  }
  return restored;
}

// Node-side byte verification of everything the bundler will read.
function verifyPinnedSources() {
  const bad = [];
  for (const rel of REQUIRED_ADDON_FILES) {
    const target = path.join(LOCAL_ADDONS, rel);
    let ok = false;
    try { ok = readFileSync(target).equals(pinnedBytes(rel)); } catch (e) { ok = false; }
    if (!ok) bad.push(rel);
  }
  if (bad.length) {
    throw new Error('pinned addon materialization failed byte verification: ' + bad.join(', '));
  }
}

// ── Concatenated pinned addon bundle (src/addons_bundle.js).
// The pinned postprocessing addons are pre-merged into ONE ES module: all
// inter-module imports/exports are stripped (every exported binding name is
// unique across the set) and replaced by a single 'three' import of the
// union of names plus one final re-export statement. Generated by build.mjs
// from the byte-identical pinned sources under src/addons/ — do not edit.
const ADDONS_BUNDLE_EXPORTS = [
  'Pass', 'FullScreenQuad', 'MaskPass', 'ClearMaskPass',
  'EffectComposer', 'RenderPass', 'ShaderPass', 'OutputPass',
  'BokehPass', 'UnrealBloomPass', 'LUTPass', 'SMAAPass', 'FilmPass',
  'CopyShader', 'OutputShader', 'BokehShader', 'LuminosityHighPassShader',
  'FXAAShader', 'VignetteShader', 'FilmShader',
  'SMAAEdgesShader', 'SMAAWeightsShader', 'SMAABlendShader'
];

function generateAddonsBundle() {
  const order = [
    'shaders/CopyShader.js', 'shaders/OutputShader.js', 'shaders/BokehShader.js',
    'shaders/LuminosityHighPassShader.js', 'shaders/FXAAShader.js',
    'shaders/VignetteShader.js', 'shaders/FilmShader.js', 'shaders/SMAAShader.js',
    'postprocessing/Pass.js', 'postprocessing/MaskPass.js',
    'postprocessing/RenderPass.js', 'postprocessing/ShaderPass.js',
    'postprocessing/EffectComposer.js', 'postprocessing/OutputPass.js',
    'postprocessing/BokehPass.js', 'postprocessing/UnrealBloomPass.js',
    'postprocessing/LUTPass.js', 'postprocessing/SMAAPass.js',
    'postprocessing/FilmPass.js'
  ];
  const threeNames = new Set();
  const parts = [];
  for (const rel of order) {
    const src = readFileSync(path.join(LOCAL_ADDONS, rel), 'utf8');
    const lines = src.split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*import\s*\{/.test(line) || /^\s*import\s+[A-Za-z_$]/.test(line)) {
        // consume the whole import statement (it may span lines) up to the
        // 'from' clause; record 'three' names, drop relative ones.
        let stmt = line;
        while (!/from\s*'/.test(stmt) && i + 1 < lines.length) {
          i++;
          stmt += '\n' + lines[i];
        }
        const m = /from\s*'([^']+)'/.exec(stmt);
        if (m && m[1] === 'three') {
          const names = stmt.replace(/import\s*\{/, '').replace(/}\s*from\s*'three';?\s*$/, '');
          for (const n of names.split(',')) {
            const t = n.trim();
            if (t) threeNames.add(t);
          }
        }
        i++;
        continue;
      }
      if (/^\s*export\s*\{/.test(line)) {
        // drop re-export statements entirely; names come from ADDONS_BUNDLE_EXPORTS.
        i++;
        continue;
      }
      out.push(line);
      i++;
    }
    parts.push('// ── ' + rel + ' ──\n' + out.join('\n').trim() + '\n');
  }
  const header = `// GENERATED by build.mjs from the pinned r186 addon sources under
// src/addons/ (upstream commit ${PINNED_COMMIT}, byte-identical). Do not
// edit by hand: run \`node build.mjs\` to regenerate. The inter-module
// imports of the original files are resolved by concatenation — every
// exported binding name is unique across the merged set.
`;
  const threeImport = 'import {\n  ' + [...threeNames].sort().join(',\n  ') + '\n} from \'three\';\n\n';
  const exportLine = 'export {\n  ' + ADDONS_BUNDLE_EXPORTS.join(',\n  ') + '\n};\n';
  return Buffer.from(header + threeImport + parts.join('\n') + '\n' + exportLine, 'utf8');
}

function ensureAddonsBundle() {
  const target = path.join(WIDGET_SRC, 'addons_bundle.js');
  const bytes = generateAddonsBundle();
  let stale = true;
  try { stale = readFileSync(target).equals(bytes) === false; } catch (e) { stale = true; }
  if (stale) {
    shellWrite(target, bytes);
    console.log('[build] regenerated src/addons_bundle.js (' + bytes.length + ' bytes)');
  }
  return target;
}

// ── three_global_shim.js regeneration (mirrors tool/three build output:
// a generated file checked in so plain `node build.mjs` never rewrites it).
function regenShim() {
  const webPath = path.join(REPO_ROOT, 'assets/three/jsr_three_web.js');
  const nativePath = path.join(REPO_ROOT, 'assets/three/jsr_three_native.js');
  let src = null;
  for (const candidate of [webPath, nativePath]) {
    if (!existsSync(candidate)) continue;
    const code = readFileSync(candidate, 'utf8');
    const marker = 'if (!globalThis.THREE) { globalThis.THREE = THREE; }';
    if (!code.includes(marker)) continue;
    const m = /const THREE = ([A-Za-z0-9_$]+);/.exec(code);
    if (!m) continue;
    const expr = m[1];
    const mm = new RegExp('(?:const|var|let) ' + expr + ' =\\\\s*\\\\{([\\\\s\\\\S]*?)\\\\};').exec(code);
    if (!mm) continue;
    src = mm[1];
    break;
  }
  if (src === null) {
    throw new Error('could not derive export list from the pinned host bundles (assets/three/jsr_three_{web,native}.js)');
  }
  const names = new Set();
  for (const raw of src.split(',')) {
    const part = raw.trim();
    if (!part) continue;
    if (part.startsWith('...')) continue;
    const seg = part.split(':')[0].trim();
    if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(seg)) names.add(seg);
  }
  if (names.size < 300) {
    throw new Error('refusing to regenerate shim: only ' + names.size + ' exports parsed (expected ~450)');
  }
  const sorted = [...names].sort();
  const chunk = 160;
  const lines = [];
  for (let i = 0; i < sorted.length; i += chunk) {
    lines.push('export const { ' + sorted.slice(i, i + chunk).join(', ') + ' } = T;');
  }
  const header = `// Generated by build.mjs --regen-shim from the pinned host bundles
// (assets/three/jsr_three_web.js + jsr_three_native.js, upstream commit
// ${PINNED_COMMIT}; ${sorted.length} exports). Do not edit by hand.
// Re-exports the host-installed globalThis.THREE (same technique as
// tool/three/src/native_three_shim.js): the jsr three bundle is evaluated
// before this widget, so the bundled code shares object identity with the
// host renderer instead of inlining a second copy of the three core.
const T = globalThis.THREE;

if (T === undefined || T === null) {
  throw new Error('three.unsupported: evaluate the JSR jsr_three_native.js/jsr_three_web.js bundle before this widget so globalThis.THREE is installed');
}

export default T;
`;
  shellWrite(path.join(WIDGET_SRC, 'three_global_shim.js'), header + lines.join('\n') + '\n');
  console.log('[build] regenerated three_global_shim.js with ' + sorted.length + ' exports');
}

// ── esbuild CLI resolution. The JS-API service mode is unreliable in this
// build environment (plugin-namespace and plain relative imports alike fail
// with phantom "no matching export" errors inside the service child), while
// the esbuild CLI binary works reliably — including when spawned from node.
// The CLI is probed with a two-file bundle before use.
function findEsbuildCli() {
  const candidates = [
    process.env.ESBUILD_BIN,
    path.join(TOOL_THREE, 'node_modules/.bin/esbuild'),
    path.join(HERE, 'tools-esbuild/node_modules/.bin/esbuild'),
    path.join(REPO_ROOT, 'node_modules/.bin/esbuild')
  ].filter(Boolean);
  for (const bin of candidates) {
    if (!existsSync(bin)) continue;
    try {
      execFileSync(bin, ['--version'], { stdio: 'pipe' });
      return bin;
    } catch (e) { /* next */ }
  }
  const tools = path.join(HERE, 'tools-esbuild');
  const marker = path.join(tools, 'node_modules/esbuild/package.json');
  if (!existsSync(marker)) {
    console.log('[build] installing private esbuild@0.25.5 under ./tools-esbuild');
    mkdirSync(tools, { recursive: true });
    execFileSync('/bin/sh', ['-c', 'cd ' + JSON.stringify(tools) + ' && [ -f package.json ] || npm init -y >/dev/null 2>&1; npm install esbuild@0.25.5 --no-audit --no-fund'], { stdio: 'inherit' });
  }
  const bin = path.join(tools, 'node_modules/.bin/esbuild');
  execFileSync(bin, ['--version'], { stdio: 'pipe' });
  return bin;
}

function probeEsbuildCli(bin) {
  const dir = path.join(HERE, 'tools-esbuild');
  mkdirSync(dir, { recursive: true });
  const a = path.join(dir, '.probe_a.js');
  const b = path.join(dir, '.probe_b.js');
  // Written through the shell so the probe files are visible to the CLI
  // child regardless of which process generation this is.
  execFileSync('/bin/sh', ['-c',
    'printf %s ' + JSON.stringify('import { x } from \'./.probe_b.js\'; console.log(x);') + ' > ' + JSON.stringify(a) + '; ' +
    'printf %s ' + JSON.stringify('export const x = 42;') + ' > ' + JSON.stringify(b)
  ]);
  try {
    execFileSync(bin, [a, '--bundle', '--outfile=/dev/null', '--log-level=silent'], { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

// ── Web reference page support files (example/web is a tracked dir: this
// build touches ONLY jsr_three_web.js / three.core.js / cinematic_bundle.mjs).
function ensureWebThreeBundle() {
  const upstreamBuild = path.join(THREE_SRC, 'build/three.module.js');
  const upstreamCore = path.join(THREE_SRC, 'build/three.core.js');
  const prebuiltWeb = path.join(REPO_ROOT, 'assets/three/jsr_three_web.js');
  const webTarget = path.join(WEB_DIR, 'jsr_three_web.js');
  // The page imports this file as an ES module — it MUST be the real upstream
  // r186 build/three.module.js (which imports './three.core.js' — r186 splits
  // the build, see ensureWebThreeBundle's core handling below). Anything else
  // (e.g. the repo's var-THREE script bundle) is replaced.
  let needsCopy = true;
  try {
    const head = readFileSync(webTarget, 'utf8').slice(0, 4096);
    needsCopy = !head.includes('export');
  } catch (e) { needsCopy = true; }
  if (needsCopy) {
    if (existsSync(upstreamBuild)) {
      execFileSync('cp', [upstreamBuild, webTarget]);
      console.log('[build] installed upstream build/three.module.js as example/web/jsr_three_web.js');
    } else if (existsSync(prebuiltWeb)) {
      execFileSync('cp', [prebuiltWeb, webTarget]);
      console.log('[build] copied assets/three/jsr_three_web.js (pinned prebuilt; upstream build/ absent)');
    } else {
      throw new Error('no three web bundle available for the reference page');
    }
  }
  // three.module.js (r186) imports './three.core.js' — the page 404s without
  // it. The committed copy in example/web/ is the hermetic fallback; refresh
  // it from the pinned upstream source when that checkout exists.
  const coreTarget = path.join(WEB_DIR, 'three.core.js');
  if (existsSync(upstreamCore) && existsSync(coreTarget)) {
    // Refresh only when the target is absent or differs, so a manual fix is
    // never silently reverted.
    if (execFileSync('shasum', ['-a', '256', upstreamCore]).toString().split(/\s+/)[0] !==
        execFileSync('shasum', ['-a', '256', coreTarget]).toString().split(/\s+/)[0]) {
      execFileSync('cp', [upstreamCore, coreTarget]);
      console.log('[build] refreshed example/web/three.core.js from the pinned upstream build');
    }
  } else if (!existsSync(coreTarget)) {
    if (existsSync(upstreamCore)) {
      execFileSync('cp', [upstreamCore, coreTarget]);
      console.log('[build] installed upstream build/three.core.js as example/web/three.core.js');
    } else {
      throw new Error('example/web/three.core.js is missing and no pinned upstream build/three.core.js is available');
    }
  }
  return webTarget;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--bundle')) return bundlePhase();
  if (args.includes('--verify')) return verifyPhase();

  // Phase 1 (this process): materialize + byte-verify pinned sources, then
  // run the bundle and verify phases in FRESH node processes. The bundler
  // runs in a child of this process so every file it reads was written at
  // least one process generation earlier (files written by this process are
  // not reliably visible to bundler helper processes in this environment).
  const restored = ensurePinnedSources();
  if (restored.length) {
    console.log('[build] materialized ' + restored.length + ' pinned addon files into src/addons/');
  }
  verifyPinnedSources();
  ensureAddonsBundle();
  if (args.includes('--regen-shim')) regenShim();

  const self = fileURLToPath(import.meta.url);
  execFileSync(process.execPath, [self, '--bundle'], { stdio: 'inherit' });
  execFileSync(process.execPath, [self, '--verify'], { stdio: 'inherit' });
  console.log('[build] done.');
}

function runWithRetries(label, fn, attempts) {
  // This build environment intermittently serves stale directory listings
  // to bundler child processes (phantom "no matching export" errors that
  // vanish seconds later with byte-identical inputs). Retry with backoff.
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      fn();
      return;
    } catch (e) {
      lastErr = e;
      const stderr = (e.stderr || '').toString();
      if (!/No matching export|Could not resolve/.test(stderr)) throw e;
      console.log('[build] ' + label + ': transient resolution error (attempt ' + (i + 1) + '/' + attempts + '), retrying');
      execFileSync('/bin/sh', ['-c', 'sleep 3']);
    }
  }
  throw lastErr;
}

async function bundlePhase() {
  const bin = findEsbuildCli();
  if (!probeEsbuildCli(bin)) {
    throw new Error('esbuild CLI probe failed at ' + bin);
  }

  // Stage EVERY bundler input into a FRESHLY CREATED directory. Directory
  // listings for long-lived repo directories are served from a stale cache
  // to bundler child processes in this build environment ("Could not
  // resolve" / phantom "no matching export" for files that exist and are
  // byte-correct); a brand-new directory has no cached listing and resolves
  // reliably.
  const staging = mkdtempSync(path.join(os.tmpdir(), 'cine-build-'));
  const inputs = ['widget.js', 'pipeline.js', 'scene.js', 'cinematic_entry.js', 'three_global_shim.js', 'addons_bundle.js'];
  for (const f of inputs) {
    copyFileSync(path.join(WIDGET_SRC, f), path.join(staging, f));
  }
  const shim = path.join(staging, 'three_global_shim.js');
  const baseArgs = [
    '--bundle',
    '--target=es2020',
    '--alias:three=' + shim,
    '--define:__THREE_DEVTOOLS__=undefined',
    '--log-level=warning'
  ];

  // Widget bundle: iife, minified.
  runWithRetries('widget bundle', () => {
    execFileSync(bin, [
      path.join(staging, 'widget.js'),
      ...baseArgs,
      '--format=iife',
      '--platform=neutral',
      '--minify',
      '--outfile=' + path.join(HERE, 'widget.js')
    ], { stdio: 'pipe', cwd: staging });
  }, 8);
  console.log('[build] wrote widget.js');

  // Reference-page bundle: esm, UNminified (byte-stable hash ground truth).
  runWithRetries('esm bundle', () => {
    execFileSync(bin, [
      path.join(staging, 'cinematic_entry.js'),
      ...baseArgs,
      '--format=esm',
      '--platform=neutral',
      '--tree-shaking=false',
      '--outfile=' + path.join(HERE, 'cinematic_bundle.mjs')
    ], { stdio: 'pipe', cwd: staging });
  }, 8);
  console.log('[build] wrote cinematic_bundle.mjs');

  ensureWebThreeBundle();
  execFileSync('cp', [path.join(HERE, 'cinematic_bundle.mjs'), path.join(WEB_DIR, 'cinematic_bundle.mjs')]);
  console.log('[build] copied cinematic_bundle.mjs to example/web/');
}

function verifyPhase() {
  execFileSync(process.execPath, ['--check', path.join(HERE, 'widget.js')], { stdio: 'pipe' });
  console.log('[build] node --check widget.js OK');
  const esm = readFileSync(path.join(HERE, 'cinematic_bundle.mjs'), 'utf8');
  for (const marker of ['clockState', 'cinematicRandom', 'probeCapabilities', 'createCinematicPipeline', 'createShowcaseScene']) {
    if (!esm.includes(marker)) {
      throw new Error('cinematic_bundle.mjs missing expected export marker: ' + marker);
    }
  }
  console.log('[build] cinematic_bundle.mjs export markers OK (' + esm.length + ' bytes)');
}

main().catch(e => {
  console.error('[build] failed: ' + (e && e.message ? e.message : e));
  process.exit(1);
});
