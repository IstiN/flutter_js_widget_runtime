// ignore_for_file: invalid_use_of_internal_member
import 'dart:async';

import 'package:flame/game.dart';
import 'package:flame_3d/camera.dart';
import 'package:flame_3d/components.dart';
import 'package:flame_3d/game.dart';
import 'package:flame_3d/graphics.dart';
import 'package:flame_3d/model.dart';
import 'package:flame_3d/parser.dart';
import 'package:flame_3d/resources.dart';
import 'package:flutter/material.dart' hide Viewport;
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/hosts/js_3d_host_utils.dart';
import 'package:js_widget_runtime/src/renderer/nodes/hosts/js_3d_raycast.dart';
import 'package:vector_math/vector_math_64.dart' as vm64;

/// Creates a [Js3dHost] implementation backed by `flame_3d`.
///
/// Supports GLB/GLTF/OBJ models with animations and lighting. This host
/// requires Impeller + Flutter GPU, so it only runs on Android, iOS, and
/// macOS. On other platforms the panel shows a fallback message.
Js3dHost createFlame3dHost() => Flame3dHost.instance;

/// {@template flame3d_host}
/// A [Js3dHost] that drives a `flame_3d` scene from JS commands.
/// {@endtemplate}
class Flame3dHost extends Js3dHost {
  Flame3dHost._();

  /// Singleton instance shared by the JS bridge and the widget renderer.
  static final Flame3dHost instance = Flame3dHost._();

  final Map<String, Flame3dController> _controllers = {};

  bool _gpuInitialized = false;

  Future<void> _ensureGpu() async {
    if (_gpuInitialized) return;
    await GpuBackend.initialize();
    _gpuInitialized = true;
  }

  @override
  Js3dController createController(
    String sceneId,
    Map<String, dynamic> config,
  ) {
    final existing = _controllers[sceneId];
    if (existing != null && !existing._disposed) {
      existing._addRef();
      debugPrint(
        '[Flame3dHost] reuse controller sceneId=$sceneId '
        'refCount=${existing._refCount}',
      );
      return existing;
    }
    final controller = Flame3dController(sceneId, config, this);
    _controllers[sceneId] = controller;
    debugPrint(
      '[Flame3dHost] create controller sceneId=$sceneId '
      'configKeys=${config.keys.toList()}',
    );
    return controller;
  }

  bool _release(Flame3dController controller) {
    if (controller._releaseRef() == 0) {
      _controllers.remove(controller.sceneId);
      controller._disposeInternal();
      return true;
    }
    return false;
  }

  @override
  Widget build(
    BuildContext context,
    Js3dController controller,
    Map<String, dynamic> config,
  ) {
    final c = controller as Flame3dController;
    // Declarative configs (the yoclip video pipeline re-renders the whole
    // node tree every frame) are applied here; only diffs take effect.
    c._applyConfig(config);
    return _Flame3dGameWidget(
      key: ValueKey(c.sceneId),
      controller: c,
    );
  }
}

/// {@template flame3d_controller}
/// A [Js3dController] implementation that backs a `flame_3d` scene.
/// {@endtemplate}
class Flame3dController extends Js3dController {
  Flame3dController(this.sceneId, this.config, this._host);

  final String sceneId;
  final Map<String, dynamic> config;
  final Flame3dHost _host;

  JsFlame3dGame? game;
  String? error;
  final List<Js3dCommand> _pending = [];
  bool _initializing = false;
  bool _disposed = false;
  int _refCount = 1;

  /// The game instance currently claimed by a mounted [GameWidget].
  ///
  /// A [FlameGame3D] can only be attached to one [GameWidget] at a time, but
  /// the same scene can be rendered in several places simultaneously (the
  /// visible panel and the offscreen board capture/minimap). The first widget
  /// to build claims the game; the others render a placeholder until it is
  /// released.
  JsFlame3dGame? gameWidgetOwner;

