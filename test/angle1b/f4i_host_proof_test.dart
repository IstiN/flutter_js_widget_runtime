import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../../tool/three/bench_1b.dart' show Shim;
import '../support/f4i_host_proof_harness.dart';
import '../support/f4i_png_codec.dart';

// E2E-HOST-YOCLIP-* / REG-HOST-CAPTURE (issue #8, segment F4i, AC15): the
// downstream frame-driven host proof on the native 1B lane. The proof
// program (tool/three/cinematic_host_proof/widget_f4i.js — the SAME text the
// web leg runs in Chrome) drives the pipeline through the public helper API
// only, renders a short transparent-overlay timeline, and captures it the
// three ways a downstream host does:
//
//   (a) preview            — sequential playback, grab at each checkpoint;
//   (b) arbitrary frame    — a fresh pipeline per checkpoint, the checkpoint
//                            frame captured once after rendering the history
//                            window CinematicHistory reconstruct(clock)
//                            returns for it (the stock AfterimagePass makes
//                            every frame temporal);
//   (c) PNG sequence       — sequential playback with captureFrame(clock) per
//                            frame; the capture barrier host (this harness)
//                            reads the presented ANGLE surface, encodes the
//                            straight-alpha PNG itself and writes
//                            frame_<nnnn>.png files.
//
// The web leg of the same proof: bash tool/three/cases_f4i.sh (CI job
// conformance). REG-HOST-CAPTURE runs without the capture host: the export
// must fail with the named error cinematic.notCapturable before any file is
// written.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final missing = Shim.resolveProblem();

  test('F4i png codec round trip (encode ∘ decode is the identity)', () {
    f4iPngSelfCheck();
  });

  test(
    'E2E-HOST-YOCLIP-1: preview, arbitrary-frame screenshot and PNG-sequence '
    'capture are hash-equal at the bloom, DOF and temporal checkpoints; the '
    'PNG-sequence files are on disk',
    () async {
      final staged = await stageF4iAfterimage();
      final (state, captureHost, _) = await runF4iOn1B(staged);
      final s = f4iState(state);

      final hashes = s['hashes'] as Map<String, dynamic>;
      final png = s['png'] as Map<String, dynamic>;
      final flags = s['flags'] as Map<String, dynamic>;
      final diffs = s['diffs'] as Map<String, dynamic>;
      final composite = s['composite'] as Map<String, dynamic>;

      expect(captureHost, isNotNull);
      expect(
        flags['ai_history_depth'],
        40,
        reason: 'the stock AfterimagePass declared its bounded window',
      );

      const checkpoints = <String, int>{'bloom': 8, 'dof': 16, 'temporal': 24};
      checkpoints.forEach((id, frame) {
        final prev = hashes['prev_$id'] as String;
        final shot = hashes['shot_$id'] as String;
        final pngHash = captureHost!.pngHashByFrame[frame];
        expect(
          shot,
          prev,
          reason: '$id: the arbitrary-frame screenshot equals the preview',
        );
        expect(
          pngHash,
          prev,
          reason: '$id: the decoded PNG-sequence file equals the preview frame',
        );
        expect(flags['shot_equals_prev_$id'], isTrue);
        expect(
          flags['png_equals_prev_$id'],
          isIn([null, true]),
          reason:
              'the web leg compares the PNG decode in-page; on this leg '
              'the file decode is verified above',
        );
      });

      // The PNG-sequence files: 25 real files with the frame number in the
      // name, all non-empty.
      final files = captureHost!.files;
      expect(png['files'], 25);
      expect(files.length, 25);
      for (var f = 0; f <= 24; f++) {
        final file = files.firstWhere(
          (p) => p.endsWith('frame_${f.toString().padLeft(4, '0')}.png'),
        );
        expect(
          File(file).lengthSync(),
          greaterThan(100),
          reason: 'frame_$f: a real PNG file was written',
        );
      }

      // No silent effect removal (E14): every named effect visibly changes
      // its checkpoint frame.
      expect(diffs['presence_bloom'], greaterThan(100));
      expect(diffs['presence_dof'], greaterThan(100));
      expect(
        diffs['presence_temporal'],
        greaterThan(0),
        reason: 'the temporal trail changes the frame above tolerance',
      );

      // The overlay composites over the dark and the light background: the
      // blend math holds, opaque stays opaque, the background lets both
      // backgrounds through, the overlay is visible on both.
      final checks = composite['checks'] as Map<String, dynamic>;
      expect(checks['blendDark'], isTrue);
      expect(checks['blendLight'], isTrue);
      expect(checks['opaqueStable'], isTrue);
      expect(checks['backgroundLive'], isTrue);
      expect(composite['overlayVisibleDark'], isTrue);
      expect(composite['overlayVisibleLight'], isTrue);
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );

  test(
    'E2E-HOST-YOCLIP-2: the temporal checkpoint is genuinely temporal — the '
    'direct seek renders the CinematicHistory window and a bare direct seek '
    'without it differs',
    () async {
      final staged = await stageF4iAfterimage();
      final (state, _, _) = await runF4iOn1B(staged);
      final s = f4iState(state);

      final flags = s['flags'] as Map<String, dynamic>;
      final hashes = s['hashes'] as Map<String, dynamic>;
      expect(
        flags['reconstruct_frames_temporal'],
        25,
        reason:
            'the reconstruction of frame 24 replays the declared '
            'window (frames 0..24)',
      );
      expect(flags['reconstruct_frames_bloom'], 9);
      expect(flags['reconstruct_frames_dof'], 17);
      expect(
        flags['temporal_direct_without_window_differs'],
        isTrue,
        reason:
            'a bare direct renderFrame(24) is NOT the seek protocol '
            'and must differ from the replayed window',
      );
      expect(hashes['prev_temporal'], isNotNull);
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );

  test(
    'REG-HOST-CAPTURE-1: without the capture capability the export fails '
    'with the named error cinematic.notCapturable before any file is '
    'written — never an effect-less capture',
    () async {
      final staged = await stageF4iAfterimage();
      final dir = '$kF4iDir/nocap_png';
      Directory(dir).createSync(recursive: true);
      // Clean slate: the run must not add a single file.
      for (final f in Directory(dir).listSync()) {
        f.deleteSync();
      }
      final (state, captureHost, _) = await runF4iOn1B(
        staged,
        noCapture: true,
        dir: dir,
      );
      expect(
        captureHost,
        isNull,
        reason: 'the capability is removed through the host configuration',
      );
      final err = state['exportError'] as Map<String, dynamic>?;
      expect(err, isNotNull, reason: 'the export must fail, not degrade');
      expect(err!['message'], contains('cinematic.notCapturable'));
      expect(state['filesWritten'], 0, reason: 'no capture result, no file');
      expect(
        Directory(
          dir,
        ).listSync().whereType<File>().where((f) => f.path.endsWith('.png')),
        isEmpty,
        reason: 'no PNG file may be written by the failed export',
      );
      // The render itself stayed a real render (the frames were drawn; only
      // the capture/export failed) — the error is the named one, not a
      // rendering failure.
      expect(state['error'], isNull);
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );
}
