part of 'js_voxel_node.dart';

final Float64List _overlapHit = Float64List(2);

class _OverlapWorkspace {
  final _OverlapBounds bounds = _OverlapBounds();
  final _IntervalTree active = _IntervalTree();
  final List<int> expiry = <int>[];
  final List<int> overlaps = <int>[];
}

/// Adds visibility constraints for arbitrary projected overlaps. An adaptive
/// screen-axis sweep avoids the quadratic all-pairs pass; a dynamic interval
/// tree filters the secondary axis. Shared and arbitrary constraints are
/// ordered together by the same topological pass.
void _orderOverlappingTriangles(
  List<_Tri> tris,
  _VoxelOrderingWorkspace workspace,
  Size size,
  VoxelDiagnostics diagnostics,
) {
  final count = tris.length;
  if (count < 2) return;
  final stageSw = VoxelDiagnostics.enabled ? (Stopwatch()..start()) : null;
  final overlap = workspace.overlap;
  final constraints = workspace.constraints;
  final data = overlap.bounds..begin(tris, size);
  _markOverlapStage(diagnostics, stageSw, 0);
  final minX = data.minX, maxX = data.maxX;
  final minY = data.minY, maxY = data.maxY;
  final indices = data.indices;
  final sweepX = data.spanX < data.spanY;
  final primaryMin = sweepX ? minX : minY;
  final primaryMax = sweepX ? maxX : maxY;
  final secondaryMin = sweepX ? minY : minX;
  final secondaryMax = sweepX ? maxY : maxX;
  indices.sort((a, b) => primaryMin[a].compareTo(primaryMin[b]));
  final expiry = overlap.expiry
    ..clear()
    ..addAll(indices)
    ..sort((a, b) => primaryMax[a].compareTo(primaryMax[b]));
  final active = overlap.active
    ..begin(
      count,
      secondaryMin,
      secondaryMax,
      data.planeAxes,
      data.planeCoordinates,
    );
  _markOverlapStage(diagnostics, stageSw, 1);
  final overlaps = overlap.overlaps;
  var expiryCursor = 0;
  for (final ai in indices) {
    while (expiryCursor < expiry.length &&
        primaryMax[expiry[expiryCursor]] < primaryMin[ai]) {
      active.remove(expiry[expiryCursor++]);
    }
    active.query(ai, secondaryMin[ai], secondaryMax[ai], overlaps);
    for (final bi in overlaps) {
      _appendOverlapOrder(data, tris, constraints, ai, bi);
    }
    active.insert(ai);
  }
  _markOverlapStage(diagnostics, stageSw, 2);
}

void _markOverlapStage(
  VoxelDiagnostics diagnostics,
  Stopwatch? stopwatch,
  int stage,
) {
  if (stopwatch == null) return;
  diagnostics.overlapStagesUs[stage] = stopwatch.elapsedMicroseconds;
}

/// Materializes every real depth relation, including one that agrees with
/// average depth. The shared-edge topological pass can otherwise reverse an
/// unconstrained pair even when its initial average-depth order was correct.
void _appendOverlapOrder(
  _OverlapBounds data,
  List<_Tri> tris,
  _VisibilityConstraints constraints,
  int ai,
  int bi,
) {
  final a = tris[ai], b = tris[bi];
  if (a.overlay || b.overlay) return;
  if (!_trianglesOverlapScreen(a, b)) return;
  if (_coplanarDepthPair(data.depthPlanes, ai, b)) return;
  final relation = _compareTriangleOverlap(a, ai, b, bi, data);
  if (relation == 0) return;
  constraints.addOverlap(a.order, b.order, relation);
}

/// Screen/depth bounds and reciprocal-depth planes for the overlap sweep.
class _OverlapBounds {
  Float32List minX = Float32List(0), maxX = Float32List(0);
  Float32List minY = Float32List(0), maxY = Float32List(0);
  Float64List depthPlanes = Float64List(0);
  Int32List planeAxes = Int32List(0);
  Float64List planeCoordinates = Float64List(0);
  final List<int> indices = <int>[];
  double spanX = 0, spanY = 0;

