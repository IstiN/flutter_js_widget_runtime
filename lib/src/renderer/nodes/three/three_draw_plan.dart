import 'dart:typed_data';

import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';

/// R1 carries one `line` object kind for both THREE.Line and LineSegments.
/// The host must select the intended topology until the wire format exposes it.
enum ThreeLineMode { lines, lineStrip }

enum ThreeDrawPrimitive { triangles, lines, lineStrip, points }

typedef ThreeRgb = ({double r, double g, double b});
typedef ThreeRgba = ({double r, double g, double b, double a});
typedef ThreeXyz = ({double x, double y, double z});

/// One validated draw. References point into the immutable protocol state.
final class ThreeDrawItem {
  const ThreeDrawItem({
    required this.node,
    required this.geometry,
    required this.material,
    required this.primitive,
    required this.viewDepth,
    int? drawCount,
    this.indexOffset = 0,
    this.instanceCount = 1,
    this.batch,
    this.batchPartIndex = 0,
    this.culledFromMain = false,
  }) : _drawCount = drawCount;

  final JsThreeNodeUpsert node;
  final JsThreeGeometryUpsert geometry;
  final JsThreeMaterialUpsert material;
  final ThreeDrawPrimitive primitive;

  /// View-space Z of the node's world origin. More negative is farther away.
  final double viewDepth;

  /// An index offset for indexed geometry, otherwise a vertex offset.
  final int indexOffset;
  final int instanceCount;
  final JsThreeDrawBatchUpsert? batch;
  final int batchPartIndex;
  final bool culledFromMain;
  final int? _drawCount;

  int get drawCount =>
      _drawCount ??
      (geometry.indexCount == 0 ? geometry.vertexCount : geometry.indexCount);
  bool get indexed => geometry.indexCount != 0;
  bool get instanced => batch?.instanced ?? false;
  bool get transparent => material.transparent;
}

final class ThreeDrawPlanDiagnostics {
  ThreeDrawPlanDiagnostics._();

  final List<String> _warnings = <String>[];
  var missingResourceCount = 0;
  var invalidNodeCount = 0;
  var invalidGeometryCount = 0;
  var incompatibleMaterialCount = 0;
  var invalidBatchCount = 0;
  var invisibleSubtreeCount = 0;
  var hierarchyCycleCount = 0;
  var droppedDirectionalLightCount = 0;
  var droppedPointLightCount = 0;

  List<String> get warnings => List.unmodifiable(_warnings);

  void warn(String message) => _warnings.add(message);
}

/// GPU-independent output: render state, capped lights and ordered draws.
final class ThreeDrawPlan {
  ThreeDrawPlan._({
    required this.frame,
    required this.camera,
    required this.opaque,
    required this.transparent,
    required this.ambient,
    required this.directionalLights,
    required this.pointLights,
    required this.diagnostics,
  });

  final JsThreeSubmitFrame? frame;
  final JsThreeCameraUpsert? camera;
  final List<ThreeDrawItem> opaque;
  final List<ThreeDrawItem> transparent;
  final ThreeRgb ambient;
  final List<JsThreeLightUpsert> directionalLights;
  final List<JsThreeLightUpsert> pointLights;
  final ThreeDrawPlanDiagnostics diagnostics;

  Iterable<ThreeDrawItem> get draws sync* {
    yield* opaque;
    yield* transparent;
  }

  Iterable<ThreeDrawItem> get mainDraws =>
      draws.where((draw) => !draw.culledFromMain);

  /// Number of GPU draw calls, including expanded material-array parts.
  int get drawCallCount => opaque.length + transparent.length;
  int get mainDrawCallCount => mainDraws.length;

  /// Submitted triangle count, including every instance in an instanced draw.
  int get triangleCount {
    var count = 0;
    for (final draw in draws) {
      if (draw.primitive == ThreeDrawPrimitive.triangles) {
        count += (draw.drawCount ~/ 3) * draw.instanceCount;
      }
    }
    return count;
  }

  int get mainTriangleCount {
    var count = 0;
    for (final draw in mainDraws) {
      if (draw.primitive == ThreeDrawPrimitive.triangles) {
        count += (draw.drawCount ~/ 3) * draw.instanceCount;
      }
    }
    return count;
  }

  bool get canRender => frame != null && camera != null;

