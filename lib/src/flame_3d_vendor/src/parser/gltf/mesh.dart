import 'package:js_widget_runtime/src/flame_3d_vendor/core.dart';
import 'package:js_widget_runtime/src/flame_3d_vendor/resources.dart' as flame_3d;
import 'package:js_widget_runtime/src/flame_3d_vendor/src/parser/gltf/gltf_node.dart';
import 'package:js_widget_runtime/src/flame_3d_vendor/src/parser/gltf/gltf_root.dart';
import 'package:js_widget_runtime/src/flame_3d_vendor/src/parser/gltf/primitive.dart';

/// A set of primitives to be rendered.
///
/// Its global transform is defined by a node that references it.
class Mesh extends GltfNode {
  /// An array of primitives, each defining geometry to be rendered.
  final List<Primitive> primitives;

  /// Array of weights to be applied to the morph targets.
  /// The number of array elements **MUST** match the number of morph targets
  final List<double>? weights;

  Mesh({
    required super.root,
    required this.primitives,
    required this.weights,
  });

  Mesh.parse(
    GltfRoot root,
    Map<String, Object?> map,
  ) : this(
        root: root,
        primitives:
            Parser.objectList(root, map, 'primitives', Primitive.parse) ?? [],
        weights: Parser.floatList(map, 'weights'),
      );

  // TODO(luan): remove the transform parameter
  flame_3d.Mesh toFlameMesh([Matrix4? transform]) {
    final mesh = flame_3d.Mesh();
    for (final primitive in primitives) {
      mesh.addSurface(primitive.toFlameSurface(transform));
    }
    return mesh;
  }
}
