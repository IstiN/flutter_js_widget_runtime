# ADR 0003 — 1B backend selection, shader policy and wire (issue #7, F2 decisions 2–4)

## Context

The 1B card adds a second, compatibility-first three.js backend beside the
lightweight 1A backend: the pinned upstream `WebGLRenderer` runs against a
local WebGL2 context facade; on native the facade submits a binary command
stream to ANGLE (ADR 0002), on Web it uses real WebGL2. Issue #7 fixes the
framing: 1B is an **opt-in distribution** (applications that only use 1A do
not download, bundle, sign or initialize ANGLE), 1A remains the fallback
"when ANGLE, a required synchronous engine channel, an ABI, or a GPU
capability is unavailable", and native Tier-1 requires QuickJS FFI because
the original renderer needs synchronous results ("Current `flutter_js`
Android channel returns asynchronously/`'OK'` and cannot claim native 1B
compatibility. Such hosts automatically use 1A.").

Repo anchors (docs/angle_1b.md, Integration points): opt-in selection today
is `JsRuntimeConfig.threeHost` — "1B is a `JsThreeHost` implementation; no
new JS engine backend. R1 stays default"; the binary lane gets "a
`'three.1b'` route next to `'three.r1'` in `JsWidgetBridge.dispatchBinary`
(one name check, non-breaking)". The QuickJS FFI backend carries the
synchronous zero-copy byte lane (`__jsrSendBytes`, quickjs_runtime native
lib; AGENTS.md hostCallBinary section) — that is the channel 1B needs.

## Decision

1. **Selection is an explicit config enum with a probe ladder**
   (F2 decision 2). `JsRuntimeConfig.threeBackend` of type
   `enum JsThreeBackend { r1, angle1b, auto }`, default `r1`. Probes run in
   order and all must pass for angle1b:
   - (a) the engine is a QuickJS backend with the synchronous byte lane
     (`__JSR_RAW_BINARY__` capability — the `__jsrSendBytes` FFI lane);
   - (b) the native `libangle_1b` loads;
   - (c) the ANGLE display for the platform type is created;
   - (d) on Android, API level >= 28.
   Result mapping: `r1` requested → r1, unconditionally. `angle1b`
   requested → angle1b when all probes pass, otherwise r1 **before the
   renderer is allocated**, with the reason reported through
   `JsRuntimeConfig.onThreeBackendSelected(JsThreeBackendSelection {
   requested, selected, reason })`. `auto` → angle1b when all probes pass,
   else r1. On the `flutter_js` backend 1B is never selected (reason:
   `sync channel required`) — probe (a) fails by construction there.
2. **Custom shaders are a host policy** (F2 decision 3).
   `JsRuntimeConfig.allowCustomShaders` (bool, default `false`). When
   false, `ShaderMaterial`, `RawShaderMaterial` and `onBeforeCompile`
   throw `three.unsupported: custom shaders are disabled by host policy`
   **before the renderer is allocated** — no half-initialized state, and
   the existing `three.unsupported` error contract is reused.
3. **Wire: two names on the existing lanes** (F2 decision 4). The runtime's
   QuickJS backend registers `__jsr1b_gl` (bytes in) and `__jsr1b_result`
   (string out) for the engine that selected angle1b — exactly the M2 ABI
   already exported by the shim (`a1b_gl_dispatch` / `a1b_gl_result`,
   docs/angle_1b.md M2). `JsWidgetBridge` routes the binary name
   `three.1b` to the 1B host next to the existing `three.r1` route. The
   three source for angle1b is `jsr_three_web.js` (the real WebGL2 bundle,
   already shipped in `assets/three/`); `jsr.three.createCanvas` returns a
   canvas whose `getContext('webgl2')` returns
   `AngleWebGL2Facade.createFacade` bound to that engine — same bundle as
   Web, only the context factory differs.

## Alternatives

- **Silent auto-selection with no config** (always pick the "best"
  backend): rejected — ANGLE is opt-in distribution (issue #7); a host that
  never asked for 1B must not initialize it, and determinism demands the
  host knows which backend rendered.
- **Select after renderer allocation, then tear down on probe failure**:
  rejected — the plan fixes "r1 before the renderer is allocated"; teardown
  paths are exactly where stale surfaces and leaked GPU state come from.
- **Selection by string flag or `threeHost` type sniffing**: rejected — an
  enum plus `onThreeBackendSelected` gives typed, reportable selection; the
  existing `threeHost` injection stays for custom hosts (1B is still a
  `JsThreeHost` implementation, no new JS engine backend).
- **`allowCustomShaders` default `true`**: rejected — the host policy is
  the security/compat boundary for issue #8's cinematic work; an
  unsupported shader path must fail loudly (`three.unsupported`) instead of
  silently dropping passes.
- **A new JS engine backend for 1B** (separate engine class): rejected —
  docs/angle_1b.md Integration points: "no new JS engine backend"; the
  QuickJS FFI backend already has the synchronous byte lane 1B needs.
- **JSON per-call proxy for GL** (flutter_gl style): rejected —
  docs/angle_1b.md decision 1: the render loop never leaves the process;
  the packed binary dispatch (G1) is the M2-verified transport.

## Consequences

- Hosts that don't opt in load zero ANGLE code: default `r1` and the
  optional-package layout (F2 decision 1) keep 1A applications untouched —
  verified by REG-1A-1 (no ANGLE initialization when 1B is not selected).
- Fallback is observable: every downgrade carries a `reason` string through
  `onThreeBackendSelected`; `UT-CAP-1` proves each probe failure selects r1
  pre-allocation, `E2E-FALLBACK-*` and `REG-ENGINE-1` prove the real
  engines.
- `flutter_js` hosts are first-class: they get a clean, named
  `sync channel required` answer instead of a broken 1B attempt (issue #7
  pinned fact).
- The bridge gains one name check (`three.1b` in `dispatchBinary`) —
  non-breaking for existing `three.r1` widgets; coexistence of one r1 and
  one angle1b engine in the same host is IT-COEXIST-1.
- The web lane keeps its direct path (no Dart GL proxy, REG-WEB-DIRECT-1);
  the facade swap is one `getContext` factory.

## Evidence

- Repo facts: `docs/angle_1b.md` Integration points (threeHost selection,
  `three.1b` route), M2 (locked ABI `a1b_gl_dispatch`/`a1b_gl_result`,
  wire name `__jsr1b_gl` registered next to `__jsrSendBytes`,
  `webgl2_g1_methods.json` 224 methods, PASS_IDENTICAL hash trio);
  AGENTS.md QuickJS FFI backend (synchronous host calls, zero-copy binary
  lane); issue #7 body (opt-in framing, flutter_js async channel pinned
  fact, `three.unsupported` boundary); `assets/three/bundle_manifest.json`
  (`jsr_three_web.js` real WebGL2 bundle, r186 pin).
- Verified in segment **F2**: `UT-CAP-1`, `E2E-FALLBACK-*`, `REG-ENGINE-1`
  (fallback + reasons), `IT-COEXIST-1`, `REG-1A-1` (coexistence, no ANGLE
  init otherwise), `IT-SHADER-*`, `E2E-SHADER-*` (shader policy),
  `REG-WEB-DIRECT-1` (web stays direct), `PERF-1`/`PERF-2` (synchronous
  lane performance, flush <= 1, p95 <= 4 ms on the macOS host).
