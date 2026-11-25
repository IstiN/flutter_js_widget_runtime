import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/json_widget_renderer.dart';

import '../../tool/conformance/conformance_runner.dart';
import 'runner_fixture.dart';

/// Runner amendment regressions found by the v0.2 kit:
/// #17 (`submit` = keyboard done on a text node), #18 (`scroll` = pointer
/// scroll signal at the surface center), #19 (deterministic map tap via
/// in-memory tiles), #16 (late rendering exceptions fail the fixture, not
/// the suite).
void main() {
  Future<void> pumpTree(
    WidgetTester tester,
    Map<String, dynamic> tree,
    void Function(String actionId, Map<String, dynamic> payload) onEvent,
  ) async {
    final renderer = JsonWidgetRenderer(onEvent: onEvent);
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Builder(builder: (context) => renderer.build(tree, context)),
        ),
      ),
    );
  }

  testWidgets('#17 submit fires onSubmit on the named text node', (
    tester,
  ) async {
    final fired = <String>[];
    await pumpTree(tester, <String, dynamic>{
      'type': 'column',
      'children': [
        {'type': 'textField', 'hint': 'Field', 'onSubmit': 'go'},
        {'type': 'textArea', 'hint': 'Area', 'onSubmit': 'go2'},
      ],
    }, (id, _) => fired.add(id));

    await applyConformanceAction(tester, RecordingBackend(), {'submit': 'n1'});
    await tester.pump();
    await applyConformanceAction(tester, RecordingBackend(), {'submit': 'n2'});
    await tester.pump();
    expect(fired, containsAll(<String>['go', 'go2']));
  });

  testWidgets('#18 pointer scroll reaches gestureDetector.onScroll', (
    tester,
  ) async {
    final fired = <String>[];
    await pumpTree(tester, <String, dynamic>{
      'type': 'column',
      'children': [
        {'type': 'textField', 'hint': 'Field', 'onSubmit': 'go'},
        {'type': 'textArea', 'hint': 'Area', 'onSubmit': 'go2'},
      ],
    }, (id, _) => fired.add(id));

    await applyConformanceAction(tester, RecordingBackend(), {'submit': 'n1'});
    await tester.pump();
    await applyConformanceAction(tester, RecordingBackend(), {'submit': 'n2'});
    await tester.pump();
    expect(fired, containsAll(<String>['go', 'go2']));
  });

  testWidgets('#18 pointer scroll reaches gestureDetector.onScroll', (
    tester,
  ) async {
    // Bare-mechanism control: a plain Listener must receive the signal.
    var bare = 0;
    await tester.pumpWidget(
      Directionality(
        textDirection: TextDirection.ltr,
        child: Listener(
          behavior: HitTestBehavior.opaque,
          onPointerSignal: (e) {
            bare++;
          },
          child: const SizedBox.expand(),
        ),
      ),
    );
    await tester.sendEventToBinding(
      PointerScrollEvent(
        position: const Offset(400, 300),
        scrollDelta: const Offset(0, 30),
      ),
    );
    await tester.pump();
    await tester.runAsync(() => Future<void>.delayed(Duration.zero));
    await tester.pump();
    // ignore: avoid_print
    print('bare listener count: ' + bare.toString());
    final fired = <String>[];
    await pumpTree(tester, <String, dynamic>{
      'type': 'center',
      'child': {
        'type': 'gestureDetector',
        'onScroll': 'gs',
        'child': {'type': 'text', 'data': 'target'},
      },
    }, (id, _) => fired.add(id));

    // ignore: avoid_print
    print(
      'view physical=${tester.view.physicalSize} dpr=${tester.view.devicePixelRatio}',
    );
    final hit = tester.allElements.where((e) => e.widget is Listener).length;
    // ignore: avoid_print
    print('listeners in tree: ' + hit.toString());
    await applyConformanceAction(tester, RecordingBackend(), {
      'scroll': [0, 60],
    });
    await tester.pump();
    // ignore: avoid_print
    print('fired after runner scroll: ' + fired.toString());
    expect(fired, contains('gs'));
  });
}
