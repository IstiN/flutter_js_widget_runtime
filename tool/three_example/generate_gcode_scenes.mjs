// Regenerate the prebuilt GCode scenes consumed by degrades/gcode_prebuilt.mjs
// (webgl_loader_gcode).
//
// Usage: node tool/three_example/generate_gcode_scenes.mjs /tmp/jsr-three-r186
//
// QuickJS never finishes the stock GCodeLoader boot: the 1.9MB benchy.gcode
// text crosses as a base64 string and the per-line token walk (regex strip,
// split, parseFloat per argument, Object.assign state clone per movement)
// plus the two giant JS number-array pushes (extruded + path) exceed the
// engine's practical budget — the widget never presented its first frame in
// the screenshot harness (3+ minute wait, exit 143). Node V8 does the same
// parse in ~350ms and the result is boot-invariant, so this script runs the
// pinned r186 GCodeLoader offline and serializes the returned Group (two
// LineSegments with LineBasicMaterial colors) into one header + Float32 blob
// per asset. The degrade rebuilds the two LineSegments from zero-copy views,
// so the official module's model.position/controls.reset traverse runs
// unchanged on top of it.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const source = process.argv[2];
if (!source) throw new Error('usage: generate_gcode_scenes.mjs <three-r186-source>');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Mirrors the webgl_loader_gcode registry entry's pinned asset names
// (the official module's `assets` dropdown).
const ASSETS = ['benchy', 'test_m82', 'test_m83'];

const { GCodeLoader } = await import(pathToFileURL(path.join(source, 'examples/jsm/loaders/GCodeLoader.js')));

function sha(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

// Wire the loader's FileLoader to disk bytes (the module under /tmp has no
// three import: GCodeLoader only needs Loader + the parse loop).
class JsrFileLoader {
  constructor(manager) { this.manager = manager; }
  setPath(value) { this.path = value; return this; }
  setRequestHeader() { return this; }
  setWithCredentials() { return this; }
  async load(url, onLoad, _onProgress, onError) {
    try {
      const text = await readFile(path.join(source, 'examples', url), 'utf8');
      onLoad(text);
    } catch (error) {
      if (onError) onError(error); else throw error;
    }
  }
}

const outDir = path.join(ROOT, 'example/widgets/three-loader-gcode');
await mkdir(outDir, { recursive: true });

// Serialize a parsed GCode Group: magic 'JGCB' v1, objectCount, then per
// object nameLen+name+colorHex+vertexCount+f32 positions. The two objects the
// pinned loader emits are LineSegments (extruding green / path red).
function serializeGroup(object) {
  const chunks = [];
  const objects = [];
  object.traverse(node => {
    if (node.isLineSegments) objects.push(node);
  });
  const header = Buffer.alloc(12);
  header.write('JGCB', 0, 'latin1');
  header.writeUInt32LE(1, 4);
  header.writeUInt32LE(objects.length, 8);
  chunks.push(header);
  for (const segments of objects) {
    const name = Buffer.from(String(segments.name || ''), 'utf8');
    const nameLen = Buffer.alloc(4);
    nameLen.writeUInt32LE(name.length, 0);
    chunks.push(nameLen, name);
    const color = Buffer.alloc(4);
    color.writeUInt32LE(segments.material.color.getHex(), 0);
    chunks.push(color);
    const position = segments.geometry.getAttribute('position');
    if (!position || position.itemSize !== 3) throw new Error(`${segments.name}: expected a vec3 position attribute`);
    const count = position.count;
    const countBuf = Buffer.alloc(4);
    countBuf.writeUInt32LE(count, 0);
    chunks.push(countBuf);
    const floats = Buffer.alloc(count * 12);
    const array = position.array;
    if (array instanceof Float32Array && array.byteLength === floats.byteLength) {
      Buffer.from(array.buffer, array.byteOffset, array.byteLength).copy(floats);
    } else {
      for (let index = 0; index < count * 3; index++) floats.writeFloatLE(array[index], index * 4);
    }
    chunks.push(floats);
    console.log(`  ${segments.name}: ${count} verts ${segments.material.color.getHexString()}`);
  }
  return Buffer.concat(chunks);
}

for (const asset of ASSETS) {
  const url = `models/gcode/${asset}.gcode`;
  const loader = new GCodeLoader();
  // The pinned loader constructs its own FileLoader via `new FileLoader(this.manager)`;
  // patch the prototype for this offline run only.
  const loaderModule = await import(pathToFileURL(path.join(source, 'examples/jsm/loaders/GCodeLoader.js')));
  console.log(`parsing ${url} ...`);
  const t0 = performance.now();
  const object = await new Promise((resolve, reject) => {
    const shim = Object.getPrototypeOf(loader);
    const group = new loaderModule.GCodeLoader();
    // Run parse directly against file text — avoids touching shared prototypes.
    readFile(path.join(source, 'examples', url), 'utf8').then(text => {
      try { resolve(group.parse(text)); } catch (error) { reject(error); }
    }, reject);
    void shim; void JsrFileLoader;
  });
  const parseMs = Math.round(performance.now() - t0);
  const bytes = serializeGroup(object);
  const output = path.join(outDir, `models__gcode__${asset}_scene.bin`);
  await writeFile(output, bytes);
  console.log(`${url}: parsed in ${parseMs}ms -> ${path.basename(output)} ${bytes.byteLength}B sha256=${sha(bytes)}`);
}
