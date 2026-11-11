import 'dart:collection';
import 'dart:typed_data';

import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

/// The complete isolation key for every THREE resource.
final class JsThreeSurfaceKey {
  const JsThreeSurfaceKey(this.engineId, this.surfaceId);

  final String engineId;
  final String surfaceId;

  @override
  bool operator ==(Object other) =>
      other is JsThreeSurfaceKey &&
      other.engineId == engineId &&
      other.surfaceId == surfaceId;

  @override
  int get hashCode => Object.hash(engineId, surfaceId);

  @override
  String toString() => 'JsThreeSurfaceKey($engineId, $surfaceId)';
}

/// Effective mutations from one atomically accepted envelope.
///
/// Unchanged resource versions and idempotent removals are omitted. Surface
/// disposal is applied last; other command order is retained. Typed views
/// avoid re-decoding in a GPU backend.
final class JsThreeApplyResult {
  JsThreeApplyResult({
    required this.surface,
    required this.sequence,
    required List<JsThreeCommand> changes,
    required this.acceptedCommandCount,
    required this.unchangedUploadCount,
    required this.coalescedFrameCount,
    required this.surfaceDisposed,
  }) : changes = List.unmodifiable(changes);

  final JsThreeSurfaceState surface;
  final int sequence;
  final List<JsThreeCommand> changes;
  final int acceptedCommandCount;
  final int unchangedUploadCount;
  final int coalescedFrameCount;
  final bool surfaceDisposed;

  bool get hasChanges => changes.isNotEmpty;
  Iterable<JsThreeGeometryUpsert> get geometryUploads =>
      changes.whereType<JsThreeGeometryUpsert>();
  Iterable<JsThreeTextureUpsert> get textureUploads =>
      changes.whereType<JsThreeTextureUpsert>();
  Iterable<JsThreeMaterialUpsert> get materialUploads =>
      changes.whereType<JsThreeMaterialUpsert>();
  Iterable<JsThreeDrawBatchUpsert> get batchUploads =>
      changes.whereType<JsThreeDrawBatchUpsert>();
  Iterable<JsThreeRemoveBatch> get batchRemovals =>
      changes.whereType<JsThreeRemoveBatch>();
  Iterable<JsThreeNodeUpsert> get changedNodes =>
      changes.whereType<JsThreeNodeUpsert>();
  Iterable<JsThreeCameraUpsert> get changedCameras =>
      changes.whereType<JsThreeCameraUpsert>();
  Iterable<JsThreeLightUpsert> get changedLights =>
      changes.whereType<JsThreeLightUpsert>();
  Iterable<JsThreeRemoveNode> get nodeRemovals =>
      changes.whereType<JsThreeRemoveNode>();
  Iterable<JsThreeDisposeResource> get resourceDisposals =>
      changes.whereType<JsThreeDisposeResource>();
  Iterable<JsThreeStencilClear> get stencilClears =>
      changes.whereType<JsThreeStencilClear>();
  Iterable<JsThreeSubmitFrame> get submittedFrames =>
      changes.whereType<JsThreeSubmitFrame>();
}

final class _ApplyBatch {
  _ApplyBatch(this.sequence);
  final int sequence;
  final List<JsThreeCommand> changes = <JsThreeCommand>[];
  var shadowChanged = false;
  var unchanged = 0;
  var coalesced = 0;
  JsThreeDisposeSurface? surfaceDispose;
}

/// Owns independent, ordered surfaces. Decoding finishes before any mutation.
final class JsThreeStateStore {
  JsThreeStateStore({JsThreeProtocolDecoder? decoder})
    : decoder = decoder ?? JsThreeProtocolDecoder();

  final JsThreeProtocolDecoder decoder;
  final Map<JsThreeSurfaceKey, JsThreeSurfaceState> _surfaces = {};

  Map<JsThreeSurfaceKey, JsThreeSurfaceState> get surfaces =>
      UnmodifiableMapView(_surfaces);

  JsThreeSurfaceState? surface(String engineId, String surfaceId) =>
      _surfaces[JsThreeSurfaceKey(engineId, surfaceId)];

  JsThreeSurfaceState? surfaceByKey(JsThreeSurfaceKey key) => _surfaces[key];

  JsThreeApplyResult apply(Uint8List bytes) =>
      applyDecoded(decoder.decode(bytes));

