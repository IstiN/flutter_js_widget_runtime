import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// Tests for the opt-in QuickJS FFI engine backend and its dart:ffi runtime.
///
/// The whole suite skips when the native library has not been built — CI
/// builds it inside the quickjs_runtime package checkout before running
/// tests (or set JSR_QUICKJS_LIB).
final bool _hasNativeLib = File(QuickjsFfi.libraryPath).existsSync();

class _Recorder {
  final renders = <Map<String, dynamic>>[];
  final titles = <String>[];
  final storageUpdates = <Map<String, dynamic>>[];
  final logs = <String>[];
}

final _backends = <QuickjsWidgetEngineBackend>[];

QuickjsWidgetEngineBackend _backend(
  _Recorder r, {
  String widgetId = 'w1',
  Map<String, dynamic> initialStorage = const {},
  void Function(void Function(String id, dynamic value) resolve)?
  onResolveReady,
  Future<void> Function(String id, String key)? secretsGetHandler,
  Future<void> Function(
    String id,
    String url,
    String method,
    Map<String, String> headers,
  )?
  fetchHandler,
}) {
  final backend = QuickjsWidgetEngineBackend(
    config: JsRuntimeConfig(
      widgetId: widgetId,
      initialStorage: initialStorage,
      onRender: r.renders.add,
      onSetTitle: r.titles.add,
      onStorageUpdate: r.storageUpdates.add,
      onLog: r.logs.add,
      onResolveReady: onResolveReady,
      secretsGetHandler: secretsGetHandler,
      fetchHandler: fetchHandler,
    ),
  );
  _backends.add(backend);
  return backend;
}

