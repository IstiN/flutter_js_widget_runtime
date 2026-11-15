import 'dart:typed_data';

import 'package:js_widget_runtime/src/renderer/nodes/three/three_native_packet.dart';

/// Full-rate native random walk for `webgl_custom_attributes_lines`.
///
/// The prepared module calls this private QuickJS lane once per frame with
/// the displacement attribute's bytes. Every component is updated; web and
/// engines without the lane retain the official `Math.random()` loop.
/// Xorshift32 keeps the same uniform random-walk distribution without
/// hundreds of thousands of interpreted random calls per frame.
final class ThreeLineWalkNative {
  ThreeLineWalkNative([int seed = 0x9e3779b9])
    : _state = seed & 0xffffffff == 0 ? 0x9e3779b9 : seed & 0xffffffff;

  int _state;

  bool apply(Uint8List bytes) {
    final values = readThreeFloat32Packet(bytes, 0);
    if (values == null) return false;
    var state = _state;
    for (var index = 0; index < values.length; index++) {
      state ^= (state << 13) & 0xffffffff;
      state ^= state >> 17;
      state ^= (state << 5) & 0xffffffff;
      state &= 0xffffffff;
      final random = state / 4294967296.0;
      values[index] += 0.3 * (0.5 - random);
    }
    _state = state;
    return true;
  }
}

/// Applies the custom-line vertex shader `position + displacement*amplitude`.
///
/// Float32 layout: count, amplitude, status, reserved, followed by source,
/// displacement and output XYZ regions. The packet is reused by the renderer;
/// source and displacement are restaged by JS before every native call.
bool applyThreeLinePositionsPacket(Uint8List bytes) {
  final values = readThreeFloat32Packet(bytes, 16);
  if (values == null) return false;
  values[2] = 0;
  final count = values[0].toInt();
  final amplitude = values[1];
  if (count <= 0 ||
      count > 4000000 ||
      values[0] != count ||
      !amplitude.isFinite) {
    return false;
  }
  final stride = count * 3;
  if (values.length != 4 + stride * 3) return false;
  final displacementOffset = 4 + stride;
  final outputOffset = displacementOffset + stride;
  for (var index = 0; index < stride; index++) {
    final source = values[4 + index];
    final displacement = values[displacementOffset + index];
    if (!source.isFinite || !displacement.isFinite) return false;
    values[outputOffset + index] = source + displacement * amplitude;
  }
  values[2] = 1;
  return true;
}
