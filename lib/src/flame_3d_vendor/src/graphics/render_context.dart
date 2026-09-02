import 'package:js_widget_runtime/src/flame_3d_vendor/graphics.dart';

abstract class RenderContext {
  const RenderContext(this.device);

  final GraphicsDevice device;
}
