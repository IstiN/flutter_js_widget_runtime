# Vendored flame_3d

This directory is a vendored copy of [`flame_3d` 0.3.0]
(https://pub.dev/packages/flame_3d) (flame-engine/flame, MIT license — see
[LICENSE](LICENSE)), plus one fix commit.

## Why vendored

Hosted `flame_3d` 0.3.0 does not compile against the `flutter_gpu` API that
ships with Flutter 3.47+ (the fix upstream is flame-engine/flame#3995, commit
`0453bad6`, not yet published to pub.dev at the time of vendoring). A package
published to pub.dev may not declare git dependencies, and consumers
(downstream hosts such as flutter_agent) build on current stable Flutter — so
the only way to ship a 3.47-compatible `js_widget_runtime` from pub.dev is to
carry the patched sources inline.

The fix is upstream flame-engine/flame#3995 backported onto the 0.3.0
baseline; it was first maintained as the `flame_3d-0.3.0-flutter-3.47` branch
of the IstiN/flame fork (commit `fad05ce`), which is the exact source of this
copy:

- `lib/**` → `lib/src/flame_3d_vendor/**` with mechanical rewrites
  `package:flame_3d/` → `package:js_widget_runtime/src/flame_3d_vendor/`.
- `assets/shaders/**` → `assets/flame_3d/shaders/**` (declared in this
  package's pubspec; shader asset keys rewritten accordingly).
- No functional changes beyond the fork commit itself (async shader library
  preloading via `AssetManifest`, bind-time counts passed to `draw`/
  `drawIndexed`, regenerated shaderbundles, `ColorTexture` super params).

## Maintenance rules

- Do not hand-edit vendored files except to carry upstream flame_3d commits.
- When flame_3d publishes a release that compiles on the supported Flutter
  stable: delete this directory, `assets/flame_3d/`, the extra pubspec
  dependencies added for it (`collection`, `meta`, `ordered_set`,
  `flutter_gpu` — if nothing else uses them) and restore
  `flame_3d: ^<published>` in `pubspec.yaml`.