  ThreeRgba get background {
    final value = frame;
    return value == null
        ? (r: 0.0, g: 0.0, b: 0.0, a: 0.0)
        : (
            r: value.backgroundR,
            g: value.backgroundG,
            b: value.backgroundB,
            a: value.backgroundA,
          );
  }

  ThreeXyz get cameraPosition {
    final matrix = camera?.matrixWorld;
    if (matrix == null || matrix.length != 16) {
      return (x: 0.0, y: 0.0, z: 0.0);
    }
    return (x: matrix[12], y: matrix[13], z: matrix[14]);
  }
}

final class ThreeDrawPlanException implements Exception {
  const ThreeDrawPlanException(this.message);
  final String message;

  @override
  String toString() => 'ThreeDrawPlanException: $message';
}

int _compareOpaqueDraws(ThreeDrawItem a, ThreeDrawItem b) {
  final byMaterial = a.material.materialId.compareTo(b.material.materialId);
  if (byMaterial != 0) return byMaterial;
  final byNode = a.node.nodeId.compareTo(b.node.nodeId);
  return byNode != 0 ? byNode : a.batchPartIndex.compareTo(b.batchPartIndex);
}

int _compareTransparentDraws(ThreeDrawItem a, ThreeDrawItem b) {
  final byDepth = a.viewDepth.compareTo(b.viewDepth);
  if (byDepth != 0) return byDepth;
  final byNode = a.node.nodeId.compareTo(b.node.nodeId);
  return byNode != 0 ? byNode : a.batchPartIndex.compareTo(b.batchPartIndex);
}

/// Deterministic scene traversal, validation and transparent back-to-front sort.
final class ThreeDrawPlanner {
  const ThreeDrawPlanner();

  static const int maxDirectionalLights = 4;
  static const int maxPointLights = 8;

  ThreeDrawPlan plan(
    JsThreeSurfaceState state, {
    JsThreeSubmitFrame? frame,
    ThreeLineMode lineMode = ThreeLineMode.lines,
  }) {
    final diagnostics = ThreeDrawPlanDiagnostics._();
    final selectedFrame = frame ?? state.currentFrame;
    if (state.disposed) {
      diagnostics.warn('surface ${state.key} is disposed');
    }
    if (selectedFrame == null) {
      diagnostics.warn('surface ${state.key} has no submitted frame');
      return _empty(null, diagnostics);
    }

    final camera = state.cameras[selectedFrame.cameraId];
    if (camera == null) {
      diagnostics.missingResourceCount++;
      diagnostics.warn('frame camera ${selectedFrame.cameraId} is missing');
    } else {
      final cameraError = _validateCamera(camera);
      if (cameraError != null) {
        diagnostics.invalidNodeCount++;
        diagnostics.warn('camera ${camera.cameraId}: $cameraError');
        return _empty(selectedFrame, diagnostics);
      }
    }
    if (selectedFrame.exposure <= 0 || !selectedFrame.exposure.isFinite) {
      diagnostics.warn('frame exposure must be finite and greater than zero');
      return _empty(selectedFrame, diagnostics);
    }

    final opaque = <ThreeDrawItem>[];
    final transparent = <ThreeDrawItem>[];
    final root = state.nodes[selectedFrame.sceneId];
    if (root == null) {
      diagnostics.missingResourceCount++;
      diagnostics.warn('frame scene ${selectedFrame.sceneId} is missing');
    } else if (camera != null) {
      _collectDraws(
        state,
        root,
        camera,
        lineMode,
        opaque,
        transparent,
        selectedFrame.culledNodeIds,
        diagnostics,
      );
    }

    opaque.sort(_compareOpaqueDraws);
    transparent.sort(_compareTransparentDraws);

    final lights = _selectLights(state, diagnostics);
    return ThreeDrawPlan._(
      frame: selectedFrame,
      camera: camera,
      opaque: List.unmodifiable(opaque),
      transparent: List.unmodifiable(transparent),
      ambient: lights.ambient,
      directionalLights: List.unmodifiable(lights.directional),
      pointLights: List.unmodifiable(lights.points),
      diagnostics: diagnostics,
    );
  }

