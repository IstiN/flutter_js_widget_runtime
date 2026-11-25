import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/json_widget_renderer.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_backend.dart';
import '../../tool/conformance/conformance_runner.dart';

/// Action verbs of PROTOCOL section 1.4 through the real renderer and the
/// shared applier (`tap` by node id and by text, `input`, `scroll`, `swipe`,
/// `wait`, `back`).
class _RecordingBackend implements JsWidgetEngineBackend {
  final hostEvents = <String>[];

  @override
  void dispatchHostEvent(String target, Map<String, dynamic> payload) {
    hostEvents.add(target);
  }

  @override
  Future<void> callEvent(
    String actionId, [
    Map<String, dynamic>? payload,
  ]) async {}

  @override
  void setEngineInstanceId(String instanceId) {}

  @override
  bool get hasSyncBinaryLane => false;

  @override
  void prepareThreeBackend(JsThreeBackendSelection selection) {}

  @override
  List<Map<String, dynamic>> peekLogs() => const [];

  @override
  JsVoxelWorld get voxelWorld => JsVoxelWorld();

  @override
  Future<void> init() async {}
  @override
  Future<void> run(
    String widgetJs, {
    String? hostBootstrapJs,
    Map<String, dynamic> initialTheme = const {},
  }) async {}
  @override
  void updateTheme(Map<String, dynamic> colors) {}
  @override
  Future<void> dispose() async {}
  @override
  List<Map<String, dynamic>> flushLogs() => const [];
  @override
  Map<String, dynamic>? get exportedState => null;
}

void main() {
  /// Pumps [tree] through the production renderer; returns the dump context.
  Future<BuildContext> pumpTree(
    WidgetTester tester,
    Map<String, dynamic> tree,
    void Function(String actionId, Map<String, dynamic> payload) onEvent,
  ) async {
    final renderer = JsonWidgetRenderer(onEvent: onEvent);
    late final BuildContext captured;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Builder(
            builder: (context) {
              captured = context;
              return renderer.build(tree, context);
            },
          ),
        ),
      ),
    );
    return captured;
  }

  testWidgets('tap by nodeId fires the node event through the renderer', (
    tester,
  ) async {
    final fired = <String>[];
    await pumpTree(
      tester,
      <String, dynamic>{
        'type': 'column',
        'children': [
          {'type': 'textButton', 'text': 'First', 'onTap': 'first'},
          {'type': 'textButton', 'text': 'Second', 'onTap': 'second'},
        ],
      },
      (id, _) => fired.add(id),
    );

    // column is the root (n0); the buttons are n1 and n2.
    await applyConformanceAction(tester, _RecordingBackend(), {'tap': 'n2'});
    await tester.pump();
    expect(fired, ['second']);
  });

  testWidgets('tap by visible text fires the node event', (tester) async {
    final fired = <String>[];
    await pumpTree(
      tester,
      <String, dynamic>{
        'type': 'column',
        'children': [
          {'type': 'textButton', 'text': 'Push', 'onTap': 'pushed'},
        ],
      },
      (id, _) => fired.add(id),
    );

    await applyConformanceAction(tester, _RecordingBackend(), {'tap': 'Push'});
    await tester.pump();
    expect(fired, ['pushed']);
  });

  testWidgets('input writes text into the node field', (tester) async {
    await pumpTree(
      tester,
      <String, dynamic>{
        'type': 'column',
        'children': [
          {'type': 'textField', 'hint': 'name', 'value': ''},
        ],
      },
      (_, __) {},
    );

    await applyConformanceAction(tester, _RecordingBackend(), {
      'input': {'node': 'n1', 'value': 'typed'},
    });
    await tester.pump();
    expect(find.text('typed'), findsOneWidget);
  });

  testWidgets('scroll drags the scrollable', (tester) async {
    await pumpTree(
      tester,
      <String, dynamic>{
        'type': 'scroll',
        'children': [
          for (var i = 1; i <= 40; i++) {'type': 'text', 'data': 'Row $i'},
        ],
      },
      (_, __) {},
    );
    final position = tester
        .state<ScrollableState>(find.byType(Scrollable))
        .position;
    expect(position.pixels, 0);

    await applyConformanceAction(tester, _RecordingBackend(), {
      'scroll': [0, -300],
    });
    await tester.pump();
    expect(position.pixels, greaterThan(0));
  });

  testWidgets('swipe performs a timed gesture between coordinates', (
    tester,
  ) async {
    await pumpTree(
      tester,
      <String, dynamic>{
        'type': 'scroll',
        'children': [
          for (var i = 1; i <= 40; i++) {'type': 'text', 'data': 'Item $i'},
        ],
      },
      (_, __) {},
    );
    final position = tester
        .state<ScrollableState>(find.byType(Scrollable))
        .position;

    await applyConformanceAction(tester, _RecordingBackend(), {
      'swipe': [49, 180, 49, 40, 150],
    });
    await tester.pump();
    expect(position.pixels, greaterThan(0));
  });

  testWidgets('wait pumps the clock and back dispatches the host event', (
    tester,
  ) async {
    await pumpTree(
      tester,
      <String, dynamic>{
        'type': 'column',
        'children': [
          {'type': 'text', 'data': 'idle'},
        ],
      },
      (_, __) {},
    );

    final backend = _RecordingBackend();
    await applyConformanceAction(tester, backend, {'wait': 100});
    await applyConformanceAction(tester, backend, {'back': true});
    expect(backend.hostEvents, ['back']);
  });
}
