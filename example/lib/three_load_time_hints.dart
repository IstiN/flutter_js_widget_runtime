// GENERATED FILE — DO NOT EDIT BY HAND.
// Regenerate with: node tool/three_example/gen_three_load_time_hints.mjs
// Source data: tool/three_example/three_first_present.json
// (time-to-first-presented-frame (firstPresentedMs probe), release screenshot harness with JSR_ISOLATE=1 (QuickJS isolate backend), macOS Release build. 2026-11-03 sweep of all 303 three-* widgets (results.tsv), re-verified on the post-reprepare tree for the 38 slow/never-presented ids plus anchors (results_b.tsv). ids in notInSidebar are not reachable from the catalog sidebar (three_example.dart ThreeExampleSelection.sidebarOrder) and are report-only. NA ids never presented within the gate (30s capture gate, 60s hard kill).)
//
// Entries exist ONLY for widgets measured above 5s (or never
// presenting); the catalog sidebar annotates exactly these. Widgets that later
// got their boot-time cost fixed drop out of the map on regeneration.

/// First-paint expectation for one slow catalog widget.
class ThreeLoadTimeHint {
  const ThreeLoadTimeHint(this.label, this.reason);

  /// Human label of the measured expectation, e.g. '≈8s' or 'no frame'.
  final String label;

  /// Root cause of the residual cost, e.g. 'collada XML parse in QuickJS'.
  final String reason;
}

/// Measured slow widgets (id -> expectation). Empty map == none above 5s.
const Map<String, ThreeLoadTimeHint>
kThreeLoadTimeHints = <String, ThreeLoadTimeHint>{
  'three-loader-collada-skinning': ThreeLoadTimeHint(
    'no frame',
    'collada XML DOM parse in QuickJS (2.2MB stormtrooper.dae) — was ~8s in the consolidation session, now exceeds the 30s first-frame gate',
  ),
  'three-renderer-pathtracer': ThreeLoadTimeHint(
    '≈28s',
    'R1 CPU path-tracing scene build + first-frame accumulation in QuickJS (2.8MB widget, 27.6s to first presented frame)',
  ),
  'three-animation-keyframes': ThreeLoadTimeHint(
    '≈7s',
    'LittlestTokyo.glb fetch + DRACO decode + GLTF processing in QuickJS (14.8MB)',
  ),
  'three-animation-skinning-ik': ThreeLoadTimeHint(
    '≈7s',
    'three skinned GLB models fetched + processed in QuickJS (12.4MB total)',
  ),
  'three-materials-toon': ThreeLoadTimeHint(
    '≈7s',
    '221-draw fur/toon scene: 214k triangles first frame compiled+submitted through R1 in QuickJS (6.8s)',
  ),
  'three-loader-bvh': ThreeLoadTimeHint(
    '≈6s',
    '764KB pirouette.bvh ASCII parse + skeleton bake in QuickJS',
  ),
  'three-points-dynamic': ThreeLoadTimeHint(
    '≈5s',
    'OBJ point-cloud parse/build in QuickJS (590KB female02.obj) before the first frame',
  ),
  'three-gpgpu-birds-gltf': ThreeLoadTimeHint(
    '≈5s',
    'GLB morph-target CPU bake + GPUComputationRenderer init lowered to CPU copies in R1',
  ),
};

ThreeLoadTimeHint? threeLoadTimeHint(String widgetId) =>
    kThreeLoadTimeHints[widgetId];
