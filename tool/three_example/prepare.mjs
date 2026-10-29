import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, stat, mkdir, writeFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const CORE = path.join(ROOT, 'tool/three');
const PIN = JSON.parse(await readFile(path.join(CORE, 'source-pin.json'), 'utf8'));
const require = createRequire(path.join(CORE, 'package.json'));
const esbuild = require('esbuild');
const EXAMPLES = Object.freeze({
  webgl_interactive_raycasting_points: {
    id: 'three-interactive-raycasting-points',
    directory: 'three-interactive-raycasting-points',
    name: 'Raycasting Points — three.js r186',
    description: 'Unmodified official webgl_interactive_raycasting_points module on the JSR THREE R1/WebGL2 runtime.',
    icon: '✨',
    expected: {
      html: '9655038850e98ddf095cdce3dbc57ecaaa9596e5f165036e58530774d232e21e',
      module: 'e48baf7758a70a48ebdc7d8f189a0ed1dad52a505d1b42f592ed6d02baa9699d'
    },
    assets: []
  },
  webgl_interactive_cubes: {
    id: 'three-interactive-cubes',
    directory: 'three-interactive-cubes',
    name: 'Interactive Cubes — three.js r186',
    description: 'Unmodified official webgl_interactive_cubes module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '665b23cfd57c4363ae69d86cfbe9e07b15438f93d875ee48005b36e4a4908390',
      module: '69bee4f741eeb050c2a16a46c13754786358814e5ecb06845a91b9cdf3a6ce1a'
    },
    assets: []
  },
  webgl_interactive_cubes_ortho: {
    id: 'three-interactive-cubes-ortho',
    directory: 'three-interactive-cubes-ortho',
    name: 'Interactive Orthographic Cubes — three.js r186',
    description: 'Unmodified official webgl_interactive_cubes_ortho module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📦',
    expected: {
      html: 'a91c33252326f0caa79147c992c56774818425f698a3fb8936ed912063d364ce',
      module: 'f65518ff74e76c5c531e7447d797bd54da7ab542f3fa19456ef0fac8f069a9f1'
    },
    assets: []
  },
  webgl_math_obb: {
    id: 'three-math-obb',
    directory: 'three-math-obb',
    name: 'Oriented Bounding Boxes — three.js r186',
    description: 'Unmodified official webgl_math_obb module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: 'e13fcaabb7b4a8a1e088757a9d8ac019e4ab67d0eb8335bf7687b7dd4c31a65c',
      module: 'a1e2acbadc56eaa6b596edbceee41735aa1dbdb4b9850274086ef567f7c31a6b'
    },
    assets: []
  },
  webgl_buffergeometry_points_interleaved: {
    id: 'three-buffergeometry-points-interleaved',
    directory: 'three-buffergeometry-points-interleaved',
    name: 'Interleaved BufferGeometry Points — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_points_interleaved module on the JSR THREE R1/WebGL2 runtime.',
    icon: '✨',
    expected: {
      html: '4351a7405346edf378b97a562d415b39cf11986881858bb9718e2bf7d11c1fbe',
      module: '04bf67e452407c12ac29de87a61dc4e89ceb0e02c4a6e09e7da5ab968f625384'
    },
    assets: []
  },
  webgl_interactive_voxelpainter: {
    id: 'three-interactive-voxelpainter',
    directory: 'three-interactive-voxelpainter',
    name: 'Voxel Painter — three.js r186',
    description: 'Unmodified official webgl_interactive_voxelpainter module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧱',
    expected: {
      html: 'dec8afd0c945a59e0b333751930ea4bb2e60c7e44946f6ccb67aa38aafe00a9f',
      module: '0d012790ce1b18ac1ca5a877ef46ea0e902431843d856c03fa643b4a0766c3aa'
    },
    assets: [{
      url: 'textures/square-outline-textured.png',
      output: 'square-outline-textured.png',
      mime: 'image/png',
      diagnostic: 'voxelTexture',
      sha256: 'a217d5f472ae122acd2107d0f5dbd225ba8e197998e89fee579dd5b11fd3e717'
    }]
  },
  webgl_panorama_equirectangular: {
    id: 'three-panorama-equirectangular',
    directory: 'three-panorama-equirectangular',
    name: 'Equirectangular Panorama — three.js r186',
    description: 'Unmodified official webgl_panorama_equirectangular module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🌐',
    expected: {
      html: 'dfdfa57c273051b2bf2b46d0f8621847bf02612ca784a806f2c3dfcea6aec27f',
      module: 'c7da06fcf02a68836cd21af07802134cae1b207b0f2d64bac6eacc90286374e0'
    },
    assets: [{
      url: 'textures/2294472375_24a3b8ef46_o.jpg',
      output: 'panorama.jpg',
      mime: 'image/jpeg',
      diagnostic: 'panorama',
      sha256: '3efa22071f3f84ec26248ee58aa05aba635a0a9d810bca93da5a94f33e907524'
    }]
  },
  webgl_geometry_minecraft: {
    id: 'three-minecraft',
    directory: 'three-minecraft',
    name: 'Minecraft — three.js r186',
    description: 'Unmodified official webgl_geometry_minecraft module on the JSR THREE R1/WebGL2 runtime.',
    icon: '⛏️',
    expected: {
      html: 'fa0a3bd983bed5911d30109c3d1e4eecacbd1de6eee81653983bd0b4d8edb77c',
      module: 'a1b42a234f63ee155e4ced8d55e1a7ade87f5f03efa96a60d1302fb43dd864f8'
    },
    assets: [{
      url: 'textures/minecraft/atlas.png',
      output: 'atlas.png',
      mime: 'image/png',
      diagnostic: 'atlas',
      sha256: '61b423997c1a5e5f9bf8684fe3caed2b238a333b894a3e37223c30327c4b0df0'
    }]
  },
  webgl_geometry_colors: {
    id: 'three-geometry-colors',
    directory: 'three-geometry-colors',
    name: 'Vertex Colors — three.js r186',
    description: 'Unmodified official webgl_geometry_colors module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🎨',
    expected: {
      html: '90d1dc9947c092feba524972199b50daf4b01d2b8975c427d70bc5b6714a496f',
      module: '013a5e27a5bc9eb1a117c1fb95db429d508e8c67e40768e7de50bdecfa57de9f'
    },
    assets: []
  },
  webgl_lines_colors: {
    id: 'three-lines-colors',
    directory: 'three-lines-colors',
    name: 'Line Colors — three.js r186',
    description: 'Unmodified official webgl_lines_colors module on the JSR THREE R1/WebGL2 runtime.',
    icon: '〰️',
    expected: {
      html: 'a89c2291b5497be160e6763de192df8379b2a587ff245b603e25a65593c4b584',
      module: 'e7e9fcee0f8140745a400a30a5d29c9ac97a13409f655b1e618cddbd2c8d406c'
    },
    assets: []
  },
  webgl_buffergeometry_uint: {
    id: 'three-buffergeometry-uint',
    directory: 'three-buffergeometry-uint',
    name: 'Integer BufferGeometry — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_uint module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🔢',
    expected: {
      html: 'a638b634348ecbd8f4c5fcf0889d04dab6c950e652569cab2486429f206dc457',
      module: 'e9b52fe4a7161d6bd32d0e25612eaaa0abc8878d43cfb146782b67400b7afe86'
    },
    assets: []
  },
  webgl_buffergeometry_indexed: {
    id: 'three-buffergeometry-indexed',
    directory: 'three-buffergeometry-indexed',
    name: 'Indexed BufferGeometry — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_indexed module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🔺',
    expected: {
      html: '4370368307e79fcc83c43df84ba2c5f8a2624c66c8e653c8f63ae560801fc827',
      module: '99212fb6c3fcba450bd0faa33106c90eeaf09175fb3d7f002febf03a4ab76608'
    },
    assets: []
  },
  webgl_buffergeometry_lines_indexed: {
    id: 'three-buffergeometry-lines-indexed',
    directory: 'three-buffergeometry-lines-indexed',
    name: 'Indexed BufferGeometry Lines — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_lines_indexed module on the JSR THREE R1/WebGL2 runtime.',
    icon: '❄️',
    expected: {
      html: '2b430176ebda402ca32d86565d3bf838bdc98158dbd37b0f3e21c9ba4e8442ee',
      module: 'a09b6d9af3a93221cf73c03d389a88918d8e65270292f3e20fd64a7ce8a27135'
    },
    assets: []
  },
  webgl_buffergeometry_points: {
    id: 'three-buffergeometry-points',
    directory: 'three-buffergeometry-points',
    name: 'BufferGeometry Points — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_points module on the JSR THREE R1/WebGL2 runtime.',
    icon: '✨',
    expected: {
      html: 'ab181dd67b2e7199f062af3d83a62f425a493c88afeb3751c83d55ac5304e52f',
      module: '0ec6f6cebe58d4fe1373d9448e3ed0eb65f15312a42539ba212a961fa852fb40'
    },
    assets: []
  },
  webgl_geometry_terrain_raycast: {
    id: 'three-geometry-terrain-raycast',
    directory: 'three-geometry-terrain-raycast',
    name: 'Terrain Raycast — three.js r186',
    description: 'Unmodified official webgl_geometry_terrain_raycast module on the JSR THREE R1/WebGL2 runtime.',
    icon: '⛰️',
    expected: {
      html: 'f583b757839640cdb45daaf7896e656ca1bbd6fbc5fb2ab680bf9a9531725a1f',
      module: '1dd4eeafd3e34ceb5baea93fb588df704347c310298c7039d8816421e67df461'
    },
    assets: []
  },
  webgl_math_orientation_transform: {
    id: 'three-math-orientation-transform',
    directory: 'three-math-orientation-transform',
    name: 'Orientation Transform — three.js r186',
    description: 'Unmodified official webgl_math_orientation_transform module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧭',
    expected: {
      html: 'c9922d30273b58b1744fef5f4034c760de981f9ab28b641421ef0addcb7a0c56',
      module: '148bbdb22c24e0c617af871927a589a26d1a296528c2f1c5248f5f56c7fcc94a'
    },
    assets: []
  }
});
const slash = value => value.split(path.sep).join('/');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const record = bytes => ({ bytes: bytes.length, sha256: sha(bytes) });
const json = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);

