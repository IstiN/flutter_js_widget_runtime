import 'dart:convert';
import 'dart:io';

import 'package:js_widget_runtime/src/tooling/jsr_widget_tool_core.dart';
import 'package:path/path.dart' as p;
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('parseJsrToolArgs', () {
    test('minimal test invocation', () {
      final spec = parseJsrToolArgs(['test', 'example/widgets/calculator']);
      expect(spec.mode, JsrToolMode.test);
      expect(spec.target, 'example/widgets/calculator');
      expect(spec.events, isEmpty);
      expect(spec.expectState, isNull);
      expect(spec.theme, 'dark');
    });

    test('screenshot subcommand carries size and theme', () {
      final spec = parseJsrToolArgs([
        'screenshot',
        'w.js',
        '--width',
        '320',
        '--height',
        '200',
        '--scale',
        '2',
        '--theme',
        'light',
        '--out',
        'shot.png',
      ]);
      expect(spec.mode, JsrToolMode.screenshot);
      expect(spec.width, 320);
      expect(spec.height, 200);
      expect(spec.scale, 2.0);
      expect(spec.theme, 'light');
      expect(spec.out, 'shot.png');
    });

    test('bare and JSON events', () {
      final spec = parseJsrToolArgs([
        'test',
        'w.js',
        '--event',
        'reset',
        '--event',
        '{"id":"add","payload":{"x":2}}',
        '--tap',
        'go',
      ]);
      expect(spec.events, hasLength(3));
      // Records with Map fields compare by identity — assert the parts.
      final (id0, payload0) = eventParts(spec.events[0]);
      final (id1, payload1) = eventParts(spec.events[1]);
      final (id2, payload2) = eventParts(spec.events[2]);
      expect(id0, 'reset');
      expect(payload0, isEmpty);
      expect(id1, 'add');
      expect(payload1, {'x': 2});
      expect(id2, 'go');
      expect(payload2, isEmpty);
    });

    test('expectations and fixtures', () {
      final spec = parseJsrToolArgs([
        'test',
        'w.js',
        '--expect-state',
        '{"counter":3}',
        '--expect-console',
        'ready',
        '--fixture',
        'api.example.com/data={"a":1}',
        '--storage',
        '{"seen":true}',
        '--freeze-clock',
      ]);
      expect(spec.expectState, {'counter': 3});
      expect(spec.expectConsole, ['ready']);
      expect(spec.fixtures, {'api.example.com/data': {'a': 1}});
      expect(spec.seedStorage, {'seen': true});
      expect(spec.freezeClock, isTrue);
    });

    test('spec round-trips through JSON (the env contract)', () {
      final spec = parseJsrToolArgs([
        'screenshot',
        'w',
        '--event',
        'go',
        '--expect-state',
        '{"a":1}',
        '--width',
        '300',
        '--machine',
      ]);
      final restored = JsrToolSpec.fromJson(spec.toJson());
      expect(restored.mode, spec.mode);
      expect(restored.width, 300);
      // Records hold Map fields (identity equality) — compare flattened.
      expect(
        [for (final (id, _) in restored.events.map(eventParts)) id],
        [for (final (id, _) in spec.events.map(eventParts)) id],
      );
      expect(
        [for (final (_, payload) in restored.events.map(eventParts)) payload],
        [for (final (_, payload) in spec.events.map(eventParts)) payload],
      );
      expect(restored.expectState, spec.expectState);
      expect(restored.machine, isTrue);
    });

    test('usage errors', () {
      expect(
        () => parseJsrToolArgs(['test']),
        throwsA(isA<JsrToolUsageException>()),
      );
      expect(
        () => parseJsrToolArgs(['test', 'w.js', '--event']),
        throwsA(isA<JsrToolUsageException>()),
      );
      expect(
        () => parseJsrToolArgs(['test', 'w.js', '--theme', 'solarized']),
        throwsA(isA<JsrToolUsageException>()),
      );
      expect(
        () => parseJsrToolArgs(['test', 'w.js', '--expect-state', '{oops']),
        throwsA(isA<JsrToolUsageException>()),
      );
      expect(
        () => parseJsrToolArgs(['test', 'w.js', '--fixture', 'no-equals']),
        throwsA(isA<JsrToolUsageException>()),
      );
    });
  });

  group('jsonContains (deep-subset matcher)', () {
    test('subset of a map matches', () {
      expect(
        jsonContains({'a': 1, 'b': {'c': [1, 2]}}, {'b': {'c': [1, 2]}}),
        isTrue,
      );
    });

    test('missing key or wrong scalar fails', () {
      expect(jsonContains({'a': 1}, {'b': 1}), isFalse);
      expect(jsonContains({'a': 1}, {'a': 2}), isFalse);
    });

    test('lists match order-sensitively and fully', () {
      expect(jsonContains([1, 2], [1, 2]), isTrue);
      expect(jsonContains([1, 2], [2, 1]), isFalse);
      expect(jsonContains([1], [1, 2]), isFalse);
    });

    test('nested subset inside state', () {
      final state = {
        'pomodoro': {'completed': 3, 'mode': 'focus'},
      };
      expect(
        jsonContains(state, {'pomodoro': {'completed': 3}}),
        isTrue,
      );
      expect(
        jsonContains(state, {'pomodoro': {'completed': 4}}),
        isFalse,
      );
    });
  });

  group('loadWidgetSource', () {
    late Directory dir;
    setUp(() async {
      dir = await Directory.systemTemp.createTemp('jsr_tool_core');
    });
    tearDown(() async => dir.delete(recursive: true));

    test('a widget directory yields the manifest id and source', () {
      Directory(p.join(dir.path, 'my-widget')).createSync();
      File(p.join(dir.path, 'my-widget', 'widget.js'))
          .writeAsStringSync('jsr.render({});');
      File(p.join(dir.path, 'my-widget', 'manifest.json')).writeAsStringSync(
        jsonEncode({'id': 'manifest-id', 'version': '1.0.0'}),
      );
      final (source, id) =
          loadWidgetSource(p.join(dir.path, 'my-widget'));
      expect(id, 'manifest-id');
      expect(source, contains('jsr.render'));
    });

    test('a bare .js file uses the file name', () {
      File(p.join(dir.path, 'standalone.js')).writeAsStringSync('// hi');
      final (source, id) = loadWidgetSource(p.join(dir.path, 'standalone.js'));
      expect(id, 'standalone');
      expect(source, '// hi');
    });

    test('missing target and wrong extension throw usage errors', () {
      expect(
        () => loadWidgetSource(p.join(dir.path, 'nope')),
        throwsA(isA<JsrToolUsageException>()),
      );
      File(p.join(dir.path, 'notes.txt')).writeAsStringSync('x');
      expect(
        () => loadWidgetSource(p.join(dir.path, 'notes.txt')),
        throwsA(isA<JsrToolUsageException>()),
      );
    });
  });

  test('defaultQuickjsLibEnv finds a built bridge in the pub cache', () {
    final env = defaultQuickjsLibEnv();
    if (env.isEmpty) {
      // No pub-cache build — the author must point JSR_QUICKJS_LIB
      // themselves; nothing to assert.
      return;
    }
    expect(env['JSR_QUICKJS_LIB'], endsWith('libquickjs_bridge.so'));
    expect(File(env['JSR_QUICKJS_LIB']!).existsSync(), isTrue);
  });
}
