import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const CORE = path.join(ROOT, 'tool/three');
const PIN = JSON.parse(await readFile(path.join(CORE, 'source-pin.json'), 'utf8'));
const require = createRequire(path.join(CORE, 'package.json'));
const esbuild = require('esbuild');
const DEFAULT_REF = path.resolve(ROOT, '../references/minecraft-threejs-clone');
const DEFAULT_OUT = '/tmp/jsr-minecraft-stress';
const MAIN_ANCHOR = 'const world = new World();';
const GENERATE_ANCHOR = 'world.generate();';
const INJECTION_MARKER = '/* JSR_MINECRAFT_STRESS_DRAW_DISTANCE */';
const BLOCK_PNGS = [
  'cactus_side.png', 'cactus_top.png', 'coal_ore.png', 'dirt.png',
  'grass.png', 'grass_side.png', 'iron_ore.png', 'jungle_leaves.png',
  'jungle_tree_side.png', 'jungle_tree_top.png', 'leaves.png', 'sand.png',
  'snow.png', 'snow_side.png', 'stone.png', 'tree_side.png', 'tree_top.png'
];
const UI_PNGS = ['pickaxe.png'];
const APPLICATION_MODULES = [
  'blocks.js', 'dataStore.js', 'main.js', 'modelLoader.js', 'physics.js',
  'player.js', 'rng.js', 'ui.js', 'world.js', 'worldChunk.js'
];
const slash = value => value.split(path.sep).join('/');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const record = bytes => ({ bytes: bytes.length, sha256: sha(bytes) });
const json = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);

function usage() {
  return 'Usage: node tool/three_minecraft_stress/prepare.mjs [--ref <dir>] [--source <r186-dir>] [--out <external-dir>] [--draw-distance 0..5] [--storage-write-through] [--offline] [--verify]';
}

function optionValue(argv, index, name) {
  const arg = argv[index];
  if (arg === name) {
    if (index + 1 >= argv.length) throw new Error(`${name} requires a value`);
    return { value: argv[index + 1], next: index + 1 };
  }
  if (arg.startsWith(`${name}=`)) {
    const value = arg.slice(name.length + 1);
    if (!value) throw new Error(`${name} requires a value`);
    return { value, next: index };
  }
  return null;
}

function parseArgs(argv) {
  const options = {
    ref: process.env.MINECRAFT_REF || DEFAULT_REF,
    source: process.env.THREE_SRC || '/tmp/jsr-three-r186',
    out: process.env.JSR_MINECRAFT_STRESS_OUT || DEFAULT_OUT,
    drawDistance: 3,
    storageWriteThrough: false,
    verify: false
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    } else if (arg === '--offline') {
      // Always offline; the flag makes that guarantee explicit at call sites.
    } else if (arg === '--verify') {
      options.verify = true;
    } else if (arg === '--storage-write-through') {
      options.storageWriteThrough = true;
    } else {
      let matched = false;
      for (const [flag, key] of [
        ['--ref', 'ref'], ['--source', 'source'], ['--out', 'out'],
        ['--draw-distance', 'drawDistance']
      ]) {
        const parsed = optionValue(argv, i, flag);
        if (!parsed) continue;
        options[key] = parsed.value;
        i = parsed.next;
        matched = true;
        break;
      }
      if (!matched) throw new Error(`Unknown argument: ${arg}\n${usage()}`);
    }
  }
  options.drawDistance = Number(options.drawDistance);
  if (!Number.isInteger(options.drawDistance) || options.drawDistance < 0 || options.drawDistance > 5) {
    throw new Error('--draw-distance must be an integer from 0 through 5');
  }
  for (const key of ['ref', 'source', 'out']) options[key] = path.resolve(options[key]);
  return options;
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
  return result.sort();
}

