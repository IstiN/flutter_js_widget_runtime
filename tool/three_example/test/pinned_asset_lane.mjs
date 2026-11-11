// Shared harness-side mirror of the runtime's pinned external-asset lane.
// Serves an example widget's assets.json-pinned files (and inlined legacy
// assets at their original path) exactly like the Dart host lane does, so
// node pins exercise the same fetch contract the app uses.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function readPinnedAsset(widgetDir, url) {
  let pins = null;
  try {
    pins = JSON.parse(await readFile(path.join(widgetDir, 'assets.json'), 'utf8'));
  } catch {
    pins = { assets: [] };
  }
  const pinned = pins.assets.find((asset) => asset.url === url || (asset.aliases || []).includes(url));
  const file = pinned ? pinned.file : url.split('/').join('__');
  const candidates = [
    path.join(widgetDir, file),
    path.join(widgetDir, url)
  ];
  for (const candidate of candidates) {
    try {
      const bytes = await readFile(candidate);
      return { data: bytes.toString('base64'), mime: pinned ? pinned.mime : 'application/octet-stream', width: pinned ? pinned.width : 0, height: pinned ? pinned.height : 0 };
    } catch {
      // try the next candidate
    }
  }
  throw new Error(`asset not found in widget dir: ${url}`);
}
