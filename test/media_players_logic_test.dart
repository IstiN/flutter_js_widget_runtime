import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  if (!hasQuickjsNativeLib) return;

  group('audio-player widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget('audio-player');
      backend = h.backend;
    });

    tearDown(() => backend.dispose());

    test('initial state is paused on track 0', () {
      expect(h.state!['track'], 0);
      expect(h.state!['title'], 'SoundHelix Song 1');
      expect(h.state!['playing'], isFalse);
      expect(h.state!['volume'], 0.8);
      expect(h.state!['loop'], isFalse);
    });

    test('play_pause toggles playing', () async {
      await h.callEvent('play_pause');
      expect(h.state!['playing'], isTrue);
      await h.callEvent('play_pause');
      expect(h.state!['playing'], isFalse);
    });

    test('next/prev move through the playlist and wrap', () async {
      await h.callEvent('next');
      expect(h.state!['track'], 1);
      await h.callEvent('prev');
      expect(h.state!['track'], 0);
      await h.callEvent('prev'); // wraps to the last track
      expect(h.state!['track'], 2);
      await h.callEvent('next'); // wraps back to the first
      expect(h.state!['track'], 0);
    });

    test('select:<i> selects and starts playing', () async {
      await h.callEvent('select:2');
      expect(h.state!['track'], 2);
      expect(h.state!['title'], 'SoundHelix Song 3');
      expect(h.state!['playing'], isTrue);
    });

    test('volume clamps to 0..1', () async {
      await h.callEvent('volume', payload: {'value': 1.4});
      expect(h.state!['volume'], 1.0);
      await h.callEvent('volume', payload: {'value': -0.2});
      expect(h.state!['volume'], 0.0);
    });

    test('toggle_loop flips loop flag', () async {
      await h.callEvent('toggle_loop', payload: {'value': true});
      expect(h.state!['loop'], isTrue);
      await h.callEvent('toggle_loop', payload: {'value': false});
      expect(h.state!['loop'], isFalse);
    });
  });

  group('video-player widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget('video-player');
      backend = h.backend;
    });

    tearDown(() => backend.dispose());

    test('initial state is Big Buck Bunny with contain fit', () {
      expect(h.state!['video'], 0);
      expect(h.state!['title'], 'Big Buck Bunny');
      expect(h.state!['fit'], 'contain');
    });

    test('select_video accepts scalar and list payloads', () async {
      await h.callEvent('select_video', payload: {'value': '2'});
      expect(h.state!['video'], 2);
      expect(h.state!['title'], 'Sintel');
      await h.callEvent('select_video', payload: {'value': ['1']});
      expect(h.state!['video'], 1);
      expect(h.state!['title'], 'Elephants Dream');
    });

    test('select_fit validates against known fits', () async {
      await h.callEvent('select_fit', payload: {'value': 'cover'});
      expect(h.state!['fit'], 'cover');
      await h.callEvent('select_fit', payload: {'value': 'bogus'});
      expect(h.state!['fit'], 'cover'); // unchanged
    });
  });
}
