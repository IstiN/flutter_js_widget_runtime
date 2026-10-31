import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOTS = ['textures', 'models', 'sounds', 'fonts', 'environments', 'json', 'luts', 'screenshots'];
const ROOT_PATTERN = /^(?:\.\?\/)?(textures|models|sounds|fonts|environments|json|luts|screenshots)\//;
const EXTENSIONS = new Set([
  '3dm', '3ds', '3dl', '3mf', 'amf', 'avif', 'bin', 'bmp', 'bvh', 'cube', 'dae', 'drc', 'exr',
  'fbx', 'gcode', 'gif', 'glb', 'gltf', 'hdr', 'jpeg', 'jpg', 'js', 'json', 'kmz',
  'ktx', 'ktx2', 'ldr', 'mdd', 'mp3', 'mpd', 'mtl', 'nrrd', 'obj', 'ogg', 'pcd', 'pdb',
  'ply', 'png', 'svg', 'tga', 'tif', 'tiff', 'usdz', 'vox', 'vrml', 'wasm', 'wav',
  'webp', 'wrl', 'zip'
]);
const BROAD_DIRECTORIES = new Set([
  'models/gltf', 'models/ldraw/officialLibrary', 'textures/equirectangular'
]);
const IMAGE_MIMES = new Map([
  ['avif', 'image/avif'], ['bmp', 'image/bmp'], ['gif', 'image/gif'],
  ['jpeg', 'image/jpeg'], ['jpg', 'image/jpeg'], ['png', 'image/png'],
  ['svg', 'image/svg+xml'], ['webp', 'image/webp']
]);
const AUDIO_MIMES = new Map([['mp3', 'audio/mpeg'], ['ogg', 'audio/ogg'], ['wav', 'audio/wav']]);
const RAW_IMAGE_EXTENSIONS = new Set(['avif', 'bmp', 'svg', 'webp']);

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const extensionOf = url => path.posix.extname(url).slice(1).toLowerCase();
const isAssetUrl = url => ROOT_PATTERN.test(url) && !url.includes('\0');

export function assetOutputName(url) {
  return url.replace(/[^A-Za-z0-9._-]+/g, '__');
}

