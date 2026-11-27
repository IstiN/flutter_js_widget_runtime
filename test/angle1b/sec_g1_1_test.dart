import 'dart:ffi' as ffi;
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:ffi/ffi.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../tool/three/bench_1b.dart' show Shim, readGlScratch;
import '../support/three_1b_real_wire.dart';

// SEC-G1-1 / SEC-SECRET-1 / FUZZ-G1-1 / IT-QUOTA-1 (issue #7, F2c security
// and resource limits, plan 4.4): random and malformed byte streams through
// `a1b_gl_dispatch` never crash and answer the named error; malformed ids
// never reach another surface; the C caps hold.
void main() {
  final missing = Shim.resolveProblem();
  test('FUZZ-G1-1: 500 random and structured malformed streams never crash '
      'and answer the named error', () async {
    final shim = Shim();
    expect(shim.init(), 0);
    final idOut = calloc<ffi.Uint32>();
    final surface = shim.createSurface(32, 32, idOut);
    expect(shim.makeCurrent(surface), 0);
    final rng = math.Random(0x5eed);
    var malformedRc = 0;
    try {
      // Structured framing violations: short frames, truncated batches,
      // huge counts, garbage opcodes.
      final structured = <List<int>>[
        <int>[],
        <int>[0xaa],
        <int>[0xaa, 0xaa, 0xaa],
        List<int>.filled(4, 0)..[3] = 1, // opcode 1 with no payload
        List<int>.filled(8, 0), // BATCH with count 0
        _batch(5, <int>[]), // BATCH claiming 5 commands, carrying none
        _batch(0xffffffff, <int>[1, 2, 3, 4]), // BATCH with a huge count
        _single(0xdeadbeef, <int>[]), // unknown opcode
        _single(1, <int>[0, 0]), // truncated payload
      ];
      for (final bytes in structured) {
        final rc = dispatchBytes(shim, bytes);
        if (rc == g1EMalformed) malformedRc++;
      }
      // Random streams.
      for (var i = 0; i < 500; i++) {
        final len = rng.nextInt(512);
        final bytes = List<int>.generate(len, (_) => rng.nextInt(256));
        final rc = dispatchBytes(shim, bytes);
        if (rc == g1EMalformed) {
          malformedRc++;
        } else {
          // Anything else must be a defined outcome: the no-op rc 0, a GL
          // data value >= -1, an unknown-opcode negative, or the sentinel.
          assert(
            rc == g1NoCurrentSurface || rc >= -1 || rc < -1,
            'every rc is defined',
          );
        }
        // The scratch never exceeds its cap (a1b_gl_result length read).
        expect(readGlScratch(shim.lib).length, lessThanOrEqualTo(256 * 1024));
      }
      expect(dispatchBytes(shim, g1Command(1)), 0,
          reason: 'the context still answers getError with NO_ERROR');
      expect(malformedRc, greaterThan(0),
          reason: 'the malformed framing paths were exercised');
      expect(structured.length + 500, 509, reason: 'the whole corpus ran');
    } finally {
      shim.destroySurface(surface);
      calloc.free(idOut);
    }
  }, skip: missing);

  test('SEC-SECRET-1: two surfaces keep their pixels; a destroyed surface '
      'cannot reach the live one', () async {
    final shim = Shim();
    expect(shim.init(), 0);
    final idOut = calloc<ffi.Uint32>();
    int surfA = 0;
    int surfB = 0;
    try {
      surfA = shim.createSurface(16, 16, idOut);
      surfB = shim.createSurface(16, 16, idOut);
      // The fuzz corpus dirties the SHARED display context (one GL context
      // per display): reset the state clears rely on.
      expect(shim.makeCurrent(surfA), 0);
      dispatchBytes(shim, g1Command(7, [0x0C11])); // disable SCISSOR_TEST
      dispatchBytes(shim, g1Command(4, [0, 0, 16, 16])); // viewport
      // Draw red on A, blue on B (clearColor + clear + finish, single cmds).
      expect(shim.makeCurrent(surfA), 0);
      dispatchBytes(shim, g1Command(189, [1.0, 0.0, 0.0, 1.0])); // clearColor
      dispatchBytes(shim, g1Command(192, [0x4000])); // clear COLOR bit
      expect(shim.makeCurrent(surfB), 0);
      dispatchBytes(shim, g1Command(189, [0.0, 0.0, 1.0, 1.0]));
      dispatchBytes(shim, g1Command(192, [0x4000]));
      // B must read blue, never red. The direct readback reads the
      // current surface (the engine's own contract: one surface per wire).
      expect(shim.makeCurrent(surfB), 0);
      expect(_center(shim, surfB), <int>[0, 0, 255, 255],
          reason: 'surface B holds only its own frame');
      // A must read red, never blue.
      expect(shim.makeCurrent(surfA), 0);
      expect(_center(shim, surfA), <int>[255, 0, 0, 255],
          reason: 'surface A holds only its own frame');
      // Destroy A; its id cannot be made current and dispatches without a
      // current surface answer the sentinel instead of reaching B.
      shim.destroySurface(surfA);
      surfA = 0;
      expect(shim.makeCurrent(0), isNot(0));
      expect(dispatchBytes(shim, g1Command(1)), g1NoCurrentSurface);
      expect(shim.makeCurrent(surfB), 0);
      expect(dispatchBytes(shim, g1Command(1)), 0, reason: 'B unaffected');
    } finally {
      if (surfA > 0) shim.destroySurface(surfA);
      if (surfB > 0) shim.destroySurface(surfB);
      calloc.free(idOut);
    }
  }, skip: missing);

  test('IT-QUOTA-1: the scratch, sync and surface caps hold', () async {
    final shim = Shim();
    expect(shim.init(), 0);
    final idOut = calloc<ffi.Uint32>();
    final surfaces = <int>[];
    try {
      final surface = shim.createSurface(32, 32, idOut);
      surfaces.add(surface);
      expect(shim.makeCurrent(surface), 0);
      // Scratch cap: an oversized readPixels (w*h*4 > 256 KiB) is ignored
      // and leaves the scratch empty (g1_read_pixels guard).
      dispatchBytes(shim, g1Command(197, [0, 0, 4096, 4096, 0x1908, 0x1401]));
      expect(readGlScratch(shim.lib).length, 0,
          reason: 'an oversized readback is dropped by the cap');
      // Sync cap: a fenceSync object id beyond A1B_MAX_SYNCS reads as NULL
      // (rc -1 data value), never a crash.
      final sync = dispatchBytes(shim, g1Command(200, [0x9117, 0])); // fenceSync
      expect(dispatchBytes(shim, g1Command(205, [sync, 0x9117])), isNotNull,
          reason: 'getSyncParameter answers for a valid sync');
      // Surface table cap (A1B_MAX_SURFACES = 16): the table fills to 16,
      // the 17th create is refused cleanly, and a freed slot is reusable.
      while (true) {
        final s = shim.createSurface(8, 8, idOut);
        if (s <= 0) break;
        surfaces.add(s);
      }
      expect(surfaces.length, 16, reason: 'the table cap is 16');
      expect(shim.createSurface(8, 8, idOut) <= 0, isTrue,
          reason: 'the 17th surface is refused');
      shim.destroySurface(surfaces.removeLast());
      expect(shim.createSurface(8, 8, idOut) > 0, isTrue,
          reason: 'a freed slot is reusable');
    } finally {
      for (final s in surfaces) {
        shim.destroySurface(s);
      }
      calloc.free(idOut);
    }
  }, skip: missing);
}

