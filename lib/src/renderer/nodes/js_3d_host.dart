import 'package:flutter/material.dart';

/// A command issued from JS to mutate a 3D scene.
///
/// Commands are queued by [Js3dController] and applied by the host widget
/// on the next frame, keeping the JS/Dart boundary simple and synchronous
/// from the JS point of view.
@immutable
class Js3dCommand {
  const Js3dCommand({
    required this.kind,
    required this.sceneId,
    this.modelId,
    this.payload,
  });

  final String kind;
  final String sceneId;
  final String? modelId;
  final Map<String, dynamic>? payload;
}

/// Host-provided controller for a single 3D scene.
///
/// The runtime creates one controller per scene and forwards JS calls to it.
/// Host implementations can use any backing engine (Flame 3D, three_dart,
/// flutter_3d_controller, etc.).
///
/// Extends [ChangeNotifier] so the host widget can rebuild when the JS side
/// mutates scene state.
abstract class Js3dController extends ChangeNotifier {
  /// Applies a command to the scene.
  void apply(Js3dCommand command);

  /// Attempts to pick a model at normalized device coordinates [ndc]
  /// (x/y in `[-1, 1]`, y up), used by tap picking (`jsr.scene3d.onTap`).
  ///
  /// Returns `{modelId, point: [x, y, z]}` for the nearest hit, or null on a
  /// miss or when the host does not support raycasting.
  Map<String, dynamic>? raycastAt(Offset ndc) => null;

  /// Disposes any resources owned by this scene.
  @mustCallSuper
  @override
  void dispose() {
    super.dispose();
  }
}

/// Reference-counted controller registry shared by the built-in hosts.
///
/// The JS bridge and the widget renderer can request the same scene
/// independently; the registry hands out one controller per `sceneId` and
/// keeps it alive until the last reference is released.
mixin Js3dControllerRegistry<T extends RefCountedJs3dController> {
  final _controllers = <String, T>{};

  /// Returns the live controller for [sceneId] (retaining one more
  /// reference), or null when none exists.
  T? retainController(String sceneId) {
    final existing = _controllers[sceneId];
    if (existing == null || existing.isDisposedCtrl) return null;
    existing.addRef();
    return existing;
  }

  /// Registers a freshly created [controller] under its scene id.
  void registerController(T controller) {
    _controllers[controller.sceneId] = controller;
  }

  /// Drops a reference; returns whether this was the last one (the caller
  /// then disposes the controller).
  bool releaseController(T controller) {
    if (controller.dropRef() != 0) return false;
    _controllers.remove(controller.sceneId);
    return true;
  }
}

/// Reference-counting plumbing for controllers managed by a
/// [Js3dControllerRegistry].
abstract class RefCountedJs3dController extends Js3dController {
  int _refCount = 1;

  /// This controller's scene id.
  String get sceneId;

  /// Whether [disposeInternal] has run.
  bool get isDisposedCtrl;

  /// Host hook: release native/scene resources (called once, when the last
  /// reference is gone).
  void disposeInternal();

  /// Registers one more holder of this controller.
  @protected
  void addRef() => _refCount++;

  /// Removes one holder; returns the remaining count.
  @protected
  int dropRef() => --_refCount;
}

/// Factory provided by the host to create concrete 3D controllers for
/// `scene3d` / `model3d` nodes.
///
/// If a host does not provide a [Js3dHost], the renderer falls back to a
/// placeholder for 3D nodes.
abstract class Js3dHost {
  const Js3dHost();

  /// Creates a controller for a scene identified by [sceneId].
  Js3dController createController(
    String sceneId,
    Map<String, dynamic> config,
  );

  /// Builds the visual representation of a scene.
  ///
  /// [controller] is the object returned by [createController]. The host must
  /// listen to it (e.g. via [ListenableBuilder]) and rebuild when JS mutates
  /// the scene.
  Widget build(
    BuildContext context,
    Js3dController controller,
    Map<String, dynamic> config,
  );
}
