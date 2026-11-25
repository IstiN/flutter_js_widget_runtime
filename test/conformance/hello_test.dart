import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

import 'runner_fixture.dart';

/// `hello` seed end to end through the conformance runner (issue #9 / F1).
void main() {
  if (!QuickjsFfi.isAvailable) {
    return; // CI builds the bridge first (see pr.yml job conformance).
  }

  testWidgets('hello renders twice and reports the tap title', (tester) async {
    final result = await runSeedFixture(tester, 'hello');

    expect(result['platform'], 'flutter');
    expect(result['error'], isNull);
    final renders = (result['renders'] as List).cast<String>();
    expect(renders.length, 2);
    expect(jsonDecode(renders[0])['type'], 'center');

    final trace = (result['trace'] as List).cast<String>();
    expect(trace, ['render', 'set_title', 'render']);
    expect(result['title'], 'Tapped: 1');

    final dump = result['dump'] as Map<String, dynamic>;
    expect(dump['nodeId'], 'n0');
    expect(dump['type'], 'center');
    final button = collectNodes(dump, 'textButton').single;
    expect((button['props'] as Map)['data'], 'Tap me');
    expect(button['events'], {'onTap': 'tap'});

    final finalDump = result['finalDump'] as Map<String, dynamic>;
    final texts = collectNodes(finalDump, 'text');
    expect((texts[0]['props'] as Map)['data'], 'Hello from JS!');
    expect((texts[1]['props'] as Map)['data'], 'Taps: 1');
  });
}
