import 'dart:js_interop';
import 'dart:ui_web' as ui_web;

import 'package:flutter/widgets.dart';
import 'package:js_widget_runtime/src/renderer/webview/js_web_view_host.dart';
import 'package:web/web.dart' as web;

/// Untyped view of a `postMessage` payload: `{type: 'jsr', data: ...}`.
extension type _JsMessageData._(JSObject _) implements JSObject {
  external JSAny? get type;
  external JSAny? get data;
}

/// Creates the web implementation of [JsWebViewHost]: an `<iframe>`
/// platform view. Cross-origin pages must allow framing (many sites send
/// `X-Frame-Options: DENY` / CSP `frame-ancestors` — those render blank);
/// messages arrive via `window.postMessage({type: 'jsr', data: '...'}, '*')`.
JsWebViewHost createIframeWebViewHost() => const IframeWebViewHost();

/// Iframe-backed [JsWebViewHost] for Flutter web.
///
/// One platform-view type is registered per host instance; each
/// [buildWebView] call creates a fresh [HtmlElementView] whose iframe
/// navigates to [src]. A `message` listener on the window forwards
/// `{type: 'jsr', data: String}` payloads to [onMessage].
class IframeWebViewHost extends JsWebViewHost {
  const IframeWebViewHost();

  static int _instances = 0;

  @override
  Widget buildWebView({
    required String src,
    void Function(String message)? onMessage,
    double? width,
    double? height,
  }) {
    final viewType = 'jsr-webview-${_instances++}';
    ui_web.platformViewRegistry.registerViewFactory(viewType, (int viewId) {
      final frame = web.document.createElement('iframe')
          as web.HTMLIFrameElement
        ..src = src
        ..style.border = '0'
        ..style.width = '100%'
        ..style.height = '100%';
      return frame;
    });
    if (onMessage != null) {
      web.window.addEventListener(
        'message',
        ((web.MessageEvent event) {
          final data = event.data;
          if (data == null || !data.isA<JSObject>()) return;
          final msg = _JsMessageData._(data as JSObject);
          if (msg.type?.dartify() != 'jsr') return;
          final payload = msg.data?.dartify();
          if (payload != null) onMessage(payload.toString());
        }).toJS,
      );
    }
    return SizedBox(
      width: width,
      height: height,
      child: HtmlElementView(viewType: viewType),
    );
  }
}
