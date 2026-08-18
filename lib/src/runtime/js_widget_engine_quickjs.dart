import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';

import 'package:js_widget_runtime/src/defaults/vm_default_handlers.dart';
import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bootstrap.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bridge.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_backend.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// VM JS engine backend backed by the QuickJS runtime via `dart:ffi`, from
/// the pure-Dart `quickjs_runtime` package.
///
/// Unlike the default `flutter_js` backend, host calls are **synchronous**:
/// the C bridge invokes a Dart [NativeCallable] on the owning isolate's
/// thread while `JS_Eval` is still on the stack, so bridge messages
/// (`jsr.render`, `console.log`, …) reach Dart before `eval` returns.
///
/// This backend is opt-in: construct it directly and pass it via
/// [JsRuntimeConfig.backend]. It imports `dart:ffi`/`dart:io` and therefore
/// must never be imported from a web-reachable path.
///
/// The shared library (`libquickjs_bridge.so`) lives in the
/// `quickjs_runtime` package; see its README for lookup order and build
/// instructions (`tool/build_quickjs.sh` inside that package, or set the
/// `JSR_QUICKJS_LIB` environment variable). A missing library makes [init]
/// throw a [StateError] explaining that.
class QuickjsWidgetEngineBackend implements JsWidgetEngineBackend {
  QuickjsWidgetEngineBackend({required JsRuntimeConfig config})
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
  QuickjsRuntime? _runtime;
  bool _disposed = false;
  final List<Map<String, dynamic>> _consoleLogs = [];
  static const int _maxLogs = 200;

