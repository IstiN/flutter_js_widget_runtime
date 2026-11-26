import 'dart:convert';
import 'dart:ffi' as ffi;
import 'dart:ffi' show Abi;
import 'dart:io';

import 'package:ffi/ffi.dart';
import 'dart:ui' as ui;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'angle1b_bootstrap.dart';

part 'angle_three_backend_ffi.dart';

const MethodChannel _kAngle1bChannel = MethodChannel('angle_1b');

const int _a1bNoCurrentSurface = -0x7fffffff;

/// The ANGLE 1B host (issue #7 / ADR-0003): owns the pinned ANGLE context
/// through the `libangle_1b` shim, implements [JsThreeHost] for `three`
/// nodes and [JsThree1BWire] for the synchronous G1 lane of the WebGL2
/// facade.
///
/// Created through [createAngleThreeHost]; a host application selects 1B
/// with `JsRuntimeConfig(threeBackend: JsThreeBackend.angle1b, threeHost:
/// createAngleThreeHost(...))`. Loading the library and initializing the
/// ANGLE display happen lazily on the first probe (selection ladder) —
/// never at import or construction time.
final class AngleThreeBackend implements JsThreeHost, JsThree1BWire {
  AngleThreeBackend({
    String? libraryPath,
    this.androidApiLevel,
    this.assetLoader,
  }) : _explicitLibraryPath = libraryPath;

  final String? _explicitLibraryPath;

  /// Probe (d) input (ADR-0003): Android API level, supplied by the host
  /// platform wiring (F3). Null off Android or when the host does not know.
  @override
  final int? androidApiLevel;

  /// Host-approved asset loader; without one `loadAsset` is a named
  /// capability failure (asset bytes are data-only in the 1B lane too).
  final JsThreeAssetLoader? assetLoader;

  _Angle1bFfi? _ffi;
  String? _probeReason;

  final Map<String, _Angle1bSurface> _surfaces = {};

  // -- selection probes (JsThree1BWire) ------------------------------------

  /// Probes (b)+(c), cached: loads `libangle_1b`, runs `a1b_init` (which
  /// dlopens the pinned ANGLE dylibs and creates the platform display).
  /// Returns null on success, else the failure reason.
  @override
  String? probeNative() {
    if (_probeReason != null) {
      return _probeReason == _probeOkSentinel ? null : _probeReason;
    }
    try {
      final ffiLib = _loadLibrary();
      if (ffiLib == null) {
        _probeReason =
            'libangle_1b not found (searched '
            '${_libraryCandidates().join(', ')})';
        return _probeReason;
      }
      final lib = _Angle1bFfi(ffiLib);
      final rc = lib.init();
      if (rc != 0) {
        _probeReason = 'a1b_init failed ($rc): ${lib.eglInfo(0)}';
        return _probeReason;
      }
      _ffi = lib;
      _probeReason = _probeOkSentinel;
      return null;
    } catch (e) {
      _probeReason = 'libangle_1b load failed: $e';
      return _probeReason;
    }
  }

  static const String _probeOkSentinel = '__ok__';

  /// ANGLE build identity for diagnostics: EGL vendor/version and the
  /// renderer device string (available after a successful probe).
  Map<String, String> get angleInfo => _ffi == null
      ? const {}
      : {
          'eglVendor': _ffi!.eglInfo(0),
          'eglVersion': _ffi!.eglInfo(1),
          'renderer': _ffi!.eglInfo(2),
          'iosurface': _ffi!.eglInfo(3),
        };

  // -- synchronous G1 wire (JsThree1BWire) ---------------------------------

  @override
  int dispatch1B(String engineId, Uint8List command) {
    final lib = _ffi;
    if (lib == null) return _a1bNoCurrentSurface;
    final surface = _surfaceForEngine(engineId);
    if (surface == null) return _a1bNoCurrentSurface;
    lib.makeCurrent(surface.angleSurfaceId!);
    return lib.dispatch(command);
  }

