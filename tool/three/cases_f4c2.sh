#!/bin/bash
# cases_f4c2.sh — E2E-FINISH / REG-VISUAL-FINISH driver (issue #8 AC5, F4c2):
# the nine cinematic finishing passes on the 1B stack, each proven by the
# stock r186 example (bundled from the prepared widget dir, unchanged) or —
# when no stock example exists at the pin — by a slice case scene under
# tool/three/cases_f4c2/<id>/scene.module.js that uses the stock pass/shader
# file unchanged. Same mechanics as corpus_1b.sh: run_1b_corpus.dart
# (facade -> G1 -> ANGLE, two fresh surfaces) vs ref_1b_corpus.cjs (bare
# Chrome WebGL2, E2E-WEB direct probe), diff_1b.cjs tiers
# (PASS_IDENTICAL / PASS_TOLERANCE / FAIL).
#
# Slice-local acceptance: tool/three/cases_f4c2/accepted_tiers.json maps
# every id to its accepted tier ("exact", "tolerance", "documented-limit" —
# the deviation is documented in docs/angle_1b.md). Exits 1 when a gated id
# measures outside its tier or the direct-web probe fails.
#
# Run from repo root: bash tool/three/cases_f4c2.sh [id ...]
set -u
cd "$(dirname "$0")/../.."

CORPUS_ROOT=/tmp/a1b_corpus
JSM=/tmp/three_pkg/node_modules/three/examples/jsm
ACCEPTED_FILE=tool/three/cases_f4c2/accepted_tiers.json
CASES_DIR=tool/three/cases_f4c2
export JSR_WEBGL_REF_CHANNEL="${JSR_WEBGL_REF_CHANNEL:-chrome}"
mkdir -p "$CORPUS_ROOT"

# Same one-time installs as corpus_1b.sh (playwright, esbuild, three pkg).
if [ ! -d /tmp/node_modules/playwright ]; then
  echo '[f4c2] playwright not found; installing to /tmp/node_modules'
  npm install playwright --prefix /tmp --no-audit --no-fund >/dev/null 2>&1 || {
    echo '[f4c2] playwright install failed — web legs will FAIL'
  }
fi
if [ ! -d tool/three/node_modules/esbuild ]; then
  echo '[f4c2] tool/three deps missing; running npm ci --prefix tool/three'
  npm ci --prefix tool/three --no-audit --no-fund >/dev/null 2>&1 || {
    echo '[f4c2] npm ci --prefix tool/three failed — scenes will SKIP(bundle)'
  }
fi
if [ ! -f "$JSM/postprocessing/UnrealBloomPass.js" ]; then
  echo '[f4c2] three@0.186.1 jsm addons not found; installing to /tmp/three_pkg'
  npm install three@0.186.1 --prefix /tmp/three_pkg --no-audit --no-fund >/dev/null 2>&1 || {
    echo '[f4c2] npm install failed — scenes will SKIP'
  }
fi

DEFAULT_IDS="three-postprocessing-smaa cases-f4c2-lines three-postprocessing-fxaa three-postprocessing-3dlut cases-f4c2-lut cases-f4c2-film cases-f4c2-vignette cases-f4c2-msaa three-postprocessing-unreal-bloom-selective three-postprocessing-ssao three-postprocessing-gtao"
IDS="${*:-$DEFAULT_IDS}"

accepted_for() {
  python3 - "$ACCEPTED_FILE" "$1" <<'PYEOF'
import json, sys
try:
    d = json.load(open(sys.argv[1]))
    e = d.get(sys.argv[2])
    print((e or {}).get('tier', ''))
except Exception:
    print('')
PYEOF
}

append_report() {
  python3 - "$CORPUS_ROOT/report.json" "$1" <<'PYEOF'
import json, sys
try:
    r = json.load(open(sys.argv[1]))
except Exception:
    r = []
r.append(json.load(open(sys.argv[2])))
json.dump(r, open(sys.argv[1], 'w'), indent=2)
PYEOF
}

