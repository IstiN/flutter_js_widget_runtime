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

dart run tool/conformance/run_conformance.dart \
  --fixtures test/conformance/fixtures --out build/conformance
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
- A fixture whose `capabilities` the runner does not serve yet (F1 serves
  `network`, `storage`, `secrets`, `assets`) is `SKIP` with
  `skippedReason` — the reference serves every capability in principle,
  later segments wire the rest.

## Run in CI

Job `conformance` of `.github/workflows/pr.yml` (ubuntu): checkout,
Flutter 3.47.1, QuickJS bridge build, Node 22, `scripts/fetch-conformance.sh`
(pins `.conformance/js_widget_runtime`, verified against `conformance.lock`),
the runner over `test/conformance/fixtures`, then uploads the
`conformance-flutter` (result.json files) and `conformance-report`
(summary) artifacts.

## Fixture sets

- `test/conformance/fixtures/` — the F1 local set: the three seeds
  (`hello`, `counter`, `scroll_list`, `widget.js` byte-for-byte from the
  pinned contract repository) plus `scene3d_hostcontract` (SKIP proof).
  **This set is temporary**: a later segment switches the CI job to the
  fixtures of the contract repository (`IstiN/js_widget_runtime`,
  `docs/conformance/fixtures/`) and deletes it.

## Reference behavior found by the kit

`container` builds only its `child` — a `container` node authored with
`children:` renders no content in the Flutter reference (`js_layout_nodes.dart`,
`_containerProps.child = _child(m)`). The `scroll_list` seed authors its
items with `children:`, so on Flutter the 30 item containers dump without
children. Recorded as observed reference behavior; the contract repository
owns the fixture-triage decision (plan section 5, W2 rules).
