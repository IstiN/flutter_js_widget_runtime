
import 'package:flame_3d/game.dart' show Vector3;
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/hosts/flame_3d_host.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_3d_host.dart';

/// A [Js3dGameApi] stand-in that records every mutation instead of touching
/// the GPU: the controller's command/diff logic is driven end-to-end without
/// Impeller.
class _RecordingGame implements Js3dGameApi {
  final calls = <String>[];
  final loadedModels = <String, String?>{};
  final rotations = <String, (String, double)?>{};
  final clips = <String, String>{};
  double? cameraFov;

  /// Configurable stand-in for the game's ever-had-a-layout flag.
  bool laidOut = true;

  @override
  Future<void> load() async {}

  @override
  bool get hasEverLaidOut => laidOut;

  @override
  void disposeGame() => calls.add('dispose');

  @override
  Future<void> loadModel({
    required String modelId,
    required String? src,
    List<dynamic>? position,
    List<dynamic>? rotation,
    List<dynamic>? scale,
    bool unlit = false,
    String? color,
  }) async {
    calls.add('add:$modelId:$src');
    loadedModels[modelId] = src;
  }

  @override
  void removeModel(String modelId) {
    calls.add('remove:$modelId');
    loadedModels.remove(modelId);
    rotations.remove(modelId);
  }

  @override
  void setTransform(
    String modelId, {
    List<dynamic>? position,
    List<dynamic>? rotation,
    List<dynamic>? scale,
  }) {
    calls.add('transform:$modelId');
  }

  @override
  void setRotation(String modelId, String axis, double speed) {
    calls.add('rotate:$modelId:$axis:$speed');
    rotations[modelId] = (axis, speed);
  }

  @override
  void stopRotation(String modelId) {
    calls.add('stopRotation:$modelId');
    rotations.remove(modelId);
  }

  @override
  void playSkeletalAnimation(String modelId, String name) {
    calls.add('clip:$modelId:$name');
    clips[modelId] = name;
  }

  @override
  void stopSkeletalAnimation(String modelId) {
    calls.add('stopClip:$modelId');
    clips.remove(modelId);
  }

  @override
  void setCamera(
    Vector3? position,
    Vector3? target,
    Vector3? up,
    double? fov,
  ) {
    calls.add('camera');
    cameraFov = fov;
  }

  @override
  Map<String, dynamic>? raycastModel(Offset ndc) => null;
}

