import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

/// Example-app camera host for the JSR three webcam examples.
///
/// The core package deliberately ships no camera dependency: this host wires
/// the macOS Runner's AVFoundation lane (`jsr.camera` method channel,
/// MainFlutterWindow.swift) into the generic
/// [JsRuntimeConfig.onHostCall] contract under the `camera.*` namespace:
/// - `camera.start` — capability probe + permission request. Resolves
///   `{available: true, width, height}` or
///   `{available: false, reason: ...}` (never throws) so widgets can
///   degrade to their bounded fallback render.
/// - `camera.frame` — newest captured frame as
///   `{changed, seq, width, height, data: <base64 RGBA>}`. A pull whose
///   `seq` matches the last delivered frame resolves `{changed: false,
///   seq}` so the JS pull loop can skip the decode + texture write.
/// - `camera.track` — opt-in face tracking (macOS Vision). While enabled
///   the Swift host attaches compact normalized landmark geometry to each
///   frame push; this host maps it to an APPROXIMATE subset of the Face Cap
///   blendshapes (`faceSignalsFromLandmarks`) with lerp smoothing and adds
///   `{shapes: {name: 0..1}, lookX, lookY}` to every camera.frame response.
///   This is Apple Vision landmark geometry, NOT MediaPipe-grade
///   blendshapes — expect rough, asymmetric-capable-but-simplified mimicry.
/// - `camera.stop` — releases the capture session so the macOS camera
///   indicator turns off when the example page closes (tracking included).
///
/// Frames flow Swift → Dart proactively (channel push, newest-only) and
/// Dart → JS on demand (pull): `jsr.hostCallBinary` is a JS→Dart lane, so a
/// push into JS is impossible without core changes; the pull reuses the same
/// resolve lane that already ships multi-MB GLB assets at widget boot.
class ExampleCameraHost {
  ExampleCameraHost();

  static const _channel = MethodChannel('jsr.camera');

  bool _listening = false;
  bool _sessionRequested = false;
  bool _available = false;
  bool _tracking = false;
  String _reason = 'camera not started';
  int _width = 0;
  int _height = 0;
  int _lastDeliveredSeq = -1;
  int _seq = -1;
  Uint8List? _frame;
  final FaceSignalSmother _pipeline = FaceSignalSmother();

  /// Chains this host after another `onHostCall` handler (e.g. the audio
  /// host, which throws [ArgumentError] on foreign names).
  Future<Object?> Function(String name, Map<String, dynamic> args) chainedWith(
    Future<Object?> Function(String name, Map<String, dynamic> args) first,
  ) => (name, args) async {
    try {
      return await first(name, args);
    } on ArgumentError {
      return handleCall(name, args);
    }
  };

  /// [JsRuntimeConfig.onHostCall] entry point.
  Future<Object?> handleCall(String name, Map<String, dynamic> args) async {
    switch (name) {
      case 'camera.start':
        return _start(args);
      case 'camera.frame':
        return _frameCall(args);
      case 'camera.track':
        return _track(args);
      case 'camera.stop':
        return _stop();
      default:
        throw ArgumentError.value(name, 'name', 'not a camera host call');
    }
  }

  void _ensureListener() {
    if (_listening) return;
    _listening = true;
    _channel.setMethodCallHandler((call) async {
      if (call.method != 'frame') return null;
      final args = call.arguments as Map?;
      if (args == null || args['available'] != true) return null;
      _handlePush(args);
      return null;
    });
  }

  void _handlePush(Map<Object?, Object?> args) {
    final data = args['data'];
    if (data is! Uint8List) return;
    _frame = data;
    _seq = (args['seq'] as num?)?.toInt() ?? (_seq + 1);
    _width = (args['width'] as num?)?.toInt() ?? 0;
    _height = (args['height'] as num?)?.toInt() ?? 0;
    if (_tracking) {
      final landmarks = parseLandmarks(args['landmarks']);
      if (landmarks != null) {
        final signals = faceSignalsFromLandmarks(landmarks);
        if (signals != null) _pipeline.step(signals);
      }
    }
    _diag('push seq=$_seq ${_width}x$_height ${data.lengthInBytes}B');
  }

