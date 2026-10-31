#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAssets, verifyDiscoveredAssets } from './asset_discovery.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

function moduleBytes(html) {
  const text = html.toString('latin1');
  const opening = /<script\b[^>]*\btype\s*=\s*["']module["'][^>]*>/i.exec(text);
  if (!opening) throw new Error('Official HTML has no module script');
  const end = text.indexOf('</script>', opening.index + opening[0].length);
  if (end < 0) throw new Error('Official module script is not closed');
  return html.subarray(opening.index + opening[0].length, end);
}

function parseArgs(argv) {
  let source = '/tmp/jsr-three-r186';
  let verify = false;
  const positional = [];
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === '--source') source = argv[++index];
    else if (argument === '--verify') verify = true;
    else positional.push(argument);
  }
  if (positional.length !== 1 || !/^webgl_[a-z0-9_]+$/.test(positional[0])) {
    throw new Error('Usage: node tool/three_example/discover_assets.mjs <webgl_id> [--source dir] [--verify]');
  }
  return { example: positional[0], source: path.resolve(source), verify };
}

const options = parseArgs(process.argv.slice(2));
const html = await readFile(path.join(options.source, 'examples', `${options.example}.html`));
const definitions = await discoverAssets({
  source: options.source,
  moduleSource: moduleBytes(html).toString('utf8')
});
await verifyDiscoveredAssets(options.source, definitions);
const widget = `three-${options.example.slice(6).replaceAll('_', '-')}`;
if (options.verify) {
  const manifestPath = path.join(ROOT, 'example/widgets', widget, 'prepare_manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.deepEqual(manifest.assetDiscovery, definitions,
    `${widget}: discovered asset pins differ; re-run the pinned prepare`);
}
console.log(JSON.stringify({ example: options.example, widget, verified: options.verify, assets: definitions }, null, 2));
