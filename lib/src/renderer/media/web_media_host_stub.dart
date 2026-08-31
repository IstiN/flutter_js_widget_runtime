import 'package:js_widget_runtime/src/renderer/media/js_media_controller.dart';
import 'package:js_widget_runtime/src/renderer/media/js_media_host.dart';

/// Non-web stub: the HTML-element media host only exists on web. Guard
/// call sites with `kIsWeb` (the VM reference host lives in the example
/// app; hosts may back the same interface with media_kit).
JsMediaHost createWebMediaHost() => throw UnsupportedError(
      'createWebMediaHost() is only available on web builds',
    );

/// Placeholder so the stub compiles; never instantiated on non-web.
class WebMediaHost extends JsMediaHost {
  const WebMediaHost();

  @override
  JsVideoController createVideoController(String src) =>
      throw UnimplementedError('web only');

  @override
  JsAudioController createAudioController(String src) =>
      throw UnimplementedError('web only');
}
