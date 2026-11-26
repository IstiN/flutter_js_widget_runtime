# ADR-0005: CinematicMotionBlurPass — JSR-owned shutter blur (issue #8, AC4)

- Status: accepted
- Date: 2026-11-26
- Scope: ADR-0004 decision 5, segment F4c1. Ids `E2E-MOTION-*`, `IT-HISTORY-*`, `E2E-DOF-*`, `E2E-SHOWCASE-1` (non-use), `REG-EXISTING`, `REG-GATES`.

## Context

ADR-0004 decision 5 requires a JSR-owned shutter motion blur pass. Criteria: deterministic under `clockState` (a direct seek equals the sequential run), works on native 1B and on Web, history reconstruction after `resetHistory`. The first candidate is subframe accumulation with the stratified shutter samples of `clockState`.

The r186 stock set has no general `MotionBlurPass` (only the WebGPU/TSL node, excluded by #8's classic-WebGL2 rule). The upstream `AfterimagePass` covers temporal trails but has no shutter semantics, so the shutter pass is JSR-owned by necessity.

## Candidate and design

`CinematicMotionBlurPass` (`tool/three/src/cinematic_motion_blur.js`) is a `Pass` placed in the composer chain before `OutputPass`. `pipeline.motionBlur({ samples, shutter })` arms it. Per subframe the pipeline renders the scene with the subframe time from `clockState(frame, fps, shutter, samples, epoch)` (uniform-stratified jitter, `t_i = windowStart + window * (i + jitter_i) / N`, weights `1/N`); the pass additively accumulates `rgb * weight` into a half-float target and, on the last subframe, accumulates the final sample and copies the average back into the chain (alpha n, clamped downstream). `samples: 1` is a pass-through copy: no accumulation target exists for a single-subframe frame, which makes the pass history-free (a direct seek replays exactly). The pass reuses the pipeline's `_armSubframe` lifecycle and never reads wall time; it carries no state across frames (`resetFrame()` per `renderFrame`).

## Measured result

Reference: the same stratified subframes rendered one at a time (single-subframe clocks, `OutputPass` disabled → linear chain values) and averaged in JS (Float64). Compared in linear units against the pass accumulation target (`|Δ| × 255 > 2` counts, 96×64, 24576 px, Chrome WebGL2 and macOS 1B — identical verdicts):

- Accumulation exactness: **0 of 18432 RGB channels over the 2-byte threshold; max byte-scaled delta 0.498** (half-float LSB). Verdict: hash-identical to the exact reference up to half precision (`m_accumulation_exact`).
- Quality vs a sharp frame (the moving-bars scene, 96×64): shutter 0.1 → 10 px differ, 0.5 → 40 px, 1.0 → 75 px — monotonic with the shutter, and the blurred footprint is the bars' smear region.
- Determinism: direct seek to frame 12 == sequential 0..12 (hash); frozen clock == repeated render (hash); seek-after-sequence == fresh direct render (stateless, hash). All true on 1B and Web.
- Cost (macOS host, 24 fps @ 96×64 — the pipeline measures encode + transport + submit): negligible over the base frame; the per-frame cost is N composer renders (already the pipeline's accumulation model) plus N fullscreen accumulates; no extra passes are allocated per frame. Preset numbers: `draft` (samples 1, pass-through), `production` (samples 8, 8 subframes), `deterministic-export` (samples 16, 16 subframes) — subframe count is the only multiplier.
- History reconstruction after `resetHistory`: the pass itself is per-frame stateless, so reconstruction is automatic; the stock AfterimagePass (a genuinely temporal pass) was proven with the `CinematicHistory` bounded window (40 frames at damp 0.5): reset + direct seek to frame 24 == sequential 0..24, bit-exact (`ai_*` hashes).

## Decision

Accepted. `CinematicMotionBlurPass` ships in `tool/three/src/cinematic_motion_blur.js`, selected by the existing `motionBlur` helper; `cinematic.js` gained only import/export lines plus two accumulator root-cause fixes shared with the legacy inline accumulation (below). The ADR-0004 bounded R1 lane keeps its existing set and semantics (untouched).

## Alternatives considered

- Velocity/depth re-projection blur (`VelocityShader`-style, named in #8 P2 as an option "where selected"): rejected for now — requires a per-pixel velocity target and a host depth contract; the accumulation candidate already meets every criterion and stays exact. Revisit only if perceptual quality at low sample counts becomes a requirement.
- Post-hoc screen-space directional blur of the final frame: rejected — not shutter semantics, not deterministic under direct seek (it blurs the rendered frame, not the shutter window).

## Consequences

- Root-cause fixes in `cinematic.js` (they also change the legacy accumulator's bytes; see Evidence):
  1. The accumulation clear color is forced black at clear time — three's background module resets the renderer clear color to the scene background on every `RenderPass`, so a pre-loop clear painted the background into the average (measured inflation law `k(n) = 2 − 1/n`; with n=8 the average came out 1.875× on background pixels).
  2. The legacy inline accumulator regained its `autoClear = false` suppression around the weighted quad draws (a refactor drop would have cleared the accumulation before every draw — last-write-wins).
- The showcase checkpoints for `finish-direct/seek` and `export` were re-recorded (samples 8 → 1 change plus the accumulator fix); `draft-frame12` is unchanged (`0xe34fc597`, samples 1). New: `finish 0x9125a1e8`, `export 0xa3c2834c` (documented reason: the legacy accumulator was inflating every samples>1 frame; see `docs/cinematic.md`).
- Bundle bytes changed (the pass ships in `jsr_three_native.js` / `jsr_three_web.js`); `bundle_manifest.json` regenerated.

## Evidence

- `E2E-MOTION-1..5`: `test/angle1b/f4c1_e2e_motion_test.dart` — 1B engine legs green locally (macOS ANGLE wire); the tier leg: F4C1_SUMMARY total=4 identical=4 tolerance=0 fail=0 missing=0 (m_sh05 1B == Chrome, PASS_IDENTICAL).
- `IT-HISTORY-1..4`: `test/angle1b/f4c1_it_history_test.dart` — all green; ai_seq24 1B == Chrome PASS_IDENTICAL.
- `E2E-DOF-1..3`: `test/angle1b/f4c1_e2e_dof_test.dart` — all green; dof_near / fr_on PASS_IDENTICAL.
- Web driver + unit: `tool/three/cases_f4c1.sh` (F4C1_WEB_OK, 10/10 flags true), `tool/three/test/f4c1_motion_blur_test.js`, `ut_helper_cinematic_test.js`, `ut_preset_cinematic_test.js` (node chain 18 OK).
- Non-use: `tool/three/showcase_1b.sh` 4/4 checkpoints hash-equal (`draft-frame12` byte-stable at `0xe34fc597`).
