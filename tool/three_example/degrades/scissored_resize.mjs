// Keep the official split-screen examples live across the native host's
// initial 640x360 -> real viewport resize. These r186 modules capture
// SCREEN_WIDTH/SCREEN_HEIGHT as const before the first native viewport event,
// then use those values for every scissor rectangle. Without this bounded
// source adaptation the scene is clipped to the stale lower-left rectangle.
// The pinned official_module.js remains untouched; this transform runs only
// while preparing the native widget bundle and throws if an anchor drifts.

const WIDTH_ANCHOR = 'const SCREEN_WIDTH = window.innerWidth;';
const HEIGHT_ANCHOR = 'const SCREEN_HEIGHT = window.innerHeight;';

export function applyScissoredResizePatch(bytes) {
  const source = bytes.toString('utf8');
  for (const [name, anchor] of [['width', WIDTH_ANCHOR], ['height', HEIGHT_ANCHOR]]) {
    const count = source.split(anchor).length - 1;
    if (count !== 1) {
      throw new Error(`scissored resize anchor drifted (${name}): expected exactly 1 occurrence, got ${count}`);
    }
  }
  let transformed = source
    .replace(WIDTH_ANCHOR, 'let SCREEN_WIDTH = window.innerWidth;')
    .replace(HEIGHT_ANCHOR, 'let SCREEN_HEIGHT = window.innerHeight;');

  // Mouse coordinates use the same captured dimensions in the three split
  // screen modules. They are optional so this patch stays narrowly scoped.
  transformed = transformed
    .replace('const windowHalfX = window.innerWidth / 2;', 'let windowHalfX = window.innerWidth / 2;')
    .replace('const windowHalfY = window.innerHeight / 2;', 'let windowHalfY = window.innerHeight / 2;');

  const anchor = '\t\t\tlet SCREEN_HEIGHT = window.innerHeight;';
  if (!transformed.includes(anchor)) {
    throw new Error('scissored resize insertion anchor drifted');
  }
  const hook = `

			// JSR R1 compatibility: refresh captured split-screen dimensions after
			// the host's first real viewport report and every later resize.
			window.addEventListener( 'resize', function () {

				SCREEN_WIDTH = window.innerWidth;
				SCREEN_HEIGHT = window.innerHeight;
				if ( typeof windowHalfX !== 'undefined' ) windowHalfX = SCREEN_WIDTH / 2;
				if ( typeof windowHalfY !== 'undefined' ) windowHalfY = SCREEN_HEIGHT / 2;
				if ( typeof camera !== 'undefined' && camera && camera.isPerspectiveCamera ) {

					camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
					camera.updateProjectionMatrix();

				}
				if ( typeof renderer !== 'undefined' && renderer ) renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

			} );`;
  transformed = transformed.replace(anchor, `${anchor}${hook}`);
  return Buffer.from(transformed, 'utf8');
}
