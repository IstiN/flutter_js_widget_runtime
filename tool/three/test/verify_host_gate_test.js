// verify_host_gate_test.js — the build.mjs --verify host gate (issue #8 F4a):
// bundle bytes are compared only on the builder host class recorded in
// bundle_manifest.json (build.builderHost); another host class still checks
// every pin, prints the rebuilt hashes informationally and exits 0, and
// faking the builder host class where the bytes cannot reproduce it must
// FAIL the byte comparison. JSR_BUILD_HOST (platform:arch) fakes the gate's
// view of the current host; the manifest keeps the real builder host.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOL = path.resolve(HERE, '..');
const SOURCE = process.env.THREE_SRC || '/tmp/jsr-three-r186';
const PIN = JSON.parse(readFileSync(path.join(TOOL, 'source-pin.json'), 'utf8'));

// The pinned three checkout is a build input of this test. When it is
// absent (standalone run), fetch it exactly like the CI verify step does.
if (!statSync(SOURCE, { throwIfNoEntry: false })) {
  execFileSync('git', ['clone', '--filter=blob:none', '--no-checkout', 'https://github.com/mrdoob/three.js.git', SOURCE], { stdio: 'inherit' });
  execFileSync('git', ['-C', SOURCE, 'checkout', PIN.commit], { stdio: 'inherit' });
}

const manifest = JSON.parse(readFileSync(path.join(TOOL, '../../assets/three/bundle_manifest.json'), 'utf8'));
const builder = manifest.build.builderHost;
const real = { platform: process.platform, arch: process.arch };
const fakeHost = cls => ({ JSR_BUILD_HOST: `${cls.platform}:${cls.arch}` });

const runVerify = env => spawnSync('node', [path.join(TOOL, 'build.mjs'), '--source', SOURCE, '--verify'], {
  encoding: 'utf8', env: { ...process.env, ...env },
  cwd: path.join(TOOL, '../..')
});
const lastLine = out => out.trimEnd().split('\n').pop();
const assertRebuilt = out => assert.match(out, /"buildMs":\s*\{\s*"native":\s*\d+/);

const onBuilderHost = real.platform === builder.platform && real.arch === builder.arch;
if (onBuilderHost) {
  // Branch 1, real builder host: the byte comparison runs and passes.
  const r = runVerify({});
  assert.equal(r.status, 0, `verify failed on the builder host: ${r.stderr}`);
  assert.equal(lastLine(r.stdout), `bytes compared: yes (host ${real.platform}-${real.arch} = builder host)`);
  assertRebuilt(r.stdout);
  console.log('verify_host_gate: builder-host branch compares bytes and passes OK');
} else {
  // This machine is NOT the builder host: the plain run takes the
  // informational branch, and faking the builder host class must bite —
  // the rebuilt bytes cannot reproduce the committed ones.
  const info = runVerify({});
  assert.equal(info.status, 0, `informational verify failed: ${info.stderr}`);
  assert.equal(lastLine(info.stdout), `bytes compared: no (host ${real.platform}-${real.arch} is not the builder host)`);
  assert.match(info.stdout, /rebuilt sha256 \(informational\)/);
  const strict = runVerify(fakeHost(builder));
  assert.equal(strict.status, 1, 'the byte comparison on the (faked) builder host must fail for divergent bytes');
  assert.match(strict.stderr, /differs from a clean pinned rebuild/);
  console.log('verify_host_gate: non-builder host stays informational; builder-host class gate bites OK');
}

// Branch 2 (both machines): faking a DIFFERENT host class checks pins only,
// prints the rebuilt hashes informationally and exits 0.
const other = builder.platform === 'darwin' ? { platform: 'linux', arch: 'x64' } : { platform: 'darwin', arch: 'arm64' };
const r2 = runVerify(fakeHost(other));
assert.equal(r2.status, 0, `informational branch must exit 0: ${r2.stderr}`);
assert.equal(lastLine(r2.stdout), `bytes compared: no (host ${other.platform}-${other.arch} is not the builder host)`);
assert.match(r2.stdout, /rebuilt sha256 \(informational\)/);
assert.match(r2.stdout, /"jsr_three_native.js":"[0-9a-f]{64}"/);
console.log('verify_host_gate: other-host branch is informational and exits 0 OK');
console.log('verify_host_gate_test: OK');
