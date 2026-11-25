import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';

import 'package:js_widget_runtime/src/defaults/vm_default_handlers.dart';
import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/model/js_three_backend.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_host.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_line_walk_native.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_custom_attributes_native.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_morph_native.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_skinning_native.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bootstrap.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bridge.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_backend.dart';
import 'package:js_widget_runtime/src/runtime/quickjs_diagnostics.dart';
import 'package:js_widget_runtime/src/runtime/quickjs_payload.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

bool _quickjsAllowAll(String _) => true;

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
class QuickjsWidgetEngineBackend
    with QuickjsBackendDiagnostics
    implements JsWidgetEngineBackend {
  QuickjsWidgetEngineBackend({required JsRuntimeConfig config})
    : _config = config {
    _bridge = JsWidgetBridge(
      widgetId: config.widgetId,
      onRender: config.onRender,
      onMessageTrace: config.onMessageTrace,
      onSetTitle: config.onSetTitle,
      onStorageUpdate: config.onStorageUpdate,
      onLog: (msg) => _handleLog(msg),
      isDisposed: () => _disposed,
      appDir: config.appDir,
      isPermissionAllowed: config.isPermissionAllowed ?? _quickjsAllowAll,
      resolveCallback: (id, value) async {},
      fetchHandler: (id, url, method, headers) async {},
      secretsGetHandler: (id, key) async {},
      secretsSetHandler: (id, key, value) async {},
      loadAssetHandler: (id, path) async {},
      execHandler: (id, cmd) async {},
      openUrlHandler: (id, url) async {},
      onHostCall: config.onHostCall,
      onHostCallBinary: config.onHostCallBinary,
      onAudioSynthesis: config.onAudioSynthesis,
      captureHandler: config.captureHandler,
      intervalTickHandler: (id) {},
      rafTickHandler: (id, elapsedMs) {},
      js3dHost: config.js3dHost,
      threeHost: config.threeHost,
      initialStorage: config.initialStorage,
    );
  }

  JsRuntimeConfig _config;
  late final JsWidgetBridge _bridge;
  JsThreeBackendSelection? _threeSelection;

  @override
  bool get hasSyncBinaryLane => true;

  @override
  void prepareThreeBackend(JsThreeBackendSelection selection) {
    _threeSelection = selection;
  }

  @override
  void setEngineInstanceId(String instanceId) {
    _config = _config.copyWith(instanceId: instanceId);
    _bridge.threeEngineId = instanceId;
  }

  QuickjsRuntime? _runtime;
  bool _disposed = false;

  @override
  JsWidgetBridge get quickjsBridge => _bridge;

  @override
  Future<void> init() async {
    // Fail fast with actionable instructions when the native library has not
    // been built; DynamicLibrary.open's raw error is far less helpful.
    _requireLibrary();
  }

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
    // Reset timers/scenes but keep the bridge usable: the widget that runs
    // below must be able to request frames again (dispose() would end the
    // RAF lane permanently).
    _bridge.resetForRun();
    _runtime = null;

    _disposed = false;
    quickjsConsoleLogs.clear();

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
      // QuickJS runtimes are per-engine: the binary lane may skip the
      // bootstrap's {iid,id} tagging (the JSC cross-engine router never
      // sees these messages).
      runtime.setGlobal('__JSR_RAW_BINARY__', 1);
      // Theme initialization is pure JS and has no host await. Evaluate it
      // with the bootstrap so startup pays one fewer full QuickJS parse/eval
      // round trip (bootstrap, theme, and widget used to be three evals).
      final bootstrapError = <String?>[];
      runtime.eval(
        '$kJsWidgetBootstrap\n${JsWidgetBridge.updateThemeJs(initialTheme)}',
        errMsg: bootstrapError,
      );
      if (bootstrapError.isNotEmpty) {
        debugPrint(
          '[QuickjsWidgetEngineBackend] bootstrap error: ${bootstrapError.single}',
        );
      }

      // The run() parameter wins; otherwise the host-provided config value
      // applies (issue #12: a config-only __JSR_MOCK_ORIGIN__ must reach the
      // widget even when run() is called without the parameter).
      final hostBootstrap = hostBootstrapJs ?? _config.hostBootstrapJs ?? '';
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
    if (QuickjsFfi.isAvailable) return;
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
    _bridge.openUrlHandler = _openUrlHandler;
    _bridge.intervalTickHandler = (id) => _handleIntervalTick(rt, id);
    _bridge.rafTickHandler = (id, elapsedMs) =>
        _handleRafTick(rt, id, elapsedMs);

    // The bootstrap channels everything through one global function; the
    // C bridge marshals its arguments as a JSON array [channel, payload].
    rt.registerHostFunction('sendMessage', (argsJson) {
      _handleSendMessage(rt, argsJson);
      return null;
    });
    // Native bytes lane (quickjs_runtime >= 0.3.4): JS calls
    // __jsrSendBytes(name, typedArray) and the raw pointer/length crosses
    // with zero JSON, zero base64, zero copies. Older libraries simply
    // never define the global — the bootstrap falls back to the b64 lane.
    if (rt.hasBytesFn) {
      rt.registerHostBytesFn('__jsrSendBytes', _bridge.dispatchBinary);
      // Advertised via `voxel.attach` → widgets may ship packed chunks
      // through the zero-JSON voxel.mesh.bin lane.
      _bridge.voxelWorld.binaryLaneAvailable = true;
      // CPU skining fast lane: the R1 renderer's _applySkining hands the
      // whole (bone matrices, indices, weights, bind pose) packet to Dart
      // and reads the skinned positions/normals back IN PLACE. Pure local
      // computation — no ports, no copies — so the per-vertex loop never
      // runs in QuickJS (16k-vertex rigs cost ~14ms/frame there).
      rt.registerHostBytesFn('__jsrSkinBytes', (name, data) {
        if (name == 'three.skin') applyThreeSkinningPacket(data);
      });
      // CPU morph-target fast lane: same in-place packet contract as the
      // skinning lane. facecap-style rigs (52 ARKit blendshapes) cost
      // ~2.2ms/frame in the QuickJS blend loop; the Dart blend is >10x
      // cheaper and bit-identical (same arithmetic, same packet layout).
      rt.registerHostBytesFn('__jsrMorphBytes', (name, data) {
        if (name == 'three.morph') applyThreeMorphPacket(data);
      });
      final lineWalk = ThreeLineWalkNative();
      rt.registerHostBytesFn('__jsrLineWalkBytes', (name, data) {
        if (name == 'three.lineWalk') lineWalk.apply(data);
        if (name == 'three.linePositions') applyThreeLinePositionsPacket(data);
      });
      registerThreeCustomAttributesNative(rt.registerHostBytesFn);
    }
    _register1BWire(rt);
  }

  /// Registers the synchronous G1 globals of the ANGLE 1B wire
  /// (ADR-0003 decision 4) when the selection ladder picked angle1b:
  /// - `__jsr1b_dispatch(bytes)`: zero-copy G1 command in; the int64
  ///   dispatch result is parked on the isolate.
  /// - `__jsr1b_rc()`: the parked dispatch result as a JSON number.
  /// - `__jsr1b_result()`: the per-engine result scratch, base64.
  /// The package's facade bootstrap wires `__jsr1b_gl(bytes)` as the
  /// dispatch+rc pair the generated G1 packer calls.
  void _register1BWire(QuickjsRuntime rt) {
    if (!(_threeSelection?.isAngle1b ?? false)) return;
    final JsThree1BWire? host = _config.threeHost is JsThree1BWire
        ? _config.threeHost! as JsThree1BWire
        : null;
    if (host == null) return;
    final engineId = _config.instanceId ?? _config.widgetId;
    var parkedRc = 0;
    if (rt.hasBytesFn) {
      rt.registerHostBytesFn('__jsr1b_dispatch', (name, data) {
        parkedRc = host.dispatch1B(engineId, data);
      });
    }
    rt.registerHostFunction('__jsr1b_rc', (_) => parkedRc.toString());
    rt.registerHostFunction(
      '__jsr1b_result',
      (_) => jsonEncode(host.result1BAsBase64(engineId)),
    );
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

  Future<void> _openUrlHandler(String id, String url) async {
    final handler = _config.openUrlHandler;
    if (handler != null) {
      await handler(id, url);
      return;
    }
    await defaultVmOpenUrlHandler(id, url, _bridge.resolveCallback);
  }

  void _handleSendMessage(QuickjsRuntime rt, String argsJson) {
    // Binary lane fast path: the payload is `<name> <base64>` — a plain
    // string with NO escapable characters (b64 alphabet + sanitized name),
    // so the JSON envelope can be sliced without any decode at all.
    const binPrefix = '["__jsr_host_call_binary","';
    if (argsJson.startsWith(binPrefix) && argsJson.endsWith('"]')) {
      if (!_isLive(rt)) return;
      final payload = argsJson.substring(binPrefix.length, argsJson.length - 2);
      final sep = payload.indexOf(' ');
      if (sep > 0) {
        unawaited(_bridge.dispatch('__jsr_host_call_binary', payload));
      }
      return;
    }
    // `__jsr_log` dominates bridge traffic (~93% in profiled runs): every
    // console.log from widget JS crosses here. Fast-path it without the
    // generic jsonDecode of the whole payload.
    if (argsJson.startsWith('["__jsr_log",')) {
      if (!_isLive(rt)) return;
      final msg = _decodeLogPayload(argsJson);
      unawaited(_bridge.dispatch('__jsr_log', unwrapQuickjsPayload(msg)));
      return;
    }
    final args = jsonDecode(argsJson);
    if (args is! List || args.length != 2 || args[0] is! String) return;
    if (!_isLive(rt)) return;
    unawaited(
      _bridge.dispatch(
        args[0] as String,
        unwrapQuickjsPayload(args[1], args[0]),
      ),
    );
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

  void _appendConsoleLog(String msg) => appendQuickjsLog(msg);

  void _handleIntervalTick(QuickjsRuntime rt, String id) {
    if (!_isLive(rt)) return;
    final evalError = <String?>[];
    try {
      rt.eval('__jsrInterval(${jsonEncode(id)})', errMsg: evalError);
      rt.executePendingJobs();
    } catch (e) {
      _reportAsyncError(rt, 'interval tick', e.toString());
    }
    if (evalError.isNotEmpty) {
      _reportAsyncError(rt, 'interval tick', evalError.single!);
    }
  }

  void _handleRafTick(QuickjsRuntime rt, String id, int elapsedMs) {
    if (!_isLive(rt)) return;
    final evalError = <String?>[];
    try {
      rt.eval('__jsrRaf(${jsonEncode(id)},$elapsedMs)', errMsg: evalError);
      rt.executePendingJobs();
    } catch (e) {
      _reportAsyncError(rt, 'RAF tick', e.toString());
      return;
    }
    if (evalError.isNotEmpty) {
      _reportAsyncError(rt, 'RAF tick', evalError.single!);
    }
  }

  /// Late JS errors (timer/RAF/promise callbacks run outside the widget's
  /// startup try/catch) previously vanished silently — quickjs_runtime's
  /// eval returns null instead of throwing. Surface them as a widget error
  /// card, exactly like startup eval failures.
  void _reportAsyncError(QuickjsRuntime rt, String phase, String message) {
    debugPrint('[QuickjsWidgetEngineBackend] $phase error: $message');
    final encoded = jsonEncode('Widget error: $message');
    try {
      rt.eval('try{jsr.showError($encoded)}catch(_){}');
      rt.executePendingJobs();
    } catch (_) {}
  }

  void _resolveCallback(QuickjsRuntime rt, String id, dynamic value) {
    if (!_isLive(rt)) return;
    final evalError = <String?>[];
    try {
      // Large host payloads are JSON-marshalled straight into globals by the
      // FFI bridge. This avoids reparsing a second, much larger JavaScript
      // string literal (notably base64 asset responses) on every resolve.
      if (_resolvePrefersGlobal(value)) {
        rt.setGlobal('__jsrHostResolveValue', value);
        rt.eval(
          '__jsrResolve(${jsonEncode(id)},__jsrHostResolveValue)',
          errMsg: evalError,
        );
      } else {
        rt.eval(
          '__jsrResolve(${jsonEncode(id)},${jsonEncode(value)})',
          errMsg: evalError,
        );
      }
      rt.executePendingJobs();
    } catch (e) {
      _reportAsyncError(rt, 'resolve callback', e.toString());
      return;
    }
    if (evalError.isNotEmpty) {
      _reportAsyncError(rt, 'resolve callback', evalError.single!);
    }
  }
}

/// Avoid an extra JSON encode just to choose the large-payload lane. Asset
/// and file responses carry their bulk in a top-level string field.
bool _resolvePrefersGlobal(dynamic value) {
  if (value is String) return value.length >= 16384;
  if (value is! Map) return false;
  for (final entry in value.entries) {
    if (entry.value is String && (entry.value as String).length >= 16384) {
      return true;
    }
  }
  return false;
}
