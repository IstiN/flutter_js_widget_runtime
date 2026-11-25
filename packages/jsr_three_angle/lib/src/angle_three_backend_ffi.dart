part of 'angle_three_backend.dart';

// FFI binding of native/angle/angle_1b.h (the ANGLE 1B shim ABI). Every
// function returns 0 / a positive id on success, negative errno-style codes
// on failure; a1b_gl_dispatch returns the scalar GL result or a negative
// error code (see the header for the exact contract).
final class _Angle1bFfi {
  _Angle1bFfi(this._lib) {
    _init = _lib.lookupFunction<ffi.Int32 Function(), int Function()>(
      'a1b_init',
    );
    _createSurface = _lib
        .lookupFunction<
          ffi.Int64 Function(ffi.Int32, ffi.Int32, ffi.Pointer<ffi.Uint32>),
          int Function(int, int, ffi.Pointer<ffi.Uint32>)
        >('a1b_create_surface');
    _makeCurrent = _lib
        .lookupFunction<ffi.Int32 Function(ffi.Int64), int Function(int)>(
          'a1b_make_current',
        );
    _swapBuffers = _lib
        .lookupFunction<ffi.Int32 Function(ffi.Int64), int Function(int)>(
          'a1b_swap_buffers',
        );
    _readPixels = _lib
        .lookupFunction<
          ffi.Int32 Function(
            ffi.Int64,
            ffi.Pointer<ffi.Uint8>,
            ffi.Pointer<ffi.Int32>,
            ffi.Pointer<ffi.Int32>,
          ),
          int Function(
            int,
            ffi.Pointer<ffi.Uint8>,
            ffi.Pointer<ffi.Int32>,
            ffi.Pointer<ffi.Int32>,
          )
        >('a1b_read_pixels');
    _renderTriangle = _lib
        .lookupFunction<ffi.Int32 Function(ffi.Int64), int Function(int)>(
          'a1b_render_triangle',
        );
    _destroySurface = _lib
        .lookupFunction<ffi.Void Function(ffi.Int64), void Function(int)>(
          'a1b_destroy_surface',
        );
    _shutdown = _lib.lookupFunction<ffi.Void Function(), void Function()>(
      'a1b_shutdown',
    );
    _eglInfo = _lib
        .lookupFunction<
          ffi.Pointer<Utf8> Function(ffi.Int32),
          ffi.Pointer<Utf8> Function(int)
        >('a1b_egl_info');
    _glDispatch = _lib
        .lookupFunction<
          ffi.Int64 Function(ffi.Pointer<ffi.Uint8>, ffi.Int32),
          int Function(ffi.Pointer<ffi.Uint8>, int)
        >('a1b_gl_dispatch');
    _glResult = _lib
        .lookupFunction<
          ffi.Int32 Function(ffi.Pointer<ffi.Uint8>, ffi.Int32),
          int Function(ffi.Pointer<ffi.Uint8>, int)
        >('a1b_gl_result');
    _glStats = _lib
        .lookupFunction<
          ffi.Void Function(ffi.Pointer<ffi.Int64>, ffi.Pointer<ffi.Int64>),
          void Function(ffi.Pointer<ffi.Int64>, ffi.Pointer<ffi.Int64>)
        >('a1b_gl_stats');
    _setFinishFlag = _lib
        .lookupFunction<ffi.Void Function(ffi.Int32), void Function(int)>(
          'a1b_set_finish_flag',
        );
    _iosurfaceExtension = _lib
        .lookupFunction<ffi.Int32 Function(ffi.Int64), int Function(int)>(
          'a1b_get_iosurface_extension',
        );
    _scratch = malloc<ffi.Uint8>(_scratchSize);
  }

  final ffi.DynamicLibrary _lib;

