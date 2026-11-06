import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { deflateSync } from 'node:zlib';
import { JsrDOMParser } from './vendor/xml_dom.js';

const require = createRequire(import.meta.url);
const moduleCache = new Map();
const MAX_TEXTURE_PIXELS = 16 * 1024 * 1024;
const preparedKtx2Magic = Buffer.from('JSRKTEX2\0', 'latin1');

function padded(value) { return (value + 3) & ~3; }

function typedArray(componentType) {
  switch (componentType) {
    case 5120: return Int8Array;
    case 5121: return Uint8Array;
    case 5122: return Int16Array;
    case 5123: return Uint16Array;
    case 5125: return Uint32Array;
    case 5126: return Float32Array;
    default: throw new Error(`Unsupported glTF accessor componentType ${componentType}`);
  }
}

function dracoType(draco, Type) {
  if (Type === Float32Array) return draco.DT_FLOAT32;
  if (Type === Int8Array) return draco.DT_INT8;
  if (Type === Int16Array) return draco.DT_INT16;
  if (Type === Int32Array) return draco.DT_INT32;
  if (Type === Uint8Array) return draco.DT_UINT8;
  if (Type === Uint16Array) return draco.DT_UINT16;
  if (Type === Uint32Array) return draco.DT_UINT32;
  throw new Error('Unsupported Draco output array type');
}

function loadCommonJs(filename, source) {
  const module = { exports: {} };
  const context = {
    module, exports: module.exports, console, require, process, Buffer,
    __filename: filename, __dirname: path.dirname(filename),
    TextDecoder, TextEncoder, setTimeout, clearTimeout,
    ArrayBuffer, Uint8Array, Int8Array, Uint16Array, Int16Array,
    Uint32Array, Int32Array, Float32Array, Float64Array, Promise, Math, Date
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename });
  return module.exports;
}

async function dracoModule(source) {
  const filename = path.join(source, 'examples/jsm/libs/draco/gltf/draco_decoder.js');
  if (!moduleCache.has(filename)) {
    const factory = loadCommonJs(filename, await readFile(filename, 'utf8'));
    moduleCache.set(filename, await factory({}));
  }
  return moduleCache.get(filename);
}

async function basisModule(source) {
  const filename = path.join(source, 'examples/jsm/libs/basis/basis_transcoder.js');
  if (!moduleCache.has(filename)) {
    const factory = loadCommonJs(filename, await readFile(filename, 'utf8'));
    const wasmBinary = await readFile(path.join(source, 'examples/jsm/libs/basis/basis_transcoder.wasm'));
    const module = await factory({ wasmBinary });
    module.initializeBasis();
    moduleCache.set(filename, module);
  }
  return moduleCache.get(filename);
}

async function meshoptModule(source) {
  const filename = path.join(source, 'examples/jsm/libs/meshopt_decoder.module.js');
  if (!moduleCache.has(filename)) {
    const module = await import(pathToFileURL(filename));
    const decoder = module.MeshoptDecoder;
    await decoder.ready;
    moduleCache.set(filename, decoder);
  }
  return moduleCache.get(filename);
}

async function ktxParseModule(source) {
  const filename = path.join(source, 'examples/jsm/libs/ktx-parse.module.js');
  if (!moduleCache.has(filename)) moduleCache.set(filename, await import(pathToFileURL(filename)));
  return moduleCache.get(filename);
}

function decodeDracoIndex(draco, decoder, mesh) {
  const count = mesh.num_faces() * 3;
  const bytes = count * 4;
  const pointer = draco._malloc(bytes);
  try {
    decoder.GetTrianglesUInt32Array(mesh, bytes, pointer);
    return new Uint32Array(draco.HEAPF32.buffer, pointer, count).slice();
  } finally {
    draco._free(pointer);
  }
}

function decodeDracoAttribute(draco, decoder, geometry, attribute, Type) {
  if (!attribute || attribute.ptr === 0) throw new Error('Draco attribute is missing');
  const count = geometry.num_points();
  const components = attribute.num_components();
  const length = count * components;
  const bytes = length * Type.BYTES_PER_ELEMENT;
  const pointer = draco._malloc(bytes);
  try {
    decoder.GetAttributeDataArrayForAllPoints(geometry, attribute, dracoType(draco, Type), bytes, pointer);
    return {
      array: new Type(draco.HEAPF32.buffer, pointer, length).slice(),
      count, components
    };
  } finally {
    draco._free(pointer);
  }
}

function decodeDracoMesh(draco, bytes) {
  const decoder = new draco.Decoder();
  let geometry;
  try {
    const input = new Int8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const kind = decoder.GetEncodedGeometryType(input);
    let status;
    if (kind === draco.TRIANGULAR_MESH) {
      geometry = new draco.Mesh();
      status = decoder.DecodeArrayToMesh(input, input.byteLength, geometry);
    } else if (kind === draco.POINT_CLOUD) {
      geometry = new draco.PointCloud();
      status = decoder.DecodeArrayToPointCloud(input, input.byteLength, geometry);
    } else {
      throw new Error('Unexpected Draco geometry type');
    }
    if (!status.ok() || geometry.ptr === 0) throw new Error(`Draco decoding failed: ${status.error_msg()}`);
    return { decoder, geometry, mesh: kind === draco.TRIANGULAR_MESH };
  } catch (error) {
    if (geometry) draco.destroy(geometry);
    draco.destroy(decoder);
    throw error;
  }
}

export async function decodeDracoAsset(source, bytes) {
  const draco = await dracoModule(source);
  const decoded = decodeDracoMesh(draco, bytes);
  const { decoder, geometry, mesh } = decoded;
  try {
    const header = { attributes: {}, index: null };
    const parts = [];
    let offset = 0;
    const append = (array, itemSize) => {
      const alignment = padded(offset) - offset;
      if (alignment) {
        parts.push(Buffer.alloc(alignment));
        offset += alignment;
      }
      const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
      parts.push(bytes);
      const descriptor = { type: array.constructor.name, itemSize, offset, byteLength: bytes.length };
      offset += bytes.length;
      return descriptor;
    };
    const semantics = [
      ['position', 'POSITION', Float32Array],
      ['normal', 'NORMAL', Float32Array],
      ['color', 'COLOR', Float32Array],
      ['uv', 'TEX_COORD', Float32Array]
    ];
    for (const [name, semantic, Type] of semantics) {
      const id = decoder.GetAttributeId(geometry, draco[semantic]);
      if (id === -1) continue;
      const attribute = decodeDracoAttribute(draco, decoder, geometry,
        decoder.GetAttribute(geometry, id), Type);
      header.attributes[name] = append(attribute.array, attribute.components);
    }
    if (!header.attributes.position) throw new Error('Draco asset has no POSITION attribute');
    if (mesh) header.index = append(decodeDracoIndex(draco, decoder, geometry), 1);
    const json = Buffer.from(JSON.stringify(header));
    const prefix = Buffer.alloc(12);
    prefix.write('JSRDRC1\0', 0, 'latin1');
    prefix.writeUInt32LE(json.length, 8);
    const headerPadding = padded(json.length) - json.length;
    return Buffer.concat([prefix, json, Buffer.alloc(headerPadding), ...parts]);
  } finally {
    draco.destroy(geometry);
    draco.destroy(decoder);
  }
}