  JsThreeApplyResult applyDecoded(JsThreeDecodedR1 decoded) {
    final envelope = decoded.envelope;
    final key = JsThreeSurfaceKey(envelope.engineId, envelope.surfaceId);
    final existing = _surfaces[key];
    JsThreeProtocolDecoder.validateSequence(
      envelope.sequence,
      lastSequence: existing?.lastSequence ?? 0,
    );
    final state = existing ?? JsThreeSurfaceState._(key);
    final result = state._apply(decoded.stream, envelope.sequence);
    if (existing == null) _surfaces[key] = state;
    return result;
  }
}

/// Read-only surface resources used while planning draws.
///
/// Either the live [JsThreeSurfaceState] or a [JsThreeFramePlanView]
/// snapshot taken when a frame was queued.
abstract interface class JsThreeFrameResources {
  JsThreeSurfaceKey get key;
  bool get disposed;

  /// Revision of the mutable resource maps this view reflects. Equal
  /// revisions imply identical map contents (see the snapshot cache).
  int get contentRevision;
  JsThreeSubmitFrame? get currentFrame;
  Map<int, JsThreeGeometryUpsert> get geometries;
  Map<int, JsThreeTextureUpsert> get textures;
  Map<int, JsThreeRenderTargetUpsert> get renderTargets;
  Map<int, JsThreeMaterialUpsert> get materials;
  Map<int, JsThreeNodeUpsert> get nodes;
  Map<int, JsThreeDrawBatchUpsert> get batches;
  Map<int, JsThreeCameraUpsert> get cameras;
  Map<int, JsThreeLightUpsert> get lights;
  Map<int, JsThreeClippingUpsert> get clippings;

  /// R1 v8 STENCIL_CLEAR markers decoded from the envelope carrying
  /// [currentFrame], in stream order; empty for every stenciless frame.
  List<JsThreeStencilClear> get stencilClears;
}

/// Resource snapshot taken when a frame was queued for presentation.
///
/// Multi-pass effects queue a render-target frame first and re-upsert the
/// materials/render targets used by later passes afterwards, so planning a
/// queued frame against the *final* surface state binds scene meshes to the
/// wrong (screen-facing) material or target records. Frame planning uses this
/// snapshot instead; GPU resource caches keep following the final state.
/// mutation after it was taken.
final class _SnapshotMaps {
  _SnapshotMaps(this.revision);
  final int revision;
  late final Map<int, JsThreeGeometryUpsert> geometries;
  late final Map<int, JsThreeTextureUpsert> textures;
  late final Map<int, JsThreeRenderTargetUpsert> renderTargets;
  late final Map<int, JsThreeMaterialUpsert> materials;
  late final Map<int, JsThreeNodeUpsert> nodes;
  late final Map<int, JsThreeDrawBatchUpsert> batches;
  late final Map<int, JsThreeCameraUpsert> cameras;
  late final Map<int, JsThreeLightUpsert> lights;
  late final Map<int, JsThreeClippingUpsert> clippings;
}

final class JsThreeFramePlanView implements JsThreeFrameResources {
  JsThreeFramePlanView._(
    this.frame, {
    required this.key,
    required this.disposed,
    required this.contentRevision,
    required this.geometries,
    required this.textures,
    required this.renderTargets,
    required this.materials,
    required this.nodes,
    required this.batches,
    required this.cameras,
    required this.lights,
    required this.clippings,
    required this.stencilClears,
  });