  /// Releases the current game-widget claim and notifies listeners so a
  /// waiting widget can rebuild and claim the game.
  void releaseGameWidgetClaim() {
    // The release is posted via scheduleMicrotask — by the time it runs the
    // controller may already be disposed (teardown race).
    if (_disposed) return;
    gameWidgetOwner = null;
    notifyListeners();
  }

  void _addRef() => _refCount++;
  int _releaseRef() => --_refCount;

  /// Whether the controller was disposed — teardown (scene unmount, final
  /// tree disposal) can race with paints/rebuilds still referencing it.
  bool get isDisposed => _disposed;

  /// Test helper exposing whether the game was created.
  @visibleForTesting
  bool get hasGame => game != null;

  /// Test helper exposing how many commands are queued before the game loads.
  @visibleForTesting
  int get pendingLength => _pending.length;

  @override
  Map<String, dynamic>? raycastAt(Offset ndc) => game?.raycastModel(ndc);

  @override
  void apply(Js3dCommand command) {
    if (_disposed) return;
    if (game == null && error == null) {
      _pending.add(command);
      _initGameIfNeeded();
      return;
    }
    if (game == null) return;
    _apply(command);
    notifyListeners();
  }

  /// [apply] without the listener notification: declarative config updates
  /// arrive on every rebuild of the owning widget (yoclip re-renders the
  /// whole tree per frame), so notifying here would loop build → apply →
  /// notify → rebuild forever.
  void _applyQuiet(Js3dCommand command) {
    if (_disposed) return;
    if (game == null && error == null) {
      _pending.add(command);
      _initGameIfNeeded();
      return;
    }
    if (game == null) return;
    _apply(command);
  }

  void _initGameIfNeeded() {
    if (_disposed || _initializing || game != null || error != null) return;
    _initializing = true;
    debugPrint('[Flame3dController] init game sceneId=$sceneId');
    final initFuture = _initGame();
    Js3dCaptureSync.track(initFuture);
  }

  Future<void> _initGame() async {
    try {
      await _host._ensureGpu();
      if (_disposed || game != null) return;
      if (_disposed || game != null) return;
      debugPrint('[Flame3dController] game created sceneId=$sceneId');
      game = JsFlame3dGame(
        config,
        onError: (message) {
          if (_disposed) return;
          error = message;
          debugPrint('[Flame3dController] error sceneId=$sceneId: $message');
          notifyListeners();
        },
      );
      final onLoadFuture = game!.onLoad();
      if (onLoadFuture is Future<void>) {
        Js3dCaptureSync.track(onLoadFuture);
      }
      for (final cmd in _pending) {
        _apply(cmd);
      }
      _pending.clear();
      if (!_disposed) notifyListeners();
    } catch (e) {
      if (_disposed) return;
      error = 'flame_3d unavailable: $e';
      debugPrint('[Flame3dController] init error sceneId=$sceneId: $e');
      _pending.clear();
      notifyListeners();
    }
  }

  void _apply(Js3dCommand command) {
    final payload = command.payload ?? {};
    final modelId = js3dModelId(command, payload);

    switch (command.kind) {
      case 'addModel':
        debugPrint(
          '[Flame3dController] addModel sceneId=$sceneId modelId=$modelId '
          'src=${payload['src']}',
        );
        game?.loadModel(
          modelId: modelId,
          src: payload['src'] as String?,
          position: payload['position'] as List?,
          rotation: payload['rotation'] as List?,
          scale: payload['scale'] as List?,
          unlit: payload['unlit'] == true,
        );
      case 'removeModel':
        game?.removeModel(modelId);
      case 'setTransform':
        game?.setTransform(
          modelId,
          position: payload['position'] as List?,
          rotation: payload['rotation'] as List?,
          scale: payload['scale'] as List?,
        );
      case 'playAnimation':
        final name = payload['name'] as String?;
        if (name != null) {
          // Skeletal animation from the model's GLB clip list. flame_3d's
          // AnimationState always loops at 1x speed, so `loop`/`speed` are
          // accepted for API compatibility but not yet applied.
          game?.playSkeletalAnimation(modelId, name);
        } else {
          final axis = payload['axis'] as String? ?? 'y';
          final speed = (payload['speed'] as num?)?.toDouble() ?? 1.0;
          game?.setRotation(modelId, axis, speed);
        }
      case 'stopAnimation':
        game?.stopRotation(modelId);
        game?.stopSkeletalAnimation(modelId);
      case 'setCamera':
        _applyCamera(payload);
      case 'setLight':
        _applyLight(payload);
    }
  }

