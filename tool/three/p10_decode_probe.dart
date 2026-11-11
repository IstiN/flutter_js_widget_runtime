import 'dart:io';
import 'dart:typed_data';
import 'package:image/image.dart' as img;

void main(List<String> args) {
  final bytes = File(args[0]).readAsBytesSync();
  final decoded = img.decodeImage(bytes)!;
  final w = decoded.width, h = decoded.height;
  final rgba = decoded.getBytes(order: img.ChannelOrder.rgba);
  File(args[1]).writeAsBytesSync(rgba);
  // fnv hash
  var hash = 0x811c9dc5;
  for (final b in rgba) hash = ((hash ^ b) * 0x01000193) & 0xffffffff;
  print('DECODE ${w}x${h} fnv=0x${hash.toRadixString(16)} bytes=${rgba.length}');
  if (args.length > 2) {
    final out = img.Image.fromBytes(width: w, height: h, bytes: rgba.buffer, order: img.ChannelOrder.rgba);
    File(args[2]).writeAsBytesSync(img.encodePng(out));
    print('PNG ${args[2]}');
  }
}