  @override
  Future<void> init() async {
    // Fail fast with actionable instructions when the native library has not
    // been built; DynamicLibrary.open's raw error is far less helpful.
    _requireLibrary();
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
      rt.eval(JsWidgetBridge.updateThemeJs(colors));
      rt.executePendingJobs();
    } catch (e) {
      debugPrint('[QuickjsWidgetEngineBackend] updateTheme error: $e');
    }
  }

  @override
  Future<void> run(
    String widgetJs, {
    String? hostBootstrapJs,
    Map<String, dynamic> initialTheme = const {},
  }) async {
    // Detach the old runtime without closing it yet. Closing is deferred to
    // a microtask: QuickJS may still be on the native stack if run() is
    // reached from a bridge callback, and freeing a live context is a
    // use-after-free no Dart try/catch can intercept.
    final oldRuntime = _runtime;
    _disposed = true;
    _bridge.dispose();
    _runtime = null;

    _disposed = false;
    _consoleLogs.clear();

    try {
      _requireLibrary();
      final runtime = QuickjsRuntime();
      _runtime = runtime;
      debugPrint('[QuickjsWidgetEngineBackend] starting QuickJS');
      _setupBridges(runtime);

      // Inject a unique instance ID before bootstrap so jsr.render can tag
      // every render tree with it (see the flutter_js backend for the
      // rationale — cross-engine render leak filtering).
      runtime.setGlobal('__IID', _config.instanceId ?? _config.widgetId);
      final bootstrapError = <String?>[];
      runtime.eval(kJsWidgetBootstrap, errMsg: bootstrapError);
      if (bootstrapError.isNotEmpty) {
        debugPrint(
          '[QuickjsWidgetEngineBackend] bootstrap error: ${bootstrapError.single}',
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
      debugPrint('[QuickjsWidgetEngineBackend] evaluating widget code...');
      final evalError = <String?>[];
      runtime.eval(code, errMsg: evalError);
      if (evalError.isNotEmpty) {
        debugPrint(
          '[QuickjsWidgetEngineBackend] widget eval error: ${evalError.single}',
        );
      }
      runtime.executePendingJobs();
    } catch (e) {
      debugPrint('[QuickjsWidgetEngineBackend] startup error: $e');
      rethrow;
    } finally {
      // Now that the new runtime is fully initialized, release the old one.
      if (oldRuntime != null) {
        scheduleMicrotask(() => oldRuntime.close());
      }
    }
  }

  @override
  Future<void> callEvent(
    String actionId, [
    Map<String, dynamic>? payload,
  ]) async {
    final rt = _runtime;
    if (rt == null || _disposed) return;
    // Re-check _isLive right before eval — the engine may have been disposed
    // between the async entry point and here.
    if (!_isLive(rt)) return;
    final encodedAction = jsonEncode(actionId);
    final encodedPayload = jsonEncode(payload ?? {});
    try {
      rt.eval(
        '(function(){'
        'var __h=jsr._handler||(typeof handleEvent==="function"?handleEvent:null);'
        'if(!__h){return;}'
        'try{'
        'var __r=__h($encodedAction,$encodedPayload);'
        'if(__r&&typeof __r.then==="function"){__r.then(function(){},function(e){});}'
        '}catch(e){}'
        '})();',
      );
      rt.executePendingJobs();
    } catch (e) {
      debugPrint('[QuickjsWidgetEngineBackend] callEvent error: $e');
    }
  }

  @override
  void dispatchHostEvent(String target, Map<String, dynamic> payload) {
    final rt = _runtime;
    if (rt == null || _disposed) return;
    try {
      rt.eval(hostEventJs(target, payload));
      rt.executePendingJobs();
    } catch (e) {
      debugPrint('[QuickjsWidgetEngineBackend] host event error: $e');
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
      // Deferred release: QuickJS may still be on the native stack if
      // dispose() is reached from a synchronous bridge callback.
      scheduleMicrotask(() => rt.close());
    }
  }

  /// Test seam: stops the bridge's timers and RAF ticker without disposing
  /// the bridge or its scene controllers. Golden tests of animated/3D
  /// widgets keep the engine alive for the capture, but a ticking engine
  /// trips the test binding's "animation still running" invariant.
  @visibleForTesting
  void debugStopTimers() {
    _bridge.debugStopTimers();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  /// True while [rt] is the current, not-yet-disposed runtime. Deferred
  /// entry points (timer ticks, resolve callbacks) must re-check this before
  /// touching the runtime: after [dispose] the native context is freed and
  /// any call into it is a use-after-free.
  bool _isLive(QuickjsRuntime rt) => !_disposed && identical(rt, _runtime);

  void _requireLibrary() {
    if (File(QuickjsFfi.libraryPath).existsSync()) return;
    throw StateError(
      'QuickJS library not found at "${QuickjsFfi.libraryPath}". '
      'Build it with tool/build_quickjs.sh (from the package root), or point '
      'the JSR_QUICKJS_LIB environment variable at an existing '
      'libquickjs_bridge.so.',
    );
  }

  void _setupBridges(QuickjsRuntime rt) {
    _bridge.resolveCallback =
        _config.resolveCallback ??
        (id, value) => _resolveCallback(rt, id, value);
    _config.onResolveReady?.call(_bridge.resolveCallback);
    _bridge.fetchHandler = _fetchHandler;
    _bridge.secretsGetHandler = _secretsGetHandler;
    _bridge.secretsSetHandler = _secretsSetHandler;
    _bridge.loadAssetHandler = _loadAssetHandler;
    _bridge.execHandler = _execHandler;
    _bridge.intervalTickHandler = (id) => _handleIntervalTick(rt, id);
    _bridge.rafTickHandler = (id, elapsedMs) =>
        _handleRafTick(rt, id, elapsedMs);

    // The bootstrap channels everything through one global function; the
    // C bridge marshals its arguments as a JSON array [channel, payload].
    rt.registerHostFunction('sendMessage', (argsJson) {
      _handleSendMessage(rt, argsJson);
      return null;
    });
  }

  Future<void> _fetchHandler(
    String id,
    String url,
    String method,
    Map<String, String> headers,
  ) async {
    final handler = _config.fetchHandler;
    if (handler != null) {
      await handler(id, url, method, headers);
      return;
    }
    await defaultVmFetchHandler(
      id,
      url,
      method,
      headers,
      _bridge.resolveCallback,
    );
  }

  Future<void> _secretsGetHandler(String id, String key) async {
    final handler = _config.secretsGetHandler;
    if (handler != null) await handler(id, key);
  }

  Future<void> _secretsSetHandler(String id, String key, dynamic value) async {
    final handler = _config.secretsSetHandler;
    if (handler != null) await handler(id, key, value);
  }

  Future<void> _loadAssetHandler(String id, String path) async {
    final handler = _config.loadAssetHandler;
    if (handler != null) {
      await handler(id, path);
      return;
    }
    await defaultVmLoadAssetHandler(
      id,
      path,
      _config.appDir,
      _bridge.resolveCallback,
    );
  }

  Future<void> _execHandler(String id, String cmd) async {
    final handler = _config.execHandler;
    if (handler != null) await handler(id, cmd);
  }

  void _handleSendMessage(QuickjsRuntime rt, String argsJson) {
    // `__jsr_log` dominates bridge traffic (~93% in profiled runs): every
    // console.log from widget JS crosses here. Fast-path it without the
    // generic jsonDecode of the whole payload.
    if (argsJson.startsWith('["__jsr_log",')) {
      if (!_isLive(rt)) return;
      final msg = _decodeLogPayload(argsJson);
      unawaited(_bridge.dispatch('__jsr_log', msg));
      return;
    }
    final args = jsonDecode(argsJson);
    if (args is! List || args.length != 2 || args[0] is! String) return;
    if (!_isLive(rt)) return;
    unawaited(_bridge.dispatch(args[0] as String, args[1]));
  }

  /// Extracts the message string from a `["__jsr_log","<msg>"]` payload by
  /// decoding just the string literal (the payload is engine-generated with
  /// a single string element), skipping the generic array decode.
  static String _decodeLogPayload(String argsJson) {
    final start = '["__jsr_log",'.length;
    var end = argsJson.length;
    if (end > start && argsJson.endsWith(']')) end--;
    final body = argsJson.substring(start, end);
    final decoded = jsonDecode(body);
    return decoded is String ? decoded : body;
  }

  void _handleLog(String msg) {
    debugPrint('[JsWidget:${_config.widgetId}] $msg');
    _appendConsoleLog(msg);
    _config.onLog?.call(msg);
  }

  void _appendConsoleLog(String msg) {
    _consoleLogs.add({'ts': DateTime.now().millisecondsSinceEpoch, 'msg': msg});
    if (_consoleLogs.length > _maxLogs) {
      _consoleLogs.removeRange(0, _consoleLogs.length - _maxLogs);
    }
  }

  void _handleIntervalTick(QuickjsRuntime rt, String id) {
    if (!_isLive(rt)) return;
    try {
      rt.eval('if(__iv_cbs["$id"])__iv_cbs["$id"]()');
      rt.executePendingJobs();
    } catch (_) {}
  }

  void _handleRafTick(QuickjsRuntime rt, String id, int elapsedMs) {
    if (!_isLive(rt)) return;
    try {
      rt.eval(
        'if(__raf_cbs["$id"]){__raf_cbs["$id"]($elapsedMs);delete __raf_cbs["$id"];}',
      );
      rt.executePendingJobs();
    } catch (e) {
      debugPrint('[QuickjsWidgetEngineBackend] RAF tick error: $e');
    }
  }

  void _resolveCallback(QuickjsRuntime rt, String id, dynamic value) {
    if (!_isLive(rt)) return;
    try {
      rt.eval(
        'if(__cbs["$id"]){__cbs["$id"](${jsonEncode(value)});delete __cbs["$id"];}',
      );
      rt.executePendingJobs();
    } catch (e) {
      debugPrint('[QuickjsWidgetEngineBackend] resolve callback error: $e');
    }
  }
}
