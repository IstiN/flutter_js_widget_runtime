part of 'js_voxel_node.dart';

void _sortTriListExact(List<_Tri> tris) {
  tris.sort((a, b) {
    final byDepth = b.depth.compareTo(a.depth);
    return byDepth != 0 ? byDepth : a.emission.compareTo(b.emission);
  });
}

/// Corrects mesh-adjacent visibility after the average-depth sort. Two
/// non-intersecting triangles that share an edge have a constant depth
/// relation throughout their screen overlap; their average depths can
/// nevertheless reverse it. This is not intended as a general z-buffer.
void _orderSharedEdges(
  List<_Tri> tris,
  VoxelDiagnostics diagnostics,
  Size size,
  _VoxelOrderCache cache,
  JsVoxelCamera camera,
  _VoxelVisibleChunks visible,
) {
  final stageSw = VoxelDiagnostics.enabled ? (Stopwatch()..start()) : null;
  final mode = VoxelDiagnostics.forceFullOrder
      ? _VoxelOrderMode.full
      : cache.modeFor(camera, size, visible);
  var full = mode == _VoxelOrderMode.full;
  diagnostics.orderMode = mode == _VoxelOrderMode.moving
      ? 3 + cache.instability
      : mode.index;
  if (mode != _VoxelOrderMode.full) {
    if (cache.apply(tris)) {
      _markOrderStage(diagnostics, stageSw, 0);
      return;
    }
    diagnostics.orderMode = 3;
    full = true;
  }
  _markOrderStage(diagnostics, stageSw, 0);
  _sortTriListExact(tris);
  _recordVoxelSortErrors(tris, diagnostics);
  _markOrderStage(diagnostics, stageSw, 1);
  final workspace = cache.ordering;
  final constraints = workspace.constraints;
  _buildSharedEdgeConstraints(tris, workspace);
  _markOrderStage(diagnostics, stageSw, 2);
  if (full) {
    _orderOverlappingTriangles(tris, workspace, size, diagnostics);
  }
  _markOrderStage(diagnostics, stageSw, 3);
  diagnostics.sharedEdges = constraints.edgeCount;
  diagnostics.sharedPairs = constraints.reportedPairs;
  _applySharedEdgeOrders(tris, constraints, diagnostics, workspace);
  _markOrderStage(diagnostics, stageSw, 4);
  if (full) cache.saveFullOrder(tris, camera, size, visible);
  _markOrderStage(diagnostics, stageSw, 5);
}

void _markOrderStage(
  VoxelDiagnostics diagnostics,
  Stopwatch? stopwatch,
  int stage,
) {
  if (stopwatch == null) return;
  diagnostics.orderStagesUs[stage] = stopwatch.elapsedMicroseconds;
}

void _recordVoxelSortErrors(List<_Tri> tris, VoxelDiagnostics diagnostics) {
  if (!VoxelDiagnostics.enabled) return;
  for (var i = 1; i < tris.length; i++) {
    final a = tris[i - 1], b = tris[i];
    if (a.depth < b.depth || (a.depth == b.depth && a.emission > b.emission)) {
      diagnostics.sortErrors++;
    }
  }
}

class _VoxelOrderingWorkspace {
  final _VisibilityConstraints constraints = _VisibilityConstraints();
  final _OverlapWorkspace overlap = _OverlapWorkspace();
  final List<_Tri> inputTris = <_Tri>[];
  Int32List keyA = Int32List(0), keyB = Int32List(0);
  Int32List heads = Int32List(0);
  List<_Tri?> occurrenceTris = <_Tri?>[];
  Int32List occurrenceEdges = Int32List(0);
  Int32List occurrenceNext = Int32List(0);

  void ensureShared(int capacity, int occurrences) {
    if (keyA.length < capacity) {
      keyA = Int32List(capacity);
      keyB = Int32List(capacity);
      heads = Int32List(capacity);
    }
    if (occurrenceTris.length < occurrences) {
      occurrenceTris.length = occurrences;
    }
    if (occurrenceEdges.length < occurrences) {
      occurrenceEdges = Int32List(occurrences);
      occurrenceNext = Int32List(occurrences);
    }
  }
}

/// Nonzero visibility edges in compact index form. Zero relations carry no
/// ordering information and are never materialized as pair records.
class _VisibilityConstraints {
  final List<int> from = <int>[], to = <int>[];
  int edgeCount = 0;
  int sharedAttempts = 0;
  int _sharedStored = 0;

  int get reportedPairs => sharedAttempts + from.length - _sharedStored;