  // ---- Declarative config (yoclip-style re-render per frame) -------------

  /// Model id → `src` of the currently declared model (loaded or loading).
  final Map<String, String> _declaredModelSrcs = {};

  /// Model id → the skeletal clip currently requested for it.
  final Map<String, String> _playingClips = {};

  /// The declarative animation clock from the config (`time`, seconds), and
  /// how far the game has been advanced so far. The headless capture drives
  /// `game.update` by the delta, so rendered frames are deterministic.
  double declaredTime = 0;
  double lastTime = 0;

  /// Applies a declarative scene config (`{models: [...], camera, time}`)
  /// idempotently — safe to call on every widget rebuild. Only diffs take
  /// effect: a model reloads only when its `src` changes, transforms update
  /// in place, animations (re)start only when the clip name changes, models
  /// missing from the config are removed.
  void _applyConfig(Map<String, dynamic> config) {
    if (_disposed) return;
    final t = (config['time'] as num?)?.toDouble();
    if (t != null) declaredTime = t;
    final cam = config['camera'];
    if (cam is Map) {
      final camKey = cam.toString();
      if (camKey != _lastCameraKey) {
        _lastCameraKey = camKey;
        _applyQuiet(Js3dCommand(
          kind: 'setCamera',
          sceneId: sceneId,
          payload: cam.cast<String, dynamic>(),
        ));
      }
    }
    final models = config['models'];
    if (models is! List) return;
    final seen = <String>{};
    for (final entry in models.whereType<Map>()) {
      final m = entry.cast<String, dynamic>();
      final id = (m['modelId'] ?? m['id'] ?? 'model').toString();
      seen.add(id);
      final src = m['src'] as String?;
      if (src != null && src.isNotEmpty && _declaredModelSrcs[id] != src) {
        _declaredModelSrcs[id] = src;
        _applyQuiet(Js3dCommand(kind: 'addModel', sceneId: sceneId, payload: m));
      } else {
        _applyQuiet(
          Js3dCommand(kind: 'setTransform', sceneId: sceneId, payload: m),
        );
      }
      final clip = m['animation'] as String?;
      if (clip != null && _playingClips[id] != clip) {
        _playingClips[id] = clip;
        _applyQuiet(Js3dCommand(
          kind: 'playAnimation',
          sceneId: sceneId,
          payload: {'modelId': id, 'name': clip},
        ));
      }
    }
    for (final old in _declaredModelSrcs.keys.toList()) {
      if (!seen.contains(old)) {
        _declaredModelSrcs.remove(old);
        _playingClips.remove(old);
        _applyQuiet(Js3dCommand(
          kind: 'removeModel',
          sceneId: sceneId,
          payload: {'modelId': old},
        ));
      }
    }
  }

  /// Fingerprint of the last camera config applied declaratively.
  String? _lastCameraKey;

  void _applyCamera(Map<String, dynamic>? cam) {
    final camera = game?.camera;
    if (cam == null || camera is! CameraComponent3D) return;
    js3dReadVec3f(cam['position'] as List?)?.let(camera.position.setFrom);
    js3dReadVec3f(cam['target'] as List?)?.let(camera.target.setFrom);
    js3dReadVec3f(cam['up'] as List?)
        ?.let((Vector3 v) => camera.up.setFrom(v));
    final fov = (cam['fov'] as num?)?.toDouble();
    if (fov != null) camera.fovY = fov;
  }

  void _applyLight(Map<String, dynamic>? light) {
    // Runtime light mutation is not exposed by flame_3d; lights are configured
    // once when the game loads.
  }

