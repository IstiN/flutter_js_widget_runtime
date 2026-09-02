import 'package:js_widget_runtime/src/flame_3d_vendor/components.dart';
import 'package:js_widget_runtime/src/flame_3d_vendor/game.dart';
import 'package:js_widget_runtime/src/flame_3d_vendor/graphics.dart';
import 'package:js_widget_runtime/src/flame_3d_vendor/resources.dart';
import 'package:js_widget_runtime/src/flame_3d_vendor/src/camera/camera_component_3d.dart';

/// {@template mesh_component}
/// An [Object3D] that renders a [Mesh] at the [position] with the [rotation]
/// and [scale] applied.
///
/// This is a commonly used subclass of [Object3D].
/// {@endtemplate}
class MeshComponent extends Object3D {
  /// {@macro mesh_component}
  MeshComponent({
    required Mesh mesh,
    super.position,
    super.scale,
    super.rotation,
    super.children,
  }) : _mesh = mesh;

  /// The mesh resource.
  Mesh get mesh => _mesh;
  final Mesh _mesh;

  @override
  Aabb3? computeLocalAabb() => mesh.aabb;

  @override
  void draw(covariant RenderContext3D context) {
    context
      ..model.setFrom(worldTransformMatrix)
      ..drawMesh(mesh);
  }

  @override
  bool isVisible(CameraComponent3D camera) {
    return camera.frustum.intersectsWithAabb3(aabb);
  }
}
