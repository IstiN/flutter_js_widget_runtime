import 'dart:convert';
import 'dart:typed_data';

ByteData _view(Uint8List bytes) => ByteData.sublistView(bytes);

void setU16(Uint8List bytes, int offset, int value) =>
    _view(bytes).setUint16(offset, value, Endian.little);

void setU32(Uint8List bytes, int offset, int value) =>
    _view(bytes).setUint32(offset, value, Endian.little);

void setF32(Uint8List bytes, int offset, double value) =>
    _view(bytes).setFloat32(offset, value, Endian.little);

void setAscii(Uint8List bytes, int offset, String value) =>
    bytes.setAll(offset, ascii.encode(value));