function usage() {
  return `Usage: node tool/three_example/prepare.mjs <${Object.keys(EXAMPLES).join('|')}> [--source <dir>] [--offline] [--verify]`;
}

function parseArgs(argv) {
  const positional = [];
  let source = null;
  let verify = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--source') {
      if (++i >= argv.length) throw new Error('--source requires a directory');
      source = argv[i];
    } else if (arg.startsWith('--source=')) {
      source = arg.slice('--source='.length);
      if (!source) throw new Error('--source requires a directory');
    } else if (arg === '--offline') {
      // Resolution is local-only whether or not this explicit flag is present.
    } else if (arg === '--verify') {
      verify = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    } else {
      positional.push(arg);
    }
  }
  if (positional.length !== 1 || !Object.hasOwn(EXAMPLES, positional[0])) {
    throw new Error(`Expected exactly one supported example\n${usage()}`);
  }
  const example = positional[0];
  return {
    example,
    definition: EXAMPLES[example],
    source: path.resolve(source || process.env.THREE_SRC || '/tmp/jsr-three-r186'),
    verify
  };
}

function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

async function filesBelow(directory, relative = '') {
  const result = [];
  const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
  for (const entry of entries) {
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) result.push(...await filesBelow(directory, name));
    else if (entry.isFile()) result.push(name);
  }
  return result;
}

