import 'dart:convert';
import 'dart:ffi' as ffi;
import 'dart:typed_data';

import 'package:ffi/ffi.dart';

import 'fake_three_host.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_host.dart'
    show JsThree1BWire;

import '../../tool/three/bench_1b.dart' show Shim, readGlScratch;

/// Builds one single G1 command (LE `u32 opcode` + LE args; ints as i32,
/// doubles as f32) for raw-wire tests.
Uint8List g1Command(int opcode, [List<Object> args = const <Object>[]]) {
  final b = BytesBuilder();
  final head = ByteData(4)..setUint32(0, opcode, Endian.little);
  b.add(head.buffer.asUint8List());
  for (final arg in args) {
    final v = ByteData(4);
    if (arg is int) {
      v.setInt32(0, arg, Endian.little);
    } else if (arg is double) {
      v.setFloat32(0, arg, Endian.little);
    } else {
      throw ArgumentError.value(arg, 'arg', 'G1 args are int or double');
    }
    b.add(v.buffer.asUint8List());
  }
  return b.toBytes();
}

/// The C sentinel returned when no current surface backs the dispatch
/// (angle_1b_dispatch.c) and the malformed-frame error code.
const int g1NoCurrentSurface = -0x7fffffff;
const int g1EMalformed = -0x7ffffffe;

/// Copies [bytes] into a native buffer and runs `a1b_gl_dispatch`
/// (the empty stream exercises the `len < 4` guard with a 1-byte buffer).
int dispatchBytes(Shim shim, List<int> bytes) {
  final buf = calloc<ffi.Uint8>(bytes.length < 1 ? 1 : bytes.length);
  try {
    if (bytes.isNotEmpty) buf.asTypedList(bytes.length).setAll(0, bytes);
    return shim.dispatch(buf, bytes.length);
  } finally {
    calloc.free(buf);
  }
}

/// A [JsThree1BWire] whose dispatch lane replays every G1 batch through the
/// REAL C decoder (`a1b_gl_dispatch`) on a live ANGLE surface and whose
/// scratch lane reads the real `a1b_gl_result`. Engine-level E2E tests
/// (real bundle + facade + ANGLE through the full JsWidgetEngine stack)
/// ride this wire; without the pinned dylib the tests skip.
///
/// The display (`a1b_init`) is idempotent, so several hosts may coexist in
/// one process; each owns its surface and must be [dispose]d.
class Real1BWireHost extends Fake1BWireHost {
  Real1BWireHost({this.width = 64, this.height = 64}) {
    shim = Shim();
    final rc = shim.init();
    if (rc != 0) {
      throw StateError('a1b_init failed: $rc');
    }
    final idOut = calloc<ffi.Uint32>();
    try {
      surface = shim.createSurface(width, height, idOut);
      if (surface <= 0) {
        throw StateError('a1b_create_surface failed: $surface');
      }
      if (shim.makeCurrent(surface) != 0) {
        throw StateError('a1b_make_current failed for surface $surface');
      }
    } finally {
      calloc.free(idOut);
    }
  }

  late final Shim shim;
  late final int surface;
  final int width;
  final int height;
  int _parkedRc = 0;

  @override
  int dispatch1B(String engineId, Uint8List command) {
    // Record like the fake wire, then replay through the real decoder.
    dispatches1B.add(Uint8List.fromList(command));
    final buf = calloc<ffi.Uint8>(command.length);
    try {
      buf.asTypedList(command.length).setAll(0, command);
      _parkedRc = shim.dispatch(buf, command.length);
    } finally {
      calloc.free(buf);
    }
    return _parkedRc;
  }

  @override
  String result1BAsBase64(String engineId) =>
      base64Encode(readGlScratch(shim.lib));

  /// Destroys this host's surface. The display stays (idempotent init lets
  /// later hosts re-use it); a full `a1b_shutdown` belongs to tearDownAll
  /// (`disposeRegisteredReal1BWires`). The wire leaves the live registry
  /// here, so mid-test disposes (it_life_1's E2E-LIFE-1) can never be
  /// double-destroyed by a file teardown.
  void dispose() {
    shim.destroySurface(surface);
    liveReal1BWires.remove(this);
  }
}

/// The deterministic end-of-process teardown for the real 1B wires: destroy
/// every surface, then the full `a1b_shutdown` (release the current EGL
/// context, destroy the context, terminate the display, dlclose the GL
/// libraries) — the teardown this file's constructor comment names. Relying
/// on process-exit teardown of the live display segfaults the test process
/// on the CI Paravirtual GPU (all tests green, crash at finalization),
/// which is why every f4b tearDownAll calls this instead of a bare dispose
/// loop.
void disposeReal1BWires(Iterable<Real1BWireHost> wires) {
  Shim? shimForShutdown;
  for (final w in wires) {
    w.dispose();
    shimForShutdown ??= w.shim;
  }
  shimForShutdown?.shutdown();
}

/// The file-scoped registry of LIVE real 1B wires (flutter runs every test
/// file in its own isolate, so this top-level set holds exactly one file's
/// wires). The shared 1B runner registers every wire it creates or accepts
/// (F4-merge CI lesson: each test file must end with a deterministic
/// teardown — a live display at process exit segfaults the CI Paravirtual
/// GPU even when every test passed). A wire leaves the registry when it is
/// disposed (including mid-test disposes such as it_life_1's E2E-LIFE-1),
/// so a teardown can never double-destroy a surface.
final Set<Real1BWireHost> liveReal1BWires = <Real1BWireHost>{};

/// Registers a live real 1B wire. Called by `run1bRealEngine` for every
/// wire it hands out; direct `Real1BWireHost` constructions outside the
/// runner register themselves the same way.
void registerReal1BWire(Real1BWireHost wire) => liveReal1BWires.add(wire);

/// THE deterministic teardown every real-wire test file calls once in
/// `tearDownAll`: drains the live registry (surfaces destroyed), runs the
/// full `a1b_shutdown`, and prints the before/after live counts so a file
/// that ends with anything still live is visible in the log.
void disposeRegisteredReal1BWires() {
  final wires = liveReal1BWires.toList();
  // ignore: avoid_print
  print('oneb teardown: ${wires.length} live wire(s) at file end');
  disposeReal1BWires(wires);
  // ignore: avoid_print
  print('oneb teardown: ${liveReal1BWires.length} live wire(s) remain');
}
