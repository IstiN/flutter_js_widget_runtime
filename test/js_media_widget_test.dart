import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

class _FakeVideoController extends JsVideoController {
  _FakeVideoController(this.src);

  final String src;
  bool disposed = false;
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
    disposed = true;
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
  final List<_FakeVideoController> videos = <_FakeVideoController>[];

  @override
  JsVideoController createVideoController(String src) {
    final c = _FakeVideoController(src);
    videos.add(c);
    return c;
  }

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

    testWidgets('video switches controller when src changes', (tester) async {
      final host = _FakeMediaHost();
      final renderer = JsonWidgetRenderer(onEvent: (_, __) {}, mediaHost: host);
      Map<String, dynamic> node(String src) => {
            'type': 'video',
            'src': src,
            'width': 200.0,
            'height': 100.0,
          };
      await tester.pumpWidget(
        MaterialApp(home: Scaffold(body: renderer.build(node('/tmp/a.mp4')))),
      );
      await tester.pump();
      expect(host.videos.single.src, '/tmp/a.mp4');

      // Rebuild with a new src — the mixin must dispose the old controller
      // and create a fresh one for the new source.
      await tester.pumpWidget(
        MaterialApp(home: Scaffold(body: renderer.build(node('/tmp/b.mp4')))),
      );
      // _replaceController is async (subscription cancels + dispose) — let
      // the real event loop drain it, then pump the rebuilt state.
      await tester.runAsync(() => Future<void>.delayed(Duration.zero));
      await tester.pump();
      await tester.pump();
      expect(host.videos.length, 2);
      expect(host.videos.first.disposed, isTrue);
      expect(host.videos.last.src, '/tmp/b.mp4');
      expect(host.videos.last.disposed, isFalse);
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
