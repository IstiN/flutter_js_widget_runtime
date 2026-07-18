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

1. **ES5-compatible IIFE**. No modules, no arrow functions, no `const`/`let`, no async/await syntax (use Promise chains).
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
- Input: `textField`, `switch`, `checkbox`, `slider`, `dropdown`
- Media: `image`, `svg`, `markdown`
- Gestures: `gestureDetector`, `inkWell`
- Custom: `chart`

For exact props, read `lib/src/renderer/json_widget_renderer.dart` and the normalizer in `lib/src/renderer/ui_view_tree_normalizer.dart`.

## Event Payloads

- `onTap`, `onPressed` → payload is usually `{}`.
- `textField` `onChange` / `onSubmit` → payload `{ value: '...' }`.
- `slider` `onChanged` → payload `{ value: 0.5 }`.
- `switch`, `checkbox` `onChanged` → payload `{ value: true }`.
- `dropdown` `onChanged` → payload `{ value: 'selected' }`.
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