  ({
    ThreeRgb ambient,
    List<JsThreeLightUpsert> directional,
    List<JsThreeLightUpsert> points,
  })
  _selectLights(
    JsThreeSurfaceState state,
    ThreeDrawPlanDiagnostics diagnostics,
  ) {
    final lights = state.lights.values.toList()
      ..sort((a, b) => a.lightId.compareTo(b.lightId));
    var ambientR = 0.0;
    var ambientG = 0.0;
    var ambientB = 0.0;
    final directional = <JsThreeLightUpsert>[];
    final points = <JsThreeLightUpsert>[];
    for (final light in lights) {
      switch (light.type) {
        case JsThreeLightType.ambient:
          ambientR += light.colorR * light.intensity;
          ambientG += light.colorG * light.intensity;
          ambientB += light.colorB * light.intensity;
        case JsThreeLightType.directional:
          if (directional.length < maxDirectionalLights) {
            directional.add(light);
          } else {
            diagnostics.droppedDirectionalLightCount++;
          }
        case JsThreeLightType.point:
          if (points.length < maxPointLights) {
            points.add(light);
          } else {
            diagnostics.droppedPointLightCount++;
          }
      }
    }
    if (diagnostics.droppedDirectionalLightCount != 0) {
      diagnostics.warn(
        'directional light cap $maxDirectionalLights exceeded; '
        'dropped ${diagnostics.droppedDirectionalLightCount} highest ids',
      );
    }
    if (diagnostics.droppedPointLightCount != 0) {
      diagnostics.warn(
        'point light cap $maxPointLights exceeded; '
        'dropped ${diagnostics.droppedPointLightCount} highest ids',
      );
    }
    return (
      ambient: (r: ambientR, g: ambientG, b: ambientB),
      directional: directional,
      points: points,
    );
  }

  ThreeDrawPlan _empty(
    JsThreeSubmitFrame? frame,
    ThreeDrawPlanDiagnostics diagnostics,
  ) => ThreeDrawPlan._(
    frame: frame,
    camera: null,
    opaque: const [],
    transparent: const [],
    ambient: (r: 0.0, g: 0.0, b: 0.0),
    directionalLights: const [],
    pointLights: const [],
    diagnostics: diagnostics,
  );

  void _collectDraws(
    JsThreeSurfaceState state,
    JsThreeNodeUpsert root,
    JsThreeCameraUpsert camera,
    ThreeLineMode lineMode,
    List<ThreeDrawItem> opaque,
    List<ThreeDrawItem> transparent,
    Set<int> culledNodeIds,
    ThreeDrawPlanDiagnostics diagnostics,
  ) {
    final context = _DrawContext(
      state,
      camera,
      lineMode,
      culledNodeIds,
      diagnostics,
    );
    final children = _childrenByParent(state);
    final visited = <int>{};
    final stack = <int>[root.nodeId];
    while (stack.isNotEmpty) {
      final id = stack.removeLast();
      final node = state.nodes[id];
      if (node == null) continue;
      if (!visited.add(id)) {
        diagnostics.hierarchyCycleCount++;
        diagnostics.warn('node hierarchy cycle reaches $id twice');
        continue;
      }
      if (!node.visible) {
        diagnostics.invisibleSubtreeCount++;
        continue;
      }
      _pushChildren(stack, children[id]);
      for (final item in _drawItems(context, node)) {
        (item.transparent ? transparent : opaque).add(item);
      }
    }
  }

  Map<int, List<int>> _childrenByParent(JsThreeSurfaceState state) {
    final children = <int, List<int>>{};
    for (final node in state.nodes.values) {
      if (node.parentId != 0) {
        children.putIfAbsent(node.parentId, () => <int>[]).add(node.nodeId);
      }
    }
    for (final list in children.values) {
      list.sort();
    }
    return children;
  }

  void _pushChildren(List<int> stack, List<int>? children) {
    if (children == null) return;
    for (var index = children.length - 1; index >= 0; index--) {
      stack.add(children[index]);
    }
  }

  List<ThreeDrawItem> _drawItems(_DrawContext context, JsThreeNodeUpsert node) {
    if (node.objectKind == JsThreeObjectKind.group) {
      _checkGroup(node, context.diagnostics);
      return const [];
    }
    final batch = context.state.batches[node.nodeId];
    if (batch != null) return _batchDrawItems(context, node, batch);
    final item = _drawItem(context, node);
    return item == null ? const [] : [item];
  }

