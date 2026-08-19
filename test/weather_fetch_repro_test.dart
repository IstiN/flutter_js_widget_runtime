import 'dart:async';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

// Real-backend repro for the "weather stuck on loading" report:
// widget calls jsr.render (spinner) + jsr.fetchJson; the fetch resolve must
// re-enter JS and produce a SECOND render with data (or an error render).
//
// macOS-only: the default JsWidgetEngine backend is flutter_js — JavaScriptCore
// on macOS (system framework, always available) but a QuickJS plugin .so on
// Linux, which CI does not build. The tests also hit the live wttr.in API.

JsWidgetEngine _reproEngine(
  String widgetId,
  void Function(String type) onRender, {
  String? instanceId,
}) =>
    JsWidgetEngine(
      config: JsRuntimeConfig(
        widgetId: widgetId,
        instanceId: instanceId,
        onRender: (tree) => onRender('${tree['type']}'),
        onSetTitle: (_) {},
        onStorageUpdate: (_) {},
      ),
    );

String _fetchJs(String city, String marker, {String spinner = 'center'}) => '''
      jsr.render({type:'$spinner'});
      jsr.fetchJson('https://wttr.in/$city?format=j1').then(function(d){
        jsr.render({type:'text', data:'$marker'});
      }, function(e){
        jsr.render({type:'text', data:'ERR$marker'});
      });
    ''';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!Platform.isMacOS) return;

  test(
    'fetchJson resolve triggers a second render (real JSC backend)',
    () async {
      final renders = <String>[];
      final engine = _reproEngine('fetch-repro', renders.add);
      await engine.run(_fetchJs('London', 'OK'));
      // Allow fetch + resolve + evaluate to complete.
      await Future<void>.delayed(const Duration(seconds: 8));
      expect(
        renders.length,
        greaterThanOrEqualTo(2),
        reason: 'spinner render + fetch-settled render; got: $renders',
      );
      await engine.dispose();
    },
    timeout: const Timeout(Duration(seconds: 30)),
  );

  // Real-world scenario from the crash session: the panel's engine is
  // REPLACED (board switch / reload) while a fetch is in flight. The new
  // engine re-runs widget.js; the old fetch resolves later. Renders must
  // still flow to the NEW engine and it must stay functional.
  test(
    'engine replaced mid-fetch keeps rendering (weather stuck repro)',
    () async {
      final renders = <String>[];
      var engine = _reproEngine(
        'weather-repro',
        (t) => renders.add('old:$t'),
      );
      await engine.run(_fetchJs('London', 'OK'));

      // Replace the engine immediately (fetch still in flight).
      await engine.dispose();
      engine = _reproEngine('weather-repro', (t) => renders.add('new:$t'));
      await engine.run(_fetchJs('London', 'OK2'));

      await Future<void>.delayed(const Duration(seconds: 8));
      expect(
        renders.where((r) => r.startsWith('new:')).length,
        greaterThanOrEqualTo(2),
        reason: 'new engine must render spinner + settled; got: $renders',
      );
      await engine.dispose();
    },
    timeout: const Timeout(Duration(seconds: 30)),
  );

  // The board scenario: MULTIPLE engines alive (weather + other widgets),
  // fetches resolving while other engines also evaluate. On macOS JSC the
  // sendMessage native callback is process-global — resolves can hop
  // engines, dropping the weather data render.
  test(
    'two concurrent engines: fetch resolves into the owning engine',
    () async {
      final renders = <String>[];
      final weather = _reproEngine(
        'weather',
        (t) => renders.add('weather:$t'),
        instanceId: 'w1',
      );
      await weather.run(_fetchJs('London', 'OK'));

      final other = _reproEngine(
        'other',
        (t) => renders.add('other:$t'),
        instanceId: 'o1',
      );
      await other.run(_fetchJs('Paris', 'OKO', spinner: 'row'));

      await Future<void>.delayed(const Duration(seconds: 10));
      final weatherRenders = renders
          .where((r) => r.startsWith('weather:'))
          .toList();
      expect(
        weatherRenders.length,
        greaterThanOrEqualTo(2),
        reason: 'weather engine: spinner + settled render; got: $renders',
      );
      await weather.dispose();
      await other.dispose();
    },
    timeout: const Timeout(Duration(seconds: 40)),
  );
}