  /// Guard for the ChangeNotifier teardown itself — independent from
  /// [_disposed], which marks the whole controller as torn down.
  bool _cnDisposed = false;

  @override
  void dispose() {
    final lastReference = _host._release(this);
    // Idempotent ChangeNotifier teardown: shared controllers can be
    // disposed by several owners (unmount + final tree teardown).
    if (lastReference && !_cnDisposed) {
      _cnDisposed = true;
      super.dispose();
    }
  }

  void _disposeInternal() {
    if (_disposed) return;
    _disposed = true;
    game?.dispose();
  }
}

/// A [World3D] that does not depend on a live [MediaQuery]: the stock world
/// reads the device pixel ratio from `game.buildContext` on every render,
/// which crashes during offscreen teardown (deactivated ancestor lookup).
/// This one carries an explicitly assigned [pixelRatio] and its own light
/// registry (the base `_lights` list is private).
class _JsWorld3D extends World3D {
  /// Device pixel ratio used for the GPU pass size; assigned by the capture
  /// widget while its context is alive (defaults to 1).
  double pixelRatio = 1;

  /// Lights registered through [addLight] (the base class keeps its own
  /// private list; we mirror it here for the render pass).
  final List<Light> jsLights = [];

  @override
  void addLight(Light light) {
    super.addLight(light);
    jsLights.add(light);
  }

  @override
  void removeLight(Light light) {
    super.removeLight(light);
    jsLights.remove(light);
  }

  @override
  void renderFromCamera(Canvas canvas) {
    final camera = CameraComponent3D.currentCamera!;
    final Viewport(virtualSize: size) = camera.viewport;
    final renderSize = Size(size.x * pixelRatio, size.y * pixelRatio);
    context
      ..lights = jsLights
      ..setCamera(camera.viewMatrix, camera.projectionMatrix);
    final device = game.device;
    device.beginPass(renderSize);
    // NOT super.renderFromCamera: that is World3D's own implementation,
    // which needs a live MediaQuery. World.renderFromCamera (flame's 2D
    // world) is just `renderTree(canvas)` plus a camera assert.
    // Render the world's children manually: a vanilla world.renderTree
    // never reaches the Object3D children in the offscreen capture, so the
    // GPU pass stayed empty. Rendering each child directly is what flame's
    // pipeline does in the GameWidget path.
    for (final child in children) {
      child.renderTree(canvas);
    }
    context.flush();
    final image = device.endPass();
    canvas.drawImageRect(
      image,
      Offset.zero & renderSize,
      Rect.fromLTWH(-size.x / 2, -size.y / 2, size.x, size.y),
      // The whole point of the 2x supersample is the downscale — with the
      // default FilterQuality.none the larger image is point-sampled and
      // the jaggies survive. High quality filtering is what makes SSAA
      // actually smooth the edges.
      Paint()..filterQuality = FilterQuality.high,
    );
    image.dispose();
  }
}

/// {@template js_flame3d_game}
/// A small [FlameGame3D] that loads a single GLB/GLTF/OBJ model and rotates it.
/// {@endtemplate}
class JsFlame3dGame extends FlameGame3D<World3D, CameraComponent3D> {
  JsFlame3dGame(
    this.config, {
    this.onError,
  }) : super(
        world: _JsWorld3D(),
        camera: CameraComponent3D(
          position: Vector3(0, 0, 8),
          target: Vector3.zero(),
          fovY: 60,
        ),
      );



  final Map<String, dynamic> config;
  final void Function(String)? onError;
  final Map<String, ModelComponent> _models = {};
  final Map<String, _Rotation> _rotations = {};
  final Set<String> _loadingModels = {};

  /// Model id → clip requested before the model finished loading. A
  /// declarative scene rebuilt only once per exported frame may request an
  /// animation while the model is still parsing; the clip starts right after
  /// the model lands in the world.
  final Map<String, String> _pendingClips = {};

  /// The scene composites over other layers (yoclip backgrounds, board
  /// panels) — Flame's default black backdrop must not cover them.
  @override
  Color backgroundColor() => const Color(0x00000000);

