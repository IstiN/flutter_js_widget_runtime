import 'dart:async';
import 'dart:convert';
import 'dart:js_interop';

import 'package:flutter/foundation.dart';
import 'package:web/web.dart' as web;

import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bootstrap.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bridge.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_message.dart';
import 'package:js_widget_runtime/src/defaults/web_default_handlers.dart';

/// Web JS widget engine backed by a dedicated [web.Worker].
///
/// The worker is created from an inline Blob URL so it stays same-origin. The
/// Dart side and the worker communicate via prefixed [JsWidgetMessage] strings
/// over `postMessage`. All I/O is injected via [JsRuntimeConfig].
class JsWidgetEngine {
  JsWidgetEngine({
    required JsRuntimeConfig config,
  }) : _config = config,
       _consoleLogs = [] {
    _bridge = JsWidgetBridge(
      widgetId: config.widgetId,
      onRender: config.onRender,
      onSetTitle: config.onSetTitle,
      onStorageUpdate: config.onStorageUpdate,
      onLog: (msg) => _handleLog(msg),
      isDisposed: () => _disposed,
      appDir: config.appDir,
      isPermissionAllowed: config.isPermissionAllowed ?? _allowAll,
      resolveCallback: config.resolveCallback ?? (id, value) => _resolveCallback(id, value),
      fetchHandler: (id, url, method, headers) => _handleFetch(id, url, method, headers),
      secretsGetHandler: (id, key) async {
        if (_config.secretsGetHandler != null) {
          await _config.secretsGetHandler!.call(id, key);
        }
      },
      secretsSetHandler: (id, key, value) async {
        if (_config.secretsSetHandler != null) {
          await _config.secretsSetHandler!.call(id, key, value);
        }
      },
      loadAssetHandler: (id, path) async {
        if (_config.loadAssetHandler != null) {
          await _config.loadAssetHandler!.call(id, path);
        }
      },
      execHandler: (id, cmd) => _handleExec(id, cmd),
      intervalTickHandler: (id) => _postToWorker('__yoloit_interval_tick', id),
      rafTickHandler: (id, elapsedMs) => _postToWorker(
        '__yoloit_raf_tick',
        {'id': id, 'elapsed': elapsedMs},
      ),
      initialStorage: config.initialStorage,
    );
  }

  static bool _allowAll(String _) => true;

  final JsRuntimeConfig _config;
  late final JsWidgetBridge _bridge;
  web.Worker? _worker;
  JSFunction? _messageHandler;
  Completer<void>? _readyCompleter;
  bool _disposed = false;
  final List<Map<String, dynamic>> _consoleLogs;
  static const int _maxLogs = 200;
  String? _blobUrl;

  List<Map<String, dynamic>> flushLogs() {
    final logs = List<Map<String, dynamic>>.from(_consoleLogs);
    _consoleLogs.clear();
    return logs;
  }

  List<Map<String, dynamic>> peekLogs() =>
      List<Map<String, dynamic>>.from(_consoleLogs);

  Map<String, dynamic>? get exportedState => _bridge.exportedState;

  Future<void> run(String widgetJs) async {
    await dispose();
    _disposed = false;
    _consoleLogs.clear();
    _readyCompleter = Completer<void>();

    final script = _buildWorkerScript(widgetJs, _config.initialTheme);
    final blob = web.Blob(
      [script.toJS].toJS,
      web.BlobPropertyBag(type: 'application/javascript'),
    );
    final blobUrl = web.URL.createObjectURL(blob);
    _blobUrl = blobUrl;

    final worker = web.Worker(blobUrl.toJS);
    _worker = worker;

    _messageHandler = _onMessage.toJS;
    worker.onmessage = _messageHandler;

    await _readyCompleter!.future.timeout(
      const Duration(seconds: 5),
      onTimeout: () {
        debugPrint('[JsWidgetEngineWeb] worker ready timeout');
      },
    );
    _config.onResolveReady?.call(_bridge.resolveCallback);
  }

  Future<void> callEvent(
    String actionId, [
    Map<String, dynamic>? payload,
  ]) async {
    if (_disposed || _worker == null) return;
    final ready = _readyCompleter;
    if (ready != null && !ready.isCompleted) {
      await ready.future.timeout(const Duration(seconds: 5), onTimeout: () {});
    }
    if (_disposed || _worker == null) return;
    await _bridge.callEvent(() {
      _postToWorker(
        '__yoloit_call_event',
        {'actionId': actionId, 'payload': payload ?? {}},
      );
    });
  }

  void updateTheme(Map<String, dynamic> colors) =>
      _postToWorker('__yoloit_updateTheme', colors);

