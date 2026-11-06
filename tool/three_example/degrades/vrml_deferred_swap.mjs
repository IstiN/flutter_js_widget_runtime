// Prepare-time module patch for webgl_loader_vrml.
//
// Symptom (owner round-4): switching the `asset` GUI dropdown IN-APP leaves a
// white/empty canvas until the new VRML scene lands. Root cause: the official
// onChange handler synchronously disposes and removes the current scene and
// only then starts loading the next one (remove-then-load), so the whole
// decode window (VRMLLoader.parse over a multi-MB .wrl, plus the host asset
// round-trip on this runtime) renders an empty scene. The node boot test only
// saw this as a fragile race: its driveAsset pump observes the renderer
// export every ~30 frames and could break out on the `triangles: 0` gap
// before the new scene was added.
//
// Degrade (this file patches the pinned official module bytes at prepare
// time, the ik_mirror_static / dragThrottleHover precedent; every anchor is
// byte-exact against the pinned r186 module and prepare throws on drift):
//
//   (a) the dropdown onChange body is reduced to `loadAsset( value )` — no
//       synchronous dispose/remove;
//   (b) the dispose + remove block moves INTO loadAsset's load callback and
//       runs in the same tick as the swap, so the old scene stays on screen
//       until the new one is parsed (deferred swap: no empty frame ever
//       renders, and the old/new dispose ordering is preserved).
//
// Deviation cost: while a switch is decoding, the PREVIOUS scene keeps
// rendering (official would show an empty scene). Once the new scene parses,
// the old one is disposed exactly as the official code did.

const ON_CHANGE_ANCHOR = `gui.add( params, 'asset', assets ).onChange( function ( value ) {

					if ( vrmlScene ) {

						vrmlScene.traverse( function ( object ) {

							if ( object.material ) object.material.dispose();
							if ( object.material && object.material.map ) object.material.map.dispose();
							if ( object.geometry ) object.geometry.dispose();

						} );

						scene.remove( vrmlScene );

					}

					loadAsset( value );

				} );`;

const ON_CHANGE_REPLACEMENT = `// JSR deferred swap (webgl_loader_vrml): the official handler disposed and
					// removed the current scene synchronously before starting the next
					// load, so the whole parse window rendered an empty (white) canvas.
					// Keep the old scene on screen until the new one is parsed; the
					// dispose block lives in loadAsset's load callback now.
					gui.add( params, 'asset', assets ).onChange( function ( value ) {

						loadAsset( value );

					} );`;

const LOAD_ASSET_ANCHOR = `function loadAsset( asset ) {

				loader.load( 'models/vrml/' + asset + '.wrl', function ( object ) {

					vrmlScene = object;
					scene.add( object );
					controls.reset();

				} );

			}`;

const LOAD_ASSET_REPLACEMENT = `function loadAsset( asset ) {

				const __jsrT0 = performance.now();
				console.log( '[VRjsr] switch ' + asset + ' t0=' + Math.round( __jsrT0 ) );
				loader.load( 'models/vrml/' + asset + '.wrl', function ( object ) {

					console.log( '[VRjsr] onLoad ' + asset + ' ms=' + Math.round( performance.now() - __jsrT0 ) );

					// JSR deferred swap: dispose the old scene only when the new one
					// is ready, so the official remove-then-load gap never renders.
					if ( vrmlScene ) {

						vrmlScene.traverse( function ( object ) {

							if ( object.material ) object.material.dispose();
							if ( object.material && object.material.map ) object.material.map.dispose();
							if ( object.geometry ) object.geometry.dispose();

						} );

						scene.remove( vrmlScene );

					}

					vrmlScene = object;
					scene.add( object );
					controls.reset();
					console.log( '[VRjsr] swapped ' + asset + ' ms=' + Math.round( performance.now() - __jsrT0 ) );

				} );

			}`;

export function applyVrmlDeferredSwapPatch( bytes ) {
	let source = bytes.toString( 'utf8' );

	if ( ! source.includes( ON_CHANGE_ANCHOR ) ) {
		throw new Error( 'vrml_deferred_swap: onChange anchor drifted' );
	}
	source = source.replace( ON_CHANGE_ANCHOR, ON_CHANGE_REPLACEMENT );

	if ( ! source.includes( LOAD_ASSET_ANCHOR ) ) {
		throw new Error( 'vrml_deferred_swap: loadAsset anchor drifted' );
	}
	source = source.replace( LOAD_ASSET_ANCHOR, LOAD_ASSET_REPLACEMENT );

	return Buffer.from( source, 'utf8' );
}
