part of '../flutter_gpu_three_backend.dart';

void _reconcileThreeRemoved<T>(
  Map<_ThreeResourceKey, T> cache,
  Iterable<int> retainedIds, {
  required void Function() onRemove,
}) {
  final retained = retainedIds.toSet();
  final remove = cache.keys.where((key) => !retained.contains(key.id)).toList();
  for (final key in remove) {
    cache.remove(key);
    onRemove();
  }
}

_TextureBinding _resolveThreeTextureBinding(
  FlutterGpuThreeBackend backend,
  int id,
  _GpuTexture? cached,
) {
  final uploaded = cached?.uploaded;
  if (uploaded == null) return _missingThreeTextureBinding(backend, id, cached);
  return _TextureBinding(uploaded.texture, uploaded.source, uploaded.mipCount);
}

_TextureBinding _missingThreeTextureBinding(
  FlutterGpuThreeBackend backend,
  int id,
  _GpuTexture? cached,
) {
  if (cached?.error != null) {
    backend._note('material map $id uses white after upload failure');
  }
  return _TextureBinding(backend._fallbackTexture, null, 1);
}

const _threeMinMagFilters = <bool, gpu.MinMagFilter>{
  true: gpu.MinMagFilter.nearest,
  false: gpu.MinMagFilter.linear,
};

const _threeAddressModes = <bool, gpu.SamplerAddressMode>{
  true: gpu.SamplerAddressMode.repeat,
  false: gpu.SamplerAddressMode.clampToEdge,
};

gpu.SamplerOptions _threeSampler(JsThreeTextureUpsert source, int mipCount) =>
    gpu.SamplerOptions(
      minFilter: _threeMinMagFilters[source.nearestMin]!,
      magFilter: _threeMinMagFilters[source.nearestMag]!,
      mipFilter: _threeMipFilter(mipCount, source.nearestMin),
      widthAddressMode: _threeAddressModes[source.repeatS]!,
      heightAddressMode: _threeAddressModes[source.repeatT]!,
    );

gpu.MipFilter _threeMipFilter(int mipCount, bool nearestMin) {
  if (mipCount <= 1) return gpu.MipFilter.nearest;
  if (nearestMin) return gpu.MipFilter.nearest;
  return gpu.MipFilter.linear;
}

final class _ThreeResourceKey {
  const _ThreeResourceKey(this.engineId, this.surfaceId, this.id);
  final String engineId;
  final String surfaceId;
  final int id;

  @override
  bool operator ==(Object other) =>
      other is _ThreeResourceKey &&
      (other.engineId, other.surfaceId, other.id) == (engineId, surfaceId, id);

  @override
  int get hashCode => Object.hash(engineId, surfaceId, id);
}

final class _GpuGeometry {
  const _GpuGeometry(
    this.source,
    this.vertices,
    this.verticesView,
    this.indices,
    this.indicesView,
  );
  final JsThreeGeometryUpsert source;
  final gpu.DeviceBuffer vertices;
  final gpu.BufferView verticesView;
  final gpu.DeviceBuffer? indices;
  final gpu.BufferView? indicesView;
}

final class _GpuTexture {
  JsThreeTextureUpsert? requested;
  _UploadedTexture? uploaded;
  Future<void>? future;
  String? error;
}

final class _UploadedTexture {
  const _UploadedTexture(this.texture, this.source, this.mipCount);
  final gpu.Texture texture;
  final JsThreeTextureUpsert source;
  final int mipCount;
}

final class _DecodedPixels {
  const _DecodedPixels(this.width, this.height, this.pixels);
  final int width;
  final int height;
  final Uint8List pixels;
}

final class _TextureBinding {
  const _TextureBinding(this.texture, this.source, this.mipCount);
  final gpu.Texture texture;
  final JsThreeTextureUpsert? source;
  final int mipCount;

  gpu.SamplerOptions sampler() {
    final source = this.source;
    if (source == null) return gpu.SamplerOptions();
    return _threeSampler(source, mipCount);
  }
}