  List<ThreeDrawItem> _batchDrawItems(
    _DrawContext context,
    JsThreeNodeUpsert node,
    JsThreeDrawBatchUpsert batch,
  ) {
    final diagnostics = context.diagnostics;
    if (!_finiteMatrix(node.matrixWorld)) {
      diagnostics.invalidNodeCount++;
      diagnostics.warn('node ${node.nodeId} has an invalid world matrix');
      return const [];
    }
    if (node.objectKind != JsThreeObjectKind.mesh ||
        node.geometryId != 0 ||
        node.materialId != 0) {
      diagnostics.invalidBatchCount++;
      diagnostics.warn(
        'batch node ${node.nodeId} must be a mesh with zero direct resources',
      );
      return const [];
    }
    if (batch.instanceCount == 0) return const [];
    final matrixLength = batch.instanced ? batch.instanceCount * 16 : 0;
    if (batch.instanceMatrices.length != matrixLength) {
      diagnostics.invalidBatchCount++;
      diagnostics.warn('batch node ${node.nodeId} has invalid matrix data');
      return const [];
    }

    final items = <ThreeDrawItem>[];
    final view = context.camera.matrixWorldInverse;
    final matrix = node.matrixWorld;
    final depth =
        view[2] * matrix[12] +
        view[6] * matrix[13] +
        view[10] * matrix[14] +
        view[14];
    for (var index = 0; index < batch.parts.length; index++) {
      final item = _batchDrawItem(context, node, batch, index, depth);
      if (item != null) items.add(item);
    }
    return items;
  }

  ThreeDrawItem? _batchDrawItem(
    _DrawContext context,
    JsThreeNodeUpsert node,
    JsThreeDrawBatchUpsert batch,
    int index,
    double depth,
  ) {
    final diagnostics = context.diagnostics;
    final part = batch.parts[index];
    final resources = _drawResourcesById(
      context,
      node,
      part.geometryId,
      part.materialId,
    );
    if (resources == null) return null;
    final geometry = resources.geometry;
    final material = resources.material;
    final primitive = _primitiveFor(node, geometry, context.lineMode);
    if (primitive == null ||
        !_compatibleMaterial(node.objectKind, material.kind)) {
      diagnostics.incompatibleMaterialCount++;
      diagnostics.warn(
        'batch node ${node.nodeId} part $index has incompatible kinds',
      );
      return null;
    }
    final rangeError = _batchPartRangeError(geometry, part);
    if (rangeError != null) {
      diagnostics.invalidBatchCount++;
      diagnostics.warn('batch node ${node.nodeId} part $index: $rangeError');
      return null;
    }
    if (batch.instanced && material.transparent) {
      diagnostics.invalidBatchCount++;
      diagnostics.warn(
        'batch node ${node.nodeId} part $index: transparent InstancedMesh '
        'draws are unsupported in R1',
      );
      return null;
    }
    return ThreeDrawItem(
      node: node,
      geometry: geometry,
      material: material,
      primitive: primitive,
      viewDepth: depth,
      drawCount: part.count,
      indexOffset: part.offset,
      instanceCount: batch.instanceCount,
      batch: batch,
      batchPartIndex: index,
      culledFromMain: context.culledNodeIds.contains(node.nodeId),
    );
  }

  String? _batchPartRangeError(
    JsThreeGeometryUpsert geometry,
    JsThreeDrawBatchPart part,
  ) {
    final total = geometry.indexCount == 0
        ? geometry.vertexCount
        : geometry.indexCount;
    final boundsError = _batchPartBoundsError(total, part);
    if (boundsError != null) return boundsError;
    final coverageError = _batchPartCoverageError(geometry, part);
    if (coverageError != null) return coverageError;
    return _batchPartAlignmentError(geometry.primitive, part);
  }

  String? _batchPartBoundsError(int total, JsThreeDrawBatchPart part) {
    if (part.count == 0 ||
        part.offset > total ||
        part.count > total - part.offset) {
      return 'offset/count exceeds the geometry draw range';
    }
    return null;
  }

  String? _batchPartCoverageError(
    JsThreeGeometryUpsert geometry,
    JsThreeDrawBatchPart part,
  ) {
    if (geometry.indexCount == 0 &&
        (part.offset != 0 || part.count != geometry.vertexCount)) {
      return 'non-indexed batch parts must cover the whole geometry';
    }
    return null;
  }

