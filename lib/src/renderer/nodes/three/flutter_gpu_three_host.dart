import 'dart:async';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_backend.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_canvas2d.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_host.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

/// Creates the independent native upstream-THREE host.
FlutterGpuThreeHost createFlutterGpuThreeHost({
  JsThreeAssetLoader? assetLoader,
  String shaderAsset = FlutterGpuThreeBackend.defaultShaderAsset,
}) => FlutterGpuThreeHost(assetLoader: assetLoader, shaderAsset: shaderAsset);

/// Owns isolated R1 surfaces and presents their Flutter GPU images.
class FlutterGpuThreeHost implements JsThreeHost {
  FlutterGpuThreeHost({
    this.assetLoader,
    required this.shaderAsset,
    JsThreeCanvas2DRasterizer? canvas2dRasterizer,
  }) : _canvas2dRasterizer = canvas2dRasterizer ?? rasterizeJsThreeCanvas2D;

  static const int maxSurfaces = 64;
  static const int maxCanvas2dSurfaces = 256;
  static const int maxCanvas2dInFlight = 64;

  final JsThreeAssetLoader? assetLoader;
  final String shaderAsset;
  final JsThreeCanvas2DRasterizer _canvas2dRasterizer;
  final JsThreeProtocolDecoder _decoder = JsThreeProtocolDecoder();
  final Map<JsThreeSurfaceKey, FlutterGpuThreeSurface> _surfaces = {};
  final Map<JsThreeSurfaceKey, Map<String, _FlutterCanvas2DState>> _canvas2d =
      {};
  var _canvas2dCount = 0;
  var _canvas2dInFlight = 0;

  @override
  JsThreeSurface attach(
    String engineId,
    String surfaceId,
    Map<String, dynamic> config,
  ) {
    final key = JsThreeSurfaceKey(engineId, surfaceId);
    final surface = _obtainSurface(key);
    _validateThreeSurfaceAttach(surface);
    surface._attached = true;
    surface._schedule();
    return surface;
  }

  @override
  JsThreeSurface? findSurface(String engineId, String surfaceId) =>
      _surfaces[JsThreeSurfaceKey(engineId, surfaceId)];

  @override
  void release(String engineId, String surfaceId) {
    final key = JsThreeSurfaceKey(engineId, surfaceId);
    final surface = _surfaces[key];
    if (surface == null) return;
    surface._attached = false;
    if (surface.isDisposed) {
      _surfaces.remove(key);
      surface.dispose();
    }
  }

  @override
  void submit(String boundEngineId, Uint8List envelope) {
    // Decode first: the id inside attacker-controlled bytes is not a routing
    // capability. It must match the bridge that actually delivered the bytes.
    final decoded = _decoder.decode(envelope);
    if (decoded.envelope.engineId != boundEngineId) {
      throw const JsThreeProtocolException(
        'T1 engine id does not match the bridge-bound engine',
      );
    }
    final key = JsThreeSurfaceKey(boundEngineId, decoded.envelope.surfaceId);
    final surface = _obtainSurface(key);
    if (surface.isDisposed) return;
    surface._apply(decoded);
    if (surface.isDisposed) {
      _disposeCanvas2dSurface(boundEngineId, decoded.envelope.surfaceId);
    }
  }

  FlutterGpuThreeSurface _obtainSurface(JsThreeSurfaceKey key) {
    final existing = _surfaces[key];
    if (existing != null) return existing;
    _checkSurfaceQuota();
    final surface = FlutterGpuThreeSurface(
      engineId: key.engineId,
      surfaceId: key.surfaceId,
      shaderAsset: shaderAsset,
    );
    _surfaces[key] = surface;
    return surface;
  }

  void _checkSurfaceQuota() {
    if (_surfaces.length >= maxSurfaces) {
      throw const JsThreeProtocolException('THREE surface quota exceeded');
    }
  }

  @override
  Future<JsThreeAsset> loadAsset(String engineId, String url) {
    final loader = assetLoader;
    if (loader == null) {
      return Future.error(
        StateError('three.assetFailure: no host asset loader is configured'),
      );
    }
    return loader(engineId, url);
  }

