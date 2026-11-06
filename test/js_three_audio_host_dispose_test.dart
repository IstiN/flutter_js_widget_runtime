import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'support/fake_media_controllers.dart';

/// Lifecycle regression tests for the `three.audio` lane audio leak:
/// sounds kept playing after leaving sound-playing widgets (catalog widget
/// switch / page close) because
///
/// 1. `JsThreeAudioHost.dispose()` aborted on the first failing controller
///    dispose, stranding every later source (still playing) forever; and
/// 2. nothing in the engine lifecycle guaranteed a release at all — the
///    host is only released by the embedder's page dispose.
///
final class _FlakyAudioController extends RecordingAudioController {
  _FlakyAudioController(super.src);

  // Mutable: the test flips it after creation to simulate a dispose that
  // fails (real hosts: audioplayers dispose racing a pending seek/play).
  bool failDispose = false;

  @override
  Future<void> dispose() async {
    calls.add('dispose');
    if (failDispose) throw StateError('dispose failed');
  }
}

final class _CountingMediaHost extends RecordingMediaHost {
  int get createdCount => audioControllers.length;

  int get disposedCount =>
      audioControllers.where((c) => c.calls.contains('dispose')).length;

  @override
  JsAudioController createAudioController(String src) {
    final controller = _FlakyAudioController(src);
    audioControllers.add(controller);
    return controller;
  }
}

/// Audio controller whose play() parks forever: simulates a native player
/// stuck in an in-flight setSource/resume (the audioplayers race that used
/// to detach a LOOPING AVPlayer that then never stopped).
final class _ParkedPlayController extends RecordingAudioController {
  _ParkedPlayController(super.src);

  @override
  Future<void> play() {
    calls.add('play');
    return Completer<void>().future; // never completes
  }
}

final class _ParkedMediaHost extends RecordingMediaHost {
  @override
  JsAudioController createAudioController(String src) {
    final controller = _ParkedPlayController(src);
    audioControllers.add(controller);
    return controller;
  }
}

Map<String, dynamic> _play(
  String sourceId, {
  String engineId = 'engine-a',
  double delay = 0,
}) => {
  'engineId': engineId,
  'action': 'play',
  'sourceId': sourceId,
  'data': base64Encode(const [1, 2, 3, 4]),
  'mime': 'audio/mpeg',
  'offset': 0,
  'delay': delay,
  'volume': 0.75,
  'balance': 0,
  'playbackRate': 1,
  'loop': true,
};

