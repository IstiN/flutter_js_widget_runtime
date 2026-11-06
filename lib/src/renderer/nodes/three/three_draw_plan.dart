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

/// Per-draw stencil/color-write state resolved from an R1 v8 material
/// (flag bits 10/11 plus the 32-byte stencil tail). Null for stenciless
/// draws: neither the tail nor the colorWrite-off flag is present, which
/// keeps every pre-v8 draw byte-identical downstream.
final class ThreeDrawStencilState {
  const ThreeDrawStencilState({
    required this.writeEnabled,
    required this.compareFunction,
    required this.reference,
    required this.readMask,
    required this.writeMask,
    required this.failOperation,
    required this.zFailOperation,
    required this.zPassOperation,
    required this.colorWrite,
  });

  /// Upstream gates the whole stencil block on Material.stencilWrite
  /// (WebGLState.setMaterial); false means the draw applies no stencil
  /// test and no stencil write.
  final bool writeEnabled;
  final JsThreeStencilFunc compareFunction;
  final int reference;
  final int readMask;
  final int writeMask;
  final JsThreeStencilOp failOperation;
  final JsThreeStencilOp zFailOperation;
  final JsThreeStencilOp zPassOperation;

  /// Upstream Material.colorWrite (R1 flag bit 10); false keeps depth and
  /// stencil writes but must not disturb the color attachment.
  final bool colorWrite;

  /// Null unless the material carries stencil or colorWrite-off state.
  static ThreeDrawStencilState? of(JsThreeMaterialUpsert material) {
    if (!material.hasStencil && material.colorWrite) return null;
    return ThreeDrawStencilState(
      writeEnabled: material.stencilWrite,
      compareFunction: material.stencilFunc,
      reference: material.stencilRef,
      readMask: material.stencilFuncMask,
      writeMask: material.stencilWriteMask,
      failOperation: material.stencilFailOp,
      zFailOperation: material.stencilZFailOp,
      zPassOperation: material.stencilZPassOp,
      colorWrite: material.colorWrite,
    );
  }
}

/// A decoded R1 v8 STENCIL_CLEAR marker placed into the ordered main-pass
/// stream. [nodeId] anchors the clear after the last draw of that node;
/// zero anchors it before the first draw ("at stream position").
final class ThreeStencilClearMarker {
  const ThreeStencilClearMarker(this.nodeId, this.value);

  final int nodeId;
  final int value;
}

/// One entry of the ordered main-pass draw stream: either a draw or an
/// applied-in-order stencil-clear marker.
sealed class ThreeDrawStreamEntry {
  const ThreeDrawStreamEntry();
}

final class ThreeDrawStreamDraw extends ThreeDrawStreamEntry {
  const ThreeDrawStreamDraw(this.draw);

  final ThreeDrawItem draw;
}

final class ThreeDrawStreamStencilClear extends ThreeDrawStreamEntry {
  const ThreeDrawStreamStencilClear(this.clear);