  @override
  Future<JsThreeCanvas2DResult> rasterizeCanvas2D(
    String boundEngineId,
    Map<String, dynamic> request,
  ) async {
    final parsed = parseJsThreeCanvas2DRequest(request);
    if (parsed.engineId != boundEngineId) {
      throw const JsThreeProtocolException(
        'three.canvas2d engine id does not match the bridge-bound engine',
      );
    }
    final key = JsThreeSurfaceKey(parsed.engineId, parsed.surfaceId);
    if (parsed.dispose) return _disposeCanvas2dRequest(key, parsed);
    final surfaces = _canvas2d.putIfAbsent(key, () => {});
    final state = _canvas2dState(key, parsed, surfaces);
    _validateCanvas2dRequest(state, parsed);
    return _rasterizeCanvas2dRequest(key, state, parsed);
  }

  Future<JsThreeCanvas2DResult> _disposeCanvas2dRequest(
    JsThreeSurfaceKey key,
    JsThreeCanvas2DRequest parsed,
  ) async {
    final surfaces = _canvas2d[key];
    if (surfaces?.remove(parsed.canvasId) != null) _canvas2dCount--;
    if (surfaces != null && surfaces.isEmpty) _canvas2d.remove(key);
    return _canvas2dResult(parsed, null, true);
  }

  _FlutterCanvas2DState _canvas2dState(
    JsThreeSurfaceKey key,
    JsThreeCanvas2DRequest parsed,
    Map<String, _FlutterCanvas2DState> surfaces,
  ) {
    final state = surfaces[parsed.canvasId];
    if (state != null) return state;
    return _createCanvas2dState(key, parsed, surfaces);
  }

  _FlutterCanvas2DState _createCanvas2dState(
    JsThreeSurfaceKey key,
    JsThreeCanvas2DRequest parsed,
    Map<String, _FlutterCanvas2DState> surfaces,
  ) {
    if (_canvas2dCount >= maxCanvas2dSurfaces) {
      if (surfaces.isEmpty) _canvas2d.remove(key);
      throw StateError('three.canvas2d: canvas quota exceeded');
    }
    final state = _FlutterCanvas2DState(parsed.generation);
    surfaces[parsed.canvasId] = state;
    _canvas2dCount++;
    return state;
  }

  void _validateCanvas2dRequest(
    _FlutterCanvas2DState state,
    JsThreeCanvas2DRequest parsed,
  ) {
    if (state.generation != parsed.generation) {
      throw const JsThreeProtocolException(
        'three.canvas2d surface generation changed for a live canvas',
      );
    }
    if (parsed.requestId <= state.lastRequestId) {
      throw const JsThreeProtocolException(
        'three.canvas2d request ids must be strictly increasing',
      );
    }
    state.lastRequestId = parsed.requestId;
  }

  Future<JsThreeCanvas2DResult> _rasterizeCanvas2dRequest(
    JsThreeSurfaceKey key,
    _FlutterCanvas2DState state,
    JsThreeCanvas2DRequest parsed,
  ) async {
    if (_canvas2dInFlight >= maxCanvas2dInFlight) {
      throw StateError('three.canvas2d: rasterization quota exceeded');
    }
    _canvas2dInFlight++;
    try {
      final bytes = await _canvas2dRasterizer(parsed);
      if (bytes.lengthInBytes != parsed.width * parsed.height * 4) {
        throw StateError(
          'three.canvas2d: rasterizer returned an invalid byte length',
        );
      }
      if (!_canvas2dCurrent(key, state, parsed)) {
        return _canvas2dResult(parsed, null, true);
      }
      return _canvas2dResult(parsed, Uint8List.fromList(bytes), false);
    } catch (_) {
      if (!_canvas2dCurrent(key, state, parsed)) {
        return _canvas2dResult(parsed, null, true);
      }
      rethrow;
    } finally {
      _canvas2dInFlight--;
    }
  }

  bool _canvas2dCurrent(
    JsThreeSurfaceKey key,
    _FlutterCanvas2DState state,
    JsThreeCanvas2DRequest request,
  ) =>
      identical(_canvas2d[key]?[request.canvasId], state) &&
      state.lastRequestId == request.requestId;

