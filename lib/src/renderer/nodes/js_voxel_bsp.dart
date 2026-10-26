part of 'js_voxel_node.dart';

final Expando<Map<String, _VoxelBspCache>> _worldBspCaches =
    Expando<Map<String, _VoxelBspCache>>('voxel-bsp-cache');

_VoxelBspCache _voxelBspCacheFor(JsVoxelWorld world, String id) {
  var caches = _worldBspCaches[world];
  if (caches == null) {
    caches = <String, _VoxelBspCache>{};
    _worldBspCaches[world] = caches;
  }
  return caches.putIfAbsent(id, _VoxelBspCache.new);
}

/// One world-space triangle fragment. RGB is interpolated when a BSP plane
/// splits the source; UVs are intentionally recomputed from world positions
/// by the existing textured projection path.
class _BspTri {
  _BspTri(
    this.chunk,
    this.key,
    this.sourceTri,
    this.serial,
    this.world,
    this.color,
    this.nx,
    this.ny,
    this.nz,
  );

  factory _BspTri.source(
    JsVoxelChunk chunk,
    String key,
    int sourceTri,
    int serial,
  ) {
    final world = Float32List(9), color = Float32List(9);
    final positions = chunk.positions, colors = chunk.colors;
    final origin = chunk.origin, indices = chunk.indices;
    for (var v = 0; v < 3; v++) {
      final p = indices[sourceTri * 3 + v] * 3;
      world[v * 3] = positions[p] + origin[0];
      world[v * 3 + 1] = positions[p + 1] + origin[1];
      world[v * 3 + 2] = positions[p + 2] + origin[2];
      color[v * 3] = colors[p];
      color[v * 3 + 1] = colors[p + 1];
      color[v * 3 + 2] = colors[p + 2];
    }
    final normal = _BspPlane.normal(world);
    return _BspTri(
      chunk,
      key,
      sourceTri,
      serial,
      world,
      color,
      normal.$1,
      normal.$2,
      normal.$3,
    );
  }

  final JsVoxelChunk chunk;
  final String key;
  final int sourceTri;
  final int serial;
  final Float32List world;
  final Float32List color;
  final double nx, ny, nz;

  _BspTri fragment(Float32List positions, Float32List colors, int serial) {
    return _BspTri(
      chunk,
      key,
      sourceTri,
      serial,
      positions,
      colors,
      nx,
      ny,
      nz,
    );
  }
}

class _BspPlane {
  const _BspPlane(this.nx, this.ny, this.nz, this.d);

  final double nx, ny, nz, d;

  double distance(Float32List p, int vertex) {
    final o = vertex * 3;
    return nx * p[o] + ny * p[o + 1] + nz * p[o + 2] + d;
  }

  static (double, double, double) normal(Float32List p) {
    final ux = p[3] - p[0], uy = p[4] - p[1], uz = p[5] - p[2];
    final vx = p[6] - p[0], vy = p[7] - p[1], vz = p[8] - p[2];
    final nx = uy * vz - uz * vy;
    final ny = uz * vx - ux * vz;
    final nz = ux * vy - uy * vx;
    final length = math.sqrt(nx * nx + ny * ny + nz * nz);
    if (length < 1e-12) return (0, 0, 0);
    return (nx / length, ny / length, nz / length);
  }

  static _BspPlane fromTriangle(Float32List p) {
    final n = normal(p);
    return _BspPlane(
      n.$1,
      n.$2,
      n.$3,
      -(n.$1 * p[0] + n.$2 * p[1] + n.$3 * p[2]),
    );
  }
}

class _BspNode {
  _BspNode(this.plane, this.tris) : hasPlane = true;
  _BspNode.leaf()
    : plane = const _BspPlane(0, 0, 0, 0),
      tris = <_BspTri>[],
      hasPlane = false;

  final _BspPlane plane;
  final bool hasPlane;
  final List<_BspTri> tris;
  final List<_BspTri> dynamicTris = <_BspTri>[];
  _BspNode? front, back;
  Float32List? staticBounds;
  Float32List? dynamicBounds;
  int dynamicGeneration = -1;
  int dynamicBoundsGeneration = -1;
}

