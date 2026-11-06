import 'package:js_widget_runtime/src/renderer/media/js_media_controller.dart';

/// Factory provided by the host to create concrete media controllers for
/// `video` and `audio` nodes.
///
/// If a host does not provide a [JsMediaHost], the renderer falls back to
/// placeholder icons for `video`/`audio` nodes.
abstract class JsMediaHost {
  const JsMediaHost();

  /// Creates a video controller for [src].
  JsVideoController createVideoController(String src);

  /// Creates an audio controller for [src].
  JsAudioController createAudioController(String src);

  /// Releases any long-lived media resources the host handed out.
  ///
  /// Called by the engine AFTER execution has stopped — from
  /// `JsWidgetEngine.dispose()`, which runs on widget switch (engine
  /// replacement) and page close. The renderer's media widgets already
  /// dispose their per-node controllers on unmount; this hook covers hosts
  /// that keep shared/cached players alive across widgets, and is the
  /// guaranteed engine-level release point for the audio lane.
  ///
  /// Concrete no-op default so existing hosts stay source-compatible.
  /// Implementations must be idempotent (dispose is fire-and-forget from
  /// the framework and may run more than once per host generation).
  Future<void> dispose() async {}
}
