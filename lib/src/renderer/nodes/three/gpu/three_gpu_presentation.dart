part of '../flutter_gpu_three_backend.dart';


void _traceThreeShadow(String message) {
  if (_threeShadowTrace) debugPrint('[three-shadow-trace] $message');
}

String _threeShadowMatrixSummary(Float32List matrix) =>
    '[${matrix[0].toStringAsFixed(5)}, ${matrix[5].toStringAsFixed(5)}, '
    '${matrix[10].toStringAsFixed(5)}; '
    '${matrix[12].toStringAsFixed(5)}, ${matrix[13].toStringAsFixed(5)}, '
    '${matrix[14].toStringAsFixed(5)}]';

final class FlutterGpuThreeException implements Exception {
  const FlutterGpuThreeException(this.capability, this.detail);

  final String capability;
  final String detail;

  @override
  String toString() => 'three.gpu.$capability: $detail';
}

void _validateThreeSurfaceIds(String engineId, String surfaceId) {
  if (engineId.isEmpty || surfaceId.isEmpty) {
    throw ArgumentError('engineId and surfaceId must be nonempty');
  }
}

({gpu.Shader vertex, gpu.Shader fragment}) _requireThreeShaders(
  gpu.ShaderLibrary library,
  String asset,
) {
  final vertex = library['ThreeR1Vertex'];
  final fragment = library['ThreeR1Fragment'];
  if (vertex == null || fragment == null) {
    throw FlutterGpuThreeException(
      'shader',
      '$asset lacks ThreeR1Vertex/ThreeR1Fragment',
    );
  }
  return (vertex: vertex, fragment: fragment);
}

gpu.RenderPipeline _createThreePipeline(
  gpu.GpuContext context,
  ({gpu.Shader vertex, gpu.Shader fragment}) shaders,
) {
  try {
    return context.createRenderPipeline(
      shaders.vertex,
      shaders.fragment,
      vertexLayout: _threeVertexLayout(),
    );
  } catch (error) {
    throw FlutterGpuThreeException('pipeline', '$error');
  }
}

gpu.VertexLayout _threeVertexLayout() => gpu.VertexLayout(
  buffers: [
    gpu.VertexBuffer(
      strideInBytes: ThreeInterleavedGeometry.strideInBytes,
      attributes: const [
        gpu.VertexAttribute(
          name: 'position',
          format: gpu.VertexFormat.float32x3,
        ),
        gpu.VertexAttribute(
          name: 'normal',
          format: gpu.VertexFormat.float32x3,
          offsetInBytes: 12,
        ),
        gpu.VertexAttribute(
          name: 'uv',
          format: gpu.VertexFormat.float32x2,
          offsetInBytes: 24,
        ),
        gpu.VertexAttribute(
          name: 'color',
          format: gpu.VertexFormat.float32x4,
          offsetInBytes: 32,
        ),
      ],
    ),
    const gpu.VertexBuffer(
      strideInBytes: _threeInstanceStrideInBytes,
      stepMode: gpu.VertexStepMode.instance,
      attributes: [
        gpu.VertexAttribute(
          name: 'instanceModel0',
          format: gpu.VertexFormat.float32x4,
        ),
        gpu.VertexAttribute(
          name: 'instanceModel1',
          format: gpu.VertexFormat.float32x4,
          offsetInBytes: 16,
        ),
        gpu.VertexAttribute(
          name: 'instanceModel2',
          format: gpu.VertexFormat.float32x4,
          offsetInBytes: 32,
        ),
        gpu.VertexAttribute(
          name: 'instanceModel3',
          format: gpu.VertexFormat.float32x4,
          offsetInBytes: 48,
        ),
        gpu.VertexAttribute(
          name: 'instanceColor',
          format: gpu.VertexFormat.float32x4,
          offsetInBytes: 64,
        ),
      ],
    ),
  ],
);

