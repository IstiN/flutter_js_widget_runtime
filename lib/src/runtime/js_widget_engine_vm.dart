import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_js/flutter_js.dart';

import 'package:js_widget_runtime/src/defaults/vm_default_handlers.dart';
import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bootstrap.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bridge.dart';

/// Headless JS widget engine backed by `flutter_js` (QuickJS / JavascriptCore).
///
/// Runs a widget's JS code and exposes the `jsr.*` API surface. All I/O is
/// injected via [JsRuntimeConfig] so the host controls permissions and
/// implementations.
class JsWidgetEngine {
  JsWidgetEngine({
    required JsRuntimeConfig config,
  }) : _config = config {
    _bridge = JsWidgetBridge(
      widgetId: config.widgetId,
      onRender: config.onRender,
      onSetTitle: config.onSetTitle,
      onStorageUpdate: config.onStorageUpdate,
      onLog: (msg) => _handleLog(msg),
      isDisposed: () => _disposed,
      appDir: config.appDir,
      isPermissionAllowed: config.isPermissionAllowed ?? _allowAll,
      resolveCallback: (id, value) async {},
      fetchHandler: (id, url, method, headers) async {},
      secretsGetHandler: (id, key) async {},
      secretsSetHandler: (id, key, value) async {},
      loadAssetHandler: (id, path) async {},
      execHandler: (id, cmd) async {},
      intervalTickHandler: (id) {},
      rafTickHandler: (id, elapsedMs) {},
      initialStorage: config.initialStorage,
    );
  }

  static bool _allowAll(String _) => true;

  final JsRuntimeConfig _config;
  late final JsWidgetBridge _bridge;
  JavascriptRuntime? _runtime;
  bool _disposed = false;
  final List<Map<String, dynamic>> _consoleLogs = [];
  static const int _maxLogs = 200;

  /// Return and clear the accumulated console.log buffer.
  List<Map<String, dynamic>> flushLogs() {
    final logs = List<Map<String, dynamic>>.from(_consoleLogs);
    _consoleLogs.clear();
    return logs;
  }

  /// Return a copy of the console.log buffer without clearing it.
  List<Map<String, dynamic>> peekLogs() =>
      List<Map<String, dynamic>>.from(_consoleLogs);

  /// Last structured state exported via `jsr.exportState(...)`.
  Map<String, dynamic>? get exportedState => _bridge.exportedState;

  /// Push updated theme colors into the running JS widget.
  void updateTheme(Map<String, dynamic> colors) {
    final rt = _runtime;
    if (rt == null || _disposed) return;
    try {
      rt.evaluate(JsWidgetBridge.updateThemeJs(colors));
      rt.executePendingJob();
    } catch (e) {
      debugPrint('[JsWidgetEngine] updateTheme error: $e');
    }
  }

  Future<void> run(String widgetJs) async {
    await dispose();
    _disposed = false;
    _consoleLogs.clear();

    try {
      // Always use getJavascriptRuntime. The host's flutter_js patch (if any)
      // handles multi-instance isolation.
      final runtime = getJavascriptRuntime();
      runtime.enableHandlePromises();
      _runtime = runtime;
      debugPrint('[JsWidgetEngine] starting ${runtime.runtimeType}');
      _setupBridges(runtime);

      final bootstrapResult = runtime.evaluate(kJsWidgetBootstrap);
      if (bootstrapResult.isError) {
        debugPrint('[JsWidgetEngine] bootstrap error: ${bootstrapResult.stringResult}');
      }
      updateTheme(_config.initialTheme);

      final hostBootstrap = _config.hostBootstrapJs ?? '';
      final code = '''
(function() {
  try {
    $hostBootstrap
    $widgetJs
  } catch(e) {
    jsr.showError('Widget error: ' + (e.message || String(e)));
  }
})();
''';
      debugPrint('[JsWidgetEngine] evaluating widget code...');
      final result = runtime.evaluate(code);
      if (result.isError) {
        debugPrint('[JsWidgetEngine] widget eval error: ${result.stringResult}');
      }
      runtime.executePendingJob();
      debugPrint('[JsWidgetEngine] widget code done, uiTree set: $_disposed');
    } catch (e) {
      debugPrint('[JsWidgetEngine] startup error: $e');
      rethrow;
    }
  }

