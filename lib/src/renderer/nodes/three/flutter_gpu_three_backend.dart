import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_gpu/gpu.dart' as gpu;
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:vector_math/vector_math.dart' as vm;

part 'gpu/three_gpu_auto_instances.dart';
part 'gpu/three_gpu_resource_sync.dart';
part 'gpu/three_gpu_resources.dart';
part 'gpu/three_gpu_uniforms.dart';

part 'gpu/three_gpu_presentation.dart';
part 'gpu/three_gpu_encoder.dart';
part 'gpu/three_gpu_draw.dart';
const _threeShadowTrace = bool.fromEnvironment('JSR_THREE_SHADOW_TRACE');
final class FlutterGpuThreeBackend {
  FlutterGpuThreeBackend._(
    this.engineId,
    this.surfaceId,
    this._context,
    this._pipeline,
    this._vertexShader,
    this._fragmentShader,
    this._shadowPipeline,
    this._shadowFragmentShader,
    this._pointShadowPipeline,
    this._pointShadowFragmentShader,
    this.lineMode,
  ) {
    _fallbackTexture = _createThreeFallbackTexture(_context);
    _identityInstanceBuffer = _context.createDeviceBufferWithCopy(
      _threeIdentityInstanceData(),
    );
    _identityInstanceView = gpu.BufferView(
      _identityInstanceBuffer,
      offsetInBytes: 0,
      lengthInBytes: _threeInstanceStrideInBytes,
    );
  }

  static const String defaultShaderAsset = 'assets/three/three_r1.shaderbundle';
  static const int maxPendingPresentations = 2;

  /// Offscreen (composer) pass submits in flight. Bounded well above any
  /// real chain length (bloom ~14, SAO ~10) yet capped so a pathological
  /// render-many-times-per-tick widget cannot queue unbounded GPU work.
  static const int maxPendingTargetSubmits = 24;

  final String engineId;
  final String surfaceId;
  final ThreeLineMode lineMode;
  final gpu.GpuContext _context;
  final gpu.RenderPipeline _pipeline;
  final gpu.Shader _vertexShader;
  final gpu.Shader _fragmentShader;
  final gpu.RenderPipeline? _shadowPipeline;
  final gpu.Shader? _shadowFragmentShader;
  final gpu.RenderPipeline? _pointShadowPipeline;
  final gpu.Shader? _pointShadowFragmentShader;
  final Map<_ThreeResourceKey, _GpuGeometry> _geometries = {};
  final Map<_ThreeResourceKey, _GpuTexture> _textures = {};
  final Map<_ThreeResourceKey, _GpuRenderTarget> _renderTargets = {};
  final Map<_ThreeResourceKey, _GpuBatch> _batches = {};
  final Map<_ThreeAutoInstanceKey, _GpuAutoInstanceBatch> _autoInstanceBatches =
      {};
  final List<String> _messages = <String>[];
  final List<Completer<void>> _presentationWaiters = [];
  final ThreeDrawPlanner _planner = const ThreeDrawPlanner(autoInstance: true);

  late final gpu.HostBuffer _hostBuffer = _context.createHostBuffer();
  late final gpu.Texture _fallbackTexture;
  late final gpu.DeviceBuffer _identityInstanceBuffer;
  late final gpu.BufferView _identityInstanceView;
  gpu.GpuImageSurface? _imageSurface;
  gpu.Texture? _depthTexture;
  /// Set when [_depthTexture] is (re)allocated: the first default-framebuffer
  /// pass must CLEAR depth to 1.0 even when the frame asks for
  /// LoadAction.load, because Impeller zero-initializes textures while a new
  /// WebGL drawing buffer guarantees depth 1.0 (three-materials-normalmap:
  /// autoClear=false composer facade rendered fully transparent frames).
  bool _depthNeedsInit = true;
  gpu.Texture? _shadowColorTexture;
  gpu.Texture? _shadowDepthTexture;
  gpu.Texture? _pointShadowFrontColorTexture;
  gpu.Texture? _pointShadowFrontDepthTexture;
  gpu.Texture? _pointShadowBackColorTexture;
  gpu.Texture? _pointShadowBackDepthTexture;
  ui.Image? _currentImage;
  ThreeDrawPlan? _lastPlan;
  Future<void> _renderTail = Future<void>.value();
  var _disposed = false;
  var _width = 0;
  var _height = 0;
  var _shadowWidth = 0;
  var _shadowHeight = 0;
  var _pointShadowWidth = 0;
  var _pointShadowHeight = 0;
  var _shadowFrameActive = false;
  var _shadowMapValid = false;
  ThreeShadowCacheKey? _cachedShadowKey;
  var _shadowCacheHitCount = 0;
  var _uniformOffset = 0;
  var _renderedShadowDrawCount = 0;
  var _pendingPresentations = 0;
  var _pendingTargetSubmits = 0;

