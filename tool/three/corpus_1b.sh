#!/bin/bash
# corpus_1b.sh — M4 corpus driver: sweep the starter corpus of REAL three.js
# r186 official examples through the full 1B stack (run_1b_corpus.dart) and
# headless Chrome WebGL2 (ref_1b_corpus.cjs), then apply the M3 tier logic
# (diff_1b.cjs). Per example: PASS_IDENTICAL / PASS_TOLERANCE / FAIL /
# SKIP(reason). Artifacts under /tmp/a1b_corpus/<id>/; machine table at
# /tmp/a1b_corpus/report.json.
#
# Run from repo root: bash tool/three/corpus_1b.sh [id ...]   (default: starter corpus)
set -u
cd "$(dirname "$0")/../.."

CORPUS_ROOT=/tmp/a1b_corpus
JSM=/tmp/three_pkg/node_modules/three/examples/jsm
mkdir -p "$CORPUS_ROOT"

# Starter corpus (diverse): animation, skinning/morph, instancing,
# lights/shadow, materials, bloom (local addon), custom shader, texture,
# lines, tonemapping.
DEFAULT_IDS="three-animation-keyframes three-animation-skinning-morph three-buffergeometry-instancing three-shadowmap-pointlight three-materials-toon three-postprocessing-unreal-bloom three-shader three-materials-texture-rotation three-buffergeometry-lines three-tonemapping"

IDS="${*:-$DEFAULT_IDS}"

if [ ! -f "$JSM/postprocessing/UnrealBloomPass.js" ]; then
  echo '[corpus] three@0.186.1 jsm addons not found; installing to /tmp/three_pkg'
  npm install three@0.186.1 --prefix /tmp/three_pkg --no-audit --no-fund >/dev/null 2>&1 || {
    echo '[corpus] npm install failed — addon examples will SKIP'
  }
fi

# report.json accumulation (rebuilt fresh each full sweep)
echo '[]' > "$CORPUS_ROOT/report.json"

# append_report <field-json-file> — merges a JSON object into report.json
append_report() {
  python3 - "$CORPUS_ROOT/report.json" "$1" <<'PYEOF'
import json, sys
path, entry_path = sys.argv[1], sys.argv[2]
r = json.load(open(path))
r.append(json.load(open(entry_path)))
json.dump(r, open(path, 'w'), indent=2)
PYEOF
}

print_row() {
  # id, tier, hash1b, hashweb, pct, note
  printf '%-38s %-16s %-12s %-12s %-9s %s\n' "$1" "$2" "$3" "$4" "$5" "$6"
}
print_row ID TIER HASH_1B HASH_WEB MATCH% NOTE
SEP=$(printf '%-38s %-16s %-12s %-12s %-9s %s' x x x x x x | tr 'x' '-')
echo "$SEP"

for ID in $IDS; do
  WIDGET_DIR="example/widgets/$ID"
  OUT="$CORPUS_ROOT/$ID"
  mkdir -p "$OUT"
  NOTE=""
  TIER="SKIP(bundle)"
  H1="-"; H2="-"; HW="-"; PCT="-"

  if [ ! -f "$WIDGET_DIR/official_module.js" ]; then
    TIER="SKIP(no-official-module)"
    NOTE="official_module.js missing (R1-glue-only widget?)"
    print_row "$ID" "$TIER" "$H1" "$H2" "$PCT" "$NOTE"
    printf '{"id":%s,"tier":%s,"note":%s}\n' "$(python3 -c "import json,sys;print(json.dumps(sys.argv[1]))" "$ID")" "$(python3 -c "import json,sys;print(json.dumps(sys.argv[1]))" "$TIER")" "$(python3 -c "import json,sys;print(json.dumps(sys.argv[1]))" "$NOTE")" > "$OUT/report_entry.json"
    append_report "$OUT/report_entry.json"
    continue
  fi

  # 1. bundle the upstream example module
  BUNDLE_OUT="$OUT/scene"
  BLINE=$(node tool/three/bundle_corpus_scene.mjs --id "$ID" --entry "$WIDGET_DIR/official_module.js" --out "$BUNDLE_OUT" --jsm "$JSM" 2>&1)
  BOK=$(printf '%s' "$BLINE" | python3 -c "import sys,json;d=json.loads(sys.stdin.read());print(d.get('ok'))" 2>/dev/null)
  if [ "$BOK" != "True" ]; then
    REASON=$(printf '%s' "$BLINE" | python3 -c "import sys,json;d=json.loads(sys.stdin.read());print(d.get('unresolvedImport') or str(d.get('error'))[:120])" 2>/dev/null)
    TIER="SKIP(bundle)"
    NOTE="$REASON"
    print_row "$ID" "$TIER" "$H1" "$H2" "$PCT" "$NOTE"
    python3 - "$ID" "$TIER" "$NOTE" > "$OUT/report_entry.json" <<'PYEOF'
