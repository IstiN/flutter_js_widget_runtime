# Conformance kit (Flutter reference runner)

The conformance kit proves that the Flutter reference renders jsr widgets
fixture-by-fixture: run the widget's real JavaScript on the QuickJS backend,
render through the production `JsonWidgetRenderer`, apply the fixture's
actions, dump what is on screen, and write one `result.json` per fixture
(PROTOCOL section 1.4 of `IstiN/js_widget_runtime`, the contract repository
pinned by `conformance.lock`).

## Fixture format (plan 1.4, in short)

```
fixtures/<id>/
  widget.js      the widget's JavaScript (IIFE using the `jsr` API)
  meta.json      { "categories": ["L0","L1"], "capabilities": [],
                   "ignore": [], "nodes": ["center","text"], "mock": {} }
  expected.json  { "actions": [{"tap": "<nodeId|text>"}, {"input": {...}},
                   {"scroll": [dx,dy]}, {"swipe": [x1,y1,x2,y2,ms]},
                   {"wait": <ms>}, {"back": true}],
                   "expect": { renders, channels, title, trace, state,
                               console, finalDumpDelta } }
```

`meta.json` is authoritative; `expected.json` never carries a dump — the
harness derives the expected AUI from the widget's own renders and compares
against the platform dump (`n<i>` node ids, depth-first pre-order).

## Run locally

```bash
# prerequisites (same as CI): Flutter 3.47.1, and the QuickJS bridge:
QUICKJS_SRC=$(find "$HOME/.pub-cache/hosted/pub.dev" -maxdepth 1 -type d \
  -name 'quickjs_runtime-*' | sort -V | tail -1)
bash "$QUICKJS_SRC/tool/build_quickjs.sh"
mkdir -p native/quickjs
cp "$QUICKJS_SRC/native/quickjs/libquickjs_bridge.so" native/quickjs/

bash scripts/fetch-conformance.sh
dart run tool/conformance/run_conformance.dart \
  --fixtures .conformance/js_widget_runtime/docs/conformance/fixtures \
  --out build/conformance
node .conformance/js_widget_runtime/harness/harness.mjs compare \
  --fixtures .conformance/js_widget_runtime/docs/conformance/fixtures \
  --results build/conformance \
  --out-report conformance-report.md --out-badge badges/conformance.json
```

Every fixture gets `build/conformance/<id>.result.json`
(`platform: "flutter"`, status `DONE` or `SKIP`) plus
`build/conformance/conformance-summary.json`. Exit code: 0 when every
result file exists and carries no `error`; 1 otherwise (this is the CI
gate — the job fails on a missing result or a fixture error).
`--filter <glob>` selects fixture ids; `--harness <dir>` points at the
contract harness (default `.conformance/js_widget_runtime`) for the mock
server a fixture's `meta.json.mock` declares
(`node <harness>/harness.mjs mock <fixture-dir>`).

Runner details worth knowing:

- `fetchJson` goes through the default `dart:io` `HttpClient` handler to
  the mock origin, injected before the widget as `__JSR_MOCK_ORIGIN__`;
  `loadAsset` reads from the fixture directory; storage and secrets are
  in-memory. Real timers.
- `renders` holds the render payload strings in arrival order (the bridge
  hands the decoded tree to Dart; the runner re-encodes it canonically —
  the harness normalizes either way).
- `trace` records every `__jsr_*` channel name (verb form, `__jsr_`
  stripped) in arrival order via the bridge's `onMessageTrace` hook.
- `swipe` uses `tester.dragFrom` between the given coordinates and advances
  the test clock by the given duration. Coordinates are logical pixels of
  the test surface.
- A fixture whose `capabilities` the runner does not serve yet is `SKIP`
  with `skippedReason` — the reference serves every capability in
  principle, later segments wire the rest (served today: `network`,
  `storage`, `secrets`, `assets`, `three`).
- Fake-async notes: flutter_test replaces `HttpClient` with a 400 stub
  and pumps never consume wall time. The runner constructs its client
  with the override lifted (synchronous window) and drains the fixture
  in 20 ms real-time slices — one `runAsync` visit delivers one I/O
  round trip, so a file read needs two and a fetch several.
- `wait` is real time (PROTOCOL 1.4); `scroll` is a pointer scroll
  signal at the surface center (A2, issue #18), `submit` is the
  keyboard done action on the named text node (A1, issue #17), and
  `swipe` stays the touch drag.
- Maps run on an in-memory transparent tile provider (issue #19) — no
  OSM network, deterministic taps.
- A rendering exception after the result is written lands in the
  fixture's `error` (issue #16): the verdict names it and exits
  non-zero instead of crashing the flutter test run.

## Run in CI

Job `conformance` of `.github/workflows/pr.yml` (ubuntu): checkout,
Flutter 3.47.1, QuickJS bridge build, Node 22, `scripts/fetch-conformance.sh`
(pins `.conformance/js_widget_runtime`, verified against `conformance.lock`),
the runner over `test/conformance/fixtures`, then uploads the
`conformance-flutter` (result.json files) and `conformance-report`
(summary) artifacts.

## Fixture set

The fixtures live in the contract repository
(`IstiN/js_widget_runtime`, `docs/conformance/fixtures/`) and are
fetched by `scripts/fetch-conformance.sh` per `conformance.lock`. The
former local seed set (`hello`, `counter`, `scroll_list`,
`scene3d_hostcontract`) was deleted — the kit holds the seeds.

## Reference behavior found by the kit

`container` originally built only its `child` — a `container` node authored
with `children:` rendered no content in the Flutter reference
(`js_layout_nodes.dart`, `_containerProps.child = _child(m)`); the
`scroll_list` seed's 30 item containers dumped without children. **Fixed in
F2a** (this pull request): a `container` with `children` renders them as a
column inside the box decoration (`_childrenColumn`); regression test
`test/conformance/container_children_test.dart`.
