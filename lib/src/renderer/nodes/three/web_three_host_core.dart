/// Browser-independent identity and lifecycle checks for the Web THREE lane.
///
/// Kept separate from `web_three_host.dart` so malformed/stale-frame policy can
/// be tested on the VM without a DOM or Chrome.
library;

typedef _WebThreeFrameMetadata = ({
  int generation,
  int frameId,
  int width,
  int height,
});

/// Immutable identity and physical dimensions of one transferred frame.
final class WebThreeFrameIdentity {
  const WebThreeFrameIdentity({
    required this.engineId,
    required this.surfaceId,
    required this.canvasId,
    required this.generation,
    required this.frameId,
    required this.width,
    required this.height,
  });

  final String engineId;
  final String surfaceId;
  final String canvasId;
  final int generation;
  final int frameId;
  final int width;
  final int height;

  /// Parses scalar values obtained from a structured-clone JS object.
  ///
  /// The ImageBitmap is deliberately not part of this value: it must retain
  /// its JS identity and ownership all the way to draw/close.
  static WebThreeFrameIdentity? tryParse({
    required Object? engineId,
    required Object? surfaceId,
    required Object? canvasId,
    required Object? generation,
    required Object? frameId,
    required Object? width,
    required Object? height,
  }) {
    if (engineId is! String || engineId.isEmpty) return null;
    if (surfaceId is! String || surfaceId.isEmpty) return null;
    if (canvasId is! String || canvasId.isEmpty) return null;
    final metadata = _parseMetadata(
      generation: generation,
      frameId: frameId,
      width: width,
      height: height,
    );
    if (metadata == null) return null;
    return WebThreeFrameIdentity(
      engineId: engineId,
      surfaceId: surfaceId,
      canvasId: canvasId,
      generation: metadata.generation,
      frameId: metadata.frameId,
      width: metadata.width,
      height: metadata.height,
    );
  }

  static _WebThreeFrameMetadata? _parseMetadata({
    required Object? generation,
    required Object? frameId,
    required Object? width,
    required Object? height,
  }) {
    final parsedGeneration = _nonnegativeInteger(generation);
    final parsedFrame = _nonnegativeInteger(frameId);
    final parsedWidth = _nonnegativeInteger(width);
    final parsedHeight = _nonnegativeInteger(height);
    if (parsedGeneration == null ||
        parsedGeneration == 0 ||
        parsedFrame == null ||
        parsedWidth == null ||
        parsedWidth == 0 ||
        parsedHeight == null ||
        parsedHeight == 0) {
      return null;
    }
    return (
      generation: parsedGeneration,
      frameId: parsedFrame,
      width: parsedWidth,
      height: parsedHeight,
    );
  }

  bool belongsTo(
    String expectedEngineId,
    String expectedSurfaceId,
    String expectedCanvasId,
    int expectedGeneration,
  ) =>
      engineId == expectedEngineId &&
      surfaceId == expectedSurfaceId &&
      canvasId == expectedCanvasId &&
      generation == expectedGeneration;

  static int? _nonnegativeInteger(Object? value) {
    if (value is! num || !value.isFinite) return null;
    final integer = value.toInt();
    if (integer < 0 || integer != value) return null;
    return integer;
  }
}

enum WebThreeFrameRejection {
  none,
  disposed,
  crossEngine,
  surfaceMismatch,
  stale,
}

/// Per-canvas-generation ordering and disposal state.
///
/// A generation never resets its frame ordering. A prepared remount creates a
/// fresh lifecycle after the host removes the released generation's channel.
final class WebThreeFrameLifecycle {
  WebThreeFrameLifecycle({
    required this.engineId,
    required this.surfaceId,
    required this.canvasId,
    required this.generation,
  });

  final String engineId;
  final String surfaceId;
  final String canvasId;
  final int generation;

  int _lastReceivedFrameId = -1;
  int _lastPresentedFrameId = -1;
  bool _disposed = false;

  int get lastReceivedFrameId => _lastReceivedFrameId;
  int get lastPresentedFrameId => _lastPresentedFrameId;
  bool get isDisposed => _disposed;

  /// Atomically validates and records a frame before its bitmap is queued.
  WebThreeFrameRejection accept(WebThreeFrameIdentity frame) {
    if (_disposed) return WebThreeFrameRejection.disposed;
    if (frame.engineId != engineId) {
      return WebThreeFrameRejection.crossEngine;
    }
    if (!frame.belongsTo(engineId, surfaceId, canvasId, generation)) {
      return WebThreeFrameRejection.surfaceMismatch;
    }
    if (frame.frameId <= _lastReceivedFrameId) {
      return WebThreeFrameRejection.stale;
    }
    _lastReceivedFrameId = frame.frameId;
    return WebThreeFrameRejection.none;
  }

  bool markPresented(WebThreeFrameIdentity frame) {
    if (_disposed ||
        !frame.belongsTo(engineId, surfaceId, canvasId, generation) ||
        frame.frameId <= _lastPresentedFrameId) {
      return false;
    }
    _lastPresentedFrameId = frame.frameId;
    return true;
  }

  void dispose() {
    _disposed = true;
  }
}
