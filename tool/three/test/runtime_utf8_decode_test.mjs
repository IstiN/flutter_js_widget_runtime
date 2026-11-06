// Regression: chunked decodeUtf8 must stay byte-exact with the historical
// per-codepoint decoder (invalid sequences -> U+FFFD, truncated tails ->
// U+FFFD, no BOM stripping) while staying linear on QuickJS flat strings.
// The 6.8MB prepared elevationGrid1 VRML JSON once cost >6 CPU-minutes in
// promise_reaction_job -> js_add_slow -> JS_ConcatString because the result
// string was rebuilt with `result += piece` per append (quadratic memcpy).
// Boundary sizes hit DECODE_CHUNK exact multiples and +/-1 so both the ASCII
// fast path (array + join) and the multi-byte chunked path (parts + flush +
// final join) are covered at their flush seams.
import assert from 'node:assert/strict';
import { DECODE_CHUNK, decodeUtf8 } from '../src/runtime.js';

// The pre-fix per-codepoint decoder, verbatim from git HEAD — the byte-exact
// contract the chunked rewrite must preserve (one U+FFFD per invalid
// sequence, truncated tail -> U+FFFD, no BOM stripping). This is
// intentionally NOT the WHATWG TextDecoder result: the historical decoder
// emits one replacement per invalid sequence (e.g. e2 28 a1 -> U+FFFD '('
// U+FFFD), and decodeUtf8's contract predates WHATWG.
function referenceDecodeUtf8(bytes) {
  let result = '';
  for (let i = 0; i < bytes.length;) {
    const first = bytes[i++];
    let code = first;
    let extra = 0;
    let minimum = 0;
    if (first >= 0xc2 && first <= 0xdf) { code = first & 31; extra = 1; minimum = 0x80; }
    else if (first >= 0xe0 && first <= 0xef) { code = first & 15; extra = 2; minimum = 0x800; }
    else if (first >= 0xf0 && first <= 0xf4) { code = first & 7; extra = 3; minimum = 0x10000; }
    else if (first >= 0x80) { result += '\ufffd'; continue; }
    if (i + extra > bytes.length) { result += '\ufffd'; break; }
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
    if (!valid || code < minimum || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) result += '\ufffd';
    else result += String.fromCodePoint(code);
  }
  return result;
}

function assertSame(bytes, label) {
  const expected = referenceDecodeUtf8(bytes);
  const actual = decodeUtf8(bytes);
  assert.equal(actual, expected, label);
}

function assertPerformanceLinear(bytes, label) {
  // The chunked decoder must not append per codepoint: on a flat-string
  // engine every += copies the whole accumulated string. Cap the number of
  // concatenations by counting chunks — approximated here by timing a
  // synthetic worst case: the decode itself must stay far below the
  // quadratic baseline (decode the same payload 5x faster than 1/1000 of a
  // per-append replay would take is not portable; instead assert decode time
  // is sub-linear: 8MB decodes in well under a quadratic budget).
  const start = process.hrtime.bigint();
  const out = decodeUtf8(bytes);
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  assert.ok(out.length > 0, label);
  assert.ok(
    ms < 1500,
    `${label}: decodeUtf8 took ${ms.toFixed(1)}ms — quadratic regression?`,
  );
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('empty payload', () => {
  assert.equal(decodeUtf8(new Uint8Array(0)), '');
});

test('pure ASCII across chunk boundaries (fast path)', () => {
  for (const len of [1, DECODE_CHUNK - 1, DECODE_CHUNK, DECODE_CHUNK + 1, DECODE_CHUNK * 2 + 7]) {
    const bytes = new Uint8Array(len).fill(0x61);
    assertSame(bytes, `ascii len=${len}`);
  }
});

test('multi-byte sequences spanning chunk flushes (slow path)', () => {
  // 3-byte sequence 'e2 82 ac' (EURO SIGN) repeated past the chunk size.
  const seq = [0xe2, 0x82, 0xac];
  const bytes = new Uint8Array(DECODE_CHUNK * 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = seq[i % 3];
  assertSame(bytes, `euro repeat len=${bytes.length}`);
  // 4-byte sequence 'f0 9f 98 80' (GRINNING FACE).
  const emoji = [0xf0, 0x9f, 0x98, 0x80];
  const wide = new Uint8Array(DECODE_CHUNK + 2);
  for (let i = 0; i < wide.length; i++) wide[i] = emoji[i % 4];
  assertSame(wide, `emoji repeat len=${wide.length}`);
  // 2-byte sequence spanning the exact chunk seam.
  const two = [0xc3, 0xa9];
  const mid = new Uint8Array(DECODE_CHUNK - 1);
  for (let i = 0; i < mid.length; i++) mid[i] = two[i % 2];
  assertSame(mid, `2-byte seam len=${mid.length}`);
});

test('invalid sequences decode as U+FFFD exactly like the reference', () => {
  const cases = [
    [0x80], // bare continuation
    [0xc0, 0xaf], // overlong 2-byte
    [0xe0, 0x80, 0xaf], // overlong 3-byte
    [0xf4, 0x90, 0x80, 0x80], // > U+10FFFF
    [0xed, 0xa0, 0x80], // surrogate D800
    [0xc3], // truncated tail
    [0xe2, 0x82], // truncated 3-byte tail
    [0x61, 0xff, 0x62], // invalid byte mid-ASCII
    [0xe2, 0x28, 0xa1], // invalid continuation
  ];
  for (const bytes of cases) {
    assertSame(new Uint8Array(bytes), `invalid [${bytes.join(',')}]`);
  }
});

test('mixed ASCII + multi-byte + invalid across flush boundaries', () => {
  const pieces = ['{"grid":"', '"x1":', '\xfffd'.repeat(0)];
  const bytes = [];
  for (const piece of pieces) for (const ch of piece) bytes.push(ch.charCodeAt(0));
  bytes.push(0xe2, 0x82, 0xac, 0xf0, 0x9f, 0x98, 0x80, 0x80, 0xc3, 0x28);
  const prefix = new Uint8Array(DECODE_CHUNK - 3).fill(0x62);
  const all = new Uint8Array(prefix.length + bytes.length);
  all.set(prefix, 0);
  all.set(bytes, prefix.length);
  assertSame(all, `mixed len=${all.length}`);
});

test('4MB ASCII decodes fast (linear, fast path)', () => {
  assertPerformanceLinear(new Uint8Array(4 * 1024 * 1024).fill(0x20), '4MB ascii');
});

test('4MB multi-byte decodes fast (linear, slow path)', () => {
  const bytes = new Uint8Array(4 * 1024 * 1024);
  for (let i = 0; i < bytes.length; i++) bytes[i] = [0xe2, 0x82, 0xac, 0x61][i % 4];
  assertPerformanceLinear(bytes, '4MB multibyte');
});

test('WHATWG divergence is intentional (e2 28 a1 -> U+FFFD "(" U+FFFD)', () => {
  // Document the deliberate difference from TextDecoder: one replacement per
  // invalid sequence, per the historical contract.
  assert.equal(decodeUtf8(new Uint8Array([0xe2, 0x28, 0xa1])), '\ufffd(\ufffd');
  assert.equal(referenceDecodeUtf8(new Uint8Array([0xe2, 0x28, 0xa1])), '\ufffd(\ufffd');
});

for (const [name, fn] of tests) {
  await fn();
  console.log(`ok - ${name}`);
}
console.log(`runtime_utf8_decode_test: ${tests.length} tests passed`);
