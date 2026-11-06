import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_host.dart';

/// Web placeholder for the native-only factory. The conditional export swaps
/// this for the Flutter GPU implementation on `dart.library.io`.
JsThreeHost createFlutterGpuThreeHost({
  JsThreeAssetLoader? assetLoader,
  String shaderAsset = '',
  bool adaptiveShadowRefresh = true,
}) => throw UnsupportedError('Flutter GPU THREE is available only natively');
