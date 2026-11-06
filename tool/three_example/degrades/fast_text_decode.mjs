// Fast UTF-8 text decode for prepared three.js widgets on the QuickJS lanes.
//
// The engine's TextDecoder shim (tool/three/src/runtime.js installTextEncoding
// -> decodeUtf8) assembles multi-megabyte text with a per-codepoint
// `result += String.fromCodePoint(code)` loop. QuickJS rope concatenation
// turns that into a minutes-long single-eval stall on big text assets —
// measured on the 6.8MB prepared webgl_loader_vrml elevationGrid1 payload:
// the worker spun at 100% CPU for >100s with zero presented frames (in-app
// white screen), while the same switch returns in milliseconds on node where
// a native TextDecoder exists. That shim is bundle-owned, so prepared widgets
// install a widget-local decoder instead: chunked String.fromCharCode over
// pure-ASCII runs (the pinned JSON/VRML/OBJ/GLB-chunk payloads are ASCII)
// with a correct linear UTF-8 fallback for anything else.

const ASCII_CHUNK = 8192;

/// Uint8Array -> string. Pure-ASCII bytes (the pinned payload case) take a
/// chunked fromCharCode path; any non-ASCII byte falls back to a linear UTF-8
/// decode whose results match the runtime shim (invalid sequences become
/// U+FFFD, lone surrogates included).
export function bytesToText(bytes) {
  if (bytes instanceof Uint8Array) {
    // already exact
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
  return decodeUtf8Linear(bytes);
}

function decodeUtf8Linear(bytes) {
  const parts = [];
  let chunk = '';
  const len = bytes.length;
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

/// Replace the runtime's per-codepoint TextDecoder shim with the chunked
/// decoder above. Same utf-8-only label contract as the shim; `decode()`
/// accepts ArrayBuffer/views exactly like it. Idempotent.
export function installFastTextDecoder() {
  const ROOT = globalThis;
  const Existing = ROOT.TextDecoder;
  if (Existing && Existing.__jsrFastTextDecode) return;
  class JsrFastTextDecoder {
    constructor(label = 'utf-8') {
      const normalized = String(label).toLowerCase().replace('_', '-');
      if (normalized !== 'utf-8' && normalized !== 'utf8') {
        throw new RangeError(`three.invalid: unsupported TextDecoder label ${label}`);
      }
    }
    decode(value) {
      if (value === undefined) return '';
      if (!(value instanceof ArrayBuffer) && !ArrayBuffer.isView(value)) {
        throw new TypeError('three.invalid: TextDecoder.decode expects an ArrayBuffer or view');
      }
      return bytesToText(value);
    }
  }
  JsrFastTextDecoder.__jsrFastTextDecode = true;
  ROOT.TextDecoder = JsrFastTextDecoder;
}
