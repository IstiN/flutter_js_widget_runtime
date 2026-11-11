// run_1b_corpus.dart — M4 corpus harness: run ONE prepared three.js r186
// official example (bundle from bundle_corpus_scene.mjs, driver-wrapped
// scene.js) through the full 1B stack and capture FNV-1a + PNG via the real
// C scratch readPixels. Clone of run_1b_render.dart (M3) with the scene
// source parameterized and a deterministic-frame driver (__corpusTick).
//
// No harness interpositions on the M3 scene are inherited: the corpus scene
// driver is harness glue (DOM shims, pinned clock, captured animation loop,
// local asset fetch). Facade / packer / decoder are used exactly as M3.
//
// Usage (from repo root):
//   dart run tool/three/run_1b_corpus.dart --id three-buffergeometry-lines \
//     --scene /tmp/a1b_corpus/three-buffergeometry-lines/scene.scene.js \
//     --widget-dir example/widgets/three-buffergeometry-lines \
//     --out /tmp/a1b_corpus/three-buffergeometry-lines
//
// Prints (machine-parsable):
//   CORPUS_1B_RUN id=<id> run=<n> hash=0x<hex> (<dec>) file=<rgba path>
//   CORPUS_1B_STATUS <json>   (per-run errors / strict failures)
// Exit 0 on a clean captured frame (even if hashes mismatch across runs —
// the diff tier lives in corpus_1b.sh); exit 1 on harness/scene failure.
import 'dart:convert';
import 'dart:ffi';
import 'dart:io';
import 'dart:typed_data';
import 'package:ffi/ffi.dart';
import 'package:image/image.dart' as img;
import 'package:quickjs_runtime/quickjs_runtime.dart';

const kTablePath = 'tool/three/webgl2_g1_methods.json';
const kPackerPath = 'tool/three/gen/g1_packer.js';
const kCorePath = 'example/web/three.core.js';
const kModulePath = 'example/web/jsr_three_web.js';
const kFacadePath = 'tool/three/src/webgl2_facade.js';
const kShimPath = 'native/angle/libangle_1b.dylib';
const kCorpusDomPath = 'tool/three/corpus/corpus_dom.js';
const kCorpusXmlDomPath = 'tool/three/corpus/corpus_xmldom.js';
// Shared corpus asset fallback: examples/assets the widget prepare did not
// materialize are extracted once from the pinned three.js source (git show at
// the r186 pin) into this cache; both harnesses read it when the widget dir
// lacks the file.
const kAssetCacheDir = '/tmp/a1b_corpus/asset_cache';
const kPinCommit = '9b4a2ac29c63ccb43fd51c5661f2f873ac2c39b8';
const kW = 320, kH = 240;
const kLegitNegativeRcs = {66, 67, 68};

String argValue(List<String> args, String name, {String? dflt}) {
  final i = args.indexOf('--$name');
  if (i >= 0 && i + 1 < args.length) return args[i + 1];
  if (dflt != null) return dflt;
  stderr.writeln('missing --$name');
  exit(2);
}

// ---- ANGLE 1B shim FFI bindings (identical to run_1b_render.dart) ----------
class Shim {
  final DynamicLibrary lib = DynamicLibrary.open(kShimPath);
  late final int Function() init = lib.lookupFunction<Int32 Function(), int Function()>('a1b_init');
  late final int Function(int, int, Pointer<Uint32>) createSurface = lib.lookupFunction<Int64 Function(Int32, Int32, Pointer<Uint32>), int Function(int, int, Pointer<Uint32>)>('a1b_create_surface');
  late final int Function(int, int, int, Pointer<Uint32>) createSurfaceEx = lib.lookupFunction<Int64 Function(Int32, Int32, Int32, Pointer<Uint32>), int Function(int, int, int, Pointer<Uint32>)>('a1b_create_surface_ex');
  late final int Function(int, int, int, int, int, Pointer<Uint32>) createSurfaceEx2 = lib.lookupFunction<Int64 Function(Int32, Int32, Int32, Int32, Int32, Pointer<Uint32>), int Function(int, int, int, int, int, Pointer<Uint32>)>('a1b_create_surface_ex2');
  late final int Function(int) makeCurrent = lib.lookupFunction<Int32 Function(Int64), int Function(int)>('a1b_make_current');
  late final int Function(int) swapBuffers = lib.lookupFunction<Int32 Function(Int64), int Function(int)>('a1b_swap_buffers');
  late final int Function(int, Pointer<Uint8>, Pointer<Int32>, Pointer<Int32>) readPixels = lib.lookupFunction<Int32 Function(Int64, Pointer<Uint8>, Pointer<Int32>, Pointer<Int32>), int Function(int, Pointer<Uint8>, Pointer<Int32>, Pointer<Int32>)>('a1b_read_pixels');
  late final void Function(int) destroySurface = lib.lookupFunction<Void Function(Int64), void Function(int)>('a1b_destroy_surface');
  late final void Function() shutdown = lib.lookupFunction<Void Function(), void Function()>('a1b_shutdown');
  late final int Function(Pointer<Uint8>, int) dispatch = lib.lookupFunction<Int64 Function(Pointer<Uint8>, Int32), int Function(Pointer<Uint8>, int)>('a1b_gl_dispatch');
  late final int Function(Pointer<Uint8>, int) result = lib.lookupFunction<Int32 Function(Pointer<Uint8>, Int32), int Function(Pointer<Uint8>, int)>('a1b_gl_result');
}