async function sourceTreeHash(source) {
  const hash = createHash('sha256');
  const groups = [
    'src', 'examples/jsm/loaders/GLTFLoader.js',
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
  if (!(await stat(source)).isDirectory()) throw new Error(`THREE source is not a directory: ${source}`);
  const revision = JSON.parse(await readFile(path.join(source, 'package.json'), 'utf8'));
  if (revision.version !== '0.186.1') {
    throw new Error(`Expected three.js 0.186.1 (r186), got ${revision.version}; REF/node_modules is forbidden`);
  }
  try {
    const commit = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], {
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim();
    if (commit !== PIN.commit) throw new Error(`three.js source is ${commit}, expected ${PIN.commit}`);
  } catch (error) {
    if (error.message && error.message.includes('expected')) throw error;
    // Source archives have no git metadata; the complete tree digest is the pin.
  }
  const tree = await sourceTreeHash(source);
  if (tree.hash !== PIN.treeSha256 || tree.files.length !== PIN.sourceFilesHashed) {
    throw new Error(`three.js source digest ${tree.hash} (${tree.files.length} files) does not match pinned ${PIN.treeSha256} (${PIN.sourceFilesHashed} files)`);
  }
  return tree;
}

function addonPath(source, specifier) {
  const prefix = specifier.startsWith('three/addons/')
    ? 'three/addons/' : 'three/examples/jsm/';
  const relative = specifier.slice(prefix.length);
  const root = path.join(source, 'examples/jsm');
  const resolved = path.resolve(root, relative);
  if (!relative || relative.includes('\0') || !inside(root, resolved)) {
    throw new Error(`Invalid pinned addon path: ${specifier}`);
  }
  return resolved;
}

function forbiddenRemote(args) {
  return { errors: [{ text: `Remote/non-local imports are forbidden: ${args.path}` }] };
}

function discoveryPlugin(source) {
  return {
    name: 'jsr-stress-r186-export-discovery',
    setup(build) {
      build.onResolve({ filter: /^three$/ }, args => ({
        path: args.importer.startsWith(path.join(source, 'examples/'))
          ? path.join(CORE, 'src/native_three_shim.js')
          : path.join(source, 'src/Three.js')
      }));
      build.onResolve({ filter: /^three\/(?:addons|examples\/jsm)\// }, args => ({
        path: addonPath(source, args.path)
      }));
      build.onResolve({ filter: /^(?:https?:|data:|node:|npm:|jsr:)|^\/\// }, forbiddenRemote);
      build.onResolve({ filter: /^[^./]/ }, args => {
        if (args.kind === 'entry-point') return undefined;
        return { errors: [{ text: `Unknown bare import is forbidden: ${args.path}` }] };
      });
    }
  };
}

async function discoverExports(source) {
  const result = await esbuild.build({
    absWorkingDir: ROOT,
    entryPoints: [path.join(CORE, 'src/native_entry.js')],
    outfile: path.join(ROOT, 'build/jsr_stress_export_discovery.js'),
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    target: ['es2020'],
    metafile: true,
    treeShaking: false,
    logLevel: 'silent',
    plugins: [discoveryPlugin(source)],
    define: { __THREE_DEVTOOLS__: 'undefined' }
  });
  const output = Object.values(result.metafile.outputs).find(item => item.entryPoint);
  if (!output || !Array.isArray(output.exports)) throw new Error('esbuild did not report native THREE exports');
  const names = [...new Set(output.exports)].sort();
  for (const required of [
    'FileLoader', 'GLTFLoader', 'PerspectiveCamera', 'Scene', 'TextureLoader',
    'Timer', 'WebGLRenderer'
  ]) {
    if (!names.includes(required)) throw new Error(`Pinned native facade omitted ${required}`);
  }
  return names;
}

function facadeModule(names) {
  const lines = [
    "import { StressWebGLRenderer } from './stress_renderer.js';",
    'const __three = globalThis.THREE;',
    "if (!__three) throw new Error('three-minecraft-stress: evaluate three.native.js first');",
    "if (__three.REVISION !== '186') throw new Error('three-minecraft-stress: pinned r186 is required');"
  ];
  const bindings = [];
  for (const [index, name] of names.entries()) {
    if (name === 'WebGLRenderer') continue;
    const local = `__threeExport${index}`;
    lines.push(`const ${local} = __three[${JSON.stringify(name)}];`);
    bindings.push(`${local} as ${name}`);
  }
  bindings.push('StressWebGLRenderer as WebGLRenderer');
  lines.push(`export { ${bindings.join(', ')} };`, '');
  return lines.join('\n');
}

function transformMain(original, drawDistance) {
  const source = original.toString('utf8');
  const first = source.indexOf(MAIN_ANCHOR);
  if (first < 0 || source.indexOf(MAIN_ANCHOR, first + MAIN_ANCHOR.length) >= 0) {
    throw new Error('Expected exactly one const world = new World() anchor');
  }
  const insertion = first + MAIN_ANCHOR.length;
  const following = source.slice(insertion).match(/^\r?\n/);
  if (!following || !source.slice(insertion + following[0].length).startsWith(GENERATE_ANCHOR)) {
    throw new Error('world.generate() must immediately follow the World constructor');
  }
  if (drawDistance === 3) {
    return {
      bytes: original,
      manifest: {
        file: 'reference/scripts/main.js',
        mode: 'original bytes; upstream default drawDistance=3',
        originalAnchor: MAIN_ANCHOR,
        requiredFollowingStatement: GENERATE_ANCHOR,
        injectedText: null,
        marker: INJECTION_MARKER,
        drawDistance,
        original: record(original),
        transformed: record(original),
        onlyApplicationSourceTransform: false
      }
    };
  }
  const injectedText = `\n${INJECTION_MARKER} world.drawDistance = ${drawDistance};`;
  const transformed = `${source.slice(0, insertion)}${injectedText}${source.slice(insertion)}`;
  const transformedBytes = Buffer.from(transformed);
  return {
    bytes: transformedBytes,
    manifest: {
      file: 'reference/scripts/main.js',
      mode: 'in-memory esbuild onLoad; original bytes are never written',
      originalAnchor: MAIN_ANCHOR,
      requiredFollowingStatement: GENERATE_ANCHOR,
      injectedText,
      marker: INJECTION_MARKER,
      drawDistance,
      original: record(original),
      transformed: record(transformedBytes),
      onlyApplicationSourceTransform: true
    }
  };
}

function finalPlugin({ source, ref, facadeSource, mainBytes }) {
  const allowedRoots = [HERE, path.join(ref, 'scripts'), path.join(source, 'examples/jsm')];
  return {
    name: 'jsr-minecraft-stress-local-only',
    setup(build) {
      build.onResolve({ filter: /^three$/ }, () => ({ path: 'three', namespace: 'jsr-stress-facade' }));
      build.onResolve({ filter: /^three\/(?:addons|examples\/jsm)\/libs\/stats\.module\.js$/ }, () => ({
        path: path.join(HERE, 'stats_adapter.js')
      }));
      build.onResolve({ filter: /^three\/(?:addons|examples\/jsm)\/libs\/lil-gui\.module\.min\.js$/ }, () => ({
        path: path.join(HERE, 'ui_adapter.js')
      }));
      build.onResolve({ filter: /^three\/(?:addons|examples\/jsm)\// }, args => ({
        path: addonPath(source, args.path)
      }));
      build.onResolve({ filter: /^\.\/reference_main\.js$/ }, () => ({
        path: 'reference_main.js', namespace: 'jsr-stress-reference'
      }));
      build.onResolve({ filter: /^(?:https?:|data:|node:|npm:|jsr:)|^\/\// }, forbiddenRemote);
      build.onResolve({ filter: /^[^./]/ }, args => {
        if (args.kind === 'entry-point') return undefined;
        return { errors: [{ text: `Unknown bare import is forbidden: ${args.path}` }] };
      });
      build.onLoad({ filter: /^three$/, namespace: 'jsr-stress-facade' }, () => ({
        contents: facadeSource, loader: 'js', resolveDir: HERE
      }));
      build.onLoad({ filter: /^reference_main\.js$/, namespace: 'jsr-stress-reference' }, () => ({
        contents: mainBytes, loader: 'js', resolveDir: path.join(ref, 'scripts')
      }));
      build.onLoad({ filter: /.*/ }, args => {
        if (args.namespace !== 'file') return undefined;
        if (allowedRoots.some(root => inside(root, args.path))) return undefined;
        return { errors: [{ text: `Import is outside finite local roots: ${args.path}` }] };
      });
    }
  };
}

function pngDimensions(bytes) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || signature.some((value, index) => bytes[index] !== value)) {
    throw new Error('Registered block asset is not a PNG');
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (!width || !height) throw new Error('PNG dimensions must be nonzero');
  return { width, height };
}

function sortedRecordMap(values) {
  return Object.fromEntries(Object.keys(values).sort().map(key => [key, values[key]]));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (inside(ROOT, options.out) || inside(options.ref, options.out)) {
    throw new Error(`Generated output must stay outside the package and reference: ${options.out}`);
  }
  const [ref, source] = await Promise.all([realpath(options.ref), realpath(options.source)]);
  const tree = await verifySource(source);
  const originalMain = await readFile(path.join(ref, 'scripts/main.js'));
  const transformed = transformMain(originalMain, options.drawDistance);
  const exportNames = await discoverExports(source);
  const facadeSource = facadeModule(exportNames);

  const assets = {};
  const assetManifest = {};
  for (const name of [...BLOCK_PNGS, ...UI_PNGS]) {
    const url = `textures/${name}`;
    const bytes = await readFile(path.join(ref, 'public', url));
    const dimensions = pngDimensions(bytes);
    assets[url] = { data: bytes.toString('base64'), mime: 'image/png', ...dimensions };
    assetManifest[url] = { ...record(bytes), mime: 'image/png', ...dimensions, localBase64: true };
  }
  const modelUrl = 'models/pickaxe.glb';
  const modelBytes = await readFile(path.join(ref, 'public', modelUrl));
  assets[modelUrl] = { data: modelBytes.toString('base64'), mime: 'model/gltf-binary' };
  assetManifest[modelUrl] = { ...record(modelBytes), mime: 'model/gltf-binary', localBase64: true };

  const result = await esbuild.build({
    absWorkingDir: ROOT,
    stdin: {
      contents: "import './native_adapter.js';\nimport './reference_main.js';\n",
      resolveDir: HERE,
      sourcefile: 'three-minecraft-stress-entry.js',
      loader: 'js'
    },
    outfile: path.join(options.out, 'widget.js'),
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
    plugins: [finalPlugin({
      source, ref, facadeSource, mainBytes: transformed.bytes
    })],
    define: {
      __THREE_DEVTOOLS__: 'undefined',
      __JSR_MINECRAFT_ASSETS__: JSON.stringify(assets),
      __JSR_MINECRAFT_DRAW_DISTANCE__: String(options.drawDistance),
      __JSR_MINECRAFT_STORAGE_WRITE_THROUGH__: options.storageWriteThrough ? 'true' : 'false'
    }
  });
  if (result.outputFiles.length !== 1) throw new Error(`Expected one widget output, got ${result.outputFiles.length}`);
  const widget = Buffer.from(result.outputFiles[0].contents);
  for (const input of Object.keys(result.metafile.inputs)) {
    const absolute = path.isAbsolute(input) ? input : path.resolve(ROOT, input);
    if (inside(path.join(source, 'src'), absolute)) {
      throw new Error(`A second THREE core copy entered the widget: ${input}`);
    }
  }

  const license = await readFile(path.join(source, 'LICENSE'));
  const runnerManifest = json({
    schema: 'jsr-three-minecraft-stress-v1',
    id: 'three-minecraft-stress',
    name: 'Minecraft.js — original graph / THREE r186 native stress',
    version: '0.1.0',
    widget: { entry: 'widget.js', interactive: true },
    network: false,
    upstream: { name: 'three.js', version: '0.186.1', revision: '186' },
    reference: {
      name: 'minecraft-threejs-clone', application: 'Minecraft.js',
      entry: 'scripts/main.js', license: 'none-present', publish: false
    },
    profile: {
      name: 'native-parity', drawDistance: options.drawDistance,
      originalDrawDistance: 3,
      storageWriteThrough: options.storageWriteThrough,
      linearFog: true,
      directionalShadowMap: 'first light; native R32 depth with 3x3 PCF'
    },
    details: 'prepare_manifest.json',
    visualParity: false
  });
  const outputBytes = {
    'THREE_LICENSE': license,
    'manifest.json': runnerManifest,
    'widget.js': widget
  };

  const inputs = {};
  async function addInput(label, bytes) {
    if (!inputs[label]) inputs[label] = record(bytes);
  }
  for (const file of APPLICATION_MODULES) {
    await addInput(`reference/scripts/${file}`, await readFile(path.join(ref, 'scripts', file)));
  }
  for (const file of ['index.html', 'style.css', 'package.json', 'package-lock.json', 'vite.config.js']) {
    await addInput(`reference/${file}`, await readFile(path.join(ref, file)));
  }
  for (const [url, item] of Object.entries(assetManifest)) {
    await addInput(`reference/public/${url}`, await readFile(path.join(ref, 'public', url)));
    item.input = `reference/public/${url}`;
  }
  for (const file of (await filesBelow(HERE))) {
    if (file === 'prepare.mjs' || file.endsWith('.js')) await addInput(`tool/three_minecraft_stress/${file}`, await readFile(path.join(HERE, file)));
  }
  for (const file of ['source-pin.json', 'src/native_entry.js']) {
    await addInput(`tool/three/${file}`, await readFile(path.join(CORE, file)));
  }
  await addInput('assets/three/three.native.js', await readFile(path.join(ROOT, 'assets/three/three.native.js')));
  await addInput('source/LICENSE', license);
  for (const input of Object.keys(result.metafile.inputs)) {
    if (input.startsWith('jsr-stress-') || input.startsWith('<') || path.basename(input) === 'three-minecraft-stress-entry.js') continue;
    const absolute = path.isAbsolute(input) ? input : path.resolve(ROOT, input);
    let label;
    if (inside(source, absolute)) label = `source/${slash(path.relative(source, absolute))}`;
    else if (inside(ref, absolute)) label = `reference/${slash(path.relative(ref, absolute))}`;
    else if (inside(ROOT, absolute)) label = slash(path.relative(ROOT, absolute));
    else throw new Error(`Cannot label build input ${input}`);
    await addInput(label, await readFile(absolute));
  }

  const graphInputs = Object.keys(result.metafile.inputs).sort();
  const prepareManifest = json({
    schema: 'jsr-three-minecraft-stress-prepare-v1',
    id: 'three-minecraft-stress',
    upstream: {
      name: 'three.js', version: '0.186.1', revision: '186', license: 'MIT',
      sourceCommit: PIN.commit, sourceTagObject: PIN.tagObject,
      sourceTreeSha256: tree.hash, sourceFilesHashed: tree.files.length,
      forbiddenFallback: 'REF/node_modules/three (0.156.x)'
    },
    reference: {
      name: 'minecraft-threejs-clone', application: 'Minecraft.js',
      entry: 'scripts/main.js', modules: APPLICATION_MODULES,
      license: 'No LICENSE file; local generated artifacts only; never publish',
      originalFilesModified: false
    },
    tools: { node: process.version, esbuild: esbuild.version, esbuildRequire: 'tool/three/package.json' },
    build: {
      format: 'iife', platform: 'neutral', target: 'es2020', minify: true,
      offline: true, remoteResolution: false, networkFetch: false,
      adapterOrder: 'native_adapter.js before the original main.js graph',
      addonMappings: ['three/addons/*', 'three/examples/jsm/*'],
      statsAlias: 'stats_adapter.js', lilGuiAlias: 'ui_adapter.js',
      graphInputs
    },
    facade: {
      global: 'globalThis.THREE', exports: exportNames,
      renderer: 'StressWebGLRenderer extends the JSR native WebGLRenderer',
      source: record(Buffer.from(facadeSource))
    },
    transform: transformed.manifest,
    assets: {
      count: Object.keys(assetManifest).length,
      blockPngs: BLOCK_PNGS.length,
      toolbarPngs: UI_PNGS.length,
      models: 1,
      entries: sortedRecordMap(assetManifest),
      embeddedGlbImages: 'finite bounded Blob/object-URL adapter; no GLTFLoader rewrite'
    },
    inputs: sortedRecordMap(inputs),
    outputs: sortedRecordMap(Object.fromEntries(
      Object.entries(outputBytes).map(([name, bytes]) => [name, record(bytes)])
    ))
  });
  outputBytes['prepare_manifest.json'] = prepareManifest;

  if (options.verify) {
    for (const name of Object.keys(outputBytes).sort()) {
      const existing = await readFile(path.join(options.out, name));
      if (!existing.equals(outputBytes[name])) throw new Error(`${name} differs from a clean pinned prepare`);
    }
  } else {
    await mkdir(options.out, { recursive: true });
    for (const name of Object.keys(outputBytes).sort()) await writeFile(path.join(options.out, name), outputBytes[name]);
  }
  console.log(JSON.stringify({
    prepared: 'three-minecraft-stress', verified: options.verify,
    output: options.out, offline: true, drawDistance: options.drawDistance,
    referenceUnmodified: true, sourceCommit: PIN.commit,
    assets: { blockPngs: 17, toolbarPngs: 1, models: 1 },
    outputs: Object.fromEntries(Object.entries(outputBytes).map(([name, bytes]) => [name, record(bytes)]))
  }, null, 2));
}

main().catch(error => {
  console.error(`three-minecraft-stress prepare failed: ${error.message}`);
  process.exitCode = 1;
});
