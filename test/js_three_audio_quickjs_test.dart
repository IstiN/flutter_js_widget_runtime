import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_test_config.dart';

final class _AudioProbe {
  const _AudioProbe(this.engine, this.backend, this.calls);

  final JsWidgetEngine engine;
  final JsWidgetEngineBackend backend;
  final List<Map<String, dynamic>> calls;
}

const _bufferJs = r'''
function audioBytes() {
  const bytes = new Uint8Array(244);
  const view = new DataView(bytes.buffer);
  function ascii(offset, text) {
    for (let i = 0; i < text.length; i++) bytes[offset + i] = text.charCodeAt(i);
  }
  ascii(0, 'RIFF'); view.setUint32(4, 236, true); ascii(8, 'WAVEfmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, 100, true);
  view.setUint32(28, 200, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); ascii(36, 'data'); view.setUint32(40, 200, true);
  return bytes;
}
''';

Future<_AudioProbe> _boot(
  WidgetTester tester,
  String source, {
  bool withMediaHost = true,
}) async {
  final threeSource = await tester.runAsync(
    () => rootBundle.loadString('assets/three/jsr_three_native.js'),
  );
  final calls = <Map<String, dynamic>>[];
  final config =
      threeTestConfig(
        engineId: 'three-audio-probe',
        host: createFlutterGpuThreeHost(),
        threeSource: threeSource,
      ).copyWith(
        onHostCall: withMediaHost
            ? (name, args) async {
                if (name != 'three.audio') throw ArgumentError(name);
                calls.add(Map<String, dynamic>.from(args));
                return {'ok': true};
              }
            : null,
      );
  final backend = QuickjsWidgetEngineBackend(config: config);
  final engine = JsWidgetEngine(config: config.copyWith(backend: backend));
  addTearDown(() => tester.runAsync(engine.dispose));
  await engine.init();
  await engine.run(source);
  return _AudioProbe(engine, backend, calls);
}

Future<void> _pump(WidgetTester tester, [int milliseconds = 30]) async {
  await tester.runAsync(
    () => Future<void>.delayed(Duration(milliseconds: milliseconds)),
  );
  await tester.pump();
}

