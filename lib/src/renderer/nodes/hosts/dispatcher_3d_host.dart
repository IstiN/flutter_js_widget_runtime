import 'package:flutter/material.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

/// Creates the default [Js3dHost] for the runtime.
///
/// Procedural primitives and OBJ models are rendered with the cross-platform
/// `flutter_cube` host. GLB/GLTF models are routed to the `flame_3d` host
/// (Android/iOS/macOS only) for PBR materials, animations, and shadows.
Js3dHost createJs3dHost() => Js3dDispatcherHost.instance;

/// {@template js3d_dispatcher_host}
/// Dispatches `scene3d` nodes to either the `flutter_cube` host or the
/// `flame_3d` host based on the requested engine or model file extension.
/// {@endtemplate}
class Js3dDispatcherHost extends Js3dHost {
  Js3dDispatcherHost._();

  /// Singleton instance shared by the JS bridge and the widget renderer.
  static final Js3dDispatcherHost instance = Js3dDispatcherHost._();

  final Js3dHost _cube = createCube3dHost();
  final Js3dHost _flame = createFlame3dHost();
  final Map<String, _HostedController> _controllers = {};

  /// Remembers which host was selected for a given sceneId so that a
  /// controller recreated after dispose (e.g. post-timeout re-render)
  /// routes to the same host even if the new config lacks engine/src.
  final Map<String, Js3dHost> _hostByScene = {};

  /// The host currently bound to [sceneId] (test introspection).
  @visibleForTesting
  Js3dHost? hostForScene(String sceneId) =>
      _controllers[sceneId]?.host ?? _hostByScene[sceneId];

  /// Returns the host that should handle the given [config].
  ///
  /// Explicit `engine: 'flame'` or a GLB/GLTF source selects `flame_3d`.
  /// Everything else uses `flutter_cube`.
  @visibleForTesting
  Js3dHost selectHost(Map<String, dynamic> config) {
    final engine = (config['engine'] as String?)?.toLowerCase();
    if (engine == 'flame') {
      return _flame;
    }
    final src = _modelSrc(config);
    final lower = src?.toLowerCase() ?? '';
    if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
      return _flame;
    }
    return _cube;
  }

  String? _modelSrc(Map<String, dynamic> config) {
    final payload = config['payload'] as Map<String, dynamic>?;
    if (payload != null) {
      return payload['src'] as String?;
    }
    final model = config['model'] as Map<String, dynamic>?;
    return model?['src'] as String? ?? config['src'] as String?;
  }

  /// True when [config] carries host-selection information (an explicit
  /// `engine` or a model `src`). Render-side configs ({type, id, width,
  /// height}) are uninformed and may be upgraded later.
  bool _isInformed(Map<String, dynamic> config) =>
      config['engine'] is String || _modelSrc(config) != null;

  @override
  Js3dController createController(
    String sceneId,
    Map<String, dynamic> config,
  ) {
    // The JS bridge and the widget renderer each call createController for the
    // same sceneId but with different configs (bridge carries engine/src,
    // renderer carries width/height). Return the first-created controller so
    // both sides mutate and observe the same host instance.
    final existing = _controllers[sceneId];
    if (existing != null && !existing.isDisposed) {
      // Host upgrade: when the RENDER side created the controller first (its
      // config only carries {type, id, ...} — no engine/src), the selection
      // defaulted to Cube3dHost. A later bridge call that DOES carry a
      // GLB/GLTF src or engine:'flame' must not forward GLB commands to the
      // cube host (it would try to parse GLB as OBJ and crash). As long as no
      // addModel has been applied yet, swapping the inner controller is free.
      final selected = selectHost(config);
      if (!identical(selected, existing.host) &&
          !existing.hostInformed &&
          !existing._sawAddModel) {
        debugPrint(
          '[Js3dDispatcher] upgrade host sceneId=$sceneId '
          '${existing.host.runtimeType} -> ${selected.runtimeType}',
        );
        existing._upgrade(selected, sceneId, config);
        _hostByScene[sceneId] = selected;
      }
      // Reference counting matters here: when a scene3d node unmounts and
      // remounts within the same frame (per-frame scene rebuilds in the
      // yoclip video pipeline), the new State's initState runs BEFORE the old
      // State's dispose. Without a retain the old State would dispose the
      // controller the new State just acquired, leaving it permanently dead.
      existing._retain();
      debugPrint(
        '[Js3dDispatcher] reuse controller sceneId=$sceneId '
        'host=${existing.host.runtimeType}',
      );
      return existing;
    }
    // Use the remembered host if available: when a controller is disposed and
    // later recreated (e.g. after a callEvent timeout triggers a re-render),
    // the new config from the renderer side only carries {type, id, width,
    // height} — no engine/src — which would default to Cube3dHost. Remembering
    // the original selection ensures Flame3dHost scenes stay on Flame3dHost.
    final host = _hostByScene[sceneId] ?? selectHost(config);
    _hostByScene[sceneId] = host;
    final inner = host.createController(sceneId, config);
    final wrapper = _HostedController(
      host: host,
      controller: inner,
      hostInformed: _isInformed(config),
      onDispose: () {
        _controllers.remove(sceneId);
        // Keep _hostByScene entry — a controller recreated after dispose
        // (e.g. post-timeout re-render) needs the same host. The entry is
        // a single map key, negligible memory.
      },
    );
    _controllers[sceneId] = wrapper;
    debugPrint(
      '[Js3dDispatcher] create controller sceneId=$sceneId '
      'host=${host.runtimeType} configKeys=${config.keys.toList()}',
    );
    return wrapper;
  }

  @override
  Widget build(
    BuildContext context,
    Js3dController controller,
    Map<String, dynamic> config,
  ) {
    final wrapper = controller as _HostedController;
    return wrapper.host.build(context, wrapper.controller, config);
  }

}

