import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_node.dart';

import 'support/fake_three_host.dart';

void main() {
  testWidgets('mounts, resizes, forwards pointer events and releases', (
    tester,
  ) async {
    final host = FakeThreeHost();
    final events = <Map<String, dynamic>>[];
    Future<void> pump(String engineId) => tester.pumpWidget(
      MaterialApp(
        home: Center(
          child: SizedBox(
            width: 320,
            height: 180,
            child: JsThreeNode(
              host: host,
              config: {
                'canvasId': 'main',
                'surfaceId': 'main#1',
                'engineId': engineId,
              },
              onEvent: (_, event) => events.add(event),
            ),
          ),
        ),
      ),
    );

    await pump('engine-a');
    await tester.pump();
    final surface = host.findSurface('engine-a', 'main#1');
    expect(surface, isNotNull);
    expect(surface!.logicalSize, const Size(320, 180));
    expect(events.any((event) => event['type'] == 'resize'), isTrue);

    await tester.tap(find.byType(JsThreeNode));
    expect(events.any((event) => event['type'] == 'pointerdown'), isTrue);
    expect(events.any((event) => event['type'] == 'pointerup'), isTrue);
    expect(events.any((event) => event['type'] == 'focus'), isTrue);

    final gesture = await tester.startGesture(
      tester.getCenter(find.byType(JsThreeNode)),
    );
    await gesture.moveBy(const Offset(7, -3));
    await gesture.up();
    final move = events.lastWhere((event) => event['type'] == 'pointermove');
    expect(move['movementX'], 7);
    expect(move['movementY'], -3);

    await pump('engine-b');
    expect(host.releases, contains('engine-a/main#1'));
    expect(host.findSurface('engine-b', 'main#1'), isNotNull);

    await tester.pumpWidget(const SizedBox());
    expect(host.releases, contains('engine-b/main#1'));
    expect(events.any((event) => event['type'] == 'pointercancel'), isTrue);
    expect(events.any((event) => event['type'] == 'blur'), isTrue);
  });

  testWidgets('shows an explicit error for an unprepared canvas', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: JsThreeNode(
          host: FakeThreeHost(),
          config: const {'canvasId': 'plain'},
        ),
      ),
    );
    expect(find.textContaining('three.unsupported'), findsOneWidget);
  });
}
