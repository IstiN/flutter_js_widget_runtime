import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_gpu/gpu.dart' as gpu;
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:vector_math/vector_math.dart' as vm;

part 'gpu/three_gpu_auto_instances.dart';
part 'gpu/three_gpu_resource_sync.dart';
part 'gpu/three_gpu_resources.dart';
part 'gpu/three_gpu_uniforms.dart';

const _threeShadowTrace = bool.fromEnvironment('JSR_THREE_SHADOW_TRACE');

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
ByteData debugThreeMaterialUniform(ThreeDrawItem draw) =>
    _threeMaterialUniform(draw);

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
    gpu.StorageMode.deviceTransient,
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

gpu.RenderPass _createThreeRenderPass(
  FlutterGpuThreeBackend backend,
  ThreeDrawPlan plan,
  gpu.GpuImageSurfaceFrame surfaceFrame,
  gpu.CommandBuffer command,
) {
  final background = plan.background;
  final pass = command.createRenderPass(
    gpu.RenderTarget.singleColor(
      gpu.ColorAttachment(
        texture: surfaceFrame.colorTexture,
        clearValue: vm.Vector4(
          _linearToSrgbUnit(background.r),
          _linearToSrgbUnit(background.g),
          _linearToSrgbUnit(background.b),
          background.a,
        ),
      ),
      depthStencilAttachment: gpu.DepthStencilAttachment(
        texture: backend._depthTexture!,
        depthClearValue: 1,
      ),
    ),
  );
  return pass
    ..setViewport(gpu.Viewport(width: backend._width, height: backend._height))
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
  gpu.CommandBuffer command,
  bool presented,
  Object error,
) {
  if (!presented) {
    surfaceFrame.discard();
  } else {
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

final class _GpuBatch {
  const _GpuBatch(this.source, this.buffer, this.view);

  final JsThreeDrawBatchUpsert source;
  final gpu.DeviceBuffer buffer;
  final gpu.BufferView view;
}

final class _ThreeUniformSlots {
  const _ThreeUniformSlots(
    this.frame,
    this.lights,
    this.material,
    this.clipping,
    this.map,
    this.shadowMap,
    this.vertex,
  );

  final gpu.UniformSlot frame;
  final gpu.UniformSlot lights;
  final gpu.UniformSlot material;
  final gpu.UniformSlot clipping;
  final gpu.UniformSlot map;
  final gpu.UniformSlot shadowMap;
  final gpu.UniformSlot vertex;
}

_GpuGeometry? _threeGeometryForDraw(
  FlutterGpuThreeBackend backend,
  ThreeDrawItem draw,
) {
  final geometry = backend._geometries[backend._key(draw.geometry.geometryId)];
  if (geometry == null || !identical(geometry.source, draw.geometry)) {
    return null;
  }
  return geometry;
}

final class _ThreeFrameEncoder {
  const _ThreeFrameEncoder(
    this.backend,
    this.plan,
    this.pointSizeScale,
    this.viewportHeight,
  );

  final FlutterGpuThreeBackend backend;
  final ThreeDrawPlan plan;
  final double pointSizeScale;
  final double viewportHeight;

  int record(gpu.RenderPass pass) {
    // Bind the pipeline before reflected uniforms for backends that validate
    // uniform and texture bindings against the active pipeline.
    pass.bindPipeline(backend._pipeline);
    final slots = _ThreeUniformSlots(
      backend._fragmentShader.getUniformSlot('FrameInfo'),
      backend._fragmentShader.getUniformSlot('Lights'),
      backend._fragmentShader.getUniformSlot('MaterialInfo'),
      backend._fragmentShader.getUniformSlot('ClippingInfo'),
      backend._fragmentShader.getUniformSlot('mapTexture'),
      backend._fragmentShader.getUniformSlot('shadowMapTexture'),
      backend._vertexShader.getUniformSlot('VertexInfo'),
    );
    final frameUniform = _bindThreeUniform(
      backend,
      pass,
      slots.frame,
      _threeFrameUniform(plan, shadowEnabled: backend._shadowFrameActive),
    );
    final lightsUniform = _bindThreeUniform(
      backend,
      pass,
      slots.lights,
      _threeLightsUniform(plan),
    );
    pass.bindTexture(
      slots.shadowMap,
      backend._shadowFrameActive
          ? backend._shadowColorTexture!
          : backend._fallbackTexture,
    );
    var recordedDraws = 0;
    for (final draw in plan.mainDraws) {
      recordedDraws += _recordDraw(
        pass,
        slots,
        draw,
        frameUniform,
        lightsUniform,
      );
    }
    return recordedDraws;
  }

  int recordShadow(gpu.CommandBuffer command) {
    final frame = plan.frame!;
    if (!frame.hasShadow) return 0;
    if (!_prepareShadow(frame)) return 0;
    backend._shadowFrameActive = true;
    final pass = _createShadowPass(command, frame, backend._shadowPipeline!);
    final vertexSlot = backend._vertexShader.getUniformSlot('VertexInfo');
    final clippingSlot = _shadowClippingSlot(backend._shadowFragmentShader);
    return _recordShadowDraws(pass, vertexSlot, clippingSlot);
  }

  int _recordShadowDraws(
    gpu.RenderPass pass,
    gpu.UniformSlot vertexSlot,
    gpu.UniformSlot? clippingSlot,
  ) {
    final frame = plan.frame!;
    var recordedDraws = 0;
    for (final draw in plan.draws) {
      if (frame.culledShadowNodeIds.contains(draw.node.nodeId)) continue;
      recordedDraws += _recordShadowDraw(pass, vertexSlot, clippingSlot, draw);
    }
    return recordedDraws;
  }

  bool _prepareShadow(JsThreeSubmitFrame frame) {
    if (backend._shadowPipeline == null) {
      backend._note('directional shadow pipeline is unavailable');
      return false;
    }
    if (!_ensureThreeShadowTargets(
      backend,
      frame.shadowMapWidth,
      frame.shadowMapHeight,
    )) {
      backend._note('R32Float shadow render targets are unsupported');
      return false;
    }
    return true;
  }

  gpu.RenderPass _createShadowPass(
    gpu.CommandBuffer command,
    JsThreeSubmitFrame frame,
    gpu.RenderPipeline pipeline,
  ) {
    final pass = command.createRenderPass(
      gpu.RenderTarget.singleColor(
        gpu.ColorAttachment(
          texture: backend._shadowColorTexture!,
          clearValue: vm.Vector4(1, 1, 1, 1),
        ),
        depthStencilAttachment: gpu.DepthStencilAttachment(
          texture: backend._shadowDepthTexture!,
          depthClearValue: 1,
        ),
      ),
    );
    return pass
      ..bindPipeline(pipeline)
      ..setViewport(
        gpu.Viewport(
          width: frame.shadowMapWidth,
          height: frame.shadowMapHeight,
        ),
      )
      ..setWindingOrder(gpu.WindingOrder.counterClockwise)
      ..setPrimitiveType(gpu.PrimitiveType.triangle)
      ..setDepthCompareOperation(gpu.CompareFunction.lessEqual)
      ..setDepthWriteEnable(true)
      ..setColorBlendEnable(false);
  }

  bool _isShadowCaster(ThreeDrawItem draw) =>
      draw.node.castShadow && draw.primitive == ThreeDrawPrimitive.triangles;

  ({_GpuGeometry geometry, gpu.BufferView instances})? _shadowResources(
    ThreeDrawItem draw,
  ) {
    final geometry = _threeGeometryForDraw(backend, draw);
    final instances = _threeInstanceView(backend, draw);
    if (geometry == null || instances == null) return null;
    return (geometry: geometry, instances: instances);
  }

  int _recordShadowDraw(
    gpu.RenderPass pass,
    gpu.UniformSlot vertexSlot,
    gpu.UniformSlot? clippingSlot,
    ThreeDrawItem draw,
  ) {
    if (!_isShadowCaster(draw)) return 0;
    final resources = _shadowResources(draw);
    if (resources == null) {
      backend._skippedDrawCount++;
      return 0;
    }
    final geometry = resources.geometry;
    pass
      ..setCullMode(_threeShadowCull(draw))
      ..bindVertexBuffer(resources.instances, slot: 1);
    _bindThreeVertices(pass, geometry, draw);
    _bindThreeIndices(pass, geometry, draw);
    _bindThreeUniform(
      backend,
      pass,
      vertexSlot,
      _threeVertexUniform(
        draw,
        plan,
        pointSizeScale,
        viewportHeight: viewportHeight,
        shadowPass: true,
      ),
    );
    _bindShadowClipping(backend, pass, clippingSlot, plan, draw.material);
    _drawThreeGeometry(pass, draw, geometry);
    return 1;
  }  int _recordDraw(
    gpu.RenderPass pass,
    _ThreeUniformSlots slots,
    ThreeDrawItem draw,
    gpu.BufferView frameUniform,
    gpu.BufferView lightsUniform,
  ) {
    final geometry = _threeGeometryForDraw(backend, draw);
    if (geometry == null) {
      backend._skippedDrawCount++;
      backend._note(
        'node ${draw.node.nodeId} skipped: geometry upload unavailable',
      );
      return 0;
    }
    final instances = _threeInstanceView(backend, draw);
    if (instances == null) {
      backend._skippedDrawCount++;
      backend._note(
        'node ${draw.node.nodeId} skipped: instance upload unavailable',
      );
      return 0;
    }
    pass
      ..bindPipeline(backend._pipeline)
      ..setPrimitiveType(_threePrimitiveTypes[draw.primitive]!)
      ..setCullMode(_threeCull(draw))
      ..setDepthCompareOperation(_threeDepthCompare[draw.material.depthTest]!)
      ..setDepthWriteEnable(draw.material.depthWrite)
      ..setColorBlendEnable(draw.material.transparent)
      ..bindVertexBuffer(instances, slot: 1);
    _bindThreeVertices(pass, geometry, draw);
    _bindThreeIndices(pass, geometry, draw);
    _bindThreeDrawUniforms(
      backend,
      pass,
      slots,
      draw,
      plan,
      pointSizeScale,
      viewportHeight,
      frameUniform,
      lightsUniform,
    );
    _drawThreeGeometry(pass, draw, geometry);
    return 1;
  }
}

gpu.BufferView? _threeInstanceView(
  FlutterGpuThreeBackend backend,
  ThreeDrawItem draw,
) {
  if (draw.autoInstanced) return _threeAutoInstanceView(backend, draw);
  return _explicitBatchInstanceView(backend, draw);
}

gpu.BufferView? _explicitBatchInstanceView(
  FlutterGpuThreeBackend backend,
  ThreeDrawItem draw,
) {
  final batch = draw.batch;
  if (batch == null || !batch.instanced) {
    return backend._identityInstanceView;
  }
  final cached = backend._batches[backend._key(batch.nodeId)];
  return _uploadedThreeBatchView(cached, batch);
}

gpu.BufferView? _uploadedThreeBatchView(
  _GpuBatch? cached,
  JsThreeDrawBatchUpsert source,
) {
  if (cached == null || !identical(cached.source, source)) return null;
  return cached.view;
}

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
    matrix: frame.shadowMatrix,
  );

  final int contentRevision;
  final int width;
  final int height;
  final double bias;
  final double normalBias;
  final Float32List matrix;

  @override
  bool operator ==(Object other) {
    if (other is! ThreeShadowCacheKey) return false;
    if (contentRevision != other.contentRevision ||
        width != other.width ||
        height != other.height ||
        bias != other.bias ||
        normalBias != other.normalBias) {
      return false;
    }
    for (var index = 0; index < 16; index++) {
      if (matrix[index] != other.matrix[index]) return false;
    }
    return true;
  }

  @override
  int get hashCode => Object.hash(
    contentRevision,
    width,
    height,
    bias,
    normalBias,
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

final class FlutterGpuThreeBackend {
  FlutterGpuThreeBackend._(
    this.engineId,
    this.surfaceId,
    this._context,
    this._pipeline,
    this._vertexShader,
    this._fragmentShader,
    this._shadowPipeline,
    this._shadowFragmentShader,
    this.lineMode,
  ) {
    _fallbackTexture = _createThreeFallbackTexture(_context);
    _identityInstanceBuffer = _context.createDeviceBufferWithCopy(
      _threeIdentityInstanceData(),
    );
    _identityInstanceView = gpu.BufferView(
      _identityInstanceBuffer,
      offsetInBytes: 0,
      lengthInBytes: _threeInstanceStrideInBytes,
    );
  }

  static const String defaultShaderAsset = 'assets/three/three_r1.shaderbundle';
  static const int maxPendingPresentations = 2;

  final String engineId;
  final String surfaceId;
  final ThreeLineMode lineMode;
  final gpu.GpuContext _context;
  final gpu.RenderPipeline _pipeline;
  final gpu.Shader _vertexShader;
  final gpu.Shader _fragmentShader;
  final gpu.RenderPipeline? _shadowPipeline;
  final gpu.Shader? _shadowFragmentShader;
  final Map<_ThreeResourceKey, _GpuGeometry> _geometries = {};
  final Map<_ThreeResourceKey, _GpuTexture> _textures = {};
  final Map<_ThreeResourceKey, _GpuBatch> _batches = {};
  final Map<_ThreeAutoInstanceKey, _GpuAutoInstanceBatch> _autoInstanceBatches =
      {};
  final List<String> _messages = <String>[];
  final List<Completer<void>> _presentationWaiters = [];
  final ThreeDrawPlanner _planner = const ThreeDrawPlanner(autoInstance: true);

  late final gpu.HostBuffer _hostBuffer = _context.createHostBuffer();
  late final gpu.Texture _fallbackTexture;
  late final gpu.DeviceBuffer _identityInstanceBuffer;
  late final gpu.BufferView _identityInstanceView;
  gpu.GpuImageSurface? _imageSurface;
  gpu.Texture? _depthTexture;
  gpu.Texture? _shadowColorTexture;
  gpu.Texture? _shadowDepthTexture;
  ui.Image? _currentImage;
  ThreeDrawPlan? _lastPlan;
  Future<void> _renderTail = Future<void>.value();
  var _disposed = false;
  var _width = 0;
  var _height = 0;
  var _shadowWidth = 0;
  var _shadowHeight = 0;
  var _shadowFrameActive = false;
  var _shadowMapValid = false;
  ThreeShadowCacheKey? _cachedShadowKey;
  var _shadowCacheHitCount = 0;
  var _uniformOffset = 0;
  var _renderedShadowDrawCount = 0;
  var _pendingPresentations = 0;

  var _renderedFrameCount = 0;
  var _renderedDrawCount = 0;
  var _skippedDrawCount = 0;
  var _geometryUploadCount = 0;
  var _geometryCacheHitCount = 0;
  var _geometryFailureCount = 0;
  var _geometryEvictionCount = 0;
  var _batchUploadCount = 0;
  var _batchCacheHitCount = 0;
  var _batchFailureCount = 0;
  var _batchEvictionCount = 0;
  var _textureUploadCount = 0;
  var _textureCacheHitCount = 0;
  var _textureFailureCount = 0;
  var _textureEvictionCount = 0;
  var _staleTextureUploadCount = 0;
  var _pendingTextureDecodes = 0;
  var _mipmapFallbackCount = 0;
  var _reusedResourceGenerationCount = 0;
  var _resizeCount = 0;
  var _failedPresentationCount = 0;
  var _lastSequence = 0;

  static Future<FlutterGpuThreeBackend> create({
    required String engineId,
    required String surfaceId,
    gpu.GpuContext? context,
    String shaderAsset = defaultShaderAsset,
    ThreeLineMode lineMode = ThreeLineMode.lines,
  }) async {
    _validateThreeSurfaceIds(engineId, surfaceId);
    final resolvedContext = context ?? gpu.gpuContext;
    final library = await _loadThreeShaderLibrary(shaderAsset);
    final shaders = _requireThreeShaders(library, shaderAsset);
    final pipeline = _createThreePipeline(resolvedContext, shaders);
    final shadowFragment = library['ThreeR1ShadowFragment'];
    final shadowPipeline = shadowFragment == null
        ? null
        : _createThreePipeline(resolvedContext, (
            vertex: shaders.vertex,
            fragment: shadowFragment,
          ));
    return FlutterGpuThreeBackend._(
      engineId,
      surfaceId,
      resolvedContext,
      pipeline,
      shaders.vertex,
      shaders.fragment,
      shadowPipeline,
      shadowFragment,
      lineMode,
    );
  }

  bool get isDisposed => _disposed;
  ui.Image? get currentImage => _currentImage;
  ThreeDrawPlan? get lastPlan => _lastPlan;
  List<String> get diagnosticMessages => List.unmodifiable(_messages);

  Map<String, num> get diagnostics => {
    'renderedFrames': _renderedFrameCount,
    'renderedDraws': _renderedDrawCount,
    'renderedShadowDraws': _renderedShadowDrawCount,
    'shadowCacheHits': _shadowCacheHitCount,
    'shadowPipelineAvailable': _threeFlag(_shadowPipeline != null),
    'shadowMapWidth': _threeActiveDimension(_shadowFrameActive, _shadowWidth),
    'shadowMapHeight': _threeActiveDimension(_shadowFrameActive, _shadowHeight),
    'skippedDraws': _skippedDrawCount,
    'geometryUploads': _geometryUploadCount,
    'geometryCacheHits': _geometryCacheHitCount,
    'geometryFailures': _geometryFailureCount,
    'geometryEvictions': _geometryEvictionCount,
    'cachedGeometries': _geometries.length,
    'batchUploads': _batchUploadCount,
    'batchCacheHits': _batchCacheHitCount,
    'batchFailures': _batchFailureCount,
    'batchEvictions': _batchEvictionCount,
    'cachedBatches': _batches.length,
    'textureUploads': _textureUploadCount,
    'textureCacheHits': _textureCacheHitCount,
    'textureFailures': _textureFailureCount,
    'textureEvictions': _textureEvictionCount,
    'cachedTextures': _textures.length,
    'staleTextureUploads': _staleTextureUploadCount,
    'pendingTextureDecodes': _pendingTextureDecodes,
    'mipmapFallbacks': _mipmapFallbackCount,
    'reusedResourceGenerations': _reusedResourceGenerationCount,
    'resizes': _resizeCount,
    'pendingPresentations': _pendingPresentations,
    'failedPresentations': _failedPresentationCount,
    'surfaceBackingTextures': _imageSurface?.debugBackingTextureCount ?? 0,
    'lastSequence': _lastSequence,
    'width': _width,
    'height': _height,
    'lastPlannedOpaqueDraws': _lastPlan?.opaque.length ?? 0,
    'lastPlannedTransparentDraws': _lastPlan?.transparent.length ?? 0,
    'lastCulledShadowNodes': _lastPlan?.frame?.culledShadowNodeIds.length ?? 0,
    'lastDroppedDirectionalLights':
        _lastPlan?.diagnostics.droppedDirectionalLightCount ?? 0,
    'lastDroppedPointLights':
        _lastPlan?.diagnostics.droppedPointLightCount ?? 0,
    'lastDroppedHemisphereLights':
        _lastPlan?.diagnostics.droppedHemisphereLightCount ?? 0,
    'lastDroppedSpotLights': _lastPlan?.diagnostics.droppedSpotLightCount ?? 0,
  };

  /// Uploads current resources and renders [frame] (or state.currentFrame).
  ///
  /// Width and height are physical pixels. [pointSizeScale] is normally the
  /// device pixel ratio. The returned image is owned by this backend and stays
  /// valid until the next render/dispose; clone it to retain it independently.
  Future<ui.Image> render(
    JsThreeSurfaceState state, {
    required int width,
    required int height,
    JsThreeSubmitFrame? frame,
    double pointSizeScale = 1.0,
  }) {
    final validationError = _threeRenderError(
      this,
      state,
      width,
      height,
      pointSizeScale,
    );
    if (validationError != null) return Future.error(validationError);
    final result = _renderTail.then(
      (_) => _render(
        state,
        width: width,
        height: height,
        frame: frame,
        pointSizeScale: pointSizeScale,
      ),
    );
    _renderTail = result.then<void>(
      (_) {},
      onError: (Object error, StackTrace stackTrace) {},
    );
    return result;
  }

  Future<ui.Image> _render(
    JsThreeSurfaceState state, {
    required int width,
    required int height,
    required JsThreeSubmitFrame? frame,
    required double pointSizeScale,
  }) async {
    _checkDisposed();
    _lastSequence = state.lastSequence;
    final plan = _planner.plan(state, frame: frame, lineMode: lineMode);
    _lastPlan = plan;
    for (final warning in plan.diagnostics.warnings) {
      _note(warning);
    }

    // Resource reconciliation always runs, even when no presentable frame or
    // camera exists. Disposal/reuse therefore cannot strand a cached version.
    _synchronizeGeometries(state);
    _synchronizeBatches(state);
    await _synchronizeTextures(state);
    _checkDisposed();
    if (!plan.canRender) {
      throw ThreeDrawPlanException(
        'no renderable frame/camera: ${plan.diagnostics.warnings.join('; ')}',
      );
    }
    await _waitForPresentationSlot();
    _checkDisposed();
    _ensureThreeTargets(this, width, height);
    final image = _recordAndPresent(
      plan,
      pointSizeScale,
      height.toDouble(),
      state.contentRevision,
    );
    _renderedFrameCount++;
    return image;
  }

  void _synchronizeGeometries(JsThreeSurfaceState state) {
    _reconcileThreeRemoved(
      _geometries,
      state.geometries.keys,
      onRemove: () => _geometryEvictionCount++,
    );
    for (final source in state.geometries.values) {
      _synchronizeThreeGeometry(this, source);
    }
  }

  void _synchronizeBatches(JsThreeSurfaceState state) {
    _reconcileThreeRemoved(
      _batches,
      state.batches.keys,
      onRemove: () => _batchEvictionCount++,
    );
    for (final source in state.batches.values) {
      // A retained empty batch is a cache transition, not a GPU disposal.
      // Draw planning already excludes its ordinary zero-geometry node.
      if (source.instanceCount != 0) _synchronizeThreeBatch(this, source);
    }
  }

  Future<void> _synchronizeTextures(JsThreeSurfaceState state) {
    _reconcileThreeRemoved(
      _textures,
      state.textures.keys,
      onRemove: () => _textureEvictionCount++,
    );
    return _awaitThreeTextures(_threeTextureFutures(this, state));
  }

  Future<void> _runTextureUpload(
    JsThreeSurfaceState state,
    _ThreeResourceKey key,
    _GpuTexture entry,
    JsThreeTextureUpsert source,
  ) async {
    final encoded = source.encoding != JsThreeTextureEncoding.rawRgba8;
    _beginThreeTextureDecode(this, encoded);
    try {
      await _attemptThreeTextureUpload(this, state, key, entry, source);
    } finally {
      _finishThreeTextureDecode(this, encoded);
    }
  }

  Future<void> _waitForPresentationSlot() async {
    while (_pendingPresentations >= maxPendingPresentations) {
      final waiter = Completer<void>();
      _presentationWaiters.add(waiter);
      await waiter.future;
      _checkDisposed();
    }
  }

  bool _shadowNeedsUpdate(JsThreeSubmitFrame frame, int contentRevision) =>
      !_shadowMapValid ||
      _cachedShadowKey != ThreeShadowCacheKey.fromFrame(frame, contentRevision);

  void _cacheShadow(JsThreeSubmitFrame frame, int contentRevision) {
    _shadowMapValid = true;
    _cachedShadowKey = ThreeShadowCacheKey.fromFrame(frame, contentRevision);
  }

  void _recordShadow(
    _ThreeFrameEncoder encoder,
    JsThreeSubmitFrame frame,
    int contentRevision,
  ) {
    if (!frame.hasShadow) return;
    final needsUpdate = _shadowNeedsUpdate(frame, contentRevision);
    _traceThreeShadow(
      'frame sequence=$_lastSequence revision=${frame.shadowContentRevision} '
      'content=$contentRevision update=$needsUpdate '
      'matrix=${_threeShadowMatrixSummary(frame.shadowMatrix)} '
      'culled=${frame.culledShadowNodeIds.length}',
    );
    if (!needsUpdate) {
      _shadowFrameActive = true;
      _shadowCacheHitCount++;
      return;
    }
    _renderShadow(encoder, frame, contentRevision);
  }

  void _renderShadow(
    _ThreeFrameEncoder encoder,
    JsThreeSubmitFrame frame,
    int contentRevision,
  ) {
    final command = _context.createCommandBuffer();
    final draws = encoder.recordShadow(command);
    _renderedShadowDrawCount += draws;
    _traceThreeShadow('shadow recorded sequence=$_lastSequence draws=$draws');
    if (!_shadowFrameActive) return;
    _submitThreeShadow(this, command);
    _cacheShadow(frame, contentRevision);
  }

  ui.Image _recordAndPresent(
    ThreeDrawPlan plan,
    double pointSizeScale,
    double viewportHeight,
    int contentRevision,
  ) {
    final surface = _imageSurface!;
    final surfaceFrame = surface.acquireNextFrame();
    final command = _context.createCommandBuffer();
    var presented = false;
    try {
      _shadowFrameActive = false;
      final encoder = _ThreeFrameEncoder(
        this,
        plan,
        pointSizeScale,
        viewportHeight,
      );
      _prepareThreeAutoInstanceCache(this, plan);
      final frame = plan.frame!;
      _recordShadow(encoder, frame, contentRevision);
      final pass = _createThreeRenderPass(this, plan, surfaceFrame, command);
      final recordedDraws = encoder.record(pass);
      surfaceFrame.present(command);
      presented = true;
      _submitThreeFrame(this, command);
      return _finishThreeFrame(this, surface, recordedDraws);
    } catch (error) {
      _failThreePresentation(this, surfaceFrame, command, presented, error);
      rethrow;
    } finally {
      _uniformOffset = 0;
      _hostBuffer.reset();
    }
  }

  _TextureBinding _textureBinding(int id) {
    if (id == 0) return _TextureBinding(_fallbackTexture, null, 1);
    return _resolveThreeTextureBinding(this, id, _textures[_key(id)]);
  }

  _ThreeResourceKey _key(int id) => _ThreeResourceKey(engineId, surfaceId, id);

  void _note(String message) {
    if (_messages.contains(message)) return;
    if (_messages.length == 64) {
      _messages.removeAt(0);
    }
    _messages.add(message);
  }

  void _checkDisposed() {
    if (_disposed) throw StateError('FlutterGpuThreeBackend is disposed');
  }

  void dispose() {
    if (_disposed) return;
    _disposed = true;
    _geometries.clear();
    _textures.clear();
    _batches.clear();
    _autoInstanceBatches.clear();
    _depthTexture = null;
    _shadowColorTexture = null;
    _shadowDepthTexture = null;
    _shadowFrameActive = false;
    _shadowMapValid = false;
    _imageSurface = null;
    _currentImage?.dispose();
    _currentImage = null;
    _releaseThreePresentationWaiters(this);
  }
}
