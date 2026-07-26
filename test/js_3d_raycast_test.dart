import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/hosts/js_3d_raycast.dart';
import 'package:vector_math/vector_math_64.dart';

/// Camera at (0, 0, 8) looking at the origin, 60° fov, square aspect.
Matrix4 _viewProjection() {
  final projection = makePerspectiveMatrix(60 * math.pi / 180, 1.0, 0.1, 100.0);
  final view = Matrix4.identity();
  setViewMatrix(
    view,
    Vector3(0, 0, 8),
    Vector3.zero(),
    Vector3(0, 1, 0),
  );
  return projection * view;
}

void main() {
  group('js3dRayFromNdc', () {
    test('center of the screen shoots a ray down -z through the origin', () {
      final vp = _viewProjection();
      final ray = js3dRayFromNdc(Offset.zero, vp.storage);

      expect(ray.direction.z, lessThan(0));
      expect(ray.direction.x, closeTo(0, 1e-6));
      expect(ray.direction.y, closeTo(0, 1e-6));
      // Origin sits on the near plane just in front of the camera.
      expect(ray.origin.z, closeTo(7.9, 0.01));
    });

    test('right edge of the screen tilts the ray towards +x', () {
      final vp = _viewProjection();
      final ray = js3dRayFromNdc(const Offset(1, 0), vp.storage);
      expect(ray.direction.x, greaterThan(0));

      final leftRay = js3dRayFromNdc(const Offset(-1, 0), vp.storage);
      expect(leftRay.direction.x, lessThan(0));
    });

    test('top of the screen (ndc y up) tilts the ray towards +y', () {
      final vp = _viewProjection();
      final ray = js3dRayFromNdc(const Offset(0, 1), vp.storage);
      expect(ray.direction.y, greaterThan(0));
    });
  });

  group('js3dRayIntersectAabb', () {
    final vp = _viewProjection();

    test('hits a unit box at the origin and reports the entry point', () {
      final ray = js3dRayFromNdc(Offset.zero, vp.storage);
      final t = js3dRayIntersectAabb(
        ray,
        Vector3(-1, -1, -1),
        Vector3(1, 1, 1),
      );
      expect(t, isNotNull);
      final point = ray.at(t!);
      // Enters the box on its +z face.
      expect(point.z, closeTo(1.0, 1e-6));
      expect(point.x, closeTo(0, 1e-6));
    });

    test('misses a box off to the side', () {
      final ray = js3dRayFromNdc(Offset.zero, vp.storage);
      final t = js3dRayIntersectAabb(
        ray,
        Vector3(10, 10, 10),
        Vector3(11, 11, 11),
      );
      expect(t, isNull);
    });

    test('misses a box behind the camera', () {
      final ray = js3dRayFromNdc(Offset.zero, vp.storage);
      final t = js3dRayIntersectAabb(
        ray,
        Vector3(-1, -1, 19),
        Vector3(1, 1, 21),
      );
      expect(t, isNull);
    });

    test('returns 0 when the ray starts inside the box', () {
      final ray = Js3dRay(Vector3(0, 0, 0), Vector3(0, 0, -1));
      final t = js3dRayIntersectAabb(
        ray,
        Vector3(-1, -1, -1),
        Vector3(1, 1, 1),
      );
      expect(t, 0.0);
    });

    test('parallel ray outside a slab misses', () {
      // Ray parallel to the x/y slabs but outside the y range.
      final ray = Js3dRay(Vector3(0, 5, 0), Vector3(0, 0, -1));
      final t = js3dRayIntersectAabb(
        ray,
        Vector3(-1, -1, -1),
        Vector3(1, 1, 1),
      );
      expect(t, isNull);
    });

    test('parallel ray inside all slabs hits', () {
      final ray = Js3dRay(Vector3(0, 0, 8), Vector3(0, 0, -1));
      final t = js3dRayIntersectAabb(
        ray,
        Vector3(-1, -1, -1),
        Vector3(1, 1, 1),
      );
      expect(t, closeTo(7.0, 1e-6));
    });
  });
}
