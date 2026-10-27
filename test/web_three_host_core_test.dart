import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/web_three_host_core.dart';

WebThreeFrameIdentity _frame({
  String engineId = 'engine',
  String surfaceId = 'surface',
  String canvasId = 'canvas',
  int generation = 1,
  int frameId = 0,
  int width = 640,
  int height = 360,
}) => WebThreeFrameIdentity(
  engineId: engineId,
  surfaceId: surfaceId,
  canvasId: canvasId,
  generation: generation,
  frameId: frameId,
  width: width,
  height: height,
);

void main() {
  group('WebThreeFrameIdentity', () {
    test('parses structured-clone scalar numbers without DOM types', () {
      final identity = WebThreeFrameIdentity.tryParse(
        engineId: 'engine',
        surfaceId: 'surface',
        canvasId: 'canvas',
        generation: 2.0,
        frameId: 17,
        width: 1280.0,
        height: 720,
      );

      expect(identity, isNotNull);
      expect(identity!.generation, 2);
      expect(identity.frameId, 17);
      expect(identity.width, 1280);
      expect(identity.height, 720);
      expect(identity.belongsTo('engine', 'surface', 'canvas', 2), isTrue);
    });

    test('rejects blank identities and invalid numeric metadata', () {
      WebThreeFrameIdentity? parse({
        Object? engine = 'engine',
        Object? surface = 'surface',
        Object? canvas = 'canvas',
        Object? generation = 1,
        Object? frame = 0,
        Object? width = 1,
        Object? height = 1,
      }) => WebThreeFrameIdentity.tryParse(
        engineId: engine,
        surfaceId: surface,
        canvasId: canvas,
        generation: generation,
        frameId: frame,
        width: width,
        height: height,
      );

      expect(parse(engine: ''), isNull);
      expect(parse(surface: ''), isNull);
      expect(parse(canvas: ''), isNull);
      expect(parse(generation: 0), isNull);
      expect(parse(generation: -1), isNull);
      expect(parse(frame: -1), isNull);
      expect(parse(frame: 1.5), isNull);
      expect(parse(width: 0), isNull);
      expect(parse(height: double.nan), isNull);
      expect(parse(width: double.infinity), isNull);
    });
  });

  group('WebThreeFrameLifecycle', () {
    test('isolates engine, surface, canvas and generation', () {
      final lifecycle = WebThreeFrameLifecycle(
        engineId: 'engine',
        surfaceId: 'surface',
        canvasId: 'canvas',
        generation: 3,
      );

      expect(
        lifecycle.accept(_frame(engineId: 'other', generation: 3)),
        WebThreeFrameRejection.crossEngine,
      );
      expect(
        lifecycle.accept(_frame(surfaceId: 'other', generation: 3)),
        WebThreeFrameRejection.surfaceMismatch,
      );
      expect(
        lifecycle.accept(_frame(canvasId: 'other', generation: 3)),
        WebThreeFrameRejection.surfaceMismatch,
      );
      expect(
        lifecycle.accept(_frame(generation: 2)),
        WebThreeFrameRejection.surfaceMismatch,
      );
      expect(lifecycle.lastReceivedFrameId, -1);
    });

    test('rejects duplicate and out-of-order frames after acceptance', () {
      final lifecycle = WebThreeFrameLifecycle(
        engineId: 'engine',
        surfaceId: 'surface',
        canvasId: 'canvas',
        generation: 1,
      );
      final first = _frame(frameId: 4);
      final newest = _frame(frameId: 5);

      expect(lifecycle.accept(first), WebThreeFrameRejection.none);
      expect(lifecycle.accept(newest), WebThreeFrameRejection.none);
      expect(lifecycle.accept(first), WebThreeFrameRejection.stale);
      expect(lifecycle.accept(newest), WebThreeFrameRejection.stale);
      expect(lifecycle.lastReceivedFrameId, 5);
      expect(lifecycle.markPresented(first), isTrue);
      expect(lifecycle.markPresented(first), isFalse);
      expect(lifecycle.markPresented(newest), isTrue);
      expect(lifecycle.lastPresentedFrameId, 5);
    });

    test('disposal is idempotent and permanently closes the generation', () {
      final lifecycle = WebThreeFrameLifecycle(
        engineId: 'engine',
        surfaceId: 'surface',
        canvasId: 'canvas',
        generation: 1,
      );
      final frame = _frame();
      expect(lifecycle.accept(frame), WebThreeFrameRejection.none);

      lifecycle.dispose();
      lifecycle.dispose();

      expect(lifecycle.isDisposed, isTrue);
      expect(
        lifecycle.accept(_frame(frameId: 1)),
        WebThreeFrameRejection.disposed,
      );
      expect(lifecycle.markPresented(frame), isFalse);
    });
  });
}
