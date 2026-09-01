// ignore_for_file: invalid_use_of_internal_member
import 'dart:async';
import 'dart:typed_data';

import 'package:flame/game.dart';
import 'package:flame_3d/camera.dart';
import 'package:flame_3d/components.dart';
import 'package:flame_3d/game.dart';
import 'package:flame_3d/graphics.dart';
import 'package:flame_3d/model.dart';
import 'package:flame_3d/parser.dart';
import 'package:flame_3d/resources.dart';
// Glb/GlbChunk are not re-exported by package:flame_3d/parser.dart; the
// version is pinned, so reach into the parser internals for the URL-aware
// GLB override below.
import 'package:flame_3d/src/parser/glb_parser.dart' as glb_parser;
import 'package:flame_3d/src/parser/gltf/glb_chunk.dart' as glb_chunk;
import 'package:flutter/material.dart' hide Viewport;
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/hosts/js_3d_host_utils.dart';
import 'package:js_widget_runtime/src/renderer/nodes/hosts/js_3d_raycast.dart';
import 'package:js_widget_runtime/src/renderer/nodes/hosts/js_3d_url_bytes.dart';
import 'package:vector_math/vector_math_64.dart' as vm64;

part 'flame_3d_controller_config.dart';
/// Creates a [Js3dHost] implementation backed by `flame_3d`.
///
/// Supports GLB/GLTF/OBJ models with animations and lighting. This host
/// requires Impeller + Flutter GPU, so it only runs on Android, iOS, and
/// macOS. On other platforms the panel shows a fallback message.
///
/// [fileBytesLoader] lets the host app resolve model sources that live
/// outside the asset bundle (a sandboxed Documents tree, app-specific
/// path mapping). See [Js3dFileBytesLoader].
Js3dHost createFlame3dHost({Js3dFileBytesLoader? fileBytesLoader}) {
  if (fileBytesLoader != null) {
    Js3dUrlGlbParser.fileBytesLoader = fileBytesLoader;
  }
  return Flame3dHost.instance;
}

/// {@template flame3d_host}
/// A [Js3dHost] that drives a `flame_3d` scene from JS commands.
/// {@endtemplate}
class Flame3dHost extends Js3dHost
    with Js3dControllerRegistry<Flame3dController> {
  Flame3dHost._() {
    // URL-based GLB sources: the stock flame_3d parser reads only from the
    // asset bundle ("assets/https://…" 404s). Swap in a GLB parser that
    // fetches http(s) bytes first; asset paths still delegate to the stock
    // implementation. Process-global (ModelParser.glb is a static) but
    // strictly additive.
    ModelParser.glb = Js3dUrlGlbParser();
  }

  /// Singleton instance shared by the JS bridge and the widget renderer.
  static final Flame3dHost instance = Flame3dHost._();

  bool _gpuInitialized = false;

  /// Test seam: when set, [Flame3dController._initGame] skips the real GPU
  /// backend initialization (which requires Impeller) — used together with
  /// an injected game factory to drive the controller logic headlessly.
  @visibleForTesting
  bool skipGpuInit = false;

  Future<void> _ensureGpu() async {
    if (_gpuInitialized || skipGpuInit) return;
    await GpuBackend.initialize();
    _gpuInitialized = true;
  }

  @override
  Js3dController createController(
    String sceneId,
    Map<String, dynamic> config,
  ) {
    final existing = retainController(sceneId);
    if (existing != null) {
      debugPrint('[Flame3dHost] reuse controller sceneId=$sceneId');
      return existing;
    }
    final controller = Flame3dController(sceneId, config, this);
    registerController(controller);
    debugPrint(
      '[Flame3dHost] create controller sceneId=$sceneId '
      'configKeys=${config.keys.toList()}',
    );
    return controller;
  }

  @override
  Widget build(
    BuildContext context,
    Js3dController controller,
    Map<String, dynamic> config,
  ) {
    final c = controller as Flame3dController;
    // Declarative configs (the yoclip video pipeline re-renders the whole
    // node tree every frame) are applied *after* the current frame lays out,
    // not inside build — running addModel / setTransform / playAnimation
    // while the Flame [GameWidget] is still being built trips the
    // `game.hasLayout` assertion on the very next seek when the render object
    // is being reattached.
    return _Flame3dDeclarativeNode(controller: c, config: config);
  }
}