Float32List _emptyBspBounds() => Float32List.fromList([
  double.infinity,
  double.infinity,
  double.infinity,
  double.negativeInfinity,
  double.negativeInfinity,
  double.negativeInfinity,
]);

void _growBspBounds(Float32List bounds, _BspTri tri) {
  final p = tri.world;
  for (var v = 0; v < 3; v++) {
    final o = v * 3, x = p[o], y = p[o + 1], z = p[o + 2];
    bounds[0] = math.min(bounds[0], x);
    bounds[1] = math.min(bounds[1], y);
    bounds[2] = math.min(bounds[2], z);
    bounds[3] = math.max(bounds[3], x);
    bounds[4] = math.max(bounds[4], y);
    bounds[5] = math.max(bounds[5], z);
  }
}

void _mergeBspBounds(Float32List bounds, Float32List child) {
  for (var a = 0; a < 3; a++) {
    bounds[a] = math.min(bounds[a], child[a]);
    bounds[a + 3] = math.max(bounds[a + 3], child[a + 3]);
  }
}

class _VoxelBspCache {
  final List<String> _keys = <String>[];
  final List<JsVoxelChunk> _chunks = <JsVoxelChunk>[];
  final Map<JsVoxelChunk, bool> visible = <JsVoxelChunk, bool>{};
  final Map<JsVoxelChunk, Set<_BspNode>> _staticLocations =
      <JsVoxelChunk, Set<_BspNode>>{};
  final _VoxelOrderingWorkspace dynamicOrdering = _VoxelOrderingWorkspace();
  _BspNode? root;
  bool _hasSnapshot = false;
  int _serial = 0;
  int generation = 0;
  int buildUs = 0;
  int buildGeneration = 0;
  int sourceCount = 0;
  int fragmentCount = 0;
  int nodeCount = 0;
  int splitCount = 0;
  int dynamicSplitCount = 0;
  bool overflow = false;
  static const int maxDepth = 80;

  int syncGeneration = 0;

  bool ensure(Map<String, JsVoxelChunk> chunks) {
    if (_hasSnapshot && _sameChunks(chunks)) {
      return !overflow && root != null;
    }
    if (!_hasSnapshot || root == null || overflow) {
      return _rebuild(chunks);
    }
    return _syncChunks(chunks);
  }

  bool _rebuild(Map<String, JsVoxelChunk> chunks) {
    _keys.clear();
    _chunks.clear();
    _staticLocations.clear();
    final input = <_BspTri>[];
    for (final entry in chunks.entries) {
      final key = entry.key, chunk = entry.value;
      if (key.startsWith('__') || chunk.overlay) continue;
      _keys.add(key);
      _chunks.add(chunk);
      _appendSourceTriangles(input, chunk, key);
    }
    _hasSnapshot = true;
    sourceCount = input.length;
    fragmentCount = input.length;
    nodeCount = 0;
    splitCount = 0;
    dynamicSplitCount = 0;
    overflow = false;
    buildGeneration++;
    final sw = Stopwatch()..start();
    root = _build(input, 0);
    buildUs = sw.elapsedMicroseconds;
    return !overflow && root != null;
  }

  bool _syncChunks(Map<String, JsVoxelChunk> chunks) {
    final sw = Stopwatch()..start();
    final previous = <String, JsVoxelChunk>{
      for (var i = 0; i < _keys.length; i++) _keys[i]: _chunks[i],
    };
    final keys = <String>[], current = <JsVoxelChunk>[];
    final changed = <String, JsVoxelChunk>{};
    final present = <String>{};
    final retired = <JsVoxelChunk>{};
    var sources = 0;
    for (final entry in chunks.entries) {
      final key = entry.key, chunk = entry.value;
      if (key.startsWith('__') || chunk.overlay) continue;
      keys.add(key);
      current.add(chunk);
      present.add(key);
      sources += chunk.indices.length ~/ 3;
      final old = previous[key];
      if (!identical(old, chunk)) {
        if (old != null) retired.add(old);
        changed[key] = chunk;
      }
    }
    for (final entry in previous.entries) {
      if (!present.contains(entry.key)) retired.add(entry.value);
    }
    _keys
      ..clear()
      ..addAll(keys);
    _chunks
      ..clear()
      ..addAll(current);
    sourceCount = sources;
    if (retired.isNotEmpty) _pruneRetired(retired);
    final input = <_BspTri>[];
    for (final entry in changed.entries) {
      _appendSourceTriangles(input, entry.value, entry.key);
    }
    fragmentCount += input.length;
    root = _insertStaticBatch(root, input, 0);
    syncGeneration++;
    buildUs = sw.elapsedMicroseconds;
    if (overflow) return _rebuild(chunks);
    return root != null;
  }

