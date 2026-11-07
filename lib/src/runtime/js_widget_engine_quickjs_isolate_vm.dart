import 'dart:async';
import 'dart:convert';
import 'dart:isolate';

import 'package:flutter/foundation.dart';
import 'package:js_widget_runtime/src/defaults/vm_default_handlers.dart';
import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_skinning_native.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bootstrap.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bridge.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_backend.dart';
import 'package:js_widget_runtime/src/runtime/quickjs_diagnostics.dart';
import 'package:js_widget_runtime/src/runtime/quickjs_payload.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// Compile-time switch logging (dart-define=JSR_SWITCH_LOG=1). Zero cost
/// when absent; unlike kDebugMode it also works in Release/profile builds,
/// which is where switch latency actually matters.
const _kSwitchLog = bool.fromEnvironment('JSR_SWITCH_LOG');
void _switchLog(String message) {
  if (_kSwitchLog) debugPrint(message);
}

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
          (id, value) => _resolveWithWarmBytes(id, value),
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
  Future<void>? _shutdownInFlight;
  bool _workerStopped = false;
  Completer<void>? _shutdown;
  final Map<int, Completer<void>> _pending = {};
  int _nextRequest = 0;
  int _generation = 0;
  bool _disposed = false;

  /// Grace for the shutdown ack before dispose() gives up waiting and
  /// ORPHANS the worker (never kills it — see [_shutdownWorkerLocked]).
  /// Exposed so tests can shrink the grace to exercise the stuck path fast.
  @visibleForTesting
  static Duration shutdownAckGrace = const Duration(seconds: 10);

  /// One FFI binding per process for the drain-stop probes below. The flag
  /// itself is a process-global atomic inside the bridge, so any instance
  /// sees and flips the same state.
  static final QuickjsFfi? _drainStopFfi = _bindDrainStopFfi();

  static QuickjsFfi? _bindDrainStopFfi() {
    if (!QuickjsFfi.isAvailable) return null;
    try {
      final ffi = QuickjsFfi();
      return ffi.hasDrainStop ? ffi : null;
    } catch (_) {
      return null;
    }
  }

  /// Whether the loaded bridge exports `qjs_request_drain_stop` (the
  /// cooperative drain stop the app-exit fix depends on). Suites that need
  /// the flag skip with an explanation when this is false.
  @visibleForTesting
  static bool get debugDrainStopSupported => _drainStopFfi != null;

  @visibleForTesting
  static bool get debugDrainStopRequested =>
      _drainStopFfi?.drainStopRequested ?? false;

  @visibleForTesting
  static void debugSetDrainStop({required bool active}) {
    final ffi = _drainStopFfi;
    if (ffi == null) return;
    if (active) {
      ffi.requestDrainStop();
    } else {
      ffi.clearDrainStop();
    }
  }

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
    // BOOT PROBE (debug only): wall-clock phases of a module switch.
    final runSw = Stopwatch()..start();
    await dispose();
    final disposeMs = runSw.elapsedMilliseconds;
    _disposed = false;
    // dispose() above ended the RAF lane permanently (late-request drop
    // guard); this run's widget needs frames again — revive the lane while
    // keeping the full worker teardown the dispose did.
    _bridge.resetForRun();
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
      _switchLog(
        'JSBOOT main id=${_config.instanceId ?? _config.widgetId}: '
        'dispose=${disposeMs}ms workerSpawn+evalAck='
        '${runSw.elapsedMilliseconds - disposeMs}ms widgetBytes='
        '${widgetJs.length}',
      );
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
    // Ordering invariant (crash 2026-11-03 13:49): stop the worker's
    // pending-job drain FIRST (drain stop armed inside _shutdownWorkerLocked
    // before the 'shutdown' message is queued), THEN resolve the handshake.
    // The worker stops touching Dart receivers within ~one queued job even
    // mid-drain, which is what VM teardown needs.
    //
    // The worker is never killed while it may be inside native eval code:
    // a mid-native kill corrupts the shared FFI callback registry (SIGSEGV
    // in the main isolate's concurrent marker, or dart::FfiCallbackThreadChecks
    // SIGABRT on the next engine). A worker that misses the ack grace is
    // ORPHANED instead: its ports are closed so later messages are dropped,
    // generation guards protect the replacement engine, and the orphan
    // drains its current eval, processes the queued shutdown, closes its
    // runtime and exits by itself.
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
  /// take many seconds when several modules boot concurrently). When the
  /// ack misses the grace the worker is ORPHANED, never killed: killing
  /// rips the isolate apart with qjs_dispatch /
  /// DLRT_GetFfiCallbackMetadata on the C stack, corrupting the shared FFI
  /// callback registry; the concurrent GC marker then walks a torn native
  /// transition frame and SIGSEGVs (marker.cc), or the next engine trips
  /// dart::FfiCallbackThreadChecks and SIGABRTs (rapid sidebar clicking
  /// crashes, SIGABRT 2026-11-02). An orphan is safe: its main-side ports
  /// are closed by dispose() so further messages are dropped, generation
  /// guards protect the replacement engine, and the worker drains its
  /// eval, processes the queued shutdown, closes its runtime and exits.
  /// The ONLY remaining kill is the spawn-handshake path in _startWorker
  /// (no 'run' was ever sent, so no runtime / FFI callbacks exist yet).
  Future<void> _shutdownWorker() async {
    // Idempotent: a second dispose() on an already-stopped backend must NOT
    // send another 'shutdown' into the (exiting) isolate — the ack would
    // never arrive and the grace timeout would stall the engine lifecycle
    // (observed as the 10-second module switch hang, fixed in 3e4fc7a).
    if (_workerStopped) return;
    if (_shutdownInFlight != null) return await _shutdownInFlight;
    final isolate = _isolate;
    final commands = _commands;
    if (isolate == null || commands == null) return;
    final done = _shutdownWorkerLocked(isolate, commands).then((_) {
      _workerStopped = true;
    });
    _shutdownInFlight = done;
    try {
      await done;
    } finally {
      _shutdownInFlight = null;
    }
  }

  Future<void> _shutdownWorkerLocked(Isolate isolate, SendPort commands) async {
    final shutdown = Completer<void>();
    _shutdown = shutdown;
    final sw2 = Stopwatch()..start();
    // App-exit race (crash 2026-11-03 13:49): a worker inside a pending-job
    // drain cannot see the queued 'shutdown' for seconds (up to 100k promise
    // reactions, each entering an FFI trampoline) while VM teardown invalidates
    // every receiver it touches. Arm the process-global cooperative drain stop
    // BEFORE queuing the message: both qjs_execute_pending_jobs* loops return
    // early (remaining jobs stay pending and are freed by close()), so the
    // worker reaches 'shutdown' within ~one job. Bridges without the export
    // degrade to the plain handshake below.
    debugSetDrainStop(active: true);
    try {
      commands.send(const {'type': 'shutdown'});
      final acked = shutdown.future
          .then((_) => true)
          .timeout(shutdownAckGrace, onTimeout: () => false);
      final ack = await acked;
      _switchLog(
        'JSSHUT id=${_config.instanceId ?? _config.widgetId} '
        'acked=$ack ms=${sw2.elapsedMilliseconds}',
      );
      if (ack == true) {
        // The worker dequeued 'shutdown': it will run NO further evals, so
        // the bridge can be disposed immediately. Its JS_FreeRuntime may
        // still be unwinding on the worker thread — do NOT kill the
        // isolate now (same mid-native-call hazard as killing mid-eval);
        // it exits by itself once close() finishes.
        return;
      }
      // Stuck worker (infinite JS loop / eval outliving the grace):
      // ORPHAN it. Never kill here — see the doc comment above.
    } finally {
      // The flag is process-global: a leaked arm would freeze every other
      // engine's drains. The orphan (if any) has already been instructed to
      // shut down; whatever it still evaluates is plain JS (not a job
      // drain) and finishes on its own.
      debugSetDrainStop(active: false);
    }
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
    final payload = raw['payload'];
    final pLen = payload is String
        ? payload.length
        : payload is Uint8List
        ? payload.length
        : -1;
    final sw = Stopwatch()..start();
    unawaited(
      _bridge
          .dispatch(channel, unwrapQuickjsPayload(payload, channel))
          .whenComplete(() {
            if (pLen > 200000 || sw.elapsedMilliseconds > 50) {
              debugPrint(
                '[lane-prof] <-$channel len=$pLen '
                'dispatch=${sw.elapsedMilliseconds}ms',
              );
            }
          }),
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

  /// Base64 payloads at or above this size cross to the worker as raw typed
  /// data instead of a base64 string literal (QuickJS parses a 20MB JS
  /// literal in ~3.4s measured; the same bytes ride the port in ~10ms).
  static const int _kWarmBytesMinB64 = 256 * 1024;

  /// Resolve fast lane: big base64 host-call results (three.asset GLBs,
  /// decoded RGBA textures) are decoded ONCE here and shipped as raw
  /// [Uint8List] next to the resolve message. The worker's 'resolve'
  /// handler rebuilds `{..value, bytes: Uint8Array}` via the registered
  /// `__jsrWarmFill` bytes host function — the three runtime accepts a
  /// `bytes` typed array straight through (`hr()` passes it unmodified),
  /// so no base64 string literal is ever parsed or decoded in QuickJS.
  /// Engines with their own resolveCallback and all small payloads keep
  /// the exact previous behavior.
  void _resolveWithWarmBytes(String id, Object? value) {
    if (value is Map &&
        value['data'] is String &&
        (value['data'] as String).length >= _kWarmBytesMinB64) {
      final bytes = base64Decode(value['data'] as String);
      final lite = <String, dynamic>{...value}..remove('data');
      _post({'type': 'resolve', 'id': id, 'value': lite, 'warmBytes': bytes});
      return;
    }
    _post({'type': 'resolve', 'id': id, 'value': value});
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

  /// Resolve ids whose raw bytes arrived with the resolve message and are
  /// waiting for the JS `__jsrWarmFill` pull (see [_run]).
  final Map<String, Uint8List> _warmPending = {};

  void close() {
    _runtime?.close();
    _runtime = null;
  }

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
        _handleResolve(raw);
    }
  }

  void _handleResolve(Map<dynamic, dynamic> raw) {
    final id = jsonEncode(raw['id']);
    final rsw = Stopwatch()..start();
    final value = jsonEncode(raw['value']);
    _profileResolve(rsw, 'jsonEncode', value.length);
    final esw = Stopwatch()..start();
    final warm = raw['warmBytes'];
    final runtime = _runtime;
    if (warm is Uint8List &&
        warm.isNotEmpty &&
        runtime != null &&
        runtime.hasBytesFn) {
      // Warm lane: raw bytes ride the port; the eval only carries the
      // small metadata literal plus the size, and __jsrWarmResolve
      // pulls the bytes through the __jsrWarmFill host function.
      _warmPending[raw['id'] as String] = warm;
      _eval(
        '__jsrWarmResolve($id,$value,${warm.length})',
        '<js_widget_resolve_warm>',
      );
      _profileResolve(esw, 'eval', value.length);
    } else if (warm is Uint8List &&
        warm.isNotEmpty &&
        value.length < 200000) {
      // Legacy engines without the bytes export re-encode to the
      // previous inline-base64 literal path; like the historical `break`,
      // it skips the eval-time profile line below.
      final restored = Map<String, dynamic>.from(raw['value'] as Map);
      restored['data'] = base64Encode(warm);
      _eval(
        'if(__cbs[$id]){__cbs[$id](${jsonEncode(restored)});delete __cbs[$id];}',
        '<js_widget_resolve>',
      );
    } else {
      _eval(
        'if(__cbs[$id]){__cbs[$id]($value);delete __cbs[$id];}',
        '<js_widget_resolve>',
      );
      _profileResolve(esw, 'eval', value.length);
    }
  }

  void _profileResolve(Stopwatch sw, String stage, int length) {
    if (length <= 200000) return;
    debugPrint(
      '[lane-prof] resolve $stage=${sw.elapsedMilliseconds}ms len=$length',
    );
  }

  void _run(Map<dynamic, dynamic> raw) {
    // BOOT PROBE (debug only): QuickJS runtime creation + full widget eval
    // (prepared widgets inline the whole three bundle — ~600KB per module).
    final sw = Stopwatch()..start();
    _generation = raw['generation'] as int;
    final runtime = QuickjsRuntime();
    final createMs = sw.elapsedMilliseconds;
    // A replaced runtime (this worker saw two 'run' commands without a
    // shutdown in between) must be CLOSED, not dropped: dropping leaks the
    // whole QuickJS heap and leaves its registered host callbacks alive.
    final replaced = _runtime;
    if (replaced != null) {
      replaced.close();
    }
    _runtime = runtime;
    runtime.registerHostFunction('sendMessage', _sendMessage);
    // The NATIVE bytes lane stays DISABLED in the persistent worker: under
    // sustained per-frame R1 traffic it races the concurrent marker and
    // corrupts the worker isolate's heap (SIGBUS in MarkingVisitor via
    // TransferableTypedData::New, macOS crash report EF53476B). The
    // bootstrap detects a missing __JSR_RAW_BINARY__ and falls back to the
    // b64 JSON lane — slower per frame, but safe.
    const nativeBytes = false;
    // CPU skining + R1 fast lanes: registerHostBytesFn (qjs_register_bytes_fn)
    // is a different mechanism from the disabled TransferableTypedData lane
    // above — the C bridge hands the callback a call-scoped view of the
    // QuickJS-owned bytes and the callback runs synchronously on THIS isolate.
    // (1) three.skin: the R1 renderer's _applySkining hands over (bone
    //     matrices, indices, weights, bind pose) and reads the skinned
    //     positions/normals back IN PLACE; without it a 16k-vertex rig
    //     spends ~14ms/frame in the QuickJS per-vertex loop.
    // (2) __jsrSendBytes: the bootstrap's native-lane branch routes per-frame
    //     R1 envelopes (name, bytes) here — zero b64, zero JSON. The view is
    //     call-scoped, so it is COPIED before crossing the port back to the
    //     main isolate (plain SendPort.send of an owned copy — the transfer
    //     variant is what raced the marker above). The b64 lane measured
    //     ~40ms/frame just to encode an 868KB envelope in QuickJS; the copy
    //     crossing the port costs well under a millisecond.
    if (runtime.hasBytesFn) {
      runtime.registerHostBytesFn('__jsrSkinBytes', (name, data) {
        if (name == 'three.skin') applyThreeSkinningPacket(data);
      });
      runtime.registerHostBytesFn('__jsrSendBytes', (name, data) {
        _mainPort.send({
          'type': 'binary',
          'generation': _generation,
          'name': name,
          'bytes': Uint8List.fromList(data),
        });
      });
      // Warm-asset resolve lane: JS preallocates the array and this fills
      // the call-scoped view from the bytes that crossed with the resolve
      // message — no base64 literal is ever parsed in QuickJS. See
      // _resolveWithWarmBytes on the main isolate and __jsrWarmResolve in
      // the bootstrap.
      runtime.registerHostBytesFn('__jsrWarmFill', (name, data) {
        final pending = _warmPending.remove(name);
        if (pending == null || data.isEmpty) return;
        data.setRange(
          0,
          pending.length < data.length ? pending.length : data.length,
          pending,
        );
      });
    }
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
    if (kDebugMode || _kSwitchLog) {
      debugPrint(
        'JSBOOT worker id=${raw['instanceId']}: '
        'runtimeCreate=${createMs}ms '
        'widgetEval=${sw.elapsedMilliseconds - createMs}ms',
      );
    }
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
