import 'dart:ffi' as ffi;
import 'dart:io';
import 'dart:typed_data';

import 'package:ffi/ffi.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_cinematic_capture_host.dart';

import 'three_1b_engine.dart';
import 'three_1b_real_wire.dart';
import 'f4i_png_codec.dart';

// Shared F4i harness (issue #8, segment F4i, AC15): assembles the host-proof
// widget for the native 1B leg from the SAME sources the web leg runs —
// tool/three/cinematic_host_proof/{scene_f4i.js,widget_f4i.js} plus the
// staged stock r186 AfterimagePass — runs it through the real engine stack
// with a capture-barrier host that writes the PNG-sequence files, and
// verifies the decoded PNG files against the exported frame hashes.

const String kF4iDir = '/tmp/f4i/oneb';

/// Stages the stock r186 AfterimagePass (stage_afterimage.mjs: pinned
/// checkout of record, or the pin commit over the network) and returns the
/// plain-script bundle text for the engine prelude.
Future<String> stageF4iAfterimage() async {
  final out = '$kF4iDir/afterimage_f4i.js';
  Directory(kF4iDir).createSync(recursive: true);
  final r = await Process.run('node', <String>[
    'tool/three/cinematic_host_proof/stage_afterimage.mjs',
    '--out',
    out,
  ]).timeout(const Duration(minutes: 2));
  if (r.exitCode != 0) {
    throw StateError('stage_afterimage.mjs failed: ${r.stdout}\n${r.stderr}');
  }
  return File(out).readAsStringSync();
}

String f4iScene() =>
    File('tool/three/cinematic_host_proof/scene_f4i.js').readAsStringSync();

String f4iProgram() =>
    File('tool/three/cinematic_host_proof/widget_f4i.js').readAsStringSync();

/// The widget text for the engine leg: staged stock AfterimagePass + scene +
/// program (the same concatenation order as the web page).
String f4iWidget(String stagedAfterimage, {bool noCapture = false}) =>
    '$stagedAfterimage\n${noCapture ? "globalThis.__F4I_NO_CAPTURE = true;\n" : ''}'
    '${f4iScene()}\n${f4iProgram()}';

/// The capture barrier host of the native leg: reads the presented ANGLE
/// surface at the captureFrame(clock) barrier, encodes the straight-alpha
/// PNG itself (exactly what the downstream host does), writes
/// <dir>/frame_<nnnn>.png, decodes the written file back and records its
/// hash — the file IS the evidence the Dart test compares against the
/// exported preview/screenshot hashes.
class F4iCaptureHost extends JsCinematicCaptureHost {
  F4iCaptureHost(this._wire, this.dir) {
    Directory(dir).createSync(recursive: true);
  }

  final Real1BWireHost _wire;
  final String dir;

  /// frame -> hash of the decoded PNG file (as written to disk).
  final Map<int, String> pngHashByFrame = <int, String>{};
  final List<String> files = <String>[];

  @override
  Future<Map<String, dynamic>> capture(
    String engineId,
    Map<String, dynamic> clock,
  ) async {
    final frame = (clock['frame'] as num).toInt();
    final shim = _wire.shim;
    // The corpus read flow: make the wire's surface current, present it,
    // then read the straight RGBA back. (Open issue on this leg: once the
    // engine's GL state is live the read fails with GL_INVALID_OPERATION —
    // bare-wire probes with the same flow succeed. A failure maps to the
    // named capture error so the run completes honestly instead of
    // producing an effect-less image.)
    if (shim.makeCurrent(_wire.surface) != 0) {
      throw StateError('a1b_make_current failed at frame $frame');
    }
    if (shim.swapBuffers(_wire.surface) != 0) {
      throw StateError('a1b_swap_buffers failed at frame $frame');
    }
    final px = calloc<ffi.Uint8>(_wire.width * _wire.height * 4);
    final wOut = calloc<ffi.Int32>();
    final hOut = calloc<ffi.Int32>();
    try {
      final rc = shim.readPixels(_wire.surface, px, wOut, hOut);
      if (rc != 0) {
        throw StateError('a1b_read_pixels failed ($rc) at frame $frame');
      }
      final w = wOut.value;
      final h = hOut.value;
      final rgba = Uint8List.fromList(px.asTypedList(w * h * 4));
      Directory(dir).createSync(recursive: true);
      final file = '$dir/frame_${frame.toString().padLeft(4, '0')}.png';
      File(file).writeAsBytesSync(encodePngStraightRgba(rgba, w, h));
      final decoded = decodePngStraightRgba(File(file).readAsBytesSync());
      if (decoded.width != w || decoded.height != h) {
        throw StateError('png round trip changed the size at frame $frame');
      }
      pngHashByFrame[frame] = fnv1aHex(decoded.rgba);
      files.add(file);
      return <String, dynamic>{'path': file, 'width': w, 'height': h};
    } finally {
      calloc.free(px);
      calloc.free(wOut);
      calloc.free(hOut);
    }
  }
}

/// Runs the host-proof widget on the real 1B engine stack (ANGLE wire) with
/// [noCapture] switching the capture barrier host off (REG-HOST-CAPTURE).
/// Returns (exported state, capture host — null in the no-capture run,
/// engine log).
Future<(Map<String, dynamic>, F4iCaptureHost?, List<Map<String, dynamic>>)>
runF4iOn1B(
  String stagedAfterimage, {
  bool noCapture = false,
  String dir = kF4iDir,
}) async {
  final wire = Real1BWireHost(width: 96, height: 64)
    ..facadeBootstrapOverride = real1bFacadeBootstrap();
  final captureHost = noCapture ? null : F4iCaptureHost(wire, dir);
  final logs = <Map<String, dynamic>>[];
  final (engineWire, reported, state) = await run1bWidgetEngine(
    f4iWidget(stagedAfterimage, noCapture: noCapture),
    threeSource: File('assets/three/jsr_three_web.js').readAsStringSync(),
    realFacade: true,
    host: wire,
    consoleLogs: logs,
    cinematicCaptureHost: captureHost,
    // This proof host allows the stock shader-based passes (the same program
    // runs unrestricted on the web leg; the stock AfterimagePass/BokehPass
    // are ShaderMaterials, and the default host policy denies custom GLSL).
    allowCustomShaders: true,
  );
  addTearDown((engineWire as Real1BWireHost).dispose);
  expect(reported?.isAngle1b, isTrue, reason: 'the 1B lane is required');
  expect(widgetErrorLogs(logs), isEmpty, reason: 'no engine-level errors');
  if (state == null) {
    throw StateError('the F4i widget exported no state (engine log: $logs)');
  }
  return (state, captureHost, logs);
}

/// The exported state with the error net checked first.
Map<String, dynamic> f4iState(Map<String, dynamic> state) {
  final error = state['error'];
  if (error != null) {
    throw StateError('the F4i widget errored: $error');
  }
  return state;
}
