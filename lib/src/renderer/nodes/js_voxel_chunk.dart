part of 'js_voxel_node.dart';

/// Vertex buffers for one voxel chunk, uploaded by the widget JS via
/// `jsr.hostCall('voxel.mesh', ...)` and kept resident on the Dart side.
///
/// Layout mirrors the face-culling mesher contract (flat arrays so the
/// async bridge carries plain JSON numbers): chunk-local `positions`
/// (xyz per vertex), `colors` (rgb per vertex, 0..1), triangle `indices`
/// and the world-space `origin` the buffers are translated by. Chunks are
/// replaced wholesale on re-upload — an edit remeshes one chunk and pushes
/// its new buffers; untouched chunks keep theirs.
class JsVoxelChunk {
  JsVoxelChunk({
    required this.positions,
    required this.colors,
    required this.indices,
    required this.origin,
    this.overlay = false,
  }) : vertexCount = positions.length ~/ 3,
       faceCount = indices.length ~/ 3,
       aabbMin = _boundsMin(positions),
       aabbMax = _boundsMax(positions),
       _planeAxes = Int32List(indices.length ~/ 3),
       _planeCoordinates = Float64List(indices.length ~/ 3) {
    _buildPlaneData();
  }

  /// Parses a `voxel.mesh` hostCall payload. Returns null for garbage
  /// (wrong arities, out-of-range indices) so a single bad upload cannot
  /// wedge the renderer.
  static JsVoxelChunk? fromDynamic(Map<String, dynamic> args) {
    final buffers = _parseBuffers(args);
    if (buffers == null) return null;
    if (!_indicesInBounds(buffers.$3, buffers.$1.length ~/ 3)) return null;
    return JsVoxelChunk(
      positions: buffers.$1,
      colors: buffers.$2,
      indices: buffers.$3,
      origin: buffers.$4,
      overlay: args['overlay'] == true,
    );
  }

  /// Parses the shared binary envelope (magic `'JVXM'`, version 1, u32
  /// raw header length, NUL-padded header JSON to 4-byte alignment) for
  /// `voxel.mesh.bin` / `voxel.blocks.bin`. Returns `(header, bodyStart)`
  /// or null for garbage; copy any retained slices from [data].
  static (Map<String, dynamic>, int)? parseBinaryEnvelope(Uint8List data) {
    if (data.length < 16) return null;
    final bd = ByteData.sublistView(data);
    if (bd.getUint32(0, Endian.little) != 0x4A56584D) return null;
    if (bd.getUint32(4, Endian.little) != 1) return null;
    final headerLen = bd.getUint32(8, Endian.little);
    final paddedLen = headerLen + (4 - headerLen % 4) % 4;
    final bodyStart = 12 + paddedLen;
    if (headerLen < 2 || bodyStart > data.length) return null;
    try {
      final header =
          jsonDecode(utf8.decode(data.sublist(12, 12 + headerLen)))
              as Map<String, dynamic>;
      return (header, bodyStart);
    } catch (_) {
      return null;
    }
  }

  static (String, String, JsVoxelChunk)? fromBinary(Uint8List data) {
    final envelope = parseBinaryEnvelope(data);
    if (envelope == null) return null;
    final (header, bodyStart) = envelope;
    final names = _parseMeshHeader(header);
    if (names == null) return null;
    final (id, key, origin) = names;
    final counts = _meshBodyCounts(header, data.length, bodyStart);
    if (counts == null) return null;
    final (vertexCount, ni) = counts;
    final chunk = _readMeshBody(
      data,
      bodyStart,
      vertexCount: vertexCount,
      ni: ni,
      origin: origin,
      overlay: header['overlay'] == true,
    );
    if (chunk == null) return null;
    return (id, key, chunk);
  }

  /// `(id, key, origin)` from the mesh header, or null for garbage.
  static (String, String, Float32List)? _parseMeshHeader(
    Map<String, dynamic> header,
  ) {
    final id = header['id']?.toString() ?? '';
    final key = header['key']?.toString() ?? '';
    final originRaw = header['origin'];
    if (id.isEmpty || key.isEmpty || originRaw is! List) return null;
    if (originRaw.length != 3) return null;
    final origin = Float32List(3);
    for (var a = 0; a < 3; a++) {
      if (originRaw[a] is! num) return null;
      origin[a] = (originRaw[a] as num).toDouble();
    }
    return (id, key, origin);
  }

  /// `(vertexCount, indexCount)` implied by the header + body length, or
  /// null when the arithmetic does not close (6 words per vertex — 3 f32
  /// positions + 3 f32 colors — plus 1 word per index).
  static (int, int)? _meshBodyCounts(
    Map<String, dynamic> header,
    int dataLength,
    int bodyStart,
  ) {
    final ni = header['ni'];
    if (ni is! int || ni < 3 || ni % 3 != 0) return null;
    final rest = dataLength - bodyStart;
    if (rest <= 0 || rest % 4 != 0) return null;
    final words = rest ~/ 4;
    if (words <= ni || (words - ni) % 6 != 0) return null;
    final vertexCount = (words - ni) ~/ 6;
    return (vertexCount, ni);
  }