/// Applies the declarative config after the current frame, isolating game
/// mutations from the build pass.
class _Flame3dDeclarativeNode extends StatefulWidget {
  const _Flame3dDeclarativeNode({required this.controller, required this.config});

  final Flame3dController controller;
  final Map<String, dynamic> config;

  @override
  State<_Flame3dDeclarativeNode> createState() => _Flame3dDeclarativeNodeState();
}

class _Flame3dDeclarativeNodeState extends State<_Flame3dDeclarativeNode> {
  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onChanged);
    _apply();
  }

  @override
  void didUpdateWidget(covariant _Flame3dDeclarativeNode oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!identical(oldWidget.controller, widget.controller)) {
      oldWidget.controller.removeListener(_onChanged);
      widget.controller.addListener(_onChanged);
    }
    if (oldWidget.config != widget.config) _apply();
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onChanged);
    super.dispose();
  }

  void _onChanged() {
    if (mounted) setState(() {});
  }

  void _apply() {
    // Defer until after the current frame's build/layout/paint so the
    // underlying [GameWidget] is laid out and ready to receive mutations
    // (flame's `game.hasLayout` assertion fires otherwise).
    final config = widget.config;
    if (config.isEmpty) return;
    final controller = widget.controller;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) controller.sceneSync._applyConfig(config);
    });
  }

  @override
  Widget build(BuildContext context) {
    return _Flame3dGameWidget(controller: widget.controller);
  }
}

/// {@template flame3d_controller}
/// A [Js3dController] implementation that backs a `flame_3d` scene.
/// {@endtemplate}
class Flame3dController extends RefCountedJs3dController {
  Flame3dController(this.sceneId, this.config, this._host, {gameFactory})
    : _gameFactory = gameFactory ?? _defaultGameFactory;

  final String sceneId;
  final Map<String, dynamic> config;
  final Flame3dHost _host;

  /// Declarative scene-config diffing (part file) — exposed members:
  /// [debugApplyConfig], [declaredTime], [lastTime].
  late final Flame3dSceneSync sceneSync = Flame3dSceneSync(
    sceneId: sceneId,
    isDisposed: () => _disposed,
    applyQuiet: _applyQuiet,
  );

  @visibleForTesting
  void debugApplyConfig(Map<String, dynamic> config) =>
      sceneSync._applyConfig(config);
  final Js3dGameApi Function(Map<String, dynamic>, Flame3dController)
  _gameFactory;

  static Js3dGameApi _defaultGameFactory(
    Map<String, dynamic> config,
    Flame3dController controller,
  ) => JsFlame3dGame(config, onError: controller._handleGameError);

  Js3dGameApi? game;
  String? error;
  final List<Js3dCommand> _pending = [];
  bool _initializing = false;
  bool _disposed = false;

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

