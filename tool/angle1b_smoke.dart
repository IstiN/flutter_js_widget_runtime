// angle1b_smoke — headless FFI verification of the ANGLE 1B shim.
//
// No Flutter involved: dlopen native/angle/libangle_1b.dylib directly, create
// a 320x240 IOSurface-backed surface, render the deterministic demo triangle
// (M2: the renderer emits G1 command buffers through a1b_gl_dispatch — the
// single code path), read pixels back, hash with FNV-1a 32-bit (same
// algorithm as example/web/cinematic_reference.mjs) and assert the corner is
// the clear color while the center is a triangle color.
//
// M2 dispatch section: a second surface rendered through the same G1 path,
// hash must equal the first (direct-path regression) section and the pinned
// M1 value 0x08042974; updated phase 6 (single-sample EGL pin) 0xf56ace25. Also demonstrates GL error passthrough: dispatching
// bindBuffer with an invalid target must surface GL_INVALID_ENUM (0x0500)
// through the getError opcode.
//
// Run from the repo root: dart run tool/angle1b_smoke.dart
import 'dart:convert';
import 'dart:ffi';
import 'dart:typed_data';
import 'dart:io';

import 'package:ffi/ffi.dart';

void main() {
  final lib = _openShim();

  int Function() a1bInit = lib.lookupFunction<Int32 Function(), int Function()>('a1b_init');
  Pointer<Utf8> Function(int) a1bInfo =
      lib.lookupFunction<Pointer<Utf8> Function(Int32), Pointer<Utf8> Function(int)>('a1b_egl_info');
  int Function(int) a1bIosurfaceExt =
      lib.lookupFunction<Int32 Function(Int64), int Function(int)>('a1b_get_iosurface_extension');
  int Function(int, int, Pointer<Uint32>) a1bCreate = lib
      .lookupFunction<Int64 Function(Int32, Int32, Pointer<Uint32>), int Function(int, int, Pointer<Uint32>)>('a1b_create_surface');
  int Function(int) a1bMakeCurrent =
      lib.lookupFunction<Int32 Function(Int64), int Function(int)>('a1b_make_current');
  int Function(int) a1bRender =
      lib.lookupFunction<Int32 Function(Int64), int Function(int)>('a1b_render_triangle');
  int Function(int) a1bSwap =
      lib.lookupFunction<Int32 Function(Int64), int Function(int)>('a1b_swap_buffers');
  int Function(int, Pointer<Uint8>, Pointer<Int32>, Pointer<Int32>) a1bRead = lib.lookupFunction<
      Int32 Function(Int64, Pointer<Uint8>, Pointer<Int32>, Pointer<Int32>),
      int Function(int, Pointer<Uint8>, Pointer<Int32>, Pointer<Int32>)>('a1b_read_pixels');
  void Function(int) a1bDestroy =
      lib.lookupFunction<Void Function(Int64), void Function(int)>('a1b_destroy_surface');
  void Function() a1bShutdown =
      lib.lookupFunction<Void Function(), void Function()>('a1b_shutdown');
  int Function(Pointer<Uint8>, int) a1bDispatch =
      lib.lookupFunction<Int64 Function(Pointer<Uint8>, Int32), int Function(Pointer<Uint8>, int)>('a1b_gl_dispatch');
  void Function(Pointer<Int64>, Pointer<Int64>) a1bStats =
      lib.lookupFunction<Void Function(Pointer<Int64>, Pointer<Int64>), void Function(Pointer<Int64>, Pointer<Int64>)>('a1b_gl_stats');

  _check(a1bInit() == 0, 'a1b_init');

  final vendor = a1bInfo(0).toDartString();
  final version = a1bInfo(1).toDartString();
  final renderer = a1bInfo(2).toDartString();
  print('EGL vendor:   $vendor');
  print('EGL version:  $version');
  print('EGL renderer: $renderer');

  const w = 320, h = 240;
  const expectedHash = 0x08042974;

  // --- section 1: regression on the (now G1-dispatch-backed) render path ---
  final iosurfaceId = calloc<Uint32>();
  final surface = a1bCreate(w, h, iosurfaceId);
  _check(surface > 0, 'a1b_create_surface -> $surface (iosurfaceId=${iosurfaceId.value})');

  final fastPath = a1bIosurfaceExt(surface);
  print('path: ${fastPath == 1 ? 'IOSurface client-buffer (fast)' : 'readback fallback'}');

  _check(a1bMakeCurrent(surface) == 0, 'a1b_make_current');
  _check(a1bRender(surface) == 0, 'a1b_render_triangle');
  _check(a1bSwap(surface) == 0, 'a1b_swap_buffers');

  final wOut = calloc<Int32>(), hOut = calloc<Int32>();
  final px = calloc<Uint8>(w * h * 4);
  _check(a1bRead(surface, px, wOut, hOut) == 0, 'a1b_read_pixels');
  _check(wOut.value == w && hOut.value == h, 'readback size ${wOut.value}x${hOut.value}');

  final bytes = px.asTypedList(w * h * 4);
  final hash = fnv1a(bytes);
  final corner = (bytes[0], bytes[1], bytes[2], bytes[3]); // bottom-left
  final centerOffset = ((h ~/ 2) * w + (w ~/ 2)) * 4;
  final center =
      (bytes[centerOffset], bytes[centerOffset + 1], bytes[centerOffset + 2], bytes[centerOffset + 3]);
  print('hash:   0x${hash.toRadixString(16).padLeft(8, '0')} ($hash)');
  print('corner: $corner (expect clear color 13,26,77)');
  print('center: $center (expect triangle blend)');

  final cornerIsClear = bytes[0] == 13 && bytes[1] == 26 && bytes[2] == 77;
  _check(cornerIsClear, 'corner is the clear color');
  _check(center != corner, 'center differs from corner');
  _check(hash == expectedHash, 'direct hash 0x${hash.toRadixString(16)} == 0x${expectedHash.toRadixString(16)}');

  // --- section 2: dispatch path on a second surface (must hash-match) ---
  final iosurfaceId2 = calloc<Uint32>();
  final surface2 = a1bCreate(w, h, iosurfaceId2);
  _check(surface2 > 0, 'a1b_create_surface #2 -> $surface2');
  _check(a1bMakeCurrent(surface2) == 0, 'a1b_make_current #2');
  _check(a1bRender(surface2) == 0, 'a1b_render_triangle #2 (G1 dispatch)');
  _check(a1bSwap(surface2) == 0, 'a1b_swap_buffers #2');

  final px2 = calloc<Uint8>(w * h * 4);
  _check(a1bRead(surface2, px2, wOut, hOut) == 0, 'a1b_read_pixels #2');
  final hash2 = fnv1a(px2.asTypedList(w * h * 4));
  print('dispatch hash: 0x${hash2.toRadixString(16).padLeft(8, '0')} ($hash2)');
  _check(hash2 == expectedHash, 'dispatch hash == 0x${expectedHash.toRadixString(16)}');
  _check(hash2 == hash, 'dispatch == direct');

  final calls = calloc<Int64>(), wireBytes = calloc<Int64>();
  a1bStats(calls, wireBytes);
  print('dispatch stats: ${calls.value} commands, ${wireBytes.value} wire bytes');

  // --- section 3: GL error passthrough (getError opcode) ---
  final ops = _loadOpcodes();
  final bindBad = calloc<Uint8>(12);
  final bindBadBd = bindBad.asTypedList(12).buffer.asByteData();
  bindBadBd.setUint32(0, ops['bindBuffer']!, Endian.little);
  bindBadBd.setUint32(4, 0x0000dead, Endian.little); // invalid target
  bindBadBd.setUint32(8, 0, Endian.little); // buffer 0
  final rc = a1bDispatch(bindBad, 12);
  _check(rc == 0, 'bindBuffer(invalid target) dispatched (rc=$rc, errors are polled)');
  final getError = calloc<Uint8>(4);
  getError.asTypedList(4).buffer.asByteData().setUint32(0, ops['getError']!, Endian.little);
  final glErr = a1bDispatch(getError, 4);
  print('getError after invalid bindBuffer: 0x${glErr.toRadixString(16).padLeft(4, '0')} '
      '(expect 0500 = GL_INVALID_ENUM)');
  _check(glErr == 0x0500, 'GL_INVALID_ENUM passthrough');
  // The error lane is consumed by getError; a second poll must be clean.
  final glErr2 = a1bDispatch(getError, 4);
  _check(glErr2 == 0, 'getError consumed (second poll = 0), got $glErr2');

  a1bDestroy(surface);
  a1bDestroy(surface2);
  a1bShutdown();
  calloc.free(iosurfaceId);
  calloc.free(iosurfaceId2);
  calloc.free(wOut);
  calloc.free(hOut);
  calloc.free(px);
  calloc.free(px2);
  calloc.free(bindBad);
  calloc.free(getError);
  calloc.free(calls);
  calloc.free(wireBytes);
  print('smoke: PASS');
}