  final ThreeStencilClearMarker clear;
}

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
    this.autoInstanceDraws = const [],
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

  /// Original draws replaced by this backend-local instance submission.
  /// Empty for ordinary and explicitly instanced draws.
  final List<ThreeDrawItem> autoInstanceDraws;
  final int? _drawCount;

  /// Stencil/color-write state resolved from the material (R1 v8); null
  /// when the draw is stenciless (no tail and colorWrite enabled). Computed
  /// per access — stenciless draws return null without allocating, and
  /// stencil scenes hold only a handful of draws.
  ThreeDrawStencilState? get stencil => ThreeDrawStencilState.of(material);

  int get drawCount =>
      _drawCount ??
      (wireframe
          ? geometry.wireIndexCount
          : geometry.indexCount == 0
          ? geometry.vertexCount
          : geometry.indexCount);
  bool get indexed =>
      wireframe ? geometry.wireIndexCount != 0 : geometry.indexCount != 0;
  bool get autoInstanced => autoInstanceDraws.isNotEmpty;
  bool get instanced => autoInstanced || (batch?.instanced ?? false);
  bool get transparent => material.transparent;
  bool get wireframe => material.wireframe;
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
  var droppedHemisphereLightCount = 0;
  var droppedSpotLightCount = 0;

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
    required this.hemisphereLights,
    required this.spotLights,
    required this.clippings,
    required this.textures,
    required this.renderTargets,
    required this.diagnostics,
    required this.stream,
  });

  final JsThreeSubmitFrame? frame;
  final JsThreeCameraUpsert? camera;
  final List<ThreeDrawItem> opaque;
  final List<ThreeDrawItem> transparent;
  final ThreeRgb ambient;
  final List<JsThreeLightUpsert> directionalLights;
  final List<JsThreeLightUpsert> pointLights;
  final List<JsThreeLightUpsert> hemisphereLights;
  final List<JsThreeLightUpsert> spotLights;
  final Map<int, JsThreeClippingUpsert> clippings;

  /// Texture upserts snapshot (cube atlas lookup for material uniforms).
  final Map<int, JsThreeTextureUpsert> textures;
  final Map<int, JsThreeRenderTargetUpsert> renderTargets;
  final ThreeDrawPlanDiagnostics diagnostics;

  /// Ordered main-pass stream: draws (opaque then transparent, matching
  /// [draws]) with R1 v8 STENCIL_CLEAR markers woven in at their anchor
  /// positions. Stenciless plans contain exactly one draw entry per draw —
  /// byte-identical to the pre-v8 iteration order.
  final List<ThreeDrawStreamEntry> stream;

  /// [stream] entries that survive main-pass culling: draws drop when
  /// culled from the main camera, markers always stay.
  Iterable<ThreeDrawStreamEntry> get mainStream => stream.where(
    (entry) =>
        entry is! ThreeDrawStreamDraw || !entry.draw.culledFromMain,
  );

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
  final byRenderOrder = a.node.renderOrder.compareTo(b.node.renderOrder);
  if (byRenderOrder != 0) return byRenderOrder;
  final byMaterial = a.material.materialId.compareTo(b.material.materialId);
  if (byMaterial != 0) return byMaterial;
  final byNode = a.node.nodeId.compareTo(b.node.nodeId);
  return byNode != 0 ? byNode : a.batchPartIndex.compareTo(b.batchPartIndex);
}

int _compareTransparentDraws(ThreeDrawItem a, ThreeDrawItem b) {
  final byRenderOrder = a.node.renderOrder.compareTo(b.node.renderOrder);
  if (byRenderOrder != 0) return byRenderOrder;
  final byDepth = a.viewDepth.compareTo(b.viewDepth);
  if (byDepth != 0) return byDepth;
  final byNode = a.node.nodeId.compareTo(b.node.nodeId);
  return byNode != 0 ? byNode : a.batchPartIndex.compareTo(b.batchPartIndex);
}

List<ThreeDrawItem> _autoInstanceOpaqueDraws(
  List<ThreeDrawItem> draws,
  Set<int> culledShadowNodeIds,
) {
  // Opaque order need not preserve material-id adjacency. Cloned materials
  // (the 601 shadow-performance horses) have distinct ids and alternating
  // frustum results, so adjacent-only runs fragmented into hundreds of draw
  // calls. Group every compatible opaque run, placing it at its first draw's
  // position; transparent ordering is deliberately untouched.
  final entries = <Object>[];
  final runs = <List<ThreeDrawItem>>[];
  final runsByGeometry = <JsThreeGeometryUpsert, List<int>>{};
  for (final draw in draws) {
    if (!_eligibleAutoInstanceDraw(draw)) {
      entries.add(draw);
      continue;
    }
    final candidates = runsByGeometry[draw.geometry] ??= <int>[];
    var matchingRun = -1;
    for (final index in candidates) {
      if (_sameAutoInstanceState(
        runs[index].first,
        draw,
        culledShadowNodeIds,
      )) {
        matchingRun = index;
        break;
      }
    }
    if (matchingRun >= 0) {
      runs[matchingRun].add(draw);
      continue;
    }
    final run = <ThreeDrawItem>[draw];
    final index = runs.length;
    runs.add(run);
    candidates.add(index);
    entries.add(run);
  }
  return [
    for (final entry in entries)
      if (entry is ThreeDrawItem)
        entry
      else if ((entry as List<ThreeDrawItem>).length == 1)
        entry.single
      else
        _autoInstanceDraw(entry),
  ];
}

