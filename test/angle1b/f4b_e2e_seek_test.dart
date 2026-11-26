import 'dart:ffi' as ffi;
import 'dart:io';

import 'package:ffi/ffi.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import '../../tool/three/bench_1b.dart' show Shim, fnv1a;
import '../support/three_1b_engine.dart';
import '../support/three_1b_real_wire.dart';

// E2E-SEEK-* / REG-DETERMINISM / IT-CLOCK-2 (issue #8, F4b): the shared
// battery (`tool/three/cases_f4b/f4b_case_source.js`) drives the core
// cinematic pipeline (stock UnrealBloomPass) through the REAL 1B stack
// (QuickJS -> facade -> G1 -> ANGLE) and pins the deterministic frame and
// capture semantics on native 1B:
//
//   E2E-SEEK-1  sequential frames == a direct seek to the same clock (hash)
//   E2E-SEEK-2  reversed and repeated seeks reproduce the same frames
//   E2E-SEEK-3  a frozen clock gives identical frames
//   E2E-SEEK-4  the barrier capture returns the frame AFTER the final pass
//               (the Dart capture host reads the presented surface and the
//               surface hash equals the in-JS readback hash of that frame)
//   IT-CLOCK-2  an artificial host delay between frames changes no hash
//   REG-DETERMINISM  sequential/direct/reversed/repeated cannot diverge AND
//               the divergence control proves the comparisons bite (a
//               perturbed scene changes the hash)
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final bundle = File('assets/three/jsr_three_web.js').readAsStringSync();
  final caseSource = File(
    'tool/three/cases_f4b/f4b_case_source.js',
  ).readAsStringSync();
  final missing = Shim.resolveProblem();

  final captures = <_SurfaceCapture>[];
  final wires = <Real1BWireHost>[];

  _SurfaceCaptureHost makeCaptureHost(Real1BWireHost wire) =>
      _SurfaceCaptureHost(wire, captures);

  Future<Map<String, dynamic>?> run() async {
    final wire = Real1BWireHost(width: 320, height: 180)
      ..facadeBootstrapOverride = real1bFacadeBootstrap();
    wires.add(wire);
    final host = makeCaptureHost(wire);
    final (_, sel, state, logs) = await run1bRealEngine(
      '$caseSource\n$f4bBatteryGlue',
      bundle,
      width: 320,
      height: 180,
      cinematicCaptureHost: host,
      exportTimeout: const Duration(seconds: 30),
      wire: wire,
    );
    f4bExpectBatteryLeg(sel, logs, state);
    return state;
  }

  Future<Map<String, dynamic>?>? memo;
  Future<Map<String, dynamic>?> state() =>
      missing != null ? Future.value(null) : (memo ??= run());

  tearDownAll(() async {
    for (final w in wires) {
      w.dispose();
    }
  });

  test(
    'E2E-SEEK-1: sequential frames 0..12 equal a direct seek to frame 12 '
    '(hash equality, native 1B)',
    () async {
      final s = await state();
      if (missing != null) return;
      f4bExpectChecksAll(s, ['directSeekEqualsSequential']);
      final seq = (s!['seq'] as List).cast<String>();
      expect(s['direct12'], seq[12]);
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 5)),
  );

  test(
    'E2E-SEEK-2: reversed seeks land on the sequential frame-0 hash and '
    'repeated renders of frame 5 are identical (native 1B)',
    () async {
      final s = await state();
      if (missing != null) return;
      f4bExpectChecksAll(s, ['reversedSeekMatches', 'repeatedSeekMatches']);
      final seq = (s!['seq'] as List).cast<String>();
      expect(s['rev0'], seq[0]);
      final rep = (s['rep5'] as List).cast<String>();
      expect(rep.toSet().single, seq[5]);
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 5)),
  );

  test(
    'E2E-SEEK-3: a frozen clock gives identical frames, five times over '
    '(native 1B)',
    () async {
      final s = await state();
      if (missing != null) return;
      f4bExpectChecksAll(s, ['frozenClockIdentical']);
      final seq = (s!['seq'] as List).cast<String>();
      final frozen = (s['frozen7'] as List).cast<String>();
      expect(frozen.toSet().single, seq[7]);
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 5)),
  );

  test(
    'E2E-SEEK-4: the barrier capture returns the frame after the final '
    'pass — the presented-surface hash equals the frame-9 present hash',
    () async {
      final s = await state();
      if (missing != null) return;
      final capture = s!['capture9'] as Map<String, dynamic>;
      expect(
        capture['ok'],
        isTrue,
        reason: 'the native barrier capture resolves: $capture',
      );
      expect(capture['error'], isNull);
      final seq = (s['seq'] as List).cast<String>();
      expect(
        captures,
        hasLength(1),
        reason: 'exactly one barrier capture was made',
      );
      final rec = captures.single;
      expect(rec.frame, 9, reason: 'the capture names the clock it captured');
      expect(rec.engineId, isNotEmpty, reason: 'the capture carries __IID');
      expect(
        rec.surfaceHash,
        s['present9'],
        reason:
            'surface=${rec.surfaceHash} vs present9=${s['present9']} — the '
            'capture must show the final pass of frame 9, not a stale '
            'frame (the composer readback path differs in encoding, so '
            'the comparison target is the in-JS RGBA8 read of the '
            'presented frame, not seq[9])',
      );
      expect(seq[9], isNot('0x00000000'));
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 5)),
  );

  test(
    'IT-CLOCK-2: an artificial host delay between frames changes no hash '
    '(native 1B)',
    () async {
      final s = await state();
      if (missing != null) return;
      f4bExpectChecksAll(s, ['hostDelayNeutral']);
      final seq = (s!['seq'] as List).cast<String>();
      final delayed = (s['delay6'] as List).cast<String>();
      for (var k = 0; k <= 6; k++) {
        expect(delayed[k], seq[k], reason: 'frame $k with a 35 ms host gap');
      }
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 5)),
  );

  test(
    'REG-DETERMINISM: sequential/direct/reversed/repeated captures cannot '
    'diverge, and the divergence control proves the gate bites',
    () async {
      final s = await state();
      if (missing != null) return;
      f4bExpectChecksAll(s, [
        'directSeekEqualsSequential',
        'reversedSeekMatches',
        'repeatedSeekMatches',
        'frozenClockIdentical',
      ]);
      // The bite control: a perturbed scene at frame 3 MUST produce a
      // different hash — the equality checks above can only detect a real
      // regression because this probe changes the image.
      final seq = (s!['seq'] as List).cast<String>();
      expect(s['diverge3'], isNot(seq[3]), reason: 'perturbed scene frame 3');
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 5)),
  );
}

