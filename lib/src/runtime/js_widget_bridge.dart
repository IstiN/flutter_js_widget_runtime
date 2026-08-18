import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';

import 'package:js_widget_runtime/src/renderer/nodes/js_3d_host.dart';

/// Callback invoked to check whether a capability is allowed.
/// Capabilities: 'fetch', 'storage', 'secrets', 'exec'.
typedef JsPermissionChecker = bool Function(String capability);

/// Callback used by the bridge to return async values to the JS runtime.
typedef JsResolveCallback = void Function(String id, dynamic value);

/// Callback for an HTTP request initiated by `jsr.fetchJson`.
typedef JsFetchHandler =
    Future<void> Function(
      String id,
      String url,
      String method,
      Map<String, String> headers,
    );

/// Callback for `jsr.secrets.get(key)`.
typedef JsSecretsReadHandler = Future<void> Function(String id, String key);

/// Callback for `jsr.secrets.set(key, value)`.
typedef JsSecretsWriteHandler =
    Future<void> Function(String id, String key, dynamic value);

/// Callback for `jsr.loadAsset(path)`.
typedef JsLoadAssetHandler = Future<void> Function(String id, String path);

/// Callback for `jsr.exec(cmd)`.
typedef JsExecHandler = Future<void> Function(String id, String cmd);

/// Callback invoked when a Dart-backed interval fires.
typedef JsIntervalTickHandler = void Function(String id);

/// Callback invoked when a Dart-backed animation frame fires.
typedef JsRafTickHandler = void Function(String id, int elapsedMs);

/// Shared bridge logic for the JS widget engine.
///
/// Both the VM ([flutter_js]) and web (Worker/iframe) engines use this class
/// to handle the `jsr.*` API surface: render, storage, timers, secrets,
/// fetch, exec, exportState and event completion. Platform-specific I/O
/// (network, secure storage, file system, process execution) is injected via
/// callbacks so the bridge stays testable on any platform.
class JsWidgetBridge {
  JsWidgetBridge({
    required this.widgetId,
    required this.onRender,
    required this.onSetTitle,
    required this.onStorageUpdate,
    required this.onLog,
    required this.isDisposed,
    this.appDir,
    this.isPermissionAllowed = _allowAll,
    required this.resolveCallback,
    required this.fetchHandler,
    required this.secretsGetHandler,
    required this.secretsSetHandler,
    required this.loadAssetHandler,
    required this.execHandler,
    required this.intervalTickHandler,
    required this.rafTickHandler,
    this.js3dHost,
    required Map<String, dynamic> initialStorage,
  }) {
    _store = JsStorageChannel(initialStorage: initialStorage);
    _store.storageRead = (id, key) => resolveCallback(id, _store.storage[key]);
    _store.storageChanged = onStorageUpdate;
    _store.parseFallback = _parseArgs;
    _raf.onTick = (id, ms) => rafTickHandler(id, ms);
    _raf.shouldStop = isDisposed;
    // Read the (mutable) handler fields on every tick: engines rewire them
    // after construction (see QuickjsWidgetEngineBackend._setupBridges).
    _intervals.onTick = (id) => intervalTickHandler(id);
    _intervals.shouldStop = isDisposed;
  }

  static bool _allowAll(String _) => true;

  final String widgetId;
  final void Function(Map<String, dynamic> tree) onRender;
  final void Function(String title) onSetTitle;
  final void Function(Map<String, dynamic> storage) onStorageUpdate;
  final void Function(String log) onLog;
  final bool Function() isDisposed;
  final String? appDir;
  final JsPermissionChecker isPermissionAllowed;
  JsResolveCallback resolveCallback;
  JsFetchHandler fetchHandler;
  JsSecretsReadHandler secretsGetHandler;
  JsSecretsWriteHandler secretsSetHandler;
  JsLoadAssetHandler loadAssetHandler;
  JsExecHandler execHandler;
  JsIntervalTickHandler intervalTickHandler;
  JsRafTickHandler rafTickHandler;
  Js3dHost? js3dHost;

