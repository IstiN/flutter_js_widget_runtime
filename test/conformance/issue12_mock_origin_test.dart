import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// flutter_js_widget_runtime#12: `__JSR_MOCK_ORIGIN__` never reached the
/// widget because `run()` honored only its own parameter, not
/// `JsRuntimeConfig.hostBootstrapJs`. The config value must apply when the
/// runner injects through the config (conformance runner) alone.
void main() {
  if (!QuickjsFfi.isAvailable) {
    return; // CI builds the bridge first (see pr.yml job conformance).
  }

  testWidgets('run() honors JsRuntimeConfig.hostBootstrapJs', (tester) async {
    final logs = <String>[];
    final backend = QuickjsWidgetEngineBackend(
      config: JsRuntimeConfig(
        widgetId: 'issue12',
        instanceId: 'issue12',
        hostBootstrapJs: 'var __JSR_MOCK_ORIGIN__ = "http://127.0.0.1:1";',
        onRender: (_) {},
        onSetTitle: (_) {},
        onLog: logs.add,
        onStorageUpdate: (_) {},
      ),
    );
    await backend.init();
    await backend.run(
      'console.log("origin " + __JSR_MOCK_ORIGIN__);'
      'jsr.fetchJson(__JSR_MOCK_ORIGIN__ + "/x").then(function() {'
      '  console.log("fetch dispatched");'
      '});',
    );
    await tester.pump(const Duration(milliseconds: 50));
    await backend.dispose();
    await tester.pump(const Duration(milliseconds: 10));

    expect(logs.join('\n'), contains('origin http://127.0.0.1:1'));
  });
}
