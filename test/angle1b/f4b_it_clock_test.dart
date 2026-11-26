import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../support/three_1b_engine.dart';

// IT-CLOCK-1 (issue #8, F4b, AC3): the clock is the one source of frame
// identity — the numeric subframe sequences of a sequential run, a direct
// seek and a reversed seek are bit-identical, and a declared CinematicHistory
// window reconstructs the exact ordered frame list a direct seek must
// re-render. Pure numbers (no GPU) through the real engine and the
// committed core bundle; runs on every host.
void main() {
  final bundle = File('assets/three/jsr_three_native.js').readAsStringSync();

  test('IT-CLOCK-1: sequential, direct and reversed clock plans produce '
      'bit-identical subframe sequences and the declared history window '
      'reconstructs exactly', () async {
    final (_, _, state) = await run1bWidgetEngine(
      _clockWidget,
      threeSource: bundle,
      realFacade: true,
    );
    expect(state?['error'], isNull, reason: '${state?['error']}');

    final seq = (state!['seqSubframes'] as List).cast<num>();
    final direct = (state['directSubframes'] as List).cast<num>();
    final rev = (state['revSubframes'] as List).cast<num>();

    // direct seek: the last frame's subframes equal the sequential tail
    expect(direct.length, 4, reason: 'samples=4 for frame 8');
    for (var i = 0; i < 4; i++) {
      expect(
        direct[i],
        seq[seq.length - 4 + i],
        reason: 'sequential tail vs direct seek, subframe $i',
      );
    }
    // reversed seek back to frame 0: equals the sequential head
    expect(rev.length, 4);
    for (var i = 0; i < 4; i++) {
      expect(
        rev[i],
        seq[i],
        reason: 'sequential head vs reversed, subframe $i',
      );
    }

    // declared history window: afterimage with a 4-frame window at
    // epoch 3 — a direct seek to frame 9 must re-render [6, 7, 8, 9]
    final reconstruct = state['reconstruct'] as Map<String, dynamic>;
    expect(reconstruct['epoch'], 3);
    expect(reconstruct['frames'], [6, 7, 8, 9]);
    // an undeclared history reconstructs nothing (no temporal pass
    // declared a window — the component's contract)
    final empty = state['reconstructEmpty'] as Map<String, dynamic>;
    expect(empty['frames'], isEmpty);
    expect(state['emptyDepth'], 0);
    // declared depth is reported
    expect(state['depth'], 4);
  });
}

const String _clockWidget = '''
var results = {};
try {
  var cin = jsr.three.cinematic;
  var clock = cin.createFrameClock({ fps: 24, shutter: 0.5, samples: 4, epoch: 7 });
  function subframeTimes(st) {
    return st.subframes.map(function (s) { return s.t; });
  }
  // sequential plan: full states for frames 0..8
  var seq = [];
  for (var f = 0; f <= 8; f++) {
    var st = clock.state(f);
    for (var i = 0; i < st.subframes.length; i++) seq.push(st.subframes[i].t);
  }
  results.seqSubframes = seq;
  // direct seek: state(8) alone
  results.directSubframes = subframeTimes(clock.state(8));
  // reversed plan: states 8..0, keep only the frame-0 subframes
  var revSt = null;
  for (var r = 8; r >= 0; r--) revSt = clock.state(r);
  results.revSubframes = subframeTimes(revSt);
  // clock fields are carried verbatim
  var st5 = clock.state(5);
  results.clockFields = { frame: st5.frame, fps: st5.fps, shutter: st5.shutter,
    samples: st5.samples, epoch: st5.epoch };

  // declared history window (F4c's temporal passes declare on this)
  var history = new cin.CinematicHistory(3);
  results.depth = history.declare({ pass: 'afterimage', frames: 4 });
  results.reconstruct = history.reconstruct({ frame: 9 });
  var empty = new cin.CinematicHistory(0);
  results.reconstructEmpty = empty.reconstruct({ frame: 9 });
  results.emptyDepth = empty.depth();
  jsr.exportState(results);
} catch (e) {
  results.error = String((e && e.message) || e);
  jsr.exportState(results);
}
''';