gate_verdict() {
  GATED_TIER=$(accepted_for "$1")
  case "$GATED_TIER" in
    '') GATED_V="OK"; GATED_NOTE="(ungated)"; return ;;
    exact)            case "$2" in PASS_IDENTICAL) GATED_V="OK"; GATED_NOTE="accepted:$GATED_TIER"; return ;; esac ;;
    tolerance)        case "$2" in PASS_IDENTICAL|PASS_TOLERANCE) GATED_V="OK"; GATED_NOTE="accepted:$GATED_TIER"; return ;; esac ;;
    documented-limit) GATED_V="OK"; GATED_NOTE="accepted:documented-limit (docs/angle_1b.md)"; return ;;
  esac
  GATED_V="FAIL"
  GATED_NOTE="measured $2 but accepted $GATED_TIER"
}

print_row() {
  printf '%-42s %-16s %-12s %-12s %-9s %s\n' "$1" "$2" "$3" "$4" "$5" "$6"
}
SEP=$(printf '%-42s %-16s %-12s %-12s %-9s %s' x x x x x x | tr 'x' '-')
print_row ID TIER HASH_1B HASH_WEB MATCH% NOTE
echo "$SEP"

TOTAL=0; N_EXACT=0; N_TOL=0; N_LIMIT=0; N_FAIL=0; N_SKIP=0; GATE_FAIL=0; DIRECT_FAIL=0

for ID in $IDS; do
  TOTAL=$((TOTAL+1))
  OUT="$CORPUS_ROOT/$ID"
  mkdir -p "$OUT"
  NOTE=""
  TIER="SKIP(bundle)"
  H1="-"; H2="-"; HW="-"; PCT="-"

  # Scene source: prepared widget official module (stock example) or a
  # slice case scene; widget dir doubles as the asset host dir. Case ids
  # (`cases-f4c2-<name>`) map to `tool/three/cases_f4c2/<name>/`.
  CASE_NAME="${ID#cases-f4c2-}"
  if [ -f "$CASES_DIR/$CASE_NAME/scene.module.js" ]; then
    WIDGET_DIR="$CASES_DIR/$CASE_NAME"
    ENTRY="$WIDGET_DIR/scene.module.js"
  elif [ -f "example/widgets/$ID/official_module.js" ]; then
    WIDGET_DIR="example/widgets/$ID"
    ENTRY="$WIDGET_DIR/official_module.js"
  else
    TIER="SKIP(no-scene)"
    NOTE="no case scene and no official_module.js"
    gate_verdict "$ID" "$TIER"
    [ "$GATED_V" = "FAIL" ] && GATE_FAIL=$((GATE_FAIL+1))
    N_SKIP=$((N_SKIP+1))
    print_row "$ID" "$TIER" "$H1" "$H2" "$PCT" "$NOTE $GATED_NOTE"
    python3 - "$ID" "$TIER" "$NOTE" "$GATED_TIER" > "$OUT/report_entry.json" <<'PYEOF'
import json, sys
print(json.dumps({'id': sys.argv[1], 'tier': sys.argv[2], 'note': sys.argv[3], 'acceptedTier': sys.argv[4] or None}))
PYEOF
    append_report "$OUT/report_entry.json"
    continue
  fi

  BUNDLE_OUT="$OUT/scene"
  BLINE=$(node tool/three/bundle_corpus_scene.mjs --id "$ID" --entry "$ENTRY" --out "$BUNDLE_OUT" --jsm "$JSM" 2>&1)
  BOK=$(printf '%s' "$BLINE" | python3 -c "import sys,json;d=json.loads(sys.stdin.read());print(d.get('ok'))" 2>/dev/null)
  if [ "$BOK" != "True" ]; then
    REASON=$(printf '%s' "$BLINE" | python3 -c "import sys,json;d=json.loads(sys.stdin.read());print(d.get('unresolvedImport') or str(d.get('error'))[:120])" 2>/dev/null)
    [ -z "$REASON" ] && REASON=$(printf '%s' "$BLINE" | tail -c 140 | tr '\n' ' ')
    TIER="SKIP(bundle)"
    NOTE="$REASON"
    gate_verdict "$ID" "$TIER"
    [ "$GATED_V" = "FAIL" ] && GATE_FAIL=$((GATE_FAIL+1))
    N_SKIP=$((N_SKIP+1))
    print_row "$ID" "$TIER" "$H1" "$H2" "$PCT" "$NOTE $GATED_NOTE"
    python3 - "$ID" "$TIER" "$NOTE" "$GATED_TIER" > "$OUT/report_entry.json" <<'PYEOF'
