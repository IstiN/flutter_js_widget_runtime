#!/usr/bin/env node
// Focused byte-level checks for the assigned loader regressions. The optional
// source argument must be the pinned r186 checkout used by prepare.mjs.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePvrAsset } from '../asset_decode.mjs';
import { ldrawSceneAssets } from '../degrades/ldraw_scene_manifest.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const source = process.argv[2] || '/tmp/jsr-three-r186-perf';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

const pvrtcDirectory = path.join(ROOT, 'example/widgets/three-loader-texture-pvrtc');
const pvrtcManifest = JSON.parse(await readFile(path.join(pvrtcDirectory, 'assets.json'), 'utf8'));
assert.equal(pvrtcManifest.assets.length, 8);
const pvrtc = [];
for (const asset of pvrtcManifest.assets) {
  const original = await readFile(path.join(source, 'examples', asset.url));
  const decoded = await decodePvrAsset(source, original, asset.url);
  const prepared = await readFile(path.join(pvrtcDirectory, asset.file));
  assert.equal(sha256(prepared), asset.sha256, `${asset.url}: prepared hash`);
  assert.deepEqual(prepared, decoded, `${asset.url}: prepared bytes differ from decoder`);
  assert.equal(prepared.subarray(0, 9).toString('latin1'), 'JSRKTEX2\0');
  const headerLength = prepared.readUInt32LE(9);
  const header = JSON.parse(prepared.subarray(13, 13 + headerLength).toString('utf8'));
  const rgba = prepared.subarray(13 + headerLength);
  assert.equal(header.width, 256);
  assert.equal(header.height, 256);
  assert.equal(header.cube, asset.url.includes('cube'));
  assert.equal(rgba.length, 256 * 256 * 4 * (header.cube ? 6 : 1));
  assert.ok(rgba.some((value, index) => index % 4 !== 3 && value !== 0 && value !== 255),
    `${asset.url}: decoded color data must not be a monochrome fallback`);
  pvrtc.push({ url: asset.url, width: header.width, height: header.height,
    faces: header.cube ? 6 : 1,
    sourceMips: original.readUInt32LE(0) === 0x03525650 ? original.readUInt32LE(44) : original.readUInt32LE(12) + 1,
    preparedBytes: prepared.length });
}

const ldrawDirectory = path.join(ROOT, 'example/widgets/three-loader-ldraw');
assert.equal(ldrawSceneAssets.length, 17);
assert.ok(ldrawSceneAssets.every(record => !record.url.includes('.merge.')));
let ldrawBytes = 0;
let quantizedAttributes = 0;
for (const record of ldrawSceneAssets) {
  const bytes = await readFile(path.join(ldrawDirectory, record.output));
  ldrawBytes += bytes.length;
  assert.equal(sha256(bytes), record.sha256, `${record.url}: prepared hash`);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  assert.equal(view.getUint32(0, true), 0x52444c4a);
  const headerLength = view.getUint32(4, true);
  const header = JSON.parse(new TextDecoder().decode(bytes.subarray(8, 8 + headerLength)));
  assert.equal(header.version, 2);
  assert.ok(header.nodes.length > 0 && header.geometries.length > 0);
  assert.ok(header.nodes.some(node => node.conditional), `${record.url}: conditional lines lost`);
  if (record.url.includes('car.ldr')) {
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const placedNodes = header.nodes.filter(node => node.matrix.some((value, index) => Math.abs(value - identity[index]) > 1e-6));
    assert.ok(placedNodes.length > 20,
      `${record.url}: part transforms must be updated before serialization (got ${placedNodes.length})`);
  }
  let hasSmoothNormals = false;
  for (const geometry of header.geometries) {
    for (const attribute of Object.values(geometry.attributes)) {
      const width = attribute.encoding === 'float32' ? 4 : attribute.encoding === 'int16' ? 2 : 1;
      const length = attribute.count * attribute.itemSize;
      assert.ok(Number.isInteger(length) && length >= 0);
      assert.ok(attribute.offset >= 8 + headerLength && attribute.offset + length * width <= bytes.length,
        `${record.url}: invalid attribute view`);
      assert.ok(['int16', 'int8', 'uint8', 'float32'].includes(attribute.encoding));
      if (attribute.encoding !== 'float32') quantizedAttributes++;
      // Exercise every encoded position and ensure reconstruction stays finite.
      if (attribute.encoding === 'int16') {
        for (let index = 0; index < length; index++) {
          const component = index % attribute.itemSize;
          const value = view.getInt16(attribute.offset + index * 2, true) * attribute.scale[component] + attribute.center[component];
          assert.ok(Number.isFinite(value));
        }
      }
    }
    if (geometry.attributes.smoothNormal) {
      hasSmoothNormals = true;
      assert.equal(geometry.attributes.smoothNormal.count, geometry.attributes.position.count);
    }
  }
  assert.ok(hasSmoothNormals, `${record.url}: selectable smooth normals missing`);
}
assert.ok(ldrawBytes < 50 * 1024 * 1024, `LDraw payload too large: ${ldrawBytes}`);

console.log(JSON.stringify({ ok: true, pvrtc, ldraw: {
  models: ldrawSceneAssets.length, bytes: ldrawBytes, quantizedAttributes
} }, null, 2));