  var _renderedFrameCount = 0;
  var _renderedDrawCount = 0;
  var _skippedDrawCount = 0;
  var _geometryUploadCount = 0;
  var _geometryCacheHitCount = 0;
  var _geometryFailureCount = 0;
  var _geometryEvictionCount = 0;
  var _batchUploadCount = 0;
  var _batchCacheHitCount = 0;
  var _batchFailureCount = 0;
  var _batchEvictionCount = 0;
  var _textureUploadCount = 0;
  var _textureCacheHitCount = 0;
  var _textureFailureCount = 0;
  var _textureEvictionCount = 0;
  var _staleTextureUploadCount = 0;
  var _pendingTextureDecodes = 0;
  var _mipmapFallbackCount = 0;
  var _reusedResourceGenerationCount = 0;
  var _resizeCount = 0;
  var _failedPresentationCount = 0;
  var _lastSequence = 0;

  static Future<FlutterGpuThreeBackend> create({
    required String engineId,
    required String surfaceId,
    gpu.GpuContext? context,
    String shaderAsset = defaultShaderAsset,
    ThreeLineMode lineMode = ThreeLineMode.lines,
  }) async {
    _validateThreeSurfaceIds(engineId, surfaceId);
    final resolvedContext = context ?? gpu.gpuContext;
    final library = await _loadThreeShaderLibrary(shaderAsset);
    final shaders = _requireThreeShaders(library, shaderAsset);
    final pipeline = _createThreePipeline(resolvedContext, shaders);
    final shadowFragment = library['ThreeR1ShadowFragment'];
    final shadowPipeline = shadowFragment == null
        ? null
        : _createThreePipeline(resolvedContext, (
            vertex: shaders.vertex,
            fragment: shadowFragment,
          ));
    final pointShadowFragment = library['ThreeR1PointShadowFragment'];
    final pointShadowPipeline = pointShadowFragment == null
        ? null
        : _createThreePipeline(resolvedContext, (
            vertex: shaders.vertex,
            fragment: pointShadowFragment,
          ));
    return FlutterGpuThreeBackend._(
      engineId,
      surfaceId,
      resolvedContext,
      pipeline,
      shaders.vertex,
      shaders.fragment,
      shadowPipeline,
      shadowFragment,
      pointShadowPipeline,
      pointShadowFragment,
      lineMode,
    );
  }

  bool get isDisposed => _disposed;
  ui.Image? get currentImage => _currentImage;
  ThreeDrawPlan? get lastPlan => _lastPlan;
  List<String> get diagnosticMessages => List.unmodifiable(_messages);

