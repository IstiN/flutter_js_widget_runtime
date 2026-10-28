import 'dart:async';
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter_gpu/gpu.dart' as gpu;
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:meta/meta.dart';
import 'package:vector_math/vector_math.dart' as vm;

part 'gpu/three_gpu_resources.dart';

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
      strideInBytes: 64,
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
      ],
    ),
  ],
);

ByteData _threeIdentityInstanceData() {
  final data = ByteData(64);
  for (final index in [0, 5, 10, 15]) {
    data.setFloat32(index * 4, 1, Endian.little);
  }
  return data;
}

ByteData _threeInstanceData(JsThreeDrawBatchUpsert source) {
  final expected = source.instanceCount * 16;
  if (!source.instanced || source.instanceMatrices.length != expected) {
    throw ArgumentError('invalid instanced batch matrix payload');
  }
  final data = ByteData(source.instanceCount * 64);
  _writeFloats(data, 0, source.instanceMatrices);
  return data;
}

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
ByteData debugThreeVertexUniform(
  ThreeDrawItem draw,
  ThreeDrawPlan plan,
  double pointSizeScale, {
  bool shadowPass = false,
}) => _threeVertexUniform(draw, plan, pointSizeScale, shadowPass: shadowPass);

@visibleForTesting
ByteData debugThreeFrameUniform(ThreeDrawPlan plan) => _threeFrameUniform(plan);

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

void _synchronizeThreeGeometry(
  FlutterGpuThreeBackend backend,
  JsThreeGeometryUpsert source,
) {
  final key = backend._key(source.geometryId);
  final cached = backend._geometries[key];
  if (cached != null && identical(cached.source, source)) {
    backend._geometryCacheHitCount++;
    return;
  }
  _countReusedThreeGeometry(backend, cached, source);
  _tryReplaceThreeGeometry(backend, key, source);
}

void _tryReplaceThreeGeometry(
  FlutterGpuThreeBackend backend,
  _ThreeResourceKey key,
  JsThreeGeometryUpsert source,
) {
  try {
    _replaceThreeGeometry(backend, key, source);
  } catch (error) {
    backend._geometryFailureCount++;
    backend._note('geometry ${source.geometryId} upload failed: $error');
  }
}

void _countReusedThreeGeometry(
  FlutterGpuThreeBackend backend,
  _GpuGeometry? cached,
  JsThreeGeometryUpsert source,
) {
  if (cached != null && source.version == cached.source.version) {
    backend._reusedResourceGenerationCount++;
  }
}

void _replaceThreeGeometry(
  FlutterGpuThreeBackend backend,
  _ThreeResourceKey key,
  JsThreeGeometryUpsert source,
) {
  final packed = interleaveThreeGeometry(source);
  final vertices = backend._context.createDeviceBufferWithCopy(packed.vertices);
  final indices = _createThreeIndices(backend._context, packed.indices);
  final wireIndices = _createThreeIndices(
    backend._context,
    packed.wireIndices,
  );
  backend._geometries[key] = _GpuGeometry(
    source,
    vertices,
    gpu.BufferView(
      vertices,
      offsetInBytes: 0,
      lengthInBytes: packed.vertices.lengthInBytes,
    ),
    indices.buffer,
    indices.view,
    wireIndices.buffer,
    wireIndices.view,
  );
  backend._geometryUploadCount++;
}

({gpu.DeviceBuffer? buffer, gpu.BufferView? view}) _createThreeIndices(
  gpu.GpuContext context,
  ByteData? data,
) {
  if (data == null) return (buffer: null, view: null);
  final buffer = context.createDeviceBufferWithCopy(data);
  return (
    buffer: buffer,
    view: gpu.BufferView(
      buffer,
      offsetInBytes: 0,
      lengthInBytes: data.lengthInBytes,
    ),
  );
}

bool _isCachedThreeBatch(_GpuBatch? cached, JsThreeDrawBatchUpsert source) =>
    cached != null && identical(cached.source, source);

void _countReusedThreeBatch(
  FlutterGpuThreeBackend backend,
  _GpuBatch? cached,
  JsThreeDrawBatchUpsert source,
) {
  if (cached != null && cached.source.version == source.version) {
    backend._reusedResourceGenerationCount++;
  }
}

