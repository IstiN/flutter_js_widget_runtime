import 'package:flutter_test/flutter_test.dart';

import '../../tool/three/bench_1b.dart' show Shim;
import '../support/three_1b_engine.dart';
import '../support/three_1b_real_wire.dart';

// F4f transport defect regression (issue #8, plan 4.4 F4f): the F2b BATCHED
// wire must deliver every texImage2D/.bufferData argument to GL exactly as
// encoded, at any batch position and any size. The defect this test pins:
//
//   The size-only / null-data blob convention was encoded as a bare length
//   field (u32 len, no bytes) and the C decoder inferred "no data" from
//   `remaining < len` or `len == 0 && remaining == 0`. Inside a batched
//   dispatch a null-data texImage2D FOLLOWED by other commands left
//   remaining > 0, so the decoder handed GL a pointer INTO THE NEXT
//   COMMAND'S BYTES; ANGLE Metal then copied width*height*bytesPerPixel
//   from that pointer (BUS_ADRALN in TextureMtl::setPerSliceSubImage —
//   flaky by heap layout, 4/8 perf-matrix runs at 720p), and a size-only
//   bufferData(len) additionally desynced the decode cursor by `len`
//   bytes. The fix makes the convention explicit: length field bit 31 set
//   = size-only (GL gets NULL, cursor does not move); bit 31 clear = real
//   data that must be present in full.
//
// F4F-BATCHED-BLOB-1 reproduces the crash layout (null-data texImage2D
// mid-batch, 8 runs) — on the pre-fix wire this test file crashes the test
// shell with SIGBUS during this test (verified against the base commit).
// F4F-BATCHED-BLOB-2 sweeps large INLINE blobs across the suspected
// boundaries (64 KiB-1 .. 16 MiB) with a byte-exact readback compare —
// 8 runs per size up to 1 MiB, 3 runs at 4 MiB and 2 at 16 MiB (the full
// 8-run matrix over the big sizes is the recorded bisect in
// docs/angle_1b.md; the smaller committed counts keep the suite fast while
// still byte-comparing every size). F4F-BATCHED-BLOB-3 pins the size-only
// bufferData cursor desync with a deterministic pixel check.
void main() {
  // ignore: omit_local_variable_types
  final String? missing = Shim.resolveProblem();
  // Real-wire crash-class hygiene (macOS runner): the ANGLE display must not
  // outlive the test file — the flutter_tester shell segfaults at
  // finalization when a wire, surface or display is still alive. Every wire
  // registers in the canonical liveReal1BWires registry (test/support/
  // three_1b_real_wire.dart); tearDownAll = disposeRegisteredReal1BWires()
  // disposes leftovers in order, shuts the display down and prints the live
  // counts.
  // ignore: omit_local_variable_types
  int created = 0;

  void track(Real1BWireHost wire) {
    created++;
    registerReal1BWire(wire);
    addTearDown(wire.dispose);
  }

  tearDownAll(() {
    // Order: wires (engine closed by its own teardown), then surfaces, then
    // the display; the canonical teardown prints the before/after live
    // counts for the CI crash-class record.
    disposeRegisteredReal1BWires();
    // ignore: avoid_print
    print('F4F-BATCHED-BLOB teardown: wires created=$created');
  });

  test('F4F-BATCHED-BLOB-1: a null-data texImage2D mid-batch never hands GL '
      'a garbage pointer (8 runs)', () async {
    final (wire, _, state, _) = await run1bRealEngine(
      _widget('''
var runs = 8;
for (var r = 0; r < runs; r++) {
  var tex = gl.createTexture();
  var fbo = gl.createFramebuffer();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  // null pixels (the size-only / null-data convention), FOLLOWED by more
  // commands in the SAME batch — the exact layout that used to feed GL a
  // pointer into the next command's bytes (ANGLE then copied 16 MiB from
  // it: BUS_ADRALN, flaky).
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 2048, 2048, 0, gl.RGBA,
      gl.UNSIGNED_BYTE, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  var st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (st !== gl.FRAMEBUFFER_COMPLETE) out.fboIncomplete++;
  var err = gl.getError(); // data-returning: flushes the whole batch
  if (err !== gl.NO_ERROR) out.badErr.push(err);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(fbo);
  gl.deleteTexture(tex);
  out.runs++;
}
out.err = gl.getError();
'''),
      'var THREE = {};',
      width: 64,
      height: 64,
    );
    track(wire);
    expect(state?['errors'] as List?, isEmpty, reason: '${state?['errors']}');
    expect(state?['runs'], 8);
    expect(state?['fboIncomplete'], 0);
    expect((state?['badErr'] as List?) ?? <dynamic>[], isEmpty);
    expect(state?['err'], 0);
  }, skip: missing);

  test('F4F-BATCHED-BLOB-2: large inline texImage2D blobs survive the '
      'batched wire byte-exact (64 KiB-1 .. 16 MiB)', () async {
    final (wire, _, state, _) = await run1bRealEngine(
      _widget('''
var sizes = [
  { bytes: 65535,    w: 16383, h: 1,    runs: 8 },  // 64 KiB - 1
  { bytes: 65536,    w: 16384, h: 1,    runs: 8 },  // 64 KiB
  { bytes: 65537,    w: 16384, h: 1,    runs: 8 },  // 64 KiB + 1
  { bytes: 262144,   w: 256,   h: 256,  runs: 8 },  // 256 KiB
  { bytes: 1048576,  w: 512,   h: 512,  runs: 8 },  // 1 MiB
  { bytes: 4194304,  w: 1024,  h: 1024, runs: 3 },  // 4 MiB
  { bytes: 16777216, w: 4096,  h: 1024, runs: 2 }   // 16 MiB
];
function byteAt(i) { return (i * 31 + (i >>> 8)) & 0xff; }
for (var s = 0; s < sizes.length; s++) {
  var spec = sizes[s];
  var consumed = spec.w * spec.h * 4;
  if (consumed > spec.bytes) {
    out.errors.push('dims exceed blob ' + spec.bytes);
    continue;
  }
  var rec = out.sweep['' + spec.bytes] = { runs: 0, bad: 0 };
  for (var r = 0; r < spec.runs; r++) {
    var blob = new Uint8Array(spec.bytes);
    for (var i = 0; i < blob.length; i++) blob[i] = byteAt(i);
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Inline blob inside a batch with followers (texParameters before,
    // finish flushes; the readbacks below arrive as their own batches).
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, spec.w, spec.h, 0, gl.RGBA,
        gl.UNSIGNED_BYTE, blob);
    gl.finish();
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      rec.bad++;
      rec.why = 'fbo incomplete';
    } else {
      var rowsPerChunk = Math.max(1, Math.floor(240000 / (spec.w * 4)));
      var mismatch = -1, want = 0, got = 0;
      for (var y = 0; y < spec.h && mismatch < 0; y += rowsPerChunk) {
        var rows = Math.min(rowsPerChunk, spec.h - y);
        var view = new Uint8Array(spec.w * rows * 4);
        gl.readPixels(0, y, spec.w, rows, gl.RGBA, gl.UNSIGNED_BYTE, view);
        for (var j = 0; j < view.length; j++) {
          var gi = y * spec.w * 4 + j;
          want = byteAt(gi);
          got = view[j];
          if (got !== want) { mismatch = gi; break; }
        }
      }
      if (mismatch >= 0) {
        rec.bad++;
        rec.why = 'byte ' + mismatch + ' got ' + got + ' want ' + want;
      }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(tex);
    if (gl.getError() !== gl.NO_ERROR) rec.bad++;
    rec.runs++;
  }
  out.sizesChecked++;
}
out.err = gl.getError();
'''),
      'var THREE = {};',
      width: 64,
      height: 64,
    );
    track(wire);
    expect(state?['errors'] as List?, isEmpty, reason: '${state?['errors']}');
    expect(state?['sizesChecked'], 7, reason: 'every boundary size ran');
    final sweep = state?['sweep'] as Map<String, dynamic>? ?? {};
    expect(sweep.keys.length, 7);
    for (final entry in sweep.entries) {
      expect(
        entry.value['bad'],
        0,
        reason: 'size ${entry.key}: ${entry.value['why']}',
      );
    }
  }, skip: missing);

  test('F4F-BATCHED-BLOB-3: a size-only bufferData mid-batch cannot desync '
      'the batch cursor', () async {
    final (wire, _, state, _) = await run1bRealEngine(
      _widget('''
// One batch: bufferData with the SIZE-ONLY convention (a bare number —
// len field only) followed by commands whose decoded position used to
// shift by that size (the cursor advanced over bytes that were never
// written), corrupting every later command in the batch.
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER, 16, gl.STATIC_DRAW);
gl.clearColor(1.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
var err1 = gl.getError(); // flushes the batch as its last command
// The cleared default framebuffer must be red: the clear RAN in this batch.
var px = new Uint8Array(4);
gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
out.red = Array.prototype.slice.call(px, 0);
// The reserved buffer is still addressable and takes real data cleanly.
gl.bufferSubData(gl.ARRAY_BUFFER, 0,
    new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]));
var back = new Uint8Array(16);
gl.getBufferSubData(gl.ARRAY_BUFFER, 0, back);
out.bufferRoundTrip = Array.prototype.slice.call(back, 0, 4);
out.err = gl.getError();
out.err1 = err1;
'''),
      'var THREE = {};',
      width: 64,
      height: 64,
    );
    track(wire);
    expect(state?['errors'] as List?, isEmpty, reason: '${state?['errors']}');
    expect(state?['err1'], 0, reason: 'the batch answered NO_ERROR');
    expect(
      state?['red'],
      <dynamic>[255, 0, 0, 255],
      reason:
          'the clear after the size-only bufferData ran in the same '
          'batch (a desynced cursor dropped it)',
    );
    expect(state?['bufferRoundTrip'], <dynamic>[1, 2, 3, 4]);
    expect(state?['err'], 0);
  }, skip: missing);
}