  factory JsThreeFramePlanView.snapshot(
    JsThreeSurfaceState state,
    JsThreeSubmitFrame frame,
    List<JsThreeStencilClear> stencilClears,
  ) {
    // Composer passes queue ~15 frames per JS tick with no state change
    // between them; share one immutable map set across those views instead
    // of re-copying 11 maps per frame. The cache invalidates on every state
    // mutation (contentRevision bump) so a shared map set can never observe
    // a mutation after it was taken.
    var maps = state._snapshotCache;
    final revision = state.contentRevision;
    if (maps == null || maps.revision != revision) {
      maps = _SnapshotMaps(revision)
        ..geometries = Map.of(state._geometries)
        ..textures = Map.of(state._textures)
        ..renderTargets = Map.of(state._renderTargets)
        ..materials = Map.of(state._materials)
        ..nodes = Map.of(state._nodes)
        ..batches = Map.of(state._batches)
        ..cameras = Map.of(state._cameras)
        ..lights = Map.of(state._lights)
        ..clippings = Map.of(state._clippings);
      state._snapshotCache = maps;
    }
    return JsThreeFramePlanView._(
      frame,
      key: state.key,
      disposed: state.disposed,
      contentRevision: revision,
      geometries: maps.geometries,
      textures: maps.textures,
      renderTargets: maps.renderTargets,
      materials: maps.materials,
      nodes: maps.nodes,
      batches: maps.batches,
      cameras: maps.cameras,
      lights: maps.lights,
      clippings: maps.clippings,
      stencilClears: List.unmodifiable(stencilClears),
    );
  }

  final JsThreeSubmitFrame frame;

  @override
  final JsThreeSurfaceKey key;
  @override
  final bool disposed;

  /// Surface [JsThreeSurfaceState.contentRevision] captured when this view
  /// was snapshotted; frames queued from an unchanged tick share it, letting
  /// the planner reuse one walk across a composer's sub-passes.
  @override
  final int contentRevision;
  @override
  final Map<int, JsThreeGeometryUpsert> geometries;
  @override
  final Map<int, JsThreeTextureUpsert> textures;
  @override
  final Map<int, JsThreeRenderTargetUpsert> renderTargets;
  @override
  final Map<int, JsThreeMaterialUpsert> materials;
  @override
  final Map<int, JsThreeNodeUpsert> nodes;
  @override
  final Map<int, JsThreeDrawBatchUpsert> batches;
  @override
  final Map<int, JsThreeCameraUpsert> cameras;
  @override
  final Map<int, JsThreeLightUpsert> lights;
  @override
  final Map<int, JsThreeClippingUpsert> clippings;

  @override
  final List<JsThreeStencilClear> stencilClears;

  @override
  JsThreeSubmitFrame get currentFrame => frame;
}

/// Current drawing state plus lifetime upload/presentation diagnostics.
final class JsThreeSurfaceState implements JsThreeFrameResources {
  JsThreeSurfaceState._(this.key);

  static const int maxPendingFrames = 2;
  static const int maxPendingTargetFrames = 64;

  final JsThreeSurfaceKey key;
  final Map<int, JsThreeGeometryUpsert> _geometries = {};
  final Map<int, JsThreeTextureUpsert> _textures = {};
  final Map<int, JsThreeRenderTargetUpsert> _renderTargets = {};
  final Map<int, JsThreeMaterialUpsert> _materials = {};
  final Map<int, JsThreeNodeUpsert> _nodes = {};
  final Map<int, JsThreeDrawBatchUpsert> _batches = {};
  final Map<int, JsThreeCameraUpsert> _cameras = {};
  final Map<int, JsThreeLightUpsert> _lights = {};
  final Map<int, JsThreeClippingUpsert> _clippings = {};
  final List<JsThreeSubmitFrame> _pendingFrames = [];
  final List<JsThreeFramePlanView> _pendingFrameViews = [];

  /// R1 v8 STENCIL_CLEAR markers decoded since the last submitted FRAME;
  /// the encoder always emits markers in the same envelope as their frame
  /// (markers precede FRAME), so [._recordFrame] flushes them into the
  /// frame's snapshot and clears the accumulation.
  final List<JsThreeStencilClear> _pendingStencilClears = [];
  List<JsThreeStencilClear> _currentFrameStencilClears = const [];

  /// Last snapshot map set (see [JsThreeFramePlanView.snapshot]); dropped on
  /// every mutation so shared maps never observe later state.
  _SnapshotMaps? _snapshotCache;

  String get engineId => key.engineId;
  String get surfaceId => key.surfaceId;
  int get lastSequence => _lastSequence;
  int get contentRevision => _contentRevision;
  bool get disposed => _disposed;
  int _lastSequence = 0;
  int _contentRevision = 0;
  bool _disposed = false;

