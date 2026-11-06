import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart' show hasQuickjsNativeLib;

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'three host key code normalization',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('three runtime normalizes host key payloads to DOM codes', (
    tester,
  ) async {
    // Official three.js modules (AnimationAction drivers, OrbitControls)
    // switch on DOM KeyboardEvent.code — 'ArrowUp', 'ShiftLeft', 'KeyW'.
    // The host lane sends Flutter labels: key 'arrowUp' plus
    // physicalKey.debugName in code ('Arrow Up', 'Shift Left', 'Key W').
    // The runtime must normalize before dispatching or every keypress is
    // silently dropped (the webgl_animation_walk freeze).
    const widget = '''
      var seen = { dom: [], onKey: [] };
      function publish(){ jsr.exportState({ domCodes: seen.dom.slice(), onKeyKeys: seen.onKey.slice() }); }
      jsr.onKey(function(p){ seen.onKey.push(p.key + '=' + p.down); publish(); });
      var canvas = jsr.three.createCanvas('main');
      canvas.focus();
      canvas.addEventListener('keydown', function(e){ seen.dom.push('down:' + e.code); publish(); });
      canvas.addEventListener('keyup', function(e){ seen.dom.push('up:' + e.code); publish(); });
      publish();
''';
    final harness = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: widget,
      instanceId: 'three-key-code-test',
    );
    expect(harness.engine.exportedState?['domCodes'], isEmpty);

    // Exactly what jsKeyEventPayload emits for real Flutter key events.
    const arrowUpDown = {
      'key': 'arrowUp',
      'code': 'Arrow Up',
      'down': true,
      'repeat': false,
    };
    const arrowUpDownRepeat = {
      'key': 'arrowUp',
      'code': 'Arrow Up',
      'down': true,
      'repeat': true,
    };
    const arrowUpUp = {
      'key': 'arrowUp',
      'code': 'Arrow Up',
      'down': false,
      'repeat': false,
    };
    const shiftDown = {
      'key': 'shiftLeft',
      'code': 'Shift Left',
      'down': true,
      'repeat': false,
    };
    const keyWDown = {
      'key': 'w',
      'code': 'Key W',
      'down': true,
      'repeat': false,
    };

    for (final payload in [
      arrowUpDown,
      arrowUpDownRepeat,
      arrowUpUp,
      shiftDown,
      keyWDown,
    ]) {
      harness.backend.dispatchHostEvent('key', payload);
    }

    final state = harness.engine.exportedState;
    // DOM lane must see DOM KeyboardEvent.code values — no whitespace, no
    // camelCase Flutter labels — or official modules never match a branch.
    expect(state?['domCodes'], [
      'down:ArrowUp',
      'down:ArrowUp',
      'up:ArrowUp',
      'down:ShiftLeft',
      'down:KeyW',
    ]);
    // The jsr.onKey contract keeps the documented camelCase labels.
    expect(state?['onKeyKeys'], [
      'arrowUp=true',
      'arrowUp=true',
      'arrowUp=false',
      'shiftLeft=true',
      'w=true',
    ]);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 120)));
}
