# js_widget_runtime Agent Guidance

This guide covers how to work with the `js_widget_runtime` Dart package and its JavaScript widget ecosystem.

## Project Overview

`js_widget_runtime` renders JavaScript widgets as Flutter widgets. It is published to pub.dev as `js_widget_runtime`.

- **VM engine**: `flutter_js` (QuickJS / JavaScriptCore)
- **Opt-in VM engine**: QuickJS FFI backend (vendored QuickJS + C bridge, synchronous host calls) via `JsRuntimeConfig.backend`
- **Web engine**: Dedicated `web.Worker` built from an inline Blob URL
- **Public API**: `lib/js_widget_runtime.dart`
- **Examples**: `example/widgets/`

## Repository Layout

```
lib/
  src/
    defaults/          vm_default_handlers.dart, web_default_handlers.dart
    loader/            WidgetFileReader, AssetWidgetFileReader, MemoryWidgetFileReader
    model/             JsRuntimeConfig, WidgetManifest
    renderer/          JsonWidgetRenderer, theme, bindings, normalizer, field registry
    runtime/           JsWidgetEngine, JsWidgetBridge, bootstrap, engine messages
    widgets/           JsWidgetApp, JsWidgetDemoMenu, JsWidgetRuntimeWidget
example/
  lib/main.dart        Demo app showing the example widgets
  widgets/             Example JS widgets: yolo-hello, calculator, weather, stocks, crypto, animation-showcase
native/
  quickjs/             Vendored QuickJS 2024-01-13 sources (build artifact libquickjs_bridge.so is git-ignored)
  quickjs_bridge.c     C bridge (JSON marshaling, synchronous host callbacks) the FFI layer talks to
scripts/
  pre-commit           Quality gates (tests, coverage, duplication)
  compute_coverage.py  Coverage helper used by CI
  compute_duplication.py  Duplication helper used by CI
tool/
  build_quickjs.sh     Builds native/quickjs/libquickjs_bridge.so (gcc)
```

## Coding Conventions

- Single quotes only.
- Package-relative imports only (`package:js_widget_runtime/...`).
- Keep files under 1500 lines.
- Keep the max CRAP score at or below the `crap.threshold` ratchet in
  `crap4dart.yaml` (run `dart pub global run crap4dart analyze` or
  `./scripts/pre-commit`); the badge in `badges/crap.svg` must stay green.
- Maintain test coverage >= 80% and duplication < 1%.
- Run `./scripts/pre-commit` before pushing.

## JS Widget API

Each widget is an IIFE that receives a global `jsr` object.

Core methods:

- `jsr.render(tree)` — render a JSON UI tree.
- `jsr.onEvent(handler)` — register `handleEvent(actionId, payload)`.
- `jsr.fetchJson(url, opts)` — async HTTP (requires `fetch` permission).
- `jsr.storage.get(key)` / `jsr.storage.set(key, val)` — persistent storage.
- `jsr.secrets.get(key)` / `jsr.secrets.set(key, val)` — secure storage.
- `jsr.exec(cmd)` — run a shell command (host-dependent).
- `jsr.loadAsset(path)` — load an asset file as string.
- `jsr.setTitle(title)` — update widget title.
- `jsr.exportState(obj)` — expose structured state for CLI snapshots.
- `jsr.onKey(handler)` — keyboard input for game-style widgets. The handler receives `{key, code, down, repeat}` where `key` is a camelCase label (`'a'`, `'arrowLeft'`, `'arrowRight'`, `'arrowUp'`, `'arrowDown'`, `'space'`, `'enter'`, ...). Fire-and-forget; no event-done round trip. Keystrokes are never captured while a `textField`/`textArea` node holds focus. Dart side: `JsWidgetEngineBackend.dispatchHostEvent(target, payload)` delivers host events (`'key'`, `'scene3d.tap:<sceneId>'`) to bootstrap listeners. **Host integration**: hosts using `JsWidgetRuntimeWidget` get keyboard capture for free; hosts that build a `JsonWidgetRenderer` tree themselves MUST wrap it with `JsKeyboardCapture(onEvent: (p) => engine.dispatchHostEvent('key', p), child: ...)` or `jsr.onKey` will never fire.
- `jsr.showError(msg)` — render a styled error card.
- `jsr.ease.*` — easing helpers (`linear`, `easeIn`, `easeOut`, `easeInOut`, `bounce`, `elastic`, `backIn`, `backOut`).
- `jsr.scene3d.*` — create/update/destroy 3D scenes, load GLB/GLTF models, set transforms, play animations, control camera and lights. Requires the host to provide a `Js3dHost`.
  - `jsr.scene3d.setTransforms(sceneId, items)` — batched transforms: one bridge message fans out to per-model `setTransform` commands. `items` is `[{modelId, position?, rotation?, scale?}, ...]`. Use this (not N `setTransform` calls) when moving many models per frame.
  - `jsr.scene3d.playAnimation(sceneId, modelId, options)` — `options` is either a clip name string (skeletal), or an object. `{axis, speed}` drives the built-in axis rotation; `{name, loop, speed}` plays a skeletal clip on the flame host via `ModelComponent.playAnimationByName` (flame_3d currently loops at 1x; `loop`/`speed` are accepted but not yet applied). The cube host ignores `name` requests.
  - `jsr.scene3d.stopAnimation(sceneId, modelId)` — stops skeletal playback AND axis rotation.
  - `jsr.scene3d.onTap(sceneId, handler)` — tap picking. On tap the host raycasts from the camera through the tap point and intersects model AABBs; the handler receives `{modelId, point: [x, y, z]}` for the nearest hit or `{modelId: null}` on a miss. The pure math lives in `lib/src/renderer/nodes/hosts/js_3d_raycast.dart` (`js3dRayFromNdc`, `js3dRayIntersectAabb`) and is unit-testable without a GPU.
- `jsr.instanceId` — a per-engine identifier injected before the widget runs. Use it to namespace named resources (e.g. scene ids) so multiple panels running the same widget do not collide: `var sceneId = 'glb-' + jsr.instanceId`. Hosts pass `JsRuntimeConfig.instanceId` for reload-stable ids (e.g. a panel id); otherwise a unique per-process token is generated.
- `setTimeout`, `setInterval`, `requestAnimationFrame`, `console.log` are shimmed.

Renderer effects ported from YoClip: radial gradients, box shadows, blur nodes, `clip: true` on containers, static/3D transforms, text shadows, `textTransform`.

## 3D Support

- Add a `scene3d` node to the JSON tree and a `Js3dHost` to `JsRuntimeConfig.js3dHost`.
- Ready-made hosts ship in the package: `createJs3dHost()` (dispatcher; routes GLB/`engine:'flame'` to `Flame3dHost`, primitives/OBJ to `Cube3dHost`), `createFlame3dHost()` (GLB/GLTF with PBR on Impeller platforms), `createCube3dHost()` (cross-platform primitives + OBJ via flutter_cube).
- `Js3dHost` is an abstraction; custom engines can be plugged by implementing it.
- Examples: `example/widgets/3d-showcase/` (primitives), `example/widgets/3d-glb-showcase/` (DamagedHelmet GLB) and `example/widgets/3d-game-dodge/` (mini game).

## Building Games

The runtime ships a small game-oriented input/output surface on top of `scene3d`:

- **Input**: `jsr.onKey(fn)` delivers `{key, code, down, repeat}`. Track held keys in a map (`keys.left = ev.down`) rather than moving per key event, so motion is frame-rate independent. Text fields keep focus priority — game keys are ignored while a `textField` is focused.
- **Frame loop**: drive the game with `requestAnimationFrame(tick)`; compute `dt` from the elapsed-ms argument.
- **Movement**: batch every model move of a frame into ONE `jsr.scene3d.setTransforms(sceneId, items)` call; spawn/despawn with `addModel`/`removeModel`.
- **Collision**: keep gameplay math (AABB overlap) in JS; use `jsr.scene3d.onTap` only when you need picking.
- **State**: call `jsr.exportState({score, lives, best})` so CLI snapshots stay live, and persist records via `jsr.storage`.
- **HUD**: render score/lives as normal JSON UI around the `scene3d` node; use a `stack` with `positioned` children for game-over overlays.