  late final JsStorageChannel _store;
  final Map<String, Js3dController> _sceneControllers = {};

  final JsIntervalScheduler _intervals = JsIntervalScheduler();
  final JsRafScheduler _raf = JsRafScheduler();
  Completer<void>? _eventCompleter;

  /// Last structured state exported via `jsr.exportState(...)`.
  Map<String, dynamic>? get exportedState => _store.exportedState;

  /// Returns the JS snippet used to update the widget theme.
  static String updateThemeJs(Map<String, dynamic> colors) {
    return 'jsr.theme=${jsonEncode(colors)};'
        'if(jsr._onThemeChange){try{jsr._onThemeChange(jsr.theme);}catch(e){}}';
  }

  /// Dispatches a message coming from the JS runtime.
  Future<void> dispatch(String channel, dynamic payload) async {
    if (isDisposed()) return;
    final asyncHandler = _asyncChannelHandlers[channel];
    if (asyncHandler != null) {
      await asyncHandler(payload);
      return;
    }
    _syncChannelHandlers[channel]?.call(payload);
  }

  /// Fire-and-forget `__jsr_*` channels — handled inline in [dispatch].
  late final Map<String, void Function(dynamic)> _syncChannelHandlers = {
    '__jsr_render': _handleRender,
    '__jsr_storage_get': _handleStorageGet,
    '__jsr_storage_set': _handleStorageSet,
    '__jsr_set_title': _handleSetTitle,
    '__jsr_event_done': _handleEventDone,
    '__jsr_export_state': _handleExportState,
    '__jsr_log': _handleLog,
    '__jsr_set_interval': _handleSetInterval,
    '__jsr_clear_interval': _handleClearInterval,
    '__jsr_raf': _handleRaf,
    '__jsr_caf': _handleCaf,
    '__jsr_scene3d_command': _handleScene3dCommand,
  };

  /// Channels whose result must be awaited by [dispatch].
  late final Map<String, Future<void> Function(dynamic)>
      _asyncChannelHandlers = {
        '__jsr_fetch': _handleFetch,
        '__jsr_secrets_get': _handleSecretsGet,
        '__jsr_secrets_set': _handleSecretsSet,
        '__jsr_load_asset': _handleLoadAsset,
        '__jsr_exec': _handleExec,
      };

  /// Serializes [callEvent] invocations so rapid-fire gestures (tap-down,
  /// tap-up, tap) complete in order. Previously a stale `__jsr_event_done`
  /// completed the *next* event's completer early and the following
  /// callEvent crashed with "Future already completed", wedging the bridge
  /// for every subsequent event (dead buttons in gesture-heavy widgets).
  bool _eventInFlight = false;
  Future<void> _eventChain = Future<void>.value();

  /// Runs [send] and waits until the JS event handler signals completion.
  ///
  /// The idle path starts synchronously (async functions run up to the first
  /// await inline), so a done signaled right after callEvent still finds its
  /// completer; subsequent events queue behind [_eventChain].
  Future<void> callEvent(void Function() send) {
    // Safety: if _eventInFlight is stuck true from a previous dispose/restart
    // cycle (bridge.dispose() completes the completer but may not reset the
    // flag if dispose happened between _runEvent start and finally), reset it.
    if (_eventCompleter == null) {
      _eventInFlight = false;
    }
    if (!_eventInFlight) {
      _eventInFlight = true;
      final future = _runEvent(send);
      _eventChain = future.catchError((_) {});
      return future;
    }
    final future = _eventChain.then((_) {
      _eventInFlight = true;
      return _runEvent(send);
    });
    // Keep the queue alive even if one event fails or times out.
    _eventChain = future.catchError((_) {});
    return future;
  }

