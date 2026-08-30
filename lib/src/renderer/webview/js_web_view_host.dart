import 'package:flutter/widgets.dart';

/// Factory provided by the host to embed web content for `webView` nodes.
///
/// The core package ships no webview plugin by design (like media): hosts
/// pick their own stack (`flutter_inappwebview`, `webview_flutter`, …) and
/// implement this interface. On web the package provides a ready-made
/// iframe-backed implementation, see `createIframeWebViewHost()`.
///
/// If a host does not provide a [JsWebViewHost], the renderer falls back to
/// a placeholder for `webView` nodes.
abstract class JsWebViewHost {
  const JsWebViewHost();

  /// Builds the web view surface for [src].
  ///
  /// - [onMessage]: pages can post a string message to the widget; the host
  ///   forwards it here. On VM the reference host exposes
  ///   `window.flutter_inappwebview.callHandler('jsr', message)`; the web
  ///   iframe host listens for `window.postMessage` events carrying
  ///   `{type: 'jsr', data: <string>}`.
  /// - [width] / [height]: optional explicit size from the node.
  Widget buildWebView({
    required String src,
    void Function(String message)? onMessage,
    double? width,
    double? height,
  });
}