  /// Whether the controller was disposed — teardown (scene unmount, final
  /// tree disposal) can race with paints/rebuilds still referencing it.
  @override
  bool get isDisposedCtrl => _disposed;
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
    if (game == null) {
      _bufferWhileLoading(command);
      return;
    }
    _apply(command);
  }

  /// Queues [command] until the game finishes initializing. Dropped when the
  /// init already failed (`error != null`) — there is no game to apply to.
  void _bufferWhileLoading(Js3dCommand command) {
    if (error != null) return;
    _pending.add(command);
    _initGameIfNeeded();
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
      _createGameIfReady();
      _finishInit();
    } catch (e) {
      _handleInitError(e);
    }
  }

  void _createGameIfReady() {
    if (_disposed || game != null) return;
    debugPrint('[Flame3dController] game created sceneId=$sceneId');
    game = _gameFactory(config, this);
    _trackOnLoad();
  }

  void _finishInit() {
    _drainPendingCommands();
    if (!_disposed) notifyListeners();
  }

  void _handleGameError(String message) {
    if (_disposed) return;
    error = message;
    debugPrint('[Flame3dController] error sceneId=$sceneId: $message');
    notifyListeners();
  }

  void _trackOnLoad() {
    Js3dCaptureSync.track(game!.load());
  }

  void _drainPendingCommands() {
    for (final cmd in _pending) {
      _apply(cmd);
    }
    _pending.clear();
  }

  void _handleInitError(Object error) {
    if (_disposed) return;
    this.error = 'flame_3d unavailable: $error';
    debugPrint('[Flame3dController] init error sceneId=$sceneId: $error');
    _pending.clear();
    notifyListeners();
  }

  void _apply(Js3dCommand command) {
    final payload = command.payload ?? {};
    final modelId = js3dModelId(command, payload);
    final handler = _commandHandlers[command.kind];
    if (handler != null) handler(modelId, payload);
  }

  void _applyAddModel(String modelId, Map<String, dynamic> payload) {
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
      color: payload['color'] as String?,
    );
  }

  void _applyPlayAnimation(String modelId, Map<String, dynamic> payload) {
    final name = payload['name'] as String?;
    if (name != null) {
      // Skeletal animation from the model's GLB clip list. flame_3d's
      // AnimationState always loops at 1x speed, so `loop`/`speed` are
      // accepted for API compatibility but not yet applied.
      game?.playSkeletalAnimation(modelId, name);
      return;
    }
    final axis = payload['axis'] as String? ?? 'y';
    final speed = (payload['speed'] as num?)?.toDouble() ?? 1.0;
    game?.setRotation(modelId, axis, speed);
  }

  void _applyStopAnimation(String modelId, Map<String, dynamic> _) {
    game?.stopRotation(modelId);
    game?.stopSkeletalAnimation(modelId);
  }

  late final Map<String, void Function(String, Map<String, dynamic>)>
      _commandHandlers = {
        'addModel': _applyAddModel,
        'removeModel': (modelId, _) => game?.removeModel(modelId),
        'setTransform': (modelId, payload) => game?.setTransform(
              modelId,
              position: payload['position'] as List?,
              rotation: payload['rotation'] as List?,
              scale: payload['scale'] as List?,
            ),
        'playAnimation': _applyPlayAnimation,
        'stopAnimation': _applyStopAnimation,
        'setCamera': (_, payload) => _applyCamera(payload),
        'setLight': (_, payload) => _applyLight(payload),
      };


  void _applyCamera(Map<String, dynamic>? cam) {
    if (cam == null) return;
    game?.setCamera(
      js3dReadVec3f(cam['position'] as List?),
      js3dReadVec3f(cam['target'] as List?),
      js3dReadVec3f(cam['up'] as List?),
      (cam['fov'] as num?)?.toDouble(),
    );
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
    final lastReference = _host.releaseController(this);
    // Idempotent ChangeNotifier teardown: shared controllers can be
    // disposed by several owners (unmount + final tree teardown).
    if (lastReference && !_cnDisposed) {
      _cnDisposed = true;
      super.dispose();
    }
    if (lastReference) disposeInternal();
  }

  @override
  void disposeInternal() {
    if (_disposed) return;
    _disposed = true;
    final g = game;
    // A game that never received a layout (e.g. a single-frame offscreen
    // capture torn down at the exact frame the scene entered) asserts inside
    // FlameGame.dispose while processing lifecycle events. Skipping disposal
    // is safe: nothing was ever laid out or painted, and the harness process
    // tears the whole isolate down right after.
    if (g == null || !g.hasEverLaidOut) return;
    g.disposeGame();
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
/// The controller-facing surface of a 3D game. Exists so tests can drive
/// the controller's command/diff logic with a recording implementation,
/// without the GPU requirements of [JsFlame3dGame]'s FlameGame3D base.
abstract class Js3dGameApi {
  Future<void> loadModel({
    required String modelId,
    required String? src,
    List<dynamic>? position,
    List<dynamic>? rotation,
    List<dynamic>? scale,
    bool unlit = false,
    String? color,
  });

  void removeModel(String modelId);

  void setTransform(
    String modelId, {
    List<dynamic>? position,
    List<dynamic>? rotation,
    List<dynamic>? scale,
  });

  void setRotation(String modelId, String axis, double speed);

  void stopRotation(String modelId);

  void playSkeletalAnimation(String modelId, String name);

  void stopSkeletalAnimation(String modelId);

  void setCamera(
    Vector3? position,
    Vector3? target,
    Vector3? up,
    double? fov,
  );

  /// Initializes the game (loads assets); called once after creation.
  Future<void> load();

  /// Whether the game ever received a layout. Games that never laid out
  /// can be dropped without disposal. Distinct from flame's own
  /// `Game.hasLayout` (which the GameWidget asserts during attach): this one
  /// stays true once the game was ever resized.
  bool get hasEverLaidOut;

  /// Releases native/GPU resources.
  void disposeGame();

  Map<String, dynamic>? raycastModel(Offset ndc);
}

class JsFlame3dGame extends FlameGame3D<World3D, CameraComponent3D>
    implements Js3dGameApi {
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
  Color backgroundColor() => _transparentBackdrop;

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
    String? color,
  }) async {
    if (!_shouldLoad(modelId, src)) return;
    debugPrint('[Flame3dGame] loadModel modelId=$modelId src=$src');
    Js3dCaptureSync.track(_loadModelInner(
      modelId: modelId,
      src: src!,
      position: position,
      rotation: rotation,
      scale: scale,
      unlit: unlit,
      color: color,
    ));
  }

  /// Guards a load request: rejects an empty [src], and deduplicates
  /// parallel loads of the same model. The same scene can be driven by more
  /// than one JS engine (visible panel + offscreen board capture), so
  /// addModel may arrive twice in parallel. Without a guard both calls see
  /// an empty `_models` map before either parse finishes and add two
  /// components — one rotating, one static.
  bool _shouldLoad(String modelId, String? src) {
    if (src == null || src.isEmpty) return false;
    return _loadingModels.add(modelId);
  }
  Future<void> _loadModelInner({
    required String modelId,
    required String src,
    List<dynamic>? position,
    List<dynamic>? rotation,
    List<dynamic>? scale,
    bool unlit = false,
    String? color,
  }) async {
    try {
      removeModel(modelId);
      final model = await ModelParser.parse(src);
      debugPrint(
        '[Flame3dGame] model parsed modelId=$modelId '
        'nodes=${model.nodes.length} animations=${model.animations.length}',
      );
      _applyMaterialFixups(model, unlit: unlit);
      js3dTintModel(model, color);
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
  void _applyMaterialFixups(Model model, {bool unlit = false}) => _applyNodeMaterialFixups(model.nodes.values, unlit: unlit);

  void _applyNodeMaterialFixups(Iterable<ModelNode> nodes, {required bool unlit}) {
    for (final node in nodes) {
      final mesh = node.mesh;
      if (mesh != null) _applyMeshMaterialFixups(mesh, unlit: unlit);
    }
  }

  void _applyMeshMaterialFixups(Mesh mesh, {required bool unlit}) {
    for (final surface in mesh.surfaces) {
      _fixSurfaceMaterial(surface, unlit: unlit);
    }
  }

  void _fixSurfaceMaterial(Surface surface, {required bool unlit}) {
    final material = surface.material;
    if (material is! SpatialMaterial) return;
    if (!unlit) {
      material.metallic = 0.0;
      material.roughness = 1.0;
      return;
    }
    surface.material = UnlitMaterial(
      albedoColor: material.albedoColor,
      albedoTexture: material.albedoTexture,
    );
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

  /// Applies declarative camera pose/fov; individual nulls leave the
  /// current value untouched.
  void setCamera(
    Vector3? position,
    Vector3? target,
    Vector3? up,
    double? fov,
  ) {
    _applyCameraPose(position, target, up);
    if (fov != null) camera.fovY = fov;
  }

  void _applyCameraPose(Vector3? position, Vector3? target, Vector3? up) {
    position?.let(camera.position.setFrom);
    target?.let(camera.target.setFrom);
    up?.let(camera.up.setFrom);
  }

  @override
  Future<void> load() async {
    final future = onLoad();
    if (future is Future<void>) await future;
  }

  // NOTE: do NOT override flame's `hasLayout` here. GameWidget's
  // loaderFuture asserts `game.hasLayout` while attaching — before
  // `game.mount()` — so an override that also requires `isMounted` makes the
  // assert fire on every fresh attach (and reading `size` before the first
  // resize throws the same assert itself). Track "ever laid out" separately
  // for the dispose guard instead.
  bool _everLaidOut = false;

  @override
  void onGameResize(Vector2 size) {
    _everLaidOut = true;
    super.onGameResize(size);
  }

  @override
  bool get hasEverLaidOut => _everLaidOut;

  @override
  void disposeGame() => dispose();

  /// Picks the nearest model whose world-space AABB is hit by the camera ray
  /// through [ndc] (x/y in `[-1, 1]`, y up). Returns `{modelId, point}` or
  /// null on a miss.
  Map<String, dynamic>? raycastModel(Offset ndc) {
    final ray = js3dRayFromNdc(ndc, camera.viewProjectionMatrix.storage);
    final hit = _nearestModelHit(ray);
    if (hit == null) return null;
    return {
      'modelId': hit.modelId,
      'point': [hit.t.x, hit.t.y, hit.t.z],
    };
  }

  /// Ray/AABB sweep over all loaded models; the nearest hit wins.
  _ModelHit? _nearestModelHit(Js3dRay ray) {
    _ModelHit? best;
    var bestT = double.infinity;
    for (final entry in _models.entries) {
      final t = _rayDistanceToModel(ray, entry.value);
      if (!_isBetterHit(t, bestT)) continue;
      bestT = t!;
      best = _ModelHit(entry.key, ray.at(t));
    }
    return best;
  }

  /// Whether [t] is a valid hit strictly closer than [bestT].
  bool _isBetterHit(double? t, double bestT) => t != null && t < bestT;

  double? _rayDistanceToModel(Js3dRay ray, ModelComponent model) =>
      js3dRayIntersectAabb(
        ray,
        vm64.Vector3(model.aabb.min.x, model.aabb.min.y, model.aabb.min.z),
        vm64.Vector3(model.aabb.max.x, model.aabb.max.y, model.aabb.max.z),
      );

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
    // A calm, theme-neutral placeholder — a missing model is expected in
    // some environments (web preview without flutter_gpu, install-dir
    // assets unavailable) and must not look like an alarm.
    const muted = Color(0xFF94A3B8);
    const faint = Color(0xFF64748B);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: muted.withAlpha(20),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: muted.withAlpha(60)),
              ),
              child: const Icon(
                Icons.view_in_ar_outlined,
                size: 28,
                color: muted,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              '3D preview unavailable',
              style: TextStyle(
                color: muted,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              message,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: faint, fontSize: 10.5),
            ),
          ],
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
    final fallback = _buildFallback(c);
    if (fallback != null) return fallback;
    final game = c.game!;
    // The same game instance can only be attached to one GameWidget, but the
    // scene may render in several places at once: the visible panel and the
    // offscreen board capture (overview PNG). The offscreen tree is wrapped in
    // a HeadlessScrollBehavior — never claim or attach the game there, so the
    // visible panel always owns it. Headless trees instead render the scene
    // through the offscreen capture path (render-to-texture inside
    // `World3D.renderFromCamera`, composited into our canvas) — this is what
    // makes GLB scenes exportable to video.
    if (_isHeadlessContext(context)) {
      return _Flame3dHeadlessCapture(controller: c, game: game as JsFlame3dGame);
    }
    return _ownedGameWidget(c, game as JsFlame3dGame);
  }

  /// The attached [GameWidget] for this widget once it owns the game, or a
  /// zero-size placeholder while another live widget holds the claim.
  Widget _ownedGameWidget(Flame3dController c, JsFlame3dGame game) {
    if (!_tryClaimGame(c, game)) {
      return const SizedBox.shrink();
    }
    return GameWidget(game: game, addRepaintBoundary: false);
  }

  /// Placeholder widget for disposed/errored/loading controllers, or `null`
  /// when the controller has a live game to render.
  Widget? _buildFallback(Flame3dController c) {
    if (c.isDisposed) return _disposedPlaceholder(c);
    return _readyFallback(c);
  }

  Widget? _readyFallback(Flame3dController c) {
    if (c.error != null) return _ErrorWidget(message: c.error!);
    if (c.game == null) return _loadingPlaceholder();
    return null;
  }

  Widget _disposedPlaceholder(Flame3dController c) {
    debugPrint('[Flame3dGameWidget] controller disposed sceneId=${c.sceneId} — shrink');
    return const SizedBox.shrink();
  }

  Widget _loadingPlaceholder() =>
      const Center(child: CircularProgressIndicator());

  bool _isHeadlessContext(BuildContext context) =>
      ScrollConfiguration.of(context) is HeadlessScrollBehavior;

  /// Claims the game for this widget unless another live widget owns it.
  /// Returns whether this widget now owns the game.
  bool _tryClaimGame(Flame3dController c, JsFlame3dGame game) {
    if (_ownsGame) return true;
    // Unclaimed, or the previous claim points to a stale game instance.
    if (_claimIsStale(c, game)) {
      c.gameWidgetOwner = game;
      _ownsGame = true;
    }
    return _ownsGame;
  }

  bool _claimIsStale(Flame3dController c, JsFlame3dGame game) {
    final owner = c.gameWidgetOwner;
    return owner == null || !identical(owner, game);
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
    // the load completes. Defer to after the first frame so the [GameWidget]
    // has a real size by the time we call `game.mount()` — flame's
    // `loaderFuture` IIFE asserts `game.hasLayout` (`_size != null`) and
    // would fire when the GameWidget runs its own performLayout otherwise.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      () async {
        await _loadAndMountGame();
        if (mounted) setState(() {});
      }();
    });
  }

  Future<void> _loadAndMountGame() async {
    final future = widget.game.onLoad();
    if (future != null) await future;
    if (!widget.game.isMounted) {
      widget.game.mount();
    }
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
    _applySupersampling();
    _resizeIfNeeded(size);
    _advanceAnimationClock();
    game.render(canvas);
  }

  /// Supersample the GPU pass for anti-aliased edges: the world renders
  /// into a 2x render target and `_JsWorld3D.renderFromCamera` downscales
  /// it into the widget rect (classic SSAA). 1x output looked visibly
  /// jaggy on hard GLB edges (logo silhouettes).
  void _applySupersampling() {
    final w = game.world;
    if (w is _JsWorld3D && w.pixelRatio != 2.0) w.pixelRatio = 2.0;
  }

  void _resizeIfNeeded(Size size) {
    final target = Vector2(size.width, size.height);
    final last = _lastSize;
    if (last != null && (last - target).length2 <= 0.01) return;
    _lastSize = target;
    game.onGameResize(target);
  }

  /// The game's animation clock advances by the config `time` delta
  /// (deterministic per rendered frame), never wall time.
  void _advanceAnimationClock() {
    final dt = controller.sceneSync.declaredTime - controller.sceneSync.lastTime;
    if (dt <= 0 || !game.isMounted) return;
    game.update(dt);
    controller.sceneSync.lastTime = controller.sceneSync.declaredTime;
  }

  @override
  bool shouldRepaint(covariant _Flame3dCapturePainter oldDelegate) => true;
}