  Map<int, JsThreeGeometryUpsert> get geometries =>
      UnmodifiableMapView(_geometries);
  Map<int, JsThreeTextureUpsert> get textures => UnmodifiableMapView(_textures);
  Map<int, JsThreeRenderTargetUpsert> get renderTargets =>
      UnmodifiableMapView(_renderTargets);
  Map<int, JsThreeMaterialUpsert> get materials =>
      UnmodifiableMapView(_materials);
  Map<int, JsThreeNodeUpsert> get nodes => UnmodifiableMapView(_nodes);
  Map<int, JsThreeDrawBatchUpsert> get batches => UnmodifiableMapView(_batches);
  Map<int, JsThreeCameraUpsert> get cameras => UnmodifiableMapView(_cameras);
  Map<int, JsThreeLightUpsert> get lights => UnmodifiableMapView(_lights);
  Map<int, JsThreeClippingUpsert> get clippings =>
      UnmodifiableMapView(_clippings);

  /// R1 v8 STENCIL_CLEAR markers attached to [currentFrame], in stream
  /// order; empty for stenciless frames.
  @override
  List<JsThreeStencilClear> get stencilClears =>
      _currentFrameStencilClears;

  JsThreeSubmitFrame? get currentFrame => _currentFrame;
  JsThreeSubmitFrame? _currentFrame;
  List<JsThreeSubmitFrame> get pendingFrames =>
      UnmodifiableListView(_pendingFrames);
  int get pendingFrameCount => _pendingFrames.length;

  JsThreeNodeUpsert? get scene {
    final frame = _currentFrame;
    return frame == null ? null : _nodes[frame.sceneId];
  }

  JsThreeCameraUpsert? get camera {
    final frame = _currentFrame;
    return frame == null ? null : _cameras[frame.cameraId];
  }

  /// Removes the oldest frame awaiting presentation; the newest is retained
  /// when the queue reaches its two-entry coalescing limit.
  JsThreeSubmitFrame? takePendingFrame() {
    if (_pendingFrames.isEmpty) return null;
    return _pendingFrames.removeAt(0);
  }

  /// Planning snapshot paired with the frame returned by
  /// [takePendingFrame]; null for legacy queues without snapshots.
  JsThreeFramePlanView? takePendingFrameView() {
    if (_pendingFrameViews.isEmpty) return null;
    return _pendingFrameViews.removeAt(0);
  }

  /// Pops the oldest pending frame TOGETHER with its planning snapshot so the
  /// two queues stay in lockstep. The GPU pump previously drained only the
  /// views, stranding frames in [takePendingFrame]'s queue: pendingFrameCount
  /// never reached zero, every later pump built an empty request and the
  /// surface spun in a microtask loop that starved the port (no presents, no
  /// envelopes). A desynced queue falls back to a fresh snapshot of the
  /// popped frame.
  ({JsThreeSubmitFrame frame, JsThreeFramePlanView view})?
  takePendingFrameWithView() {
    if (_pendingFrames.isEmpty) return null;
    final frame = _pendingFrames.removeAt(0);
    final view = _pendingFrameViews.isEmpty
        ? JsThreeFramePlanView.snapshot(this, frame, const [])
        : _pendingFrameViews.removeAt(0);
    return (frame: frame, view: view);
  }

  int get pendingFrameViewCount => _pendingFrameViews.length;

  var _droppedStaleFrameCount = 0;
  int get droppedStaleFrameCount => _droppedStaleFrameCount;