function parseGlb(bytes, url) {
  if (bytes.length < 20 || bytes.toString('latin1', 0, 4) !== 'glTF') throw new Error(`${url}: invalid GLB`);
  const jsonLength = bytes.readUInt32LE(12);
  if (bytes.readUInt32LE(16) !== 0x4e4f534a || 20 + jsonLength + 8 > bytes.length) {
    throw new Error(`${url}: invalid GLB JSON chunk`);
  }
  const document = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
  const binHeader = 20 + jsonLength;
  const binLength = bytes.readUInt32LE(binHeader);
  if (bytes.readUInt32LE(binHeader + 4) !== 0x004e4942 || binHeader + 8 + binLength > bytes.length) {
    throw new Error(`${url}: invalid GLB BIN chunk`);
  }
  return {
    document,
    binary: Buffer.from(bytes.subarray(binHeader + 8, binHeader + 8 + binLength))
  };
}

function serializeGlb(document, binary) {
  document.buffers ||= [];
  if (!document.buffers.length) document.buffers.push({});
  document.buffers[0].byteLength = binary.length;
  delete document.buffers[0].uri;
  const jsonBytes = Buffer.from(JSON.stringify(document));
  const jsonChunk = Buffer.alloc(8 + padded(jsonBytes.length), 0x20);
  jsonChunk.writeUInt32LE(padded(jsonBytes.length), 0);
  jsonChunk.writeUInt32LE(0x4e4f534a, 4);
  jsonBytes.copy(jsonChunk, 8);
  const binChunk = Buffer.alloc(8 + padded(binary.length));
  binChunk.writeUInt32LE(padded(binary.length), 0);
  binChunk.writeUInt32LE(0x004e4942, 4);
  binary.copy(binChunk, 8);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'latin1');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(header.length + jsonChunk.length + binChunk.length, 8);
  return Buffer.concat([header, jsonChunk, binChunk]);
}

function removeExtensions(document, names) {
  for (const key of ['extensionsUsed', 'extensionsRequired']) {
    if (!document[key]) continue;
    document[key] = document[key].filter(name => !names.includes(name));
    if (!document[key].length) delete document[key];
  }
}

function halfToFloat(value) {
  const sign = value & 0x8000 ? -1 : 1;
  const exponent = (value >> 10) & 0x1f;
  const fraction = value & 0x3ff;
  if (exponent === 0) return sign * Math.pow(2, -14) * (fraction / 1024);
  if (exponent === 31) return fraction ? 0 : sign;
  return sign * Math.pow(2, exponent - 15) * (1 + fraction / 1024);
}

function byteColor(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(255, Math.round(value * 255)));
}

function cropRgba(data, sourceWidth, sourceHeight, width, height, bytesPerPixel = 4) {
  if (sourceWidth === width && sourceHeight === height) return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  const output = Buffer.alloc(width * height * bytesPerPixel);
  for (let y = 0; y < height; y++) {
    const from = y * sourceWidth * bytesPerPixel;
    output.set(data.subarray(from, from + width * bytesPerPixel), y * width * bytesPerPixel);
  }
  return output;
}