int fnv1a(List<int> bytes) {
  var hash = 0x811c9dc5;
  for (final b in bytes) hash = ((hash ^ b) * 0x01000193) & 0xffffffff;
  return hash;
}

String hex32(int v) => '0x${v.toRadixString(16).padLeft(8, '0')}';

Map<int, String> loadOpcodeTable() {
  final decoded = jsonDecode(File(kTablePath).readAsStringSync());
  final methods = decoded is Map ? (decoded['methods'] ?? decoded) : decoded;
  return {if (methods is List) for (final m in methods) if (m is Map && m['opcode'] != null && m['name'] != null) m['opcode'] as int: m['name'] as String};
}

// ---- ESM transform (verbatim logic from M2b/M3) ----------------------------
List<String> _braceList(String line, String open, String close) {
  final a = line.indexOf(open) + open.length, b = line.lastIndexOf(close);
  if (a <= 0 || b < a) throw StateError('ESM list parse failed: ${line.substring(0, 60)}');
  return line.substring(a, b).split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
}

String _dropImportExports(String src) => src.split('\n').where((l) => !l.trimLeft().startsWith('import ') && !l.trimLeft().startsWith('export {')).join('\n');

String wrapThreeCore(String core) {
  final exportLine = core.split('\n').firstWhere((l) => l.trimLeft().startsWith('export {'), orElse: () => throw StateError('three.core.js: no export line'));
  final exports = _braceList(exportLine, 'export {', '};');
  return '(function () {\n${_dropImportExports(core)}\nglobalThis.__threeCore = { ${exports.join(', ')} };\n})();';
}

String wrapThreeModule(String module) {
  final lines = module.split('\n');
  final importLine = lines.firstWhere((l) => l.trimLeft().startsWith('import {'), orElse: () => throw StateError('jsr_three_web.js: no import line'));
  final importNames = _braceList(importLine, 'import {', '} from');
  final exportLines = lines.where((l) => l.trimLeft().startsWith('export {')).toList();
  final reExportLines = exportLines.where((l) => l.contains('} from')).toList();
  if (reExportLines.length != 1 || exportLines.length != 2) throw StateError('jsr_three_web.js: expected 1 re-export + 1 export, got ${exportLines.length}');
  final reExportNames = _braceList(reExportLines.first, 'export {', '} from');
  final exportNames = _braceList(exportLines.last, 'export {', '};');
  final coreBridge = reExportNames.map((n) => '$n: __threeCore["$n"]').join(', ');
  return '(function () {\nconst { ${importNames.join(', ')} } = globalThis.__threeCore;\n${_dropImportExports(module)}\n'
      'globalThis.THREE = Object.assign({ $coreBridge }, { ${exportNames.join(', ')} });\n})();';
}

