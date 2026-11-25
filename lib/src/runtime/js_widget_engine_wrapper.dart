import 'dart:convert';

import 'package:flutter/foundation.dart';

import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/model/js_three_backend.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_voxel_node.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_host.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_backend.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_default.dart'
    if (dart.library.js_interop) 'package:js_widget_runtime/src/runtime/js_widget_engine_default_web.dart';
import 'package:js_widget_runtime/src/runtime/three_backend_selection.dart';
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
    final backend =
        effective.backend ??
        effective.backendFactory?.call(effective) ??
        _defaultBackend(effective);
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
    // 1B selection ladder (ADR-0003): probes run only when a THREE runtime
    // actually starts, so widgets without THREE never touch ANGLE.
    final threeWanted = _config.threeEnabled || _config.threeSource != null;
    final selection = threeWanted
        ? selectThreeBackend(config: _config, backend: _backend)
        : JsThreeBackendSelection(
            requested: _config.threeBackend,
            selected: JsThreeBackend.r1,
          );
    if (threeWanted) {
      _config.onThreeBackendSelected?.call(selection);
      _backend.prepareThreeBackend(selection);
    }
    final bootstrap = await _effectiveBootstrap(selection);
    return _backend.run(
      widgetJs,
      hostBootstrapJs: bootstrap,
      initialTheme: _config.initialTheme,
    );
  }

  /// Builds the JS evaluated before the widget code. THREE is loaded only
  /// when explicitly enabled, before host shims and the prepared widget.
  /// On the angle1b backend the web bundle is used on every platform and
  /// the 1B facade bootstrap plus the shader policy follow the bundle.
  Future<String> _effectiveBootstrap(JsThreeBackendSelection selection) async {
    final id = instanceId;
    final angle1b = selection.isAngle1b;
    final buffer = StringBuffer(
      'jsr.instanceId = ${jsonEncode(id)}; __IID = jsr.instanceId;'
      'var __JSR_THREE_NATIVE__ = ${!kIsWeb && !angle1b && _config.threeHost != null ? 1 : 0};'
      'var __JSR_THREE_WEB__ = ${kIsWeb || angle1b ? (_config.threeHost != null ? 1 : 0) : 0};',
    );
    if (_config.threeEnabled || _config.threeSource != null) {
      final source = await ThreeUpstreamBundle.load(
        web: kIsWeb || angle1b,
        overrideSource: _config.threeSource,
      );
      buffer.write(
        '\n$source\nif (typeof THREE !== "undefined") '
        '{ globalThis.THREE = THREE; }\n',
      );
      if (angle1b) {
        final wire = _config.threeHost! as JsThree1BWire;
        await wire.ensureFacadeBootstrap();
        buffer
          ..write('\n${wire.facadeBootstrapJs}\n')
          ..write(
            '\n${three1bPolicyJs(allowCustomShaders: _config.allowCustomShaders)}\n',
          );
      }
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

  /// Releases the backend, then the media host.
  ///
  /// Execution has already stopped when the host is released (backend dispose
  /// completes first), so a late worker host call can never resurrect a
  /// player on a released host. The hook fires on every engine dispose —
  /// widget switch and page close — and hosts must guard internally against
  /// the framework's double-dispose.
  Future<void> dispose() async {
    await _backend.dispose();
    final mediaHost = _config.mediaHost;
    if (mediaHost != null) await mediaHost.dispose();
  }

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
