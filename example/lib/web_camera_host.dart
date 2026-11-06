import 'dart:async';
import 'dart:convert';
import 'dart:js_interop';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:web/web.dart' as web;

/// Web implementation of the `camera.*` host-call contract for the preview
/// runner, backed by getUserMedia on the main thread — widget JS runs in a
/// Worker, which has no `navigator.mediaDevices` (probed: Chrome 153).
///
/// This is the web counterpart of `camera_host.dart` (macOS AVFoundation)
/// and answers the SAME contract so the widget-side pull lanes stay uniform:
/// - `camera.start({fps})` → `{available: true, width, height}` after the
///   permission prompt, or `{available: false, reason}` (never throws).
///   The grant dimensions are the BOUNDED capture size the host will serve
///   (max edge 192), not the native camera resolution.
/// - `camera.frame({seq})` → newest captured frame as
///   `{changed, seq, width, height, format: 'rgba', data: <base64 RGBA>}`,
///   with the same `{changed: false, seq}` short-circuit for pulls that ask
///   for a frame already delivered.
/// - `camera.stop()` → stops the tracks so the camera indicator turns off
///   when the widget closes; `{available: false, reason: 'stopped'}`.
/// - `camera.track` → `{available: false, reason: ...}`: on-web face
///   tracking is MediaPipe's job inside the widget worker, not this lane.
///
/// Frames are captured on a bounded 66ms timer while the session is active
/// (~15fps), downscaled from the live `<video>` through a 2D canvas. The
/// video element is parked off-screen (opacity 0) rather than `display:
/// none`, which some browsers treat as a reason to stop delivering frames.
class WebCameraHost {
  WebCameraHost();

  /// Chains this host after another `onHostCall` handler (e.g. the ASR
  /// handler, which throws on foreign names) — mirrors
  /// [ExampleCameraHost.chainedWith].
  Future<Object?> Function(String name, Map<String, dynamic> args) chainedWith(
    Future<Object?> Function(String name, Map<String, dynamic> args) first,
  ) => (name, args) async {
    try {
      return await first(name, args);
    } on ArgumentError catch (_) {
      return handleCall(name, args);
    } on UnsupportedError catch (_) {
      return handleCall(name, args);
    }
  };

  /// [JsRuntimeConfig.onHostCall] entry point.
  Future<Object?> handleCall(String name, Map<String, dynamic> args) {
    return switch (name) {
      'camera.start' => _start(args),
      'camera.frame' => Future<Object?>.value(_frameCall(args)),
      'camera.stop' => Future<Object?>.value(_stop()),
      'camera.track' => Future<Object?>.value(<String, Object>{
        'available': false,
        'reason': 'face tracking runs inside the widget worker on web',
      }),
      _ => Future<Object?>.error(
        ArgumentError.value(name, 'name', 'not a camera host call'),
      ),
    };
  }

  static const int _captureIntervalMs = 66; // ~15fps, matches the pull lane
  static const int _maxEdge = 192; // bounded served frame edge (RGBA 147KiB)

  web.MediaStream? _stream;
  web.HTMLVideoElement? _video;
  web.CanvasRenderingContext2D? _ctx;
  Timer? _captureTimer;
  bool _available = false;
  String _reason = 'camera not started';
  int _width = 0;
  int _height = 0;
  int _seq = -1;
  String? _frameData;