({int offsetInBytes, int lengthInBytes}) _threeIndexRange(ThreeDrawItem draw) {
  final end = draw.indexOffset + draw.drawCount;
  final available = draw.wireframe
      ? draw.geometry.wireIndexCount
      : draw.geometry.indexCount;
  if (!draw.indexed ||
      draw.indexOffset < 0 ||
      draw.drawCount < 0 ||
      end > available) {
    throw ArgumentError('invalid indexed draw subrange');
  }
  return (
    offsetInBytes: draw.indexOffset * 4,
    lengthInBytes: draw.drawCount * 4,
  );
}

({int offsetInBytes, int lengthInBytes}) _threeVertexRange(ThreeDrawItem draw) {
  final end = draw.indexOffset + draw.drawCount;
  if (draw.indexed ||
      draw.indexOffset < 0 ||
      draw.drawCount < 0 ||
      end > draw.geometry.vertexCount) {
    throw ArgumentError('invalid non-indexed draw subrange');
  }
  return (
    offsetInBytes: draw.indexOffset * ThreeInterleavedGeometry.strideInBytes,
    lengthInBytes: draw.drawCount * ThreeInterleavedGeometry.strideInBytes,
  );
}

@visibleForTesting
gpu.VertexLayout debugThreeVertexLayout() => _threeVertexLayout();

@visibleForTesting
ByteData debugThreeIdentityInstanceData() => _threeIdentityInstanceData();

@visibleForTesting
ByteData debugThreeInstanceData(JsThreeDrawBatchUpsert source) =>
    _threeInstanceData(source);

@visibleForTesting
({int offsetInBytes, int lengthInBytes}) debugThreeIndexRange(
  ThreeDrawItem draw,
) => _threeIndexRange(draw);

@visibleForTesting
({int offsetInBytes, int lengthInBytes}) debugThreeVertexRange(
  ThreeDrawItem draw,
) => _threeVertexRange(draw);

@visibleForTesting
ByteData debugThreeVertexUniform(
  ThreeDrawItem draw,
  ThreeDrawPlan plan,
  double pointSizeScale, {
  double viewportHeight = 1,
  bool shadowPass = false,
}) => _threeVertexUniform(
  draw,
  plan,
  pointSizeScale,
  viewportHeight: viewportHeight,
  shadowPass: shadowPass,
);

@visibleForTesting
ByteData debugThreeFrameUniform(ThreeDrawPlan plan) => _threeFrameUniform(plan);

@visibleForTesting
ByteData debugThreeLightsUniform(ThreeDrawPlan plan) =>
    _threeLightsUniform(plan);

@visibleForTesting
ByteData debugThreeClippingUniform(
  ThreeDrawPlan plan,
  JsThreeMaterialUpsert material,
) => _threeClippingUniform(plan, material);

@visibleForTesting
ByteData debugThreeMaterialUniform(ThreeDrawItem draw, [ThreeDrawPlan? plan]) =>
    _threeMaterialUniform(draw, plan);

Future<gpu.ShaderLibrary> _loadThreeShaderLibrary(String asset) async {
  Object? firstError;
  for (final candidate in _threeShaderAssetCandidates(asset)) {
    final result = await _tryLoadThreeShader(candidate);
    final library = result.library;
    if (library != null) return library;
    firstError = result.error;
  }
  throw FlutterGpuThreeException(
    'shaderAsset',
    'Unable to load $asset ($firstError). Declare the shaderbundle as a '
        'Flutter asset in the embedding application.',
  );
}

Future<({gpu.ShaderLibrary? library, Object? error})> _tryLoadThreeShader(
  String candidate,
) async {
  try {
    final library = await gpu.ShaderLibrary.fromAsset(candidate);
    if (library != null) return (library: library, error: null);
    return (library: null, error: 'ShaderLibrary.fromAsset returned null');
  } catch (error) {
    return (library: null, error: error);
  }
}

List<String> _threeShaderAssetCandidates(String asset) {
  if (asset.startsWith('packages/')) return [asset];
  return [asset, 'packages/js_widget_runtime/$asset'];
}

Object? _threeRenderError(
  FlutterGpuThreeBackend backend,
  JsThreeSurfaceState state,
  int width,
  int height,
  double pointSizeScale,
) =>
    _threeLifecycleError(backend, state) ??
    _threeParameterError(width, height, pointSizeScale);

