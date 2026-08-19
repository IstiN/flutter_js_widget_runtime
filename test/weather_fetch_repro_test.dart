import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

// Real-backend repro for the "weather stuck on loading" report:
// widget calls jsr.render (spinner) + jsr.fetchJson; the fetch resolve must
// re-enter JS and produce a SECOND render with data (or an error render).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'fetchJson resolve triggers a second render (real JSC backend)',
    () async {
      final renders = <String>[];
      final engine = JsWidgetEngine(
        config: JsRuntimeConfig(
          widgetId: 'fetch-repro',
          onRender: (tree) => renders.add('${tree['type']}'),
          onSetTitle: (_) {},
          onStorageUpdate: (_) {},
        ),
      );
      await engine.run('''
      jsr.render({type:'center'});
      jsr.fetchJson('https://wttr.in/London?format=j1').then(function(d){
        jsr.render({type:'text', data:'OK:'+!!d.current_condition});
      }, function(e){
        jsr.render({type:'text', data:'ERR:'+e});
      });
    ''');
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
      var engine = JsWidgetEngine(
        config: JsRuntimeConfig(
          widgetId: 'weather-repro',
          onRender: (tree) => renders.add('old:${tree['type']}'),
          onSetTitle: (_) {},
          onStorageUpdate: (_) {},
        ),
      );
      await engine.run('''
      jsr.render({type:'center'});
      jsr.fetchJson('https://wttr.in/London?format=j1').then(function(d){
        jsr.render({type:'text', data:'OK'});
      }, function(e){
        jsr.render({type:'text', data:'ERR'});
      });
    ''');

      // Replace the engine immediately (fetch still in flight).
      await engine.dispose();
      engine = JsWidgetEngine(
        config: JsRuntimeConfig(
          widgetId: 'weather-repro',
          onRender: (tree) => renders.add('new:${tree['type']}'),
          onSetTitle: (_) {},
          onStorageUpdate: (_) {},
        ),
      );
      await engine.run('''
      jsr.render({type:'center'});
      jsr.fetchJson('https://wttr.in/London?format=j1').then(function(d){
        jsr.render({type:'text', data:'OK2'});
      }, function(e){
        jsr.render({type:'text', data:'ERR2'});
      });
    ''');

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
      final weather = JsWidgetEngine(
        config: JsRuntimeConfig(
          widgetId: 'weather',
          instanceId: 'w1',
          onRender: (tree) => renders.add('weather:${tree['type']}'),
          onSetTitle: (_) {},
          onStorageUpdate: (_) {},
        ),
      );
      await weather.run('''
      jsr.render({type:'center'});
      jsr.fetchJson('https://wttr.in/London?format=j1').then(function(d){
        jsr.render({type:'text', data:'OK'});
      }, function(e){
        jsr.render({type:'text', data:'ERR'});
      });
    ''');

      final other = JsWidgetEngine(
        config: JsRuntimeConfig(
          widgetId: 'other',
          instanceId: 'o1',
          onRender: (tree) => renders.add('other:${tree['type']}'),
          onSetTitle: (_) {},
          onStorageUpdate: (_) {},
        ),
      );
      await other.run('''
      jsr.render({type:'row'});
      jsr.fetchJson('https://wttr.in/Paris?format=j1').then(function(d){
        jsr.render({type:'text', data:'OKO'});
      }, function(e){
        jsr.render({type:'text', data:'ERRO'});
      });
    ''');

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
