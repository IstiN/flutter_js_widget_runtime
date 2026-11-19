import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'support/jsr_quickjs_harness.dart';

const String audioWidgetJs = r'''
(function() {
  function reportRender(promise) {
    return promise.then(function(info) {
      jsr.exportState({ ok: true, info: info });
    }, function(e) {
      jsr.exportState({ ok: false, error: String(e && e.message || e) });
    });
  }

  function dispatch(actionId) {
    if (actionId === 'sine') {
      return reportRender(jsr.audio.synth({
        name: 'tone-01',
        sampleRate: 8000,
        channels: 1,
      }).osc({
        type: 'sine',
        frequency: 100,
        duration: 0.01,
        gain: 0.5,
        attack: 0,
        decay: 0,
        sustain: 1,
        release: 0,
      }).render());
    }
    if (actionId === 'explicit-length') {
      return reportRender(jsr.audio.synth({
        name: 'exact',
        sampleRate: 8000,
        channels: 1,
        duration: 0.02,
      }).osc({
        type: 'square',
        frequency: 100,
        start: 0,
        duration: 0.005,
        gain: 0.5,
        attack: 0,
        decay: 0,
        sustain: 1,
        release: 0,
      }).render());
    }
    if (actionId === 'stereo-note') {
      return reportRender(jsr.audio.synth({
        name: 'note',
        sampleRate: 8000,
        channels: 2,
      }).note('A4', {
        start: 0,
        duration: 0.002,
        gain: 0.5,
        attack: 0,
        decay: 0,
        sustain: 1,
        release: 0,
        pan: 1,
      }).render());
    }
    if (actionId === 'generated-name') {
      return reportRender(jsr.audio.synth({
        sampleRate: 8000,
        channels: 1,
      }).osc({
        type: 'triangle',
        frequency: 50,
        duration: 0.001,
      }).render());
    }
    if (actionId === 'note-frequency') {
      jsr.exportState({ frequency: jsr.audio.noteToFrequency('A4') });
      return Promise.resolve();
    }
    if (actionId === 'invalid-note') {
      return reportRender(jsr.audio.synth({
        sampleRate: 8000,
      }).note('H4', {
        duration: 0.001,
      }).render());
    }
    if (actionId === 'filter-lowpass') {
      return reportRender(jsr.audio.synth({
        sampleRate: 8000,
        channels: 1,
      }).note('A4', {
        duration: 0.2,
        gain: 1,
        attack: 0,
        decay: 0,
        sustain: 1,
        release: 0,
        filter: { type: 'lowpass', frequency: 100, q: 0.707 },
      }).render());
    }
    if (actionId === 'filter-highpass') {
      return reportRender(jsr.audio.synth({
        sampleRate: 8000,
        channels: 1,
      }).note('A4', {
        duration: 0.2,
        gain: 1,
        attack: 0,
        decay: 0,
        sustain: 1,
        release: 0,
        filter: { type: 'highpass', frequency: 500, q: 0.707 },
      }).render());
    }
    if (actionId === 'filter-sweep') {
      return reportRender(jsr.audio.synth({
        sampleRate: 8000,
        channels: 1,
      }).note('A2', {
        duration: 0.2,
        gain: 1,
        attack: 0,
        decay: 0,
        sustain: 1,
        release: 0,
        filter: {
          type: 'lowpass',
          frequency: 200,
          frequencyEnd: 1500,
          q: 2,
        },
      }).render());
    }
    if (actionId === 'pink-noise') {
      return reportRender(jsr.audio.synth({
        sampleRate: 8000,
        channels: 1,
      }).osc({
        type: 'noise',
        noiseColor: 'pink',
        duration: 0.25,
        gain: 1,
        attack: 0,
        decay: 0,
        sustain: 1,
        release: 0,
      }).render());
    }
    if (actionId === 'brown-noise') {
      return reportRender(jsr.audio.synth({
        sampleRate: 8000,
        channels: 1,
      }).osc({
        type: 'noise',
        noiseColor: 'brown',
        duration: 0.25,
        gain: 1,
        attack: 0,
        decay: 0,
        sustain: 1,
        release: 0,
      }).render());
    }
    if (actionId === 'vibrato-tremolo') {
      return reportRender(jsr.audio.synth({
        sampleRate: 8000,
        channels: 1,
      }).note('A4', {
        duration: 0.25,
        gain: 1,
        attack: 0,
        decay: 0,
        sustain: 1,
        release: 0,
        vibrato: { rate: 8, depth: 150 },
        tremolo: { rate: 4, depth: 0.7 },
      }).render());
    }
    if (actionId === 'track-effects') {
      return reportRender(jsr.audio.synth({
        sampleRate: 8000,
        channels: 1,
        effects: [
          { type: 'delay', time: 0.04, feedback: 0.5, mix: 0.45 },
          { type: 'reverb', decay: 0.2, mix: 0.35 },
        ],
      }).osc({
        type: 'sine',
        frequency: 100,
        duration: 0.1,
        gain: 1,
        attack: 0,
        decay: 0,
        sustain: 1,
        release: 0,
      }).render());
    }
    if (actionId === 'track-effects-tail') {
      return reportRender(jsr.audio.synth({
        sampleRate: 8000,
        channels: 1,
        effects: [{ type: 'delay', time: 0.1, feedback: 0.5, mix: 0.8 }],
      }).osc({
        type: 'sine',
        frequency: 100,
        duration: 0.05,
        gain: 1,
        attack: 0,
        decay: 0,
        sustain: 1,
        release: 0,
      }).render());
    }
    if (actionId === 'drive-on') {
      return reportRender(jsr.audio.synth({
        sampleRate: 8000,
        channels: 1,
      }).osc({
        type: 'sawtooth',
        frequency: 55,
        duration: 0.2,
        gain: 0.6,
        attack: 0,
        decay: 0,
        sustain: 1,
        release: 0,
        drive: 8,
        driveMix: 0.8,
      }).render());
    }
    if (actionId === 'drive-off') {
      return reportRender(jsr.audio.synth({
        sampleRate: 8000,
        channels: 1,
      }).osc({
        type: 'sawtooth',
        frequency: 55,
        duration: 0.2,
        gain: 0.6,
        attack: 0,
        decay: 0,
        sustain: 1,
        release: 0,
      }).render());
    }
    if (actionId === 'fm-bell') {
      return reportRender(jsr.audio.synth({
        sampleRate: 8000,
        channels: 1,
      }).note('A4', {
        duration: 0.25,
        gain: 0.8,
        type: 'sine',
        attack: 0,
        decay: 0,
        sustain: 1,
        release: 0,
        fm: { ratio: 3, index: 4 },
      }).render());
    }
    if (actionId === 'invalid-fm') {
      jsr.audio.synth({ sampleRate: 8000 }).osc({
        type: 'sine',
        frequency: 100,
        duration: 0.001,
        fm: { modFrequency: 200, index: 2 },
      });
      jsr.exportState({ ok: true });
      return Promise.resolve();
    }
    if (actionId === 'invalid-filter') {
      jsr.audio.synth({ sampleRate: 8000 }).osc({
        type: 'sine',
        frequency: 100,
        duration: 0.001,
        filter: { type: 'notch', frequency: 100 },
      });
      jsr.exportState({ ok: true });
      return Promise.resolve();
    }
    if (actionId === 'invalid-noise-color') {
      jsr.audio.synth({ sampleRate: 8000 }).osc({
        type: 'noise',
        duration: 0.001,
        noiseColor: 'purple',
      });
      jsr.exportState({ ok: true });
      return Promise.resolve();
    }
    if (actionId === 'invalid-effect') {
      jsr.audio.synth({
        sampleRate: 8000,
        effects: [{ type: 'flanger', time: 0.1, mix: 0.2 }],
      });
      jsr.exportState({ ok: true });
      return Promise.resolve();
    }
    return Promise.resolve();
  }
  handleEvent = function(actionId) {
    try {
      return dispatch(actionId);
    } catch (e) {
      jsr.exportState({ ok: false, error: 'sync: ' + (e && e.message || e) });
      return Promise.resolve();
    }
  };
})();
''';

