import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'support/jsr_quickjs_harness.dart';

void main() {
  group('audio-synth-demo example', () {
    if (!kHasQuickjsNativeLib) return;

    test('renders the full showcase scene through onAudioSynthesis', () async {
      final widgetJs = File(
        'example/widgets/audio-synth-demo/widget.js',
      ).readAsStringSync();
      JsAudioSynthesis? captured;
      final backend = await bootQuickjsWidget(
        widgetJs,
        widgetId: 'audio-synth-demo-example',
        onAudioSynthesis: (synthesis) => captured = synthesis,
      );
      await backend.callEvent('render_scene', const <String, dynamic>{});
      final state = await exportedStateOf(backend);

      expect(state?['status'], 'ready', reason: '$state');
      final info = state?['info'] as Map<String, dynamic>;
      expect(info['name'], 'audio-synth-demo');
      expect(info['sampleRate'], 44100);
      expect(info['channels'], 2);
      expect(info['frames'], 8 * 44100);
      expect(info['durationMs'], 8000);
      expect(captured, isNotNull);
      expect(captured!.samples.length, 8 * 44100 * 2);
    });
  });
}
