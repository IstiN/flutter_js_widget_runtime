import 'dart:math' as math;
import 'dart:typed_data';

import 'package:js_widget_runtime/src/renderer/nodes/three/three_native_packet.dart';

/// Applies R1's CPU skinning packet synchronously in place.
///
/// Layout (all values are float32; bone indices are exactly represented):
///   0 vertexCount, 1 boneCount, 2 hasNormals, 3 status,
///   then bone matrices, four index/weight pairs per vertex, positions,
///   and optionally normals. Positions and normals are the output region.
///
/// This private lane is used only inside QuickJS. It avoids a per-vertex JS
/// loop without changing the public jsr API or the versioned R1 stream.
bool applyThreeSkinningPacket(Uint8List bytes) {
  final values = readThreeFloat32Packet(bytes, 16);
  if (values == null) return false;
  final vertexCount = values[0].toInt();
  final boneCount = values[1].toInt();
  final hasNormals = values[2].toInt();
  if (values[0] != vertexCount ||
      values[1] != boneCount ||
      vertexCount <= 0 ||
      boneCount <= 0 ||
      (hasNormals != 0 && hasNormals != 1)) {
    return false;
  }
  final matrixOffset = 4;
  final indexOffset = matrixOffset + boneCount * 16;
  final weightOffset = indexOffset + vertexCount * 4;
  final positionOffset = weightOffset + vertexCount * 4;
  final normalOffset = positionOffset + vertexCount * 3;
  final expectedLength = normalOffset + (hasNormals == 1 ? vertexCount * 3 : 0);
  if (expectedLength != values.length) return false;
  values[3] = 0;

  for (var vertex = 0; vertex < vertexCount; vertex++) {
    final p3 = positionOffset + vertex * 3;
    final x = values[p3];
    final y = values[p3 + 1];
    final z = values[p3 + 2];
    final n3 = normalOffset + vertex * 3;
    final nx = hasNormals == 1 ? values[n3] : 0.0;
    final ny = hasNormals == 1 ? values[n3 + 1] : 0.0;
    final nz = hasNormals == 1 ? values[n3 + 2] : 0.0;
    var ox = 0.0, oy = 0.0, oz = 0.0;
    var onx = 0.0, ony = 0.0, onz = 0.0;
    for (var influence = 0; influence < 4; influence++) {
      final iw = vertex * 4 + influence;
      final matrix = values[indexOffset + iw].toInt();
      final weight = values[weightOffset + iw];
      if (matrix < 0 || matrix + 15 >= indexOffset || !weight.isFinite) {
        return false;
      }
      if (weight == 0) continue;
      final m = matrixOffset + matrix;
      ox +=
          weight *
          (values[m] * x +
              values[m + 4] * y +
              values[m + 8] * z +
              values[m + 12]);
      oy +=
          weight *
          (values[m + 1] * x +
              values[m + 5] * y +
              values[m + 9] * z +
              values[m + 13]);
      oz +=
          weight *
          (values[m + 2] * x +
              values[m + 6] * y +
              values[m + 10] * z +
              values[m + 14]);
      if (hasNormals == 1) {
        onx +=
            weight * (values[m] * nx + values[m + 4] * ny + values[m + 8] * nz);
        ony +=
            weight *
            (values[m + 1] * nx + values[m + 5] * ny + values[m + 9] * nz);
        onz +=
            weight *
            (values[m + 2] * nx + values[m + 6] * ny + values[m + 10] * nz);
      }
    }
    if (!ox.isFinite ||
        !oy.isFinite ||
        !oz.isFinite ||
        (hasNormals == 1 &&
            (!onx.isFinite || !ony.isFinite || !onz.isFinite))) {
      return false;
    }
    values[p3] = ox;
    values[p3 + 1] = oy;
    values[p3 + 2] = oz;
    if (hasNormals == 1) {
      // Divide (not multiply by the reciprocal) so the output bytes match
      // the QuickJS fallback loop bit for bit: the strict R1 encoder hands
      // these floats to the versioned stream, and `x / length` vs
      // `x * (1 / length)` can differ in the last ulp. The zero guard
      // mirrors the JS `Math.sqrt(dot) || 1` fallback exactly.
      final length = math.sqrt(onx * onx + ony * ony + onz * onz);
      final scale = length == 0 ? 1.0 : length;
      values[n3] = onx / scale;
      values[n3 + 1] = ony / scale;
      values[n3 + 2] = onz / scale;
    }
  }
  values[3] = 1;
  return true;
}
