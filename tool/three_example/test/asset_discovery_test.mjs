import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { discoverAssets, verifyDiscoveredAssets } from '../asset_discovery.mjs';
import { JsrDOMParser } from '../vendor/xml_dom.js';

const xml = new JsrDOMParser().parseFromString(
  '<?xml version="1.0"?><root xmlns="urn:model"><item id="a">A&amp;B</item><group><item id="b"><![CDATA[text]]></item></group></root>',
  'application/xml'
);
assert.equal(xml.querySelector('parsererror'), null);
assert.equal(xml.getElementsByTagName('item').length, 2);
assert.equal(xml.querySelector('group item').textContent, 'text');
assert.equal(xml.querySelector('[id=a]').textContent, 'A&B');
assert.equal(xml.getElementsByTagNameNS('urn:model', 'item').length, 2);

const temporary = await mkdtemp(path.join(os.tmpdir(), 'jsr-asset-discovery-'));
const examples = path.join(temporary, 'examples');
function compressedGlb() {
  const document = Buffer.from(JSON.stringify({
    asset: { version: '2.0' },
    extensionsUsed: ['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_texture_basisu'],
    buffers: [{ byteLength: 4 }]
  }));
  const jsonLength = (document.length + 3) & ~3;
  const output = Buffer.alloc(12 + 8 + jsonLength + 8 + 4);
  output.write('glTF', 0, 'latin1');
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(jsonLength, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  document.copy(output, 20);
  output.fill(0x20, 20 + document.length, 20 + jsonLength);
  output.writeUInt32LE(4, 20 + jsonLength);
  output.writeUInt32LE(0x004e4942, 24 + jsonLength);
  return output;
}
const files = new Map([
  ['textures/sprites/snow.png', Buffer.from('sprite-v1')],
  ['textures/cube/pisa/px.jpg', Buffer.from('px-v1')],
  ['textures/cube/pisa/nx.jpg', Buffer.from('nx-v1')],
  ['textures/crate.gif', Buffer.from('GIF89a')],
  ['textures/memorial.hdr', Buffer.from('#?RADIANCE\n')],
  ['luts/Bourbon 64.CUBE', Buffer.from('LUT_3D_SIZE 2\n')],
  ['luts/NeutralLUT.png', Buffer.from('lut-png')],
  ['textures/ignored.remote.ktx2', Buffer.from('remote')],
  ['textures/ktx2/local.ktx2', Buffer.from('local-ktx2')],
  ['models/draco/bunny.drc', Buffer.from('local-draco')],
  ['models/vrml/house.wrl', Buffer.from('#VRML V2.0 utf8')],
  ['models/gltf/compressed.glb', compressedGlb()],
  ['models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf', Buffer.from(JSON.stringify({
    buffers: [{ uri: './DamagedHelmet.bin' }], images: [{ uri: 'Default_albedo.jpg' }]
  }))],
  ['models/gltf/DamagedHelmet/glTF/DamagedHelmet.bin', Buffer.from([0, 1, 2, 3])],
  ['models/gltf/DamagedHelmet/glTF/Default_albedo.jpg', Buffer.from('albedo-v1')]
]);
try {
  for (const [name, bytes] of files) {
    const output = path.join(examples, name);
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, bytes);
  }
  const moduleSource = `
    new THREE.TextureLoader().load('textures/sprites/snow.png');
    new THREE.TextureLoader().load('textures/crate.gif');
    new HDRLoader().load('textures/memorial.hdr');
    new LUT3dlLoader().load('luts/Bourbon 64.CUBE');
    new LUTImageLoader().load('luts/NeutralLUT.png');
    new THREE.CubeTextureLoader().setPath('textures/cube/pisa/').load([ 'px' + '.jpg' ]);
    new GLTFLoader().setPath('models/gltf/DamagedHelmet/glTF/').load('DamagedHelmet.gltf');
    new KTX2Loader().load('textures/ktx2/local.ktx2');
    new DRACOLoader().load('models/draco/bunny.drc');
    new VRMLLoader().load('models/vrml/house.wrl');
    new GLTFLoader().load('models/gltf/compressed.glb');
    new KTX2Loader().load('https://cdn.invalid/textures/ignored.remote.ktx2');
  `;
  const options = { source: temporary, moduleSource };
  const first = await discoverAssets(options);
  const second = await discoverAssets(options);
  assert.deepEqual(first, second, 'discovery must be deterministic');
  assert.deepEqual(first.map(item => item.url), [...first.map(item => item.url)].sort((a, b) => a.localeCompare(b)),
    'pins must have stable URL ordering');
  assert.equal(new Set(first.map(item => item.output)).size, first.length,
    'generated output names must be unique');
  assert.ok(first.every(item => /^[a-f0-9]{64}$/.test(item.sha256)));
  assert.equal(first.find(item => item.url === 'textures/sprites/snow.png').rawRgba, true);
  assert.equal(first.find(item => item.url === 'textures/cube/pisa/px.jpg').rawRgba, true);
  assert.equal(first.find(item => item.url === 'textures/crate.gif').convertToPng, true);
  assert.equal(first.find(item => item.url === 'textures/memorial.hdr').hdrRgba, true);
  assert.ok(first.some(item => item.url === 'luts/Bourbon 64.CUBE'), 'LUT discovery');
  assert.equal(first.find(item => item.url === 'luts/NeutralLUT.png').rawRgba, true);
  assert.equal(first.find(item => item.url === 'textures/ktx2/local.ktx2').prepareKtx2, true);
  assert.equal(first.find(item => item.url === 'models/draco/bunny.drc').prepareDraco, true);
  assert.equal(first.find(item => item.url === 'models/vrml/house.wrl').prepareVrml, true);
  assert.equal(first.find(item => item.url === 'models/gltf/compressed.glb').predecodeGlb, true);
  assert.ok(first.some(item => item.url.endsWith('/DamagedHelmet.bin')), 'glTF buffer dependency');
  assert.ok(first.some(item => item.url.endsWith('/Default_albedo.jpg')), 'glTF image dependency');
  assert.deepEqual(first.find(item => item.url.endsWith('/DamagedHelmet.bin')).aliases,
    ['models/gltf/DamagedHelmet/glTF/./DamagedHelmet.bin'],
    'GLTFLoader setPath dependencies retain their unnormalized /./ alias');
  assert.ok(!first.some(item => item.url.includes('ignored.remote')), 'remote URLs are never resolved');

  const explicit = { url: 'textures/crate.gif', output: 'manual.gif', mime: 'image/gif', sha256: 'manual' };
  const merged = await discoverAssets({ ...options, explicit: [explicit] });
  assert.deepEqual(merged.find(item => item.url === explicit.url), explicit,
    'manual pins take precedence over discovery');

  await verifyDiscoveredAssets(temporary, first);
  const tampered = path.join(examples, 'textures/sprites/snow.png');
  await writeFile(tampered, 'sprite-v2');
  await assert.rejects(verifyDiscoveredAssets(temporary, first), /differs from its discovered sha256 pin/);
  await writeFile(tampered, files.get('textures/sprites/snow.png'));
  assert.deepEqual(await readFile(tampered), files.get('textures/sprites/snow.png'));
  console.log(JSON.stringify({ ok: true, deterministic: true, pinsVerified: true, assets: first.length }));
} finally {
  await rm(temporary, { recursive: true, force: true });
}