  @override
  FutureOr<void> onLoad() async {
    await super.onLoad();

    final cameraConfig = config['camera'] as Map<String, dynamic>?;
    if (cameraConfig != null) {
      js3dReadVec3f(cameraConfig['position'] as List?)
          ?.let(camera.position.setFrom);
      js3dReadVec3f(cameraConfig['target'] as List?)?.let(camera.target.setFrom);
      final fov = (cameraConfig['fov'] as num?)?.toDouble();
      if (fov != null) camera.fovY = fov;
    }

    final lightConfig = config['light'] as Map<String, dynamic>?;
    final ambientIntensity =
        (lightConfig?['ambient'] as num?)?.toDouble() ?? 0.4;
    final diffuseIntensity =
        (lightConfig?['diffuse'] as num?)?.toDouble() ?? 0.8;
    debugPrint(
      '[Flame3dGame] adding lights ambient=$ambientIntensity '
      'diffuse=$diffuseIntensity',
    );
    world.addAll([
      LightComponent.ambient(
        color: js3dParseColor(lightConfig?['color'] as String? ?? '#ffffff', _defaultLightColor),
        intensity: ambientIntensity,
      ),
      LightComponent.point(
        position: js3dReadVec3f(lightConfig?['position'] as List?) ??
            Vector3(5, 10, 5),
        color: js3dParseColor(lightConfig?['color'] as String? ?? '#ffffff', _defaultLightColor),
        intensity: diffuseIntensity,
      ),
    ]);
  }

  Future<void> loadModel({
    required String modelId,
    required String? src,
    List<dynamic>? position,
    List<dynamic>? rotation,
    List<dynamic>? scale,
    bool unlit = false,
  }) async {
    if (src == null || src.isEmpty) return;
    // The same scene can be driven by more than one JS engine (visible panel
    // + offscreen board capture), so addModel may arrive twice in parallel.
    // Without a guard both calls see an empty _models map before either parse
    // finishes and add two components — one rotating, one static.
    if (!_loadingModels.add(modelId)) return;

    debugPrint('[Flame3dGame] loadModel modelId=$modelId src=$src');
    Js3dCaptureSync.track(_loadModelInner(
      modelId: modelId,
      src: src,
      position: position,
      rotation: rotation,
      scale: scale,
      unlit: unlit,
    ));
  }

  Future<void> _loadModelInner({
    required String modelId,
    required String src,
    List<dynamic>? position,
    List<dynamic>? rotation,
    List<dynamic>? scale,
    bool unlit = false,
  }) async {
    try {
      removeModel(modelId);
      final model = await ModelParser.parse(src);
      debugPrint(
        '[Flame3dGame] model parsed modelId=$modelId '
        'nodes=${model.nodes.length} animations=${model.animations.length}',
      );
      _applyMaterialFixups(model, unlit: unlit);
      // Remove again in case a parallel add slipped in during the await.
      removeModel(modelId);
      final component = ModelComponent(
        model: model,
        position: js3dReadVec3f(position) ?? Vector3.zero(),
        rotation: _quaternionFromEuler(js3dReadVec3f(rotation) ?? Vector3.zero()),
        scale: js3dReadVec3f(scale) ?? Vector3.all(1),
      );
      _models[modelId] = component;
      world.add(component);
      final pendingClip = _pendingClips[modelId];
      if (pendingClip != null) {
        playSkeletalAnimation(modelId, pendingClip);
      }
      debugPrint(
        '[Flame3dGame] model added modelId=$modelId '
        'worldChildren=${world.children.length}',
      );
    } catch (e) {
      final message = 'Failed to load model "$src": $e';
      debugPrint('[Flame3dGame] $message');
      onError?.call(message);
    } finally {
      _loadingModels.remove(modelId);
    }
  }

  void removeModel(String modelId) {
    final existing = _models.remove(modelId);
    if (existing != null) {
      world.remove(existing);
    }
    _rotations.remove(modelId);
  }

  /// Whether a model with [modelId] is loaded and attached to the world.
  bool hasModel(String modelId) => _models.containsKey(modelId);

