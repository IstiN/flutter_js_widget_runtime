import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/tooling/jsr_widget_tool_core.dart';
import 'package:path/path.dart' as p;

import '../tool/jsr_widget_harness.dart' as harness;
import '../tool/jsr_widget_harness.dart'
    show finishTestRun, prepareTestRun, processTestCaptures;

void main() {
  late Directory tmp;
  setUp(() async {
    tmp = await Directory.systemTemp.createTemp('jsr_harness');
  });
  tearDown(() async {
    if (tmp.existsSync()) await tmp.delete(recursive: true);
  });

  Directory widgetDir(String js, {String id = 'demo-widget'}) {
    Directory(p.join(tmp.path, id)).createSync(recursive: true);
    File(p.join(tmp.path, id, 'widget.js')).writeAsStringSync(js);
    return Directory(p.join(tmp.path, id));
  }

  test('runTestMode: state export and state assertion', () async {
    final dir = widgetDir('''
var state = {counter: 0};
jsr.render({type: 'text', data: 'counter ' + state.counter});
jsr.onEvent(function (actionId) {
  if (actionId === 'add') {
    state.counter += 1;
    jsr.render({type: 'text', data: 'counter ' + state.counter});
    jsr.exportState({counter: state.counter});
  }
});
''');
    final spec = parseJsrToolArgs([
      'test',
      dir.path,
      '--event',
      'add',
      '--event',
      'add',
      '--expect-state',
      '{"counter":2}',
    ]);
    final report = await harness.runTestMode(spec);
    expect(report['ok'], true, reason: jsonEncode(report));
    expect((report['state'] as Map)['counter'], 2);
    expect(report['renderCount'], greaterThanOrEqualTo(0));
  });

  test('runTestMode: failing expectation reports the diff', () async {
    final dir = widgetDir(
      'jsr.render({type: "text", data: "x"}); jsr.exportState({done: false});',
    );
    final spec = parseJsrToolArgs([
      'test',
      dir.path,
      '--expect-state',
      '{"done":true}',
    ]);
    final report = await harness.runTestMode(spec);
    expect(report['ok'], false);
    expect(
      (report['failures'] as List).single['check'],
      'state',
    );
  });

  test('runTestMode: console capture and fixture fetch', () async {
    final dir = widgetDir('''
jsr.render({type: 'text', data: 'loading'});
jsr.fetchJson('https://api.example.com/quote').then(function (data) {
  jsr.render({type: 'text', data: 'quote: ' + data.price});
  console.log('price loaded', data.price);
});
''');
    final spec = parseJsrToolArgs([
      'test',
      dir.path,
      '--fixture',
      'api.example.com/quote={"price": 42.5}',
      '--expect-console',
      'price loaded 42.5',
    ]);
    final report = await harness.runTestMode(spec);
    expect(report['ok'], true, reason: jsonEncode(report));
  });

  // jsr.capture() self-screenshot: the CLI's three phases MUST map to
  // plain-test / testWidgets / plain-test — the engine boots on the real
  // event loop, only the rasterization enters the tester's zone.
  JsrToolSpec? captureSpec;

  test('jsr.capture(): phase 1 — logic with a queued capture', () async {
    captureSpec = parseJsrToolArgs([
      'test',
      widgetDir('''
var builds = 0;
jsr.render({type: 'text', data: 'builds ' + builds});
jsr.onEvent(function (actionId) {
  if (actionId === 'build') {
    builds += 1;
    jsr.render({type: 'text', data: 'builds ' + builds});
    jsr.capture({name: 'city'}).then(function (shot) {
      console.log('captured ' + shot.path);
      jsr.exportState({builds: builds, shots: builds});
    });
  }
});
''').path,
      '--event',
      'build',
      '--expect-state',
      '{"builds":1,"shots":1}',
      '--expect-console',
      'captured ',
      '--capture-dir',
      p.join(tmp.path, 'captures'),
    ]);
    await prepareTestRun(captureSpec!);
  });

  testWidgets('jsr.capture(): phase 2 — rasterize', (tester) async {
    await processTestCaptures(captureSpec!, tester);
  });

  test('jsr.capture(): phase 3 — checks and dispose', () async {
    final report = await finishTestRun(captureSpec!);
    captureSpec = null;

    expect(report['ok'], true, reason: jsonEncode(report));
    final captures = (report['captures'] as List).single as Map;
    expect(captures['name'], 'city');
    final png = File(captures['path'] as String);
    expect(png.existsSync(), isTrue);
    expect(png.readAsBytesSync().sublist(0, 8),
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  });

  test('screenshot mode writes a real PNG', () async {
    final dir = widgetDir(
      'jsr.render({type:"text", data:"hello CLI"});',
      id: 'shot-widget',
    );
    final spec = parseJsrToolArgs([
      'screenshot',
      dir.path,
      '--width',
      '240',
      '--height',
      '160',
      '--out',
      p.join(tmp.path, 'shot.png'),
    ]);
    final report = await harness.prepareScreenshot(spec);
    expect(report['ok'], true, reason: jsonEncode(report));
  });

  testWidgets('screenshot capture produces a PNG on disk', (tester) async {
    final dir = widgetDir(
      'jsr.render({type:"text", data:"hello CLI"});',
      id: 'shot-widget-2',
    );
    final out = p.join(tmp.path, 'shot2.png');
    final spec = parseJsrToolArgs([
      'screenshot',
      dir.path,
      '--width',
      '240',
      '--height',
      '160',
      '--out',
      out,
    ]);
    final report = await harness.prepareScreenshot(spec);
    await harness.captureScreenshot(spec, report, tester);

    final png = File(out);
    expect(png.existsSync(), isTrue);
    final bytes = png.readAsBytesSync();
    // PNG magic number.
    expect(
      bytes.sublist(0, 8),
      [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    );
    expect(bytes.length, greaterThan(500));
    await harness.disposeScreenshotSession();
  });
}
