# js_widget_runtime Agent Guidance

This guide covers how to work with the `js_widget_runtime` Dart package and its JavaScript widget ecosystem.

## Project Overview

`js_widget_runtime` renders JavaScript widgets as Flutter widgets. It is published to pub.dev as `js_widget_runtime`.

- **VM engine**: `flutter_js` (QuickJS / JavaScriptCore)
- **Opt-in VM engine**: QuickJS FFI backend (from the pure-Dart `quickjs_runtime` package, synchronous host calls) via `JsRuntimeConfig.backend`
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
scripts/
  pre-commit           Quality gates (tests, coverage, duplication)
  compute_coverage.py  Coverage helper used by CI
  compute_duplication.py  Duplication helper used by CI
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
- `jsr.hostCall(name, args)` — generic host-provided async capability routed to
  `JsRuntimeConfig.onHostCall` (bridge channel `__jsr_host_call`, standard
  resolve path, works on VM engines and the web worker). Host shims
  (`jsr.fa.*`, `jsr.yoloit.*`) build on it instead of hardcoding channels;
  when no handler is configured the promise rejects.
- `jsr.loadAsset(path)` — load an asset file as string.
- **Multi-file widgets**: relative ES-module-style imports are inlined at load time — `import './helpers.js'` / `import { x } from './lib/x.js'` (exports stripped, each file inlined once, `../` resolved). No manifest `files` list needed (it still works as an explicit ordered concat). `jsr.include('path')` inlines a file at the call site. No runtime module system: no bare package specifiers, no dynamic import.
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
  - `jsr.scene3d.addModel(sceneId, {..., color})` (flame host only) — `color: '#rrggbb'` multiplies every surface albedo, tinting a GLB whose own palette does not fit the host theme (e.g. the fitness-trainer mannequin). Note flame_3d's GLB parser drops node TRS transforms, so exports with baked node rotations (e.g. DamagedHelmet's -90° X) need that rotation re-applied via `addModel({rotation})`.
- `jsr.viewport()` / `jsr.onViewport(fn)` — the container size allotted to the widget (tiles, panels, full screen) and change notifications; hosts on `JsWidgetRuntimeWidget` report it automatically via the `'viewport'` host event.
- `jsr.breakpoint(width?)` / `jsr.adaptive({compact, medium, expanded})` — Material 3 window size classes (<600 / 600–840 / ≥840) for JS-side values. For subtree switching prefer the renderer's `adaptive` node (`{compact, medium, expanded, breakpoints?}`, LayoutBuilder-based); `gridView.maxCrossAxisExtent` floats the column count with width.
- `jsr.instanceId` — a per-engine identifier injected before the widget runs. Use it to namespace named resources (e.g. scene ids) so multiple panels running the same widget do not collide: `var sceneId = 'glb-' + jsr.instanceId`. Hosts pass `JsRuntimeConfig.instanceId` for reload-stable ids (e.g. a panel id); otherwise a unique per-process token is generated.
- `setTimeout`, `setInterval`, `requestAnimationFrame`, `console.log` are shimmed.

`jsr.theme` keys: `isDark`, `bg`, `surface`, `surfaceAlt`, `border`, `borderBright`, `accent`, `accent2`, `onAccent`, `text`, `muted`. Host `updateTheme` payloads are MERGED onto the bootstrap defaults (`Object.assign`), so a partial map no longer wipes the keys it omits.

Layout contract: hosts embed widgets at arbitrary heights (landing cards ~150 px, panels, full screen). The root node of a widget SHOULD be scrollable (`listView` with `shrinkWrap: false` + padding, or `scroll`) unless the content provably fits ~150 px — a fixed centered column will paint BOTTOM OVERFLOWED stripes in a short host. The renderer deliberately does NOT auto-wrap the root in a scroll view; scrollability is the widget's choice.

Renderer effects ported from YoClip: radial gradients, box shadows, blur nodes, `clip: true` on containers, static/3D transforms, text shadows, `textTransform`.

## 3D Support

