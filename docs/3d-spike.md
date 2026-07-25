# Spike: 3D rendering support for games

Decision record for the card "3D rendering support for games". Two options
were evaluated; the software pipeline (option B) won and is implemented as
the `scene3d` node's `meshes` prop.

## Option A: flutter_gl (real OpenGL)

[flutter_gl](https://pub.dev/packages/flutter_gl) exposes OpenGL ES to Dart
via `dart:ffi`, rendering into an FBO that is shared with a Flutter
`Texture` widget. It is the backend `three_dart` builds on.

Findings:

- **Stale.** Last publish 0.0.21 on 2022-10-04, pub score 60, unverified
  publisher, ~388 weekly downloads. Four years without a release is a
  serious risk for a plugin that wraps per-platform native GL code.
- **Platform holes.** iOS/Android/Web/macOS/Windows are claimed; Linux is
  an explicit TODO. Android needs a manual copy of `threeegl.aar` into the
  app project and `minSdkVersion 24` — a host-app integration burden this
  runtime cannot impose silently.
- **Bundle/build cost.** Native EGL/GLES setup per platform, FBO texture
  sharing, share-context juggling (`ThreeEgl`) — all to display a texture.
  Every host app would inherit that build complexity and its failure modes.
- **QuickJS → GL bridge cost.** A JS widget cannot call GL directly; every
  draw would either cross the JS↔Dart bridge per command (far too slow for
  per-frame rendering) or require a serialized GL command queue that Dart
  replays — essentially re-implementing a renderer protocol before any game
  logic exists. Web has the same problem across the worker boundary.

**Verdict: no.** Too much native integration and maintenance risk for the
value, and the bridge problem negates the performance argument for the
simple games this runtime targets.

## Option B: software 3D on CustomPaint (chosen)

A tiny fixed pipeline in pure Dart: perspective-projected triangles,
painter's z-sort, solid fill with flat Lambert shading. Zero native
dependencies, works identically on VM and web, and JS drives animation by
re-rendering with a new `rotation` on a raf/timer tick — which fits the
runtime's existing declarative render model with no protocol work.

### Capability envelope (poly budget guidance)

Rendering happens on the Dart side per re-render; the cost per frame is
roughly linear in triangle count (3 matrix ops + 3 projections + one filled
path per face). Practical guidance for JS game widgets:

- **≤ ~500 triangles** — comfortable at interactive re-render rates
  (10–60 fps depending on device). This covers cubes, low-poly models,
  board-game pieces, dice, simple 3D charts, Snake-3D style games.
- **~500–2,000 triangles** — usable, but throttle re-renders to state
  changes or ~10–15 fps; avoid per-raf full-scene churn on low-end devices.
- **> 2,000 triangles** — not what this node is for. There is no z-buffer,
  no texture mapping, no backface culling, no clipping (faces touching the
  near plane are dropped whole). If a game genuinely needs this, it needs a
  host-provided engine via `Js3dHost` (e.g. `flutter_3d_controller` for
  GLB/GLTF models), not the software path.

Also keep `rotation`/mesh churn cheap on the JS side: mutate numbers and
re-render the node, don't rebuild deep view trees every tick.

### Known limitations

- Painter's sort is per-face average depth; intersecting triangles can
  render in the wrong order (design meshes to avoid intersection).
- Flat shading only (one Lambert term per face, fixed ambient 0.35 floor).
- No textures, no per-vertex colors, no wireframe mode.

## JS API: `scene3d` with `meshes`

```json
{
  "type": "scene3d",
  "width": 300,
  "height": 300,
  "background": "#101018",
  "meshes": [
    {
      "vertices": [[x, y, z], ...],
      "faces": [[i, j, k], ...],
      "color": "#4fc3f7"
    }
  ],
  "camera": {"position": [0, 0, 3.2], "target": [0, 0, 0], "fov": 60},
  "rotation": {"x": 20, "y": 30, "z": 0},
  "light": {"direction": [-0.4, -0.8, -0.6]},
  "onTap": "scene-tapped"
}
```

- `meshes[]` — required for the software path. Each mesh: `vertices`
  (model-space `[x, y, z]` triples), `faces` (index triples into
  `vertices`), `color` (hex). Malformed entries are skipped, never fatal.
- `camera` — `position`, `target` (both `[x, y, z]`), `fov` in degrees
  (clamped 10–150). Defaults: `[0, 0, 3.2]` → origin, fov 60.
- `rotation` — static Euler rotation in degrees applied to all meshes.
  Animate by re-rendering with new values on a raf/timer tick.
- `light.direction` — direction the light travels, for flat shading.
- `onTap` — fires with `{x, y}` local coordinates.
- A `scene3d` node **without** `meshes` still routes to the host-provided
  `Js3dHost` engine (GLB/GLTF path) as before.

### Rotating-cube example

```js
function cubeMesh(color) {
  const v = [];
  for (const x of [-0.5, 0.5])
    for (const y of [-0.5, 0.5])
      for (const z of [-0.5, 0.5]) v.push([x, y, z]);
  const F = [
    [0,1,3],[0,3,2], [4,6,5],[4,7,6], [0,4,5],[0,5,1],
    [2,3,7],[2,7,6], [0,2,6],[0,6,4], [1,5,7],[1,7,3],
  ];
  return { vertices: v, faces: F, color };
}

let angle = 0;
function view() {
  return {
    type: 'scene3d',
    width: 300,
    height: 300,
    background: '#101018',
    meshes: [cubeMesh('#4fc3f7')],
    camera: { position: [0, 0.6, 3.2], target: [0, 0, 0], fov: 55 },
    rotation: { x: angle * 0.6, y: angle, z: 0 },
    light: { direction: [-0.4, -0.8, -0.6] },
    onTap: 'cube-tapped',
  };
}

// Re-render on raf to animate. Events arrive via the single jsr.onEvent
// handler as (actionId, payload).
jsr.onEvent(function(actionId, payload) {
  if (actionId === 'cube-tapped') angle = 0; // reset spin on tap
});
function spin() { angle = (angle + 3) % 360; jsr.render(view()); requestAnimationFrame(spin); }
jsr.render(view());
spin();
```