import json, sys
print(json.dumps({'id': sys.argv[1], 'tier': sys.argv[2], 'note': sys.argv[3]}))
PYEOF
    append_report "$OUT/report_entry.json"
    continue
  fi

  # 2. 1B run (two fresh surfaces; deterministic hash pair)
  OUT_1B=$(dart run tool/three/run_1b_corpus.dart --id "$ID" --scene "$BUNDLE_OUT.scene.js" --widget-dir "$WIDGET_DIR" --out "$OUT" 2>"$OUT/1b.stderr")
  RC_1B=$?
  H1=$(printf '%s\n' "$OUT_1B" | sed -n 's/^CORPUS_1B_RUN id=[^ ]* run=1 hash=0x\([0-9a-f]*\) .*/\1/p')
  H2=$(printf '%s\n' "$OUT_1B" | sed -n 's/^CORPUS_1B_RUN id=[^ ]* run=2 hash=0x\([0-9a-f]*\) .*/\1/p')
  STATUS_1B=$(printf '%s\n' "$OUT_1B" | sed -n 's/^CORPUS_1B_STATUS //p' | tail -1)
  [ -n "$STATUS_1B" ] && printf '%s\n' "$STATUS_1B" > "$OUT/status_1b.json" || echo '{}' > "$OUT/status_1b.json"
  if [ "$RC_1B" != "0" ] || [ -z "$H1" ] || [ -z "$H2" ]; then
    TIER="FAIL(1b)"
    NOTE=$(python3 - "$OUT/status_1b.json" "$OUT/1b.stderr" <<'PYEOF'
import json, sys
try:
    d = json.load(open(sys.argv[1]))
    errs = d.get('errors') or []
    sf = d.get('strictFailure')
    s = sf or (errs[0] if errs else (d.get('scene') or {}).get('error')) or 'unknown (see 1b.stderr)'
except Exception:
    s = open(sys.argv[2]).read()[-300:] if len(sys.argv) > 2 else 'unknown'
print(str(s).split('\n')[0][:160])
PYEOF
)
    print_row "$ID" "$TIER" "$H1" "$H2" "$PCT" "$NOTE"
    python3 - "$ID" "$TIER" "$H1" "$OUT/status_1b.json" "$NOTE" > "$OUT/report_entry.json" <<'PYEOF'
import json, sys
print(json.dumps({'id': sys.argv[1], 'tier': sys.argv[2], 'hash1b': '0x' + sys.argv[3] if sys.argv[3] else None,
                  'status1b': json.load(open(sys.argv[4])), 'note': sys.argv[5]}))
PYEOF
    append_report "$OUT/report_entry.json"
    continue
  fi

  # 3. web reference
  OUT_WEB=$(node tool/three/ref_1b_corpus.cjs --id "$ID" --scene "$BUNDLE_OUT.scene.js" --widget-dir "$WIDGET_DIR" --out "$OUT" 2>"$OUT/web.stderr")
  RC_WEB=$?
  HW=$(printf '%s\n' "$OUT_WEB" | sed -n 's/^CORPUS_WEB_RUN id=[^ ]* hash=0x\([0-9a-f]*\) .*/\1/p')
  STATUS_WEB=$(printf '%s\n' "$OUT_WEB" | sed -n 's/^CORPUS_WEB_STATUS //p' | tail -1)
  [ -n "$STATUS_WEB" ] && printf '%s\n' "$STATUS_WEB" > "$OUT/status_web.json" || echo '{}' > "$OUT/status_web.json"
  if [ "$RC_WEB" != "0" ] || [ -z "$HW" ]; then
    TIER="FAIL(web)"
    NOTE=$(python3 - "$OUT/status_web.json" "$OUT/web.stderr" <<'PYEOF'
import json, sys
try:
    d = json.load(open(sys.argv[1]))
    s = d.get('error') or 'unknown (see web.stderr)'
except Exception:
    s = 'unknown'
print(str(s).split('\n')[0][:160])
PYEOF
)
    print_row "$ID" "$TIER" "$H1" "$H2" "$PCT" "$NOTE"
    python3 - "$ID" "$TIER" "$H1" "$OUT/status_1b.json" "$OUT/status_web.json" "$NOTE" > "$OUT/report_entry.json" <<'PYEOF'
import json, sys
print(json.dumps({'id': sys.argv[1], 'tier': sys.argv[2], 'hash1b': '0x' + sys.argv[3] if sys.argv[3] else None,
                  'status1b': json.load(open(sys.argv[4])), 'statusWeb': json.load(open(sys.argv[5])), 'note': sys.argv[6]}))
PYEOF
    append_report "$OUT/report_entry.json"
    continue
  fi

  # 4. compare (M3 tiers)
  if [ "$H1" = "$HW" ]; then
    TIER="PASS_IDENTICAL"
    PCT="100.0000"
    DIFF_LINE="identical"
  else
    DIFF_LINE=$(node tool/three/corpus/diff_1b.cjs "$OUT/1b_run1.rgba" "$OUT/web.rgba" 320 240)
    if [ $? -eq 0 ]; then TIER="PASS_TOLERANCE"; else TIER="FAIL(diff)"; fi
    PCT=$(printf '%s' "$DIFF_LINE" | sed -n 's/.* matchingPct=\([0-9.]*\) .*/\1/p')
  fi
  NOTE="$DIFF_LINE"
  print_row "$ID" "$TIER" "$H1" "$HW" "$PCT" "$NOTE"
  python3 - "$ID" "$TIER" "$H1" "$H2" "$HW" "$PCT" "$DIFF_LINE" "$OUT/status_1b.json" "$OUT/status_web.json" > "$OUT/report_entry.json" <<'PYEOF'
import json, sys
print(json.dumps({'id': sys.argv[1], 'tier': sys.argv[2],
                  'hash1b': '0x' + sys.argv[3], 'hash1bRun2': '0x' + sys.argv[4], 'hashWeb': '0x' + sys.argv[5],
                  'matchingPct': sys.argv[6], 'diff': sys.argv[7],
                  'status1b': json.load(open(sys.argv[8])), 'statusWeb': json.load(open(sys.argv[9]))}))
PYEOF
  append_report "$OUT/report_entry.json"
done

echo "$SEP"
echo "report: $CORPUS_ROOT/report.json"
