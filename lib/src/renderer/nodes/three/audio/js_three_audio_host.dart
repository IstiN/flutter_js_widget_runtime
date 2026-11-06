import 'dart:async';
import 'dart:convert';

import 'package:js_widget_runtime/src/renderer/media/js_media_controller.dart';
import 'package:js_widget_runtime/src/renderer/media/js_media_host.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/audio/js_three_audio_controller.dart';

/// Bounded host channel used by the native THREE WebAudio adapter.
typedef JsThreeAudioChannelHandler =
    Future<Object?> Function(String name, Map<String, dynamic> args);

/// Routes native `three.audio` commands to the application's [JsMediaHost].
///
/// Each instance is bound to one engine generation. Encoded audio remains
/// encoded end-to-end; the host controller performs platform decoding.
final class JsThreeAudioHost {
  JsThreeAudioHost({
    required this.engineId,
    required JsMediaHost mediaHost,
    this.maxSources = 64,
    this.maxEncodedBytes = 64 * 1024 * 1024,
    this.onError,
  }) : _mediaHost = mediaHost {
    if (engineId.isEmpty || maxSources < 1 || maxEncodedBytes < 1) {
      throw ArgumentError('Invalid THREE audio host limits');
    }
  }

  static const channel = 'three.audio';

  final String engineId;
  final JsMediaHost _mediaHost;
  final int maxSources;
  final int maxEncodedBytes;
  final void Function(Object error)? onError;
  final Map<String, _ThreeAudioSource> _sources = {};
  final Map<String, int> _transportRevisions = {};
  bool _resumed = false;
  bool _disposed = false;

  /// Handles one request from `jsr.hostCall`.
  Future<Object?> handleCall(String name, Map<String, dynamic> args) async {
    if (name != channel) throw ArgumentError.value(name, 'name');
    _checkLive();
    final action = _action(args);
    _checkEngine(args);
    if (action == 'resume') return _resume();
    if (action == 'disposeEngine') return dispose();
    return _handleSource(action, args);
  }

  Future<Map<String, Object>> _resume() async {
    _resumed = true;
    return const {'state': 'running'};
  }

  Future<Object?> _handleSource(
    String action,
    Map<String, dynamic> args,
  ) async {
    final id = _sourceId(args);
    switch (action) {
      case 'play':
        return _play(id, args);
      case 'pause':
        return _pause(id, args, stop: false);
      case 'stop':
        return _pause(id, args, stop: true);
      case 'update':
        return _update(id, args);
      case 'dispose':
        return _remove(id);
      default:
        throw FormatException('three.audio: unknown action $action');
    }
  }

  Future<Map<String, bool>> _play(String id, Map<String, dynamic> args) async {
    if (!_resumed) {
      throw StateError(
        'three.audio: AudioContext.resume() requires a user gesture',
      );
    }
    final request = _PlayRequest.parse(args, maxEncodedBytes);
    final transportRevision = _invalidateTransport(id);
    final source = await _sourceFor(id, request.uri);
    if (!_isTransportCurrent(id, transportRevision)) {
      await _release(id);
      return const {'played': false};
    }
    final revision = source.beginPlayback(request);
    final controller = source.controller!;
    await controller.seek(_duration(request.offset));
    if (!source.isCurrent(revision)) return const {'played': false};
    await _applyTransport(source);
    if (!source.isCurrent(revision)) return const {'played': false};
    await Future<void>.delayed(_duration(request.delay));
    if (!source.isCurrent(revision)) return const {'played': false};
    await controller.play();
    return {'played': source.isCurrent(revision)};
  }

  Future<_ThreeAudioSource> _sourceFor(String id, String uri) async {
    final existing = _sources[id];
    if (existing != null && existing.uri == uri) return existing;
    if (existing != null) await _release(id, preserveRevision: true);
    if (_sources.length >= maxSources) {
      throw StateError('three.audio: source quota exceeded');
    }
    final controller = _mediaHost.createAudioController(uri);
    final source = _ThreeAudioSource(id, uri, controller);
    source.errorSubscription = controller.errorStream?.listen(_reportError);
    _sources[id] = source;
    return source;
  }