  /// Work around the flame_3d GLB parser, which defaults every material to
  /// `metallic: 1.0` and ignores the `metallicRoughnessTexture`. A fully
  /// metallic surface has no diffuse response, so with our simple
  /// ambient+point lighting it renders black. Clamping metallic to 0 makes
  /// models shade with diffuse lighting instead.
  ///
  /// When [unlit] is set (declarative `models: [{..., unlit: true}]`), the
  /// SpatialMaterial is swapped for an UnlitMaterial carrying the same
  /// albedo — flat brand marks (logos, UI) then render at their exact
  /// colors instead of being dimmed by the light rig.
  void _applyMaterialFixups(Model model, {bool unlit = false}) {
    for (final node in model.nodes.values) {
      final mesh = node.mesh;
      if (mesh == null) continue;
      for (final surface in mesh.surfaces) {
        final material = surface.material;
        if (material is SpatialMaterial) {
          if (unlit) {
            surface.material = UnlitMaterial(
              albedoColor: material.albedoColor,
              albedoTexture: material.albedoTexture,
            );
          } else {
            material.metallic = 0.0;
            material.roughness = 1.0;
          }
        }
      }
    }
  }

  void setTransform(
    String modelId, {
    List<dynamic>? position,
    List<dynamic>? rotation,
    List<dynamic>? scale,
  }) {
    final model = _models[modelId];
    if (model == null) return;
    js3dReadVec3f(position)?.let(model.position.setFrom);
    js3dReadVec3f(rotation)?.let((Vector3 v) {
      model.rotation.setFrom(_quaternionFromEuler(v));
    });
    js3dReadVec3f(scale)?.let(model.scale.setFrom);
  }

  void setRotation(String modelId, String axis, double speed) {
    _rotations[modelId] = _Rotation(axis: axis, speed: speed);
  }

  void stopRotation(String modelId) {
    _rotations.remove(modelId);
  }

  /// Starts the skeletal animation clip [name] on a loaded model.
  ///
  /// Unknown clips are ignored (and logged) instead of throwing, so a widget
  /// can request animations before checking [ModelComponent.animationNames].
  void playSkeletalAnimation(String modelId, String name) {
    _pendingClips[modelId] = name;
    final model = _models[modelId];
    if (model == null) {
      debugPrint('[Flame3dGame] clip queued modelId=$modelId name=$name');
      return;
    }
    if (!model.animationNames.contains(name)) {
      debugPrint(
        '[Flame3dGame] unknown animation "$name" for modelId=$modelId '
        '(available: ${model.animationNames.toList()})',
      );
      return;
    }
    model.playAnimationByName(name);
    debugPrint('[Flame3dGame] playAnimation modelId=$modelId name=$name ok');
  }

  /// Stops skeletal playback on a loaded model, if any is running.
  void stopSkeletalAnimation(String modelId) {
    _models[modelId]?.stopAnimation();
  }

  /// Picks the nearest model whose world-space AABB is hit by the camera ray
  /// through [ndc] (x/y in `[-1, 1]`, y up). Returns `{modelId, point}` or
  /// null on a miss.
  Map<String, dynamic>? raycastModel(Offset ndc) {
    final ray = js3dRayFromNdc(ndc, camera.viewProjectionMatrix.storage);
    String? hitId;
    var hitT = double.infinity;
    for (final entry in _models.entries) {
      final aabb = entry.value.aabb;
      final t = js3dRayIntersectAabb(
        ray,
        vm64.Vector3(aabb.min.x, aabb.min.y, aabb.min.z),
        vm64.Vector3(aabb.max.x, aabb.max.y, aabb.max.z),
      );
      if (t != null && t < hitT) {
        hitT = t;
        hitId = entry.key;
      }
    }
    if (hitId == null) return null;
    final point = ray.at(hitT);
    return {
      'modelId': hitId,
      'point': [point.x, point.y, point.z],
    };
  }

