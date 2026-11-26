#!/usr/bin/env node
// stage_afterimage.mjs — stages the STOCK r186 AfterimagePass as a plain
// script bundle for the F4i host proof (issue #8, segment F4i). The pass is
// NOT part of the committed three bundle (the cinematic build inlines a
// fixed addon set; afterimage is the temporal lanes' concern), so the proof
// stages it from the PINNED three tree at runtime — never a vendored copy.
//
// Sources, in order:
//   1. $JSR_THREE_SOURCE (the CI verify steps clone /tmp/jsr-three-r186)
//   2. /tmp/jsr-three-r186 (the pinned checkout of record)
//   3. raw.githubusercontent.com at the pin commit in tool/three/source-pin.json
//
// Output: an IIFE plain script (QuickJS-compatible) that exposes
// globalThis.F4IAfterimage = { AfterimagePass }. The 'three' import is
// aliased to the globalThis.THREE runtime global via a one-line CJS shim.
//
// Usage: node tool/three/cinematic_host_proof/stage_afterimage.mjs --out <file>
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(new URL('../../..', import.meta.url).pathname); // repo root
const FILES = [
  'examples/jsm/postprocessing/Pass.js',
  'examples/jsm/shaders/CopyShader.js',
  'examples/jsm/shaders/AfterimageShader.js',
  'examples/jsm/postprocessing/AfterimagePass.js',
];
const ENTRY = 'examples/jsm/postprocessing/AfterimagePass.js';

function readPin() {
  const pin = JSON.parse(fs.readFileSync(path.join(REPO, 'tool/three/source-pin.json'), 'utf8'));
  return pin.commit;
}

function resolveSource() {
  const candidates = [];
  if (process.env.JSR_THREE_SOURCE) candidates.push(process.env.JSR_THREE_SOURCE);
  candidates.push('/tmp/jsr-three-r186');
  for (const dir of candidates) {
    const p = path.join(dir, FILES[0]);
    if (fs.existsSync(p)) {
      console.log(`[f4i-stage] source: ${dir}`);
      return { kind: 'dir', dir };
    }
  }
  return { kind: 'fetch', commit: readPin() };
}

function fetchFile(commit, rel) {
  const url = `https://raw.githubusercontent.com/mrdoob/three.js/${commit}/${rel}`;
  const out = path.join(STAGE, path.basename(rel));
  console.log(`[f4i-stage] fetch ${url}`);
  execFileSync('curl', ['-fsSL', '-o', out, url], { stdio: 'inherit' });
  return out;
}

const argOut = (() => {
  const i = process.argv.indexOf('--out');
  return i >= 0 ? process.argv[i + 1] : null;
})();

const STAGE = '/tmp/f4i_stage';
fs.rmSync(STAGE, { recursive: true, force: true });
fs.mkdirSync(STAGE, { recursive: true });

const src = resolveSource();
// Preserve the examples/jsm layout — AfterimagePass imports ../shaders/*.
for (const rel of FILES) {
  const local = src.kind === 'dir' ? path.join(src.dir, rel) : fetchFile(src.commit, rel);
  const dest = path.join(STAGE, rel.replace(/^examples\/jsm\//, ''));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(local, dest);
}

// The global shim: bare `import { X } from 'three'` resolves here and reads
// the runtime global (both legs evaluate the committed three bundle first).
fs.writeFileSync(path.join(STAGE, 'three_global_shim.cjs'), 'module.exports = globalThis.THREE;\n');

let esbuild = path.join(REPO, 'tool/three/node_modules/.bin/esbuild');
if (!fs.existsSync(esbuild)) {
  console.error('[f4i-stage] esbuild not found (npm ci --prefix tool/three first)');
  process.exit(1);
}
const out = argOut || path.join(STAGE, 'afterimage_f4i.js');
execFileSync(esbuild, [
  path.join(STAGE, ENTRY.replace(/^examples\/jsm\//, '')),
  '--bundle', '--target=es2020',
  `--alias:three=${path.join(STAGE, 'three_global_shim.cjs')}`,
  '--define:__THREE_DEVTOOLS__=undefined',
  '--format=iife', '--global-name=F4IAfterimage',
  '--platform=neutral', '--log-level=warning',
  `--outfile=${out}`,
], { stdio: 'inherit' });

// Sanity: the bundle must expose the constructor.
const text = fs.readFileSync(out, 'utf8');
if (!text.includes('AfterimagePass')) {
  console.error('[f4i-stage] staged bundle does not contain AfterimagePass');
  process.exit(1);
}
console.log(`[f4i-stage] OK ${out} (${text.length} bytes)`);