/// A thin wrapper that forwards commands to the real controller created by the
/// selected host. It also forwards [notifyListeners] so the renderer rebuilds
/// when the inner controller changes.
class _HostedController extends Js3dController {
  _HostedController({
    required this.host,
    required this.controller,
    required this.hostInformed,
    required this.onDispose,
  }) {
    controller.addListener(notifyListeners);
  }

  Js3dHost host;
  Js3dController controller;
  final VoidCallback onDispose;

  /// Whether the creation config carried host-selection information
  /// (engine/src). Uninformed (render-side-first) controllers may be
  /// upgraded to a different host when an informed config arrives.
  bool hostInformed;

  /// Set once any addModel command has been forwarded — after that the
  /// host must stay stable (the scene has content).
  bool _sawAddModel = false;

  @override
  void apply(Js3dCommand command) {
    if (command.kind == 'addModel') _sawAddModel = true;
    controller.apply(command);
  }

  /// Swaps the inner controller to [newHost]. The wrapper identity (and its
  /// refcount) stays stable, so renderer States holding this object keep
  /// working; the scene3d node's next build reads the new [host].
  void _upgrade(Js3dHost newHost, String sceneId, Map<String, dynamic> config) {
    final old = controller;
    final inner = newHost.createController(sceneId, config);
    inner.addListener(notifyListeners);
    host = newHost;
    controller = inner;
    hostInformed = true;
    old.removeListener(notifyListeners);
    old.dispose();
    notifyListeners();
  }

  @override
  Map<String, dynamic>? raycastAt(Offset ndc) => controller.raycastAt(ndc);

  bool _disposed = false;
  int _refCount = 1;

  /// Whether this controller was fully disposed (last reference released).
  bool get isDisposed => _disposed;

  void _retain() => _refCount++;

  @override
  void dispose() {
    // Idempotent per owner: unmount/remount cycles (per-frame scene rebuilds
    // in video pipelines, plus final tree teardown) can dispose the same
    // shared controller more than once. The inner controller is torn down
    // only when the last reference goes away.
    if (_disposed) return;
    if (--_refCount > 0) return;
    _disposed = true;
    onDispose();
    controller.removeListener(notifyListeners);
    controller.dispose();
    super.dispose();
  }
}