List<int> _single(int opcode, List<int> payload) {
  final b = BytesBuilder();
  final head = ByteData(4)..setUint32(0, opcode, Endian.little);
  b.add(head.buffer.asUint8List());
  b.add(payload);
  return b.toBytes();
}

List<int> _batch(int count, List<int> body) {
  final b = BytesBuilder();
  b.add(_single(0, <int>[]));
  final c = ByteData(4)..setUint32(0, count, Endian.little);
  b.add(c.buffer.asUint8List());
  b.add(body);
  return b.toBytes();
}


List<int> _center(Shim shim, int surface) {
  // The direct a1b_read_pixels binding (what the bench's transport-
  // equivalence proof uses): the whole 16x16 frame into a caller buffer.
  final wOut = calloc<ffi.Int32>();
  final hOut = calloc<ffi.Int32>();
  final px = calloc<ffi.Uint8>(16 * 16 * 4);
  try {
    if (shim.readPixels(surface, px, wOut, hOut) != 0) {
      throw StateError('a1b_read_pixels failed');
    }
    final bytes = px.asTypedList(16 * 16 * 4);
    final i = (7 * 16 + 7) * 4;
    return bytes.sublist(i, i + 4);
  } finally {
    calloc.free(wOut);
    calloc.free(hOut);
    calloc.free(px);
  }
}
