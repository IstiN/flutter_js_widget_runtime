import 'dart:async';
import 'dart:js_interop';
import 'dart:typed_data';
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_host.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_error_message.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/web_three_host_core.dart';
import 'package:web/web.dart' as web;

/// Structured-clone control messages are never passed through the JSON bridge.
typedef WebThreeControlSender = void Function(JSObject message);

/// Creates the independent upstream-THREE Web host.
///
/// [assetLoader] is used only after the widget-side prepared/local
/// `jsr.three.registerAsset` lookup misses. Without one, `three.asset` fails
/// visibly with `three.assetFailure` instead of fetching arbitrary URLs.
WebThreeHost createWebThreeHost({
  JsThreeAssetLoader? assetLoader,
  bool diagnosticsEnabled = false,
}) => WebThreeHost(
  assetLoader: assetLoader,
  diagnosticsEnabled: diagnosticsEnabled,
);

/// Owns one HTML canvas registry entry per `(engineId, surfaceId)`.
///
/// Rendering happens in the existing classic Worker on an OffscreenCanvas.
/// This host only draws transferred ImageBitmaps to a main-thread 2D canvas;
/// it never reserves a main-thread WebGL context.
class WebThreeHost implements JsThreeHost {
  WebThreeHost({
    JsThreeAssetLoader? assetLoader,
    bool diagnosticsEnabled = false,
  }) : _assetLoader = assetLoader,
       _diagnosticsEnabled = diagnosticsEnabled;

  static const int maxPendingFrames = 2;
  static int _nextHostId = 0;

  final JsThreeAssetLoader? _assetLoader;
  final bool _diagnosticsEnabled;
  final int _hostId = _nextHostId++;
  final Map<(String, String), _WebThreeChannel> _channels = {};
  final Map<(String, String), _WebThreeReleasedGeneration> _released = {};
  final Map<String, WebThreeControlSender> _controlSenders = {};
  int _nextSurfaceId = 0;
  int _crossEngineFrameCount = 0;
  int _rejectedFrameCount = 0;

  /// Aggregate counters are empty unless diagnostics were explicitly enabled.
  Map<String, num> get diagnostics {
    if (!_diagnosticsEnabled) return const {};
    return {
      'surfaces': _channels.values
          .where((channel) => channel.surface != null)
          .length,
      'channels': _channels.length,
      'pendingFrames': _channels.values.fold<int>(
        0,
        (total, channel) => total + channel.pending.length,
      ),
      'crossEngineFrames': _crossEngineFrameCount,
      'rejectedFrames':
          _rejectedFrameCount +
          _channels.values.fold<int>(
            0,
            (total, channel) => total + channel.rejectedFrameCount,
          ),
    };
  }

  /// Binds the Worker transport for one engine generation.
  ///
  /// `WebWorkerJsWidgetEngineBackend` calls this at run start. It is public so
  /// another Web-only classic-Worker adapter can use the host without a JSON
  /// or shared-platform interface.
  void bindEngine(String engineId, WebThreeControlSender sender) {
    if (engineId.isEmpty) return;
    _controlSenders[engineId] = sender;
  }

  /// Accepts one non-string Worker message. Returns whether it was a THREE
  /// frame/release message. Every received frame is closed and acknowledged,
  /// including stale, malformed, and cross-engine frames when a bitmap exists.
  bool handleWorkerMessage(
    String boundEngineId,
    JSAny? data,
    WebThreeControlSender sendControl,
  ) {
    if (data == null || !data.isA<JSObject>()) return false;
    final message = _WebThreeMessage._(data as JSObject);
    final type = message.type?.dartify();
    if (type == 'jsr.three.frame') {
      bindEngine(boundEngineId, sendControl);
      _receiveWebThreeFrame(this, boundEngineId, message, sendControl);
      return true;
    }
    if (type == 'jsr.three.release') {
      bindEngine(boundEngineId, sendControl);
      _receiveWebThreeRelease(this, boundEngineId, message);
      return true;
    }
    return false;
  }