Object? _threeLifecycleError(
  FlutterGpuThreeBackend backend,
  JsThreeSurfaceState state,
) => _threeDisposedError(backend) ?? _threeSurfaceError(backend, state);

Object? _threeDisposedError(FlutterGpuThreeBackend backend) {
  if (backend._disposed) {
    return StateError('FlutterGpuThreeBackend is disposed');
  }
  return null;
}

Object? _threeSurfaceError(
  FlutterGpuThreeBackend backend,
  JsThreeSurfaceState state,
) {
  if (state.engineId != backend.engineId ||
      state.surfaceId != backend.surfaceId) {
    return ArgumentError(
      'state surface ${state.key} does not match '
      '${backend.engineId}/${backend.surfaceId}',
    );
  }
  return null;
}

Object? _threeParameterError(int width, int height, double pointSizeScale) =>
    _threeDimensionError(width, height) ??
    _threePointScaleError(pointSizeScale);

Object? _threeDimensionError(int width, int height) {
  if (width <= 0 || height <= 0) {
    return ArgumentError('render dimensions must be positive physical pixels');
  }
  return null;
}

Object? _threePointScaleError(double pointSizeScale) {
  if (!pointSizeScale.isFinite || pointSizeScale <= 0) {
    return ArgumentError('pointSizeScale must be positive');
  }
  return null;
}

const _threePrimitiveTypes = <ThreeDrawPrimitive, gpu.PrimitiveType>{
  ThreeDrawPrimitive.triangles: gpu.PrimitiveType.triangle,
  ThreeDrawPrimitive.lines: gpu.PrimitiveType.line,
  ThreeDrawPrimitive.lineStrip: gpu.PrimitiveType.lineStrip,
  ThreeDrawPrimitive.points: gpu.PrimitiveType.point,
};

const _threeCullModes = <JsThreeSide, gpu.CullMode>{
  JsThreeSide.front: gpu.CullMode.backFace,
  JsThreeSide.back: gpu.CullMode.frontFace,
  JsThreeSide.double: gpu.CullMode.none,
};

const _threeDepthCompare = <bool, gpu.CompareFunction>{
  true: gpu.CompareFunction.lessEqual,
  false: gpu.CompareFunction.always,
};

bool _threeBlendEnable(JsThreeMaterialUpsert material) {
  // THREE NoBlending=0 / Normal=1: opaque normal materials keep blending
  // disabled; every other mode is a real blend request.
  if (material.blending == 0) return false;
  if (material.blending == 1) return material.transparent;
  return true;
}

final List<gpu.ColorBlendEquation> _threeBlendEquations = [
  // 0 NoBlending / 1 NormalBlending (index 0 is unused when disabled).
  ..._threeNormalBlendEquationPair,
  // 2 AdditiveBlending: SrcAlpha, One.
  ..._threeAdditiveBlendEquationPair,
  // 3 SubtractiveBlending: Zero, OneMinusSrcColor.
  ..._threeSubtractiveBlendEquationPair,
  // 4 MultiplyBlending: Zero, SrcColor.
  ..._threeMultiplyBlendEquationPair,
];

