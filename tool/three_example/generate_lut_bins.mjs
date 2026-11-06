#!/usr/bin/env node
// Offline prebuilt LUT bins for webgl_postprocessing_3dlut ("3d luts долго
// грузит"). QuickJS parses five 885KB .CUBE files + one 450KB .3dl with a
// per-line regex walk (~262k exec calls per file) AFTER a 13MB inlined
// widget.js eval — measured multi-second stalls before/after first frame.
// This generator runs the pinned r186 loader algorithms (LUTCubeLoader /
// LUT3dlLoader parse semantics, LUTImageLoader horizontal-strip reorder)
// offline in node and serializes each LUT to a 'J3LT' binary:
//
//   u32 magic 0x544C334A ('J3LT' LE), u32 version=1, u32 size,
//   f32 domainMin*3, f32 domainMax*3, u8[size*size*size*4] RGBA texels
//
// degrades/lut_prebuilt.mjs overrides the three loaders to fetch these bins
// through the runtime host asset lane and build the Data3DTexture from a
// zero-copy Uint8Array view (UnsignedByteType, the loaders' default).
//
// Inputs: the prepared widget dir (sha-pinned .CUBE/.3dl text + rawRgba
// strip blobs) plus the upstream source tree (PNG strip dimensions via
// IHDR — no pixel decode needed).
//
// Usage: node tool/three_example/generate_lut_bins.mjs \
//          --widget-dir example/widgets/three-postprocessing-3dlut \
//          --source /tmp/jsr-three-r186 [--out <dir>]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--widget-dir') options.widgetDir = argv[++i];
    else if (argv[i] === '--source') options.source = argv[++i];
    else if (argv[i] === '--out') options.out = argv[++i];
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  if (!options.widgetDir || !options.source) {
    throw new Error('--widget-dir and --source are required');
  }
  return options;
}

const options = parseArgs(process.argv.slice(2));
const ROOT = path.resolve(import.meta.dirname, '../..');
const widgetDir = path.isAbsolute(options.widgetDir) ?
  options.widgetDir : path.join(ROOT, options.widgetDir);
const source = options.source;
const outDir = options.out ? path.resolve(options.out) : widgetDir;
mkdirSync(outDir, { recursive: true });

const manifest = JSON.parse(readFileSync(path.join(widgetDir, 'prepare_manifest.json'), 'utf8'));
const discovery = manifest.assetDiscovery;
const byUrl = new Map(discovery.map(entry => [entry.url, entry]));
const readWidget = name => readFileSync(path.join(widgetDir, name));

function pngDimensions(bytes) {
  if (bytes.length < 26 || !bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    throw new Error('not a PNG');
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), colorType: bytes[25] };
}

// LUTCubeLoader.parse (UnsignedByteType path): sequential texel writes with
// alpha 255, values scaled by 255.
function parseCube(text) {
  const title = /TITLE +"([^"]*)"/.exec(text);
  const sizeMatch = /LUT_3D_SIZE +(\d+)/.exec(text);
  if (!sizeMatch) throw new Error('CUBE missing LUT_3D_SIZE');
  const size = Number(sizeMatch[1]);
  const domainMin = [0, 0, 0];
  const domainMax = [1, 1, 1];
  const minMatch = /DOMAIN_MIN +([\d.]+) +([\d.]+) +([\d.]+)/.exec(text);
  const maxMatch = /DOMAIN_MAX +([\d.]+) +([\d.]+) +([\d.]+)/.exec(text);
  if (minMatch) domainMin.splice(0, 3, ...minMatch.slice(1).map(Number));
  if (maxMatch) domainMax.splice(0, 3, ...maxMatch.slice(1).map(Number));
  if (domainMin.some((v, i) => v > domainMax[i])) throw new Error('CUBE invalid domain');
  const data = new Uint8Array(size ** 3 * 4);
  const points = /^([\d.e+-]+) +([\d.e+-]+) +([\d.e+-]+) *$/gm;
  let i = 0;
  let result;
  while ((result = points.exec(text)) !== null) {
    // Plain Uint8Array assignment (no rounding) — byte-parity with the
    // official loader's `data[i++] = value * scale` truncation semantics.
    data[i++] = Number(result[1]) * 255;
    data[i++] = Number(result[2]) * 255;
    data[i++] = Number(result[3]) * 255;
    data[i++] = 255;
  }
  if (i !== data.length) throw new Error(`CUBE data short: ${i}/${data.length}`);
  return { size, domainMin, domainMax, data, title: title ? title[1] : null };
}

