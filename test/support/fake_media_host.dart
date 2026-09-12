import 'dart:async';

import 'package:flutter/material.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

/// Reusable fake video controller for renderer-level media tests: records
/// the applied `fit` per build and exposes a manual error sink so tests can
/// emulate host playback failures.
class FakeVideoController extends JsVideoController {
  FakeVideoController({this.aspect = 16 / 9});

  final double aspect;
  final List<BoxFit> appliedFits = <BoxFit>[];
  final StreamController<Object?> errors = StreamController<Object?>.broadcast();
  final StreamController<Duration> _position =
      StreamController<Duration>.broadcast();
  final StreamController<Duration> _duration =
      StreamController<Duration>.broadcast();
  final StreamController<bool> _playing = StreamController<bool>.broadcast();

  @override
  double? get aspectRatio => aspect;

  @override
  Stream<double?> get aspectRatioStream => Stream<double?>.empty();

  @override
  Stream<Duration> get positionStream => _position.stream;

  @override
  Stream<Duration> get durationStream => _duration.stream;

  @override
  Stream<bool> get playingStream => _playing.stream;

  @override
  Stream<Object?>? get errorStream => errors.stream;

  @override
  Future<void> play() async {}

  @override
  Future<void> pause() async {}

  @override
  Future<void> seek(Duration position) async {}

  @override
  Widget buildVideo(
    BuildContext context, {
    BoxFit fit = BoxFit.contain,
    double? width,
    double? height,
  }) {
    appliedFits.add(fit);
    return FittedBox(
      key: const ValueKey('jsr-test-video-surface'),
      fit: fit,
      child: const SizedBox(width: 800, height: 450),
    );
  }

  @override
  Future<void> dispose() async {
    await _position.close();
    await _duration.close();
    await _playing.close();
    await errors.close();
  }
}

/// Host serving a single pre-built [FakeVideoController].
class FakeMediaHost extends JsMediaHost {
  FakeMediaHost({JsVideoController? controller})
      : _controller = controller ?? FakeVideoController();

  final JsVideoController _controller;

  FakeVideoController get video => _controller as FakeVideoController;

  @override
  JsVideoController createVideoController(String src) => _controller;

  @override
  JsAudioController createAudioController(String src) =>
      throw UnimplementedError();
}

/// Host whose controller creation fails synchronously — the worst case the
/// renderer's `onError` path must survive.
class ThrowingMediaHost extends JsMediaHost {
  @override
  JsVideoController createVideoController(String src) =>
      throw StateError('no codec for source');

  @override
  JsAudioController createAudioController(String src) =>
      throw UnimplementedError();
}
