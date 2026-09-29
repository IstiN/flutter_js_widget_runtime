library;

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:js_widget_runtime/src/tooling/jsr_widget_tool_core.dart';

/// The Flutter side of the `jsr_widget` CLI (see
/// lib/src/tooling/jsr_widget_tool_core.dart for the Flutter-free core).
///
/// `tool/jsr_widget_harness_test.dart` reads the JSR_TOOL_SPEC environment
/// variable the CLI builds and dispatches into the two modes here:
/// - test mode: the widget's real JavaScript runs on the QuickJS backend
///   with no rendering — events are dispatched, console/state captured,
///   expectations checked;
/// - screenshot mode: the rendered tree is pumped through
///   [JsonWidgetRenderer] (the production renderer) and rasterized to PNG.


class _Session {
  _Session(this.backend, this.renders, this.widgetId);

  final QuickjsWidgetEngineBackend backend;
  final List<Map<String, dynamic>> renders;
  final String widgetId;
}

/// Boots the widget's engine on the real event loop and waits for the
/// first `jsr.render` (or [JsrToolSpec.bootTimeoutMs]).
Future<_Session> _boot(JsrToolSpec spec) async {
  final (source, widgetId) = loadWidgetSource(spec.target);
  void Function(String id, dynamic value)? resolve;
  final renders = <Map<String, dynamic>>[];
  final backend = QuickjsWidgetEngineBackend(
    config: JsRuntimeConfig(
      widgetId: widgetId,
      initialStorage: spec.seedStorage,
      onRender: renders.add,
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      onResolveReady: (fn) => resolve = fn,
      fetchHandler: spec.fixtures.isEmpty
          ? null
          : (id, url, method, headers) async {
              for (final entry in spec.fixtures.entries) {
                if (url.contains(entry.key)) {
                  resolve?.call(id, entry.value);
                  return;
                }
              }
              // No fixture matched: resolve empty so awaited fetches settle
              // deterministically instead of hanging the poll loop.
              resolve?.call(id, null);
            },
    ),
  );
  await backend.init();
  final hostBootstrap = spec.freezeClock
      ? 'Date.now = function() { return 1760000000000; };'
          'Date.prototype.toLocaleTimeString = function() { return "12:34"; };'
      : null;
  // RAF-loop widgets never let run() complete — race it like the goldens.
  unawaited(backend.run(source, hostBootstrapJs: hostBootstrap).catchError((_) {}));
  final deadline =
      DateTime.now().add(Duration(milliseconds: spec.bootTimeoutMs));
  while (renders.isEmpty && DateTime.now().isBefore(deadline)) {
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }
  return _Session(backend, renders, widgetId);
}

Future<void> _waitForRender(
  List<Map<String, dynamic>> renders,
  int before,
  int settleMs,
) async {
  final deadline = DateTime.now().add(Duration(milliseconds: settleMs));
  while (renders.length <= before && DateTime.now().isBefore(deadline)) {
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }
}

/// TEST MODE — headless logic run. Returns the machine-readable report.
Future<Map<String, dynamic>> runTestMode(JsrToolSpec spec) async {
  final sw = Stopwatch()..start();
  final failures = <Map<String, dynamic>>[];
  List<Map<String, dynamic>> logs = const [];
  Map<String, dynamic>? state;
  var renderCount = 0;
  _Session? session;
  try {
    session = await _boot(spec);
  } catch (e) {
    failures.add({
      'check': 'boot',
      'expected': 'engine boots and renders',
      'actual': '$e',
    });
  }
  if (session != null) {
    try {
      for (final event in spec.events) {
        final (id, payload) = eventParts(event);
        final before = session.renders.length;
        await session.backend.callEvent(id, payload);
        await _waitForRender(session.renders, before, spec.settleMs);
      }
      state = session.backend.exportedState;
      logs = session.backend.peekLogs();
      renderCount = session.renders.length;

      final expectedState = spec.expectState;
      if (expectedState != null &&
          !jsonContains(state ?? <String, dynamic>{}, expectedState)) {
        failures.add({
          'check': 'state',
          'expected': expectedState,
          'actual': state,
        });
      }
      final consoleText = [
        for (final log in logs) log['message'] ?? jsonEncode(log),
      ].join('\n');
      for (final substr in spec.expectConsole) {
        if (!consoleText.contains(substr)) {
          failures.add({
            'check': 'console',
            'expected': 'output contains "$substr"',
            'actual': consoleText,
          });
        }
      }
    } finally {
      await session.backend.dispose();
    }
  }
  return buildReport(
    ok: failures.isEmpty,
    widgetId: session?.widgetId ?? spec.target,
    mode: 'test',
    logs: logs,
    state: state,
    renderCount: renderCount,
    failures: failures,
    durationMs: sw.elapsedMilliseconds,
  );
}

