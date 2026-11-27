#!/bin/bash
# showcase_clean_checkout.sh — REG-MATRIX (issue #8 AC13, segment F4h): a
# clean checkout reproduces the showcase.
#
# From the invoking checkout (CI: quality-macos, after the pinned-source
# clone; locally the same):
#   1. `git archive HEAD | tar -x` into a fresh /tmp directory — no git
#      objects, no node_modules, no build products;
#   2. the pinned-source bundle build in the export (`npm ci` +
#      `node tool/three/build.mjs --verify`): byte-compares the committed
#      assets/three bundles and gen/cinematic_core.mjs on the builder host
#      class (darwin-arm64), pin checks everywhere else;
#   3. the showcase build (example/widgets/three-cinematic-showcase), then
#      byte-compare the rebuilt example/web/cinematic_core.mjs with the
#      committed one;
#   4. tool/three/showcase_1b.sh twice on the same host — the reference leg
#      in the invoking checkout and the clean-export leg (the legacy
#      pipeline bundle is materialized from the pinned base commit in the
#      INVOKING checkout — the export has no git objects — and handed over
#      via JSR_SHOWCASE_LEGACY_BUNDLE) — and every checkpoint hash of the
#      export must equal the invoking checkout's hash bit-exactly. Pixel
#      hashes are host+channel specific (GPU generation, browser build), so
#      the committed tool/three/showcase_checkpoints.json is the archival
#      measured record of the F4h host, not a gate input.
#
# Summary: SHOWCASE_CLEAN_SUMMARY checkpoints=<n> match=<n>. Exits non-zero on
# any difference (byte compare, checkpoint hash, or a failed leg).
set -euo pipefail
cd "$(dirname "$0")/../.."

REPO=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
THREE_SRC="${THREE_SRC:-/tmp/jsr-three-r186}"
BASE_COMMIT=e136d479a99e1b579f72f027155e20215256ab31
SRC=example/widgets/three-cinematic-showcase/src
STAGE=/tmp/a1b_showcase_clean
CLEAN=$(mktemp -d /tmp/jsr-clean-showcase.XXXXXX)
trap 'rm -rf "$CLEAN"' EXIT

echo "[clean] exporting HEAD into $CLEAN"
git -C "$REPO" archive HEAD | tar -x -C "$CLEAN"

# The committed core module, captured before any rebuild touches the export.
cp "$CLEAN/example/web/cinematic_core.mjs" "$CLEAN/committed_cinematic_core.mjs"

echo '[clean] (1/4) npm ci + pinned-source bundle build in the export'
( cd "$CLEAN" && npm ci --prefix tool/three --no-audit --no-fund >/dev/null )
( cd "$CLEAN" && node tool/three/build.mjs --source "$THREE_SRC" --verify )

echo '[clean] (2/4) showcase build in the export'
( cd "$CLEAN/example/widgets/three-cinematic-showcase" && node build.mjs )

echo '[clean] (3/4) rebuilt example/web/cinematic_core.mjs == committed'
cmp "$CLEAN/example/web/cinematic_core.mjs" "$CLEAN/committed_cinematic_core.mjs" \
  || { echo '[clean] FAIL: the showcase build does not reproduce the committed core module'; exit 1; }

echo '[clean] (4/4) showcase checkpoints: clean export vs the invoking checkout on this host'
# Pixel hashes are host+channel specific, so the reference is measured on
# THIS host: the clean export must reproduce the invoking checkout's
# checkpoint hashes bit-exactly. Each leg must also hold legacy == core
# (showcase_1b.sh exits 1 otherwise).
mkdir -p "$STAGE/legacy-src" "$STAGE/legacy"
if ! git -C "$REPO" cat-file -e "$BASE_COMMIT:$SRC/pipeline.js" 2>/dev/null; then
  echo "[clean] base commit objects missing (shallow checkout); fetching $BASE_COMMIT"
  git -C "$REPO" fetch --depth=1 origin "$BASE_COMMIT" 2>/dev/null \
    || git -C "$REPO" fetch --depth=1 fork "$BASE_COMMIT" 2>/dev/null \
    || { echo '[clean] FAIL: cannot fetch the base commit'; exit 1; }
fi
for f in pipeline.js scene.js cinematic_entry.js three_global_shim.js addons_bundle.js; do
  git -C "$REPO" show "$BASE_COMMIT:$SRC/$f" > "$STAGE/legacy-src/$f"
done
"$CLEAN/tool/three/node_modules/.bin/esbuild" "$STAGE/legacy-src/cinematic_entry.js" \
  --bundle --target=es2020 \
  --alias:three="$STAGE/legacy-src/three_global_shim.js" \
  --define:__THREE_DEVTOOLS__=undefined \
  --format=esm --platform=neutral --tree-shaking=false \
  --log-level=warning \
  --outfile="$STAGE/legacy/cinematic_bundle.mjs"

echo '[clean] reference leg (invoking checkout)'
REFO=$(JSR_SHOWCASE_LEGACY_BUNDLE="$STAGE/legacy/cinematic_bundle.mjs" \
  bash tool/three/showcase_1b.sh 2>&1) || { echo "$REFO"; echo '[clean] FAIL: showcase_1b.sh failed in the invoking checkout'; exit 1; }
echo "$REFO"
REFF="$STAGE/reference.out"
printf '%s\n' "$REFO" > "$REFF"

echo '[clean] clean-export leg'
OUT=$(cd "$CLEAN" && JSR_SHOWCASE_LEGACY_BUNDLE="$STAGE/legacy/cinematic_bundle.mjs" \
  bash tool/three/showcase_1b.sh 2>&1) || { echo "$OUT"; echo '[clean] FAIL: showcase_1b.sh failed in the export'; exit 1; }
echo "$OUT"

OUTF="$CLEAN/showcase.out"
printf '%s\n' "$OUT" > "$OUTF"
MATCH=$(python3 - "$REFF" "$OUTF" <<PYEOF
import re, sys
def core_hashes(path):
    seen = {}
    for line in open(path).read().splitlines():
        m = re.match(r'SHOWCASE_CHECKPOINT (\S+) legacy=\S+ core=(\S+) match=\S+', line)
        if m:
            seen[m.group(1)] = m.group(2)
    return seen
ref = core_hashes(sys.argv[1])
export = core_hashes(sys.argv[2])
if not ref or sorted(ref) != sorted(export):
    print('checkpoint sets differ: reference=%s export=%s' % (sorted(ref), sorted(export)))
    raise SystemExit(2)
print(sum(1 for cid in ref if ref[cid] == export[cid]))
PYEOF
)
N_REF=$(python3 -c "import re,sys;print(len(set(re.findall(r'SHOWCASE_CHECKPOINT (\S+) legacy', open(sys.argv[1]).read()))))" "$REFF")
echo "SHOWCASE_CLEAN_SUMMARY checkpoints=$N_REF match=$MATCH"
[ "$MATCH" -eq "$N_REF" ] || { echo '[clean] FAIL: not every checkpoint matches the same-host reference run'; exit 1; }
echo '[clean] PASS: the clean checkout reproduces the showcase on this host'