async function transcodeBasis(source, bytes, container) {
  const Basis = await basisModule(source);
  const file = new Basis.KTX2File(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
  try {
    if (!file.isValid()) throw new Error('invalid Basis KTX2 payload');
    const hdr = file.isHDR();
    if (!hdr && !file.isUASTC() && !file.isETC1S()) throw new Error('KTX2 payload is not Basis/ETC1S/UASTC');
    const format = hdr ? 25 : 13; // RGBA_HALF / RGBA32 in the pinned Basis transcoder.
    const layers = file.getLayers() || 1;
    if (file.getFaces() !== 1) throw new Error('cube KTX2 prepare decode is not supported');
    if (!file.startTranscoding()) throw new Error('Basis startTranscoding failed');
    const width = container.pixelWidth;
    const height = container.pixelHeight;
    if (width * height * layers > MAX_TEXTURE_PIXELS) throw new Error('KTX2 texture exceeds prepare pixel quota');
    const parts = [];
    for (let layer = 0; layer < layers; layer++) {
      const info = file.getImageLevelInfo(0, layer, 0);
      const size = file.getImageTranscodedSizeInBytes(0, layer, 0, format);
      const data = new Uint8Array(size);
      if (!file.transcodeImage(data, 0, layer, 0, format, 0, -1, -1)) {
        throw new Error(`Basis transcodeImage failed for layer ${layer}`);
      }
      const sourceWidth = info.width;
      const sourceHeight = info.height;
      const bpp = hdr ? 8 : 4;
      const cropped = cropRgba(data, sourceWidth, sourceHeight, width, height, bpp);
      if (!hdr) {
        parts.push(cropped);
      } else {
        const rgba = Buffer.alloc(width * height * 4);
        for (let index = 0; index < width * height; index++) {
          for (let channel = 0; channel < 4; channel++) {
            rgba[index * 4 + channel] = byteColor(halfToFloat(cropped.readUInt16LE(index * 8 + channel * 2)));
          }
        }
        parts.push(rgba);
      }
    }
    return { width, height, depth: layers, rgba: Buffer.concat(parts) };
  } finally {
    file.close();
    file.delete();
  }
}

function decodePackedFloat(word, kind) {
  if (kind === 123) { // RGB9E5: 9-bit mantissas and a shared 5-bit exponent.
    const exponent = word >>> 27;
    return [word & 511, (word >>> 9) & 511, (word >>> 18) & 511]
      .map(value => value * Math.pow(2, exponent - 24));
  }
  // B10G11R11: unsigned 5-bit exponent and 6/5-bit mantissas.
  const decode = (value, mantissaBits) => {
    const exponent = value >>> mantissaBits;
    const mantissa = value & ((1 << mantissaBits) - 1);
    if (exponent === 0) return mantissa * Math.pow(2, -14 - mantissaBits);
    return (1 + mantissa / (1 << mantissaBits)) * Math.pow(2, exponent - 15);
  };
  return [decode(word & 2047, 6), decode((word >>> 11) & 2047, 6), decode((word >>> 22) & 1023, 5)];
}

function decodeRawKtx2(container) {
  const width = container.pixelWidth;
  const height = container.pixelHeight;
  const layers = Math.max(1, container.layerCount || 0);
  if (container.faceCount !== 1 || container.pixelDepth || layers !== 1) {
    throw new Error('raw KTX2 arrays/cubes require Basis transcoding');
  }
  if (container.supercompressionScheme !== 0) throw new Error('raw KTX2 supercompression is unsupported');
  if (width * height > MAX_TEXTURE_PIXELS) throw new Error('KTX2 texture exceeds prepare pixel quota');
  const data = container.levels[0]?.levelData;
  if (!data) throw new Error('KTX2 has no base image level');
  const pixels = width * height;
  const output = Buffer.alloc(pixels * 4);
  const format = container.vkFormat;
  if (format === 37 || format === 43) {
    if (data.byteLength < output.length) throw new Error('truncated RGBA8 KTX2');
    return { width, height, depth: 1, rgba: Buffer.from(data.buffer, data.byteOffset, output.length) };
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  for (let index = 0; index < pixels; index++) {
    let color;
    if (format === 91) {
      color = [0, 1, 2, 3].map(channel => view.getUint16(index * 8 + channel * 2, true) / 65535);
    } else if (format === 97) {
      color = [0, 1, 2, 3].map(channel => halfToFloat(view.getUint16(index * 8 + channel * 2, true)));
    } else if (format === 109) {
      color = [0, 1, 2, 3].map(channel => view.getFloat32(index * 16 + channel * 4, true));
    } else if (format === 122 || format === 123) {
      color = decodePackedFloat(view.getUint32(index * 4, true), format);
      color.push(1);
    } else {
      throw new Error(`unsupported raw KTX2 vkFormat ${format}`);
    }
    for (let channel = 0; channel < 4; channel++) output[index * 4 + channel] = byteColor(color[channel]);
  }
  return { width, height, depth: 1, rgba: output };
}

async function decodeKtx2(source, bytes) {
  const { read } = await ktxParseModule(source);
  const container = read(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
  let decoded;
  if (container.vkFormat === 0 || container.vkFormat === 1000066000) {
    decoded = await transcodeBasis(source, bytes, container);
  } else {
    decoded = decodeRawKtx2(container);
  }
  const transfer = container.dataFormatDescriptor?.[0]?.transferFunction;
  return { ...decoded, colorSpace: transfer === 2 ? 'srgb' : 'linear' };
}

function encodePreparedKtx2(decoded) {
  const header = Buffer.from(JSON.stringify({
    width: decoded.width || 0,
    height: decoded.height || 0,
    depth: decoded.depth || 1,
    cube: decoded.cube === true,
    colorSpace: decoded.colorSpace || 'linear',
    error: decoded.error || null
  }));
  const prefix = Buffer.alloc(preparedKtx2Magic.length + 4);
  preparedKtx2Magic.copy(prefix);
  prefix.writeUInt32LE(header.length, preparedKtx2Magic.length);
  return Buffer.concat([prefix, header, decoded.rgba || Buffer.alloc(0)]);
}

export async function decodeKtx2Asset(source, bytes, url, allowUnsupported = true) {
  try {
    return encodePreparedKtx2(await decodeKtx2(source, bytes));
  } catch (error) {
    if (!allowUnsupported) throw new Error(`${url}: ${error.message}`);
    const message = `${url}: prepare-time KTX2 decode unavailable: ${error.message}`;
    console.warn(`three: ${message}`);
    return encodePreparedKtx2({ error: message });
  }
}

// --- prepare-time DDS decode (webgl_loader_texture_dds) ---------------------
// R1 has no BCn upload lane, so the stock DDSLoader path keeps compressed
// textures unbound (white meshes). Decode DXT1/DXT3/DXT5 + uncompressed
// A8R8G8B8/R8G8B8 blocks to RGBA at prepare time and ship the base mip inside
// the same JSRKTEX2 container the KTX2 lane uses. Mip chains are collapsed to
// the base level (the shim forces LinearFilter). BC6H/BC7/BC4/BC5 (DX10
// extension) and cube-face DDS stay unsupported and fail LOUDLY with a
// header error the shim turns into a console warning + unbound texture.
const ddsDxtColorMask = (value) => [(value >> 11) & 31, (value >> 5) & 63, value & 31];

function ddsChannel565(word) {
  const [r, g, b] = ddsDxtColorMask(word);
  return [(r * 255) / 31, (g * 255) / 63, (b * 255) / 31];
}

function ddsColorBlockToRgba(block, output, base, x0, y0, width, height) {
  const word0 = block.readUInt16LE(0);
  const word1 = block.readUInt16LE(2);
  const c0 = ddsChannel565(word0);
  const c1 = ddsChannel565(word1);
  const opaque = word0 >= word1;
  const palette = opaque
    ? [c0, c1, [0, 1, 2].map(ch => (2 * c0[ch] + c1[ch]) / 3), [0, 1, 2].map(ch => (c0[ch] + 2 * c1[ch]) / 3)]
    : [c0, c1, [0, 1, 2].map(ch => (c0[ch] + c1[ch]) / 2), null];
  for (let texel = 0; texel < 16; texel++) {
    const x = x0 + (texel & 3);
    const y = y0 + (texel >> 2);
    if (x >= width || y >= height) continue;
    const code = (block[4 + (texel >> 3)] >> ((texel & 7) * 2)) & 3;
    const target = base + (y * width + x) * 4;
    const color = palette[code];
    if (color === null) {
      output[target] = output[target + 1] = output[target + 2] = output[target + 3] = 0;
    } else {
      output[target] = color[0];
      output[target + 1] = color[1];
      output[target + 2] = color[2];
      output[target + 3] = 255;
    }
  }
}

function ddsAlpha3BlockToRgba(block, output, base, x0, y0, width, height) {
  // BC3/BC4-style interpolated alpha: two 8-bit endpoints + 16 3-bit indices.
  const a0 = block[0];
  const a1 = block[1];
  for (let texel = 0; texel < 16; texel++) {
    const x = x0 + (texel & 3);
    const y = y0 + (texel >> 2);
    if (x >= width || y >= height) continue;
    const bit = texel * 3;
    const code = ((block[2 + (bit >> 3)] | (block[3 + (bit >> 3)] << 8)) >> (bit & 7)) & 7;
    let alpha;
    if (a0 > a1) alpha = [a0, a1, (6 * a0 + a1) / 7, (5 * a0 + 2 * a1) / 7, (4 * a0 + 3 * a1) / 7, (3 * a0 + 4 * a1) / 7, (2 * a0 + 5 * a1) / 7, (a0 + 6 * a1) / 7][code];
    else alpha = [a0, a1, (4 * a0 + a1) / 5, (3 * a0 + 2 * a1) / 5, (2 * a0 + 3 * a1) / 5, (a0 + 4 * a1) / 5, 0, 255][code];
    const target = base + (y * width + x) * 4;
    output[target + 3] = alpha;
  }
}

function ddsAlpha4BlockToRgba(block, output, base, x0, y0, width, height) {
  // BC2 explicit alpha: 16 packed 4-bit values.
  for (let texel = 0; texel < 16; texel++) {
    const x = x0 + (texel & 3);
    const y = y0 + (texel >> 2);
    if (x >= width || y >= height) continue;
    const target = base + (y * width + x) * 4;
    output[target + 3] = (block[texel >> 1] >> ((texel & 1) * 4)) & 15;
  }
}

function ddsMipLevelSize(mode, width, height) {
  if (mode === 'rgba8') return width * height * 4;
  if (mode === 'rgb8') return width * height * 3;
  return Math.ceil(width / 4) * Math.ceil(height / 4) * (mode === 'bc1' ? 8 : 16);
}

function ddsMipChainBytes(mode, width, height) {
  let total = 0;
  for (let w = width, h = height; w > 1 || h > 1; w = Math.max(1, w >> 1), h = Math.max(1, h >> 1)) total += ddsMipLevelSize(mode, w, h);
  total += ddsMipLevelSize(mode, 1, 1);
  return total;
}

function decodeDdsBaseMip(buf, dataOffset, mode, width, height) {
  const pixels = width * height;
  const rgba = Buffer.alloc(pixels * 4);
  if (mode === 'rgba8') {
    const rMask = buf.readUInt32LE(92), gMask = buf.readUInt32LE(96), bMask = buf.readUInt32LE(100), aMask = buf.readUInt32LE(104);
    // Bit shift = TRAILING zero count (lowest set bit of the mask), not the
    // highest set bit — masks like 0x00ff0000 span bits 16..23.
    const shift = mask => mask ? 31 - Math.clz32(mask & -mask) : 0;
    const bits = mask => mask ? 32 - Math.clz32(mask) - shift(mask) : 0;
    for (let index = 0; index < pixels; index++) {
      const word = buf.readUInt32LE(dataOffset + index * 4);
      const channel = (mask, channelBits, target) => {
        if (!mask) return;
        rgba[index * 4 + target] = Math.round(((word >> shift(mask)) & ((1 << channelBits) - 1)) * 255 / ((1 << channelBits) - 1));
      };
      channel(rMask, bits(rMask), 0);
      channel(gMask, bits(gMask), 1);
      channel(bMask, bits(bMask), 2);
      channel(aMask, bits(aMask), 3);
      if (!aMask) rgba[index * 4 + 3] = 255;
    }
  } else if (mode === 'rgb8') {
    for (let index = 0; index < pixels; index++) {
      const base = dataOffset + index * 3;
      rgba[index * 4] = buf[base + 2];
      rgba[index * 4 + 1] = buf[base + 1];
      rgba[index * 4 + 2] = buf[base];
      rgba[index * 4 + 3] = 255;
    }
  } else {
    const blockRows = Math.ceil(height / 4);
    const blockCols = Math.ceil(width / 4);
    if (buf.length < dataOffset + blockRows * blockCols * (mode === 'bc1' ? 8 : 16)) throw new Error('truncated DDS base mip');
    for (let blockY = 0; blockY < blockRows; blockY++) {
      for (let blockX = 0; blockX < blockCols; blockX++) {
        const blockBytes = mode === 'bc1' ? 8 : 16;
        const blockBase = dataOffset + (blockY * blockCols + blockX) * blockBytes;
        const block = buf.subarray(blockBase, blockBase + blockBytes);
        const x0 = blockX * 4;
        const y0 = blockY * 4;
        if (mode === 'bc1') ddsColorBlockToRgba(block, rgba, 0, x0, y0, width, height);
        else {
          if (mode === 'bc2') ddsAlpha4BlockToRgba(block.subarray(0, 8), rgba, 0, x0, y0, width, height);
          else ddsAlpha3BlockToRgba(block.subarray(0, 8), rgba, 0, x0, y0, width, height);
          ddsColorBlockToRgba(block.subarray(8), rgba, 0, x0, y0, width, height);
        }
      }
    }
  }
  // DDS rows are top-down; the JSRKTEX2/DataTexture lane is GL bottom-up
  // (KTX2 level data), so flip vertically to match the proven lane.
  const row = width * 4;
  const flipped = Buffer.alloc(pixels * 4);
  for (let y = 0; y < height; y++) {
    rgba.copy(flipped, (height - 1 - y) * row, y * row, (y + 1) * row);
  }
  return flipped;
}

function decodeDds(bytes, url) {
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (buf.length < 128 || buf.toString('latin1', 0, 4) !== 'DDS ') throw new Error('missing DDS magic');
  const width = buf.readUInt32LE(16);
  const height = buf.readUInt32LE(12);
  if (!width || !height) throw new Error('zero DDS dimensions');
  const caps2 = buf.readUInt32LE(112);
  let faceCount = 1;
  if (caps2 & 0x200) {
    if ((caps2 & 0xfc00) !== 0xfc00) throw new Error('cube-face DDS with missing faces is unsupported');
    faceCount = 6;
  }
  const fourCC = buf.toString('latin1', 84, 88).replace(/\0/g, ' ').trim();
  let dataOffset = 128;
  let mode = '';
  if (fourCC === 'DX10') {
    if (buf.readUInt32LE(136) & 0x4) {
      if (!(caps2 & 0x200) || (caps2 & 0xfc00) !== 0xfc00) throw new Error('cube-face DX10 DDS with missing faces is unsupported');
      faceCount = 6;
    }
    const dxgiFormat = buf.readUInt32LE(128);
    if (dxgiFormat === 71 || dxgiFormat === 74 || dxgiFormat === 77) {
      mode = ['bc1', 'bc2', 'bc3'][[71, 74, 77].indexOf(dxgiFormat)];
    } else if (dxgiFormat === 28) {
      mode = 'rgba8';
    } else {
      throw new Error(`DX10 extension format ${dxgiFormat} unsupported (BC6H/BC7/BC4/BC5 need an HDR/BCn prepare lane)`);
    }
    dataOffset = 148;
  } else if (fourCC === 'DXT1') {
    mode = 'bc1';
  } else if (fourCC === 'DXT2' || fourCC === 'DXT3') {
    mode = 'bc2';
  } else if (fourCC === 'DXT4' || fourCC === 'DXT5') {
    mode = 'bc3';
  } else if (!fourCC) {
    const bitCount = buf.readUInt32LE(88);
    if (bitCount === 32) mode = 'rgba8';
    else if (bitCount === 24) mode = 'rgb8';
    else throw new Error(`uncompressed DDS with ${bitCount}bpp is unsupported`);
  } else {
    throw new Error(`DDS FourCC '${fourCC}' unsupported (BC6H/BC7/BC4/BC5 need an HDR/BCn prepare lane)`);
  }
  if (width * height * faceCount > MAX_TEXTURE_PIXELS) throw new Error('DDS texture exceeds prepare pixel quota');
  const baseMip = decodeDdsBaseMip(buf, dataOffset, mode, width, height);
  const faces = [baseMip];
  const mipCount = (buf.readUInt32LE(8) & 0x200) ? Math.max(1, buf.readUInt32LE(28)) : 1;
  const faceStride = mipCount > 1 ? ddsMipChainBytes(mode, width, height) : ddsMipLevelSize(mode, width, height);
  for (let face = 1; face < faceCount; face++) {
    const offset = dataOffset + face * faceStride;
    if (buf.length < offset) throw new Error(`truncated DDS cube face ${face}`);
    faces.push(decodeDdsBaseMip(buf, offset, mode, width, height));
  }
  return { width, height, depth: 1, cube: faceCount === 6, rgba: Buffer.concat(faces), colorSpace: 'srgb' };
}

export async function decodeDdsAsset(source, bytes, url, allowUnsupported = true) {
  try {
    return encodePreparedKtx2(decodeDds(bytes, url));
  } catch (error) {
    if (!allowUnsupported) throw new Error(`${url}: ${error.message}`);
    const message = `${url}: prepare-time DDS decode unavailable: ${error.message}`;
    console.warn(`three: ${message}`);
    return encodePreparedKtx2({ error: message });
  }
}

let crcTable;
function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let value = n;
      for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      crcTable[n] = value >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type, 'latin1');
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32LE(data.length, 0);
  // PNG chunk lengths are big-endian.
  output.writeUInt32BE(data.length, 0);
  name.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([name, data])), output.length - 4);
  return output;
}