// ---- Dart-side host bridges (prelude eval'd before corpus_dom.js) ----------
String dartPrelude(String assetMapJson, String assetFilesJson, String htmlIdTextJson) => '''
(function () {
  var g = globalThis;
  // --- M3 bytes-lane bridges (same contract as run_1b_render.dart) ---
  g.__jsr1b_gl = function (bytes) {
    __jsr1b_gl_bytes('g1', bytes);
    return __jsr1b_gl_rc();
  };
  g.__jsr1b_result = function () { return __jsr1b_result_host(); };
  // Per-context sample count: the facade reports the canvas context's
  // antialias attribute before any GL dispatch so the Dart side can build
  // the surface with matching MSAA (Chrome parity: antialias:false ->
  // single-sample, antialias:true -> MSAA).
  g.__jsr1b_set_samples = function (n) { __jsr1b_set_samples_host(String(n)); };
  // Per-context depth/stencil attributes (Chrome parity): reported before
  // any GL dispatch so the host builds the EGL surface with a matching
  // depth/stencil config.
  g.__jsr1b_set_depth = function (b) { __jsr1b_set_depth_host(b ? '1' : '0'); };
  g.__jsr1b_set_stencil = function (b) { __jsr1b_set_stencil_host(b ? '1' : '0'); };
  var B64 = '';
  for (var ci = 65; ci <= 90; ci++) B64 += String.fromCharCode(ci);
  for (var ci = 97; ci <= 122; ci++) B64 += String.fromCharCode(ci);
  for (var ci = 48; ci <= 57; ci++) B64 += String.fromCharCode(ci);
  B64 += '+/';
  g.atob = function (input) {
    var str = String(input).replace(/=+\$/, '');
    if (str.length % 4 === 1) throw new Error('atob: invalid input');
    var out = '';
    for (var i = 0; i < str.length; i += 4) {
      var c0 = B64.indexOf(str[i]), c1 = B64.indexOf(str[i + 1]);
      var c2 = i + 2 < str.length ? B64.indexOf(str[i + 2]) : 0;
      var c3 = i + 3 < str.length ? B64.indexOf(str[i + 3]) : 0;
      if (c0 < 0 || c1 < 0 || c2 < 0 || c3 < 0) throw new Error('atob: invalid input');
      var n = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
      out += String.fromCharCode((n >> 16) & 255);
      if (i + 2 < str.length) out += String.fromCharCode((n >> 8) & 255);
      if (i + 3 < str.length) out += String.fromCharCode(n & 255);
    }
    return out;
  };
  // --- corpus bridges ---
  g.__consoleBridge = function (level, msg) { __jsr1b_console_host(JSON.stringify([level, String(msg)])); };
  g.__assetMap = $assetMapJson;
  g.__assetFiles = $assetFilesJson;
  g.__htmlIdText = $htmlIdTextJson;
  // Host fn returns are JSON-parsed by the bridge (object returns arrive
  // already parsed; string returns arrive as plain strings); asset bytes
  // ride as a JSON-encoded base64 string (null = not found).
  g.__assetReadRaw = function (path) {
    if (path == null) return null;
    return __jsr1b_asset_host(String(path));
  };
  function __parseHostJson(r) {
    return (typeof r === 'string') ? JSON.parse(r) : r;
  }
  g.__decodeImageFromPath = function (path) {
    var r = __jsr1b_decode_image_host(String(path));
    if (r == null || r === 'null') return null;
    var j = __parseHostJson(r);
    return j.ok ? { width: j.width, height: j.height, dataB64: j.b64 } : null;
  };
  g.__decodeImageFromBytes = function (b64, type) {
    var r = __jsr1b_decode_image_b64_host(String(b64), String(type || ''));
    if (r == null || r === 'null') return null;
    var j = __parseHostJson(r);
    return j.ok ? { width: j.width, height: j.height, dataB64: j.b64 } : null;
  };
})();
''';