/// Screenshot state shared between the boot phase (plain test, real event
/// loop) and the pump phase (testWidgets, fake-async safe capture).
_Session? _screenshotSession;
Map<String, dynamic>? _screenshotTree;

/// SCREENSHOT MODE, phase 1 — boot the engine, dispatch the events, keep
/// the final tree for the pump phase.
Future<Map<String, dynamic>> prepareScreenshot(JsrToolSpec spec) async {
  final sw = Stopwatch()..start();
  final session = await _boot(spec);
  for (final event in spec.events) {
    final (id, payload) = eventParts(event);
    final before = session.renders.length;
    await session.backend.callEvent(id, payload);
    await _waitForRender(session.renders, before, spec.settleMs);
  }
  _screenshotSession = session;
  _screenshotTree = session.renders.isEmpty ? null : session.renders.last;
  // ignore: invalid_use_of_visible_for_testing_member
  session.backend.debugStopTimers();
  return buildReport(
    ok: _screenshotTree != null,
    widgetId: session.widgetId,
    mode: 'screenshot',
    logs: session.backend.peekLogs(),
    state: session.backend.exportedState,
    renderCount: session.renders.length,
    failures: _screenshotTree == null
        ? [
            {
              'check': 'render',
              'expected': 'at least one jsr.render call',
              'actual': 'none within ${spec.bootTimeoutMs} ms',
            },
          ]
        : const [],
    durationMs: sw.elapsedMilliseconds,
  );
}

/// The host the screenshot pumps through — same shape as the golden
/// harness (MaterialApp + Scaffold + the production renderer).
Widget screenshotHost(JsrToolSpec spec) {
  final dark = spec.theme != 'light';
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: dark ? ThemeData.dark(useMaterial3: true) : ThemeData.light(useMaterial3: true),
    home: Scaffold(
      backgroundColor: dark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      body: Center(
        child: SizedBox(
          width: spec.width.toDouble(),
          height: spec.height.toDouble(),
          child: JsonWidgetRenderer(
            onEvent: (_, __) {},
            voxelWorld: _screenshotSession?.backend.voxelWorld,
          ).build(_screenshotTree),
        ),
      ),
    ),
  );
}

/// SCREENSHOT MODE, phase 2 — pump the tree and rasterize it to
/// [JsrToolSpec.out]. Returns the updated report (screenshot path added).
Future<Map<String, dynamic>> captureScreenshot(
  JsrToolSpec spec,
  Map<String, dynamic> report,
  WidgetTester tester,
) async {
  tester.view.devicePixelRatio = spec.scale;
  tester.view.physicalSize = Size(
    spec.width * spec.scale,
    spec.height * spec.scale,
  );
  addTearDown(tester.view.reset);
  await tester.pumpWidget(screenshotHost(spec));
  await tester.pump(const Duration(milliseconds: 16));
  await tester.pump(const Duration(milliseconds: 16));

  // PNG encoding is REAL async (platform channel) — it must run outside
  // the fake-async zone or it never completes.
  final png = await tester.runAsync(() async {
    final image = await captureImage(
      find.byType(MaterialApp).evaluate().single,
    );
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    final data = bytes!.buffer.asUint8List();
    image.dispose();
    return data;
  });
  final out = spec.out ?? 'jsr-widget-shot.png';
  File(out).parent.createSync(recursive: true);
  File(out).writeAsBytesSync(png!);
  return {
    ...report,
    'screenshot': File(out).absolute.path,
  };
}

/// Releases the engine kept alive for the pump phase.
Future<void> disposeScreenshotSession() async {
  await _screenshotSession?.backend.dispose();
  _screenshotSession = null;
  _screenshotTree = null;
}
