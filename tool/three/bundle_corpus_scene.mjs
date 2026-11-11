// bundle_corpus_scene.mjs — M4 corpus: bundle a widget's official_module.js
// (raw upstream three.js r186 example) into a single IIFE scene artifact that
// both the 1B harness (run_1b_corpus.dart) and the web ref (ref_1b_corpus.cjs)
// evaluate byte-identically.
//
// Resolution:
//   'three'                          -> generated shim re-exporting
//                                       globalThis.THREE (the JSR r186 web
//                                       build the 1B stack loads)
//   'three/addons/libs/stats.module.js'   -> corpus/stats_stub.js
//   'three/addons/libs/lil-gui.module.min.js' -> corpus/lilgui_stub.js
//   'three/addons/<x>'               -> three@0.186.1 examples/jsm (local)
//   anything else                    -> error (caller marks SKIP)
//
// Outputs <out>.bundle.js (raw IIFE) and <out>.scene.js (driver-wrapped:
// __corpusBegin + __corpusHookThree + bundle; the harness later calls
// __corpusTick(n) and reads __corpusErrors).
// Run from repo root: node tool/three/bundle_corpus_scene.mjs --id <id> \
//   --entry example/widgets/<id>/official_module.js --out /tmp/a1b_corpus/<id>/scene
import { build } from './node_modules/esbuild/lib/main.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : dflt; };
const kId = opt('id', null);
const kEntry = path.resolve(opt('entry', ''));
const kOut = path.resolve(opt('out', ''));
const kJsm = path.resolve(opt('jsm', '/tmp/three_pkg/node_modules/three/examples/jsm'));
const kTicks = opt('ticks', '3');
const kCore = path.join(ROOT, 'example/web/three.core.js');
const kModule = path.join(ROOT, 'example/web/jsr_three_web.js');

if (!kId || !kEntry || !kOut) { console.error('usage: --id <id> --entry <official_module.js> --out <basepath>'); process.exit(2); }

// --- export list parsing (same logic as run_1b_render.dart / ref_1b_scene.cjs)
function braceList(line, open, close) {
  const a = line.indexOf(open) + open.length, b = line.lastIndexOf(close);
  if (a <= 0 || b < a) throw new Error('ESM list parse failed: ' + line.slice(0, 60));
  return line.slice(a, b).split(',').map((s) => s.trim()).filter((s) => s.length > 0);
}
const core = readFileSync(kCore, 'utf8');
const mod = readFileSync(kModule, 'utf8');
const coreExports = braceList(core.split('\n').find((l) => l.trimLeft().startsWith('export {')), 'export {', '};');
const modLines = mod.split('\n');
const modExportLines = modLines.filter((l) => l.trimLeft().startsWith('export {'));
const reExport = modExportLines.find((l) => l.includes('} from'));
const modOwnExports = modExportLines.filter((l) => !l.includes('} from'));
if (!reExport || modOwnExports.length !== 1) throw new Error('jsr_three_web.js export shape changed');
const modReExports = braceList(reExport, 'export {', '} from');
const modExports = braceList(modOwnExports[0], 'export {', '};');
const allNames = [...new Set([...coreExports, ...modReExports, ...modExports])];
const shimPath = path.join(path.dirname(kOut), 'three_shim.js');
mkdirSync(path.dirname(kOut), { recursive: true });
// `export const X = globalThis.THREE.X` for every exported name. Aliased
// exports ("A as B") collapse to the local name A.
const shimBody = allNames.map((n) => {
  const src = n.includes(' as ') ? n.split(' as ')[0].trim() : n;
  const dst = n.includes(' as ') ? n.split(' as ')[1].trim() : n;
  return `export const ${dst} = globalThis.THREE[${JSON.stringify(src)}];`;
}).join('\n');
writeFileSync(shimPath, shimBody + '\n');

const STUBS = {
  'libs/stats.module.js': path.join(HERE, 'corpus/stats_stub.js'),
  'libs/lil-gui.module.min.js': path.join(HERE, 'corpus/lilgui_stub.js'),
};

// Bare specifiers vendored next to the three package (npm-installed into
// /tmp/three_pkg by corpus_1b.sh): three-mesh-bvh / three-bvh-csg / lottie /
// opentype — resolved against three_pkg/node_modules.
const kPkgModules = path.resolve(kJsm, '../../..');
const _require = createRequire(import.meta.url);
function resolvePkgModule(spec) {
  try {
    return _require.resolve(spec, { paths: [kPkgModules] });
  } catch {
    return null;
  }
}

