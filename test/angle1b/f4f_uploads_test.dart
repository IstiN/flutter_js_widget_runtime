import 'package:flutter_test/flutter_test.dart';

import '../../tool/three/bench_1b.dart' show Shim;
import '../../tool/three/cinematic_perf_1b.dart';

// F4f structural checks (issue #8, REG-UPLOADS; host numbers of
// PERF-CINEMATIC-* are the bench step's matrix, never gated here).
//
// REG-UPLOADS on the REAL 1B stack (corpus wire: QuickJS -> webgl2 facade ->
// ANGLE): after a quiet warm-up, measured cinematic frames neither compile
// nor link nor upload ANY texture per frame — the unchanged LUT and scene
// textures included; a direct seek to another frame, a resize (down and up)
// and a resetHistory must not recompile or re-upload the unchanged assets
// (render-target re-allocation on resize is attributed separately and only
// its asset-vs-target split is gated). Production preset at 720p: the
// heaviest named preset; draft and deterministic-export are covered by the
// matrix bench step (same scene, same counters).
void main() {
  // corpus.Shim opens the staged dylib path; the resolve probe of the bench
  // Shim covers the same candidates (env override + staged locations).
  final missing = Shim.resolveProblem();
  test(
    'REG-UPLOADS: steady cinematic frames do not compile or re-upload unchanged assets',
    () async {
      final cell = await run1bCinematicCell(
        const PerfCellSpec('production', 1280, 720),
        scenePath: 'tool/three/perf/perf_scene.js',
        windows: 1,
        frames: 120,
      );
      // ignore: avoid_print
      print(
        'F4f REG-UPLOADS cell: '
        'warmup=${cell['warmup']} frames=${cell['frames']} '
        'compiles/frame=${cell['compilesPerFrameMax']} '
        'links/frame=${cell['linksPerFrameMax']} '
        'uploads/frame=${cell['uploadsPerFrameMax']} '
        'structural=${cell['structuralOk']}',
      );
      expect(
        cell['structuralOk'],
        isTrue,
        reason: 'structural counters must stay clean: $cell',
      );
      expect(cell['compilesPerFrameMax'], 0);
      expect(cell['linksPerFrameMax'], 0);
      expect(cell['uploadsPerFrameMax'], 0);
      expect((cell['steady'] as Map)['assetUploads'], 0);
      // The events carry their own verdicts (seek / resize / resetHistory).
      for (final entry in (cell['events'] as Map).entries) {
        expect(
          (entry.value as Map)['ok'],
          isTrue,
          reason:
              'event ${entry.key} recompiled or re-uploaded unchanged assets',
        );
      }
      // Counter honesty: wrapper totals equal the facade counters.
      expect(cell['countersAgree'], isTrue);
      // No GL object leak after dispose: the live counts return to the
      // session baseline (fresh context, near zero at steady start).
      final steadyObjects = (cell['objects'] as Map)['steady'] as Map;
      final afterDispose = (cell['objects'] as Map)['afterDispose'] as Map;
      for (final key in steadyObjects.keys) {
        expect(
          (afterDispose[key] ?? 0) as num,
          lessThanOrEqualTo((steadyObjects[key] ?? 0) as num),
          reason: 'object type $key leaked across dispose',
        );
      }
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 5)),
  );
}
