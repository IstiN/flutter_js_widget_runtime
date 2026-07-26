import 'dart:ui' show Offset;

import 'package:vector_math/vector_math_64.dart';

/// Pure NDC → ray → AABB picking math shared by the 3D hosts.
///
/// Kept free of any engine/GPU dependency so it can be unit-tested directly.
/// Uses `vector_math_64` types; hosts working with 32-bit `vector_math`
/// matrices (flame_3d) convert through `Matrix4.fromList(m.storage)`.

/// A world-space picking ray.
class Js3dRay {
  const Js3dRay(this.origin, this.direction);

  /// Point on the near plane where the ray starts.
  final Vector3 origin;

  /// Normalized ray direction.
  final Vector3 direction;

  /// Returns the point at distance [t] along the ray.
  Vector3 at(double t) => origin + direction * t;
}

/// Builds a world-space ray from normalized device coordinates [ndc]
/// (x/y in `[-1, 1]`, y up) and the camera's view-projection matrix given as
/// 16 column-major doubles (e.g. `Matrix4.storage`).
Js3dRay js3dRayFromNdc(Offset ndc, List<double> viewProjection) {
  final inverse = Matrix4.fromList(viewProjection)..invert();
  final near = _unproject(inverse, ndc.dx, ndc.dy, -1);
  final far = _unproject(inverse, ndc.dx, ndc.dy, 1);
  return Js3dRay(near, (far - near).normalized());
}

Vector3 _unproject(Matrix4 inverse, double x, double y, double z) {
  final v = inverse.transform(Vector4(x, y, z, 1));
  return Vector3(v.x / v.w, v.y / v.w, v.z / v.w);
}

/// Slab-method ray/AABB intersection.
///
/// Returns the distance [t] along the ray to the nearest entry point, or null
/// when the ray misses the box. Rays starting inside the box return `0`.
double? js3dRayIntersectAabb(Js3dRay ray, Vector3 min, Vector3 max) {
  var tMin = 0.0;
  var tMax = double.infinity;
  for (var axis = 0; axis < 3; axis++) {
    final origin = ray.origin[axis];
    final direction = ray.direction[axis];
    if (direction.abs() < 1e-12) {
      // Parallel to this slab: only a hit when the origin is inside it.
      if (origin < min[axis] || origin > max[axis]) return null;
      continue;
    }
    var t1 = (min[axis] - origin) / direction;
    var t2 = (max[axis] - origin) / direction;
    if (t1 > t2) {
      final tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    if (t1 > tMin) tMin = t1;
    if (t2 < tMax) tMax = t2;
    if (tMin > tMax) return null;
  }
  return tMin;
}
