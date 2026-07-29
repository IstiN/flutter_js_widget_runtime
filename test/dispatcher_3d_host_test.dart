import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

void main() {
  group('createJs3dHost', () {
    test('returns a Js3dDispatcherHost', () {
      expect(createJs3dHost(), isA<Js3dDispatcherHost>());
    });
  });

  group('Js3dDispatcherHost', () {
    test('selects flame host when engine is flame', () {
      final host = createJs3dHost() as Js3dDispatcherHost;
      final selected = host.selectHost(<String, dynamic>{'engine': 'flame'});
      expect(selected.toString(), contains('Flame3dHost'));
    });

    test('selects flame host for glb src', () {
      final host = createJs3dHost() as Js3dDispatcherHost;
      final selected = host.selectHost(<String, dynamic>{
        'src': 'assets/models/helmet.glb',
      });
      expect(selected.toString(), contains('Flame3dHost'));
    });

    test('selects flame host for gltf src', () {
      final host = createJs3dHost() as Js3dDispatcherHost;
      final selected = host.selectHost(<String, dynamic>{
        'model': <String, dynamic>{'src': 'assets/models/helmet.gltf'},
      });
      expect(selected.toString(), contains('Flame3dHost'));
    });

    test('selects cube host for primitives without engine', () {
      final host = createJs3dHost() as Js3dDispatcherHost;
      final selected = host.selectHost(<String, dynamic>{
        'primitive': 'cube',
      });
      expect(selected.toString(), contains('Cube3dHost'));
    });

    test('forwards apply calls to the inner controller', () {
      final inner = _FakeController();
      final fakeHost = _FakeHost(inner);
      final dispatcher = _TestDispatcher(fakeHost);
      final controller = dispatcher.createController('s1', <String, dynamic>{})
          as _TestHostedController;

      controller.apply(
        const Js3dCommand(kind: 'addModel', sceneId: 's1', modelId: 'box'),
      );

      expect(inner.applied.length, 1);
      expect(inner.applied.first.kind, 'addModel');
    });

    test('returns same controller for same sceneId regardless of config', () {
      final host = createJs3dHost() as Js3dDispatcherHost;

      final bridgeController = host.createController(
        'glb-demo',
        <String, dynamic>{
          'engine': 'flame',
          'camera': <String, dynamic>{'position': [0.0, 0.0, -8.0]},
        },
      );
      final rendererController = host.createController(
        'glb-demo',
        <String, dynamic>{'width': 320, 'height': 320},
      );

      expect(identical(bridgeController, rendererController), isTrue);

      // Reuse retains the shared controller: both references must be
      // released before it is torn down.
      bridgeController.dispose();
      rendererController.dispose();
    });

    test('survives unmount/remount within the same frame (retain on reuse)', () {
      // yoclip's per-frame scene rebuilds can run the new State's initState
      // before the old State's dispose; the old dispose must not kill the
      // controller the new State just acquired.
      final host = createJs3dHost() as Js3dDispatcherHost;

      final first = host.createController(
        'remount',
        <String, dynamic>{'primitive': 'cube'},
      );
      final second = host.createController(
        'remount',
        <String, dynamic>{'primitive': 'cube'},
      );
      expect(identical(first, second), isTrue);

      // Old State disposes after the new one retained: controller stays alive
      // and keeps being reused.
      first.dispose();
      final third = host.createController(
        'remount',
        <String, dynamic>{'primitive': 'cube'},
      );
      expect(identical(second, third), isTrue);

      // Releasing the remaining references tears it down; the next create
      // builds a fresh controller.
      second.dispose();
      third.dispose();
      final fourth = host.createController(
        'remount',
        <String, dynamic>{'primitive': 'cube'},
      );
      expect(identical(third, fourth), isFalse);
      fourth.dispose();
    });
  });
}

class _FakeController extends Js3dController {
  final List<Js3dCommand> applied = [];

  @override
  void apply(Js3dCommand command) => applied.add(command);
}

class _FakeHost extends Js3dHost {
  _FakeHost(this.controller);
  final Js3dController controller;

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
  ) =>
      const SizedBox.shrink();
}

class _TestDispatcher extends Js3dHost {
  _TestDispatcher(this._fakeHost);
  final Js3dHost _fakeHost;

  @override
  Js3dController createController(
    String sceneId,
    Map<String, dynamic> config,
  ) =>
      _TestHostedController(_fakeHost.createController(sceneId, config));

  @override
  Widget build(
    BuildContext context,
    Js3dController controller,
    Map<String, dynamic> config,
  ) =>
      const SizedBox.shrink();
}

class _TestHostedController extends Js3dController {
  _TestHostedController(this.controller);
  final Js3dController controller;

  @override
  void apply(Js3dCommand command) => controller.apply(command);
}