void main() {
  group('Flame3dController declarative config sync', () {
    test('first config queues addModel while the game initializes', () {
      final game = _RecordingGame();
      final controller = Flame3dController(
        's1',
        const {},
        Flame3dHost.instance,
        gameFactory: (_, __) => game,
      );
      controller.debugApplyConfig({
        'models': [
          {'modelId': 'm1', 'src': 'a.glb'},
        ],
      });
      // Init is async: the command waits in the pending queue for now.
      expect(controller.hasGame, isFalse);
      expect(controller.pendingLength, 1);
      controller.dispose();
    });

    testWidgets('live game: same src → transform only, prune, reload',
        (tester) async {
      Flame3dHost.instance.skipGpuInit = true;
      addTearDown(() => Flame3dHost.instance.skipGpuInit = false);
      final game = _RecordingGame();
      final controller = Flame3dController(
        's2',
        const {},
        Flame3dHost.instance,
        gameFactory: (_, __) => game,
      );
      addTearDown(controller.dispose);

      // Declare two models; after init the pending commands drain into the
      // recording game.
      controller.debugApplyConfig({
        'models': [
          {'modelId': 'm1', 'src': 'a.glb'},
          {'modelId': 'm2', 'src': 'b.glb'},
        ],
      });
      await tester.pumpAndSettle();
      await tester.runAsync(() => Future<void>.delayed(Duration.zero));
      expect(controller.hasGame, isTrue);
      expect(game.calls, contains('add:m1:a.glb'));
      expect(game.calls, contains('add:m2:b.glb'));

      // Re-apply the same config: srcs unchanged → transforms only.
      game.calls.clear();
      controller.debugApplyConfig({
        'models': [
          {'modelId': 'm1', 'src': 'a.glb'},
          {'modelId': 'm2', 'src': 'b.glb'},
        ],
      });
      expect(game.calls.where((c) => c.startsWith('add:')), isEmpty);
      expect(game.calls.toSet(), containsAll(['transform:m1', 'transform:m2']));

      // m2 disappears → pruned; m1 src changes → reloaded.
      controller.debugApplyConfig({
        'models': [
          {'modelId': 'm1', 'src': 'c.glb'},
        ],
      });
      expect(game.calls, contains('remove:m2'));
      expect(game.calls, contains('add:m1:c.glb'));
    });

    testWidgets('camera config reaches the game through setCamera',
        (tester) async {
      Flame3dHost.instance.skipGpuInit = true;
      addTearDown(() => Flame3dHost.instance.skipGpuInit = false);
      final game = _RecordingGame();
      final controller = Flame3dController(
        's3',
        const {},
        Flame3dHost.instance,
        gameFactory: (_, __) => game,
      );
      addTearDown(controller.dispose);

      controller.apply(const Js3dCommand(
        kind: 'setCamera',
        sceneId: 's3',
        payload: {
          'position': [1, 2, 3],
          'fov': 45.0,
        },
      ));
      await tester.pumpAndSettle();
      expect(game.calls, contains('camera'));
      expect(game.cameraFov, 45.0);
    });

    test('time updates the declarative animation clock', () {
      final game = _RecordingGame();
      final controller = Flame3dController(
        's4',
        const {},
        Flame3dHost.instance,
        gameFactory: (_, __) => game,
      );
      controller.debugApplyConfig({'time': 1.5, 'models': []});
      expect(controller.sceneSync.declaredTime, 1.5);
      // No time in the new config → the clock keeps its last value.
      controller.debugApplyConfig({'models': []});
      expect(controller.sceneSync.declaredTime, 1.5);
      controller.dispose();
    });

    testWidgets('dispose skips a game that never had a layout', (tester) async {
      Flame3dHost.instance.skipGpuInit = true;
      addTearDown(() => Flame3dHost.instance.skipGpuInit = false);
      final game = _RecordingGame()..laidOut = false;
      final controller = Flame3dController(
        's5',
        const {},
        Flame3dHost.instance,
        gameFactory: (_, __) => game,
      );
      controller.apply(const Js3dCommand(
        kind: 'addModel',
        sceneId: 's5',
        payload: {'modelId': 'm1', 'src': 'a.glb'},
      ));
      await tester.pumpAndSettle();
      await tester.runAsync(() => Future<void>.delayed(Duration.zero));
      expect(controller.hasGame, isTrue);

      controller.dispose();

      // A game that never laid out must be dropped without disposal —
      // FlameGame.dispose asserts on lifecycle events for layout-less games.
      expect(game.calls, isNot(contains('dispose')));
    });

    testWidgets('dispose releases a laid-out game', (tester) async {
      Flame3dHost.instance.skipGpuInit = true;
      addTearDown(() => Flame3dHost.instance.skipGpuInit = false);
      final game = _RecordingGame();
      final controller = Flame3dController(
        's6',
        const {},
        Flame3dHost.instance,
        gameFactory: (_, __) => game,
      );
      controller.apply(const Js3dCommand(
        kind: 'addModel',
        sceneId: 's6',
        payload: {'modelId': 'm1', 'src': 'a.glb'},
      ));
      await tester.pumpAndSettle();
      await tester.runAsync(() => Future<void>.delayed(Duration.zero));
      expect(controller.hasGame, isTrue);

      controller.dispose();

      expect(game.calls, contains('dispose'));
    });
  });
}
