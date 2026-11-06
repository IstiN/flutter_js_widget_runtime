const THREE = globalThis.THREE;

// VRML is parsed with the pinned official Chevrotain/VRMLLoader at prepare
// time. Runtime only reconstructs the deterministic Object3D JSON payload.
// A plain Loader-shaped function avoids QuickJS CommonJS/ESM class interop.
function VRMLLoader(manager) {
  this.manager = manager || THREE.DefaultLoadingManager;
  this.path = '';
  this.requestHeader = {};
  this.withCredentials = false;
}
VRMLLoader.prototype.setPath = function (value) { this.path = value; return this; };
VRMLLoader.prototype.setRequestHeader = function (value) { this.requestHeader = value; return this; };
VRMLLoader.prototype.setWithCredentials = function (value) { this.withCredentials = value; return this; };
VRMLLoader.prototype.load = function (url, onLoad, onProgress, onError) {
  // Fetch the registered bytes directly through the runtime asset lane and
  // decode here. The default FileLoader route takes Response.text(), whose
  // decodeUtf8 shim builds a 6.8M-char string one codepoint at a time — a
  // single-eval QuickJS stall measured at >100s on elevationGrid1 (the app
  // presented zero frames: in-app white screen on the official lil-gui
  // switch). Same bytes, same parse; only the text lane moves into this
  // chunked decoder. Falls back to the FileLoader lane when the runtime
  // asset bridge is unavailable (node boot harness uses the same runtime
  // bridge, so both lanes stay covered by tests).
  const runtime = globalThis.JSR && globalThis.JSR.three;
  const fail = error => { if (onError) onError(error); else console.error(error); };
  if (runtime && typeof runtime.loadAsset === 'function') {
    runtime.loadAsset(this.path + url).then(record => {
      try { onLoad(this.parse(decodeAssetText(record.bytes))); }
      catch (error) { fail(error); }
    }, fail);
    return;
  }
  const loader = new THREE.FileLoader(this.manager);
  loader.setPath(this.path).setRequestHeader(this.requestHeader);
  loader.setWithCredentials(this.withCredentials);
  loader.load(url, text => {
    try { onLoad(this.parse(text)); }
    catch (error) { if (onError) onError(error); else console.error(error); }
  }, onProgress, onError);
};
VRMLLoader.prototype.parse = function (text) {
  const payload = JSON.parse(text);
  if (!payload.jsrPreparedVrml) throw new Error('three.prepare: expected a prepare-parsed VRML scene');
  if (payload.warning) console.warn('three: ' + payload.warning);
  return new THREE.ObjectLoader().parse(payload.scene);
};

// Local copy of the chunked decoder (degrades/fast_text_decode.mjs) so this
// CommonJS-shaped adapter stays import-free for esbuild's CJS interop.
const ASCII_CHUNK = 8192;
function decodeAssetText(bytes) {
  if (bytes instanceof Uint8Array) {
    // exact
  } else if (bytes instanceof ArrayBuffer) {
    bytes = new Uint8Array(bytes);
  } else if (ArrayBuffer.isView(bytes)) {
    bytes = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  } else {
    throw new TypeError('three.invalid: expected binary bytes for text decode');
  }
  const len = bytes.length;
  let ascii = true;
  for (let i = 0; i < len; i++) {
    if (bytes[i] >= 0x80) { ascii = false; break; }
  }
  if (ascii) {
    let out = '';
    for (let i = 0; i < len; i += ASCII_CHUNK) {
      out += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + ASCII_CHUNK, len)));
    }
    return out;
  }
  const parts = [];
  let chunk = '';
  let i = 0;
  while (i < len) {
    const first = bytes[i++];
    let code = first;
    let extra = 0;
    let minimum = 0;
    if (first >= 0xc2 && first <= 0xdf) { code = first & 31; extra = 1; minimum = 0x80; }
    else if (first >= 0xe0 && first <= 0xef) { code = first & 15; extra = 2; minimum = 0x800; }
    else if (first >= 0xf0 && first <= 0xf4) { code = first & 7; extra = 3; minimum = 0x10000; }
    else if (first >= 0x80) { chunk += '\uFFFD'; continue; }
    if (i + extra > len) { chunk += '\uFFFD'; break; }
    let valid = true;
    for (let j = 0; j < extra; j++) {
      const next = bytes[i++];
      if ((next & 0xc0) !== 0x80) {
        valid = false;
        i--;
        break;
      }
      code = (code << 6) | (next & 63);
    }
    if (!valid || code < minimum || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
      chunk += '\uFFFD';
    } else {
      chunk += String.fromCodePoint(code);
    }
    if (chunk.length >= ASCII_CHUNK) {
      parts.push(chunk);
      chunk = '';
    }
  }
  return parts.length === 0 ? chunk : parts.join('') + chunk;
}

module.exports = { VRMLLoader };
