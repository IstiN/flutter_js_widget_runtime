#!/usr/bin/env node
// Headless upstream-reference runner. Serves the OFFICIAL three.js r186
// examples through a local proxy (files cached from the pinned GitHub
// revision), drives headless Chrome over the DevTools protocol, samples the
// real rAF fps and captures reference screenshots. Output:
//   /tmp/round11/refs/<id>.png + refs.json  (fps, errors)
// Usage: node reference_chrome.mjs <example-id> [more-ids...]
//        node reference_chrome.mjs --file <ids.txt>
import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const OUT = '/tmp/round11/refs';
const CACHE = '/tmp/round11/refcache';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 8877;
const CDP_PORT = 9333;
await mkdir(OUT, { recursive: true });

let ids = process.argv.slice(2);
if (ids[0] === '--file') ids = (await readFile(ids[1], 'utf8')).split(/\s+/).filter(Boolean);

// --- pinned-upstream proxy ---------------------------------------------------
const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const rel = urlPath.replace(/^\/three\//, '');
    if (!rel || rel.includes('..')) { res.writeHead(400); res.end(); return; }
    const cacheFile = path.join(CACHE, rel);
    if (existsSync(cacheFile)) {
      res.writeHead(200, { 'content-type': mime(rel) });
      res.end(await readFile(cacheFile));
      return;
    }
    const upstream = `https://raw.githubusercontent.com/mrdoob/three.js/r186/${rel}`;
    const response = await fetch(upstream);
    if (!response.ok) { res.writeHead(response.status); res.end(`upstream ${response.status}`); return; }
    const bytes = Buffer.from(await response.arrayBuffer());
    await mkdir(path.dirname(cacheFile), { recursive: true });
    await writeFile(cacheFile, bytes);
    res.writeHead(200, { 'content-type': mime(rel) });
    res.end(bytes);
  } catch (error) { res.writeHead(500); res.end(String(error)); }
});
function mime(file) {
  if (file.endsWith('.html')) return 'text/html';
  if (file.endsWith('.js') || file.endsWith('.mjs')) return 'text/javascript';
  if (file.endsWith('.json')) return 'application/json';
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg';
  if (file.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}
await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));

// --- headless chrome ---------------------------------------------------------
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu-sandbox', '--no-first-run', '--hide-scrollbars',
  '--use-angle=metal', '--enable-unsafe-webgpu',
  `--remote-debugging-port=${CDP_PORT}`, '--window-size=1264,868', 'about:blank'
], { stdio: 'ignore' });
process.on('exit', () => { chrome.kill(); server.close(); });
let version;
for (let i = 0; i < 50; i++) {
  try { version = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).json(); break; }
  catch { await new Promise(r => setTimeout(r, 200)); }
}
if (!version) throw new Error('chrome CDP did not start');

class Cdp {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.events = []; }
  static async open(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    const cdp = new Cdp(ws);
    ws.onmessage = event => {
      const msg = JSON.parse(event.data);
      if (msg.id && cdp.pending.has(msg.id)) {
        const { resolve, reject } = cdp.pending.get(msg.id);
        cdp.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      } else if (msg.method) cdp.events.push(msg);
    };
    return cdp;
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}
const browser = await Cdp.open(version.webSocketDebuggerUrl);
const results = [];
for (const id of ids) {
  const target = await browser.send('Target.createTarget', { url: 'about:blank' });
  const attach = await browser.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const session = attach.sessionId;
  const url = `http://127.0.0.1:${PORT}/three/examples/${id}.html`;
  try {
    await browser.send('Page.enable', {}, session);
    await browser.send('Runtime.enable', {}, session);
    await browser.send('Emulation.setDeviceMetricsOverride',
      { width: 1264, height: 868, deviceScaleFactor: 1, mobile: false }, session);
    await browser.send('Page.navigate', { url }, session);
    // Let assets load and the first frames settle; then measure real rAF fps.
    await new Promise(r => setTimeout(r, 6000));
    const fpsEval = await browser.send('Runtime.evaluate', {
      expression: `new Promise(resolve => {
        let frames = 0; const t0 = performance.now();
        function tick() { frames++; if (performance.now() - t0 < 4000) requestAnimationFrame(tick);
          else resolve({ fps: Math.round(frames / ((performance.now() - t0) / 1000) * 10) / 10 }); }
        requestAnimationFrame(tick);
      })`, awaitPromise: true, returnByValue: true
    }, session);
    const fps = fpsEval.result?.value?.fps ?? null;
    const shot = await browser.send('Page.captureScreenshot', { format: 'png' }, session);
    await writeFile(path.join(OUT, `${id}.png`), Buffer.from(shot.data, 'base64'));
    const errors = browser.events
      .filter(e => e.method === 'Runtime.exceptionThrown' && e.sessionId === session)
      .map(e => JSON.stringify(e.params).slice(0, 160));
    results.push({ id, fps, errors: errors.slice(0, 3) });
    console.log(`${id}: chrome_fps=${fps} errors=${errors.length}`);
  } catch (error) {
    results.push({ id, fps: null, errors: [String(error).slice(0, 160)] });
    console.log(`${id}: FAILED ${String(error).slice(0, 120)}`);
  }
  await browser.send('Target.closeTarget', { targetId: target.targetId });
}
await writeFile(path.join(OUT, 'refs.json'), JSON.stringify(results, null, 1));
chrome.kill();
server.close();
process.exit(0);