  void _pruneRetired(Set<JsVoxelChunk> retired) {
    for (final chunk in retired) {
      final nodes = _staticLocations.remove(chunk);
      if (nodes == null) continue;
      for (final node in nodes) {
        final before = node.tris.length;
        node.tris.removeWhere((tri) => identical(tri.chunk, chunk));
        fragmentCount -= before - node.tris.length;
      }
    }
  }

  void _registerStatic(_BspNode node, List<_BspTri> triangles) {
    for (final tri in triangles) {
      _staticLocations.putIfAbsent(tri.chunk, () => <_BspNode>{}).add(node);
    }
  }

  void _updateStaticBounds(_BspNode node) {
    Float32List? bounds;
    for (final tri in node.tris) {
      bounds ??= _emptyBspBounds();
      _growBspBounds(bounds, tri);
    }
    for (final child in [node.front, node.back]) {
      final childBounds = child?.staticBounds;
      if (childBounds == null) continue;
      bounds ??= _emptyBspBounds();
      _mergeBspBounds(bounds, childBounds);
    }
    node.staticBounds = bounds;
  }

  void _includeDynamicBounds(_BspNode node, _BspTri tri) {
    var bounds = node.dynamicBounds;
    if (node.dynamicBoundsGeneration != generation) {
      bounds ??= Float32List(6);
      for (var a = 0; a < 3; a++) {
        bounds[a] = tri.world[a];
        bounds[a + 3] = tri.world[a];
      }
      node.dynamicBounds = bounds;
      node.dynamicBoundsGeneration = generation;
    }
    _growBspBounds(bounds!, tri);
  }

  void _appendSourceTriangles(
    List<_BspTri> input,
    JsVoxelChunk chunk,
    String key,
  ) {
    for (var f = 0; f + 2 < chunk.indices.length; f += 3) {
      final tri = _BspTri.source(chunk, key, f ~/ 3, _serial++);
      if (tri.nx == 0 && tri.ny == 0 && tri.nz == 0) continue;
      input.add(tri);
    }
  }

  bool _sameChunks(Map<String, JsVoxelChunk> chunks) {
    var expected = 0;
    for (final entry in chunks.entries) {
      if (entry.key.startsWith('__') || entry.value.overlay) continue;
      expected++;
    }
    if (expected != _keys.length) return false;
    var i = 0;
    for (final entry in chunks.entries) {
      if (entry.key.startsWith('__') || entry.value.overlay) continue;
      if (_keys[i] != entry.key || !identical(_chunks[i], entry.value)) {
        return false;
      }
      i++;
    }
    return true;
  }

  ({List<_BspTri> coplanar, List<_BspTri> front, List<_BspTri> back})
  _partitionTriangles(List<_BspTri> input, _BspPlane plane) {
    final coplanar = <_BspTri>[], front = <_BspTri>[], back = <_BspTri>[];
    for (final tri in input) {
      final classification = _classify(plane, tri);
      if (classification == 0) {
        coplanar.add(tri);
      } else if (classification == 1) {
        front.add(tri);
      } else if (classification == -1) {
        back.add(tri);
      } else {
        final pieces = _split(tri, plane);
        splitCount++;
        fragmentCount += pieces.$1.length + pieces.$2.length - 1;
        front.addAll(pieces.$1);
        back.addAll(pieces.$2);
      }
    }
    return (coplanar: coplanar, front: front, back: back);
  }