  Future<void> _runEvent(void Function() send) async {
    if (isDisposed()) {
      _eventInFlight = false;
      return;
    }
    final completer = Completer<void>();
    _eventCompleter = completer;
    try {
      send();
      await completer.future.timeout(
        const Duration(seconds: 5),
        onTimeout: () {
          debugPrint('[JsWidgetBridge] callEvent timeout');
        },
      );
    } finally {
      if (identical(_eventCompleter, completer)) {
        _eventCompleter = null;
      }
      _eventInFlight = false;
    }
  }

  /// Releases all timers, tickers and 3D scene controllers owned by the bridge.
  void dispose() {
    _intervals.dispose();
    _raf.dispose();
    for (final controller in _sceneControllers.values) {
      controller.dispose();
    }
    _sceneControllers.clear();
    final pending = _eventCompleter;
    _eventCompleter = null;
    if (pending != null && !pending.isCompleted) {
      pending.complete();
    }
  }

  /// Test seam: stops interval timers and the RAF ticker without disposing
  /// scene controllers (see QuickjsWidgetEngineBackend.debugStopTimers).
  @visibleForTesting
  void debugStopTimers() {
    _intervals.dispose();
    _raf.dispose();
  }

  Map<String, dynamic> _parseArgs(dynamic args) => (args is Map)
      ? Map<String, dynamic>.from(args)
      : jsonDecode(args?.toString() ?? '{}') as Map<String, dynamic>;

  void _handleRender(dynamic args) {
    try {
      final tree = _parseArgs(args);
      onRender(tree);
    } catch (e) {
      debugPrint('[JsWidgetBridge] render error: $e');
    }
  }

  Future<void> _handleFetch(dynamic args) async {
    final req = _parseArgs(args);
    final id = req['id'] as String;
    if (!isPermissionAllowed('fetch')) {
      resolveCallback(id, {
        '__error': 'fetchJson is disabled in Settings → Apps & Widgets',
      });
      return;
    }
    final url = req['url'] as String;
    final method = (req['method'] as String? ?? 'GET').toUpperCase();
    final headers = (req['headers'] as Map?)?.cast<String, String>() ?? {};
    await fetchHandler(id, url, method, headers);
  }

  void _handleStorageGet(dynamic args) {
    if (!isPermissionAllowed('storage')) {
      final req = _parseArgs(args);
      resolveCallback(
        req['id'] as String,
        {'__error': 'storage is disabled in Settings → Apps & Widgets'},
      );
      return;
    }
    _store.handleGet(_parseArgs(args));
  }

  void _handleStorageSet(dynamic args) {
    if (!isPermissionAllowed('storage')) return;
    _store.handleSet(_parseArgs(args));
  }

  void _handleSetTitle(dynamic title) {
    onSetTitle(title?.toString() ?? '');
  }

  void _handleEventDone(dynamic args) {
    final ec = _eventCompleter;
    if (ec != null && !ec.isCompleted) {
      ec.complete();
    }
    // Don't null _eventCompleter here — _runEvent's finally block handles that.
    // Nulling here caused a race: on macOS (merged thread), the JSC bridge
    // callback could fire DURING rt.evaluate() inside send(), processing the
    // event_done microtask before send() returned. The _runEvent finally
    // would then see _eventCompleter already null and skip completing it.
  }

  void _handleExportState(dynamic args) => _store.handleExportState(args);

  void _handleLog(dynamic args) {
    onLog(args?.toString() ?? '');
  }

  void _handleSetInterval(dynamic args) {
    final req = _parseArgs(args);
    _intervals.schedule(
      req['id'] as String,
      (req['ms'] as num?)?.toInt() ?? 1000,
      once: req['once'] == true,
    );
  }

  void _handleClearInterval(dynamic id) {
    _intervals.cancel(id?.toString() ?? '');
  }

  void _handleRaf(dynamic args) {
    final req = _parseArgs(args);
    _raf.requestFrame(req['id'] as String);
  }

  void _handleCaf(dynamic id) {
    _raf.cancelFrame(id?.toString() ?? '');
  }

