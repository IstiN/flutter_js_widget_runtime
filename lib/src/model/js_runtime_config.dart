import 'package:flutter/foundation.dart';

/// Callback invoked to check whether a capability is allowed.
/// Capabilities: 'fetch', 'storage', 'secrets', 'exec'.
typedef JsPermissionChecker = bool Function(String capability);

/// Configuration and injected handlers for a [JsWidgetRuntime].
///
/// All I/O is opt-in via callbacks. The package provides default in-memory
/// implementations, but a host like YoLoIT can override them to wire in real
/// permissions, secure storage, CLI execution, etc.
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
    required this.onRender,
    required this.onSetTitle,
    required this.onStorageUpdate,
    this.onLog,
    this.isPermissionAllowed,
    this.resolveCallback,
    this.fetchHandler,
    this.secretsGetHandler,
    this.secretsSetHandler,
    this.loadAssetHandler,
    this.execHandler,
    this.intervalTickHandler,
    this.rafTickHandler,
  });

  final String widgetId;

  /// Base directory used by `yoloit.loadAsset(path)`.
  final String? appDir;

  /// Initial theme map injected into `yoloit.theme`.
  final Map<String, dynamic> initialTheme;

  /// Initial storage snapshot.
  final Map<String, dynamic> initialStorage;

  /// Called when JS calls `yoloit.render(tree)`.
  final void Function(Map<String, dynamic> tree) onRender;

  /// Called when JS calls `yoloit.panel.setTitle(title)`.
  final void Function(String title) onSetTitle;

  /// Called when JS updates storage.
  final void Function(Map<String, dynamic> storage) onStorageUpdate;

  /// Optional log sink for `console.log/warn/error`.
  final void Function(String message)? onLog;

  /// Optional permission checker for fetch/storage/secrets/exec.
  final JsPermissionChecker? isPermissionAllowed;

  /// Resolve a JS callback promise/reject by id.
  final void Function(String id, dynamic value)? resolveCallback;

  /// Handle `yoloit.fetchJson(url, opts)`.
  final Future<void> Function(
    String id,
    String url,
    String method,
    Map<String, String> headers,
  )? fetchHandler;

  /// Handle `yoloit.secrets.get(key)`.
  final Future<void> Function(String id, String key)? secretsGetHandler;

  /// Handle `yoloit.secrets.set(key, value)`.
  final Future<void> Function(String id, String key, dynamic value)?
      secretsSetHandler;

  /// Handle `yoloit.loadAsset(path)`.
  final Future<void> Function(String id, String path)? loadAssetHandler;

  /// Handle `yoloit.exec(cmd)`.
  final Future<void> Function(String id, String cmd)? execHandler;

  /// Dart-backed interval tick.
  final void Function(String id)? intervalTickHandler;

  /// Dart-backed animation frame tick.
  final void Function(String id, int elapsedMs)? rafTickHandler;

  JsRuntimeConfig copyWith({
    String? widgetId,
    String? appDir,
    Map<String, dynamic>? initialTheme,
    Map<String, dynamic>? initialStorage,
    void Function(Map<String, dynamic> tree)? onRender,
    void Function(String title)? onSetTitle,
    void Function(Map<String, dynamic> storage)? onStorageUpdate,
    void Function(String message)? onLog,
    JsPermissionChecker? isPermissionAllowed,
    void Function(String id, dynamic value)? resolveCallback,
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
  }) =>
      JsRuntimeConfig(
        widgetId: widgetId ?? this.widgetId,
        appDir: appDir ?? this.appDir,
        initialTheme: initialTheme ?? this.initialTheme,
        initialStorage: initialStorage ?? this.initialStorage,
        onRender: onRender ?? this.onRender,
        onSetTitle: onSetTitle ?? this.onSetTitle,
        onStorageUpdate: onStorageUpdate ?? this.onStorageUpdate,
        onLog: onLog ?? this.onLog,
        isPermissionAllowed: isPermissionAllowed ?? this.isPermissionAllowed,
        resolveCallback: resolveCallback ?? this.resolveCallback,
        fetchHandler: fetchHandler ?? this.fetchHandler,
        secretsGetHandler: secretsGetHandler ?? this.secretsGetHandler,
        secretsSetHandler: secretsSetHandler ?? this.secretsSetHandler,
        loadAssetHandler: loadAssetHandler ?? this.loadAssetHandler,
        execHandler: execHandler ?? this.execHandler,
        intervalTickHandler: intervalTickHandler ?? this.intervalTickHandler,
        rafTickHandler: rafTickHandler ?? this.rafTickHandler,
      );
}