async function sourceTreeHash(source) {
  const hash = createHash('sha256');
  const groups = [
    'src',
    'examples/jsm/loaders/GLTFLoader.js',
    'examples/jsm/utils/BufferGeometryUtils.js',
    'examples/jsm/utils/SkeletonUtils.js'
  ];
  const files = [];
  for (const group of groups) {
    const absolute = path.join(source, group);
    if ((await stat(absolute)).isDirectory()) {
      files.push(...(await filesBelow(absolute)).map(name => `${group}/${name}`));
    } else {
      files.push(group);
    }
  }
  files.sort();
  for (const file of files) {
    hash.update(file);
    hash.update('\0');
    hash.update(await readFile(path.join(source, file)));
    hash.update('\0');
  }
  return { hash: hash.digest('hex'), files };
}

async function verifySource(source) {
  if (!(await stat(source)).isDirectory()) throw new Error(`THREE_SRC is not a directory: ${source}`);
  const revision = JSON.parse(await readFile(path.join(source, 'package.json'), 'utf8'));
  if (revision.version !== '0.186.1') {
    throw new Error(`Expected three.js 0.186.1 (r186), got ${revision.version}`);
  }
  try {
    const commit = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], {
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim();
    if (commit !== PIN.commit) {
      throw new Error(`three.js source is ${commit}, expected ${PIN.commit}`);
    }
  } catch (error) {
    if (error.message && error.message.includes('expected')) throw error;
    // A source archive has no .git directory; the complete source-input digest
    // below is its immutable identity check, matching tool/three/build.mjs.
  }
  const tree = await sourceTreeHash(source);
  if (tree.hash !== PIN.treeSha256 || tree.files.length !== PIN.sourceFilesHashed) {
    throw new Error(`three.js source digest ${tree.hash} (${tree.files.length} files) does not match pinned ${PIN.treeSha256} (${PIN.sourceFilesHashed} files); use r186 at ${PIN.commit}`);
  }
  return tree;
}

