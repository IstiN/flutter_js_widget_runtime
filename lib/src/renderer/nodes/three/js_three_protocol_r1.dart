part of 'js_three_protocol.dart';

extension _JsThreeR1CommandDecoder on JsThreeProtocolDecoder {
  JsThreeCommand _decodeCommand(int opcode, _Reader body, int version) {
    if (opcode == 7) return _light(body, version);
    if (opcode == 3) return _material(body, version);
    if (opcode == 4) return _node(body, version);
    if (opcode == 8) return _frame(body, version);
    if (opcode == 13) return _clipping(body, version);
    if (opcode == 14) return _renderTarget(body, version);
    if (opcode == 15) return _stencilClear(body, version);
    final decode = _r1CommandDecoders[opcode];
    if (decode == null) body.fail('unknown R1 opcode $opcode');
    return decode(this, body);
  }

  /// R1 v8 OPCODE.STENCIL_CLEAR: `u32 nodeId + u32 value`. nodeId 0 is
  /// meaningful ("at this stream position"), so unlike resource ids it is
  /// not rejected; the value must fit the 8-bit stencil attachment.
  JsThreeStencilClear _stencilClear(_Reader body, int version) {
    if (version < 8) body.fail('stencil clear requires R1 version 8');
    final nodeId = body.u32('stencil clear node id');
    final value = body.u32('stencil clear value');
    if (value > maxStencilByteValue) {
      body.fail('stencil clear value must fit an 8-bit stencil buffer');
    }
    return JsThreeStencilClear._(nodeId: nodeId, value: value);
  }

  JsThreeClippingUpsert _clipping(_Reader body, int version) {
    if (version < 3) body.fail('clipping requires R1 version 3');
    final id = body.nonzeroId('clipping id');
    final clipVersion = body.nonzeroVersion();
    final count = body.u32('clipping plane count');
    if (count == 0 || count > JsThreeProtocolDecoder.maxClippingPlaneCount) {
      body.fail(
        'clipping plane count outside'
        ' 1..${JsThreeProtocolDecoder.maxClippingPlaneCount}',
      );
    }
    final planes = body.float32List(count * 4, 'clipping planes');
    for (var index = 0; index < count; index++) {
      final offset = index * 4;
      final nx = planes[offset];
      final ny = planes[offset + 1];
      final nz = planes[offset + 2];
      if (nx * nx + ny * ny + nz * nz <= 0) {
        body.fail('clipping plane normal must be nonzero');
      }
    }
    return JsThreeClippingUpsert._(
      clipId: id,
      version: clipVersion,
      planes: planes,
    );
  }
}

final class _T1Header {
  _T1Header.read(this.reader, this.version, this.kind)
    : headerBytes = reader.u16('header bytes'),
      sequence = reader.u32('sequence'),
      payloadBytes = reader.u32('payload bytes'),
      engineBytes = reader.u16('engine byte length'),
      surfaceBytes = reader.u16('surface byte length'),
      flags = reader.u32('flags'),
      totalBytes = reader.u32('total bytes'),
      reserved = reader.u32('reserved');

  final _Reader reader;
  final int version;
  final int kind;
  final int headerBytes;
  final int sequence;
  final int payloadBytes;
  final int engineBytes;
  final int surfaceBytes;
  final int flags;
  final int totalBytes;
  final int reserved;
}

final class _FrameTarget {
  const _FrameTarget({
    required this.targetId,
    required this.width,
    required this.height,
    required this.viewportX,
    required this.viewportY,
    required this.viewportWidth,
    required this.viewportHeight,
    required this.scissorX,
    required this.scissorY,
    required this.scissorWidth,
    required this.scissorHeight,
    required this.flags,
    this.clearStencil = true,
  });

  final int targetId;
  final int width;
  final int height;
  final double viewportX;
  final double viewportY;
  final double viewportWidth;
  final double viewportHeight;
  final double scissorX;
  final double scissorY;
  final double scissorWidth;
  final double scissorHeight;
  final int flags;

  /// Frame-start stencil clear (v8 flag bit 0x10, value always 0). Streams
  /// below v8 predate the bit and keep the bounded lane's legacy
  /// always-clear attachment behavior.
  final bool clearStencil;
}

final class _GeometryHeader {
  const _GeometryHeader(
    this.id,
    this.version,
    this.mask,
    this.vertexCount,
    this.indexCount,
    this.primitive,
  );

  final int id;
  final int version;
  final int mask;
  final int vertexCount;
  final int indexCount;
  final JsThreePrimitive primitive;
}