const _meshMaterialKinds = {
  JsThreeMaterialKind.meshBasic,
  JsThreeMaterialKind.meshLambert,
  JsThreeMaterialKind.meshStandard,
  JsThreeMaterialKind.meshPhong,
  JsThreeMaterialKind.meshNormal,
  JsThreeMaterialKind.meshTon,
  JsThreeMaterialKind.meshMatcap,
  JsThreeMaterialKind.shadow,
  JsThreeMaterialKind.background,
  JsThreeMaterialKind.anaglyph,
  // R1 v7: depth-viz lane (MeshDepthMaterial, BasicDepthPacking).
  JsThreeMaterialKind.meshDepth,
};

const _autoInstanceMaterialKinds = {
  JsThreeMaterialKind.meshBasic,
  JsThreeMaterialKind.meshLambert,
  JsThreeMaterialKind.meshStandard,
  JsThreeMaterialKind.meshPhong,
  JsThreeMaterialKind.meshTon,
  JsThreeMaterialKind.meshMatcap,
  // Depth prepass overrides batch across plain meshes the same way the
  // unlit kinds do (the output is view depth, not lit shading).
  JsThreeMaterialKind.meshDepth,
};

bool _eligibleAutoInstanceDraw(ThreeDrawItem draw) =>
    draw.batch == null &&
    draw.primitive == ThreeDrawPrimitive.triangles &&
    !draw.transparent &&
    !draw.wireframe &&
    draw.node.objectKind != JsThreeObjectKind.sprite &&
    // R1 v8 stencil-tail materials carry per-draw stencil state that must
    // not be merged across distinct draw references; colorWrite-off is
    // already excluded by flags inequality inside the merge checks.
    !draw.material.hasStencil &&
    _autoInstanceMaterialKinds.contains(draw.material.kind);

bool _sameAutoInstanceState(
  ThreeDrawItem a,
  ThreeDrawItem b,
  Set<int> culledShadowNodeIds,
) {
  if (!identical(a.geometry, b.geometry) ||
      a.culledFromMain != b.culledFromMain ||
      a.node.renderOrder != b.node.renderOrder ||
      a.node.castShadow != b.node.castShadow ||
      a.node.receiveShadow != b.node.receiveShadow ||
      culledShadowNodeIds.contains(a.node.nodeId) !=
          culledShadowNodeIds.contains(b.node.nodeId)) {
    return false;
  }
  return _sameAutoInstanceMaterialSurface(a.material, b.material) &&
      _sameAutoInstanceMaterialLighting(a.material, b.material);
}

/// Opaque-surface fields that force a separate auto-instance run.
bool _sameAutoInstanceMaterialSurface(
  JsThreeMaterialUpsert x,
  JsThreeMaterialUpsert y,
) {
  return x.kind == y.kind &&
      x.mapTextureId == y.mapTextureId &&
      x.flags == y.flags &&
      x.side == y.side &&
      x.roughness == y.roughness &&
      x.metalness == y.metalness &&
      x.alphaTest == y.alphaTest &&
      x.pointSize == y.pointSize &&
      _sameMaterialTextureSlots(x, y);
}