void _writeFloats(ByteData data, int offset, List<double> values) {
  _validateThreeUniformWrite(data, offset, values);
  for (var index = 0; index < values.length; index++) {
    data.setFloat32(offset + index * 4, values[index], Endian.little);
  }
}

void _validateThreeUniformWrite(
  ByteData data,
  int offset,
  List<double> values,
) {
  if (offset < 0 || offset + values.length * 4 > data.lengthInBytes) {
    throw RangeError('uniform write exceeds ${data.lengthInBytes} bytes');
  }
}

Uint8List _flipRows(Uint8List source, int width, int height) {
  final stride = width * 4;
  final result = Uint8List(source.length);
  for (var row = 0; row < height; row++) {
    final from = row * stride;
    final to = (height - row - 1) * stride;
    result.setRange(to, to + stride, source, from);
  }
  return result;
}

int _threeMipExtent(int extent) => extent > 1 ? extent >> 1 : 1;

Uint8List _downsample(Uint8List source, int width, int height, bool srgb) {
  final nextWidth = _threeMipExtent(width);
  final nextHeight = _threeMipExtent(height);
  final result = Uint8List(nextWidth * nextHeight * 4);
  for (var y = 0; y < nextHeight; y++) {
    for (var x = 0; x < nextWidth; x++) {
      _downsampleThreeTexel(
        source,
        width,
        height,
        srgb,
        result,
        nextWidth,
        x,
        y,
      );
    }
  }
  return result;
}

void _downsampleThreeTexel(
  Uint8List source,
  int width,
  int height,
  bool srgb,
  Uint8List result,
  int nextWidth,
  int x,
  int y,
) {
  for (var channel = 0; channel < 4; channel++) {
    result[(y * nextWidth + x) * 4 + channel] = _downsampleThreeChannel(
      source,
      width,
      height,
      srgb,
      x,
      y,
      channel,
    );
  }
}

const _threeBoxOffsets = <({int x, int y})>[
  (x: 0, y: 0),
  (x: 1, y: 0),
  (x: 0, y: 1),
  (x: 1, y: 1),
];

int _downsampleThreeChannel(
  Uint8List source,
  int width,
  int height,
  bool srgb,
  int x,
  int y,
  int channel,
) {
  var sum = 0.0;
  var count = 0;
  for (final offset in _threeBoxOffsets) {
    final sample = _threeDownsampleSample(
      source,
      width,
      height,
      srgb,
      x * 2 + offset.x,
      y * 2 + offset.y,
      channel,
    );
    if (sample != null) {
      sum += sample;
      count++;
    }
  }
  final average = _encodeThreeDownsample(sum / count, srgb, channel);
  return (average.clamp(0.0, 1.0) * 255).round();
}

double? _threeDownsampleSample(
  Uint8List source,
  int width,
  int height,
  bool srgb,
  int x,
  int y,
  int channel,
) {
  if (x >= width || y >= height) return null;
  final value = source[(y * width + x) * 4 + channel] / 255.0;
  return _decodeThreeDownsample(value, srgb, channel);
}

double _decodeThreeDownsample(double value, bool srgb, int channel) {
  if (srgb && channel != 3) return _srgbToLinearUnit(value);
  return value;
}

double _encodeThreeDownsample(double average, bool srgb, int channel) {
  if (srgb && channel != 3) return _linearToSrgbUnit(average);
  return average;
}

double _srgbToLinearUnit(double value) {
  final clamped = value.clamp(0.0, 1.0);
  return clamped <= 0.04045
      ? clamped / 12.92
      : math.pow((clamped + 0.055) / 1.055, 2.4).toDouble();
}

double _linearToSrgbUnit(double value) {
  final clamped = value.clamp(0.0, 1.0);
  return clamped <= 0.0031308
      ? clamped * 12.92
      : 1.055 * math.pow(clamped, 1 / 2.4).toDouble() - 0.055;
}
