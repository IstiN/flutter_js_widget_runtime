// Generates `example/lib/three_load_time_hints.dart` from measured
// time-to-first-presented-frame data in `three_first_present.json`.
//
// The catalog sidebar (example/lib/three_example.dart) renders a muted
// "expected first paint" line for every widget whose measured first
// presented frame exceeds 5s; everything else stays annotation-free.
//
// Data flow: release screenshot harness sweep (JSR_ISOLATE=1,
// firstPresentedMs probe) -> results merged into three_first_present.json
// (this file is the committed source of truth) -> run this script to
// regenerate the Dart const map.
//
// Run from the repo root: node tool/three_example/gen_three_load_time_hints.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const DATA = 'tool/three_example/three_first_present.json';
const OUT = 'example/lib/three_load_time_hints.dart';
const THRESHOLD_MS = 5000;

const data = JSON.parse(readFileSync(DATA, 'utf8'));
const measurements = data.measurementsMs ?? {};
const neverPresented = data.neverPresented ?? [];
const reasons = data.reasons ?? {};
// Widgets not reachable in the catalog sidebar (ThreeExampleSelection.sidebarOrder)
// cannot render an annotation; they stay documented in the JSON only.
const notInSidebar = data.notInSidebar ?? [];
const excluded = new Set(notInSidebar);

const entries = [];
for (const [id, ms] of Object.entries(measurements)) {
  if (ms <= THRESHOLD_MS || excluded.has(id)) continue;
  const reason = reasons[id];
  if (!reason) {
    throw new Error(
      `${id} measured ${ms}ms (>5s) but has no documented reason in ${DATA}`,
    );
  }
  entries.push({ id, ms, label: `≈${Math.round(ms / 1000)}s`, reason });
}
for (const id of neverPresented) {
  if (excluded.has(id)) continue;
  const reason = reasons[id];
  if (!reason) {
    throw new Error(`${id} never presented but has no reason in ${DATA}`);
  }
  entries.push({ id, ms: Number.POSITIVE_INFINITY, label: 'no frame', reason });
}
entries.sort((a, b) => b.ms - a.ms);

const dartReason = (s) => `'${s.replaceAll("'", "\\'")}'`;
const body = entries
  .map((e) => `  '${e.id}': ThreeLoadTimeHint(${dartReason(e.label)}, ${dartReason(e.reason)}),`)
  .join('\n');
const out = `// GENERATED FILE — DO NOT EDIT BY HAND.
// Regenerate with: node tool/three_example/gen_three_load_time_hints.mjs
// Source data: tool/three_example/three_first_present.json
// (${data.comment ?? 'time-to-first-presented-frame measurements'})
//
// Entries exist ONLY for widgets measured above ${THRESHOLD_MS / 1000}s (or never
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
const Map<String, ThreeLoadTimeHint> kThreeLoadTimeHints = <String, ThreeLoadTimeHint>{
${body}
};

ThreeLoadTimeHint? threeLoadTimeHint(String widgetId) =>
    kThreeLoadTimeHints[widgetId];
`;

writeFileSync(OUT, out);
console.log(
  `wrote ${OUT}: ${entries.length} annotated widget(s) above ${THRESHOLD_MS / 1000}s ` +
    `of ${Object.keys(measurements).length} measured`,
);
