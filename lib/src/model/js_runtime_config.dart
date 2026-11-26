import 'package:flutter/foundation.dart';

import 'package:js_widget_runtime/src/model/js_audio_synthesis.dart';
import 'package:js_widget_runtime/src/model/js_three_backend.dart';
import 'package:js_widget_runtime/src/renderer/media/js_media_host.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_3d_host.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_host.dart';
import 'package:js_widget_runtime/src/renderer/webview/js_web_view_host.dart';
import 'package:js_widget_runtime/src/runtime/js_cinematic_capture_host.dart';
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
    this.instanceId,
    this.appDir,
    this.initialTheme = const {
      'isDark': true,
      'bg': '#0f172a',
      'surface': '#1e293b',
      'surfaceAlt': '#293548',
      'border': '#334155',
      'borderBright': '#475569',
      'accent': '#818cf8',
      'accent2': '#a78bfa',
      'onAccent': '#0f172a',
      'text': '#f1f5f9',
      'muted': '#64748b',
    },
    this.initialStorage = const {},
    this.hostBootstrapJs,
    required this.onRender,
    required this.onSetTitle,
    required this.onStorageUpdate,
    this.onMessageTrace,
    this.onLog,
    this.isPermissionAllowed,
    this.resolveCallback,
    this.onResolveReady,
    this.fetchHandler,
    this.secretsGetHandler,
    this.secretsSetHandler,
    this.loadAssetHandler,
    this.execHandler,
    this.openUrlHandler,
    this.onHostCall,
    this.onHostCallBinary,
    this.onAudioSynthesis,
    this.captureHandler,
    this.cinematicCaptureHost,
    this.intervalTickHandler,
    this.rafTickHandler,
    this.backend,
    this.backendFactory,
    this.js3dHost,
    this.threeEnabled = false,
    this.threeSource,
    this.threeBackend = JsThreeBackend.r1,
    this.allowCustomShaders = false,
    this.onThreeBackendSelected,
    this.threeHost,
    this.mediaHost,
    this.webViewHost,
  });

  final String widgetId;

  /// Optional stable identifier for this widget engine instance, exposed to
  /// JS as `jsr.instanceId`.
  ///
  /// Widgets that create named resources (e.g. `jsr.scene3d` scenes) should
  /// namespace them with `jsr.instanceId` so that several panels running the
  /// same widget do not collide in the shared 3D host cache. When null, the
  /// engine generates a unique per-process token (not stable across reloads);
  /// hosts that want reload-stable ids (e.g. a panel id) should pass one.
  final String? instanceId;

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

  /// Optional observation hook: every `__jsr_*` channel name dispatched by
  /// the engine bridge, in arrival order (payload excluded). Conformance
  /// runners record the trace with it.
  final void Function(String channel)? onMessageTrace;

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
  )?
  fetchHandler;

  /// Handle `jsr.secrets.get(key)`.
  final Future<void> Function(String id, String key)? secretsGetHandler;

  /// Handle `jsr.secrets.set(key, value)`.
  final Future<void> Function(String id, String key, dynamic value)?
  secretsSetHandler;

  /// Handle `jsr.loadAsset(path)`.
  final Future<void> Function(String id, String path)? loadAssetHandler;

  /// Handle `jsr.exec(cmd)`.
  final Future<void> Function(String id, String cmd)? execHandler;

  /// Handle `jsr.openUrl(url)` — open a URL in the host's external browser
  /// (e.g. via `url_launcher`). Resolve with `true` on success, or with
  /// `{'__error': ...}` to reject the JS promise. When null the engines fall
  /// back to the platform default: `window.open` on web, `open`/`xdg-open`/
  /// `start` on VM. Pass a handler to gate, audit, or redirect launches.
  final Future<void> Function(String id, String url)? openUrlHandler;

  /// Generic host capability invoked by `jsr.hostCall(name, args)`.
  ///
  /// Lets hosts expose async native features (microphone, platform
  /// services) to widgets without hardcoding channels in the core:
  /// the host's `hostBootstrapJs` builds its API (e.g. `jsr.fa.*`) on
  /// top of `jsr.hostCall`. Resolve with any JSON-encodable value; throw
  /// to reject the JS promise. When null, calls fail with
  /// 'hostCall is not supported by this host'.
  final Future<Object?> Function(String name, Map<String, dynamic> args)?
  onHostCall;

  /// Handle `jsr.hostCallBinary(name, b64)` — the fire-and-forget BINARY
  /// side channel for high-frequency bulk data (transforms, particles,
  /// audio levels). The payload arrives as raw bytes: no JSON parse, no
  /// promise round trip, and the call never blocks the JS frame. Pairs
  /// with [onHostCall] for request/response-shaped host capabilities.
  final void Function(String name, Uint8List data)? onHostCallBinary;

  /// Receives PCM from `jsr.audio.synth(...).render()` as a typed
  /// [JsAudioSynthesis] envelope. This is offline synthesis, not media
  /// playback: JS renders oscillators/envelopes/notes into Float32 PCM and
  /// the host may encode, mix, or export it. When null, `render()` rejects
  /// with a clear unsupported-host error.
  final void Function(JsAudioSynthesis synthesis)? onAudioSynthesis;

  /// Self-screenshot capability behind `jsr.capture()`. The handler
  /// rasterizes the widget's CURRENT rendered tree and resolves with a
  /// host-specific result (the jsr_widget CLI resolves `{path, width,
  /// height}` and writes the PNG). Null = unsupported: the promise rejects
  /// with a clear error so widgets can degrade gracefully.
  final Future<Map<String, dynamic>> Function(Map<String, dynamic> opts)?
  captureHandler;

  /// Cinematic capture barrier behind `pipeline.captureFrame(clock)` on the
  /// core `jsr.three.cinematic` surface (issue #8, ADR-0004 decision 4).
  /// The request crosses the existing `__jsr_capture` channel with options
  /// `{engineId, clock, barrier: 'final-pass'}`; the host completes only
  /// after the final composer pass of the frame-driven render — never from
  /// a wall-clock frame. Null = the barrier capability is absent: the JS
  /// promise rejects with the NAMED error `cinematic.notCapturable`
  /// (never an effect-free capture).
  final JsCinematicCaptureHost? cinematicCaptureHost;

  /// Dart-backed interval tick.
  final void Function(String id)? intervalTickHandler;

  /// Dart-backed animation frame tick.
  final void Function(String id, int elapsedMs)? rafTickHandler;

  /// Optional JS engine backend. When omitted, the engine uses the platform
  /// default (`flutter_js` on VM, Web Worker on web).
  final JsWidgetEngineBackend? backend;

  /// Creates a backend with the final effective config, including wrappers
  /// installed by [JsWidgetRuntimeWidget]. Ignored when [backend] is set.
  final JsWidgetEngineBackend Function(JsRuntimeConfig config)? backendFactory;

  /// Optional host-provided 3D engine factory for `scene3d` nodes.
  final Js3dHost? js3dHost;

  /// Loads the pinned upstream THREE compatibility bundle before widget JS.
  ///
  /// Disabled by default so ordinary widgets never download/evaluate THREE.
  final bool threeEnabled;

  /// Test/host override for the generated platform-specific THREE bundle.
  /// Normally null; the engine loads `assets/three/jsr_three_native.js` or
  /// `assets/three/jsr_three_web.js` from the package bundle.
  final String? threeSource;

  /// THREE render backend selection (issue #7 / ADR-0003): `r1` (default,
  /// the bounded flutter_gpu renderer), `angle1b` (pinned upstream
  /// WebGLRenderer over ANGLE), or `auto` (angle1b when every probe of the
  /// selection ladder passes, else r1). Selecting angle1b never downloads,
  /// loads or initializes ANGLE unless the optional `jsr_three_angle`
  /// package is on the class path and its host is passed as [threeHost].
  final JsThreeBackend threeBackend;

  /// Host policy for custom shaders (ADR-0003 decision 3). When false
  /// (default), `THREE.ShaderMaterial`, `THREE.RawShaderMaterial` and
  /// `onBeforeCompile` throw `three.unsupported: custom shaders are
  /// disabled by host policy` before the renderer is allocated.
  final bool allowCustomShaders;

  /// Selection outcome callback: always fired when a THREE runtime starts,
  /// with the requested and selected backend and the fallback reason.
  final void Function(JsThreeBackendSelection selection)?
  onThreeBackendSelected;

  /// Independent upstream-THREE host used by `three` nodes and JSR3D-T1.
  /// This is deliberately not part of the existing [js3dHost] hierarchy.
  final JsThreeHost? threeHost;

  /// Optional host-provided media factory for `video` / `audio` /
  /// `audio_player` nodes. Without one those nodes render placeholders.
  final JsMediaHost? mediaHost;

  /// Optional host-provided web view factory for `webView` nodes. On web
  /// builds the package ships `createIframeWebViewHost()`; VM hosts plug
  /// `flutter_inappwebview` or `webview_flutter` through this interface.
  final JsWebViewHost? webViewHost;

  JsRuntimeConfig copyWith({
    String? widgetId,
    String? instanceId,
    String? appDir,
    Map<String, dynamic>? initialTheme,
    Map<String, dynamic>? initialStorage,
    String? hostBootstrapJs,
    void Function(Map<String, dynamic> tree)? onRender,
    void Function(String title)? onSetTitle,
    void Function(Map<String, dynamic> storage)? onStorageUpdate,
    void Function(String channel)? onMessageTrace,
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
    )?
    fetchHandler,
    Future<void> Function(String id, String key)? secretsGetHandler,
    Future<void> Function(String id, String key, dynamic value)?
    secretsSetHandler,
    Future<void> Function(String id, String path)? loadAssetHandler,
    Future<void> Function(String id, String cmd)? execHandler,
    Future<void> Function(String id, String url)? openUrlHandler,
    Future<Object?> Function(String name, Map<String, dynamic> args)?
    onHostCall,
    void Function(String name, Uint8List data)? onHostCallBinary,
    void Function(JsAudioSynthesis synthesis)? onAudioSynthesis,
    Future<Map<String, dynamic>> Function(Map<String, dynamic> opts)?
    captureHandler,
    JsCinematicCaptureHost? cinematicCaptureHost,
    void Function(String id)? intervalTickHandler,
    void Function(String id, int elapsedMs)? rafTickHandler,
    JsWidgetEngineBackend? backend,
    JsWidgetEngineBackend Function(JsRuntimeConfig config)? backendFactory,
    Js3dHost? js3dHost,
    bool? threeEnabled,
    String? threeSource,
    JsThreeBackend? threeBackend,
    bool? allowCustomShaders,
    void Function(JsThreeBackendSelection selection)? onThreeBackendSelected,
    JsThreeHost? threeHost,
    JsMediaHost? mediaHost,
    JsWebViewHost? webViewHost,
  }) => JsRuntimeConfig(
    widgetId: widgetId ?? this.widgetId,
    instanceId: instanceId ?? this.instanceId,
    appDir: appDir ?? this.appDir,
    initialTheme: initialTheme ?? this.initialTheme,
    initialStorage: initialStorage ?? this.initialStorage,
    hostBootstrapJs: hostBootstrapJs ?? this.hostBootstrapJs,
    onRender: onRender ?? this.onRender,
    onSetTitle: onSetTitle ?? this.onSetTitle,
    onStorageUpdate: onStorageUpdate ?? this.onStorageUpdate,
    onMessageTrace: onMessageTrace ?? this.onMessageTrace,
    onLog: onLog ?? this.onLog,
    isPermissionAllowed: isPermissionAllowed ?? this.isPermissionAllowed,
    resolveCallback: resolveCallback ?? this.resolveCallback,
    onResolveReady: onResolveReady ?? this.onResolveReady,
    fetchHandler: fetchHandler ?? this.fetchHandler,
    secretsGetHandler: secretsGetHandler ?? this.secretsGetHandler,
    secretsSetHandler: secretsSetHandler ?? this.secretsSetHandler,
    loadAssetHandler: loadAssetHandler ?? this.loadAssetHandler,
    execHandler: execHandler ?? this.execHandler,
    openUrlHandler: openUrlHandler ?? this.openUrlHandler,
    onHostCall: onHostCall ?? this.onHostCall,
    onHostCallBinary: onHostCallBinary ?? this.onHostCallBinary,
    onAudioSynthesis: onAudioSynthesis ?? this.onAudioSynthesis,
    captureHandler: captureHandler ?? this.captureHandler,
    cinematicCaptureHost: cinematicCaptureHost ?? this.cinematicCaptureHost,
    intervalTickHandler: intervalTickHandler ?? this.intervalTickHandler,
    rafTickHandler: rafTickHandler ?? this.rafTickHandler,
    backend: backend ?? this.backend,
    backendFactory: backendFactory ?? this.backendFactory,
    js3dHost: js3dHost ?? this.js3dHost,
    threeEnabled: threeEnabled ?? this.threeEnabled,
    threeSource: threeSource ?? this.threeSource,
    threeBackend: threeBackend ?? this.threeBackend,
    allowCustomShaders: allowCustomShaders ?? this.allowCustomShaders,
    onThreeBackendSelected:
        onThreeBackendSelected ?? this.onThreeBackendSelected,
    threeHost: threeHost ?? this.threeHost,
    mediaHost: mediaHost ?? this.mediaHost,
    webViewHost: webViewHost ?? this.webViewHost,
  );
}
