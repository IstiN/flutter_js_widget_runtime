import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/media/js_media_controller.dart';
import 'package:js_widget_runtime/src/renderer/media/js_media_controller_mixin.dart';

class _FakeController extends JsMediaController {
  final positionCtl = StreamController<Duration>.broadcast();
  final durationCtl = StreamController<Duration>.broadcast();
  final playingCtl = StreamController<bool>.broadcast();
  final calls = <String>[];

  @override
  Stream<Duration> get positionStream => positionCtl.stream;

  @override
  Stream<Duration> get durationStream => durationCtl.stream;

  @override
  Stream<bool> get playingStream => playingCtl.stream;

  @override
  Future<void> play() async => calls.add('play');

  @override
  Future<void> pause() async => calls.add('pause');

  @override
  Future<void> seek(Duration position) async =>
      calls.add('seek:${position.inMilliseconds}');

  @override
  Future<void> dispose() async => calls.add('dispose');
}

class _Probe extends StatefulWidget {
  const _Probe({
    required this.controller,
    this.src = 'a.mp3',
    this.autoPlay = false,
    this.loop = false,
  });

  final _FakeController controller;
  final String src;
  final bool autoPlay;
  final bool loop;

  @override
  State<_Probe> createState() => _ProbeState();
}

class _ProbeState extends State<_Probe> with JsMediaControllerMixin {
  double? lastRatio;

  @override
  _FakeController createController(String src) => widget.controller;

  @override
  Stream<double?>? get aspectRatioStream =>
      widget.controller.playingCtl.stream.map((p) => p ? 1.5 : 1.0);

  @override
  void onAspectRatioChanged(double? value) => lastRatio = value;

  @override
  String get src => widget.src;

  @override
  bool get autoPlay => widget.autoPlay;

  @override
  bool get loop => widget.loop;

  @override
  Widget build(BuildContext context) =>
      Text('$position|$duration|$isPlaying', textDirection: TextDirection.ltr);
}

void main() {
  Future<_ProbeState> pump(
    WidgetTester tester,
    _Probe probe,
  ) async {
    await tester.pumpWidget(MaterialApp(home: probe));
    await tester.pump();
    return tester.state<_ProbeState>(find.byType(_Probe));
  }

  testWidgets('streams drive position/duration/playing state', (tester) async {
    final controller = _FakeController();
    final state = await pump(tester, _Probe(controller: controller));

    controller.durationCtl.add(const Duration(seconds: 10));
    controller.positionCtl.add(const Duration(seconds: 4));
    controller.playingCtl.add(true);
    await tester.pump();

    expect(state.duration, const Duration(seconds: 10));
    expect(state.position, const Duration(seconds: 4));
    expect(state.isPlaying, isTrue);
    // The aspect-ratio override fires through onAspectRatioChanged.
    expect(state.lastRatio, 1.5);
  });

  testWidgets('loop seeks to zero and autoPlay plays on init', (tester) async {
    final controller = _FakeController();
    await pump(
      tester,
      _Probe(controller: controller, autoPlay: true, loop: true),
    );
    expect(controller.calls, containsAllInOrder(['seek:0', 'play']));
  });

  testWidgets('toggle flips between play and pause', (tester) async {
    final controller = _FakeController();
    final state = await pump(tester, _Probe(controller: controller));

    await state.toggle();
    expect(controller.calls, ['play']);

    controller.playingCtl.add(true);
    await tester.pump();
    await state.toggle();
    expect(controller.calls, ['play', 'pause']);
  });

  testWidgets('seek maps the fraction onto the duration', (tester) async {
    final controller = _FakeController();
    final state = await pump(tester, _Probe(controller: controller));

    // No duration yet: seek is a no-op.
    await state.seek(0.5);
    expect(controller.calls, isEmpty);

    controller.durationCtl.add(const Duration(seconds: 10));
    await tester.pump();
    await state.seek(0.25);
    expect(controller.calls, ['seek:2500']);
  });

  testWidgets('didUpdateWidget initializes a controller arriving late', (
    tester,
  ) async {
    final controller = _FakeController();
    await tester.pumpWidget(
      MaterialApp(home: _Probe(controller: controller, src: '')),
    );
    await tester.pump();
    expect(tester.state<_ProbeState>(find.byType(_Probe)).controller, isNull);

    await tester.pumpWidget(MaterialApp(home: _Probe(controller: controller)));
    await tester.pump();
    expect(
      tester.state<_ProbeState>(find.byType(_Probe)).controller,
      isNotNull,
    );
  });

  testWidgets('dispose cancels subscriptions and disposes the controller', (
    tester,
  ) async {
    final controller = _FakeController();
    await pump(tester, _Probe(controller: controller));
    await tester.pumpWidget(const MaterialApp(home: SizedBox()));
    // sub.cancel() chains microtasks — let the real event loop settle.
    await tester.runAsync(() => Future<void>.delayed(Duration.zero));
    expect(controller.calls, contains('dispose'));
  });
}