  /// Drops pending frames whose whole envelope tick is superseded by the
  /// newest pending tick. Multi-pass composer widgets render ~15 frames per
  /// JS tick; when the pump lags the producer (120 Hz ticks vs ~30 ms pump
  /// batches of queued ticks), older TICKS accumulated in the queue and were
  /// rendered in full just to be over-presented — 84 presents drained ~3600
  /// queued frames (measured 1117 coalesced drops + starved presents,
  /// presentedFps pinned at vsync/3 on the bloom chain). The newest tick of
  /// an offscreen composer chain is visually self-sufficient, so an older
  /// batch is dropped only when it (a) ends with a surface present — its
  /// presentation is obsolete — and (b) every render target it wrote is
  /// rewritten by the newest batch. Ticks writing targets the newest tick
  /// does not refresh (scene-once + HUD-every-tick cadences) are kept.
  int retainLatestThreeBatch() {
    if (_pendingFrames.length < 2) return 0;
    final newestBatch = _pendingFrames.last.batchSequence;
    var start = _pendingFrames.length - 1;
    while (start > 0 && _pendingFrames[start - 1].batchSequence == newestBatch) {
      start--;
    }
    if (start == 0) return 0;
    var newestSurface = false;
    final newestTargets = <int>{};
    for (var i = start; i < _pendingFrames.length; i++) {
      final frame = _pendingFrames[i];
      if (frame.renderTargetId == 0) {
        newestSurface = true;
      } else {
        newestTargets.add(frame.renderTargetId);
      }
    }
    if (!newestSurface) return 0;
    var dropped = 0;
    final keptFrames = <JsThreeSubmitFrame>[];
    final keptViews = <JsThreeFramePlanView>[];
    var index = 0;
    while (index < start) {
      final batch = _pendingFrames[index].batchSequence;
      var end = index;
      var surface = false;
      final targets = <int>{};
      while (end < start && _pendingFrames[end].batchSequence == batch) {
        final frame = _pendingFrames[end];
        if (frame.renderTargetId == 0) {
          surface = true;
        } else {
          targets.add(frame.renderTargetId);
        }
        end++;
      }
      final superseded = surface && newestTargets.containsAll(targets);
      if (superseded) {
        dropped += end - index;
      } else {
        // takePendingFrame() (canvas2d-style consumers) pops frames without
        // their views, so the two queues can desync; clamp to stay safe.
        keptFrames.addAll(_pendingFrames.getRange(index, end));
        keptViews.addAll(_pendingFrameViews.getRange(
          index,
          end.clamp(0, _pendingFrameViews.length),
        ));
      }
      index = end;
    }
    if (dropped == 0) return 0;
    keptFrames.addAll(_pendingFrames.getRange(start, _pendingFrames.length));
    if (start < _pendingFrameViews.length) {
      keptViews.addAll(_pendingFrameViews.getRange(
        start,
        _pendingFrames.length.clamp(0, _pendingFrameViews.length),
      ));
    }
    _pendingFrames
      ..clear()
      ..addAll(keptFrames);
    _pendingFrameViews
      ..clear()
      ..addAll(keptViews);
    _droppedStaleFrameCount += dropped;
    return dropped;
  }

  int get geometryUploadCount => _geometryUploadCount;
  int get textureUploadCount => _textureUploadCount;
  int get materialUploadCount => _materialUploadCount;
  int get batchUploadCount => _batchUploadCount;
  int get uploadCount =>
      _geometryUploadCount + _textureUploadCount + _materialUploadCount;
  int get unchangedUploadCount => _unchangedUploadCount;
  int get submittedFrameCount => _submittedFrameCount;
  int get coalescedFrameCount => _coalescedFrameCount;
  int get disposedResourceCount => _disposedResourceCount;
  int get surfaceDisposalCount => _surfaceDisposalCount;
  int get appliedEnvelopeCount => _appliedEnvelopeCount;
  int get appliedCommandCount => _appliedCommandCount;

  int _geometryUploadCount = 0;
  int _textureUploadCount = 0;
  int _materialUploadCount = 0;
  int _batchUploadCount = 0;
  int _unchangedUploadCount = 0;
  int _submittedFrameCount = 0;
  int _coalescedFrameCount = 0;
  int _disposedResourceCount = 0;
  int _surfaceDisposalCount = 0;
  int _appliedEnvelopeCount = 0;
  int _appliedCommandCount = 0;
}

extension _JsThreeSurfaceStateOperations on JsThreeSurfaceState {
  void _validateApplication(JsThreeR1Stream stream) {
    _validateTargetQuota(stream);
    if (!_disposed) return;
    for (final command in stream.commands) {
      final isDisposal =
          command is JsThreeDisposeResource ||
          command is JsThreeRemoveNode ||
          command is JsThreeRemoveBatch ||
          command is JsThreeDisposeSurface;
      if (!isDisposal) {
        throw const JsThreeProtocolException(
          'a disposed surface accepts only idempotent disposal commands',
        );
      }
    }
  }

