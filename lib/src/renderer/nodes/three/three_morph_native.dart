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
  final header = _readMorphHeader(values);
  if (header == null) return false;
  final weightOffset = 8;
  final stride = header.vertexCount * 3;
  final positionOffset = weightOffset + header.influenceCount;
  final normalOffset = positionOffset + stride;
  final positionTargetOffset =
      normalOffset + (header.normalTargetCount > 0 ? stride : 0);
  final normalTargetOffset =
      positionTargetOffset + header.positionTargetCount * stride;
  final expectedLength = normalTargetOffset + header.normalTargetCount * stride;
  if (expectedLength != values.length) return false;
  values[5] = 0;

  var baseInfluence = 1.0;
  for (var target = 0; target < header.influenceCount; target++) {
    final weight = values[weightOffset + target];
    if (!weight.isFinite) return false;
    if (header.relative == 0) baseInfluence -= weight;
  }

  if (!_applyMorphTargets(
    values,
    targetCount: header.positionTargetCount,
    weightOffset: weightOffset,
    targetOffset: positionTargetOffset,
    outputOffset: positionOffset,
    stride: stride,
    baseInfluence: baseInfluence,
  )) {
    return false;
  }
  if (!_applyMorphTargets(
    values,
    targetCount: header.normalTargetCount,
    weightOffset: weightOffset,
    targetOffset: normalTargetOffset,
    outputOffset: normalOffset,
    stride: stride,
    baseInfluence: baseInfluence,
  )) {
    return false;
  }
  values[5] = 1;
  return true;
}

/// Decoded and validated morph packet header.
final class _MorphHeader {
  const _MorphHeader({
    required this.vertexCount,
    required this.influenceCount,
    required this.positionTargetCount,
    required this.normalTargetCount,
    required this.relative,
  });

  final int vertexCount;
  final int influenceCount;
  final int positionTargetCount;
  final int normalTargetCount;
  final int relative;
}

/// Validates the packet header; returns null when any field is a
/// non-integer or out of range.
_MorphHeader? _readMorphHeader(Float32List values) {
  final vertexCount = values[0].toInt();
  final influenceCount = values[1].toInt();
  final positionTargetCount = values[2].toInt();
  final normalTargetCount = values[3].toInt();
  final relative = values[4].toInt();
  // (value, min, max) inclusive integer bounds; the `value != toInt()`
  // term rejects non-integral counts.
  final limits = <(double, int, int)>[
    (values[0], 1, double.maxFinite.toInt()),
    (values[1], 1, double.maxFinite.toInt()),
    (values[2], 0, influenceCount),
    (values[3], 0, influenceCount),
  ];
  for (final (value, min, max) in limits) {
    final count = value.toInt();
    if (value != count || count < min || count > max) return null;
  }
  if (positionTargetCount + normalTargetCount == 0) return null;
  // `relative & ~1 != 0` rejects any value outside {0, 1}.
  if (relative & ~1 != 0) return null;
  return _MorphHeader(
    vertexCount: vertexCount,
    influenceCount: influenceCount,
    positionTargetCount: positionTargetCount,
    normalTargetCount: normalTargetCount,
    relative: relative,
  );
}

/// Blends `targetCount` cached morph targets into the base region
/// `[outputOffset, outputOffset + stride)`; returns false on a non-finite
/// result.
bool _applyMorphTargets(
  Float32List values, {
  required int targetCount,
  required int weightOffset,
  required int targetOffset,
  required int outputOffset,
  required int stride,
  required double baseInfluence,
}) {
  if (targetCount == 0) return true;
  for (var i = 0; i < stride; i++) {
    var value = values[outputOffset + i] * baseInfluence;
    for (var target = 0; target < targetCount; target++) {
      final weight = values[weightOffset + target];
      if (weight == 0) continue;
      value += weight * values[targetOffset + target * stride + i];
    }
    if (!value.isFinite) return false;
    values[outputOffset + i] = value;
  }
  return true;
}