Future<Map<String, dynamic>> _state(
  WidgetTester tester,
  _AudioProbe probe, {
  bool Function(Map<String, dynamic> state)? ready,
}) async {
  for (var attempt = 0; attempt < 50; attempt++) {
    final state = probe.engine.exportedState;
    if (state != null && (ready == null || ready(state))) return state;
    await _pump(tester, 10);
  }
  fail(
    'THREE audio probe did not export the expected state: ${probe.engine.exportedState}',
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'QuickJS upstream Audio/AudioLoader transport and autoplay contract',
    (tester) async {
      final probe = await _boot(tester, '''
$_bufferJs
const listener = new THREE.AudioListener();
const audio = new THREE.Audio(listener);
let loaded = false;
jsr.three.registerAsset('tone.wav', {data: audioBytes(), mime: 'audio/wav'});
new THREE.AudioLoader().load('tone.wav', buffer => {
  audio.setBuffer(buffer);
  loaded = true;
  jsr.exportState({loaded, duration: buffer.duration, sampleRate: buffer.sampleRate,
    input: listener.getInput() === listener.gain, output: audio.getOutput() === audio.gain});
});
function report(extra) {
  jsr.exportState(Object.assign({loaded, playing: audio.isPlaying,
    context: listener.context.state, loop: audio.getLoop(), rate: audio.getPlaybackRate(),
    volume: audio.getVolume(), sourceType: audio.sourceType}, extra || {}));
}
function handleEvent(action, payload) {
  try {
    if (action === 'play') { audio.play(); report(); }
    if (action === 'resume') listener.context.resume().then(() => report({resumed: true}));
    if (action === 'settings') {
      audio.setVolume(0.25).setLoop(true).setPlaybackRate(1.5); report();
    }
    if (action === 'master') { listener.setMasterVolume(0.5); report(); }
    if (action === 'pause') { audio.pause(); report(); }
    if (action === 'stop') { audio.stop(); report(); }
  } catch (error) {
    jsr.exportState({eventError: String(error), eventStack: error.stack});
  }
}
jsr.onEvent(handleEvent);
''');
      final loaded = await _state(
        tester,
        probe,
        ready: (state) => state['loaded'] == true,
      );
      expect(loaded['duration'], closeTo(1, 1e-9));
      expect(loaded['sampleRate'], 100);
      expect(loaded['input'], isTrue);
      expect(loaded['output'], isTrue);
      expect(probe.calls, isEmpty);

      await probe.backend.callEvent('play', {});
      final suspended = await _state(
        tester,
        probe,
        ready: (state) => state['playing'] == true,
      );
      expect(suspended['context'], 'suspended');
      expect(
        probe.calls,
        isEmpty,
        reason: 'no sound before a user-gesture resume',
      );

      await probe.backend.callEvent('resume', {});
      await _state(tester, probe, ready: (state) => state['resumed'] == true);
      await _pump(tester);
      expect(probe.calls.map((call) => call['action']), ['resume', 'play']);
      final play = probe.calls.last;
      expect(play['mime'], 'audio/wav');
      expect(play['data'], isA<String>());
      expect(play['loop'], isFalse);
      expect(play['volume'], 1.0);

      await probe.backend.callEvent('settings', {});
      await _pump(tester);
      final settings = probe.calls.last;
      expect(settings['action'], 'update');
      expect(settings['volume'], 0.25);
      expect(settings['loop'], isTrue);
      expect(settings['playbackRate'], 1.5);

      await probe.backend.callEvent('master', {});
      await _pump(tester);
      expect(probe.calls.last['volume'], 0.125);

      await probe.backend.callEvent('pause', {});
      await _pump(tester);
      expect(probe.calls.last['action'], 'pause');
      expect(probe.calls.last['release'], isTrue);
      expect(probe.engine.exportedState!['playing'], isFalse);
      final pausedSource = probe.calls.last['sourceId'];

      await probe.backend.callEvent('play', {});
      await _pump(tester);
      final plays = probe.calls
          .where((call) => call['action'] == 'play')
          .toList();
      expect(plays, hasLength(2));
      expect(plays.last['sourceId'], isNot(pausedSource));
      await probe.backend.callEvent('stop', {});
      await _pump(tester);
      expect(probe.calls.last['action'], 'stop');
      expect(probe.engine.exportedState!['playing'], isFalse);
    },
  );

  testWidgets(
    'QuickJS PositionalAudio matches WebAudio distance and cone models',
    (tester) async {
      final probe = await _boot(tester, '''
$_bufferJs
const listener = new THREE.AudioListener();
const sound = new THREE.PositionalAudio(listener);
jsr.three.registerAsset('tone.wav', {data: audioBytes(), mime: 'audio/wav'});
new THREE.AudioLoader().load('tone.wav', buffer => {
  sound.setBuffer(buffer).setLoop(true).play();
  listener.context.resume().then(() => jsr.exportState({ready: true}));
});
function handleEvent(action, p) {
  if (action !== 'spatial') return;
  try {
    sound.setRefDistance(p.ref).setRolloffFactor(p.rolloff)
      .setDistanceModel(p.model).setMaxDistance(p.max);
    sound.position.set(p.x || 0, 0, p.z || 0);
    if (p.cone) sound.setDirectionalCone(60, 120, 0.1);
    listener.updateMatrixWorld(true);
    sound.updateMatrixWorld(true);
  } catch (error) {
    jsr.exportState({ready: true, eventError: String(error), eventStack: error.stack});
  }
}
jsr.onEvent(handleEvent);
''');
      await _state(tester, probe, ready: (state) => state['ready'] == true);
      await _pump(tester);

      Future<void> check(
        Map<String, dynamic> payload,
        double volume,
        double balance,
      ) async {
        await probe.backend.callEvent('spatial', payload);
        await _pump(tester);
        final update = probe.calls.last;
        expect(update['action'], 'update');
        expect((update['volume'] as num).toDouble(), closeTo(volume, 1e-9));
        expect((update['balance'] as num).toDouble(), closeTo(balance, 1e-9));
      }

      await check(
        {
          'ref': 2.0,
          'rolloff': 1.0,
          'model': 'inverse',
          'max': 100.0,
          'x': 6.0,
        },
        1 / 3,
        1,
      );
      await check(
        {'ref': 2.0, 'rolloff': 1.0, 'model': 'linear', 'max': 10.0, 'x': 6.0},
        0.5,
        1,
      );
      await check(
        {
          'ref': 2.0,
          'rolloff': 2.0,
          'model': 'exponential',
          'max': 100.0,
          'x': 6.0,
        },
        1 / 9,
        1,
      );
      await check(
        {'ref': 2.0, 'rolloff': 1.0, 'model': 'linear', 'max': 10.0, 'x': 30.0},
        0,
        1,
      );
      await check(
        {
          'ref': 1.0,
          'rolloff': 1.0,
          'model': 'inverse',
          'max': 100.0,
          'z': -2.0,
        },
        0.5,
        0,
      );
      await check(
        {
          'ref': 1.0,
          'rolloff': 1.0,
          'model': 'inverse',
          'max': 100.0,
          'z': 2.0,
          'cone': true,
        },
        0.05,
        0,
      );
    },
  );

  testWidgets(
    'QuickJS missing media host rejects resume without unhandled rejection',
    (tester) async {
      final probe = await _boot(tester, '''
const listener = new THREE.AudioListener();
listener.context.resume().catch(error => jsr.exportState({error: String(error)}));
''', withMediaHost: false);
      final state = await _state(
        tester,
        probe,
        ready: (state) => state['error'] != null,
      );
      expect(state['error'], contains('hostCall'));
      expect(probe.calls, isEmpty);
    },
  );
}
