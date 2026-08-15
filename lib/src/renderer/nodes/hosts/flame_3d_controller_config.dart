part of 'flame_3d_host.dart';

/// Declarative scene-config state and diffing for [Flame3dController] —
/// extracted into a part to keep the controller class within the class_size
/// gate. The controller delegates its declarative sync to [apply].
class Flame3dSceneSync {
  Flame3dSceneSync({
    required String sceneId,
    required bool Function() isDisposed,
    required void Function(Js3dCommand) applyQuiet,
  }) : _sceneId = sceneId,
       _isDisposed = isDisposed,
       _applyQuietFn = applyQuiet;

  final String _sceneId;
  final bool Function() _isDisposed;
  final void Function(Js3dCommand) _applyQuietFn;

  String get sceneId => _sceneId;
  void _applyQuiet(Js3dCommand command) => _applyQuietFn(command);

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
    if (_isDisposed()) return;
    _syncConfigTime(config);
    _syncConfigCamera(config);
    _syncConfigModels(config);
  }

  void _syncConfigTime(Map<String, dynamic> config) {
    final t = (config['time'] as num?)?.toDouble();
    if (t != null) declaredTime = t;
  }

  void _syncConfigCamera(Map<String, dynamic> config) {
    final cam = config['camera'];
    if (cam is! Map) return;
    final camKey = cam.toString();
    if (camKey == _lastCameraKey) return;
    _lastCameraKey = camKey;
    _applyQuiet(Js3dCommand(
      kind: 'setCamera',
      sceneId: sceneId,
      payload: cam.cast<String, dynamic>(),
    ));
  }

  void _syncConfigModels(Map<String, dynamic> config) {
    final models = config['models'];
    if (models is! List) return;
    final seen = <String>{};
    for (final entry in models.whereType<Map>()) {
      _syncDeclaredModel(entry.cast<String, dynamic>(), seen);
    }
    _pruneUndeclaredModels(seen);
  }

  void _syncDeclaredModel(Map<String, dynamic> m, Set<String> seen) {
    final id = (m['modelId'] ?? m['id'] ?? 'model').toString();
    seen.add(id);
    _syncModelSource(id, m);
    _syncModelClip(id, m);
  }

  /// Reloads the model only when its declared `src` changes; otherwise just
  /// updates the transform in place.
  void _syncModelSource(String id, Map<String, dynamic> m) {
    if (_declaredSrcChanged(id, m['src'])) {
      _declaredModelSrcs[id] = m['src'] as String;
      _applyQuiet(Js3dCommand(kind: 'addModel', sceneId: sceneId, payload: m));
      return;
    }
    _applyQuiet(Js3dCommand(kind: 'setTransform', sceneId: sceneId, payload: m));
  }

  /// Whether the model's declared `src` is new (non-empty and different from
  /// the currently loaded source).
  bool _declaredSrcChanged(String id, dynamic src) =>
      src is String && src.isNotEmpty && _declaredModelSrcs[id] != src;

  /// (Re)starts a skeletal clip only when the requested clip name changes.
  void _syncModelClip(String id, Map<String, dynamic> m) {
    final clip = m['animation'] as String?;
    if (clip == null || _playingClips[id] == clip) return;
    _playingClips[id] = clip;
    _applyQuiet(Js3dCommand(
      kind: 'playAnimation',
      sceneId: sceneId,
      payload: {'modelId': id, 'name': clip},
    ));
  }

  void _pruneUndeclaredModels(Set<String> seen) {
    for (final old in _declaredModelSrcs.keys.toList()) {
      if (seen.contains(old)) continue;
      _declaredModelSrcs.remove(old);
      _playingClips.remove(old);
      _applyQuiet(Js3dCommand(
        kind: 'removeModel',
        sceneId: sceneId,
        payload: {'modelId': old},
      ));
    }
  }

  /// Fingerprint of the last camera config applied declaratively.
  String? _lastCameraKey;
}
