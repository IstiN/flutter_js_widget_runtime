# ADR 0001 — Contract conformance 1A: run the kit on the Flutter reference (issue #9)

## Context

Issue #9 makes the jsr widget contract 100 % portable: a complete, testable
inventory of the runtime + renderer API and a per-platform compatibility
matrix, so every future render backend (native Android, iOS, macOS,
web/React) can prove behavioural compatibility with the Flutter reference
renderer. Today the contract lives implicitly in
`lib/src/renderer/*.dart` and `lib/src/runtime/js_widget_bootstrap.dart`
(`kJsWidgetBootstrap`); a native Android POC already renders jsr widgets,
and without a pinned, tested contract every port drifts.

This repository is the reference implementation: the conformance kit must
first prove that the reference itself can be driven fixture-by-fixture —
render, interact, dump what is on screen, and compare against the
expectation — before any other platform can be measured against it.
Fixtures, the harness comparator and the mock server are owned by
`IstiN/js_widget_runtime` (the contract repository, plan section 5); this
repository owns only the Flutter side: node-id stamping, the AUI dump of
the live widget tree, the runner, CI and documentation.

Gates that must not regress while adding this: existing test suite green,
coverage >= 80.0 %, duplication < 1.0 %, file <= 1500 lines, CRAP ratchet
12.0 (`crap4dart.yaml`), similarity gate (`.github/workflows/pr.yml`).

## Decision

1. **Node id stamping — least invasive.** Every node root widget built by
   `JsonWidgetRenderer` carries `ValueKey('jsr:<nodeId>')`. `nodeId` is
   `n<i>`, where `i` is the depth-first pre-order index of the node in the
   `jsr.render` payload (root `n0`, every node counted, layout-only nodes
   included). The existing suite proves that nothing changed: keys are not
   observable behaviour for any current test (criterion: least invasive
   mechanism that survives the whole existing suite unchanged).
2. **Dump source = the live element tree.** `JsonWidgetRenderer.dumpViewTree(BuildContext
   rootContext)` returns the PROTOCOL section 2 JSON (`{type, props,
   children, events, nodeId}`): it walks the element tree, reads each
   `ValueKey('jsr:...')`, joins it with the applied-node record of the
   renderer, and reads text-bearing props live from the built widgets
   (`Text.data`, `EditableText` controller text, tool tip message). Output
   is normalized (style merged into props, `on*` string props moved to
   `events`, `child`/`children` flattened, `key` removed, type aliases
   resolved, colors `#RRGGBB[AA]`, sizes in logical pixels). The dump must
   prove what is actually on screen, so it is read from built elements, not
   from the input payload.
3. **Runner = a Flutter-test-driven tool.** `tool/conformance/run_conformance.dart`
   (`dart run tool/conformance/run_conformance.dart --fixtures <dir> --out <dir>
   [--filter <glob>]`) runs through `flutter test` like the existing
   `tool/jsr_widget_harness_test.dart` — rendering `JsonWidgetRenderer` in a
   `MaterialApp` needs the Flutter test bindings, so a standalone `dart:io`
   process is not an option. Per fixture: start the mock server (spawn
   `node harness/harness.mjs mock <fixture-dir>` from the contract
   repository), create a `QuickjsWidgetEngineBackend` engine, set `__IID`,
   inject the mock origin as `__JSR_MOCK_ORIGIN__`, evaluate
   `kJsWidgetBootstrap` and the widget, use in-memory storage and secrets,
   `fetchJson` through `dart:io` `HttpClient` to the mock origin,
   `loadAsset` from the fixture directory, real timers. Actions map to
   tester primitives: `tap` = `tester.tap(find.byKey(ValueKey('jsr:<id>')))`
   or `find.text`; `input` = `tester.enterText`; `scroll` = `tester.drag`;
   `swipe` = `tester.drag` with the given duration; `wait` =
   `tester.pump(Duration)`; `back` = host event `back` delivered through
   the reference host-event dispatch
   (`JsWidgetEngineBackend.dispatchHostEvent`), never a synthetic route
   pop — one mechanism for all host events. Writes one `result.json` per
   fixture with `platform: "flutter"` (fields `fixture`, `platform`,
   status `DONE`/`SKIP`, `dump`, `trace`, `diffs`, `screenshot`, `renders`,
   `finalDump`, `title`, `state`, `console`, `error`, `skippedReason`).