  /// Inserts a resident-chunk batch without rebuilding existing terrain.
  /// Replaced/removed chunks are pruned from their nodes, so edits and
  /// streaming do not pay the full 129k-triangle plane rebuild.
  _BspNode? _insertStaticBatch(_BspNode? node, List<_BspTri> input, int depth) {
    if (input.isEmpty) return node;
    if (depth > maxDepth || fragmentCount > sourceCount * 5 + 64) {
      overflow = true;
      return node;
    }
    if (node == null || !node.hasPlane) return _build(input, depth);
    final parts = _partitionTriangles(input, node.plane);
    node.tris.addAll(parts.coplanar);
    _registerStatic(node, parts.coplanar);
    node.front = _insertStaticBatch(node.front, parts.front, depth + 1);
    if (overflow) return node;
    node.back = _insertStaticBatch(node.back, parts.back, depth + 1);
    _updateStaticBounds(node);
    return node;
  }

  _BspNode? _build(List<_BspTri> input, int depth) {
    if (input.isEmpty) return null;
    if (depth > maxDepth || fragmentCount > sourceCount * 5 + 64) {
      overflow = true;
      return null;
    }
    final plane = _choosePlane(input);
    final parts = _partitionTriangles(input, plane);
    final node = _BspNode(plane, parts.coplanar);
    _registerStatic(node, parts.coplanar);
    nodeCount++;
    if (overflow) return node;
    node.front = _build(parts.front, depth + 1);
    if (overflow) return node;
    node.back = _build(parts.back, depth + 1);
    _updateStaticBounds(node);
    return node;
  }

  _BspPlane _choosePlane(List<_BspTri> input) {
    const candidateCount = 6;
    const sampleCount = 40;
    var best = _BspPlane.fromTriangle(input[input.length ~/ 2].world);
    var bestScore = double.infinity;
    for (var c = 0; c < candidateCount; c++) {
      final index = (c * (input.length - 1) / (candidateCount - 1)).round();
      final plane = _BspPlane.fromTriangle(input[index].world);
      if (plane.nx == 0 && plane.ny == 0 && plane.nz == 0) continue;
      var front = 0, back = 0, splits = 0, coplanar = 0;
      final stride = math.max(1, input.length ~/ sampleCount);
      for (var i = 0; i < input.length; i += stride) {
        switch (_classify(plane, input[i])) {
          case 1:
            front++;
          case -1:
            back++;
          case 2:
            splits++;
          case 0:
            coplanar++;
        }
      }
      final score = splits * 18 + (front - back).abs() - coplanar * 0.4;
      if (score < bestScore) {
        bestScore = score.toDouble();
        best = plane;
      }
    }
    return best;
  }

  /// 0 coplanar, 1 front, -1 back, 2 spanning.
  int _classify(_BspPlane plane, _BspTri tri) {
    const eps = 1e-6;
    var positive = 0, negative = 0;
    for (var v = 0; v < 3; v++) {
      final d = plane.distance(tri.world, v);
      if (d > eps) {
        positive++;
      } else if (d < -eps) {
        negative++;
      }
    }
    if (positive == 0 && negative == 0) return 0;
    if (negative == 0) return 1;
    if (positive == 0) return -1;
    return 2;
  }

  (List<_BspTri>, List<_BspTri>) _split(_BspTri tri, _BspPlane plane) {
    final front = _splitSide(tri, plane, true);
    final back = _splitSide(tri, plane, false);
    return (_triangulate(tri, front), _triangulate(tri, back));
  }

  List<double> _splitSide(_BspTri tri, _BspPlane plane, bool front) {
    const eps = 1e-7;
    final output = <double>[];
    for (var e = 0; e < 3; e++) {
      final next = (e + 1) % 3;
      final de = plane.distance(tri.world, e);
      final dn = plane.distance(tri.world, next);
      final insideE = front ? de >= -eps : de <= eps;
      final insideN = front ? dn >= -eps : dn <= eps;
      if (insideE) _appendBspVertex(output, tri.world, tri.color, e);
      if (insideE != insideN) {
        final t = de / (de - dn);
        _appendBspIntersection(output, tri.world, tri.color, e, next, t);
      }
    }
    return output;
  }

