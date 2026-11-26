#!/bin/bash
# SIZE-ANDROID-1 (issue #7 AC10, F3a): size and alignment report for the
# pinned ANGLE Android builds. Per ABI and library: stripped size,
# architecture, load-segment alignment, absence of simulator/debug/
# SwiftShader slices, plus the installed/gzip budgets per ABI
# (<= 10 MiB installed, <= 5 MiB gzip). Gate semantics: a violation exits 1;
# nothing is re-measured or excluded.
#
# Usage: bash tool/angle_size_android.sh [--verify]
#   --verify also checks the SHA256SUMS recorded by the build (apk job).
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT_ROOT="$REPO/packages/jsr_three_angle/native/angle/out"
VERIFY=0
[[ "${1:-}" == "--verify" ]] && VERIFY=1

BUDGET_INSTALLED=$((10 * 1024 * 1024))
BUDGET_GZIP=$((5 * 1024 * 1024))
LIBS="libEGL_angle.so libGLESv2_angle.so libangle_1b.so"

# elf tools: prefer the NDK's llvm-* (exact cross-arch), fall back to binutils.
NDK_BIN=""
if [[ -n "${ANDROID_NDK_HOME:-}" && -d "$ANDROID_NDK_HOME" ]]; then
  NDK_BIN="$(echo "$ANDROID_NDK_HOME"/toolchains/llvm/prebuilt/*/bin | head -1)"
fi
STRIP="${NDK_BIN:+$NDK_BIN/llvm-strip}"
READELF="${NDK_BIN:+$NDK_BIN/llvm-readelf}"
[[ -x "${STRIP:-}" ]] || STRIP="$(command -v strip || true)"
[[ -x "${READELF:-}" ]] || READELF="$(command -v readelf || true)"
[[ -n "$STRIP" && -n "$READELF" ]] || { echo "no strip/readelf available" >&2; exit 1; }

# expected ELF machine + minimum load-segment page size per ABI
# (arm64-v8a: 16 KiB — the Android 15 16 KB page requirement).
machine_for() {
  case "$1" in
    android-arm64) echo "AArch64 16384" ;;
    android-armv7) echo "ARM 4096" ;;
    android-x86_64) echo "Advanced 4096" ;;
  esac
}

fail=0
any=0
printf '%-14s %-20s %10s %10s %8s %8s %s\n' ABI LIBRARY RAW STRIPPED GZIP ALIGN VERDICT
for platform in android-arm64 android-armv7 android-x86_64; do
  dir="$OUT_ROOT/$platform"
  [[ -f "$dir/libangle_1b.so" ]] || { echo "$platform: not built (skipped — the APK carries no ANGLE for this ABI)"; continue; }
  any=$((any + 1))
  read expected_machine expected_page <<< "$(machine_for "$platform")"

  if [[ "$VERIFY" == 1 ]]; then
    (cd "$dir" &&
      { shasum -a 256 -c SHA256SUMS >/dev/null 2>&1 || sha256sum -c SHA256SUMS >/dev/null; }) \
      || { echo "$platform: SHA256SUMS mismatch (REG-SUPPLY-1)"; fail=1; }
  fi

  total_installed=0
  total_gzip=0
  for lib in $LIBS; do
    f="$dir/$lib"
    raw=$(wc -c < "$f")
    tmp="$(mktemp)"
    cp "$f" "$tmp"
    "$STRIP" --strip-unneeded "$tmp" 2>/dev/null
    stripped=$(wc -c < "$tmp")
    gzip_bytes=$(gzip -c "$tmp" | wc -c)
    rm -f "$tmp"

    # architecture: one ELF of the expected machine, never a Mach-O
    # (no simulator slice) and no debug info (no debug slice).
    elf_ok=1
    file "$f" | grep -q "ELF" || elf_ok=0
    file "$f" | grep -q "Mach-O" && elf_ok=0
    machine=$("$READELF" -h "$f" | awk '/Machine:/{sub("Machine:[[:space:]]*",""); print}')
    [[ "$machine" == *"$expected_machine"* ]] || elf_ok=0
    debug_sections=$("$READELF" -S "$f" | grep -c '\.debug' || true)
    ((debug_sections == 0)) || elf_ok=0

    # SwiftShader slice: the pin builds angle_enable_swiftshader=false and
    # the SwiftShader compiler would carry its name strings.
    swift=$({ strings "$f" || true; } | grep -ci swiftshader || true)

    # minimum load-segment alignment over all LOAD segments.
    align_dec=$(python3 -c '
import subprocess, sys
out = subprocess.run([sys.argv[1], "-lW", sys.argv[2]], capture_output=True, text=True).stdout
vals = [int(t.split()[-1], 16) for t in out.splitlines() if t.startswith("  LOAD")]
print(min(vals) if vals else 0)
' "$READELF" "$f")
    min_align=$expected_page

    verdict=ok
    ((elf_ok == 1)) || { verdict="ELF/arch/debug FAIL"; fail=1; }
    ((swift == 0)) || { verdict="SwiftShader strings FAIL"; fail=1; }
    ((align_dec >= min_align)) || { verdict="alignment FAIL"; fail=1; }

    printf '%-14s %-20s %10d %10d %8d %8s %s\n' \
      "$platform" "$lib" "$raw" "$stripped" "$gzip_bytes" \
      "$(printf '0x%x' "$align_dec")" "$verdict"
    total_installed=$((total_installed + stripped))
    total_gzip=$((total_gzip + gzip_bytes))
  done

  budget_verdict=ok
  ((total_installed <= BUDGET_INSTALLED)) || { budget_verdict="installed over budget"; fail=1; }
  ((total_gzip <= BUDGET_GZIP)) || { budget_verdict="gzip over budget"; fail=1; }
  printf '%-14s %-20s %10s %10d %8d %8s %s\n' \
    "$platform" "TOTAL (stripped/gzip)" - "$total_installed" "$total_gzip" - \
    "$budget_verdict (budget installed <= $BUDGET_INSTALLED, gzip <= $BUDGET_GZIP)"
done

((any > 0)) || { echo "SIZE-ANDROID-1: no Android ANGLE builds present" >&2; exit 1; }
if ((fail == 0)); then
  echo "SIZE-ANDROID-1: PASS ($any ABIs)"
else
  echo "SIZE-ANDROID-1: FAIL" >&2
  exit 1
fi
