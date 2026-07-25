## 0.4.6

- Add transition animation nodes to the JSON renderer. `entrance` plays a
  one-shot mount animation (`animation`: `fade`, `slideUp`, `slideDown`,
  `slideLeft`, `slideRight`, `scale`, `fadeScale`; `delay` ms for staggered
  list entrances, `duration`, `curve`) — implemented over
  `TweenAnimationBuilder` with an `Interval` curve, so no timers are ever
  scheduled. `animatedSwitcher` wraps Flutter's `AnimatedSwitcher`: when
  `switchKey` changes between renders the old child animates out and the new
  one in (`animation`: `fade`, `slideLeft`, `slideRight`, `slideUp`,
  `scale`, `fadeScale`), keyed via `ValueKey(switchKey)`. Both follow the
  renderer's input tolerance: unknown variants fall back to `fade`, numeric
  strings parse, garbage never crashes. The curve parser is now shared as
  `jsCurve` in `js_node_helpers.dart`.

## 0.4.5

- Add a `map` node to the JSON renderer, built on `flutter_map` + `latlong2`
  with OpenStreetMap tiles (no API key). Props: `center {lat, lng}`, `zoom`,
  `markers [{id, lat, lng, label?, color?}]`, `polylines [{points, color?,
  width?}]`, and `fitBounds` (`true` to fit all markers/polylines, or an
  explicit `[[lat, lng], [lat, lng]]` corner list). Events route through the
  standard bridge: `onTap` fires with `{lat, lng}` and `onMarkerTap` with
  `{id}`. `JsonWidgetRenderer.mapTileProvider` lets hosts/tests inject a
  custom `TileProvider` so tile loading never has to hit the network.

## 0.4.4

- Automated patch bump.

## 0.4.3

- Renderer no longer crashes on malformed numeric props from generated
  widgets: `jsDouble`/`jsDoubleOrNull` now parse numeric strings, take the
  first numeric element of a list, and fall back instead of throwing a cast
  error (e.g. `borderRadius: [14, 14, 0, 0]` previously killed the whole
  render tree). `borderRadius` in decorations, cards, inkWell and clipRRect
  also accepts CSS-style corner lists (`[all]`, `[tl-br, tr-bl]`,
  `[tl, tr-bl, br]`, `[tl, tr, br, bl]`) via the new `jsBorderRadius`.

## 0.4.2

- Fix web compilation of `JsWidgetEngine`: `_defaultBackend` referenced
  `FlutterJsWidgetEngineBackend` unconditionally, but the conditional import
  resolves to the Web Worker backend on the web, so any web build importing
  the wrapper failed with "Method not found: 'FlutterJsWidgetEngineBackend'".
  The platform pick now lives in a factory behind its own conditional import
  (`js_widget_engine_default.dart` / `js_widget_engine_default_web.dart`).

## 0.4.1

- Fix `JsWidgetBridge.callEvent` for rapid-fire gestures: concurrent events
  (tap-down / tap-up / tap) raced on a single completer, so a stale
  `__jsr_event_done` completed the next event early and the following
  callEvent crashed with "Future already completed", permanently wedging
  event delivery (dead buttons in gesture-heavy widgets). Events are now
  serialized through an internal queue, and `__jsr_event_done` handling is
  take-and-null so stray/duplicate dones are ignored.

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
