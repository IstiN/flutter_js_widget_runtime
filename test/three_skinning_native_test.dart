import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_skinning_native.dart';

void main() {
  test('native skinning packet transforms positions and normals in place', () {
    // One vertex, two bones. Bone 0 is identity; bone 1 translates by
    // (4, 8, 12). Weights 0.25/0.75 produce a (3, 6, 9) translation.
    final packet = Float32List(4 + 32 + 4 + 4 + 3 + 3);
    packet[0] = 1;
    packet[1] = 2;
    packet[2] = 1;
    packet[4] = 1;
    packet[4 + 5] = 1;
    packet[4 + 10] = 1;
    packet[4 + 15] = 1;
    packet[20] = 1;
    packet[20 + 5] = 1;
    packet[20 + 10] = 1;
    packet[20 + 12] = 4;
    packet[20 + 13] = 8;
    packet[20 + 14] = 12;
    packet[20 + 15] = 1;
    const indexOffset = 36;
    const weightOffset = 40;
    const positionOffset = 44;
    const normalOffset = 47;
    packet[indexOffset] = 0;
    packet[indexOffset + 1] = 16;
    packet[weightOffset] = 0.25;
    packet[weightOffset + 1] = 0.75;
    packet[positionOffset] = 1;
    packet[positionOffset + 1] = 2;
    packet[positionOffset + 2] = 3;
    packet[normalOffset + 2] = 1;

    final bytes = packet.buffer.asUint8List();
    expect(applyThreeSkinningPacket(bytes), isTrue);
    expect(packet[3], 1);
    expect(packet[positionOffset], 4);
    expect(packet[positionOffset + 1], 8);
    expect(packet[positionOffset + 2], 12);
    expect(packet[normalOffset], 0);
    expect(packet[normalOffset + 1], 0);
    expect(packet[normalOffset + 2], 1);
  });

  test('native skinning packet rejects malformed layouts', () {
    final packet = Float32List(16);
    packet[0] = 2;
    packet[1] = 1;
    final bytes = packet.buffer.asUint8List();
    expect(applyThreeSkinningPacket(bytes), isFalse);
    expect(applyThreeSkinningPacket(Uint8List(3)), isFalse);

    final nonFinite = Float32List(31);
    nonFinite[0] = 1;
    nonFinite[1] = 1;
    nonFinite[4] = 1;
    nonFinite[9] = 1;
    nonFinite[14] = 1;
    nonFinite[19] = 1;
    nonFinite[24] = 1;
    nonFinite[28] = double.infinity;
    expect(applyThreeSkinningPacket(nonFinite.buffer.asUint8List()), isFalse);
  });
}
