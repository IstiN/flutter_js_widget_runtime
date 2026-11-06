import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_morph_native.dart';

Float32List _packet({required bool relative}) {
  final packet = Float32List(28);
  packet[0] = 1; // vertexCount
  packet[1] = 2; // influenceCount
  packet[2] = 2; // positionTargetCount
  packet[3] = 2; // normalTargetCount
  packet[4] = relative ? 1 : 0;
  packet[8] = 0.25;
  packet[9] = 0.5;
  packet.setAll(10, <double>[2, 4, 6]);
  packet.setAll(13, <double>[0, 0, 2]);
  packet.setAll(16, <double>[4, 8, 12]);
  packet.setAll(19, <double>[8, 12, 16]);
  packet.setAll(22, <double>[1, 0, 0]);
  packet.setAll(25, <double>[0, 1, 0]);
  return packet;
}

void main() {
  test('native morph packet blends absolute positions and normals', () {
    final packet = _packet(relative: false);
    expect(applyThreeMorphPacket(packet.buffer.asUint8List()), isTrue);
    expect(packet[5], 1);
    expect(packet.sublist(10, 13), <double>[5.5, 9, 12.5]);
    expect(packet.sublist(13, 16), <double>[0.25, 0.5, 0.5]);
  });

  test('native morph packet preserves relative-target semantics', () {
    final packet = _packet(relative: true);
    expect(applyThreeMorphPacket(packet.buffer.asUint8List()), isTrue);
    expect(packet.sublist(10, 13), <double>[7, 12, 17]);
    expect(packet.sublist(13, 16), <double>[0.25, 0.5, 2]);
  });

  test('native morph packet supports normals without position targets', () {
    final packet = Float32List(18);
    packet[0] = 1;
    packet[1] = 1;
    packet[3] = 1;
    packet[8] = 0.25;
    packet.setAll(9, <double>[2, 4, 6]);
    packet.setAll(12, <double>[0, 0, 2]);
    packet.setAll(15, <double>[1, 0, 0]);
    expect(applyThreeMorphPacket(packet.buffer.asUint8List()), isTrue);
    expect(packet.sublist(9, 12), <double>[2, 4, 6]);
    expect(packet.sublist(12, 15), <double>[0.25, 0, 1.5]);
  });

  test('native morph packet rejects malformed and non-finite input', () {
    expect(applyThreeMorphPacket(Uint8List(3)), isFalse);
    final wrongLength = Float32List(16);
    wrongLength[0] = 1;
    wrongLength[1] = 1;
    wrongLength[2] = 1;
    expect(applyThreeMorphPacket(wrongLength.buffer.asUint8List()), isFalse);

    final badWeight = _packet(relative: false);
    badWeight[8] = double.nan;
    expect(applyThreeMorphPacket(badWeight.buffer.asUint8List()), isFalse);

    final badTarget = _packet(relative: false);
    badTarget[16] = double.infinity;
    expect(applyThreeMorphPacket(badTarget.buffer.asUint8List()), isFalse);
  });
}
