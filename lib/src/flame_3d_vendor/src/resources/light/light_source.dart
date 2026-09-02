import 'dart:ui' show Color;

import 'package:js_widget_runtime/src/flame_3d_vendor/resources.dart';

/// Describes the properties of a light source.
/// There are three types of light sources: point, directional, and spot.
/// Currently only [PointLight] is implemented.
abstract class LightSource {
  final Color color;
  final double intensity;

  LightSource({
    required this.color,
    required this.intensity,
  });
}