/// R1 v4 texture-slot tail: alpha/env ids, envMapIntensity and both
/// per-map UV matrices must match for auto-instanced runs to merge.
/// The v5 tail adds the matcap/gradient-map ids.
bool _sameMaterialTextureSlots(
  JsThreeMaterialUpsert x,
  JsThreeMaterialUpsert y,
) {
  return x.alphaMapTextureId == y.alphaMapTextureId &&
      x.envMapTextureId == y.envMapTextureId &&
      x.envMapIntensity == y.envMapIntensity &&
      x.matcapTextureId == y.matcapTextureId &&
      x.gradientMapTextureId == y.gradientMapTextureId &&
      _sameNormalBumpPbrSlots(x, y) &&
      _sameUvMatrix(x.mapUvMatrix, y.mapUvMatrix) &&
      _sameUvMatrix(x.alphaMapUvMatrix, y.alphaMapUvMatrix);
}

/// R1 v6 normal/bump/PBR slots: identical ids and scale factors are
/// required before two draws may merge into one auto-instance run.
bool _sameNormalBumpPbrSlots(JsThreeMaterialUpsert x, JsThreeMaterialUpsert y) {
  return x.normalMapTextureId == y.normalMapTextureId &&
      x.normalScaleX == y.normalScaleX &&
      x.normalScaleY == y.normalScaleY &&
      x.bumpMapTextureId == y.bumpMapTextureId &&
      x.bumpScale == y.bumpScale &&
      x.roughnessMapTextureId == y.roughnessMapTextureId &&
      x.metalnessMapTextureId == y.metalnessMapTextureId;
}

/// Byte-equality over the 9-float column-major UV transform: auto-instanced
/// runs must not merge draws whose per-map texture transforms differ.
bool _sameUvMatrix(Float32List x, Float32List y) {
  for (var index = 0; index < 9; index++) {
    if (x[index] != y[index]) return false;
  }
  return true;
}

/// Lighting fields that force a separate auto-instance run.
bool _sameAutoInstanceMaterialLighting(
  JsThreeMaterialUpsert x,
  JsThreeMaterialUpsert y,
) {
  return x.specularR == y.specularR &&
      x.specularG == y.specularG &&
      x.specularB == y.specularB &&
      x.shininess == y.shininess &&
      x.emissiveR == y.emissiveR &&
      x.emissiveG == y.emissiveG &&
      x.emissiveB == y.emissiveB &&
      x.emissiveIntensity == y.emissiveIntensity;
}

ThreeDrawItem _autoInstanceDraw(List<ThreeDrawItem> draws) {
  final first = draws.first;
  return ThreeDrawItem(
    node: first.node,
    geometry: first.geometry,
    material: first.material,
    primitive: first.primitive,
    viewDepth: first.viewDepth,
    drawCount: first.drawCount,
    indexOffset: first.indexOffset,
    instanceCount: draws.length,
    culledFromMain: first.culledFromMain,
    autoInstanceDraws: List.unmodifiable(draws),
  );
}

/// Deterministic scene traversal, validation and transparent back-to-front sort.
final class ThreeDrawPlanner {
  const ThreeDrawPlanner({this.autoInstance = false});

  /// Enables conservative opaque mesh grouping for the native GPU backend.
  /// Other planners retain the one-item-per-submission representation.
  final bool autoInstance;

  static const int maxDirectionalLights = 4;
  static const int maxPointLights = 8;
  static const int maxHemisphereLights = 4;
  static const int maxSpotLights = 4;