  @override
  String result1BAsBase64(String engineId) {
    final lib = _ffi;
    if (lib == null) return '';
    final surface = _surfaceForEngine(engineId);
    if (surface == null) return '';
    lib.makeCurrent(surface.angleSurfaceId!);
    return base64Encode(lib.resultScratch());
  }

  @override
  void submit1B(String boundEngineId, Uint8List batch) {
    final lib = _ffi;
    if (lib == null) return;
    final surface = _surfaceForEngine(boundEngineId);
    if (surface == null) return;
    lib.makeCurrent(surface.angleSurfaceId!);
    // One G1 command per batch in F2a: `a1b_gl_dispatch` decodes one
    // opcode-prefixed command per call. The multi-command flush format is
    // delivered with facade batching (PERF-1 / IT-TRANSPORT-1, F2b).
    lib.dispatch(batch);
  }

  _Angle1bSurface? _surfaceForEngine(String engineId) {
    for (final surface in _surfaces.values) {
      if (surface.engineId == engineId && !surface.isDisposed) return surface;
    }
    return null;
  }

  // -- facade bootstrap ------------------------------------------------------

  @override
  String get facadeBootstrapJs => Angle1bBootstrap.loadSync();

  @override
  Future<void> ensureFacadeBootstrap() => Angle1bBootstrap.preload();

  // -- JsThreeHost -----------------------------------------------------------

  @override
  JsThreeSurface attach(
    String engineId,
    String surfaceId,
    Map<String, dynamic> config,
  ) {
    final lib = _ffi;
    if (lib == null) {
      throw const JsThreeUnsupportedException(
        'angle1b',
        'attach before a successful probe (select the backend first)',
      );
    }
    final existing = _surfaces['$engineId/$surfaceId'];
    if (existing != null && !existing.isDisposed) return existing;
    final width = (config['width'] as num?)?.toInt() ?? 640;
    final height = (config['height'] as num?)?.toInt() ?? 360;
    final surface = _Angle1bSurface(
      backend: this,
      engineId: engineId,
      surfaceId: surfaceId,
      logicalSize: Size(width.toDouble(), height.toDouble()),
      devicePixelRatio: (config['devicePixelRatio'] as num?)?.toDouble() ?? 1.0,
    );
    surface._allocate(lib);
    _surfaces['$engineId/$surfaceId'] = surface;
    return surface;
  }

  @override
  JsThreeSurface? findSurface(String engineId, String surfaceId) {
    final surface = _surfaces['$engineId/$surfaceId'];
    return (surface == null || surface.isDisposed) ? null : surface;
  }

  @override
  void release(String engineId, String surfaceId) {
    // Detach the visual node only; the ANGLE surface survives a temporary
    // unmount (bridge-owned state contract of JsThreeHost.release).
  }

  @override
  void submit(String boundEngineId, Uint8List envelope) {
    throw JsThreeUnsupportedException(
      'three.r1',
      'the ANGLE 1B host does not accept R1 envelopes (engine '
          '$boundEngineId, ${envelope.length} bytes)',
    );
  }

  @override
  Future<JsThreeCanvas2DResult> rasterizeCanvas2D(
    String boundEngineId,
    Map<String, dynamic> request,
  ) => Future.error(
    const JsThreeUnsupportedException(
      'canvas2d',
      'the ANGLE 1B host does not provide a Flutter Canvas rasterizer',
    ),
  );

  @override
  Future<JsThreeAsset> loadAsset(String engineId, String url) {
    final loader = assetLoader;
    if (loader == null) {
      throw const JsThreeUnsupportedException(
        'loadAsset',
        'createAngleThreeHost(assetLoader: ...) to serve 1B texture assets',
      );
    }
    return loader(engineId, url);
  }