  @override
  WebThreeSurface attach(
    String engineId,
    String surfaceId,
    Map<String, dynamic> config,
  ) {
    if (engineId.isEmpty || surfaceId.isEmpty) {
      throw const JsThreeUnsupportedException(
        'surface',
        'engineId and surfaceId must be nonempty',
      );
    }
    final canvasId = config['canvasId'] as String? ?? surfaceId;
    final generation = _configGeneration(config['generation']);
    if (canvasId.isEmpty || generation <= 0) {
      throw const JsThreeUnsupportedException(
        'surface',
        'invalid canvasId or generation',
      );
    }
    final key = (engineId, surfaceId);
    // A prepared mount re-arms a previously released canvas generation.
    _released.remove(key);
    var channel = _channels[key];
    if (channel != null &&
        (channel.lifecycle.canvasId != canvasId ||
            channel.lifecycle.generation != generation)) {
      _disposeChannel(channel, notifyWorker: true, reason: 'surfaceMismatch');
      _released.remove(key);
      channel = null;
    }
    channel ??= _WebThreeChannel(
      engineId: engineId,
      surfaceId: surfaceId,
      canvasId: canvasId,
      generation: generation,
    );
    _channels[key] = channel;
    final surface = channel.surface ??= WebThreeSurface._(
      host: this,
      channel: channel,
      viewType: 'jsr-three-$_hostId-${_nextSurfaceId++}',
      diagnosticsEnabled: _diagnosticsEnabled,
    );
    _scheduleDrain(channel);
    return surface;
  }

  @override
  WebThreeSurface? findSurface(String engineId, String surfaceId) =>
      _channels[(engineId, surfaceId)]?.surface;

  @override
  void release(String engineId, String surfaceId) {
    final channel = _channels[(engineId, surfaceId)];
    if (channel != null) _disposeChannel(channel, notifyWorker: true);
  }

  @override
  void disposeEngine(String engineId) {
    final channels = _channels.entries
        .where((entry) => entry.key.$1 == engineId)
        .map((entry) => entry.value)
        .toList(growable: false);
    for (final channel in channels) {
      _disposeChannel(channel, notifyWorker: true);
    }
    _released.removeWhere((key, _) => key.$1 == engineId);
    _controlSenders.remove(engineId);
  }

  @override
  Never submit(String boundEngineId, Uint8List envelope) {
    throw const JsThreeUnsupportedException(
      'r1',
      'raw R1 is unsupported on Web; use upstream WebGLRenderer',
    );
  }

  @override
  Future<JsThreeAsset> loadAsset(String engineId, String url) {
    final loader = _assetLoader;
    if (loader == null) {
      return Future.error(
        StateError('three.assetFailure: no three.asset loader is configured'),
      );
    }
    return loader(engineId, url);
  }

  @override
  Future<JsThreeCanvas2DResult> rasterizeCanvas2D(
    String boundEngineId,
    Map<String, dynamic> request,
  ) => Future.error(
    const JsThreeUnsupportedException(
      'three.canvas2d',
      'Web uses the upstream worker Canvas2D implementation',
    ),
  );

  @override
  Widget build(
    BuildContext context,
    JsThreeSurface surface,
    Map<String, dynamic> config,
  ) {
    if (surface is! WebThreeSurface || surface._host != this) {
      return const ThreeErrorMessage('three.surface: foreign Web surface');
    }
    if (surface.isDisposed) {
      return const ThreeErrorMessage('three.surface: disposed');
    }
    final error = surface.error;
    if (error != null) return ThreeErrorMessage(error);
    return HtmlElementView(viewType: surface.viewType);
  }

  void _scheduleDrain(_WebThreeChannel channel) {
    final surface = channel.surface;
    if (channel.drainScheduled ||
        channel.lifecycle.isDisposed ||
        surface == null ||
        surface.isDisposed ||
        channel.pending.isEmpty ||
        surface._physicalWidth == 0 ||
        surface._physicalHeight == 0) {
      return;
    }
    channel.drainScheduled = true;
    scheduleMicrotask(() => _drain(channel));
  }