  /// Test seam: feeds a Swift frame-push payload through the same parse +
  /// smoothing path the method-channel listener uses.
  @visibleForTesting
  void handlePushForTesting(Map<Object?, Object?> arguments) {
    if (arguments['available'] != true) return;
    _handlePush(arguments);
  }

  // Capture-run diagnostics: `open`-launched apps have no capturable stdout,
  // so JSR_CAMERA_LOG=<path> appends the lane's events to a file instead.
  void _diag(String line) {
    final path = Platform.environment['JSR_CAMERA_LOG'];
    if (path == null || path.isEmpty) return;
    try {
      File(path).writeAsStringSync(
        '${DateTime.now().toIso8601String()} $line\n',
        mode: FileMode.append,
      );
    } catch (_) {
      // Diagnostics must never break the camera lane.
    }
  }

  Future<Map<String, Object>> _start(Map<String, dynamic> args) async {
    _ensureListener();
    try {
      final result = await _channel.invokeMethod<dynamic>(
        'start',
        <String, dynamic>{'fps': (args['fps'] as num?)?.toInt() ?? 24},
      );
      final map = result is Map
          ? result.cast<String, dynamic>()
          : const <String, dynamic>{};
      _available = map['available'] == true;
      _reason = map['reason'] as String? ?? (_available ? '' : 'unavailable');
      _diag('start available=$_available reason=$_reason');
      if (_available) {
        _width = (map['width'] as num?)?.toInt() ?? 0;
        _height = (map['height'] as num?)?.toInt() ?? 0;
        _sessionRequested = true;
      }
      return <String, Object>{
        'available': _available,
        'width': _width,
        'height': _height,
        if (!_available && _reason.isNotEmpty) 'reason': _reason,
      };
    } on MissingPluginException {
      // Non-macOS host or an older build without the camera lane: the
      // bounded checker fallback keeps rendering (same as today).
      _available = false;
      _reason = 'camera lane unavailable on this host';
      return <String, Object>{'available': false, 'reason': _reason};
    } on PlatformException catch (error) {
      _available = false;
      _reason = error.message ?? error.code;
      return <String, Object>{'available': false, 'reason': _reason};
    }
  }

  Future<Map<String, Object>> _track(Map<String, dynamic> args) async {
    final enable = args['enable'] == true;
    if (!enable) {
      _tracking = false;
      _pipeline.reset();
    }
    if (!_available) {
      return <String, Object>{
        'available': false,
        'tracking': false,
        'reason': _reason,
      };
    }
    try {
      final result = await _channel.invokeMethod<dynamic>(
        'track',
        <String, dynamic>{'enable': enable},
      );
      final map = result is Map
          ? result.cast<String, dynamic>()
          : const <String, dynamic>{};
      final available = map['available'] == true;
      final tracking = map['tracking'] == true && available;
      _tracking = enable && tracking;
      if (!_tracking) _pipeline.reset();
      _diag('track enable=$enable tracking=$_tracking');
      return <String, Object>{
        'available': available,
        'tracking': _tracking,
        if (!available && map['reason'] is String)
          'reason': map['reason'] as String,
      };
    } on MissingPluginException {
      // Older host build without the tracking lane: keep the static face.
      _tracking = false;
      return <String, Object>{
        'available': true,
        'tracking': false,
        'reason': 'tracking lane unavailable on this host',
      };
    } on PlatformException catch (error) {
      _tracking = false;
      return <String, Object>{
        'available': false,
        'tracking': false,
        'reason': error.message ?? error.code,
      };
    }
  }