Map<String, dynamic> _disposeSource(String sourceId) => {
  'engineId': 'engine-a',
  'action': 'dispose',
  'sourceId': sourceId,
};

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('dispose releases every created controller exactly once', () async {
    final media = _CountingMediaHost();
    final host = JsThreeAudioHost(engineId: 'engine-a', mediaHost: media);
    await host.handleCall('three.audio', {
      'engineId': 'engine-a',
      'action': 'resume',
    });
    await host.handleCall('three.audio', _play('s1'));
    await host.handleCall('three.audio', _play('s2'));
    // In-flight delayed play: dispose must release it too, not strand it.
    final delayed = host.handleCall('three.audio', _play('s3', delay: 30));

    final result = await host.dispose();
    expect(result, {'disposed': true});
    expect(media.createdCount, 3);
    expect(
      media.disposedCount,
      3,
      reason:
          'every created controller — '
          'including one whose play is still in flight — must be disposed',
    );
    for (final controller in media.audioControllers) {
      expect(
        controller.calls.where((c) => c == 'dispose'),
        hasLength(1),
        reason: 'controller ${controller.src} must be released exactly once',
      );
    }

    // The delayed play must never start after the host is disposed.
    expect(await delayed, {'played': false});
    await Future<void>.delayed(const Duration(milliseconds: 60));
    final delayedController = media.audioControllers[2];
    final playIndex = delayedController.calls.indexOf('play');
    final disposeIndex = delayedController.calls.indexOf('dispose');
    expect(disposeIndex, greaterThanOrEqualTo(0));
    expect(
      playIndex,
      lessThan(0),
      reason: 'a disposed source must never reach controller.play()',
    );
  });

  test('a failing controller dispose cannot strand the others', () async {
    final media = _CountingMediaHost();
    final host = JsThreeAudioHost(engineId: 'engine-a', mediaHost: media);
    // Rebuild the host so the first source's controller dispose throws —
    // with audioplayers this is the dispose-racing-pending-seek failure
    // that used to abort the release loop and leave the remaining sounds
    // playing forever.
    await host.handleCall('three.audio', {
      'engineId': 'engine-a',
      'action': 'resume',
    });
    await host.handleCall('three.audio', _play('s1'));
    await host.handleCall('three.audio', _play('s2'));
    await host.handleCall('three.audio', _play('s3'));
    (media.audioControllers[0] as _FlakyAudioController).failDispose = true;

    await host.dispose();

    expect(
      media.disposedCount,
      3,
      reason:
          'one broken controller must not '
          'strand the remaining playing sources',
    );
    // The failing controller must be muted BEFORE the dispose attempt and
    // muted AGAIN after it fails — dispose is only bookkeeping, pause is
    // what actually silences a looping player.
    final calls = media.audioControllers[0].calls;
    final firstDispose = calls.indexOf('dispose');
    expect(firstDispose, greaterThanOrEqualTo(0));
    expect(
      calls.indexOf('pause'),
      lessThan(firstDispose),
      reason: 'the mute must land before the dispose attempt',
    );
    expect(
      calls.indexOf('pause', firstDispose + 1),
      greaterThan(firstDispose),
      reason:
          'a failing dispose must retry pause once so the '
          'player cannot keep sounding past a failed release',
    );
  });

  test('dispose is idempotent: no double release', () async {
    final media = _CountingMediaHost();
    final host = JsThreeAudioHost(engineId: 'engine-a', mediaHost: media);
    await host.handleCall('three.audio', {
      'engineId': 'engine-a',
      'action': 'resume',
    });
    await host.handleCall('three.audio', _play('s1'));
    await host.handleCall('three.audio', _play('s2'));

    expect(await host.dispose(), {'disposed': true});
    // Page close AND the engine's disposeEngine both fire in the embedder:
    expect(await host.dispose(), {'disposed': false});
    // Late per-source node-removal events from the still-draining worker
    // are rejected (host disposed) — the real engine resolves them as
    // hostCall errors; they must never double-dispose a controller.
    await host
        .handleCall('three.audio', _disposeSource('s1'))
        .then((_) {}, onError: (Object _) {});
    await host
        .handleCall('three.audio', _disposeSource('s2'))
        .then((_) {}, onError: (Object _) {});

    for (final controller in media.audioControllers) {
      expect(controller.calls.where((c) => c == 'dispose'), hasLength(1));
    }
    expect(media.disposedCount, media.createdCount);
  });

  test('post-dispose host calls create no controllers', () async {
    final media = _CountingMediaHost();
    final host = JsThreeAudioHost(engineId: 'engine-a', mediaHost: media);
    await host.dispose();

    await expectLater(
      host.handleCall('three.audio', _play('late')),
      throwsA(isA<StateError>()),
    );
    expect(media.createdCount, 0);
  });

  test('dispose pauses a parked-play source; it never plays again', () async {
    final media = _ParkedMediaHost();
    final host = JsThreeAudioHost(engineId: 'engine-a', mediaHost: media);
    await host.handleCall('three.audio', {
      'engineId': 'engine-a',
      'action': 'resume',
    });
    // Never awaited: controller.play() parks forever on purpose (in-flight
    // setSource/resume racing the teardown, as audioplayers does).
    final parked = host.handleCall('three.audio', _play('s1'));
    expect(parked, isA<Future<Object?>>());
    // Let the play pipeline reach controller.play().
    await Future<void>.delayed(const Duration(milliseconds: 10));

    final controller = media.audioControllers.single;
    expect(controller.calls, contains('play'));

    expect(await host.dispose(), {'disposed': true});

    final disposeIndex = controller.calls.indexOf('dispose');
    expect(disposeIndex, greaterThanOrEqualTo(0));
    final pauseIndex = controller.calls.lastIndexOf('pause');
    expect(
      pauseIndex,
      greaterThan(controller.calls.indexOf('play')),
      reason: 'dispose must mute a source whose play is still in flight',
    );
    expect(
      pauseIndex,
      lessThan(disposeIndex),
      reason: 'the mute must land before the dispose attempt',
    );
    // Even with the play still parked, no new play may arrive afterwards.
    await Future<void>.delayed(const Duration(milliseconds: 10));
    expect(
      controller.calls.indexOf('play', disposeIndex),
      lessThan(0),
      reason: 'a released source must never reach play() again',
    );
  });
}
