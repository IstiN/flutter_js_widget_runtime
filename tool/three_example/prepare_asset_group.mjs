#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function parseArgs(argv) {
  const options = { source: '/tmp/jsr-three-r186', jobs: 1, logs: '/tmp/three_prepare_logs', ids: [] };
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === '--source') options.source = path.resolve(argv[++index]);
    else if (argument === '--jobs') options.jobs = Number(argv[++index]);
    else if (argument === '--logs') options.logs = path.resolve(argv[++index]);
    else if (argument === '--ids-file') options.idsFile = path.resolve(argv[++index]);
    else options.ids.push(argument);
  }
  if (!Number.isInteger(options.jobs) || options.jobs < 1) throw new Error('--jobs must be positive');
  return options;
}

function prepare(example, options) {
  return new Promise((resolve, reject) => {
    const child = spawn('dart', [
      'run', 'bin/jsr_three_example.dart', 'prepare', example,
      '--source', options.source, '--offline'
    ], { cwd: ROOT, env: process.env });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    child.on('error', reject);
    child.on('close', async code => {
      await writeFile(path.join(options.logs, `${example}.log`), output);
      if (code === 0) resolve(example);
      else reject(new Error(`${example} failed (${code}); see ${options.logs}/${example}.log`));
    });
  });
}

const options = parseArgs(process.argv.slice(2));
if (options.idsFile) {
  const text = await readFile(options.idsFile, 'utf8');
  options.ids.push(...text.split(/\s+/).filter(Boolean));
}
options.ids = [...new Set(options.ids)].sort();
if (!options.ids.length) {
  throw new Error('Usage: node tool/three_example/prepare_asset_group.mjs --ids-file <file> [webgl_id ...] [--source dir] [--jobs n]');
}
if (options.ids.some(id => !/^webgl_[a-z0-9_]+$/.test(id))) throw new Error('Invalid official example id');
await mkdir(options.logs, { recursive: true });
console.log(`Preparing ${options.ids.length} examples with ${options.jobs} jobs; logs: ${options.logs}`);
let cursor = 0;
const failures = [];
await Promise.all(Array.from({ length: Math.min(options.jobs, options.ids.length) }, async () => {
  while (cursor < options.ids.length) {
    const example = options.ids[cursor++];
    try {
      await prepare(example, options);
      console.log(`ok ${example}`);
    } catch (error) {
      failures.push(error.message);
      console.error(error.message);
    }
  }
}));
if (failures.length) throw new Error(`${failures.length} prepare jobs failed`);