  Future<Map<String, bool>> _pause(
    String id,
    Map<String, dynamic> args, {
    required bool stop,
  }) async {
    _invalidateTransport(id);
    final source = _sources[id];
    if (source == null || source.released) return const {'released': false};
    source.cancelPlayback();
    final controller = source.controller!;
    await controller.pause();
    if (stop) await controller.seek(Duration.zero);
    if (_boolean(args, 'release')) await _remove(id);
    return {'released': !_sources.containsKey(id)};
  }

  Future<Map<String, bool>> _update(
    String id,
    Map<String, dynamic> args,
  ) async {
    final source = _sources[id];
    if (source == null || source.released) return const {'updated': false};
    source.update(
      volume: _number(args, 'volume', source.volume, 0, 1),
      balance: _number(args, 'balance', source.balance, -1, 1),
      playbackRate: _number(
        args,
        'playbackRate',
        source.playbackRate,
        0.0001,
        100,
      ),
      loop: _boolean(args, 'loop', fallback: source.loop),
    );
    await _applyTransport(source);
    return const {'updated': true};
  }

  Future<void> _applyTransport(_ThreeAudioSource source) async {
    final controller = source.controller!;
    await controller.setVolume(source.volume);
    await controller.setLoop(source.loop);
    final enhanced = controller is JsThreeAudioEnhancedController
        ? controller
        : null;
    await enhanced?.setPlaybackRate(source.playbackRate);
    await enhanced?.setBalance(source.balance);
  }

  Future<Map<String, bool>> _remove(String id) {
    _invalidateTransport(id);
    return _release(id);
  }

  Future<Map<String, bool>> _release(
    String id, {
    bool preserveRevision = false,
  }) async {
    if (!preserveRevision) _transportRevisions.remove(id);
    final source = _sources.remove(id);
    if (source == null) return const {'released': false};
    await _disposeSource(source);
    return const {'released': true};
  }

  /// Single-release teardown for one source: cancels playback, detaches the
  /// error subscription, pauses and disposes the controller at most once,
  /// even when a transport command races the teardown. The pause runs
  /// BEFORE the dispose and is retried when the dispose fails: dispose is
  /// only bookkeeping (real hosts: audioplayers dispose racing a pending
  /// seek/play), while pause is what actually mutes a looping player — a
  /// failed dispose must never leave a source audible. A failing controller
  /// dispose is surfaced via [onError] instead of propagating — one broken
  /// player must never abort the release loop and strand the remaining
  /// PLAYING sources.
  Future<void> _disposeSource(_ThreeAudioSource source) async {
    if (source.released) return;
    source.released = true;
    source.cancelPlayback();
    try {
      await source.errorSubscription?.cancel();
    } catch (error) {
      _reportError(error);
    }
    final controller = source.controller!;
    try {
      await controller.pause();
    } catch (error) {
      _reportError(error);
    }
    try {
      await controller.dispose();
    } catch (error) {
      // The racing dispose may have detached mid-command: mute again
      // (best effort) so the player cannot keep sounding, then surface
      // the failure without aborting the release loop.
      try {
        await controller.pause();
      } catch (pauseError) {
        _reportError(pauseError);
      }
      _reportError(error);
    }
  }

  int _invalidateTransport(String id) {
    final revision = (_transportRevisions[id] ?? 0) + 1;
    _transportRevisions[id] = revision;
    return revision;
  }

  bool _isTransportCurrent(String id, int revision) =>
      !_disposed && _transportRevisions[id] == revision;

  void _checkEngine(Map<String, dynamic> args) {
    if (args['engineId'] != engineId) {
      throw const FormatException('three.audio: engine id mismatch');
    }
  }

  void _checkLive() {
    if (_disposed) throw StateError('three.audio: host is disposed');
  }

  void _reportError(Object? error) {
    if (error != null) onError?.call(error);
  }

  /// Releases every player owned by this engine generation.
  ///
  /// Called both by the embedder's page teardown (widget switch / page
  /// close) and by the `disposeEngine` host call; the second caller is a
  /// no-op. Each source is released via [_disposeSource] so per-source
  /// failures cannot abort the loop and leave sounds playing.
  Future<Map<String, bool>> dispose() async {
    if (_disposed) return const {'disposed': false};
    _disposed = true;
    final sources = List<_ThreeAudioSource>.of(_sources.values);
    _sources.clear();
    _transportRevisions.clear();
    for (final source in sources) {
      await _disposeSource(source);
    }
    return const {'disposed': true};
  }
}

