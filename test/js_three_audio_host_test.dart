import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'support/fake_media_controllers.dart';

final class _SpatialAudioController extends RecordingAudioController
    implements JsThreeAudioEnhancedController {
  _SpatialAudioController(super.src);

  final errorCtl = StreamController<Object?>.broadcast();

  @override
  Stream<Object?> get errorStream => errorCtl.stream;

  @override
  Future<void> setPlaybackRate(double playbackRate) async =>
      calls.add('rate:$playbackRate');

  @override
  Future<void> setBalance(double balance) async =>
      calls.add('balance:$balance');
}

final class _SpatialMediaHost extends RecordingMediaHost {
  @override
  JsAudioController createAudioController(String src) {
    final controller = _SpatialAudioController(src);
    audioControllers.add(controller);
    return controller;
  }
}

Map<String, dynamic> _play({
  String engineId = 'engine-a',
  String sourceId = 'source-1',
  String? data,
  double delay = 0,
}) => {
  'engineId': engineId,
  'action': 'play',
  'sourceId': sourceId,
  'data': data ?? base64Encode(const [1, 2, 3, 4]),
  'mime': 'audio/mpeg',
  'offset': 0.25,
  'delay': delay,
  'volume': 0.75,
  'balance': -0.5,
  'playbackRate': 1.25,
  'loop': true,
};

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'autoplay is gated until resume and bytes use BytesSource-compatible URIs',
    () async {
      final media = _SpatialMediaHost();
      final host = JsThreeAudioHost(engineId: 'engine-a', mediaHost: media);
      await expectLater(
        host.handleCall('three.audio', _play()),
        throwsA(isA<StateError>()),
      );
      expect(media.audioControllers, isEmpty);

      expect(
        await host.handleCall('three.audio', {
          'engineId': 'engine-a',
          'action': 'resume',
        }),
        {'state': 'running'},
      );
      expect(await host.handleCall('three.audio', _play()), {'played': true});
      final controller = media.audioControllers.single;
      expect(
        controller.src,
        'data:audio/mpeg;base64,${base64Encode(const [1, 2, 3, 4])}',
      );
      expect(controller.calls, [
        'seek:250',
        'volume:0.75',
        'loop:true',
        'rate:1.25',
        'balance:-0.5',
        'play',
      ]);
      await host.dispose();
      expect(controller.calls.last, 'dispose');
    },
  );

  test(
    'spatial updates, pause, stop, and disposal are source bounded',
    () async {
      final media = _SpatialMediaHost();
      final host = JsThreeAudioHost(engineId: 'engine-a', mediaHost: media);
      await host.handleCall('three.audio', {
        'engineId': 'engine-a',
        'action': 'resume',
      });
      await host.handleCall('three.audio', _play());
      final update = {
        'engineId': 'engine-a',
        'action': 'update',
        'sourceId': 'source-1',
        'volume': 0.2,
        'balance': 0.8,
        'playbackRate': 2.0,
        'loop': false,
      };
      expect(await host.handleCall('three.audio', update), {'updated': true});
      await host.handleCall('three.audio', {
        'engineId': 'engine-a',
        'action': 'pause',
        'sourceId': 'source-1',
        'release': false,
      });
      await host.handleCall('three.audio', {
        'engineId': 'engine-a',
        'action': 'stop',
        'sourceId': 'source-1',
        'release': true,
      });
      final controller = media.audioControllers.single;
      expect(controller.calls.sublist(6), [
        'volume:0.2',
        'loop:false',
        'rate:2.0',
        'balance:0.8',
        'pause',
        'pause',
        'seek:0',
        // Teardown mutes the player before the bookkeeping dispose.
        'pause',
        'dispose',
      ]);
      expect(await host.handleCall('three.audio', update), {'updated': false});
      expect(
        await host.handleCall('three.audio', {
          'engineId': 'engine-a',
          'action': 'dispose',
          'sourceId': 'missing',
        }),
        {'released': false},
      );
      await host.dispose();
    },
  );

  test('delayed play is cancelled by a newer transport command', () async {
    final media = _SpatialMediaHost();
    final host = JsThreeAudioHost(engineId: 'engine-a', mediaHost: media);
    await host.handleCall('three.audio', {
      'engineId': 'engine-a',
      'action': 'resume',
    });
    final playing = host.handleCall('three.audio', _play(delay: 0.02));
    await host.handleCall('three.audio', {
      'engineId': 'engine-a',
      'action': 'stop',
      'sourceId': 'source-1',
    });
    expect(await playing, {'played': false});
    expect(media.audioControllers.single.calls.contains('play'), isFalse);
    await host.dispose();
  });

  test(
    'parser rejects cross-engine, malformed bytes, values and channels',
    () async {
      final media = _SpatialMediaHost();
      final host = JsThreeAudioHost(
        engineId: 'engine-a',
        mediaHost: media,
        maxEncodedBytes: 4,
      );
      await host.handleCall('three.audio', {
        'engineId': 'engine-a',
        'action': 'resume',
      });
      await expectLater(
        host.handleCall('three.audio', _play(engineId: 'other')),
        throwsA(isA<FormatException>()),
      );
      await expectLater(
        host.handleCall('three.audio', _play(data: 'not base64')),
        throwsA(isA<FormatException>()),
      );
      await expectLater(
        host.handleCall(
          'three.audio',
          _play(data: base64Encode(const [1, 2, 3, 4, 5])),
        ),
        throwsA(isA<FormatException>()),
      );
      await expectLater(
        host.handleCall('three.audio', _play()..['mime'] = 'text/plain'),
        throwsA(isA<FormatException>()),
      );
      await expectLater(
        host.handleCall('three.audio', _play()..['volume'] = double.nan),
        throwsA(isA<FormatException>()),
      );
      await expectLater(
        host.handleCall('other', _play()),
        throwsA(isA<ArgumentError>()),
      );
      await expectLater(
        host.handleCall('three.audio', {
          'engineId': 'engine-a',
          'action': 'unknown',
          'sourceId': 'source-1',
        }),
        throwsA(isA<FormatException>()),
      );
      expect(media.audioControllers, isEmpty);
      await host.dispose();
      await expectLater(
        host.handleCall('three.audio', {
          'engineId': 'engine-a',
          'action': 'resume',
        }),
        throwsA(isA<StateError>()),
      );
    },
  );

  test(
    'source quota and optional enhanced transport degrade explicitly',
    () async {
      final media = RecordingMediaHost();
      final host = JsThreeAudioHost(
        engineId: 'engine-a',
        mediaHost: media,
        maxSources: 1,
      );
      await host.handleCall('three.audio', {
        'engineId': 'engine-a',
        'action': 'resume',
      });
      await host.handleCall('three.audio', _play());
      await host.handleCall('three.audio', {
        'engineId': 'engine-a',
        'action': 'update',
        'sourceId': 'source-1',
        'volume': 0.4,
        'balance': 1.0,
        'playbackRate': 3.0,
      });
      expect(media.audioControllers.single.calls, contains('volume:0.4'));
      expect(
        media.audioControllers.single.calls.where(
          (call) => call.startsWith('rate:'),
        ),
        isEmpty,
      );
      await expectLater(
        host.handleCall('three.audio', _play(sourceId: 'source-2')),
        throwsA(isA<StateError>()),
      );
      await host.dispose();
      expect(await host.dispose(), {'disposed': false});
    },
  );

  test(
    'engine teardown, invalid ids and controller errors are bounded',
    () async {
      expect(
        () => JsThreeAudioHost(engineId: '', mediaHost: RecordingMediaHost()),
        throwsArgumentError,
      );
      final media = _SpatialMediaHost();
      final errors = <Object>[];
      final host = JsThreeAudioHost(
        engineId: 'engine-a',
        mediaHost: media,
        onError: errors.add,
      );
      await host.handleCall('three.audio', {
        'engineId': 'engine-a',
        'action': 'resume',
      });
      await expectLater(
        host.handleCall('three.audio', {
          'engineId': 'engine-a',
          'action': 'pause',
          'sourceId': '',
        }),
        throwsA(isA<FormatException>()),
      );
      await host.handleCall('three.audio', _play());
      (media.audioControllers.single as _SpatialAudioController).errorCtl.add(
        'decode failed',
      );
      await Future<void>.delayed(Duration.zero);
      expect(errors, ['decode failed']);
      expect(
        await host.handleCall('three.audio', {
          'engineId': 'engine-a',
          'action': 'disposeEngine',
        }),
        {'disposed': true},
      );
      expect(media.audioControllers.single.calls.last, 'dispose');
    },
  );
}
