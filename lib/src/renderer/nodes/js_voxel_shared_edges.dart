part of 'js_voxel_node.dart';

/// Corrects mesh-adjacent visibility after the average-depth sort. Two
/// non-intersecting triangles that share an edge have a constant depth
/// relation throughout their screen overlap; their average depths can
/// nevertheless reverse it. This is not intended as a general z-buffer.
void _orderSharedEdges(List<_Tri> tris, VoxelDiagnostics diagnostics) {
  for (var i = 0; i < tris.length; i++) {
    tris[i].order = i;
  }
  var capacity = 16;
  while (capacity < tris.length * 6) {
    capacity *= 2;
  }
  final keyA = Int32List(capacity), keyB = Int32List(capacity);
  keyA.fillRange(0, capacity, -1);
  final owners = List<_Tri?>.filled(capacity, null);
  final ownerEdges = Int32List(capacity);
  final pairs = <(_Tri, int, _Tri, int)>[], orders = <int>[];
  var edgeCount = 0;
  for (final t in tris) {
    for (var e = 0; e < 3; e++) {
      final a = t.vertexHashes[e], b = t.vertexHashes[(e + 1) % 3];
      final lo = a < b ? a : b, hi = a < b ? b : a;
      var slot = ((lo * 31) ^ hi) & (capacity - 1);
      while (true) {
        if (keyA[slot] < 0) {
          keyA[slot] = lo;
          keyB[slot] = hi;
          owners[slot] = t;
          ownerEdges[slot] = e;
          edgeCount++;
          break;
        }
        if (keyA[slot] == lo && keyB[slot] == hi) {
          final previous = owners[slot]!, previousEdge = ownerEdges[slot];
          pairs.add((previous, previousEdge, t, e));
          // Depth relation is camera-fixed; swapping cannot invalidate it.
          orders.add(_compareSharedEdge(previous, previousEdge, t, e));
          break;
        }
        slot = (slot + 1) & (capacity - 1);
      }
    }
  }
  diagnostics.sharedEdges = edgeCount;
  diagnostics.sharedPairs = pairs.length;
  _applySharedEdgeOrders(tris, pairs, orders);
}

void _applySharedEdgeOrders(
  List<_Tri> tris,
  List<(_Tri, int, _Tri, int)> pairs,
  List<int> orders,
) {
  for (var pass = 0; pass < 2; pass++) {
    var i = 0;
    for (final (a, _, b, _) in pairs) {
      final order = orders[i++];
      if (order == 0 || (order < 0) == (a.order < b.order)) continue;
      final ai = a.order, bi = b.order;
      tris[ai] = b;
      tris[bi] = a;
      a.order = bi;
      b.order = ai;
    }
  }
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
  final step = math.min(0.01, math.sqrt(ex * ex + ey * ey) * 0.001);
  vx = vx / vl * step;
  vy = vy / vl * step;
  final az = _depthAt(a, mx + vx, my + vy);
  final bz = _depthAt(b, mx + vx, my + vy);
  if (az == null || bz == null || az == bz) return 0;
  return bz.compareTo(az);
}

int _hashVertex(Float32List p, int vertex, double depth) {
  final x = (p[vertex * 2] * 1024).round();
  final y = (p[vertex * 2 + 1] * 1024).round();
  final z = (depth * 65536).round();
  return ((x * 73856093) ^ (y * 19349639) ^ (z * 83492791)) & 0x3fffffff;
}

/// Guards the edge hash with actual projected positions and view depths.
bool _sameVertex(_Tri a, int ao, _Tri b, int bo) {
  final dx = a.pts[ao] - b.pts[bo], dy = a.pts[ao + 1] - b.pts[bo + 1];
  if (dx * dx + dy * dy > 0.0004) return false;
  return (_vertexDepth(a, ao >> 1) - _vertexDepth(b, bo >> 1)).abs() < 0.001;
}

double _vertexDepth(_Tri t, int vertex) =>
    vertex == 0 ? t.z0 : (vertex == 1 ? t.z1 : t.z2);

double? _depthAt(_Tri t, double x, double y) {
  final p = t.pts;
  final den = (p[3] - p[5]) * (p[0] - p[4]) + (p[4] - p[2]) * (p[1] - p[5]);
  if (den.abs() < 1e-8) return null;
  final a = ((p[3] - p[5]) * (x - p[4]) + (p[4] - p[2]) * (y - p[5])) / den;
  final b = ((p[5] - p[1]) * (x - p[4]) + (p[0] - p[4]) * (y - p[5])) / den;
  final c = 1 - a - b;
  if (a < -1e-7 || b < -1e-7 || c < -1e-7) return null;
  return 1 / (a / t.z0 + b / t.z1 + c / t.z2);
}