- Add a `scene3d` node to the JSON tree and a `Js3dHost` to `JsRuntimeConfig.js3dHost`.
- Ready-made hosts ship in the package: `createJs3dHost()` (dispatcher; routes GLB/`engine:'flame'` to `Flame3dHost`, primitives/OBJ to `Cube3dHost`), `createFlame3dHost()` (GLB/GLTF with PBR on Impeller platforms), `createCube3dHost()` (cross-platform primitives + OBJ via flutter_cube).
- GLB source resolution (`Js3dUrlGlbParser`): `http(s)://` fetched as bytes → `createJs3dHost(fileBytesLoader: …)` / `createFlame3dHost(fileBytesLoader: …)` (`Js3dFileBytesLoader = Future<Uint8List?> Function(String src)` — for sandboxed installs outside the asset bundle, e.g. `Documents/fah_sandbox/apps/...`; return null to fall through) → existing local file path (optionally `file://`) read directly on the VM → stock asset-bundle parser.
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
- An opt-in QuickJS FFI backend (`lib/src/runtime/js_widget_engine_quickjs.dart`, VM-only — never import it from a web-reachable path) implements the same interface on the [quickjs_runtime](https://github.com/IstiN/quickjs_runtime) package (pure Dart, usable from CLI tools without the Flutter SDK) with synchronous host calls (`NativeCallable`). Pass it via `JsRuntimeConfig.backend`; build its native library inside the package checkout (`bash <quickjs_runtime>/tool/build_quickjs.sh`, CI does this before `flutter test`) or point `JSR_QUICKJS_LIB` at an existing `libquickjs_bridge.so`.
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

## Flutter Version / flame_3d Vendoring

The package compiles and tests on current Flutter stable (3.47.x). Hosted
`flame_3d 0.3.0` does not compile against the `flutter_gpu` API of Flutter
3.47+ (fixed upstream in flame-engine/flame#3995 but not yet published to
pub.dev), and pub.dev forbids git dependencies in published packages — so the
flame_3d-backed GLB/glTF host uses **vendored** flame_3d sources instead of a
hosted dependency:

- `lib/src/flame_3d_vendor/` — flame_3d 0.3.0 + the #3995 backport (source:
  IstiN/flame fork commit `fad05ce`), with `package:flame_3d/…` imports
  rewritten to the vendor path. See `lib/src/flame_3d_vendor/VENDOR.md`.
- `assets/flame_3d/shaders/` — the shader bundles, declared in pubspec;
  asset keys are rewritten accordingly. The quality gates (jscpd, lcov
  coverage, crap4dart) exclude the vendor directory.
- pubspec declares flame_3d's transitive deps explicitly (`collection`,
  `meta`, `ordered_set`, `flutter_gpu`).

Do not hand-edit vendored files except to carry upstream flame_3d commits.
Maintenance rules and the drop-the-vendor checklist live in VENDOR.md.

Once flame_3d publishes a 3.47-compatible release:

1. Delete `lib/src/flame_3d_vendor/` and `assets/flame_3d/`.
2. Restore `flame_3d: ^<published>` in `pubspec.yaml` and remove the
   vendored-only dependencies if nothing else uses them.
3. Re-point the shader asset keys / imports per VENDOR.md and remove the
   vendor excludes from `.jscpd.json`, `crap4dart.yaml`, `scripts/pre-commit`
   and `pr.yml`.
4. Remove this section from `AGENTS.md`.

## Embedded Web Content

- `webView` node: `{src, width?, height?, onMessage?}`; renders a placeholder
  until the host passes a `JsWebViewHost` via `JsRuntimeConfig.webViewHost`.
- Web builds: the core ships `createIframeWebViewHost()` (iframe platform
  view; cross-origin pages must allow framing — `X-Frame-Options`/CSP
  `frame-ancestors` render blank). Page-to-widget bridge:
  `window.parent.postMessage({type: 'jsr', data: '...'}, '*')`.
- VM: implement `JsWebViewHost` over `flutter_inappwebview` (reference:
  `example/lib/webview_host.dart`; iOS/Android/macOS — Linux/Windows get the
  placeholder). Bridge: `window.flutter_inappwebview.callHandler('jsr', msg)`.
- Messages fire the node's `onMessage` event id with payload `{value: msg}`.
- Example widget: `webview-showcase`.

## Media Playback

- `video` / `audio` / `audio_player` nodes render placeholders until the host
  passes a `JsMediaHost` via `JsRuntimeConfig.mediaHost` (wired through to
  `JsonWidgetRenderer`; the core package ships no media plugins by design).
- Reference implementation: `example/lib/media_host.dart` (`ExampleMediaHost`
  — video_player surfaces + audioplayers transport; `https?://` and
  `assets/…` sources). Hosts may back the same interface with `media_kit`.
- Web builds: the core ships `createWebMediaHost()` (conditional export,
  like the iframe web-view host) — HTML `<video>`/`<audio>` elements behind
  `JsMediaHost`: position/duration/playing streams, seek/volume/loop,
  `object-fit` mapping, autoplay-policy-safe `play()`. The web preview
  runner uses it; VM hosts use the reference implementation.