  void _appendBspVertex(
    List<double> output,
    Float32List world,
    Float32List color,
    int vertex,
  ) {
    final o = vertex * 3;
    output.addAll([
      world[o],
      world[o + 1],
      world[o + 2],
      color[o],
      color[o + 1],
      color[o + 2],
    ]);
  }

  void _appendBspIntersection(
    List<double> output,
    Float32List world,
    Float32List color,
    int a,
    int b,
    double t,
  ) {
    final ao = a * 3, bo = b * 3;
    for (var c = 0; c < 3; c++) {
      output.add(world[ao + c] + (world[bo + c] - world[ao + c]) * t);
    }
    for (var c = 0; c < 3; c++) {
      output.add(color[ao + c] + (color[bo + c] - color[ao + c]) * t);
    }
  }

  List<_BspTri> _triangulate(_BspTri source, List<double> polygon) {
    final count = polygon.length ~/ 6;
    if (count < 3) return const <_BspTri>[];
    final output = <_BspTri>[];
    for (var v = 1; v + 1 < count; v++) {
      final world = Float32List(9), color = Float32List(9);
      for (var k = 0; k < 3; k++) {
        final vertex = k == 0 ? 0 : v + k - 1;
        final o = vertex * 6, d = k * 3;
        world[d] = polygon[o];
        world[d + 1] = polygon[o + 1];
        world[d + 2] = polygon[o + 2];
        color[d] = polygon[o + 3];
        color[d + 1] = polygon[o + 4];
        color[d + 2] = polygon[o + 5];
      }
      output.add(source.fragment(world, color, _serial++));
    }
    return output;
  }

  void attach(_BspNode node, _BspTri tri) {
    if (node.dynamicGeneration != generation) {
      node.dynamicGeneration = generation;
      node.dynamicTris.clear();
    }
    node.dynamicTris.add(tri);
  }

  bool insertDynamic(_BspNode node, _BspTri tri, int depth) {
    if (depth > maxDepth + 4) return false;
    _includeDynamicBounds(node, tri);
    if (!node.hasPlane) {
      attach(node, tri);
      return true;
    }
    final classification = _classify(node.plane, tri);
    if (classification == 0) {
      attach(node, tri);
      return true;
    }
    if (classification == 2) {
      return _insertDynamicSplit(node, tri, depth);
    }
    final front = classification == 1;
    return insertDynamic(_dynamicChild(node, front), tri, depth + 1);
  }

  bool _insertDynamicSplit(_BspNode node, _BspTri tri, int depth) {
    final pieces = _split(tri, node.plane);
    dynamicSplitCount++;
    return _insertDynamicParts(node, true, pieces.$1, depth) &&
        _insertDynamicParts(node, false, pieces.$2, depth);
  }

  bool _insertDynamicParts(
    _BspNode node,
    bool front,
    List<_BspTri> parts,
    int depth,
  ) {
    for (final part in parts) {
      if (!insertDynamic(_dynamicChild(node, front), part, depth + 1)) {
        return false;
      }
    }
    return true;
  }

  _BspNode _dynamicChild(_BspNode node, bool front) {
    if (front) return node.front ??= _BspNode.leaf();
    return node.back ??= _BspNode.leaf();
  }
}

extension _VoxelBspPainter on VoxelPainter {
  int _collectBsp(
    int cursor,
    double ex,
    double ey,
    double ez,
    double halfW,
    double halfH,
    List<(Float32List, double)> planes,
  ) {
    final cache = _bspCache;
    final ready = cache.ensure(chunks);
    _recordBspBuild(cache);
    if (!ready) return -1;
    cache.generation++;
    cache.dynamicSplitCount = 0;
    cache.visible.clear();
    for (final entry in chunks.entries) {
      if (!_insertBspChunk(cache, entry, cursor, ex, ey, ez, planes)) {
        return -1;
      }
    }
    cursor = _traverseBsp(
      cache.root!,
      cursor,
      ex,
      ey,
      ez,
      halfW,
      halfH,
      planes,
      false,
      false,
    );
    _diagnostics.bspDynamicSplits = cache.dynamicSplitCount;
    _diagnostics.orderMode = 6;
    return cursor;
  }

