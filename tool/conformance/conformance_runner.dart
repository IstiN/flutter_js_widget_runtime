import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/json_widget_renderer.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_backend.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

/// Conformance runner core (issue #9, plan section 4.4 F1): drives one
/// fixture's real `widget.js` on the QuickJS backend, renders through the
/// production `JsonWidgetRenderer`, applies the fixture's actions and
/// writes the `result.json` of PROTOCOL section 1.4 (`platform: "flutter"`).
///
/// The `flutter test` entry point is `run_conformance_test.dart`; the CLI
/// wrapper is `run_conformance.dart` (mirrors the jsr_widget CLI split of
/// `bin/jsr_widget.dart` → `tool/jsr_widget_harness_test.dart`).

/// Marks the machine-readable summary line inside `flutter test` output so
/// the CLI wrapper can extract it.
const String kJsrConformanceResultMarker = '__JSR_CONFORMANCE_RESULT__';

/// Environment key carrying the JSON spec from the CLI wrapper.
const String kJsrConformanceSpecEnv = 'JSR_CONFORMANCE_SPEC';

/// Capabilities the runner serves today. The Flutter reference can serve
/// every capability; these are the ones F1 wires (in-memory storage and
/// secrets, mock-origin network, fixture-directory assets). Fixtures
/// declaring anything else SKIP until later segments wire them.
const Set<String> kServedCapabilities = {'network', 'storage', 'secrets', 'assets'};

/// One fixture selected for this run (CLI-parsed).
class ConformanceFixtureSpec {
  const ConformanceFixtureSpec({
    required this.id,
    required this.dir,
    this.mockOrigin,
  });

  final String id;
  final String dir;

  /// Origin of the per-fixture mock server (`null` when the fixture has no
  /// `mock` map).
  final String? mockOrigin;
}

/// The machine-readable spec passed through the environment.
class ConformanceSpec {
  const ConformanceSpec({required this.fixturesDir, required this.outDir, required this.fixtures});

  final String fixturesDir;
  final String outDir;
  final List<ConformanceFixtureSpec> fixtures;

  Map<String, dynamic> toJson() => <String, dynamic>{
    'fixturesDir': fixturesDir,
    'outDir': outDir,
    'fixtures': [
      for (final f in fixtures)
        <String, dynamic>{'id': f.id, 'dir': f.dir, 'mockOrigin': f.mockOrigin},
    ],
  };

  static ConformanceSpec fromJson(Map<String, dynamic> json) => ConformanceSpec(
    fixturesDir: json['fixturesDir'] as String,
    outDir: json['outDir'] as String,
    fixtures: [
      for (final f in (json['fixtures'] as List).cast<Map>())
        ConformanceFixtureSpec(
          id: f['id'] as String,
          dir: f['dir'] as String,
          mockOrigin: f['mockOrigin'] as String?,
        ),
    ],
  );

  /// Reads the spec injected by the CLI wrapper; null when absent.
  static ConformanceSpec? fromEnvironment() {
    final raw = Platform.environment[kJsrConformanceSpecEnv];
    if (raw == null || raw.isEmpty) return null;
    return fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }
}

/// Outcome of one fixture run (what the summary reports).
class ConformanceRunOutcome {
  const ConformanceRunOutcome({
    required this.fixture,
    required this.status,
    this.error,
    this.skippedReason,
  });

  final String fixture;

  /// `DONE` or `SKIP` (the harness sets `PASS` later).
  final String status;
  final String? error;
  final String? skippedReason;

  Map<String, dynamic> toJson() => <String, dynamic>{
    'fixture': fixture,
    'status': status,
    'error': error,
    'skippedReason': skippedReason,
  };
}