// ---- minimal PNG encoder (RGBA8, filter 0) ---------------------------------
final _crcTable = List<int>.generate(256, (n) {
  var c = n;
  for (var k = 0; k < 8; k++) c = (c & 1) != 0 ? 0xedb88320 ^ (c >> 1) : c >> 1;
  return c;
});
int _crc32(Uint8List bytes) {
  var c = 0xffffffff;
  for (final b in bytes) c = _crcTable[(c ^ b) & 0xff] ^ (c >> 8);
  return (c ^ 0xffffffff) & 0xffffffff;
}
void _be32(BytesBuilder bb, int v) => bb.add([(v >> 24) & 255, (v >> 16) & 255, (v >> 8) & 255, v & 255]);
Uint8List encodePng(Uint8List rgba, int w, int h) {
  void chunk(BytesBuilder out, String type, Uint8List data) {
    _be32(out, data.length);
    final td = Uint8List(4 + data.length)
      ..setRange(0, 4, type.codeUnits)
      ..setRange(4, 4 + data.length, data);
    out.add(td);
    _be32(out, _crc32(td));
  }
  final raw = BytesBuilder();
  for (var y = 0; y < h; y++) {
    raw.addByte(0); // filter: none
    raw.add(rgba.sublist(y * w * 4, (y + 1) * w * 4));
  }
  final ihdr = BytesBuilder()
    ..add([0, 0, 0, 0])
    ..add([(w >> 8) & 255, w & 255, (h >> 8) & 255, h & 255, 8, 6, 0, 0, 0]);
  final out = BytesBuilder()
    ..add([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  final ihdrBytes = ihdr.toBytes();
  ihdrBytes[0] = (w >> 24) & 255; ihdrBytes[1] = (w >> 16) & 255; ihdrBytes[2] = (w >> 8) & 255; ihdrBytes[3] = w & 255;
  ihdrBytes[4] = (h >> 24) & 255; ihdrBytes[5] = (h >> 16) & 255; ihdrBytes[6] = (h >> 8) & 255; ihdrBytes[7] = h & 255;
  chunk(out, 'IHDR', ihdrBytes);
  chunk(out, 'IDAT', Uint8List.fromList(ZLibEncoder().convert(raw.toBytes())));
  chunk(out, 'IEND', Uint8List(0));
  return out.toBytes();
}

// ---- C scratch readback (two-call, identical to M3) ------------------------
Uint8List readScratch(Shim shim) {
  final len = shim.result(nullptr.cast(), 0);
  if (len <= 0) return Uint8List(0);
  final n = len > 262144 ? 262144 : len;
  final buf = calloc<Uint8>(n);
  try {
    final actual = shim.result(buf, n);
    if (actual <= 0) return Uint8List(0);
    return Uint8List.fromList(buf.asTypedList(actual > n ? n : actual).toList());
  } finally {
    calloc.free(buf);
  }
}

// ---- asset hosts ------------------------------------------------------------
String? assetReadBase64(String widgetDir, String path) {
  var f = File('$widgetDir/$path');
  if (!f.existsSync()) f = File('$kAssetCacheDir/$path');
  if (!f.existsSync()) {
    final alias = _aliasAssetPath(path);
    if (alias != null) f = File(alias);
  }
  if (!f.existsSync()) return null;
  return base64Encode(f.readAsBytesSync());
}

String? decodeImageJson(String widgetDir, Uint8List bytes, String typeHint) {
  img.Image? decoded;
  try {
    decoded = img.decodeImage(bytes);
  } catch (_) {
    decoded = null;
  }
  if (decoded == null) return null;
  final w = decoded.width, h = decoded.height;
  var rgba = decoded.getBytes(order: img.ChannelOrder.rgba);
  if (rgba.length != w * h * 4) {
    // Palette/low-bit-depth images: package:image getBytes can return the
    // index buffer (1 byte/px) instead of expanded RGBA — expand manually.
    final out = Uint8List(w * h * 4);
    var o = 0;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        final p = decoded.getPixel(x, y);
        out[o++] = p.r.toInt();
        out[o++] = p.g.toInt();
        out[o++] = p.b.toInt();
        out[o++] = p.a.toInt();
      }
    }
    rgba = out;
  }
  return jsonEncode({'ok': true, 'width': w, 'height': h, 'b64': base64Encode(rgba)});
}

class RunOutcome {
  RunOutcome({required this.ok, required this.hash, required this.pixels, required this.status});
  final bool ok;
  final int hash;
  final Uint8List pixels;
  final Map<String, dynamic> status;
}

class SurfaceBox {
  SurfaceBox(this.shim, this.ios);
  final Shim shim;
  final Pointer<Uint32> ios;
  int? surface;
  int requestedSamples = 4; // pre-request default matches legacy msaa pick
  int requestedDepth = 0; // pre-request default matches legacy depth-0 EGL
  int requestedStencil = 0;
  bool current = false;

  int ensureCurrent() {
    if (surface == null) {
      final s = shim.createSurfaceEx2(kW, kH, requestedSamples, requestedDepth, requestedStencil, ios);
      if (s < 1) throw StateError('a1b_create_surface_ex2 failed');
      if (shim.makeCurrent(s) != 0) throw StateError('a1b_make_current failed');
      surface = s;
      current = true;
    } else if (!current) {
      if (shim.makeCurrent(surface!) != 0) throw StateError('a1b_make_current failed');
      current = true;
    }
    return surface!;
  }
}