  /// Adds the smoothed face signals to a camera.frame response (only while
  /// tracking is live — the response bytes stay identical otherwise).
  Map<String, Object> _attachSignals(Map<String, Object> response) {
    if (_tracking && _pipeline.hasSignals) {
      response['shapes'] = _pipeline.shapes;
      response['lookX'] = _pipeline.lookX;
      response['lookY'] = _pipeline.lookY;
    }
    return response;
  }

  Future<Map<String, Object>> _frameCall(Map<String, dynamic> args) async {
    if (!_available) {
      return <String, Object>{
        'available': false,
        'changed': false,
        'seq': _lastDeliveredSeq,
        if (_reason.isNotEmpty) 'reason': _reason,
      };
    }
    final requestedSeq = (args['seq'] as num?)?.toInt() ?? -1;
    final frame = _frame;
    // {changed,seq} short-circuit: a pull for a frame already delivered —
    // or before any frame arrived — skips the base64 copy entirely, so a
    // paused capture never spins decode work in the widget. Face signals
    // stay live even on short-circuits (the smoothed map is tiny and the
    // face may still be mid-expression while the camera pause frame sits).
    if (frame == null || _seq <= requestedSeq) {
      return _attachSignals(<String, Object>{
        'available': true,
        'changed': false,
        'seq': _seq,
      });
    }
    _lastDeliveredSeq = _seq;
    _diag('serve seq=$_seq ${_width}x$_height');
    return _attachSignals(<String, Object>{
      'available': true,
      'changed': true,
      'seq': _seq,
      'width': _width,
      'height': _height,
      'format': 'rgba',
      'data': base64Encode(frame),
    });
  }

  Future<Map<String, Object>> _stop() async {
    if (_sessionRequested) {
      try {
        await _channel.invokeMethod<dynamic>('stop');
      } on MissingPluginException {
        // Host already gone (app teardown) — nothing to release.
      }
      _sessionRequested = false;
    }
    _available = false;
    _frame = null;
    _seq = -1;
    _lastDeliveredSeq = -1;
    _tracking = false;
    _pipeline.reset();
    return <String, Object>{'available': false, 'reason': 'stopped'};
  }
}

// ── Approximate face-signal mapping (Vision landmarks → Face Cap shapes) ────
//
// Scope note (deliberate, not a bug): these are APPROXIMATE blendshape
// signals derived from Apple Vision 2D face landmarks, not MediaPipe-grade
// ARKit-52 scores. The mapper is index-free — it uses bounding boxes,
// centroids and x-extreme points of the named Vision regions — so it cannot
// drift with Vision's canonical point ordering. Expect rough mimicry: good
// for jaw/brows/blinks and coarse mouth work, wrong for subtle lip rolls.

/// Landmark geometry keys shipped by the Swift host (MainFlutterWindow.swift
/// `compactLandmarks`), each a flat `[x0, y0, x1, y1, ...]` list of face-box
/// normalized points (0..1, origin bottom-left, y up, x toward the image's
/// right = the subject's left on the un-mirrored front camera).
const Set<String> kFaceLandmarkKeys = {
  'le', 're', // subject-left / subject-right eye contour (8 pts each)
  'lp', 'rp', // pupils
  'lb', 'rb', // eyebrows
  'ol', 'il', // outer / inner lip contours
  'fc', // face contour
  'nc', 'no', // nose crest / nose tip region
};

/// Emitted shape names (official Face Cap morphTargetDictionary values, the
/// same names the official module maps through its blendshapesMap). Capped
/// well below the 20-shapes-per-payload quota.
const int kFaceShapeQuota = 20;

final class FaceSignals {
  const FaceSignals(this.shapes, this.lookX, this.lookY);

  /// Approximate blendshape scores, each already clamped to 0..1.
  final Map<String, double> shapes;

  /// Official eye-look sums, averaged per axis, in -1..1. The widget's JS
  /// multiplies them by the official 30° rotation limit.
  final double lookX;
  final double lookY;
}

