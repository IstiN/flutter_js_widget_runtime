import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

/// Video surface fake that records the applied `fit` so tests can assert
/// what the node's `fit` prop actually reached the host.
class _FitRecordingVideoController extends JsVideoController {
  final List<BoxFit> appliedFits = <BoxFit>[];
  final _position = StreamController<Duration>.broadcast();
  final _duration = StreamController<Duration>.broadcast();
  final _playing = StreamController<Duration>.broadcast();
  final _aspect = StreamController<double?>.broadcast();

  @override
  double? get aspectRatio => 16 / 9;

  @override
  Stream<double?> get aspectRatioStream => _aspect.stream;

  @override
  Stream<Duration> get positionStream => _position.stream;

  @override
  Stream<Duration> get durationStream => _duration.stream;

  @override
  Stream<bool> get playingStream => Stream<bool>.empty();

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
  }) {
    appliedFits.add(fit);
    return FittedBox(
      key: const ValueKey('jsr-test-video-surface'),
      fit: fit,
      child: const SizedBox(width: 800, height: 450),
    );
  }

  @override
  Future<void> dispose() async {
    await _position.close();
    await _duration.close();
    await _playing.close();
    await _aspect.close();
  }
}

class _FitRecordingMediaHost extends JsMediaHost {
  final _FitRecordingVideoController video =
      _FitRecordingVideoController();

  @override
  JsVideoController createVideoController(String src) => video;

  @override
  JsAudioController createAudioController(String src) =>
      throw UnimplementedError();
}

Widget _app(Widget child) => MaterialApp(
      home: Scaffold(body: child),
    );

void main() {
  group('video node fit semantics', () {
    testWidgets('tight parent (sizedBox): fit prop maps the surface', (
      tester,
    ) async {
      final host = _FitRecordingMediaHost();
      final renderer = JsonWidgetRenderer(onEvent: (_, __) {}, mediaHost: host);
      await tester.pumpWidget(_app(renderer.build({
        'type': 'sizedBox',
        'width': 640.0,
        'height': 360.0,
        'child': {
          'type': 'video',
          'src': '/tmp/v.mp4',
          'fit': 'fill',
        },
      })));

      expect(
        tester.widget<FittedBox>(find.byKey(const ValueKey('jsr-test-video-surface'))).fit,
        BoxFit.fill,
      );

      // Re-render with a fresh node map (as jsr.render does) — the new fit
      // must reach the host on the next build.
      await tester.pumpWidget(_app(renderer.build({
        'type': 'sizedBox',
        'width': 640.0,
        'height': 360.0,
        'child': {
          'type': 'video',
          'src': '/tmp/v.mp4',
          'fit': 'cover',
        },
      })));

      expect(
        tester.widget<FittedBox>(find.byKey(const ValueKey('jsr-test-video-surface'))).fit,
        BoxFit.cover,
      );
    });

    testWidgets('loose parent (column child): natural AspectRatio kept', (
      tester,
    ) async {
      final host = _FitRecordingMediaHost();
      final renderer = JsonWidgetRenderer(onEvent: (_, __) {}, mediaHost: host);
      await tester.pumpWidget(_app(renderer.build({
        'type': 'column',
        'children': [
          {
            'type': 'video',
            'src': '/tmp/v.mp4',
            'fit': 'fill',
          },
        ],
      })));

      // Without a reserved box the video keeps its natural shape (16/9 from
      // the controller) — contain/fill/cover cannot stretch a loose box.
      expect(find.byType(AspectRatio), findsOneWidget);
    });
  });

  group('video fullscreen route', () {
    Future<void> pumpVideo(WidgetTester tester, _FitRecordingMediaHost host) async {
      final renderer = JsonWidgetRenderer(onEvent: (_, __) {}, mediaHost: host);
      await tester.pumpWidget(_app(renderer.build({
        'type': 'sizedBox',
        'width': 640.0,
        'height': 360.0,
        'child': {
          'type': 'video',
          'src': '/tmp/v.mp4',
          'fit': 'contain',
        },
      })));
      await tester.pump();
    }

    testWidgets('fullscreen button pushes a route over the SAME surface', (
      tester,
    ) async {
      final host = _FitRecordingMediaHost();
      await pumpVideo(tester, host);

      await tester.tap(find.byIcon(Icons.fullscreen));
      await tester.pumpAndSettle();

      expect(find.byKey(const ValueKey('jsr-video-fullscreen')), findsOneWidget);
      // Owner + fullscreen page share the same controller → two surfaces.
      expect(find.byKey(const ValueKey('jsr-test-video-surface')), findsNWidgets(2));

      await tester.tap(find.byIcon(Icons.close));
      await tester.pumpAndSettle();

      expect(find.byKey(const ValueKey('jsr-video-fullscreen')), findsNothing);
      expect(find.byKey(const ValueKey('jsr-test-video-surface')), findsOneWidget);
    });

    testWidgets('fullscreenButton: false hides the button', (tester) async {
      final host = _FitRecordingMediaHost();
      final renderer = JsonWidgetRenderer(onEvent: (_, __) {}, mediaHost: host);
      await tester.pumpWidget(_app(renderer.build({
        'type': 'sizedBox',
        'width': 640.0,
        'height': 360.0,
        'child': {
          'type': 'video',
          'src': '/tmp/v.mp4',
          'fullscreenButton': false,
        },
      })));
      await tester.pump();

      expect(find.byIcon(Icons.fullscreen), findsNothing);
    });
  });
}
