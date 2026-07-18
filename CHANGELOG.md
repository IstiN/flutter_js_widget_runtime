## 0.1.1

- Automated patch bump.

## 0.1.0

- **BREAKING CHANGE**: Rename global JS object and channels from `yoloit` to `jsr`.
  - All widgets must use `jsr.render()`, `jsr.onEvent()`, `jsr.fetchJson()`, etc.
  - All internal bridge channels are now prefixed with `__jsr_` instead of `__yoloit_`.
- Add `JsRuntimeConfig.hostBootstrapJs` so hosts can inject host-specific APIs (e.g., `jsr.yoloit = {...}`) without polluting the core runtime.
- Update example widgets and documentation to use the new `jsr` API.
- Add `AGENTS.md`, `CLAUDE.md`, and agent skills for widget authoring and engine maintenance.

## 0.0.7

- Automated patch bump.

## 0.0.6

- Automated patch bump.

## 0.0.5

- Automated patch bump.

## 0.0.4

- Automated patch bump.

## 0.0.3

- Automated patch bump.

## 0.0.2

- Automated patch bump.

# Changelog

## 0.0.1

- Initial release.
- JavaScript widget runtime for Flutter (VM via `flutter_js`, web via Web Workers).
- JSON-to-Flutter renderer (`JsonWidgetRenderer`) with layout, input, list, image, chart and animation nodes.
- Widget manifest loader (`WidgetManifest`, `WidgetFileReader`, `AssetWidgetFileReader`).
- Bridge APIs: `render`, `fetchJson`, `exec`, `storage`, `secrets`, timers and `requestAnimationFrame`.