  @override
  Widget build(
    BuildContext context,
    JsThreeSurface surface,
    Map<String, dynamic> config,
  ) {
    final angleSurface = surface as _Angle1bSurface;
    final textureId = angleSurface.textureId;
    if (textureId == null) {
      // Presentation runs through the platform texture plugin; without it
      // the surface stays capture-only (diagnostics report it) instead of
      // rendering a blank tile.
      return const SizedBox.shrink();
    }
    return Texture(textureId: textureId);
  }

  @override
  void disposeEngine(String engineId) {
    final doomed = _surfaces.values
        .where((s) => s.engineId == engineId && !s.isDisposed)
        .toList();
    for (final surface in doomed) {
      surface._dispose();
    }
    _surfaces.removeWhere((key, s) => s.engineId == engineId);
  }

  // -- library loading -------------------------------------------------------

  /// Candidate paths for `libangle_1b`, in probe order: explicit override,
  /// `JSR_ANGLE_1B_LIB`, the CI-staged per-platform out dir next to the
  /// pinned ANGLE dylibs, then the shim build location.
  List<String> _libraryCandidates() {
    final candidates = <String>[
      if (_explicitLibraryPath != null) _explicitLibraryPath,
      if (Platform.environment['JSR_ANGLE_1B_LIB'] != null)
        Platform.environment['JSR_ANGLE_1B_LIB']!,
      // F3b iOS (issue #7 AC3): the example embed step stages the shim into
      // the app's Frameworks directory; @rpath resolves through the Runner's
      // @executable_path/Frameworks runpath (flat dylib layout, macOS host
      // parity).
      if (Platform.isIOS) '@rpath/libangle_1b.dylib',
    ];
    final packageRoot = Directory(
      '${Directory.current.path}/packages/jsr_three_angle',
    );
    if (packageRoot.existsSync()) {
      candidates.add(
        '${packageRoot.path}/native/angle/out/$_platformId/libangle_1b.dylib',
      );
    }
    candidates
      ..add(
        '${Directory.current.path}/packages/jsr_three_angle/'
        'native/angle/libangle_1b.dylib',
      )
      ..add(
        '${Directory.current.path}/example/'
        'packages/jsr_three_angle/native/angle/libangle_1b.dylib',
      );
    return candidates;
  }

  static String get _platformId {
    if (Platform.isMacOS) return 'macos-arm64';
    if (Platform.isAndroid) {
      return switch (Abi.current()) {
        Abi.androidArm64 => 'android-arm64',
        Abi.androidArm => 'android-armv7',
        Abi.androidX64 => 'android-x86_64',
        _ => 'android-unknown',
      };
    }
    if (Platform.isIOS) return 'ios-arm64';
    return 'unknown';
  }

  ffi.DynamicLibrary? _loadLibrary() {
    for (final path in _libraryCandidates()) {
      try {
        return ffi.DynamicLibrary.open(path);
      } catch (_) {
        continue;
      }
    }
    return null;
  }

  /// Package-internal: presentation texture registration through the
  /// `angle_1b` platform channel ([iosurfaceId, width, height] →
  /// {textureId}). Null when the plugin is absent (capture-only mode).
  Future<int?> registerTexture({
    required int iosurfaceId,
    required int width,
    required int height,
  }) async {
    try {
      final result = await _kAngle1bChannel.invokeMethod<dynamic>(
        'createSurface',
        <dynamic>[iosurfaceId, width, height],
      );
      final id = result is Map ? result['textureId'] : null;
      return id is int ? id : null;
    } on MissingPluginException {
      return null;
    } on PlatformException {
      return null;
    }
  }

  Future<void> unregisterTexture(int textureId) async {
    try {
      await _kAngle1bChannel.invokeMethod<void>('destroySurface', <dynamic>[
        textureId,
      ]);
    } on MissingPluginException {
      // Capture-only mode: nothing registered.
    } on PlatformException {
      // The host may already have torn the texture down.
    }
  }