  void _recordBspBuild(_VoxelBspCache cache) {
    if (!VoxelDiagnostics.enabled) return;
    _diagnostics.bspBuildUs = cache.buildUs;
    _diagnostics.bspSources = cache.sourceCount;
    _diagnostics.bspFragments = cache.fragmentCount;
    _diagnostics.bspNodes = cache.nodeCount;
    _diagnostics.bspSplits = cache.splitCount;
    _diagnostics.bspBuildGeneration = cache.buildGeneration;
    _diagnostics.bspSyncGeneration = cache.syncGeneration;
  }

  bool _insertBspChunk(
    _VoxelBspCache cache,
    MapEntry<String, JsVoxelChunk> entry,
    int cursor,
    double ex,
    double ey,
    double ez,
    List<(Float32List, double)> planes,
  ) {
    final chunk = entry.value;
    if (VoxelDiagnostics.enabled) {
      _diagnostics.observeChunk(
        entry.key,
        identityHashCode(chunk),
        chunk.positions.length,
        chunk.indices.length,
      );
    }
    final outside = _chunkOutsideFrustum(chunk, ex, ey, ez, planes);
    cache.visible[chunk] = !outside;
    if (!outside) {
      _diagnostics.visibleChunks++;
      if (entry.key.startsWith('__') || chunk.overlay) {
        for (var f = 0; f + 2 < chunk.indices.length; f += 3) {
          final tri = _BspTri.source(chunk, entry.key, f ~/ 3, cache._serial++);
          if (!cache.insertDynamic(cache.root!, tri, 0)) return false;
        }
      }
    }
    if (VoxelDiagnostics.enabled) {
      _diagnostics.observeMob(
        entry.key,
        outside,
        cursor,
        cursor,
        chunk.aabbMin,
        chunk.aabbMax,
        chunk.origin,
      );
    }
    return true;
  }

  bool _bspStaticCulled(
    _BspNode node,
    bool parentCulled,
    double ex,
    double ey,
    double ez,
    List<(Float32List, double)> planes,
  ) {
    return parentCulled ||
        node.staticBounds == null ||
        _bspBoundsOutside(node.staticBounds!, ex, ey, ez, planes);
  }

  bool _bspDynamicCulled(
    _BspNode node,
    bool parentCulled,
    double ex,
    double ey,
    double ez,
    List<(Float32List, double)> planes,
  ) {
    return parentCulled ||
        node.dynamicBoundsGeneration != _bspCache.generation ||
        node.dynamicBounds == null ||
        _bspBoundsOutside(node.dynamicBounds!, ex, ey, ez, planes);
  }

  int _traverseBsp(
    _BspNode node,
    int cursor,
    double ex,
    double ey,
    double ez,
    double halfW,
    double halfH,
    List<(Float32List, double)> planes,
    bool staticCulled,
    bool dynamicCulled,
  ) {
    final staticOut = _bspStaticCulled(node, staticCulled, ex, ey, ez, planes);
    final dynamicOut = _bspDynamicCulled(
      node,
      dynamicCulled,
      ex,
      ey,
      ez,
      planes,
    );
    if (staticOut && dynamicOut) return cursor;
    if (!node.hasPlane) {
      return dynamicOut
          ? cursor
          : _emitBspDynamic(node, cursor, ex, ey, ez, halfW, halfH);
    }
    final plane = node.plane;
    final eye = plane.nx * ex + plane.ny * ey + plane.nz * ez + plane.d;
    final front = eye >= 0;
    final far = front ? node.back : node.front;
    final near = front ? node.front : node.back;
    if (far != null) {
      cursor = _traverseBsp(
        far,
        cursor,
        ex,
        ey,
        ez,
        halfW,
        halfH,
        planes,
        staticOut,
        dynamicOut,
      );
    }
    if (!staticOut) {
      cursor = _emitBspList(node.tris, cursor, ex, ey, ez, halfW, halfH);
    }
    if (!dynamicOut) {
      cursor = _emitBspDynamic(node, cursor, ex, ey, ez, halfW, halfH);
    }
    if (near != null) {
      cursor = _traverseBsp(
        near,
        cursor,
        ex,
        ey,
        ez,
        halfW,
        halfH,
        planes,
        staticOut,
        dynamicOut,
      );
    }
    return cursor;
  }