  late final int Function() _init;
  late final int Function(int, int, ffi.Pointer<ffi.Uint32>) _createSurface;
  late final int Function(int) _makeCurrent;
  late final int Function(int) _swapBuffers;
  late final int Function(
    int,
    ffi.Pointer<ffi.Uint8>,
    ffi.Pointer<ffi.Int32>,
    ffi.Pointer<ffi.Int32>,
  )
  _readPixels;
  late final int Function(int) _renderTriangle;
  late final void Function(int) _destroySurface;
  late final void Function() _shutdown;
  late final ffi.Pointer<Utf8> Function(int) _eglInfo;
  late final int Function(ffi.Pointer<ffi.Uint8>, int) _glDispatch;
  late final int Function(ffi.Pointer<ffi.Uint8>, int) _glResult;
  late final void Function(ffi.Pointer<ffi.Int64>, ffi.Pointer<ffi.Int64>)
  _glStats;
  late final void Function(int) _setFinishFlag;
  late final int Function(int) _iosurfaceExtension;

  /// The 64 KB per-context result scratch the C side fills for
  /// data-returning commands (a1b_gl_result copies out of it).
  static const int _scratchSize = 64 * 1024;
  late final ffi.Pointer<ffi.Uint8> _scratch;

  int init() => _init();
  int createSurface(int width, int height, ffi.Pointer<ffi.Uint32> out) =>
      _createSurface(width, height, out);
  int makeCurrent(int surface) => _makeCurrent(surface);
  int swapBuffers(int surface) => _swapBuffers(surface);
  int iosurfaceExtension(int surface) => _iosurfaceExtension(surface);
  int renderTriangle(int surface) => _renderTriangle(surface);
  void destroySurface(int surface) => _destroySurface(surface);
  void setFinishFlag(bool on) => _setFinishFlag(on ? 1 : 0);

  String eglInfo(int what) {
    final p = _eglInfo(what);
    if (p == ffi.nullptr) return '';
    return p.toDartString();
  }

  /// One synchronous G1 command; copies the call-scoped view into native
  /// memory because a1b_gl_dispatch consumes the buffer in place.
  int dispatch(Uint8List command) {
    final len = command.length;
    final p = malloc<ffi.Uint8>(len == 0 ? 1 : len);
    try {
      if (len > 0) p.asTypedList(len).setAll(0, command);
      return _glDispatch(p, len);
    } finally {
      malloc.free(p);
    }
  }

  /// The result scratch after a data-returning command, trimmed to the
  /// length a1b_gl_result reports.
  Uint8List resultScratch() {
    final full = _glResult(_scratch, _scratchSize);
    final len = full.clamp(0, _scratchSize);
    return Uint8List.fromList(_scratch.asTypedList(len));
  }

  /// RGBA8 readback of the surface (BGRA→RGBA converted in C when the
  /// driver reports BGRA order). Returns null on failure.
  ({Uint8List bytes, int width, int height})? readPixels(
    int surface, {
    required int width,
    required int height,
  }) {
    final size = width * height * 4;
    final dst = malloc<ffi.Uint8>(size);
    final wPtr = malloc<ffi.Int32>();
    final hPtr = malloc<ffi.Int32>();
    try {
      wPtr.value = width;
      hPtr.value = height;
      final rc = _readPixels(surface, dst, wPtr, hPtr);
      if (rc != 0) return null;
      final outW = wPtr.value, outH = hPtr.value;
      if (outW <= 0 || outH <= 0 || outW * outH * 4 > size) return null;
      return (
        bytes: Uint8List.fromList(dst.asTypedList(outW * outH * 4)),
        width: outW,
        height: outH,
      );
    } finally {
      malloc.free(dst);
      malloc.free(wPtr);
      malloc.free(hPtr);
    }
  }

  ({int calls, int bytes}) glStats() {
    final calls = malloc<ffi.Int64>();
    final bytes = malloc<ffi.Int64>();
    try {
      _glStats(calls, bytes);
      return (calls: calls.value, bytes: bytes.value);
    } finally {
      malloc.free(calls);
      malloc.free(bytes);
    }
  }

  ffi.Pointer<ffi.Uint32> allocateSurfaceIdSlot() => malloc<ffi.Uint32>();

  void freeAllocation(ffi.Pointer<ffi.Uint32> p) => malloc.free(p);

  /// Shuts the ANGLE display down and releases the scratch. The backend
  /// never calls this mid-session (the display lives for the process);
  /// exposed for tests that fully tear the host down.
  void close() {
    _shutdown();
    malloc.free(_scratch);
  }
}
