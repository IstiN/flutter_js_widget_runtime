import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from '../../three/node_modules/esbuild/lib/main.js';
import { applyFbxDeferredInitPatch } from '../degrades/fbx_deferred_init.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const original = await readFile(path.join(ROOT,
  'example/widgets/three-loader-fbx/official_module.js'));
const output = applyFbxDeferredInitPatch(original).toString('utf8');
await transform(output, { loader: 'js', format: 'esm', target: 'es2020' });
assert.ok(output.includes('setTimeout( function loadInitialAssetWhenReady() {'));
assert.throws(() => applyFbxDeferredInitPatch(Buffer.from('drifted')),
  /load anchor drifted/);

const start = output.indexOf('\t\t\t\tloader = new FBXLoader( manager );');
const close = '\t\t\t\t}, 0 );';
const closeAt = output.indexOf(close, start);
const end = closeAt < 0 ? -1 : closeAt + close.length;
assert.ok(start >= 0 && end > start);
const pending = [];
let loads = 0;
let foldersReady = false;
assert.ok(output.includes('if ( ! guiAnimationsFolder || ! guiMorphsFolder )'));
const run = new Function('FBXLoader', 'manager', 'loadAsset', 'params',
  'setTimeout', 'loader',
  'let guiAnimationsFolder = false, guiMorphsFolder = false;\n' +
    output.slice(start, end) +
    '\nreturn function (ready) { guiAnimationsFolder = ready; guiMorphsFolder = ready; };');
const setFoldersReady = run(class {}, {}, () => {
  assert.ok(foldersReady, 'the load callback must run after GUI initialization');
  loads++;
}, { asset: 'Samba Dancing' }, (callback, delay) => {
  assert.equal(delay, 0);
  pending.push(callback);
}, null);
assert.equal(loads, 0, 'pinned bytes must not call back during init');
assert.equal(pending.length, 1);
pending.shift()();
assert.equal(loads, 0, 'an early timer drain must rearm, not load');
assert.equal(pending.length, 1);
foldersReady = true;
setFoldersReady(true);
pending.shift()();
assert.equal(loads, 1);

console.log('FBX deferred initial load: anchor, syntax and fast-resolve ordering PASS');