  Map<String, num> get diagnostics => {
    'renderedFrames': _renderedFrameCount,
    'renderedDraws': _renderedDrawCount,
    'renderedShadowDraws': _renderedShadowDrawCount,
    'shadowCacheHits': _shadowCacheHitCount,
    'shadowPipelineAvailable': _threeFlag(_shadowPipeline != null),
    'shadowMapWidth': _threeActiveDimension(_shadowFrameActive, _shadowWidth),
    'shadowMapHeight': _threeActiveDimension(_shadowFrameActive, _shadowHeight),
    'skippedDraws': _skippedDrawCount,
    'geometryUploads': _geometryUploadCount,
    'geometryCacheHits': _geometryCacheHitCount,
    'geometryFailures': _geometryFailureCount,
    'geometryEvictions': _geometryEvictionCount,
    'cachedGeometries': _geometries.length,
    'batchUploads': _batchUploadCount,
    'batchCacheHits': _batchCacheHitCount,
    'batchFailures': _batchFailureCount,
    'batchEvictions': _batchEvictionCount,
    'cachedBatches': _batches.length,
    'textureUploads': _textureUploadCount,
    'textureCacheHits': _textureCacheHitCount,
    'textureFailures': _textureFailureCount,
    'textureEvictions': _textureEvictionCount,
    'cachedTextures': _textures.length,
    'cachedRenderTargets': _renderTargets.length,
    'staleTextureUploads': _staleTextureUploadCount,
    'pendingTextureDecodes': _pendingTextureDecodes,
    'mipmapFallbacks': _mipmapFallbackCount,
    'reusedResourceGenerations': _reusedResourceGenerationCount,
    'resizes': _resizeCount,
    'pendingPresentations': _pendingPresentations,
    'failedPresentations': _failedPresentationCount,
    'surfaceBackingTextures': _imageSurface?.debugBackingTextureCount ?? 0,
    'lastSequence': _lastSequence,
    'width': _width,
    'height': _height,
    'lastPlannedOpaqueDraws': _lastPlan?.opaque.length ?? 0,
    'lastPlannedTransparentDraws': _lastPlan?.transparent.length ?? 0,
    'lastCulledShadowNodes': _lastPlan?.frame?.culledShadowNodeIds.length ?? 0,
    'lastDroppedDirectionalLights':
        _lastPlan?.diagnostics.droppedDirectionalLightCount ?? 0,
    'lastDroppedPointLights':
        _lastPlan?.diagnostics.droppedPointLightCount ?? 0,
    'lastDroppedHemisphereLights':
        _lastPlan?.diagnostics.droppedHemisphereLightCount ?? 0,
    'lastDroppedSpotLights': _lastPlan?.diagnostics.droppedSpotLightCount ?? 0,
  };

  /// Uploads current resources and renders [frame] (or state.currentFrame).
  ///
  /// Width and height are physical pixels. [pointSizeScale] is normally the
  /// device pixel ratio. The returned image is owned by this backend and stays
  /// valid until the next render/dispose; clone it to retain it independently.
  Future<ui.Image> render(
    JsThreeSurfaceState state, {
    required int width,
    required int height,
    JsThreeSubmitFrame? frame,
    List<JsThreeFramePlanView>? frames,
    double pointSizeScale = 1.0,
  }) {
    final validationError = _threeRenderError(
      this,
      state,
      width,
      height,
      pointSizeScale,
    );
    if (validationError != null) return Future.error(validationError);
    final result = _renderTail.then(
      (_) => _render(
        state,
        width: width,
        height: height,
        frame: frame,
        frames: frames,
        pointSizeScale: pointSizeScale,
      ),
    );
    _renderTail = result.then<void>(
      (_) {},
      onError: (Object error, StackTrace stackTrace) {},
    );
    return result;
  }