  Future<void> _handleSecretsGet(dynamic args) async {
    final req = _parseArgs(args);
    final id = req['id'] as String;
    if (!isPermissionAllowed('secrets')) {
      resolveCallback(id, {
        '__error': 'secrets is disabled in Settings → Apps & Widgets',
      });
      return;
    }
    await secretsGetHandler(id, req['key'] as String);
  }

  Future<void> _handleSecretsSet(dynamic args) async {
    final req = _parseArgs(args);
    final id = req['id'] as String;
    if (!isPermissionAllowed('secrets')) {
      resolveCallback(id, false);
      return;
    }
    await secretsSetHandler(id, req['key'] as String, req['value']);
  }

  Future<void> _handleLoadAsset(dynamic args) async {
    final req = _parseArgs(args);
    final id = req['id'] as String;
    final assetPath = req['path'] as String? ?? '';
    await loadAssetHandler(id, assetPath);
  }

  Future<void> _handleExec(dynamic args) async {
    final req = _parseArgs(args);
    final id = req['id'] as String;
    final cmd = req['cmd'] as String? ?? '';
    await execHandler(id, cmd);
  }

  void _handleScene3dCommand(dynamic args) {
    final host = js3dHost;
    if (host == null) {
      debugPrint('[JsWidgetBridge] scene3d command ignored: no Js3dHost set');
      return;
    }
    final req = _parseArgs(args);
    final kind = req['kind'] as String? ?? '';
    final sceneId = req['sceneId'] as String? ?? '';
    if (sceneId.isEmpty) {
      debugPrint('[JsWidgetBridge] scene3d command ignored: missing sceneId');
      return;
    }
    _dispatchScene3dCommand(host, kind, sceneId, req);
  }

  void _dispatchScene3dCommand(
    Js3dHost host,
    String kind,
    String sceneId,
    Map<String, dynamic> req,
  ) {
    switch (kind) {
      case 'create':
        _sceneControllers[sceneId]?.dispose();
        _sceneControllers[sceneId] = host.createController(
          sceneId,
          (req['payload'] as Map? ?? {}).cast<String, dynamic>(),
        );
      case 'destroy':
        _sceneControllers.remove(sceneId)?.dispose();
      case 'setTransforms':
        // Batched transforms: fan out one message into per-model setTransform
        // commands so hosts only implement a single mutation path.
        _fanOutSetTransforms(sceneId, req['payload']);
      default:
        _applyScene3dModelCommand(kind, sceneId, req['payload']);
    }
  }

  void _fanOutSetTransforms(String sceneId, dynamic payload) {
    final controller = _sceneControllers[sceneId];
    if (controller == null) return;
    final items = ((payload as Map?)?['items'] as List?) ?? const [];
    for (final item in items) {
      if (item is! Map) continue;
      final m = item.cast<String, dynamic>();
      controller.apply(
        Js3dCommand(
          kind: 'setTransform',
          sceneId: sceneId,
          modelId: m['modelId'] as String?,
          payload: m,
        ),
      );
    }
  }

  void _applyScene3dModelCommand(
    String kind,
    String sceneId,
    dynamic payload,
  ) {
    if (!_modelCommandKinds.contains(kind)) {
      debugPrint('[JsWidgetBridge] unknown scene3d command: $kind');
      return;
    }
    _applyScene3dToController(kind, sceneId, payload);
  }

  static const Set<String> _modelCommandKinds = {
    'addModel',
    'removeModel',
    'setTransform',
    'playAnimation',
    'stopAnimation',
    'setCamera',
    'setLight',
  };

  void _applyScene3dToController(
    String kind,
    String sceneId,
    dynamic payload,
  ) {
    final controller = _sceneControllers[sceneId];
    if (controller == null) return;
    final p = (payload as Map? ?? {}).cast<String, dynamic>();
    controller.apply(
      Js3dCommand(
        kind: kind,
        sceneId: sceneId,
        modelId: p['modelId'] as String?,
        payload: p,
      ),
    );
  }
}



/// `jsr.storage` / `jsr.exportState` channel state: the persistent storage
/// map and the last exported state snapshot.
class JsStorageChannel {
  JsStorageChannel({required Map<String, dynamic> initialStorage})
    : storage = Map<String, dynamic>.from(initialStorage);

