#!/bin/bash
# showcase_1b.sh — E2E-SHOWCASE-1 driver (issue #8, F4a): the CORE cinematic
# pipeline vs the LEGACY private showcase copy, hash-equal at named
# checkpoints in the same Chrome session (ref_1b_showcase.cjs).
#
# The legacy copy is materialized FROM GIT at the pinned base commit
# (e136d479, the PR #10 head F4a starts from) — no private copy is committed
# in the example after the move. Both variants bundle with the same esbuild +
# global-shim technique; the pinned three ESM (example/web/jsr_three_web.js +
# three.core.js, both committed) provides the single shared three core.
#
# Summary line: SHOWCASE_SUMMARY checkpoints=<n> match=<n> — exit 1 unless
# every checkpoint is hash-equal.
set -u
cd "$(dirname "$0")/../.."

BASE_COMMIT=e136d479a99e1b579f72f027155e20215256ab31
STAGE=/tmp/a1b_showcase
SRC=example/widgets/three-cinematic-showcase/src

# Web reference harness: Playwright (channel chrome by default; override with
# JSR_WEBGL_REF_CHANNEL). Installed once into /tmp/node_modules — the fixed
# require path of ref_1b_showcase.cjs.
if [ ! -d /tmp/node_modules/playwright ]; then
  echo '[showcase] playwright not found; installing to /tmp/node_modules'
  npm install playwright --prefix /tmp --no-audit --no-fund >/dev/null 2>&1 || {
    echo '[showcase] playwright install failed — the web leg will FAIL'
  }
fi

# esbuild for the legacy bundle: the tool/three devDependency when installed,
# else a pinned private install (same technique as the showcase build).
ESBUILD=""
if [ -x tool/three/node_modules/.bin/esbuild ]; then
  ESBUILD=tool/three/node_modules/.bin/esbuild
else
  if [ ! -x /tmp/a1b_showcase/esbuild/node_modules/.bin/esbuild ]; then
    echo '[showcase] installing private esbuild@0.25.5'
    npm install esbuild@0.25.5 --prefix /tmp/a1b_showcase/esbuild --no-audit --no-fund >/dev/null 2>&1 || {
      echo '[showcase] esbuild install failed — the legacy bundle cannot build'
      exit 1
    }
  fi
  ESBUILD=/tmp/a1b_showcase/esbuild/node_modules/.bin/esbuild
fi

# Materialize the LEGACY showcase sources from the pinned base commit.
# CI checkouts are shallow/single-branch (actions/checkout default): the base
# commit's tree is not present until fetched. GitHub serves any commit
# reachable from a ref, so a --depth=1 fetch of the SHA is enough.
#
# REG-MATRIX (F4h): a clean `git archive` export has no git objects, so
# showcase_clean_checkout.sh materializes the legacy bundle in the INVOKING
# checkout and hands it over via JSR_SHOWCASE_LEGACY_BUNDLE — the staging
# below is skipped and the checkpoint legs run unchanged.
LEGACY_BUNDLE="${JSR_SHOWCASE_LEGACY_BUNDLE:-}"
if [ -n "$LEGACY_BUNDLE" ]; then
  if [ ! -f "$LEGACY_BUNDLE" ]; then
    echo "[showcase] FAIL: JSR_SHOWCASE_LEGACY_BUNDLE does not exist: $LEGACY_BUNDLE"
    exit 1
  fi
  echo "[showcase] using the pre-staged legacy bundle: $LEGACY_BUNDLE"
  LEGACY="$LEGACY_BUNDLE"
else
echo "[showcase] staging legacy showcase sources from git ($BASE_COMMIT)"
mkdir -p "$STAGE/legacy-src" "$STAGE/legacy"
if ! git cat-file -e "$BASE_COMMIT:$SRC/pipeline.js" 2>/dev/null; then
  echo "[showcase] base commit objects missing (shallow checkout); fetching $BASE_COMMIT"
  git fetch --depth=1 origin "$BASE_COMMIT" 2>/dev/null \
    || git fetch --depth=1 fork "$BASE_COMMIT" 2>/dev/null \
    || { echo "[showcase] FAIL: cannot fetch the base commit"; exit 1; }
fi
for f in pipeline.js scene.js cinematic_entry.js three_global_shim.js addons_bundle.js; do
  git show "$BASE_COMMIT:$SRC/$f" > "$STAGE/legacy-src/$f" 2>/dev/null || {
    echo "[showcase] FAIL: base commit does not contain $SRC/$f"
    exit 1
  }
done

echo '[showcase] bundling the legacy pipeline (esbuild, global-shim alias)'
"$ESBUILD" "$STAGE/legacy-src/cinematic_entry.js" \
  --bundle --target=es2020 \
  --alias:three="$STAGE/legacy-src/three_global_shim.js" \
  --define:__THREE_DEVTOOLS__=undefined \
  --format=esm --platform=neutral --tree-shaking=false \
  --log-level=warning \
  --outfile="$STAGE/legacy/cinematic_bundle.mjs" || {
  echo '[showcase] FAIL: legacy bundle failed'
  exit 1
}
LEGACY="$STAGE/legacy/cinematic_bundle.mjs"
fi

echo '== [1/2] hash-equal checkpoints: legacy (private copy, base commit) vs core (jsr.three.cinematic), same Chrome session =='
OUT=$(node tool/three/ref_1b_showcase.cjs --legacy "$LEGACY" 2>&1) || {
  echo "$OUT"
  echo '[showcase] FAIL: web leg exited nonzero'
  exit 1
}
echo "$OUT"

SUMMARY=$(echo "$OUT" | sed -n 's/^SHOWCASE_SUMMARY checkpoints=\([0-9]*\) match=\([0-9]*\)$/\1 \2/p')
CHECKS=$(echo "$SUMMARY" | cut -d' ' -f1)
MATCH=$(echo "$SUMMARY" | cut -d' ' -f2)
if [ -z "$CHECKS" ] || [ "$CHECKS" -lt 1 ] || [ "$CHECKS" != "$MATCH" ]; then
  echo '[showcase] FAIL: not every checkpoint is hash-equal'
  exit 1
fi
echo "[showcase] PASS: $MATCH/$CHECKS checkpoints hash-equal (legacy == core)"
exit 0
