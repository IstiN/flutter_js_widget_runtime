import 'dart:typed_data';

/// Returns an aligned float32 view of a native-compute packet, or null when
/// its byte layout cannot represent one. The view writes through to [bytes].
Float32List? readThreeFloat32Packet(Uint8List bytes, int minimumBytes) {
  if (bytes.lengthInBytes < minimumBytes || bytes.lengthInBytes & 3 != 0) {
    return null;
  }
  try {
    return bytes.buffer.asFloat32List(
      bytes.offsetInBytes,
      bytes.lengthInBytes ~/ 4,
    );
  } on ArgumentError {
    return null;
  }
}