function resolver() {
  return {
    name: 'corpus-three-resolver',
    setup(b) {
      b.onResolve({ filter: /^three$/ }, () => ({ path: shimPath }));
      b.onResolve({ filter: /^three\/addons\/(.+)$/ }, (a) => {
        const rel = a.path.slice('three/addons/'.length);
        if (STUBS[rel]) return { path: STUBS[rel] };
        return { path: path.join(kJsm, rel) };
      });
      // Pinned CDN ESM pins used by a few official modules (offline: serve
      // the identical npm version from the local package dir).
      b.onResolve({ filter: /^(https?:)?\/\/cdn\.jsdelivr\.net\/npm\/([^@]+)@([0-9.]+)\/(\+esm)$/ }, (a) => {
        const name = a.path.match(/npm\/([^@]+)@/)[1];
        const p = resolvePkgModule(name);
        return p ? { path: p } : null;
      });
      // Packages whose package.json exports do not resolve under Node rules
      // (browser-oriented maps): alias to the dist entry directly.
      b.onResolve({ filter: /^three-html-render\/polyfill$/ }, () => ({
        path: path.join(kPkgModules, 'three-html-render/dist/polyfill.mjs'),
      }));
      b.onResolve({ filter: /^3d-tiles-renderer$/ }, () => ({
        path: path.join(kPkgModules, '3d-tiles-renderer/build/index.js'),
      }));
      b.onResolve({ filter: /^3d-tiles-renderer\/core\/plugins$/ }, () => ({
        path: path.join(kPkgModules, '3d-tiles-renderer/build/index.core-plugins.js'),
      }));
      b.onResolve({ filter: /^3d-tiles-renderer\/three\/plugins$/ }, () => ({
        path: path.join(kPkgModules, '3d-tiles-renderer/build/index.plugins.js'),
      }));
      // Node builtins referenced by vendored CJS deps (opentype.js 'fs'):
      // corpus parses from ArrayBuffers, never touches the filesystem.
      b.onResolve({ filter: /^(fs|path|os|util|stream|crypto|buffer)$/ }, () => ({
        path: path.join(HERE, 'corpus/node_builtin_stub.js'),
      }));
      // Any remaining bare specifier pinned in the npm package dir
      // (three-mesh-bvh, three-bvh-csg, @three.ez/*, ...).
      b.onResolve({ filter: /^[^./]/ }, (a) => {
        if (/^(node:|https?:)/.test(a.path)) return null;
        const p = resolvePkgModule(a.path);
        // Core modules resolve to bare names ('fs') — leave those to esbuild.
        return p && path.isAbsolute(p) ? { path: p } : null;
      });
    },
  };
}

try {
  const result = await build({
    absWorkingDir: ROOT,
    entryPoints: [kEntry],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'neutral',
    target: ['es2020'],
    minify: false,
    sourcemap: false,
    logLevel: 'silent',
    plugins: [resolver()],
  });
  const bundle = Buffer.from(result.outputFiles[0].contents).toString('utf8')
    // esbuild lowers `import.meta` to `var import_meta = {};` under
    // platform:neutral/iife. DRACOLoader constructs `new URL(rel,
    // import_meta.url)` at module scope; the real URL constructor on the
    // web ref side rejects an undefined base. Give it a stable absolute
    // synthetic base (identical bytes on both harnesses; DRACO is never
    // fetched by the corpus scenes).
    .replace(/var import_meta = \{\};/g, 'var import_meta = { url: "file:///corpus/scene/bundle.js" };');
  writeFileSync(kOut + '.bundle.js', bundle);
  const scene = 'globalThis.__result = (function () {\n' +
    '  try {\n' +
    '    globalThis.__corpusBegin();\n' +
    '    globalThis.__corpusHookThree();\n' +
    '    // ---- begin bundled upstream example module ----\n' +
    bundle + '\n' +
    '    // ---- end bundled upstream example module ----\n' +
    `    return { ok: true, revision: (globalThis.THREE && globalThis.THREE.REVISION) || null, ticks: ${Number(kTicks)} };\n` +
    '  } catch (e) {\n' +
    "    return { ok: false, error: String((e && e.message ? e.message + '\\n' : '') + (e && e.stack ? e.stack : e)) };\n" +
    '  }\n' +
    '})();\n';
  writeFileSync(kOut + '.scene.js', scene);
  const imports = new Set();
  const src = readFileSync(kEntry, 'utf8');
  for (const m of src.matchAll(/from\s+'([^']+)'/g)) imports.add(m[1]);
  console.log(JSON.stringify({ id: kId, ok: true, bundleBytes: bundle.length, imports: [...imports] }));
} catch (e) {
  const msg = String(e && e.message ? e.message : e).slice(0, 2000);
  const unresolved = /Could not resolve "([^"]+)"/.exec(msg);
  console.log(JSON.stringify({ id: kId, ok: false, error: msg, unresolvedImport: unresolved ? unresolved[1] : null }));
  process.exit(0); // SKIP is a normal corpus outcome; the driver parses this line
}