function encodePng(decoded) {
  const { width, height, rgba } = decoded;
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    scanlines[row] = 0;
    rgba.copy(scanlines, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

async function decodeMeshoptViews(source, document, binary, appendView) {
  let decoder;
  const originalLength = document.bufferViews?.length || 0;
  for (let index = 0; index < originalLength; index++) {
    const view = document.bufferViews[index];
    const extension = view.extensions?.EXT_meshopt_compression || view.extensions?.KHR_meshopt_compression;
    if (!extension) continue;
    decoder ||= await meshoptModule(source);
    if (extension.buffer !== 0) throw new Error('meshopt source buffer must be the GLB BIN buffer');
    const start = extension.byteOffset || 0;
    const sourceBytes = new Uint8Array(binary.buffer, binary.byteOffset + start, extension.byteLength);
    let result;
    if (decoder.decodeGltfBufferAsync) {
      result = await decoder.decodeGltfBufferAsync(extension.count, extension.byteStride, sourceBytes,
        extension.mode, extension.filter);
    } else {
      result = new Uint8Array(extension.count * extension.byteStride);
      decoder.decodeGltfBuffer(result, extension.count, extension.byteStride, sourceBytes,
        extension.mode, extension.filter);
    }
    const replacement = appendView(Buffer.from(result.buffer, result.byteOffset, result.byteLength), view.target);
    document.bufferViews[index] = {
      ...view,
      buffer: 0,
      byteOffset: document.bufferViews[replacement].byteOffset,
      byteLength: document.bufferViews[replacement].byteLength,
      extensions: undefined
    };
    document.bufferViews.pop();
    delete document.bufferViews[index].extensions;
  }
  removeExtensions(document, ['EXT_meshopt_compression', 'KHR_meshopt_compression']);
}

async function decodeDracoPrimitives(source, document, binary, appendView) {
  let draco;
  for (const mesh of document.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      const extension = primitive.extensions?.KHR_draco_mesh_compression;
      if (!extension) continue;
      draco ||= await dracoModule(source);
      const view = document.bufferViews?.[extension.bufferView];
      if (!view || view.buffer !== 0) throw new Error('Draco primitive has an invalid bufferView');
      const start = view.byteOffset || 0;
      const bytes = binary.subarray(start, start + view.byteLength);
      const decoded = decodeDracoMesh(draco, bytes);
      const { decoder, geometry, mesh: triangular } = decoded;
      try {
        for (const [semantic, attributeId] of Object.entries(extension.attributes || {})) {
          const accessorIndex = primitive.attributes?.[semantic];
          const accessor = document.accessors?.[accessorIndex];
          if (!accessor) throw new Error(`Draco ${semantic} has no matching accessor`);
          const Type = typedArray(accessor.componentType);
          const attribute = decodeDracoAttribute(draco, decoder, geometry,
            decoder.GetAttributeByUniqueId(geometry, attributeId), Type);
          if (attribute.components !== ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 })[accessor.type]) {
            throw new Error(`Draco ${semantic} component count changed`);
          }
          const viewIndex = appendView(Buffer.from(attribute.array.buffer, attribute.array.byteOffset,
            attribute.array.byteLength));
          accessor.bufferView = viewIndex;
          accessor.byteOffset = 0;
          accessor.count = attribute.count;
          delete accessor.sparse;
          if (semantic === 'POSITION') {
            const min = Array(attribute.components).fill(Infinity);
            const max = Array(attribute.components).fill(-Infinity);
            for (let offset = 0; offset < attribute.array.length; offset += attribute.components) {
              for (let component = 0; component < attribute.components; component++) {
                min[component] = Math.min(min[component], attribute.array[offset + component]);
                max[component] = Math.max(max[component], attribute.array[offset + component]);
              }
            }
            accessor.min = min;
            accessor.max = max;
          }
        }
        if (triangular && primitive.indices !== undefined) {
          const accessor = document.accessors[primitive.indices];
          const IndexType = typedArray(accessor.componentType);
          const decodedIndex = decodeDracoIndex(draco, decoder, geometry);
          const indices = IndexType === Uint32Array ? decodedIndex : IndexType.from(decodedIndex);
          const viewIndex = appendView(Buffer.from(indices.buffer, indices.byteOffset, indices.byteLength));
          accessor.bufferView = viewIndex;
          accessor.byteOffset = 0;
          accessor.count = indices.length;
          delete accessor.sparse;
        }
      } finally {
        draco.destroy(geometry);
        draco.destroy(decoder);
      }
      delete primitive.extensions.KHR_draco_mesh_compression;
      if (!Object.keys(primitive.extensions).length) delete primitive.extensions;
    }
  }
  removeExtensions(document, ['KHR_draco_mesh_compression']);
}

