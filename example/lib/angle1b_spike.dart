/// ANGLE 1B spike (M1): native ANGLE -> IOSurface -> FlutterTexture.
///
/// The C shim (native/angle/libangle_1b.dylib) renders a deterministic GLES3
/// triangle into an IOSurface via ANGLE's Metal backend; the macOS plugin
/// (Angle1bTexturePlugin) wraps that IOSurface in a CVPixelBuffer and serves
/// it as a Flutter texture. Dart drives the frame loop over a Timer and
/// announces frames through the 'angle_1b' method channel.
library;

import 'dart:async';
import 'dart:ffi';
import 'dart:io';

import 'package:ffi/ffi.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

const _channel = MethodChannel('angle_1b');

// C ABI (see native/angle/angle_1b.h).
typedef _InitFn = int Function();
typedef _InfoFn = Pointer<Utf8> Function(int);
typedef _CreateFn = int Function(int, int, Pointer<Uint32>);
typedef _SurfaceFn = int Function(int);
typedef _ReadFn = int Function(int, Pointer<Uint8>, Pointer<Int32>, Pointer<Int32>);

/// Spike diagnostics (same pattern as the screenshot harness's cameraDiag):
/// A1B_STATUS_LOG=<path> collects status transitions for `open`-launched runs.
void a1bDiag(String line) {
  final path = Platform.environment['A1B_STATUS_LOG'];
  if (path == null || path.isEmpty) return;
  try {
    File(path).writeAsStringSync(
      '${DateTime.now().toIso8601String()} $line\n',
      mode: FileMode.append,
    );
  } catch (_) {}
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const Angle1bSpikeApp());
}

final class Angle1bBindings {
  Angle1bBindings(DynamicLibrary lib)
    : init = lib.lookupFunction<Int32 Function(), _InitFn>('a1b_init'),
      info = lib.lookupFunction<Pointer<Utf8> Function(Int32), _InfoFn>('a1b_egl_info'),
      create = lib.lookupFunction<Int64 Function(Int32, Int32, Pointer<Uint32>), _CreateFn>('a1b_create_surface'),
      iosurfaceExt = lib.lookupFunction<Int32 Function(Int64), _SurfaceFn>('a1b_get_iosurface_extension'),
      makeCurrent = lib.lookupFunction<Int32 Function(Int64), _SurfaceFn>('a1b_make_current'),
      render = lib.lookupFunction<Int32 Function(Int64), _SurfaceFn>('a1b_render_triangle'),
      swap = lib.lookupFunction<Int32 Function(Int64), _SurfaceFn>('a1b_swap_buffers'),
      read = lib.lookupFunction<Int32 Function(Int64, Pointer<Uint8>, Pointer<Int32>, Pointer<Int32>), _ReadFn>('a1b_read_pixels'),
      destroy = lib.lookupFunction<Void Function(Int64), void Function(int)>('a1b_destroy_surface'),
      shutdown = lib.lookupFunction<Void Function(), void Function()>('a1b_shutdown');

  final _InitFn init;
  final _InfoFn info;
  final _CreateFn create;
  final _SurfaceFn iosurfaceExt;
  final _SurfaceFn makeCurrent;
  final _SurfaceFn render;
  final _SurfaceFn swap;
  final _ReadFn read;
  final void Function(int) destroy;
  final void Function() shutdown;

  String eglInfo(int what) => info(what).toDartString();
}

/// Locates libangle_1b.dylib: walking up from the app bundle, then relative
/// to the CWD (flutter run from example/), then the staged repo path.
DynamicLibrary _openShim() {
  final candidates = <String>[];
  var dir = File(Platform.resolvedExecutable).parent;
  for (var i = 0; i < 14; i++) {
    candidates.add('${dir.path}/native/angle/libangle_1b.dylib');
    dir = dir.parent;
  }
  candidates
    ..add('${Directory.current.path}/native/angle/libangle_1b.dylib')
    ..add('${Directory.current.path}/../native/angle/libangle_1b.dylib');
  for (final path in candidates) {
    if (File(path).existsSync()) return DynamicLibrary.open(path);
  }
  throw StateError('libangle_1b.dylib not found; run bash native/angle/build.sh');
}

class Angle1bSpikeApp extends StatefulWidget {
  const Angle1bSpikeApp({super.key});