/// Opcode table straight from the G1 methods JSON (single source of truth).
Map<String, int> _loadOpcodes() {
  final f = File('tool/three/webgl2_g1_methods.json');
  if (!f.existsSync()) {
    // CWD fallback: run from repo root; keep the message explicit.
    stderr.writeln('webgl2_g1_methods.json not found; run from the repo root');
    exit(2);
  }
  final methods = (jsonDecode(f.readAsStringSync()) as Map<String, dynamic>)['methods'] as List<dynamic>;
  return {for (final m in methods.cast<Map<String, dynamic>>()) m['name'] as String: m['opcode'] as int};
}

/// FNV-1a 32-bit, identical to cinematic_reference.mjs.
int fnv1a(List<int> bytes) {
  var hash = 0x811c9dc5;
  for (final b in bytes) {
    hash ^= b;
    hash = (hash * 0x01000193) & 0xffffffff;
  }
  return hash;
}

DynamicLibrary _openShim() {
  const candidates = [
    'native/angle/libangle_1b.dylib',
    '../native/angle/libangle_1b.dylib',
  ];
  for (final path in candidates) {
    if (File(path).existsSync()) return DynamicLibrary.open(path);
  }
  stderr.writeln('libangle_1b.dylib not found; run `bash native/angle/build.sh`');
  exit(2);
}

void _check(bool ok, String what) {
  if (!ok) {
    stderr.writeln('smoke: FAIL at $what');
    exit(1);
  }
}