/// The shared widget shell: bare canvas + webgl2 facade over the engine's
/// real 1B wire, one `out` results map, one error net (single definition,
/// no clone — the duplication gate). The widget replaces the bootstrap's
/// indexOf-based atob fallback with a lookup-table decoder — the blob
/// sweep reads back megabytes through the base64 scratch lane and the
/// indexOf decoder dominates that runtime otherwise.
String _widget(String body) =>
    '''
var out = { runs: 0, fboIncomplete: 0, badErr: [], errors: [], sweep: {}, sizesChecked: 0 };
try {
  var B64CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var LUT = new Int8Array(128);
  for (var li = 0; li < 64; li++) LUT[B64CH.charCodeAt(li)] = li;
  globalThis.atob = function (input) {
    var n = input.length, out = '', pad = 0;
    if (n >= 1 && input.charCodeAt(n - 1) === 61) pad++;
    if (n >= 2 && input.charCodeAt(n - 2) === 61) pad++;
    var end = n - pad;
    for (var i = 0; i < end; i += 4) {
      var c0 = LUT[input.charCodeAt(i)] << 18;
      var c1 = LUT[input.charCodeAt(i + 1)] << 12;
      var c2 = i + 2 < end ? LUT[input.charCodeAt(i + 2)] << 6 : 0;
      var c3 = i + 3 < end ? LUT[input.charCodeAt(i + 3)] : 0;
      var n3 = c0 | c1 | c2 | c3;
      out += String.fromCharCode((n3 >> 16) & 255);
      if (i + 2 < end) out += String.fromCharCode((n3 >> 8) & 255);
      if (i + 3 < end) out += String.fromCharCode(n3 & 255);
    }
    return out;
  };
  var canvas = document.createElement('canvas');
  canvas.width = 8; canvas.height = 8;
  var gl = canvas.getContext('webgl2', { antialias: false, depth: false });
  if (!gl) throw new Error('no webgl2 context');
  $body
} catch (e) {
  out.errors.push(String((e && e.message) || e));
}
jsr.exportState(out);
''';
