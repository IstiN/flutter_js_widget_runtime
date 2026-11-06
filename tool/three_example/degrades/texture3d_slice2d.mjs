// Prepare-time module patch for webgl_texture3d_partialupdate (R1/WebGL2).
//
// Root cause of the white square: engine_coverage.json pins Data3DTexture as
// web-only (status no, "no native analog"). The official module raymarches a
// 128³ RedFormat Data3DTexture through a GLSL ES 3.0 shader; the bounded R1
// lane lowers that shader to a pass-through of its first bound texture and
// never uploads the 3D texture (no sampler3D), so the box renders the white
// fallback. The CPU side is FINE: R1's copyTextureToTexture lowering has an
// explicit R8 Data3DTexture lane for exactly this widget ("Trust the byte
// layout for the 1-byte-per-texel R8 lane"), so the per-block copies
// accumulate in cloudTexture.image.data.
//
// Degrade (this file patches the pinned official module bytes at prepare
// time, the ik_mirror_static precedent; every anchor is byte-exact against
// the pinned r186 module and prepare throws on drift):
//
// (a) build a 128×128 RGBA8 DataTexture holding the volume's MIDDLE z slice
//     (the exact slice native_renderer's Data3DTexture path would extract),
// (b) point the raymarch material's `map` uniform at it — R1 lowers the
//     shader to a pass-through of that texture, so the box face shows the
//     noise slice instead of the white fallback,
// (c) refresh the slice from the CPU volume after every official
//     copyTextureToTexture, so the growing cloud stays live.
//
// Documented scope (1B gap, engine lane): no per-depth raymarch, no
// smoothstep/threshold shading, no cameraPos parallax — the R1 shader
// lowering drops all custom math by design; the GUI sliders stay wired
// upstream but no longer change the picture. The middle slice is the only
// depth shown. The web (WebGL2) backend is untouched (patch lives inside
// this widget's bundle only).

const CLOUD_TEXTURE_ANCHOR = `\t\t\t\tcloudTexture = texture;`;

const SLICE_CREATE = `\t\t\t\tcloudTexture = texture;

\t\t\t\t// JSR R1 degrade (degrades/texture3d_slice2d.mjs): Data3DTexture is
\t\t\t\t// web-only in the R1 coverage, so the raymarch box rendered the white
\t\t\t\t// fallback. Keep the official CPU volume (R1's copyTextureToTexture
\t\t\t\t// R8 lane accumulates the blocks) and display its middle z slice as a
\t\t\t\t// 2D DataTexture instead.
\t\t\t\tconst cloudSliceSize = INITIAL_CLOUD_SIZE * INITIAL_CLOUD_SIZE;
\t\t\t\tcloudSliceTexture = new THREE.DataTexture(
\t\t\t\t\tnew Uint8Array( cloudSliceSize * 4 ).fill( 0 ),
\t\t\t\t\tINITIAL_CLOUD_SIZE,
\t\t\t\t\tINITIAL_CLOUD_SIZE,
\t\t\t\t\tTHREE.RGBAFormat
\t\t\t\t);
\t\t\t\tcloudSliceTexture.minFilter = THREE.LinearFilter;
\t\t\t\tcloudSliceTexture.magFilter = THREE.LinearFilter;
\t\t\t\tcloudSliceTexture.generateMipmaps = false;
				cloudSliceTexture.needsUpdate = true;
				// JSR R1 degrade note: the lowering's feedback-invariant check
				// (shaderMap.renderTarget === active target) can compare an
				// undefined texture.renderTarget against the unset screen target
				// and unbind the map (white fallback). An inert per-texture
				// sentinel makes the equality never match; upstream three and the
				// render-target lanes never see this field on a plain texture.
				cloudSliceTexture.renderTarget = { jsrSliceSentinel: true };`;

const MAP_ANCHOR = `map: { value: texture },`;

const MAP_REPLACEMENT = `map: { value: cloudSliceTexture }, // JSR R1 degrade (degrades/texture3d_slice2d.mjs)`;

const COPY_ANCHOR = `\t\t\t\t\trenderer.copyTextureToTexture( source, cloudTexture, box, position );`;

const COPY_REPLACEMENT = `\t\t\t\t\trenderer.copyTextureToTexture( source, cloudTexture, box, position );

\t\t\t\t\t// JSR R1 degrade (degrades/texture3d_slice2d.mjs): mirror the block
\t\t\t\t\t// into the displayed z slice (R8 volume -> RGBA slice view). The
					// official 4x4x4 block grid writes z bands 4..11 / 36..43 / 68..75 /
					// 100..107, so the display slice rides the FIRST band instead of
					// the exact middle (which no block ever touches).
\t\t\t\t\tconst sliceTexels = INITIAL_CLOUD_SIZE * INITIAL_CLOUD_SIZE;
\t\t\t\t\tconst volumeData = cloudTexture.image.data;
\t\t\t\t\tconst sliceData = cloudSliceTexture.image.data;
\t\t\t\t\tconst sliceZ = Math.floor( INITIAL_CLOUD_SIZE / 16 );
					const sliceOffset = sliceZ * sliceTexels;
\t\t\t\t\tfor ( let i = 0; i < sliceTexels; i ++ ) {

\t\t\t\t\t\tconst v = volumeData[ sliceOffset + i ];
\t\t\t\t\t\tsliceData[ i * 4 ] = v;
\t\t\t\t\t\tsliceData[ i * 4 + 1 ] = v;
\t\t\t\t\t\tsliceData[ i * 4 + 2 ] = v;
\t\t\t\t\t\tsliceData[ i * 4 + 3 ] = 255;

\t\t\t\t\t}

\t\t\t\t\tcloudSliceTexture.needsUpdate = true;`;

export function applyTexture3dSlice2dPatch(bytes) {
  const source = bytes.toString('utf8');
  const anchors = [
    ['cloudTexture assignment', CLOUD_TEXTURE_ANCHOR],
    ['map uniform', MAP_ANCHOR],
    ['copyTextureToTexture block', COPY_ANCHOR]
  ];
  for (const [name, anchor] of anchors) {
    const count = source.split(anchor).length - 1;
    if (count !== 1) {
      throw new Error(`texture3d slice2d anchor drifted (${name}): expected exactly 1 occurrence, got ${count} — pinned three source changed`);
    }
  }
  const transformed = source
    .replace(CLOUD_TEXTURE_ANCHOR, SLICE_CREATE)
    .replace(MAP_ANCHOR, MAP_REPLACEMENT)
    .replace(COPY_ANCHOR, COPY_REPLACEMENT);
  // cloudSliceTexture needs a module-level declaration; the anchors above live
  // inside init() and animate(), so hoist a `let` next to the existing
  // cloudTexture declaration.
  const declAnchor = /let cloudTexture = null;/;
  if (!declAnchor.test(transformed)) {
    throw new Error('texture3d slice2d anchor drifted (cloudTexture declaration) — pinned three source changed');
  }
  return Buffer.from(transformed.replace(declAnchor, 'let cloudTexture = null;\n\t\tlet cloudSliceTexture = null; // JSR R1 degrade (degrades/texture3d_slice2d.mjs)'), 'utf8');
}