  /// Reads the f32/u32 body into a chunk; null when indices point
  /// outside the vertex range.
  static JsVoxelChunk? _readMeshBody(
    Uint8List data,
    int bodyStart, {
    required int vertexCount,
    required int ni,
    required Float32List origin,
    required bool overlay,
  }) {
    final bd = ByteData.sublistView(data);
    final positions = Float32List(vertexCount * 3);
    final colors = Float32List(vertexCount * 3);
    final indices = Uint32List(ni);
    var off = bodyStart;
    for (var i = 0; i < positions.length; i++) {
      positions[i] = bd.getFloat32(off, Endian.little);
      off += 4;
    }
    for (var i = 0; i < colors.length; i++) {
      colors[i] = bd.getFloat32(off, Endian.little);
      off += 4;
    }
    for (var i = 0; i < ni; i++) {
      indices[i] = bd.getUint32(off, Endian.little);
      off += 4;
    }
    if (!_indicesInBounds(indices, vertexCount)) return null;
    return JsVoxelChunk(
      positions: positions,
      colors: colors,
      indices: indices,
      origin: origin,
      overlay: overlay,
    );
  }

  /// (positions, colors, indices, origin) or null when any buffer is
  /// missing or shaped wrong.
  static (Float32List, Float32List, Uint32List, Float32List)? _parseBuffers(
    Map<String, dynamic> args,
  ) {
    final positions = _floats(args['positions']);
    final colors = _floats(args['colors']);
    final indices = _ints(args['indices']);
    final origin = _floats(args['origin'], fixed: 3);
    if (positions == null || colors == null || indices == null) return null;
    if (origin == null || origin.length != 3) return null;
    if (positions.isEmpty ||
        positions.length % 3 != 0 ||
        colors.length != positions.length ||
        indices.isEmpty ||
        indices.length % 3 != 0) {
      return null;
    }
    return (positions, colors, indices, origin);
  }

  static bool _indicesInBounds(Uint32List indices, int vertexCount) {
    for (final i in indices) {
      if (i < 0 || i >= vertexCount) return false;
    }
    return true;
  }

  final Float32List positions;
  final Float32List colors;
  final Uint32List indices;
  final Float32List origin;
  final int vertexCount;

  /// Overlay chunks (aim markers, ghosts) depth-bias toward the camera so
  /// they win the painter's sort against the coplanar geometry they hug.
  final bool overlay;
  final int faceCount;

  /// Tight bounds computed once at upload — the painter uses them for
  /// chunk-level frustum culling.
  final Float32List aabbMin;
  final Float32List aabbMax;

  /// Exact axis-plane keys per source triangle; -1 means a generic plane.
  /// Computed at upload so the full overlap pass can skip coplanar voxel
  /// faces without repeating perspective-plane checks every refresh.
  final Int32List _planeAxes;
  final Float64List _planeCoordinates;

  void _buildPlaneData() {
    _planeAxes.fillRange(0, _planeAxes.length, -1);
    for (var f = 0; f < faceCount; f++) {
      final p0 = indices[f * 3] * 3;
      final p1 = indices[f * 3 + 1] * 3;
      final p2 = indices[f * 3 + 2] * 3;
      final ux = positions[p1] - positions[p0];
      final uy = positions[p1 + 1] - positions[p0 + 1];
      final uz = positions[p1 + 2] - positions[p0 + 2];
      final vx = positions[p2] - positions[p0];
      final vy = positions[p2 + 1] - positions[p0 + 1];
      final vz = positions[p2 + 2] - positions[p0 + 2];
      final nx = uy * vz - uz * vy;
      final ny = uz * vx - ux * vz;
      final nz = ux * vy - uy * vx;
      final nonZero = (nx != 0 ? 1 : 0) + (ny != 0 ? 1 : 0) + (nz != 0 ? 1 : 0);
      if (nonZero != 1) continue;
      final axis = nx != 0 ? 0 : (ny != 0 ? 1 : 2);
      _planeAxes[f] = axis;
      _planeCoordinates[f] = positions[p0 + axis] + origin[axis];
    }
  }
}

Float32List? _floats(dynamic raw, {int? fixed}) {
  if (raw is! List) return null;
  if (fixed != null && raw.length != fixed) return null;
  final out = Float32List(raw.length);
  for (var i = 0; i < raw.length; i++) {
    final v = raw[i];
    if (v is! num) return null;
    out[i] = v.toDouble();
  }
  return out;
}

Uint32List? _ints(dynamic raw) {
  if (raw is! List) return null;
  final out = Uint32List(raw.length);
  for (var i = 0; i < raw.length; i++) {
    final v = raw[i];
    if (v is! num) return null;
    out[i] = v.toInt();
  }
  return out;
}

Float32List _boundsMin(Float32List positions) {
  final out = Float32List(3);
  for (var a = 0; a < 3; a++) {
    var m = double.infinity;
    for (var i = a; i < positions.length; i += 3) {
      if (positions[i] < m) m = positions[i];
    }
    out[a] = m == double.infinity ? 0 : m;
  }
  return out;
}

Float32List _boundsMax(Float32List positions) {
  final out = Float32List(3);
  for (var a = 0; a < 3; a++) {
    var m = double.negativeInfinity;
    for (var i = a; i < positions.length; i += 3) {
      if (positions[i] > m) m = positions[i];
    }
    out[a] = m == double.negativeInfinity ? 0 : m;
  }
  return out;
}
