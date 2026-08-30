import 'package:flutter/widgets.dart';
import 'package:js_widget_runtime/src/renderer/webview/js_web_view_host.dart';

/// Non-web stub: the iframe-backed host only exists on web. Guard call
/// sites with `kIsWeb` (the VM reference host lives in the example app).
JsWebViewHost createIframeWebViewHost() => throw UnsupportedError(
      'createIframeWebViewHost() is only available on web builds',
    );

/// Placeholder so the stub compiles; never instantiated on non-web.
class IframeWebViewHost extends JsWebViewHost {
  const IframeWebViewHost();

  @override
  Widget buildWebView({
    required String src,
    void Function(String message)? onMessage,
    double? width,
    double? height,
  }) =>
      throw UnimplementedError('web only');
}
