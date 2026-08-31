# Example widgets — canonical sources

The widgets in this directory are the **single source of truth** for all
jsr widgets that do not use host-specific (fa) bridge APIs. Downstream
catalogs (e.g. `fa_widgets`) consume them read-only via a git submodule
pinned at release tags — they must **never** fork `widget.js` or
`manifest.json` into their own tree.

## Per-widget layout

```
<id>/
  manifest.json   canonical base manifest (see contract below)
  widget.js       widget source (ES5-compatible, self-contained or
                  multi-file via relative imports)
  ...             optional extra files (imported sources, assets)
```

## Manifest contract for downstream catalogs

`manifest.json` is the canonical **base**. A catalog may carry a small
per-widget overlay (icon, categorization, runtime floor), applied on top
of this base at packaging time:

- **Overridable by overlay**: `icon`, `tags`, `author`, `minRuntime`,
  `description`.
- **Forbidden in overlay** (single-sourced here): `id`, `version`, and
  every other field. The published zip name and the update flow ride on
  this `version` — bumping it here (+release tag) is the *only* way a new
  widget build ships downstream.

Rules for edits:

1. `id` equals the directory name.
2. Any change to `widget.js` or `manifest.json` bumps `version` (patch
   for fixes/polish, minor for features) — goldens and logic tests must
   be regenerated/passed, then a release tag cut so catalogs can bump
   their submodule pin.
3. Keep `widget.js` ES5-compatible (no modules/arrow functions); icons
   are stylish inline SVG (see the `svgIcon()` pattern in
   `video-player`), never emoji glyphs inside the UI.
4. Host-specific branding/paths (e.g. an install-dir model URL) do NOT
   belong here — such widgets stay downstream as explicit local forks
   (`"source": "local"` in the catalog overlay).