async function decodeBasisImages(source, document, appendView) {
  let decoded = false;
  for (let index = 0; index < (document.images || []).length; index++) {
    const image = document.images[index];
    const usedByBasis = (document.textures || []).some(texture => texture.extensions?.KHR_texture_basisu?.source === index);
    if (image.mimeType !== 'image/ktx2' && !usedByBasis) continue;
    if (image.bufferView === undefined) throw new Error('external KTX2 glTF images are not supported by this decoder');
    const ktx2 = appendView.read(image.bufferView);
    const texture = await decodeKtx2(source, ktx2);
    if (texture.depth !== 1) throw new Error('glTF Basis image must be a 2D texture');
    const png = encodePng(texture);
    image.bufferView = appendView(png);
    image.mimeType = 'image/png';
    delete image.uri;
    decoded = true;
  }
  for (const texture of document.textures || []) {
    const extension = texture.extensions?.KHR_texture_basisu;
    if (!extension) continue;
    texture.source = extension.source;
    delete texture.extensions.KHR_texture_basisu;
    if (!Object.keys(texture.extensions).length) delete texture.extensions;
  }
  if (decoded) removeExtensions(document, ['KHR_texture_basisu']);
}

const ACCESSOR_COMPONENTS = {
  SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4,
  MAT2: 4, MAT3: 9, MAT4: 16
};

