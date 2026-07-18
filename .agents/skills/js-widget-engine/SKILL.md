# Skill: Maintaining the js_widget_runtime Engine

Use this skill when modifying the JS runtime, bridge, engine handlers, or adding new `yoloit.*` API surface.

## Engine Layers

```
JS widget code
      ↓
kJsWidgetBootstrap (lib/src/runtime/js_widget_bootstrap.dart)
      ↓
sendMessage(channel, jsonString)
      ↓
JsWidgetBridge.dispatch(channel, payload)  (lib/src/runtime/js_widget_bridge.dart)
      ↓
Platform engine:
  VM: JsWidgetEngine → flutter_js runtime  (lib/src/runtime/js_widget_engine_vm.dart)
  Web: JsWidgetEngine → web.Worker         (lib/src/runtime/js_widget_engine_web.dart)
```

## Adding a New yoloit.* API

Follow these steps in order:

1. **Add the JS API in `kJsWidgetBootstrap`** (`lib/src/runtime/js_widget_bootstrap.dart`).
   - Use `sendMessage('__yoloit_<name>', JSON.stringify(args))`.
   - If async, store a callback in `__cbs[id]` and resolve later.

2. **Add a bridge channel constant** in `JsWidgetEngine._bridgeChannels` (both VM and Web files).

3. **Handle the channel in `JsWidgetBridge.dispatch`** (`lib/src/runtime/js_widget_bridge.dart`).
   - Add a `_handle<Name>` private method.
   - Inject the platform behavior via `JsRuntimeConfig` if it needs host-specific I/O.

4. **Wire the VM engine** (`lib/src/runtime/js_widget_engine_vm.dart`).
   - Most channels route through `_bridge.dispatch` automatically via `rt.setupBridge`.
   - If the API is async, make sure the resolve path calls `_resolveCallback`.

5. **Wire the Web engine** (`lib/src/runtime/js_widget_engine_web.dart`).
   - Add a worker-side handler inside `_buildWorkerScript`.
   - Post messages back to the worker using `_postToWorker`.

6. **Add default handlers** if the API has sensible VM/Web defaults:
   - VM: `lib/src/defaults/vm_default_handlers.dart`
   - Web: `lib/src/defaults/web_default_handlers.dart`

7. **Add tests**:
   - Unit-test `JsWidgetBridge` dispatch behavior with fake handlers.
   - If the API is renderer-related, add a widget test through `JsonWidgetRenderer`.

## Adding a New Renderer Type

1. Add the type alias to `UiViewTreeNormalizer` if it has alternative names or props.
2. Implement the widget branch in `JsonWidgetRenderer._buildWidget`.
3. Add a widget test in `test/json_widget_renderer_test.dart`.
4. Document the new type in `.agents/skills/js-widget-authoring/SKILL.md`.

## Engine Lifecycle

- `JsWidgetEngine.run(widgetJs)` starts the runtime, evaluates bootstrap + widget JS.
- `JsWidgetEngine.callEvent(actionId, payload)` invokes the widget's `handleEvent`.
- `JsWidgetEngine.updateTheme(colors)` pushes new theme values into `yoloit.theme`.
- `JsWidgetEngine.dispose()` cancels timers, terminates the worker / JS runtime.

## Important Notes

- Keep `JsWidgetBridge` platform-agnostic. Never import `dart:io` or `dart:html` there.
- VM engine uses `rt.evaluate()` and `rt.executePendingJob()` after every JS call.
- Web engine uses prefixed string messages (`__yoloit__`) via `postMessage`.
- The bootstrap is shared verbatim between VM and Web; do not use platform-specific globals inside it other than `sendMessage`, which both engines provide.
- Permission capabilities are: `fetch`, `storage`, `secrets`, `exec`. Reuse these before adding new ones.

## Testing the Engine

- Bridge tests: use `JsWidgetBridge` with stubbed callbacks (see `test/js_widget_bridge_test.dart`).
- VM engine integration requires a real `flutter_js` runtime; keep platform-specific engine files excluded from coverage if they cannot be run headlessly.
- Web engine requires a browser environment; test via `flutter test --platform chrome` or integration tests.