final class _Reader {
  _Reader(Uint8List bytes, [int start = 0, int? end])
    : _bytes = bytes,
      _data = ByteData.sublistView(bytes),
      _offset = start,
      _end = end ?? bytes.length {
    if (start < 0 || _end < start || _end > bytes.length) {
      throw ArgumentError('invalid reader bounds');
    }
  }

  static const int _maxSafeInteger = 0x1fffffffffffff;

  final Uint8List _bytes;
  final ByteData _data;
  final int _end;
  int _offset;

  int get offset => _offset;
  int get remaining => _end - _offset;

  Never fail(String message) {
    throw JsThreeProtocolException(message, null, _offset);
  }

  void require(int byteCount, String label) {
    if (byteCount < 0 || byteCount > _end - _offset) {
      fail('truncated $label');
    }
  }

  void requireEnd(String label) {
    if (_offset != _end) fail('$label has ${_end - _offset} trailing bytes');
  }

  void skip(int byteCount) {
    require(byteCount, 'bytes');
    _offset += byteCount;
  }

  void expectAscii(String expected) {
    for (var index = 0; index < expected.length; index++) {
      if (u8('magic') != expected.codeUnitAt(index)) {
        fail('invalid magic; expected $expected');
      }
    }
  }

  int u8(String label) {
    require(1, label);
    return _data.getUint8(_offset++);
  }

  int u16(String label) {
    require(2, label);
    final value = _data.getUint16(_offset, Endian.little);
    _offset += 2;
    return value;
  }

  int u32(String label) {
    require(4, label);
    final value = _data.getUint32(_offset, Endian.little);
    _offset += 4;
    return value;
  }

  int nonzeroId(String label) {
    final value = u32(label);
    if (value == 0) fail('$label must be nonzero');
    return value;
  }

  int nonzeroVersion() {
    final value = u32('resource version');
    if (value == 0) fail('resource version must be nonzero');
    return value;
  }

  T enumValue<T extends Enum>(
    List<T> values,
    int wireValue,
    String label, {
    int firstWireValue = 0,
  }) {
    final index = wireValue - firstWireValue;
    if (index < 0 || index >= values.length) {
      fail('unknown $label $wireValue');
    }
    return values[index];
  }

  int product(int left, int right, String label) {
    if (left < 0 ||
        right < 0 ||
        (left != 0 && right > _maxSafeInteger ~/ left)) {
      fail('$label overflows checked arithmetic');
    }
    return left * right;
  }

  double finiteFloat(String label) {
    require(4, label);
    final value = _data.getFloat32(_offset, Endian.little);
    _offset += 4;
    if (!value.isFinite) fail('$label must be finite');
    return value;
  }

  double unitFloat(String label) {
    final value = finiteFloat(label);
    if (value < 0 || value > 1) fail('$label must be in [0, 1]');
    return value;
  }

  Float32List float32List(
    int count,
    String label, {
    bool allowNonFinite = false,
  }) {
    final byteCount = product(count, 4, '$label byte length');
    require(byteCount, label);
    final values = Float32List(count);
    for (var index = 0; index < count; index++) {
      final value = _data.getFloat32(_offset, Endian.little);
      if (!allowNonFinite && !value.isFinite) {
        fail('$label contains a non-finite float');
      }
      values[index] = value;
      _offset += 4;
    }
    return values.asUnmodifiableView();
  }

  Float32List attribute(
    int vertexCount,
    int components,
    String label, {
    bool allowNonFinite = false,
  }) {
    final byteLength = u32('$label byte length');
    final expected = product(
      product(vertexCount, components, '$label floats'),
      4,
      '$label bytes',
    );
    if (byteLength != expected) fail('$label byte length is not exact');
    return float32List(
      vertexCount * components,
      '$label attribute',
      allowNonFinite: allowNonFinite,
    );
  }

  Uint32List indices(int count, int vertexCount) {
    final byteCount = product(count, 4, 'index byte length');
    require(byteCount, 'indices');
    final values = Uint32List(count);
    for (var index = 0; index < count; index++) {
      final value = _data.getUint32(_offset, Endian.little);
      if (value >= vertexCount) fail('index $value exceeds vertex range');
      values[index] = value;
      _offset += 4;
    }
    return values.asUnmodifiableView();
  }

  Uint8List byteList(int count, String label) {
    require(count, label);
    final values = Uint8List.fromList(
      Uint8List.sublistView(_bytes, _offset, _offset + count),
    );
    _offset += count;
    return values.asUnmodifiableView();
  }
}
