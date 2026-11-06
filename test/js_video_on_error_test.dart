import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'support/fake_media_host.dart';

Widget _app(Widget child) => MaterialApp(
      home: Scaffold(body: child),
    );

/// Pumps a `video` node through a [FakeMediaHost], wiring [events] to the
/// renderer's `onEvent` (omit [onError] to leave the node without a hook).
Future<FakeMediaHost> _pumpVideo(
  WidgetTester tester,
  List<Map<String, dynamic>> events, {
  String? onError = 'viderr',
}) async {
  final host = FakeMediaHost();
  final renderer = JsonWidgetRenderer(
    onEvent: (id, payload) => events.add({'id': id, 'payload': payload}),
    mediaHost: host,
  );
  await tester.pumpWidget(_app(renderer.build({
    'type': 'video',
    'src': '/tmp/v.mp4',
    if (onError != null) 'onError': onError,
  })));
  await tester.pump();
  return host;
}

void main() {
  group('video node onError', () {
    testWidgets('controller errorStream fires the onError event', (
      tester,
    ) async {
      final events = <Map<String, dynamic>>[];
      final host = await _pumpVideo(tester, events);

      host.video.errors.add({'message': 'network dropped'});
      await tester.pump();

      expect(events, hasLength(1));
      expect(events.single['id'], 'viderr');
      expect(events.single['payload'], {'value': 'network dropped'});
    });

    testWidgets('synchronous createController failure fires onError', (
      tester,
    ) async {
      final events = <Map<String, dynamic>>[];
      final renderer = JsonWidgetRenderer(
        onEvent: (id, payload) => events.add({'id': id, 'payload': payload}),
        mediaHost: ThrowingMediaHost(),
      );
      await tester.pumpWidget(_app(renderer.build({
        'type': 'video',
        'src': '/tmp/v.mp4',
        'onError': 'viderr',
      })));
      await tester.pump();

      expect(events, hasLength(1));
      expect(events.single['id'], 'viderr');
      expect(
        (events.single['payload'] as Map)['value'],
        contains('no codec for source'),
      );
    });

    testWidgets('without onError the error stays silent (back-compat)', (
      tester,
    ) async {
      final events = <Map<String, dynamic>>[];
      final host = await _pumpVideo(tester, events, onError: null);

      host.video.errors.add('boom');
      await tester.pump();

      expect(events, isEmpty);
    });
  });
}