// meshopt commonly leaves every base/morph attribute in one interleaved
// buffer. R1's CPU morph lane writes tightly packed position/normal arrays;
// retaining that layout makes one mesh's blend overwrite its siblings and UVs.
// Split only genuinely interleaved accessors, preserving their integer type,
// normalization and quantization transforms (and therefore the official mesh).
function deinterleaveAccessors(document, appendView, url) {
  for (const accessor of document.accessors || []) {
    if (accessor.bufferView === undefined || accessor.type.startsWith('MAT')) continue;
    const view = document.bufferViews[accessor.bufferView];
    const Type = typedArray(accessor.componentType);
    const components = ACCESSOR_COMPONENTS[accessor.type];
    if (!view || view.buffer !== 0 || !components) throw new Error(`${url}: invalid interleaved accessor`);
    const elementBytes = components * Type.BYTES_PER_ELEMENT;
    const stride = view.byteStride || elementBytes;
    if (stride === elementBytes) continue;
    const source = appendView.read(accessor.bufferView);
    const start = accessor.byteOffset || 0;
    if (stride < elementBytes || start < 0 ||
        (accessor.count > 0 && start + (accessor.count - 1) * stride + elementBytes > source.length)) {
      throw new Error(`${url}: truncated interleaved accessor`);
    }
    const output = Buffer.alloc(accessor.count * elementBytes);
    for (let index = 0; index < accessor.count; index++) {
      source.copy(output, index * elementBytes, start + index * stride,
        start + index * stride + elementBytes);
    }
    accessor.bufferView = appendView(output);
    accessor.byteOffset = 0;
  }
}

function readComponent(view, offset, componentType) {
  switch (componentType) {
    case 5120: return view.getInt8(offset);
    case 5121: return view.getUint8(offset);
    case 5122: return view.getInt16(offset, true);
    case 5123: return view.getUint16(offset, true);
    case 5125: return view.getUint32(offset, true);
    case 5126: return view.getFloat32(offset, true);
    default: throw new Error(`Unsupported glTF accessor componentType ${componentType}`);
  }
}

function normalizedScale(componentType) {
  switch (componentType) {
    case 5120: return 1 / 127;
    case 5121: return 1 / 255;
    case 5122: return 1 / 32767;
    case 5123: return 1 / 65535;
    case 5125: return 1 / 4294967295;
    default: return 1;
  }
}

// CPU morphing must not write blended values back into quantized integer
// storage: normalized Int8 normals can overflow and flip, while integer
// positions needlessly lose precision. Convert exactly the base/target
// position and normal accessors to tight Float32, applying glTF normalization.
function floatMorphAttributes(document, appendView, url) {
  const indices = new Set();
  for (const mesh of document.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      if (!primitive.targets?.length) continue;
      for (const semantic of ['POSITION', 'NORMAL']) {
        if (primitive.attributes?.[semantic] !== undefined) indices.add(primitive.attributes[semantic]);
        for (const target of primitive.targets) {
          if (target[semantic] !== undefined) indices.add(target[semantic]);
        }
      }
    }
  }
  for (const index of indices) {
    const accessor = document.accessors?.[index];
    if (!accessor || accessor.sparse || accessor.componentType === 5126) continue;
    const source = appendView.read(accessor.bufferView);
    const input = new DataView(source.buffer, source.byteOffset, source.byteLength);
    const Type = typedArray(accessor.componentType);
    const components = ACCESSOR_COMPONENTS[accessor.type];
    if (!components) throw new Error(`${url}: invalid morph accessor ${index}`);
    const elementBytes = components * Type.BYTES_PER_ELEMENT;
    const stride = document.bufferViews[accessor.bufferView].byteStride || elementBytes;
    const start = accessor.byteOffset || 0;
    if (start < 0 ||
        (accessor.count > 0 && start + (accessor.count - 1) * stride + elementBytes > source.length)) {
      throw new Error(`${url}: invalid morph accessor ${index}`);
    }
    const output = Buffer.alloc(accessor.count * components * 4);
    const scale = accessor.normalized ? normalizedScale(accessor.componentType) : 1;
    const signed = accessor.componentType === 5120 || accessor.componentType === 5122;
    const min = Array(components).fill(Infinity);
    const max = Array(components).fill(-Infinity);
    for (let vertex = 0; vertex < accessor.count; vertex++) {
      for (let component = 0; component < components; component++) {
        let value = readComponent(input, start + vertex * stride + component * Type.BYTES_PER_ELEMENT,
          accessor.componentType) * scale;
        if (signed && accessor.normalized) value = Math.max(value, -1);
        const offset = (vertex * components + component) * 4;
        output.writeFloatLE(value, offset);
        const stored = output.readFloatLE(offset);
        min[component] = Math.min(min[component], stored);
        max[component] = Math.max(max[component], stored);
      }
    }
    accessor.bufferView = appendView(output);
    accessor.byteOffset = 0;
    accessor.componentType = 5126;
    delete accessor.normalized;
    if (accessor.min) accessor.min = min;
    if (accessor.max) accessor.max = max;
  }
}