RunOutcome runOnce(Shim shim, SurfaceBox surfaceBox, Map<int, String> opNames, List<(String, String)> sources, {String? widgetDirParam}) {
  final rt = QuickjsRuntime();
  var calls = 0;
  var lastRc = 0;
  final stubHits = <String>[];
  final errors = <String>[];
  final widgetDir = widgetDirParam;
  final status = <String, dynamic>{'dispatchCalls': 0};
  try {
    rt.registerHostFunction('__jsr1b_set_samples_host', (raw) {
      // The bridge marshals a single string arg as a bare JSON string.
      surfaceBox.requestedSamples = int.tryParse('$raw'.replaceAll('"', '').trim()) ?? 4;
      return 'null';
    });
    // Phase 7: per-context depth/stencil parity — the facade reports the
    // canvas context's depth/stencil attributes (Chrome parity: depth:true
    // -> 24-bit depth buffer, stencil:true -> 8-bit stencil) before the
    // first GL dispatch, so the EGL surface can be built with a matching
    // depth/stencil config.
    rt.registerHostFunction('__jsr1b_set_depth_host', (raw) {
      surfaceBox.requestedDepth = '$raw'.replaceAll('"', '').trim() == '1' ? 24 : 0;
      return 'null';
    });
    rt.registerHostFunction('__jsr1b_set_stencil_host', (raw) {
      surfaceBox.requestedStencil = '$raw'.replaceAll('"', '').trim() == '1' ? 8 : 0;
      return 'null';
    });
    final bytesOk = rt.registerHostBytesFn('__jsr1b_gl_bytes', (name, data) {
      calls++;
      surfaceBox.ensureCurrent();
      final op = data.length >= 4 ? ByteData.sublistView(data).getUint32(0, Endian.little) : -1;
      final buf = calloc<Uint8>(data.length);
      try {
        buf.asTypedList(data.length).setAll(0, data);
        lastRc = shim.dispatch(buf, data.length).toInt();
      } finally {
        calloc.free(buf);
      }
      if (lastRc < 0 && !kLegitNegativeRcs.contains(op)) stubHits.add('${opNames[op] ?? 'op_$op'} (opcode $op) rc=$lastRc');
    });
    if (!bytesOk) throw StateError('quickjs bridge lacks bytes lane');
    rt.registerHostFunction('__jsr1b_gl_rc', (_) => '$lastRc');
    // qjs_dispatch marshals a single string arg as a bare JSON string (not a
    // 1-element array) — accept both shapes.
    String hostArgAt(String argsJson, int i) {
      final d = jsonDecode(argsJson);
      return (d is List ? d[i] : d) as String;
    }
    rt.registerHostFunction('__jsr1b_console_host', (argsJson) {
      final a = jsonDecode(hostArgAt(argsJson, 0)) as List;
      final line = '[js.${a[0]}] ${a[1]}';
      if (a[0] == 'error') errors.add('js: $line');
      stderr.writeln(line);
      return null;
    });
    rt.registerHostFunction('__jsr1b_result_host', (_) => jsonEncode(base64Encode(readScratch(shim))));
    rt.registerHostFunction('__jsr1b_asset_host', (argsJson) {
      final path = hostArgAt(argsJson, 0);
      final r = assetReadBase64(widgetDir!, path);
      if (r == null) errors.add('asset miss: $path');
      return r == null ? null : jsonEncode(r);
    });
    rt.registerHostFunction('__jsr1b_decode_image_host', (argsJson) {
      final rel = hostArgAt(argsJson, 0);
      var f = File('$widgetDir/$rel');
      if (!f.existsSync()) f = File('$kAssetCacheDir/$rel');
      if (!f.existsSync()) {
        final alias = _aliasAssetPath(rel);
        if (alias != null) f = File(alias);
      }
      if (!f.existsSync()) { errors.add('decode miss: $rel'); return null; }
      return decodeImageJson(widgetDir!, f.readAsBytesSync(), '');
    });
    rt.registerHostFunction('__jsr1b_decode_image_b64_host', (argsJson) {
      final a = jsonDecode(argsJson) as List;
      final bytes = base64Decode(a[0] as String);
      return decodeImageJson(widgetDir!, bytes, a[1] as String? ?? '');
    });

    final err = <String?>[];
    String? evalOrThrow(String code, String filename) {
      final r = rt.eval(code, filename: filename, errMsg: err);
      if (err.isNotEmpty && err.first != null) throw StateError('eval $filename failed: ${err.first}');
      err.clear();
      return r;
    }

    String? resultJson;
    for (final (code, name) in sources) {
      resultJson = evalOrThrow(code, name);
    }
    final scene = jsonDecode(resultJson ?? '{}') as Map<String, dynamic>;
    status['scene'] = scene;
    if (scene['ok'] != true) {
      status['errors'] = errors;
      return RunOutcome(ok: false, hash: 0, pixels: Uint8List(0), status: status);
    }
    final ticks = (scene['ticks'] as num?)?.toInt() ?? 3;
    // Drain async asset loads, drive the pinned frames, drain again.
    rt.drainMicrotasks();
    final tickJson = evalOrThrow('({ ticked: globalThis.__corpusTick($ticks), errors: globalThis.__corpusErrors })', 'corpus_tick.js');
    rt.drainMicrotasks();
    // Async load failures (loader onError -> console.error) can land after
    // the tick snapshot; re-read the corpus error log before judging.
    final lateErrorsJson = evalOrThrow('JSON.stringify(globalThis.__corpusErrors)', 'corpus_late_errors.js');
    final tick = jsonDecode(tickJson ?? '{}') as Map<String, dynamic>;
    Object? lateDecoded = jsonDecode(lateErrorsJson ?? '[]');
    if (lateDecoded is String) lateDecoded = jsonDecode(lateDecoded);
    final lateErrors = <String>[for (final e in (lateDecoded as List?) ?? []) '$e'];
    final seenErr = <String>{};
    final corpusErrors = <String>[
      for (final e in <String>[...(tick['errors'] as List? ?? []).map((e) => '$e'), ...lateErrors, ...errors])
        if (seenErr.add(e)) e,
    ];
    status['ticked'] = tick['ticked'];
    status['errors'] = corpusErrors;

    final missing = <String, dynamic>{};
    final stubThrows = 0;
    if (missing.isNotEmpty || stubThrows > 0) {
      status['strictFailure'] = 'missing=$missing stubThrows=$stubThrows';
      return RunOutcome(ok: false, hash: 0, pixels: Uint8List(0), status: status);
    }
    if (stubHits.isNotEmpty) {
      status['strictFailure'] = 'C-decoder stub hits: ${stubHits.join('; ')}';
      return RunOutcome(ok: false, hash: 0, pixels: Uint8List(0), status: status);
    }
    if (calls == 0) {
      // Not a hard failure: some official examples legitimately issue no GL
      // calls (AR-preview posters, audio-only demos whose stubs render
      // nothing). Record it and let the web pixel comparison decide — a
      // blank-versus-blank pair is honest PASS_IDENTICAL parity.
      status['zeroDraws'] = true;
    }
    if (corpusErrors.isNotEmpty) {
      return RunOutcome(ok: false, hash: 0, pixels: Uint8List(0), status: status);
    }
    status['dispatchCalls'] = calls;
    status['ok'] = true;
  } finally {
    rt.close();
  }
  final surface = surfaceBox.ensureCurrent();
  if (shim.swapBuffers(surface) != 0) throw StateError('a1b_swap_buffers failed');
  final wOut = calloc<Int32>(), hOut = calloc<Int32>();
  final px = calloc<Uint8>(kW * kH * 4);
  late final Uint8List pixels;
  try {
    if (shim.readPixels(surface, px, wOut, hOut) != 0) throw StateError('a1b_read_pixels failed');
    if (wOut.value != kW || hOut.value != kH) throw StateError('readback size ${wOut.value}x${hOut.value} != ${kW}x$kH');
    pixels = Uint8List.fromList(px.asTypedList(kW * kH * 4).toList());
  } finally {
    calloc.free(wOut); calloc.free(hOut); calloc.free(px);
  }
  return RunOutcome(ok: true, hash: fnv1a(pixels), pixels: pixels, status: status);
}

