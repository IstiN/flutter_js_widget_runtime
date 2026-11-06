// Prepare-time module patch for webgl_animation_skinning_ik (R1/WebGL2).
//
// Root cause: the official example mirrors the chrome ball through a dynamic
// WebGLCubeRenderTarget + CubeCamera. R1 stores a cube render target as one
// bounded 2D color target whose pixels are the LAST face written, so the ball
// samples a single face and renders solid white; the six per-frame face
// renders also cost 6 render passes/frame.
//
// Degrade (this file patches the pinned official module bytes at prepare
// time, the helper_fast_path_plugin.mjs precedent): replace the cube-camera
// block with a STATIC CubeTexture baked from six 128x128 RGBA8 DataTexture
// faces painted as a RECOGNIZABLE room (grid-tile floor, bright ceiling
// light patches, blue/red/amber wall panels, a window wall, dark
// baseboards), CubeReflectionMapping — not a render target, so the six
// per-frame face renders are gone entirely. The room structure matters: a
// featureless vertical gradient samples correctly but reads as "no
// reflection" on the ball (in-app capture verdict); recognizable shapes
// make the mirror READ as a mirror. R1's native_renderer._ensureCubeTexture
// lane
// reads each face through its raw RGBA8 `{ data, width, height }` image
// view, so the CubeTexture is built from the DataTextures' `.image` views.
//
// Shading: upstream uses MeshBasicMaterial({ envMap: rt.texture }) and R1
// composites envMap on the ADD path, so black albedo (color 0x000000) means
// pure env = upstream's white-albedo MULTIPLY mirror look.
//
// Every anchor below is verified verbatim against the pinned r186 module;
// prepare throws if upstream drifts.
const INIT_ANCHOR = `\t\t\tconst cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 1024 );
\t\t\tmirrorSphereCamera = new THREE.CubeCamera( 0.05, 50, cubeRenderTarget );
\t\t\tscene.add( mirrorSphereCamera );
\t\t\tconst mirrorSphereMaterial = new THREE.MeshBasicMaterial( { envMap: cubeRenderTarget.texture } );
\t\t\tOOI.sphere.material = mirrorSphereMaterial;`;