// LUT3dlLoader.parse (UnsignedByteType path): grid header line, then rows
// placed at (bLayer*sizeSq + gLayer*size + rLayer), scaled by maxBitValue.
function parse3dl(text) {
  const gridMatch = /^[\d ]+$/m.exec(text);
  if (!gridMatch) throw new Error('3DL missing grid information');
  const gridLines = gridMatch[0].trim().split(/\s+/g).map(Number);
  const gridStep = gridLines[1] - gridLines[0];
  const size = gridLines.length;
  const sizeSq = size ** 2;
  for (let i = 1; i < gridLines.length; ++i) {
    if (gridStep !== gridLines[i] - gridLines[i - 1]) throw new Error('3DL inconsistent grid');
  }
  const dataFloat = new Float32Array(size ** 3 * 4);
  const points = /^([\d.e+-]+) +([\d.e+-]+) +([\d.e+-]+) *$/gm;
  let maxValue = 0;
  let index = 0;
  let result;
  while ((result = points.exec(text)) !== null) {
    const r = Number(result[1]);
    const g = Number(result[2]);
    const b = Number(result[3]);
    maxValue = Math.max(maxValue, r, g, b);
    const bLayer = index % size;
    const gLayer = Math.floor(index / size) % size;
    const rLayer = Math.floor(index / sizeSq) % size;
    const d4 = (bLayer * sizeSq + gLayer * size + rLayer) * 4;
    dataFloat[d4 + 0] = r;
    dataFloat[d4 + 1] = g;
    dataFloat[d4 + 2] = b;
    ++index;
  }
  if (index !== size ** 3) throw new Error(`3DL data short: ${index}/${size ** 3}`);
  const bits = Math.ceil(Math.log2(maxValue));
  const maxBitValue = 2 ** bits;
  const data = new Uint8Array(dataFloat.length);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = dataFloat[i] / maxBitValue * 255;
    data[i + 1] = dataFloat[i + 1] / maxBitValue * 255;
    data[i + 2] = dataFloat[i + 2] / maxBitValue * 255;
    data[i + 3] = 255;
  }
  return { size, domainMin: [0, 0, 0], domainMax: [1, 1, 1], data, title: null };
}

// LUTImageLoader: strip pixels already decoded to RGBA by prepare (rawRgba
// pin). Vertical strips (width < height) are row-major texels already;
// horizontal strips (LUTImageLoader._horz2Vert) are 32 side-by-side 32×32
// slice squares: src pixel (row, slice*size + col) → texel slice*size+row
// row of the vertical strip.
function stripToCube(pixels, width, height) {
  const size = Math.min(width, height);
  if (size ** 3 !== pixels.length / 4) throw new Error(`strip pixels ${pixels.length / 4} != size³ ${size ** 3}`);
  if (width < height) return { size, data: new Uint8Array(pixels) };
  const data = new Uint8Array(pixels.length);
  for (let slice = 0; slice < size; slice++) {
    for (let row = 0; row < size; row++) {
      const srcRow = row * width * 4 + slice * size * 4;
      const dstRow = (slice * size + row) * size * 4;
      for (let col = 0; col < size; col++) {
        const s = srcRow + col * 4;
        const d = dstRow + col * 4;
        data[d] = pixels[s];
        data[d + 1] = pixels[s + 1];
        data[d + 2] = pixels[s + 2];
        data[d + 3] = pixels[s + 3];
      }
    }
  }
  return { size, data };
}

function writeBin(name, parsed) {
  const domainMin = parsed.domainMin || [0, 0, 0];
  const domainMax = parsed.domainMax || [1, 1, 1];
  const header = Buffer.alloc(4 + 4 + 4 + 12 + 12);
  header.writeUInt32LE(0x544c334a, 0); // 'J3LT'
  header.writeUInt32LE(1, 4);
  header.writeUInt32LE(parsed.size, 8);
  for (let i = 0; i < 3; i++) header.writeFloatLE(domainMin[i], 12 + i * 4);
  for (let i = 0; i < 3; i++) header.writeFloatLE(domainMax[i], 24 + i * 4);
  const bin = Buffer.concat([header, Buffer.from(parsed.data.buffer, parsed.data.byteOffset, parsed.data.length)]);
  const file = path.join(outDir, name);
  writeFileSync(file, bin);
  const sha256 = createHash('sha256').update(bin).digest('hex');
  console.log(JSON.stringify({
    name,
    bytes: bin.length,
    size: parsed.size,
    title: parsed.title ?? undefined,
    sha256
  }));
}

for (const entry of discovery) {
  if (!entry.url.startsWith('luts/')) continue;
  if (entry.url.endsWith('.CUBE')) {
    writeBin(`${entry.output}.jsrlut`, parseCube(readWidget(entry.output).toString('utf8')));
  } else if (entry.url.endsWith('.3dl')) {
    writeBin(`${entry.output}.jsrlut`, parse3dl(readWidget(entry.output).toString('utf8')));
  } else if (entry.url.endsWith('.png')) {
    const upstream = readFileSync(path.join(source, 'examples', entry.url));
    const dims = pngDimensions(upstream);
    const pixels = readWidget(entry.output);
    writeBin(`${entry.output}.jsrlut`, stripToCube(pixels, dims.width, dims.height));
  }
}
