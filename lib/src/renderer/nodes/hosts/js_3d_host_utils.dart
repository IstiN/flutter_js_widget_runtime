import 'dart:ui';

import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:vector_math/vector_math.dart' as vm32;
import 'package:vector_math/vector_math_64.dart' as vm64;

/// Shared helpers for the built-in 3D hosts (`flutter_cube` and `flame_3d`).

/// Kotlin-style scoped function: calls [block] with `this` as its argument and
/// returns the result. Lets nullable values chain without extra locals.
extension Let<T> on T {
  R let<R>(R Function(T) block) => block(this);
}

/// Parses a `#rrggbb` hex color string, returning [fallback] when the value
/// is malformed.
Color js3dParseColor(String value, Color fallback) {
  var hex = value.trim();
  if (hex.startsWith('#')) hex = hex.substring(1);
  if (hex.length == 6) {
    final rgb = int.tryParse(hex, radix: 16);
    if (rgb != null) {
      return Color.fromARGB(
        255,
        (rgb >> 16) & 0xff,
        (rgb >> 8) & 0xff,
        rgb & 0xff,
      );
    }
  }
  return fallback;
}

/// Reads a `[x, y, z]` list from a command payload into a [vm64.Vector3].
/// Returns null when the value is missing or has fewer than 3 components.
///
/// Used by the `flutter_cube` host, which works with `vector_math_64` types.
vm64.Vector3? js3dReadVec3(List<dynamic>? value) {
  if (value == null || value.length < 3) return null;
  return vm64.Vector3(
    (value[0] as num).toDouble(),
    (value[1] as num).toDouble(),
    (value[2] as num).toDouble(),
  );
}

/// Same as [js3dReadVec3] but returns the 32-bit `vector_math` [vm32.Vector3]
/// used by `flame_3d` (the two vector_math libraries declare distinct types).
vm32.Vector3? js3dReadVec3f(List<dynamic>? value) {
  final v = js3dReadVec3(value);
  return v == null ? null : vm32.Vector3(v.x, v.y, v.z);
}

/// Resolves the model id targeted by a [Js3dCommand]: the payload-level
/// `modelId` wins over the command-level field, falling back to `'default'`.
String js3dModelId(Js3dCommand command, Map<String, dynamic> payload) =>
    (payload['modelId'] as String?) ?? command.modelId ?? 'default';
