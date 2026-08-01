import 'dart:math' as math;

import 'package:flutter/material.dart';

/// A parsed 3D mesh: vertices in model space, triangle faces as index
/// triples into [vertices], and a flat base [color].
class Scene3dMesh {
  const Scene3dMesh({
    required this.vertices,
    required this.faces,
    required this.color,
  });

  final List<List<double>> vertices;
  final List<List<int>> faces;
  final Color color;
}

/// Camera specification for the software 3D pipeline.
class Scene3dCamera {
  const Scene3dCamera({
    this.position = const [0, 0, 3.2],
    this.target = const [0, 0, 0],
    this.fov = 60,
  });

  final List<double> position;
  final List<double> target;

  /// Vertical field of view in degrees.
  final double fov;
}

/// Fully parsed configuration of a software-rendered `scene3d` node.
class Scene3dConfig {
  const Scene3dConfig({
    required this.meshes,
    required this.camera,
    required this.rotation,
    required this.lightDirection,
    this.background,
  });

  final List<Scene3dMesh> meshes;
  final Scene3dCamera camera;

  /// Static Euler rotation in degrees applied to every vertex (model
  /// transform). JS animates by re-rendering with new values on a
  /// raf/timer tick.
  final List<double> rotation;

  /// Direction the light travels, used for flat (Lambert) shading.
  final List<double> lightDirection;
  final Color? background;
}

List<double> _vec3(dynamic value, List<double> fallback) {
  if (value is List && value.length >= 3) {
    final x = value[0];
    final y = value[1];
    final z = value[2];
    if (x is num && y is num && z is num) {
      return [x.toDouble(), y.toDouble(), z.toDouble()];
    }
  }
  return List<double>.from(fallback);
}

Color? _parseColor(dynamic value) {
  if (value is! String) return null;
  var hex = value.trim();
  if (hex.startsWith('#')) hex = hex.substring(1);
  if (hex.length == 6) hex = 'FF$hex';
  if (hex.length != 8) return null;
  final v = int.tryParse(hex, radix: 16);
  return v == null ? null : Color(v);
}

List<double>? _parseVertex(dynamic v) {
  if (v is! List || v.length < 3) return null;
  final x = v[0];
  final y = v[1];
  final z = v[2];
  if (x is num && y is num && z is num) {
    return [x.toDouble(), y.toDouble(), z.toDouble()];
  }
  return null;
}

List<List<double>> _parseVertices(dynamic raw) {
  final vertices = <List<double>>[];
  if (raw is! List) return vertices;
  for (final v in raw) {
    final vertex = _parseVertex(v);
    if (vertex != null) vertices.add(vertex);
  }
  return vertices;
}

List<int>? _parseFace(dynamic f, int vertexCount) {
  if (f is! List || f.length < 3) return null;
  final i = f[0];
  final j = f[1];
  final k = f[2];
  if (i is! num || j is! num || k is! num) return null;
  final face = [i.toInt(), j.toInt(), k.toInt()];
  if (!face.every((idx) => idx >= 0 && idx < vertexCount)) return null;
  return face;
}

List<List<int>> _parseFaces(dynamic raw, int vertexCount) {
  final faces = <List<int>>[];
  if (raw is! List) return faces;
  for (final f in raw) {
    final face = _parseFace(f, vertexCount);
    if (face != null) faces.add(face);
  }
  return faces;
}

Scene3dMesh? _parseMesh(dynamic raw) {
  if (raw is! Map) return null;
  final vertices = _parseVertices(raw['vertices']);
  final faces = _parseFaces(raw['faces'], vertices.length);
  if (vertices.isEmpty || faces.isEmpty) return null;
  return Scene3dMesh(
    vertices: vertices,
    faces: faces,
    color: _parseColor(raw['color']) ?? const Color(0xFF90CAF9),
  );
}

List<Scene3dMesh> _parseMeshes(dynamic raw) {
  final meshes = <Scene3dMesh>[];
  if (raw is! List) return meshes;
  for (final entry in raw) {
    final mesh = _parseMesh(entry);
    if (mesh != null) meshes.add(mesh);
  }
  return meshes;
}

Scene3dCamera _parseCamera(dynamic raw) {
  const fallback = Scene3dCamera();
  if (raw is! Map) return fallback;
  return Scene3dCamera(
    position: _vec3(raw['position'], fallback.position),
    target: _vec3(raw['target'], fallback.target),
    fov: (raw['fov'] is num)
        ? (raw['fov'] as num).toDouble().clamp(10, 150)
        : fallback.fov,
  );
}

