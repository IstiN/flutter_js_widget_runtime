import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import 'js_voxel_blocks.dart';
import 'js_voxel_diagnostics.dart';

part 'js_voxel_chunk.dart';
part 'js_voxel_shared_edges.dart';
part 'js_voxel_overlap.dart';
part 'js_voxel_order_cache.dart';
part 'js_voxel_workspace.dart';

/// Per-frame view state pushed via `jsr.hostCall('voxel.camera', ...)`.
///
/// `yaw`/`pitch` follow the Minecraft-style convention consumers use:
/// forward = (-sin(yaw)·cos(pitch), sin(pitch), -cos(yaw)·cos(pitch)).
/// `light` (0..1) multiplies every face color; `skyColor` clears the
/// viewport. Numbers are copied at upload so later JS mutations of the
/// payload cannot mutate rendered state.
class JsVoxelCamera {
  JsVoxelCamera({
    List<double> position = const [0, 80, 0],
    this.yaw = 0,
    this.pitch = -0.6,
    this.light = 1,
    this.fov = 70,
    this.texture = false,
    Color? skyColor,
    this.fogStart = 56,
    this.fogEnd = 128,
  }) : position = Float32List.fromList(position),
       skyColor = skyColor ?? const Color(0xFF87CEEB);

  factory JsVoxelCamera.fromDynamic(Map<String, dynamic> args) {
    final cam = JsVoxelCamera(texture: args['texture'] == true);
    final position = _vec3(args['position']);
    if (position != null) cam.position = position;
    final yaw = args['yaw'];
    if (yaw is num) cam.yaw = yaw.toDouble();
    final pitch = args['pitch'];
    if (pitch is num) cam.pitch = pitch.toDouble();
    final light = args['light'];
    if (light is num) cam.light = light.clamp(0.0, 1.0).toDouble();
    final fov = args['fov'];
    if (fov is num && fov > 0) cam.fov = fov.toDouble();
    final sky = args['skyColor'];
    if (sky is String) cam.skyColor = _parseColor(sky) ?? cam.skyColor;
    final fog = args['fog'];
    if (fog is List && fog.length == 2 && fog.every((e) => e is num)) {
      cam.fogStart = (fog[0] as num).toDouble();
      cam.fogEnd = (fog[1] as num).toDouble();
    }
    if (args['fog'] == false) {
      cam.fogStart = 1e9;
      cam.fogEnd = 1e9 + 1;
    }
    return cam;
  }

  Float32List position;
  double yaw;
  double pitch;

  /// Pixelated block texturing: the painter modulates triangles with a
  /// procedural 16px-per-block noise texture when the widget opts in.
  bool texture;
  double light;
  double fov;
  Color skyColor;

  /// Distance fog: triangle colors blend toward [skyColor] between
  /// [fogStart] and [fogEnd] view units. Hides the streamed world's cut
  /// edge — without it the render-distance boundary reads as floating
  /// slabs hanging over void ("the world hangs in emptiness" report).
  /// Widgets may pass `fog: [start, end]` or `fog: false` to tune it.
  double fogStart;
  double fogEnd;
}

Float32List? _vec3(dynamic raw) {
  if (raw is! List || raw.length < 3) return null;
  for (final v in raw) {
    if (v is! num) return null;
  }
  return Float32List.fromList([
    (raw[0] as num).toDouble(),
    (raw[1] as num).toDouble(),
    (raw[2] as num).toDouble(),
  ]);
}

Color? _parseColor(String raw) {
  var hex = raw;
  if (hex.startsWith('#')) hex = hex.substring(1);
  if (hex.length == 6) hex = 'FF$hex';
  if (hex.length != 8) return null;
  final value = int.tryParse(hex, radix: 16);
  return value == null ? null : Color(value);
}

/// Dart-side voxel world state for one running widget engine.
///
/// The bridge owns the instance: `voxel.*` hostCalls land here and the
/// `voxel` renderer node paints from it. Extends [ChangeNotifier] so the
/// node's [CustomPaint] repaints exactly when the widget pushes new chunk
/// buffers or a camera update — never per render pass.
///
/// State is namespaced by the attach `id` (the node's `id` prop), so two
/// panels can run different voxel widgets without collisions.
class JsVoxelWorld extends ChangeNotifier {
  final Map<String, Map<String, JsVoxelChunk>> _chunksByInstance = {};
  final Map<String, JsVoxelCamera> _cameras = {};

  /// Whether the running engine has the native bytes lane wired so
  /// `jsr.hostCallBinary('voxel.mesh.bin', …)` can deliver packed
  /// chunks. Engines flip this before the widget runs (the QuickJS
  /// backend sets it next to `__jsrSendBytes` registration); when false
  /// the attach response omits `bin` and widgets keep the JSON lane.
  bool binaryLaneAvailable = false;

  /// Fire-and-forget receiver for the binary voxel lane. Defined
  /// capabilities (both share the `'JVXM'` envelope — tiny JSON header +
  /// raw body):
  ///
  /// - `voxel.mesh.bin` — a packed [JsVoxelChunk.fromBinary] upload.
  /// - `voxel.blocks.bin` — raw chunk block bytes (NO base64) with the
  ///   `voxel.blocks` header fields (`id, key, origin, size[, palette,
  ///   shade]`); routed through the same palette cache / cross-chunk
  ///   remesh flow as the JSON lane.
  ///
  /// Malformed payloads are dropped silently — the lane has no promise
  /// to resolve through, so a bad chunk must never wedge the widget
  /// (same policy as the rest of the binary lane).
  void handleHostCallBinary(String name, Uint8List data) {
    if (name == 'voxel.mesh.bin') {
      final parsed = JsVoxelChunk.fromBinary(data);
      if (parsed == null) return;
      final (id, key, chunk) = parsed;
      _chunksByInstance.putIfAbsent(id, () => {})[key] = chunk;
      notifyListeners();
      return;
    }
    if (name == 'voxel.blocks.bin') {
      final envelope = JsVoxelChunk.parseBinaryEnvelope(data);
      if (envelope == null) return;
      final (header, bodyStart) = envelope;
      _handleBlocks({
        'id': header['id'],
        'key': header['key'],
        'origin': header['origin'],
        'size': header['size'],
        // Raw bytes — the whole point of this lane: no base64 expansion,
        // no decode on the Dart side, view copied once by fromDynamic.
        'blocks': Uint8List.fromList(data.sublist(bodyStart)),
        if (header['palette'] != null) 'palette': header['palette'],
        if (header['shade'] != null) 'shade': header['shade'],
      });
    }
  }

