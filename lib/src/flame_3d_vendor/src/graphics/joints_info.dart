import 'package:js_widget_runtime/src/flame_3d_vendor/core.dart';

class JointsInfo {
  /// Joints per surface index
  Map<int, List<Matrix4>> jointTransformsPerSurface = {};

  /// Joints for the current surface
  List<Matrix4> jointTransforms = [];

  void setSurface(int surfaceIndex) {
    jointTransforms = jointTransformsPerSurface[surfaceIndex] ?? [];
  }
}
