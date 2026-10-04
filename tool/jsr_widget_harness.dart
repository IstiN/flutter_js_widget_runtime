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
import 'package:path/path.dart' as p;

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

/// A `jsr.capture()` request queued by the harness capture handler: the
/// tree snapshot at call time plus the path the PNG will have once the
/// capture phase rasterizes it. The JS promise resolves IMMEDIATELY with
/// that path (the voxel.mesh sync-resolve pattern) — a promise held
/// pending across the tester phase re-enters the QuickJS runtime from a
/// native-callback context and deadlocks the isolate.
class _CaptureRequest {
  _CaptureRequest(this.name, this.tree, this.result);

  final String name;
  final Map<String, dynamic>? tree;
  final Map<String, dynamic> result;
}

final List<_CaptureRequest> _captureQueue = [];
final List<Map<String, dynamic>> _captureResults = [];
_Session? _testSession;

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
      // Deterministic headless stub: report success without launching a
      // real browser from CLI test runs.
      openUrlHandler: (id, url) async {
        resolve?.call(id, true);
      },
      captureHandler: (opts) {
        final base = ((opts['name'] as String?) ?? 'capture').replaceAll(
            RegExp(r'[^a-zA-Z0-9_-]'), '-');
        final taken = _captureQueue.map((r) => r.name).toSet();
        final name =
            taken.contains(base) ? '$base-${taken.length + 1}' : base;
        final path = p.join(spec.captureDir, '$name.png');
        final request = _CaptureRequest(
          name,
          renders.isEmpty ? null : renders.last,
          {
            'path': File(path).absolute.path,
            'width': spec.width,
            'height': spec.height,
          },
        );
        _captureQueue.add(request);
        // Immediate resolve on the same eval loop (voxel.mesh pattern) —
        // the PNG itself is written by the capture phase before the CLI
        // reports.
        return Future.value(request.result);
      },
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

/// TEST MODE, phase 1 — boot, events, logic. Capture requests made by
/// `jsr.capture()` queue up here and resolve in [processTestCaptures], once
/// a widget tester can rasterize the tree.
Future<Map<String, dynamic>> prepareTestRun(JsrToolSpec spec) async {
  final sw = Stopwatch()..start();
  final session = await _boot(spec);
  for (final event in spec.events) {
    final (id, payload) = eventParts(event);
    final before = session.renders.length;
    await session.backend.callEvent(id, payload);
    await _waitForRender(session.renders, before, spec.settleMs);
  }
  _testSession = session;
  return buildReport(
    ok: true,
    widgetId: session.widgetId,
    mode: 'test',
    logs: session.backend.peekLogs(),
    state: session.backend.exportedState,
    renderCount: session.renders.length,
    failures: const [],
    durationMs: sw.elapsedMilliseconds,
  );
}

/// TEST MODE, phase 2 — rasterize queued `jsr.capture()` requests. MUST
/// run inside `testWidgets` (pixels need the tester) — the engine is NOT
/// touched here: disposing inside the fake-async zone never completes.
/// Expectations and disposal live in [finishTestRun] (real event loop).
Future<void> processTestCaptures(JsrToolSpec spec, WidgetTester tester) async {
  Directory(spec.captureDir).createSync(recursive: true);
  for (final request in _captureQueue) {
    if (request.tree == null) {
      continue;
    }
    final out = p.join(spec.captureDir, '${request.name}.png');
    final previousTree = _screenshotTree;
    _screenshotTree = request.tree;
    try {
      tester.view.devicePixelRatio = spec.scale;
      tester.view.physicalSize = Size(
        spec.width * spec.scale,
        spec.height * spec.scale,
      );
      addTearDown(tester.view.reset);
      await tester.pumpWidget(screenshotHost(spec));
      await tester.pump(const Duration(milliseconds: 16));
      await tester.pump(const Duration(milliseconds: 16));
      // PNG encoding is REAL async — run outside the fake-async zone.
      final png = await tester.runAsync(() async {
        final image = await captureImage(
          find.byType(MaterialApp).evaluate().single,
        );
        final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
        final data = bytes!.buffer.asUint8List();
        image.dispose();
        return data;
      });
      File(out).writeAsBytesSync(png!);
      _captureResults.add({'name': request.name, ...request.result});
    } catch (e) {
      _captureResults.add({
        'name': request.name,
        '__error': 'capture failed: $e',
      });
    } finally {
      _screenshotTree = previousTree;
    }
  }
}

/// TEST MODE, phase 3 — run in a PLAIN test (real event loop): settle the
/// JS continuations the resolved captures queued, judge expectations over
/// the final console/state, dispose the engine, build the report.
Future<Map<String, dynamic>> finishTestRun(JsrToolSpec spec) async {
  final sw = Stopwatch()..start();
  final session = _testSession!;
  final failures = <Map<String, dynamic>>[];

  // Immediate resolves may have queued continuations (console.log of the
  // path) inside the last eval's drain — settle briefly before judging.
  await Future<void>.delayed(const Duration(milliseconds: 50));
  final captures = List<Map<String, dynamic>>.from(_captureResults);
  _captureResults.clear();
  _captureQueue.clear();

  final state = session.backend.exportedState;
  final logs = session.backend.peekLogs();

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

  final widgetId = session.widgetId;
  final renderCount = session.renders.length;
  await session.backend.dispose();
  _testSession = null;
  return buildReport(
    ok: failures.isEmpty,
    widgetId: widgetId,
    mode: 'test',
    logs: logs,
    state: state,
    renderCount: renderCount,
    failures: failures,
    durationMs: sw.elapsedMilliseconds,
    captures: captures,
  );
}

/// TEST MODE — headless logic run in one call. In-process tests without a
/// widget tester use this: `jsr.capture()` requests (none in plain logic
/// runs) would resolve with an error — the two-phase CLI flow is what can
/// produce pixels.
Future<Map<String, dynamic>> runTestMode(
  JsrToolSpec spec, [
  WidgetTester? tester,
]) async {
  await prepareTestRun(spec);
  if (tester != null && _captureQueue.isNotEmpty) {
    await processTestCaptures(spec, tester);
  }
  return finishTestRun(spec);
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