  String? _batchPartAlignmentError(
    JsThreePrimitive primitive,
    JsThreeDrawBatchPart part,
  ) {
    final multiple = switch (primitive) {
      JsThreePrimitive.triangles => 3,
      JsThreePrimitive.lines => 2,
      JsThreePrimitive.points => 1,
    };
    if (part.offset % multiple != 0 || part.count % multiple != 0) {
      return 'offset/count splits a primitive';
    }
    return null;
  }

  ThreeDrawItem? _drawItem(_DrawContext context, JsThreeNodeUpsert node) {
    final diagnostics = context.diagnostics;
    if (node.objectKind == JsThreeObjectKind.group) {
      _checkGroup(node, diagnostics);
      return null;
    }
    final resources = _drawResources(context, node);
    if (resources == null) return null;
    final geometry = resources.geometry;
    final material = resources.material;
    final primitive = _primitiveFor(node, geometry, context.lineMode);
    if (primitive == null ||
        !_compatibleMaterial(node.objectKind, material.kind)) {
      diagnostics.incompatibleMaterialCount++;
      diagnostics.warn(
        'node ${node.nodeId} object/geometry/material kinds are incompatible',
      );
      return null;
    }
    final matrix = node.matrixWorld;
    final view = context.camera.matrixWorldInverse;
    final x = matrix[12];
    final y = matrix[13];
    final z = matrix[14];
    final depth = view[2] * x + view[6] * y + view[10] * z + view[14];
    return ThreeDrawItem(
      node: node,
      geometry: geometry,
      material: material,
      primitive: primitive,
      viewDepth: depth,
      culledFromMain: context.culledNodeIds.contains(node.nodeId),
    );
  }

  void _checkGroup(
    JsThreeNodeUpsert node,
    ThreeDrawPlanDiagnostics diagnostics,
  ) {
    if (node.geometryId == 0 && node.materialId == 0) return;
    diagnostics.invalidNodeCount++;
    diagnostics.warn(
      'group ${node.nodeId} unexpectedly references draw resources',
    );
  }

  ({JsThreeGeometryUpsert geometry, JsThreeMaterialUpsert material})?
  _drawResources(_DrawContext context, JsThreeNodeUpsert node) {
    final diagnostics = context.diagnostics;
    if (!_finiteMatrix(node.matrixWorld)) {
      diagnostics.invalidNodeCount++;
      diagnostics.warn('node ${node.nodeId} has an invalid world matrix');
      return null;
    }
    return _drawResourcesById(context, node, node.geometryId, node.materialId);
  }

  ({JsThreeGeometryUpsert geometry, JsThreeMaterialUpsert material})?
  _drawResourcesById(
    _DrawContext context,
    JsThreeNodeUpsert node,
    int geometryId,
    int materialId,
  ) {
    final diagnostics = context.diagnostics;
    if (geometryId == 0 || materialId == 0) {
      diagnostics.missingResourceCount++;
      diagnostics.warn(
        'draw node ${node.nodeId} has a zero geometry/material id',
      );
      return null;
    }
    final geometry = context.state.geometries[geometryId];
    final material = context.state.materials[materialId];
    if (geometry == null || material == null) {
      diagnostics.missingResourceCount++;
      diagnostics.warn(
        'node ${node.nodeId} misses ${geometry == null ? 'geometry' : 'material'}',
      );
      return null;
    }
    _checkMaterialMap(context, material);
    final geometryError = context.checkedGeometries.putIfAbsent(
      geometry.geometryId,
      () => validateThreeGeometry(geometry, checkValues: false),
    );
    if (geometryError != null) {
      diagnostics.invalidGeometryCount++;
      diagnostics.warn('geometry ${geometry.geometryId}: $geometryError');
      return null;
    }
    return (geometry: geometry, material: material);
  }

  void _checkMaterialMap(_DrawContext context, JsThreeMaterialUpsert material) {
    if (!context.checkedMaterials.add(material.materialId)) return;
    if (material.mapTextureId == 0 ||
        context.state.textures.containsKey(material.mapTextureId)) {
      return;
    }
    context.diagnostics.missingResourceCount++;
    context.diagnostics.warn(
      'material ${material.materialId} map ${material.mapTextureId} is '
      'missing; a white fallback will be used',
    );
  }

