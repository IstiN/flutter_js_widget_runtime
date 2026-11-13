// Round-6 owner-regression pins for prepared-widget degrades.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = relative => readFile(path.join(ROOT, relative), 'utf8');

// A white albedo is mandatory now that R1 implements upstream's default
// MultiplyOperation. The former black ADD-combine workaround zeros env.
const ikDegrade = await read('tool/three_example/degrades/ik_mirror_static.mjs');
assert.match(ikDegrade, /MeshBasicMaterial\( \{ envMap: jsrStaticMirrorRoomCube\( THREE \), color: 0xffffff \} \)/);
assert.doesNotMatch(ikDegrade, /color: 0x000000/);
const ikWidget = await read('example/widgets/three-animation-skinning-ik/widget.js');
assert.match(ikWidget, /envMap:r\(bi\),color:16777215/);

// Linear-sRGB / untagged cube-face bytes must not be decoded as sRGB again.
// Upstream LightProbeGenerator leaves both untouched. Double conversion is
// what made the light-probe helper look like a dark gray/black sphere.
const prepare = await read('tool/three_example/prepare.mjs');
const conversion = prepare.match(/function convertColorToLinear\(color, colorSpace\) \{([\s\S]*?)\n\}/);
assert.ok(conversion, 'bounded LightProbeGenerator conversion helper exists');
assert.doesNotMatch(conversion[1], /colorSpace === 'srgb-linear'/);
const probeWidget = await read('example/widgets/three-lightprobe-cubecamera/widget.js');
assert.match(probeWidget, /\(t==="srgb"\|\|t===3001\)&&r\.convertSRGBToLinear\(\)/);
assert.doesNotMatch(probeWidget, /t==="srgb-linear"\)&&r\.convertSRGBToLinear/);

// Surgical prepared-output updates must keep their checked-in manifests true.
for (const id of ['three-animation-skinning-ik', 'three-lightprobe-cubecamera']) {
  const bytes = await readFile(path.join(ROOT, `example/widgets/${id}/widget.js`));
  const manifest = JSON.parse(await read(`example/widgets/${id}/prepare_manifest.json`));
  assert.equal(manifest.outputs['widget.js'].bytes, bytes.length, `${id} widget byte count`);
  assert.equal(manifest.outputs['widget.js'].sha256, createHash('sha256').update(bytes).digest('hex'), `${id} widget hash`);
}

console.log('round6_regression_pins_test: PASS (ik multiply albedo, probe single sRGB decode, manifest hashes)');