final _threeNormalBlendEquationPair = [
  gpu.ColorBlendEquation(
    sourceColorBlendFactor: gpu.BlendFactor.sourceAlpha,
    destinationColorBlendFactor: gpu.BlendFactor.oneMinusSourceAlpha,
    sourceAlphaBlendFactor: gpu.BlendFactor.one,
    destinationAlphaBlendFactor: gpu.BlendFactor.oneMinusSourceAlpha,
  ),
  gpu.ColorBlendEquation(
    sourceColorBlendFactor: gpu.BlendFactor.sourceAlpha,
    destinationColorBlendFactor: gpu.BlendFactor.oneMinusSourceAlpha,
    sourceAlphaBlendFactor: gpu.BlendFactor.one,
    destinationAlphaBlendFactor: gpu.BlendFactor.oneMinusSourceAlpha,
  ),
];
final _threeAdditiveBlendEquationPair = [
  gpu.ColorBlendEquation(
    sourceColorBlendFactor: gpu.BlendFactor.sourceAlpha,
    destinationColorBlendFactor: gpu.BlendFactor.one,
    sourceAlphaBlendFactor: gpu.BlendFactor.one,
    destinationAlphaBlendFactor: gpu.BlendFactor.one,
  ),
];
final _threeSubtractiveBlendEquationPair = [
  gpu.ColorBlendEquation(
    sourceColorBlendFactor: gpu.BlendFactor.zero,
    destinationColorBlendFactor: gpu.BlendFactor.oneMinusSourceColor,
    sourceAlphaBlendFactor: gpu.BlendFactor.zero,
    destinationAlphaBlendFactor: gpu.BlendFactor.oneMinusSourceAlpha,
  ),
];
final _threeMultiplyBlendEquationPair = [
  gpu.ColorBlendEquation(
    sourceColorBlendFactor: gpu.BlendFactor.zero,
    destinationColorBlendFactor: gpu.BlendFactor.sourceColor,
    sourceAlphaBlendFactor: gpu.BlendFactor.zero,
    destinationAlphaBlendFactor: gpu.BlendFactor.sourceAlpha,
  ),
];

gpu.ColorBlendEquation _threeBlendEquation(JsThreeMaterialUpsert material) =>
    _threeBlendEquations[material.blending <= 4 ? material.blending : 1];

gpu.CullMode _threeCull(ThreeDrawItem draw) {
  if (draw.primitive != ThreeDrawPrimitive.triangles) return gpu.CullMode.none;
  return _threeCullModes[draw.material.side]!;
}

const _threeShadowCullModes = <JsThreeSide, gpu.CullMode>{
  JsThreeSide.front: gpu.CullMode.frontFace,
  JsThreeSide.back: gpu.CullMode.backFace,
  JsThreeSide.double: gpu.CullMode.none,
};

gpu.CullMode _threeShadowCull(ThreeDrawItem draw) =>
    _threeShadowCullModes[draw.material.side]!;

gpu.Texture _createThreeFallbackTexture(gpu.GpuContext context) {
  final texture = context.createTexture(
    gpu.StorageMode.devicePrivate,
    1,
    1,
    enableRenderTargetUsage: false,
  );
  texture.overwrite(
    ByteData.sublistView(Uint8List.fromList([255, 255, 255, 255])),
  );
  return texture;
}

bool _threeTargetsMatch(
  FlutterGpuThreeBackend backend,
  int width,
  int height,
) =>
    backend._imageSurface != null &&
    backend._width == width &&
    backend._height == height;

gpu.PixelFormat _validateThreeTargetFormats(gpu.GpuContext context) {
  const format = gpu.PixelFormat.r8g8b8a8UNormInt;
  if (!context.supportsTextureFormat(format, renderTarget: true)) {
    throw const FlutterGpuThreeException(
      'renderTarget',
      'RGBA8 offscreen color targets are unsupported',
    );
  }
  final depthFormat = context.defaultDepthStencilFormat;
  if (depthFormat == gpu.PixelFormat.unknown) {
    throw const FlutterGpuThreeException(
      'depthTarget',
      'no depth/stencil format is available',
    );
  }
  return depthFormat;
}

void _resizeThreeImageSurface(
  FlutterGpuThreeBackend backend,
  int width,
  int height,
) {
  final surface = backend._imageSurface;
  if (surface == null) {
    backend._imageSurface = backend._context.createImageSurface(
      width,
      height,
      format: gpu.PixelFormat.r8g8b8a8UNormInt,
    );
  } else {
    surface.resize(width, height);
  }
}

void _ensureThreeTargets(
  FlutterGpuThreeBackend backend,
  int width,
  int height,
) {
  if (_threeTargetsMatch(backend, width, height)) return;
  final depthFormat = _validateThreeTargetFormats(backend._context);
  _resizeThreeImageSurface(backend, width, height);
  backend._depthTexture = backend._context.createTexture(
    gpu.StorageMode.devicePrivate,
    width,
    height,
    format: depthFormat,
    enableShaderReadUsage: false,
  );
  backend._width = width;
  backend._height = height;
  backend._resizeCount++;
}

