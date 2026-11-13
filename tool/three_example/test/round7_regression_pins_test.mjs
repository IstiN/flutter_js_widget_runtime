// Round-7 owner-regression pins: the isolate warm-bytes image contract and
// the points-dynamic direct-render degrade.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = relative => readFile(path.join(ROOT, relative), 'utf8');

// The isolate large-payload warm-bytes lane strips base64 `data` and ships
// decoded RGBA as typed `bytes`. Every decodeImage consumer must accept both
// forms; a base64-only validator rejected the response and produced black
// textures/scenes in the isolate catalog (owner: lightprobe-cubecamera).
const nativeLoaders = await read('tool/three/src/native_loaders.js');
const nativeAccepts = nativeLoaders.match(/typeof result\.data === 'string' \? decodeBase64\(result\.data\) : result\.bytes/g);
assert.equal(nativeAccepts?.length, 2, 'native_loaders accepts warm bytes at both decodeImage sites');
const nativeBundle = await read('assets/three/jsr_three_native.js');
assert.ok(!/typeof [A-Za-z_$][\w$]*\.data!="string"\)throw new Error\("three\.canvas2d: invalid decoded image response"\)/.test(nativeBundle),
  'native bundle has no base64-only decodeImage validator');

const adapter = await read('tool/three_example/example_adapter.js');
assert.match(adapter, /typeof result\.data === 'string' \? decodeBase64\(result\.data\) : result\.bytes/,
  'example adapter accepts warm bytes');

// Every prepared widget embedding the adapter validator must carry the
// bytes-accepting form, and its checked-in manifest must stay true.
const widgetsRoot = path.join(ROOT, 'example/widgets');
let swept = 0;
for (const entry of await readdir(widgetsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const widgetPath = path.join(widgetsRoot, entry.name, 'widget.js');
  const source = await readFile(widgetPath, 'utf8').catch(() => null);
  if (source === null || !source.includes('invalid decoded image response')) continue;
  assert.ok(!/typeof [A-Za-z_$][\w$]*\.data!="string"\)throw new Error\(`[^`]*invalid decoded image response/.test(source),
    `${entry.name}: base64-only decodeImage validator`);
  assert.match(source, /typeof [A-Za-z_$][\w$]*\.data=="string"\?[A-Za-z_$][\w$]*\([A-Za-z_$][\w$]*\.data\):[A-Za-z_$][\w$]*\.bytes/,
    `${entry.name}: warm-bytes decode present`);
  const manifest = JSON.parse(await readFile(path.join(widgetsRoot, entry.name, 'prepare_manifest.json'), 'utf8'));
  const bytes = await readFile(widgetPath);
  assert.equal(manifest.outputs['widget.js'].bytes, bytes.length, `${entry.name} widget byte count`);
  assert.equal(manifest.outputs['widget.js'].sha256, createHash('sha256').update(bytes).digest('hex'), `${entry.name} widget hash`);
  swept++;
}
assert.ok(swept >= 300, `swept ${swept} prepared widgets`);

// points-dynamic renders the scene directly (bounded degrade); the lowered
// composer per-frame chain must not return (owner: smeared particles).
const pointsWidget = await read('example/widgets/three-points-dynamic/widget.js');
assert.ok(!/\.render\(\s*(?:0?\.01|0\.01|1e-2)\s*\)/.test(pointsWidget), 'points-dynamic: composer.render(0.01) is gone');
assert.match(pointsWidget, /[A-Za-z_$][\w$]{0,63}\.render\([A-Za-z_$][\w$]{0,63},[A-Za-z_$][\w$]{0,63}\)/, 'points-dynamic: direct scene render present');
assert.ok(pointsWidget.includes('.autoClear = true') || pointsWidget.includes('.autoClear=!0'), 'points-dynamic: direct render restores autoClear (no accumulation smear)');

console.log(`round7_regression_pins_test: PASS (warm-bytes image contract, ${swept} prepared widgets, points-dynamic direct render)`);
