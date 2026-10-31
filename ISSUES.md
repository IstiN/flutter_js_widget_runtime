# Native THREE example issues (user-reported, intermediate build)

Recorded during interactive run of `example/lib/three_example.dart` after the
physical-degrade/font/background increments. Status: OPEN unless noted.

| # | Example | Symptom | Area | Status |
|---|---------|---------|------|--------|
| 1 | memory | White screen | assets/module | FIXED — synchronous local-RGBA CanvasTexture adoption before same-tick disposal; mapped 256×256 wireframe verified |
| 2 | decals | Not moving after interaction | input/interaction | FIXED — pointer input verified; polygonOffset now degrades to base depth bias with a once-per-material warning instead of aborting every RAF |
| 3 | nurbs | Not interactive (verify if it should be) | input/interaction | FIXED — official custom container/document drag (not OrbitControls) now receives complete pointer fan-out; group rotation regression verified |
| 4 | physical clearcoat | Black screen + white ball flying | assets/materials | FIXED (e40756f) — FlakesTexture shim (fillRect-only canvas2d), float CSS rgb() parser, HDR->RGBA faces, scene.environment fallback; 4 spheres + skybox + 6 textures verified |
| 5 | normal map object space | Gray statue without forms | materials/normal maps | FIXED — externalized Nefertiti's bufferView images to registered URIs (QuickJS has no Blob); color + normal maps verified |
| 6 | points sprites | Black screen | points/sprites | FIXED — predecoded all five grayscale+alpha sprites to pinned raw RGBA8; 5 additive textured point clouds verified |
| 7 | panorama cube | White screen | cube render target | FIXED — ImageLoader now host-decodes raw RGBA and bounded canvas drawImage slices all six atlas faces; six textured draws and flat upload counters verified |
| 8 | geometry text | Not interactive | input/interaction | FIXED — official custom container/document drag (not OrbitControls) now receives complete pointer fan-out; group rotation regression verified |
| 9 | draw range | Really slow FPS | performance | FIXED — rendered range-window count respects the official cap; dynamic positions are invalidated per frame instead of hashed during planning, eliminating repeat geometry uploads |
| 10 | geometries | Gray figures (verify expected look) | materials | FIXED — registered the pinned uv_grid_opengl.jpg asset; one sRGB repeat map shared by all 16 meshes verified |
| 11 | skinning morph | Big hands detached from body | skinning/morph | CLOSED (upstream parity) — RobotExpressive hand pose matches official r186; all 1,108 hand vertices match THREE.getVertexPosition within 3.7e-9 and native/official captures match |
| 12 | skinning blending | Only ~20 FPS | performance | FIXED — native skin weights/indices are precomputed per geometry instead of every frame; paused animation retains skin and command caches with flat texture/geometry counters |
| 13 | shadow map performance | 0–5 FPS | performance | FIXED — morph normals and 1,600-equivalent draw state use native caches/dedup; shadow content signatures retain unaffected maps, and SunLight renders its single visible cascade |

## Notes

- #4 root so far: HDRCubeTextureLoader shim now loads 6 RGBE faces (transcoded
  to raw RGBA at prepare); official onLoad callback throws
  `TypeError: not a function` before scene.background/environment are set.
- Interaction issues (#2/#3/#8) may be per-example event wiring (pointer vs
  document listeners) — check `example_adapter.js` event fan-out.
- Performance issues (#9/#12/#13) need per-frame diagnostics (triangles,
  uploads, plan cost) before optimizing.