function scriptType(openTag) {
  const match = openTag.match(/\s+type\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  return match ? (match[1] || match[2] || match[3]).trim().toLowerCase() : '';
}

function extractOfficial(html) {
  // latin1 gives a one-byte-to-one-character view, so all Buffer offsets and
  // the extracted official bytes remain exact even if the HTML gains UTF-8.
  const text = html.toString('latin1');
  const scripts = [];
  const opening = /<script\b[^>]*>/gi;
  let match;
  while ((match = opening.exec(text))) {
    const close = /<\/script\s*>/gi;
    close.lastIndex = opening.lastIndex;
    const end = close.exec(text);
    if (!end) throw new Error(`Unclosed script at byte ${match.index}`);
    scripts.push({
      type: scriptType(match[0]),
      bytes: html.subarray(opening.lastIndex, end.index)
    });
    opening.lastIndex = end.index + end[0].length;
  }
  const importmaps = scripts.filter(script => script.type === 'importmap');
  const modules = scripts.filter(script => script.type === 'module');
  if (importmaps.length !== 1 || modules.length !== 1) {
    throw new Error(`Expected exactly one importmap and one module script; found ${importmaps.length} and ${modules.length}`);
  }
  let importmap;
  try {
    importmap = JSON.parse(importmaps[0].bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`Official importmap is not valid JSON: ${error.message}`);
  }
  if (!importmap || typeof importmap !== 'object' || !importmap.imports ||
      importmap.imports.three !== '../build/three.module.js' ||
      importmap.imports['three/addons/'] !== './jsm/') {
    throw new Error('Official importmap does not contain the pinned three/addons mappings');
  }
  return { importmapBytes: importmaps[0].bytes, importmap, moduleBytes: modules[0].bytes };
}

function addonPath(jsmRoot, specifier) {
  const relative = specifier.slice('three/addons/'.length);
  if (!relative || relative.includes('\0')) throw new Error(`Invalid three addon ${specifier}`);
  const resolved = path.resolve(jsmRoot, relative);
  if (!inside(jsmRoot, resolved)) throw new Error(`Addon escapes pinned examples/jsm: ${specifier}`);
  return resolved;
}

function localOnlyPlugin({ source, facadeSource = null, officialBytes = null, final = false }) {
  const jsmRoot = path.join(source, 'examples/jsm');
  const allowedRoots = final ? [HERE, jsmRoot] : [path.join(CORE, 'src'), source];
  return {
    name: final ? 'jsr-three-example-local-only' : 'jsr-three-export-discovery',
    setup(build) {
      build.onResolve({ filter: /^three$/ }, () => {
        if (facadeSource !== null) return { path: 'three', namespace: 'jsr-three-facade' };
        return { path: path.join(source, 'src/Three.js') };
      });
      build.onResolve({ filter: /^three\/addons\/libs\/stats\.module\.js$/ }, () => {
        if (!final) return { path: path.join(jsmRoot, 'libs/stats.module.js') };
        return { path: path.join(HERE, 'stats_adapter.js') };
      });
      build.onResolve({ filter: /^three\/addons\/libs\/lil-gui\.module\.min\.js$/ }, args => {
        if (!final || args.importer === path.join(HERE, 'lil_gui_adapter.js')) {
          return { path: path.join(jsmRoot, 'libs/lil-gui.module.min.js') };
        }
        return { path: path.join(HERE, 'lil_gui_adapter.js') };
      });
      build.onResolve({ filter: /^three\/addons\// }, args => ({
        path: addonPath(jsmRoot, args.path)
      }));
      build.onResolve({ filter: /^\.\/official_module\.js$/ }, args => {
        if (final && args.importer) return { path: 'official_module.js', namespace: 'jsr-official' };
        return undefined;
      });
      build.onResolve({ filter: /^(?:https?:|data:|node:|npm:|jsr:)|^\/\// }, args => ({
        errors: [{ text: `Remote/non-local imports are forbidden: ${args.path}` }]
      }));
      build.onResolve({ filter: /^[^./]/ }, args => {
        if (args.kind === 'entry-point') return undefined;
        return { errors: [{ text: `Unknown bare import is forbidden: ${args.path}` }] };
      });
      build.onResolve({ filter: /^three(?:\/|$)/ }, args => ({
        errors: [{ text: `Unknown three import is forbidden: ${args.path}` }]
      }));
      build.onLoad({ filter: /^three$/, namespace: 'jsr-three-facade' }, () => ({
        contents: facadeSource,
        loader: 'js',
        resolveDir: HERE
      }));
      build.onLoad({ filter: /^official_module\.js$/, namespace: 'jsr-official' }, () => ({
        contents: officialBytes,
        loader: 'js',
        resolveDir: path.join(source, 'examples')
      }));
      build.onLoad({ filter: /.*/ }, args => {
        if (args.namespace !== 'file') return undefined;
        if (allowedRoots.some(root => inside(root, args.path))) return undefined;
        return { errors: [{ text: `Import is outside the finite local roots: ${args.path}` }] };
      });
    }
  };
}

