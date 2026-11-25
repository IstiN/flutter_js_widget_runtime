#!/bin/bash
# corpus_1b.sh — E2E-EXAMPLES / REG-VISUAL-1 corpus driver (issue #7 AC5/AC15):
# sweep the NAMED official three.js r186 scenes plus the raw-GL and
# capture/readback fixtures through the full 1B stack (run_1b_corpus.dart)
# and headless Chrome WebGL2 (ref_1b_corpus.cjs), then apply the M3 tier
# logic (diff_1b.cjs). Per example: PASS_IDENTICAL (exact) /
# PASS_TOLERANCE / FAIL / SKIP(reason); the web leg additionally carries the
# E2E-WEB direct-web probe (real WebGL2 context, no ANGLE lane, no Dart
# proxy — bare Chrome page).
#
# Acceptance gating: tool/three/corpus/accepted_tiers.json maps every
# starter-corpus id to its accepted tier —
#   "exact"            PASS_IDENTICAL required
#   "tolerance"        PASS_TOLERANCE or better
#   "documented-limit" any measured outcome, "reason" required and the
#                      deviation must be documented in docs/angle_1b.md
# Ids without an accepted entry are measured but not gated (full-sweep
# triage mode). The script exits 1 when a GATED id measures outside its
# accepted tier, or when the web-direct probe fails. Machine table at
# $CORPUS_ROOT/report.json; summary line:
#   CORPUS_SUMMARY total=<n> exact=<n> tolerance=<n> documented_limit=<n> fail=<n> skip=<n> gate_fail=<n> direct_fail=<n>
#
# Run from repo root: bash tool/three/corpus_1b.sh [id ...]   (default: starter corpus)
set -u
cd "$(dirname "$0")/../.."

CORPUS_ROOT=/tmp/a1b_corpus
JSM=/tmp/three_pkg/node_modules/three/examples/jsm
FIXTURES_DIR=tool/three/corpus/fixtures
ACCEPTED_FILE=tool/three/corpus/accepted_tiers.json
export JSR_WEBGL_REF_CHANNEL="${JSR_WEBGL_REF_CHANNEL:-chrome}"
mkdir -p "$CORPUS_ROOT"

# Starter corpus = the ten NAMED official scenes of issue #7 AC5
# (webgl_loader_gltf, webgl_animation_keyframes, webgl_animation_skinning_morph,
# webgl_buffergeometry_instancing, webgl_shadowmap, webgl_shader,
# webgl_shader_lava, webgl_multiple_rendertargets, webgl_depth_texture,
# webgl_postprocessing_unreal_bloom) + the raw-GL fixture + the
# capture/readback fixture.
DEFAULT_IDS="three-loader-gltf three-animation-keyframes three-animation-skinning-morph three-buffergeometry-instancing three-shadowmap three-shader three-shader-lava three-multiple-rendertargets three-depth-texture three-postprocessing-unreal-bloom fixture-rawgl fixture-readback"

IDS="${*:-$DEFAULT_IDS}"

# Web reference harness: Playwright (channel override above). Installed once
# into /tmp/node_modules (scripts require that fixed path); channel 'chrome'
# needs no browser download, chromium does.
if [ ! -d /tmp/node_modules/playwright ]; then
  echo '[corpus] playwright not found; installing to /tmp/node_modules'
  npm install playwright --prefix /tmp --no-audit --no-fund >/dev/null 2>&1 || {
    echo '[corpus] playwright install failed — web legs will FAIL'
  }
fi

if [ ! -f "$JSM/postprocessing/UnrealBloomPass.js" ]; then
  echo '[corpus] three@0.186.1 jsm addons not found; installing to /tmp/three_pkg'
  npm install three@0.186.1 --prefix /tmp/three_pkg --no-audit --no-fund >/dev/null 2>&1 || {
    echo '[corpus] npm install failed — addon examples will SKIP'
  }
