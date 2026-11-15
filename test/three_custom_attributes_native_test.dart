import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_custom_attributes_native.dart';

Float32List _tessellationPacket() {
  // Two vertices: source, normal, displacement and output regions.
  return Float32List.fromList([
    2, 3, 0, 2, // header / normal bound
    1, 2, 3, 4, 5, 6,
    1, 0, 0, 0, 2, 0,
    0.5, -2,
    0, 0, 0, 0, 0, 0,
  ]);
}

Float32List _sizePacket(int mode) {
  const count = 5;
  final packet = Float32List(8 + count * 3);
  packet[0] = count.toDouble();
  packet[1] = 0.7;
  packet[2] = mode.toDouble();
  packet[3] = 3;
  for (var i = 0; i < count; i++) {
    packet[8 + i] = math.sin(0.1 * i);
    packet[8 + count + i] = math.cos(0.1 * i);
  }
  return packet;
}

void main() {
  test(
    'displacement kernel is deterministic, bounded and updates both views',
    () {
      final first = Float32List(4 + 20 * 2)..[0] = 20;
      first[1] = 1.25;
      final second = Float32List.fromList(first);
      final a = ThreeCustomAttributesNative(1234);
      final b = ThreeCustomAttributesNative(1234);
      final firstBytes = Uint8List.view(first.buffer);
      expect(a.applyDisplacement(firstBytes), isTrue);
      expect(b.applyDisplacement(Uint8List.view(second.buffer)), isTrue);
      expect(first, second);
      expect(first[2], 1);
      for (var i = 0; i < 20; i++) {
        expect(first[4 + i].isFinite, isTrue);
        expect(first[4 + 20 + i], inInclusiveRange(-5, 5));
      }
    },
  );

  test('tessellation kernel preserves component order and computes sweep', () {
    final packet = _tessellationPacket();
    expect(applyThreeTessellationPacket(Uint8List.view(packet.buffer)), isTrue);
    expect(packet[2], 1);
    expect(packet[3], 4); // normalBound 2 * max displacement 2
    expect(packet.sublist(18), [2.5, 2, 3, 4, -7, 6]);
    packet[4 + 6 + 6] = double.nan;
    expect(
      applyThreeTessellationPacket(Uint8List.view(packet.buffer)),
      isFalse,
    );
    expect(packet[2], 0);
  });

  test('point-size kernels match all three official phase fields', () {
    for (var mode = 0; mode < 3; mode++) {
      final packet = _sizePacket(mode);
      expect(applyThreePointSizesPacket(Uint8List.view(packet.buffer)), isTrue);
      expect(packet[4], 1);
      for (var i = 0; i < 5; i++) {
        final sine = math.sin(0.1 * i + (mode == 2 ? 0.6 : 1) * packet[1]);
        final expected = switch (mode) {
          0 => 14 + 13 * sine,
          1 => 10 * (1 + sine),
          _ => i < 3 ? math.max(0, 26 + 32 * sine) : 40.0,
        };
        expect(packet[8 + 10 + i], closeTo(expected, 0.0001));
      }
    }
  });

  test('shared registrar dispatches every custom-attribute packet kind', () {
    late void Function(String, Uint8List) lane;
    var registrations = 0;
    registerThreeCustomAttributesNative((name, callback) {
      expect(name, '__jsrCustomAttributeBytes');
      registrations++;
      lane = callback;
    });
    expect(registrations, 1);
    final displacement = Float32List(12)..[0] = 4;
    lane('three.displacement', Uint8List.view(displacement.buffer));
    expect(displacement[2], 1);
    final tessellation = _tessellationPacket();
    lane('three.tessellation', Uint8List.view(tessellation.buffer));
    expect(tessellation[2], 1);
    final sizes = _sizePacket(0);
    lane('three.pointSizes', Uint8List.view(sizes.buffer));
    expect(sizes[4], 1);
    lane('unrelated', Uint8List(0));
  });

  test('native kernels reject malformed lengths and non-finite phase data', () {
    expect(applyThreeTessellationPacket(Uint8List(12)), isFalse);
    expect(applyThreePointSizesPacket(Uint8List(31)), isFalse);
    final sizes = _sizePacket(0)..[8] = double.infinity;
    expect(applyThreePointSizesPacket(Uint8List.view(sizes.buffer)), isFalse);
    expect(sizes[4], 0);
    final displacement = Float32List(8);
    expect(
      ThreeCustomAttributesNative().applyDisplacement(
        Uint8List.view(displacement.buffer),
      ),
      isFalse,
    );
  });
}