  void _disposeCanvas2dSurface(String engineId, String surfaceId) {
    final key = JsThreeSurfaceKey(engineId, surfaceId);
    final states = _canvas2d.remove(key);
    if (states != null) _canvas2dCount -= states.length;
  }

  @override
  Widget build(
    BuildContext context,
    JsThreeSurface surface,
    Map<String, dynamic> config,
  ) {
    if (surface is! FlutterGpuThreeSurface) {
      return const _ThreeHostMessage('three.unsupported: surface type');
    }
    return _buildFlutterGpuThreeSurface(surface);
  }

  @override
  void disposeEngine(String engineId) {
    final canvasKeys = _canvas2d.keys
        .where((key) => key.engineId == engineId)
        .toList();
    for (final key in canvasKeys) {
      _canvas2dCount -= _canvas2d.remove(key)?.length ?? 0;
    }
    final entries = _surfaces.entries
        .where((entry) => entry.key.engineId == engineId)
        .toList();
    for (final entry in entries) {
      _surfaces.remove(entry.key);
      entry.value.dispose();
    }
  }
}

JsThreeCanvas2DResult _canvas2dResult(
  JsThreeCanvas2DRequest request,
  Uint8List? data,
  bool stale,
) => JsThreeCanvas2DResult(
  engineId: request.engineId,
  surfaceId: request.surfaceId,
  canvasId: request.canvasId,
  generation: request.generation,
  requestId: request.requestId,
  width: request.width,
  height: request.height,
  data: data,
  stale: stale,
);

final class _FlutterCanvas2DState {
  _FlutterCanvas2DState(this.generation);
  final int generation;
  var lastRequestId = 0;
}

class FlutterGpuThreeSurface extends JsThreeSurface {
  FlutterGpuThreeSurface({
    required super.engineId,
    required super.surfaceId,
    required this.shaderAsset,
  });

  final String shaderAsset;
  final JsThreeStateStore _store = JsThreeStateStore();
  FlutterGpuThreeBackend? _backend;
  Future<FlutterGpuThreeBackend>? _backendFuture;
  Size _size = Size.zero;
  double _dpr = 1;
  bool _attached = false;
  bool _disposed = false;
  bool _retired = false;
  bool _scheduled = false;
  bool _rendering = false;
  int _generation = 0;
  int _presentedFrames = 0;
  double _decodeMs = 0;
  double _frameMs = 0;
  String? lastError;

  JsThreeSurfaceState? get state => _store.surface(engineId, surfaceId);

  void _notify() => notifyListeners();

  @override
  Size get logicalSize => _size;
  @override
  double get devicePixelRatio => _dpr;
  @override
  bool get isDisposed => _disposed || _retired;

  void _apply(JsThreeDecodedR1 decoded) {
    final watch = Stopwatch()..start();
    final result = _store.applyDecoded(decoded);
    _decodeMs = watch.elapsedMicroseconds / 1000;
    if (result.surfaceDisposed) {
      _retired = true;
      _generation++;
      _disposeBackend();
      notifyListeners();
      return;
    }
    _schedule();
  }

  @override
  void resize(Size size, double devicePixelRatio) {
    if (_disposed || _retired) return;
    _size = size;
    _dpr = devicePixelRatio.clamp(0.25, 4.0).toDouble();
    _schedule();
  }

  void _schedule() {
    if (!_canScheduleThreeSurface(this) || !_threeSurfaceHasArea(this)) return;
    _scheduleThreePendingFrame(this);
  }

  Future<void> _pump() async {
    _scheduled = false;
    final request = _nextThreeRenderRequest(this);
    if (request == null) return;
    _rendering = true;
    try {
      await _renderThreeRequest(this, request);
    } catch (error) {
      _handleThreePumpError(this, request, error);
    } finally {
      _rendering = false;
      _schedule();
    }
  }

  Future<FlutterGpuThreeBackend> _ensureBackend() {
    final existing = _backend;
    if (existing != null) return Future.value(existing);
    return _pendingOrCreateThreeBackend(this);
  }

