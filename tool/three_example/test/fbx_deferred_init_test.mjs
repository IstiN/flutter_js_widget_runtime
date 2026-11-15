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
assert.ok(output.includes('const handleLoadedGroup = ( group ) => {'));
assert.ok(output.includes('function deliverGroup()'));
assert.ok(output.includes('if ( ! guiAnimationsFolder || ! guiMorphsFolder )'));
assert.throws(() => applyFbxDeferredInitPatch(Buffer.from('drifted')),
  /load anchor drifted/);

// Exercise the actual generated loader delivery statement. The asset arrives
// before GUI initialization, an early timer drain must rearm, and the exact
// group is delivered once after both folders exist.
const start = output.indexOf(
  '\t\t\t\tloader.load( \'models/fbx/\' + asset + \'.fbx\', function ( group ) {');
const close = '\t\t\t\t} );';
const closeAt = output.indexOf(close, start);
const end = closeAt < 0 ? -1 : closeAt + close.length;
assert.ok(start >= 0 && end > start);
const pending = [];
const group = { name: 'loaded-before-gui' };
let deliver;
let delivered = 0;
let foldersReady = false;
const run = new Function('loader', 'asset', 'handleLoadedGroup', 'setTimeout',
  'let guiAnimationsFolder = false, guiMorphsFolder = false;\n' +
    output.slice(start, end) +
    '\nreturn function (ready) { guiAnimationsFolder = ready; guiMorphsFolder = ready; };');
const setFoldersReady = run({
  load(_url, callback) { deliver = callback; },
}, 'Samba Dancing', value => {
  assert.ok(foldersReady, 'the loaded group must wait for GUI initialization');
  assert.equal(value, group);
  delivered++;
}, (callback, delay) => {
  assert.equal(delay, 0);
  pending.push(callback);
});
assert.equal(typeof deliver, 'function');
deliver(group);
assert.equal(delivered, 0);
assert.equal(pending.length, 1);
pending.shift()();
assert.equal(delivered, 0, 'an early timer drain must rearm, not deliver');
assert.equal(pending.length, 1);
foldersReady = true;
setFoldersReady(true);
pending.shift()();
assert.equal(delivered, 1);
assert.equal(pending.length, 0);

console.log('FBX deferred loaded-group delivery: anchor, syntax and readiness PASS');