void _synchronizeThreeBatch(
  FlutterGpuThreeBackend backend,
  JsThreeDrawBatchUpsert source,
) {
  final key = backend._key(source.nodeId);
  final cached = backend._batches[key];
  if (_isCachedThreeBatch(cached, source)) {
    backend._batchCacheHitCount++;
    return;
  }
  _countReusedThreeBatch(backend, cached, source);
  try {
    final packed = _threeInstanceData(source);
    final buffer = backend._context.createDeviceBufferWithCopy(packed);
    backend._batches[key] = _GpuBatch(
      source,
      buffer,
      gpu.BufferView(
        buffer,
        offsetInBytes: 0,
        lengthInBytes: packed.lengthInBytes,
      ),
    );
    backend._batchUploadCount++;
  } catch (error) {
    backend._batchFailureCount++;
    backend._note(
      'batch ${source.nodeId} v${source.version} upload failed: $error',
    );
  }
}

List<Future<void>> _threeTextureFutures(
  FlutterGpuThreeBackend backend,
  JsThreeSurfaceState state,
) {
  final pending = <Future<void>>[];
  for (final source in state.textures.values) {
    final future = _synchronizeThreeTexture(backend, state, source);
    if (future != null) pending.add(future);
  }
  return pending;
}

Future<void> _awaitThreeTextures(List<Future<void>> pending) async {
  if (pending.isNotEmpty) await Future.wait(pending);
}

Future<void>? _synchronizeThreeTexture(
  FlutterGpuThreeBackend backend,
  JsThreeSurfaceState state,
  JsThreeTextureUpsert source,
) {
  final key = backend._key(source.textureId);
  final cached = backend._textures[key];
  if (cached != null && identical(cached.requested, source)) {
    backend._textureCacheHitCount++;
    return cached.future;
  }
  return _startThreeTexture(backend, state, key, cached, source).future;
}

_GpuTexture _startThreeTexture(
  FlutterGpuThreeBackend backend,
  JsThreeSurfaceState state,
  _ThreeResourceKey key,
  _GpuTexture? cached,
  JsThreeTextureUpsert source,
) {
  _countReusedThreeTexture(backend, cached, source);
  final entry = cached ?? _GpuTexture();
  entry.requested = source;
  backend._textures[key] = entry;
  entry.future = backend._runTextureUpload(state, key, entry, source);
  return entry;
}

void _countReusedThreeTexture(
  FlutterGpuThreeBackend backend,
  _GpuTexture? cached,
  JsThreeTextureUpsert source,
) {
  if (cached != null && source.version == cached.requested!.version) {
    backend._reusedResourceGenerationCount++;
  }
}

void _beginThreeTextureDecode(FlutterGpuThreeBackend backend, bool encoded) {
  if (encoded) backend._pendingTextureDecodes++;
}

void _finishThreeTextureDecode(FlutterGpuThreeBackend backend, bool encoded) {
  if (encoded) backend._pendingTextureDecodes--;
}

Future<void> _attemptThreeTextureUpload(
  FlutterGpuThreeBackend backend,
  JsThreeSurfaceState state,
  _ThreeResourceKey key,
  _GpuTexture entry,
  JsThreeTextureUpsert source,
) async {
  try {
    final uploaded = await _uploadThreeTexture(backend, source);
    _installThreeTexture(backend, state, key, entry, source, uploaded);
  } catch (error) {
    _failThreeTexture(backend, state, key, entry, source, error);
  }
}

bool _isStaleThreeTexture(
  FlutterGpuThreeBackend backend,
  JsThreeSurfaceState state,
  _ThreeResourceKey key,
  _GpuTexture entry,
  JsThreeTextureUpsert source,
) =>
    backend._disposed ||
    _isReplacedThreeTexture(backend, key, entry, source) ||
    !identical(state.textures[source.textureId], source);

bool _isReplacedThreeTexture(
  FlutterGpuThreeBackend backend,
  _ThreeResourceKey key,
  _GpuTexture entry,
  JsThreeTextureUpsert source,
) =>
    !identical(backend._textures[key], entry) ||
    !identical(entry.requested, source);

void _installThreeTexture(
  FlutterGpuThreeBackend backend,
  JsThreeSurfaceState state,
  _ThreeResourceKey key,
  _GpuTexture entry,
  JsThreeTextureUpsert source,
  _UploadedTexture uploaded,
) {
  if (_isStaleThreeTexture(backend, state, key, entry, source)) {
    backend._staleTextureUploadCount++;
    return;
  }
  entry.uploaded = uploaded;
  entry.future = null;
  entry.error = null;
  backend._textureUploadCount++;
}