  void _drain(_WebThreeChannel channel) {
    channel.drainScheduled = false;
    final surface = channel.surface;
    if (channel.lifecycle.isDisposed ||
        surface == null ||
        surface.isDisposed ||
        surface._physicalWidth == 0 ||
        surface._physicalHeight == 0) {
      return;
    }
    while (channel.pending.isNotEmpty &&
        !channel.lifecycle.isDisposed &&
        !surface.isDisposed) {
      final frame = channel.pending.removeAt(0);
      var accepted = false;
      var reason = '';
      try {
        surface._draw(frame.bitmap);
        channel.lifecycle.markPresented(frame.identity);
        channel.presentedFrameCount++;
        surface._hasPresentedFrame = true;
        surface._error = null;
        accepted = true;
      } catch (error) {
        channel.failedFrameCount++;
        surface._error = 'three.frame: $error';
        reason = 'drawFailed';
      }
      _closeFrame(frame, channel);
      if (!surface.isDisposed) surface._notifyFrameListeners();
      _ackFrame(frame, accepted: accepted, reason: reason, channel: channel);
    }
    _scheduleDrain(channel);
  }

  void _disposeChannel(
    _WebThreeChannel channel, {
    required bool notifyWorker,
    String reason = 'released',
  }) {
    final lifecycle = channel.lifecycle;
    final key = (lifecycle.engineId, lifecycle.surfaceId);
    if (identical(_channels[key], channel)) _channels.remove(key);
    lifecycle.dispose();
    channel.drainScheduled = false;
    _released[key] = _WebThreeReleasedGeneration(
      lifecycle.canvasId,
      lifecycle.generation,
    );
    final pending = List<_PendingWebThreeFrame>.from(channel.pending);
    channel.pending.clear();
    for (final frame in pending) {
      _finishFrame(frame, accepted: false, reason: reason, channel: channel);
    }
    if (notifyWorker) {
      final sender = _controlSenders[lifecycle.engineId];
      if (sender != null) {
        try {
          sender(
            <String, Object?>{
                  'type': 'jsr.three.release',
                  'engineId': lifecycle.engineId,
                  'surfaceId': lifecycle.surfaceId,
                  'canvasId': lifecycle.canvasId,
                  'generation': lifecycle.generation,
                }.jsify()!
                as JSObject,
          );
        } catch (_) {
          // Worker teardown races are harmless; bitmap ownership is already
          // settled and the surface is disposed below.
        }
      }
    }
    channel.surface?._disposeFromHost();
  }

  void _finishFrame(
    _PendingWebThreeFrame frame, {
    required bool accepted,
    required String reason,
    _WebThreeChannel? channel,
  }) {
    _closeFrame(frame, channel);
    _ackFrame(frame, accepted: accepted, reason: reason, channel: channel);
  }

  void _closeFrame(_PendingWebThreeFrame frame, _WebThreeChannel? channel) {
    if (frame.closed) return;
    frame.closed = true;
    try {
      frame.bitmap.close();
    } catch (_) {
      // close() is idempotent from the host's ownership perspective.
    }
    channel?.closedBitmapCount++;
  }

  void _ackFrame(
    _PendingWebThreeFrame frame, {
    required bool accepted,
    required String reason,
    _WebThreeChannel? channel,
  }) {
    if (frame.acked) return;
    frame.acked = true;
    final identity = frame.identity;
    final message = <String, Object?>{
      'type': 'jsr.three.frameAck',
      'engineId': identity.engineId,
      'surfaceId': identity.surfaceId,
      'canvasId': identity.canvasId,
      'generation': identity.generation,
      'frameId': identity.frameId,
      'accepted': accepted,
      if (reason.isNotEmpty) 'reason': reason,
    };
    try {
      frame.sender(message.jsify()! as JSObject);
      channel?.acknowledgedFrameCount++;
    } catch (_) {
      // A terminated Worker cannot consume acknowledgements. The bitmap has
      // still been closed and no Dart callback error escapes the frame lane.
    }
  }

  void _ackRaw(
    _WebThreeMessage message,
    WebThreeControlSender sender, {
    required String reason,
  }) {
    final ack = <String, Object?>{
      'type': 'jsr.three.frameAck',
      'engineId': message.engineId?.dartify() ?? '',
      'surfaceId': message.surfaceId?.dartify() ?? '',
      'canvasId': message.canvasId?.dartify() ?? '',
      'generation': _rawInteger(message.generation),
      'frameId': _rawInteger(message.frameId),
      'accepted': false,
      'reason': reason,
    };
    try {
      sender(ack.jsify()! as JSObject);
    } catch (_) {}
  }