  void _disposeBackend() {
    _generation++;
    final backend = _backend;
    _backend = null;
    backend?.dispose();
  }

  @override
  Future<Uint8List?> capture() async {
    final image = _backend?.currentImage;
    if (image == null) return null;
    final retained = image.clone();
    try {
      final data = await retained.toByteData(format: ui.ImageByteFormat.png);
      if (data == null) return null;
      return data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes);
    } finally {
      retained.dispose();
    }
  }

  @override
  Map<String, num> get diagnostics {
    final current = state;
    final backend = _backend;
    final stats = _threeDrawStats(backend?.lastPlan);
    return {
      'decodeMs': _decodeMs,
      'frameMs': _frameMs,
      'calls': stats.calls,
      'triangles': stats.triangles,
      'uploads': current?.uploadCount ?? 0,
      'presentedFrames': _presentedFrames,
      'coalescedFrames': current?.coalescedFrameCount ?? 0,
      'attached': _attached ? 1 : 0,
      'scheduled': _scheduled ? 1 : 0,
      'rendering': _rendering ? 1 : 0,
      'backendReady': backend == null ? 0 : 1,
      'backendInitializing': backend == null && _backendFuture != null ? 1 : 0,
      'surfaceWidth': _size.width,
      'surfaceHeight': _size.height,
      if (backend != null) ...backend.diagnostics,
    };
  }

  @override
  void dispose() {
    if (_disposed) return;
    _disposed = true;
    _attached = false;
    _disposeBackend();
    super.dispose();
  }
}

void _validateThreeSurfaceAttach(FlutterGpuThreeSurface surface) {
  if (surface.isDisposed) {
    throw StateError('three.surface: ${surface.surfaceId} is disposed');
  }
  if (surface._attached) {
    throw StateError('three.surface: ${surface.surfaceId} is already attached');
  }
}

Widget _buildFlutterGpuThreeSurface(FlutterGpuThreeSurface surface) {
  final error = _threeSurfaceErrorWidget(surface);
  if (error != null) return error;
  return _threeSurfaceContent(surface);
}

Widget? _threeSurfaceErrorWidget(FlutterGpuThreeSurface surface) {
  if (surface.isDisposed) {
    return const _ThreeHostMessage('three.surface: disposed');
  }
  final error = surface.lastError;
  if (error != null) return _ThreeHostMessage(error);
  return null;
}

Widget _threeSurfaceContent(FlutterGpuThreeSurface surface) {
  final image = surface._backend?.currentImage;
  if (image == null) return const ColoredBox(color: Color(0xFF000000));
  return RawImage(
    image: image,
    fit: BoxFit.fill,
    filterQuality: FilterQuality.none,
  );
}

bool _canScheduleThreeSurface(FlutterGpuThreeSurface surface) =>
    _threeSurfaceIdle(surface) && _threeSurfaceAttached(surface);

bool _threeSurfaceIdle(FlutterGpuThreeSurface surface) =>
    !surface._scheduled && !surface._rendering;

bool _threeSurfaceAttached(FlutterGpuThreeSurface surface) =>
    surface._attached && !surface.isDisposed;

bool _threeSurfaceHasArea(FlutterGpuThreeSurface surface) =>
    surface._size.width > 0 && surface._size.height > 0;

void _scheduleThreePendingFrame(FlutterGpuThreeSurface surface) {
  final current = surface.state;
  if (current == null || current.pendingFrameCount == 0) return;
  surface._scheduled = true;
  scheduleMicrotask(surface._pump);
}

bool _canPumpThreeSurface(FlutterGpuThreeSurface surface) =>
    surface._rendering || !surface._attached || surface.isDisposed;

_ThreeRenderRequest? _nextThreeRenderRequest(FlutterGpuThreeSurface surface) {
  if (_canPumpThreeSurface(surface)) return null;
  return _createThreeRenderRequest(surface);
}

_ThreeRenderRequest? _createThreeRenderRequest(FlutterGpuThreeSurface surface) {
  final current = surface.state;
  if (current == null || current.pendingFrameCount == 0) return null;
  return _threeRequestForFrame(surface, current, current.takePendingFrame());
}