/// Runs one fixture end to end and writes `<outDir>/<id>.result.json`.
Future<ConformanceRunOutcome> runConformanceFixture(
  WidgetTester tester,
  ConformanceSpec spec,
  ConformanceFixtureSpec fixture,
) async {
  final meta = jsonDecode(
    File('${fixture.dir}/meta.json').readAsStringSync(),
  ) as Map<String, dynamic>;
  final expected = jsonDecode(
    File('${fixture.dir}/expected.json').readAsStringSync(),
  ) as Map<String, dynamic>;
  final widgetJs = File('${fixture.dir}/widget.js').readAsStringSync();

  final capabilities = (meta['capabilities'] as List? ?? const []).cast<String>();
  final unserved = capabilities.where((c) => !kServedCapabilities.contains(c)).toList();
  if (unserved.isNotEmpty) {
    final reason = 'capability not served by the flutter runner yet: ${unserved.join(', ')}';
    final outcome = ConformanceRunOutcome(
      fixture: fixture.id,
      status: 'SKIP',
      skippedReason: reason,
    );
    _writeResult(spec, fixture.id, _resultJson(fixture.id, status: 'SKIP', skippedReason: reason));
    return outcome;
  }

  final trace = <String>[];
  final renders = <String>[];
  final console = <String>[];
  String? title;
  void Function(Map<String, dynamic>)? uiUpdate;

  final backend = QuickjsWidgetEngineBackend(
    config: JsRuntimeConfig(
      widgetId: 'conformance-${fixture.id}',
      instanceId: 'conformance-${fixture.id}',
      appDir: fixture.dir,
      hostBootstrapJs: fixture.mockOrigin == null
          ? null
          : 'var __JSR_MOCK_ORIGIN__ = ${jsonEncode(fixture.mockOrigin)};',
      onMessageTrace: trace.add,
      onRender: (rendered) {
        // The bridge hands over the decoded tree; re-encoded canonically
        // for the `renders` wire (the harness normalizes either way).
        renders.add(jsonEncode(rendered));
        uiUpdate?.call(rendered);
      },
      onSetTitle: (t) => title = t,
      onLog: console.add,
      onStorageUpdate: (_) {},
    ),
  );

  Object? failure;
  Map<String, dynamic>? dump;
  Map<String, dynamic>? finalDump;
  try {
    await backend.init();
    final rendererRef = <JsonWidgetRenderer?>[null];
    final contextRef = <BuildContext?>[null];
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: _ConformanceHost(
            backend: backend,
            widgetJs: widgetJs,
            onUiUpdate: (update) => uiUpdate = update,
            onRenderer: (renderer) => rendererRef[0] = renderer,
            onContext: (context) => contextRef[0] = context,
          ),
        ),
      ),
    );
    await backend.run(widgetJs);
    await _pumpUntil(tester, () => renders.isNotEmpty);

    final renderer = rendererRef[0];
    if (renderer == null || contextRef[0] == null) {
      throw StateError('renderer did not mount');
    }
    dump = renderer.dumpViewTree(contextRef[0]!);

    final actions = (expected['actions'] as List? ?? const []).cast<Map>();
    for (final action in actions) {
      await applyConformanceAction(
        tester,
        backend,
        action.cast<String, dynamic>(),
      );
    }
    await tester.pump(const Duration(milliseconds: 50));
    finalDump = renderer.dumpViewTree(contextRef[0]!);
  } catch (e) {
    failure = e;
  } finally {
    await backend.dispose();
    await tester.pump(const Duration(milliseconds: 10));
  }

  final result = _resultJson(
    fixture.id,
    status: 'DONE',
    dump: dump,
    finalDump: finalDump,
    trace: [for (final channel in trace) _traceVerb(channel)],
    renders: renders,
    title: title,
    console: console,
    error: failure?.toString(),
  )..['state'] = backend.exportedState;
  _writeResult(spec, fixture.id, result);
  return ConformanceRunOutcome(
    fixture: fixture.id,
    status: 'DONE',
    error: failure?.toString(),
  );
}

Map<String, dynamic> _resultJson(
  String id, {
  required String status,
  Map<String, dynamic>? dump,
  Map<String, dynamic>? finalDump,
  List<String>? trace,
  List<String>? renders,
  String? title,
  List<String>? console,
  String? error,
  String? skippedReason,
}) => <String, dynamic>{
  'fixture': id,
  'platform': 'flutter',
  'status': status,
  'dump': dump,
  'trace': trace ?? const <String>[],
  'diffs': const <dynamic>[],
  'screenshot': null,
  'renders': renders ?? const <String>[],
  'finalDump': finalDump,
  'title': title,
  'state': null,
  'console': console ?? const <String>[],
  'error': error,
  'skippedReason': skippedReason,
};

void _writeResult(ConformanceSpec spec, String id, Map<String, dynamic> result) {
  Directory(spec.outDir).createSync(recursive: true);
  File('${spec.outDir}/$id.result.json').writeAsStringSync(
    const JsonEncoder.withIndent('  ').convert(result),
  );
}

/// `__jsr_render` → `render` (PROTOCOL section 1.4 trace verb).
String _traceVerb(String channel) => channel.replaceFirst('__jsr_', '');

