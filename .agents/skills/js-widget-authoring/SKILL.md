# Skill: Authoring js_widget_runtime Widgets

Use this skill when creating or modifying JavaScript widgets for `js_widget_runtime` —
the Flutter package that runs sandboxed JavaScript and renders its output as native
Flutter UI.

---

## 1. Mental model

A widget is JavaScript running in a sandboxed engine (QuickJS / JavaScriptCore on
native, a `web.Worker` on web). It never touches Flutter directly. It talks to the
host through ONE global object, `jsr`, and ONE output channel: a **declarative JSON
UI tree** passed to `jsr.render(tree)`. The host walks the tree and builds real
Flutter widgets (`Material 3` by theme).

```
widget.js ──jsr.render(json)──▶ JsWidgetBridge ──▶ JsonWidgetRenderer ──▶ Flutter UI
          ◂──onEvent(actionId, payload)── user taps / types / drags ◂──┘
```

- Every user interaction arrives as an **event** `(actionId, payload)` to the
  handler you registered with `jsr.onEvent(fn)`.
- Your job: keep state in plain JS variables, and on every change build a fresh
  JSON tree and call `jsr.render(tree)`. There is no diffing on your side — the
  renderer reconciles. Think React with `setState` = "render the whole thing".

## 2. Quick start (2 minutes)

`example/widgets/my-widget/manifest.json`:

```json
{
  "id": "my-widget",
  "name": "My Widget",
  "description": "One-line summary",
  "version": "1.0.0",
  "icon": "🚀",
  "allowedCommands": [],
  "network": false
}
```

`example/widgets/my-widget/widget.js`:

```javascript
(function() {
  var count = 0;

  function render() {
    var t = jsr.theme;
    jsr.exportState({ count: count });           // CLI snapshots stay live
    jsr.render({
      type: 'container',
      color: t.bg,
      child: { type: 'center', child: {
        type: 'column', mainAxisSize: 'min', children: [
          { type: 'text', data: 'Count: ' + count,
            style: { color: t.text, fontSize: 24, fontWeight: 'w700' } },
          { type: 'sizedBox', height: 12 },
          { type: 'button', text: 'Increment', onTap: 'inc' }
        ]
      } }
    });
  }

  jsr.onEvent(function(actionId) {
    if (actionId === 'inc') count++;
    render();
  });

  jsr.setTitle('🚀 My Widget');
  render();
})();
```

Then register the id in `example/lib/main.dart` (`_widgetIds`) and
`example/pubspec.yaml` (`assets: - widgets/my-widget/`).

**Rules that will bite you if skipped:**

1. ES5 style only: `var`, `function`, no arrow functions, no `async/await`
   (Promise chains are fine — the engine supports ES2020, but the repo style is
   ES5 and it keeps every engine happy).
2. Wrap everything in one `(function() { ... })();` IIFE.
3. Call `jsr.onEvent(...)` **before** the first `render()`.
4. `jsr.render` replaces the whole UI — always render the complete tree.

## 3. Multiple JS files (import syntax)

No manifest `files` list needed — relative ES-module-style imports are inlined at
load time:

```javascript
import './helpers.js';
import { formatMoney } from './lib/money.js';
```

- `export` keywords in inlined files are stripped automatically; everything lands
  in one shared scope (like concatenated `<script>` tags).
- Each file is inlined **once**, in source order; `../` resolves against the
  importing file; recursion depth is capped at 5.
- `jsr.include('path/to/file.js')` inlines a file at that call site instead.
- NOT supported: bare package specifiers (`import 'lodash'`), dynamic `import()`,
  `require()` in expressions. There is no bundler.
- The explicit manifest `files: [...]` list still works (ordered concat) for
  legacy widgets.

## 4. manifest.json reference

| Field | Required | Notes |
|---|---|---|
| `id` | yes | must equal the folder name |
| `name`, `description`, `version`, `icon` | yes | catalog display |
| `network` | no | informational; real enforcement is host-side |
| `allowedCommands` | no | host-specific `jsr.exec` allow-list; keep `[]` |
| `files` | no | explicit ordered concat list (see imports above) |
| `cli` | no | agent-facing metadata — see below |

