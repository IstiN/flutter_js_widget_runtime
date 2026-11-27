# ADR 0002 — ANGLE 1B pin and reproducible build

## Context

The 1B backend (issue #7) embeds ANGLE as plain C libraries, in-process
(`docs/angle_1b.md` decision 1): ANGLE is BSD-3-clause; `libEGL` +
`libGLESv2` are the only runtime deps. M0 already verified a source build:
"pinned ANGLE main @ `9c6a64c9` (2026-11-08), Metal-only static release
arm64 via `tool/build_angle.sh` (12m55s, 3725 steps) → `libGLESv2` 17 MB /
1769 exports + `libEGL` 115 exports".

The current `tool/build_angle.sh` checks out ANGLE with
`fetch --no-history angle` — a **floating** tree: today's run and next
month's run produce different binaries from the same command, which breaks
the supply-chain requirement of issue #7 (BUILD-ANGLE-1 / REG-SUPPLY-1:
pinned sources, reproducible outputs, recorded hashes) and makes the
deterministic rendering claims of issues #7/#8 unverifiable over time.
Builds must be reproducible and auditable without trusting unpinned
prebuilt binaries (`docs/angle_1b.md` decision 2 rejects flutter_angle's
"unpinned prebuilt binaries" for exactly this reason).

## Decision

1. **One pin file.** `tool/three/pins/angle_pin.json` holds:
   - `revision`: `9c6a64c9775b7c8ad1e9c624c2e1974f48f7dc87` — selected by
     the plan's criterion: the revision already built and recorded in
     `docs/angle_1b.md` (short `9c6a64c9`, 2026-11-08), taken when it
     builds for all five platform ids; otherwise the nearest later revision
     that builds for all five (candidates that fail are listed in the
     record with the error).
   - `date`: `2026-11-08` (commit time 2026-11-09 02:02:36 UTC = 2026-11-08
     US Pacific, matching the repo record).
   - `source`: `https://chromium.googlesource.com/angle/angle`
   - `license`: `BSD-3-Clause`
   - `gn`: the GN arguments per platform id:
     - `macos-arm64`: the M0-verified Metal-only static release args,
       verbatim from today's `tool/build_angle.sh`:
       `is_debug=false target_cpu="arm64" is_component_build=false angle_enable_vulkan=false angle_enable_gl=false angle_enable_metal=true angle_enable_d3d11=false angle_enable_d3d9=false angle_enable_null=false angle_enable_swiftshader=false angle_enable_retrace=false`
     - `ios-arm64`: Metal-only, same flags as `macos-arm64`
       (`target_cpu="arm64"`, `angle_enable_metal=true`, all other backends
       false) — the iOS plugin mirrors the macOS IOSurface → CVPixelBuffer
       → `FlutterTexture` path (`docs/angle_1b.md` decision 3).
     - `android-arm64` / `android-armv7` / `android-x86_64`: Vulkan-only
       (`angle_enable_vulkan=true`, `angle_enable_metal/gl/d3d11/d3d9/null/swiftshader/retrace=false`,
       `is_debug=false is_component_build=false`), `target_cpu`
       `"arm64"` / `"arm"` / `"x64"` respectively — Android Impeller is
       Vulkan and the Android presentation path feeds Impeller through
       hardware buffers (`docs/angle_1b.md` decision 4:
       `TextureRegistry.createSurfaceProducer`, ANGLE renders into the
       `Surface`/`ANativeWindow`), so the ANGLE backend must match.
2. **Pinned checkout, never floating.** `tool/build_angle.sh --platform <id>
   --out <dir>` always checks out the pinned revision from `angle_pin.json`
   (explicit `git fetch origin <revision>` + `git checkout <revision>`); no
   `fetch --no-history` of a moving `main`. The script writes the SHA256 of
   every built output next to the artifact for CI storage.
3. **Platform coverage and build order.** Platform ids: `macos-arm64`,
   `ios-arm64`, `android-arm64`, `android-armv7`, `android-x86_64`. Built
   in this run: `macos-arm64` in segment F2 (CI job `quality-macos`,
   cached by the hash of `angle_pin.json`); `android-arm64`,
   `android-armv7`, `android-x86_64` and `ios-arm64` in segment F3 (CI jobs
   `angle-android`, `angle-ios`).
4. **Notices travel with the binaries.** `packages/jsr_three_angle/ANGLE_NOTICES`
   records the revision and the BSD-3-Clause text (issue #7 supply chain;
   delivered in F2 together with the package).

## Alternatives

- **Keep floating `main` (`fetch --no-history angle`)**: rejected —
  unreproducible binaries invalidate every deterministic-hash claim of
  issues #7/#8 and the supply-chain acceptance (REG-SUPPLY-1).
- **Electron-shipped dylibs** (the M0/M1 staging shortcut,
  `native/angle/*.dylib`, gitignored): rejected for the production backend —
  unpinned third-party distribution, not buildable for Android/iOS
  platform ids; kept only as the spike's smoke target per `docs/angle_1b.md`.
- **flutter_angle (Knightro63) CocoaPods binaries**: rejected — unpinned
  prebuilts, exposes GL to Dart, and packaging forbids copying them
  (`docs/angle_1b.md` decision 2); recipe credit only.
- **vcpkg `angle` port**: rejected — Windows/Linux alternative; no macOS
  Metal/Android/iOS coverage that this run needs.
- **A newer revision than `9c6a64c9`**: not selected — the criterion picks
  the already-verified build; a bump happens only if `9c6a64c9` fails to
  build for one of the five ids, and then the failing candidate and error
  are recorded here.

## Consequences

- Every ANGLE binary in the repo's CI artifacts is traceable to one
  40-hex revision; `--verify`-style rebuild comparisons and size budgets
  (SIZE-ANDROID-1, SIZE-IOS-1) stay meaningful across time.
- `tool/build_angle.sh` grows a `--platform`/`--out` interface and the pin
  check; the old implicit macOS-only behaviour is gone (F2 updates its
  callers).
- ANGLE stays an opt-in distribution: the pin lives under `tool/three/pins/`
  and builds run only in the jobs that need them; applications not selecting
  1B never download ANGLE (issue #7 framing).
- If Chromium's ANGLE removes a GN arg used here, the pin forces the failure
  at build time (good): the record gets the failing candidate instead of a
  silent semantic drift.

## Evidence

- Revision resolved from the ANGLE repository:
  `curl -s "https://chromium.googlesource.com/angle/angle/+/9c6a64c9?format=JSON"`
  → commit `9c6a64c9775b7c8ad1e9c624c2e1974f48f7dc87`, "Warn rather than
  error on damaged compressed blobs", commit time Mon Nov 09 02:02:36 2026
  (UTC) = 2026-11-08 US Pacific — matching the date recorded in
  `docs/angle_1b.md` M0.
- M0 source-build verification and the GN args: `docs/angle_1b.md`
  (Milestone M0 ✅) and `tool/build_angle.sh` step 4.
- Android/iOS presentation decisions: `docs/angle_1b.md` decisions 3 and 4.
- Platform ids built so far: **none in F0** (this segment only fixes the
  decision). `macos-arm64` is built and CI-proven in **F2**
  (BUILD-ANGLE-1, quality-macos job); `android-arm64`, `android-armv7`,
  `android-x86_64` and `ios-arm64` in **F3** (angle-android, angle-ios
  jobs, SIZE-ANDROID-1, SIZE-IOS-1). Supply-chain acceptance REG-SUPPLY-1
  in F2; distribution explicitly not claimed (no binaries committed —
  `native/angle/*.dylib` and `third_party/angle-build/` are gitignored).
