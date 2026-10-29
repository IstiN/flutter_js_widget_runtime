import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const OUT = path.join(ROOT, 'assets/three');
const PIN = JSON.parse(await readFile(path.join(HERE, 'source-pin.json'), 'utf8'));
const args = process.argv.slice(2);
const sourceArg = args.indexOf('--source');
const SOURCE = path.resolve(sourceArg >= 0 ? args[sourceArg + 1] : process.env.THREE_SRC || '/tmp/jsr-three-r186');
const verify = args.includes('--verify');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

async function filesBelow(directory, relative = '') {
  const result = [];
  for (const entry of (await readdir(path.join(directory, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) result.push(...await filesBelow(directory, name));
    else if (entry.isFile()) result.push(name);
  }
  return result;
}

async function sourceTreeHash() {
  const hash = createHash('sha256');
  const groups = ['src', 'examples/jsm/loaders/GLTFLoader.js', 'examples/jsm/utils/BufferGeometryUtils.js', 'examples/jsm/utils/SkeletonUtils.js'];
  const files = [];
  for (const group of groups) {
    const absolute = path.join(SOURCE, group);
    if ((await stat(absolute)).isDirectory()) files.push(...(await filesBelow(absolute)).map(name => `${group}/${name}`));
    else files.push(group);
  }
  files.sort();
  for (const file of files) {
    hash.update(file); hash.update('\0');
    hash.update(await readFile(path.join(SOURCE, file))); hash.update('\0');
  }
  return { hash: hash.digest('hex'), files };
}

async function verifySource() {
  if ((await stat(SOURCE)).isDirectory() === false) throw new Error(`THREE_SRC is not a directory: ${SOURCE}`);
  const revision = JSON.parse(await readFile(path.join(SOURCE, 'package.json'), 'utf8'));
  if (revision.version !== '0.186.1') throw new Error(`Expected three.js 0.186.1, got ${revision.version}`);
  try {
    const commit = execFileSync('git', ['-C', SOURCE, 'rev-parse', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (commit !== PIN.commit) throw new Error(`three.js source is ${commit}, expected ${PIN.commit}`);
  } catch (error) {
    if (error.message && error.message.includes('expected')) throw error;
    // The supplied source archive intentionally has no .git directory. The
    // complete source-input digest below is the archive's immutable pin check.
  }
  const tree = await sourceTreeHash();
  if (tree.hash !== PIN.treeSha256) throw new Error(`three.js source digest ${tree.hash} does not match pinned ${PIN.treeSha256}; use the r186 archive at ${PIN.commit}`);
  return tree;
}

function resolver(native) {
  const upstream = path.join(SOURCE, 'src/Three.js');
  const shim = path.join(HERE, 'src/native_three_shim.js');
  return {
    name: native ? 'pinned-three-native' : 'pinned-three-web',
    setup(build) {
      build.onResolve({ filter: /^three$/ }, args => {
        if (native && args.importer.startsWith(path.join(SOURCE, 'examples/'))) return { path: shim };
        return { path: upstream };
      });
      build.onResolve({ filter: /^three\/addons\/(.+)$/ }, args => ({ path: path.join(SOURCE, 'examples/jsm', args.path.slice('three/addons/'.length)) }));
    }
  };
}

async function makeBundle(name, native) {
  const result = await build({
    absWorkingDir: ROOT,
    entryPoints: [path.join(HERE, `src/${name}_entry.js`)],
    outfile: path.join(OUT, native ? 'jsr_three_native.js' : 'jsr_three_web.js'),
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'THREE',
    platform: 'neutral',
    target: ['es2020'],
    minify: true,
    legalComments: 'inline',
    sourcemap: false,
    treeShaking: true,
    plugins: [resolver(native)],
    define: { '__THREE_DEVTOOLS__': 'undefined' }
  });
  if (result.outputFiles.length !== 1) throw new Error(`Unexpected esbuild outputs for ${name}`);
  return Buffer.from(result.outputFiles[0].contents);
}

const tree = await verifySource();
const native = await makeBundle('native', true);
const web = await makeBundle('web', false);
const license = await readFile(path.join(SOURCE, 'LICENSE'));
const outputs = {
  'jsr_three_native.js': native,
  'jsr_three_web.js': web,
  'three.native.js': native,
  'three.web.js': web
};
const manifestOutputs = {};
if (!verify) await mkdir(OUT, { recursive: true });
for (const [name, bytes] of Object.entries(outputs)) {
  manifestOutputs[name] = { bytes: bytes.length, sha256: sha(bytes) };
  if (!verify) await writeFile(path.join(OUT, name), bytes);
}
const adapterInputs = {};
for (const file of (await filesBelow(path.join(HERE, 'src'))).sort()) adapterInputs[`tool/three/src/${file}`] = sha(await readFile(path.join(HERE, 'src', file)));
for (const file of ['build.mjs', 'package.json', 'package-lock.json', 'source-pin.json']) adapterInputs[`tool/three/${file}`] = sha(await readFile(path.join(HERE, file)));
adapterInputs.upstreamLicense = sha(license);
const manifest = {
  protocol: 'JSR3D-T1/R1-v2',
  upstream: {
    name: 'three.js', version: '0.186.1', revision: '186', license: 'MIT',
    sourceCommit: PIN.commit, sourceTagObject: PIN.tagObject,
    sourceTreeSha256: tree.hash, sourceFilesHashed: tree.files.length,
    source: 'https://github.com/mrdoob/three.js',
    notice: 'assets/three/THREE_LICENSE'
  },
  build: {
    tool: 'esbuild', esbuildVersion: '0.25.5', format: 'iife', global: 'THREE', target: 'es2020', minify: true,
    command: `node tool/three/build.mjs --source ${SOURCE}`,
    verifyCommand: `node tool/three/build.mjs --source ${SOURCE} --verify`,
    sourceEnvironment: 'THREE_SRC may replace --source /tmp/jsr-three-r186',
    inputSha256: Object.assign({ sourceTree: tree.hash }, adapterInputs)
  },
  outputs: manifestOutputs
};
const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
if (verify) {
  const oldManifest = JSON.parse(await readFile(path.join(OUT, 'bundle_manifest.json'), 'utf8'));
  for (const [name, expected] of Object.entries(manifestOutputs)) {
    const actual = await readFile(path.join(OUT, name));
    if (sha(actual) !== expected.sha256 || actual.length !== expected.bytes) throw new Error(`${name} differs from a clean pinned rebuild`);
    if (!oldManifest.outputs[name] || oldManifest.outputs[name].sha256 !== expected.sha256) throw new Error(`${name} manifest hash is stale`);
  }
  if (sha(await readFile(path.join(OUT, 'THREE_LICENSE'))) !== sha(license)) throw new Error('THREE_LICENSE differs from upstream');
  if (JSON.stringify(oldManifest) !== JSON.stringify(manifest)) throw new Error('bundle_manifest.json differs from the clean pinned rebuild inputs/metadata');
  console.log(JSON.stringify({ verified: true, sourceCommit: PIN.commit, outputs: manifestOutputs }, null, 2));
} else {
  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, 'THREE_LICENSE'), license);
  await writeFile(path.join(OUT, 'bundle_manifest.json'), manifestBytes);
  console.log(JSON.stringify({ sourceCommit: PIN.commit, sourceTreeSha256: tree.hash, build: manifest.build.command, outputs: manifestOutputs }, null, 2));
}