bool _threeShadowTargetsMatch(
  FlutterGpuThreeBackend backend,
  int width,
  int height,
) =>
    backend._shadowColorTexture != null &&
    backend._shadowWidth == width &&
    backend._shadowHeight == height;

bool _threeShadowFormatSupported(gpu.GpuContext context) {
  const format = gpu.PixelFormat.r32Float;
  return context.supportsTextureFormat(format, renderTarget: true) &&
      context.supportsTextureFormat(format, shaderRead: true);
}

bool _ensureThreeShadowTargets(
  FlutterGpuThreeBackend backend,
  int width,
  int height,
) {
  if (_threeShadowTargetsMatch(backend, width, height)) return true;
  const format = gpu.PixelFormat.r32Float;
  final context = backend._context;
  if (!_threeShadowFormatSupported(context)) return false;
  backend._shadowColorTexture = context.createTexture(
    gpu.StorageMode.devicePrivate,
    width,
    height,
    format: format,
    enableRenderTargetUsage: true,
    enableShaderReadUsage: true,
  );
  backend._shadowDepthTexture = context.createTexture(
    gpu.StorageMode.deviceTransient,
    width,
    height,
    format: context.defaultDepthStencilFormat,
    enableShaderReadUsage: false,
  );
  backend._shadowWidth = width;
  backend._shadowHeight = height;
  return true;
}

// R1 v5 point-light dual-paraboloid targets: one R32Float color + depth
// pair per hemisphere face; both are sampled by the main pass.
bool _threePointShadowTargetsMatch(
  FlutterGpuThreeBackend backend,
  int width,
  int height,
) =>
    backend._pointShadowFrontColorTexture != null &&
    backend._pointShadowWidth == width &&
    backend._pointShadowHeight == height;

(gpu.Texture, gpu.Texture) _createThreePointShadowFace(
  gpu.GpuContext context,
  int width,
  int height,
) {
  final color = context.createTexture(
    gpu.StorageMode.devicePrivate,
    width,
    height,
    format: gpu.PixelFormat.r32Float,
    enableRenderTargetUsage: true,
    enableShaderReadUsage: true,
  );
  final depth = context.createTexture(
    gpu.StorageMode.deviceTransient,
    width,
    height,
    format: context.defaultDepthStencilFormat,
    enableShaderReadUsage: false,
  );
  return (color, depth);
}

bool _ensureThreePointShadowTargets(
  FlutterGpuThreeBackend backend,
  int width,
  int height,
) {
  if (_threePointShadowTargetsMatch(backend, width, height)) return true;
  if (!_threeShadowFormatSupported(backend._context)) return false;
  final context = backend._context;
  final (frontColor, frontDepth) = _createThreePointShadowFace(
    context,
    width,
    height,
  );
  final (backColor, backDepth) = _createThreePointShadowFace(
    context,
    width,
    height,
  );
  backend._pointShadowFrontColorTexture = frontColor;
  backend._pointShadowFrontDepthTexture = frontDepth;
  backend._pointShadowBackColorTexture = backColor;
  backend._pointShadowBackDepthTexture = backDepth;
  backend._pointShadowWidth = width;
  backend._pointShadowHeight = height;
  return true;
}

({int x, int y, int width, int height}) _threePassRectangle(
  JsThreeSubmitFrame frame,
  bool scissor,
  int attachmentWidth,
  int attachmentHeight,
  double pixelRatio,
) {
  if (!scissor && !frame.hasViewport) {
    return (x: 0, y: 0, width: attachmentWidth, height: attachmentHeight);
  }
  final scale = frame.renderTargetId == 0 ? pixelRatio : 1.0;
  final x = ((scissor ? frame.scissorX : frame.viewportX) * scale).round();
  final y = ((scissor ? frame.scissorY : frame.viewportY) * scale).round();
  final width = ((scissor ? frame.scissorWidth : frame.viewportWidth) * scale)
      .round();
  final height =
      ((scissor ? frame.scissorHeight : frame.viewportHeight) * scale).round();
  final left = x.clamp(0, attachmentWidth);
  final top = (attachmentHeight - y - height).clamp(0, attachmentHeight);
  return (
    x: left,
    y: top,
    width: width.clamp(0, attachmentWidth - left),
    height: height.clamp(0, attachmentHeight - top),
  );
}