  static int _rawInteger(JSAny? value) {
    final parsed = value?.dartify();
    return parsed is num && parsed.isFinite ? parsed.toInt() : -1;
  }

  static void _closeForeignBitmap(web.ImageBitmap? bitmap) {
    try {
      bitmap?.close();
    } catch (_) {}
  }

  static WebThreeFrameIdentity? _frameIdentity(_WebThreeMessage message) =>
      WebThreeFrameIdentity.tryParse(
        engineId: message.engineId?.dartify(),
        surfaceId: message.surfaceId?.dartify(),
        canvasId: message.canvasId?.dartify(),
        generation: message.generation?.dartify(),
        frameId: message.frameId?.dartify(),
        width: message.width?.dartify(),
        height: message.height?.dartify(),
      );

  static WebThreeFrameIdentity? _releaseIdentity(_WebThreeMessage message) =>
      WebThreeFrameIdentity.tryParse(
        engineId: message.engineId?.dartify(),
        surfaceId: message.surfaceId?.dartify(),
        canvasId: message.canvasId?.dartify(),
        generation: message.generation?.dartify(),
        frameId: 0,
        width: 1,
        height: 1,
      );

  static int _configGeneration(Object? value) {
    if (value is num && value.isFinite && value == value.toInt()) {
      return value.toInt();
    }
    return 1;
  }
}

void _receiveWebThreeFrame(
  WebThreeHost host,
  String boundEngineId,
  _WebThreeMessage message,
  WebThreeControlSender sender,
) {
  final identity = WebThreeHost._frameIdentity(message);
  final bitmapValue = message.bitmap;
  final bitmap = bitmapValue != null && bitmapValue.isA<web.ImageBitmap>()
      ? bitmapValue as web.ImageBitmap
      : null;
  if (identity == null || bitmap == null) {
    WebThreeHost._closeForeignBitmap(bitmap);
    host._ackRaw(message, sender, reason: 'invalidFrame');
    host._rejectedFrameCount++;
    return;
  }
  final frame = _PendingWebThreeFrame(identity, bitmap, sender);
  if (identity.engineId != boundEngineId) {
    host._crossEngineFrameCount++;
    host._finishFrame(frame, accepted: false, reason: 'crossEngine');
    return;
  }

  final key = (identity.engineId, identity.surfaceId);
  final released = host._released[key];
  if (released != null) {
    final isPreparedGeneration =
        identity.canvasId == released.canvasId &&
        identity.generation > released.generation;
    if (!isPreparedGeneration) {
      host._rejectedFrameCount++;
      host._finishFrame(frame, accepted: false, reason: 'released');
      return;
    }
    host._released.remove(key);
  }

  var channel = host._channels[key];
  if (channel != null && !channel.acceptsIdentity(identity)) {
    channel.rejectedFrameCount++;
    host._finishFrame(frame, accepted: false, reason: 'surfaceMismatch');
    return;
  }
  // Frames can beat Flutter's platform-view mount. Retain at most two for
  // the stamped identity, then adopt them when attach() creates the canvas.
  channel ??= _WebThreeChannel(
    engineId: identity.engineId,
    surfaceId: identity.surfaceId,
    canvasId: identity.canvasId,
    generation: identity.generation,
  );
  host._channels[key] = channel;
  final rejection = channel.lifecycle.accept(identity);
  if (rejection != WebThreeFrameRejection.none) {
    channel.rejectedFrameCount++;
    host._finishFrame(frame, accepted: false, reason: rejection.name);
    return;
  }
  channel.receivedFrameCount++;
  if (channel.pending.length == WebThreeHost.maxPendingFrames) {
    // Preserve the oldest potentially in-flight frame and coalesce the
    // previous newest one. The newest bitmap always wins the second slot.
    final dropped = channel.pending.removeLast();
    channel.coalescedFrameCount++;
    host._finishFrame(
      dropped,
      accepted: false,
      reason: 'coalesced',
      channel: channel,
    );
  }
  channel.pending.add(frame);
  host._scheduleDrain(channel);
}