void _failThreeTexture(
  FlutterGpuThreeBackend backend,
  JsThreeSurfaceState state,
  _ThreeResourceKey key,
  _GpuTexture entry,
  JsThreeTextureUpsert source,
  Object error,
) {
  if (_isStaleThreeTexture(backend, state, key, entry, source)) {
    backend._staleTextureUploadCount++;
    return;
  }
  entry.future = null;
  entry.error = '$error';
  backend._textureFailureCount++;
  backend._note(
    'texture ${source.textureId} v${source.version} upload failed: $error',
  );
}

Future<_UploadedTexture> _uploadThreeTexture(
  FlutterGpuThreeBackend backend,
  JsThreeTextureUpsert source,
) async {
  final decoded = await _threeTexturePixels(backend, source);
  final pixels = _orientThreePixels(decoded, source.flipY);
  final mipCount = _threeTextureMipCount(
    backend,
    source,
    decoded.width,
    decoded.height,
  );
  final texture = _createThreeTexture(
    backend._context,
    decoded.width,
    decoded.height,
    mipCount,
    source.srgb,
  );
  _uploadThreeTextureLevels(
    texture,
    pixels,
    decoded.width,
    decoded.height,
    mipCount,
    source.srgb,
  );
  return _UploadedTexture(texture, source, mipCount);
}

Future<_DecodedPixels> _threeTexturePixels(
  FlutterGpuThreeBackend backend,
  JsThreeTextureUpsert source,
) async {
  if (source.encoding == JsThreeTextureEncoding.rawRgba8) {
    return _DecodedPixels(source.width, source.height, source.data);
  }
  final decoded = await _decodeThreeEncoded(source);
  _noteThreeDecodedDimensions(backend, source, decoded);
  return decoded;
}

Future<_DecodedPixels> _decodeThreeEncoded(JsThreeTextureUpsert source) async {
  final codec = await ui.instantiateImageCodec(source.data);
  try {
    final frame = await codec.getNextFrame();
    try {
      final image = frame.image;
      final data = await image.toByteData(format: ui.ImageByteFormat.rawRgba);
      if (data == null) throw StateError('decoded image has no RGBA bytes');
      return _DecodedPixels(
        image.width,
        image.height,
        data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes),
      );
    } finally {
      frame.image.dispose();
    }
  } finally {
    codec.dispose();
  }
}

void _noteThreeDecodedDimensions(
  FlutterGpuThreeBackend backend,
  JsThreeTextureUpsert source,
  _DecodedPixels decoded,
) {
  if (_threeDimensionsDiffer(source, decoded)) {
    backend._note(
      'texture ${source.textureId} encoded dimensions differ from metadata; '
      'using ${decoded.width}x${decoded.height}',
    );
  }
}

bool _threeDimensionsDiffer(
  JsThreeTextureUpsert source,
  _DecodedPixels decoded,
) =>
    _threeDimensionDiffers(source.width, decoded.width) ||
    _threeDimensionDiffers(source.height, decoded.height);

bool _threeDimensionDiffers(int expected, int actual) =>
    expected != 0 && expected != actual;

Uint8List _orientThreePixels(_DecodedPixels decoded, bool flipY) {
  if (flipY) {
    return _flipRows(decoded.pixels, decoded.width, decoded.height);
  }
  return decoded.pixels;
}

int _threeTextureMipCount(
  FlutterGpuThreeBackend backend,
  JsThreeTextureUpsert source,
  int width,
  int height,
) {
  if (!source.mipmaps) return 1;
  return _supportedThreeMipCount(backend, source, width, height);
}

int _supportedThreeMipCount(
  FlutterGpuThreeBackend backend,
  JsThreeTextureUpsert source,
  int width,
  int height,
) {
  final fullCount = gpu.Texture.fullMipCount(width, height);
  if (fullCount <= 1) return 1;
  if (backend._context.doesSupportManuallyMippedTextures) return fullCount;
  backend._mipmapFallbackCount++;
  backend._note(
    'texture ${source.textureId}: manual mip sampling unsupported; '
    'using base level',
  );
  return 1;
}