4. **kJsWidgetBootstrap stays.** The bootstrap constant is unchanged; the
   two canonical halves generated in the contract repository must reproduce
   its behaviour byte-for-byte, but no Flutter file consumes the halves in
   this run. The reference behaviour wins whenever the parity test shows a
   defect in a half.
5. **CI + documentation.** `conformance.lock` pins the contract repository;
   `scripts/fetch-conformance.sh` fetches only the pinned commit into
   `.conformance/` (gitignored) and fails on any sha mismatch. New job
   `conformance` in `pr.yml` (ubuntu): fetch pins, run the kit over all
   fixtures, compare with
   `node .conformance/js_widget_runtime/harness/harness.mjs compare`, upload
   artifacts `conformance-report` (markdown) and `conformance-flutter`
   (`result.json` files). `docs/conformance.md` documents local and CI
   usage.

## Alternatives

- **Stamp identity in the JS payload instead of widget keys** (mutate the
  render payload before building): rejected — the payload is contract
  input; rewriting it would change what every engine consumes and risks
  behaviour drift; keys are the Flutter-idiomatic identity channel and are
  invisible to widget behaviour.
- **Dump from the renderer's applied-node records only** (no element walk):
  rejected — the dump must prove what is on screen; text, focus and
  controller state live in the built widgets, so the record alone can lie.
- **Standalone `dart:io` runner process**: rejected — `JsonWidgetRenderer`
  rendering needs the Flutter test bindings (widget pump, golden-friendly
  environment); a `flutter test`-driven tool reuses the proven
  `tool/jsr_widget_harness_test.dart` pattern.
- **`back` as `SystemNavigator.pop` / route pop**: rejected — a widget may
  run in any host surface; the host-event channel is the only mechanism the
  reference already defines for out-of-band events.
- **Put fixtures and comparator in this repository**: rejected — issue #9
  layering puts the UI contract in `js_widget_runtime` so all platforms
  consume one kit; Flutter only provides the reference runner.

## Consequences

- `lib/` gains exactly two things: key stamping in `JsonWidgetRenderer` and
  `dumpViewTree()`; both must keep the CRAP ratchet (12.0), coverage
  (>= 80 %) and duplication (< 1 %) gates green — they are exercised by the
  conformance tests in `test/conformance/`.
- The existing suite is the no-behaviour-change proof for key stamping; any
  existing test failing after F1 is a regression, not a baseline.
- Flutter becomes the first measured column of the compatibility matrix;
  its `conformance` job output (`result.json` per fixture) is the sample
  set the contract repository compares other platforms against.
- Every capability a fixture declares must be servable by the runner (the
  Flutter reference serves all of them by definition — storage/secrets
  in-memory, network via the mock origin, assets from the fixture
  directory); a fixture needing a capability the runner cannot serve is a
  defect to file against the runner, not a skip.

## Evidence

- Facts: `docs/angle_1b.md` and `AGENTS.md` describe the reference
  bootstrap/renderer layout; `JsWidgetEngineBackend.dispatchHostEvent`
  exists today (`lib/src/runtime/js_widget_engine_backend.dart`) and already
  delivers `'key'` and `'scene3d.tap:<sceneId>'`; `QuickjsWidgetEngineBackend`
  is the opt-in FFI backend the example harness already drives
  (`tool/jsr_widget_harness_test.dart`).
- Verified by segment **F1** (plan section 4.4): node stamping +
  `dumpViewTree` + runner + CI job, acceptance ids of issue #9 on the
  Flutter side — all fixtures PASS in the `conformance` job; existing gates
  green (`REG-EXISTING`, `REG-GATES` as segment rules). The inventory and
  matrix themselves are delivered by `IstiN/js_widget_runtime` (plan
  section 5.1, acceptance ids `inventory`, `API`, `coverage`).
