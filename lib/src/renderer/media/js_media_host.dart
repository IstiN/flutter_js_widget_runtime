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
}