  Future<Map<String, Object>> _start(Map<String, dynamic> args) async {
    debugPrint('[WebCameraHost] start(args=$args)');
    if (_available) {
      return <String, Object>{
        'available': true,
        'width': _width,
        'height': _height,
      };
    }
    // package:web types mediaDevices non-null, but on a non-secure context
    // it is undefined at runtime — the getUserMedia call then throws and is
    // reported as an unavailable camera below.
    final web.MediaStream stream;
    try {
      stream = await web.window.navigator.mediaDevices
          .getUserMedia(
            web.MediaStreamConstraints(
              video: <String, Object?>{
                'facingMode': 'user',
                'width': {'ideal': 640},
                'height': {'ideal': 480},
              }.jsify()!,
            ),
          )
          .toDart;
    } catch (e) {
      final desc = e.toString();
      _reason = desc.contains('NotAllowedError')
          ? 'camera permission denied'
          : 'camera is not available: $desc';
      return <String, Object>{'available': false, 'reason': _reason};
    }
    _stream = stream;

    // Parked off-screen live preview element: keeps delivering frames while
    // invisible (display:none can suspend delivery in some browsers).
    final video = web.document.createElement('video') as web.HTMLVideoElement;
    video.setAttribute('playsinline', '');
    video.muted = true;
    video.autoplay = true;
    final style = video.style;
    style.position = 'fixed';
    style.left = '-9999px';
    style.top = '-9999px';
    style.width = '1px';
    style.height = '1px';
    style.opacity = '0';
    video.srcObject = stream;
    web.document.body?.appendChild(video);
    _video = video;

    try {
      await video.play().toDart;
    } catch (_) {
      // Autoplay rejection: muted+playsinline makes this rare; the metadata
      // guard below fails bounded if the stream never starts.
    }
    final ready = await _waitForVideoReady(video, const Duration(seconds: 5));
    if (!ready) {
      _reason = 'camera stream produced no frames in time';
      _stop();
      return <String, Object>{'available': false, 'reason': _reason};
    }

    // Bounded served size: max edge 192, preserving the camera aspect.
    final aspect = video.videoWidth / video.videoHeight;
    if (aspect >= 1) {
      _height = _maxEdge;
      _width = _even(math.min(_maxEdge * 4, (_maxEdge * aspect).round()));
    } else {
      _width = _maxEdge;
      _height = _even(math.min(_maxEdge * 4, (_maxEdge / aspect).round()));
    }
    final canvas =
        web.document.createElement('canvas') as web.HTMLCanvasElement;
    canvas.width = _width;
    canvas.height = _height;
    final ctx = canvas.getContext('2d') as web.CanvasRenderingContext2D?;
    if (ctx == null) {
      _reason = '2D canvas unavailable';
      _stop();
      return <String, Object>{'available': false, 'reason': _reason};
    }
    _ctx = ctx;
    _available = true;
    _seq = -1;
    _captureTimer = Timer.periodic(
      const Duration(milliseconds: _captureIntervalMs),
      (_) => _capture(),
    );
    debugPrint(
      '[WebCameraHost] granted ${_width}x$_height '
      '(video ${video.videoWidth}x${video.videoHeight})',
    );
    return <String, Object>{
      'available': true,
      'width': _width,
      'height': _height,
    };
  }

  static int _even(int value) => value < 2 ? 2 : value - (value % 2);

  Future<bool> _waitForVideoReady(
    web.HTMLVideoElement video,
    Duration timeout,
  ) async {
    final completer = Completer<bool>();
    void onReady(web.Event _) {
      if (!completer.isCompleted) completer.complete(true);
    }

    video.addEventListener('loadeddata', onReady.toJS);
    Timer(timeout, () {
      if (!completer.isCompleted) completer.complete(false);
    });
    if (video.readyState >= 2 && !completer.isCompleted) {
      completer.complete(true);
    }
    return completer.future;
  }

  void _capture() {
    final video = _video;
    final ctx = _ctx;
    if (!_available || video == null || ctx == null) return;
    if (video.readyState < 2) return;
    try {
      ctx.drawImage(video, 0, 0, _width, _height);
      final pixels = ctx.getImageData(0, 0, _width, _height).data.toDart;
      _frameData = base64Encode(pixels);
      _seq++;
    } catch (e) {
      // Bounded: keep the previous frame; a broken capture loop surfaces
      // through the widget-side pull short-circuits instead of throwing.
      debugPrint('[WebCameraHost] capture failed: $e');
    }
  }

  Map<String, Object> _frameCall(Map<String, dynamic> args) {
    if (!_available) {
      return <String, Object>{
        'available': false,
        'changed': false,
        'seq': _seq,
        if (_reason.isNotEmpty) 'reason': _reason,
      };
    }
    final requestedSeq = (args['seq'] as num?)?.toInt() ?? -1;
    if (_frameData == null || _seq <= requestedSeq) {
      return <String, Object>{'available': true, 'changed': false, 'seq': _seq};
    }
    return <String, Object>{
      'available': true,
      'changed': true,
      'seq': _seq,
      'width': _width,
      'height': _height,
      'format': 'rgba',
      'data': _frameData!,
    };
  }

  Map<String, Object> _stop() {
    _captureTimer?.cancel();
    _captureTimer = null;
    _available = false;
    _frameData = null;
    final stream = _stream;
    if (stream != null) {
      for (final track in stream.getTracks().toDart) {
        track.stop();
      }
      _stream = null;
    }
    _video?.remove();
    _video = null;
    _ctx = null;
    return <String, Object>{'available': false, 'reason': 'stopped'};
  }
}