export async function decodeGlbAsset(source, bytes, url) {
  const { document, binary: initialBinary } = parseGlb(bytes, url);
  let binary = initialBinary;
  document.bufferViews ||= [];
  const appendView = data => {
    const offset = padded(binary.length);
    if (offset !== binary.length) binary = Buffer.concat([binary, Buffer.alloc(offset - binary.length)]);
    const view = { buffer: 0, byteOffset: offset, byteLength: data.length };
    document.bufferViews.push(view);
    binary = Buffer.concat([binary, data]);
    return document.bufferViews.length - 1;
  };
  appendView.read = index => {
    const view = document.bufferViews[index];
    if (!view || view.buffer !== 0) throw new Error(`${url}: invalid image bufferView ${index}`);
    const start = view.byteOffset || 0;
    return binary.subarray(start, start + view.byteLength);
  };
  await decodeMeshoptViews(source, document, binary, appendView);
  await decodeDracoPrimitives(source, document, binary, appendView);
  await decodeBasisImages(source, document, appendView);
  floatMorphAttributes(document, appendView, url);
  deinterleaveAccessors(document, appendView, url);
  return serializeGlb(document, binary);
}

function installPrepareImageFacade() {
  const previous = globalThis.document;
  globalThis.document = {
    createElementNS() {
      const listeners = new Map();
      return {
        addEventListener(type, callback) { listeners.set(type, callback); },
        removeEventListener(type) { listeners.delete(type); },
        dispatchEvent(event) { listeners.get(event.type)?.call(this, event); },
        src: ''
      };
    }
  };
  return () => {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  };
}

function attachExternalGlbTextures(document, binary, refs, url) {
  document.images ||= [];
  document.textures ||= [];
  document.samplers ||= [];
  const imageIndex = new Map();
  const materialIndex = new Map();
  (document.materials || []).forEach((material, index) => {
    if (materialIndex.has(material.name)) throw new Error(`${url}: duplicate exported material name ${material.name}`);
    materialIndex.set(material.name, index);
  });
  const texturedMaterials = new Set();
  for (const reference of refs) {
    let index = imageIndex.get(reference.uri);
    if (index === undefined) {
      const extension = path.posix.extname(reference.uri).toLowerCase();
      if (extension !== '.png' && extension !== '.jpg' && extension !== '.jpeg') {
        throw new Error(`${url}: unsupported external collada image ${reference.uri}`);
      }
      index = document.images.length;
      document.images.push({
        uri: reference.uri,
        mimeType: extension === '.png' ? 'image/png' : 'image/jpeg'
      });
      document.textures.push({ sampler: document.samplers.length, source: index });
      document.samplers.push({ wrapS: 10497, wrapT: 10497 });
      imageIndex.set(reference.uri, index);
    }
    const material = document.materials[materialIndex.get(reference.materialName)];
    if (!material) throw new Error(`${url}: exported material ${reference.materialName} missing`);
    if (reference.slot !== 'map') throw new Error(`${url}: unsupported collada texture slot ${reference.slot}`);
    if (material.pbrMetallicRoughness?.baseColorTexture) {
      throw new Error(`${url}: material ${reference.materialName} already carries a base color texture`);
    }
    material.pbrMetallicRoughness = { ...material.pbrMetallicRoughness, baseColorTexture: { index } };
    texturedMaterials.add(reference.materialName);
    // The runtime samples GLB textures with flipY=false, while the offline
    // ColladaLoader lane samples with flipY=true: pre-flip texcoord v so the
    // pinned widget JPEGs land upright (no pixel re-encoding, uri references
    // only).
    material.jsrFlipTexcoords = true;
  }
  for (const mesh of document.meshes || []) {
    for (const primitive of mesh.primitives) {
      const material = document.materials[primitive.material];
      if (!material?.jsrFlipTexcoords) continue;
      const accessor = document.accessors[primitive.attributes.TEXCOORD_0];
      if (!accessor || accessor.componentType !== 5126 || accessor.type !== 'VEC2') {
        throw new Error(`${url}: mesh ${mesh.name} needs float VEC2 texcoords for the flipY fix-up`);
      }
      const view = document.bufferViews[accessor.bufferView];
      const start = (view.byteOffset || 0) + (accessor.byteOffset || 0);
      for (let offset = start; offset < start + accessor.count * 8; offset += 8) {
        binary.writeFloatLE(1 - binary.readFloatLE(offset + 4), offset + 4);
      }
      delete material.jsrFlipTexcoords;
    }
  }
  for (const material of document.materials || []) delete material.jsrFlipTexcoords;
  return serializeGlb(document, binary);
}