  ThreeDrawPlan plan(
    JsThreeFrameResources state, {
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
    final submissions = autoInstance
        ? _autoInstanceOpaqueDraws(opaque, selectedFrame.culledShadowNodeIds)
        : opaque;

    final lights = _selectLights(state, diagnostics);
    return ThreeDrawPlan._(
      frame: selectedFrame,
      camera: camera,
      opaque: List.unmodifiable(submissions),
      transparent: List.unmodifiable(transparent),
      ambient: lights.ambient,
      directionalLights: List.unmodifiable(lights.directional),
      pointLights: List.unmodifiable(lights.points),
      hemisphereLights: List.unmodifiable(lights.hemisphere),
      spotLights: List.unmodifiable(lights.spots),
      clippings: Map.unmodifiable(state.clippings),
      textures: Map.unmodifiable(state.textures),
      renderTargets: Map.unmodifiable(state.renderTargets),
      diagnostics: diagnostics,
      stream: _weaveStencilClears(
        submissions,
        transparent,
        state.stencilClears,
        state,
      ),
    );
  }

  /// Weaves R1 v8 STENCIL_CLEAR markers into the ordered draw stream.
  /// Marker anchors, in stream order: after the LAST draw of the owned node
  /// (matching the native "after all draws of nodeId in sorted renderOrder"
  /// rule); before the first draw sorting strictly after the node's
  /// renderOrder when the node has no draws here (frustum-culled owner);
  /// before the first draw for unbound markers (nodeId 0 = "at stream
  /// position"). Markers sharing an anchor keep their stream order.
  List<ThreeDrawStreamEntry> _weaveStencilClears(
    List<ThreeDrawItem> opaque,
    List<ThreeDrawItem> transparent,
    List<JsThreeStencilClear> clears,
    JsThreeFrameResources state,
  ) {
    final draws = [...opaque, ...transparent];
    if (clears.isEmpty) {
      return List.unmodifiable([
        for (final draw in draws) ThreeDrawStreamDraw(draw),
      ]);
    }
    final anchored = <(int, int)>[
      for (var index = 0; index < clears.length; index++)
        (_stencilClearAnchor(draws, clears[index], state), index),
    ]..sort((a, b) => a.$1 != b.$1 ? a.$1 - b.$1 : a.$2 - b.$2);
    final entries = <ThreeDrawStreamEntry>[];
    var marker = 0;
    for (var index = 0; index <= draws.length; index++) {
      while (marker < anchored.length && anchored[marker].$1 == index) {
        final clear = clears[anchored[marker].$2];
        entries.add(
          ThreeDrawStreamStencilClear(
            ThreeStencilClearMarker(clear.nodeId, clear.value),
          ),
        );
        marker++;
      }
      if (index == draws.length) break;
      entries.add(ThreeDrawStreamDraw(draws[index]));
    }
    return List.unmodifiable(entries);
  }

  int _stencilClearAnchor(
    List<ThreeDrawItem> draws,
    JsThreeStencilClear clear,
    JsThreeFrameResources state,
  ) {
    if (clear.nodeId == 0) return 0;
    var afterLastOwnedDraw = -1;
    for (var index = 0; index < draws.length; index++) {
      if (draws[index].node.nodeId == clear.nodeId) {
        afterLastOwnedDraw = index + 1;
      }
    }
    if (afterLastOwnedDraw >= 0) return afterLastOwnedDraw;
    // The owned node has no draws here (frustum-culled or absent): anchor
    // before the first draw sorting strictly after its renderOrder, or at
    // the stream start when nothing sorts before it.
    final renderOrder = state.nodes[clear.nodeId]?.renderOrder ?? 0;
    var anchor = 0;
    for (var index = 0; index < draws.length; index++) {
      if (draws[index].node.renderOrder < renderOrder) anchor = index + 1;
    }
    return anchor;
  }

  ({
    ThreeRgb ambient,
    List<JsThreeLightUpsert> directional,
    List<JsThreeLightUpsert> points,
    List<JsThreeLightUpsert> hemisphere,
    List<JsThreeLightUpsert> spots,
  })
  _selectLights(
    JsThreeFrameResources state,
    ThreeDrawPlanDiagnostics diagnostics,
  ) {
    final lights = state.lights.values.toList()
      ..sort((a, b) => a.lightId.compareTo(b.lightId));
    var ambientR = 0.0;
    var ambientG = 0.0;
    var ambientB = 0.0;
    final directional = <JsThreeLightUpsert>[];
    final points = <JsThreeLightUpsert>[];
    final hemisphere = <JsThreeLightUpsert>[];
    final spots = <JsThreeLightUpsert>[];
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
        case JsThreeLightType.hemisphere:
          if (hemisphere.length < maxHemisphereLights) {
            hemisphere.add(light);
          } else {
            diagnostics.droppedHemisphereLightCount++;
          }
        case JsThreeLightType.spot:
          if (spots.length < maxSpotLights) {
            spots.add(light);
          } else {
            diagnostics.droppedSpotLightCount++;
          }
      }
    }
    _warnDroppedLightCaps(diagnostics);
    return (
      ambient: (r: ambientR, g: ambientG, b: ambientB),
      directional: directional,
      points: points,
      hemisphere: hemisphere,
      spots: spots,
    );
  }

  void _warnDroppedLightCaps(ThreeDrawPlanDiagnostics diagnostics) {
    _warnLightCap(
      diagnostics,
      diagnostics.droppedDirectionalLightCount,
      maxDirectionalLights,
      'directional',
    );
    _warnLightCap(
      diagnostics,
      diagnostics.droppedPointLightCount,
      maxPointLights,
      'point',
    );
    _warnLightCap(
      diagnostics,
      diagnostics.droppedHemisphereLightCount,
      maxHemisphereLights,
      'hemisphere',
    );
    _warnLightCap(
      diagnostics,
      diagnostics.droppedSpotLightCount,
      maxSpotLights,
      'spot',
    );
  }

  void _warnLightCap(
    ThreeDrawPlanDiagnostics diagnostics,
    int dropped,
    int cap,
    String label,
  ) {
    if (dropped == 0) return;
    diagnostics.warn(
      '$label light cap $cap exceeded; '
      'dropped $dropped highest ids',
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
    hemisphereLights: const [],
    spotLights: const [],
    clippings: const {},
    textures: const {},
    renderTargets: const {},
    diagnostics: diagnostics,
    stream: const [],
  );

  void _collectDraws(
    JsThreeFrameResources state,
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

  Map<int, List<int>> _childrenByParent(JsThreeFrameResources state) {
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
    // Shared batch-shape validation: finite world matrix, a bare mesh
    // node, and instance matrix data sized to the instance count.
    if (!_batchShapeValid(context, node, batch)) return const [];

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

  bool _batchShapeValid(
    _DrawContext context,
    JsThreeNodeUpsert node,
    JsThreeDrawBatchUpsert batch,
  ) {
    final diagnostics = context.diagnostics;
    if (!_finiteMatrix(node.matrixWorld)) {
      diagnostics.invalidNodeCount++;
      diagnostics.warn('node ${node.nodeId} has an invalid world matrix');
      return false;
    }
    return _batchPayloadShapeValid(context, node, batch);
  }

  bool _batchPayloadShapeValid(
    _DrawContext context,
    JsThreeNodeUpsert node,
    JsThreeDrawBatchUpsert batch,
  ) {
    final diagnostics = context.diagnostics;
    // Points drawables may back a batch node too: the GLBufferAttribute
    // draw-range lane (webgl_buffergeometry_glbufferattribute) uploads the
    // full point set once and moves the visible window through a
    // non-instanced batch part (offset/count). The points primitive is
    // validated per part below exactly like mesh parts.
    if (node.geometryId != 0 ||
        node.materialId != 0 ||
        (node.objectKind != JsThreeObjectKind.mesh &&
            node.objectKind != JsThreeObjectKind.points)) {
      diagnostics.invalidBatchCount++;
      diagnostics.warn(
        'batch node ${node.nodeId} must be a mesh or points node with zero direct resources',
      );
      return false;
    }
    // NOTE: instance-matrix payload sizing is enforced at R1 decode time
    // (truncated batch instance matrices), so the planner only re-checks
    // the node shape and instance count here.
    return batch.instanceCount != 0;
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
    if (material.wireframe) {
      diagnostics.invalidBatchCount++;
      diagnostics.warn(
        'batch node ${node.nodeId} part $index uses unsupported wireframe',
      );
      return null;
    }
    final primitive = _primitiveFor(node, geometry, material, context.lineMode);
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
    // Transparent InstancedMesh parts are deliberately NOT rejected: they
    // join the transparent bucket and blend in one draw per part, sorted
    // among the other transparent draws at the node/material level.
    // Per-instance sorting inside a part is documented as out of scope —
    // see _compareTransparentDraws and the R1 instancing notes.
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
    final primitive = _primitiveFor(node, geometry, material, context.lineMode);
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
    if (material.wireframe && !geometry.hasWireIndices) {
      diagnostics.invalidGeometryCount++;
      diagnostics.warn(
        'geometry ${geometry.geometryId} lacks wireframe indices',
      );
      return null;
    }
    return (geometry: geometry, material: material);
  }

  void _checkMaterialMap(_DrawContext context, JsThreeMaterialUpsert material) {
    if (!context.checkedMaterials.add(material.materialId)) return;
    for (final (label, id) in <(String, int)>[
      ('map', material.mapTextureId),
      ('alphaMap', material.alphaMapTextureId),
      ('envMap', material.envMapTextureId),
      ('matcap', material.matcapTextureId),
      ('gradientMap', material.gradientMapTextureId),
      ('normalMap', material.normalMapTextureId),
      ('bumpMap', material.bumpMapTextureId),
      ('roughnessMap', material.roughnessMapTextureId),
      ('metalnessMap', material.metalnessMapTextureId),
      ('mapRight', material.mapRightTextureId),
    ]) {
      if (id != 0 &&
          !context.state.textures.containsKey(id) &&
          !context.state.renderTargets.containsKey(id)) {
        context.diagnostics.missingResourceCount++;
        context.diagnostics.warn(
          'material ${material.materialId} $label $id is '
          'missing; a white fallback will be used',
        );
      }
    }
  }

  ThreeDrawPrimitive? _primitiveFor(
    JsThreeNodeUpsert node,
    JsThreeGeometryUpsert geometry,
    JsThreeMaterialUpsert material,
    ThreeLineMode lineMode,
  ) => switch ((node.objectKind, geometry.primitive)) {
    (JsThreeObjectKind.mesh, JsThreePrimitive.triangles) =>
      material.wireframe
          ? ThreeDrawPrimitive.lines
          : ThreeDrawPrimitive.triangles,
    // Sprites render their shared unit quad billboarded in the vertex stage.
    (JsThreeObjectKind.sprite, JsThreePrimitive.triangles) =>
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
    JsThreeObjectKind.sprite =>
      // SpriteMaterial rides the unlit meshBasic shading path (R1 v5).
      material == JsThreeMaterialKind.meshBasic,
    JsThreeObjectKind.mesh => _meshMaterialKinds.contains(material),
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

  final JsThreeFrameResources state;
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
      _validateWireIndices(geometry) ??
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

String? _validateWireIndices(JsThreeGeometryUpsert geometry) {
  final indices = geometry.wireIndices;
  if (indices == null) return null;
  if (geometry.primitive != JsThreePrimitive.triangles) {
    return 'wire indices require triangle geometry';
  }
  if (indices.length % 2 != 0) return 'incomplete wireframe line';
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
  for (final index in geometry.wireIndices ?? const <int>[]) {
    if (index >= geometry.vertexCount) {
      return 'wire index $index exceeds vertex range';
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
    required this.wireIndices,
    required this.vertexCount,
    required this.indexCount,
  });

  static const int strideInBytes = 48;
  final ByteData vertices;
  final ByteData? indices;
  final ByteData? wireIndices;
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

  final indices = _interleaveThreeIndices(
    geometry.indices,
    geometry.indexCount,
  );
  final wireIndices = _interleaveThreeIndices(geometry.wireIndices);
  return ThreeInterleavedGeometry(
    vertices: vertices,
    indices: indices,
    wireIndices: wireIndices,
    vertexCount: geometry.vertexCount,
    indexCount: geometry.indexCount,
  );
}

ByteData? _interleaveThreeIndices(List<int>? source, [int? count]) {
  final length = count ?? source?.length ?? 0;
  if (source == null || length == 0) return null;
  final indices = ByteData(_product(length, 4));
  for (var index = 0; index < length; index++) {
    indices.setUint32(index * 4, source[index], Endian.little);
  }
  return indices;
}
