import 'package:js_widget_runtime/src/flame_3d_vendor/src/parser/gltf/gltf_node.dart';

/// A [GltfNode] with some sort of associated data that needs to be loaded
/// with an async [init] method.
mixin GltfNodeWithData<T> on GltfNode {
  late T _data;

  Future<void> init() async {
    _data = await loadData();
  }

  Future<T> loadData();
  T getData() => _data;
}
