part of 'js_voxel_node.dart';

final Expando<Map<String, _VoxelOrderCache>> _worldOrderCaches =
    Expando<Map<String, _VoxelOrderCache>>('voxel-order-cache');

_VoxelOrderCache _voxelOrderCacheFor(JsVoxelWorld world, String id) {
  var caches = _worldOrderCaches[world];
  if (caches == null) {
    caches = <String, _VoxelOrderCache>{};
    _worldOrderCaches[world] = caches;
  }
  return caches.putIfAbsent(id, _VoxelOrderCache.new);
}

enum _VoxelOrderMode { moving, full, reuse }

/// Temporal cache for the expensive terrain visibility order. Stable scenes
/// reuse it indefinitely. Camera movement requires a full overlap pass: new
/// screen-overlap pairs may appear whose order was never constrained by the
/// previous frame. Dynamic __ meshes are merged independently every frame.
class _VoxelOrderCache {
  final _VoxelOrderingWorkspace ordering = _VoxelOrderingWorkspace();
  final _VoxelCameraStamp _lastCamera = _VoxelCameraStamp();
  final _VoxelCameraStamp _fullCamera = _VoxelCameraStamp();
  final List<String> _lastKeys = <String>[];
  final List<String> _fullKeys = <String>[];
  final List<JsVoxelChunk> _lastChunks = <JsVoxelChunk>[];
  final List<JsVoxelChunk> _fullChunks = <JsVoxelChunk>[];
  int _generation = 0;
  final List<_Tri?> _ordered = <_Tri?>[];
  final List<_Tri> _moving = <_Tri>[];
  bool _hasLast = false;
  bool _hasFull = false;
  int _terrainCount = 0;
  int instability = 0;

  _VoxelOrderMode modeFor(
    JsVoxelCamera camera,
    Size size,
    _VoxelVisibleChunks visible,
  ) {
    final stable = _updateLast(camera, size, visible);
    final fullChunks = _hasFull && _sameChunks(_fullKeys, _fullChunks, visible);
    if (stable && fullChunks && _fullCamera.matches(camera, size)) {
      return _VoxelOrderMode.reuse;
    }
    return _VoxelOrderMode.full;
  }

  bool _updateLast(
    JsVoxelCamera camera,
    Size size,
    _VoxelVisibleChunks visible,
  ) {
    final cameraStable = _hasLast && _lastCamera.matches(camera, size);
    final chunksStable =
        _hasLast && _sameChunks(_lastKeys, _lastChunks, visible);
    instability = !_hasLast ? 0 : (!cameraStable ? 1 : (!chunksStable ? 2 : 0));
    final stable = !_hasLast || (cameraStable && chunksStable);
    _hasLast = true;
    _lastCamera.set(camera, size);
    _snapshot(visible, _lastKeys, _lastChunks);
    return stable;
  }

  void saveFullOrder(
    List<_Tri> tris,
    JsVoxelCamera camera,
    Size size,
    _VoxelVisibleChunks visible,
  ) {
    _fullCamera.set(camera, size);
    _snapshot(visible, _fullKeys, _fullChunks);
    _generation++;
    _terrainCount = 0;
    for (final t in tris) {
      if (_isDynamic(t)) continue;
      t.cachedRank = _terrainCount++;
      t.cachedRankGeneration = _generation;
      t.cachedRankId = t.cacheId;
      t.cachedRankKey = t.key;
    }
    _hasFull = true;
  }

  /// Applies a cached terrain order in O(n). Only dynamic and newly visible
  /// triangles need an exact average-depth sort before the linear merge.
  bool apply(List<_Tri> tris) {
    _ordered.length = _terrainCount;
    _ordered.fillRange(0, _ordered.length, null);
    _moving.clear();
    for (final t in tris) {
      final rank = _cachedRank(t);
      if (rank == null) {
        _moving.add(t);
        continue;
      }
      if (_ordered[rank] != null) return false;
      _ordered[rank] = t;
    }
    _sortTriListExact(_moving);
    _merge(tris);
    return true;
  }

  int? _cachedRank(_Tri t) {
    if (_isDynamic(t) ||
        t.cachedRankGeneration != _generation ||
        t.cachedRankId != t.cacheId ||
        t.cachedRankKey != t.key) {
      return null;
    }
    return t.cachedRank;
  }

  void _merge(List<_Tri> tris) {
    var terrain = 0, moving = 0;
    for (var i = 0; i < tris.length; i++) {
      while (terrain < _ordered.length && _ordered[terrain] == null) terrain++;
      final takeTerrain =
          moving >= _moving.length ||
          (terrain < _ordered.length &&
              _ordered[terrain]!.depth >= _moving[moving].depth);
      final t = takeTerrain ? _ordered[terrain++]! : _moving[moving++];
      tris[i] = t;
      t.order = i;
    }
  }

  static bool _sameChunks(
    List<String> keys,
    List<JsVoxelChunk> refs,
    _VoxelVisibleChunks visible,
  ) {
    if (keys.length != visible.keys.length) return false;
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] != visible.keys[i] ||
          !identical(refs[i], visible.chunks[i])) {
        return false;
      }
    }
    return true;
  }

  static void _snapshot(
    _VoxelVisibleChunks visible,
    List<String> keys,
    List<JsVoxelChunk> refs,
  ) {
    keys.clear();
    refs.clear();
    for (var i = 0; i < visible.keys.length; i++) {
      keys.add(visible.keys[i]);
      refs.add(visible.chunks[i]);
    }
  }

  static bool _isDynamic(_Tri t) => t.key.startsWith('__');
}

class _VoxelCameraStamp {
  double x = 0, y = 0, z = 0;
  double yaw = 0, pitch = 0, fov = 0;
  double width = 0, height = 0;
  bool texture = false;

  bool matches(JsVoxelCamera camera, Size size) {
    final p = camera.position;
    return x == p[0] &&
        y == p[1] &&
        z == p[2] &&
        yaw == camera.yaw &&
        pitch == camera.pitch &&
        fov == camera.fov &&
        texture == camera.texture &&
        width == size.width &&
        height == size.height;
  }

  void set(JsVoxelCamera camera, Size size) {
    final p = camera.position;
    x = p[0];
    y = p[1];
    z = p[2];
    yaw = camera.yaw;
    pitch = camera.pitch;
    fov = camera.fov;
    texture = camera.texture;
    width = size.width;
    height = size.height;
  }
}