function stringLiterals(source) {
  const values = new Set();
  const expression = /"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|`((?:\\.|[^`\\])*)`/gs;
  for (const match of source.matchAll(expression)) {
    const value = (match[1] ?? match[2] ?? match[3]).replace(/\\([/'`])/g, '$1');
    if (value.length > 0 && value.length <= 300) values.add(value);
  }
  return [...values].sort();
}

function normalizeAssetUrl(value) {
  const clean = value.trim().replace(/[?#].*$/, '').replace(/^\.\//, '');
  if (!isAssetUrl(clean) || clean.includes('\\') || /%(?:2e|2f|5c)/i.test(clean)) return null;
  const normalized = path.posix.normalize(clean);
  return isAssetUrl(normalized) && !normalized.startsWith('../') ? normalized : null;
}

function candidateValues(literals) {
  return literals.filter(value => {
    if (value.includes('://') || value.startsWith('data:') || value.startsWith('three/')) return false;
    const rooted = value.replace(/^\.\//, '');
    // A loader-relative filename can itself start with "models/" (LDraw's
    // packed MPDs do). Keep those candidates for setPath expansion instead of
    // treating every rooted-looking string as an already-resolved URL.
    if ((isAssetUrl(rooted) && !EXTENSIONS.has(extensionOf(rooted))) || /[\r\n{}$]/.test(value)) return false;
    return !value.startsWith('/') && !value.includes('\0');
  });
}

function patternsWithWildcards(values) {
  return values.map(normalizeAssetUrl).filter(value => value && /[$}{]/.test(value));
}

async function isFile(root, url) {
  if (!isAssetUrl(url) || /[$}{]/.test(url)) return false;
  try {
    return (await stat(path.join(root, 'examples', url))).isFile();
  } catch {
    return false;
  }
}

async function directoryFiles(root, directory, maximum = 160) {
  if (BROAD_DIRECTORIES.has(directory)) return [];
  const files = [];
  async function visit(relative) {
    const entries = await readdir(path.join(root, 'examples', relative), { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const name = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await visit(name);
      else if (entry.isFile() && EXTENSIONS.has(extensionOf(name))) files.push(name);
      if (files.length > maximum) return [];
    }
    return files;
  }
  try {
    return await visit(directory);
  } catch {
    return [];
  }
}

function wildcardRegex(pattern) {
  const escaped = pattern.replace(/[.+^()|[\]\\]/g, '\\$&').replace(/[$}{][^/]*?}/g, '[^/]+');
  return new RegExp(`^${escaped}$`);
}

async function expandWildcards(root, patterns) {
  const urls = new Set();
  for (const pattern of patterns) {
    const wildcard = pattern.search(/[$}{]/);
    const slash = pattern.lastIndexOf('/', wildcard);
    const directory = slash < 0 ? '' : pattern.slice(0, slash);
    if (!directory || BROAD_DIRECTORIES.has(directory)) continue;
    const expression = wildcardRegex(pattern);
    for (const file of await directoryFiles(root, directory, 500)) {
      if (expression.test(file)) urls.add(file);
    }
  }
  return urls;
}

async function discoverModuleUrls(root, source) {
  const literals = stringLiterals(source);
  const direct = literals.map(normalizeAssetUrl).filter(Boolean);
  const directories = [...new Set(direct.filter(value => value.endsWith('/')).map(value => value.replace(/\/+$/, '')))];
  const values = candidateValues(literals);
  const prefixes = values.filter(value => value.endsWith('/') && !value.includes(':'));
  const extensions = values.filter(value => /^\.[A-Za-z0-9]+$/.test(value));
  const candidates = new Set(direct.filter(value => !value.endsWith('/')));

  for (const directory of directories) {
    for (const file of await directoryFiles(root, directory)) candidates.add(file);
    for (const value of values) {
      const clean = value.replace(/^\.\//, '');
      candidates.add(path.posix.normalize(path.posix.join(directory, clean)));
      for (const extension of extensions) {
        candidates.add(path.posix.normalize(path.posix.join(directory, clean + extension)));
      }
      if (clean.endsWith('/')) continue;
      for (const prefix of prefixes) {
        candidates.add(path.posix.normalize(path.posix.join(directory, prefix, clean)));
      }
    }
  }
  for (const url of await expandWildcards(root, patternsWithWildcards(literals))) candidates.add(url);

  const existing = [];
  for (const url of [...candidates].sort()) {
    if (EXTENSIONS.has(extensionOf(url)) && await isFile(root, url)) existing.push(url);
  }
  return existing;
}

function referenceUrl(parent, reference) {
  if (!reference || /^(?:data:|https?:|blob:)/i.test(reference)) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  } catch {
    return null;
  }
  const url = path.posix.normalize(path.posix.join(path.posix.dirname(parent), decoded));
  return isAssetUrl(url) && EXTENSIONS.has(extensionOf(url)) ? url : null;
}

export function assetDependencyAlias(parent, reference) {
  return `${path.posix.dirname(parent)}/./${reference.replace(/^\.\//, '')}`;
}

function gltfReferences(parent, document) {
  const references = [];
  for (const item of [...(document.buffers || []), ...(document.images || [])]) {
    if (referenceUrl(parent, item.uri)) references.push(item.uri);
  }
  return references;
}

function glbDocument(bytes) {
  if (bytes.length < 20 || bytes.toString('latin1', 0, 4) !== 'glTF') return null;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    if (offset + 8 + length > bytes.length) return null;
    if (type === 0x4e4f534a) return JSON.parse(bytes.toString('utf8', offset + 8, offset + 8 + length));
    offset += 8 + length;
  }
  return null;
}

function textReferences(parent, extension, bytes) {
  const text = bytes.toString('utf8');
  const references = [];
  if (extension === 'obj') {
    for (const match of text.matchAll(/^\s*mtllib\s+(.+)$/gim)) references.push(match[1].trim());
  } else if (extension === 'mtl') {
    for (const match of text.matchAll(/^\s*(?:map_[a-z0-9_]+|bump|disp|refl|norm)\s+(.+)$/gim)) {
      references.push(match[1].trim().split(/\s+/).at(-1));
    }
  } else if (extension === 'dae') {
    for (const match of text.matchAll(/<init_from[^>]*>\s*([^<]+?)\s*<\/init_from>/gi)) references.push(match[1]);
  } else if (extension === 'nrrd') {
    const match = text.match(/^data file:\s*(.+)$/im);
    if (match) references.push(match[1].trim());
  }
  return references.filter(reference => referenceUrl(parent, reference));
}

async function expandReferences(root, initial) {
  const urls = new Set(initial);
  const queue = [...initial].sort();
  const embeddedGlbs = new Set();
  const aliases = new Map();
  while (queue.length) {
    const url = queue.shift();
    const extension = extensionOf(url);
    if (!['dae', 'glb', 'gltf', 'mtl', 'nrrd', 'obj'].includes(extension)) continue;
    const bytes = await readFile(path.join(root, 'examples', url));
    let references = [];
    if (extension === 'gltf') references = gltfReferences(url, JSON.parse(bytes.toString('utf8')));
    else if (extension === 'glb') {
      const document = glbDocument(bytes);
      if (document) {
        references = gltfReferences(url, document);
        if ((document.images || []).some(image => image.bufferView !== undefined)) embeddedGlbs.add(url);
      }
    } else references = textReferences(url, extension, bytes);
    for (const reference of references.sort()) {
      const dependency = referenceUrl(url, reference);
      if (!dependency || !await isFile(root, dependency)) continue;
      const alias = assetDependencyAlias(url, reference);
      if (!aliases.has(dependency)) aliases.set(dependency, new Set());
      aliases.get(dependency).add(alias);
      if (!urls.has(dependency)) {
        urls.add(dependency);
        queue.push(dependency);
      }
    }
  }
  return {
    urls: [...urls].sort(), embeddedGlbs,
    aliases: new Map([...aliases].map(([url, values]) => [url, [...values].sort()]))
  };
}

function mimeFor(extension) {
  if (extension === 'glb') return 'model/gltf-binary';
  if (extension === 'hdr') return 'image/vnd.radiance';
  if (extension === 'gltf' || extension === 'json') return 'application/json';
  return IMAGE_MIMES.get(extension) || AUDIO_MIMES.get(extension) || 'application/octet-stream';
}

async function definitionFor(root, url, embeddedGlbs, aliases) {
  const bytes = await readFile(path.join(root, 'examples', url));
  const extension = extensionOf(url);
  const mime = mimeFor(extension);
  const definition = {
    url,
    output: assetOutputName(url),
    mime,
    diagnostic: `auto:${url}`,
    sha256: sha256(bytes),
    discovered: true
  };
  if (extension === 'gif') definition.convertToPng = true;
  if (extension === 'hdr') definition.hdrRgba = true;
  if (extension === 'drc') definition.prepareDraco = true;
  if (extension === 'ktx2') definition.prepareKtx2 = true;
  if (extension === 'wrl') definition.prepareVrml = true;
  if (extension === 'glb') {
    const document = glbDocument(bytes);
    const compressed = new Set([
      'KHR_draco_mesh_compression', 'EXT_meshopt_compression',
      'KHR_meshopt_compression', 'KHR_texture_basisu'
    ]);
    if (document && (document.extensionsUsed || []).some(name => compressed.has(name))) {
      definition.predecodeGlb = true;
    }
  }
  if (embeddedGlbs.has(url)) definition.externalizeImages = true;
  if (aliases.has(url)) definition.aliases = aliases.get(url);
  if (RAW_IMAGE_EXTENSIONS.has(extension) ||
      (extension === 'jpg' || extension === 'jpeg' ? url.includes('/cube/') : false) ||
      (extension === 'png' && (url.includes('/cube/') || url.startsWith('luts/') || /\/sprites?\//.test(url)))) definition.rawRgba = true;
  return definition;
}

export async function discoverAssets({ source, moduleSource, explicit = [] }) {
  const root = path.resolve(source);
  const initial = await discoverModuleUrls(root, moduleSource);
  const { urls, embeddedGlbs, aliases } = await expandReferences(root, initial);
  const discovered = [];
  for (const url of urls) discovered.push(await definitionFor(root, url, embeddedGlbs, aliases));
  const byUrl = new Map(discovered.map(item => [item.url, item]));
  for (const item of explicit) byUrl.set(item.url, item);
  return [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url));
}

export async function verifyDiscoveredAssets(source, definitions) {
  for (const definition of definitions) {
    const bytes = await readFile(path.join(source, 'examples', definition.url));
    if (sha256(bytes) !== definition.sha256) {
      throw new Error(`${definition.url} differs from its discovered sha256 pin`);
    }
  }
  return true;
}