  void begin(List<_Tri> tris, Size size) {
    final count = tris.length;
    if (minX.length < count) {
      minX = Float32List(count);
      maxX = Float32List(count);
      minY = Float32List(count);
      maxY = Float32List(count);
      depthPlanes = Float64List(count * 3);
      planeAxes = Int32List(count);
      planeCoordinates = Float64List(count);
    }
    indices.clear();
    spanX = 0;
    spanY = 0;
    _collect(tris, size);
  }

  void _collect(List<_Tri> tris, Size size) {
    for (var i = 0; i < tris.length; i++) {
      final t = tris[i], p = t.pts;
      if (t.key.startsWith('__')) continue;
      final loX = math.min(p[0], math.min(p[2], p[4]));
      final hiX = math.max(p[0], math.max(p[2], p[4]));
      final loY = math.min(p[1], math.min(p[3], p[5]));
      final hiY = math.max(p[1], math.max(p[3], p[5]));
      if (_outsideViewport(loX, hiX, loY, hiY, size)) continue;
      minX[i] = math.max(0.0, loX);
      maxX[i] = math.min(size.width, hiX);
      minY[i] = math.max(0.0, loY);
      maxY[i] = math.min(size.height, hiY);
      planeAxes[i] = t.planeAxis;
      planeCoordinates[i] = t.planeCoordinate;
      _writeDepthPlane(t, depthPlanes, i);
      indices.add(i);
      spanX += maxX[i] - minX[i];
      spanY += maxY[i] - minY[i];
    }
  }

  static bool _outsideViewport(
    double loX,
    double hiX,
    double loY,
    double hiY,
    Size size,
  ) {
    return loX > size.width || hiX < 0 || loY > size.height || hiY < 0;
  }
}

/// Dynamic interval tree for the sweep's secondary axis. Deterministic hash
/// priorities keep the treap balanced without RNG. Augmented subtree max-end
/// prunes branches that cannot overlap the query interval.
class _IntervalTree {
  Float32List starts = Float32List(0), ends = Float32List(0);
  Int32List planeAxes = Int32List(0);
  Float64List planeCoordinates = Float64List(0);
  Float32List subtreeMax = Float32List(0);
  Int32List left = Int32List(0), right = Int32List(0);
  Int32List priorities = Int32List(0);
  int root = -1;

  void begin(
    int count,
    Float32List starts,
    Float32List ends,
    Int32List planeAxes,
    Float64List planeCoordinates,
  ) {
    if (left.length < count) {
      left = Int32List(count);
      right = Int32List(count);
      priorities = Int32List(count);
      subtreeMax = Float32List(count);
    }
    this.starts = starts;
    this.ends = ends;
    this.planeAxes = planeAxes;
    this.planeCoordinates = planeCoordinates;
    root = -1;
  }

  void insert(int node) {
    root = _insert(root, node);
  }

  void remove(int node) {
    root = _delete(root, node);
  }

  void query(int ai, double min, double max, List<int> output) {
    output.clear();
    _query(root, ai, min, max, output);
  }

  int _insert(int root, int node) {
    if (root < 0) {
      left[node] = -1;
      right[node] = -1;
      priorities[node] = _priority(node);
      subtreeMax[node] = ends[node];
      return node;
    }
    if (_less(node, root)) {
      final child = _insert(left[root], node);
      left[root] = child;
      if (priorities[child] < priorities[root]) return _rotateRight(root);
    } else {
      final child = _insert(right[root], node);
      right[root] = child;
      if (priorities[child] < priorities[root]) return _rotateLeft(root);
    }
    _update(root);
    return root;
  }

  int _delete(int root, int node) {
    if (root < 0) return -1;
    if (root == node) return _merge(left[root], right[root]);
    if (_less(node, root)) {
      left[root] = _delete(left[root], node);
    } else {
      right[root] = _delete(right[root], node);
    }
    _update(root);
    return root;
  }

  int _merge(int a, int b) {
    if (a < 0) return b;
    if (b < 0) return a;
    if (priorities[a] < priorities[b]) {
      right[a] = _merge(right[a], b);
      _update(a);
      return a;
    }
    left[b] = _merge(a, left[b]);
    _update(b);
    return b;
  }

  int _rotateRight(int root) {
    final pivot = left[root];
    left[root] = right[pivot];
    right[pivot] = root;
    _update(root);
    _update(pivot);
    return pivot;
  }