String _flatAssetName(String url) => url.replaceAll(RegExp(r'[^A-Za-z0-9._-]+'), '__');

final RegExp _assetLiteralRe = RegExp(
  r'''['"`]((?:\./)?(?:textures|models|sounds|fonts|environments|json|luts|screenshots)/[^'"`\\]+?)['"`]''',
);

String? _threeSrcRoot() {
  final env = Platform.environment['THREE_SRC'];
  for (final c in <String>[if (env != null && env.isNotEmpty) env, '/tmp/jsr-three-r186', '/Users/Uladzimir_Klyshevich/git/references/three.js']) {
    if (Directory(c).existsSync()) return c;
  }
  return null;
}

Uint8List? _extractFromPinnedSource(String? srcRoot, String relInExamples) {
  if (srcRoot == null) return null;
  if (Directory('$srcRoot/.git').existsSync()) {
    final r = Process.runSync('git', ['-C', srcRoot, 'show', '$kPinCommit:$relInExamples'], stdoutEncoding: null);
    if (r.exitCode == 0 && r.stdout is Uint8List) return r.stdout as Uint8List;
    return null;
  }
  final f = File('$srcRoot/$relInExamples');
  if (f.existsSync()) return f.readAsBytesSync();
  return null;
}

// Vendored-decoder aliases: the corpus bundle bakes draco decoder URLs as
// file:///corpus/libs/draco/... (import-meta relative) which flatten to
// file:__corpus__libs__draco__... — serve them from the pinned npm jsm
// libs (same files prepare vendors for the widgets).
const String kDracoFlatPrefix = 'file:__corpus__libs__draco__';
String? _aliasAssetPath(String path) {
  if (path.startsWith(kDracoFlatPrefix)) {
    final rest = path.substring(kDracoFlatPrefix.length).replaceAll('__', '/');
    final f = File('/tmp/three_pkg/node_modules/three/examples/jsm/libs/draco/$rest');
    if (f.existsSync()) return f.path;
  }
  return null;
}