  ThreeDrawPrimitive? _primitiveFor(
    JsThreeNodeUpsert node,
    JsThreeGeometryUpsert geometry,
    ThreeLineMode lineMode,
  ) => switch ((node.objectKind, geometry.primitive)) {
    (JsThreeObjectKind.mesh, JsThreePrimitive.triangles) =>
      ThreeDrawPrimitive.triangles,
    (JsThreeObjectKind.line, JsThreePrimitive.lines) =>
      lineMode == ThreeLineMode.lines
          ? ThreeDrawPrimitive.lines
          : ThreeDrawPrimitive.lineStrip,
    (JsThreeObjectKind.points, JsThreePrimitive.points) =>
      ThreeDrawPrimitive.points,
    _ => null,
  };

  bool _compatibleMaterial(
    JsThreeObjectKind object,
    JsThreeMaterialKind material,
  ) => switch (object) {
    JsThreeObjectKind.group => false,
    JsThreeObjectKind.mesh =>
      material == JsThreeMaterialKind.meshBasic ||
          material == JsThreeMaterialKind.meshLambert ||
          material == JsThreeMaterialKind.meshStandard,
    JsThreeObjectKind.line => material == JsThreeMaterialKind.lineBasic,
    JsThreeObjectKind.points => material == JsThreeMaterialKind.pointsBasic,
  };

  String? _validateCamera(JsThreeCameraUpsert camera) {
    if (!_finiteMatrix(camera.matrixWorldInverse) ||
        !_finiteMatrix(camera.projectionMatrix) ||
        !_finiteMatrix(camera.matrixWorld)) {
      return 'matrices must each contain 16 finite floats';
    }
    return null;
  }
}

final class _DrawContext {
  _DrawContext(
    this.state,
    this.camera,
    this.lineMode,
    this.culledNodeIds,
    this.diagnostics,
  );

  final JsThreeSurfaceState state;
  final JsThreeCameraUpsert camera;
  final ThreeLineMode lineMode;
  final Set<int> culledNodeIds;
  final ThreeDrawPlanDiagnostics diagnostics;
  final Map<int, String?> checkedGeometries = <int, String?>{};
  final Set<int> checkedMaterials = <int>{};
}

bool _finiteMatrix(Float32List matrix) =>
    matrix.length == 16 && matrix.every((value) => value.isFinite);

/// Validates shape without retaining or decoding any protocol bytes.
/// [checkValues] additionally checks all vertex values and index bounds.
String? validateThreeGeometry(
  JsThreeGeometryUpsert geometry, {
  bool checkValues = true,
}) {
  final vertices = geometry.vertexCount;
  return _validateGeometryPositions(geometry) ??
      _validateOptionalAttribute(
        geometry.normals,
        geometry.attributeMask & 2 != 0,
        _product(vertices, 3),
        'normal presence/length does not match attribute mask',
      ) ??
      _validateOptionalAttribute(
        geometry.uvs,
        geometry.attributeMask & 4 != 0,
        _product(vertices, 2),
        'uv presence/length does not match attribute mask',
      ) ??
      _validateColorPresence(geometry) ??
      _validateColorStride(geometry) ??
      _validateColorLength(geometry) ??
      _validateGeometryIndices(geometry) ??
      _validateGeometryValues(geometry, checkValues);
}

String? _validateGeometryPositions(JsThreeGeometryUpsert geometry) {
  final vertices = geometry.vertexCount;
  if (vertices <= 0 || geometry.attributeMask & 1 == 0) {
    return 'position attribute and positive vertex count are required';
  }
  if (geometry.positions.length != _product(vertices, 3)) {
    return 'position length does not match vertex count';
  }
  return null;
}

String? _validateOptionalAttribute(
  Float32List? values,
  bool present,
  int expectedLength,
  String error,
) {
  if (present != (values != null)) return error;
  if (values != null && values.length != expectedLength) return error;
  return null;
}

String? _validateColorPresence(JsThreeGeometryUpsert geometry) {
  final hasColors = geometry.attributeMask & 8 != 0;
  if (hasColors != (geometry.colors != null)) {
    return 'color stride/presence/length is inconsistent';
  }
  return null;
}

String? _validateColorStride(JsThreeGeometryUpsert geometry) {
  final hasColors = geometry.attributeMask & 8 != 0;
  if (hasColors && geometry.colorStride != 3 && geometry.colorStride != 4) {
    return 'color stride/presence/length is inconsistent';
  }
  if (!hasColors && geometry.colorStride != 0) {
    return 'color stride/presence/length is inconsistent';
  }
  return null;
}

