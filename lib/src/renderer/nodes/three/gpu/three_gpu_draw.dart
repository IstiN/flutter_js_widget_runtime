part of '../flutter_gpu_three_backend.dart';

bool _usesFullThreeVertexRange(ThreeDrawItem draw, _GpuGeometry geometry) =>
    draw.indexed ||
    (draw.indexOffset == 0 && draw.drawCount == geometry.source.vertexCount);

void _bindThreeVertices(
  gpu.RenderPass pass,
  _GpuGeometry geometry,
  ThreeDrawItem draw,
) {
  if (_usesFullThreeVertexRange(draw, geometry)) {
    pass.bindVertexBuffer(geometry.verticesView);
    return;
  }
  final range = _threeVertexRange(draw);
  pass.bindVertexBuffer(
    gpu.BufferView(
      geometry.vertices,
      offsetInBytes: range.offsetInBytes,
      lengthInBytes: range.lengthInBytes,
    ),
  );
}

bool _isFullThreeIndexRange(ThreeDrawItem draw, _GpuGeometry geometry) =>
    draw.indexOffset == 0 &&
    draw.drawCount ==
        (draw.wireframe
            ? geometry.source.wireIndexCount
            : geometry.source.indexCount);

void _bindThreeIndices(
  gpu.RenderPass pass,
  _GpuGeometry geometry,
  ThreeDrawItem draw,
) {
  final indices = _threeIndexView(geometry, draw);
  if (indices == null) return;
  if (!_isFullThreeIndexRange(draw, geometry)) {
    _bindThreeIndexRange(pass, geometry, draw);
    return;
  }
  pass.bindIndexBuffer(indices, gpu.IndexType.int32);
}

gpu.BufferView? _threeIndexView(_GpuGeometry geometry, ThreeDrawItem draw) =>
    draw.wireframe ? geometry.wireIndicesView : geometry.indicesView;

void _bindThreeIndexRange(
  gpu.RenderPass pass,
  _GpuGeometry geometry,
  ThreeDrawItem draw,
) {
  final range = _threeIndexRange(draw);
  pass.bindIndexBuffer(
    gpu.BufferView(
      _threeIndexBuffer(geometry, draw),
      offsetInBytes: range.offsetInBytes,
      lengthInBytes: range.lengthInBytes,
    ),
    gpu.IndexType.int32,
  );
}

gpu.DeviceBuffer _threeIndexBuffer(_GpuGeometry geometry, ThreeDrawItem draw) =>
    draw.wireframe ? geometry.wireIndices! : geometry.indices!;

void _drawThreeGeometry(
  gpu.RenderPass pass,
  ThreeDrawItem draw,
  _GpuGeometry geometry,
) {
  final indexed = draw.wireframe
      ? geometry.wireIndicesView != null
      : geometry.indicesView != null;
  if (indexed) {
    pass.drawIndexed(draw.drawCount, instanceCount: draw.instanceCount);
  } else {
    pass.draw(draw.drawCount, instanceCount: draw.instanceCount);
  }
}

ByteData debugThreeAlignedUniform(ByteData data, int alignment) {
  if (alignment <= 0) throw ArgumentError.value(alignment, 'alignment');
  final alignedLength =
      ((data.lengthInBytes + alignment - 1) ~/ alignment) * alignment;
  if (alignedLength == data.lengthInBytes) return data;
  final padded = ByteData(alignedLength);
  padded.buffer.asUint8List().setRange(
    0,
    data.lengthInBytes,
    data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes),
  );
  return padded;
}

int debugThreeUniformFillerLength(
  int offset,
  int payloadLength,
  int blockLength,
) {
  if (offset < 0 || payloadLength < 0 || blockLength <= 0) {
    throw ArgumentError('invalid HostBuffer range');
  }
  if (offset >= blockLength || payloadLength > blockLength) return 0;
  final remaining = blockLength - offset;
  return payloadLength > remaining ? remaining : 0;
}

@visibleForTesting
final class ThreeShadowCacheKey {
  ThreeShadowCacheKey({
    required this.contentRevision,
    required this.width,
    required this.height,
    required this.bias,
    required this.normalBias,
    required this.pointFar,
    required List<double> matrix,
  }) : matrix = Float32List.fromList(matrix);

  factory ThreeShadowCacheKey.fromFrame(
    JsThreeSubmitFrame frame,
    int contentRevision,
  ) => ThreeShadowCacheKey(
    contentRevision: frame.shadowContentRevision ?? contentRevision,
    width: frame.shadowMapWidth,
    height: frame.shadowMapHeight,
    bias: frame.shadowBias,
    normalBias: frame.shadowNormalBias,
    // Point shadows normalize depth by 1/far, so far joins the key.
    pointFar: frame.hasPointShadow != 0 ? frame.pointShadowFar : 0,
    matrix: frame.shadowMatrix,
  );

  final int contentRevision;
  final int width;
  final int height;
  final double bias;
  final double normalBias;
  final double pointFar;
  final Float32List matrix;

  /// Field list for structural equality (keeps == complexity at bay; the
  /// matrix rides as its identity-free element hash).
  List<Object?> get _keyFields => [
    contentRevision,
    width,
    height,
    bias,
    normalBias,
    pointFar,
    Object.hashAll(matrix),
  ];

  @override
  bool operator ==(Object other) =>
      other is ThreeShadowCacheKey && listEquals(_keyFields, other._keyFields);

  @override
  int get hashCode => Object.hash(
    contentRevision,
    width,
    height,
    bias,
    normalBias,
    pointFar,
    Object.hashAll(matrix),
  );
}

/// A native, per-surface JSR3D-R1 renderer.
///
/// [render] calls are serialized and never coalesced; a later JsThreeSurface
/// can coalesce presentation requests without losing state/resource updates.
/// At most two submitted command buffers are allowed to remain in flight.
int _threeFlag(bool value) => value ? 1 : 0;

/// Resolves the shadow-pass ClippingInfo slot; null on legacy bundles.
gpu.UniformSlot? _shadowClippingSlot(gpu.Shader? shadowFragment) =>
    shadowFragment?.getUniformSlot('ClippingInfo');

/// Binds the per-material clipping uniform on the shadow pass when the
/// bundle exposes the slot (legacy bundles skip shadow clipping entirely).
void _bindShadowClipping(
  FlutterGpuThreeBackend backend,
  gpu.RenderPass pass,
  gpu.UniformSlot? clippingSlot,
  ThreeDrawPlan plan,
  JsThreeMaterialUpsert material,
) {
  final slot = clippingSlot;
  if (slot == null) return;
  _bindThreeUniform(backend, pass, slot, _threeClippingUniform(plan, material));
}

int _threeActiveDimension(bool active, int value) => active ? value : 0;