void main() {
  if (!_hasNativeLib) {
    test(
      'QuickJS FFI backend suite',
      () {},
      skip:
          'libquickjs_bridge.so not found at "${QuickjsFfi.libraryPath}" — '
          'run tool/build_quickjs.sh to build it',
    );
    return;
  }

  tearDown(() async {
    for (final backend in _backends) {
      await backend.dispose();
    }
    _backends.clear();
    // Let the deferred native releases (scheduleMicrotask) run before the
    // isolate goes away.
    await pumpEventQueue();
  });

  group('QuickjsRuntime', () {
    test('evaluates JS and returns JSON results', () {
      final rt = QuickjsRuntime();
      addTearDown(rt.close);
      expect(rt.eval('1+2'), '3');
      expect(rt.eval('"hi"'), '"hi"');
      expect(rt.eval('undefined'), isNull);
    });

    test('reports eval errors through errMsg', () {
      final rt = QuickjsRuntime();
      addTearDown(rt.close);
      final err = <String?>[];
      expect(rt.eval('throw new Error("boom")', errMsg: err), isNull);
      expect(err, hasLength(1));
      expect(err.single, contains('boom'));
    });

    test('setGlobal injects JSON-encoded globals', () {
      final rt = QuickjsRuntime();
      addTearDown(rt.close);
      rt.setGlobal('__IID', 'test-iid');
      rt.setGlobal('__cfg', {'a': 1});
      expect(rt.eval('__IID'), '"test-iid"');
      expect(rt.eval('__cfg.a'), '1');
    });

    test('host functions round-trip synchronously', () {
      final rt = QuickjsRuntime();
      addTearDown(rt.close);
      rt.registerHostFunction('add', (argsJson) {
        final args = jsonDecode(argsJson) as List;
        return (args.length == 2)
            ? '${(args[0] as num) + (args[1] as num)}'
            : null;
      });
      // The host call executes while eval is still on the native stack and
      // its return value is available to the very expression that called it.
      expect(rt.eval('add(2,3) * 2'), '10');
    });

    test('host function returning null maps to JS undefined', () {
      final rt = QuickjsRuntime();
      addTearDown(rt.close);
      rt.registerHostFunction('nothing', (_) => null);
      expect(rt.eval('nothing() === undefined'), 'true');
    });

    test('a throwing host function surfaces as undefined, not a crash', () {
      final rt = QuickjsRuntime();
      addTearDown(rt.close);
      rt.registerHostFunction('bad', (_) {
        throw StateError('host callback blew up');
      });
      expect(rt.eval('bad() === undefined'), 'true');
      // The runtime stays usable afterwards.
      expect(rt.eval('40+2'), '42');
    });

    test('executePendingJobs settles promise chains', () {
      final rt = QuickjsRuntime();
      addTearDown(rt.close);
      rt.eval(
        'var __r = null; '
        'Promise.resolve(41).then(function(v){ __r = v + 1; });',
      );
      expect(rt.eval('__r'), 'null');
      expect(rt.executePendingJobs(), greaterThanOrEqualTo(1));
      expect(rt.eval('__r'), '42');
    });

    test('close is idempotent', () {
      final rt = QuickjsRuntime();
      rt.close();
      rt.close();
    });
  });

  group('QuickjsWidgetEngineBackend', () {
    test('init and dispose round-trip', () async {
      final backend = _backend(_Recorder());
      await backend.init();
      await backend.dispose();
      _backends.remove(backend);
    });

    test(
      'init throws a clear StateError when the library is missing',
      () async {
        final original = QuickjsFfi.libraryPath;
        QuickjsFfi.libraryPath = '/nonexistent/libquickjs_bridge.so';
        try {
          final backend = _backend(_Recorder());
          await expectLater(
            backend.init(),
            throwsA(
              isA<StateError>().having(
                (e) => e.message,
                'message',
                allOf(
                  contains('tool/build_quickjs.sh'),
                  contains('JSR_QUICKJS_LIB'),
                ),
              ),
            ),
          );
        } finally {
          QuickjsFfi.libraryPath = original;
        }
      },
    );

    test('run without a built library throws the same StateError', () async {
      final original = QuickjsFfi.libraryPath;
      QuickjsFfi.libraryPath = '/nonexistent/libquickjs_bridge.so';
      try {
        final backend = _backend(_Recorder());
        await expectLater(backend.run('1'), throwsStateError);
      } finally {
        QuickjsFfi.libraryPath = original;
      }
    });

    test('run evaluates widget JS and renders through the bridge', () async {
      final r = _Recorder();
      final backend = _backend(r);
      await backend.init();
      await backend.run('''
(function() {
  jsr.render({type: 'text', data: 'hello quickjs'});
})();
''');
      expect(r.renders, hasLength(1));
      expect(r.renders.single['type'], 'text');
      expect(r.renders.single['data'], 'hello quickjs');
      // The render tree is tagged with the engine instance id.
      expect(r.renders.single['__iid'], 'w1');
    });

    test('run replaces the runtime on re-run', () async {
      final r = _Recorder();
      final backend = _backend(r);
      await backend.init();
      await backend.run("jsr.render({type: 'text', data: 'first'});");
      await backend.run("jsr.render({type: 'text', data: 'second'});");
      await pumpEventQueue();
      expect(r.renders.map((t) => t['data']), ['first', 'second']);
    });

    test(
      'widget JS errors render the error card instead of crashing',
      () async {
        final r = _Recorder();
        final backend = _backend(r);
        await backend.init();
        await backend.run("throw new Error('kaput');");
        expect(r.renders, hasLength(1));
        expect(jsonEncode(r.renders.single), contains('Widget error: kaput'));
      },
    );

    test('a syntax error in widget JS is reported, not thrown', () async {
      final r = _Recorder();
      final backend = _backend(r);
      await backend.init();
      await backend.run('function ((');
      expect(r.renders, isEmpty);
    });

    test('console.log/warn/error are buffered and flushed', () async {
      final r = _Recorder();
      final backend = _backend(r);
      await backend.init();
      await backend.run('''
(function() {
  console.log('plain');
  console.warn('careful');
  console.error('broken');
})();
''');
      // Levels arrive as [W]/[E] prefixes from the bootstrap shim.
      final msgs = backend.flushLogs().map((l) => l['msg']).toList();
      expect(msgs, ['plain', '[W] careful', '[E] broken']);
      // Entries carry timestamps.
      expect(backend.flushLogs(), isEmpty);
      expect(r.logs, hasLength(3));
    });

    test('peekLogs returns a copy without clearing', () async {
      final backend = _backend(_Recorder());
      await backend.init();
      await backend.run("console.log('once');");
      expect(backend.peekLogs(), hasLength(1));
      expect(backend.peekLogs(), hasLength(1));
      expect(backend.flushLogs(), hasLength(1));
      expect(backend.peekLogs(), isEmpty);
    });

    test('console buffer is capped at 200 entries', () async {
      final backend = _backend(_Recorder());
      await backend.init();
      await backend.run('''
(function() {
  for (var i = 0; i < 205; i++) { console.log('line' + i); }
})();
''');
      final logs = backend.flushLogs();
      expect(logs, hasLength(200));
      expect(logs.first['msg'], 'line5');
      expect(logs.last['msg'], 'line204');
    });

    test('callEvent reaches the JS handleEvent handler', () async {
      final r = _Recorder();
      final backend = _backend(r);
      await backend.init();
      await backend.run('''
(function() {
  jsr.onEvent(function(actionId, payload) {
    jsr.setTitle(actionId + ':' + payload.x);
  });
})();
''');
      await backend.callEvent('tap', {'x': 7});
      expect(r.titles, ['tap:7']);
    });

    test('callEvent without a handler is a no-op', () async {
      final r = _Recorder();
      final backend = _backend(r);
      await backend.init();
      await backend.run('var unused = 1;');
      await backend.callEvent('tap', null);
      expect(r.titles, isEmpty);
    });

    test('exportState captures structured state', () async {
      final backend = _backend(_Recorder());
      await backend.init();
      expect(backend.exportedState, isNull);
      await backend.run("jsr.exportState({score: 42, lives: 3});");
      expect(backend.exportedState, {'score': 42, 'lives': 3});
    });

    test('updateTheme pushes theme changes into JS', () async {
      final backend = _backend(_Recorder());
      await backend.init();
      await backend.run('''
(function() {
  jsr.onThemeChange(function(t) { jsr.exportState({bg: t.bg}); });
})();
''');
      backend.updateTheme({'bg': '#ffffff', 'isDark': false});
      expect(backend.exportedState, {'bg': '#ffffff'});
    });

    test('updateTheme before run is a no-op', () async {
      final backend = _backend(_Recorder());
      backend.updateTheme({'bg': '#ffffff'});
    });

    test('dispatchHostEvent delivers key events to jsr.onKey', () async {
      final backend = _backend(_Recorder());
      await backend.init();
      await backend.run('''
(function() {
  jsr.onKey(function(ev) { jsr.exportState(ev); });
})();
''');
      backend.dispatchHostEvent('key', {'key': 'a', 'down': true});
      expect(backend.exportedState, {'key': 'a', 'down': true});
    });

    test('hostEventJs wraps the bootstrap dispatcher with JSON args', () {
      final js = QuickjsWidgetEngineBackend.hostEventJs(
        'scene3d.tap:s1',
        const {
          'modelId': 'box',
          'point': [1, 2, 3],
        },
      );
      expect(js, contains('__jsrHostEvent('));
      expect(js, contains('"scene3d.tap:s1"'));
      expect(js, contains('"modelId":"box"'));
    });

    test('storage round-trips through the bridge with promises', () async {
      final r = _Recorder();
      final backend = _backend(r, initialStorage: const {'seed': 7});
      await backend.init();
      await backend.run('''
(function() {
  jsr.storage.set('k', 5);
  jsr.storage.get('seed').then(function(v) {
    jsr.exportState({seed: v, k: 5});
  });
})();
''');
      await pumpEventQueue();
      expect(backend.exportedState, {'seed': 7, 'k': 5});
      expect(r.storageUpdates.last, containsPair('k', 5));
    });

    test('overridden handlers resolve JS promises', () async {
      void Function(String id, dynamic value) resolve = (_, _) {};
      final backend = _backend(
        _Recorder(),
        onResolveReady: (fn) => resolve = fn,
        secretsGetHandler: (id, key) async => resolve(id, 'secret:$key'),
        fetchHandler: (id, url, method, headers) async =>
            resolve(id, {'ok': true, 'url': url}),
      );
      await backend.init();
      await backend.run('''
(function() {
  jsr.secrets.get('token').then(function(v) {
    jsr.fetchJson('http://example.invalid/data').then(function(resp) {
      jsr.exportState({token: v, resp: resp.ok});
    });
  });
})();
''');
      await pumpEventQueue();
      expect(backend.exportedState?['token'], 'secret:token');
      expect(backend.exportedState?['resp'], true);
    });

    test(
      'overridden exec/secrets.set/loadAsset handlers resolve promises',
      () async {
        void Function(String id, dynamic value) resolve = (_, _) {};
        final backend = QuickjsWidgetEngineBackend(
          config: JsRuntimeConfig(
            onRender: (_) {},
            onSetTitle: (_) {},
            onStorageUpdate: (_) {},
            onResolveReady: (fn) => resolve = fn,
            execHandler: (id, cmd) async => resolve(id, {'out': 'ran: $cmd'}),
            secretsSetHandler: (id, key, value) async => resolve(id, true),
            loadAssetHandler: (id, path) async => resolve(id, 'asset:$path'),
          ),
        );
        _backends.add(backend);
        await backend.init();
        await backend.run('''
(function() {
  jsr.exec('echo hi').then(function(r) {
    jsr.secrets.set('k', 'v').then(function(ok) {
      jsr.loadAsset('hello.txt').then(function(text) {
        jsr.exportState({r: r.out, ok: ok, text: text});
      });
    });
  });
})();
''');
        await pumpEventQueue();
        expect(backend.exportedState, {
          'r': 'ran: echo hi',
          'ok': true,
          'text': 'asset:hello.txt',
        });
      },
    );

    test('default loadAsset handler reads files under appDir', () async {
      final backend = QuickjsWidgetEngineBackend(
        config: JsRuntimeConfig(
          appDir: '${Directory.current.path}/test/assets',
          onRender: (_) {},
          onSetTitle: (_) {},
          onStorageUpdate: (_) {},
        ),
      );
      _backends.add(backend);
      await backend.init();
        await backend.run('''
(function() {
  jsr.loadAsset('hello.txt').then(function(text) {
    jsr.exportState({head: text.substring(0, 5)});
  });
})();
''');
        // Real file I/O needs event-loop turns; pumpEventQueue alone is not
        // guaranteed to flush it under load.
        for (var i = 0; i < 50 && backend.exportedState == null; i++) {
          await Future<void>.delayed(const Duration(milliseconds: 10));
        }
        expect(backend.exportedState, {'head': 'hello'});
      });

    test('setTimeout fires through the Dart-backed interval timer', () async {
      final r = _Recorder();
      final backend = _backend(r);
      await backend.init();
      await backend.run('''
(function() {
  setTimeout(function() { jsr.setTitle('tick!'); }, 10);
})();
''');
      expect(r.titles, isEmpty);
      await Future<void>.delayed(const Duration(milliseconds: 100));
      expect(r.titles, ['tick!']);
    });

    test('calls after dispose are safe no-ops', () async {
      final r = _Recorder();
      final backend = _backend(r);
      await backend.init();
      await backend.run("jsr.onEvent(function(){ jsr.setTitle('nope'); });");
      await backend.dispose();
      _backends.remove(backend);
      await backend.callEvent('tap', null);
      backend.dispatchHostEvent('key', {'key': 'a', 'down': true});
      backend.updateTheme({'bg': '#000000'});
      expect(r.titles, isEmpty);
    });

    testWidgets('requestAnimationFrame ticks through the scheduler ticker', (
      tester,
    ) async {
      final r = _Recorder();
      final backend = _backend(r);
      await backend.init();
      await backend.run('''
(function() {
  requestAnimationFrame(function(t) { jsr.exportState({t: t}); });
})();
''');
      await tester.pump(const Duration(milliseconds: 100));
      expect(backend.exportedState?['t'], isA<num>());
      await backend.dispose();
      _backends.remove(backend);
    });
  });
}