/// Default light color when a hex string cannot be parsed.
const _defaultLightColor = Color.fromARGB(255, 59, 130, 246);

/// A raycast hit: the model id and the world-space intersection point.
class _ModelHit {
  const _ModelHit(this.modelId, this.t);

  final String modelId;
  final vm64.Vector3 t;
}

Quaternion _quaternionFromEuler(Vector3 eulerDegrees) {
  final yaw = eulerDegrees.y * degrees2Radians;
  final pitch = eulerDegrees.x * degrees2Radians;
  final roll = eulerDegrees.z * degrees2Radians;
  return Quaternion.euler(yaw, pitch, roll);
}

extension _Vector3Let on Vector3 {
  void let(void Function(Vector3) action) => action(this);
}

/// The scene composites over other layers (backgrounds, board panels) —
/// Flame's default black backdrop must not cover them.
const _transparentBackdrop = Color(0x00000000);

/// Loads model bytes for a source that lives outside the Flutter asset
/// bundle — e.g. a sandboxed Documents tree on mobile, where installed
/// widgets keep their files (`Documents/fah_sandbox/apps/...`).
///
/// Return the bytes to parse, or null to fall through to the built-in
/// local-file read and then the asset bundle.
typedef Js3dFileBytesLoader = Future<Uint8List?> Function(String src);

