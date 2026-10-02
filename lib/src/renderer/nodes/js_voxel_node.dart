import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

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
       aabbMax = _boundsMax(positions);

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

  /// Handles a `voxel.*` hostCall. Returns the value to resolve the JS
  /// promise with; throws for unknown capability names (the bridge turns
  /// that into a rejected promise).
  ///
  /// Contract:
  /// - `voxel.attach {id}` → `{ok: true}`. Rejects only when the runtime
  ///   has no voxel support at all (older jsr versions reject every
  ///   unknown hostCall name) — widgets use that to degrade gracefully.
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
        return const {'ok': true};
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
        if (removed) notifyListeners();
        return {'ok': true, 'removed': removed};
      default:
        throw UnsupportedError('unknown voxel capability: $name');
    }
  }

  /// Chunks uploaded for [id] (empty when the widget never attached).
  Map<String, JsVoxelChunk> chunksOf(String id) =>
      _chunksByInstance[id] ?? const {};

  /// The last camera pushed for [id], or the default viewpoint.
  JsVoxelCamera cameraOf(String id) =>
      _cameras[id] ?? JsVoxelCamera();

  /// Drops all state (host resets, tests).
  void clear() {
    _chunksByInstance.clear();
    _cameras.clear();
    notifyListeners();
  }

  String _instanceId(Map<String, dynamic> args) =>
      args['id']?.toString() ?? '';
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
      scene = SizedBox(width: config.width, height: config.height, child: scene);
    } else {
      scene = SizedBox.expand(child: scene);
    }
    return scene;
  }
}