  // Multiple render() calls within one JS tick (e.g. webgl_sprites renders
  // its perspective scene then its ortho HUD) compose into ONE presented
  // image instead of alternating presentations (the visible flicker).
  List<ThreeDrawPlan> _planThreeFrames(
    JsThreeSurfaceState state,
    JsThreeSubmitFrame? frame,
    List<JsThreeFramePlanView>? frames,
  ) {
    final List<({JsThreeFrameResources state, JsThreeSubmitFrame? frame})>
    frameList = frames != null
        ? [for (final view in frames) (state: view, frame: view.frame)]
        : <({JsThreeFrameResources state, JsThreeSubmitFrame? frame})>[
            (state: state, frame: frame),
          ];
    final plans = <ThreeDrawPlan>[];
    // Lever 2: composer passes queue ~15 render-target frames per JS tick
    // with an unchanged resource revision between them. Plan once and clone
    // the shell per frame (shared draw lists/lights/stream) instead of
    // re-walking and re-sorting the scene for every sub-pass. Any state
    // mutation, scene/camera switch, or cull-set difference between queued
    // frames forces a fresh plan — composer depth passes swap materials and
    // the main pass culls differently, so they never share a stale walk.
    ThreeDrawPlan? reusedPlan;
    var reusedRevision = -1;
    var reusedScene = -1;
    var reusedCamera = -1;
    Set<int>? reusedCulled;
    for (final item in frameList) {
      final frame = item.frame;
      if (frame == null) {
        plans.add(_planner.plan(item.state, lineMode: lineMode));
        reusedPlan = null;
        continue;
      }
      final culled = frame.culledNodeIds;
      final sameWalk = reusedPlan != null &&
          item.state.contentRevision == reusedRevision &&
          frame.sceneId == reusedScene &&
          frame.cameraId == reusedCamera &&
          _sameNodeIds(culled, reusedCulled);
      if (sameWalk) {
        plans.add(reusedPlan.withFrame(frame));
        continue;
      }
      final plan = _planner.plan(item.state, frame: frame, lineMode: lineMode);
      reusedPlan = plan;
      reusedRevision = item.state.contentRevision;
      reusedScene = frame.sceneId;
      reusedCamera = frame.cameraId;
      reusedCulled = culled;
      plans.add(plan);
    }
    for (final current in plans) {
      for (final warning in current.diagnostics.warnings) {
        _note(warning);
      }
    }
    return plans;
  }

  /// Content equality for per-frame cull sets (plan-reuse gate).
  static bool _sameNodeIds(Set<int>? a, Set<int>? b) {
    if (identical(a, b)) return true;
    if (a == null || b == null || a.length != b.length) return false;
    for (final id in a) {
      if (!b.contains(id)) return false;
    }
    return true;
  }

  void _assertThreePlansRenderable(List<ThreeDrawPlan> plans) {
    for (final current in plans) {
      if (!current.canRender) {
        throw ThreeDrawPlanException(
          'no renderable frame/camera: ${current.diagnostics.warnings.join('; ')}',
        );
      }
    }
  }

  Future<ui.Image> _render(
    JsThreeSurfaceState state, {
    required int width,
    required int height,
    required JsThreeSubmitFrame? frame,
    required List<JsThreeFramePlanView>? frames,
    required double pointSizeScale,
  }) async {
    _checkDisposed();
    _lastSequence = state.lastSequence;
    final plans = _planThreeFrames(state, frame, frames);
    _lastPlan = plans.first;

    // Resource reconciliation always runs, even when no presentable frame or
    // camera exists. Disposal/reuse therefore cannot strand a cached version.
    _synchronizeGeometries(state);
    _synchronizeBatches(state);
    await _synchronizeTextures(state);
    _synchronizeRenderTargets(state);
    _checkDisposed();
    _assertThreePlansRenderable(plans);
    await _waitForPresentationSlot();
    _checkDisposed();
    _ensureThreeTargets(this, width, height);
    final image = _recordAndPresent(
      plans,
      pointSizeScale,
      height.toDouble(),
      state.contentRevision,
    );
    _renderedFrameCount++;
    return image;
  }

  void _synchronizeGeometries(JsThreeSurfaceState state) {
    _reconcileThreeRemoved(
      _geometries,
      state.geometries.keys,
      onRemove: () => _geometryEvictionCount++,
    );
    for (final source in state.geometries.values) {
      _synchronizeThreeGeometry(this, source);
    }
  }

  void _synchronizeBatches(JsThreeSurfaceState state) {
    _reconcileThreeRemoved(
      _batches,
      state.batches.keys,
      onRemove: () => _batchEvictionCount++,
    );
    for (final source in state.batches.values) {
      // A retained empty batch is a cache transition, not a GPU disposal.
      // Draw planning already excludes its ordinary zero-geometry node.
      if (source.instanceCount != 0) _synchronizeThreeBatch(this, source);
    }
  }

  Future<void> _synchronizeTextures(JsThreeSurfaceState state) {
    _reconcileThreeRemoved(
      _textures,
      state.textures.keys,
      onRemove: () => _textureEvictionCount++,
    );
    return _awaitThreeTextures(_threeTextureFutures(this, state));
  }