  Future<void> announceFrame(int textureId) async {
    try {
      await _kAngle1bChannel.invokeMethod<void>('frameAvailable', <dynamic>[
        textureId,
      ]);
    } on MissingPluginException {
      // Capture-only mode.
    } on PlatformException {
      // Presentation failures never break the render loop.
    }
  }
}

/// One ANGLE IOSurface-backed surface bound to `(engineId, surfaceId)`.
final class _Angle1bSurface extends JsThreeSurface {
  _Angle1bSurface({
    required AngleThreeBackend backend,
    required super.engineId,
    required super.surfaceId,
    required Size logicalSize,
    required double devicePixelRatio,
  }) : _backend = backend {
    _logicalSize = logicalSize;
    _devicePixelRatio = devicePixelRatio;
  }

  final AngleThreeBackend _backend;

  late Size _logicalSize;
  late double _devicePixelRatio;
  int? _angleSurfaceId;
  int? _iosurfaceId;
  int? _textureId;
  bool _disposed = false;
  bool _iosurfaceFastPath = false;

  int? get angleSurfaceId => _angleSurfaceId;
  int? get textureId => _textureId;

  @override
  Size get logicalSize => _logicalSize;

  @override
  double get devicePixelRatio => _devicePixelRatio;

  @override
  bool get isDisposed => _disposed;

  void _allocate(_Angle1bFfi lib) {
    final pixelWidth = (_logicalSize.width * _devicePixelRatio).round().clamp(
      1,
      16384,
    );
    final pixelHeight = (_logicalSize.height * _devicePixelRatio).round().clamp(
      1,
      16384,
    );
    final iosurface = lib.allocateSurfaceIdSlot();
    final id = lib.createSurface(pixelWidth, pixelHeight, iosurface);
    if (id <= 0) {
      lib.freeAllocation(iosurface);
      throw JsThreeUnsupportedException(
        'angle1b.surface',
        'a1b_create_surface($pixelWidth, $pixelHeight) failed ($id)',
      );
    }
    _angleSurfaceId = id;
    _iosurfaceId = iosurface.value;
    _iosurfaceFastPath = lib.iosurfaceExtension(id) == 1;
    lib.freeAllocation(iosurface);
    _registerTexture(pixelWidth, pixelHeight);
  }

  Future<void> _registerTexture(int pixelWidth, int pixelHeight) async {
    final iosurfaceId = _iosurfaceId;
    if (iosurfaceId == null) return;
    _textureId = await _backend.registerTexture(
      iosurfaceId: iosurfaceId,
      width: pixelWidth,
      height: pixelHeight,
    );
    notifyListeners();
  }

  @override
  void resize(Size size, double devicePixelRatio) {
    if (_disposed) return;
    if (size == _logicalSize && devicePixelRatio == _devicePixelRatio) return;
    _logicalSize = size;
    _devicePixelRatio = devicePixelRatio;
    final lib = _backend._ffi;
    if (lib == null) return;
    // The C ABI has no surface resize: recreate (destroy + allocate keeps
    // the ANGLE display and the engine-scoped G1 state).
    _destroyAngleSurface(lib);
    _allocate(lib);
    notifyListeners();
  }

  @override
  Future<Uint8List?> capture() async {
    if (_disposed) return null;
    final lib = _backend._ffi;
    final id = _angleSurfaceId;
    if (lib == null || id == null) return null;
    final pixelWidth = (_logicalSize.width * _devicePixelRatio).round().clamp(
      1,
      16384,
    );
    final pixelHeight = (_logicalSize.height * _devicePixelRatio).round().clamp(
      1,
      16384,
    );
    final pixels = lib.readPixels(id, width: pixelWidth, height: pixelHeight);
    if (pixels == null) return null;
    final buffer = await ui.ImmutableBuffer.fromUint8List(pixels.bytes);
    final descriptor = ui.ImageDescriptor.raw(
      buffer,
      width: pixels.width,
      height: pixels.height,
      pixelFormat: ui.PixelFormat.rgba8888,
    );
    try {
      final codec = await descriptor.instantiateCodec();
      final frame = await codec.getNextFrame();
      final png = await frame.image.toByteData(format: ui.ImageByteFormat.png);
      codec.dispose();
      return png?.buffer.asUint8List();
    } finally {
      descriptor.dispose();
      buffer.dispose();
    }
  }

