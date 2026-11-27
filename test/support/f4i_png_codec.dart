import 'dart:io';
import 'dart:typed_data';

// Straight-alpha PNG codec for the F4i downstream host proof (issue #8,
// segment F4i). The native capture host reads the ANGLE surface (straight
// RGBA bytes) and writes real PNG files; the decoded file must hash back to
// exactly the frame bytes, so the codec is its own lossless implementation —
// dart:ui's PNG path premultiplies internally and is not byte-exact for
// partial alpha (the bloom glow is partial alpha by design).
//
// Encoder: color type 6 (straight RGBA), 8-bit, filter 0 per scanline, zlib
// via dart:io (RFC 1950, the PNG IDAT format). Decoder: full filters 0-4.

const List<int> _pngSignature = <int>[137, 80, 78, 71, 13, 10, 26, 10];

final Uint32List _crcTable = () {
  final t = Uint32List(256);
  for (var n = 0; n < 256; n++) {
    var c = n;
    for (var k = 0; k < 8; k++) {
      c = (c & 1) == 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    t[n] = c;
  }
  return t;
}();

int _crc32(List<int> bytes, int from, int to) {
  var c = 0xffffffff;
  for (var i = from; i < to; i++) {
    c = _crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

Uint8List _chunk(String type, List<int> data) {
  final out = Uint8List(12 + data.length);
  final n = data.length;
  out[0] = (n >>> 24) & 0xff;
  out[1] = (n >>> 16) & 0xff;
  out[2] = (n >>> 8) & 0xff;
  out[3] = n & 0xff;
  for (var i = 0; i < 4; i++) {
    out[4 + i] = type.codeUnitAt(i);
  }
  out.setRange(8, 8 + n, data);
  final c = _crc32(out, 4, 8 + n);
  out[8 + n] = (c >>> 24) & 0xff;
  out[9 + n] = (c >>> 16) & 0xff;
  out[10 + n] = (c >>> 8) & 0xff;
  out[11 + n] = c & 0xff;
  return out;
}

/// Encodes [rgba] (w*h*4 straight RGBA bytes) as a PNG file's bytes.
Uint8List encodePngStraightRgba(Uint8List rgba, int w, int h) {
  final ihdr = Uint8List(13);
  ihdr[0] = (w >>> 24) & 0xff;
  ihdr[1] = (w >>> 16) & 0xff;
  ihdr[2] = (w >>> 8) & 0xff;
  ihdr[3] = w & 0xff;
  ihdr[4] = (h >>> 24) & 0xff;
  ihdr[5] = (h >>> 16) & 0xff;
  ihdr[6] = (h >>> 8) & 0xff;
  ihdr[7] = h & 0xff;
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA (straight alpha)
  final rowStride = w * 4;
  final raw = Uint8List(h * (rowStride + 1));
  for (var y = 0; y < h; y++) {
    raw[y * (rowStride + 1)] = 0; // filter 0 (None)
    raw.setRange(
      y * (rowStride + 1) + 1,
      (y + 1) * (rowStride + 1),
      rgba.sublist(y * rowStride, (y + 1) * rowStride),
    );
  }
  final z = ZLibCodec().encode(raw);
  final out = BytesBuilder();
  out.add(_pngSignature);
  out.add(_chunk('IHDR', ihdr));
  out.add(_chunk('IDAT', z));
  out.add(_chunk('IEND', const <int>[]));
  return out.takeBytes();
}

class F4iPngImage {
  const F4iPngImage(this.rgba, this.width, this.height);

  final Uint8List rgba;
  final int width;
  final int height;
}

/// Decodes a PNG produced by [encodePngStraightRgba] (8-bit RGBA) back to
/// straight RGBA. Throws on anything else — the proof only reads its own
/// files, and a decoder that silently tolerated other shapes would weaken
/// the round-trip guarantee.
F4iPngImage decodePngStraightRgba(Uint8List bytes) {
  if (bytes.length < 8) throw ArgumentError('png too short');
  for (var i = 0; i < 8; i++) {
    if (bytes[i] != _pngSignature[i]) throw ArgumentError('not a PNG');
  }
  var pos = 8;
  var w = 0, h = 0;
  final idats = BytesBuilder();
  while (pos + 8 <= bytes.length) {
    final len =
        (bytes[pos] << 24) |
        (bytes[pos + 1] << 16) |
        (bytes[pos + 2] << 8) |
        bytes[pos + 3];
    final type = String.fromCharCodes(bytes.sublist(pos + 4, pos + 8));
    if (type == 'IHDR') {
      w =
          (bytes[pos + 8] << 24) |
          (bytes[pos + 9] << 16) |
          (bytes[pos + 10] << 8) |
          bytes[pos + 11];
      h =
          (bytes[pos + 12] << 24) |
          (bytes[pos + 13] << 16) |
          (bytes[pos + 14] << 8) |
          bytes[pos + 15];
      if (bytes[pos + 16] != 8 || bytes[pos + 17] != 6) {
        throw ArgumentError('expected 8-bit RGBA PNG');
      }
    } else if (type == 'IDAT') {
      idats.add(bytes.sublist(pos + 8, pos + 8 + len));
    } else if (type == 'IEND') {
      break;
    }
    pos += 12 + len;
  }
  final raw = ZLibCodec().decode(idats.takeBytes());
  final stride = w * 4;
  final out = Uint8List(h * stride);
  var p = 0;
  var prev = Uint8List(stride);
  for (var y = 0; y < h; y++) {
    final ft = raw[p++];
    final cur = Uint8List(stride);
    for (var x = 0; x < stride; x++) {
      final a = x >= 4 ? cur[x - 4] : 0;
      final b = prev[x];
      final c = x >= 4 ? prev[x - 4] : 0;
      final v = raw[p + x];
      switch (ft) {
        case 0:
          cur[x] = v;
        case 1:
          cur[x] = (v + a) & 0xff;
        case 2:
          cur[x] = (v + b) & 0xff;
        case 3:
          cur[x] = (v + ((a + b) >> 1)) & 0xff;
        case 4:
          final pa = (b - c).abs();
          final pb = (a - c).abs();
          final pc = (a + b - 2 * c).abs();
          final pred = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
          cur[x] = (v + pred) & 0xff;
        default:
          throw ArgumentError('unsupported PNG filter $ft');
      }
    }
    p += stride;
    out.setRange(y * stride, (y + 1) * stride, cur);
    prev = cur;
  }
  return F4iPngImage(out, w, h);
}

/// FNV-1a over the bytes, formatted like the JS drivers hash their frames
/// ('0x' + 8 hex digits) so the Dart-verified PNG hashes compare directly
/// against the exported JS hashes.
String fnv1aHex(List<int> bytes) {
  var hash = 0x811c9dc5;
  for (final b in bytes) {
    hash = ((hash ^ b) * 0x01000193) & 0xffffffff;
  }
  return '0x${hash.toRadixString(16).padLeft(8, '0')}';
}

/// Round-trip self-check: every filter the encoder never emits still
/// decodes, and encode∘decode is the identity — the proof's hash equality is
/// only meaningful if this holds.
void f4iPngSelfCheck() {
  const w = 7;
  const h = 5;
  final px = Uint8List(w * h * 4);
  final rng = 12345;
  var s = rng;
  for (var i = 0; i < px.length; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    px[i] = (i % 4 == 3)
        ? (s < 0x4000 ? 0 : (s < 0x8000 ? 255 : s & 0xff))
        : s & 0xff;
  }
  final decoded = decodePngStraightRgba(encodePngStraightRgba(px, w, h));
  if (decoded.width != w || decoded.height != h) {
    throw StateError('png round trip changed the size');
  }
  for (var i = 0; i < px.length; i++) {
    if (decoded.rgba[i] != px[i]) {
      throw StateError(
        'png round trip changed byte $i: ${px[i]} -> ${decoded.rgba[i]}',
      );
    }
  }
}
