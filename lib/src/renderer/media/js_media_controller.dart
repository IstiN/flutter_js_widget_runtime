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

  /// Sets the playback volume in the range `0.0`–`1.0`.
  ///
  /// Concrete no-op default so existing hosts stay source-compatible;
  /// hosts that support volume control override this.
  Future<void> setVolume(double volume) async {}

  /// Enables or disables looping playback.
  ///
  /// Concrete no-op default so existing hosts stay source-compatible;
  /// hosts that support looping override this.
  Future<void> setLoop(bool loop) async {}

  /// Optional stream of terminal playback errors (init failures, network
  /// drops, codec problems). The renderer's media widgets subscribe and
  /// re-publish messages to the node's `onError` event when configured —
  /// without this the failure is a silent black box.
  ///
  /// Concrete null default so existing hosts stay source-compatible; hosts
  /// that can observe errors override this (video_player:
  /// `value.errorDescription`; web: the element `error` event).
  Stream<Object?>? get errorStream => null;
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
