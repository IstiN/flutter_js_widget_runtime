part of '../flutter_gpu_three_backend.dart';

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
  final wireIndices = _createThreeIndices(backend._context, packed.wireIndices);
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

gpu.Texture? _createThreeTargetDepth(
  gpu.GpuContext context,
  JsThreeRenderTargetUpsert source,
  gpu.PixelFormat format,
) {
  if (!source.hasDepth) return null;
  return context.createTexture(
    gpu.StorageMode.devicePrivate,
    source.width,
    source.height,
    format: format,
    enableShaderReadUsage: false,
  );
}

void _synchronizeThreeRenderTarget(
  FlutterGpuThreeBackend backend,
  JsThreeRenderTargetUpsert source,
) {
  final key = backend._key(source.targetId);
  final cached = backend._renderTargets[key];
  if (cached != null && identical(cached.source, source)) return;
  final context = backend._context;
  final depthFormat = _validateThreeTargetFormats(context);
  final color = context.createTexture(
    gpu.StorageMode.devicePrivate,
    source.width,
    source.height,
    format: gpu.PixelFormat.r8g8b8a8UNormInt,
    enableRenderTargetUsage: true,
    enableShaderReadUsage: true,
  );
  final depth = _createThreeTargetDepth(context, source, depthFormat);
  backend._renderTargets[key] = _GpuRenderTarget(source, color, depth);
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
    if (source.isCube) return _threeCubeAtlasPixels(source);
    return _DecodedPixels(source.width, source.height, source.data);
  }
  final decoded = await _decodeThreeEncoded(source);
  _noteThreeDecodedDimensions(backend, source, decoded);
  return decoded;
}

/// R1 v5 cube lane: repacks the six concatenated +X,-X,+Y,-Y,+Z,-Z RGBA8
/// faces into the 3x2 atlas the shader samples with major-axis selection
/// (row 0: +X,-X,+Y; row 1: -Y,+Z,-Z). Cube mipmaps would blend across
/// the atlas seams, so the native lane already drops the mipmap flag.
_DecodedPixels _threeCubeAtlasPixels(JsThreeTextureUpsert source) {
  final width = source.width;
  final height = source.height;
  final faceBytes = width * height * 4;
  final atlasWidth = width * 3;
  final atlasHeight = height * 2;
  final atlas = Uint8List(atlasWidth * atlasHeight * 4);
  for (var face = 0; face < 6; face++) {
    final column = face % 3;
    final row = face ~/ 3;
    for (var y = 0; y < height; y++) {
      final sourceOffset = face * faceBytes + y * width * 4;
      final targetOffset =
          (row * height + y) * atlasWidth * 4 + column * width * 4;
      atlas.setRange(
        targetOffset,
        targetOffset + width * 4,
        source.data,
        sourceOffset,
      );
    }
  }
  return _DecodedPixels(atlasWidth, atlasHeight, atlas);
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
  // Cube atlases never mipmap (cross-cell bleeding); the native lane also
  // clears the flag, this is defense in depth for hand-built streams.
  if (!source.mipmaps || source.isCube) return 1;
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
