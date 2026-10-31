import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

final _fixtureAudio = base64Encode(List<int>.generate(64, (index) => index));

Future<String> _sourceWithAudioAssets(
  WidgetTester tester,
  String widgetId,
  List<String> urls,
) async {
  final source = await tester.runAsync(
    () => File('example/widgets/$widgetId/widget.js').readAsString(),
  );
  final registrations = urls
      .map(
        (url) =>
            'jsr.three.registerAsset(${jsonEncode(url)},'
            '{data:${jsonEncode(_fixtureAudio)},mime:"audio/mpeg"});',
      )
      .join('\n');
  return '$registrations\n$source';
}

Future<Object?> Function(String, Map<String, dynamic>) _audioHost(
  List<Map<String, dynamic>> calls,
) {
  return (name, args) async {
    if (name == 'three.asset') {
      return <String, Object>{'data': _fixtureAudio, 'mime': 'audio/mpeg'};
    }
    if (name != 'three.audio') throw ArgumentError(name);
    calls.add(Map<String, dynamic>.from(args));
    return <String, Object>{'ok': true};
  };
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'official WebAudio examples',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
    'webaudio_timing starts on a gesture and routes positional playback',
    (tester) async {
      final audioCalls = <Map<String, dynamic>>[];
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-webaudio-timing',
        instanceId: 'three-webaudio-timing-test',
        onHostCall: (name, args) async {
          if (name != 'three.audio') throw ArgumentError(name);
          audioCalls.add(Map<String, dynamic>.from(args));
          return <String, Object>{'ok': true};
        },
      );
      harness.backend.dispatchHostEvent('three.input:main', {
        'type': 'pointerdown',
        'pointerId': 1,
        'clientX': 100,
        'clientY': 100,
        'button': 0,
      });
      final ready = await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.submittedFrameCount >= 2 &&
            plan.draws.length >= 6 &&
            audioCalls.any((call) => call['action'] == 'play'),
      );

      harness.expectHealthy('webaudio_timing');
      expect(ready, isNotNull);
      expect(ready!.draws.length, greaterThanOrEqualTo(6));
      expect(audioCalls.first['action'], 'resume');
      final play = audioCalls.firstWhere((call) => call['action'] == 'play');
      expect(play['mime'], 'audio/mpeg');
      expect(play['data'], isA<String>());
      expect((play['data'] as String), isNotEmpty);
      expect(play['volume'], inInclusiveRange(0.0, 1.0));
      expect(play['balance'], inInclusiveRange(-1.0, 1.0));
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 120)),
  );

  testWidgets(
    'webaudio_orientation renders embedded textures and unlocks audio',
    (tester) async {
      final audioCalls = <Map<String, dynamic>>[];
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-webaudio-orientation',
        instanceId: 'three-webaudio-orientation-test',
        onHostCall: (name, args) async {
          if (name != 'three.audio') throw ArgumentError(name);
          audioCalls.add(Map<String, dynamic>.from(args));
          return <String, Object>{'ok': true};
        },
      );
      harness.backend.dispatchHostEvent('three.input:main', {
        'type': 'pointerdown',
        'pointerId': 1,
        'clientX': 160,
        'clientY': 120,
        'button': 0,
      });
      final ready = await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.submittedFrameCount >= 2 &&
            state.geometryUploadCount > 0 &&
            plan.draws.isNotEmpty,
        attempts: 600,
      );
      harness.expectHealthy('webaudio_orientation');
      expect(ready, isNotNull);
      expect(harness.state!.textureUploadCount, greaterThanOrEqualTo(4));

      harness.backend.dispatchHostEvent('three.input:main', {
        'type': 'pointerdown',
        'pointerId': 1,
        'clientX': 160,
        'clientY': 120,
        'button': 0,
      });
      await harness.pumpFrames(tester, 3);
      expect(audioCalls.map((call) => call['action']), contains('resume'));
      expect(
        harness.renderTrees.map((tree) => tree.toString()).join('\n'),
        isNot(contains('Widget error')),
      );
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 240)),
  );

  testWidgets(
    'webaudio_sandbox starts three media sources and renders the scene',
    (tester) async {
      final audioCalls = <Map<String, dynamic>>[];
      const audioUrls = [
        'sounds/358232_j_s_song.mp3',
        'sounds/376737_Skullbeatz___Bad_Cat_Maste.mp3',
        'sounds/Project_Utopia.mp3',
      ];
      final source = await _sourceWithAudioAssets(
        tester,
        'three-webaudio-sandbox',
        audioUrls,
      );
      final harness = await ThreeQuickjsExampleHarness.bootSource(
        tester,
        source: source,
        instanceId: 'three-webaudio-sandbox-test',
        onHostCall: _audioHost(audioCalls),
      );
      harness.backend.dispatchHostEvent('three.input:main', {
        'type': 'pointerdown',
        'pointerId': 1,
        'clientX': 160,
        'clientY': 120,
        'button': 0,
      });
      final ready = await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.submittedFrameCount >= 2 &&
            plan.draws.length >= 4 &&
            audioCalls.where((call) => call['action'] == 'play').length >= 4,
        attempts: 600,
      );

      harness.expectHealthy('webaudio_sandbox');
      expect(ready, isNotNull);
      expect(audioCalls.first['action'], 'resume');
      final plays = audioCalls.where((call) => call['action'] == 'play');
      expect(plays, hasLength(4));
      expect(plays.map((call) => call['sourceId']).toSet(), hasLength(4));
      final mediaPlays = plays.where(
        (call) => '${call['sourceId']}'.startsWith('media-'),
      );
      expect(mediaPlays, hasLength(3));
      expect(mediaPlays.every((call) => call['mime'] == 'audio/mpeg'), isTrue);
      expect(
        plays.singleWhere(
          (call) => !'${call['sourceId']}'.startsWith('media-'),
        )['mime'],
        'audio/wav',
      );
      expect(
        harness.engine.peekLogs().where(
          (entry) => (entry['msg'] as String).startsWith('[E]'),
        ),
        isEmpty,
      );
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 240)),
  );

  testWidgets(
    'webaudio_visualizer unlocks audio and renders its explicit R1 fallback',
    (tester) async {
      final audioCalls = <Map<String, dynamic>>[];
      final source = await _sourceWithAudioAssets(
        tester,
        'three-webaudio-visualizer',
        const ['sounds/376737_Skullbeatz___Bad_Cat_Maste.mp3'],
      );
      final harness = await ThreeQuickjsExampleHarness.bootSource(
        tester,
        source: source,
        instanceId: 'three-webaudio-visualizer-test',
        onHostCall: _audioHost(audioCalls),
      );
      harness.backend.dispatchHostEvent('three.input:main', {
        'type': 'pointerdown',
        'pointerId': 1,
        'clientX': 160,
        'clientY': 120,
        'button': 0,
      });
      final ready = await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.submittedFrameCount >= 2 &&
            plan.draws.isNotEmpty &&
            audioCalls.any((call) => call['action'] == 'play'),
        attempts: 600,
      );

      harness.expectHealthy('webaudio_visualizer');
      expect(ready, isNotNull);
      expect(ready!.draws, hasLength(1));
      expect(ready.draws.single.material.kind, JsThreeMaterialKind.meshBasic);
      expect(audioCalls.first['action'], 'resume');
      expect(audioCalls.any((call) => call['action'] == 'play'), isTrue);
      expect(harness.engine.exportedState!['media']['shaderFallbacks'], 1);
      final warnings = harness.engine.peekLogs().map((entry) => entry['msg']);
      expect(
        warnings.any((message) => message.contains('explicit static color')),
        isTrue,
      );
      expect(
        warnings.any((message) => message.contains('explicitly zero-filled')),
        isTrue,
      );
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 240)),
  );
}