/// One painter-sorted triangle: view-space depth, packed sort key, screen
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
  double depth = 0;
  double sortKey = 0;
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
  VoxelPainter({required this.world, required this.id})
    : super(repaint: world);

  final JsVoxelWorld world;
  final String id;

  late JsVoxelCamera camera;
  Map<String, JsVoxelChunk> chunks = const {};

  final List<_Tri> _tris = [];

  // Camera basis, recomputed in paint().
  late Float32List _right;
  late Float32List _up;
  late Float32List _forward;
  late double _focal;

  static const double nearPlane = 0.05;

  @override
  bool shouldRepaint(VoxelPainter oldDelegate) => false;

  @override
  void paint(Canvas canvas, Size size) {
    // Rolling paint-cost stats, logged every 300 paints — on web these land
    // in the browser console, giving field reports ("fps dips while
    // walking") their Dart-side counterpart next to the widget's own
    // [facraft] JS-side numbers.
    final sw = Stopwatch()..start();
    _paintBody(canvas, size);
    sw.stop();
    _paintCount++;
    _paintUs += sw.elapsedMicroseconds;
    _paintTris += _lastTriCount;
    if (_paintCount >= 300) {
      debugPrint(
        '[voxel] paint=${(_paintUs / _paintCount / 1000).toStringAsFixed(1)}ms '
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

  void _paintBody(Canvas canvas, Size size) {
    chunks = world.chunksOf(id);
    if (chunks.isEmpty) return;
    camera = world.cameraOf(id);
    canvas.drawRect(Offset.zero & size, Paint()..color = camera.skyColor);
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
    for (final chunk in chunks.values) {
      if (_chunkOutsideFrustum(chunk, ex, ey, ez, planes)) continue;
      cursor = _collectChunk(
        chunk, cursor, ex, ey, ez, halfW, halfH,
      );
    }
    if (cursor == 0) return;
    _lastTriCount = cursor;
    _sortAndDraw(canvas, cursor);
  }

  /// Recomputes the camera basis (right/up/forward + focal) from the
  /// camera's yaw/pitch/fov. Minecraft yaw/pitch convention, matching the
  /// widgets that push [JsVoxelCamera] payloads.
  void _buildCameraBasis() {
    final cp = math.cos(camera.pitch);
    final fx = -math.sin(camera.yaw) * cp;
    final fy = math.sin(camera.pitch);
    final fz = -math.cos(camera.yaw) * cp;
    _forward = Float32List.fromList([fx, fy, fz]);
    var rx = fy * 0 - fz * 1;
    var ry = fz * 0 - fx * 0;
    var rz = fx * 1 - fy * 0;
    // right = normalize(cross(forward, worldUp)); degenerate at pitch ±90°.
    var rl = math.sqrt(rx * rx + ry * ry + rz * rz);
    if (rl < 1e-6) {
      rx = 1;
      ry = 0;
      rz = 0;
      rl = 1;
    }
    _right = Float32List.fromList([rx / rl, ry / rl, rz / rl]);
    _up = Float32List.fromList([
      _right[1] * fz - _right[2] * fy,
      _right[2] * fx - _right[0] * fz,
      _right[0] * fy - _right[1] * fx,
    ]);
    _focal = 1 / math.tan((camera.fov * math.pi / 180) / 2);
  }

  /// Painter's algorithm, bucketed: one arithmetic-packed sort key per
  /// triangle — (inverted depth bucket) * 2^20 + insertion index — so a
  /// single ascending sort yields far→near buckets AND a stable
  /// chunk-upload order inside each bucket. The insertion tiebreak is what
  /// keeps a widget's late-uploaded overlay chunk (fa-craft's '__hl' aim
  /// marker) on top of the coplanar block face instead of z-fighting —
  /// bucket granularity (~1/1024 of the view depth) is far coarser than
  /// the marker's 0.02-block offset. Drawing is ONE drawVertices call with
  /// per-vertex colors (modulated over a white paint): no per-color-run
  /// Path batching, and vertex colors interpolate across triangles —
  /// merged greedy-mesh quads get smooth per-block tonal gradients.
  /// The key is packed arithmetically, not bitwise — dart2js bitwise ops
  /// are 32-bit and would shred the high bits.
  void _sortAndDraw(Canvas canvas, int cursor) {
    _tris.length = cursor;
    var dMin = double.infinity;
    var dMax = double.negativeInfinity;
    for (var i = 0; i < cursor; i++) {
      final d = _tris[i].depth;
      if (d < dMin) dMin = d;
      if (d > dMax) dMax = d;
    }
    final span = dMax - dMin < 1e-6 ? 1e-6 : dMax - dMin;
    const buckets = 1024;
    for (var i = 0; i < cursor; i++) {
      final t = _tris[i];
      final b =
          ((t.depth - dMin) / span * (buckets - 1)).floor().clamp(0, 1023);
      t.sortKey = (buckets - 1 - b) * 1048576.0 + i;
    }
    _tris.sort((a, b) => a.sortKey.compareTo(b.sortKey));
    final vCount = cursor * 3;
    final textured = camera.texture;
    _bufferPage = 1 - _bufferPage;
    var pos = _vertPositions[_bufferPage];
    var cols = _vertColors[_bufferPage];
    var uvs = _vertUvs[_bufferPage];
    if (pos.length < vCount * 2) {
      pos = _vertPositions[_bufferPage] = Float32List(vCount * 2);
      cols = _vertColors[_bufferPage] = Int32List(vCount);
      uvs = _vertUvs[_bufferPage] = Float32List(vCount * 2);
    }
    for (var i = 0; i < cursor; i++) {
      final t = _tris[i];
      final o = i * 6;
      pos[o] = t.pts[0];
      pos[o + 1] = t.pts[1];
      pos[o + 2] = t.pts[2];
      pos[o + 3] = t.pts[3];
      pos[o + 4] = t.pts[4];
      pos[o + 5] = t.pts[5];
      final c = i * 3;
      cols[c] = t.argbs[0];
      cols[c + 1] = t.argbs[1];
      cols[c + 2] = t.argbs[2];
      if (textured) {
        uvs[o] = t.uvs[0];
        uvs[o + 1] = t.uvs[1];
        uvs[o + 2] = t.uvs[2];
        uvs[o + 3] = t.uvs[3];
        uvs[o + 4] = t.uvs[4];
        uvs[o + 5] = t.uvs[5];
      }
    }
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
    final vertices = ui.Vertices.raw(
      ui.VertexMode.triangles,
      Float32List.sublistView(pos, 0, vCount * 2),
      textureCoordinates: uvView,
      colors: Int32List.sublistView(cols, 0, vCount),
    );
    canvas.drawVertices(vertices, BlendMode.modulate, paint);
  }

  // Double-buffered draw arrays: a recorded picture may rasterize AFTER the
  // next paint() has run (async raster, routine under fast swipes), so the
  // buffers the previous frame's Vertices points at must stay untouched for
  // one full frame. Alternating two sets guarantees that.
  final List<Float32List> _vertPositions = [Float32List(0), Float32List(0)];
  final List<Int32List> _vertColors = [Int32List(0), Int32List(0)];
  final List<Float32List> _vertUvs = [Float32List(0), Float32List(0)];
  int _bufferPage = 0;

  /// View-frustum planes in world space: each normal points INTO the
  /// visible volume (chunks behind the plane are outside), planes pass
  /// through the eye.
  List<(Float32List, double)> _frustumPlanes(
    double tanHalf,
    double aspect,
  ) {
    final f = _forward;
    final r = _right;
    final u = _up;
    final tanX = tanHalf * aspect;
    (Float32List, double) side(Float32List axis, double t) {
      final n = Float32List(3);
      for (var i = 0; i < 3; i++) {
        n[i] = f[i] + axis[i] * t;
      }
      final l = math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
      for (var i = 0; i < 3; i++) {
        n[i] /= l;
      }
      return (n, 0); // plane through the eye: dot(n, p - eye) = 0
    }

    return [
      side(r, -tanX), // left
      side(r, tanX), // right
      side(u, -tanHalf), // bottom
      side(u, tanHalf), // top
    ];
  }

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
      final radius =
          (n[0].abs() * hx + n[1].abs() * hy + n[2].abs() * hz);
      if (dist < -radius) return true;
    }
    // Near plane: behind the eye when the closest face is beyond it.
    final nearDist =
        _forward[0] * cx + _forward[1] * cy + _forward[2] * cz;
    final nearRadius =
        _forward[0].abs() * hx + _forward[1].abs() * hy + _forward[2].abs() * hz;
    return nearDist < -nearRadius - nearPlane;
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
    final view = Float32List(18);
    final cview = Float32List(18);
    final uvs = Float32List(12);
    final wpos = Float32List(9);
    final crgb = Float32List(9);
    for (var f = 0; f + 2 < indices.length; f += 3) {
      for (var v = 0; v < 3; v++) {
        final p = indices[f + v] * 3;
        wpos[v * 3] = pos[p] + ox + ex;
        wpos[v * 3 + 1] = pos[p + 1] + oy + ey;
        wpos[v * 3 + 2] = pos[p + 2] + oz + ez;
        crgb[v * 3] = col[p];
        crgb[v * 3 + 1] = col[p + 1];
        crgb[v * 3 + 2] = col[p + 2];
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
      );
    }
    return cursor;
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
  ) {
    // Affine uv interpolation is only correct per-fragment; on huge
    // greedy-merged triangles it shears ("swimming" textures). Splitting
    // big triangles down to ~4-block edges makes the error invisible.
    if (textured && depth < 4 && _maxEdgeSq(wpos) > 16) {
      final sub = _subdivide(wpos, crgb);
      for (var i = 0; i < 4; i++) {
        cursor = _emitWorldTri(
          chunk,
          cursor,
          sub[i],
          sub[i + 4],
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
        );
      }
      return cursor;
    }
    for (var v = 0; v < 3; v++) {
      view[v * 3] = wpos[v * 3] - ex;
      view[v * 3 + 1] = wpos[v * 3 + 1] - ey;
      view[v * 3 + 2] = wpos[v * 3 + 2] - ez;
      _toView(view, v * 3);
      cview[v * 3] = crgb[v * 3];
      cview[v * 3 + 1] = crgb[v * 3 + 1];
      cview[v * 3 + 2] = crgb[v * 3 + 2];
    }
    if (textured) _fillTriUv(wpos, uvs);
    final tri = _clipAgainstNear(view, cview, textured ? uvs : null);
    if (tri == null) return cursor;
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
    );
  }

  /// Longest world-space edge of the triangle, squared.
  double _maxEdgeSq(Float32List w) {
    var m = 0.0;
    for (var i = 0; i < 3; i++) {
      final j = (i + 1) % 3;
      final dx = w[j * 3] - w[i * 3];
      final dy = w[j * 3 + 1] - w[i * 3 + 1];
      final dz = w[j * 3 + 2] - w[i * 3 + 2];
      final d = dx * dx + dy * dy + dz * dz;
      if (d > m) m = d;
    }
    return m;
  }

  /// 4-way midpoint split. Returns 8 lists: 4 sub-triangle world
  /// positions then their 4 color sets (colors lerp linearly — exact
  /// for the planar quads the mesher emits).
  List<Float32List> _subdivide(Float32List w, Float32List c) {
    Float32List mid(Float32List s, int a, int b) => Float32List.fromList(
        [(s[a] + s[b]) / 2, (s[a + 1] + s[b + 1]) / 2, (s[a + 2] + s[b + 2]) / 2]);
    Float32List vert(Float32List s, int o) =>
        Float32List.fromList([s[o], s[o + 1], s[o + 2]]);
    Float32List triOf(List<Float32List> pts) => Float32List.fromList([
          pts[0][0], pts[0][1], pts[0][2],
          pts[1][0], pts[1][1], pts[1][2],
          pts[2][0], pts[2][1], pts[2][2],
        ]);
    final wv = [vert(w, 0), vert(w, 3), vert(w, 6)];
    final cv = [vert(c, 0), vert(c, 3), vert(c, 6)];
    final wm = [mid(w, 0, 3), mid(w, 3, 6), mid(w, 6, 0)];
    final cm = [mid(c, 0, 3), mid(c, 3, 6), mid(c, 6, 0)];
    return [
      triOf([wv[0], wm[0], wm[2]]),
      triOf([wm[0], wv[1], wm[1]]),
      triOf([wm[2], wm[1], wv[2]]),
      triOf([wm[0], wm[1], wm[2]]),
      triOf([cv[0], cm[0], cm[2]]),
      triOf([cm[0], cv[1], cm[1]]),
      triOf([cm[2], cm[1], cv[2]]),
      triOf([cm[0], cm[1], cm[2]]),
    ];
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
  ) {
    for (var k = 0; k + 2 < tri.length; k += 3) {
      if (cursor >= _tris.length) _tris.add(_Tri());
      final t = _tris[cursor];
      final p = t.pts;
      var depth = 0.0;
      for (var v = 0; v < 3; v++) {
        final j = tri[v + k] * 3;
        final vz = view[j + 2];
        final invZ = _focal / vz;
        p[v * 2] = halfW + view[j] * invZ * halfH;
        p[v * 2 + 1] = halfH - view[j + 1] * invZ * halfH;
        if (textured) {
          final ju = tri[v + k] * 2;
          t.uvs[v * 2] = uvs[ju];
          t.uvs[v * 2 + 1] = uvs[ju + 1];
        }
        depth += vz;
        final r = (cview[j] * light * 255).round().clamp(0, 255);
        final g = (cview[j + 1] * light * 255).round().clamp(0, 255);
        final bl = (cview[j + 2] * light * 255).round().clamp(0, 255);
        t.argbs[v] = 0xFF000000 | (r << 16) | (g << 8) | bl;
      }
      depth /= 3;
      // Backface cull + subpixel cull in one compare: faces wound CCW
      // from outside project with negative screen-space signed area
      // (screen y is flipped), and a triangle covering under ~1/8 px²
      // is invisible anyway (dense far terrain is mostly subpixel).
      final area = (p[2] - p[0]) * (p[5] - p[1]) -
          (p[4] - p[0]) * (p[3] - p[1]);
      if (area > -0.25) continue;
      _expand(p);
      // Overlay chunks (aim markers) hug coplanar block faces well inside
      // a depth bucket — bias them toward the camera so they always win
      // the painter's sort instead of patch-interleaving by centroid.
      t.depth = depth + (chunk.overlay ? -0.75 : 0);
      cursor++;
    }
    return cursor;
  }

  /// Conservative-raster crack fill: greedily merged rectangles meet at
  /// T-junctions whose endpoints do not coincide, and the rasterizer
  /// leaves hairline gaps there that leak the sky color. Growing each
  /// triangle ~3/4 px outward from its centroid covers the seams —
  /// coplanar neighbors overlap invisibly (stable painter order, same
  /// colors).
  void _expand(Float32List p) {
    final cx = (p[0] + p[2] + p[4]) / 3;
    final cy = (p[1] + p[3] + p[5]) / 3;
    for (var v = 0; v < 3; v++) {
      final dx = p[v * 2] - cx;
      final dy = p[v * 2 + 1] - cy;
      final len = math.sqrt(dx * dx + dy * dy);
      if (len < 1e-3) continue;
      p[v * 2] += dx / len * 0.75;
      p[v * 2 + 1] += dy / len * 0.75;
    }
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
    final ax = wpos[3] - wpos[0], ay = wpos[4] - wpos[1], az = wpos[5] - wpos[2];
    final bx = wpos[6] - wpos[0], by = wpos[7] - wpos[1], bz = wpos[8] - wpos[2];
    final nx = (ay * bz - az * by).abs();
    final ny = (az * bx - ax * bz).abs();
    final nz = (ax * by - ay * bx).abs();
    for (var v = 0; v < 3; v++) {
      final o = v * 3;
      if (ny >= nx && ny >= nz) {
        uvs[v * 2] = wpos[o]; uvs[v * 2 + 1] = wpos[o + 2]; // top/bottom: x,z
      } else if (nx >= nz) {
        uvs[v * 2] = wpos[o + 2]; uvs[v * 2 + 1] = wpos[o + 1]; // sides: z,y
      } else {
        uvs[v * 2] = wpos[o]; uvs[v * 2 + 1] = wpos[o + 1]; // front: x,y
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
    if (d0 > 0 && d1 > 0 && d2 > 0) return Uint32List.fromList([0, 1, 2]);

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