fi

# three-loader-gltf fetches its model index + DamagedHelmet from the Khronos
# sample-assets repo (outside the pinned three.js tree). Both corpus legs read
# assets through the flattened-name cache, so seed the two files once; both
# legs then serve byte-identical content.
KH_CACHE="$CORPUS_ROOT/asset_cache"
KH_IDX="$KH_CACHE/https:__raw.githubusercontent.com__KhronosGroup__glTF-Sample-Assets__main__Models__model-index.json"
KH_GLB="$KH_CACHE/https:__raw.githubusercontent.com__KhronosGroup__glTF-Sample-Assets__main__Models__DamagedHelmet__glTF-Binary__DamagedHelmet.glb"
mkdir -p "$KH_CACHE"
[ -f "$KH_IDX" ] || curl -fsSL "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/model-index.json" -o "$KH_IDX" 2>/dev/null || {
  echo '[corpus] Khronos model-index fetch failed — three-loader-gltf will FAIL(1b)'
}
[ -f "$KH_GLB" ] || curl -fsSL "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb" -o "$KH_GLB" 2>/dev/null || {
  echo '[corpus] Khronos DamagedHelmet.glb fetch failed — three-loader-gltf will FAIL(1b)'
}

# accepted_tiers.json lookup: ACCEPTED_FOR <id> -> tier | '' (ungated)
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

TOTAL=0; N_EXACT=0; N_TOL=0; N_LIMIT=0; N_FAIL=0; N_SKIP=0; GATE_FAIL=0; DIRECT_FAIL=0

# gate_verdict <id> <measured-tier> — echoes "OK" | "FAIL(<reason>)"; sets GATED_TIER
gate_verdict() {
  GATED_TIER=$(accepted_for "$1")
  case "$GATED_TIER" in
    '') GATED_V="OK"; GATED_NOTE="(ungated)"; return ;;
    exact)       case "$2" in PASS_IDENTICAL) GATED_V="OK"; GATED_NOTE="accepted:$GATED_TIER"; return ;; esac ;;
    tolerance)   case "$2" in PASS_IDENTICAL|PASS_TOLERANCE) GATED_V="OK"; GATED_NOTE="accepted:$GATED_TIER"; return ;; esac ;;
    documented-limit) GATED_V="OK"; GATED_NOTE="accepted:documented-limit (docs/angle_1b.md)"; return ;;
  esac
  GATED_V="FAIL"
  GATED_NOTE="measured $2 but accepted $GATED_TIER"
}

for ID in $IDS; do
  TOTAL=$((TOTAL+1))
  WIDGET_DIR="example/widgets/$ID"
  OUT="$CORPUS_ROOT/$ID"
  mkdir -p "$OUT"
  NOTE=""
  TIER="SKIP(bundle)"
  H1="-"; H2="-"; HW="-"; PCT="-"
  IS_FIXTURE=0
  if [ -f "$FIXTURES_DIR/$ID/scene.js" ]; then
    IS_FIXTURE=1
    WIDGET_DIR="$FIXTURES_DIR/$ID"
  fi

  if [ "$IS_FIXTURE" != "1" ] && [ ! -f "$WIDGET_DIR/official_module.js" ]; then
    TIER="SKIP(no-official-module)"
    NOTE="official_module.js missing (R1-glue-only widget?)"
    gate_verdict "$ID" "$TIER"
    [ "$GATED_V" = "FAIL" ] && GATE_FAIL=$((GATE_FAIL+1))
    N_SKIP=$((N_SKIP+1))
    print_row "$ID" "$TIER" "$H1" "$H2" "$PCT" "$NOTE $GATED_NOTE"
    python3 - "$ID" "$TIER" "$NOTE" "$GATED_TIER" > "$OUT/report_entry.json" <<'PYEOF'