gpu.Texture _createThreeTexture(
  gpu.GpuContext context,
  int width,
  int height,
  int mipCount,
  bool srgb,
) {
  final format = srgb
      ? gpu.PixelFormat.r8g8b8a8UNormIntSRGB
      : gpu.PixelFormat.r8g8b8a8UNormInt;
  if (!context.supportsTextureFormat(format, shaderRead: true)) {
    throw FlutterGpuThreeException('textureFormat', '$format is unsupported');
  }
  return context.createTexture(
    gpu.StorageMode.devicePrivate,
    width,
    height,
    format: format,
    enableRenderTargetUsage: false,
    mipLevelCount: mipCount,
  );
}

void _uploadThreeTextureLevels(
  gpu.Texture texture,
  Uint8List pixels,
  int width,
  int height,
  int mipCount,
  bool srgb,
) {
  var levelPixels = pixels;
  var levelWidth = width;
  var levelHeight = height;
  for (var level = 0; level < mipCount; level++) {
    if (level != 0) {
      levelPixels = _downsample(levelPixels, levelWidth, levelHeight, srgb);
      levelWidth = texture.getMipLevelWidth(level);
      levelHeight = texture.getMipLevelHeight(level);
    }
    final data = ByteData.sublistView(levelPixels);
    _validateThreeMipSize(data, texture, level);
    texture.overwrite(data, mipLevel: level);
  }
}

