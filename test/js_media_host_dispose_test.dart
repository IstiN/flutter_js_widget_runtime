
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'fake_engine_backend.dart';
import 'support/fake_media_controllers.dart';

/// Engine-level media lifecycle regression tests.
///
/// The audio leak behind "sounds keep playing after leaving sound-playing
/// widgets" had no engine-level guard at all: `JsWidgetEngine.dispose()`
/// (widget switch via engine replacement, page close via widget unmount)
/// never told the [JsMediaHost] anything, so any controller a host handed
/// out stayed alive — and audible — unless the embedder remembered to tear
/// its own lane down. These tests pin the disposal hook: execution stops
/// FIRST (backend dispose), then the host releases.
final class _CountingMediaHost extends JsMediaHost {
  _CountingMediaHost(this.order);

  final List<String> order;
  int controllersCreated = 0;
  int disposeCalls = 0;

  @override
  JsVideoController createVideoController(String src) {
    controllersCreated++;
    order.add('createVideo');
    return FakeVideoController();
  }

  @override
  JsAudioController createAudioController(String src) {
    controllersCreated++;
    order.add('createAudio');
    return _NoopAudioController(this);
  }

  @override
  Future<void> dispose() async {
    disposeCalls++;
    order.add('hostDispose');
  }
}

final class _NoopAudioController extends JsAudioController
    with FakeInertPlayback {
  _NoopAudioController(this.host);

  final _CountingMediaHost host;

  @override
  Future<void> dispose() async {
    host.order.add('controllerDispose');
  }
}

final class _OrderingBackend extends FakeEngineBackend {
  final List<String> order;

  _OrderingBackend(this.order);

  @override
  Future<void> dispose() async {
    order.add('backendDispose');
    await super.dispose();
  }
}

JsRuntimeConfig _config({
  required JsWidgetEngineBackend backend,
  JsMediaHost? mediaHost,
}) => JsRuntimeConfig(
  widgetId: 'media-dispose-test',
  onRender: (_) {},
  onSetTitle: (_) {},
  onStorageUpdate: (_) {},
  backend: backend,
  mediaHost: mediaHost,
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'engine dispose releases the media host after execution stopped',
    () async {
      final order = <String>[];
      final media = _CountingMediaHost(order);
      final backend = _OrderingBackend(order);
      final engine = JsWidgetEngine(
        config: _config(backend: backend, mediaHost: media),
      );

      await engine.run('void mainWidget() {}');
      await engine.dispose();

      expect(backend.disposed, isTrue);
      expect(media.disposeCalls, 1);
      final backendIndex = order.indexOf('backendDispose');
      final hostIndex = order.indexOf('hostDispose');
      expect(backendIndex, greaterThanOrEqualTo(0));
      expect(
        hostIndex,
        greaterThan(backendIndex),
        reason:
            'the media host must be released only after the backend '
            'stopped executing JS — a late worker host call must never '
            'resurrect a player on a released host',
      );
    },
  );

  test('engine dispose without a media host stays a no-op', () async {
    final backend = FakeEngineBackend();
    final engine = JsWidgetEngine(config: _config(backend: backend));
    await engine.run('void mainWidget() {}');
    await engine.dispose();
    expect(backend.disposed, isTrue);
  });

  test(
    'media host disposal hook is idempotent under double engine dispose',
    () async {
      final media = _CountingMediaHost(<String>[]);
      final backend = FakeEngineBackend();
      final engine = JsWidgetEngine(
        config: _config(backend: backend, mediaHost: media),
      );
      await engine.run('void mainWidget() {}');

      // Widget switch fires previous.dispose() and the framework dispose gate
      // can fire engine.dispose() again for the same generation.
      await engine.dispose();
      await engine.dispose();

      expect(
        media.disposeCalls,
        2,
        reason:
            'the hook fires per engine dispose; '
            'hosts must guard internally (idempotency contract)',
      );
    },
  );
}