  void _synchronizeRenderTargets(JsThreeSurfaceState state) {
    _reconcileThreeRemoved(
      _renderTargets,
      state.renderTargets.keys,
      onRemove: () {},
    );
    for (final source in state.renderTargets.values) {
      _synchronizeThreeRenderTarget(this, source);
    }
  }

  Future<void> _runTextureUpload(
    JsThreeSurfaceState state,
    _ThreeResourceKey key,
    _GpuTexture entry,
    JsThreeTextureUpsert source,
  ) async {
    final encoded = source.encoding != JsThreeTextureEncoding.rawRgba8;
    _beginThreeTextureDecode(this, encoded);
    try {
      await _attemptThreeTextureUpload(this, state, key, entry, source);
    } finally {
      _finishThreeTextureDecode(this, encoded);
    }
  }

  Future<void> _waitForPresentationSlot() async {
    while (_pendingPresentations >= maxPendingPresentations ||
        _pendingTargetSubmits >= maxPendingTargetSubmits) {
      final waiter = Completer<void>();
      _presentationWaiters.add(waiter);
      await waiter.future;
      _checkDisposed();
    }
  }

  bool _shadowNeedsUpdate(JsThreeSubmitFrame frame, int contentRevision) =>
      !_shadowMapValid ||
      _cachedShadowKey != ThreeShadowCacheKey.fromFrame(frame, contentRevision);

  void _cacheShadow(JsThreeSubmitFrame frame, int contentRevision) {
    _shadowMapValid = true;
    _cachedShadowKey = ThreeShadowCacheKey.fromFrame(frame, contentRevision);
  }

  void _recordShadow(
    _ThreeFrameEncoder encoder,
    JsThreeSubmitFrame frame,
    int contentRevision,
  ) {
    if (!frame.hasShadow) return;
    final needsUpdate = _shadowNeedsUpdate(frame, contentRevision);
    _traceThreeShadow(
      'frame sequence=$_lastSequence revision=${frame.shadowContentRevision} '
      'content=$contentRevision update=$needsUpdate '
      'matrix=${_threeShadowMatrixSummary(frame.shadowMatrix)} '
      'culled=${frame.culledShadowNodeIds.length}',
    );
    if (!needsUpdate) {
      _shadowFrameActive = true;
      _shadowCacheHitCount++;
      return;
    }
    _renderShadow(encoder, frame, contentRevision);
  }

  void _renderShadow(
    _ThreeFrameEncoder encoder,
    JsThreeSubmitFrame frame,
    int contentRevision,
  ) {
    final command = _context.createCommandBuffer();
    final draws = encoder.recordShadow(command);
    _renderedShadowDrawCount += draws;
    _traceThreeShadow('shadow recorded sequence=$_lastSequence draws=$draws');
    // Submit even an inactive/empty shadow pass: an encoded-but-never-
    // submitted command buffer still occupies a Metal queue slot, and a
    // per-frame leak of those slots deadlocks commandBuffer creation.
    _submitThreeShadow(this, command);
    _cacheShadow(frame, contentRevision);
  }

  /// Records one composed default-framebuffer pass. Every pass uses its own
  /// command buffer because Metal forbids concurrent open render encoders.
  ({gpu.CommandBuffer command, int draws}) _recordThreePass(
    ThreeDrawPlan plan,
    gpu.GpuImageSurfaceFrame surfaceFrame, {
    required bool submitAfter,
    required double pointSizeScale,
    required double viewportHeight,
    required int contentRevision,
  }) {
    return _recordThreePassWithClears(
      plan,
      surfaceFrame,
      submitAfter: submitAfter,
      pointSizeScale: pointSizeScale,
      viewportHeight: viewportHeight,
      contentRevision: contentRevision,
      clearColor: true,
      clearDepthFlag: true,
    );
  }

