import 'dart:math' as math;
import 'dart:typed_data';

import 'package:js_widget_runtime/src/renderer/nodes/three/three_native_packet.dart';

/// Native numeric kernels for the official custom-attribute examples.
///
/// These are private QuickJS byte lanes, not a public jsr API or an R1 wire
/// change. Every lane writes a status word and leaves a JS fallback for other
/// engines or malformed/non-finite packets.
final class ThreeCustomAttributesNative {
  ThreeCustomAttributesNative([int seed = 0x9e3779b9])
    : _state = seed & 0xffffffff == 0 ? 0x9e3779b9 : seed & 0xffffffff;

  int _state;

  double _random() {
    var state = _state;
    state ^= (state << 13) & 0xffffffff;
    state ^= state >> 17;
    state ^= (state << 5) & 0xffffffff;
    state &= 0xffffffff;
    _state = state;
    return state / 4294967296.0;
  }

  /// Float32 layout: count, time, status, reserved, displacement[count],
  /// noise[count]. The prepared module keeps both official arrays as
  /// subviews of this one packet, so no per-frame staging copy is needed.
  bool applyDisplacement(Uint8List bytes) {
    final values = readThreeFloat32Packet(bytes, 12);
    if (values == null) return false;
    values[2] = 0;
    final count = values[0].toInt();
    final time = values[1];
    if (count <= 0 ||
        count > 4000000 ||
        values[0] != count ||
        !time.isFinite ||
        values.length != 4 + count * 2) {
      return false;
    }
    final noiseOffset = 4 + count;
    for (var i = 0; i < count; i++) {
      final noiseIndex = noiseOffset + i;
      var noise = values[noiseIndex];
      if (!noise.isFinite) return false;
      values[4 + i] = math.sin(0.1 * i + time);
      noise += 0.5 * (0.5 - _random());
      noise = noise.clamp(-5.0, 5.0);
      values[noiseIndex] = noise;
      values[4 + i] += noise;
      if (!values[4 + i].isFinite) return false;
    }
    values[2] = 1;
    return true;
  }
}

typedef ThreeBytesHostRegistrar =
    void Function(
      String name,
      void Function(String name, Uint8List data) callback,
    );

/// Registers the shared synchronous lane on both QuickJS engine backends.
void registerThreeCustomAttributesNative(ThreeBytesHostRegistrar register) {
  final customAttributes = ThreeCustomAttributesNative();
  register('__jsrCustomAttributeBytes', (name, data) {
    if (name == 'three.displacement') customAttributes.applyDisplacement(data);
    if (name == 'three.tessellation') applyThreeTessellationPacket(data);
    if (name == 'three.pointSizes') applyThreePointSizesPacket(data);
  });
}

/// Evaluates `position + normal * (displacement * amplitude)` in place.
///
/// Float32 layout: count, amplitude, status, normalBound/sweep, source XYZ,
/// normal XYZ, scalar displacement, output XYZ. Source/normal/target storage
/// is cached by JS; only the scalar displacement is restaged each frame.
bool applyThreeTessellationPacket(Uint8List bytes) {
  final values = readThreeFloat32Packet(bytes, 16);
  if (values == null) return false;
  values[2] = 0;
  if (!_validTessellationHeader(values)) return false;
  final count = values[0].toInt();
  final amplitude = values[1];
  final normalBound = values[3];
  final stride = count * 3;
  final normalOffset = 4 + stride;
  final displacementOffset = normalOffset + stride;
  final outputOffset = displacementOffset + count;
  var maxDisplacement = 0.0;
  for (var i = 0, i3 = 0; i < count; i++, i3 += 3) {
    final scalar = values[displacementOffset + i];
    if (!scalar.isFinite) return false;
    final absolute = scalar.abs();
    if (absolute > maxDisplacement) maxDisplacement = absolute;
    final displacement = scalar * amplitude;
    for (var component = 0; component < 3; component++) {
      final source = values[4 + i3 + component];
      final normal = values[normalOffset + i3 + component];
      if (!source.isFinite || !normal.isFinite) return false;
      final output = source + normal * displacement;
      if (!output.isFinite) return false;
      values[outputOffset + i3 + component] = output;
    }
  }
  values[3] = normalBound * maxDisplacement;
  values[2] = 1;
  return true;
}

bool _validTessellationHeader(Float32List values) {
  final count = values[0].toInt();
  final amplitude = values[1];
  final normalBound = values[3];
  return count > 0 &&
      count <= 4000000 &&
      values[0] == count &&
      amplitude.isFinite &&
      normalBound.isFinite &&
      normalBound >= 0 &&
      values.length == 4 + count * 10;
}

/// Evaluates the three official animated point-size fields.
///
/// Float32 layout: count, time, mode, vertices1, status, reserved[3],
/// sinPhase[count], cosPhase[count], output[count]. Modes are custom points,
/// buffergeometry particles and points3 respectively. Phase tables are
/// cached; only time changes per frame.
bool applyThreePointSizesPacket(Uint8List bytes) {
  final values = readThreeFloat32Packet(bytes, 32);
  if (values == null) return false;
  values[4] = 0;
  if (!_validPointSizesHeader(values)) return false;
  final count = values[0].toInt();
  final time = values[1];
  final mode = values[2].toInt();
  final vertices1 = values[3].toInt();
  final phaseTime = mode == 2 ? 0.6 * time : time;
  final timeSin = math.sin(phaseTime);
  final timeCos = math.cos(phaseTime);
  final cosOffset = 8 + count;
  final outputOffset = cosOffset + count;
  for (var i = 0; i < count; i++) {
    final sinPhase = values[8 + i];
    final cosPhase = values[cosOffset + i];
    if (!sinPhase.isFinite || !cosPhase.isFinite) return false;
    final sine = sinPhase * timeCos + cosPhase * timeSin;
    final size = switch (mode) {
      0 => 14 + 13 * sine,
      1 => 10 * (1 + sine),
      _ => i < vertices1 ? math.max(0.0, 26 + 32 * sine) : 40.0,
    };
    if (!size.isFinite) return false;
    values[outputOffset + i] = size;
  }
  values[4] = 1;
  return true;
}

bool _validPointSizesHeader(Float32List values) {
  final count = values[0].toInt();
  final mode = values[2].toInt();
  final vertices1 = values[3].toInt();
  return count > 0 &&
      count <= 4000000 &&
      values[0] == count &&
      values[1].isFinite &&
      values[2] == mode &&
      mode >= 0 &&
      mode <= 2 &&
      values[3] == vertices1 &&
      vertices1 >= 0 &&
      vertices1 <= count &&
      values.length == 8 + count * 3;
}
