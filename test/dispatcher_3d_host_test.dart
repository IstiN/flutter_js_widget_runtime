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
    test('upgrades an uninformed cube controller to flame on GLB config', () {
      final host = createJs3dHost() as Js3dDispatcherHost;
      // Render side creates first with a config-poor call ({type, id}).
      final c1 = host.createController('upg-scene', <String, dynamic>{
        'type': 'scene3d',
        'id': 'upg-scene',
      });
      expect(host.hostForScene('upg-scene').toString(), contains('Cube3dHost'));
      // Bridge side arrives with a GLB src — the host must upgrade so GLB
      // commands never reach the OBJ parser.
      final c2 = host.createController('upg-scene', <String, dynamic>{
        'payload': <String, dynamic>{'src': 'https://x.test/model.glb'},
      });
      expect(identical(c1, c2), isTrue);
      expect(host.hostForScene('upg-scene').toString(), contains('Flame3dHost'));
      c1.dispose();
      c2.dispose();
    });

    test('upgrades on the FIRST addModel carrying a GLB src', () {
      final host = createJs3dHost() as Js3dDispatcherHost;
      // 3d-viewer flow: scene created with no engine/src anywhere; the GLB
      // arrives only in the addModel command payload.
      final c = host.createController('lazy-scene', <String, dynamic>{
        'type': 'scene3d',
        'id': 'lazy-scene',
      });
      expect(host.hostForScene('lazy-scene').toString(), contains('Cube3dHost'));
      c.apply(const Js3dCommand(
        kind: 'addModel',
        sceneId: 'lazy-scene',
        modelId: 'astronaut',
        payload: {'src': 'https://x.test/Astronaut.glb'},
      ));
      expect(host.hostForScene('lazy-scene').toString(), contains('Flame3dHost'));
      c.dispose();
    });

    test('does not upgrade after an addModel was applied', () {
      final host = createJs3dHost() as Js3dDispatcherHost;
      final c1 = host.createController('busy-scene', <String, dynamic>{
        'type': 'scene3d',
        'id': 'busy-scene',
      });
      c1.apply(const Js3dCommand(kind: 'addModel', sceneId: 'busy-scene',
        payload: <String, dynamic>{'primitive': 'cube'}));
      host.createController('busy-scene', <String, dynamic>{
        'payload': <String, dynamic>{'src': 'https://x.test/model.glb'},
      });
      expect(host.hostForScene('busy-scene').toString(), contains('Cube3dHost'));
      c1.dispose();
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

