## 0.4.0

- Add pluggable JS engine backend:
  - New `JsWidgetEngineBackend` interface.
  - `JsRuntimeConfig.backend` lets hosts use a custom engine (e.g. QuickJS FFI).
  - Default backends remain `flutter_js` on VM and Web Worker on web.
- Add host-provided media support for `video`/`audio` nodes:
  - `JsMediaHost`, `JsVideoController`, `JsAudioController` interfaces.
  - `JsonWidgetRenderer.mediaHost` wires real players while the core package
    stays free of heavy native media dependencies.
- Add `ExternalAssetResolver` and `JsonWidgetRenderer.externalAssetResolver`
  for `external:<id>` image sources.
- Add dynamic font loading via `JsFontResolver`, `JsFontLoader`, and the
  `fontFamily` text style prop.

## 0.3.2

- Export `UiViewTreeNormalizer` from the public API so hosts can reuse the same React/HTML-style node-name aliases.

## 0.3.1

- Automated patch bump.

## 0.3.0

- Add `path` node for SVG path stroking with optional progress animation.
- Add `absoluteFill` node (alias `fill`) for expanded background fills.
- Add `stack.fit` support (`expand` / `loose`).
- Add universal effect props (`offsetX`/`offsetY`, `scale`, `rotation`, `opacity`, `blur`) on any node.
- Text improvements:
  - `style.gradient` renders text with a gradient via `ShaderMask`.
  - `style.fontStyle: 'italic'` supported in addition to `italic: true`.
  - `style.lineHeight` aliases `style.height`.
- Image improvements:
  - `asset:` and `file:` source prefixes.
  - Optional `imageResolver` callback for custom image providers.
- Add `customBuilders` map for host-defined node types.
- Add `video` and `audio` placeholder nodes.

## 0.2.0

- Add `jsr.ease.*` easing helpers (`linear`, `easeIn`, `easeOut`, `easeInOut`, `bounce`, `elastic`, `backIn`, `backOut`).
- Add renderer effects from YoClip:
  - Radial gradients (`gradient.type: 'radial'`).
  - Box shadows (`decoration.shadows`).
  - Blur node and `blur` property on containers.
  - `clip: true` on rounded containers.
  - Static 3D transforms (`rotateX`, `rotateY`, `perspective`) on containers.
  - Text shadows and `textTransform` (`uppercase`/`lowercase`).

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
