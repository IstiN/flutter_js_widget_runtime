import 'dart:ui';

import 'package:js_widget_runtime/src/flame_3d_vendor/model.dart';
import 'package:js_widget_runtime/src/flame_3d_vendor/resources.dart';
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
      return Color.fromARGB(_opaqueAlpha, (rgb >> 16) & _byteMask,
          (rgb >> 8) & _byteMask, rgb & _byteMask);
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

/// Multiplies every surface albedo of [model] by a tint parsed from a
/// `#rrggbb` string. Lets a JS widget recolor a GLB whose own palette does
/// not fit the host theme (e.g. a skin-toned body model as a stylized
/// mannequin). Pure CPU-side math on material data — unit-testable without
/// a GPU. A null [color] is a no-op.
void js3dTintModel(Model model, String? color) {
  if (color == null) return;
  final tint = js3dParseColor(color, const Color(0xFFFFFFFF));
  for (final node in model.nodes.values) {
    final mesh = node.mesh;
    if (mesh == null) continue;
    for (final surface in mesh.surfaces) {
      final material = surface.material;
      if (material is SpatialMaterial) {
        material.albedoColor = _multiplyColors(material.albedoColor, tint);
      } else if (material is UnlitMaterial) {
        material.albedoColor = _multiplyColors(material.albedoColor, tint);
      }
    }
  }
}

/// Per-channel multiply of two colors (alpha included).
Color _multiplyColors(Color a, Color b) => Color.fromARGB(
      (a.a * b.a * 255).round(),
      (a.r * b.r * 255).round(),
      (a.g * b.g * 255).round(),
      (a.b * b.b * 255).round(),
    );

/// Byte mask / opaque alpha for hex color parsing.
const _byteMask = 0xff;
const _opaqueAlpha = 255;