  /// Records one default-framebuffer pass with explicit clear overrides.
  ///
  /// Upstream WebGL clips glClear to the scissor rect, so a widget that
  /// renders several scissored viewports into one canvas (ArrayCamera
  /// sub-cameras, split-screen) relies on each viewport's clear touching ONLY
  /// its rect. Impeller's loadAction.clear always wipes the whole attachment,
  /// which erased every earlier viewport (only the last survived). When this
  /// batch already cleared the same target, later scissored "clear" passes
  /// downgrade to load: their draws are scissor-clipped, and the rect's color
  /// and depth are untouched since the frame-opening full clear.
  ({gpu.CommandBuffer command, int draws}) _recordThreePassWithClears(
    ThreeDrawPlan plan,
    gpu.GpuImageSurfaceFrame surfaceFrame, {
    required bool submitAfter,
    required double pointSizeScale,
    required double viewportHeight,
    required int contentRevision,
    required bool clearColor,
    required bool clearDepthFlag,
  }) {
    _shadowFrameActive = false;
    final encoder = _ThreeFrameEncoder(
      this,
      plan,
      pointSizeScale,
      viewportHeight,
    );
    _prepareThreeAutoInstanceCache(this, plan);
    _recordShadow(encoder, plan.frame!, contentRevision);
    final command = _context.createCommandBuffer();
    final pass = _createThreeRenderPass(
      this,
      plan,
      surfaceFrame,
      command,
      pointSizeScale,
      clearColor: clearColor,
      clearDepthFlag: clearDepthFlag,
    );
    final draws = encoder.record(pass);
    if (submitAfter) _submitThreeFrame(this, command);
    return (command: command, draws: draws);
  }

  bool _targetDimensionsMatch(
    _GpuRenderTarget target,
    JsThreeSubmitFrame frame,
  ) =>
      target.source.width == frame.targetWidth &&
      target.source.height == frame.targetHeight;

  _GpuRenderTarget _targetForFrame(JsThreeSubmitFrame frame) {
    final target = _renderTargets[_key(frame.renderTargetId)];
    if (target == null || !_targetDimensionsMatch(target, frame)) {
      throw const FlutterGpuThreeException(
        'renderTarget',
        'frame target is missing or has stale dimensions',
      );
    }
    return target;
  }

  bool _materialSamplesTarget(JsThreeMaterialUpsert material, int textureId) =>
      material.mapTextureId == textureId ||
      material.mapRightTextureId == textureId;

  void _checkTargetFeedback(ThreeDrawPlan plan, int textureId) {
    for (final draw in plan.draws) {
      if (_materialSamplesTarget(draw.material, textureId)) {
        throw const FlutterGpuThreeException(
          'renderTargetFeedback',
          'a pass cannot sample its active color target',
        );
      }
    }
  }

  int _recordTargetPass(
    ThreeDrawPlan plan,
    double pointSizeScale,
    int contentRevision, {
    bool clearColor = true,
  }) {
    final frame = plan.frame!;
    final target = _targetForFrame(frame);
    _checkTargetFeedback(plan, target.source.textureId);
    _shadowFrameActive = false;
    final encoder = _ThreeFrameEncoder(
      this,
      plan,
      pointSizeScale,
      target.source.height.toDouble(),
    );
    _prepareThreeAutoInstanceCache(this, plan);
    _recordShadow(encoder, frame, contentRevision);
    final command = _context.createCommandBuffer();
    final pass = _createThreeTargetPass(
      plan,
      target,
      command,
      pointSizeScale,
      clearColor: clearColor,
    );
    final draws = encoder.record(pass);
    _submitThreeFrame(this, command, targetPass: true);
    return draws;
  }

  int _recordTargetPasses(
    List<ThreeDrawPlan> plans,
    double pointSizeScale,
    int contentRevision,
  ) {
    var draws = 0;
    final clearedTargets = <int>{};
    for (final plan in plans.where((plan) => plan.frame!.renderTargetId != 0)) {
      final frame = plan.frame!;
      final dropClear = frame.scissorTest && clearedTargets.contains(frame.renderTargetId);
      clearedTargets.add(frame.renderTargetId);
      draws += _recordTargetPass(
        plan,
        pointSizeScale,
        contentRevision,
        clearColor: !dropClear,
      );
    }
    return draws;
  }