Reference implementation: `example/widgets/3d-game-dodge/` (Dodge Blocks 3D — Arrow/A-D movement, R to restart).

See the dedicated skill in `.agents/skills/js-widget-authoring/SKILL.md` for the full widget authoring guide.

## Engine Architecture

- `JsWidgetEngine` is a conditional export: VM on native, Web on `dart.library.html`.
- An opt-in QuickJS FFI backend (`lib/src/runtime/js_widget_engine_quickjs.dart`, VM-only — never import it from a web-reachable path) implements the same interface on the vendored QuickJS sources with synchronous host calls (`NativeCallable`). Pass it via `JsRuntimeConfig.backend`; build its native library first with `tool/build_quickjs.sh` (CI does this before `flutter test`).
- `JsWidgetBridge` is platform-agnostic and dispatches `__jsr_*` channels.
- `kJsWidgetBootstrap` defines the JS runtime API. Any new `jsr.*` API must be added here and wired through `JsWidgetBridge` and both VM/Web engines.
- Engine handlers are injected via `JsRuntimeConfig`. The package provides defaults, but hosts override them for real permissions, storage, networking, etc.
- Host-specific JS APIs (e.g., `jsr.yoloit`) are injected via `JsRuntimeConfig.hostBootstrapJs`. Do not add host concepts into the core bootstrap.

See the dedicated skill in `.agents/skills/js-widget-engine/SKILL.md` for how to extend the engine.

## Commands

```bash
# Install dependencies
flutter pub get

# Run tests with coverage
flutter test --coverage

# Run local quality gates
./scripts/pre-commit

# Dry-run publish
flutter pub publish --dry-run

# Publish manually (when authenticated)
flutter pub publish --force
```

## CI / Release

- PRs and pushes to `main` run `.github/workflows/pr.yml` (quality gates).
- Pushes to `main` run `.github/workflows/publish.yml`, which bumps the version, tags it, and publishes to pub.dev via OIDC automated publishing.

## Flutter Version / flame_3d Branch Strategy

CI on `main` is pinned to Flutter 3.44.4 because hosted `flame_3d 0.3.0`
does not compile against the `flutter_gpu` API of Flutter 3.47+ (fixed
upstream in flame-engine/flame#3995 but not yet published to pub.dev).

Two tracks are maintained until the upstream fix is published:

- `main` — hosted `flame_3d: ^0.3.0`, CI pinned to Flutter 3.44.4, publishes
  to pub.dev (pub.dev forbids git dependencies in published packages).
- `flame-3.47` — `flame_3d` from the `IstiN/flame` fork (branch
  `flame_3d-0.3.0-flutter-3.47`, a backport of flame-engine/flame#3995 onto
  0.3.0), CI on Flutter 3.47.0, not published.

`.github/workflows/automerge-main.yml` merges every push to `main` into
`flame-3.47` automatically. If the merge conflicts, it opens (or updates) a
PR `main` → `flame-3.47` for manual resolution. Do not delete the
`flame-3.47` branch while the automerge workflow is active.

Once flame_3d publishes a 3.47-compatible release:

1. Merge `flame-3.47` into `main` (resolve any fallout).
2. Restore `flame_3d: ^0.3.x` from pub.dev in `pubspec.yaml`.
3. Remove the `flutter-version` pin from `pr.yml` and `publish.yml`.
4. Delete `.github/workflows/automerge-main.yml` and the `flame-3.47` branch.
5. Remove this section from `AGENTS.md`.

## Adding New Widget Examples

1. Create `example/widgets/<id>/manifest.json` and `example/widgets/<id>/widget.js`.
2. Add the id to `example/lib/main.dart` in `_widgetIds`.
3. Keep widget JS self-contained and ES5-compatible (no modules, no arrow functions).
4. Add a small test if the widget introduces new renderer types.