  @override
  State<Angle1bSpikeApp> createState() => _Angle1bSpikeAppState();
}

class _Angle1bSpikeAppState extends State<Angle1bSpikeApp> {
  static const _width = 640;
  static const _height = 480;

  late final Angle1bBindings _gl;
  int _surface = 0;
  int _textureId = -1;
  bool _fastPath = false;
  String _status = 'initializing…';
  String _hash = '—';
  Timer? _frameTimer;
  int _frameCount = 0;

  @override
  void initState() {
    super.initState();
    _start();
  }

  Future<void> _start() async {
    try {
      a1bDiag('start');
      _gl = Angle1bBindings(_openShim());
      if (_gl.init() != 0) throw StateError('a1b_init failed');
      final iosurfaceId = calloc<Uint32>();
      _surface = _gl.create(_width, _height, iosurfaceId);
      if (_surface <= 0) throw StateError('a1b_create_surface failed');
      _fastPath = _gl.iosurfaceExt(_surface) == 1;

      final surfaceIoId = iosurfaceId.value;
      final texture = await _channel.invokeMethod<Map<dynamic, dynamic>>('createSurface', [
        surfaceIoId,
        _width,
        _height,
      ]);
      calloc.free(iosurfaceId);
      if (texture == null) throw StateError('plugin createSurface returned null');
      _textureId = (texture['textureId'] as num?)?.toInt() ?? -1;
      a1bDiag('createSurface ok textureId=$_textureId iosurfaceId=$surfaceIoId');

      if (_gl.makeCurrent(_surface) != 0 || _gl.render(_surface) != 0) {
        throw StateError('first render failed');
      }
      _hash = _computeHash();
      a1bDiag('first render ok hash=$_hash fastPath=$_fastPath');
      _status =
          'ANGLE ${Platform.isMacOS ? 'macOS' : ''} — '
          '${_fastPath ? 'IOSurface client-buffer' : 'readback fallback'}';

      // RAF-ish frame loop: render + swap off the vsync, then announce.
      _frameTimer = Timer.periodic(const Duration(milliseconds: 16), (_) async {
        if (_surface <= 0) return;
        if (_gl.makeCurrent(_surface) != 0) return;
        if (_gl.render(_surface) != 0) return;
        if (_gl.swap(_surface) != 0) return;
        await _channel.invokeMethod<void>('frameAvailable', [_textureId]);
        if (_frameCount++ == 0) a1bDiag('first frameAvailable sent');
      });
      setState(() {});
    } catch (e) {
      a1bDiag('error: $e');
      setState(() => _status = 'error: $e');
    }
  }

  /// FNV-1a 32-bit over the RGBA readback (same algorithm as the smoke test).
  String _computeHash() {
    final w = calloc<Int32>(), h = calloc<Int32>();
    final px = calloc<Uint8>(_width * _height * 4);
    try {
      if (_gl.read(_surface, px, w, h) != 0) return 'readback failed';
      final bytes = px.asTypedList(w.value * h.value * 4);
      var hash = 0x811c9dc5;
      for (final b in bytes) {
        hash ^= b;
        hash = (hash * 0x01000193) & 0xffffffff;
      }
      return '0x${hash.toRadixString(16).padLeft(8, '0')}';
    } finally {
      calloc.free(w);
      calloc.free(h);
      calloc.free(px);
    }
  }

  @override
  void dispose() {
    _frameTimer?.cancel();
    if (_textureId >= 0) {
      unawaited(_channel.invokeMethod<void>('destroySurface', [_textureId]));
    }
    if (_surface > 0) _gl.destroy(_surface);
    _gl.shutdown();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true),
      home: Scaffold(
        backgroundColor: const Color(0xFF0F172A),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.white24),
                ),
                width: _width / 1.5,
                height: _height / 1.5,
                child: _textureId >= 0
                    ? Texture(textureId: _textureId)
                    : const Center(child: CircularProgressIndicator()),
              ),
              const SizedBox(height: 16),
              Text(_status, style: const TextStyle(fontSize: 14)),
              const SizedBox(height: 4),
              Text(
                'EGL: ${_gl.eglInfo(1)}  ·  smoke hash $_hash',
                style: const TextStyle(fontSize: 11, color: Colors.white54),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
