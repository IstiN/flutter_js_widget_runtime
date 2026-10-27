import 'dart:convert';

import 'package:flutter/foundation.dart';

import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_voxel_node.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_backend.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_default.dart'
    if (dart.library.js_interop) 'package:js_widget_runtime/src/runtime/js_widget_engine_default_web.dart';
import 'package:js_widget_runtime/src/runtime/three_upstream_bundle.dart';

int _instanceCounter = 0;

/// Entry point for running a JS widget.
///
/// [JsWidgetEngine] delegates to a [JsWidgetEngineBackend]. By default it
/// chooses `flutter_js` on VM platforms and a Web Worker on the web. Hosts
/// can override the backend via [JsRuntimeConfig.backend], allowing them to
/// plug in a custom engine such as a QuickJS FFI wrapper.
class JsWidgetEngine {
  /// Creates an engine.
  ///
  /// If [config.backend] is set, it is used directly. Otherwise the platform
  /// default backend is created.
  factory JsWidgetEngine({required JsRuntimeConfig config}) {
    final id = config.instanceId ?? 'i${_instanceCounter++}';
    final effective = config.copyWith(instanceId: id);
    final backend = effective.backend ?? _defaultBackend(effective);
    backend.setEngineInstanceId(id);
    return JsWidgetEngine._(effective, backend);
  }

  JsWidgetEngine._(this._config, this._backend);

  final JsRuntimeConfig _config;
  final JsWidgetEngineBackend _backend;

  /// Stable identity used by render trees and named THREE resources.
  String get instanceId => _config.instanceId!;

  /// Initializes the backend.
  Future<void> init() => _backend.init();

  /// Runs the widget JavaScript.
  Future<void> run(String widgetJs) async {
    final bootstrap = await _effectiveBootstrap();
    return _backend.run(
      widgetJs,
      hostBootstrapJs: bootstrap,
      initialTheme: _config.initialTheme,
    );
  }

  /// Builds the JS evaluated before the widget code. THREE is loaded only
  /// when explicitly enabled, before host shims and the prepared widget.
  Future<String> _effectiveBootstrap() async {
    final id = instanceId;
    final buffer = StringBuffer(
      'jsr.instanceId = ${jsonEncode(id)}; __IID = jsr.instanceId;'
      'var __JSR_THREE_NATIVE__ = ${!kIsWeb && _config.threeHost != null ? 1 : 0};'
      'var __JSR_THREE_WEB__ = ${kIsWeb && _config.threeHost != null ? 1 : 0};',
    );
    if (_config.threeEnabled || _config.threeSource != null) {
      final source = await ThreeUpstreamBundle.load(
        web: kIsWeb,
        overrideSource: _config.threeSource,
      );
      buffer.write(
        '\n$source\nif (typeof THREE !== "undefined") '
        '{ globalThis.THREE = THREE; }\n',
      );
    }
    final host = _config.hostBootstrapJs;
    if (host != null) buffer.write('\n$host');
    return buffer.toString();
  }

  /// Dispatches an event to the widget's `handleEvent` function.
  Future<void> callEvent(String actionId, [Map<String, dynamic>? payload]) =>
      _backend.callEvent(actionId, payload);

  /// Delivers a fire-and-forget host event (keyboard, scene3d tap) to the
  /// widget's bootstrap listeners. See [JsWidgetEngineBackend.dispatchHostEvent].
  void dispatchHostEvent(String target, Map<String, dynamic> payload) =>
      _backend.dispatchHostEvent(target, payload);

  /// Pushes a theme update into the running JS context.
  void updateTheme(Map<String, dynamic> colors) => _backend.updateTheme(colors);

  /// Releases the backend.
  Future<void> dispose() => _backend.dispose();

  /// Returns and clears the console log buffer.
  List<Map<String, dynamic>> flushLogs() => _backend.flushLogs();

  /// Returns a copy of the console log buffer.
  List<Map<String, dynamic>> peekLogs() => _backend.peekLogs();

  /// Last structured state exported via `jsr.exportState(...)`.
  Map<String, dynamic>? get exportedState => _backend.exportedState;

  /// Voxel world state behind `jsr.hostCall('voxel.*')` and `voxel`
  /// nodes; null on minimal custom backends.
  JsVoxelWorld? get voxelWorld => _backend.voxelWorld;
}

JsWidgetEngineBackend _defaultBackend(JsRuntimeConfig config) {
  // The conditional import above resolves to FlutterJsWidgetEngineBackend on
  // VM platforms and WebWorkerJsWidgetEngineBackend on the web.
  return createDefaultJsWidgetEngineBackend(config);
}