gpu.Viewport _threePassViewport(
  JsThreeSubmitFrame frame,
  int width,
  int height,
  double pixelRatio,
) {
  final rect = _threePassRectangle(frame, false, width, height, pixelRatio);
  return gpu.Viewport(
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  );
}

gpu.Scissor? _threePassScissor(
  JsThreeSubmitFrame frame,
  int width,
  int height,
  double pixelRatio,
) {
  if (!frame.scissorTest) return null;
  final rect = _threePassRectangle(frame, true, width, height, pixelRatio);
  return gpu.Scissor(
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  );
}

@visibleForTesting
gpu.Viewport debugThreePassViewport(
  JsThreeSubmitFrame frame,
  int width,
  int height,
  double pixelRatio,
) => _threePassViewport(frame, width, height, pixelRatio);

@visibleForTesting
gpu.Scissor? debugThreePassScissor(
  JsThreeSubmitFrame frame,
  int width,
  int height,
  double pixelRatio,
) => _threePassScissor(frame, width, height, pixelRatio);

gpu.RenderPass _configureThreePass(
  gpu.RenderPass pass,
  ThreeDrawPlan plan,
  int width,
  int height,
  double pixelRatio,
) {
  final frame = plan.frame!;
  pass.setViewport(_threePassViewport(frame, width, height, pixelRatio));
  final scissor = _threePassScissor(frame, width, height, pixelRatio);
  if (scissor != null) pass.setScissor(scissor);
  return pass
    ..setWindingOrder(gpu.WindingOrder.counterClockwise)
    ..setColorBlendEquation(
      gpu.ColorBlendEquation(
        sourceColorBlendFactor: gpu.BlendFactor.sourceAlpha,
        destinationColorBlendFactor: gpu.BlendFactor.oneMinusSourceAlpha,
        sourceAlphaBlendFactor: gpu.BlendFactor.one,
        destinationAlphaBlendFactor: gpu.BlendFactor.oneMinusSourceAlpha,
      ),
    );
}

double _threeClearChannel(double value, bool offscreen) =>
    offscreen ? value : _linearToSrgbUnit(value);

vm.Vector4 _threeClearValue(ThreeDrawPlan plan) {
  final background = plan.background;
  final offscreen = plan.frame!.renderTargetId != 0;
  return vm.Vector4(
    _threeClearChannel(background.r, offscreen),
    _threeClearChannel(background.g, offscreen),
    _threeClearChannel(background.b, offscreen),
    background.a,
  );
}

gpu.DepthStencilAttachment _threeDepthAttachment(
  gpu.Texture texture,
  bool clear,
) => gpu.DepthStencilAttachment(
  texture: texture,
  depthLoadAction: clear ? gpu.LoadAction.clear : gpu.LoadAction.load,
  depthStoreAction: gpu.StoreAction.store,
  depthClearValue: 1,
);

gpu.RenderPass _createThreeRenderPass(
  FlutterGpuThreeBackend backend,
  ThreeDrawPlan plan,
  gpu.GpuImageSurfaceFrame surfaceFrame,
  gpu.CommandBuffer command,
  double pixelRatio,
) {
  final frame = plan.frame!;
  final pass = command.createRenderPass(
    gpu.RenderTarget.singleColor(
      gpu.ColorAttachment(
        texture: surfaceFrame.colorTexture,
        loadAction: frame.clearColor
            ? gpu.LoadAction.clear
            : gpu.LoadAction.load,
        clearValue: _threeClearValue(plan),
      ),
      depthStencilAttachment: _threeDepthAttachment(
        backend._depthTexture!,
        frame.clearDepth,
      ),
    ),
  );
  return _configureThreePass(
    pass,
    plan,
    backend._width,
    backend._height,
    pixelRatio,
  );
}

