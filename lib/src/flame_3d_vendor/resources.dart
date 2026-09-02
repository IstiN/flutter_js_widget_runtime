import 'package:flame/cache.dart';
import 'package:js_widget_runtime/src/flame_3d_vendor/resources.dart';

export 'src/resources/light.dart';
export 'src/resources/material.dart';
export 'src/resources/mesh.dart';
export 'src/resources/resource.dart';
export 'src/resources/shader.dart';
export 'src/resources/texture.dart';

extension TextureCache on Images {
  Future<Texture> loadTexture(String path) {
    return load(path).then(ImageTexture.create);
  }
}