/// GLB parser that resolves non-asset sources as bytes before
/// chunk-walking.
///
/// flame_3d's stock [GlbParser.parseGlb] reads via `Flame.assets` (the
/// asset bundle), so anything outside the bundle fails with `Unable to
/// load asset: …`. Resolution order:
/// 1. `http(s)://` — fetched over the network (CORS applies on web);
/// 2. [fileBytesLoader] — host-provided sandbox resolution (VM hosts
///    only; returning null falls through);
/// 3. an existing local file path (optionally `file://`-schemed) — read
///    directly on the VM;
/// 4. otherwise the stock asset-bundle parser, unchanged.
class Js3dUrlGlbParser extends glb_parser.GlbParser {
  /// Host-provided byte loader, set via
  /// `createFlame3dHost(fileBytesLoader: …)` /
  /// `createJs3dHost(fileBytesLoader: …)` or directly. Process-global,
  /// like the `ModelParser.glb` override itself.
  static Js3dFileBytesLoader? fileBytesLoader;

  @override
  Future<glb_parser.Glb> parseGlb(String filePath) async {
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      final content = await js3dFetchBytes(filePath);
      return parseGlbBytes(content, filePath);
    }
    final loader = fileBytesLoader;
    if (loader != null) {
      final bytes = await loader(filePath);
      if (bytes != null) return parseGlbBytes(bytes, filePath);
    }
    final local = await js3dReadLocalFileBytes(filePath);
    if (local != null) return parseGlbBytes(local, filePath);
    return super.parseGlb(filePath);
  }

  /// Walks the GLB container header and chunks (Khronos glTF 2.0 §12).
  @visibleForTesting
  static glb_parser.Glb parseGlbBytes(Uint8List content, String filePath) {
    var cursor = 0;
    Uint8List read(int bytes) {
      cursor += bytes;
      return content.sublist(cursor - bytes, cursor);
    }

    String str(Uint8List b) => String.fromCharCodes(b);
    int i32(Uint8List b) =>
        ByteData.sublistView(b).getUint32(0, Endian.little);

    final magic = str(read(4));
    if (magic != 'glTF') {
      throw Exception('Invalid magic number $magic');
    }
    final version = i32(read(4));
    if (version != 2) {
      throw Exception('Invalid version $version');
    }
    final length = i32(read(4));
    final chunks = <glb_chunk.GlbChunk>[];
    while (cursor < content.length) {
      final chunkLength = i32(read(4));
      final chunkType = str(read(4));
      chunks.add(
        glb_chunk.GlbChunk(
          length: chunkLength,
          type: chunkType,
          data: read(chunkLength),
        ),
      );
    }
    return glb_parser.Glb(
      prefix: ModelParser.prefix(filePath),
      version: version,
      length: length,
      chunks: chunks,
    );
  }
}
