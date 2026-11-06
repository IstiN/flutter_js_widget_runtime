import 'dart:async';
import 'dart:typed_data';

import 'package:js_widget_runtime/src/renderer/nodes/js_voxel_node.dart';

/// Raw bytes for one pre-warmed widget asset, keyed by asset url in
/// `JsRuntimeConfig.assetWarmProvider`. Carries the same payload the
/// per-request asset lane serves, shipped once before widget evaluation so
/// loaders (GLTF texture fan-out) fill from the JS heap instead of a host
/// round trip per texture.
class JsWarmAsset {
  const JsWarmAsset({
    required this.bytes,
    this.mimeType = 'application/octet-stream',
    this.width = 0,
    this.height = 0,
  });

  final Uint8List bytes;
  final String mimeType;
  final int width;
  final int height;
}

/// Abstract backend for the JS widget engine.
///
/// Implementations can use any JavaScript execution technology:
/// `flutter_js`, a custom QuickJS FFI wrapper, a Web Worker, a WebView, etc.
/// The renderer and bridge logic live outside the backend, so hosts can plug
/// in the engine that fits their platform or performance requirements.
abstract class JsWidgetEngineBackend {
  /// Binds the backend and its bridge to the wrapper-generated engine id.
  /// Custom backends without named THREE resources may keep this no-op.
  void setEngineInstanceId(String instanceId) {}

  /// Initializes the backend (loads libraries, creates contexts, etc.).
  Future<void> init();

  /// Runs a widget's JavaScript code.
  ///
  /// [widgetJs] is the widget source. [hostBootstrapJs] is evaluated before
  /// the widget code so hosts can inject platform APIs. [initialTheme] is the
  /// starting theme map.
  Future<void> run(
    String widgetJs, {
    String? hostBootstrapJs,
    Map<String, dynamic> initialTheme = const {},
  });

  /// Dispatches an event to the widget's `handleEvent(actionId, payload)`.
  Future<void> callEvent(String actionId, Map<String, dynamic>? payload);

  /// Delivers a fire-and-forget host-originated event to JS listeners
  /// registered via bootstrap APIs (e.g. `jsr.onKey`, `jsr.scene3d.onTap`).
  ///
  /// [target] identifies the listener set: `'key'` for `jsr.onKey`, or
  /// `'scene3d.tap:<sceneId>'` for `jsr.scene3d.onTap`. Unlike [callEvent]
  /// there is no completion round trip. The default implementation is a no-op
  /// so custom backends stay source-compatible.
  void dispatchHostEvent(String target, Map<String, dynamic> payload) {}

  /// Pushes an updated theme into the running JS context.
  void updateTheme(Map<String, dynamic> colors);

  /// Releases all resources held by the backend.
  Future<void> dispose();

  /// Returns and clears the accumulated console log buffer.
  List<Map<String, dynamic>> flushLogs();

  /// Returns a copy of the console log buffer without clearing it.
  List<Map<String, dynamic>> peekLogs();

  /// Last structured state exported via `jsr.exportState(...)`.
  Map<String, dynamic>? get exportedState;

  /// Voxel world state behind `jsr.hostCall('voxel.*')` and `voxel` nodes.
  /// Bridge-owned; default null so minimal custom backends stay
  /// source-compatible (those widgets render their placeholder).
  JsVoxelWorld? get voxelWorld => null;
}