  @override
  void update(double dt) {
    super.update(dt);
    for (final entry in _rotations.entries) {
      final model = _models[entry.key];
      if (model == null) continue;
      final rot = entry.value;
      final axis = switch (rot.axis) {
        'x' => Vector3(1, 0, 0),
        'y' => Vector3(0, 1, 0),
        'z' || _ => Vector3(0, 0, 1),
      };
      final delta = rot.speed * dt * 360 * degrees2Radians;
      final q = Quaternion.axisAngle(axis, delta);
      model.rotation.setFrom(model.rotation * q);
    }
  }

}

class _Rotation {
  _Rotation({required this.axis, required this.speed});
  final String axis;
  final double speed;
}



class _ErrorWidget extends StatelessWidget {
  const _ErrorWidget({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Color.fromARGB(255, 239, 68, 68),
          ),
        ),
      ),
    );
  }
}

/// A widget that owns the [GameWidget] lifecycle for a [Flame3dController].
///
/// Keeping [GameWidget] in a single persistent child avoids the
/// "game instance can only be attached to one widget at a time" error that
/// occurs when [ListenableBuilder] recreates the game widget on every
/// controller notification.
class _Flame3dGameWidget extends StatefulWidget {
  const _Flame3dGameWidget({super.key, required this.controller});

  final Flame3dController controller;

  @override
  State<_Flame3dGameWidget> createState() => _Flame3dGameWidgetState();
}

class _Flame3dGameWidgetState extends State<_Flame3dGameWidget> {
  bool _ownsGame = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onControllerChanged);
  }

  @override
  void didUpdateWidget(covariant _Flame3dGameWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      _releaseClaim(oldWidget.controller);
      oldWidget.controller.removeListener(_onControllerChanged);
      widget.controller.addListener(_onControllerChanged);
    }
  }

  @override
  void dispose() {
    _releaseClaim(widget.controller);
    widget.controller.removeListener(_onControllerChanged);
    super.dispose();
  }

  void _releaseClaim(Flame3dController controller) {
    if (_ownsGame) {
      _ownsGame = false;
      // Let other widgets (e.g. the visible panel after the offscreen capture
      // finishes) rebuild and claim the game.
      scheduleMicrotask(controller.releaseGameWidgetClaim);
    }
  }

  void _onControllerChanged() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.controller;
    if (c.isDisposed) {
      debugPrint('[Flame3dGameWidget] controller disposed sceneId=${c.sceneId} — shrink');
      return const SizedBox.shrink();
    }
    if (c.error != null) {
      return _ErrorWidget(message: c.error!);
    }
    final game = c.game;
    if (game == null) {
      return const Center(child: CircularProgressIndicator());
    }
    // The same game instance can only be attached to one GameWidget, but the
    // scene may render in several places at once: the visible panel and the
    // offscreen board capture (overview PNG). The offscreen tree is wrapped in
    // a HeadlessScrollBehavior — never claim or attach the game there, so the
    // visible panel always owns it. Headless trees instead render the scene
    // through the offscreen capture path (render-to-texture inside
    // `World3D.renderFromCamera`, composited into our canvas) — this is what
    // makes GLB scenes exportable to video.
    final isHeadless =
        ScrollConfiguration.of(context) is HeadlessScrollBehavior;
    if (isHeadless) {
      return _Flame3dHeadlessCapture(controller: c, game: game);
    }
    if (!_ownsGame) {
      final owner = c.gameWidgetOwner;
      if (owner == null || !identical(owner, game)) {
        // Unclaimed, or the previous claim points to a stale game instance.
        c.gameWidgetOwner = game;
        _ownsGame = true;
      }
    }
    if (!_ownsGame) {
      return const SizedBox.shrink();
    }
    return GameWidget(game: game, addRepaintBoundary: false);
  }
}

/// Renders a [JsFlame3dGame] into a headless (offscreen) widget tree.
///
/// `World3D.renderFromCamera` already renders the 3D world into a GPU render
/// target and composites it as an image, so driving the game manually from a
/// [CustomPainter] gives us real GLB output in any canvas — including the
/// yoclip video export pipeline. The game's animation clock advances by the
/// config `time` delta (deterministic per rendered frame), never wall time.
class _Flame3dHeadlessCapture extends StatefulWidget {
  const _Flame3dHeadlessCapture({required this.controller, required this.game});

