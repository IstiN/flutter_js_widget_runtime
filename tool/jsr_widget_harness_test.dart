import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/tooling/jsr_widget_tool_core.dart';

import 'jsr_widget_harness.dart';

/// The `flutter test` entry point of the `jsr_widget` CLI. The CLI wrapper
/// (`bin/jsr_widget.dart`) builds a JSR_TOOL_SPEC environment variable and
/// runs THIS file; the machine-readable report comes back on stdout behind
/// [kJsrToolResultMarker].
void main() {
  final specJson = Platform.environment['JSR_TOOL_SPEC'];
  if (specJson == null || specJson.isEmpty) {
    test('jsr_widget harness requires JSR_TOOL_SPEC', () {
      markTestSkipped(
        'JSR_TOOL_SPEC is not set — run through bin/jsr_widget.dart',
      );
    });
    return;
  }
  final spec = JsrToolSpec.fromJson(
    jsonDecode(specJson) as Map<String, dynamic>,
  );
  const timeout = Timeout(Duration(minutes: 3));

  if (spec.mode == JsrToolMode.test) {
    test('headless widget run (logic)', () async {
      final report = await prepareTestRun(spec);
      expect(
        report['failures'],
        isEmpty,
        reason: 'boot failed: ${jsonEncode(report['failures'])}',
      );
    }, timeout: timeout);

    testWidgets('headless widget run (captures)', (tester) async {
      await processTestCaptures(spec, tester);
    }, timeout: timeout);

    test('headless widget run (checks)', () async {
      final report = await finishTestRun(spec);
      final line = '$kJsrToolResultMarker ${jsonEncode(report)}';
      // A bare line so the CLI wrapper can grep it from the runner output.
      // ignore: avoid_print
      print(line);
      if (spec.out != null) {
        File(spec.out!).parent.createSync(recursive: true);
        File(spec.out!).writeAsStringSync(jsonEncode(report));
      }
      expect(
        report['ok'],
        true,
        reason: 'expectations failed: ${jsonEncode(report['failures'])}',
      );
    }, timeout: timeout);
    return;
  }

  // Screenshot: boot on the real event loop first, then pump + capture.
  var report = <String, dynamic>{};
  test('boot for screenshot', () async {
    report = await prepareScreenshot(spec);
    expect(
      report['ok'],
      true,
      reason: 'boot failed: ${jsonEncode(report['failures'])}',
    );
  }, timeout: timeout);

  testWidgets('capture screenshot', (tester) async {
    final withShot = await captureScreenshot(spec, report, tester);
    // ignore: avoid_print
    print('$kJsrToolResultMarker ${jsonEncode(withShot)}');
    expect(withShot['screenshot'], isNotNull);
  }, timeout: timeout);

  tearDownAll(() async {
    await disposeScreenshotSession();
  });
}