_ThreeRenderRequest? _threeRequestForFrame(
  FlutterGpuThreeSurface surface,
  JsThreeSurfaceState state,
  JsThreeSubmitFrame? frame,
) {
  if (frame == null) return null;
  return _ThreeRenderRequest(
    state: state,
    frame: frame,
    width: (surface._size.width * surface._dpr).round().clamp(1, 16384).toInt(),
    height: (surface._size.height * surface._dpr)
        .round()
        .clamp(1, 16384)
        .toInt(),
    generation: surface._generation,
  );
}

Future<void> _renderThreeRequest(
  FlutterGpuThreeSurface surface,
  _ThreeRenderRequest request,
) async {
  final backend = await surface._ensureBackend();
  if (!_threeRequestAttached(surface, request)) return;
  await backend.render(
    request.state,
    width: request.width,
    height: request.height,
    frame: request.frame,
    pointSizeScale: surface._dpr,
  );
  if (!_threeRequestLive(surface, request)) return;
  _markThreeFramePresented(surface, request);
}

bool _threeRequestAttached(
  FlutterGpuThreeSurface surface,
  _ThreeRenderRequest request,
) =>
    request.generation == surface._generation &&
    surface._attached &&
    !surface.isDisposed;

bool _threeRequestLive(
  FlutterGpuThreeSurface surface,
  _ThreeRenderRequest request,
) => request.generation == surface._generation && !surface.isDisposed;

void _markThreeFramePresented(
  FlutterGpuThreeSurface surface,
  _ThreeRenderRequest request,
) {
  surface._presentedFrames++;
  surface._frameMs = request.watch.elapsedMicroseconds / 1000;
  surface.lastError = null;
  surface._notify();
}

void _handleThreePumpError(
  FlutterGpuThreeSurface surface,
  _ThreeRenderRequest request,
  Object error,
) {
  if (request.generation == surface._generation && !surface.isDisposed) {
    surface.lastError = 'three.unsupported: flutterGpu — $error';
    surface._notify();
  }
}

Future<FlutterGpuThreeBackend> _pendingOrCreateThreeBackend(
  FlutterGpuThreeSurface surface,
) {
  final pending = surface._backendFuture;
  if (pending != null) return pending;
  return _createThreeBackend(surface);
}

Future<FlutterGpuThreeBackend> _createThreeBackend(
  FlutterGpuThreeSurface surface,
) {
  final generation = surface._generation;
  final future = FlutterGpuThreeBackend.create(
    engineId: surface.engineId,
    surfaceId: surface.surfaceId,
    shaderAsset: surface.shaderAsset,
  );
  surface._backendFuture = future;
  return future.then(
    (backend) => _adoptThreeBackend(surface, backend, generation),
  );
}

FlutterGpuThreeBackend _adoptThreeBackend(
  FlutterGpuThreeSurface surface,
  FlutterGpuThreeBackend backend,
  int generation,
) {
  if (generation != surface._generation || surface.isDisposed) {
    backend.dispose();
    throw StateError('three.surface: stale backend initialization');
  }
  surface._backend = backend;
  return backend;
}

({int calls, int triangles}) _threeDrawStats(ThreeDrawPlan? plan) {
  if (plan == null) return (calls: 0, triangles: 0);
  return _threeDrawStatsFor(plan);
}

({int calls, int triangles}) _threeDrawStatsFor(ThreeDrawPlan plan) =>
    (calls: plan.mainDrawCallCount, triangles: plan.mainTriangleCount);

final class _ThreeRenderRequest {
  _ThreeRenderRequest({
    required this.state,
    required this.frame,
    required this.width,
    required this.height,
    required this.generation,
  });

  final JsThreeSurfaceState state;
  final JsThreeSubmitFrame frame;
  final int width;
  final int height;
  final int generation;
  final Stopwatch watch = Stopwatch()..start();
}

class _ThreeHostMessage extends StatelessWidget {
  const _ThreeHostMessage(this.message);

  final String message;

  @override
  Widget build(BuildContext context) => ColoredBox(
    color: const Color(0xFF111827),
    child: Center(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 12),
        ),
      ),
    ),
  );
}
