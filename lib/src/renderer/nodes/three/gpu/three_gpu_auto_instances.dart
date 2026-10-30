part of '../flutter_gpu_three_backend.dart';

const _threeInstanceStrideInBytes = 80;
const _threeWhiteInstanceColor = <double>[1, 1, 1, 1];
final _threeIdentityMatrix = Float32List.fromList(const [
  1, 0, 0, 0, //
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
]);

ByteData _threeIdentityInstanceData() {
  final data = ByteData(_threeInstanceStrideInBytes);
  for (final index in [0, 5, 10, 15]) {
    data.setFloat32(index * 4, 1, Endian.little);
  }
  _writeFloats(data, 64, _threeWhiteInstanceColor);
  return data;
}

ByteData _threeInstanceData(JsThreeDrawBatchUpsert source) {
  final expected = source.instanceCount * 16;
  if (!source.instanced || source.instanceMatrices.length != expected) {
    throw ArgumentError('invalid instanced batch matrix payload');
  }
  final colors = source.instanceColors;
  if (source.hasInstanceColors && colors.length != source.instanceCount * 3) {
    throw ArgumentError('invalid instanced batch color payload');
  }
  final data = ByteData(source.instanceCount * _threeInstanceStrideInBytes);
  for (var instance = 0; instance < source.instanceCount; instance++) {
    final offset = instance * _threeInstanceStrideInBytes;
    _writeFloats(
      data,
      offset,
      source.instanceMatrices.sublist(instance * 16, (instance + 1) * 16),
    );
    _writeFloats(
      data,
      offset + 64,
      source.hasInstanceColors
          ? <double>[
              colors[instance * 3],
              colors[instance * 3 + 1],
              colors[instance * 3 + 2],
              1,
            ]
          : _threeWhiteInstanceColor,
    );
  }
  return data;
}

ByteData _threeAutoInstanceData(ThreeDrawItem draw) {
  final draws = draw.autoInstanceDraws;
  if (!draw.autoInstanced || draws.length != draw.instanceCount) {
    throw ArgumentError('invalid auto-instance draw payload');
  }
  final data = ByteData(draws.length * _threeInstanceStrideInBytes);
  for (var instance = 0; instance < draws.length; instance++) {
    final source = draws[instance];
    final offset = instance * _threeInstanceStrideInBytes;
    _writeFloats(data, offset, source.node.matrixWorld);
    _writeFloats(data, offset + 64, [
      source.material.colorR,
      source.material.colorG,
      source.material.colorB,
      source.material.opacity,
    ]);
  }
  return data;
}

@visibleForTesting
ByteData debugThreeAutoInstanceData(ThreeDrawItem draw) =>
    _threeAutoInstanceData(draw);

final class _GpuAutoInstanceBatch {
  const _GpuAutoInstanceBatch(this.buffer, this.view);
  final gpu.DeviceBuffer buffer;
  final gpu.BufferView view;
}

final class _ThreeAutoInstanceKey {
  _ThreeAutoInstanceKey(ThreeDrawItem draw)
    : sources = List.unmodifiable(<Object>[
        draw.geometry,
        for (final item in draw.autoInstanceDraws) ...[
          item.node,
          item.material,
        ],
      ]);

  final List<Object> sources;

  @override
  bool operator ==(Object other) {
    return other is _ThreeAutoInstanceKey &&
        ListEquality<Object>(
          IdentityEquality<Object>(),
        ).equals(sources, other.sources);
  }

  @override
  int get hashCode => Object.hashAll(sources.map(identityHashCode));
}

void _prepareThreeAutoInstanceCache(
  FlutterGpuThreeBackend backend,
  ThreeDrawPlan plan,
) {
  final retained = <_ThreeAutoInstanceKey>{
    for (final draw in plan.draws)
      if (draw.autoInstanced) _ThreeAutoInstanceKey(draw),
  };
  backend._autoInstanceBatches.removeWhere(
    (key, value) => !retained.contains(key),
  );
}

gpu.BufferView? _threeAutoInstanceView(
  FlutterGpuThreeBackend backend,
  ThreeDrawItem draw,
) {
  final key = _ThreeAutoInstanceKey(draw);
  final cached = backend._autoInstanceBatches[key];
  if (cached != null) return cached.view;
  try {
    final packed = _threeAutoInstanceData(draw);
    final buffer = backend._context.createDeviceBufferWithCopy(packed);
    final view = gpu.BufferView(
      buffer,
      offsetInBytes: 0,
      lengthInBytes: packed.lengthInBytes,
    );
    backend._autoInstanceBatches[key] = _GpuAutoInstanceBatch(buffer, view);
    return view;
  } catch (error) {
    backend._note('auto-instance upload failed: $error');
    return null;
  }
}