import json, sys
print(json.dumps({'id': sys.argv[1], 'tier': sys.argv[2], 'note': sys.argv[3], 'acceptedTier': sys.argv[4] or None}))
PYEOF
    append_report "$OUT/report_entry.json"
    continue
  fi
  SCENE_PATH="$BUNDLE_OUT.scene.js"

  # 1B leg (two fresh surfaces; deterministic hash pair).
  OUT_1B=$(dart run tool/three/run_1b_corpus.dart --id "$ID" --scene "$SCENE_PATH" --widget-dir "$WIDGET_DIR" --out "$OUT" 2>"$OUT/1b.stderr")
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
    gate_verdict "$ID" "$TIER"
    [ "$GATED_V" = "FAIL" ] && GATE_FAIL=$((GATE_FAIL+1))
    if [ "$GATED_TIER" = "documented-limit" ]; then N_LIMIT=$((N_LIMIT+1)); else N_FAIL=$((N_FAIL+1)); fi
    print_row "$ID" "$TIER" "$H1" "$H2" "$PCT" "$NOTE $GATED_NOTE"
    python3 - "$ID" "$TIER" "$H1" "$OUT/status_1b.json" "$NOTE" "$GATED_TIER" > "$OUT/report_entry.json" <<'PYEOF'
import json, sys
print(json.dumps({'id': sys.argv[1], 'tier': sys.argv[2], 'hash1b': '0x' + sys.argv[3] if sys.argv[3] else None,
                  'status1b': json.load(open(sys.argv[4])), 'note': sys.argv[5], 'acceptedTier': sys.argv[6] or None}))
PYEOF
    append_report "$OUT/report_entry.json"
    continue
  fi

  # Web reference leg (bare Chrome page — the E2E-WEB direct-web probe).
  OUT_WEB=$(node tool/three/ref_1b_corpus.cjs --id "$ID" --scene "$SCENE_PATH" --widget-dir "$WIDGET_DIR" --out "$OUT" 2>"$OUT/web.stderr")
  RC_WEB=$?
  HW=$(printf '%s\n' "$OUT_WEB" | sed -n 's/^CORPUS_WEB_RUN id=[^ ]* hash=0x\([0-9a-f]*\) .*/\1/p')
  STATUS_WEB=$(printf '%s\n' "$OUT_WEB" | sed -n 's/^CORPUS_WEB_STATUS //p' | tail -1)
  [ -n "$STATUS_WEB" ] && printf '%s\n' "$STATUS_WEB" > "$OUT/status_web.json" || echo '{}' > "$OUT/status_web.json"
  DIRECT_OK=$(python3 - "$OUT/status_web.json" <<'PYEOF'
import json, sys
try:
    d = json.load(open(sys.argv[1])).get('direct') or {}
except Exception:
    d = {}
if not (d.get('no1bLane') is True and d.get('barePage') is True):
    print('NO'); raise SystemExit
nc = d.get('nativeContext', False)
if nc is not True and nc is not None:
    print('NO'); raise SystemExit
print('YES')
PYEOF
)
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
    gate_verdict "$ID" "$TIER"
    [ "$GATED_V" = "FAIL" ] && GATE_FAIL=$((GATE_FAIL+1))
    if [ "$GATED_TIER" = "documented-limit" ]; then N_LIMIT=$((N_LIMIT+1)); else N_FAIL=$((N_FAIL+1)); fi
    print_row "$ID" "$TIER" "$H1" "$H2" "$PCT" "$NOTE $GATED_NOTE"
    python3 - "$ID" "$TIER" "$H1" "$OUT/status_1b.json" "$OUT/status_web.json" "$NOTE" "$GATED_TIER" > "$OUT/report_entry.json" <<'PYEOF'
