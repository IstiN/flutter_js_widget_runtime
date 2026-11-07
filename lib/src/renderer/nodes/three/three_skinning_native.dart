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
  final header = _readSkinningHeader(values);
  if (header == null) return false;
  final indexOffset = header.matrixOffsetEnd;
  final weightOffset = indexOffset + header.vertexCount * 4;
  final positionOffset = weightOffset + header.vertexCount * 4;
  final normalOffset = positionOffset + header.vertexCount * 3;
  final expectedLength =
      normalOffset + (header.hasNormals ? header.vertexCount * 3 : 0);
  if (expectedLength != values.length) return false;
  values[3] = 0;

  for (var vertex = 0; vertex < header.vertexCount; vertex++) {
    if (!_skinVertex(
      values,
      header,
      indexOffset,
      weightOffset,
      positionOffset,
      normalOffset,
      vertex,
    )) {
      return false;
    }
  }
  values[3] = 1;
  return true;
}

/// Decoded and validated skinning packet header.
final class _SkinningHeader {
  const _SkinningHeader({
    required this.vertexCount,
    required this.boneCount,
    required this.hasNormals,
  });

  final int vertexCount;
  final int boneCount;
  final bool hasNormals;

  /// Float offset just past the bone matrices; bone index/weight pairs
  /// start here.
  int get matrixOffsetEnd => 4 + boneCount * 16;
}

/// Validates the packet header; returns null on non-integral counts or an
/// out-of-range `hasNormals` flag.
_SkinningHeader? _readSkinningHeader(Float32List values) {
  final vertexCount = values[0].toInt();
  final boneCount = values[1].toInt();
  final hasNormals = values[2].toInt();
  if (values[0] != vertexCount || values[1] != boneCount) return null;
  if (vertexCount <= 0 || boneCount <= 0) return null;
  // `hasNormals & ~1 != 0` rejects any value outside {0, 1}.
  if (hasNormals & ~1 != 0) return null;
  return _SkinningHeader(
    vertexCount: vertexCount,
    boneCount: boneCount,
    hasNormals: hasNormals == 1,
  );
}

/// Transforms `(x, y, z)` by the 16-float bone matrix at float offset `m`
/// (column-major, like the R1 stream).
(double, double, double) _transformPoint(
  Float32List values,
  int m,
  double x,
  double y,
  double z,
) => (
  values[m] * x + values[m + 4] * y + values[m + 8] * z + values[m + 12],
  values[m + 1] * x + values[m + 5] * y + values[m + 9] * z + values[m + 13],
  values[m + 2] * x + values[m + 6] * y + values[m + 10] * z + values[m + 14],
);

/// Rotates `(x, y, z)` by the 3x3 part of the bone matrix at `m` — normals
/// must not pick up the translation column.
(double, double, double) _transformNormal(
  Float32List values,
  int m,
  double x,
  double y,
  double z,
) => (
  values[m] * x + values[m + 4] * y + values[m + 8] * z,
  values[m + 1] * x + values[m + 5] * y + values[m + 9] * z,
  values[m + 2] * x + values[m + 6] * y + values[m + 10] * z,
);

/// Per-vertex skinning accumulators. The multiply-add order matches the
/// historical inline loop bit for bit: the strict R1 encoder hands these
/// floats to the versioned stream, and reassociation would change ulp.
final class _SkinningAccum {
  _SkinningAccum(this.x, this.y, this.z, this.nx, this.ny, this.nz,
      this.hasNormals);

  final double x;
  final double y;
  final double z;
  final double nx;
  final double ny;
  final double nz;
  final bool hasNormals;

  double ox = 0;
  double oy = 0;
  double oz = 0;
  double onx = 0;
  double ony = 0;
  double onz = 0;

  bool get isFinite =>
      ox.isFinite &&
      oy.isFinite &&
      oz.isFinite &&
      (!hasNormals || (onx.isFinite && ony.isFinite && onz.isFinite));

  /// Adds one bone influence (vertex-relative pair `iw`); returns false
  /// when the matrix offset or weight is invalid.
  bool accumulate(
    Float32List values,
    int indexOffset,
    int weightOffset,
    int iw,
  ) {
    final matrix = values[indexOffset + iw].toInt();
    final weight = values[weightOffset + iw];
    if (matrix < 0 || matrix + 15 >= indexOffset || !weight.isFinite) {
      return false;
    }
    if (weight == 0) return true;
    // Bone matrices start at float offset 4 in the packet.
    final m = 4 + matrix;
    final (tx, ty, tz) = _transformPoint(values, m, x, y, z);
    ox += weight * tx;
    oy += weight * ty;
    oz += weight * tz;
    if (hasNormals) {
      final (nx2, ny2, nz2) = _transformNormal(values, m, nx, ny, nz);
      onx += weight * nx2;
      ony += weight * ny2;
      onz += weight * nz2;
    }
    return true;
  }

  /// Writes the skinned position (always) and the renormalized normal
  /// (when the packet carries normals) back into the output region.
  void write(Float32List values, int p3, int n3) {
    values[p3] = ox;
    values[p3 + 1] = oy;
    values[p3 + 2] = oz;
    if (!hasNormals) return;
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

/// Skins one vertex in place; returns false on invalid influences or a
/// non-finite result.
bool _skinVertex(
  Float32List values,
  _SkinningHeader header,
  int indexOffset,
  int weightOffset,
  int positionOffset,
  int normalOffset,
  int vertex,
) {
  final p3 = positionOffset + vertex * 3;
  final x = values[p3];
  final y = values[p3 + 1];
  final z = values[p3 + 2];
  final n3 = normalOffset + vertex * 3;
  final nx = header.hasNormals ? values[n3] : 0.0;
  final ny = header.hasNormals ? values[n3 + 1] : 0.0;
  final nz = header.hasNormals ? values[n3 + 2] : 0.0;
  final accum = _SkinningAccum(x, y, z, nx, ny, nz, header.hasNormals);
  for (var influence = 0; influence < 4; influence++) {
    if (!accum.accumulate(
      values,
      indexOffset,
      weightOffset,
      vertex * 4 + influence,
    )) {
      return false;
    }
  }
  if (!accum.isFinite) return false;
  accum.write(values, p3, n3);
  return true;
}
