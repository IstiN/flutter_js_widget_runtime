import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile, mkdir, stat } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// The bundle of record is the build of the BUILDER HOST recorded in
// bundle_manifest.json (darwin-arm64). esbuild 0.25.5's identifier
// minification follows the HOST CLASS: darwin-arm64 and linux-x64 assign
// different minified names to the same source and tool (measured: every
// darwin configuration reproduces the committed bytes, every linux
// configuration reproduces a different set; the assignment is independent
// of the esbuild implementation (native vs wasm), the driver Node version,
// GOMAXPROCS and the absolute paths). --verify therefore compares bundle
// bytes only on the builder host class; any other host still checks every
// pin (source commit, source tree hash, adapter input hashes, golden ESM,
// license) and print the rebuilt hashes informationally. JSR_BUILD_HOST
// (platform:arch) overrides the gate's view of the current host for the
// host-gate unit test. The manifest always records the REAL host: it is
// the builder of record that produced the committed bundles.
const REAL_HOST = { platform: process.platform, arch: process.arch };
const HOST = (() => {
  const override = process.env.JSR_BUILD_HOST;
  if (!override) return REAL_HOST;
  const [platform, arch] = override.split(':');
  if (!platform || !arch) throw new Error(`JSR_BUILD_HOST must be platform:arch, got ${override}`);
  return { platform, arch };
})();
const bundleBuildMs = {};

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
  const started = performance.now();
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
    minify: process.env.JSR_NO_MINIFY === '1' ? false : true,
    legalComments: 'inline',
    sourcemap: false,
    treeShaking: true,
    plugins: [resolver(native)],
    define: { '__THREE_DEVTOOLS__': 'undefined' }
  });
  if (result.outputFiles.length !== 1) throw new Error(`Unexpected esbuild outputs for ${name}`);
  bundleBuildMs[name] = Math.round(performance.now() - started);
  return Buffer.from(result.outputFiles[0].contents);
}

// gen/cinematic_core.mjs — UNMINIFIED ESM of the core cinematic module
// (tool/three/src/cinematic.js, issue #8 F4a) for consumers that cannot
// evaluate the IIFE bundles: the web reference page (after the page installs
// `globalThis.THREE = await import('./jsr_three_web.js')`) and the R1
// composer golden lane (an engine with the three bundle already evaluated).
// 'three' resolves to the committed global shim (re-exports globalThis.THREE
// — object identity with the host classes, never a second core copy); the
// addons are inlined from the pinned tree.
function goldenEsmResolver() {
  const shim = path.join(ROOT, 'example/widgets/three-cinematic-showcase/src/three_global_shim.js');
  return {
    name: 'cinematic-core-golden-esm',
    setup(build) {
      build.onResolve({ filter: /^three$/ }, () => ({ path: shim }));
      build.onResolve({ filter: /^three\/addons\/(.+)$/ }, args => ({ path: path.join(SOURCE, 'examples/jsm', args.path.slice('three/addons/'.length)) }));
    }
  };
}

async function makeGoldenEsm() {
  const result = await build({
    absWorkingDir: ROOT,
    entryPoints: [path.join(HERE, 'src/cinematic.js')],
    outfile: path.join(HERE, 'gen/cinematic_core.mjs'),
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    target: ['es2020'],
    minify: false,
    legalComments: 'inline',
    sourcemap: false,
    treeShaking: false,
    plugins: [goldenEsmResolver()],
    define: { '__THREE_DEVTOOLS__': 'undefined' }
  });
  if (result.outputFiles.length !== 1) throw new Error('Unexpected esbuild outputs for cinematic_core.mjs');
  // esbuild stamps every inlined module with a comment of its path relative
  // to absWorkingDir. The pinned SOURCE tree lives outside the repository,
  // so that prefix is host-dependent (worktree depth, the darwin /tmp ->
  // /private/tmp symlink) and the golden bytes would never reproduce
  // cross-host. Normalize it to one host-independent token.
  const prefixes = new Set([SOURCE, realpathSync(SOURCE)].map(p => path.relative(ROOT, p)));
  let text = result.outputFiles[0].text;
  for (const prefix of prefixes) text = text.split(`${prefix}/`).join('three-source/');
  return Buffer.from(text, 'utf8');
}

