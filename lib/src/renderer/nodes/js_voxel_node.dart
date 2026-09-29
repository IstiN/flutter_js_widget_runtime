import 'dart:math' as math;
import 'dart:typed_data';

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
    Color? skyColor,
  }) : position = Float32List.fromList(position),
       skyColor = skyColor ?? const Color(0xFF87CEEB);

  factory JsVoxelCamera.fromDynamic(Map<String, dynamic> args) {
    final cam = JsVoxelCamera();
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

/// One painter-sorted triangle: view-space depth plus screen-space points
/// and fill color. Pooled — the paint loop reuses [VoxelPainter._tris]
/// instead of allocating per frame.
class _Tri {
  final points = List<Offset>.filled(3, Offset.zero);
  double depth = 0;
  Color color = const Color(0xFF90CAF9);
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
    chunks = world.chunksOf(id);
    if (chunks.isEmpty) return;
    camera = world.cameraOf(id);
    final sky = camera.skyColor;
    canvas.drawRect(Offset.zero & size, Paint()..color = sky);

    // Basis from yaw/pitch (Minecraft convention, matches consumers).
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

    // Painter's algorithm: far → near.
    _tris.length = cursor;
    _tris.sort((a, b) => b.depth.compareTo(a.depth));
    final paint = Paint()..isAntiAlias = false;
    for (var i = 0; i < cursor; i++) {
      final t = _tris[i];
      final path = Path()
        ..moveTo(t.points[0].dx, t.points[0].dy)
        ..lineTo(t.points[1].dx, t.points[1].dy)
        ..lineTo(t.points[2].dx, t.points[2].dy)
        ..close();
      paint.color = t.color;
      canvas.drawPath(path, paint);
    }
  }

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

    // View-space scratch: 3 input verts (0..8) + up to 3 clipped
    // intersection verts (9..17).
    final view = Float32List(18);
    for (var f = 0; f + 2 < indices.length; f += 3) {
      for (var v = 0; v < 3; v++) {
        final p = indices[f + v] * 3;
        view[v * 3] = pos[p] + ox;
        view[v * 3 + 1] = pos[p + 1] + oy;
        view[v * 3 + 2] = pos[p + 2] + oz;
        _toView(view, v * 3);
      }
      final tri = _clipAgainstNear(view);
      if (tri == null) continue;

      for (var k = 0; k + 2 < tri.length; k += 3) {
        if (cursor >= _tris.length) _tris.add(_Tri());
        final t = _tris[cursor];
        var depth = 0.0;
        double ax = 0, ay = 0, bx = 0, by = 0;
        for (var v = 0; v < 3; v++) {
          final j = tri[v + k] * 3;
          final vz = view[j + 2];
          final invZ = _focal / vz;
          final sx = halfW + view[j] * invZ * halfH;
          final sy = halfH - view[j + 1] * invZ * halfH;
          t.points[v] = Offset(sx, sy);
          depth += vz;
          switch (v) {
            case 0:
              ax = sx;
              ay = sy;
            case 1:
              bx = sx;
              by = sy;
          }
        }
        depth /= 3;
        // Backface cull: faces wound CCW from outside project with
        // negative screen-space signed area (screen y is flipped).
        final area = (bx - ax) * (t.points[2].dy - ay) -
            (t.points[2].dx - ax) * (by - ay);
        if (area >= 0) continue;
        t.depth = depth;
        final ci = indices[f] * 3;
        t.color = Color.fromARGB(
          255,
          (col[ci] * light * 255).round().clamp(0, 255),
          (col[ci + 1] * light * 255).round().clamp(0, 255),
          (col[ci + 2] * light * 255).round().clamp(0, 255),
        );
        cursor++;
      }
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

  /// Sutherland–Hodgman clip of the triangle in view scratch slots 0..8
  /// (3 verts) against the near plane. Clipped intersection verts are
  /// written to scratch slots 9..17 and addressed as vertex indices 3..5.
  /// Returns the fan-triangulated vertex indices, or null when fully
  /// culled.
  Int64List? _clipAgainstNear(Float32List view) {
    const near = nearPlane;
    final d0 = view[2] - near;
    final d1 = view[5] - near;
    final d2 = view[8] - near;
    if (d0 <= 0 && d1 <= 0 && d2 <= 0) return null;
    if (d0 > 0 && d1 > 0 && d2 > 0) return Int64List.fromList([0, 1, 2]);

    final pd = [d0, d1, d2];
    final emitted = <int>[];
    for (var i = 0; i < 3; i++) {
      final j = (i + 1) % 3;
      if (pd[i] > 0) emitted.add(i);
      if ((pd[i] > 0) != (pd[j] > 0)) {
        final t = pd[i] / (pd[i] - pd[j]);
        final o = i * 3;
        final p = j * 3;
        view[9 + i * 3] = view[o] + (view[p] - view[o]) * t;
        view[10 + i * 3] = view[o + 1] + (view[p + 1] - view[o + 1]) * t;
        view[11 + i * 3] = view[o + 2] + (view[p + 2] - view[o + 2]) * t;
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
    return Int64List.fromList(polys);
  }
}
