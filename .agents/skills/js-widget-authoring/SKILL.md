# Skill: Authoring js_widget_runtime Widgets

Use this skill when creating or modifying JavaScript widgets for `js_widget_runtime`.

## What is a Widget?

A widget is a self-contained JS file plus a `manifest.json`. The runtime injects a global `jsr` object and expects the widget to call `jsr.render(tree)` to produce Flutter UI.

## File Structure

```
example/widgets/my-widget/
  manifest.json
  widget.js
```

### Multiple JS files

Widgets can be split into modules using familiar ES-module syntax — no
manifest `files` list needed:

```javascript
import './helpers.js';
import { formatMoney } from './lib/money.js';
```

The loader inlines relative `import` statements (and `export` keywords are
stripped from inlined files) before eval, resolving `../` against the
importing file. Each file is inlined once, in source order. `jsr.include('path')`
does the same inline for one-off string-style includes. Bare/package
imports (`import 'lodash'`) are NOT supported — there is no runtime module
system or bundler; everything is concatenated into one shared scope.

## manifest.json

```json
{
  "id": "my-widget",
  "name": "My Widget",
  "description": "Short description",
  "version": "1.0.0",
  "icon": "🚀",
  "allowedCommands": [],
  "network": false,
  "cli": {
    "summary": "What the widget does",
    "events": [
      { "id": "reset", "description": "Reset the widget state" }
    ],
    "read": {
      "state": "jsr app:state my-widget",
      "snapshot": "jsr app:snapshot my-widget"
    },
    "examples": [
      "jsr app:run my-widget",
      "jsr app:execute my-widget reset"
    ]
  }
}
```

- `id` must match the folder name.
- `allowedCommands` is host-specific; leave empty unless the host needs it.
- `network` should be `true` if the widget calls `jsr.fetchJson`.

## widget.js Boilerplate

```javascript
(function() {
  var state = { count: 0 };

  function render() {
    jsr.render({
      type: 'center',
      child: {
        type: 'column',
        mainAxisSize: 'min',
        crossAxisAlignment: 'center',
        children: [
          { type: 'text', data: 'Count: ' + state.count, style: { fontSize: 24 } },
          { type: 'sizedBox', height: 16 },
          { type: 'elevatedButton', text: 'Increment', onTap: 'increment' },
        ],
      },
    });
  }

  function handleEvent(actionId, payload) {
    if (actionId === 'increment') {
      state.count++;
      jsr.exportState(state);
      render();
    }
  }

  jsr.onEvent(handleEvent);
  jsr.setTitle('Counter');
  render();
})();
```

## Important Rules

1. **ES5-compatible IIFE**. No arrow functions, no `const`/`let`, no async/await syntax (use Promise chains). Relative `import`/`export` statements ARE allowed — they are inlined at load time (see "Multiple JS files"); runtime module features (dynamic `import()`, bare package specifiers) are not.
2. Always wrap widget code in `(function() { ... })();`.
3. Register events with `jsr.onEvent(handleEvent)` before the first `render()`.
4. `jsr.render(tree)` accepts a JSON UI tree. See supported types below.
5. Use `jsr.exportState(obj)` after meaningful state changes so CLI snapshots work.
6. Network requests require `jsr.fetchJson(url, opts)`. Handle errors with `.catch()`.
7. Storage uses Promises: `jsr.storage.get('key').then(...)` and `jsr.storage.set('key', value)`.
8. `requestAnimationFrame` and `setInterval` are shimmed by the engine.
9. Use only the core `jsr.*` API in reusable widgets. Host-specific extensions (e.g., `jsr.yoloit`) must be clearly documented as host-dependent.

## Supported UI Tree Types

The renderer in `lib/src/renderer/json_widget_renderer.dart` supports types such as:

- Layout: `column`, `row`, `stack`, `wrap`, `expanded`, `flexible`, `padding`, `sizedBox`, `center`, `align`, `safeArea`, `scroll`, `listView`, `gridView`, `aspectRatio`, `opacity`, `clipRRect`, `animatedContainer`, `animatedOpacity`, `animatedPositioned`
- Material: `text`, `button`, `textButton`, `outlinedButton`, `elevatedButton`, `iconButton`, `chip`, `card`, `listTile`, `badge`, `circleAvatar`, `linearProgressIndicator`, `circularProgressIndicator`, `divider`, `spacer`
- Material 3: `appBar` ({title, leading, actions}), `navigationBar` ({destinations, selectedIndex, onChanged}), `navigationRail` (same shape), `tabBar` ({tabs, children}), `fab` ({icon, label, onTap, mini}), `segmentedButton` ({segments, selected, multiSelect, onChanged}), `radio` ({value, groupValue, label, onChanged}), `searchBar` ({hint, onChanged, onSubmitted}), `tooltip` ({message, child}), `popupMenu` ({items, icon, onSelected}), `banner` ({message, icon, actions}), `bottomAppBar` ({children, color, height}), `carousel` ({children, itemExtent, shrinkExtent})
- Overlays (zero-size driver nodes; open on mount, close on unmount): `bottomSheet` ({child, height, color, dismissible, onDismiss}), `dialog` ({title, message, child, actions, dismissible, onDismiss}), `snackBar` ({message, actionLabel, onAction, durationMs}), `datePicker` ({initialDate, firstDate, lastDate, onSelected, onDismiss}), `timePicker` ({initialTime, onSelected, onDismiss})
- Charts: `flChart` (fl_chart) — `chartType: 'line'` ({series: [{label, color, points}], minY, maxY, showGrid, curved}), `'bar'` ({values, color}), `'pie'` ({sections: [{label, value, color}], centerSpaceRadius}), `'radar'` ({features, entries: [{label, color, values}]}), `'scatter'` ({points: [{x, y, radius, color}], minX/maxX/minY/maxY}). The legacy `chart` node (sparkline/bar painters) stays for back-compat.
- Input: `textField`, `switch`, `checkbox`, `slider`, `dropdown`
- Media: `image`, `svg`, `markdown`
- 3D: `scene3d` (host-provided engine; see `jsr.scene3d` API below)
- Gestures: `gestureDetector`, `inkWell`
- Custom: `chart`

For exact props, read `lib/src/renderer/json_widget_renderer.dart` and the normalizer in `lib/src/renderer/ui_view_tree_normalizer.dart`.

## Event Payloads

- `onTap`, `onPressed` → payload is usually `{}`.
- `textField` `onChange` / `onSubmit` → payload `{ value: '...' }`.
- `slider` `onChanged` → payload `{ value: 0.5 }`.
- `switch`, `checkbox` `onChanged` → payload `{ value: true }`.
- `dropdown` `onChanged` → payload `{ value: 'selected' }`.
- `navigationBar`/`navigationRail` `onChanged` → `{ value: <index> }`; `segmentedButton` → `{ value: 'a' }` or `{ value: ['a','b'] }` in multiSelect; `radio` → `{ value: <value> }`; `popupMenu` `onSelected` → `{ value: <value> }`; `searchBar` `onChanged`/`onSubmitted` → `{ value: 'text' }`.
- Overlays: `bottomSheet`/`dialog` dismiss (drag, barrier, back) → `onDismiss` event with `{}`; dialog actions pop first, then fire their own `onTap` (no dismiss event for action closes); `snackBar` `onAction` → `{}`. Pickers: `datePicker` `onSelected` → `{ value: 'YYYY-MM-DD' }`, `timePicker` → `{ value: 'HH:MM' }` (24h); cancel → `onDismiss ?? 'datePickerDismiss'/'timePickerDismiss'`.
- Layout: `drawer` ({drawer, child}) wraps the child in a nested Scaffold with a Drawer — an `appBar` inside automatically gets the hamburger.
- Motion curves for `animatedContainer` & friends accept M3 tokens: `emphasized`, `emphasizedAccelerate`, `emphasizedDecelerate`, `standard`, `standardAccelerate`, `standardDecelerate` (approximated — the Flutter 3.44 SDK predates the real `Easing.*` tokens).
- `gestureDetector` `onPanUpdate` → payload `{ dx, dy }`; `onPanStart`/`onPanEnd` → `{}`.

## Testing Widgets

- Add the widget id to `example/lib/main.dart` `_widgetIds`.
- Run the example app: `cd example && flutter run`.
- For automated tests, render a widget tree through `JsonWidgetRenderer` directly rather than spinning up a real JS engine.

## Advanced Effects (from YoClip)

### Gradients

```json
{"type": "container", "decoration": {"gradient": {"type": "radial", "colors": ["#ff0000", "#0000ff"], "center": "center", "radius": 0.8}}}
```

Linear gradients use `"type": "linear"` (default) with `begin`/`end`.

### Shadows

```json
{"type": "container", "decoration": {"shadows": [{"color": "#000000", "blur": 8, "offsetX": 2, "offsetY": 2}]}}
```

### Blur

```json
{"type": "blur", "sigma": 4, "child": {"type": "text", "data": "fuzzy"}}
```

### Transforms

On a container:

```json
{"type": "container", "transform": {"scale": 1.5, "rotate": 0.5, "rotateX": 0.3, "rotateY": 0.3, "perspective": 500}}
```

### Text shadows and transforms

```json
{"type": "text", "data": "hello", "style": {"textTransform": "uppercase", "textShadows": [{"color": "#000000", "blur": 2}]}}
```

### Easing helpers

```javascript
var t = jsr.ease.easeInOut(0.5);
```

## 3D Scenes (`scene3d`)