export async function decodeColladaAsset(source, bytes, url, options = {}) {
  const { animations = false, externalImages = false } = options;
  const previousParser = globalThis.DOMParser;
  const previousFileReader = globalThis.FileReader;
  globalThis.DOMParser = JsrDOMParser;
  // GLTFExporter uses FileReader only to collect its already-produced Blob.
  // No browser or network is involved in this prepare-time conversion.
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then(result => {
        this.result = result;
        if (this.onloadend) this.onloadend();
      });
    }
  };
  const restore = installPrepareImageFacade();
  try {
    const [threeModule, { ColladaLoader }, { GLTFExporter }] = await Promise.all([
      import(pathToFileURL(path.join(source, 'build/three.module.js'))),
      import(pathToFileURL(path.join(source, 'examples/jsm/loaders/ColladaLoader.js'))),
      import(pathToFileURL(path.join(source, 'examples/jsm/exporters/GLTFExporter.js')))
    ]);
    // Capture the request URL behind every TextureLoader-created texture so
    // the exported GLB can reference the already-pinned widget asset instead
    // of carrying undecodable pixel data. Offline parse loads them as inert
    // Texture placeholders (no pixels are ever fetched here).
    const textureUrls = new Map();
    const originalTextureLoad = threeModule.TextureLoader.prototype.load;
    threeModule.TextureLoader.prototype.load = function (textureUrl, onLoad, onProgress, onError) {
      const texture = new threeModule.Texture();
      textureUrls.set(texture, String(textureUrl));
      return texture;
    };
    try {
      const collada = new ColladaLoader().parse(bytes.toString('utf8'), `${path.posix.dirname(url)}/`);
      let textureRefs = [];
      if (externalImages) {
        collada.scene.traverse(object => {
          if (!object.isMesh) return;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            for (const [slot, value] of Object.entries(material)) {
              if (!value || value.isTexture !== true) continue;
              const textureUrl = textureUrls.get(value);
              if (textureUrl === undefined) throw new Error(`${url}: untracked collada texture slot ${slot}`);
              textureRefs.push({
                materialName: material.name,
                slot,
                uri: path.posix.join(path.posix.dirname(url), textureUrl)
              });
              material[slot] = null;
            }
          }
        });
        if (!textureRefs.length) throw new Error(`${url}: colladaExternalImages pin expected textures but none were found`);
      }
      const output = await new GLTFExporter().parseAsync(collada.scene, {
        binary: true,
        animations: animations ? (collada.scene.animations || []) : []
      });
      let glb = Buffer.from(output);
      if (externalImages) {
        const parsed = parseGlb(glb, url);
        glb = attachExternalGlbTextures(parsed.document, parsed.binary, textureRefs, url);
      }
      if (glb.byteLength > 4000000) throw new Error(`${url}: prepare-exported GLB exceeds 4,000,000 bytes`);
      if (!animations) console.warn('three: collada-kinematics uses a prepare-exported static robot; runtime joint tweening is omitted to bound the QuickJS boot path');
      return glb;
    } finally {
      threeModule.TextureLoader.prototype.load = originalTextureLoad;
    }
  } finally {
    restore();
    if (previousParser === undefined) delete globalThis.DOMParser;
    else globalThis.DOMParser = previousParser;
    if (previousFileReader === undefined) delete globalThis.FileReader;
    else globalThis.FileReader = previousFileReader;
  }
}

function canonicalizeSerializedUuids(value) {
  const uuids = new Map();
  const collect = item => {
    if (Array.isArray(item)) {
      for (const child of item) collect(child);
      return;
    }
    if (!item || typeof item !== 'object') return;
    for (const [key, child] of Object.entries(item)) {
      if (key === 'uuid' && typeof child === 'string' && !uuids.has(child)) {
        const suffix = (uuids.size + 1).toString(16).padStart(12, '0');
        uuids.set(child, `00000000-0000-4000-8000-${suffix}`);
      } else {
        collect(child);
      }
    }
  };
  const replace = item => {
    if (Array.isArray(item)) {
      for (let index = 0; index < item.length; index++) {
        if (typeof item[index] === 'string' && uuids.has(item[index])) item[index] = uuids.get(item[index]);
        else replace(item[index]);
      }
      return;
    }
    if (!item || typeof item !== 'object') return;
    for (const [key, child] of Object.entries(item)) {
      if (typeof child === 'string' && uuids.has(child)) item[key] = uuids.get(child);
      else replace(child);
    }
  };
  collect(value);
  replace(value);
  return value;
}

// VRMLLoader pins the Background group at renderOrder = -Infinity
// (examples/jsm/loaders/VRMLLoader.js "render background group first"). JSON
// cannot carry non-finite numbers: JSON.stringify(-Infinity) emits `null`, and
// ObjectLoader would restore renderOrder = null, which the strict R1 finite
// guard rejects at draw time. Serialize the same finite, symmetric sentinels
// the renderer itself uses for TransformControls' +/-Infinity render order.
const VRML_RENDER_ORDER_LIMIT = 1e30;

// Serialized-scene guard against unbounded prepare payloads. elevationGrid1.wrl
// (90x90 ElevationGrid heightfield) serializes to a measured 6,832,305 chars /
// 47,526 verts (~56 serialized bytes per vertex, ~2x the 3.4MB first estimate) —
// dropped entirely by the old 2,000,000-char quota, which shipped a 649B
// "model omitted" placeholder. 8M keeps it with headroom while still bounding
// the widget payload; QuickJS JSON.parse of the 6.8M-char payload is measured
// in the boot lane (vrml_prepare_test + jsr_widget bench) before this budget
// is spent.
const VRML_PREPARE_QUOTA_CHARS = 8_000_000;

function sanitizeSerializedRenderOrders(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) sanitizeSerializedRenderOrders(item);
    return;
  }
  if (typeof node.renderOrder === 'number' && !Number.isFinite(node.renderOrder)) {
    node.renderOrder = node.renderOrder < 0 ? -VRML_RENDER_ORDER_LIMIT : VRML_RENDER_ORDER_LIMIT;
  }
  for (const value of Object.values(node)) sanitizeSerializedRenderOrders(value);
}

export async function decodeVrmlAsset(source, bytes, url) {
  const [{ VRMLLoader }, THREE] = await Promise.all([
    import(pathToFileURL(path.join(source, 'examples/jsm/loaders/VRMLLoader.js'))),
    import(pathToFileURL(path.join(source, 'build/three.module.js')))
  ]);
  const restore = installPrepareImageFacade();
  let warning = null;
  let serialized;
  try {
    const scene = new VRMLLoader().parse(bytes.toString('utf8'), `${path.posix.dirname(url)}/`);
    serialized = canonicalizeSerializedUuids(scene.toJSON());
    sanitizeSerializedRenderOrders(serialized);
    if (JSON.stringify(serialized).length > VRML_PREPARE_QUOTA_CHARS) {
      warning = `${url}: serialized VRML exceeds the ${(VRML_PREPARE_QUOTA_CHARS / 1000000).toFixed(1)}M-char prepare quota; model omitted`;
      serialized = canonicalizeSerializedUuids(new THREE.Scene().toJSON());
    }
  } catch (error) {
    warning = `${url}: prepare-time VRML parse failed: ${error.message}; model omitted`;
    serialized = canonicalizeSerializedUuids(new THREE.Scene().toJSON());
  } finally {
    restore();
  }
  if (warning) console.warn(`three: ${warning}`);
  return Buffer.from(JSON.stringify({ jsrPreparedVrml: true, warning, scene: serialized }));
}
