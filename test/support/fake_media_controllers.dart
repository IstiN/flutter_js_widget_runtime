import 'dart:async';

import 'package:flutter/material.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

/// Shared audio controller fake: records every method call and exposes
/// broadcast streams so listener-driven code can be exercised.
class RecordingAudioController extends JsAudioController {
  RecordingAudioController(this.src);

  final String src;
  final List<String> calls = <String>[];

  final positionCtl = StreamController<Duration>.broadcast();
  final durationCtl = StreamController<Duration>.broadcast();
  final playingCtl = StreamController<bool>.broadcast();

  @override
  Stream<Duration> get positionStream => positionCtl.stream;

  @override
  Stream<Duration> get durationStream => durationCtl.stream;

  @override
  Stream<bool> get playingStream => playingCtl.stream;

  @override
  Future<void> play() async => calls.add('play');

  @override
  Future<void> pause() async => calls.add('pause');

  @override
  Future<void> seek(Duration position) async =>
      calls.add('seek:${position.inMilliseconds}');

  @override
  Future<void> setVolume(double volume) async => calls.add('volume:$volume');

  @override
  Future<void> setLoop(bool loop) async => calls.add('loop:$loop');

  @override
  Future<void> dispose() async => calls.add('dispose');
}

/// Inert video controller for hosts that must satisfy the full interface.
class FakeVideoController extends JsVideoController {
  @override
  double? get aspectRatio => null;

  @override
  Stream<double?> get aspectRatioStream => const Stream.empty();

  @override
  Stream<Duration> get positionStream => const Stream.empty();

  @override
  Stream<Duration> get durationStream => const Stream.empty();

  @override
  Stream<bool> get playingStream => const Stream.empty();

  @override
  Future<void> play() async {}

  @override
  Future<void> pause() async {}

  @override
  Future<void> seek(Duration position) async {}

  @override
  Future<void> dispose() async {}

  @override
  Widget buildVideo(
    BuildContext context, {
    BoxFit fit = BoxFit.contain,
    double? width,
    double? height,
  }) =>
      const SizedBox.shrink();
}

/// Media host recording every audio controller it creates.
class RecordingMediaHost extends JsMediaHost {
  final List<RecordingAudioController> audioControllers =
      <RecordingAudioController>[];

  @override
  JsVideoController createVideoController(String src) => FakeVideoController();

  @override
  JsAudioController createAudioController(String src) {
    final controller = RecordingAudioController(src);
    audioControllers.add(controller);
    return controller;
  }
}
