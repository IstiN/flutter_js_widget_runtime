import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_js/flutter_js.dart';

import 'package:js_widget_runtime/src/defaults/vm_default_handlers.dart';
import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bootstrap.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bridge.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_backend.dart';

/// VM JS engine backend backed by `flutter_js` (QuickJS / JavascriptCore).
class FlutterJsWidgetEngineBackend implements JsWidgetEngineBackend {
  FlutterJsWidgetEngineBackend({required JsRuntimeConfig config})
    : _config = config {
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
      js3dHost: config.js3dHost,
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

  @override
  Future<void> init() async {
    // Initialization happens lazily in [run].
  }

  @override
  List<Map<String, dynamic>> flushLogs() {
    final logs = List<Map<String, dynamic>>.from(_consoleLogs);
    _consoleLogs.clear();
    return logs;
  }

  @override
  List<Map<String, dynamic>> peekLogs() =>
      List<Map<String, dynamic>>.from(_consoleLogs);

  @override
  Map<String, dynamic>? get exportedState => _bridge.exportedState;

  @override
  void updateTheme(Map<String, dynamic> colors) {
    final rt = _runtime;
    if (rt == null || _disposed) return;
    try {
      rt.evaluate(JsWidgetBridge.updateThemeJs(colors));
      rt.executePendingJob();
    } catch (e) {
      debugPrint('[FlutterJsWidgetEngineBackend] updateTheme error: $e');
    }
  }

  @override
  Future<void> run(
    String widgetJs, {
    String? hostBootstrapJs,
    Map<String, dynamic> initialTheme = const {},
  }) async {
    // Detach the old runtime without releasing its native context yet.
    // The native JSContextGroup release is deferred to after the new
    // runtime is fully initialized — releasing synchronously inside
    // run() causes SIGSEGV because the old evaluate()/executePendingJob()
    // may still be on the native stack.
    final oldRuntime = _runtime;
    _disposed = true;
    _bridge.dispose();
    _runtime = null;

    _disposed = false;
    _consoleLogs.clear();

    try {
      final runtime = getJavascriptRuntime();
      runtime.enableHandlePromises();
      _runtime = runtime;
      debugPrint(
        '[FlutterJsWidgetEngineBackend] starting ${runtime.runtimeType}',
      );
      _setupBridges(runtime);

      // Inject a unique instance ID before bootstrap so jsr.render can tag
      // every render tree with it. On macOS (JSC), sendMessage is process-
      // global — render from engine A can arrive at engine B's bridge.
      // The __iid tag lets the Dart side filter cross-engine render leaks.
      runtime.evaluate('var __IID="${_config.instanceId ?? _config.widgetId}";');
      final bootstrapResult = runtime.evaluate(kJsWidgetBootstrap);
      if (bootstrapResult.isError) {
        debugPrint(
          '[FlutterJsWidgetEngineBackend] bootstrap error: ${bootstrapResult.stringResult}',
        );
      }
      updateTheme(initialTheme);

      final hostBootstrap = hostBootstrapJs ?? '';
      final code =
          '''
(function() {
  try {
    $hostBootstrap
    $widgetJs
  } catch(e) {
    jsr.showError('Widget error: ' + (e.message || String(e)));
  }
})();
''';
      debugPrint('[FlutterJsWidgetEngineBackend] evaluating widget code...');
      final result = runtime.evaluate(code);
      if (result.isError) {
        debugPrint(
          '[FlutterJsWidgetEngineBackend] widget eval error: ${result.stringResult}',
        );
      }
      runtime.executePendingJob();
      debugPrint(
        '[FlutterJsWidgetEngineBackend] widget code done, uiTree set: $_disposed',
      );
    } catch (e) {
      debugPrint('[FlutterJsWidgetEngineBackend] startup error: $e');
      rethrow;
    } finally {
      // Now that the new runtime is fully initialized, release the old one.
      if (oldRuntime != null) {
        scheduleMicrotask(() {
          try {
            oldRuntime.dispose();
          } catch (_) {}
        });
      }
    }
  }

  @override
  Future<void> callEvent(
    String actionId, [
    Map<String, dynamic>? payload,
  ]) async {
    final rt = _runtime;
    if (rt == null || _disposed) {
      debugPrint('[WidgetEvent] callEvent SKIP: rt=${rt != null} disposed=$_disposed widgetId=$actionId');
      return;
    }
    final encodedAction = jsonEncode(actionId);
    final encodedPayload = jsonEncode(payload ?? {});
    debugPrint('[WidgetEvent] callEvent ENTER: actionId=$actionId rt=${rt.hashCode} disposed=$_disposed');
    await _bridge.callEvent(() {
      debugPrint('[WidgetEvent] send() called: isLive=${_isLive(rt)} actionId=$actionId');
      if (!_isLive(rt)) return;
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
      // Pump pending jobs — on JSC, sendMessage callbacks are queued as
      // pending jobs and need pumping to reach the Dart bridge.
      rt.executePendingJob();
      rt.executePendingJob();
    });
  }

  @override
  void dispatchHostEvent(String target, Map<String, dynamic> payload) {
    final rt = _runtime;
    if (rt == null || _disposed) return;
    try {
      rt.evaluate(hostEventJs(target, payload));
      rt.executePendingJob();
    } catch (e) {
      debugPrint('[FlutterJsWidgetEngineBackend] host event error: $e');
    }
  }

  /// Builds the JS snippet that delivers a host event to bootstrap listeners
  /// (`jsr.onKey`, `jsr.scene3d.onTap`). Extracted for unit testing.
  static String hostEventJs(String target, Map<String, dynamic> payload) =>
      'if(typeof __jsrHostEvent==="function"){'
      '__jsrHostEvent(${jsonEncode(target)},${jsonEncode(payload)});'
      '}';

  @override
  Future<void> dispose() async {
    _disposed = true;
    _bridge.dispose();
    final rt = _runtime;
    _runtime = null;
    if (rt != null) {
      // Deferred release: if dispose() is called from within a native JSC
      // callback (e.g. bridge channel → dispatch → dispose chain), releasing
      // synchronously frees the JSContextGroup out from under the callback.
      scheduleMicrotask(() {
        try {
          rt.dispose();
        } catch (_) {}
      });
    }
  }

  // ── Private ──────────────────────────────────────────────────────────────

  /// True while [rt] is the current, not-yet-disposed runtime. Every deferred
  /// entry point (queued event sends, timer ticks, async resolve callbacks)
  /// must re-check this before touching the runtime: after [dispose] the
  /// native JSContextGroup is released and any call into it is a
  /// use-after-free, which Dart try/catch cannot intercept (SIGSEGV).
  bool _isLive(JavascriptRuntime rt) => !_disposed && identical(rt, _runtime);

  void _setupBridges(JavascriptRuntime rt) {
    _bridge.resolveCallback =
        _config.resolveCallback ??
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
    _bridge.rafTickHandler = (id, elapsedMs) =>
        _handleRafTick(rt, id, elapsedMs);

    for (final channel in _bridgeChannels) {
      rt.setupBridge(channel, (args) {
        if (!_isLive(rt)) {
          debugPrint('[WidgetEvent] bridge SKIP channel=$channel not live rt=${rt.hashCode} _runtime=${_runtime?.hashCode}');
          return;
        }
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
    '__jsr_scene3d_command',
  ];

  void _handleLog(String msg) {
    debugPrint('[JsWidget:${_config.widgetId}] $msg');
    _consoleLogs.add({'ts': DateTime.now().millisecondsSinceEpoch, 'msg': msg});
    if (_consoleLogs.length > _maxLogs) _consoleLogs.removeAt(0);
    _config.onLog?.call(msg);
  }

  void _handleIntervalTick(JavascriptRuntime rt, String id) {
    if (!_isLive(rt)) return;
    try {
      rt.evaluate('if(__iv_cbs["$id"])__iv_cbs["$id"]()');
      rt.executePendingJob();
    } catch (_) {}
  }

  void _handleRafTick(JavascriptRuntime rt, String id, int elapsedMs) {
    if (!_isLive(rt)) return;
    try {
      rt.evaluate(
        'if(__raf_cbs["$id"]){__raf_cbs["$id"]($elapsedMs);delete __raf_cbs["$id"];}',
      );
      rt.executePendingJob();
    } catch (e) {
      debugPrint('[FlutterJsWidgetEngineBackend] RAF tick error: $e');
    }
  }

  void _resolveCallback(JavascriptRuntime rt, String id, dynamic value) {
    if (!_isLive(rt)) return;
    try {
      rt.evaluate(
        'if(__cbs["$id"]){__cbs["$id"](${jsonEncode(value)});delete __cbs["$id"];}',
      );
      rt.executePendingJob();
    } catch (e) {
      debugPrint('[FlutterJsWidgetEngineBackend] resolve callback error: $e');
    }
  }
}