/// The FNV-1a int as the same '0x%08x' string the widget-side battery
/// computes (the comparison target of E2E-SEEK-4).
String _hashHex(int hash) =>
    '0x${(hash & 0xFFFFFFFF).toRadixString(16).padLeft(8, '0')}';

class _SurfaceCapture {
  _SurfaceCapture(this.engineId, this.frame, this.surfaceHash);
  final String engineId;
  final int frame;
  final String surfaceHash;
}

/// The cinematic capture barrier host of the native leg: reads the REAL
/// presented ANGLE surface at capture time (after the final pass) and
/// records its FNV hash for the E2E-SEEK-4 comparison. The read is the CPU
/// IOSurface readback (`a1b_read_surface_cpu`): the EGL context is current
/// on the engine's worker isolate, so the host must not call glReadPixels
/// from the main isolate (INVALID_OPERATION).
class _SurfaceCaptureHost extends JsCinematicCaptureHost {
  _SurfaceCaptureHost(this.wire, this.records);
  final Real1BWireHost wire;
  final List<_SurfaceCapture> records;

  @override
  Future<Map<String, dynamic>> capture(
    String engineId,
    Map<String, dynamic> clock,
  ) async {
    final wOut = calloc<ffi.Int32>();
    final hOut = calloc<ffi.Int32>();
    final px = calloc<ffi.Uint8>(wire.width * wire.height * 4);
    try {
      if (wire.shim.readSurfaceCpu(wire.surface, px, wOut, hOut) != 0) {
        throw StateError('a1b_read_surface_cpu failed');
      }
      final hash = _hashHex(fnv1a(px.asTypedList(wOut.value * hOut.value * 4)));
      records.add(
        _SurfaceCapture(engineId, (clock['frame'] as num).toInt(), hash),
      );
      return {'width': wOut.value, 'height': hOut.value};
    } finally {
      calloc.free(wOut);
      calloc.free(hOut);
      calloc.free(px);
    }
  }
}