  final Map<String, dynamic> storage;
  Map<String, dynamic>? _exportedState;

  Map<String, dynamic>? get exportedState => _exportedState == null
      ? null
      : Map<String, dynamic>.from(_exportedState!);

  void handleGet(Map<String, dynamic> req) {
    final id = req['id'] as String;
    final key = req['key'] as String;
    storageRead(id, key);
  }

  void handleSet(Map<String, dynamic> req) {
    storage[req['key'] as String] = req['value'];
    storageChanged(Map<String, dynamic>.from(storage));
  }

  void handleExportState(dynamic args) {
    try {
      _exportedState = args is Map
          ? Map<String, dynamic>.from(args)
          : Map<String, dynamic>.from(parseFallback(args));
    } catch (_) {
      _exportedState = null;
    }
  }

  /// Wired by the bridge: parses non-map payloads into a map
  /// (JSON-encoded channel arguments).
  dynamic Function(dynamic) parseFallback = (_) => const {};

  /// Wired by the bridge: resolves the JS promise for a storage read.
  void Function(String id, String key) storageRead = (_, __) {};
  /// Wired by the bridge: notifies the host about a storage write.
  void Function(Map<String, dynamic>) storageChanged = (_) {};
}

/// Drives `setTimeout`/`setInterval` callbacks: one timer per id, replaced
/// on re-schedule, stopped on dispose.
class JsIntervalScheduler {
  JsIntervalScheduler({this.onTick, this.shouldStop});

  /// Fires `(id)` when a timer elapses.
  void Function(String id)? onTick;
  /// Whether the owning bridge is disposed (skips firing).
  bool Function()? shouldStop;

  final _timers = <String, Timer>{};

  void schedule(String id, int ms, {bool once = false}) {
    final duration = Duration(milliseconds: ms);
    _timers[id]?.cancel();
    if (once) {
      _timers[id] = Timer(duration, () {
        _timers.remove(id);
        if (shouldStop?.call() ?? false) return;
        onTick?.call(id);
      });
    } else {
      _timers[id] = Timer.periodic(duration, (_) {
        if (shouldStop?.call() ?? false) return;
        onTick?.call(id);
      });
    }
  }

  void cancel(String id) {
    _timers[id]?.cancel();
    _timers.remove(id);
  }

  void dispose() {
    for (final t in _timers.values) {
      t.cancel();
    }
    _timers.clear();
  }
}

/// Drives `requestAnimationFrame` callbacks through a [Ticker]: frames are
/// requested by id, fired once per tick in registration order, and the
/// ticker stops itself when no frames are pending.
class JsRafScheduler {
  JsRafScheduler({this.onTick, this.shouldStop});

  /// Fires `(id, elapsedMs)` for each requested frame.
  void Function(String id, int elapsedMs)? onTick;
  /// Whether the owning bridge is disposed (stops the ticker).
  bool Function()? shouldStop;

  Ticker? _ticker;
  final _pending = <String, bool>{};

  void requestFrame(String id) {
    _pending[id] = true;
    _ensureTicker();
  }

  void cancelFrame(String id) {
    _pending.remove(id);
    if (_pending.isEmpty) _ticker?.stop();
  }

  void dispose() {
    _ticker?.dispose();
    _ticker = null;
    _pending.clear();
  }

  void _ensureTicker() {
    final existing = _ticker;
    if (existing != null) {
      if (!existing.isTicking) existing.start();
      return;
    }
    _ticker = Ticker(_onTick)..start();
  }

  void _onTick(Duration elapsed) {
    if ((shouldStop?.call() ?? false) || _pending.isEmpty) {
      _ticker?.stop();
      return;
    }
    final ms = elapsed.inMilliseconds;
    final ids = List<String>.from(_pending.keys);
    _pending.clear();
    for (final id in ids) {
      onTick?.call(id, ms);
    }
  }
}
