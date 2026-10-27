import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_host.dart';

/// Native placeholder for the Web-only factory. The conditional export swaps
/// this for the real HtmlElementView host on `dart.library.js_interop`.
JsThreeHost createWebThreeHost({
  JsThreeAssetLoader? assetLoader,
  bool diagnosticsEnabled = false,
}) => throw UnsupportedError('Web THREE is available only in browser builds');
