# Native THREE example issues (user-reported, intermediate build)

Recorded during interactive run of `example/lib/three_example.dart` after the
physical-degrade/font/background increments. Status: OPEN unless noted.

| # | Example | Symptom | Area | Status |
|---|---------|---------|------|--------|
| 1 | memory | White screen | assets/module | OPEN |
| 2 | decals | Not moving after interaction | input/interaction | OPEN |
| 3 | nurbs | Not interactive (verify if it should be) | input/interaction | OPEN |
| 4 | physical clearcoat | Black screen + white ball flying (only particleLight draws; HDR callback throws `TypeError: not a function`) | assets/materials | IN PROGRESS (main agent) |
| 5 | normal map object space | Gray statue without forms | materials/normal maps | OPEN |
| 6 | points sprites | Black screen | points/sprites | OPEN |
| 7 | panorama cube | White screen | cube render target | OPEN |
| 8 | geometry text | Not interactive | input/interaction | OPEN |
| 9 | draw range | Really slow FPS | performance | OPEN |
| 10 | geometries | Gray figures (verify expected look) | materials | OPEN |
| 11 | skinning morph | Big hands detached from body | skinning/morph | OPEN |
| 12 | skinning blending | Only ~20 FPS | performance | OPEN |
| 13 | shadow map performance | 0–5 FPS | performance | OPEN |

## Notes

- #4 root so far: HDRCubeTextureLoader shim now loads 6 RGBE faces (transcoded
  to raw RGBA at prepare); official onLoad callback throws
  `TypeError: not a function` before scene.background/environment are set.
- Interaction issues (#2/#3/#8) may be per-example event wiring (pointer vs
  document listeners) — check `example_adapter.js` event fan-out.
- Performance issues (#9/#12/#13) need per-frame diagnostics (triangles,
  uploads, plan cost) before optimizing.
