part of 'three_draw_plan.dart';

final class ThreeInterleavedGeometry {
  const ThreeInterleavedGeometry({
    required this.vertices,
    required this.indices,
    required this.wireIndices,
    required this.vertexCount,
    required this.indexCount,
  });

  static const int strideInBytes = 80;
  final ByteData vertices;
  final ByteData? indices;
  final ByteData? wireIndices;
  final int vertexCount;
  final int indexCount;
}

/// Packs position/normal/uv/color/skin into 80-byte vertices and checked u32
/// indices. Missing normals face +Z, UVs are zero, colors are opaque white,
/// and missing skin attributes select bone zero with unit weight.
ThreeInterleavedGeometry interleaveThreeGeometry(
  JsThreeGeometryUpsert geometry,
) {
  final error = validateThreeGeometry(geometry);
  if (error != null) throw ThreeDrawPlanException(error);
  final vertexBytes = _product(
    geometry.vertexCount,
    ThreeInterleavedGeometry.strideInBytes,
  );
  final vertices = ByteData(vertexBytes);
  for (var vertex = 0; vertex < geometry.vertexCount; vertex++) {
    final offset = vertex * ThreeInterleavedGeometry.strideInBytes;
    for (var component = 0; component < 3; component++) {
      vertices.setFloat32(
        offset + component * 4,
        geometry.positions[vertex * 3 + component],
        Endian.little,
      );
      vertices.setFloat32(
        offset + 12 + component * 4,
        geometry.normals?[vertex * 3 + component] ??
            (component == 2 ? 1.0 : 0.0),
        Endian.little,
      );
    }
    for (var component = 0; component < 2; component++) {
      vertices.setFloat32(
        offset + 24 + component * 4,
        geometry.uvs?[vertex * 2 + component] ?? 0.0,
        Endian.little,
      );
    }
    for (var component = 0; component < 4; component++) {
      final color = geometry.colors;
      final value = color == null
          ? 1.0
          : component < geometry.colorStride
          ? color[vertex * geometry.colorStride + component]
          : 1.0;
      vertices.setFloat32(offset + 32 + component * 4, value, Endian.little);
    }
    for (var component = 0; component < 4; component++) {
      vertices.setFloat32(
        offset + 48 + component * 4,
        geometry.skinIndices?[vertex * 4 + component] ?? 0.0,
        Endian.little,
      );
      vertices.setFloat32(
        offset + 64 + component * 4,
        geometry.skinWeights?[vertex * 4 + component] ??
            (component == 0 ? 1.0 : 0.0),
        Endian.little,
      );
    }
  }

  final indices = _interleaveThreeIndices(
    geometry.indices,
    geometry.indexCount,
  );
  final wireIndices = _interleaveThreeIndices(geometry.wireIndices);
  return ThreeInterleavedGeometry(
    vertices: vertices,
    indices: indices,
    wireIndices: wireIndices,
    vertexCount: geometry.vertexCount,
    indexCount: geometry.indexCount,
  );
}

ByteData? _interleaveThreeIndices(List<int>? source, [int? count]) {
  final length = count ?? source?.length ?? 0;
  if (source == null || length == 0) return null;
  final indices = ByteData(_product(length, 4));
  for (var index = 0; index < length; index++) {
    indices.setUint32(index * 4, source[index], Endian.little);
  }
  return indices;
}
