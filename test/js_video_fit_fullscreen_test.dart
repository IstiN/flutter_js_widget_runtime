import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'support/fake_media_host.dart';

Widget _app(Widget child) => MaterialApp(
      home: Scaffold(body: child),
    );

const _surfaceKey = ValueKey('jsr-test-video-surface');

void main() {
  group('video node fit semantics', () {
    testWidgets('tight parent (sizedBox): fit prop maps the surface', (
      tester,
    ) async {
      final host = FakeMediaHost();
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

      expect(tester.widget<FittedBox>(find.byKey(_surfaceKey)).fit,
          BoxFit.fill);

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

      expect(tester.widget<FittedBox>(find.byKey(_surfaceKey)).fit,
          BoxFit.cover);
    });

    testWidgets('loose parent (column child): natural AspectRatio kept', (
      tester,
    ) async {
      final host = FakeMediaHost();
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
    Future<void> pumpVideo(WidgetTester tester, FakeMediaHost host) async {
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
      final host = FakeMediaHost();
      await pumpVideo(tester, host);

      await tester.tap(find.byIcon(Icons.fullscreen));
      await tester.pumpAndSettle();

      expect(find.byKey(const ValueKey('jsr-video-fullscreen')), findsOneWidget);
      // Owner + fullscreen page share the same controller → two surfaces.
      expect(find.byKey(_surfaceKey), findsNWidgets(2));

      await tester.tap(find.byIcon(Icons.close));
      await tester.pumpAndSettle();

      expect(find.byKey(const ValueKey('jsr-video-fullscreen')), findsNothing);
      expect(find.byKey(_surfaceKey), findsOneWidget);
    });

    testWidgets('fullscreenButton: false hides the button', (tester) async {
      final host = FakeMediaHost();
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