Host-specific extension keys are allowed — the runtime manifest model
ignores unknown fields. Example (Fa host): `"widget": {"interactive": true}`
makes the board live-tile route UI events into the tile engine's
`jsr.onEvent` instead of opening the app on tap (default is display-only,
tap-to-open). Widget JS needs no changes — same `jsr.onEvent` contract.

The `cli` block is how coding agents discover your widget — fill it in:

```json
"cli": {
  "summary": "What the widget does",
  "events": [{ "id": "reset", "description": "Reset all state" }],
  "read": { "state": "jsr app:state my-widget" },
  "examples": ["jsr app:run my-widget", "jsr app:execute my-widget reset"]
}
```

## 5. The `jsr` API — complete reference

### Rendering & lifecycle

- `jsr.render(tree)` — replace the UI with the given JSON tree.
- `jsr.onEvent(fn)` — register `fn(actionId, payload)`. Call before first render.
- `jsr.setTitle(title)` — panel title (emoji welcome).
- `jsr.showError(msg)` — render a styled error card instead of your UI.
- `jsr.exportState(obj)` — publish a structured state snapshot (CLI, tests).
  Call it on every meaningful change. **Your logic tests read this.**
- `jsr.onThemeChange(fn)` — notified when the host theme changes.
- `jsr.instanceId` — unique per engine instance. Namespace named resources:
  `var sceneId = 'scene-' + jsr.instanceId` — or two panels running the same
  widget collide.

### Data

- `jsr.fetchJson(url, opts?)` → Promise — HTTP JSON (host permission-gated).
  Always `.catch()`.
- `jsr.storage.get(key)` / `jsr.storage.set(key, value)` → Promise — persistent
  per-widget storage.
- `jsr.secrets.get/set(key, value)` → Promise — secure storage.
- `jsr.loadAsset(path)` → Promise<string> — read a bundled asset file.
- `jsr.exec(cmd)` → Promise — shell command (host-dependent, usually gated).
- `jsr.log(msg)` / `console.log` — debug output to the host log.

### Input

- `jsr.onKey(fn)` — keyboard: `fn({key, code, down, repeat})`. `key` is camelCase:
  `'a'`, `'arrowLeft'`, `'space'`, `'enter'`. Track held keys in a map
  (`keys.left = ev.down`) — do not move per key event. Game keys are ignored
  while a `textField`/`textArea` holds focus.

### Timers (shimmed)

`setTimeout`, `setInterval`, `clearInterval`, `requestAnimationFrame` — RAF gets an
elapsed-ms argument; drive game loops with it (`dt = (now - last) / 1000`).

### Theme — `jsr.theme`

| key | dark default | use for |
|---|---|---|
| `isDark` | `true` | branch on brightness |
| `bg` | `#0f172a` | page background |
| `surface` | `#1e293b` | cards, panels |
| `surfaceAlt` | `#293548` | chips, inset boxes |
| `border` | `#334155` | hairlines |
| `borderBright` | `#475569` | emphasized borders |
| `accent` | `#818cf8` | primary accent |
| `accent2` | `#a78bfa` | secondary accent |
| `onAccent` | `#0f172a` | text on accent fills |
| `text` | `#f1f5f9` | primary text |
| `muted` | `#64748b` | secondary text |

Host theme updates are **merged** onto these defaults, so every key always exists.
Hardcode hex colors only for brand/data colors (chart series, status dots).

### Easing — `jsr.ease.*`

`linear`, `easeIn`, `easeOut`, `easeInOut`, `bounce`, `elastic`, `backIn`,
`backOut` — functions `f(t) → t'` for hand-rolled JS animation.

### 3D — `jsr.scene3d.*`

- `create(sceneId, config)` — config: `{engine?, camera: {position, target, fov},
  light: {position, color, ambient, diffuse}}`. `engine: 'flame'` is REQUIRED for
  GLB/GLTF (the dispatcher binds on first create); primitives/OBJ go to the
  cross-platform cube engine.
