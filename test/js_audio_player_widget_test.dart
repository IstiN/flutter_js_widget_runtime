import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'support/fake_media_controllers.dart';

void main() {
  group('audio_player node', () {
    late RecordingMediaHost host;
    late JsonWidgetRenderer renderer;

    setUp(() {
      host = RecordingMediaHost();
      renderer = JsonWidgetRenderer(onEvent: (_, __) {}, mediaHost: host);
    });

    /// Pumps the node with [props] merged over the default type/src.
    Future<void> pumpProps(
      WidgetTester tester, [
      Map<String, dynamic> props = const {},
    ]) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: renderer.build({
              'type': 'audio_player',
              'src': '/tmp/a.mp3',
              ...props,
            }),
          ),
        ),
      );
      await tester.pump();
    }

    List<String> calls() => host.audioControllers.single.calls;

    testWidgets('renders zero-size placeholder without host', (tester) async {
      final bare = JsonWidgetRenderer(onEvent: (_, __) {});
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: bare.build({'type': 'audio_player', 'src': '/tmp/a.mp3'}),
          ),
        ),
      );
      await tester.pump();
      expect(tester.takeException(), isNull);
      expect(find.byIcon(Icons.audiotrack), findsNothing);
    });

    testWidgets('plays on mount by default and pauses/plays on transitions', (
      tester,
    ) async {
      await pumpProps(tester);
      expect(host.audioControllers, hasLength(1));
      expect(calls(), ['play']);

      await pumpProps(tester, {'playing': false});
      expect(calls(), ['play', 'pause']);

      // Same props again: no further calls.
      await pumpProps(tester, {'playing': false});
      expect(calls(), ['play', 'pause']);

      await pumpProps(tester, {'playing': true});
      expect(calls(), ['play', 'pause', 'play']);
    });

    testWidgets('playing:false on mount does not call pause', (tester) async {
      await pumpProps(tester, {'playing': false});
      expect(calls(), isEmpty);
    });

    testWidgets('volume is clamped and applied only on change', (tester) async {
      await pumpProps(tester, {'playing': false, 'volume': 0.5});
      expect(calls(), ['volume:0.5']);

      // Same volume: no call.
      await pumpProps(tester, {'playing': false, 'volume': 0.5});
      expect(calls(), ['volume:0.5']);

      // Out-of-range values clamp to 1.0; clamped repeats do not re-apply.
      await pumpProps(tester, {'playing': false, 'volume': 1.5});
      await pumpProps(tester, {'playing': false, 'volume': 2.0});
      expect(calls(), ['volume:0.5', 'volume:1.0']);

      await pumpProps(tester, {'playing': false, 'volume': -0.2});
      expect(calls(), ['volume:0.5', 'volume:1.0', 'volume:0.0']);
    });

    testWidgets('loop applied on change only', (tester) async {
      await pumpProps(tester, {'playing': false, 'loop': true});
      expect(calls(), ['loop:true']);

      await pumpProps(tester, {'playing': false, 'loop': true});
      expect(calls(), ['loop:true']);

      await pumpProps(tester, {'playing': false});
      expect(calls(), ['loop:true', 'loop:false']);
    });

    testWidgets('seeks only when seekToMs changes', (tester) async {
      await pumpProps(tester, {'playing': false, 'seekToMs': 100});
      expect(calls(), ['seek:100']);

      // Same value: no seek.
      await pumpProps(tester, {'playing': false, 'seekToMs': 100});
      expect(calls(), ['seek:100']);

      await pumpProps(tester, {'playing': false, 'seekToMs': 250});
      expect(calls(), ['seek:100', 'seek:250']);

      // Removing seekToMs does not seek.
      await pumpProps(tester, {'playing': false});
      expect(calls(), ['seek:100', 'seek:250']);
    });

    testWidgets('src swap disposes and recreates the controller', (
      tester,
    ) async {
      await pumpProps(tester, {'volume': 0.3});
      expect(host.audioControllers, hasLength(1));
      expect(calls(), ['play', 'volume:0.3']);

      await pumpProps(tester, {'src': '/tmp/b.mp3', 'volume': 0.3});
      expect(host.audioControllers, hasLength(2));
      expect(host.audioControllers[0].calls, ['play', 'volume:0.3', 'dispose']);
      expect(host.audioControllers[1].src, '/tmp/b.mp3');
      // Fresh controller re-applies the full prop state.
      expect(host.audioControllers[1].calls, ['play', 'volume:0.3']);
    });

    testWidgets('dispose disposes the controller', (tester) async {
      await pumpProps(tester, {'playing': false});
      await tester.pumpWidget(const MaterialApp(home: Scaffold()));
      expect(calls(), ['dispose']);
    });
  });
}