import json, sys
print(json.dumps({'id': sys.argv[1], 'tier': sys.argv[2], 'note': sys.argv[3],
                  'acceptedTier': sys.argv[4] or None}))
PYEOF
    append_report "$OUT/report_entry.json"
    continue
  fi

  if [ "$IS_FIXTURE" = "1" ]; then
    # Raw fixtures: the scene is committed verbatim (no bundling, no addons).
    SCENE_PATH="$FIXTURES_DIR/$ID/scene.js"
  else
    # 1. bundle the upstream example module
    BUNDLE_OUT="$OUT/scene"
    BLINE=$(node tool/three/bundle_corpus_scene.mjs --id "$ID" --entry "$WIDGET_DIR/official_module.js" --out "$BUNDLE_OUT" --jsm "$JSM" 2>&1)
    BOK=$(printf '%s' "$BLINE" | python3 -c "import sys,json;d=json.loads(sys.stdin.read());print(d.get('ok'))" 2>/dev/null)
    if [ "$BOK" != "True" ]; then
      REASON=$(printf '%s' "$BLINE" | python3 -c "import sys,json;d=json.loads(sys.stdin.read());print(d.get('unresolvedImport') or str(d.get('error'))[:120])" 2>/dev/null)
      TIER="SKIP(bundle)"
      NOTE="$REASON"
      gate_verdict "$ID" "$TIER"
      [ "$GATED_V" = "FAIL" ] && GATE_FAIL=$((GATE_FAIL+1))
      N_SKIP=$((N_SKIP+1))
      print_row "$ID" "$TIER" "$H1" "$H2" "$PCT" "$NOTE $GATED_NOTE"
      python3 - "$ID" "$TIER" "$NOTE" "$GATED_TIER" > "$OUT/report_entry.json" <<'PYEOF'
import json, sys
print(json.dumps({'id': sys.argv[1], 'tier': sys.argv[2], 'note': sys.argv[3],
                  'acceptedTier': sys.argv[4] or None}))
PYEOF
      append_report "$OUT/report_entry.json"
      continue
    fi
    SCENE_PATH="$BUNDLE_OUT.scene.js"
  fi

  # 2. 1B run (two fresh surfaces; deterministic hash pair)
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
                  'status1b': json.load(open(sys.argv[4])), 'note': sys.argv[5],
                  'acceptedTier': sys.argv[6] or None}))
PYEOF
    append_report "$OUT/report_entry.json"
    continue
  fi

  # 3. web reference (bare Chrome page — the E2E-WEB direct-web leg)
  OUT_WEB=$(node tool/three/ref_1b_corpus.cjs --id "$ID" --scene "$SCENE_PATH" --widget-dir "$WIDGET_DIR" --out "$OUT" 2>"$OUT/web.stderr")
  RC_WEB=$?
  HW=$(printf '%s\n' "$OUT_WEB" | sed -n 's/^CORPUS_WEB_RUN id=[^ ]* hash=0x\([0-9a-f]*\) .*/\1/p')
  STATUS_WEB=$(printf '%s\n' "$OUT_WEB" | sed -n 's/^CORPUS_WEB_STATUS //p' | tail -1)
  [ -n "$STATUS_WEB" ] && printf '%s\n' "$STATUS_WEB" > "$OUT/status_web.json" || echo '{}' > "$OUT/status_web.json"
# E2E-WEB direct-web probe: real WebGL2 context (when the scene made one —
# null = the scene's canvases are not the stashed capture canvas and the leg
# is an honest blank-versus-blank pair), no ANGLE 1B lane, no Dart GL proxy.
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
echo "CORPUS_SUMMARY total=$TOTAL exact=$N_EXACT tolerance=$N_TOL documented_limit=$N_LIMIT fail=$N_FAIL skip=$N_SKIP gate_fail=$GATE_FAIL direct_fail=$DIRECT_FAIL"
if [ "$GATE_FAIL" -gt 0 ] || [ "$DIRECT_FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