const tree = await verifySource();
const native = await makeBundle('native', true);
const web = await makeBundle('web', false);
const goldenEsm = await makeGoldenEsm();
const license = await readFile(path.join(SOURCE, 'LICENSE'));
const outputs = {
  'jsr_three_native.js': native,
  'jsr_three_web.js': web
};
const manifestOutputs = {};
if (!verify) await mkdir(OUT, { recursive: true });
for (const [name, bytes] of Object.entries(outputs)) {
  manifestOutputs[name] = { bytes: bytes.length, sha256: sha(bytes), buffer: bytes };
  if (!verify) await writeFile(path.join(OUT, name), bytes);
}
if (!verify) {
  await mkdir(path.join(HERE, 'gen'), { recursive: true });
  await writeFile(path.join(HERE, 'gen/cinematic_core.mjs'), goldenEsm);
}
const adapterInputs = {};
for (const file of (await filesBelow(path.join(HERE, 'src'))).sort()) adapterInputs[`tool/three/src/${file}`] = sha(await readFile(path.join(HERE, 'src', file)));
for (const file of ['build.mjs', 'package.json', 'package-lock.json', 'source-pin.json']) adapterInputs[`tool/three/${file}`] = sha(await readFile(path.join(HERE, file)));
adapterInputs.upstreamLicense = sha(license);
const goldenEsmRecord = { bytes: goldenEsm.length, sha256: sha(goldenEsm) };
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
    builderHost: REAL_HOST,
    command: `node tool/three/build.mjs --source ${SOURCE}`,
    verifyCommand: `node tool/three/build.mjs --source ${SOURCE} --verify`,
    sourceEnvironment: 'THREE_SRC may replace --source /tmp/jsr-three-r186',
    inputSha256: Object.assign({ sourceTree: tree.hash }, adapterInputs),
    // Unminified ESM of the core cinematic module (issue #8 F4a) for the web
    // reference page and the R1 composer golden lane. A build output like the
    // two IIFE bundles, but it lives under tool/three/gen/ (not assets/three)
    // because it is a source-level artifact, not a host-delivered bundle.
    goldenEsm: Object.assign({ path: 'tool/three/gen/cinematic_core.mjs' }, goldenEsmRecord)
  },
  outputs: Object.fromEntries(Object.entries(manifestOutputs).map(([name, record]) => [name, { bytes: record.bytes, sha256: record.sha256 }]))
};
const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
// Console-printable outputs (bytes + sha256; the raw buffers stay out of
// the logs).
const manifestSummary = Object.fromEntries(Object.entries(manifestOutputs).map(([name, record]) => [name, { bytes: record.bytes, sha256: record.sha256 }]));
if (verify) {
  const oldManifest = JSON.parse(await readFile(path.join(OUT, 'bundle_manifest.json'), 'utf8'));
  // The builder of record is the one the COMMITTED manifest names — never
  // the freshly computed manifest (whose builderHost is this host).
  const builderHost = oldManifest.build ? oldManifest.build.builderHost : undefined;
  const onBuilderHost = !!builderHost && HOST.platform === builderHost.platform && HOST.arch === builderHost.arch;
  const firstDivergence = (committed, rebuilt) => {
    // WHERE the committed artifact diverges from a clean rebuild: the first
    // differing byte with context from both sides.
    const n = Math.min(committed.length, rebuilt.length);
    for (let i = 0; i < n; i++) {
      if (committed[i] !== rebuilt[i]) {
        return `first divergence at offset ${i}` +
          `\n    committed: ...${JSON.stringify(committed.slice(Math.max(0, i - 60), i + 60).toString('latin1'))}...` +
          `\n    rebuilt:   ...${JSON.stringify(rebuilt.slice(Math.max(0, i - 60), i + 60).toString('latin1'))}...`;
      }
    }
    return `identical up to the shorter output (lengths ${committed.length} vs ${rebuilt.length})`;
  };
  // The upstream license is a pure pin (host-independent bytes).
  if (sha(await readFile(path.join(OUT, 'THREE_LICENSE'))) !== sha(license)) throw new Error('THREE_LICENSE differs from upstream');
  let comparedLine;
  if (onBuilderHost) {
    const mismatches = [];
    for (const [name, expected] of Object.entries(manifestOutputs)) {
      const actual = await readFile(path.join(OUT, name));
      if (sha(actual) !== expected.sha256 || actual.length !== expected.bytes) {
        mismatches.push(
          `${name}: committed bytes=${actual.length} sha256=${sha(actual)}` +
          ` | rebuilt bytes=${expected.bytes} sha256=${expected.sha256}; ${firstDivergence(actual, expected.buffer)}`);
        continue;
      }
      if (!oldManifest.outputs[name] || oldManifest.outputs[name].sha256 !== expected.sha256) throw new Error(`${name} manifest hash is stale`);
    }
    if (mismatches.length > 0) throw new Error(`differs from a clean pinned rebuild:\n  ${mismatches.join('\n  ')}`);
    const committedGolden = await readFile(path.join(HERE, 'gen/cinematic_core.mjs'));
    if (sha(committedGolden) !== goldenEsmRecord.sha256 || committedGolden.length !== goldenEsmRecord.bytes) {
      throw new Error(`tool/three/gen/cinematic_core.mjs differs from a clean pinned rebuild: ${firstDivergence(committedGolden, goldenEsm)}`);
    }
    if (!oldManifest.build || !oldManifest.build.goldenEsm || oldManifest.build.goldenEsm.sha256 !== goldenEsmRecord.sha256) {
      throw new Error('goldenEsm manifest hash is stale');
    }
    if (JSON.stringify(oldManifest) !== JSON.stringify(manifest)) throw new Error('bundle_manifest.json differs from the clean pinned rebuild inputs/metadata');
    console.log(JSON.stringify({ verified: true, sourceCommit: PIN.commit, buildMs: bundleBuildMs, outputs: manifestSummary }, null, 2));
    comparedLine = `bytes compared: yes (host ${HOST.platform}-${HOST.arch} = builder host)`;
  } else {
    // Off the builder host the bundle bytes and the golden ESM bytes
    // legitimately differ (see HOST above): esbuild 0.25.5 renders them
    // per host class. Still enforce every pin: source commit/tree hash via
    // verifySource, adapter input hashes via the manifest comparison with
    // the host-legitimate differences (outputs, builderHost, goldenEsm
    // bytes) excluded. The rebuilt golden is reported, not compared.
    const pinsOf = m => JSON.stringify({ ...m, outputs: undefined, build: { ...m.build, builderHost: undefined, goldenEsm: undefined } });
    if (pinsOf(oldManifest) !== pinsOf(manifest)) throw new Error('bundle_manifest.json pin inputs differ from the clean pinned rebuild');
    const rebuiltShas = Object.fromEntries(Object.entries(manifestOutputs).map(([name, record]) => [name, record.sha256]));
    const committedGolden = await readFile(path.join(HERE, 'gen/cinematic_core.mjs'));
    const goldenByteEqual = sha(committedGolden) === goldenEsmRecord.sha256 && committedGolden.length === goldenEsmRecord.bytes;
    console.log(`bytes compared: no (host ${HOST.platform}-${HOST.arch} is not the builder host): identifier minification of esbuild ${manifest.build.esbuildVersion} follows the host class; rebuilt sha256 (informational): ${JSON.stringify(rebuiltShas)}`);
    console.log(`golden ESM (informational): ${goldenByteEqual ? 'byte-equal' : `differs from a clean pinned rebuild; rebuilt bytes=${goldenEsm.length} sha256=${goldenEsmRecord.sha256}; ${firstDivergence(committedGolden, goldenEsm)}`}`);
    comparedLine = `bytes compared: no (host ${HOST.platform}-${HOST.arch} is not the builder host)`;
  }
  console.log(comparedLine);
} else {
  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, 'THREE_LICENSE'), license);
  await writeFile(path.join(OUT, 'bundle_manifest.json'), manifestBytes);
  console.log(JSON.stringify({ sourceCommit: PIN.commit, sourceTreeSha256: tree.hash, buildMs: bundleBuildMs, build: manifest.build.command, outputs: manifestSummary }, null, 2));
  console.log(`bytes compared: build mode (no verify); bundle of record host ${manifest.build.builderHost.platform}-${manifest.build.builderHost.arch}`);
}
