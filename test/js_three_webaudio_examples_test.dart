import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

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
}
