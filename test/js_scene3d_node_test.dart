import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

class _Fake3dController extends Js3dController {
  final List<Js3dCommand> commands = [];

  @override
  void apply(Js3dCommand command) {
    commands.add(command);
    notifyListeners();
  }
}

class _Fake3dHost extends Js3dHost {
  final _Fake3dController controller = _Fake3dController();

  @override
  Js3dController createController(
    String sceneId,
    Map<String, dynamic> config,
  ) =>
      controller;

  @override
  Widget build(
    BuildContext context,
    Js3dController controller,
    Map<String, dynamic> config,
  ) {
    return Container(
      key: const ValueKey('scene3d-built'),
      width: 200,
      height: 200,
    );
  }
}

Future<void> _pumpScene(WidgetTester tester, JsonWidgetRenderer renderer) async {
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: renderer.build({
          'type': 'scene3d',
          'id': 'main',
          'width': 300,
          'height': 200,
        }),
      ),
    ),
  );
}

void main() {
  group('JsScene3dNode', () {
    testWidgets('renders placeholder when no Js3dHost is provided',
        (tester) async {
      final renderer = JsonWidgetRenderer(
        onEvent: (_, __) {},
      );
      await _pumpScene(tester, renderer);
      expect(find.byType(Icon), findsOneWidget);
    });

    testWidgets('renders host widget and forwards commands',
        (tester) async {
      final host = _Fake3dHost();
      final renderer = JsonWidgetRenderer(
        onEvent: (_, __) {},
        js3dHost: host,
      );
      await _pumpScene(tester, renderer);
      expect(find.byKey(const ValueKey('scene3d-built')), findsOneWidget);

      host.controller.apply(
        const Js3dCommand(
          kind: 'addModel',
          sceneId: 'main',
          modelId: 'box',
          payload: {'src': 'assets/box.glb'},
        ),
      );
      await tester.pump();
      expect(host.controller.commands.length, 1);
      expect(host.controller.commands.first.kind, 'addModel');
    });
  });
}
