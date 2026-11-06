import 'dart:async';

import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

/// Delivers a synthetic mouse pointer event through the `three.input:main`
/// channel with the canonical pointer payload (jscpd: one payload shape for
/// the interaction suites).
void dispatchThreePointerEvent(
  JsWidgetEngineBackend backend,
  String type, {
  required double x,
  required double y,
  int buttons = 0,
}) {
  backend.dispatchHostEvent('three.input:main', <String, dynamic>{
    'type': type,
    'pointerId': 7,
    'pointerType': 'mouse',
    'isPrimary': true,
    'button': 0,
    'buttons': buttons,
    'clientX': x,
    'clientY': y,
    'pageX': x,
    'pageY': y,
  });
}

/// A running widget engine plus its render log — lets tests drive host
/// events and capture the resulting tree. Shared by the golden suite and
/// the tile-snapshot matrix (jscpd: keep the poll loops in one place).
class RunningWidget {
  RunningWidget(this.backend, this.renders);

  final QuickjsWidgetEngineBackend backend;
  final List<Map<String, dynamic>> renders;

  /// Stops the JS engine's RAF ticker and interval timers without disposing
  /// the bridge or its scene controllers.
  void stopEngineTimers() => backend.debugStopTimers();

  Future<void> dispose() => backend.dispose();

  /// Delivers a host event (viewport, key, …) and waits for the re-render
  /// it triggers, mirroring what JsWidgetRuntimeWidget does on layout.
  Future<Map<String, dynamic>?> hostEvent(
    String target,
    Map<String, dynamic> payload, [
    int waitFor = 20,
  ]) async {
    final before = renders.length;
    backend.dispatchHostEvent(target, payload);
    for (var i = 0; i < waitFor && renders.length <= before; i++) {
      await Future<void>.delayed(const Duration(milliseconds: 10));
    }
    return renders.length > before ? renders.last : null;
  }
}
