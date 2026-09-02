import 'package:js_widget_runtime/src/flame_3d_vendor/resources.dart';

/// A point light that emits light in all directions equally.
class PointLight extends LightSource {
  PointLight({
    required super.color,
    required super.intensity,
  });
}
