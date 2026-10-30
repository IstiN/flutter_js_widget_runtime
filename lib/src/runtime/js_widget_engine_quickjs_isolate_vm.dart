import 'dart:async';
import 'dart:convert';
import 'dart:isolate';

import 'package:flutter/foundation.dart';

import 'package:js_widget_runtime/src/defaults/vm_default_handlers.dart';
import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bootstrap.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bridge.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_backend.dart';
import 'package:js_widget_runtime/src/runtime/quickjs_diagnostics.dart';
import 'package:js_widget_runtime/src/runtime/quickjs_payload.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// Creates an opt-in QuickJS backend whose JS runtime lives in an isolate.
JsWidgetEngineBackend createQuickjsIsolateWidgetEngineBackend(
  JsRuntimeConfig config,
) => QuickjsIsolateWidgetEngineBackend(config: config);

bool _allowAll(String _) => true;

/// Native QuickJS backend with a persistent background-isolate JS runtime.
///
/// Flutter hosts, the bridge, GPU resources, timers and I/O stay on the main
/// isolate. Only source evaluation and JS-side encoding happen in the worker.
class QuickjsIsolateWidgetEngineBackend
    with QuickjsBackendDiagnostics
    implements JsWidgetEngineBackend {
  QuickjsIsolateWidgetEngineBackend({required JsRuntimeConfig config})
    : _config = config {
    _bridge = JsWidgetBridge(
      widgetId: config.widgetId,
      onRender: config.onRender,
      onSetTitle: config.onSetTitle,
      onStorageUpdate: config.onStorageUpdate,
      onLog: _handleLog,
      isDisposed: () => _disposed,
      appDir: config.appDir,
      isPermissionAllowed: config.isPermissionAllowed ?? _allowAll,
      resolveCallback:
          config.resolveCallback ??
          (id, value) => _post({'type': 'resolve', 'id': id, 'value': value}),
      fetchHandler: _handleFetch,
      secretsGetHandler: (id, key) async {
        await _config.secretsGetHandler?.call(id, key);
      },
      secretsSetHandler: (id, key, value) async {
        await _config.secretsSetHandler?.call(id, key, value);
      },
      loadAssetHandler: (id, path) async {
        if (_config.loadAssetHandler != null) {
          await _config.loadAssetHandler!(id, path);
          return;
        }
        await defaultVmLoadAssetHandler(
          id,
          path,
          _config.appDir,
          _bridge.resolveCallback,
        );
      },
      execHandler: _handleExec,
      openUrlHandler: _handleOpenUrl,
      onHostCall: config.onHostCall,
      onHostCallBinary: config.onHostCallBinary,
      captureHandler: config.captureHandler,
      intervalTickHandler: (id) => _post({'type': 'interval', 'id': id}),
      rafTickHandler: (id, elapsedMs) =>
          _post({'type': 'raf', 'id': id, 'elapsed': elapsedMs}),
      js3dHost: config.js3dHost,
      threeHost: config.threeHost,
      initialStorage: config.initialStorage,
    );
  }

  JsRuntimeConfig _config;
  late final JsWidgetBridge _bridge;

  Isolate? _isolate;
  ReceivePort? _messagePort;
  ReceivePort? _exitPort;
  StreamSubscription<dynamic>? _messageSubscription;
  StreamSubscription<dynamic>? _exitSubscription;
  SendPort? _commands;
  Completer<SendPort>? _commandReady;
  Completer<void>? _shutdown;
  final Map<int, Completer<void>> _pending = {};
  int _nextRequest = 0;
  int _generation = 0;
  bool _disposed = false;

  @override
  void setEngineInstanceId(String instanceId) {
    _config = _config.copyWith(instanceId: instanceId);
    _bridge.threeEngineId = instanceId;
  }

  @override
  Future<void> init() async {
    if (!QuickjsFfi.isAvailable) {
      throw StateError(
        'QuickJS native library is not available. Build quickjs_runtime or '
        'set JSR_QUICKJS_LIB.',
      );
    }
  }

  @override
  JsWidgetBridge get quickjsBridge => _bridge;

  @override
  Future<void> run(
    String widgetJs, {
    String? hostBootstrapJs,
    Map<String, dynamic> initialTheme = const {},
  }) async {
    await dispose();
    _disposed = false;
    quickjsConsoleLogs.clear();
    final generation = ++_generation;
    try {
      final commands = await _startWorker();
      if (_disposed || generation != _generation) return;
      final request = _newRequest();
      commands.send({
        'type': 'run',
        'generation': generation,
        'request': request.key,
        'widget': widgetJs,
        'hostBootstrap': hostBootstrapJs ?? '',
        'theme': initialTheme,
        'instanceId': _config.instanceId ?? _config.widgetId,
        'debug': kDebugMode,
      });
      await request.value;
      if (!_disposed && generation == _generation) {
        _config.onResolveReady?.call(_bridge.resolveCallback);
      }
    } catch (_) {
      if (generation == _generation) await dispose();
      rethrow;
    }
  }

  @override
  Future<void> callEvent(
    String actionId, [
    Map<String, dynamic>? payload,
  ]) async {
    if (_disposed) return;
    final commands = _commands ?? await _commandReady?.future;
    if (commands == null || _disposed) return;
    final request = _newRequest();
    commands.send({
      'type': 'event',
      'generation': _generation,
      'request': request.key,
      'actionId': actionId,
      'payload': payload ?? const <String, dynamic>{},
    });
    await request.value;
  }

  @override
  void updateTheme(Map<String, dynamic> colors) =>
      _post({'type': 'theme', 'colors': colors});

  @override
  void dispatchHostEvent(String target, Map<String, dynamic> payload) =>
      _post({'type': 'hostEvent', 'target': target, 'payload': payload});

  @override
  Future<void> dispose() async {
    _disposed = true;
    ++_generation;
    // Sequence matters: the worker must be FULLY stopped (graceful ack, or
    // kill as the stuck-eval backstop) before any bridge FFI callable is
    // closed. Tearing the bridge down while the worker still runs leaves
    // its qjs_dispatch trampolines pointing at closed NativeCallables —
    // the exact family of corruption behind the documented SIGBUS
    // bytes-lane incident (marker.cc crash), here surfacing as a SIGSEGV
    // in the MAIN isolate's concurrent marker during rapid module
    // switching. Only a dead worker makes closing the bridge safe.
    await _shutdownWorker();
    _bridge.dispose();
    for (final pending in _pending.values) {
      if (!pending.isCompleted) pending.complete();
    }
    _pending.clear();
    final ready = _commandReady;
    if (ready != null && !ready.isCompleted && _commands == null) {
      ready.completeError(StateError('QuickJS worker disposed during startup'));
    }

    await _shutdownWorker();
    await _messageSubscription?.cancel();
    await _exitSubscription?.cancel();
    _messagePort?.close();
    _exitPort?.close();
    _isolate = null;
    _commands = null;
    _messagePort = null;
    _exitPort = null;
    _messageSubscription = null;
    _exitSubscription = null;
    _commandReady = null;
    _shutdown = null;
  }

  /// Stops the worker isolate: graceful shutdown handshake first (the ack
  /// can only arrive once the worker's CURRENT command finished — typically
  /// the synchronous JS_Eval of a freshly booted widget bundle, which can
  /// take many seconds when several modules boot concurrently), then
  /// kill(immediate) purely as the stuck-eval backstop (infinite JS loop).
  /// Killing earlier rips the isolate apart with qjs_dispatch /
  /// DLRT_GetFfiCallbackMetadata on the C stack, corrupting the shared FFI
  /// callback registry; the concurrent GC marker then walks a torn native
  /// transition frame and SIGSEGVs (marker.cc), or the next engine trips
  /// dart::FfiCallbackThreadChecks and SIGABRTs (rapid sidebar clicking
  /// crashes). The window is deliberately generous: a leaked worker on a
  /// stuck eval is recoverable (process exit), a corrupted registry is not.
  /// Root fix is an interrupt handler in quickjs_runtime (see memory).
  Future<void> _shutdownWorker() async {
    final isolate = _isolate;
    final commands = _commands;
    if (isolate != null && commands != null) {
      final shutdown = Completer<void>();
      _shutdown = shutdown;
      commands.send(const {'type': 'shutdown'});
      final acked = shutdown.future
          .then((_) => true)
          .timeout(const Duration(seconds: 10), onTimeout: () => false);
      final ack = await acked;
      if (ack == true) {
        // The worker dequeued 'shutdown': it will run NO further evals, so
        // the bridge can be disposed immediately. Its JS_FreeRuntime may
        // still be unwinding on the worker thread — do NOT kill the
        // isolate now (same mid-native-call hazard as killing mid-eval);
        // it exits by itself once close() finishes.
        return;
      }
    }
    // Stuck worker (infinite JS loop): last-resort teardown.
    isolate?.kill(priority: Isolate.immediate);
  }

  Future<SendPort> _startWorker() async {
    final messages = ReceivePort();
    final exits = ReceivePort();
    final ready = Completer<SendPort>();
    _messagePort = messages;
    _exitPort = exits;
    _commandReady = ready;
    _messageSubscription = messages.listen(
      (raw) => _onWorkerMessage(raw, messages),
    );
    _exitSubscription = exits.listen((error) => _onWorkerExit(error, exits));
    final isolate = await Isolate.spawn(
      _quickJsWorkerMain,
      messages.sendPort,
      onExit: exits.sendPort,
      onError: exits.sendPort,
      debugName: 'JsQuickJS-${_config.widgetId}',
    );
    if (_disposed || !identical(_messagePort, messages)) {
      isolate.kill(priority: Isolate.immediate);
      throw StateError('QuickJS worker disposed during startup');
    }
    _isolate = isolate;
    return ready.future;
  }

  MapEntry<int, Future<void>> _newRequest() {
    final id = ++_nextRequest;
    final completer = Completer<void>();
    _pending[id] = completer;
    return MapEntry(id, completer.future);
  }

  void _post(Map<String, dynamic> message) {
    if (_disposed) return;
    _commands?.send({...message, 'generation': _generation});
  }

  void _onWorkerMessage(dynamic raw, ReceivePort source) {
    if (!identical(source, _messagePort) || raw is! Map) return;
    final type = raw['type'];
    if (_handleWorkerControlMessage(type, raw)) return;
    if (_disposed || raw['generation'] != _generation) return;
    switch (type) {
      case 'message':
        _dispatchWorkerMessage(raw);
      case 'binary':
        _dispatchWorkerBinary(raw);
      case 'capabilities':
        _bridge.voxelWorld.binaryLaneAvailable = raw['binary'] as bool;
      case 'done':
      case 'error':
        _completeWorkerRequest(type, raw);
    }
  }

  bool _handleWorkerControlMessage(dynamic type, Map<dynamic, dynamic> raw) {
    if (type == 'port') {
      final port = raw['port'];
      _commands = port is SendPort ? port : null;
      if (_commandReady?.isCompleted == false) {
        _commandReady!.complete(_commands);
      }
      return true;
    }
    if (type == 'shutdown') {
      if (_shutdown?.isCompleted == false) _shutdown!.complete();
      return true;
    }
    return false;
  }

  void _dispatchWorkerMessage(Map<dynamic, dynamic> raw) {
    final channel = raw['channel'] as String;
    unawaited(
      _bridge.dispatch(channel, unwrapQuickjsPayload(raw['payload'], channel)),
    );
  }

  void _dispatchWorkerBinary(Map<dynamic, dynamic> raw) {
    final bytes = raw['bytes'];
    final data = bytes is TransferableTypedData
        ? bytes.materialize().asUint8List()
        : bytes as Uint8List;
    _bridge.dispatchBinary(raw['name'] as String, data);
  }

  void _completeWorkerRequest(dynamic type, Map<dynamic, dynamic> raw) {
    final request = raw['request'] as int?;
    final pending = request == null ? null : _pending.remove(request);
    if (pending == null || pending.isCompleted) {
      if (type == 'error') debugPrint('[QuickJS isolate] ${raw['error']}');
      return;
    }
    if (type == 'error') {
      pending.completeError(StateError(raw['error'] as String));
    } else {
      pending.complete();
    }
  }

  void _onWorkerExit(dynamic error, ReceivePort source) {
    if (!_acceptsWorkerExit(source)) return;
    final description = error == null ? 'worker exited' : error.toString();
    _failWorkerStartup(description);
    _failPendingRequests(description);
    _commands = null;
  }

  bool _acceptsWorkerExit(ReceivePort source) =>
      identical(source, _exitPort) && !_disposed;

  void _failWorkerStartup(String description) {
    if (_commandReady?.isCompleted == false) {
      _commandReady!.completeError(StateError('QuickJS $description'));
    }
  }

  void _failPendingRequests(String description) {
    for (final pending in _pending.values) {
      if (!pending.isCompleted) {
        pending.completeError(StateError('QuickJS $description'));
      }
    }
    _pending.clear();
  }

  Future<void> _handleFetch(
    String id,
    String url,
    String method,
    Map<String, String> headers,
  ) async {
    if (_config.fetchHandler != null) {
      await _config.fetchHandler!(id, url, method, headers);
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

  Future<void> _handleExec(String id, String cmd) async {
    await _config.execHandler?.call(id, cmd);
  }

  Future<void> _handleOpenUrl(String id, String url) async {
    if (_config.openUrlHandler != null) {
      await _config.openUrlHandler!(id, url);
      return;
    }
    await defaultVmOpenUrlHandler(id, url, _bridge.resolveCallback);
  }

  void _handleLog(String message) {
    debugPrint('[JsWidget:${_config.widgetId}] $message');
    appendQuickjsLog(message);
    _config.onLog?.call(message);
  }
}

Future<void> _quickJsWorkerMain(SendPort mainPort) async {
  final commands = ReceivePort();
  mainPort.send({'type': 'port', 'port': commands.sendPort});
  final worker = _QuickJsWorker(mainPort);
  await for (final raw in commands) {
    if (raw is! Map) continue;
    if (raw['type'] == 'shutdown') {
      // Ack BEFORE closing: JS_FreeRuntime of a large widget heap (MBs of
      // three bundle + scene) can take seconds, and the main isolate only
      // needs to know the worker will run NO further evals — which is
      // guaranteed the moment the shutdown command is dequeued. Closing
      // still happens here (clean exit), just off the ack's critical path.
      mainPort.send(const {'type': 'shutdown'});
      worker.close();
      return;
    }
    try {
      worker.handle(raw);
    } catch (error) {
      worker.sendError(raw['request'] as int?, error);
    }
  }
}

final class _QuickJsWorker {
  _QuickJsWorker(this._mainPort);

  final SendPort _mainPort;
  QuickjsRuntime? _runtime;
  var _generation = 0;

  void close() => _runtime?.close();

  void handle(Map<dynamic, dynamic> raw) {
    switch (raw['type']) {
      case 'run':
        _run(raw);
        _sendDone(raw['request'] as int);
      case 'event':
        _handleEvent(raw);
        _sendDone(raw['request'] as int);
      case 'hostEvent':
        final target = jsonEncode(raw['target']);
        final payload = jsonEncode(raw['payload']);
        _eval(
          'if(typeof __jsrHostEvent==="function")__jsrHostEvent($target,$payload)',
          '<js_widget_host_event>',
        );
      case 'theme':
        final colors = jsonEncode(raw['colors']);
        _eval(
          'jsr.theme=Object.assign(jsr.theme||{},$colors);'
              'if(jsr._onThemeChange)jsr._onThemeChange(jsr.theme)',
          '<js_widget_theme>',
        );
      case 'interval':
        final id = jsonEncode(raw['id']);
        _eval('if(__iv_cbs[$id])__iv_cbs[$id]()', '<js_widget_interval>');
      case 'raf':
        final id = jsonEncode(raw['id']);
        final elapsed = (raw['elapsed'] as num).toInt();
        _eval(
          'if(__raf_cbs[$id]){__raf_cbs[$id]($elapsed);delete __raf_cbs[$id];}',
          '<js_widget_raf>',
        );
      case 'resolve':
        final id = jsonEncode(raw['id']);
        final value = jsonEncode(raw['value']);
        _eval(
          'if(__cbs[$id]){__cbs[$id]($value);delete __cbs[$id];}',
          '<js_widget_resolve>',
        );
    }
  }

  void _run(Map<dynamic, dynamic> raw) {
    _generation = raw['generation'] as int;
    final runtime = QuickjsRuntime();
    _runtime = runtime;
    runtime.registerHostFunction('sendMessage', _sendMessage);
    // The NATIVE bytes lane stays DISABLED in the persistent worker: under
    // sustained per-frame R1 traffic it races the concurrent marker and
    // corrupts the worker isolate's heap (SIGBUS in MarkingVisitor via
    // TransferableTypedData::New, macOS crash report EF53476B). The
    // bootstrap detects a missing __JSR_RAW_BINARY__ and falls back to the
    // b64 JSON lane — slower per frame, but safe.
    const nativeBytes = false;
    runtime.setGlobal('__IID', raw['instanceId']);
    runtime.setGlobal('__JSR_RAW_BINARY__', nativeBytes);
    _mainPort.send({
      'type': 'capabilities',
      'generation': _generation,
      'binary': nativeBytes,
    });
    final theme = jsonEncode(raw['theme']);
    final code =
        '''
$kJsWidgetBootstrap
jsr.theme = Object.assign(jsr.theme || {}, $theme);
(function() {
  try {
${raw['hostBootstrap']}
${raw['widget']}
  } catch(e) {
    jsr.showError('Widget error: ' + (e.message || String(e)));
  }
})();
''';
    _workerEval(runtime, code, '<js_widget_isolate>');
  }

  String? _sendMessage(String argsJson) {
    final args = jsonDecode(argsJson) as List<dynamic>;
    _mainPort.send({
      'type': 'message',
      'generation': _generation,
      'channel': args[0],
      'payload': args[1],
    });
    return null;
  }

  void _handleEvent(Map<dynamic, dynamic> raw) {
    final action = jsonEncode(raw['actionId']);
    final payload = jsonEncode(raw['payload']);
    _eval(
      '(function(){var h=jsr._handler||(typeof handleEvent==="function"?handleEvent:null);'
          'if(h)h($action,$payload);})()',
      '<js_widget_event>',
    );
  }

  void _eval(String code, String filename) {
    _workerEval(_runtime!, code, filename);
  }

  void _sendDone(int request) {
    _mainPort.send({
      'type': 'done',
      'generation': _generation,
      'request': request,
    });
  }

  void sendError(int? request, Object error) {
    _mainPort.send({
      'type': 'error',
      'generation': _generation,
      'request': request,
      'error': error.toString(),
    });
  }
}

void _workerEval(QuickjsRuntime runtime, String code, String filename) {
  final errors = <String?>[];
  runtime.eval(code, filename: filename, errMsg: errors);
  runtime.executePendingJobs();
  if (errors.isNotEmpty && errors.first != null) {
    throw StateError(errors.first!);
  }
}