List<double> _parseEuler(dynamic raw, List<double> fallback) {
  if (raw is Map) {
    return [
      (raw['x'] is num) ? (raw['x'] as num).toDouble() : 0.0,
      (raw['y'] is num) ? (raw['y'] as num).toDouble() : 0.0,
      (raw['z'] is num) ? (raw['z'] as num).toDouble() : 0.0,
    ];
  }
  if (raw is List) return _vec3(raw, fallback);
  return fallback;
}

/// Parses the raw node map into a [Scene3dConfig]. Tolerates garbage:
/// malformed meshes, vertices and faces are skipped individually.
Scene3dConfig parseScene3dConfig(Map<String, dynamic> config) {
  const defaultLight = [-0.4, -0.8, -0.6];
  final lightDirection = config['light'] is Map
      ? _vec3((config['light'] as Map)['direction'], defaultLight)
      : _vec3(config['light'], defaultLight);
  return Scene3dConfig(
    meshes: _parseMeshes(config['meshes']),
    camera: _parseCamera(config['camera']),
    rotation: _parseEuler(config['rotation'], const [0.0, 0.0, 0.0]),
    lightDirection: lightDirection,
    background: _parseColor(config['background'] ?? config['backgroundColor']),
  );
}

/// Perspective projector: model space → rotation → view space → screen.
///
/// Pure Dart and allocation-light; exposed so tests can assert on
/// projections without pumping widgets.
class Scene3dProjector {
  Scene3dProjector({required this.camera, this.rotation = const [0, 0, 0]}) {
    final fwd = _normalize([
      camera.target[0] - camera.position[0],
      camera.target[1] - camera.position[1],
      camera.target[2] - camera.position[2],
    ]);
    var right = _cross(fwd, const [0, 1, 0]);
    if (_length(right) < 1e-9) {
      // Looking straight up/down: pick an arbitrary right vector.
      right = _cross(fwd, const [1, 0, 0]);
    }
    _right = _normalize(right);
    _up = _cross(_right, fwd);
    _forward = fwd;
    _focal = 1 / math.tan((camera.fov * math.pi / 180) / 2);

    final rx = rotation[0] * math.pi / 180;
    final ry = rotation[1] * math.pi / 180;
    final rz = rotation[2] * math.pi / 180;
    _sinX = math.sin(rx);
    _cosX = math.cos(rx);
    _sinY = math.sin(ry);
    _cosY = math.cos(ry);
    _sinZ = math.sin(rz);
    _cosZ = math.cos(rz);
  }

  final Scene3dCamera camera;
  final List<double> rotation;

  late final List<double> _right;
  late final List<double> _up;
  late final List<double> _forward;
  late final double _focal;
  late final double _sinX, _cosX, _sinY, _cosY, _sinZ, _cosZ;

  static const double nearPlane = 0.05;

  static List<double> _cross(List<double> a, List<double> b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];

  static double _length(List<double> v) =>
      math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

  static List<double> _normalize(List<double> v) {
    final len = _length(v);
    if (len < 1e-12) return [0, 0, 1];
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  /// Applies the static Euler rotation (X then Y then Z, degrees).
  List<double> rotate(double x, double y, double z) {
    // Rx
    var y1 = y * _cosX - z * _sinX;
    var z1 = y * _sinX + z * _cosX;
    var x1 = x;
    // Ry
    final x2 = x1 * _cosY + z1 * _sinY;
    final z2 = -x1 * _sinY + z1 * _cosY;
    final y2 = y1;
    // Rz
    final x3 = x2 * _cosZ - y2 * _sinZ;
    final y3 = x2 * _sinZ + y2 * _cosZ;
    x1 = x3;
    y1 = y3;
    z1 = z2;
    return [x1, y1, z1];
  }

  /// Projects a model-space point. Returns the screen offset and view-space
  /// depth (larger = farther), or `null` when the point is at/behind the
  /// near plane.
  (Offset, double)? project(double x, double y, double z, Size size) {
    final r = rotate(x, y, z);
    final px = r[0] - camera.position[0];
    final py = r[1] - camera.position[1];
    final pz = r[2] - camera.position[2];
    final vx = px * _right[0] + py * _right[1] + pz * _right[2];
    final vy = px * _up[0] + py * _up[1] + pz * _up[2];
    final vz = px * _forward[0] + py * _forward[1] + pz * _forward[2];
    if (vz <= nearPlane) return null;
    final halfH = size.height / 2;
    final sx = size.width / 2 + (_focal * vx / vz) * halfH;
    final sy = halfH - (_focal * vy / vz) * halfH;
    return (Offset(sx, sy), vz);
  }
}

/// Renders a `scene3d` node with a `meshes` prop using a tiny software
/// pipeline on [CustomPaint]: perspective-projected triangles, painter's
/// z-sort, flat Lambert shading. Pure Dart — no native dependencies.
///
/// JSON shape:
///
/// ```json
/// {
///   "type": "scene3d",
///   "width": 300,
///   "height": 300,
///   "meshes": [
///     {
///       "vertices": [[-0.5, -0.5, -0.5], ...],
///       "faces": [[0, 1, 2], ...],
///       "color": "#4fc3f7"
///     }
///   ],
///   "camera": {"position": [0, 0, 3.2], "target": [0, 0, 0], "fov": 60},
///   "rotation": {"x": 20, "y": 30, "z": 0},
///   "light": {"direction": [-0.4, -0.8, -0.6]},
///   "onTap": "scene-tapped"
/// }
/// ```
class JsScene3dMeshNode extends StatelessWidget {
  const JsScene3dMeshNode({required this.node, this.onEvent, super.key});