- `addModel(sceneId, {modelId, src? | primitive?, position?, rotation? (Euler
  degrees), scale?, unlit?, color?})` — `primitive: 'cube'|'sphere'|'torus'|'city'`;
  `unlit: true` renders flat albedo (logos, UI); `color: '#rrggbb'` (flame only)
  tints a GLB by multiplying surface albedo. NOTE: the flame engine's GLB parser
  drops node TRS transforms — re-apply baked node rotations via `rotation`.
- `removeModel(sceneId, modelId)`.
- `setTransform(sceneId, modelId, {position?, rotation?, scale?})`.
- `setTransforms(sceneId, items)` — ONE batched call per frame for many models:
  `[{modelId, position?, rotation?, scale?}, ...]`.
- `playAnimation(sceneId, modelId, options)` — `{axis: 'x'|'y'|'z', speed}` spins;
  `{name, loop, speed}` plays a skeletal GLB clip (flame only; currently loops at
  1x regardless of `loop`/`speed`).
- `stopAnimation(sceneId, modelId)` — stops both kinds.
- `setCamera(sceneId, {position, target, fov})` / `setLight(sceneId, {...})`.
- `onTap(sceneId, fn)` — raycast picking; `fn({modelId, point} | {modelId: null})`.

---

## 5a. Adaptive layout

Widgets render in containers of arbitrary size (board tiles ~160px, panels,
full screen). Tooling — pick per case:

- **`adaptive` NODE (preferred for layout switching):**
  `{type: 'adaptive', compact: node, medium?: node, expanded?: node,
  breakpoints?: [600, 840]}` — the renderer's LayoutBuilder picks a subtree
  by the ALLOTTED width (not the screen). Synchronous, no JS round trip,
  works in goldens and with raw-JsonWidgetRenderer hosts. Missing tier →
  nearest defined one.
- **`gridView.maxCrossAxisExtent: N`** — columns "no wider than N"; the
  column count floats with width (wins over `crossAxisCount` when both set).