  Future<void> dispose() async {
    _disposed = true;
    _bridge.dispose();
    final worker = _worker;
    _worker = null;
    worker?.terminate();
    final blobUrl = _blobUrl;
    _blobUrl = null;
    if (blobUrl != null) {
      web.URL.revokeObjectURL(blobUrl);
    }
    _readyCompleter?.complete();
    _readyCompleter = null;
  }

  // ── Private ──────────────────────────────────────────────────────────────

  void _onMessage(web.MessageEvent event) {
    final data = event.data;
    if (data == null || !data.isA<JSString>()) return;
    final raw = (data as JSString).toDart;
    final message = JsWidgetMessage.tryParse(raw);
    if (message == null) return;
    if (message.channel == '__yoloit_ready') {
      _readyCompleter?.complete();
      return;
    }
    unawaited(_bridge.dispatch(message.channel, message.payload));
  }

  void _handleLog(String msg) {
    debugPrint('[JsWidget:${_config.widgetId}] $msg');
    _consoleLogs.add({'ts': DateTime.now().millisecondsSinceEpoch, 'msg': msg});
    if (_consoleLogs.length > _maxLogs) _consoleLogs.removeAt(0);
    _config.onLog?.call(msg);
  }

  Future<void> _handleFetch(
    String id,
    String url,
    String method,
    Map<String, String> headers,
  ) async {
    if (_config.fetchHandler != null) {
      await _config.fetchHandler!.call(id, url, method, headers);
      return;
    }
    await defaultWebFetchHandler(id, url, method, headers, _bridge.resolveCallback);
  }

  Future<void> _handleExec(String id, String cmd) async {
    if (_config.execHandler != null) {
      await _config.execHandler!.call(id, cmd);
      return;
    }
    await defaultWebExecHandler(id, cmd, _bridge.resolveCallback);
  }

  void _resolveCallback(String id, dynamic value) {
    if (_disposed) return;
    _postToWorker('__yoloit_resolve', {'id': id, 'value': value});
  }

  void _postToWorker(String channel, dynamic payload) {
    final worker = _worker;
    if (worker == null) return;
    final message = JsWidgetMessage.encode(channel: channel, payload: payload);
    worker.postMessage(message.toJS);
  }

  String _buildWorkerScript(String widgetJs, Map<String, dynamic> initialTheme) {
    final escapedJs = widgetJs.replaceAll('</script>', '<\\/script>');
    final themeJson = jsonEncode(initialTheme);
    return '''
function sendMessage(channel, jsonString) {
  self.postMessage('__yoloit__' + JSON.stringify({channel: channel, payload: jsonString}));
}
self.onmessage = function(e){
  var data = e.data;
  if (typeof data !== 'string' || !data.startsWith('__yoloit__')) return;
  var msg = JSON.parse(data.slice('__yoloit__'.length));
  if (msg.channel === '__yoloit_call_event') {
    var actionId = msg.payload.actionId;
    var payload = msg.payload.payload;
    var __h = yoloit._handler || (typeof handleEvent === 'function' ? handleEvent : null);
    if (!__h) { sendMessage('__yoloit_event_done', '{}'); return; }
    try {
      var __r = __h(actionId, payload);
      if (__r && typeof __r.then === 'function') {
        __r.then(function(){ sendMessage('__yoloit_event_done', '{}'); },
                 function(e){ sendMessage('__yoloit_event_done', JSON.stringify({error: e.message || String(e)})); });
      } else {
        sendMessage('__yoloit_event_done', '{}');
      }
    } catch(e) {
      sendMessage('__yoloit_event_done', JSON.stringify({error: e.message || String(e)}));
    }
  } else if (msg.channel === '__yoloit_updateTheme') {
    yoloit.theme = msg.payload;
    if (yoloit._onThemeChange) { try { yoloit._onThemeChange(yoloit.theme); } catch(e) {} }
  } else if (msg.channel === '__yoloit_interval_tick') {
    if (__iv_cbs[msg.payload]) __iv_cbs[msg.payload]();
  } else if (msg.channel === '__yoloit_raf_tick') {
    if (__raf_cbs[msg.payload.id]) __raf_cbs[msg.payload.id](msg.payload.elapsed);
  } else if (msg.channel === '__yoloit_resolve') {
    if (__cbs[msg.payload.id]) { __cbs[msg.payload.id](msg.payload.value); delete __cbs[msg.payload.id]; }
  }
};
$kJsWidgetBootstrap
yoloit.theme = $themeJson;
try {
  $escapedJs
} catch(e) {
  yoloit.showError('Widget error: ' + (e.message || String(e)));
}
sendMessage('__yoloit_ready', '{}');
''';
  }
}