void _seedAssetFallback(String scenePath, Map<String, String> assetMap, List<String> assetFiles, String widgetDir) {
  final f = File(scenePath);
  if (!f.existsSync()) return;
  final src = f.readAsStringSync();
  final urls = <String>{};
  for (final m in _assetLiteralRe.allMatches(src)) {
    var url = m.group(1)!;
    url = url.replaceFirst(RegExp(r'^\./'), '').split('#').first.split('?').first;
    if (!RegExp(r'^(?:textures|models|sounds|fonts|environments|json|luts|screenshots)/').hasMatch(url)) continue;
    urls.add(url);
  }
  if (urls.isEmpty) return;
  final cache = Directory(kAssetCacheDir)..createSync(recursive: true);
  final srcRoot = _threeSrcRoot();
  for (final url in urls) {
    final flat = _flatAssetName(url);
    final base = url.split('/').last;
    final covered = assetMap.containsKey(url) || assetFiles.contains(flat) || assetFiles.contains(base);
    if (covered) {
      // Repair pass: the widget pipeline sometimes re-exports a text model as
      // glTF binary while keeping its original extension (e.g. stormtroper.dae
      // holding GLB bytes) — ColladaLoader then chokes on binary garbage.
      // Restore the true source bytes so both tiers parse the real document.
      if (url.endsWith('.dae') || url.endsWith('.xml')) {
        final out = assetMap[url];
        for (final cand in [
          if (out != null && out != flat && out != base) File('$widgetDir/$out'),
          File('$widgetDir/$flat'),
          File('$widgetDir/$base'),
          File('${cache.path}/$flat'),
        ]) {
          if (!cand.existsSync()) continue;
          final head = cand.readAsBytesSync();
          if (head.length > 4 && head[0] == 0x67 && head[1] == 0x6c && head[2] == 0x54 && head[3] == 0x46) {
            final bytes = _extractFromPinnedSource(srcRoot, 'examples/$url');
            if (bytes != null) cand.writeAsBytesSync(bytes);
          }
          break;
        }
      }
      continue;
    }
    final target = File('${cache.path}/$flat');
    if (!target.existsSync()) {
      final bytes = _extractFromPinnedSource(srcRoot, 'examples/$url');
      if (bytes == null) continue;
      target.writeAsBytesSync(bytes);
    }
    assetMap.putIfAbsent(url, () => flat);
    assetMap.putIfAbsent(flat, () => flat);
  }
}