  /// Handles a `voxel.*` hostCall. Returns the value to resolve the JS
  /// promise with; throws for unknown capability names (the bridge turns
  /// that into a rejected promise).
  ///
  /// Contract:
  /// - `voxel.attach {id}` → `{ok: true}` plus capability flags:
  ///   `blocks: true` (the native voxel.blocks mesher) and `bin: true`
  ///   when the runtime has the native bytes lane and
  ///   [binaryLane] is wired — widgets upload packed chunks via
  ///   `jsr.hostCallBinary('voxel.mesh.bin', …)` then. Rejects only when
  ///   the runtime has no voxel support at all (older jsr versions reject
  ///   every unknown hostCall name) — widgets use that to degrade
  ///   gracefully.
  /// - `voxel.mesh {id, key, origin, positions, colors, indices}` →
  ///   `{ok: bool}`. Resolves (not rejects) with `ok:false` for a
  ///   malformed upload so one bad chunk never degrades the session.
  /// - `voxel.camera {id, position, yaw, pitch, light, skyColor}` →
  ///   `{ok: true}`.
  /// - `voxel.chunkRemove {id, key}` → `{ok: true, removed: bool}` —
  ///   drops a resident chunk so long sessions can evict off-ring chunks
  ///   instead of growing the world forever.
  Map<String, dynamic> handleHostCall(String name, Map<String, dynamic> args) {
    switch (name) {
      case 'voxel.attach':
        final id = _instanceId(args);
        _chunksByInstance.putIfAbsent(id, () => {});
        // `blocks: true` advertises the native voxel.blocks mesher so
        // widgets can ship raw block bytes instead of JS-built meshes.
        return {
          'ok': true,
          'blocks': true,
          if (binaryLaneAvailable) 'bin': true,
        };
      case 'voxel.blocks':
        return _handleBlocks(args);
      case 'voxel.mesh':
        final id = _instanceId(args);
        final key = args['key']?.toString() ?? '';
        if (key.isEmpty) return {'ok': false, 'reason': 'missing key'};
        final chunk = JsVoxelChunk.fromDynamic(args);
        if (chunk == null) {
          return {'ok': false, 'reason': 'malformed mesh payload'};
        }
        _chunksByInstance.putIfAbsent(id, () => {})[key] = chunk;
        notifyListeners();
        return {'ok': true, 'faces': chunk.faceCount};
      case 'voxel.camera':
        final id = _instanceId(args);
        _cameras[id] = JsVoxelCamera.fromDynamic(args);
        notifyListeners();
        return const {'ok': true};
      case 'voxel.chunkRemove':
        final id = _instanceId(args);
        final key = args['key']?.toString() ?? '';
        final removed = _chunksByInstance[id]?.remove(key) != null;
        final bytesGone = _blocksByInstance[id]?.remove(key) != null;
        if (removed || bytesGone) notifyListeners();
        return {'ok': true, 'removed': removed || bytesGone};
      default:
        throw UnsupportedError('unknown voxel capability: $name');
    }
  }

  final Map<String, Map<String, JsVoxelBlocks>> _blocksByInstance = {};
  final Map<String, JsVoxelPalette> _paletteByInstance = {};

  /// `voxel.blocks {id, key, origin, size, blocks[, palette, shade,
  /// overlay]}` — raw chunk bytes, meshed here in Dart. The palette is
  /// cached per instance: only the first upload (or a palette change)
  /// carries it. Storing bytes also lets later uploads cull interior
  /// faces against this chunk (and re-mesh its neighbors when this
  /// chunk's arrival hides their border faces).
  Map<String, dynamic> _handleBlocks(Map<String, dynamic> args) {
    final id = _instanceId(args);
    final key = args['key']?.toString() ?? '';
    if (key.isEmpty) return {'ok': false, 'reason': 'missing key'};
    final rawPalette = args['palette'];
    if (rawPalette != null) {
      final palette = JsVoxelPalette.fromDynamic(rawPalette);
      if (palette == null) return {'ok': false, 'reason': 'malformed palette'};
      palette.applyShade(args['shade']);
      _paletteByInstance[id] = palette;
    } else if (!_paletteByInstance.containsKey(id)) {
      return {'ok': false, 'reason': 'missing palette'};
    }
    final blocks = JsVoxelBlocks.fromDynamic(args);
    if (blocks == null) {
      return {'ok': false, 'reason': 'malformed blocks payload'};
    }
    _blocksByInstance.putIfAbsent(id, () => {})[key] = blocks;
    var faces = 0;
    final mesh = _meshStored(id, key);
    if (mesh != null) {
      _chunksByInstance.putIfAbsent(id, () => {})[key] = mesh;
      faces = mesh.faceCount;
    } else {
      // Fully-air chunk (or remesh to nothing): no geometry to keep.
      _chunksByInstance[id]?.remove(key);
    }
    _remeshNeighbors(id, blocks.gx, blocks.gz);
    notifyListeners();
    return {'ok': true, 'faces': faces};
  }

  /// Meshes the stored bytes of [key] with cross-chunk culling against
  /// every other resident chunk of the instance.
  JsVoxelChunk? _meshStored(String id, String key) {
    final blocks = _blocksByInstance[id]?[key];
    final palette = _paletteByInstance[id];
    if (blocks == null || palette == null) return null;
    return meshVoxelBlocks(
      chunk: blocks,
      palette: palette,
      neighborAt: _neighborLookup(id, blocks),
      origin: blocks.origin,
    );
  }

  /// Cross-chunk block lookup for meshing [blocks]: resolves the
  /// grid-adjacent resident chunk (one axis past the border at a time)
  /// or air when the neighbor is missing.
  int Function(int lx, int y, int lz) _neighborLookup(
    String id,
    JsVoxelBlocks blocks,
  ) {
    final store = _blocksByInstance[id];
    if (store == null) return (_, __, ___) => 0;
    final gx = blocks.gx, gz = blocks.gz;
    final sx = blocks.sx, sz = blocks.sz;
    final west = store['${gx - 1},$gz'];
    final east = store['${gx + 1},$gz'];
    final north = store['$gx,${gz - 1}'];
    final south = store['$gx,${gz + 1}'];
    return (lx, y, lz) {
      if (lx < 0) return _sampleNeighbor(west, lx + sx, y, lz);
      if (lx >= sx) return _sampleNeighbor(east, lx - sx, y, lz);
      if (lz < 0) return _sampleNeighbor(north, lx, y, lz + sz);
      return _sampleNeighbor(south, lx, y, lz - sz);
    };
  }

  int _sampleNeighbor(JsVoxelBlocks? nb, int lx, int y, int lz) {
    if (nb == null || y < 0 || y >= nb.sy) return 0;
    if (lx < 0 || lx >= nb.sx || lz < 0 || lz >= nb.sz) return 0;
    return nb.data[(y * nb.sz + lz) * nb.sx + lx];
  }