const INIT_REPLACEMENT = `\t\t\t// JSR R1 degrade (degrades/ik_mirror_static.mjs): the dynamic CubeCamera
\t\t\t// render target collapses to its last-written face in R1, shading the
\t\t\t// mirror ball solid white. Bake a static mirror-room cube instead:
\t\t\t// six 128x128 RGBA8 DataTexture faces painted with recognizable room
\t\t\t// structure (grid-tile floor, bright ceiling light patches, colored
\t\t\t// wall panels, a window wall, dark baseboards), CubeReflectionMapping
\t\t\t// - exactly the raw-face payload R1's _ensureCubeTexture lane
\t\t\t// accepts, and not a render target, so the six per-frame face
\t\t\t// renders are gone entirely. A featureless gradient samples fine but
\t\t\t// reads as matte shading; recognizable shapes read as reflections.
\t\t\t// Upstream shades the mirror white * env (MULTIPLY); R1 composites
\t\t\t// envMap on the ADD path, so black albedo + pure env reproduces the
\t\t\t// upstream mirror appearance. Caps on R1 stencil are unrelated here.
\t\t\tfunction jsrStaticMirrorRoomCube( THREE ) {

\t\t\t\tconst size = 128;
\t\t\t\tconst faces = [];
\t\t\t\tconst fill = ( data, x0, y0, x1, y1, r, g, b ) => {

\t\t\t\t\tfor ( let y = Math.max( 0, y0 ); y <= Math.min( size - 1, y1 ); y ++ ) {

\t\t\t\t\t\tfor ( let x = Math.max( 0, x0 ); x <= Math.min( size - 1, x1 ); x ++ ) {

\t\t\t\t\t\t\tconst o = ( y * size + x ) * 4;
\t\t\t\t\t\t\tdata[ o ] = r;
\t\t\t\t\t\t\tdata[ o + 1 ] = g;
\t\t\t\t\t\t\tdata[ o + 2 ] = b;
\t\t\t\t\t\t\tdata[ o + 3 ] = 255;

\t\t\t\t\t\t}

\t\t\t\t\t}

\t\t\t\t};
\t\t\t\tfor ( let face = 0; face < 6; face ++ ) {

\t\t\t\t\tconst data = new Uint8Array( size * size * 4 );
\t\t\t\t\tif ( face === 2 ) {

\t\t\t\t\t\t// +Y ceiling: light plaster, two recessed light patches
\t\t\t\t\t\t// (bright rects with thin dark frames).
\t\t\t\t\t\tfill( data, 0, 0, 127, 127, 226, 226, 222 );
\t\t\t\t\t\tfill( data, 18, 18, 62, 50, 92, 92, 88 );
\t\t\t\t\t\tfill( data, 20, 20, 60, 48, 252, 252, 246 );
\t\t\t\t\t\tfill( data, 66, 60, 110, 92, 92, 92, 88 );
\t\t\t\t\t\tfill( data, 68, 62, 108, 90, 252, 252, 246 );

\t\t\t\t\t} else if ( face === 3 ) {

\t\t\t\t\t\t// -Y floor: warm tiles, dark grout grid every 16px, darker
\t\t\t\t\t\t// skirting shadow along the wall line.
\t\t\t\t\t\tfill( data, 0, 0, 127, 127, 212, 184, 156 );
\t\t\t\t\t\tfor ( let k = 0; k < size; k += 16 ) {

\t\t\t\t\t\t\tfill( data, k, 0, k + 1, 127, 96, 84, 74 );
\t\t\t\t\t\t\tfill( data, 0, k, 127, k + 1, 96, 84, 74 );

\t\t\t\t\t\t}
\t\t\t\t\t\tfill( data, 0, 0, 127, 3, 130, 112, 98 );

\t\t\t\t\t} else {

\t\t\t\t\t\t// Walls: sage plaster, crown line, dark baseboard, one
\t\t\t\t\t\t// landmark per wall - blue/red/amber panels and a framed
\t\t\t\t\t\t// window with a mullion cross.
\t\t\t\t\t\tfill( data, 0, 0, 127, 127, 208, 214, 204 );
\t\t\t\t\t\tfill( data, 0, 0, 127, 4, 186, 192, 184 );
\t\t\t\t\t\tfill( data, 0, 116, 127, 127, 98, 100, 96 );
\t\t\t\t\t\tif ( face === 0 ) {

\t\t\t\t\t\t\tfill( data, 22, 26, 65, 85, 34, 62, 138 );
\t\t\t\t\t\t\tfill( data, 24, 28, 63, 83, 54, 98, 204 );

\t\t\t\t\t\t} else if ( face === 1 ) {

\t\t\t\t\t\t\tfill( data, 62, 26, 105, 85, 138, 40, 36 );
\t\t\t\t\t\t\tfill( data, 64, 28, 103, 83, 202, 62, 54 );

\t\t\t\t\t\t} else if ( face === 4 ) {

\t\t\t\t\t\t\tfill( data, 22, 26, 65, 85, 166, 114, 26 );
\t\t\t\t\t\t\tfill( data, 24, 28, 63, 83, 234, 166, 46 );

\t\t\t\t\t\t} else {

\t\t\t\t\t\t\tfill( data, 54, 18, 97, 77, 66, 66, 64 );
\t\t\t\t\t\t\tfill( data, 56, 20, 95, 75, 250, 248, 240 );
\t\t\t\t\t\t\tfill( data, 74, 20, 76, 75, 66, 66, 64 );
\t\t\t\t\t\t\tfill( data, 56, 46, 95, 47, 66, 66, 64 );

\t\t\t\t\t\t}

\t\t\t\t\t}

\t\t\t\t\tfaces.push( new THREE.DataTexture( data, size, size, THREE.RGBAFormat ) );

\t\t\t\t}

\t\t\t\t// R1's cube lane reads each face through its raw RGBA8
\t\t\t\t// { data, width, height } image view (r186 DataTexture stores the
\t\t\t\t// payload under .image), so hand the lane exactly those views.
\t\t\t\tconst cube = new THREE.CubeTexture( faces.map( f => f.image ) );
\t\t\t\tcube.mapping = THREE.CubeReflectionMapping;
\t\t\t\tcube.needsUpdate = true;
\t\t\t\treturn cube;

\t\t\t}

\t\t\tmirrorSphereCamera = null;
\t\t\tconst mirrorSphereMaterial = new THREE.MeshBasicMaterial( { envMap: jsrStaticMirrorRoomCube( THREE ), color: 0x000000 } );
\t\t\tOOI.sphere.material = mirrorSphereMaterial;`;

const ANIMATE_ANCHOR = `\t\t\tif ( OOI.sphere && mirrorSphereCamera ) {

\t\t\t\tOOI.sphere.visible = false;
\t\t\t\tOOI.sphere.getWorldPosition( mirrorSphereCamera.position );
\t\t\t\tmirrorSphereCamera.update( renderer, scene );
\t\t\t\tOOI.sphere.visible = true;

\t\t\t}
`;

// mirrorSphereCamera stays null, so the official guard above would skip the
// block anyway; removing it makes the skip structural instead of accidental.
const ANIMATE_REPLACEMENT = `\t\t\t// JSR R1 degrade (degrades/ik_mirror_static.mjs): the mirror cube is
\t\t\t// baked once at init, so the per-frame CubeCamera update (six face
\t\t\t// renders) is skipped entirely.
`;

export function applyIkMirrorStaticPatch(bytes) {
  const source = bytes.toString('utf8');
  for (const [name, anchor] of [['init cube-camera block', INIT_ANCHOR], ['animate mirror update block', ANIMATE_ANCHOR]]) {
    const count = source.split(anchor).length - 1;
    if (count !== 1) {
      throw new Error(`ik mirror static anchor drifted (${name}): expected exactly 1 occurrence, got ${count} — pinned three source changed`);
    }
  }
  const transformed = source
    .replace(INIT_ANCHOR, INIT_REPLACEMENT)
    .replace(ANIMATE_ANCHOR, ANIMATE_REPLACEMENT);
  return Buffer.from(transformed, 'utf8');
}
