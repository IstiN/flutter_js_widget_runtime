import 'dart:async';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

class _FakeVideoController extends JsVideoController {
  _FakeVideoController(this.src);

  final String src;
  final _position = StreamController<Duration>.broadcast();
  final _duration = StreamController<Duration>.broadcast();
  final _playing = StreamController<bool>.broadcast();
  final _aspectRatio = StreamController<double?>.broadcast();

  @override
  double? get aspectRatio => 16 / 9;

  @override
  Stream<double?> get aspectRatioStream => _aspectRatio.stream;

  @override
  Stream<Duration> get positionStream => _position.stream;

  @override
  Stream<Duration> get durationStream => _duration.stream;

  @override
  Stream<bool> get playingStream => _playing.stream;

  @override
  Future<void> play() async => _playing.add(true);

  @override
  Future<void> pause() async => _playing.add(false);

  @override
  Future<void> seek(Duration position) async => _position.add(position);

  @override
  Future<void> dispose() async {
    await _position.close();
    await _duration.close();
    await _playing.close();
    await _aspectRatio.close();
  }

  @override
  Widget buildVideo(
    BuildContext context, {
    BoxFit fit = BoxFit.contain,
    double? width,
    double? height,
  }) =>
      Container(
        key: ValueKey('video-$src'),
        width: width,
        height: height,
        color: Colors.black,
      );
}

class _FakeAudioController extends JsAudioController {
  _FakeAudioController(this.src);

  final String src;
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
  Future<void> play() async => _playing.add(true);

  @override
  Future<void> pause() async => _playing.add(false);

  @override
  Future<void> seek(Duration position) async => _position.add(position);

  @override
  Future<void> dispose() async {
    await _position.close();
    await _duration.close();
    await _playing.close();
  }
}

class _FakeMediaHost extends JsMediaHost {
  @override
  JsVideoController createVideoController(String src) => _FakeVideoController(src);

  @override
  JsAudioController createAudioController(String src) => _FakeAudioController(src);
}

void main() {
  group('JsonWidgetRenderer media nodes', () {
    testWidgets('video renders host widget when mediaHost is set', (
      tester,
    ) async {
      final renderer = JsonWidgetRenderer(
        onEvent: (_, __) {},
        mediaHost: _FakeMediaHost(),
      );
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: renderer.build({
              'type': 'video',
              'src': '/tmp/video.mp4',
              'width': 200.0,
              'height': 100.0,
            }),
          ),
        ),
      );
      await tester.pump();
      expect(find.byKey(const ValueKey('video-/tmp/video.mp4')), findsOneWidget);
    });

    testWidgets('video renders placeholder when mediaHost is null', (
      tester,
    ) async {
      final renderer = JsonWidgetRenderer(onEvent: (_, __) {});
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: renderer.build({
              'type': 'video',
              'src': '/tmp/video.mp4',
            }),
          ),
        ),
      );
      expect(find.byIcon(Icons.videocam), findsOneWidget);
    });

    testWidgets('audio renders controls when mediaHost is set', (
      tester,
    ) async {
      final renderer = JsonWidgetRenderer(
        onEvent: (_, __) {},
        mediaHost: _FakeMediaHost(),
      );
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: renderer.build({
              'type': 'audio',
              'src': '/tmp/audio.mp3',
              'title': 'My Track',
            }),
          ),
        ),
      );
      await tester.pump();
      expect(find.text('My Track'), findsOneWidget);
      expect(find.byIcon(Icons.play_arrow), findsOneWidget);
    });

    testWidgets('audio renders placeholder when mediaHost is null', (
      tester,
    ) async {
      final renderer = JsonWidgetRenderer(onEvent: (_, __) {});
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: renderer.build({'type': 'audio', 'src': '/tmp/audio.mp3'}),
          ),
        ),
      );
      expect(find.byIcon(Icons.audiotrack), findsOneWidget);
    });
  });
}
