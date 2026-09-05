import 'dart:async';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// Tests for the declarative motion builtins (`jsr.motion.*`) and the
/// extended easing table (`jsr.ease`): the new canonical curves, the
/// cubicBezier factory, and the pinned semantics agreed with the yoclip
/// Motion-Canvas port (issue #1): ms units, clamped tween windows,
/// easing-as-string-or-function.
///
/// The builtins are pure JS in the bootstrap — the test runs a synthetic
/// source on the real QuickJS backend and reads the results via
/// jsr.exportState.
final bool hasQuickjsNativeLib = File(QuickjsFfi.libraryPath).existsSync();

/// Runs a synthetic widget [source] on the QuickJS backend. The backend is
/// disposed via [addTearDown].
Future<QuickjsWidgetEngineBackend> bootMotionSource(
  String source, {
  void Function(Map<String, dynamic>)? onRender,
}) async {
  final backend = QuickjsWidgetEngineBackend(
    config: JsRuntimeConfig(
      widgetId: 'motion-builtins-test',
      onRender: onRender ?? (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      initialStorage: const {},
    ),
  );
  addTearDown(backend.dispose);
  await backend.init();
  await backend.run(source).catchError((_) {});
  return backend;
}

/// Polls until the source has exported its state (or 1s pass).
Future<Map<String, dynamic>?> exportedStateOf(
  QuickjsWidgetEngineBackend backend,
) async {
  for (var i = 0; i < 100 && backend.exportedState == null; i++) {
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }
  return backend.exportedState;
}

void main() {
  if (!hasQuickjsNativeLib) return;

  test('jsr.motion + jsr.ease builtins', () async {
    const src = '''
(function() {
  var out = {};
  // tween: clamped window, linear default
  out.tweenBefore = jsr.motion.tween(0, 1000, 1000, 0, 10);
  out.tweenMid = jsr.motion.tween(1500, 1000, 1000, 0, 10);
  out.tweenAfter = jsr.motion.tween(5000, 1000, 1000, 0, 10);
  out.tweenZeroDur = jsr.motion.tween(5, 0, 0, 1, 7);
  // easing as STRING and as FUNCTION
  out.tweenEasedIn = jsr.motion.tween(1500, 1000, 1000, 0, 10, 'easeIn');
  out.tweenFn = jsr.motion.tween(1500, 1000, 1000, 0, 10, function(t){ return t*t*t; });
  // mapRange: clamped input, reversed output, eased, degenerate input range
  out.mapIdentity = jsr.motion.mapRange(5, 0, 10, 0, 10);
  out.mapHalf = jsr.motion.mapRange(5, 0, 10, 0, 100);
  out.mapClampLow = jsr.motion.mapRange(-5, 0, 10, 0, 100);
  out.mapClampHigh = jsr.motion.mapRange(99, 0, 10, 0, 100);
  out.mapReversed = jsr.motion.mapRange(5, 0, 10, 100, 0);
  out.mapEased = jsr.motion.mapRange(5, 0, 10, 0, 100, 'easeIn');
  out.mapDegenerate = jsr.motion.mapRange(5, 3, 3, 42, 100);
  // clamp
  out.clampMid = jsr.motion.clamp(5, 0, 10);
  out.clampLow = jsr.motion.clamp(-3, 0, 10);
  out.clampHigh = jsr.motion.clamp(42, 0, 10);
  // wave: zero-centered sine, phase in radians
  out.waveZero = jsr.motion.wave(0, 1000, 2);
  out.waveQuarter = jsr.motion.wave(250, 1000, 2);
  out.wavePhase = jsr.motion.wave(0, 1000, 2, Math.PI / 2);
  // new canonical easings
  out.eioCubic25 = jsr.ease.easeInOutCubic(0.25);
  out.eioQuart25 = jsr.ease.easeInOutQuart(0.25);
  out.eoExpoHalf = jsr.ease.easeOutExpo(0.5);
  out.aliasBack = jsr.ease.easeOutBack === jsr.ease.backOut;
  out.aliasBounce = jsr.ease.easeOutBounce === jsr.ease.bounce;
  out.aliasElastic = jsr.ease.easeOutElastic === jsr.ease.elastic;
  // cubicBezier: diagonal control points are the identity curve;
  // CSS 'ease' at half time; endpoints pinned; overshoot exceeds 1.
  var diagonal = jsr.ease.cubicBezier(0.25, 0.25, 0.75, 0.75);
  out.cbIdentityHalf = diagonal(0.5);
  var cssEase = jsr.ease.cubicBezier(0.25, 0.1, 0.25, 1);
  out.cbEaseHalf = cssEase(0.5);
  out.cbZero = cssEase(0);
  out.cbOne = cssEase(1);
  var overshoot = jsr.ease.cubicBezier(0.34, 1.56, 0.64, 1);
  var maxV = 0;
  for (var i = 0; i <= 20; i++) { var v = overshoot(i / 20); if (v > maxV) maxV = v; }
  out.cbOvershootMax = maxV;
  // destructuring works (authors do: const { tween } = jsr.motion)
  var mv = jsr.motion;
  out.destructured = mv.tween(1500, 1000, 1000, 0, 10) === 5;
  jsr.exportState(out);
})();
''';
    final backend = await bootMotionSource(src);
    final state = await exportedStateOf(backend);
    expect(state, isNotNull, reason: 'synthetic motion source did not run');

    // tween
    expect(state!['tweenBefore'], 0);
    expect(state['tweenMid'], 5.0);
    expect(state['tweenAfter'], 10);
    expect(state['tweenZeroDur'], 7);
    expect(state['tweenEasedIn'], 2.5);
    expect(state['tweenFn'], 1.25);
    // mapRange
    expect(state['mapIdentity'], 5.0);
    expect(state['mapHalf'], 50.0);
    expect(state['mapClampLow'], 0);
    expect(state['mapClampHigh'], 100);
    expect(state['mapReversed'], 50.0);
    expect(state['mapEased'], 25.0);
    expect(state['mapDegenerate'], 42);
    // clamp
    expect(state['clampMid'], 5);
    expect(state['clampLow'], 0);
    expect(state['clampHigh'], 10);
    // wave
    expect(state['waveZero'], closeTo(0, 1e-9));
    expect(state['waveQuarter'], closeTo(2, 1e-9));
    expect(state['wavePhase'], closeTo(2, 1e-9));
    // new easings
    expect(state['eioCubic25'], 0.0625);
    expect(state['eioQuart25'], 0.03125);
    expect(state['eoExpoHalf'], 0.96875);
    expect(state['aliasBack'], isTrue);
    expect(state['aliasBounce'], isTrue);
    expect(state['aliasElastic'], isTrue);
    // cubicBezier
    expect(state['cbIdentityHalf'], closeTo(0.5, 1e-4));
    expect(state['cbEaseHalf'], inInclusiveRange(0.75, 0.85));
    expect(state['cbZero'], 0);
    expect(state['cbOne'], 1);
    expect(state['cbOvershootMax'], greaterThan(1.0));
    // destructuring
    expect(state['destructured'], isTrue);
  });

  test('motion builtins work inside a real widget render loop', () async {
    // Widget-level smoke: a scene driven by jsr.motion renders the tweened
    // value into the tree.
    const src = '''
(function() {
  var frame = function(ms) {
    jsr.render({
      type: 'text',
      data: 'x:' + jsr.motion.tween(ms, 0, 1000, 0, 100, 'easeOut'),
    });
  };
  frame(250);
  jsr.exportState({ rendered: true });
})();
''';
    final renders = <Map<String, dynamic>>[];
    await bootMotionSource(src, onRender: renders.add);
    for (var i = 0; i < 100 && renders.isEmpty; i++) {
      await Future<void>.delayed(const Duration(milliseconds: 10));
    }
    expect(renders, isNotEmpty);
    // easeOut(0.25) = 1-(0.75)^2 = 0.4375 -> 'x:43.75'
    expect(renders.first['type'], 'text');
    expect(renders.first['data'], 'x:43.75');
  });
}
