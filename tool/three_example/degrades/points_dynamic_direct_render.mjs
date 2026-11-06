// Prepare-time module patch for webgl_points_dynamic (JSR bounded degrade).
//
// The official render() ends in `composer.render( 0.01 )` — an
// EffectComposer chain of RenderPass + BloomPass + FilmPass + FocusShader
// ShaderPass + OutputPass, i.e. ~4 full-screen render-target round trips
// per frame at 3024x1734. The JSR R1 runtime ALREADY lowers these passes:
// its postprocess lane drops the bloom/film/focus math and runs the chain
// as RGBA8 blits (the widget's own boot log prints
// "R1 lowers ... custom lighting, raymarch and postprocess math are
// dropped"). The runtime therefore pays the full RT-pass envelope cost for
// zero kept effect, which pins the widget at ~18 presented fps while the
// QuickJS side only needs ~6.9ms/frame (measured probe diagnostics:
// frameMs 6.874, presentedFps 18.0, pendingPresentations 8 — the Dart
// pipeline is the bottleneck, not JS).
//
// Degrade (anchors are byte-exact against the pinned r186 module; prepare
// throws on drift; official_module.js keeps the pinned bytes):
//   `composer.render( 0.01 )` -> `renderer.render( scene, camera )`.
//
// Deviation: the scene renders directly without the composer's
// render-target passes. Since R1 drops the bloom/film/focus math anyway,
// the only visual delta is the OutputPass tone/color handling; the points
// animation, materials, colors and point sizes are untouched. The composer
// is still constructed and resized (only the per-frame render call is
// redirected), keeping the official module's structure intact.

const COMPOSER_RENDER_ANCHOR = `composer.render( 0.01 );`;

const COMPOSER_RENDER_REPLACEMENT = `// JSR direct render (points_dynamic): R1 lowers the composer passes with
				// the bloom/film/focus math dropped, so the RT-pass chain only added
				// full-screen envelope cost. Render the scene directly; the composer
				// still exists and is resized for parity.
				renderer.render( scene, camera );`;

export function applyPointsDynamicDirectRenderPatch(bytes) {
	let source = bytes.toString('utf8');

	const count = source.split(COMPOSER_RENDER_ANCHOR).length - 1;
	if (count !== 1) {
		throw new Error(
			`points_dynamic_direct_render: composer.render anchor drift (expected 1, got ${count})`
		);
	}
	source = source.replace(COMPOSER_RENDER_ANCHOR, COMPOSER_RENDER_REPLACEMENT);

	return Buffer.from(source, 'utf8');
}
