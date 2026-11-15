import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_line_walk_native.dart';

void main() {
  test('native line walk updates every component at full rate', () {
    final walker = ThreeLineWalkNative(12345);
    final values = Float32List(4096);
    final bytes = Uint8List.view(values.buffer);

    expect(walker.apply(bytes), isTrue);
    final first = Float32List.fromList(values);
    var sum = 0.0;
    for (final value in first) {
      expect(value.abs(), lessThanOrEqualTo(0.15000001));
      sum += value;
    }
    expect((sum / first.length).abs(), lessThan(0.005));

    expect(walker.apply(bytes), isTrue);
    for (var index = 0; index < values.length; index++) {
      final increment = values[index] - first[index];
      expect(increment.abs(), lessThanOrEqualTo(0.15000001));
    }
    expect(values, isNot(orderedEquals(first)));
  });

  test('zero seed does not lock the walk and unaligned bytes are rejected', () {
    final walker = ThreeLineWalkNative(0);
    final values = Float32List(32);
    expect(walker.apply(Uint8List.view(values.buffer)), isTrue);
    expect(values.any((value) => value != 0), isTrue);
    expect(walker.apply(Uint8List(3)), isFalse);
  });

  test('native position packet matches the custom vertex shader', () {
    final packet = Float32List(13);
    packet[0] = 1;
    packet[1] = 2;
    packet.setRange(4, 7, [1, 2, 3]);
    packet.setRange(7, 10, [0.5, -1, 2]);
    final bytes = Uint8List.view(packet.buffer);

    expect(applyThreeLinePositionsPacket(bytes), isTrue);
    expect(packet[2], 1);
    expect(packet.sublist(10), [2, 0, 7]);

    packet[1] = double.nan;
    expect(applyThreeLinePositionsPacket(bytes), isFalse);
    expect(packet[2], 0);
    expect(applyThreeLinePositionsPacket(Uint8List(3)), isFalse);
  });
}