  void begin() {
    from.clear();
    to.clear();
    edgeCount = 0;
    sharedAttempts = 0;
    _sharedStored = 0;
  }

  void addShared(int a, int b, int order) {
    sharedAttempts++;
    _add(a, b, order);
  }

  void finishShared() {
    _sharedStored = from.length;
  }

  void addOverlap(int a, int b, int order) {
    _add(a, b, order);
  }

  void _add(int a, int b, int order) {
    if (order == 0) return;
    from.add(order < 0 ? a : b);
    to.add(order < 0 ? b : a);
  }
}

void _buildSharedEdgeConstraints(
  List<_Tri> tris,
  _VoxelOrderingWorkspace workspace,
) {
  for (var i = 0; i < tris.length; i++) {
    tris[i].order = i;
  }
  var requiredCapacity = 16;
  while (requiredCapacity < tris.length * 6) {
    requiredCapacity *= 2;
  }
  workspace.ensureShared(requiredCapacity, tris.length * 3);
  final capacity = workspace.keyA.length;
  final keyA = workspace.keyA, keyB = workspace.keyB;
  final heads = workspace.heads;
  keyA.fillRange(0, capacity, -1);
  heads.fillRange(0, capacity, -1);
  final occurrenceTris = workspace.occurrenceTris;
  final occurrenceEdges = workspace.occurrenceEdges;
  final occurrenceNext = workspace.occurrenceNext;
  final constraints = workspace.constraints..begin();
  var occurrenceCount = 0;
  for (final t in tris) {
    for (var e = 0; e < 3; e++) {
      final a = t.vertexHashes[e], b = t.vertexHashes[(e + 1) % 3];
      final lo = a < b ? a : b, hi = a < b ? b : a;
      var slot = ((lo * 31) ^ hi) & (capacity - 1);
      while (true) {
        if (keyA[slot] < 0) {
          keyA[slot] = lo;
          keyB[slot] = hi;
          heads[slot] = occurrenceCount;
          occurrenceTris[occurrenceCount] = t;
          occurrenceEdges[occurrenceCount] = e;
          occurrenceNext[occurrenceCount] = -1;
          occurrenceCount++;
          constraints.edgeCount++;
          break;
        }
        if (keyA[slot] == lo && keyB[slot] == hi) {
          var occurrence = heads[slot];
          while (occurrence >= 0) {
            final previous = occurrenceTris[occurrence]!;
            final previousEdge = occurrenceEdges[occurrence];
            final order = _compareSharedEdge(previous, previousEdge, t, e);
            constraints.addShared(previous.order, t.order, order);
            occurrence = occurrenceNext[occurrence];
          }
          occurrenceNext[occurrenceCount] = heads[slot];
          heads[slot] = occurrenceCount;
          occurrenceTris[occurrenceCount] = t;
          occurrenceEdges[occurrenceCount] = e;
          occurrenceCount++;
          break;
        }
        slot = (slot + 1) & (capacity - 1);
      }
    }
  }
  constraints.finishShared();
}

void _applySharedEdgeOrders(
  List<_Tri> tris,
  _VisibilityConstraints constraints,
  VoxelDiagnostics diagnostics,
  _VoxelOrderingWorkspace workspace,
) {
  if (tris.length < 2) return;
  final graph = _sharedGraph(tris.length, constraints);
  diagnostics.visibilityEdges = graph.targets.length;
  final original = workspace.inputTris
    ..clear()
    ..addAll(tris);
  final order = _stableVisibilityOrder(tris.length, graph);
  diagnostics.visibilityCycles = graph.cycleBreaks;
  for (var i = 0; i < order.length; i++) {
    tris[i] = original[order[i]];
    tris[i].order = i;
  }
}

class _VisibilityGraph {
  _VisibilityGraph(this.offsets, this.targets, this.indegree);

  final Int32List offsets;
  final Int32List targets;
  final Int32List indegree;
  int cycleBreaks = 0;
}

/// CSR visibility graph. Pair indices refer to the exact average-sorted
/// input; the topological pass never mutates those anchor indices.
_VisibilityGraph _sharedGraph(int count, _VisibilityConstraints constraints) {
  final offsets = Int32List(count + 1);
  final indegree = Int32List(count);
  for (var i = 0; i < constraints.from.length; i++) {
    offsets[constraints.from[i] + 1]++;
    indegree[constraints.to[i]]++;
  }
  for (var i = 0; i < count; i++) {
    offsets[i + 1] += offsets[i];
  }
  final targets = Int32List(offsets[count]);
  final write = Int32List(count)..setRange(0, count, offsets);
  for (var i = 0; i < constraints.from.length; i++) {
    targets[write[constraints.from[i]]++] = constraints.to[i];
  }
  return _VisibilityGraph(offsets, targets, indegree);
}

