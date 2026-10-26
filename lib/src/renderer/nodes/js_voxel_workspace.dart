part of 'js_voxel_node.dart';

final Expando<Map<String, _VoxelFrameWorkspace>> _worldFrameWorkspaces =
    Expando<Map<String, _VoxelFrameWorkspace>>('voxel-frame-workspace');

_VoxelFrameWorkspace _voxelFrameWorkspaceFor(JsVoxelWorld world, String id) {
  var workspaces = _worldFrameWorkspaces[world];
  if (workspaces == null) {
    workspaces = <String, _VoxelFrameWorkspace>{};
    _worldFrameWorkspaces[world] = workspaces;
  }
  return workspaces.putIfAbsent(id, _VoxelFrameWorkspace.new);
}

/// Mutable raster storage shared by the short-lived painters of one scene.
/// A JS render can replace [VoxelPainter] every frame; keeping this storage
/// on the world avoids repeatedly allocating large typed arrays and _Tri
/// objects. The world Expando provides isolation and lets the whole workspace
/// become collectible with its world.
class _VoxelFrameWorkspace {
  /// References for the current frame. [trianglePool] retains the actual
  /// objects at the high-water triangle count when this list shrinks.
  final List<_Tri> tris = <_Tri>[];
  final List<_Tri> trianglePool = <_Tri>[];

  /// Two frames are retained because a recorded picture may rasterize after
  /// the following paint. The page belongs to the workspace, not a painter.
  final List<Float32List> vertPositions = <Float32List>[
    Float32List(0),
    Float32List(0),
  ];
  final List<Int32List> vertColors = <Int32List>[Int32List(0), Int32List(0)];
  final List<Float32List> vertUvs = <Float32List>[
    Float32List(0),
    Float32List(0),
  ];
  int bufferPage = 0;

  final Float32List right = Float32List(3);
  final Float32List up = Float32List(3);
  final Float32List forward = Float32List(3);
  final List<(Float32List, double)> frustumPlanes = List.generate(
    4,
    (_) => (Float32List(3), 0.0),
  );

  /// Per-triangle transform/clip scratch, reused sequentially across chunks.
  final Float32List view = Float32List(18);
  final Float32List clippedView = Float32List(18);
  final Float32List uvs = Float32List(12);
  final Float32List worldPositions = Float32List(9);
  final Float32List colors = Float32List(9);
  final List<List<Float32List>> subdivisionPool = <List<Float32List>>[];

  final _VoxelVisibleChunks visible = _VoxelVisibleChunks();
}

/// Terrain chunks that actually emitted triangles, in resident-map order.
/// Dynamic `__` meshes are deliberately excluded from order-cache snapshots.
class _VoxelVisibleChunks {
  final List<String> keys = <String>[];
  final List<JsVoxelChunk> chunks = <JsVoxelChunk>[];

  void begin() {
    keys.clear();
    chunks.clear();
  }

  void add(String key, JsVoxelChunk chunk) {
    if (key.startsWith('__')) return;
    keys.add(key);
    chunks.add(chunk);
  }
}

/// Camera/frustum calculations use the same persistent storage as rasterization.
extension _VoxelWorkspacePainter on VoxelPainter {
  /// Recomputes right/up/forward + focal from yaw/pitch/fov. Minecraft
  /// yaw/pitch convention, matching [JsVoxelCamera] payloads.
  void _buildCameraBasis() {
    final cp = math.cos(camera.pitch);
    final fx = -math.sin(camera.yaw) * cp;
    final fy = math.sin(camera.pitch);
    final fz = -math.cos(camera.yaw) * cp;
    _forward[0] = fx;
    _forward[1] = fy;
    _forward[2] = fz;
    var rx = fy * 0 - fz * 1;
    var ry = fz * 0 - fx * 0;
    var rz = fx * 1 - fy * 0;
    // Degenerate at pitch ±90°: choose a stable horizontal right vector.
    var rl = math.sqrt(rx * rx + ry * ry + rz * rz);
    if (rl < 1e-6) {
      rx = 1;
      ry = 0;
      rz = 0;
      rl = 1;
    }
    _right[0] = rx / rl;
    _right[1] = ry / rl;
    _right[2] = rz / rl;
    _up[0] = _right[1] * fz - _right[2] * fy;
    _up[1] = _right[2] * fx - _right[0] * fz;
    _up[2] = _right[0] * fy - _right[1] * fx;
    _focal = 1 / math.tan((camera.fov * math.pi / 180) / 2);
  }

  /// Inward world-space side planes through the eye. Near/far culling uses
  /// the camera basis separately in [_chunkOutsideFrustum].
  List<(Float32List, double)> _frustumPlanes(double tanHalf, double aspect) {
    final f = _forward;
    final tanX = tanHalf * aspect;
    void side(int index, Float32List axis, double t, double sign) {
      final n = _workspace.frustumPlanes[index].$1;
      for (var i = 0; i < 3; i++) {
        n[i] = f[i] * t + axis[i] * sign;
      }
      final l = math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
      for (var i = 0; i < 3; i++) {
        n[i] /= l;
      }
    }

    side(0, _right, tanX, 1);
    side(1, _right, tanX, -1);
    side(2, _up, tanHalf, 1);
    side(3, _up, tanHalf, -1);
    return _workspace.frustumPlanes;
  }
}