- `audio_player` is a zero-size driver node for JS-controlled playback:
  recompute `src`/`playing`/`volume`/`loop`/`seekToMs` props every render.
- Example widgets: `audio-player`, `video-player`.

## Adding New Widget Examples

**`example/widgets/` is the single source of truth** for every widget that
does not use host-specific bridge APIs. Downstream catalogs (fa_widgets)
consume these files read-only via a git submodule pinned at release tags —
never copy a shared widget's sources elsewhere. The canonical-manifest and
overlay contract lives in `example/widgets/README.md`; any `widget.js` /
`manifest.json` change must bump `version` and ship via a release tag.

1. Create `example/widgets/<id>/manifest.json` and `example/widgets/<id>/widget.js`.
2. Add the id to `example/lib/main.dart` in `_widgetIds`.
3. Keep widget JS self-contained and ES5-compatible (no modules, no arrow functions); icons are stylish inline SVG, not emoji.
4. Add a small test if the widget introduces new renderer types.
5. Refresh the README gallery (`doc/widgets/<id>.png` + a row in the README table).

## Gallery Screenshots

The README gallery images in `doc/widgets/` come from two sources:

- **Golden tests** (`flutter test test/golden/js_widget_golden_test.dart --update-goldens`,
  then copy `test/golden/goldens/*.png`) — everything except GLB scenes and
  the map. Goldens run the QuickJS backend with fixture data and a frozen
  clock (`Date.now` is pinned), so they are deterministic.
- **The screenshot harness** (`example/lib/screenshot.dart`) — for widgets
  that need a real GPU or network (`3d-glb-showcase`, `fitness-trainer`,
  `map`). Build once with `cd example && flutter build macos -t lib/screenshot.dart`,
  then run the bundled binary with `JSR_WIDGET=<id> JSR_OUT=<png>` (add
  `JSR_WIDGET_PATH=<file>` to load an edited widget.js from disk instead of
  the bundled asset — no rebuild while iterating on camera/lighting).
  The binary waits 8s, captures a `RepaintBoundary` at 2x and exits. The
  macOS app must keep sandbox disabled (`Release.entitlements` and
  `DebugProfile.entitlements` — the debug build is the one with live
  asserts, useful for catching flame lifecycle races) and
  `FLTEnableImpeller`/`FLTEnableFlutterGPU` in `Info.plist`, or GLB scenes
  render nothing.

## Web Preview Runner

`example/lib/preview.dart` is a web-only entry point that renders one widget
full-bleed through `JsWidgetRuntimeWidget` — it powers the live previews on
fa1.dev (`/widgets/preview/`), replacing the old hand-written DOM/CSS shim.

- **Build**: `cd example && flutter build web -t lib/preview.dart --base-href /widgets/preview/`
  (CI: `.github/workflows/preview-web.yml` uploads the `jsr-preview-web`
  artifact; the fa1.dev deploy workflow in the flutter_agent repo downloads
  it and serves it under `/widgets/preview/`).
- **URL contract**: `?widget=<id>&theme=dark|light` (theme optional, default
  dark). Files are fetched from
  `https://raw.githubusercontent.com/IstiN/fa_widgets/main/widgets/<id>/`
  (override with `?base=<url>`) via `HttpWidgetFileReader`, a
  `WidgetFileReader` over `fetch` — multi-file widgets and `jsr.include`
  imports resolve through it on demand.
- **Permissions**: `fetch` is allowed only when the widget manifest sets
  `"network": true` (`isPermissionAllowed`); storage/secrets are the default
  in-memory handlers; `exec` is unavailable on web.
- The entry point imports `package:web` (fetch, `document.title`), so it
  only builds for web — like `screenshot.dart` only builds for macOS.
- **GitHub Pages**: `.github/workflows/pages.yml` deploys the live demo
  site to <https://istin.github.io/flutter_js_widget_runtime/> — the
  landing page `site/index.html` (cards built from the fa_widgets
  `catalog.json`) at the root, the runner under `/preview/` built with
  `--base-href /flutter_js_widget_runtime/preview/`. Same workflow shape:
  build → `actions/upload-pages-artifact` → `actions/deploy-pages`.
- **Known limitation**: GLB/`flame_3d` scenes (`3d-glb-showcase`,
  `fitness-trainer`) need flutter_gpu and render nothing on web;
  flutter_cube primitives (`3d-showcase`) work.
