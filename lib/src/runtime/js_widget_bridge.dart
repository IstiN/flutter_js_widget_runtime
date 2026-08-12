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
  }) : _storage = Map<String, dynamic>.from(initialStorage);

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

  final Map<String, dynamic> _storage;
  final Map<String, Js3dController> _sceneControllers = {};
  Map<String, dynamic>? _exportedState;
  final Map<String, Timer> _intervals = {};
  Ticker? _rafTicker;
  final Map<String, bool> _rafCallbacks = {};
  Completer<void>? _eventCompleter;

  /// Last structured state exported via `jsr.exportState(...)`.
  Map<String, dynamic>? get exportedState => _exportedState == null
      ? null
      : Map<String, dynamic>.from(_exportedState!);

  /// Returns the JS snippet used to update the widget theme.
  static String updateThemeJs(Map<String, dynamic> colors) {
    return 'jsr.theme=${jsonEncode(colors)};'
        'if(jsr._onThemeChange){try{jsr._onThemeChange(jsr.theme);}catch(e){}}';
  }

  /// Dispatches a message coming from the JS runtime.
  Future<void> dispatch(String channel, dynamic payload) async {
    if (channel == '__jsr_event_done') {
      debugPrint('[WidgetEvent] dispatch __jsr_event_done: isDisposed=${isDisposed()} hasCompleter=${_eventCompleter != null}');
    }
    if (isDisposed()) return;
    switch (channel) {
      case '__jsr_render':
        _handleRender(payload);
      case '__jsr_fetch':
        await _handleFetch(payload);
      case '__jsr_storage_get':
        _handleStorageGet(payload);
      case '__jsr_storage_set':
        _handleStorageSet(payload);
      case '__jsr_set_title':
        _handleSetTitle(payload);
      case '__jsr_event_done':
        _handleEventDone(payload);
      case '__jsr_export_state':
        _handleExportState(payload);
      case '__jsr_log':
        _handleLog(payload);
      case '__jsr_set_interval':
        _handleSetInterval(payload);
      case '__jsr_clear_interval':
        _handleClearInterval(payload);
      case '__jsr_raf':
        _handleRaf(payload);
      case '__jsr_caf':
        _handleCaf(payload);
      case '__jsr_secrets_get':
        await _handleSecretsGet(payload);
      case '__jsr_secrets_set':
        await _handleSecretsSet(payload);
      case '__jsr_load_asset':
        await _handleLoadAsset(payload);
      case '__jsr_exec':
        await _handleExec(payload);
      case '__jsr_scene3d_command':
        _handleScene3dCommand(payload);
    }
  }

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
    // A queued event can reach here after the engine was torn down: dispose()
    // completes the in-flight completer, which drains the queue. Never send
    // into a dead runtime — on the flutter_js backend that is a
    // use-after-free of the released JSContextGroup (SIGSEGV in JSC).
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
    for (final t in _intervals.values) {
      t.cancel();
    }
    _intervals.clear();
    _rafTicker?.dispose();
    _rafTicker = null;
    _rafCallbacks.clear();
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
    final req = _parseArgs(args);
    final id = req['id'] as String;
    if (!isPermissionAllowed('storage')) {
      resolveCallback(id, {
        '__error': 'storage is disabled in Settings → Apps & Widgets',
      });
      return;
    }
    final key = req['key'] as String;
    resolveCallback(id, _storage[key]);
  }

  void _handleStorageSet(dynamic args) {
    if (!isPermissionAllowed('storage')) return;
    final req = _parseArgs(args);
    _storage[req['key'] as String] = req['value'];
    onStorageUpdate(Map<String, dynamic>.from(_storage));
  }

  void _handleSetTitle(dynamic title) {
    onSetTitle(title?.toString() ?? '');
  }

  void _handleEventDone(dynamic args) {
    debugPrint('[WidgetEvent] _handleEventDone called, hasCompleter=${_eventCompleter != null}');
    try {
      final decoded = _parseArgs(args);
      if (decoded['error'] != null) {
        debugPrint('[JsWidgetBridge] event error: ${decoded['error']}');
      }
    } catch (_) {}
    final pending = _eventCompleter;
    if (pending != null && !pending.isCompleted) {
      // Take-and-null: a stray or duplicated done must never complete a
      // later event's completer.
      _eventCompleter = null;
      pending.complete();
    }
  }

  void _handleExportState(dynamic args) {
    try {
      _exportedState = args is Map
          ? Map<String, dynamic>.from(args)
          : Map<String, dynamic>.from(_parseArgs(args));
    } catch (_) {
      _exportedState = null;
    }
  }

  void _handleLog(dynamic args) {
    onLog(args?.toString() ?? '');
  }

  void _handleSetInterval(dynamic args) {
    final req = _parseArgs(args);
    final id = req['id'] as String;
    final ms = (req['ms'] as num?)?.toInt() ?? 1000;
    _intervals[id]?.cancel();
    _intervals[id] = Timer.periodic(Duration(milliseconds: ms), (_) {
      if (isDisposed()) return;
      intervalTickHandler(id);
    });
  }

  void _handleClearInterval(dynamic id) {
    final idStr = id?.toString() ?? '';
    _intervals[idStr]?.cancel();
    _intervals.remove(idStr);
  }

  void _handleRaf(dynamic args) {
    final req = _parseArgs(args);
    final id = req['id'] as String;
    _rafCallbacks[id] = true;
    _ensureRafTicker();
  }

  void _handleCaf(dynamic id) {
    final idStr = id?.toString() ?? '';
    _rafCallbacks.remove(idStr);
    if (_rafCallbacks.isEmpty) {
      _rafTicker?.stop();
    }
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
        final payload = (req['payload'] as Map? ?? {}).cast<String, dynamic>();
        final controller = _sceneControllers[sceneId];
        if (controller != null) {
          final items = payload['items'] as List? ?? const [];
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
      case 'addModel':
      case 'removeModel':
      case 'setTransform':
      case 'playAnimation':
      case 'stopAnimation':
      case 'setCamera':
      case 'setLight':
        final payload = (req['payload'] as Map? ?? {}).cast<String, dynamic>();
        final controller = _sceneControllers[sceneId];
        if (controller != null) {
          controller.apply(
            Js3dCommand(
              kind: kind,
              sceneId: sceneId,
              modelId: payload['modelId'] as String?,
              payload: payload,
            ),
          );
        }
      default:
        debugPrint('[JsWidgetBridge] unknown scene3d command: $kind');
    }
  }

  void _ensureRafTicker() {
    if (_rafTicker != null) {
      if (!_rafTicker!.isTicking) _rafTicker!.start();
      return;
    }
    _rafTicker = Ticker((elapsed) {
      if (isDisposed() || _rafCallbacks.isEmpty) {
        _rafTicker?.stop();
        return;
      }
      final ms = elapsed.inMilliseconds;
      final ids = List<String>.from(_rafCallbacks.keys);
      _rafCallbacks.clear();
      for (final id in ids) {
        rafTickHandler(id, ms);
      }
    });
    _rafTicker!.start();
  }
}
