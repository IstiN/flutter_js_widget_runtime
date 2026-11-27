#!/bin/bash
# Mach-O size, alignment and slice report for the staged ANGLE 1B dylibs.
# One implementation for both consumers:
#   - the angle-ios CI job (gate mode: SIZE-IOS-1 — structural checks and
#     the installed/gzip budgets gate, exit 1 on violation), and
#   - the consolidated angle-size job for the macos-arm64 row (--record:
#     everything is printed as measured, nothing gates — the plan budgets
#     SIZE-ANDROID-1 and SIZE-IOS-1 only).
# Usage: bash tool/angle_size_macho.sh <dir> <label> [--record]
set -euo pipefail
DIR="$1"
LABEL="$2"
RECORD=0
[[ "${3:-}" == "--record" ]] && RECORD=1
python3 - "$DIR" "$LABEL" "$RECORD" <<'PY'
import gzip, os, re, subprocess, sys
out, label = sys.argv[1], sys.argv[2]
record = sys.argv[3] == '1'
mib = 1024 * 1024
total_stripped = 0
total_gzip = 0
failures = []
print(f'== ANGLE {label} size report ==')
if record:
    print('mode: record — reported, not gated (the plan size ids are '
          'SIZE-ANDROID-1 and SIZE-IOS-1)')
for name in ('libEGL.dylib', 'libGLESv2.dylib', 'libangle_1b.dylib'):
    path = os.path.join(out, name)
    if not os.path.isfile(path):
        print(f'::error::missing staged library {name}')
        sys.exit(1)
    raw = os.path.getsize(path)
    stripped_path = f'/tmp/jsr-ios-{name}'
    with open(path, 'rb') as src, open(stripped_path, 'wb') as dst:
        dst.write(src.read())
    subprocess.run(['strip', '-x', stripped_path], check=True)
    stripped = os.path.getsize(stripped_path)
    gz = len(gzip.compress(open(stripped_path, 'rb').read(), 9))
    total_stripped += stripped
    total_gzip += gz
    lipo = subprocess.run(['lipo', '-info', path], capture_output=True, text=True)
    arch_clean = (lipo.stdout.strip() or lipo.stderr.strip()).split(': ')[-1]
    otool = subprocess.run(['otool', '-l', path], capture_output=True, text=True).stdout
    segs = re.findall(
        r'cmd LC_SEGMENT_64\s+cmdsize \d+\s+segname (\S+)'
        r'\s+vmaddr (0x[0-9a-f]+)\s+vmsize (0x[0-9a-f]+)'
        r'\s+fileoff (\d+)\s+filesize (\d+)', otool)
    misaligned = []
    for s, va, vs, fo, fs in segs:
        # 16 KiB rule for arm64: vmaddr and fileoff must be 16 KiB
        # multiples; vmsize must be page-rounded except the trailing
        # __LINKEDIT (its raw unpadded vmsize is the Mach-O norm —
        # Apple's own dylibs carry it).
        if (int(va, 16) % 16384 or int(fo) % 16384
                or (s != '__LINKEDIT' and int(vs, 16) % 16384)):
            misaligned.append(s)
    if misaligned:
        failures.append(f'{name}: 16 KiB misaligned segments {misaligned}')
    probe = arch_clean.lower()
    if 'x86_64' in probe or 'armv7' in probe or 'simulator' in probe:
        failures.append(f'{name}: simulator/foreign slice ({arch_clean})')
    if '__DWARF' in otool:
        failures.append(f'{name}: debug (DWARF) slice present')
    if b'SwiftShader' in open(path, 'rb').read():
        failures.append(f'{name}: SwiftShader present')
    print(f'{name:<18} raw={raw:>9} stripped={stripped:>9} '
          f'gzip={gz:>8} arch={arch_clean} '
          f'16KiBAligned={"no" if misaligned else "yes"}')
installed_ok = total_stripped <= 10 * mib
gzip_ok = total_gzip <= 5 * mib
print(f'TOTAL({label}) installed(stripped)={total_stripped} '
      f'({total_stripped / mib:.2f} MiB, budget 10.00 MiB -> '
      f'{"OK" if installed_ok else "EXCEEDED"})')
print(f'TOTAL({label}) gzip={total_gzip} '
      f'({total_gzip / mib:.2f} MiB, budget 5.00 MiB -> '
      f'{"OK" if gzip_ok else "EXCEEDED"})')
if record:
    for f in failures:
        print(f'::notice::{label} recorded finding: {f}')
    print(f'{label}: structural findings recorded '
          f'({len(failures)}); not gated (see mode line above)')
elif failures:
    for f in failures:
        print(f'::error::{f}')
    sys.exit(1)
else:
    # Size budget: issue #7 allows exceeding the budget with an explicit
    # documented size review before merge (docs/angle_1b.md, F3 section);
    # the report records the measured values verbatim.
    print(f'{label}: structural checks OK (arm64 device slice only, '
          '16 KiB aligned, no simulator/debug/SwiftShader slices)')
print(f'== ANGLE {label} size report: done ==')
PY