  final Flame3dController controller;
  final JsFlame3dGame game;

  @override
  State<_Flame3dHeadlessCapture> createState() =>
      _Flame3dHeadlessCaptureState();
}

class _Flame3dHeadlessCaptureState extends State<_Flame3dHeadlessCapture> {
  bool _loadStarted = false;

  @override
  void initState() {
    super.initState();
    _ensureLoaded();
  }

  @override
  void didUpdateWidget(covariant _Flame3dHeadlessCapture oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!identical(oldWidget.game, widget.game)) {
      _loadStarted = false;
    }
    _ensureLoaded();
  }

  void _ensureLoaded() {
    if (_loadStarted) return;
    _loadStarted = true;
    // Without a GameWidget nothing calls onLoad for us — and nothing mounts
    // the game. An unmounted FlameGame renders and updates NOTHING
    // (CameraComponent skips unmounted worlds), so mount it manually once
    // the load completes.
    () async {
      final future = widget.game.onLoad();
      if (future != null) await future;
      if (!widget.game.isMounted) {
        widget.game.mount();
      }
      if (mounted) setState(() {});
    }();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.controller.isDisposed) {
      return const SizedBox.shrink();
    }
    // NOTE: the capture harness renders physical pixels 1:1 (the test
    // surface reports ratio 3.0, which would inflate the GPU pass and scale
    // the scene out of frame). The painter instead supersamples the world's
    // render target 2x internally for anti-aliasing.
    return CustomPaint(
      size: Size.infinite,
      painter: _Flame3dCapturePainter(
        controller: widget.controller,
        game: widget.game,
      ),
    );
  }
}

/// Drives a [JsFlame3dGame] frame-by-frame into an offscreen canvas.
class _Flame3dCapturePainter extends CustomPainter {
  _Flame3dCapturePainter({
    required this.controller,
    required this.game,
  }) : super(repaint: controller);

  final Flame3dController controller;
  final JsFlame3dGame game;

  /// Last size pushed into the game — tracked here because [FlameGame.size]
  /// asserts until the first `onGameResize`, so we can't read-compare it.
  Vector2? _lastSize;

  @override
  void paint(Canvas canvas, Size size) {
    // Teardown race: a final paint can flush after the controller is gone.
    if (size.isEmpty || controller.isDisposed) return;
    // Supersample the GPU pass for anti-aliased edges: the world renders
    // into a 2x render target and `_JsWorld3D.renderFromCamera` downscales
    // it into the widget rect (classic SSAA). 1x output looked visibly
    // jaggy on hard GLB edges (logo silhouettes).
    final w = game.world;
    if (w is _JsWorld3D && w.pixelRatio != 2.0) w.pixelRatio = 2.0;
    final target = Vector2(size.width, size.height);
    final last = _lastSize;
    if (last == null || (last - target).length2 > 0.01) {
      _lastSize = target;
      game.onGameResize(target);
    }
    final dt = controller.declaredTime - controller.lastTime;
    if (dt > 0 && game.isMounted) {
      game.update(dt);
      controller.lastTime = controller.declaredTime;
    }
    game.render(canvas);
  }

  @override
  bool shouldRepaint(covariant _Flame3dCapturePainter oldDelegate) => true;
}

/// Default light color when a hex string cannot be parsed.
const _defaultLightColor = Color.fromARGB(255, 59, 130, 246);

Quaternion _quaternionFromEuler(Vector3 eulerDegrees) {
  final yaw = eulerDegrees.y * degrees2Radians;
  final pitch = eulerDegrees.x * degrees2Radians;
  final roll = eulerDegrees.z * degrees2Radians;
  return Quaternion.euler(pitch, yaw, roll);
}

extension _Vector3Let on Vector3 {
  void let(void Function(Vector3) action) => action(this);
}