  /// A newly-stored chunk can hide (or reveal) the border faces of its
  /// resident neighbors — re-mesh the up-to-4 adjacent chunks.
  void _remeshNeighbors(String id, int gx, int gz) {
    final store = _blocksByInstance[id];
    if (store == null) return;
    const deltas = [(-1, 0), (1, 0), (0, -1), (0, 1)];
    for (final (dx, dz) in deltas) {
      final nkey = '${gx + dx},${gz + dz}';
      if (!store.containsKey(nkey)) continue;
      final mesh = _meshStored(id, nkey);
      if (mesh != null) {
        _chunksByInstance.putIfAbsent(id, () => {})[nkey] = mesh;
      } else {
        _chunksByInstance[id]?.remove(nkey);
      }
    }
  }

  /// Chunks uploaded for [id] (empty when the widget never attached).
  Map<String, JsVoxelChunk> chunksOf(String id) =>
      _chunksByInstance[id] ?? const {};

  /// The last camera pushed for [id], or the default viewpoint.
  JsVoxelCamera cameraOf(String id) => _cameras[id] ?? JsVoxelCamera();

  /// Drops all state (host resets, tests).
  void clear() {
    _chunksByInstance.clear();
    _blocksByInstance.clear();
    _paletteByInstance.clear();
    _cameras.clear();
    notifyListeners();
  }

  String _instanceId(Map<String, dynamic> args) => args['id']?.toString() ?? '';
}

/// Parsed configuration of a `voxel` node.
class VoxelNodeConfig {
  const VoxelNodeConfig({required this.id, this.width, this.height});

  final String id;
  final double? width;
  final double? height;
}

/// Parses the raw node map. Tolerates garbage: a missing id falls back to
/// `default` so a half-written node still paints the default world.
VoxelNodeConfig parseVoxelNodeConfig(Map<String, dynamic> node) {
  return VoxelNodeConfig(
    id: node['id']?.toString() ?? 'default',
    width: _dim(node['width']),
    height: _dim(node['height']),
  );
}