async function discoverExports(source) {
  const entry = path.join(CORE, 'src/native_entry.js');
  const result = await esbuild.build({
    absWorkingDir: ROOT,
    entryPoints: [entry],
    outfile: path.join(ROOT, 'build/jsr_three_example_export_discovery.js'),
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    target: ['es2020'],
    metafile: true,
    treeShaking: false,
    logLevel: 'silent',
    plugins: [localOnlyPlugin({ source })],
    define: { __THREE_DEVTOOLS__: 'undefined' }
  });
  const output = Object.values(result.metafile.outputs).find(item => item.entryPoint);
  if (!output || !Array.isArray(output.exports)) throw new Error('esbuild did not report the platform entry exports');
  const names = [...new Set(output.exports)].sort();
  for (const required of ['Timer', 'WebGLRenderer', 'TextureLoader', 'Scene', 'PerspectiveCamera']) {
    if (!names.includes(required)) throw new Error(`Platform export discovery omitted ${required}`);
  }
  return names;
}

function facadeModule(names, widgetId) {
  const lines = [
    'const __three = globalThis.THREE;',
    `if (!__three) throw new Error(${JSON.stringify(`${widgetId}: globalThis.THREE is not initialized`)});`
  ];
  const bindings = names.map((name, index) => {
    const local = `__threeExport${index}`;
    lines.push(`const ${local} = __three[${JSON.stringify(name)}];`);
    return `${local} as ${name}`;
  });
  lines.push(`export { ${bindings.join(', ')} };`, '');
  return lines.join('\n');
}

function pngDimensions(bytes, url) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || signature.some((value, index) => bytes[index] !== value)) {
    throw new Error(`${url} is not a PNG`);
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function jpegDimensions(bytes, url) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error(`${url} is not a JPEG`);
  }
  const startOfFrame = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf
  ]);
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error(`${url} has an invalid JPEG marker`);
    while (offset < bytes.length && bytes[offset] === 0xff) offset++;
    if (offset >= bytes.length) break;
    const marker = bytes[offset++];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (marker === 0xd9 || marker === 0xda || offset + 2 > bytes.length) break;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) {
      throw new Error(`${url} has an invalid JPEG segment`);
    }
    if (startOfFrame.has(marker)) {
      if (length < 7) throw new Error(`${url} has an invalid JPEG frame header`);
      return {
        height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5)
      };
    }
    offset += length;
  }
  throw new Error(`${url} has no JPEG dimensions`);
}