  bool _bspBoundsOutside(
    Float32List bounds,
    double ex,
    double ey,
    double ez,
    List<(Float32List, double)> planes,
  ) {
    final cx = (bounds[0] + bounds[3]) / 2 - ex;
    final cy = (bounds[1] + bounds[4]) / 2 - ey;
    final cz = (bounds[2] + bounds[5]) / 2 - ez;
    final hx = (bounds[3] - bounds[0]) / 2;
    final hy = (bounds[4] - bounds[1]) / 2;
    final hz = (bounds[5] - bounds[2]) / 2;
    for (final (n, _) in planes) {
      final dist = n[0] * cx + n[1] * cy + n[2] * cz;
      final radius = n[0].abs() * hx + n[1].abs() * hy + n[2].abs() * hz;
      if (dist < -radius) return true;
    }
    final nearDist = _forward[0] * cx + _forward[1] * cy + _forward[2] * cz;
    final nearRadius =
        _forward[0].abs() * hx +
        _forward[1].abs() * hy +
        _forward[2].abs() * hz;
    if (nearDist < -nearRadius - VoxelPainter.nearPlane) return true;
    return _fullyFoged(nearDist - nearRadius);
  }

  int _emitBspDynamic(
    _BspNode node,
    int cursor,
    double ex,
    double ey,
    double ez,
    double halfW,
    double halfH,
  ) {
    if (node.dynamicGeneration != _bspCache.generation ||
        node.dynamicTris.isEmpty) {
      return cursor;
    }
    node.dynamicTris.sort((a, b) {
      final depth = _bspAverageDepth(
        b,
        ex,
        ey,
        ez,
      ).compareTo(_bspAverageDepth(a, ex, ey, ez));
      return depth != 0 ? depth : a.serial.compareTo(b.serial);
    });
    final before = cursor;
    cursor = _emitBspList(node.dynamicTris, cursor, ex, ey, ez, halfW, halfH);
    if (cursor - before < 2) return cursor;
    final range = _tris.sublist(before, cursor);
    final workspace = _bspCache.dynamicOrdering;
    _buildSharedEdgeConstraints(range, workspace);
    _orderOverlappingTriangles(
      range,
      workspace,
      Size(halfW * 2, halfH * 2),
      _diagnostics,
      includeDynamic: true,
    );
    _applySharedEdgeOrders(
      range,
      workspace.constraints,
      _diagnostics,
      workspace,
    );
    for (var i = 0; i < range.length; i++) {
      _tris[before + i] = range[i];
    }
    return cursor;
  }

  double _bspAverageDepth(_BspTri tri, double ex, double ey, double ez) {
    final p = tri.world;
    final x = (p[0] + p[3] + p[6]) / 3 - ex;
    final y = (p[1] + p[4] + p[7]) / 3 - ey;
    final z = (p[2] + p[5] + p[8]) / 3 - ez;
    return _forward[0] * x + _forward[1] * y + _forward[2] * z;
  }

  int _emitBspList(
    List<_BspTri> input,
    int cursor,
    double ex,
    double ey,
    double ez,
    double halfW,
    double halfH,
  ) {
    for (final tri in input) {
      if (_bspCache.visible[tri.chunk] != true) continue;
      final p = tri.world;
      if ((p[0] - ex) * tri.nx + (p[1] - ey) * tri.ny + (p[2] - ez) * tri.nz >=
          0) {
        _diagnostics.backfaceCull++;
        continue;
      }
      final before = cursor;
      cursor = _emitWorldTri(
        tri.chunk,
        cursor,
        tri.world,
        tri.color,
        ex,
        ey,
        ez,
        halfW,
        halfH,
        camera.light,
        camera.texture,
        _workspace.view,
        _workspace.clippedView,
        _workspace.uvs,
        0,
        tri.sourceTri,
        tri.serial + 1,
      );
      for (var i = before; i < cursor; i++) {
        _tris[i].key = tri.key;
      }
    }
    return cursor;
  }
}