  int _rotateLeft(int root) {
    final pivot = right[root];
    right[root] = left[pivot];
    left[pivot] = root;
    _update(root);
    _update(pivot);
    return pivot;
  }

  void _update(int node) {
    var best = ends[node];
    final l = left[node], r = right[node];
    if (l >= 0 && subtreeMax[l] > best) best = subtreeMax[l];
    if (r >= 0 && subtreeMax[r] > best) best = subtreeMax[r];
    subtreeMax[node] = best;
  }

  void _query(int node, int ai, double min, double max, List<int> output) {
    if (node < 0 || subtreeMax[node] < min) return;
    final l = left[node];
    if (l >= 0 && subtreeMax[l] >= min) _query(l, ai, min, max, output);
    // Every key in the right subtree is >= this start, so start > max prunes
    // the whole right side; the left side was still searched above.
    if (starts[node] > max) return;
    if (ends[node] >= min && !_sameAxisPlane(ai, node)) {
      output.add(node);
    }
    final r = right[node];
    if (r >= 0 && subtreeMax[r] >= min) _query(r, ai, min, max, output);
  }

  bool _sameAxisPlane(int ai, int bi) {
    final axis = planeAxes[ai];
    return axis >= 0 &&
        axis == planeAxes[bi] &&
        planeCoordinates[ai] == planeCoordinates[bi];
  }

  bool _less(int a, int b) {
    if (starts[a] == starts[b]) return a < b;
    return starts[a] < starts[b];
  }

  static int _priority(int node) {
    var x = (node + 1) * 0x9e3779b1 & 0xffffffff;
    x = (x ^ (x >> 16)) * 0x85ebca6b & 0xffffffff;
    x = (x ^ (x >> 13)) * 0xc2b2ae35 & 0xffffffff;
    return (x ^ (x >> 16)) & 0x3fffffff;
  }
}

/// Convex screen triangles are disjoint when either has an edge with every
/// vertex of the other strictly outside. Most interval-tree candidates only
/// have overlapping AABBs, so this avoids their depth-plane and edge-crossing
/// work while leaving every positive-area overlap for the exact comparator.
bool _trianglesOverlapScreen(_Tri a, _Tri b) {
  return !_screenSeparatedByEdge(a, b) && !_screenSeparatedByEdge(b, a);
}

bool _screenSeparatedByEdge(_Tri edgeOwner, _Tri other) {
  final p = edgeOwner.pts, q = other.pts;
  for (var e = 0; e < 3; e++) {
    final a = e * 2, b = ((e + 1) % 3) * 2;
    final rx = p[b] - p[a], ry = p[b + 1] - p[a + 1];
    var separated = true;
    for (var v = 0; v < 3; v++) {
      final o = v * 2;
      final cross = rx * (q[o + 1] - p[a + 1]) - ry * (q[o] - p[a]);
      if (cross <= 1e-7) {
        separated = false;
        break;
      }
    }
    if (separated) return true;
  }
  return false;
}

/// Reciprocal view depth is affine in screen coordinates. Keeping its plane
/// per triangle makes coplanarity a three-point check instead of a clip.
void _writeDepthPlane(_Tri t, Float64List planes, int index) {
  final p = t.pts, o = index * 3;
  final den = (p[3] - p[5]) * (p[0] - p[4]) + (p[4] - p[2]) * (p[1] - p[5]);
  if (den.abs() < 1e-8) {
    planes[o + 2] = double.nan;
    return;
  }
  final i0 = t.iz0, i1 = t.iz1, i2 = t.iz2;
  final a =
      (i0 * (p[3] - p[5]) + i1 * (p[5] - p[1]) + i2 * (p[1] - p[3])) / den;
  final b =
      (i0 * (p[4] - p[2]) + i1 * (p[0] - p[4]) + i2 * (p[2] - p[0])) / den;
  planes[o] = a;
  planes[o + 1] = b;
  planes[o + 2] = i0 - a * p[0] - b * p[1];
}

bool _coplanarDepthPair(Float64List planes, int ai, _Tri b) {
  final o = ai * 3, a = planes[o], sl = planes[o + 1], c = planes[o + 2];
  if (!c.isFinite) return false;
  for (var v = 0; v < 3; v++) {
    final actual = _vertexInverseDepth(b, v);
    final predicted = a * b.pts[v * 2] + sl * b.pts[v * 2 + 1] + c;
    if (!predicted.isFinite) return false;
    final tolerance = 2e-6 * math.max(1, actual.abs());
    if ((predicted - actual).abs() > tolerance) return false;
  }
  return true;
}