import json, sys
print(json.dumps({'id': sys.argv[1], 'tier': sys.argv[2], 'hash1b': '0x' + sys.argv[3] if sys.argv[3] else None,
                  'status1b': json.load(open(sys.argv[4])), 'statusWeb': json.load(open(sys.argv[5])), 'note': sys.argv[6],
                  'acceptedTier': sys.argv[7] or None}))
PYEOF
    append_report "$OUT/report_entry.json"
    continue
  fi
  if [ "$DIRECT_OK" != "YES" ]; then
    DIRECT_FAIL=$((DIRECT_FAIL+1))
    TIER="FAIL(web-direct)"
    NOTE="E2E-WEB direct probe failed: $OUT/status_web.json"
    gate_verdict "$ID" "$TIER"
    [ "$GATED_V" = "FAIL" ] && GATE_FAIL=$((GATE_FAIL+1))
    if [ "$GATED_TIER" = "documented-limit" ]; then N_LIMIT=$((N_LIMIT+1)); else N_FAIL=$((N_FAIL+1)); fi
    print_row "$ID" "$TIER" "$H1" "$H2" "$PCT" "$NOTE"
    python3 - "$ID" "$TIER" "$H1" "$OUT/status_1b.json" "$OUT/status_web.json" "$NOTE" "$GATED_TIER" > "$OUT/report_entry.json" <<'PYEOF'
import json, sys
print(json.dumps({'id': sys.argv[1], 'tier': sys.argv[2], 'hash1b': '0x' + sys.argv[3] if sys.argv[3] else None,
                  'status1b': json.load(open(sys.argv[4])), 'statusWeb': json.load(open(sys.argv[5])), 'note': sys.argv[6],
                  'acceptedTier': sys.argv[7] or None}))
PYEOF
    append_report "$OUT/report_entry.json"
    continue
  fi

  # Tier compare (same M3 logic as corpus_1b.sh).
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
  gate_verdict "$ID" "$TIER"
  [ "$GATED_V" = "FAIL" ] && GATE_FAIL=$((GATE_FAIL+1))
  case "$TIER" in
    PASS_IDENTICAL) N_EXACT=$((N_EXACT+1)) ;;
    PASS_TOLERANCE) N_TOL=$((N_TOL+1)) ;;
    *) if [ "$GATED_TIER" = "documented-limit" ]; then N_LIMIT=$((N_LIMIT+1)); else N_FAIL=$((N_FAIL+1)); fi ;;
  esac
  print_row "$ID" "$TIER" "$H1" "$HW" "$PCT" "$NOTE $GATED_NOTE"
  python3 - "$ID" "$TIER" "$H1" "$H2" "$HW" "$PCT" "$DIFF_LINE" "$OUT/status_1b.json" "$OUT/status_web.json" "$GATED_TIER" > "$OUT/report_entry.json" <<'PYEOF'
import json, sys
print(json.dumps({'id': sys.argv[1], 'tier': sys.argv[2],
                  'hash1b': '0x' + sys.argv[3], 'hash1bRun2': '0x' + sys.argv[4], 'hashWeb': '0x' + sys.argv[5],
                  'matchingPct': sys.argv[6], 'diff': sys.argv[7],
                  'status1b': json.load(open(sys.argv[8])), 'statusWeb': json.load(open(sys.argv[9])),
                  'acceptedTier': sys.argv[10] or None}))
PYEOF
  append_report "$OUT/report_entry.json"
done

echo "$SEP"
echo "E2E_WEB_DIRECT web legs run on the real Chrome WebGL2 context, no ANGLE lane, no Dart GL proxy (direct_fail=$DIRECT_FAIL)"
echo "F4C2_SUMMARY total=$TOTAL exact=$N_EXACT tolerance=$N_TOL documented_limit=$N_LIMIT fail=$N_FAIL skip=$N_SKIP gate_fail=$GATE_FAIL direct_fail=$DIRECT_FAIL"
if [ "$GATE_FAIL" -gt 0 ] || [ "$DIRECT_FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
