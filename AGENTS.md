# js_widget_runtime Agent Guidance

This guide covers how to work with the `js_widget_runtime` Dart package and its JavaScript widget ecosystem.

## Project Overview

`js_widget_runtime` renders JavaScript widgets as Flutter widgets. It is published to pub.dev as `js_widget_runtime`.

- **VM engine**: `flutter_js` (QuickJS / JavaScriptCore)
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
- `jsr.showError(msg)` — render a styled error card.
- `jsr.ease.*` — easing helpers (`linear`, `easeIn`, `easeOut`, `easeInOut`, `bounce`, `elastic`, `backIn`, `backOut`).
- `setTimeout`, `setInterval`, `requestAnimationFrame`, `console.log` are shimmed.

Renderer effects ported from YoClip: radial gradients, box shadows, blur nodes, `clip: true` on containers, static/3D transforms, text shadows, `textTransform`.

See the dedicated skill in `.agents/skills/js-widget-authoring/SKILL.md` for the full widget authoring guide.

## Engine Architecture

- `JsWidgetEngine` is a conditional export: VM on native, Web on `dart.library.html`.
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

## Adding New Widget Examples

1. Create `example/widgets/<id>/manifest.json` and `example/widgets/<id>/widget.js`.
2. Add the id to `example/lib/main.dart` in `_widgetIds`.
3. Keep widget JS self-contained and ES5-compatible (no modules, no arrow functions).
4. Add a small test if the widget introduces new renderer types.