final class _ThreeAudioSource {
  _ThreeAudioSource(this.id, this.uri, this.controller);

  final String id;
  final String uri;
  final JsAudioController? controller;
  StreamSubscription<Object?>? errorSubscription;
  double volume = 1;
  double balance = 0;
  double playbackRate = 1;
  bool loop = false;
  bool playing = false;
  int revision = 0;

  /// Set once the controller has been handed to `_disposeSource`; guards
  /// against double release when a transport command races the teardown.
  bool released = false;

  int beginPlayback(_PlayRequest request) {
    revision++;
    playing = true;
    volume = request.volume;
    balance = request.balance;
    playbackRate = request.playbackRate;
    loop = request.loop;
    return revision;
  }

  void update({
    required double volume,
    required double balance,
    required double playbackRate,
    required bool loop,
  }) {
    this.volume = volume;
    this.balance = balance;
    this.playbackRate = playbackRate;
    this.loop = loop;
  }

  void cancelPlayback() {
    revision++;
    playing = false;
  }

  bool isCurrent(int expected) => playing && revision == expected;
}

final class _PlayRequest {
  const _PlayRequest({
    required this.uri,
    required this.offset,
    required this.delay,
    required this.volume,
    required this.balance,
    required this.playbackRate,
    required this.loop,
  });

  final String uri;
  final double offset;
  final double delay;
  final double volume;
  final double balance;
  final double playbackRate;
  final bool loop;

  factory _PlayRequest.parse(Map<String, dynamic> args, int maximumBytes) {
    final mime = _mime(args['dataMime'] ?? args['mime']);
    final data = _encodedAudio(args['data'], maximumBytes);
    return _PlayRequest(
      uri: 'data:$mime;base64,$data',
      offset: _number(args, 'offset', 0, 0, 86400),
      delay: _number(args, 'delay', 0, 0, 60),
      volume: _number(args, 'volume', 1, 0, 1),
      balance: _number(args, 'balance', 0, -1, 1),
      playbackRate: _number(args, 'playbackRate', 1, 0.0001, 100),
      loop: _boolean(args, 'loop'),
    );
  }
}

String _action(Map<String, dynamic> args) {
  final value = args['action'];
  if (value is! String || value.isEmpty) {
    throw const FormatException('three.audio: action is required');
  }
  return value;
}

String _sourceId(Map<String, dynamic> args) {
  final value = args['sourceId'];
  if (value is! String || value.isEmpty || value.length > 128) {
    throw const FormatException('three.audio: invalid source id');
  }
  return value;
}

String _mime(Object? value) {
  if (value is! String || !value.toLowerCase().startsWith('audio/')) {
    throw const FormatException(
      'three.audio: an audio/* MIME type is required',
    );
  }
  return value;
}

String _encodedAudio(Object? value, int maximumBytes) {
  if (value is! String || value.isEmpty || value.length > maximumBytes * 2) {
    throw const FormatException('three.audio: invalid encoded audio size');
  }
  final bytes = base64Decode(value);
  if (bytes.isEmpty || bytes.length > maximumBytes) {
    throw const FormatException('three.audio: encoded audio quota exceeded');
  }
  return value;
}

double _number(
  Map<String, dynamic> args,
  String key,
  double fallback,
  double minimum,
  double maximum,
) {
  final raw = args[key];
  if (raw == null) return fallback;
  if (raw is! num || !raw.isFinite || raw < minimum || raw > maximum) {
    throw FormatException('three.audio: invalid $key');
  }
  return raw.toDouble();
}

bool _boolean(Map<String, dynamic> args, String key, {bool fallback = false}) {
  final raw = args[key];
  if (raw == null) return fallback;
  if (raw is! bool) throw FormatException('three.audio: invalid $key');
  return raw;
}

Duration _duration(double seconds) =>
    Duration(microseconds: (seconds * Duration.microsecondsPerSecond).round());