gpu.RenderPass _createThreeTargetPass(
  ThreeDrawPlan plan,
  _GpuRenderTarget target,
  gpu.CommandBuffer command,
  double pixelRatio,
) {
  final frame = plan.frame!;
  final depth = target.depth;
  final pass = command.createRenderPass(
    gpu.RenderTarget.singleColor(
      gpu.ColorAttachment(
        texture: target.color,
        loadAction: frame.clearColor
            ? gpu.LoadAction.clear
            : gpu.LoadAction.load,
        clearValue: _threeClearValue(plan),
      ),
      depthStencilAttachment: depth == null
          ? null
          : _threeDepthAttachment(depth, frame.clearDepth),
    ),
  );
  return _configureThreePass(
    pass,
    plan,
    target.source.width,
    target.source.height,
    pixelRatio,
  );
}

void _submitThreeFrame(
  FlutterGpuThreeBackend backend,
  gpu.CommandBuffer command,
) {
  backend._pendingPresentations++;
  final sequence = backend._lastSequence;
  _traceThreeShadow('main submit sequence=$sequence');
  command.submit(
    completionCallback: (success) {
      _traceThreeShadow('main complete sequence=$sequence success=$success');
      _threePresentationCompleted(backend, success);
    },
  );
}

void _submitThreeShadow(
  FlutterGpuThreeBackend backend,
  gpu.CommandBuffer command,
) {
  final sequence = backend._lastSequence;
  _traceThreeShadow('shadow submit sequence=$sequence');
  command.submit(
    completionCallback: (success) {
      _traceThreeShadow('shadow complete sequence=$sequence success=$success');
      if (!success) {
        backend._shadowMapValid = false;
        backend._cachedShadowKey = null;
        backend._failedPresentationCount++;
        backend._note('shadow command buffer completion reported failure');
      }
    },
  );
}

void _threePresentationCompleted(FlutterGpuThreeBackend backend, bool success) {
  if (backend._pendingPresentations > 0) backend._pendingPresentations--;
  if (!success) {
    backend._shadowMapValid = false;
    backend._cachedShadowKey = null;
    backend._failedPresentationCount++;
    backend._note('GPU command buffer completion reported failure');
  }
  _releaseThreePresentationWaiters(backend);
}

void _releaseThreePresentationWaiters(FlutterGpuThreeBackend backend) {
  final waiters = List<Completer<void>>.from(backend._presentationWaiters);
  backend._presentationWaiters.clear();
  for (final waiter in waiters) {
    if (!waiter.isCompleted) waiter.complete();
  }
}

ui.Image _finishThreeFrame(
  FlutterGpuThreeBackend backend,
  gpu.GpuImageSurface surface,
  int recordedDraws,
) {
  final image = surface.currentImage;
  if (image == null) {
    throw StateError('presented image surface returned null');
  }
  backend._renderedDrawCount += recordedDraws;
  backend._currentImage?.dispose();
  backend._currentImage = image;
  return image;
}

void _failThreePresentation(
  FlutterGpuThreeBackend backend,
  gpu.GpuImageSurfaceFrame surfaceFrame,
  gpu.CommandBuffer? command,
  bool presented,
  Object error,
) {
  if (!presented) {
    surfaceFrame.discard();
  } else if (command != null) {
    _failPresentedThreeFrame(backend, command);
  }
  backend._failedPresentationCount++;
  backend._note('frame recording/presentation failed: $error');
}

void _failPresentedThreeFrame(
  FlutterGpuThreeBackend backend,
  gpu.CommandBuffer command,
) {
  if (command.submitted) return;
  _abandonUnsubmittedThreeFrame(backend);
}

void _abandonUnsubmittedThreeFrame(FlutterGpuThreeBackend backend) {
  // present() retains an unsubmitted command buffer in GpuImageSurface.
  // Replace that poisoned surface before the next acquisition.
  if (backend._pendingPresentations > 0) backend._pendingPresentations--;
  backend._imageSurface = null;
}