  void _validateTargetQuota(JsThreeR1Stream stream) {
    final targetIds = _renderTargets.keys.toSet();
    for (final command in stream.commands) {
      switch (command) {
        case final JsThreeRenderTargetUpsert value:
          targetIds.add(value.targetId);
        case final JsThreeDisposeResource value:
          if (value.resourceKind == JsThreeResourceKind.renderTarget) {
            targetIds.remove(value.resourceId);
          }
        case JsThreeDisposeSurface _:
          targetIds.clear();
        default:
          break;
      }
      if (targetIds.length > JsThreeProtocolDecoder.maxRenderTargetCount) {
        throw const JsThreeProtocolException('render target count exceeds 16');
      }
    }
  }

  JsThreeApplyResult _apply(JsThreeR1Stream stream, int sequence) {
    _validateApplication(stream);
    final batch = _ApplyBatch(sequence);
    for (final command in stream.commands) {
      _applyCommand(command, batch);
    }
    final surfaceDispose = batch.surfaceDispose;
    if (surfaceDispose != null) {
      _disposeSurface();
      batch.changes.add(surfaceDispose);
    }
    if (batch.shadowChanged) _contentRevision++;
    _unchangedUploadCount += batch.unchanged;
    _coalescedFrameCount += batch.coalesced;
    _lastSequence = sequence;
    _appliedEnvelopeCount++;
    _appliedCommandCount += stream.commandCount;
    return JsThreeApplyResult(
      surface: this,
      sequence: sequence,
      changes: batch.changes,
      acceptedCommandCount: stream.commandCount,
      unchangedUploadCount: batch.unchanged,
      coalescedFrameCount: batch.coalesced,
      surfaceDisposed: surfaceDispose != null,
    );
  }

  void _markShadow(_ApplyBatch batch, String reason) {
    batch.shadowChanged = true;
  }

  void _applyCommand(JsThreeCommand command, _ApplyBatch batch) {
    if (_applyUploadCommand(command, batch)) return;
    if (_applyIndexedUpsert(command, batch)) return;
    if (_applyRemovalCommand(command, batch)) return;
    switch (command) {
      case final JsThreeNodeUpsert value:
        _upsertNode(value, batch);
      case final JsThreeSubmitFrame value:
        _recordFrame(value, batch);
      case final JsThreeStencilClear value:
        _recordStencilClear(value, batch);
      case final JsThreeDisposeSurface value:
        batch.surfaceDispose = value;
      default:
        throw StateError('Unhandled THREE command ${command.runtimeType}');
    }
  }

  /// Camera and light upserts land in an id-indexed map plus the change
  /// list; lights also dirty the shadow pass.
  bool _applyIndexedUpsert(JsThreeCommand command, _ApplyBatch batch) {
    switch (command) {
      case final JsThreeCameraUpsert value:
        _cameras[value.cameraId] = value;
        batch.changes.add(value);
      case final JsThreeLightUpsert value:
        _markShadow(batch, 'light:${value.lightId}');
        _lights[value.lightId] = value;
        batch.changes.add(value);
      default:
        return false;
    }
    return true;
  }

  /// Node/batch removals and generic resource disposals free the matching
  /// resource and record the removal for host notification.
  bool _applyRemovalCommand(JsThreeCommand command, _ApplyBatch batch) {
    switch (command) {
      case final JsThreeRemoveBatch value:
        _recordRemoval(_removeBatch(value.nodeId), value, batch);
      case final JsThreeRemoveNode value:
        _recordRemoval(
          _disposeResource(JsThreeResourceKind.node, value.nodeId),
          value,
          batch,
        );
      case final JsThreeDisposeResource value:
        _recordRemoval(
          _disposeResource(value.resourceKind, value.resourceId),
          value,
          batch,
        );
      default:
        return false;
    }
    return true;
  }

  void _upsertRenderTarget(JsThreeRenderTargetUpsert value, _ApplyBatch batch) {
    final current = _renderTargets[value.targetId];
    if (current != null && value.version <= current.version) {
      batch.unchanged++;
      return;
    }
    _contentRevision++;
    _snapshotCache = null;
    _renderTargets[value.targetId] = value;
    batch.changes.add(value);
  }

  void _upsertNode(JsThreeNodeUpsert value, _ApplyBatch batch) {
    final previous = _nodes[value.nodeId];
    if (_castsShadow(value) || (previous != null && _castsShadow(previous))) {
      _markShadow(batch, 'node:${value.nodeId}');
    }
    // Composer sub-passes re-send every node between their render-target
    // frames; treat a content-identical re-upsert as unchanged so the
    // sub-pass plan-reuse revision survives (see _planThreeFrames).
    if (previous != null && _nodeUpsertEquals(previous, value)) {
      batch.unchanged++;
      return;
    }
    _contentRevision++;
    _snapshotCache = null;
    _nodes[value.nodeId] = value;
    batch.changes.add(value);
  }