void _validateThreeMipSize(ByteData data, gpu.Texture texture, int level) {
  if (data.lengthInBytes != texture.getMipLevelSizeInBytes(level)) {
    throw StateError('mip $level byte size mismatch');
  }
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
    this.map,
    this.shadowMap,
    this.vertex,
  );

  final gpu.UniformSlot frame;
  final gpu.UniformSlot lights;
  final gpu.UniformSlot material;
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
  const _ThreeFrameEncoder(this.backend, this.plan, this.pointSizeScale);

  final FlutterGpuThreeBackend backend;
  final ThreeDrawPlan plan;
  final double pointSizeScale;

  int record(gpu.RenderPass pass) {
    // Bind the pipeline before reflected uniforms for backends that validate
    // uniform and texture bindings against the active pipeline.
    pass.bindPipeline(backend._pipeline);
    final slots = _ThreeUniformSlots(
      backend._fragmentShader.getUniformSlot('FrameInfo'),
      backend._fragmentShader.getUniformSlot('Lights'),
      backend._fragmentShader.getUniformSlot('MaterialInfo'),
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
    return _recordShadowDraws(pass, vertexSlot);
  }

  int _recordShadowDraws(gpu.RenderPass pass, gpu.UniformSlot vertexSlot) {
    final frame = plan.frame!;
    var recordedDraws = 0;
    for (final draw in plan.draws) {
      if (frame.culledShadowNodeIds.contains(draw.node.nodeId)) continue;
      recordedDraws += _recordShadowDraw(pass, vertexSlot, draw);
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
      ..bindVertexBuffer(geometry.verticesView)
      ..bindVertexBuffer(resources.instances, slot: 1);
    _bindThreeIndices(pass, geometry, draw);
    _bindThreeUniform(
      backend,
      pass,
      vertexSlot,
      _threeVertexUniform(draw, plan, pointSizeScale, shadowPass: true),
    );
    _drawThreeGeometry(pass, draw, geometry);
    return 1;
  }

  int _recordDraw(
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
      ..bindVertexBuffer(geometry.verticesView)
      ..bindVertexBuffer(instances, slot: 1);
    _bindThreeIndices(pass, geometry, draw);
    _bindThreeDrawUniforms(
      backend,
      pass,
      slots,
      draw,
      plan,
      pointSizeScale,
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
  final batch = draw.batch;
  if (batch == null) return backend._identityInstanceView;
  if (!batch.instanced) return backend._identityInstanceView;
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
  final indices = draw.wireframe
      ? geometry.wireIndicesView
      : geometry.indicesView;
  if (indices == null) return;
  if (_isFullThreeIndexRange(draw, geometry)) {
    pass.bindIndexBuffer(indices, gpu.IndexType.int32);
    return;
  }
  final range = _threeIndexRange(draw);
  pass.bindIndexBuffer(
    gpu.BufferView(
      draw.wireframe ? geometry.wireIndices! : geometry.indices!,
      offsetInBytes: range.offsetInBytes,
      lengthInBytes: range.lengthInBytes,
    ),
    gpu.IndexType.int32,
  );
}

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

gpu.BufferView _emplaceThreeUniform(
  FlutterGpuThreeBackend backend,
  ByteData data,
) {
  final padded = debugThreeAlignedUniform(
    data,
    backend._context.minimumUniformByteAlignment,
  );
  final blockLength = backend._hostBuffer.blockLengthInBytes;
  if (backend._uniformOffset >= blockLength) backend._uniformOffset = 0;
  final fillerLength = debugThreeUniformFillerLength(
    backend._uniformOffset,
    padded.lengthInBytes,
    blockLength,
  );
  if (fillerLength > 0) {
    backend._hostBuffer.emplace(ByteData(fillerLength));
    backend._uniformOffset = 0;
  }
  backend._uniformOffset += padded.lengthInBytes;
  return backend._hostBuffer.emplace(padded);
}

void _bindThreeDrawUniforms(
  FlutterGpuThreeBackend backend,
  gpu.RenderPass pass,
  _ThreeUniformSlots slots,
  ThreeDrawItem draw,
  ThreeDrawPlan plan,
  double pointSizeScale,
  gpu.BufferView frameUniform,
  gpu.BufferView lightsUniform,
) {
  pass.bindUniform(
    slots.vertex,
    _emplaceThreeUniform(
      backend,
      _threeVertexUniform(draw, plan, pointSizeScale),
    ),
  );
  pass.bindUniform(slots.frame, frameUniform);
  pass.bindUniform(slots.lights, lightsUniform);
  pass.bindUniform(
    slots.material,
    _emplaceThreeUniform(backend, _threeMaterialUniform(draw)),
  );
  final binding = backend._textureBinding(draw.material.mapTextureId);
  pass.bindTexture(slots.map, binding.texture, sampler: binding.sampler());
}

gpu.BufferView _bindThreeUniform(
  FlutterGpuThreeBackend backend,
  gpu.RenderPass pass,
  gpu.UniformSlot slot,
  ByteData data,
) {
  final reflected = slot.sizeInBytes;
  if (reflected != data.lengthInBytes) {
    throw FlutterGpuThreeException(
      'shaderAbi',
      '${slot.uniformName} expects $reflected bytes, got ${data.lengthInBytes}',
    );
  }
  final view = _emplaceThreeUniform(backend, data);
  pass.bindUniform(slot, view);
  return view;
}

/// Converts the WebGL-style shadow UV matrix to Flutter GPU render-target UVs.
///
/// Impeller render targets have a top-left texel origin. Shadow rendering uses
/// the original matrix to produce clip coordinates; only the sampling matrix
/// used by the main pass flips V. Keeping the two matrices identical makes a
/// moving shadow camera sample a mirrored, incorrectly translated depth map.
@visibleForTesting
Float32List threeShadowSamplingMatrix(List<double> matrix) {
  final result = Float32List.fromList(matrix);
  result[1] = -result[1];
  result[5] = -result[5];
  result[9] = -result[9];
  result[13] = 1 - result[13];
  return result;
}

ByteData _threeVertexUniform(
  ThreeDrawItem draw,
  ThreeDrawPlan plan,
  double pointSizeScale, {
  bool shadowPass = false,
}) {
  // Impeller adds 32 bytes of trailing padding after the used 288 bytes.
  final data = ByteData(320);
  final frame = plan.frame!;
  _writeFloats(data, 0, draw.node.matrixWorld);
  _writeFloats(data, 64, plan.camera!.matrixWorldInverse);
  _writeFloats(data, 128, plan.camera!.projectionMatrix);
  _writeFloats(data, 192, [
    draw.material.pointSize * pointSizeScale,
    shadowPass ? 1 : 0,
    0,
    0,
  ]);
  final shadowMatrix = shadowPass
      ? frame.shadowMatrix
      : threeShadowSamplingMatrix(frame.shadowMatrix);
  _writeFloats(data, 208, shadowMatrix);
  _writeFloats(data, 272, [frame.shadowNormalBias, 0, 0, 0]);
  return data;
}

bool _threeShadowActive(bool enabled, JsThreeSubmitFrame frame) =>
    enabled && frame.hasShadow;

double _threeShadowTexelSize(bool active, int dimension) =>
    active ? 1 / dimension : 0;

ByteData _threeFrameUniform(ThreeDrawPlan plan, {bool shadowEnabled = true}) {
  final data = ByteData(96);
  final frame = plan.frame!;
  final camera = plan.cameraPosition;
  _writeFloats(data, 0, [camera.x, camera.y, camera.z, frame.exposure]);
  _writeFloats(data, 16, [plan.ambient.r, plan.ambient.g, plan.ambient.b, 1]);
  _writeFloats(data, 32, [
    plan.directionalLights.length.toDouble(),
    plan.pointLights.length.toDouble(),
    0,
    0,
  ]);
  _writeFloats(data, 48, [
    frame.fogColorR,
    frame.fogColorG,
    frame.fogColorB,
    frame.fogNear,
  ]);
  _writeFloats(data, 64, [frame.fogFar, frame.fogMode.index.toDouble(), 0, 0]);
  final shadowActive = _threeShadowActive(shadowEnabled, frame);
  _writeFloats(data, 80, [
    frame.shadowBias,
    _threeShadowTexelSize(shadowActive, frame.shadowMapWidth),
    _threeShadowTexelSize(shadowActive, frame.shadowMapHeight),
    frame.shadowRadius,
  ]);
  return data;
}

ByteData _threeLightsUniform(ThreeDrawPlan plan) {
  final data = ByteData(384);
  for (var index = 0; index < plan.directionalLights.length; index++) {
    final light = plan.directionalLights[index];
    _writeFloats(data, index * 16, [
      light.worldDirection[0],
      light.worldDirection[1],
      light.worldDirection[2],
      light.intensity,
    ]);
    _writeFloats(data, 64 + index * 16, [
      light.colorR,
      light.colorG,
      light.colorB,
      1,
    ]);
  }
  for (var index = 0; index < plan.pointLights.length; index++) {
    final light = plan.pointLights[index];
    _writeFloats(data, 128 + index * 16, [
      light.worldPosition[0],
      light.worldPosition[1],
      light.worldPosition[2],
      light.intensity,
    ]);
    _writeFloats(data, 256 + index * 16, [
      light.colorR,
      light.colorG,
      light.colorB,
      1,
    ]);
  }
  return data;
}

const _threeBooleanFloat = <bool, double>{false: 0, true: 1};

ByteData _threeMaterialUniform(ThreeDrawItem draw) {
  final material = draw.material;
  final data = ByteData(64);
  _writeFloats(data, 0, [
    material.colorR,
    material.colorG,
    material.colorB,
    material.opacity,
  ]);
  _writeFloats(data, 16, [
    material.roughness,
    material.metalness,
    material.alphaTest,
    material.kind.wireValue.toDouble(),
  ]);
  _writeFloats(data, 32, [
    _threeBooleanFloat[material.vertexColors]!,
    _threeBooleanFloat[material.flatShading]!,
    _threeBooleanFloat[material.mapTextureId != 0]!,
    _threeBooleanFloat[draw.node.receiveShadow]!,
  ]);
  _writeFloats(data, 48, [
    material.specularR,
    material.specularG,
    material.specularB,
    material.shininess,
  ]);
  return data;
}

/// A native, per-surface JSR3D-R1 renderer.
///
/// [render] calls are serialized and never coalesced; a later JsThreeSurface
/// can coalesce presentation requests without losing state/resource updates.
/// At most two submitted command buffers are allowed to remain in flight.
int _threeFlag(bool value) => value ? 1 : 0;

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
    this.lineMode,
  ) {
    _fallbackTexture = _createThreeFallbackTexture(_context);
    _identityInstanceBuffer = _context.createDeviceBufferWithCopy(
      _threeIdentityInstanceData(),
    );
    _identityInstanceView = gpu.BufferView(
      _identityInstanceBuffer,
      offsetInBytes: 0,
      lengthInBytes: 64,
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
  final Map<_ThreeResourceKey, _GpuGeometry> _geometries = {};
  final Map<_ThreeResourceKey, _GpuTexture> _textures = {};
  final Map<_ThreeResourceKey, _GpuBatch> _batches = {};
  final List<String> _messages = <String>[];
  final List<Completer<void>> _presentationWaiters = [];
  final ThreeDrawPlanner _planner = const ThreeDrawPlanner();

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
    int contentRevision,
  ) {
    final surface = _imageSurface!;
    final surfaceFrame = surface.acquireNextFrame();
    final command = _context.createCommandBuffer();
    var presented = false;
    try {
      _shadowFrameActive = false;
      final encoder = _ThreeFrameEncoder(this, plan, pointSizeScale);
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
