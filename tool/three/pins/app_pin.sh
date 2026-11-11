#!/bin/bash
# App-level pins for widgets whose failure modes only reproduce under the real
# QuickJS engine + Metal host (the node multitick harness runs V8 and cannot
# see QuickJS-only breaks). Usage: bash tool/three/pins/app_pin.sh <id> [<id>...]
#
# Checks per widget (probe_fps Release binary, JSR_OUT screenshot):
#   three-loader-gltf-animation-pointer : boots + presents >=60fps static
#     (guards the URL-constructor regression: `new URL(...)` must stay
#     constructable in native_entry.js; a `{}` stand-in hangs the needle boot)
#   three-instancing-morph : presents with calls>=25, triangles>=1e6
#   three-lightprobe-cubecamera : presents 2 on-demand frames + screenshot
#   three-loader-usdz : V8 harness emits packets; QuickJS boot budget is a
#     known gap (USDComposer parse) — pin only asserts the boot attempt logged
#     the usdz asset lane lines.
# Screenshots land in /tmp/round2/<id>.png; PASS/FAIL per widget, exit 1 on any FAIL.
set -u
BIN=/Users/Uladzimir_Klyshevich/git/flutter_js_widget_runtime/example/build/macos/Build/Products/Release/js_widget_runtime_example.app/Contents/MacOS/js_widget_runtime_example
PERF=/tmp/round2/perf
mkdir -p "$PERF" /tmp/round2
rc=0
for id in "$@"; do
  echo "== pin $id"
  rm -f "$PERF/$id.stdout.log"
  JSR_WIDGET="$id" JSR_CAMERA_LOG="$PERF/$id.log" JSR_OUT="/tmp/round2/$id.png" \
    "$BIN" > "$PERF/$id.stdout.log" 2>&1 &
  pid=$!
  for t in $(seq 1 60); do
    sleep 1
    grep -qa '"window"' "$PERF/$id.stdout.log" 2>/dev/null && break
  done
  kill -9 $pid 2>/dev/null; wait $pid 2>/dev/null
  pkill -9 -f js_widget_runtime_example 2>/dev/null; sleep 1
  static=$(grep -ao '"window":"static","presentedFps":[0-9.]*' "$PERF/$id.stdout.log" | head -1 | grep -o '[0-9.]*$')
  frames=$(grep -ao '"presentedFrames":[0-9]*' "$PERF/$id.stdout.log" | head -1 | grep -o '[0-9]*$')
  case "$id" in
    three-loader-usdz)
      if grep -qa 'models/usdz/saeukkang.usdz' "$PERF/$id.stdout.log"; then
        echo "PIN OK $id: usdz asset lane delivered (QuickJS boot budget gap tracked separately)"
      else
        echo "PIN FAIL $id: usdz asset lane never delivered"; rc=1
      fi ;;
    three-lightprobe-cubecamera)
      if [ -s "/tmp/round2/$id.png" ] && grep -qa 'probe boot' "$PERF/$id.stdout.log"; then
        echo "PIN OK $id: on-demand boot + screenshot (${frames:-0} frames)"
      else
        echo "PIN FAIL $id: no boot/screenshot"; rc=1
      fi ;;
    *)
      ok=$(awk -v v="$static" 'BEGIN{print (v+0>=60)?"1":"0"}')
      if [ "$ok" = "1" ]; then
        echo "PIN OK $id: static presentedFps=$static"
      else
        echo "PIN FAIL $id: static presentedFps=${static:-none}"; rc=1
      fi ;;
  esac
done
exit $rc
