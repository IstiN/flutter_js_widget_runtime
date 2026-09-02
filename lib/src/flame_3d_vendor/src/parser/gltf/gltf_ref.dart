import 'package:js_widget_runtime/src/flame_3d_vendor/src/parser/gltf/gltf_node.dart';

/// A wrapper over an index reference within the GLTF spec, allowing the data
/// structure to be navigated with ease.
class GltfRef<T extends GltfNode> extends GltfNode {
  final int index;

  GltfRef({
    required super.root,
    required this.index,
  });

  T get() {
    return root.resolve<T>(index);
  }
}