/// Normalized bounding box (min/max are inclusive coordinate bounds).
final class _Box {
  _Box(this.minX, this.minY, this.maxX, this.maxY);
  final double minX, minY, maxX, maxY;
  double get width => maxX - minX;
  double get height => maxY - minY;
  double get centerX => (minX + maxX) / 2;
  double get centerY => (minY + maxY) / 2;
}

_Box _bbox(List<double> points) {
  var minX = double.infinity, minY = double.infinity;
  var maxX = double.negativeInfinity, maxY = double.negativeInfinity;
  for (var i = 0; i + 1 < points.length; i += 2) {
    final x = points[i], y = points[i + 1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return _Box(minX, minY, maxX, maxY);
}

List<double> _centroid(List<double> points) {
  var sx = 0.0, sy = 0.0, n = 0;
  for (var i = 0; i + 1 < points.length; i += 2) {
    sx += points[i];
    sy += points[i + 1];
    n++;
  }
  if (n == 0) return const [0.0, 0.0];
  return [sx / n, sy / n];
}

/// First point whose x is the minimum (or maximum) in [points] — the mouth
/// corners and brow tails without depending on Vision point ordering.
List<double> _pointAtExtremeX(List<double> points, {required bool min}) {
  var best = const [0.0, 0.0];
  var bestX = min ? double.infinity : double.negativeInfinity;
  for (var i = 0; i + 1 < points.length; i += 2) {
    final x = points[i];
    if (min ? x < bestX : x > bestX) {
      bestX = x;
      best = [x, points[i + 1]];
    }
  }
  return best;
}

List<double> _pointClosestToX(List<double> points, double targetX) {
  var best = const [0.0, 0.0];
  var bestDistance = double.infinity;
  for (var i = 0; i + 1 < points.length; i += 2) {
    final distance = (points[i] - targetX).abs();
    if (distance < bestDistance) {
      bestDistance = distance;
      best = [points[i], points[i + 1]];
    }
  }
  return best;
}

double _clamp01(double value) =>
    value.isNaN ? 0 : math.max(0, math.min(1, value));

double _clamp1(double value) =>
    value.isNaN ? 0 : math.max(-1, math.min(1, value));

/// Converts the Swift landmark payload into approximate Face Cap shape
/// scores plus the official-style eye-look sums. Returns null when the
/// payload carries no usable geometry (no face, or a face without the eye
/// + contour regions the ratios need). Calibration constants below are
/// eyeballed for the Face Cap model at a typical webcam distance — the
/// fixture tests pin the formulas, live captures pin the plausibility.
FaceSignals? faceSignalsFromLandmarks(Map<String, List<double>> lm) {
  final contour = lm['fc'];
  if (contour == null || contour.length < 6) return null;
  final face = _bbox(contour);
  final faceH = face.height;
  final faceW = face.width;
  if (faceH <= 1e-6 || faceW <= 1e-6) return null;

  final shapes = <String, double>{};

  // Mouth: opening = inner-lip box height vs face height; corners = the
  // outer-lip points at the x extremes (smiling raises them, frowning
  // drops them relative to the inner-lip centre).
  final outer = lm['ol'];
  final inner = lm['il'];
  // Vision region point counts vary by macOS version (6–14 for lips/eyes),
  // so every guard is a minimal-4 check, never an exact-count check.
  if (outer != null &&
      outer.length >= 4 &&
      inner != null &&
      inner.length >= 4) {
    final mouth = _bbox(inner);
    final outerBox = _bbox(outer);
    final openRatio = mouth.height / faceH;
    shapes['jawOpen'] = _clamp01((openRatio - 0.03) / 0.27);

    final innerCenterY = mouth.centerY;
    final cornerL = _pointAtExtremeX(outer, min: false); // subject-left
    final cornerR = _pointAtExtremeX(outer, min: true); // subject-right
    final liftL = (cornerL[1] - innerCenterY) / faceH;
    final liftR = (cornerR[1] - innerCenterY) / faceH;
    shapes['mouthSmile_L'] = _clamp01((liftL - 0.005) / 0.05);
    shapes['mouthSmile_R'] = _clamp01((liftR - 0.005) / 0.05);
    shapes['mouthFrown_L'] = _clamp01((-liftL - 0.005) / 0.035);
    shapes['mouthFrown_R'] = _clamp01((-liftR - 0.005) / 0.035);

    // Pucker: mouth width collapses while the lips stay mostly closed.
    final widthRatio = outerBox.width / faceW;
    var pucker = _clamp01((0.28 - widthRatio) / 0.10);
    if (openRatio >= 0.10) pucker *= 0.3;
    shapes['mouthPucker'] = pucker;

    // Cheek puff is nearly invisible in 2D landmarks: weakest proxy of
    // the set — real Vision contours already hit aspect ~1.09 on neutral
    // round faces (measured: 0.87-wide portrait contour), so only aspect
    // ≥ ~1.12 counts as widened while the mouth stays shut. This shape
    // intentionally under-fires rather than puffing on every face.
    var puff = _clamp01((faceW / faceH - 1.12) / 0.06);
    if (openRatio >= 0.08) puff = 0;
    shapes['cheekPuff'] = puff;

    // Nose sneer: the upper-lip top rises toward the nose. Vision's 2D
    // landmarks barely separate the nose wings, so this is emitted
    // symmetrically for both sides.
    final upperLipRatio = (mouth.maxY - innerCenterY) / faceH;
    final sneer = _clamp01((upperLipRatio - 0.05) / 0.045);
    shapes['noseSneer_L'] = sneer;
    shapes['noseSneer_R'] = sneer;
  }

  // Eyes: blink/squint from the eye-box openness; gaze from the pupil
  // offset inside the eye box (fallback to the eye centroid when the pupil
  // region is missing, e.g. fully closed). With variable Vision point
  // counts the eye regions degrade gracefully: without usable eyes the
  // mouth shapes still ship and the gaze stays neutral.
  final le = lm['le'];
  final re = lm['re'];
  final hasEyes = le != null && le.length >= 4 && re != null && re.length >= 4;
  if (!hasEyes) return FaceSignals(shapes, 0, 0);
  final boxL = _bbox(le);
  final boxR = _bbox(re);
  final openL = boxL.height / faceH;
  final openR = boxR.height / faceH;
  const neutralOpen = 0.030;
  final blinkL = _clamp01((neutralOpen * 2 / 3 - openL) / (neutralOpen * 0.55));
  final blinkR = _clamp01((neutralOpen * 2 / 3 - openR) / (neutralOpen * 0.55));
  shapes['eyeBlink_L'] = blinkL;
  shapes['eyeBlink_R'] = blinkR;
  // Squint is a partial closure: it saturates before blink and is damped
  // once the eye is fully shut.
  shapes['eyeSquint_L'] = _clamp01(
    ((neutralOpen * 0.8 - openL) / (neutralOpen * 0.7)) * (1 - 0.5 * blinkL),
  );
  shapes['eyeSquint_R'] = _clamp01(
    ((neutralOpen * 0.8 - openR) / (neutralOpen * 0.7)) * (1 - 0.5 * blinkR),
  );

  // Brows: inner point = closest to the face centre x, outer point = the
  // x extreme of each brow region.
  final eyeL = _centroid(le);
  final eyeR = _centroid(re);
  final lb = lm['lb'];
  final rb = lm['rb'];
  if (lb != null && lb.length >= 4 && rb != null && rb.length >= 4) {
    final faceCx = face.centerX;
    final innerL = _pointClosestToX(lb, faceCx);
    final innerR = _pointClosestToX(rb, faceCx);
    final outerL = _pointAtExtremeX(lb, min: false); // subject-left tail
    final outerR = _pointAtExtremeX(rb, min: true); // subject-right tail
    final innerRatio =
        ((innerL[1] - eyeL[1]) / faceH + (innerR[1] - eyeR[1]) / faceH) / 2;
    shapes['browInnerUp'] = _clamp01((innerRatio - 0.13) / 0.05);
    shapes['browOuterUp_L'] = _clamp01(
      ((outerL[1] - eyeL[1]) / faceH - 0.10) / 0.05,
    );
    shapes['browOuterUp_R'] = _clamp01(
      ((outerR[1] - eyeR[1]) / faceH - 0.10) / 0.05,
    );
  }

  // Official eye-look math (mirrors the official module's four direction
  // sums): derive the eight eyeLook* scores from the pupil offsets and run
  // the same In/Out/Up/Down sums, then average per axis into lookX/lookY.
  // +hx is toward the subject's left; +hy is up. The pupil region falls
  // back to the eye centroid (e.g. a fully closed eye).
  List<double> pupilOf(String key, List<double> eye) =>
      lm[key] != null && lm[key]!.length >= 2
      ? _centroid(lm[key]!)
      : _centroid(eye);

  final hxL = _clamp1(
    (pupilOf('lp', le)[0] - boxL.centerX) / math.max(boxL.width, 1e-6) / 0.45,
  );
  final hxR = _clamp1(
    (pupilOf('rp', re)[0] - boxR.centerX) / math.max(boxR.width, 1e-6) / 0.45,
  );
  final hyL = _clamp1(
    (pupilOf('lp', le)[1] - boxL.centerY) / math.max(boxL.height, 1e-6) / 0.45,
  );
  final hyR = _clamp1(
    (pupilOf('rp', re)[1] - boxR.centerY) / math.max(boxR.height, 1e-6) / 0.45,
  );

  // Official sums: leftHorizontal = In_L − Out_L, rightHorizontal =
  // Out_R − In_R, vertical = Down − Up per eye. With In/Out split at the
  // gaze sign, every sum reduces to the negated normalized gaze.
  final leftHorizontal = _clamp01(-hxL) - _clamp01(hxL);
  final rightHorizontal = _clamp01(-hxR) - _clamp01(hxR);
  final leftVertical = _clamp01(-hyL) - _clamp01(hyL);
  final rightVertical = _clamp01(-hyR) - _clamp01(hyR);
  final lookX = (leftHorizontal + rightHorizontal) / 2;
  final lookY = (leftVertical + rightVertical) / 2;

  return FaceSignals(shapes, lookX, lookY);
}

/// Parses the raw Swift push payload (`landmarks` map of flat num lists)
/// into the typed geometry [faceSignalsFromLandmarks] consumes.
Map<String, List<double>>? parseLandmarks(Object? raw) {
  if (raw is! Map) return null;
  final out = <String, List<double>>{};
  for (final entry in raw.entries) {
    final key = entry.key;
    final value = entry.value;
    if (key is! String || value is! List || value.isEmpty) continue;
    if (!kFaceLandmarkKeys.contains(key)) continue;
    final points = <double>[];
    for (final item in value) {
      if (item is! num) return null; // malformed payload → no signals
      points.add(item.toDouble());
    }
    out[key] = points;
  }
  return out.isEmpty ? null : out;
}

/// Exponential smoother between successive [FaceSignals] targets. The first
/// target after an empty/reset lane is adopted verbatim (tracking enable
/// snaps to the current pose); every later step lerps by [factor]. Dart-side
/// smoothing keeps the served payload stable across Vision's frame-to-frame
/// jitter; the widget's JS applies a second 0.3 lerp on top (official-style
/// approach easing). Served values round to 3 decimals for a compact
/// JSON payload.
final class FaceSignalSmother {
  FaceSignalSmother({this.factor = 0.35, this.maxShapes = kFaceShapeQuota});

  final double factor;
  final int maxShapes;
  final Map<String, double> _shapes = <String, double>{};
  double _lookX = 0;
  double _lookY = 0;

  bool get hasSignals => _shapes.isNotEmpty;
  double get lookX => _round3(_lookX);
  double get lookY => _round3(_lookY);

  Map<String, double> get shapes => {
    for (final entry in _shapes.entries) entry.key: _round3(entry.value),
  };

  void step(FaceSignals target) {
    // Bounded payload: beyond [maxShapes], earlier insertion-order entries
    // win (the mapper emits 16 names, so this is a defensive cap only).
    var accepted = 0;
    for (final entry in target.shapes.entries) {
      if (accepted >= maxShapes) break;
      accepted++;
      final value = _clamp01(entry.value);
      final current = _shapes[entry.key];
      _shapes[entry.key] = current == null
          ? value
          : current + (value - current) * factor;
    }
    _lookX += (_clamp1(target.lookX) - _lookX) * factor;
    _lookY += (_clamp1(target.lookY) - _lookY) * factor;
  }

  void reset() {
    _shapes.clear();
    _lookX = 0;
    _lookY = 0;
  }
}

double _round3(double value) => (value * 1000).roundToDouble() / 1000;

/// Offline camera lane for the capture harness (`JSR_CAMERA_SYNTH=1`).
///
/// Serves synthetic 320x180 RGBA frames at 24fps through the exact same
/// `camera.*` onHostCall contract as [ExampleCameraHost], without
/// AVFoundation or a TCC grant. Frames move every tick (a moving gradient),
/// so a capture run exercises the widget's real pull/base64-decode/texture
/// path end-to-end and two spaced captures still differ — the live-analog
/// proof when the real camera lane is unavailable. The `{changed,seq}`
/// short-circuit behaves identically (unchanged ticks answer `changed:false`).
class SynthCameraHost extends ExampleCameraHost {
  SynthCameraHost();

  static const int width = 320;
  static const int height = 180;
  static const int fps = 24;

  Timer? _synthTicker;
  int _synthSeq = -1;
  bool _synthAvailable = false;
  Uint8List? _synthFrame;

  @override
  Future<Object?> handleCall(String name, Map<String, dynamic> args) async {
    switch (name) {
      case 'camera.start':
        _synthAvailable = true;
        _synthTicker ??= Timer.periodic(
          Duration(milliseconds: 1000 ~/ fps),
          (_) => _advance(),
        );
        _advance();
        return <String, Object>{
          'available': true,
          'width': width,
          'height': height,
        };
      case 'camera.frame':
        final requestedSeq = (args['seq'] as num?)?.toInt() ?? -1;
        if (!_synthAvailable ||
            _synthFrame == null ||
            _synthSeq <= requestedSeq) {
          return <String, Object>{
            'available': true,
            'changed': false,
            'seq': _synthSeq,
          };
        }
        return <String, Object>{
          'available': true,
          'changed': true,
          'seq': _synthSeq,
          'width': width,
          'height': height,
          'format': 'rgba',
          'data': base64Encode(_synthFrame!),
        };
      case 'camera.stop':
        _synthTicker?.cancel();
        _synthTicker = null;
        _synthAvailable = false;
        return <String, Object>{'available': false, 'reason': 'stopped'};
      default:
        throw ArgumentError.value(name, 'name', 'not a camera host call');
    }
  }

  void _advance() {
    _synthSeq += 1;
    final phase = (_synthSeq * 11) & 0xFF;
    final data = _synthFrame ??= Uint8List(width * height * 4);
    for (var i = 0; i < data.length; i += 4) {
      data[i] = (i * 7 + phase) & 0xFF;
      data[i + 1] = (i + phase * 3) & 0xFF;
      data[i + 2] = (i ~/ width + phase * 5) & 0xFF;
      data[i + 3] = 255;
    }
  }
}