void _receiveWebThreeRelease(
  WebThreeHost host,
  String boundEngineId,
  _WebThreeMessage message,
) {
  final identity = WebThreeHost._releaseIdentity(message);
  if (identity == null || identity.engineId != boundEngineId) return;
  final key = (identity.engineId, identity.surfaceId);
  final channel = host._channels[key];
  if (channel != null) {
    if (!channel.acceptsIdentity(identity)) return;
    host._disposeChannel(channel, notifyWorker: false, reason: 'released');
    return;
  }
  final previous = host._released[key];
  if (previous == null || identity.generation >= previous.generation) {
    host._released[key] = _WebThreeReleasedGeneration(
      identity.canvasId,
      identity.generation,
    );
  }
}

/// A main-thread presentation surface backed by HTMLCanvasElement.
class WebThreeSurface extends JsThreeSurface {
  WebThreeSurface._({
    required WebThreeHost host,
    required _WebThreeChannel channel,
    required this.viewType,
    required bool diagnosticsEnabled,
  }) : _host = host,
       _channel = channel,
       _diagnosticsEnabled = diagnosticsEnabled,
       canvas = web.HTMLCanvasElement(),
       super(
         engineId: channel.lifecycle.engineId,
         surfaceId: channel.lifecycle.surfaceId,
       ) {
    canvas
      ..width = 0
      ..height = 0
      ..style.width = '100%'
      ..style.height = '100%'
      ..style.display = 'block';
    final context = canvas.getContext('2d');
    if (context == null) {
      canvas.remove();
      throw const JsThreeUnsupportedException(
        'canvas2d',
        'main-thread bitmap presentation requires Canvas2D',
      );
    }
    _context = context as web.CanvasRenderingContext2D;
    ui_web.platformViewRegistry.registerViewFactory(viewType, (_) => canvas);
  }

  final WebThreeHost _host;
  final _WebThreeChannel _channel;
  final bool _diagnosticsEnabled;
  final String viewType;

  /// The canvas registered for this surface's [HtmlElementView].
  final web.HTMLCanvasElement canvas;
  late final web.CanvasRenderingContext2D _context;
  Size _logicalSize = Size.zero;
  double _devicePixelRatio = 1;
  int _physicalWidth = 0;
  int _physicalHeight = 0;
  int _resizeCount = 0;
  bool _disposed = false;
  bool _disposing = false;
  bool _hasPresentedFrame = false;
  String? _error;

  String? get error => _error;

  @override
  Size get logicalSize => _logicalSize;

  @override
  double get devicePixelRatio => _devicePixelRatio;

  @override
  bool get isDisposed => _disposed;

  @override
  void resize(Size size, double devicePixelRatio) {
    if (_disposed) return;
    if (!_validDimension(size.width) ||
        !_validDimension(size.height) ||
        !devicePixelRatio.isFinite ||
        devicePixelRatio <= 0 ||
        devicePixelRatio > 16) {
      _error = 'three.surface: invalid resize dimensions or DPR';
      notifyListeners();
      return;
    }
    final width = (size.width * devicePixelRatio).floor();
    final height = (size.height * devicePixelRatio).floor();
    if (width > 16384 || height > 16384) {
      _error = 'three.surface: drawing buffer exceeds 16384 pixels';
      notifyListeners();
      return;
    }
    if (size == _logicalSize &&
        devicePixelRatio == _devicePixelRatio &&
        width == _physicalWidth &&
        height == _physicalHeight) {
      return;
    }
    _logicalSize = size;
    _devicePixelRatio = devicePixelRatio;
    _resizeCount++;
    if (width != _physicalWidth) {
      canvas.width = width;
      _physicalWidth = width;
      _hasPresentedFrame = false;
    }
    if (height != _physicalHeight) {
      canvas.height = height;
      _physicalHeight = height;
      _hasPresentedFrame = false;
    }
    _error = null;
    notifyListeners();
    _host._scheduleDrain(_channel);
  }

  void _notifyFrameListeners() {
    if (!_disposed) notifyListeners();
  }

  void _draw(web.ImageBitmap bitmap) {
    if (_disposed || _physicalWidth == 0 || _physicalHeight == 0) {
      throw StateError('surface is not presentable');
    }
    _context.globalCompositeOperation = 'copy';
    _context.drawImage(bitmap, 0, 0, _physicalWidth, _physicalHeight);
  }

