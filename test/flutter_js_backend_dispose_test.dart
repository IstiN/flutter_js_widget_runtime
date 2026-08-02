import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_flutter_js.dart';

JsRuntimeConfig _config() => JsRuntimeConfig(
  onRender: (_) {},
  onSetTitle: (_) {},
  onStorageUpdate: (_) {},
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('FlutterJsWidgetEngineBackend native release grace', () {
    // These are native-integration tests: they need the quickjs bridge
    // library (.so/.dylib), which CI runners do not build. Probe once and
    // no-op the group where the bridge is unavailable.
    var nativeAvailable = true;
    setUpAll(() async {
      try {
        final probe = FlutterJsWidgetEngineBackend(config: _config());
        await probe.run('1+1;');
        await probe.dispose();
        // The probe's own deferred release must not leak into the counts
        // asserted below.
        FlutterJsWidgetEngineBackend.flushPendingNativeReleases();
      } on Object {
        nativeAvailable = false;
      }
    });

    tearDown(() {
      FlutterJsWidgetEngineBackend.flushPendingNativeReleases();
      FlutterJsWidgetEngineBackend.nativeReleaseGrace = const Duration(
        seconds: 15,
      );
    });

    test(
      'dispose defers the native release instead of releasing synchronously',
      () async {
        if (!nativeAvailable) return;
        FlutterJsWidgetEngineBackend.nativeReleaseGrace = const Duration(
          milliseconds: 80,
        );
        final backend = FlutterJsWidgetEngineBackend(config: _config());
        await backend.run(
          '(function(){ jsr.render({type:"text",data:"ok"}); })();',
        );

        await backend.dispose();
        // The native context is still alive inside the grace window: any
        // in-flight JavaScriptCore work referencing it cannot SIGSEGV.
        expect(FlutterJsWidgetEngineBackend.pendingNativeReleaseCount, 1);

        await Future<void>.delayed(const Duration(milliseconds: 200));
        expect(FlutterJsWidgetEngineBackend.pendingNativeReleaseCount, 0);
      },
    );

    test(
      'restart releases both runtimes after grace (no crash, no leak)',
      () async {
        if (!nativeAvailable) return;
        FlutterJsWidgetEngineBackend.nativeReleaseGrace = const Duration(
          milliseconds: 80,
        );
        final backend = FlutterJsWidgetEngineBackend(config: _config());
        await backend.run(
          '(function(){ jsr.render({type:"text",data:"one"}); })();',
        );
        await backend.run(
          '(function(){ jsr.render({type:"text",data:"two"}); })();',
        );
        await backend.dispose();

        // run() disposed the first runtime (grace 1), dispose() parked the
        // second (grace 2) — both release on their own timers.
        expect(
          FlutterJsWidgetEngineBackend.pendingNativeReleaseCount,
          greaterThanOrEqualTo(1),
        );
        await Future<void>.delayed(const Duration(milliseconds: 300));
        expect(FlutterJsWidgetEngineBackend.pendingNativeReleaseCount, 0);
      },
    );

    test(
      'a grace timer firing after an early flush is a no-op (no double release)',
      () async {
        if (!nativeAvailable) return;
        FlutterJsWidgetEngineBackend.nativeReleaseGrace = const Duration(
          milliseconds: 60,
        );
        final backend = FlutterJsWidgetEngineBackend(config: _config());
        await backend.run(
          '(function(){ jsr.render({type:"text",data:"ok"}); })();',
        );
        await backend.dispose();
        expect(FlutterJsWidgetEngineBackend.pendingNativeReleaseCount, 1);

        // Early flush wins the race; the later timer tick must not release
        // the (already released) runtime a second time.
        FlutterJsWidgetEngineBackend.flushPendingNativeReleases();
        expect(FlutterJsWidgetEngineBackend.pendingNativeReleaseCount, 0);
        await Future<void>.delayed(const Duration(milliseconds: 150));
        expect(FlutterJsWidgetEngineBackend.pendingNativeReleaseCount, 0);
      },
    );
  });
}
