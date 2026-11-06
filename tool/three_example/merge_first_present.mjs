// Builds the sorted first-present table from the sweep results and merges
// measurements into tool/three_example/three_first_present.json.
// Usage: node tool/three_example/merge_first_present.mjs /tmp/jsr-fp-sweep/results.tsv [--write]
import { readFileSync, writeFileSync } from 'node:fs';

const tsv = readFileSync(process.argv[2], 'utf8').trimEnd().split('\n');
const rows = [];
for (const line of tsv) {
  const m = line.match(/^(three-\S+)\s+(?:firstPresentedMs=(\d+)|hard-timeout-60s|no-firstPresent-line)\s*(?:rc=(\d+))?$/);
  if (!m) { console.error('SKIP unparsed:', line); continue; }
  const [, id, msStr, rc] = m;
  rows.push({ id, ms: msStr ? Number(msStr) : null, rc: rc ? Number(rc) : null, line });
}
// Sweep covers every id exactly once (sweep.sh skips already-recorded ids).
const seen = new Set(rows.map((r) => r.id));
const dupes = rows.filter((r, i) => rows.findIndex((x) => x.id === r.id) !== i);
if (dupes.length) console.error('DUPLICATE ids (first kept):', dupes.map((d) => d.id));

const sorted = [...rows]
  .sort((a, b) => (b.ms ?? 1e12) - (a.ms ?? 1e12) || a.id.localeCompare(b.id));
console.log('# sorted desc; NA = never presented within the gate (30s capture gate / 60s hard kill)');
for (const r of sorted) {
  const label = r.ms === null ? 'NA' : String(r.ms);
  const note = r.ms === null ? (r.line.includes('hard-timeout') ? ' (60s kill)' : ' (30s gate)') : '';
  console.log(`${label.padStart(6)}ms  ${r.id}${note}`);
}
const above5 = sorted.filter((r) => r.ms !== null && r.ms > 5000);
console.log(`# total=${rows.length} >5s=${above5.length} neverPresented=${sorted.filter((r) => r.ms === null).length}`);

if (process.argv.includes('--write')) {
  const dataPath = 'tool/three_example/three_first_present.json';
  const data = JSON.parse(readFileSync(dataPath, 'utf8'));
  for (const r of rows) {
    if (r.ms === null) continue;
    data.measurementsMs[r.id] = r.ms;
  }
  // neverPresented: union of NA ids from this results file and the JSON.
  const na = sorted.filter((r) => r.ms === null).map((r) => r.id);
  data.neverPresented = [...new Set([...(data.neverPresented ?? []), ...na])].sort();
  data.measuredAt = new Date().toISOString().slice(0, 10);
  writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
  console.log(`# wrote ${dataPath}`);
}