  @override
  Future<Uint8List?> capture() async {
    if (_disposed ||
        !_hasPresentedFrame ||
        _physicalWidth == 0 ||
        _physicalHeight == 0) {
      return null;
    }
    try {
      final completer = Completer<web.Blob?>();
      canvas.toBlob(
        ((web.Blob? blob) {
          if (!completer.isCompleted) completer.complete(blob);
        }).toJS,
        'image/png',
      );
      final blob = await completer.future;
      if (blob == null) return null;
      final bytes = (await blob.arrayBuffer().toDart).toDart;
      return bytes.asUint8List();
    } catch (_) {
      return null;
    }
  }

  @override
  Map<String, num> get diagnostics {
    if (!_diagnosticsEnabled) return const {};
    final lifecycle = _channel.lifecycle;
    return {
      'receivedFrames': _channel.receivedFrameCount,
      'presentedFrames': _channel.presentedFrameCount,
      'rejectedFrames': _channel.rejectedFrameCount,
      'coalescedFrames': _channel.coalescedFrameCount,
      'failedFrames': _channel.failedFrameCount,
      'closedBitmaps': _channel.closedBitmapCount,
      'acknowledgedFrames': _channel.acknowledgedFrameCount,
      'pendingFrames': _channel.pending.length,
      'resizes': _resizeCount,
      'lastFrameId': lifecycle.lastReceivedFrameId,
      'lastPresentedFrameId': lifecycle.lastPresentedFrameId,
      'generation': lifecycle.generation,
      'width': _physicalWidth,
      'height': _physicalHeight,
      'logicalWidth': _logicalSize.width,
      'logicalHeight': _logicalSize.height,
      'devicePixelRatio': _devicePixelRatio,
    };
  }

  @override
  void dispose() {
    if (_disposed) return;
    _disposing = true;
    _host.release(engineId, surfaceId);
    _disposeFromHost();
    super.dispose();
  }

  void _disposeFromHost() {
    if (_disposed) return;
    _disposed = true;
    _hasPresentedFrame = false;
    canvas
      ..width = 0
      ..height = 0
      ..remove();
    if (!_disposing) super.dispose();
  }

  static bool _validDimension(double value) =>
      value.isFinite && value >= 0 && value <= 16384;
}

class _WebThreeChannel {
  _WebThreeChannel({
    required String engineId,
    required String surfaceId,
    required String canvasId,
    required int generation,
  }) : lifecycle = WebThreeFrameLifecycle(
         engineId: engineId,
         surfaceId: surfaceId,
         canvasId: canvasId,
         generation: generation,
       );

  final WebThreeFrameLifecycle lifecycle;
  final List<_PendingWebThreeFrame> pending = [];
  WebThreeSurface? surface;
  bool drainScheduled = false;
  int receivedFrameCount = 0;
  int presentedFrameCount = 0;
  int rejectedFrameCount = 0;
  int coalescedFrameCount = 0;
  int failedFrameCount = 0;
  int closedBitmapCount = 0;
  int acknowledgedFrameCount = 0;

  bool acceptsIdentity(WebThreeFrameIdentity identity) => identity.belongsTo(
    lifecycle.engineId,
    lifecycle.surfaceId,
    lifecycle.canvasId,
    lifecycle.generation,
  );
}

class _PendingWebThreeFrame {
  _PendingWebThreeFrame(this.identity, this.bitmap, this.sender);

  final WebThreeFrameIdentity identity;
  final web.ImageBitmap bitmap;
  final WebThreeControlSender sender;
  bool closed = false;
  bool acked = false;
}

class _WebThreeReleasedGeneration {
  const _WebThreeReleasedGeneration(this.canvasId, this.generation);

  final String canvasId;
  final int generation;
}

extension type _WebThreeMessage._(JSObject _) implements JSObject {
  external JSAny? get type;
  external JSAny? get engineId;
  external JSAny? get surfaceId;
  external JSAny? get canvasId;
  external JSAny? get generation;
  external JSAny? get frameId;
  external JSAny? get width;
  external JSAny? get height;
  external JSAny? get bitmap;
}
