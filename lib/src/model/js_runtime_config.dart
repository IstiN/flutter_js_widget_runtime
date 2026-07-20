import 'package:flutter/foundation.dart';

import 'package:js_widget_runtime/src/runtime/js_widget_engine_backend.dart';

/// Callback invoked to check whether a capability is allowed.
/// Capabilities: 'fetch', 'storage', 'secrets', 'exec'.
typedef JsPermissionChecker = bool Function(String capability);

/// Configuration and injected handlers for a [JsWidgetRuntime].
///
/// All I/O is opt-in via callbacks. The package provides default in-memory
/// implementations, but a host like YoLoIT can override them to wire in real
/// permissions, secure storage, CLI execution, etc.
///
/// Host-specific JS APIs can be injected via [hostBootstrapJs]. For example,
/// a host may evaluate `jsr.yoloit = { ... }` before the widget code runs.
@immutable
class JsRuntimeConfig {
  const JsRuntimeConfig({
    this.widgetId = 'default',
    this.appDir,
    this.initialTheme = const {
      'isDark': true,
      'bg': '#0f172a',
      'surface': '#1e293b',
      'border': '#334155',
      'accent': '#818cf8',
      'text': '#f1f5f9',
      'muted': '#64748b',
    },
    this.initialStorage = const {},
    this.hostBootstrapJs,
    required this.onRender,
    required this.onSetTitle,
    required this.onStorageUpdate,
    this.onLog,
    this.isPermissionAllowed,
    this.resolveCallback,
    this.onResolveReady,
    this.fetchHandler,
    this.secretsGetHandler,
    this.secretsSetHandler,
    this.loadAssetHandler,
    this.execHandler,
    this.intervalTickHandler,
    this.rafTickHandler,
    this.backend,
  });

  final String widgetId;

  /// Base directory used by `jsr.loadAsset(path)`.
  final String? appDir;

  /// Initial theme map injected into `jsr.theme`.
  final Map<String, dynamic> initialTheme;

  /// Initial storage snapshot.
  final Map<String, dynamic> initialStorage;

  /// Optional JS evaluated after the bootstrap and before the widget code.
  /// Use this to inject host-specific APIs such as `jsr.yoloit = {...}`.
  final String? hostBootstrapJs;

  /// Called when JS calls `jsr.render(tree)`.
  final void Function(Map<String, dynamic> tree) onRender;

  /// Called when JS calls `jsr.panel.setTitle(title)`.
  final void Function(String title) onSetTitle;

  /// Called when JS updates storage.
  final void Function(Map<String, dynamic> storage) onStorageUpdate;

  /// Optional log sink for `console.log/warn/error`.
  final void Function(String message)? onLog;

  /// Optional permission checker for fetch/storage/secrets/exec.
  final JsPermissionChecker? isPermissionAllowed;

  /// Resolve a JS callback promise/reject by id.
  final void Function(String id, dynamic value)? resolveCallback;

  /// Optional callback that receives the engine's active resolver once the
  /// bridge is wired up. Useful for host handlers that need to settle JS
  /// promises from custom I/O handlers.
  final void Function(void Function(String id, dynamic value) resolve)?
      onResolveReady;

  /// Handle `jsr.fetchJson(url, opts)`.
  final Future<void> Function(
    String id,
    String url,
    String method,
    Map<String, String> headers,
  )? fetchHandler;

  /// Handle `jsr.secrets.get(key)`.
  final Future<void> Function(String id, String key)? secretsGetHandler;

  /// Handle `jsr.secrets.set(key, value)`.
  final Future<void> Function(String id, String key, dynamic value)?
      secretsSetHandler;

  /// Handle `jsr.loadAsset(path)`.
  final Future<void> Function(String id, String path)? loadAssetHandler;

  /// Handle `jsr.exec(cmd)`.
  final Future<void> Function(String id, String cmd)? execHandler;

  /// Dart-backed interval tick.
  final void Function(String id)? intervalTickHandler;

  /// Dart-backed animation frame tick.
  final void Function(String id, int elapsedMs)? rafTickHandler;

  /// Optional JS engine backend. When omitted, the engine uses the platform
  /// default (`flutter_js` on VM, Web Worker on web).
  final JsWidgetEngineBackend? backend;

  JsRuntimeConfig copyWith({
    String? widgetId,
    String? appDir,
    Map<String, dynamic>? initialTheme,
    Map<String, dynamic>? initialStorage,
    String? hostBootstrapJs,
    void Function(Map<String, dynamic> tree)? onRender,
    void Function(String title)? onSetTitle,
    void Function(Map<String, dynamic> storage)? onStorageUpdate,
    void Function(String message)? onLog,
    JsPermissionChecker? isPermissionAllowed,
    void Function(String id, dynamic value)? resolveCallback,
    void Function(void Function(String id, dynamic value) resolve)?
        onResolveReady,
    Future<void> Function(
      String id,
      String url,
      String method,
      Map<String, String> headers,
    )? fetchHandler,
    Future<void> Function(String id, String key)? secretsGetHandler,
    Future<void> Function(String id, String key, dynamic value)?
        secretsSetHandler,
    Future<void> Function(String id, String path)? loadAssetHandler,
    Future<void> Function(String id, String cmd)? execHandler,
    void Function(String id)? intervalTickHandler,
    void Function(String id, int elapsedMs)? rafTickHandler,
    JsWidgetEngineBackend? backend,
  }) =>
      JsRuntimeConfig(
        widgetId: widgetId ?? this.widgetId,
        appDir: appDir ?? this.appDir,
        initialTheme: initialTheme ?? this.initialTheme,
        initialStorage: initialStorage ?? this.initialStorage,
        hostBootstrapJs: hostBootstrapJs ?? this.hostBootstrapJs,
        onRender: onRender ?? this.onRender,
        onSetTitle: onSetTitle ?? this.onSetTitle,
        onStorageUpdate: onStorageUpdate ?? this.onStorageUpdate,
        onLog: onLog ?? this.onLog,
        isPermissionAllowed: isPermissionAllowed ?? this.isPermissionAllowed,
        resolveCallback: resolveCallback ?? this.resolveCallback,
        onResolveReady: onResolveReady ?? this.onResolveReady,
        fetchHandler: fetchHandler ?? this.fetchHandler,
        secretsGetHandler: secretsGetHandler ?? this.secretsGetHandler,
        secretsSetHandler: secretsSetHandler ?? this.secretsSetHandler,
        loadAssetHandler: loadAssetHandler ?? this.loadAssetHandler,
        execHandler: execHandler ?? this.execHandler,
        intervalTickHandler: intervalTickHandler ?? this.intervalTickHandler,
        rafTickHandler: rafTickHandler ?? this.rafTickHandler,
        backend: backend ?? this.backend,
      );
}