  /// Call the JS `handleEvent(actionId, payload)` function.
  Future<void> callEvent(
    String actionId, [
    Map<String, dynamic>? payload,
  ]) async {
    final rt = _runtime;
    if (rt == null || _disposed) return;
    final encodedAction = jsonEncode(actionId);
    final encodedPayload = jsonEncode(payload ?? {});
    await _bridge.callEvent(() {
      rt.evaluate(
        '(function(){'
        'var __h=jsr._handler||(typeof handleEvent==="function"?handleEvent:null);'
        'if(!__h){sendMessage("__jsr_event_done","{}");return;}'
        'try{'
        'var __r=__h($encodedAction,$encodedPayload);'
        'if(__r&&typeof __r.then==="function"){'
        '__r.then(function(){sendMessage("__jsr_event_done","{}");},'
        'function(e){sendMessage("__jsr_event_done",JSON.stringify({error:e.message||String(e)}));});'
        '}else{sendMessage("__jsr_event_done","{}");}'
        '}catch(e){sendMessage("__jsr_event_done",JSON.stringify({error:e.message||String(e)}));}'
        '})();',
      );
      rt.executePendingJob();
    });
  }

  Future<void> dispose() async {
    _disposed = true;
    _bridge.dispose();
    _runtime?.dispose();
    _runtime = null;
  }

  // ── Private ──────────────────────────────────────────────────────────────

  void _setupBridges(JavascriptRuntime rt) {
    _bridge.resolveCallback = _config.resolveCallback ??
        (id, value) => _resolveCallback(rt, id, value);
    _config.onResolveReady?.call(_bridge.resolveCallback);
    _bridge.fetchHandler = (id, url, method, headers) async {
      if (_config.fetchHandler != null) {
        await _config.fetchHandler!.call(id, url, method, headers);
        return;
      }
      await defaultVmFetchHandler(
        id,
        url,
        method,
        headers,
        _bridge.resolveCallback,
      );
    };
    _bridge.secretsGetHandler = (id, key) async {
      if (_config.secretsGetHandler != null) {
        await _config.secretsGetHandler!.call(id, key);
      }
    };
    _bridge.secretsSetHandler = (id, key, value) async {
      if (_config.secretsSetHandler != null) {
        await _config.secretsSetHandler!.call(id, key, value);
      }
    };
    _bridge.loadAssetHandler = (id, path) async {
      if (_config.loadAssetHandler != null) {
        await _config.loadAssetHandler!.call(id, path);
        return;
      }
      await defaultVmLoadAssetHandler(
        id,
        path,
        _config.appDir,
        _bridge.resolveCallback,
      );
    };
    _bridge.execHandler = (id, cmd) async {
      if (_config.execHandler != null) {
        await _config.execHandler!.call(id, cmd);
      }
    };
    _bridge.intervalTickHandler = (id) => _handleIntervalTick(rt, id);
    _bridge.rafTickHandler = (id, elapsedMs) => _handleRafTick(rt, id, elapsedMs);

    for (final channel in _bridgeChannels) {
      rt.setupBridge(channel, (args) {
        if (_disposed) return;
        unawaited(_bridge.dispatch(channel, args));
      });
    }
  }

  static const List<String> _bridgeChannels = [
    '__jsr_render',
    '__jsr_fetch',
    '__jsr_storage_get',
    '__jsr_storage_set',
    '__jsr_set_title',
    '__jsr_event_done',
    '__jsr_export_state',
    '__jsr_log',
    '__jsr_set_interval',
    '__jsr_clear_interval',
    '__jsr_raf',
    '__jsr_caf',
    '__jsr_secrets_get',
    '__jsr_secrets_set',
    '__jsr_load_asset',
    '__jsr_exec',
  ];

  void _handleLog(String msg) {
    debugPrint('[JsWidget:${_config.widgetId}] $msg');
    _consoleLogs.add({'ts': DateTime.now().millisecondsSinceEpoch, 'msg': msg});
    if (_consoleLogs.length > _maxLogs) _consoleLogs.removeAt(0);
    _config.onLog?.call(msg);
  }

  void _handleIntervalTick(JavascriptRuntime rt, String id) {
    try {
      rt.evaluate('if(__iv_cbs["$id"])__iv_cbs["$id"]()');
      rt.executePendingJob();
    } catch (_) {}
  }

  void _handleRafTick(JavascriptRuntime rt, String id, int elapsedMs) {
    try {
      rt.evaluate(
        'if(__raf_cbs["$id"]){__raf_cbs["$id"]($elapsedMs);delete __raf_cbs["$id"];}',
      );
      rt.executePendingJob();
    } catch (e) {
      debugPrint('[JsWidgetEngine] RAF tick error: $e');
    }
  }

  void _resolveCallback(JavascriptRuntime rt, String id, dynamic value) {
    if (_disposed) return;
    try {
      rt.evaluate(
        'if(__cbs["$id"]){__cbs["$id"](${jsonEncode(value)});delete __cbs["$id"];}',
      );
      rt.executePendingJob();
    } catch (e) {
      debugPrint('[JsWidgetEngine] resolve callback error: $e');
    }
  }
}
