#!/bin/bash
# F3a Android (issue #7): quickjs_runtime 0.4.9's native-assets hook links
# -lpthread on Android, where bionic has no libpthread (the pthread
# functions live in libc) — every Android link fails with
# "unable to find library -lpthread". This patches the resolved pub-cache
# copy in place until the fix ships upstream (drop this script when
# quickjs_runtime releases the fix). Idempotent: a patched hook is left
# untouched, so the version in the message stays truthful.
#
# Usage: bash tool/patch_quickjs_android.sh   (after flutter pub get,
#   before flutter build apk)
set -euo pipefail
# PUB_CACHE is the cache ROOT (the flutter tool's convention; hosted
# packages live under <root>/hosted/<host>/). Default root: ~/.pub-cache.
CACHE_ROOT="${PUB_CACHE:-$HOME/.pub-cache}"
Q=$(find "$CACHE_ROOT/hosted" -maxdepth 2 -type d -name 'quickjs_runtime-*' 2>/dev/null | sort -V | tail -1)
[[ -n "$Q" ]] || { echo "no quickjs_runtime in $CACHE_ROOT/hosted" >&2; exit 1; }

python3 - "$Q/hook/build.dart" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read()
if "if (os != OS.android) 'pthread'" in s:
    print("already patched:", p)
elif "'m',\n              'pthread'," in s:
    s = s.replace(
        "'m',\n              'pthread',",
        "'m',\n              if (os != OS.android) 'pthread',",
    )
    open(p, "w").write(s)
    print("patched:", p)
else:
    sys.exit("quickjs_runtime hook layout changed — update " + p + " manually")
PY
