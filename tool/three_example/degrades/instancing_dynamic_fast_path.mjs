// webgl_instancing_dynamic updates 10,000 translation*positive-scale matrices
// per frame through getMatrixAt -> Matrix4.decompose -> Object3D.updateMatrix
// -> setMatrixAt. On QuickJS that is >60 ms/frame even though only the Y
// translation changes. This anchored prepare patch writes the SAME Y directly
// into the column-major instance array and keeps the color-wave math exact.
// Bounding spheres become conservative (radius + max Y travel = 1) instead of
// being rebuilt over all 10k instances every frame.

const LOOP_ANCHOR = `				for ( let i = 0; i < mesh.count; i ++ ) {

					mesh.getMatrixAt( i, dummy.matrix );
					dummy.matrix.decompose( dummy.position, dummy.quaternion, dummy.scale );

					dummy.position.y = Math.abs( Math.sin( ( time + seeds[ i ] ) * 2 + seeds[ i ] ) );

					dummy.updateMatrix();

					mesh.setMatrixAt( i, dummy.matrix );

					// colors

					if ( animation.t > 0 ) {

						const currentColor = colors[ currentColorIndex ];
						const nextColor = colors[ nextColorIndex ];
			
						const f = dummy.position.length() / maxDistance;

						if ( f <= animation.t ) {

							color.set( baseColors[ i ] ).multiply( nextColor );

						} else {

							color.set( baseColors[ i ] ).multiply( currentColor );

						}

						mesh.setColorAt( i, color );

					}

				}`;

const LOOP_REPLACEMENT = `				const instanceMatrices = mesh.instanceMatrix.array;
				for ( let i = 0, offset = 0; i < mesh.count; i ++, offset += 16 ) {

					const px = instanceMatrices[ offset + 12 ];
					const pz = instanceMatrices[ offset + 14 ];
					const py = Math.abs( Math.sin( ( time + seeds[ i ] ) * 2 + seeds[ i ] ) );
					instanceMatrices[ offset + 13 ] = py;

					// colors — same radial wave as upstream, without a dummy
					// Vector3 / Matrix4 round trip per instance.
					if ( animation.t > 0 ) {

						const currentColor = colors[ currentColorIndex ];
						const nextColor = colors[ nextColorIndex ];
						const f = Math.sqrt( px * px + py * py + pz * pz ) / maxDistance;

						if ( f <= animation.t ) {

							color.set( baseColors[ i ] ).multiply( nextColor );

						} else {

							color.set( baseColors[ i ] ).multiply( currentColor );

						}

						mesh.setColorAt( i, color );

					}

				}`;

const BOUNDS_ANCHOR = `				mesh.computeBoundingSphere();`;
const BOUNDS_REPLACEMENT = `				if ( ! mesh.__jsrDynamicBounds ) {
					mesh.computeBoundingSphere();
					mesh.boundingSphere.radius += 1; // conservative max Y travel
					mesh.__jsrDynamicBounds = true;
				}`;

export function applyInstancingDynamicFastPathPatch(bytes) {
  let source = Buffer.from(bytes).toString('utf8');
  if (!source.includes(LOOP_ANCHOR)) throw new Error('instancing_dynamic: matrix-loop anchor drifted');
  if (!source.includes(BOUNDS_ANCHOR)) throw new Error('instancing_dynamic: bounds anchor drifted');
  source = source.replace(LOOP_ANCHOR, LOOP_REPLACEMENT);
  source = source.replace(BOUNDS_ANCHOR, BOUNDS_REPLACEMENT);
  console.warn('three: R1 uses direct typed-array Y updates and conservative cached bounds for 10,000 dynamic instances.');
  return Buffer.from(source, 'utf8');
}
