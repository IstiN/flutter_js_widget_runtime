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
  Iterable<JsThreeSubmitFrame> get submittedFrames =>
      changes.whereType<JsThreeSubmitFrame>();
}

final class _ApplyBatch {
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

/// Current drawing state plus lifetime upload/presentation diagnostics.
final class JsThreeSurfaceState {
  JsThreeSurfaceState._(this.key);

  static const int maxPendingFrames = 2;

  final JsThreeSurfaceKey key;
  final Map<int, JsThreeGeometryUpsert> _geometries = {};
  final Map<int, JsThreeTextureUpsert> _textures = {};
  final Map<int, JsThreeMaterialUpsert> _materials = {};
  final Map<int, JsThreeNodeUpsert> _nodes = {};
  final Map<int, JsThreeDrawBatchUpsert> _batches = {};
  final Map<int, JsThreeCameraUpsert> _cameras = {};
  final Map<int, JsThreeLightUpsert> _lights = {};
  final List<JsThreeSubmitFrame> _pendingFrames = [];

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
  Map<int, JsThreeMaterialUpsert> get materials =>
      UnmodifiableMapView(_materials);
  Map<int, JsThreeNodeUpsert> get nodes => UnmodifiableMapView(_nodes);
  Map<int, JsThreeDrawBatchUpsert> get batches => UnmodifiableMapView(_batches);
  Map<int, JsThreeCameraUpsert> get cameras => UnmodifiableMapView(_cameras);
  Map<int, JsThreeLightUpsert> get lights => UnmodifiableMapView(_lights);

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

  JsThreeApplyResult _apply(JsThreeR1Stream stream, int sequence) {
    _validateApplication(stream);
    final batch = _ApplyBatch();
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
    switch (command) {
      case final JsThreeRemoveBatch value:
        _recordRemoval(_removeBatch(value.nodeId), value, batch);
      case final JsThreeNodeUpsert value:
        _upsertNode(value, batch);
      case final JsThreeRemoveNode value:
        _recordRemoval(
          _disposeResource(JsThreeResourceKind.node, value.nodeId),
          value,
          batch,
        );
      case final JsThreeCameraUpsert value:
        _cameras[value.cameraId] = value;
        batch.changes.add(value);
      case final JsThreeLightUpsert value:
        _markShadow(batch, 'light:${value.lightId}');
        _lights[value.lightId] = value;
        batch.changes.add(value);
      case final JsThreeSubmitFrame value:
        _recordFrame(value, batch);
      case final JsThreeDisposeResource value:
        _recordRemoval(
          _disposeResource(value.resourceKind, value.resourceId),
          value,
          batch,
        );
      case final JsThreeDisposeSurface value:
        batch.surfaceDispose = value;
      default:
        throw StateError('Unhandled THREE command ${command.runtimeType}');
    }
  }

  void _upsertNode(JsThreeNodeUpsert value, _ApplyBatch batch) {
    final previous = _nodes[value.nodeId];
    if (_castsShadow(value) || (previous != null && _castsShadow(previous))) {
      _markShadow(batch, 'node:${value.nodeId}');
    }
    _nodes[value.nodeId] = value;
    batch.changes.add(value);
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
      default:
        return false;
    }
    return true;
  }

  void _recordUpload(bool uploaded, JsThreeCommand command, _ApplyBatch batch) {
    if (uploaded) {
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
    if (_submitFrame(frame)) batch.coalesced++;
    batch.changes.add(frame);
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
    };
    _disposedResourceCount += removedCount;
    return removedCount != 0;
  }

  int _removeResource(Map<int, dynamic> resources, int id) =>
      resources.remove(id) == null ? 0 : 1;

  bool _submitFrame(JsThreeSubmitFrame frame) {
    _currentFrame = frame;
    _submittedFrameCount++;
    if (_pendingFrames.length < JsThreeSurfaceState.maxPendingFrames) {
      _pendingFrames.add(frame);
      return false;
    }
    // Keep the oldest (potentially in-flight) frame and replace only the
    // newest pending presentation. Every resource command remains effective.
    _pendingFrames[JsThreeSurfaceState.maxPendingFrames - 1] = frame;
    return true;
  }

  void _disposeSurface() {
    if (!_disposed) {
      _disposedResourceCount +=
          _geometries.length +
          _textures.length +
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
    _materials.clear();
    _nodes.clear();
    _batches.clear();
    _cameras.clear();
    _lights.clear();
    _pendingFrames.clear();
    _currentFrame = null;
  }
}
