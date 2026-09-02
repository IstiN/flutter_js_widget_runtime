import 'dart:ui' show Color;

import 'package:js_widget_runtime/src/flame_3d_vendor/resources.dart';

class AmbientLight extends LightSource {
  AmbientLight({
    super.color = const Color(0xFFFFFFFF),
    super.intensity = 0.2,
  });
}