  /// Field-for-field equality for node re-upserts. Every planning-relevant
  /// input participates (matrix, flags, ids, sprite anchor, render order) so
  /// an equal verdict guarantees an identical draw plan.
  static bool _nodeUpsertEquals(JsThreeNodeUpsert a, JsThreeNodeUpsert b) {
    if (a.nodeId != b.nodeId ||
        a.parentId != b.parentId ||
        a.geometryId != b.geometryId ||
        a.materialId != b.materialId ||
        a.flags != b.flags ||
        a.objectKind != b.objectKind ||
        a.shadowFlags != b.shadowFlags ||
        a.renderOrder != b.renderOrder) {
      return false;
    }
    if (a.objectKind == JsThreeObjectKind.sprite &&
        (a.spriteCenterX != b.spriteCenterX ||
            a.spriteCenterY != b.spriteCenterY)) {
      return false;
    }
    final am = a.matrixWorld;
    final bm = b.matrixWorld;
    if (am.length != bm.length) return false;
    for (var i = 0; i < am.length; i++) {
      if (am[i] != bm[i]) return false;
    }
    return true;
  }

  bool _castsShadow(JsThreeNodeUpsert value) =>
      value.castShadow && value.objectKind != JsThreeObjectKind.group;

  bool _applyUploadCommand(JsThreeCommand command, _ApplyBatch batch) {
    switch (command) {
      case final JsThreeGeometryUpsert value:
        _recordUpload(_upsertGeometry(value), value, batch);
      case final JsThreeTextureUpsert value:
        _recordUpload(_upsertTexture(value), value, batch);
      case final JsThreeMaterialUpsert value:
        _recordUpload(_upsertMaterial(value), value, batch);
      case final JsThreeDrawBatchUpsert value:
        _recordUpload(_upsertBatch(value), value, batch);
      case final JsThreeClippingUpsert value:
        _recordUpload(_upsertClipping(value), value, batch);
      case final JsThreeRenderTargetUpsert value:
        _upsertRenderTarget(value, batch);
      default:
        return false;
    }
    return true;
  }

  bool _upsertClipping(JsThreeClippingUpsert value) {
    final previous = _clippings[value.clipId];
    if (previous != null && previous.version == value.version) {
      return false;
    }
    _clippings[value.clipId] = value;
    return true;
  }

  void _recordUpload(bool uploaded, JsThreeCommand command, _ApplyBatch batch) {
    if (uploaded) {
      _contentRevision++;
      _snapshotCache = null;
      _markShadow(batch, 'upload:${command.runtimeType}');
      batch.changes.add(command);
    } else {
      batch.unchanged++;
    }
  }

  void _recordRemoval(bool removed, JsThreeCommand command, _ApplyBatch batch) {
    if (removed) {
      _markShadow(batch, 'remove:${command.runtimeType}');
      batch.changes.add(command);
    }
  }

  void _recordFrame(JsThreeSubmitFrame frame, _ApplyBatch batch) {
    frame.batchSequence = batch.sequence;
    _currentFrameStencilClears = List.unmodifiable(_pendingStencilClears);
    _pendingStencilClears.clear();
    if (_submitFrame(frame)) batch.coalesced++;
    batch.changes.add(frame);
  }

  /// R1 v8 STENCIL_CLEAR markers accumulate until their FRAME command (the
  /// encoder emits them in the same envelope, ahead of FRAME). The bound
  /// mirrors the decoder's per-envelope command cap so a pathological
  /// marker-only envelope sequence cannot grow this list unbounded.
  void _recordStencilClear(JsThreeStencilClear value, _ApplyBatch batch) {
    if (_pendingStencilClears.length >= JsThreeProtocolDecoder.maxCommandCount) {
      throw const JsThreeProtocolException(
        'pending stencil clears exceed the command cap',
      );
    }
    _pendingStencilClears.add(value);
    batch.changes.add(value);
  }

