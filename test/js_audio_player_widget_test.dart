import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

class _RecordingAudioController extends JsAudioController {
  _RecordingAudioController(this.src);

  final String src;
  final List<String> calls = <String>[];
  final _position = StreamController<Duration>.broadcast();
  final _duration = StreamController<Duration>.broadcast();
  final _playing = StreamController<bool>.broadcast();

  @override
  Stream<Duration> get positionStream => _position.stream;

  @override
  Stream<Duration> get durationStream => _duration.stream;

  @override
  Stream<bool> get playingStream => _playing.stream;

  @override
  Future<void> play() async => calls.add('play');

  @override
  Future<void> pause() async => calls.add('pause');

  @override
  Future<void> seek(Duration position) async =>
      calls.add('seek:${position.inMilliseconds}');

  @override
  Future<void> setVolume(double volume) async => calls.add('volume:$volume');

  @override
  Future<void> setLoop(bool loop) async => calls.add('loop:$loop');

  @override
  Future<void> dispose() async {
    calls.add('dispose');
    await _position.close();
    await _duration.close();
    await _playing.close();
  }
}

class _FakeVideoController extends JsVideoController {
  @override
  double? get aspectRatio => null;

  @override
  Stream<double?> get aspectRatioStream => const Stream.empty();

  @override
  Stream<Duration> get positionStream => const Stream.empty();

  @override
  Stream<Duration> get durationStream => const Stream.empty();

  @override
  Stream<bool> get playingStream => const Stream.empty();

  @override
  Future<void> play() async {}

  @override
  Future<void> pause() async {}

  @override
  Future<void> seek(Duration position) async {}

  @override
  Future<void> dispose() async {}

  @override
  Widget buildVideo(
    BuildContext context, {
    BoxFit fit = BoxFit.contain,
    double? width,
    double? height,
  }) =>
      const SizedBox.shrink();
}

class _RecordingMediaHost extends JsMediaHost {
  final List<_RecordingAudioController> audioControllers =
      <_RecordingAudioController>[];

  @override
  JsVideoController createVideoController(String src) => _FakeVideoController();

  @override
  JsAudioController createAudioController(String src) {
    final controller = _RecordingAudioController(src);
    audioControllers.add(controller);
    return controller;
  }
}

void main() {
  group('audio_player node', () {
    Future<void> pumpNode(
      WidgetTester tester,
      JsonWidgetRenderer renderer,
      Map<String, dynamic> node,
    ) async {
      await tester.pumpWidget(
        MaterialApp(home: Scaffold(body: renderer.build(node))),
      );
      await tester.pump();
    }

    testWidgets('renders zero-size placeholder without host', (tester) async {
      final renderer = JsonWidgetRenderer(onEvent: (_, __) {});
      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
      });
      expect(tester.takeException(), isNull);
      expect(find.byIcon(Icons.audiotrack), findsNothing);
    });

    testWidgets('plays on mount by default and pauses/plays on transitions', (
      tester,
    ) async {
      final host = _RecordingMediaHost();
      final renderer = JsonWidgetRenderer(
        onEvent: (_, __) {},
        mediaHost: host,
      );

      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
      });
      expect(host.audioControllers, hasLength(1));
      expect(host.audioControllers.single.calls, ['play']);

      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': false,
      });
      expect(host.audioControllers.single.calls, ['play', 'pause']);

      // Same props again: no further calls.
      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': false,
      });
      expect(host.audioControllers.single.calls, ['play', 'pause']);

      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': true,
      });
      expect(host.audioControllers.single.calls, ['play', 'pause', 'play']);
    });

    testWidgets('playing:false on mount does not call pause', (tester) async {
      final host = _RecordingMediaHost();
      final renderer = JsonWidgetRenderer(
        onEvent: (_, __) {},
        mediaHost: host,
      );
      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': false,
      });
      expect(host.audioControllers.single.calls, isEmpty);
    });

    testWidgets('volume is clamped and applied only on change', (tester) async {
      final host = _RecordingMediaHost();
      final renderer = JsonWidgetRenderer(
        onEvent: (_, __) {},
        mediaHost: host,
      );

      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': false,
        'volume': 0.5,
      });
      expect(host.audioControllers.single.calls, ['volume:0.5']);

      // Same volume: no call.
      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': false,
        'volume': 0.5,
      });
      expect(host.audioControllers.single.calls, ['volume:0.5']);

      // Out-of-range values clamp to 1.0; clamped repeats do not re-apply.
      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': false,
        'volume': 1.5,
      });
      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': false,
        'volume': 2.0,
      });
      expect(host.audioControllers.single.calls, ['volume:0.5', 'volume:1.0']);

      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': false,
        'volume': -0.2,
      });
      expect(
        host.audioControllers.single.calls,
        ['volume:0.5', 'volume:1.0', 'volume:0.0'],
      );
    });

    testWidgets('loop applied on change only', (tester) async {
      final host = _RecordingMediaHost();
      final renderer = JsonWidgetRenderer(
        onEvent: (_, __) {},
        mediaHost: host,
      );

      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': false,
        'loop': true,
      });
      expect(host.audioControllers.single.calls, ['loop:true']);

      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': false,
        'loop': true,
      });
      expect(host.audioControllers.single.calls, ['loop:true']);

      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': false,
      });
      expect(host.audioControllers.single.calls, ['loop:true', 'loop:false']);
    });

    testWidgets('seeks only when seekToMs changes', (tester) async {
      final host = _RecordingMediaHost();
      final renderer = JsonWidgetRenderer(
        onEvent: (_, __) {},
        mediaHost: host,
      );

      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': false,
        'seekToMs': 100,
      });
      expect(host.audioControllers.single.calls, ['seek:100']);

      // Same value: no seek.
      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': false,
        'seekToMs': 100,
      });
      expect(host.audioControllers.single.calls, ['seek:100']);

      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': false,
        'seekToMs': 250,
      });
      expect(host.audioControllers.single.calls, ['seek:100', 'seek:250']);

      // Removing seekToMs does not seek.
      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': false,
      });
      expect(host.audioControllers.single.calls, ['seek:100', 'seek:250']);
    });

    testWidgets('src swap disposes and recreates the controller', (
      tester,
    ) async {
      final host = _RecordingMediaHost();
      final renderer = JsonWidgetRenderer(
        onEvent: (_, __) {},
        mediaHost: host,
      );

      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'volume': 0.3,
      });
      expect(host.audioControllers, hasLength(1));
      expect(host.audioControllers[0].calls, ['play', 'volume:0.3']);

      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/b.mp3',
        'volume': 0.3,
      });
      expect(host.audioControllers, hasLength(2));
      expect(host.audioControllers[0].calls, ['play', 'volume:0.3', 'dispose']);
      expect(host.audioControllers[1].src, '/tmp/b.mp3');
      // Fresh controller re-applies the full prop state.
      expect(host.audioControllers[1].calls, ['play', 'volume:0.3']);
    });

    testWidgets('dispose disposes the controller', (tester) async {
      final host = _RecordingMediaHost();
      final renderer = JsonWidgetRenderer(
        onEvent: (_, __) {},
        mediaHost: host,
      );

      await pumpNode(tester, renderer, {
        'type': 'audio_player',
        'src': '/tmp/a.mp3',
        'playing': false,
      });
      await tester.pumpWidget(const MaterialApp(home: Scaffold()));
      expect(host.audioControllers.single.calls, ['dispose']);
    });
  });
}