/// Stable Kahn order over far→near visibility constraints. A heap preserves
/// average-depth order among ready nodes. If intersecting/cyclic geometry
/// has no complete topological order, the earliest remaining input node
/// breaks the cycle deterministically; every triangle is still emitted once.
Int32List _stableVisibilityOrder(int count, _VisibilityGraph graph) {
  final heap = Int32List(count), emitted = Uint8List(count);
  final result = Int32List(count);
  var heapSize = 0, resultSize = 0, fallback = 0;
  for (var i = 0; i < count; i++) {
    if (graph.indegree[i] == 0) heapSize = _heapPush(heap, heapSize, i);
  }
  while (resultSize < count) {
    if (heapSize == 0) {
      graph.cycleBreaks++;
      while (emitted[fallback] != 0) {
        fallback++;
      }
      heapSize = _heapPush(heap, heapSize, fallback);
    }
    final node = _heapPop(heap, heapSize);
    heapSize--;
    if (emitted[node] != 0) continue;
    emitted[node] = 1;
    result[resultSize++] = node;
    for (var e = graph.offsets[node]; e < graph.offsets[node + 1]; e++) {
      final to = graph.targets[e];
      graph.indegree[to]--;
      if (graph.indegree[to] == 0) {
        heapSize = _heapPush(heap, heapSize, to);
      }
    }
  }
  return result;
}

int _heapPush(Int32List heap, int size, int value) {
  var i = size;
  heap[i] = value;
  while (i > 0) {
    final parent = (i - 1) >> 1;
    if (heap[parent] <= value) break;
    heap[i] = heap[parent];
    i = parent;
  }
  heap[i] = value;
  return size + 1;
}

int _heapPop(Int32List heap, int size) {
  final result = heap[0], last = heap[size - 1], newSize = size - 1;
  var i = 0;
  while (true) {
    final left = i * 2 + 1;
    if (left >= newSize) break;
    final right = left + 1;
    final child = right < newSize && heap[right] < heap[left] ? right : left;
    if (heap[child] >= last) break;
    heap[i] = heap[child];
    i = child;
  }
  if (newSize > 0) heap[i] = last;
  return result;
}

/// Orders two triangles sharing edge [ea]/[eb]. A point just inside their
/// common projected edge discriminates the overlap with one depth sample.
int _compareSharedEdge(_Tri a, int ea, _Tri b, int eb) {
  final a0 = ea * 2, a1 = ((ea + 1) % 3) * 2, ac = ((ea + 2) % 3) * 2;
  final b0 = eb * 2, b1 = ((eb + 1) % 3) * 2, bc = ((eb + 2) % 3) * 2;
  final direct = _sameVertex(a, a0, b, b0) && _sameVertex(a, a1, b, b1);
  final reverse = _sameVertex(a, a0, b, b1) && _sameVertex(a, a1, b, b0);
  if (!direct && !reverse) return 0; // Hash collision, not a shared edge.
  final mx = (a.pts[a0] + a.pts[a1]) * 0.5;
  final my = (a.pts[a0 + 1] + a.pts[a1 + 1]) * 0.5;
  final ex = a.pts[a1] - a.pts[a0], ey = a.pts[a1 + 1] - a.pts[a0 + 1];
  final cx = a.pts[ac] - mx, cy = a.pts[ac + 1] - my;
  final dx = b.pts[bc] - mx, dy = b.pts[bc + 1] - my;
  final sideC =
      ex * (a.pts[ac + 1] - a.pts[a0 + 1]) - ey * (a.pts[ac] - a.pts[a0]);
  final sideD =
      ex * (b.pts[bc + 1] - a.pts[a0 + 1]) - ey * (b.pts[bc] - a.pts[a0]);
  if (sideC * sideD <= 0) return 0;
  // Any positive combination of inward vectors stays in both edge wedges.
  var vx = cx + dx, vy = cy + dy;
  final vl = math.sqrt(vx * vx + vy * vy);
  if (vl < 1e-8) return 0;
  return _sharedDepthOrder(
    a,
    b,
    mx,
    my,
    vx / vl,
    vy / vl,
    math.sqrt(ex * ex + ey * ey),
  );
}

