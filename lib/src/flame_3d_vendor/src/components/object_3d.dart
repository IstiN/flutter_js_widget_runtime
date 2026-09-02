import 'dart:ui';

import 'package:flame/game.dart' show FlameGame;
import 'package:js_widget_runtime/src/flame_3d_vendor/camera.dart';
import 'package:js_widget_runtime/src/flame_3d_vendor/components.dart';
import 'package:js_widget_runtime/src/flame_3d_vendor/extensions.dart';
import 'package:js_widget_runtime/src/flame_3d_vendor/graphics.dart';
import 'package:js_widget_runtime/src/flame_3d_vendor/resources.dart';

/// {@template object_3d}
/// [Object3D]s are the basic building blocks for a 3D [FlameGame].
///
/// It is an object that is positioned in 3D space and can be drawn by a
/// [RenderContext].
///
/// However, it has no visual representation of its own (except in
/// debug mode). It is common, therefore, to derive from this class
/// and implement a specific rendering logic.
///
/// See the [MeshComponent] for an [Object3D] that has a visual representation
/// using a [Mesh].
/// {@endtemplate}
abstract class Object3D extends Component3D {
  /// {@macro object_3d}
  Object3D({
    super.position,
    super.scale,
    super.rotation,
    super.children,
  });

  /// Whether an ancestor's AABB was fully inside the frustum, meaning
  /// children can skip their own frustum tests.
  static bool _ancestorFullyInside = false;

  @override
  void renderTree(Canvas canvas) {
    final camera = CameraComponent3D.currentCamera;
    assert(
      camera != null,
      '''Component is either not part of a World3D or the render is being called outside of the camera rendering''',
    );

    // If ancestor is inside, so are we, otherwise test.
    final cullResult = _ancestorFullyInside
        ? CullResult.inside
        : aabb.frustumCullTest(camera!.frustum);

    // Result is fully outside, skip children and self.
    if (cullResult == CullResult.outside) {
      return;
    }

    // Render children. If fully inside, children can skip frustum tests.
    final wasAncestorFullyInside = _ancestorFullyInside;
    if (cullResult == CullResult.inside) {
      _ancestorFullyInside = true;
    }
    super.renderTree(canvas);
    _ancestorFullyInside = wasAncestorFullyInside;

    if (cullResult == CullResult.inside || isVisible(camera!)) {
      world.context.submitDraw(this, worldTransformMatrix);
    }
  }

  void draw(RenderContext context);

  bool isVisible(CameraComponent3D camera) {
    return camera.frustum.containsVector3(position);
  }
}
