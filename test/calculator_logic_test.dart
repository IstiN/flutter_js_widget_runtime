import 'dart:async';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// Logic tests for a JS widget: the real `widget.js` runs on the QuickJS
/// backend — no Flutter UI, no pumpWidget. Button events go in through
/// `callEvent`, assertions read `backend.exportedState` (fed by the widget's
/// `jsr.exportState`). Use this pattern to test widget LOGIC (state machines,
/// calculations, fetch handling); use the golden suite for visuals.
final bool _hasNativeLib = File(QuickjsFfi.libraryPath).existsSync();

/// Boots the calculator widget and returns its backend.
Future<QuickjsWidgetEngineBackend> _bootCalculator() async {
  final backend = QuickjsWidgetEngineBackend(
    config: JsRuntimeConfig(
      widgetId: 'calculator',
      onRender: (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
    ),
  );
  await backend.init();
  unawaited(
    backend
        .run(
          File('example/widgets/calculator/widget.js').readAsStringSync(),
        )
        .catchError((_) {}),
  );
  // Wait for the first render/exportState.
  for (var i = 0; i < 50 && backend.exportedState == null; i++) {
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }
  return backend;
}

/// Fires a button event and waits for the widget to re-export its state.
Future<void> _tap(QuickjsWidgetEngineBackend backend, String key) async {
  await backend.callEvent('btn_$key');
  for (var i = 0; i < 50; i++) {
    await Future<void>.delayed(const Duration(milliseconds: 10));
    if (backend.exportedState != null) return;
  }
}

void main() {
  if (!_hasNativeLib) return;

  group('calculator widget logic (real widget.js on QuickJS)', () {
    late QuickjsWidgetEngineBackend backend;

    setUp(() async => backend = await _bootCalculator());
    tearDown(() => backend.dispose());

    test('digits accumulate into the display', () async {
      await _tap(backend, '1');
      await _tap(backend, '2');
      await _tap(backend, '3');
      expect(backend.exportedState?['display'], '123');
    });

    test('7 + 2 = evaluates to 9', () async {
      await _tap(backend, '7');
      await _tap(backend, '+');
      await _tap(backend, '2');
      await _tap(backend, '=');
      expect(backend.exportedState?['display'], '9');
    });

    test('C clears the expression', () async {
      await _tap(backend, '9');
      await _tap(backend, '9');
      await _tap(backend, 'C');
      expect(backend.exportedState?['display'], '0');
    });

    test('backspace trims the last digit', () async {
      await _tap(backend, '4');
      await _tap(backend, '5');
      await _tap(backend, '⌫');
      expect(backend.exportedState?['display'], '4');
    });

    test('division by zero shows Error', () async {
      await _tap(backend, '1');
      await _tap(backend, '÷');
      await _tap(backend, '0');
      await _tap(backend, '=');
      expect(backend.exportedState?['display'], 'Error');
    });
  });
}
