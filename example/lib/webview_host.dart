import 'package:flutter/widgets.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

/// VM implementation of [JsWebViewHost] for the demo app, backed by
/// `flutter_inappwebview` (iOS / Android / macOS; Linux and Windows fall
/// back to the renderer's placeholder — the plugin has no support there).
///
/// JS bridge: the embedded page calls
/// `window.flutter_inappwebview.callHandler('jsr', 'message')`; the string
/// is forwarded to the widget's `onMessage` event. On web builds use the
/// core `createIframeWebViewHost()` instead.
class ExampleWebViewHost extends JsWebViewHost {
  const ExampleWebViewHost();

  @override
  Widget buildWebView({
    required String src,
    void Function(String message)? onMessage,
    double? width,
    double? height,
  }) {
    return SizedBox(
      width: width,
      height: height,
      child: InAppWebView(
        initialUrlRequest: URLRequest(url: WebUri(src)),
        initialSettings: InAppWebViewSettings(
          javaScriptEnabled: onMessage != null,
          isInspectable: false,
        ),
        onWebViewCreated: (controller) {
          if (onMessage == null) return;
          controller.addJavaScriptHandler(
            handlerName: 'jsr',
            callback: (args) {
              if (args.isNotEmpty && args.first != null) {
                onMessage(args.first.toString());
              }
            },
          );
        },
      ),
    );
  }
}