async function prepareAssets(source, definitions) {
  const assets = [];
  for (const definition of definitions) {
    const bytes = await readFile(path.join(source, 'examples', definition.url));
    if (sha(bytes) !== definition.sha256) throw new Error(`${definition.url} differs from the pinned r186 bytes`);
    let dimensions;
    if (definition.mime === 'image/png') dimensions = pngDimensions(bytes, definition.url);
    else if (definition.mime === 'image/jpeg') dimensions = jpegDimensions(bytes, definition.url);
    else throw new Error(`Unsupported prepared asset type: ${definition.mime}`);
    if (!dimensions.width || !dimensions.height) throw new Error(`${definition.url} has invalid texture dimensions`);
    assets.push({ ...definition, bytes, ...dimensions });
  }
  return assets;
}

function sortedRecordMap(values) {
  return Object.fromEntries(Object.keys(values).sort().map(key => [key, values[key]]));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const definition = options.definition;
  const out = path.join(ROOT, 'example/widgets', definition.directory);
  const entryName = `${definition.id}-entry.js`;
  const source = await realpath(options.source);
  const tree = await verifySource(source);
  const htmlPath = path.join(source, `examples/${options.example}.html`);
  const licensePath = path.join(source, 'LICENSE');
  const [html, license, assets] = await Promise.all([
    readFile(htmlPath), readFile(licensePath), prepareAssets(source, definition.assets)
  ]);
  if (sha(html) !== definition.expected.html) {
    throw new Error(`Official ${options.example} HTML differs from the pinned r186 bytes`);
  }
  const extracted = extractOfficial(html);
  if (sha(extracted.moduleBytes) !== definition.expected.module) {
    throw new Error(`Extracted official ${options.example} module differs from the pinned r186 bytes`);
  }
  const exportNames = await discoverExports(source);
  const facadeSource = facadeModule(exportNames, definition.id);
  const adapterAssets = assets.map(asset => ({
    url: asset.url,
    data: asset.bytes.toString('base64'),
    mime: asset.mime,
    width: asset.width,
    height: asset.height,
    bytes: asset.bytes.length,
    diagnostic: asset.diagnostic
  }));

  const result = await esbuild.build({
    absWorkingDir: ROOT,
    stdin: {
      contents: "import './example_adapter.js';\nimport './official_module.js';\n",
      resolveDir: HERE,
      sourcefile: entryName,
      loader: 'js'
    },
    outfile: path.join(out, 'widget.js'),
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'neutral',
    target: ['es2020'],
    minify: true,
    treeShaking: true,
    legalComments: 'inline',
    sourcemap: false,
    metafile: true,
    logLevel: 'silent',
    plugins: [localOnlyPlugin({
      source,
      facadeSource,
      officialBytes: extracted.moduleBytes,
      final: true
    })],
    define: {
      __JSR_THREE_EXAMPLE_ID__: JSON.stringify(options.example),
      __JSR_THREE_WIDGET_ID__: JSON.stringify(definition.id),
      __JSR_THREE_EXAMPLE_ASSETS_JSON__: JSON.stringify(JSON.stringify(adapterAssets))
    }
  });
  if (result.outputFiles.length !== 1) throw new Error(`Expected one widget output, got ${result.outputFiles.length}`);
  const widget = Buffer.from(result.outputFiles[0].contents);
  for (const input of Object.keys(result.metafile.inputs)) {
    if (input.startsWith('jsr-') || path.basename(input) === entryName) continue;
    const absolute = path.isAbsolute(input) ? input : path.resolve(ROOT, input);
    if (inside(path.join(source, 'src'), absolute)) {
      throw new Error(`A second three.js core copy entered the widget: ${input}`);
    }
  }

  const manifest = json({
    id: definition.id,
    name: definition.name,
    description: definition.description,
    version: '0.1.0',
    icon: definition.icon,
    allowedCommands: [],
    network: false,
    widget: { entry: 'widget.js', interactive: true }
  });
  const outputBytes = {
    'THREE_LICENSE': license,
    'manifest.json': manifest,
    'official_module.js': extracted.moduleBytes,
    'original.html': html,
    'widget.js': widget
  };
  for (const asset of assets) outputBytes[asset.output] = asset.bytes;

  const inputs = {};
  async function addInput(label, bytes) {
    if (!inputs[label]) inputs[label] = record(bytes);
  }
  await addInput(`source/examples/${options.example}.html`, html);
  await addInput('source/LICENSE', license);
  for (const asset of assets) await addInput(`source/examples/${asset.url}`, asset.bytes);
  for (const file of ['prepare.mjs', 'example_adapter.js', 'example_canvas2d.js', 'lil_gui_adapter.js', 'stats_adapter.js']) {
    await addInput(`tool/three_example/${file}`, await readFile(path.join(HERE, file)));
  }
  for (const file of ['source-pin.json', 'src/native_entry.js']) {
    await addInput(`tool/three/${file}`, await readFile(path.join(CORE, file)));
  }
  for (const file of ['assets/three/three.native.js', 'assets/three/three.web.js']) {
    await addInput(file, await readFile(path.join(ROOT, file)));
  }
  for (const input of Object.keys(result.metafile.inputs)) {
    if (input.startsWith('jsr-') || path.basename(input) === entryName) continue;
    const absolute = path.isAbsolute(input) ? input : path.resolve(ROOT, input);
    let label;
    if (inside(source, absolute)) label = `source/${slash(path.relative(source, absolute))}`;
    else if (inside(ROOT, absolute)) label = slash(path.relative(ROOT, absolute));
    else throw new Error(`Cannot label build input ${input}`);
    await addInput(label, await readFile(absolute));
  }

  const prepareManifest = json({
    schema: 'jsr-three-example-prepare-v1',
    id: definition.id,
    example: options.example,
    upstream: {
      name: 'three.js', version: '0.186.1', revision: '186', license: 'MIT',
      sourceCommit: PIN.commit, sourceTagObject: PIN.tagObject,
      sourceTreeSha256: tree.hash, sourceFilesHashed: tree.files.length
    },
    tools: {
      node: process.version,
      esbuild: esbuild.version,
      esbuildRequire: 'tool/three/package.json'
    },
    build: {
      format: 'iife', platform: 'neutral', target: 'es2020', minify: true,
      offline: true, remoteResolution: false,
      exportDiscovery: 'esbuild ESM/metafile over tool/three/src/native_entry.js',
      adapterOrder: 'ES module dependency: example_adapter.js before official_module.js'
    },
    extraction: {
      importmap: extracted.importmap,
      importmapBytes: record(extracted.importmapBytes),
      officialModule: record(extracted.moduleBytes)
    },
    facade: {
      global: 'globalThis.THREE',
      exports: exportNames,
      source: record(Buffer.from(facadeSource))
    },
    inputs: sortedRecordMap(inputs),
    outputs: sortedRecordMap(Object.fromEntries(
      Object.entries(outputBytes).map(([name, bytes]) => [name, record(bytes)])
    ))
  });
  outputBytes['prepare_manifest.json'] = prepareManifest;

  if (options.verify) {
    for (const name of Object.keys(outputBytes).sort()) {
      const existing = await readFile(path.join(out, name));
      if (!existing.equals(outputBytes[name])) {
        throw new Error(`${name} differs from a clean pinned prepare`);
      }
    }
  } else {
    await mkdir(out, { recursive: true });
    for (const name of Object.keys(outputBytes).sort()) {
      await writeFile(path.join(out, name), outputBytes[name]);
    }
  }
  console.log(JSON.stringify({
    prepared: options.example,
    verified: options.verify,
    output: slash(path.relative(ROOT, out)),
    sourceCommit: PIN.commit,
    offline: true,
    outputs: sortedRecordMap(Object.fromEntries(
      Object.entries(outputBytes).map(([name, bytes]) => [name, record(bytes)])
    ))
  }, null, 2));
}

main().catch(error => {
  console.error(`three-example prepare failed: ${error.message}`);
  process.exitCode = 1;
});
