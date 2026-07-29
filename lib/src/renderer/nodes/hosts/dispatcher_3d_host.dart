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
    if (existing != null) {
      debugPrint(
        '[Js3dDispatcher] reuse controller sceneId=$sceneId '
        'host=${existing.host.runtimeType}',
      );
      return existing;
    }
    final host = selectHost(config);
    final inner = host.createController(sceneId, config);
    final wrapper = _HostedController(
      host: host,
      controller: inner,
      onDispose: () => _controllers.remove(sceneId),
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
    required this.onDispose,
  }) {
    controller.addListener(notifyListeners);
  }

  final Js3dHost host;
  final Js3dController controller;
  final VoidCallback onDispose;

  @override
  void apply(Js3dCommand command) => controller.apply(command);

  @override
  Map<String, dynamic>? raycastAt(Offset ndc) => controller.raycastAt(ndc);

  bool _disposed = false;

  @override
  void dispose() {
    // Idempotent: unmount/remount cycles (per-frame scene rebuilds in video
    // pipelines, plus final tree teardown) can dispose the same shared
    // controller more than once.
    if (_disposed) return;
    _disposed = true;
    onDispose();
    controller.removeListener(notifyListeners);
    controller.dispose();
    super.dispose();
  }
}