- **`jsr.viewport()`** → `{width, height}` — last reported container size
  (null until the host's first layout). Hosts on `JsWidgetRuntimeWidget`
  report automatically; the event target is `'viewport'`.
- **`jsr.onViewport(fn)`** — fired on size changes (tile resize, window
  drag); re-render there if your JS state depends on size.
- **`jsr.breakpoint(width?)`** → `'compact'|'medium'|'expanded'`
  (<600 / 600–840 / ≥840, Material 3 window size classes; default width is
  the current viewport).
- **`jsr.adaptive({compact, medium, expanded})`** — pick a VALUE (padding,
  column count, …) for the current viewport breakpoint.

Rules of thumb: switching whole subtrees → `adaptive` node; deriving scalar
props → `jsr.adaptive`; reacting to resize → `jsr.onViewport`. Reference:
`example/widgets/adaptive-dashboard`.

## 5b. Layout contract (root scrollability)

Hosts embed widgets at arbitrary heights (~150 px landing cards, panels,
full screen). Unless the content provably fits ~150 px, make the ROOT node
scrollable: `listView` with `shrinkWrap: false` (default is `true` — wrong
for a bounded root) plus `padding`, or a `scroll` node. A fixed centered
`column` overflows in a short host (BOTTOM OVERFLOWED stripes). The
renderer does not auto-wrap roots; scrollability is the widget's job.

## 6. UI tree — node catalog

Every node is `{type: '...', ...props}`. Children go in `child` (single) or
`children` (list). All sizes are logical pixels; padding/margin accept
`[left, top, right, bottom]`.

### Layout

`column`, `row`, `stack`, `wrap`, `center`, `align`, `expanded`, `flexible`,
`padding`, `sizedBox` ({width, height}), `spacer`, `safeArea`, `scroll`,
`listView`, `gridView`, `aspectRatio`, `clipRRect`, `fill` (solid color layer),
`overlay` (stack layer with `positioned`).

- `stack` children may use `positioned: {left, top, right, bottom}`.
- Alignment strings: `'start'|'center'|'end'|'stretch'|'spaceBetween'|...`
  (camelCase, matching Flutter).

### Text & display

- `text` — `{data, style: {color, fontSize, fontWeight ('w400'..'w700'),
  letterSpacing, textAlign, fontStyle}, maxLines, overflow: 'ellipsis',
  textTransform: 'uppercase'|'lowercase', textShadows: [{color, blur, dx, dy}]}`
- `icon` — `{icon: '<material name>'}` (star, home, settings, search, add,
  refresh, menu, more_vert, trending_up, attach_money, show_chart, bar_chart,
  notifications, lock, …) — for custom marks prefer `svg`.
- `svg` — `{data: '<svg …/>', width, height, color}`. `color` tints via srcIn —
  the SVG must actually PAINT pixels (stroked icons need `stroke="#fff"`; SVG's
  default stroke is `none` → invisible).
- `markdown` — `{data: '**md**'}`.
- `divider`, `circleAvatar` ({text|image}), `chip` ({label, avatar?, color}),
  `badge` ({label, child}), `linearProgressIndicator` ({value}), 
  `circularProgressIndicator`.

### Containers & surfaces

- `container` — `{color, padding, margin, width, height, alignment, child,
  decoration: {color, borderRadius, border: {color, width}, boxShadows: [...],
  gradient: {type: 'linear'|'radial', colors, begin, end}}, clip: true,
  transform: {scale|rotate|translate|perspective…}, blur: sigma}`
- `card` — elevated surface; `inkWell` — `{onTap, borderRadius, child}` ripple.

### Input

- `button` (`{text|label, icon?, style: {backgroundColor, foregroundColor},
  onTap|onPressed}`), `textButton`, `outlinedButton`, `iconButton`
  (`{icon, onTap, tooltip?}`).
- `textField` / `textArea` — `{hint|placeholder, value, onChange, onSubmit,
  obscure}`; events post `{value: 'text'}`.
- `switch`, `checkbox` ({value, label?, onChanged → `{value: bool}`}),
  `slider` ({value, min, max, divisions, onChanged → `{value: num}`}),
  `dropdown` ({items: [strings|{value,label}], value, onChanged}).

### Material 3

| node | props (key ones) | events |
|---|---|---|
| `appBar` | `title, leading: {icon, onTap}, actions: [{icon, onTap, tooltip}], color` | taps |
| `navigationBar` / `navigationRail` | `destinations: [{icon, label}], selectedIndex, onChanged` | `{value: index}` |
| `tabBar` | `tabs: [string], children: [node]` | none (self-contained) |
| `fab` | `icon?, label? (→ extended), mini?, onTap` | tap |
| `segmentedButton` | `segments: [{value, label, icon?}], selected: [...], multiSelect?, onChanged` | `{value}` or `{value: [...]}` |
| `radio` | `value, groupValue, label?, onChanged` | `{value}` |
| `searchBar` | `hint, onChanged, onSubmitted` | `{value: text}` |
| `tooltip` | `message, child` | — |
| `popupMenu` | `items: [{value, label, icon?}], icon?, onSelected` | `{value}` |
| `banner` | `message, icon?, actions: [{label, onTap}]` | taps |
| `bottomAppBar` | `children, color?, height?` | — |
| `carousel` | `children, itemExtent? (200), shrinkExtent? (0)` | — |
| `drawer` | `drawer: node, child: node` — wraps child in a nested Scaffold with a Drawer; an `appBar` inside gets the hamburger automatically | — |

### Overlays (driver nodes)

Zero-size nodes that open a modal surface when they enter the tree and close it
when they leave:

| node | props | events |
|---|---|---|
| `bottomSheet` | `child, height?, color?, dismissible? (true), onDismiss?` | dismiss → `onDismiss ?? 'bottomSheetDismiss'` |
| `dialog` | `title?, message?|child?, actions: [{label, onTap}], dismissible?, onDismiss?` | action = pop + its `onTap` only; barrier → `onDismiss ?? 'dialogDismiss'` |
| `snackBar` | `message, actionLabel?, onAction?, durationMs?` | `onAction` |
| `datePicker` | `initialDate?/firstDate?/lastDate? ('YYYY-MM-DD'), onSelected, onDismiss?` | `{value: 'YYYY-MM-DD'}` |
| `timePicker` | `initialTime? ('HH:MM'), onSelected, onDismiss?` | `{value: 'HH:MM'}` (24h) |

Pattern: keep `state.overlay = null|'sheet'|...`; render the node conditionally;
on its dismiss event set `state.overlay = null` and re-render.

### Charts — `flChart` (fl_chart)

`{type: 'flChart', chartType, ...}`:

- `'line'`: `{series: [{label?, color?, points: [y...]}], minY?, maxY?,
  showGrid? (true), curved? (true)}`
- `'bar'`: `{values: [y...], color?}`
- `'pie'`: `{sections: [{label?, value, color?}], centerSpaceRadius? (32)}`
- `'radar'`: `{features: [names], entries: [{label?, color?, values}]}` (≥3
  features; short value lists are zero-padded)
- `'scatter'`: `{points: [{x, y, radius?, color?}], minX?/maxX?/minY?/maxY?}`

Default palette cycles `#818cf8 #a78bfa #22d3ee #f59e0b #ef4444`. The legacy
`chart` node (`chartType: 'line'|'bar'` sparkline painters) still works —
prefer `flChart` for anything user-facing.

### Media, map, path, 3D

- `image` — `{src: 'assets/…'|'file://…'|'http…', width, height, fit}`.
- `map` — OSM tiles: `{center: [lat, lng], zoom, markers: [{lat, lng, label?,
  color?}], onTap?}`.
- `path` — vector path `{d, fill, stroke, viewBox}`.
- `webView` — `{src, width?, height?, onMessage?}`; needs a host
  `JsWebViewHost` (`JsRuntimeConfig.webViewHost`) or renders a placeholder.
  Core ships an iframe host for web (`createIframeWebViewHost()`); VM hosts
  plug flutter_inappwebview (reference `example/lib/webview_host.dart`).
  Page-to-widget messages arrive as the `onMessage` event with
  `{value: string}` (iframe: `postMessage({type:'jsr', data})`; inappwebview:
  `callHandler('jsr', data)`).
- `video` — `{src, autoPlay?, loop?, controls? (true), fit?, width?, height?}`;
  `audio`; `audio_player` — zero-size driver `{src, playing?, volume?, loop?,
  seekToMs?}`: recompute props every render, host follows them. All three need
  a host `JsMediaHost` (`JsRuntimeConfig.mediaHost`) or they render
  placeholders; reference impl `example/lib/media_host.dart`.
- `scene3d` — `{id, width?, height?, interactive?}` bound to `jsr.scene3d.*`.

### Gestures

`gestureDetector` — `{onTap, onTapDown, onTapUp, onPanStart, onPanUpdate (→
{dx, dy}), onPanEnd, onLongPress, child}`. `inkWell` for simple taps with ripple.

### Animation nodes

- Implicit: `animatedContainer`, `animatedOpacity`, `animatedPositioned` —
  `{duration (ms), curve, ...target props}`; change props → animates.
- Mount: `entrance` — `{kind: 'fade'|'slideUp'|'scale'|…, delay, duration, child}`.
- Switch: `animatedSwitcher` — `{switchKey, duration, child}` — crossfades when
  `switchKey` changes.
- `curve` accepts: `linear`, `easeIn`, `easeOut`, `easeInOut`, `bounce(In)`,
  `elastic(In)`, `decelerate`, `fastOutSlowIn`, and M3 motion tokens
  `emphasized`, `emphasizedAccelerate`, `emphasizedDecelerate`, `standard`,
  `standardAccelerate`, `standardDecelerate` (approximated — Flutter 3.44
  predates the real `Easing.*` tokens).

## 7. Event payloads (cheat sheet)

| interaction | payload |
|---|---|
| `onTap` / `onPressed` | `{}` |
| text inputs | `{value: 'text'}` |
| `slider` | `{value: 0.5}` |
| `switch` / `checkbox` | `{value: true}` |
| `dropdown` / `popupMenu` / `radio` | `{value: <selected>}` |
| `navigationBar` / `navigationRail` | `{value: <index>}` |
| `segmentedButton` | `{value: 'a'}` or `{value: ['a','b']}` (multi) |
| pickers | `{value: 'YYYY-MM-DD'}` / `{value: 'HH:MM'}` |
| overlay dismiss | `{}` to `onDismiss` |
| `gestureDetector` pans | `{dx, dy}` |
| `jsr.onKey` | `{key, code, down, repeat}` |
| `scene3d.onTap` | `{modelId, point:[x,y,z]}` or `{modelId: null}` |

Design handlers to tolerate a missing payload (treat it as "cycle/next") —
that makes widgets drivable from a bare CLI `execute <id> <event>` call.

---

## 8. Testing widgets

Three layers, cheapest first. All of them run the REAL `widget.js` on the QuickJS
backend — never a re-implementation.

### 8.1 Headless logic tests (write these by default)

Boot the widget in a plain Dart test, fire events with `callEvent`, assert on
`exportedState` — the object your widget publishes via `jsr.exportState`.
No UI, no pumping, milliseconds per test. Use the shared helper
`test/support/widget_logic_helper.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  if (!hasQuickjsNativeLib) return; // CI builds the lib; skip silently otherwise

  test('my widget starts on the home screen', () async {
    final h = await bootWidget('my-widget');
    addTearDown(() => h.backend.dispose());
    expect(h.state!['screen'], 'home');
  });

  test('tapping add increments the counter', () async {
    final h = await bootWidget('my-widget');
    addTearDown(() => h.backend.dispose());
    await h.callEvent('add');
    expect(h.state!['count'], 1);
  });
}
```

For widgets that call `jsr.fetchJson`, pass fixture responses keyed by URL
substring:

```dart
final h = await bootWidget(
  'weather',
  fetchResponses: {
    'wttr.in': {
      'current_condition': [
        {'temp_C': '15', 'weatherDesc': [{'value': 'Sunny'}]},
      ],
      'nearest_area': [
        {'areaName': [{'value': 'London'}], 'country': [{'value': 'UK'}]},
      ],
    },
  },
);
```

Game-style widgets that drive `requestAnimationFrame` need a `WidgetTester` to
pump frames. Use `testWidgets`, `h.pumpFrames(tester, duration)`, and dispose
synchronously before the test returns:

```dart
testWidgets('game score increases while moving', (tester) async {
  final h = await bootWidget('3d-game-dodge');
  try {
    await h.keyDown('arrowRight');
    await h.pumpFrames(tester, const Duration(milliseconds: 400));
    await h.keyUp('arrowRight');
    expect(h.state!['score'], greaterThan(0.0));
  } finally {
    await h.backend.dispose();
  }
});
```

Rules for testable widgets:

- **Always `jsr.exportState(...)` the observable state** (display value, score,
  current screen, list lengths). Tests assert on it; so does the CLI.
- Keep handlers total: unknown actionId → no-op, missing payload → cycle.
- Widgets that fetch: inject fixtures through `bootWidget(fetchResponses: ...)`
  or the config's `fetchHandler` — never hit the network in tests.
- One engine per test (`setUp`/`tearDown`), or share one in `setUpAll` when
  boot cost matters — but then reset state via an event between tests.

### 8.2 Render-tree assertions

When the tree shape matters (right tab visible, badge shown), capture
`onRender` maps and walk them:

```dart
final renders = <Map<String, dynamic>>[];
// ...config: onRender: renders.add
final last = renders.last;
expect(last['type'], 'column');
```

Helpers: search by `type`/`data` recursively; the golden suite has examples.

### 8.3 Golden tests (visual, double as README gallery)

`test/golden/js_widget_golden_test.dart` renders each widget's tree through
`JsonWidgetRenderer` and compares a PNG (tolerant comparator, 0.5% pixels).
To add your widget:

1. Add the id → path entry to `_widgetFiles`.
2. If it fetches: add a fixture to `_fixtureFor` (weather/stocks/crypto are the
   pattern). If it uses scene3d: nothing — 3D widgets are already handled.
3. Run `flutter test test/golden/js_widget_golden_test.dart --update-goldens`,
   LOOK at `test/golden/goldens/<id>.png`, then re-run without the flag to
   confirm determinism.
4. Copy the PNG to `doc/widgets/` and add a row to the README gallery table.

Interactive variants (a state after an event) go into the tap maps
(`_showcaseTaps`, `_m3Taps`, …): the widget handler cycles state on an empty
payload, the test fires the bare actionId and captures the next frame.

Determinism rules: the golden clock is frozen (`Date.now` pinned); fonts are
the committed Roboto/NotoEmoji/NotoSansSymbols2 + SDK MaterialIcons; never use
`Math.random()` or wall-clock time for layout-affecting values without seeding.

## 9. Games & animation loops

- Frame loop: `requestAnimationFrame(tick)`, `dt` from the elapsed-ms argument.
- Input: `jsr.onKey` + a held-keys map; never move per key event.
- Movement: ONE `jsr.scene3d.setTransforms(...)` batch per frame; spawn/despawn
  with `addModel`/`removeModel`.
- Collision: plain JS math (AABB overlap); `scene3d.onTap` only for picking.
- HUD: normal JSON UI around the `scene3d` node; `stack` + `positioned` for
  overlays (game over, pause).
- Records: `jsr.storage`; live status: `jsr.exportState({score, lives, best})`.
- Reference: `example/widgets/3d-game-dodge/`.

## 10. Effects cookbook (containers)

```json
// Radial gradient
{"type": "container", "decoration": {"gradient": {"type": "radial", "colors": ["#ff0000", "#0000ff"], "center": "center", "radius": 0.8}}}
// Linear gradient (default type) with begin/end
{"type": "container", "decoration": {"gradient": {"type": "linear", "colors": ["#1e293b", "#0f172a"], "begin": "topCenter", "end": "bottomCenter"}}}
// Shadows
{"type": "container", "decoration": {"shadows": [{"color": "#000000", "blur": 8, "offsetX": 2, "offsetY": 2}]}}
// Blur node
{"type": "blur", "sigma": 4, "child": {"type": "text", "data": "fuzzy"}}
// 2D/3D transforms on a container
{"type": "container", "transform": {"scale": 1.5, "rotate": 0.5, "rotateX": 0.3, "rotateY": 0.3, "perspective": 500}}
// Text shadows + case transform
{"type": "text", "data": "hello", "style": {"textTransform": "uppercase", "textShadows": [{"color": "#000000", "blur": 2}]}}
// Clip children to a rounded rect
{"type": "container", "clip": true, "decoration": {"borderRadius": 16}}
```

## 11. Pre-flight checklist

- [ ] IIFE, ES5 style, no arrow functions / async-await.
- [ ] `jsr.onEvent` registered before first `jsr.render`.
- [ ] `jsr.exportState` on every meaningful state change.
- [ ] `manifest.json` id == folder name; `cli` block filled.
- [ ] Registered in `example/lib/main.dart` and `example/pubspec.yaml` assets.
- [ ] Colors from `jsr.theme` (hardcode only brand/data colors).
- [ ] scene3d ids namespaced with `jsr.instanceId`; `engine: 'flame'` at create
      time for GLB.
- [ ] Logic test with `callEvent` + `exportedState` for the core flows.
- [ ] Golden added & reviewed; `doc/widgets/` + README row updated.
- [ ] `./scripts/pre-commit` green (tests, coverage ≥ 80%, CRAP ≤ 12, dup < 1%).

## 12. Common pitfalls

- **Invisible SVG icons**: stroked SVGs need an explicit `stroke` — the
  renderer's tint can only recolor painted pixels.
- **Buttons ignore `color`/`textColor`**: use `style: {backgroundColor,
  foregroundColor}`.
- **Row overflow**: rows do not wrap; split into two rows or use `wrap`.
- **Search bar black ring**: the node already zeroes M3's default elevation —
  if you wrap it in your own Material, keep `elevation: 0`.
- **GLB lying on its side**: the flame GLB parser drops node transforms;
  re-apply the baked rotation via `addModel({rotation})` (DamagedHelmet needs
  `[-90, 135, 0]`-style corrections).
- **A second panel running your widget shows nothing / double models**:
  you forgot `jsr.instanceId` in the scene id.
- **Theme keys missing**: impossible — host themes merge onto the defaults.
- **`import` seems to run twice**: it doesn't — each file inlines once; if you
  see double effects, you probably both imported and `jsr.include`d the file.