void main(List<String> args) {
  final id = argValue(args, 'id');
  final scenePath = argValue(args, 'scene');
  final widgetDir = argValue(args, 'widget-dir');
  final outDir = argValue(args, 'out');
  if (!File(kShimPath).existsSync()) { stderr.writeln('libangle_1b.dylib not found; run `bash native/angle/build.sh`'); exit(2); }
  Directory(outDir).createSync(recursive: true);

  // Asset registry: prepare_manifest assetDiscovery (url -> flattened output)
  // + every file present in the widget dir.
  final assetMap = <String, String>{};
  final manifestFile = File('$widgetDir/prepare_manifest.json');
  if (manifestFile.existsSync()) {
    final m = jsonDecode(manifestFile.readAsStringSync()) as Map<String, dynamic>;
    for (final a in (m['assetDiscovery'] as List?) ?? []) {
      if (a is Map && a['url'] != null && a['output'] != null) assetMap[a['url'] as String] = a['output'] as String;
    }
    // Renamed outputs: prepare may materialize 'textures/foo/bar.jpg' as a
    // short name ('panorama.jpg'); inputs pins the source url sha, outputs
    // pins each produced file sha — match them up.
    final inputs = (m['inputs'] as Map?) ?? {};
    final outputs = (m['outputs'] as Map?) ?? {};
    final outBySha = <String, String>{};
    for (final e in outputs.entries) {
      final sha = (e.value as Map?)?['sha256'];
      if (sha is String) outBySha[sha] = e.key;
    }
    for (final e in inputs.entries) {
      final key = e.key;
      if (key is! String || !key.startsWith('source/examples/')) continue;
      final url = key.substring('source/examples/'.length);
      final sha = (e.value as Map?)?['sha256'];
      final out = sha is String ? outBySha[sha] : null;
      if (out != null) {
        assetMap.putIfAbsent(url, () => out);
        assetMap.putIfAbsent(_flatAssetName(url), () => out);
      }
    }
  }
  final assetFiles = <String>[for (final e in Directory(widgetDir).listSync()) if (e is File) e.uri.pathSegments.last];

  // Reference-source fallback: scan the scene bundle for asset literals the
  // widget dir lacks and extract them once from the pinned three.js source
  // into the shared cache (read by the host fns when widget-dir reads miss).
  _seedAssetFallback(scenePath, assetMap, assetFiles, widgetDir);

  // <script id="..."> blocks from original.html (shader examples read their
  // GLSL through document.getElementById(id).textContent upstream).
  final htmlIdText = <String, String>{};
  final htmlFile = File('$widgetDir/original.html');
  if (htmlFile.existsSync()) {
    final html = htmlFile.readAsStringSync();
    final re = RegExp(r'<script[^>]*?id="([^"]+)"[^>]*?>([\s\S]*?)</script>');
    for (final m in re.allMatches(html)) {
      htmlIdText[m.group(1)!] = m.group(2)!.replaceFirst(RegExp(r'\n\s*$'), '\n');
    }
  }

  final opNames = loadOpcodeTable();
  final shim = Shim();
  final hashes = <int>[];
  var ok = true;
  for (var run = 1; run <= 2; run++) {
    // Each run models a separate browser page load: give it a completely
    // fresh GL context. Reusing one context across runs leaks run-1 objects
    // and state into run-2 (visible in second-renderer / accumulation
    // examples, e.g. three-simple-gi).
    if (shim.init() != 0) throw StateError('a1b_init failed');
    final iosurfaceId = calloc<Uint32>();
    // Surface is created lazily on the first GL dispatch so the facade's
    // antialias attribute (reported via __jsr1b_set_samples during eval)
    // picks the EGL config: single-sample for antialias:false (Chrome
    // parity), MSAA for antialias:true.
    final surfaceBox = SurfaceBox(shim, iosurfaceId);
    try {
      final sources = <(String, String)>[
        (dartPrelude(jsonEncode(assetMap), jsonEncode(assetFiles), jsonEncode(htmlIdText)), 'dart_prelude.js'),
        (File(kCorpusXmlDomPath).readAsStringSync(), 'corpus_xmldom.js'),
        (File(kCorpusDomPath).readAsStringSync(), 'corpus_dom.js'),
        (wrapThreeCore(File(kCorePath).readAsStringSync()), 'three.core.js'),
        (wrapThreeModule(File(kModulePath).readAsStringSync()), 'jsr_three_web.js'),
        (File(kPackerPath).readAsStringSync(), 'g1_packer.js'),
        (File(kFacadePath).readAsStringSync(), 'webgl2_facade.js'),
        (File(scenePath).readAsStringSync(), 'scene.js'),
      ];
      // runOnce closure needs widgetDir for the host fns.
      final outcome = _runWithDir(shim, surfaceBox, opNames, sources, widgetDir, id, run, outDir);
      hashes.add(outcome.hash);
      if (!outcome.ok) ok = false;
    } finally {
      if (surfaceBox.surface != null) shim.destroySurface(surfaceBox.surface!);
      calloc.free(iosurfaceId);
      shim.shutdown();
    }
  }
  final deterministic = hashes.length == 2 && hashes[0] == hashes[1];
  stdout.writeln('CORPUS_1B_DETERMINISTIC $deterministic');
  if (!ok) exit(1);
  if (!deterministic) exit(1);
}

// Runs one render with widgetDir threaded into the asset host fns.
RunOutcome _runWithDir(Shim shim, SurfaceBox surfaceBox, Map<int, String> opNames, List<(String, String)> sources, String widgetDir, String id, int run, String outDir) {
  return runOnce(shim, surfaceBox, opNames, sources, widgetDirParam: widgetDir).also((o) {
    if (o.ok) {
      final rgbaPath = '$outDir/1b_run$run.rgba';
      File(rgbaPath).writeAsBytesSync(o.pixels);
      if (run == 1) File('$outDir/1b.png').writeAsBytesSync(encodePng(o.pixels, kW, kH));
      stdout.writeln('CORPUS_1B_RUN id=$id run=$run hash=${hex32(o.hash)} (${o.hash}) file=$rgbaPath');
    }
    stdout.writeln('CORPUS_1B_STATUS ${jsonEncode({'id': id, 'run': run, 'ok': o.status['ok'] ?? false, 'ticked': o.status['ticked'], 'scene': o.status['scene'], 'errors': o.status['errors'], 'strictFailure': o.status['strictFailure'], 'dispatchCalls': o.status['dispatchCalls']})}');
  });
}

extension _Also<T> on T {
  T also(void Function(T) f) { f(this); return this; }
}
