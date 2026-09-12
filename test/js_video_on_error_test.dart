import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

class _ErrorVideoController extends JsVideoController {
  final errors = StreamController<Object?>.broadcast();
  final _position = StreamController<Duration>.broadcast();
  final _duration = StreamController<Duration>.broadcast();
  final _playing = StreamController<bool>.broadcast();

  @override
  double? get aspectRatio => 16 / 9;

  @override
  Stream<double?> get aspectRatioStream => Stream<double?>.empty();

  @override
  Stream<Duration> get positionStream => _position.stream;

  @override
  Stream<Duration> get durationStream => _duration.stream;

  @override
  Stream<bool> get playingStream => _playing.stream;

  @override
  Stream<Object?>? get errorStream => errors.stream;

  @override
  Future<void> play() async {}

  @override
  Future<void> pause() async {}

  @override
  Future<void> seek(Duration position) async {}

  @override
  Widget buildVideo(
    BuildContext context, {
    BoxFit fit = BoxFit.contain,
    double? width,
    double? height,
  }) =>
      const SizedBox.expand();

  @override
  Future<void> dispose() async {
    await _position.close();
    await _duration.close();
    await _playing.close();
    await errors.close();
  }
}

class _ErrorMediaHost extends JsMediaHost {
  final _ErrorVideoController video = _ErrorVideoController();

  @override
  JsVideoController createVideoController(String src) => video;

  @override
  JsAudioController createAudioController(String src) =>
      throw UnimplementedError();
}

/// A host whose controller creation fails synchronously — the worst case
/// the `onError` path must survive (previously this crashed the build or
/// left a silent black box).
class _ThrowingMediaHost extends JsMediaHost {
  @override
  JsVideoController createVideoController(String src) =>
      throw StateError('no codec for source');

  @override
  JsAudioController createAudioController(String src) =>
      throw UnimplementedError();
}

Widget _app(Widget child) => MaterialApp(
      home: Scaffold(body: child),
    );

void main() {
  group('video node onError', () {
    testWidgets('controller errorStream fires the onError event', (
      tester,
    ) async {
      final host = _ErrorMediaHost();
      final events = <Map<String, dynamic>>[];
      final renderer = JsonWidgetRenderer(
        onEvent: (id, payload) => events.add({'id': id, 'payload': payload}),
        mediaHost: host,
      );
      await tester.pumpWidget(_app(renderer.build({
        'type': 'video',
        'src': '/tmp/v.mp4',
        'onError': 'viderr',
      })));
      await tester.pump();

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
        mediaHost: _ThrowingMediaHost(),
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
      final host = _ErrorMediaHost();
      final events = <Map<String, dynamic>>[];
      final renderer = JsonWidgetRenderer(
        onEvent: (id, payload) => events.add({'id': id, 'payload': payload}),
        mediaHost: host,
      );
      await tester.pumpWidget(_app(renderer.build({
        'type': 'video',
        'src': '/tmp/v.mp4',
      })));
      await tester.pump();

      host.video.errors.add('boom');
      await tester.pump();

      expect(events, isEmpty);
    });
  });
}