/// Orders two non-intersecting triangles at a vertex of their intersection
/// polygon. Original vertices covered by the other triangle and edge-edge
/// crossings cover every such vertex. A positive-area overlap of distinct
/// depth planes has a sample with non-equal depth; boundary ties are skipped.
int _compareTriangleOverlap(
  _Tri a,
  int ai,
  _Tri b,
  int bi,
  _OverlapBounds data,
) {
  final forward = _vertexOverlapOrder(a, ai, b, bi, data.depthPlanes);
  if (forward != 0) return forward;
  final reverse = _vertexOverlapOrder(b, bi, a, ai, data.depthPlanes);
  if (reverse != 0) return -reverse;
  return _edgeOverlapOrder(a, ai, b, bi, data.depthPlanes);
}

int _vertexOverlapOrder(_Tri a, int ai, _Tri b, int bi, Float64List planes) {
  for (var v = 0; v < 3; v++) {
    final x = a.pts[v * 2], y = a.pts[v * 2 + 1];
    if (!_screenCovers(b, x, y)) continue;
    final relation = _planeOverlapRelation(planes, ai, bi, x, y);
    if (relation != 0) return relation;
  }
  return 0;
}

/// Every emitted triangle has negative screen winding after backface cull.
bool _screenCovers(_Tri t, double x, double y) {
  final p = t.pts;
  for (var e = 0; e < 3; e++) {
    final a = e * 2, b = ((e + 1) % 3) * 2;
    final cross =
        (p[b] - p[a]) * (y - p[a + 1]) - (p[b + 1] - p[a + 1]) * (x - p[a]);
    if (cross > 1e-7) return false;
  }
  return true;
}

int _edgeOverlapOrder(_Tri a, int ai, _Tri b, int bi, Float64List planes) {
  for (var ea = 0; ea < 3; ea++) {
    final a0 = ea * 2, a1 = ((ea + 1) % 3) * 2;
    for (var eb = 0; eb < 3; eb++) {
      final b0 = eb * 2, b1 = ((eb + 1) % 3) * 2;
      if (!_edgeIntersection(a.pts, a0, a1, b.pts, b0, b1)) continue;
      final relation = _planeOverlapRelation(
        planes,
        ai,
        bi,
        _overlapHit[0],
        _overlapHit[1],
      );
      if (relation != 0) return relation;
    }
  }
  return 0;
}

bool _edgeIntersection(
  Float32List a,
  int a0,
  int a1,
  Float32List b,
  int b0,
  int b1,
) {
  final rx = a[a1] - a[a0], ry = a[a1 + 1] - a[a0 + 1];
  final sx = b[b1] - b[b0], sy = b[b1 + 1] - b[b0 + 1];
  final den = rx * sy - ry * sx;
  if (den.abs() < 1e-8) return false;
  final qx = b[b0] - a[a0], qy = b[b0 + 1] - a[a0 + 1];
  final t = (qx * sy - qy * sx) / den;
  final u = (qx * ry - qy * rx) / den;
  if (t < -1e-7 || t > 1.0000001 || u < -1e-7 || u > 1.0000001) {
    return false;
  }
  _overlapHit[0] = a[a0] + rx * t;
  _overlapHit[1] = a[a0 + 1] + ry * t;
  return true;
}

int _planeOverlapRelation(
  Float64List planes,
  int ai,
  int bi,
  double x,
  double y,
) {
  final ao = ai * 3, bo = bi * 3;
  final az = 1 / (planes[ao] * x + planes[ao + 1] * y + planes[ao + 2]);
  final bz = 1 / (planes[bo] * x + planes[bo + 1] * y + planes[bo + 2]);
  if (!az.isFinite || !bz.isFinite) return 0;
  return _depthRelation(az, bz);
}

int _depthRelation(double az, double bz) {
  final tolerance = 1e-5 * math.max(1, math.min(az, bz));
  if ((az - bz).abs() <= tolerance) return 0;
  return bz.compareTo(az);
}