  ({gpu.CommandBuffer? command, int draws}) _recordMainPasses(
    List<ThreeDrawPlan> plans,
    gpu.GpuImageSurfaceFrame surfaceFrame,
    double pointSizeScale,
    double viewportHeight,
    int contentRevision,
  ) {
    gpu.CommandBuffer? command;
    var draws = 0;
    final clearedTargets = <int>{};
    for (var index = 0; index < plans.length; index++) {
      final plan = plans[index];
      final frame = plan.frame!;
      final dropClear = frame.scissorTest &&
          clearedTargets.contains(frame.renderTargetId);
      clearedTargets.add(frame.renderTargetId);
      final result = dropClear
          ? _recordThreePassWithClears(
              plan,
              surfaceFrame,
              submitAfter: index < plans.length - 1,
              pointSizeScale: pointSizeScale,
              viewportHeight: viewportHeight,
              contentRevision: contentRevision,
              clearColor: false,
              clearDepthFlag: false,
            )
          : _recordThreePass(
              plan,
              surfaceFrame,
              submitAfter: index < plans.length - 1,
              pointSizeScale: pointSizeScale,
              viewportHeight: viewportHeight,
              contentRevision: contentRevision,
            );
      command = result.command;
      draws += result.draws;
    }
    return (command: command, draws: draws);
  }

  ui.Image _recordAndPresent(
    List<ThreeDrawPlan> plans,
    double pointSizeScale,
    double viewportHeight,
    int contentRevision,
  ) {
    var recordedDraws = 0;
    try {
      recordedDraws += _recordTargetPasses(
        plans,
        pointSizeScale,
        contentRevision,
      );
      final mainPlans = plans
          .where((plan) => plan.frame!.renderTargetId == 0)
          .toList();
      if (mainPlans.isEmpty) {
        throw const FlutterGpuThreeException(
          'presentation',
          'an offscreen-only batch has no surface frame to present',
        );
      }
      final surface = _imageSurface!;
      final surfaceFrame = surface.acquireNextFrame();
      gpu.CommandBuffer? command;
      var presented = false;
      try {
        final result = _recordMainPasses(
          mainPlans,
          surfaceFrame,
          pointSizeScale,
          viewportHeight,
          contentRevision,
        );
        command = result.command;
        recordedDraws += result.draws;
        final lastCommand = command!;
        surfaceFrame.present(lastCommand);
        presented = true;
        _submitThreeFrame(this, lastCommand);
        return _finishThreeFrame(this, surface, recordedDraws);
      } catch (error) {
        _failThreePresentation(this, surfaceFrame, command, presented, error);
        rethrow;
      }
    } finally {
      _uniformOffset = 0;
      _hostBuffer.reset();
    }
  }

  _TextureBinding? _targetTextureBinding(int id) {
    for (final target in _renderTargets.values) {
      if (target.source.textureId == id) {
        return _TextureBinding(
          target.color,
          null,
          1,
          _threeRenderTargetSampler(target.source),
        );
      }
    }
    return null;
  }

  _TextureBinding _textureBinding(int id) {
    if (id == 0) return _TextureBinding(_fallbackTexture, null, 1);
    final target = _targetTextureBinding(id);
    if (target != null) return target;
    return _resolveThreeTextureBinding(this, id, _textures[_key(id)]);
  }

  _ThreeResourceKey _key(int id) => _ThreeResourceKey(engineId, surfaceId, id);

  void _note(String message) {
    if (_messages.contains(message)) return;
    if (_messages.length == 64) {
      _messages.removeAt(0);
    }
    _messages.add(message);
  }

  void _checkDisposed() {
    if (_disposed) throw StateError('FlutterGpuThreeBackend is disposed');
  }

  void dispose() {
    if (_disposed) return;
    _disposed = true;
    _geometries.clear();
    _textures.clear();
    _renderTargets.clear();
    _batches.clear();
    _autoInstanceBatches.clear();
    _depthTexture = null;
    _shadowColorTexture = null;
    _shadowDepthTexture = null;
    _pointShadowFrontColorTexture = null;
    _pointShadowFrontDepthTexture = null;
    _pointShadowBackColorTexture = null;
    _pointShadowBackDepthTexture = null;
    _shadowFrameActive = false;
    _shadowMapValid = false;
    _imageSurface = null;
    _currentImage?.dispose();
    _currentImage = null;
    _releaseThreePresentationWaiters(this);
  }
}