  bool _upsertGeometry(JsThreeGeometryUpsert value) {
    final current = _geometries[value.geometryId];
    if (current != null && value.version <= current.version) return false;
    _geometries[value.geometryId] = value;
    _geometryUploadCount++;
    return true;
  }

  bool _upsertTexture(JsThreeTextureUpsert value) {
    final current = _textures[value.textureId];
    if (current != null && value.version <= current.version) return false;
    _textures[value.textureId] = value;
    _textureUploadCount++;
    return true;
  }

  bool _upsertMaterial(JsThreeMaterialUpsert value) {
    final current = _materials[value.materialId];
    if (current != null && value.version <= current.version) return false;
    _materials[value.materialId] = value;
    _materialUploadCount++;
    return true;
  }

  bool _upsertBatch(JsThreeDrawBatchUpsert value) {
    final current = _batches[value.nodeId];
    if (current != null && value.version <= current.version) return false;
    _batches[value.nodeId] = value;
    _batchUploadCount++;
    return true;
  }

  bool _removeBatch(int nodeId) {
    final removed = _batches.remove(nodeId) != null;
    if (removed) _disposedResourceCount++;
    return removed;
  }

  bool _disposeResource(JsThreeResourceKind kind, int id) {
    final removedCount = switch (kind) {
      JsThreeResourceKind.geometry => _removeResource(_geometries, id),
      JsThreeResourceKind.texture => _removeResource(_textures, id),
      JsThreeResourceKind.material => _removeResource(_materials, id),
      JsThreeResourceKind.node =>
        _removeResource(_nodes, id) + _removeResource(_batches, id),
      JsThreeResourceKind.light => _removeResource(_lights, id),
      JsThreeResourceKind.camera => _removeResource(_cameras, id),
      JsThreeResourceKind.renderTarget => _removeResource(_renderTargets, id),
    };
    _disposedResourceCount += removedCount;
    return removedCount != 0;
  }

  int _removeResource(Map<int, dynamic> resources, int id) {
    if (resources.remove(id) == null) return 0;
    _contentRevision++;
    _snapshotCache = null;
    return 1;
  }

  bool _submitFrame(JsThreeSubmitFrame frame) {
    _currentFrame = frame;
    _submittedFrameCount++;
    final view = JsThreeFramePlanView.snapshot(
      this,
      frame,
      _currentFrameStencilClears,
    );
    if (_pendingFrames.length < JsThreeSurfaceState.maxPendingFrames) {
      _pendingFrames.add(frame);
      _pendingFrameViews.add(view);
      return false;
    }
    final targetWork =
        frame.renderTargetId != 0 ||
        _pendingFrames.any((pending) => pending.renderTargetId != 0);
    final multiViewWork =
        frame.scissorTest ||
        _pendingFrames.any((pending) => pending.scissorTest);
    if ((targetWork || multiViewWork) &&
        _pendingFrames.length < JsThreeSurfaceState.maxPendingTargetFrames) {
      _pendingFrames.add(frame);
      _pendingFrameViews.add(view);
      return false;
    }
    if (targetWork || multiViewWork) {
      _pendingFrames.removeAt(1);
      _pendingFrameViews.removeAt(1);
      _pendingFrames.add(frame);
      _pendingFrameViews.add(view);
      return true;
    }
    // Keep the oldest (potentially in-flight) frame and replace only the
    // newest pending presentation. Every resource command remains effective.
    _pendingFrames[JsThreeSurfaceState.maxPendingFrames - 1] = frame;
    _pendingFrameViews[JsThreeSurfaceState.maxPendingFrames - 1] = view;
    return true;
  }

  void _disposeSurface() {
    if (!_disposed) {
      _disposedResourceCount +=
          _geometries.length +
          _textures.length +
          _renderTargets.length +
          _materials.length +
          _nodes.length +
          _batches.length +
          _cameras.length +
          _lights.length;
      _disposed = true;
      _surfaceDisposalCount++;
    }
    _geometries.clear();
    _textures.clear();
    _renderTargets.clear();
    _materials.clear();
    _nodes.clear();
    _batches.clear();
    _cameras.clear();
    _lights.clear();
    _pendingFrames.clear();
    _pendingFrameViews.clear();
    _pendingStencilClears.clear();
    _currentFrameStencilClears = const [];
    _currentFrame = null;
  }
}