  final Map<String, dynamic> node;
  final void Function(String actionId, Map<String, dynamic> payload)? onEvent;

  @override
  Widget build(BuildContext context) {
    final config = parseScene3dConfig(node);
    final width = _dim(node['width']);
    final height = _dim(node['height']);

    Widget scene = CustomPaint(
      painter: Scene3dMeshPainter(config),
      child: const SizedBox.expand(),
    );
    if (width != null || height != null) {
      scene = SizedBox(width: width, height: height, child: scene);
    } else {
      scene = AspectRatio(aspectRatio: 1, child: scene);
    }

    final tap = node['onTap'];
    if (tap is String && tap.isNotEmpty) {
      scene = GestureDetector(
        onTapUp: (d) => onEvent?.call(tap, {
          'x': d.localPosition.dx,
          'y': d.localPosition.dy,
        }),
        child: scene,
      );
    }
    return scene;
  }

  static double? _dim(dynamic value) {
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }
}

/// [CustomPainter] backing [JsScene3dMeshNode]. Exposed for tests.
class Scene3dMeshPainter extends CustomPainter {
  Scene3dMeshPainter(this.config);

  final Scene3dConfig config;

  @override
  void paint(Canvas canvas, Size size) {
    final bg = config.background;
    if (bg != null) {
      canvas.drawRect(Offset.zero & size, Paint()..color = bg);
    }

    final projector = Scene3dProjector(
      camera: config.camera,
      rotation: config.rotation,
    );
    final light = Scene3dProjector._normalize(config.lightDirection);

    // Collect projected faces across all meshes for a global painter's sort.
    final projected = <_ProjectedFace>[];
    for (final mesh in config.meshes) {
      for (final face in mesh.faces) {
        final a = mesh.vertices[face[0]];
        final b = mesh.vertices[face[1]];
        final c = mesh.vertices[face[2]];
        final pa = projector.project(a[0], a[1], a[2], size);
        final pb = projector.project(b[0], b[1], b[2], size);
        final pc = projector.project(c[0], c[1], c[2], size);
        if (pa == null || pb == null || pc == null) continue;

        // Face normal in rotated model space for flat shading.
        final ra = projector.rotate(a[0], a[1], a[2]);
        final rb = projector.rotate(b[0], b[1], b[2]);
        final rc = projector.rotate(c[0], c[1], c[2]);
        final u = [rb[0] - ra[0], rb[1] - ra[1], rb[2] - ra[2]];
        final v = [rc[0] - ra[0], rc[1] - ra[1], rc[2] - ra[2]];
        final n = Scene3dProjector._normalize(Scene3dProjector._cross(u, v));
        // Lambert: light direction points from the light toward the scene.
        final dot = -(n[0] * light[0] + n[1] * light[1] + n[2] * light[2]);
        final intensity = 0.35 + 0.65 * dot.abs();

        projected.add(
          _ProjectedFace(
            points: [pa.$1, pb.$1, pc.$1],
            depth: (pa.$2 + pb.$2 + pc.$2) / 3,
            color: Color.lerp(Colors.black, mesh.color, intensity)!,
          ),
        );
      }
    }

    // Far to near.
    projected.sort((a, b) => b.depth.compareTo(a.depth));

    final paint = Paint()..style = PaintingStyle.fill;
    for (final f in projected) {
      final path = Path()
        ..moveTo(f.points[0].dx, f.points[0].dy)
        ..lineTo(f.points[1].dx, f.points[1].dy)
        ..lineTo(f.points[2].dx, f.points[2].dy)
        ..close();
      canvas.drawPath(path, paint..color = f.color);
    }
  }

  @override
  bool shouldRepaint(Scene3dMeshPainter oldDelegate) =>
      oldDelegate.config != config;
}

class _ProjectedFace {
  const _ProjectedFace({
    required this.points,
    required this.depth,
    required this.color,
  });

  final List<Offset> points;
  final double depth;
  final Color color;
}