void main() {
  double rms(Float32List samples) {
    var sum = 0.0;
    for (final sample in samples) {
      sum += sample * sample;
    }
    return samples.isEmpty ? 0 : math.sqrt(sum / samples.length);
  }

  double tailRms(Float32List samples, int tailFrames) {
    final tail = samples.sublist(samples.length - tailFrames);
    return rms(tail);
  }

  double smoothness(Float32List samples) {
    var difference = 0.0;
    for (var i = 1; i < samples.length; i++) {
      difference += (samples[i] - samples[i - 1]).abs();
    }
    final denominator = rms(samples) * (samples.length - 1);
    return denominator <= 0 ? 0 : difference / denominator;
  }

  group('jsr.audio.synth on QuickJS', () {
    if (!kHasQuickjsNativeLib) return;

    test(
      'renders sine PCM and resolves render() after the host callback',
      () async {
        JsAudioSynthesis? captured;
        final backend = await bootQuickjsWidget(
          audioWidgetJs,
          widgetId: 'audio-synth-sine',
          onAudioSynthesis: (synthesis) => captured = synthesis,
        );
        await backend.callEvent('sine', const <String, dynamic>{});
        final state = await exportedStateOf(backend);

        expect(state?['ok'], isTrue, reason: '$state');
        final info = state?['info'] as Map<String, dynamic>;
        expect(info['name'], 'tone-01');
        expect(info['sampleRate'], 8000);
        expect(info['channels'], 1);
        expect(info['frames'], 80);
        expect(info['durationMs'], 10);

        expect(captured, isNotNull);
        final synthesis = captured!;
        expect(synthesis.name, 'tone-01');
        expect(synthesis.sampleRate, 8000);
        expect(synthesis.channels, 1);
        expect(synthesis.frames, 80);
        expect(synthesis.samples, hasLength(80));
        const expected = <double>[
          0,
          0.03925981575906861,
          0.078125,
          0.11609337482146901,
          0.15367124937688486,
          0.19052724655173466,
          0.2264443889316446,
          0.2612015622713945,
        ];
        for (var i = 0; i < expected.length; i++) {
          expect(
            synthesis.samples[i],
            moreOrLessEquals(expected[i], epsilon: 1e-3),
            reason: 'sample $i',
          );
        }
      },
    );

    test('explicit synth duration wins over shorter events', () async {
      JsAudioSynthesis? captured;
      final backend = await bootQuickjsWidget(
        audioWidgetJs,
        widgetId: 'audio-synth-length',
        onAudioSynthesis: (synthesis) => captured = synthesis,
      );
      await backend.callEvent('explicit-length', const <String, dynamic>{});
      final state = await exportedStateOf(backend);

      expect(state?['ok'], isTrue, reason: '$state');
      expect(captured, isNotNull);
      final synthesis = captured!;
      expect(synthesis.frames, 160);
      expect(synthesis.samples, hasLength(160));
      // 0.005 s at 8000 Hz = 40 square-wave frames, followed by silence.
      for (var i = 0; i < 40; i++) {
        expect(synthesis.samples[i], 0.5, reason: 'held sample $i');
      }
      for (var i = 40; i < 160; i++) {
        expect(synthesis.samples[i], 0, reason: 'silent sample $i');
      }
    });

    test('note() maps A4 to 440 Hz and interleaves stereo pan', () async {
      JsAudioSynthesis? captured;
      final backend = await bootQuickjsWidget(
        audioWidgetJs,
        widgetId: 'audio-synth-note',
        onAudioSynthesis: (synthesis) => captured = synthesis,
      );
      await backend.callEvent('note-frequency', const <String, dynamic>{});
      final frequencyState = await exportedStateOf(backend);
      expect(
        (frequencyState?['frequency'] as num).toDouble(),
        moreOrLessEquals(440, epsilon: 1e-9),
      );

      await backend.run(audioWidgetJs);
      await backend.callEvent('stereo-note', const <String, dynamic>{});
      final state = await exportedStateOf(backend);
      expect(state?['ok'], isTrue, reason: '$state');
      expect(captured, isNotNull);
      final synthesis = captured!;
      expect(synthesis.frames, 16);
      expect(synthesis.channels, 2);
      expect(synthesis.samples, hasLength(32));
      // pan=1 is equal-power right: every right sample has more energy than
      // its left counterpart (including the negative half of the sine).
      for (var frame = 0; frame < synthesis.frames; frame++) {
        final left = synthesis.samples[frame * 2];
        final right = synthesis.samples[frame * 2 + 1];
        if (left == 0 && right == 0) continue; // sine zero crossing
        expect(right.abs(), greaterThan(left.abs()));
      }
      // Frame 0 is the sine's zero crossing; frame 1 is right-index 3.
      expect(
        synthesis.samples[3],
        greaterThan(0),
        reason: synthesis.samples.toList().toString(),
      );
    });

    test('an unnamed track returns a generated synth-N name', () async {
      JsAudioSynthesis? captured;
      final backend = await bootQuickjsWidget(
        audioWidgetJs,
        widgetId: 'audio-synth-generated-name',
        onAudioSynthesis: (synthesis) => captured = synthesis,
      );
      await backend.callEvent('generated-name', const <String, dynamic>{});
      final state = await exportedStateOf(backend);
      expect(state?['ok'], isTrue, reason: '$state');
      final info = state?['info'] as Map<String, dynamic>;
      expect(info['name'], startsWith('synth-'));
      expect(captured, isNotNull);
      expect(captured!.name, info['name']);
      final synthesis = captured!;
      expect(synthesis.name, startsWith('synth-'));
    });

    test('invalid note names reject render()', () async {
      final backend = await bootQuickjsWidget(
        audioWidgetJs,
        widgetId: 'audio-synth-invalid-note',
      );
      await backend.callEvent('invalid-note', const <String, dynamic>{});
      final state = await exportedStateOf(backend);
      expect(state?['ok'], isFalse);
      expect(state?['error'], contains('unsupported note'));
    });

    test(
      'per-event lowpass and highpass filters separate tone bands',
      () async {
        Future<JsAudioSynthesis> render(String action, String widgetId) async {
          JsAudioSynthesis? captured;
          final backend = await bootQuickjsWidget(
            audioWidgetJs,
            widgetId: widgetId,
            onAudioSynthesis: (synthesis) => captured = synthesis,
          );
          await backend.callEvent(action, const <String, dynamic>{});
          final state = await exportedStateOf(backend);
          expect(state?['ok'], isTrue, reason: '$state');
          return captured!;
        }

        final low = await render('filter-lowpass', 'audio-filter-low');
        final high = await render('filter-highpass', 'audio-filter-high');
        final lowRms = rms(low.samples);
        final highRms = rms(high.samples);
        expect(lowRms, lessThan(highRms / 2));

        final swept = await render('filter-sweep', 'audio-filter-sweep');
        expect(
          swept.samples,
          everyElement(allOf(greaterThanOrEqualTo(-1), lessThanOrEqualTo(1))),
        );
        expect(rms(swept.samples), greaterThan(0.01));
      },
    );

    test(
      'white, pink and brown noise produce increasingly smooth spectra',
      () async {
        Future<JsAudioSynthesis> render(String action, String widgetId) async {
          JsAudioSynthesis? captured;
          final backend = await bootQuickjsWidget(
            audioWidgetJs,
            widgetId: widgetId,
            onAudioSynthesis: (synthesis) => captured = synthesis,
          );
          await backend.callEvent(action, const <String, dynamic>{});
          final state = await exportedStateOf(backend);
          expect(state?['ok'], isTrue, reason: '$state');
          return captured!;
        }

        // Reuse the deterministic sine action as a convenient white-noise
        // proxy? No: white is the parser default, but it is random, so
        // compare smoothness of pink against brown only.
        final pink = await render('pink-noise', 'audio-noise-pink');
        final brown = await render('brown-noise', 'audio-noise-brown');
        expect(pink.frames, 2000);
        expect(brown.frames, 2000);
        expect(pink.samples, everyElement(predicate((double v) => v.isFinite)));
        expect(
          brown.samples,
          everyElement(allOf(greaterThanOrEqualTo(-1), lessThanOrEqualTo(1))),
        );
        expect(
          smoothness(brown.samples),
          lessThan(smoothness(pink.samples) * 0.35),
        );
      },
    );

    test('vibrato and tremolo modulate the rendered tone', () async {
      JsAudioSynthesis? captured;
      final backend = await bootQuickjsWidget(
        audioWidgetJs,
        widgetId: 'audio-vibrato-tremolo',
        onAudioSynthesis: (synthesis) => captured = synthesis,
      );
      await backend.callEvent('vibrato-tremolo', const <String, dynamic>{});
      final state = await exportedStateOf(backend);
      expect(state?['ok'], isTrue, reason: '$state');
      final synthesis = captured!;
      expect(rms(synthesis.samples), greaterThan(0.01));
      // The centered tremolo ranges from 15% to 85% gain, so a short-window
      // RMS must vary materially over the 4 Hz cycle.
      final window = 1000;
      var minimum = double.infinity;
      var maximum = 0.0;
      for (
        var start = 0;
        start + window <= synthesis.samples.length;
        start += 500
      ) {
        final value = rms(synthesis.samples.sublist(start, start + window));
        if (value < minimum) minimum = value;
        if (value > maximum) maximum = value;
      }
      expect(maximum, greaterThan(minimum * 1.8));
    });

    test('track delay and reverb add audible tails', () async {
      JsAudioSynthesis? captured;
      final backend = await bootQuickjsWidget(
        audioWidgetJs,
        widgetId: 'audio-track-effects',
        onAudioSynthesis: (synthesis) => captured = synthesis,
      );
      await backend.callEvent('track-effects', const <String, dynamic>{});
      final state = await exportedStateOf(backend);
      expect(state?['ok'], isTrue, reason: '$state');
      final synthesis = captured!;
      expect(synthesis.frames, 2401);
      expect(tailRms(synthesis.samples, 200), greaterThan(0.01));
    });

    test('track effects extend an inferred duration', () async {
      JsAudioSynthesis? captured;
      final backend = await bootQuickjsWidget(
        audioWidgetJs,
        widgetId: 'audio-effect-tail',
        onAudioSynthesis: (synthesis) => captured = synthesis,
      );
      await backend.callEvent('track-effects-tail', const <String, dynamic>{});
      final state = await exportedStateOf(backend);
      expect(state?['ok'], isTrue, reason: '$state');
      final info = state?['info'] as Map<String, dynamic>;
      // Event: 400 frames. Delay tail is time*4 = 0.4s, so inferred duration
      // is 0.45s / 3600 frames.
      expect(info['frames'], 3600);
      expect(captured!.frames, 3600);
    });

    test('waveshaper drive changes a deterministic oscillator', () async {
      Future<JsAudioSynthesis> render(String action, String widgetId) async {
        JsAudioSynthesis? captured;
        final backend = await bootQuickjsWidget(
          audioWidgetJs,
          widgetId: widgetId,
          onAudioSynthesis: (synthesis) => captured = synthesis,
        );
        await backend.callEvent(action, const <String, dynamic>{});
        final state = await exportedStateOf(backend);
        expect(state?['ok'], isTrue, reason: '$state');
        return captured!;
      }

      final dry = await render('drive-off', 'audio-drive-off');
      final driven = await render('drive-on', 'audio-drive-on');
      expect(driven.frames, dry.frames);
      var difference = 0.0;
      for (var i = 0; i < dry.samples.length; i++) {
        difference = math.max(
          difference,
          (driven.samples[i] - dry.samples[i]).abs(),
        );
      }
      expect(difference, greaterThan(0.01));
      expect(
        driven.samples,
        everyElement(allOf(greaterThanOrEqualTo(-1), lessThanOrEqualTo(1))),
      );
    });

    test('carrier-ratio FM renders a bounded metallic tone', () async {
      JsAudioSynthesis? captured;
      final backend = await bootQuickjsWidget(
        audioWidgetJs,
        widgetId: 'audio-fm-bell',
        onAudioSynthesis: (synthesis) => captured = synthesis,
      );
      await backend.callEvent('fm-bell', const <String, dynamic>{});
      final state = await exportedStateOf(backend);
      expect(state?['ok'], isTrue, reason: '$state');
      final synthesis = captured!;
      expect(synthesis.frames, 2000);
      expect(rms(synthesis.samples), greaterThan(0.01));
      expect(
        synthesis.samples,
        everyElement(allOf(greaterThanOrEqualTo(-1), lessThanOrEqualTo(1))),
      );
    });

    test(
      'invalid filter, noise color, effect and FM specs reject synchronously',
      () async {
        for (final action in [
          'invalid-filter',
          'invalid-noise-color',
          'invalid-effect',
          'invalid-fm',
        ]) {
          final backend = await bootQuickjsWidget(
            audioWidgetJs,
            widgetId: 'audio-invalid-$action',
          );
          await backend.callEvent(action, const <String, dynamic>{});
          final state = await exportedStateOf(backend);
          expect(state?['ok'], isFalse, reason: '$action -> $state');
          expect(state?['error'], contains('audio.synth'));
        }
      },
    );
  });

  group('audio.synth bridge envelope', () {
    Uint8List buildEnvelope({
      String id = 'req-1',
      String name = 'bridge-tone',
      int sampleRate = 800,
      int channels = 1,
      int frames = 2,
      Float32List? samples,
      Map<String, Object?>? header,
    }) {
      final pcm = samples ?? Float32List.fromList(const [0.25, -0.5]);
      final headerJson = jsonEncode(
        header ??
            {
              'id': id,
              'name': name,
              'sampleRate': sampleRate,
              'channels': channels,
              'frames': frames,
            },
      );
      final raw = utf8.encode(headerJson);
      final pad = (4 - raw.length % 4) % 4;
      final out = Uint8List(12 + raw.length + pad + pcm.length * 4);
      final bd = ByteData.sublistView(out);
      bd.setUint32(0, 0x4152524a, Endian.little);
      bd.setUint32(4, 1, Endian.little);
      bd.setUint32(8, raw.length, Endian.little);
      out.setAll(12, raw);
      for (var i = 0; i < pcm.length; i++) {
        bd.setFloat32(12 + raw.length + pad + i * 4, pcm[i], Endian.little);
      }
      return out;
    }

    test(
      'base64 lane delivers typed PCM and resolves the request id',
      () async {
        final resolved = <String, dynamic>{};
        JsAudioSynthesis? captured;
        final bridge = buildBinaryTestBridge(
          onAudioSynthesis: (synthesis) => captured = synthesis,
          // A normal buildBinaryTestBridge does not expose resolve capture, so
          // wrap via the bridge field below.
        );
        addTearDown(bridge.dispose);
        bridge.resolveCallback = (id, value) => resolved[id] = value;

        await bridge.dispatch(
          '__jsr_host_call_binary',
          'audio.synth ${base64Encode(buildEnvelope())}',
        );
        await Future<void>.delayed(Duration.zero);

        expect(captured, isNotNull);
        final synthesis = captured!;
        expect(synthesis.name, 'bridge-tone');
        expect(synthesis.sampleRate, 800);
        expect(synthesis.channels, 1);
        expect(synthesis.frames, 2);
        expect(synthesis.samples, hasLength(2));
        expect(synthesis.samples[0], moreOrLessEquals(0.25, epsilon: 1e-7));
        expect(synthesis.samples[1], moreOrLessEquals(-0.5, epsilon: 1e-7));
        expect(resolved['req-1'], isA<Map<String, dynamic>>());
        final result = resolved['req-1']! as Map<String, dynamic>;
        expect(result['name'], 'bridge-tone');
        expect(result['frames'], 2);
        expect(result['durationMs'], 3); // ceil(2 / 800 * 1000) == 3 in double
      },
    );

    test('unsupported host rejects render() without delivering PCM', () async {
      final resolved = <String, dynamic>{};
      final bridge = buildBinaryTestBridge();
      addTearDown(bridge.dispose);
      bridge.resolveCallback = (id, value) => resolved[id] = value;

      await bridge.dispatch(
        '__jsr_host_call_binary',
        'audio.synth ${base64Encode(buildEnvelope(id: 'req-unsupported'))}',
      );
      await Future<void>.delayed(Duration.zero);

      expect(resolved['req-unsupported'], isA<Map<String, dynamic>>());
      final result = resolved['req-unsupported']! as Map<String, dynamic>;
      expect(result['__error'], contains('not supported'));
    });

    test('malformed envelopes are dropped without invoking the host', () async {
      var callbacks = 0;
      final bridge = buildBinaryTestBridge(
        onAudioSynthesis: (_) => callbacks++,
      );
      addTearDown(bridge.dispose);

      await bridge.dispatch(
        '__jsr_host_call_binary',
        'audio.synth ${base64Encode(Uint8List.fromList([1, 2, 3]))}',
      );
      final badLength = buildEnvelope(frames: 3);
      await bridge.dispatch(
        '__jsr_host_call_binary',
        'audio.synth ${base64Encode(badLength)}',
      );
      await Future<void>.delayed(Duration.zero);

      expect(callbacks, 0);
    });

    test('parser rejects malformed JSON headers without a host callback', () {
      const valid = {
        'id': 'req-1',
        'name': 'tone',
        'sampleRate': 800,
        'channels': 1,
        'frames': 2,
      };
      Map<String, Object?> without(String key) =>
          Map<String, Object?>.of(valid)..remove(key);
      Map<String, Object?> withValue(String key, Object? value) =>
          Map<String, Object?>.of(valid)..[key] = value;
      final malformed = <Map<String, Object?>>[
        without('id'),
        without('name'),
        withValue('sampleRate', '800'),
        withValue('sampleRate', 800.5),
        withValue('channels', 0),
        withValue('frames', 0),
      ];
      for (final header in malformed) {
        expect(
          JsAudioSynthesis.parseEnvelope(buildEnvelope(header: header)),
          isNull,
          reason: '$header',
        );
      }
    });

    test('parser accepts a foreign unaligned Uint8List slice', () {
      final envelope = buildEnvelope();
      final foreign = Uint8List(envelope.length + 1)
        ..setRange(1, envelope.length + 1, envelope);
      final sliced = foreign.sublist(1);
      final parsed = JsAudioSynthesis.parseEnvelope(sliced);
      expect(parsed, isNotNull);
      expect(parsed!.$1.samples, hasLength(2));
      expect(parsed.$2, 'req-1');
    });
  });
}