/// Pumps until [ready] (checked after every pump) or ~2.5 s of pumps.
Future<void> _pumpUntil(WidgetTester tester, bool Function() ready) async {
  for (var i = 0; i < 100; i++) {
    await tester.pump(const Duration(milliseconds: 25));
    if (ready()) return;
  }
}

/// Host widget: mirrors the wiring of `JsWidgetRuntimeWidget` for the
/// QuickJS backend, exposing the renderer and its context for the dump.
class _ConformanceHost extends StatefulWidget {
  const _ConformanceHost({
    required this.backend,
    required this.widgetJs,
    required this.onUiUpdate,
    required this.onRenderer,
    required this.onContext,
  });

  final QuickjsWidgetEngineBackend backend;
  final String widgetJs;
  final void Function(void Function(Map<String, dynamic>) update) onUiUpdate;
  final void Function(JsonWidgetRenderer renderer) onRenderer;
  final void Function(BuildContext context) onContext;

  @override
  State<_ConformanceHost> createState() => _ConformanceHostState();
}

class _ConformanceHostState extends State<_ConformanceHost> {
  late final JsonWidgetRenderer _renderer;
  Map<String, dynamic>? _tree;

  @override
  void initState() {
    super.initState();
    _renderer = JsonWidgetRenderer(
      onEvent: (actionId, payload) => widget.backend.callEvent(actionId, payload),
      onGestureEvent: (actionId, payload) =>
          widget.backend.dispatchHostEvent('gesture:$actionId', payload),
    );
    widget.onRenderer(_renderer);
    widget.onUiUpdate((rendered) {
      if (mounted) setState(() => _tree = rendered);
    });
  }

  @override
  Widget build(BuildContext context) {
    final tree = _tree;
    final content = tree == null
        ? const SizedBox.expand()
        : _renderer.build(tree, context);
    return Builder(
      builder: (innerContext) {
        widget.onContext(innerContext);
        return content;
      },
    );
  }
}

/// Applies one action of PROTOCOL section 1.4 through the real tester.
/// Public for the conformance tests (each verb is exercised in isolation).
Future<void> applyConformanceAction(
  WidgetTester tester,
  JsWidgetEngineBackend backend,
  Map<String, dynamic> action,
) async {
  final tap = action['tap'];
  if (tap is String) {
    final Finder finder = RegExp(r'^n\d+$').hasMatch(tap)
        ? find.byKey(ValueKey<String>('jsr:$tap'))
        : find.text(tap).first;
    await tester.tap(finder, warnIfMissed: true);
    await tester.pump(const Duration(milliseconds: 50));
    return;
  }
  final input = action['input'];
  if (input is Map) {
    final node = input['node'];
    final value = '${input['value']}';
    final finder = find
        .descendant(
          of: find.byKey(ValueKey<String>('jsr:$node')),
          matching: find.byType(EditableText),
        )
        .first;
    await tester.enterText(finder, value);
    await tester.pump(const Duration(milliseconds: 50));
    return;
  }
  final scroll = action['scroll'];
  if (scroll is List && scroll.length >= 2) {
    await tester.drag(
      find.byType(Scrollable).first,
      Offset((scroll[0] as num).toDouble(), (scroll[1] as num).toDouble()),
    );
    await tester.pump(const Duration(milliseconds: 50));
    return;
  }
  final swipe = action['swipe'];
  if (swipe is List && swipe.length >= 4) {
    final start = Offset((swipe[0] as num).toDouble(), (swipe[1] as num).toDouble());
    final end = Offset((swipe[2] as num).toDouble(), (swipe[3] as num).toDouble());
    final duration = Duration(milliseconds: swipe.length > 4 ? (swipe[4] as num).toInt() : 150);
    // `tester.drag` with the given duration (plan 1.4): the coordinate drag
    // advances the test clock by [duration] so timers see the elapsed time.
    // (timedDragFrom's synthesized event records do not reach the
    // Scrollable under this Flutter version — verified on 3.47.1.)
    await tester.dragFrom(start, end - start);
    await tester.pump(duration);
    await tester.pump(const Duration(milliseconds: 50));
    return;
  }
  final wait = action['wait'];
  if (wait is num) {
    await tester.pump(Duration(milliseconds: wait.toInt()));
    return;
  }
  if (action['back'] == true) {
    backend.dispatchHostEvent('back', <String, dynamic>{});
    await tester.pump(const Duration(milliseconds: 50));
  }
}
