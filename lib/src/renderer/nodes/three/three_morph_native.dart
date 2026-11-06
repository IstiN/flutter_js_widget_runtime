import 'dart:typed_data';

import 'package:js_widget_runtime/src/renderer/nodes/three/three_native_packet.dart';

/// Applies R1's cached morph-target packet synchronously in place.
///
/// Float32 layout:
///   0 vertexCount, 1 influenceCount, 2 positionTargetCount,
///   3 normalTargetCount, 4 relative, 5 status, 6..7 reserved;
///   weights, base positions, optional base normals, position targets,
///   optional normal targets. Base regions are the output regions and are
///   restored by JS before every call. Target regions remain cached.
///
/// This private QuickJS lane changes neither the public jsr API nor R1.
bool applyThreeMorphPacket(Uint8List bytes) {
  final values = readThreeFloat32Packet(bytes, 32);
  if (values == null) return false;
  final vertexCount = values[0].toInt();
  final influenceCount = values[1].toInt();
  final positionTargetCount = values[2].toInt();
  final normalTargetCount = values[3].toInt();
  final relative = values[4].toInt();
  if (values[0] != vertexCount ||
      values[1] != influenceCount ||
      values[2] != positionTargetCount ||
      values[3] != normalTargetCount ||
      vertexCount <= 0 ||
      influenceCount <= 0 ||
      positionTargetCount < 0 ||
      normalTargetCount < 0 ||
      positionTargetCount > influenceCount ||
      normalTargetCount > influenceCount ||
      (positionTargetCount == 0 && normalTargetCount == 0) ||
      (relative != 0 && relative != 1)) {
    return false;
  }
  final weightOffset = 8;
  final positionOffset = weightOffset + influenceCount;
  final stride = vertexCount * 3;
  final normalOffset = positionOffset + stride;
  final positionTargetOffset =
      normalOffset + (normalTargetCount > 0 ? stride : 0);
  final normalTargetOffset =
      positionTargetOffset + positionTargetCount * stride;
  final expectedLength = normalTargetOffset + normalTargetCount * stride;
  if (expectedLength != values.length) return false;
  values[5] = 0;

  var baseInfluence = 1.0;
  if (relative == 0) {
    for (var target = 0; target < influenceCount; target++) {
      final weight = values[weightOffset + target];
      if (!weight.isFinite) return false;
      baseInfluence -= weight;
    }
  } else {
    for (var target = 0; target < influenceCount; target++) {
      if (!values[weightOffset + target].isFinite) return false;
    }
  }

  if (positionTargetCount > 0) {
    for (var i = 0; i < stride; i++) {
      var value = values[positionOffset + i] * baseInfluence;
      for (var target = 0; target < positionTargetCount; target++) {
        final weight = values[weightOffset + target];
        if (weight == 0) continue;
        value += weight * values[positionTargetOffset + target * stride + i];
      }
      if (!value.isFinite) return false;
      values[positionOffset + i] = value;
    }
  }
  if (normalTargetCount > 0) {
    for (var i = 0; i < stride; i++) {
      var value = values[normalOffset + i] * baseInfluence;
      for (var target = 0; target < normalTargetCount; target++) {
        final weight = values[weightOffset + target];
        if (weight == 0) continue;
        value += weight * values[normalTargetOffset + target * stride + i];
      }
      if (!value.isFinite) return false;
      values[normalOffset + i] = value;
    }
  }
  values[5] = 1;
  return true;
}
