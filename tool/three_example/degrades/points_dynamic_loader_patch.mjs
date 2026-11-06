// Prepare-time module patch for webgl_points_dynamic (JSR bounded degrade).
//
// The module's `const loader = new OBJLoader();` bypasses the facade
// entirely: OBJLoader is a bundled addon (three/addons/loaders/OBJLoader.js
// resolves to the pinned addon source), so facadeWraps never see it and the
// points degrade (fast OBJ byte lane + stride decimation, see
// degrades/points_dynamic_compat.mjs which installs
// globalThis.__jsrPointsObjLoaderWrap at boot) never engaged — measured
// in-app: no "bounded degrade decimated" boot warning, full-count clouds,
// 1.855MB R1 submit per frame, 18.0 presented fps.
//
// Degrade (anchors byte-exact against the pinned r186 module; prepare
// throws on drift; official_module.js keeps the pinned bytes): route the
// loader through the compat wrap installed by the compat module at boot.
// The compat wrap falls back to the untouched Base class whenever the hook
// is absent, so the patch is inert on runtimes without the compat.

const LOADER_ANCHOR = `const loader = new OBJLoader();`;

const LOADER_REPLACEMENT = `// JSR points degrade: OBJLoader is a bundled addon, so the facade wrap lane
				// cannot reach it; route this instance through the compat wrap (fast
				// OBJ byte lane + stride decimation, see
				// degrades/points_dynamic_compat.mjs). Falls back to the plain class
				// when the compat hook is absent.
				const loader = new ( typeof globalThis.__jsrPointsObjLoaderWrap === 'function'
					? globalThis.__jsrPointsObjLoaderWrap( OBJLoader )
					: OBJLoader )();`;

export function applyPointsDynamicLoaderPatch(bytes) {
	let source = bytes.toString('utf8');

	const count = source.split(LOADER_ANCHOR).length - 1;
	if (count !== 1) {
		throw new Error(
			`points_dynamic_loader: OBJLoader anchor drift (expected 1, got ${count})`
		);
	}
	source = source.replace(LOADER_ANCHOR, LOADER_REPLACEMENT);

	return Buffer.from(source, 'utf8');
}