double? _dim(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

/// Renders a `voxel` node: chunk vertex buffers pushed from JS, drawn by a
/// pure-Dart software pipeline on [CustomPaint]. Pure Dart — no native
/// dependencies, no new packages.
///
/// JSON shape:
///
/// ```json
/// {
///   "type": "voxel",
///   "id": "fa-craft",
///   "fov": 70
/// }
/// ```
///
/// Sizing: without `width`/`height` the node expands to fill its parent
/// (a stack child fills the viewport); with them it is pinned.
///
/// The widget JS side: `jsr.hostCall('voxel.attach', {id})` to check
/// support (older runtimes reject — degrade gracefully), then
/// `jsr.hostCall('voxel.mesh', {id, key, origin, positions, colors,
/// indices})` per chunk (rebuilt only on edit) and
/// `jsr.hostCall('voxel.camera', {id, position, yaw, pitch, light,
/// skyColor})` per frame.
class JsVoxelNode extends StatelessWidget {
  const JsVoxelNode({required this.world, required this.config, super.key});

  final JsVoxelWorld world;
  final VoxelNodeConfig config;

  @override
  Widget build(BuildContext context) {
    Widget scene = CustomPaint(
      painter: VoxelPainter(world: world, id: config.id),
      // The painter reads live world state; uploads notify and repaint.
      isComplex: true,
      willChange: true,
      child: const SizedBox.expand(),
    );
    if (config.width != null || config.height != null) {
      scene = SizedBox(
        width: config.width,
        height: config.height,
        child: scene,
      );
    } else {
      scene = SizedBox.expand(child: scene);
    }
    return scene;
  }
}

/// One painter-sorted triangle: view-space depth, emission order, screen
/// points (flat x0,y0,x1,y1,x2,y2) and per-vertex light-multiplied ARGB
/// fills (interpolation across the triangle is what gives merged greedy
/// quads their per-block texture). Pooled — the paint loop reuses
/// [VoxelPainter._tris] instead of allocating per frame; flat storage
/// avoids 3 Offset + 1 Color allocations per triangle per frame (that
/// churn alone dominated the web build's frame time).
class _Tri {
  final Float32List pts = Float32List(6);
  final Float32List uvs = Float32List(6);
  final Int32List argbs = Int32List(3);
  final Int32List vertexHashes = Int32List(3);
  double depth = 0;
  double z0 = 0, z1 = 0, z2 = 0, iz0 = 0, iz1 = 0, iz2 = 0;
  double planeCoordinate = 0;
  int emission = 0, cacheId = 0, order = 0, planeAxis = -1;
  int cachedRank = -1, cachedRankGeneration = 0, cachedRankId = -1;
  bool overlay = false;
  String key = '', cachedRankKey = '';
}

/// Software rasterizer for [JsVoxelNode]: per-chunk frustum culling against
/// the camera basis, near-plane clipping, backface culling by screen-space
/// winding, painter's z-sort (far → near), flat shading (first vertex
/// color × light). Exposed for tests.
///
/// Repaints are driven by the [JsVoxelWorld] listenable (chunk/camera
/// uploads), so [shouldRepaint] is always false; chunks and camera are
/// read live at paint time.
class VoxelPainter extends CustomPainter {
  VoxelPainter({required this.world, required this.id}) : super(repaint: world);

  final JsVoxelWorld world;
  final String id;

  late JsVoxelCamera camera;
  Map<String, JsVoxelChunk> chunks = const {};

  late final _workspace = _voxelFrameWorkspaceFor(world, id);
  late final List<_Tri> _tris = _workspace.tris;
  late final List<_Tri> _triPool = _workspace.trianglePool;
  late final _visible = _workspace.visible;
  late final _orderCache = _voxelOrderCacheFor(world, id);
  final VoxelDiagnostics _diagnostics = VoxelDiagnostics();

  // Camera basis storage is shared; values are recomputed in paint().
  late final Float32List _right = _workspace.right;
  late final Float32List _up = _workspace.up;
  late final Float32List _forward = _workspace.forward;
  late double _focal;

  static const double nearPlane = 0.05;

  /// Camera sky color as doubles for the per-triangle fog blend.
  double _skyR = 0x87.toDouble(),
      _skyG = 0xce.toDouble(),
      _skyB = 0xeb.toDouble();

  @override
  bool shouldRepaint(VoxelPainter oldDelegate) => false;

  @override
  void paint(Canvas canvas, Size size) {
    _diagnostics.begin();
    final sw = Stopwatch()..start();
    _paintBody(canvas, size);
    sw.stop();
    if (VoxelDiagnostics.enabled) {
      final b = _vertPositions[_workspace.bufferPage];
      _diagnostics.record(
        instanceId: id,
        painterId: identityHashCode(this),
        size: size,
        position: camera.position,
        yaw: camera.yaw,
        pitch: camera.pitch,
        fov: camera.fov,
        chunkCount: chunks.length,
        triangleCount: _lastTriCount,
        elapsedUs: sw.elapsedMicroseconds,
        bufferPage: _workspace.bufferPage,
        bufferId: identityHashCode(b),
        bufferLength: b.length,
      );
    }
    _paintCount++;
    _paintUs += sw.elapsedMicroseconds;
    _paintTris += _lastTriCount;
    if (_paintCount >= 300) {
      debugPrint(
        '[voxel v=w6] '
        'paint=${(_paintUs / _paintCount / 1000).toStringAsFixed(1)}ms '
        'tris=${(_paintTris / _paintCount).round()}',
      );
      _paintCount = 0;
      _paintUs = 0;
      _paintTris = 0;
    }
  }

  static int _paintCount = 0;
  static int _paintUs = 0;
  static int _paintTris = 0;
  int _lastTriCount = 0;

  /// Triangles collected by the last [paint] — exposed for perf tests
  /// (subdivision must keep grazing-terrain frames bounded).
  @visibleForTesting
  int get lastTriCount => _lastTriCount;

  @visibleForTesting
  int get debugVisibilityEdges => _diagnostics.visibilityEdges;

  @visibleForTesting
  int get debugWorkspaceId => identityHashCode(_workspace);

  @visibleForTesting
  int get debugTrianglePoolLength => _triPool.length;

  @visibleForTesting
  int debugTriangleId(int index) => identityHashCode(_triPool[index]);

  @visibleForTesting
  int get debugBufferPage => _workspace.bufferPage;

  @visibleForTesting
  int get debugBufferId =>
      identityHashCode(_vertPositions[_workspace.bufferPage]);

  void _paintBody(Canvas canvas, Size size) {
    chunks = world.chunksOf(id);
    camera = world.cameraOf(id);
    _visible.begin();
    _lastTriCount = 0;
    if (chunks.isEmpty) return;
    canvas.drawRect(Offset.zero & size, Paint()..color = camera.skyColor);
    final sc = camera.skyColor;
    _skyR = (sc.r * 255.0).roundToDouble();
    _skyG = (sc.g * 255.0).roundToDouble();
    _skyB = (sc.b * 255.0).roundToDouble();
    _buildCameraBasis();

    final ex = camera.position[0];
    final ey = camera.position[1];
    final ez = camera.position[2];
    final halfH = size.height / 2;
    final halfW = size.width / 2;

    // View-frustum planes (normal, d) in world space for chunk culling:
    // 4 side planes + near. Plane pick: right = ±screen x bound etc.
    final tanHalf = math.tan((camera.fov * math.pi / 180) / 2);
    final planes = _frustumPlanes(tanHalf, size.aspectRatio);

    var cursor = 0;
    for (final entry in chunks.entries) {
      final chunk = entry.value;
      if (VoxelDiagnostics.enabled)
        _diagnostics.observeChunk(
          entry.key,
          identityHashCode(chunk),
          chunk.positions.length,
          chunk.indices.length,
        );
      final before = cursor;
      final outside = _chunkOutsideFrustum(chunk, ex, ey, ez, planes);
      if (!outside) {
        _diagnostics.visibleChunks++;
        cursor = _collectChunk(chunk, cursor, ex, ey, ez, halfW, halfH);
        for (var i = before; i < cursor; i++) {
          _tris[i].key = entry.key;
        }
        if (cursor > before) _visible.add(entry.key, chunk);
      }
      if (VoxelDiagnostics.enabled)
        _diagnostics.observeMob(
          entry.key,
          outside,
          before,
          cursor,
          chunk.aabbMin,
          chunk.aabbMax,
          chunk.origin,
        );
    }
    if (cursor == 0) return;
    _lastTriCount = cursor;
    _sortAndDraw(canvas, cursor, size);
  }

  void _sortAndDraw(Canvas canvas, int cursor, Size size) {
    _tris.length = cursor;
    _sortTrisExact(size);
    if (VoxelDiagnostics.audit) _auditDepthOrder(_tris, size, _diagnostics);
    final vCount = cursor * 3;
    final textured = camera.texture;
    final page = _workspace.bufferPage = 1 - _workspace.bufferPage;
    var pos = _vertPositions[page];
    var cols = _vertColors[page];
    var uvs = _vertUvs[page];
    if (pos.length < vCount * 2) {
      pos = _vertPositions[page] = Float32List(vCount * 2);
      cols = _vertColors[page] = Int32List(vCount);
      uvs = _vertUvs[page] = Float32List(vCount * 2);
    }
    for (var i = 0; i < cursor; i++) {
      final t = _tris[i];
      if (VoxelDiagnostics.probeX >= 0)
        _diagnostics.observeProbe(
          t.key,
          i,
          t.pts,
          t.argbs,
          t.depth,
          t.emission,
          t.z0,
          t.z1,
          t.z2,
        );
      final o = i * 6, c = i * 3;
      for (var k = 0; k < 6; k++) {
        pos[o + k] = t.pts[k];
        if (textured) uvs[o + k] = t.uvs[k];
      }
      cols[c] = t.argbs[0];
      cols[c + 1] = t.argbs[1];
      cols[c + 2] = t.argbs[2];
    }
    _diagnostics.hashStreams(pos, cols, vCount);
    final paint = Paint();
    Float32List? uvView;
    if (textured) {
      final tex = _noiseTexture();
      if (tex != null) {
        uvView = Float32List.sublistView(uvs, 0, vCount * 2);
        paint.shader = ui.ImageShader(
          tex,
          ui.TileMode.repeated,
          ui.TileMode.repeated,
          Matrix4.identity().storage,
        );
      }
    }
    final posData = _drawPositions(pos, vCount);
    final colData = _drawColors(cols, vCount);
    uvView = _drawUvs(uvs, uvView, vCount);
    final vertices = ui.Vertices.raw(
      ui.VertexMode.triangles,
      posData,
      textureCoordinates: uvView,
      colors: colData,
    );
    // Opaque untextured vertex colors use srcOver (iOS Impeller drops
    // BlendMode.modulate drawVertices without a shader texture).
    canvas.drawVertices(
      vertices,
      textured ? BlendMode.modulate : BlendMode.srcOver,
      paint,
    );
    _strokeOverlayEdges(canvas, cursor);
  }

  Float32List _drawPositions(Float32List p, int n) =>
      VoxelDiagnostics.copyBuffers
      ? (Float32List(n * 2)..setRange(0, n * 2, p))
      : Float32List.sublistView(p, 0, n * 2);

  Int32List _drawColors(Int32List c, int n) => VoxelDiagnostics.copyBuffers
      ? (Int32List(n)..setRange(0, n, c))
      : Int32List.sublistView(c, 0, n);

  Float32List? _drawUvs(Float32List u, Float32List? view, int n) {
    if (!VoxelDiagnostics.copyBuffers || view == null) return view;
    return Float32List(n * 2)..setRange(0, n * 2, u);
  }

  /// Exact far-to-near painter order. Bucket quantization can reverse two
  /// different depths that share a bucket, letting a later-uploaded far
  /// face paint over a nearer one. Emission order breaks only exact ties.
  void _sortTrisExact(Size size) {
    _orderSharedEdges(_tris, _diagnostics, size, _orderCache, camera, _visible);
  }

  /// Overlay chunks (the aim marker) are thin high-contrast strips:
  /// drawVertices does no antialiasing, so a white-on-green edge reads
  /// as a pixel staircase. Re-stroking their outlines with an AA line
  /// paint covers the jaggies. Only BOUNDARY edges are stroked: an edge
  /// shared by two overlay triangles (the diagonal splitting a band
  /// quad, the seam where two bands meet) would otherwise paint as a
  /// visible stripe INSIDE the highlight ring.
  void _strokeOverlayEdges(Canvas canvas, int cursor) {
    final edges = <double>[]; // x0,y0,x1,y1, canonical endpoint order
    final edgeColors = <int>[];
    for (var i = 0; i < cursor; i++) {
      final t = _tris[i];
      if (!t.overlay) continue;
      final p = t.pts;
      _toggleEdge(edges, edgeColors, p[0], p[1], p[2], p[3], t.argbs[0]);
      _toggleEdge(edges, edgeColors, p[2], p[3], p[4], p[5], t.argbs[0]);
      _toggleEdge(edges, edgeColors, p[4], p[5], p[0], p[1], t.argbs[0]);
    }
    if (edges.isEmpty) return;
    final paint = Paint()
      ..isAntiAlias = true
      ..strokeWidth = 1.4
      ..style = PaintingStyle.stroke;
    final byColor = <int, List<Offset>>{};
    for (var e = 0, c = 0; e < edges.length; e += 4, c++) {
      byColor.putIfAbsent(edgeColors[c], () => []).addAll([
        Offset(edges[e], edges[e + 1]),
        Offset(edges[e + 2], edges[e + 3]),
      ]);
    }
    byColor.forEach((argb, pts) {
      canvas.drawPoints(ui.PointMode.lines, pts, paint..color = Color(argb));
    });
  }

  /// Adds the edge to the boundary set, or removes it when already
  /// present (a second triangle sharing it). Endpoints are canonicalized
  /// so A→B and B→A cancel. Overlay meshes are a handful of triangles —
  /// the linear scan is cheaper than keying a hash map.
  void _toggleEdge(
    List<double> edges,
    List<int> colors,
    double x0,
    double y0,
    double x1,
    double y1,
    int argb,
  ) {
    var ax = x0, ay = y0, bx = x1, by = y1;
    if (ax > bx || (ax == bx && ay > by)) {
      ax = x1;
      ay = y1;
      bx = x0;
      by = y0;
    }
    for (var e = 0, c = 0; e < edges.length; e += 4, c++) {
      if (edges[e] == ax &&
          edges[e + 1] == ay &&
          edges[e + 2] == bx &&
          edges[e + 3] == by) {
        edges.removeRange(e, e + 4);
        colors.removeAt(c);
        return;
      }
    }
    edges.addAll([ax, ay, bx, by]);
    colors.add(argb);
  }

  // Double-buffered draw arrays: a recorded picture may rasterize AFTER the
  // next paint() has run (async raster, routine under fast swipes), so the
  // buffers the previous frame's Vertices points at must stay untouched for
  // one full frame. Alternating two sets guarantees that.
  late final List<Float32List> _vertPositions = _workspace.vertPositions;
  late final List<Int32List> _vertColors = _workspace.vertColors;
  late final List<Float32List> _vertUvs = _workspace.vertUvs;

  bool _chunkOutsideFrustum(
    JsVoxelChunk chunk,
    double ex,
    double ey,
    double ez,
    List<(Float32List, double)> planes,
  ) {
    final cx = (chunk.aabbMin[0] + chunk.aabbMax[0]) / 2 + chunk.origin[0] - ex;
    final cy = (chunk.aabbMin[1] + chunk.aabbMax[1]) / 2 + chunk.origin[1] - ey;
    final cz = (chunk.aabbMin[2] + chunk.aabbMax[2]) / 2 + chunk.origin[2] - ez;
    final hx = (chunk.aabbMax[0] - chunk.aabbMin[0]) / 2;
    final hy = (chunk.aabbMax[1] - chunk.aabbMin[1]) / 2;
    final hz = (chunk.aabbMax[2] - chunk.aabbMin[2]) / 2;
    for (final (n, _) in planes) {
      final dist = n[0] * cx + n[1] * cy + n[2] * cz;
      final radius = (n[0].abs() * hx + n[1].abs() * hy + n[2].abs() * hz);
      if (dist < -radius) return true;
    }
    // Near plane: behind the eye when the closest face is beyond it.
    final nearDist = _forward[0] * cx + _forward[1] * cy + _forward[2] * cz;
    final nearRadius =
        _forward[0].abs() * hx +
        _forward[1].abs() * hy +
        _forward[2].abs() * hz;
    if (nearDist < -nearRadius - nearPlane) return true;
    return _fullyFoged(nearDist - nearRadius);
  }

  /// Untextured geometry at/after fogEnd is exactly sky-colored. The textured
  /// modulate path is excluded: its noise shader also multiplies sky colors.
  bool _fullyFoged(double nearestViewDepth) {
    return !camera.texture &&
        camera.fogEnd > camera.fogStart &&
        nearestViewDepth >= camera.fogEnd;
  }

  bool _fullyFogedTriangle(Float32List view) {
    return _fullyFoged(view[2]) && _fullyFoged(view[5]) && _fullyFoged(view[8]);
  }

  /// Projects and collects the visible triangles of [chunk], appending to
  /// the [_tris] pool from [cursor]. Returns the new cursor.
  int _collectChunk(
    JsVoxelChunk chunk,
    int cursor,
    double ex,
    double ey,
    double ez,
    double halfW,
    double halfH,
  ) {
    final pos = chunk.positions;
    final col = chunk.colors;
    final ox = chunk.origin[0] - ex;
    final oy = chunk.origin[1] - ey;
    final oz = chunk.origin[2] - ez;
    final light = camera.light;
    final indices = chunk.indices;

    // Scratch: wpos/crgb hold the input tri in WORLD space (subdivision
    // and uv need it); view/cview are the clip scratch (3 input slots +
    // up to 3 intersection slots); uvs carries per-slot texture coords
    // when the camera opts into block texturing.
    final textured = camera.texture;
    final view = _workspace.view;
    final cview = _workspace.clippedView;
    final uvs = _workspace.uvs;
    final wpos = _workspace.worldPositions;
    final crgb = _workspace.colors;
    for (var f = 0; f + 2 < indices.length; f += 3) {
      if (_loadAndCullWorldTri(
        pos,
        col,
        indices,
        f,
        ox,
        oy,
        oz,
        ex,
        ey,
        ez,
        wpos,
        crgb,
      )) {
        _diagnostics.backfaceCull++;
        continue;
      }
      cursor = _emitWorldTri(
        chunk,
        cursor,
        wpos,
        crgb,
        ex,
        ey,
        ez,
        halfW,
        halfH,
        light,
        textured,
        view,
        cview,
        uvs,
        0,
        f ~/ 3,
        1,
      );
    }
    return cursor;
  }

  /// Loads triangle [f] into [wpos]/[crgb] and returns `true` when it is
  /// back-facing in 3D eye-relative space (dot(v0 - eye, normal) >= 0),
  /// culling ~50% of triangles before view transform and uv subdivision.
  bool _loadAndCullWorldTri(
    Float32List pos,
    Float32List col,
    Uint32List indices,
    int f,
    double ox,
    double oy,
    double oz,
    double ex,
    double ey,
    double ez,
    Float32List wpos,
    Float32List crgb,
  ) {
    final p0 = indices[f] * 3;
    final p1 = indices[f + 1] * 3;
    final p2 = indices[f + 2] * 3;
    final x0 = pos[p0] + ox, y0 = pos[p0 + 1] + oy, z0 = pos[p0 + 2] + oz;
    final x1 = pos[p1] + ox, y1 = pos[p1 + 1] + oy, z1 = pos[p1 + 2] + oz;
    final x2 = pos[p2] + ox, y2 = pos[p2 + 1] + oy, z2 = pos[p2 + 2] + oz;
    final ux = x1 - x0, uy = y1 - y0, uz = z1 - z0;
    final vx = x2 - x0, vy = y2 - y0, vz = z2 - z0;
    final nx = uy * vz - uz * vy;
    final ny = uz * vx - ux * vz;
    final nz = ux * vy - uy * vx;
    if (x0 * nx + y0 * ny + z0 * nz >= 0) return true;
    wpos[0] = x0 + ex;
    wpos[1] = y0 + ey;
    wpos[2] = z0 + ez;
    wpos[3] = x1 + ex;
    wpos[4] = y1 + ey;
    wpos[5] = z1 + ez;
    wpos[6] = x2 + ex;
    wpos[7] = y2 + ey;
    wpos[8] = z2 + ez;
    crgb[0] = col[p0];
    crgb[1] = col[p0 + 1];
    crgb[2] = col[p0 + 2];
    crgb[3] = col[p1];
    crgb[4] = col[p1 + 1];
    crgb[5] = col[p1 + 2];
    crgb[6] = col[p2];
    crgb[7] = col[p2 + 1];
    crgb[8] = col[p2 + 2];
    return false;
  }

  /// Processes one world-space triangle: optionally subdivides it for
  /// perspective-faithful texturing, then transforms, clips and projects
  /// it into the [_tris] pool.
  int _emitWorldTri(
    JsVoxelChunk chunk,
    int cursor,
    Float32List wpos,
    Float32List crgb,
    double ex,
    double ey,
    double ez,
    double halfW,
    double halfH,
    double light,
    bool textured,
    Float32List view,
    Float32List cview,
    Float32List uvs,
    int depth,
    int sourceTri,
    int path,
  ) {
    for (var v = 0; v < 3; v++) {
      view[v * 3] = wpos[v * 3] - ex;
      view[v * 3 + 1] = wpos[v * 3 + 1] - ey;
      view[v * 3 + 2] = wpos[v * 3 + 2] - ez;
      _toView(view, v * 3);
      cview[v * 3] = crgb[v * 3];
      cview[v * 3 + 1] = crgb[v * 3 + 1];
      cview[v * 3 + 2] = crgb[v * 3 + 2];
    }
    // Fully behind the near plane → the clip would drop it; bail BEFORE
    // paying for subdivision (half the ring is behind the camera).
    if (view[2] < nearPlane && view[5] < nearPlane && view[8] < nearPlane) {
      return cursor;
    }
    if (_fullyFogedTriangle(view)) return cursor;
    // Affine uv interpolation is only correct per-fragment; on
    // depth-sheared triangles it warps ("swimming" textures). Split the
    // edge whose projected warp exceeds the threshold; the criterion is
    // continuous in camera motion, so nothing pops while walking.
    final subdEdge = _subdivisionEdge(textured, depth, view, wpos, halfH);
    if (subdEdge >= 0) {
      return _splitAndRecurse(
        chunk,
        cursor,
        wpos,
        crgb,
        ex,
        ey,
        ez,
        halfW,
        halfH,
        light,
        textured,
        view,
        cview,
        uvs,
        depth,
        subdEdge,
        sourceTri,
        path,
      );
    }
    if (textured) _fillTriUv(wpos, uvs);
    final tri = _clipAgainstNear(view, cview, textured ? uvs : null);
    if (tri == null) return cursor;
    if (!identical(tri, _unclippedTri)) _diagnostics.nearClips++;
    return _projectTris(
      chunk,
      cursor,
      tri,
      view,
      cview,
      uvs,
      halfW,
      halfH,
      light,
      textured,
      sourceTri,
      path,
    );
  }

  /// Splits the triangle in two along its longest world edge and
  /// recurses into [_emitWorldTri] for each half (texture detail
  /// subdivision). Binary bisection, not a 4-way split: 4-way grows as
  /// 4^depth and exploded to 60k+ triangles (45ms paints, rAF
  /// starvation) on the huge greedy-merged quads that fill the screen
  /// near the camera; bisection grows as 2^depth for the same screen
  /// precision.
  int _splitAndRecurse(
    JsVoxelChunk chunk,
    int cursor,
    Float32List wpos,
    Float32List crgb,
    double ex,
    double ey,
    double ez,
    double halfW,
    double halfH,
    double light,
    bool textured,
    Float32List view,
    Float32List cview,
    Float32List uvs,
    int depth,
    int edge,
    int sourceTri,
    int path,
  ) {
    final sub = _bisect(wpos, crgb, depth, edge);
    for (var i = 0; i < 2; i++) {
      cursor = _emitWorldTri(
        chunk,
        cursor,
        sub[i],
        sub[i + 2],
        ex,
        ey,
        ez,
        halfW,
        halfH,
        light,
        textured,
        view,
        cview,
        uvs,
        depth + 1,
        sourceTri,
        path * 2 + i,
      );
    }
    return cursor;
  }

  /// Subdivision threshold in screen pixels of perspective-uv warp.
  static const double _subdWarpPx = 4;

  /// World-space subdivision floor (blocks): one texture texel. A hard
  /// safety bound on bisection depth for the edge being split.
  static const double _subdWorldFloor = 0.0625;

  /// Decides whether (and along which edge) a textured triangle splits
  /// for perspective-faithful uv. Returns the split edge or -1.
  ///
  /// STOP criterion — per-edge warp in screen pixels:
  /// `screenLen × |Δz| / (2·(z1+z2))` (midpoint uv error in texels,
  /// `blocks × texels × Δz/(4z̄)`, times the on-screen texel size — the
  /// block/texel factors cancel). Per-EDGE, not per-triangle: a wide
  /// ground quad's long edge runs ACROSS the depth gradient (Δz≈0 →
  /// warp≈0), so only depth-aligned edges drive subdivision.
  ///
  /// SPLIT choice — the LONGEST WORLD EDGE among the warping ones, NOT
  /// the max-warp edge: the two triangles of a greedy quad see mirrored
  /// geometry and independently pick the same PHYSICAL edge, so their
  /// sub-triangulations stay mirror-symmetric and no seam opens along
  /// the quad diagonal. A view-dependent (max-warp) split choice let
  /// the halves diverge — the diagonal seam and the flashing
  /// T-junction bands at the horizon while rotating.
  int _subdivisionEdge(
    bool textured,
    int depth,
    Float32List view,
    Float32List wpos,
    double halfH,
  ) {
    if (!textured || depth >= 10) return -1;
    final f = _focal * halfH;
    var maxWarp = 0.0;
    var ei = -1;
    var bestLen = 0.0;
    for (var i = 0; i < 3; i++) {
      final j = (i + 1) % 3;
      final z1 = view[i * 3 + 2];
      final z2 = view[j * 3 + 2];
      // Vertices at/behind the near plane skip subdivision — the clip
      // produces the visible polygon and subdividing here would recurse
      // on exploded projections.
      if (z1 <= nearPlane * 2 || z2 <= nearPlane * 2) return -1;
      final ai = f / z1;
      final aj = f / z2;
      final dx = view[i * 3] * ai - view[j * 3] * aj;
      final dy = view[i * 3 + 1] * ai - view[j * 3 + 1] * aj;
      final warp =
          math.sqrt(dx * dx + dy * dy) * (z2 - z1).abs() / (2 * (z1 + z2));
      if (warp > maxWarp) maxWarp = warp;
      if (warp <= _subdWarpPx * 0.5) continue;
      final wx = wpos[j * 3] - wpos[i * 3];
      final wy = wpos[j * 3 + 1] - wpos[i * 3 + 1];
      final wz = wpos[j * 3 + 2] - wpos[i * 3 + 2];
      final lenSq = wx * wx + wy * wy + wz * wz;
      if (lenSq > bestLen) {
        bestLen = lenSq;
        ei = i;
      }
    }
    if (maxWarp <= _subdWarpPx || ei < 0) return -1;
    return bestLen < _subdWorldFloor * _subdWorldFloor ? -1 : ei;
  }

  /// Binary bisection of edge [edge] into a per-depth POOL (zero
  /// allocation in the steady state — recursion level d reads pool[d]
  /// and writes pool[d+1]). Returns 4 lists: 2 sub-triangle world
  /// positions then their 2 color sets (colors lerp linearly — exact
  /// for planar faces).
  late final List<List<Float32List>> _subPool = _workspace.subdivisionPool;
  List<Float32List> _bisect(Float32List w, Float32List c, int depth, int ei) {
    while (_subPool.length <= depth) {
      _subPool.add(List<Float32List>.generate(4, (_) => Float32List(9)));
    }
    final out = _subPool[depth];
    final i = ei, j = (ei + 1) % 3, k = (ei + 2) % 3;
    // Sub A = (i, mid, k), sub B = (mid, j, k) — same winding.
    _bisectHalf(w, out[0], i, j, k, false);
    _bisectHalf(w, out[1], i, j, k, true);
    _bisectHalf(c, out[2], i, j, k, false);
    _bisectHalf(c, out[3], i, j, k, true);
    return out;
  }

  /// Copies triangle (i, j, k) from [src] to [dst], replacing the
  /// first-half ([secondHalf] = false → j) or second-half (true → i)
  /// endpoint with the midpoint of edge i..j.
  void _bisectHalf(
    Float32List src,
    Float32List dst,
    int i,
    int j,
    int k,
    bool secondHalf,
  ) {
    for (var a = 0; a < 3; a++) {
      final mid = (src[i * 3 + a] + src[j * 3 + a]) / 2;
      dst[i * 3 + a] = secondHalf ? mid : src[i * 3 + a];
      dst[j * 3 + a] = secondHalf ? src[j * 3 + a] : mid;
      dst[k * 3 + a] = src[k * 3 + a];
    }
  }

  /// Clips-space → screen projection, culling and pool append for one
  /// (possibly clipped) polygon. Shared by direct and subdivided tris.
  int _projectTris(
    JsVoxelChunk chunk,
    int cursor,
    Uint32List tri,
    Float32List view,
    Float32List cview,
    Float32List uvs,
    double halfW,
    double halfH,
    double light,
    bool textured,
    int sourceTri,
    int path,
  ) {
    final fogStart = camera.fogStart;
    final fogSpan = camera.fogEnd - fogStart;
    final light255 = light * 255;
    for (var k = 0; k + 2 < tri.length; k += 3) {
      if (cursor >= _triPool.length) _triPool.add(_Tri());
      final t = _triPool[cursor];
      if (cursor < _tris.length) {
        _tris[cursor] = t;
      } else {
        _tris.add(t);
      }
      t.planeAxis = chunk._planeAxes[sourceTri];
      t.planeCoordinate = chunk._planeCoordinates[sourceTri];
      final p = t.pts;
      final i0 = tri[k] * 3, i1 = tri[k + 1] * 3, i2 = tri[k + 2] * 3;
      final z0 = view[i0 + 2], z1 = view[i1 + 2], z2 = view[i2 + 2];
      final iz0 = 1 / z0, iz1 = 1 / z1, iz2 = 1 / z2;
      final s0 = _focal * halfH * iz0;
      final s1 = _focal * halfH * iz1;
      final s2 = _focal * halfH * iz2;
      final x0 = halfW + view[i0] * s0, y0 = halfH - view[i0 + 1] * s0;
      final x1 = halfW + view[i1] * s1, y1 = halfH - view[i1 + 1] * s1;
      final x2 = halfW + view[i2] * s2, y2 = halfH - view[i2 + 1] * s2;
      // Backface cull + subpixel cull in one compare BEFORE computing
      // per-vertex colors/fog (~50% of tris are backfacing).
      final area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
      if (area > -0.25) {
        _diagnostics.subpixelCull++;
        continue;
      }
      p[0] = x0;
      p[1] = y0;
      p[2] = x1;
      p[3] = y1;
      p[4] = x2;
      p[5] = y2;
      for (var v = 0; v < 3; v++) {
        final j = tri[v + k] * 3;
        final vz = view[j + 2];
        if (textured) {
          final ju = tri[v + k] * 2;
          t.uvs[v * 2] = uvs[ju];
          t.uvs[v * 2 + 1] = uvs[ju + 1];
        }
        var fr = (cview[j] * light255).round().clamp(0, 255);
        var fg = (cview[j + 1] * light255).round().clamp(0, 255);
        var bl = (cview[j + 2] * light255).round().clamp(0, 255);
        if (vz > fogStart) {
          var f = (vz - fogStart) / fogSpan;
          if (f > 1) f = 1;
          fr = (fr + (_skyR - fr) * f).round();
          fg = (fg + (_skyG - fg) * f).round();
          bl = (bl + (_skyB - bl) * f).round();
        }
        t.argbs[v] = 0xFF000000 | (fr << 16) | (fg << 8) | bl;
      }
      t.depth = (z0 + z1 + z2) / 3 + (chunk.overlay ? -0.75 : 0);
      t.z0 = z0;
      t.z1 = z1;
      t.z2 = z2;
      t.iz0 = iz0;
      t.iz1 = iz1;
      t.iz2 = iz2;
      t.vertexHashes[0] = _hashVertex(p, 0);
      t.vertexHashes[1] = _hashVertex(p, 1);
      t.vertexHashes[2] = _hashVertex(p, 2);
      t.cacheId = sourceTri * 4096 + path * 2 + k ~/ 3;
      t.emission = cursor;
      t.overlay = chunk.overlay;
      if (VoxelDiagnostics.enabled)
        _diagnostics.observeTriangle(
          points: p,
          colors: t.argbs,
          origin: chunk.origin,
          area: area,
          depth: t.depth,
          emission: t.emission,
          z0: z0,
          z1: z1,
          z2: z2,
          width: halfW * 2,
          height: halfH * 2,
        );
      cursor++;
    }
    return cursor;
  }

  /// Transforms the vertex at scratch offset [o] from world (already
  /// eye-relative) to view space (right/up/forward basis).
  void _toView(Float32List view, int o) {
    final x = view[o];
    final y = view[o + 1];
    final z = view[o + 2];
    view[o] = _right[0] * x + _right[1] * y + _right[2] * z;
    view[o + 1] = _up[0] * x + _up[1] * y + _up[2] * z;
    view[o + 2] = _forward[0] * x + _forward[1] * y + _forward[2] * z;
  }

  /// Computes per-vertex texture coordinates for one triangle: the
  /// dominant world-space normal axis picks the two in-plane world
  /// coordinates, so uv units are BLOCKS (TileMode.repeated makes one
  /// repeat per block → 16 texels/block for the 16px noise tile).
  void _fillTriUv(Float32List wpos, Float32List uvs) {
    final ax = wpos[3] - wpos[0],
        ay = wpos[4] - wpos[1],
        az = wpos[5] - wpos[2];
    final bx = wpos[6] - wpos[0],
        by = wpos[7] - wpos[1],
        bz = wpos[8] - wpos[2];
    final nx = (ay * bz - az * by).abs();
    final ny = (az * bx - ax * bz).abs();
    final nz = (ax * by - ay * bx).abs();
    for (var v = 0; v < 3; v++) {
      final o = v * 3;
      if (ny >= nx && ny >= nz) {
        uvs[v * 2] = wpos[o];
        uvs[v * 2 + 1] = wpos[o + 2]; // top/bottom: x,z
      } else if (nx >= nz) {
        uvs[v * 2] = wpos[o + 2];
        uvs[v * 2 + 1] = wpos[o + 1]; // sides: z,y
      } else {
        uvs[v * 2] = wpos[o];
        uvs[v * 2 + 1] = wpos[o + 1]; // front: x,y
      }
    }
  }

  /// Procedural 16x16 grayscale noise tile (deterministic LCG, values
  /// 212..255) — multiplied over vertex colors it reads as pixelated
  /// block texture without shipping a single asset.
  static ui.Image? _noiseTex;
  static bool _noiseTexStarted = false;
  static ui.Image? _noiseTexture() {
    if (_noiseTex == null && !_noiseTexStarted) {
      _noiseTexStarted = true;
      const n = 16;
      final rgba = Uint8List(n * n * 4);
      var h = 0x2b992eb;
      for (var i = 0; i < n * n; i++) {
        h = (h * 1664525 + 1013904223) & 0x3fffffff;
        final v = 212 + h % 44;
        rgba[i * 4] = v;
        rgba[i * 4 + 1] = v;
        rgba[i * 4 + 2] = v;
        rgba[i * 4 + 3] = 255;
      }
      ui.decodeImageFromPixels(
        rgba,
        n,
        n,
        ui.PixelFormat.rgba8888,
        (img) => _noiseTex = img,
      );
    }
    return _noiseTex;
  }

  /// Sutherland–Hodgman clip of the triangle in view scratch slots 0..8
  /// (3 verts) against the near plane. Clipped intersection verts are
  /// written to scratch slots 9..17 and addressed as vertex indices 3..5;
  /// [cview] carries per-slot rgb and is lerped along clipped edges.
  /// Returns the fan-triangulated vertex indices, or null when fully
  /// culled. Uint32List, not Int64List — Int64List is unsupported on web
  /// (dart2js throws) and the voxel pipeline must render there too.
  static final Uint32List _unclippedTri = Uint32List.fromList([0, 1, 2]);

  Uint32List? _clipAgainstNear(
    Float32List view,
    Float32List cview,
    Float32List? uvs,
  ) {
    const near = nearPlane;
    final d0 = view[2] - near;
    final d1 = view[5] - near;
    final d2 = view[8] - near;
    if (d0 <= 0 && d1 <= 0 && d2 <= 0) return null;
    if (d0 > 0 && d1 > 0 && d2 > 0) return _unclippedTri;

    final pd = [d0, d1, d2];
    final emitted = <int>[];
    for (var i = 0; i < 3; i++) {
      final j = (i + 1) % 3;
      if (pd[i] > 0) emitted.add(i);
      if ((pd[i] > 0) != (pd[j] > 0)) {
        _lerpIntersection(view, cview, uvs, i, j, pd[i] / (pd[i] - pd[j]));
        emitted.add(3 + i);
      }
    }
    if (emitted.length < 3) return null;

    final polys = <int>[];
    for (var k = 1; k + 1 < emitted.length; k++) {
      polys
        ..add(emitted[0])
        ..add(emitted[k])
        ..add(emitted[k + 1]);
    }
    return Uint32List.fromList(polys);
  }

  /// Edge/plane intersection for slot i..j written to slot 3+i: position,
  /// color, and uv all lerp with the same parameter t.
  void _lerpIntersection(
    Float32List view,
    Float32List cview,
    Float32List? uvs,
    int i,
    int j,
    double t,
  ) {
    final o = i * 3;
    final p = j * 3;
    final d = 9 + i * 3;
    for (var c = 0; c < 3; c++) {
      view[d + c] = view[o + c] + (view[p + c] - view[o + c]) * t;
      cview[d + c] = cview[o + c] + (cview[p + c] - cview[o + c]) * t;
    }
    if (uvs != null) {
      final uo = i * 2, up = j * 2, ud = 6 + i * 2;
      uvs[ud] = uvs[uo] + (uvs[up] - uvs[uo]) * t;
      uvs[ud + 1] = uvs[uo + 1] + (uvs[up + 1] - uvs[uo + 1]) * t;
    }
  }
}