/// Samples far enough from the edge to avoid coplanar float noise, backing
/// off for sliver triangles. Coplanar neighbours need no constraint; adding
/// their numerical depth signs creates artificial cycles across flat land.
int _sharedDepthOrder(
  _Tri a,
  _Tri b,
  double mx,
  double my,
  double vx,
  double vy,
  double edgeLength,
) {
  var step = math.min(0.25, edgeLength * 0.01);
  for (var attempt = 0; attempt < 5; attempt++) {
    final x = mx + vx * step, y = my + vy * step;
    final az = _depthAt(a, x, y), bz = _depthAt(b, x, y);
    if (az != null && bz != null) {
      final tolerance = 1e-5 * math.max(1, math.min(az, bz));
      if ((az - bz).abs() <= tolerance) return 0;
      return bz.compareTo(az);
    }
    step *= 0.2;
  }
  return 0;
}

int _hashVertex(Float32List p, int vertex) {
  final x = (p[vertex * 2] * 1024).round();
  final y = (p[vertex * 2 + 1] * 1024).round();
  return ((x * 73856093) ^ (y * 19349639)) & 0x3fffffff;
}

/// Guards the edge hash with actual projected positions and view depths.
bool _sameVertex(_Tri a, int ao, _Tri b, int bo) {
  final dx = a.pts[ao] - b.pts[bo], dy = a.pts[ao + 1] - b.pts[bo + 1];
  if (dx * dx + dy * dy > 0.0004) return false;
  return (_vertexDepth(a, ao >> 1) - _vertexDepth(b, bo >> 1)).abs() < 0.001;
}

double _vertexDepth(_Tri t, int vertex) =>
    vertex == 0 ? t.z0 : (vertex == 1 ? t.z1 : t.z2);

double _vertexInverseDepth(_Tri t, int vertex) =>
    vertex == 0 ? t.iz0 : (vertex == 1 ? t.iz1 : t.iz2);

double? _depthAt(_Tri t, double x, double y) {
  final p = t.pts;
  final den = (p[3] - p[5]) * (p[0] - p[4]) + (p[4] - p[2]) * (p[1] - p[5]);
  if (den.abs() < 1e-8) return null;
  final a = ((p[3] - p[5]) * (x - p[4]) + (p[4] - p[2]) * (y - p[5])) / den;
  final b = ((p[5] - p[1]) * (x - p[4]) + (p[0] - p[4]) * (y - p[5])) / den;
  final c = 1 - a - b;
  if (a < -1e-7 || b < -1e-7 || c < -1e-7) return null;
  return 1 / (a * t.iz0 + b * t.iz1 + c * t.iz2);
}

/// Diagnostic-only screen grid audit: the last covering triangle should
/// also have the smallest perspective depth. Unlike a color heuristic this
/// reports only genuine painter-order inversions; legitimate brown walls
/// and sky/fog regions do not produce a record.
void _auditDepthOrder(
  List<_Tri> tris,
  Size size,
  VoxelDiagnostics diagnostics,
) {
  for (var yi = 0; yi < 6; yi++) {
    for (var xi = 0; xi < 9; xi++) {
      _auditAt(
        tris,
        size.width * (0.1 + xi * 0.1),
        size.height * (0.3 + yi * 0.1),
        diagnostics,
      );
    }
  }
}

void _auditAt(
  List<_Tri> tris,
  double x,
  double y,
  VoxelDiagnostics diagnostics,
) {
  _Tri? nearest, top;
  var nearestZ = double.infinity, topZ = 0.0;
  for (final t in tris) {
    final z = _depthAt(t, x, y);
    if (z == null ||
        t.overlay ||
        (!VoxelDiagnostics.auditDynamic && t.key.startsWith('__'))) {
      continue;
    }
    top = t;
    topZ = z;
    if (z < nearestZ) {
      nearest = t;
      nearestZ = z;
    }
  }
  final near = nearest, last = top;
  if (near == null || last == null || identical(near, last)) return;
  if (topZ <= nearestZ + 0.001) return;
  diagnostics.observeAudit(
    x,
    y,
    _auditTriangle(near, nearestZ),
    _auditTriangle(last, topZ),
  );
}

Map<String, Object?> _auditTriangle(_Tri t, double probeZ) => {
  'key': t.key,
  'order': t.order,
  'emission': t.emission,
  'depth': t.depth,
  'probeZ': probeZ,
  'pts': [for (final p in t.pts) p],
  'rgb': [for (final c in t.argbs) c.toRadixString(16)],
};
