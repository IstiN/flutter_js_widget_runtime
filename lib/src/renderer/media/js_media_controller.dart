import 'dart:async';

import 'package:flutter/widgets.dart';

/// Base controller for media playback used by the renderer's `video` and
/// `audio` nodes.
///
/// Hosts provide concrete implementations (e.g. backed by `media_kit` or
/// `video_player`) via [JsMediaHost]. The renderer only depends on this
/// interface, so the core package stays free of heavy native media
/// dependencies.
abstract class JsMediaController {
  /// Disposes the controller and releases native resources.
  Future<void> dispose();

  /// Current playback position.
  Stream<Duration> get positionStream;

  /// Total media duration.
  Stream<Duration> get durationStream;

  /// Whether the media is currently playing.
  Stream<bool> get playingStream;

  /// Starts or resumes playback.
  Future<void> play();

  /// Pauses playback.
  Future<void> pause();

  /// Seeks to [position].
  Future<void> seek(Duration position);
}

/// Controller for video nodes.
abstract class JsVideoController extends JsMediaController {
  /// Optional aspect ratio of the video stream.
  double? get aspectRatio;

  /// Stream of aspect ratio updates.
  Stream<double?> get aspectRatioStream;

  /// Builds the actual video surface widget.
  ///
  /// The host implementation returns the platform-specific player surface
  /// (e.g. `media_kit` [Video] widget).
  Widget buildVideo(
    BuildContext context, {
    BoxFit fit = BoxFit.contain,
    double? width,
    double? height,
  });
}

/// Controller for audio nodes.
abstract class JsAudioController extends JsMediaController {}
