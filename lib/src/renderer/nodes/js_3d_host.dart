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