  /// Presents the current frame: swap + texture announcement. Returns the
  /// fast-path flag (EGL_ANGLE_iosurface_client_buffer) for diagnostics.
  Future<bool> presentFrame(_Angle1bFfi lib) async {
    if (_disposed || _angleSurfaceId == null) return _iosurfaceFastPath;
    final rc = lib.swapBuffers(_angleSurfaceId!);
    if (rc != 0) return _iosurfaceFastPath;
    final textureId = _textureId;
    if (textureId != null) await _backend.announceFrame(textureId);
    return _iosurfaceFastPath;
  }

  @override
  Map<String, num> get diagnostics => {
    'angleSurface': _angleSurfaceId ?? 0,
    'iosurface': _iosurfaceId ?? 0,
    'texture': _textureId ?? 0,
    'width': _logicalSize.width,
    'height': _logicalSize.height,
    'dpr': _devicePixelRatio,
    'iosurfaceFastPath': _iosurfaceFastPath ? 1 : 0,
    'disposed': _disposed ? 1 : 0,
  };

  void _destroyAngleSurface(_Angle1bFfi lib) {
    final id = _angleSurfaceId;
    if (id != null) lib.destroySurface(id);
    _angleSurfaceId = null;
    _iosurfaceId = null;
    final textureId = _textureId;
    if (textureId != null) {
      _textureId = null;
      _backend.unregisterTexture(textureId);
    }
  }

  void _dispose() {
    if (_disposed) return;
    final lib = _backend._ffi;
    if (lib != null) _destroyAngleSurface(lib);
    _disposed = true;
    notifyListeners();
  }
}

/// `createAngleThreeHost()` — the documented entry point (ADR-0003): the
/// host application passes `threeHost: createAngleThreeHost(...)`.
AngleThreeBackend createAngleThreeHost({
  String? libraryPath,
  int? androidApiLevel,
  JsThreeAssetLoader? assetLoader,
}) => AngleThreeBackend(
  libraryPath: libraryPath,
  androidApiLevel: androidApiLevel,
  assetLoader: assetLoader,
);

/// Probe result of [probeAngle1b]: availability, failure reason (null on
/// success) and the ANGLE identity strings after a successful init.
final class Angle1bProbe {
  const Angle1bProbe({
    required this.available,
    this.reason,
    this.eglVendor = '',
    this.eglVersion = '',
    this.renderer = '',
    this.iosurfaceFastPath = false,
  });

  final bool available;
  final String? reason;
  final String eglVendor;
  final String eglVersion;
  final String renderer;
  final bool iosurfaceFastPath;

  @override
  String toString() => available
      ? 'Angle1bProbe(available: true, $eglVendor / $renderer'
            '${iosurfaceFastPath ? ', iosurface fast path' : ''})'
      : 'Angle1bProbe(available: false, reason: $reason)';
}

/// Probes the ANGLE 1B backend on this machine: loads the shim, initializes
/// the ANGLE display and reports identity/diagnostics. Never throws.
Future<Angle1bProbe> probeAngle1b({String? libraryPath}) async {
  final backend = AngleThreeBackend(libraryPath: libraryPath);
  final reason = backend.probeNative();
  if (reason != null) {
    return Angle1bProbe(available: false, reason: reason);
  }
  final info = backend.angleInfo;
  return Angle1bProbe(
    available: true,
    eglVendor: info['eglVendor'] ?? '',
    eglVersion: info['eglVersion'] ?? '',
    renderer: info['renderer'] ?? '',
    iosurfaceFastPath: info['iosurface'] == '1',
  );
}
