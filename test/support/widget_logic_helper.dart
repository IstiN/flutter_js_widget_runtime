import 'dart:async';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// Shared helpers for running the real `example/widgets/<id>/widget.js` files
/// on the QuickJS FFI backend with no Flutter UI.
///
/// Use this for logic tests: fire events via [callEvent], read state via
/// [exportedState], and mock network calls via [mockFetch].
final bool hasQuickjsNativeLib = File(QuickjsFfi.libraryPath).existsSync();

/// A small container returned by [bootWidget]. It holds the backend and a few
/// convenience methods so tests stay short.
class WidgetLogicHarness {
  WidgetLogicHarness(this.backend);

  final QuickjsWidgetEngineBackend backend;

  Map<String, dynamic>? get state => backend.exportedState;

  /// Fires [actionId] / [payload] and waits until the widget re-exports state
  /// (or until [timeout] passes). Returns the new state for easy chaining.
  Future<Map<String, dynamic>?> callEvent(
    String actionId, {
    Map<String, dynamic>? payload,
    Duration timeout = const Duration(milliseconds: 500),
  }) async {
    final before = state;
    await backend.callEvent(actionId, payload);
    final deadline = DateTime.now().add(timeout);
    while (DateTime.now().isBefore(deadline)) {
      await Future<void>.delayed(const Duration(milliseconds: 10));
      final now = state;
      if (now != null && (before == null || !_mapsEqual(before, now))) {
        return now;
      }
    }
    return state;
  }

  /// Dispatches a host key event. The JS bootstrap forwards payloads with
  /// target `'key'` to the widget's `jsr.onKey` handler.
  Future<void> keyDown(String key, {bool repeat = false}) async {
    backend.dispatchHostEvent('key', {
      'key': key,
      'code': 'Key${key.toUpperCase()}',
      'down': true,
      'repeat': repeat,
    });
  }

  Future<void> keyUp(String key) async {
    backend.dispatchHostEvent('key', {
      'key': key,
      'code': 'Key${key.toUpperCase()}',
      'down': false,
      'repeat': false,
    });
  }

  /// Pumps the Flutter test binding in small steps so that [Ticker]-driven
  /// game loops (requestAnimationFrame) actually advance. A single large
  /// [tester.pump] does not necessarily fire every frame.
  Future<void> pumpFrames(WidgetTester tester, Duration total, {
    Duration step = const Duration(milliseconds: 16),
  }) async {
    final steps = total.inMilliseconds ~/ step.inMilliseconds;
    for (var i = 0; i < steps; i++) {
      await tester.pump(step);
    }
  }

  static bool _mapsEqual(Map<dynamic, dynamic> a, Map<dynamic, dynamic> b) {
    if (a.length != b.length) return false;
    for (final entry in a.entries) {
      if (!b.containsKey(entry.key)) return false;
      if (entry.value is Map && b[entry.key] is Map) {
        if (!_mapsEqual(entry.value as Map, b[entry.key] as Map)) return false;
      } else if (entry.value is List && b[entry.key] is List) {
        final la = entry.value as List;
        final lb = b[entry.key] as List;
        if (la.length != lb.length) return false;
        for (var i = 0; i < la.length; i++) {
          if (la[i] is Map && lb[i] is Map) {
            if (!_mapsEqual(la[i] as Map, lb[i] as Map)) return false;
          } else if (la[i] != lb[i]) {
            return false;
          }
        }
      } else if (entry.value != b[entry.key]) {
        return false;
      }
    }
    return true;
  }
}

/// Boots a demo widget from `example/widgets/<id>/widget.js` on the QuickJS
/// backend. When [fetchResponses] is provided, `jsr.fetchJson` calls are
/// intercepted and resolved with the matching value (keyed by URL substring).
/// [onStorageUpdate] / [onRender] observe host-side storage writes and
/// rendered trees — used to simulate host state-sync broadcasts in tests.
Future<WidgetLogicHarness> bootWidget(
  String widgetId, {
  Map<String, dynamic> initialStorage = const {},
  Map<String, dynamic> fetchResponses = const {},
  void Function(Map<String, dynamic> storage)? onStorageUpdate,
  void Function(Map<String, dynamic> tree)? onRender,
}) async {
  TestWidgetsFlutterBinding.ensureInitialized();
  void Function(String id, dynamic value)? resolve;
  final backend = QuickjsWidgetEngineBackend(
    config: JsRuntimeConfig(
      widgetId: widgetId,
      instanceId: 'logic-test-$widgetId',
      onRender: onRender ?? (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: onStorageUpdate ?? (_) {},
      initialStorage: initialStorage,
      onResolveReady: (r) => resolve = r,
      fetchHandler: (id, url, method, headers) async {
        for (final entry in fetchResponses.entries) {
          if (url.contains(entry.key)) {
            resolve?.call(id, entry.value);
            return;
          }
        }
        // No mock matched — resolve with a clear error so the widget shows
        // it in exportState instead of hanging forever.
        resolve?.call(id, {'__error': 'No mock for $url'});
      },
      loadAssetHandler: (id, path) async {
        // Demo widgets only load bundled assets; resolve as missing so the
        // widget can degrade gracefully in a headless logic test.
        resolve?.call(id, null);
      },
    ),
  );
  await backend.init();
  unawaited(
    backend
        .run(File('example/widgets/$widgetId/widget.js').readAsStringSync())
        .catchError((_) {}),
  );
  // Wait for the first render/exportState.
  for (var i = 0; i < 100 && backend.exportedState == null; i++) {
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }
  return WidgetLogicHarness(backend);
}