String? _validateColorLength(JsThreeGeometryUpsert geometry) {
  final colors = geometry.colors;
  if (colors != null &&
      colors.length != _product(geometry.vertexCount, geometry.colorStride)) {
    return 'color stride/presence/length is inconsistent';
  }
  return null;
}

String? _validateGeometryIndices(JsThreeGeometryUpsert geometry) {
  if (geometry.indexCount != geometry.indices.length) {
    return 'indexCount does not match index data';
  }
  final drawCount = geometry.indexCount == 0
      ? geometry.vertexCount
      : geometry.indexCount;
  final multiple = switch (geometry.primitive) {
    JsThreePrimitive.triangles => 3,
    JsThreePrimitive.lines => 2,
    JsThreePrimitive.points => 1,
  };
  if (drawCount % multiple != 0) return 'incomplete primitive draw count';
  return null;
}

String? _validateGeometryValues(
  JsThreeGeometryUpsert geometry,
  bool checkValues,
) {
  if (!checkValues) return null;
  for (final list in <Float32List?>[
    geometry.positions,
    geometry.normals,
    geometry.uvs,
    geometry.colors,
  ]) {
    if (list != null && list.any((value) => !value.isFinite)) {
      return 'vertex attributes must be finite';
    }
  }
  for (final index in geometry.indices) {
    if (index >= geometry.vertexCount) {
      return 'index $index exceeds vertex range';
    }
  }
  return null;
}

int _product(int left, int right) {
  const maxSafe = 0x1fffffffffffff;
  if (left < 0 || right < 0 || (left != 0 && right > maxSafe ~/ left)) {
    throw const ThreeDrawPlanException('geometry byte arithmetic overflow');
  }
  return left * right;
}

final class ThreeInterleavedGeometry {
  const ThreeInterleavedGeometry({
    required this.vertices,
    required this.indices,
    required this.vertexCount,
    required this.indexCount,
  });

  static const int strideInBytes = 48;
  final ByteData vertices;
  final ByteData? indices;
  final int vertexCount;
  final int indexCount;
}

/// Packs position/normal/uv/color into 48-byte vertices and checked u32 indices.
/// Missing normals face +Z, UVs are zero and missing colors are opaque white.
ThreeInterleavedGeometry interleaveThreeGeometry(
  JsThreeGeometryUpsert geometry,
) {
  final error = validateThreeGeometry(geometry);
  if (error != null) throw ThreeDrawPlanException(error);
  final vertexBytes = _product(
    geometry.vertexCount,
    ThreeInterleavedGeometry.strideInBytes,
  );
  final vertices = ByteData(vertexBytes);
  for (var vertex = 0; vertex < geometry.vertexCount; vertex++) {
    final offset = vertex * ThreeInterleavedGeometry.strideInBytes;
    for (var component = 0; component < 3; component++) {
      vertices.setFloat32(
        offset + component * 4,
        geometry.positions[vertex * 3 + component],
        Endian.little,
      );
      vertices.setFloat32(
        offset + 12 + component * 4,
        geometry.normals?[vertex * 3 + component] ??
            (component == 2 ? 1.0 : 0.0),
        Endian.little,
      );
    }
    for (var component = 0; component < 2; component++) {
      vertices.setFloat32(
        offset + 24 + component * 4,
        geometry.uvs?[vertex * 2 + component] ?? 0.0,
        Endian.little,
      );
    }
    for (var component = 0; component < 4; component++) {
      final color = geometry.colors;
      final value = color == null
          ? 1.0
          : component < geometry.colorStride
          ? color[vertex * geometry.colorStride + component]
          : 1.0;
      vertices.setFloat32(offset + 32 + component * 4, value, Endian.little);
    }
  }

  ByteData? indices;
  if (geometry.indexCount != 0) {
    indices = ByteData(_product(geometry.indexCount, 4));
    for (var index = 0; index < geometry.indexCount; index++) {
      indices.setUint32(index * 4, geometry.indices[index], Endian.little);
    }
  }
  return ThreeInterleavedGeometry(
    vertices: vertices,
    indices: indices,
    vertexCount: geometry.vertexCount,
    indexCount: geometry.indexCount,
  );
}