The `scene3d` node renders a host-provided 3D engine. It is only functional
when the host app supplies a `Js3dHost` (e.g., via `flutter_3d_controller`,
Flame 3D, or three_dart).

```json
{"type": "scene3d", "id": "main", "width": 320, "height": 320}
```

### JS API

```javascript
jsr.scene3d.create('main', {
  camera: { position: [0, 2, 5], target: [0, 0, 0] },
  lights: [{ type: 'ambient', color: '#ffffff', intensity: 0.5 }]
});

jsr.scene3d.addModel('main', {
  id: 'player',
  src: 'assets/player.glb' // or a public GLB URL
});

jsr.scene3d.removeModel('main', 'player');

jsr.scene3d.setTransform('main', 'player', {
  position: [1, 0, 0],
  rotation: [0, 45, 0],
  scale: [1.5, 1.5, 1.5]
});

// Batched transforms — ONE bridge message for many models (use per frame).
jsr.scene3d.setTransforms('main', [
  { modelId: 'player', position: [1, 0, 0] },
  { modelId: 'enemy-1', position: [3, 0, -5], rotation: [0, 90, 0] }
]);

// Axis rotation (both hosts): spins the model around an axis.
jsr.scene3d.playAnimation('main', 'player', { axis: 'y', speed: 0.5 });

// Skeletal clip (flame host, GLB models with animations): pass a name string
// or {name, loop, speed}. The cube host ignores named clips.
jsr.scene3d.playAnimation('main', 'player', 'run');
jsr.scene3d.playAnimation('main', 'player', { name: 'run', loop: true, speed: 1.5 });

// Stops skeletal playback AND axis rotation.
jsr.scene3d.stopAnimation('main', 'player');

// Tap picking: nearest AABB hit under the tap, or {modelId: null} on a miss.
jsr.scene3d.onTap('main', function(hit) {
  if (hit.modelId) console.log('tapped', hit.modelId, 'at', hit.point);
});

jsr.scene3d.setCamera('main', {
  position: [0, 5, 10],
  target: [0, 0, 0]
});

jsr.scene3d.setLight('main', { type: 'directional', color: '#ffffff' });

jsr.scene3d.destroy('main');
```

- `src` accepts asset paths, `file://` URLs, or network URLs depending on the
  host engine.
- Keep 3D widget logic behind feature detection where possible, because hosts
  are not required to provide a `Js3dHost`.

## Keyboard Input (`jsr.onKey`)

Game-style widgets register a keyboard handler once:

```javascript
var keys = { left: false, right: false };

jsr.onKey(function(ev) {
  // ev = {key, code, down, repeat}
  // key: 'a', 'd', 'r', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown',
  //      'space', 'enter', 'escape', ...
  if (ev.key === 'arrowLeft' || ev.key === 'a') keys.left = ev.down;
  if (ev.key === 'arrowRight' || ev.key === 'd') keys.right = ev.down;
  if (ev.down && !ev.repeat && ev.key === 'r') restart();
});
```

- Key capture only works while the widget subtree has focus. If the host uses
  [JsWidgetRuntimeWidget], focus is claimed automatically on the first tap.
  If the host renders a [JsonWidgetRenderer] tree directly (e.g. yoloit boards),
  it must wrap the tree with `JsKeyboardCapture(onEvent: (p) => engine.dispatchHostEvent('key', p), child: ...)`.
- Keystrokes are never swallowed while a `textField`/`textArea` node holds
  focus, so forms and games can coexist.
- Track held keys in a map and apply movement in the frame loop — do not move
  per key event (auto-repeat rates vary by platform).

## Mini Game Pattern

Reference: `example/widgets/3d-game-dodge/` (Dodge Blocks 3D).

```javascript
var lastTick = 0;

function tick(elapsedMs) {
  requestAnimationFrame(tick);
  if (!lastTick) { lastTick = elapsedMs; return; }
  var dt = Math.min((elapsedMs - lastTick) / 1000, 0.1);
  lastTick = elapsedMs;

  // 1. advance gameplay state from `keys` and dt
  // 2. spawn/despawn with jsr.scene3d.addModel / removeModel
  // 3. move every model with ONE batched call:
  jsr.scene3d.setTransforms(sceneId, [
    { modelId: 'player', position: [px, 0, 2] },
    { modelId: 'block-0', position: [bx, 0, bz] }
  ]);
  // 4. keep CLI state live
  jsr.exportState({ score: score, lives: lives, best: best });
}

jsr.onKey(onKey);
requestAnimationFrame(tick);
```

- Do collision math (AABB overlap) in JS; `jsr.scene3d.onTap` is for picking.
- Persist records with `jsr.storage.set('my-best', best)`.
- Render HUD (score, lives) as regular JSON UI around the `scene3d` node; a
  `stack` with `positioned` children works for game-over overlays.
