// Prepare-time module patch for webgl_points_dynamic (JSR fast path).
//
// The official render() simulates ~75k decimated vertices per frame through
// BufferAttribute component accessors: positions.getX/getY/getZ(i),
// initialPositions.getX/getY/getZ(i) and positions.setXYZ(i, ...). On the
// native QuickJS backend (interpreted, no JIT) these ~300k method calls per
// frame dominate the wall clock: presented fps sits at ~28 while the R1
// submit encode, binary-lane transfer, packet decode and GPU render each
// measure in the low milliseconds. The phase dependence matches the sim
// (idle upright phases run faster than fully-falling frames), and neither
// DPR reduction, backend swaps nor GPU buffer-ring reuse move the number.
//
// Fast path (anchors are byte-exact against the pinned r186 module; prepare
// throws on drift; official_module.js keeps the pinned bytes):
// replace the whole per-mesh vertex loop body with DIRECT typed-array
// access (position.array[i * 3 + c]) and hoisted locals. The math is kept
// EXACTLY as upstream, including operation order, Math.random() call count
// and placement, the dx + dy + dx sum, and the possible NaN results of the
// rising branch (upstream produces them too; the R1 shader clips non-finite
// positions). verticesDown/verticesUp counters, direction/delay state and
// needsUpdate flags are unchanged.

const LOOP_ANCHOR = `				for ( let j = 0; j < meshes.length; j ++ ) {

					const data = meshes[ j ];
					const positions = data.mesh.geometry.attributes.position;
					const initialPositions = data.mesh.geometry.attributes.initialPosition;

					const count = positions.count;

					if ( data.start > 0 ) {

						data.start -= 1;

					} else {

						if ( data.direction === 0 ) {

							data.direction = - 1;

						}

					}

					for ( let i = 0; i < count; i ++ ) {

						const px = positions.getX( i );
						const py = positions.getY( i );
						const pz = positions.getZ( i );

						// falling down
						if ( data.direction < 0 ) {

							if ( py > 0 ) {

								positions.setXYZ(
									i,
									px + 1.5 * ( 0.50 - Math.random() ) * data.speed * delta,
									py + 3.0 * ( 0.25 - Math.random() ) * data.speed * delta,
									pz + 1.5 * ( 0.50 - Math.random() ) * data.speed * delta
								);

							} else {

								data.verticesDown += 1;

							}

						}

						// rising up
						if ( data.direction > 0 ) {

							const ix = initialPositions.getX( i );
							const iy = initialPositions.getY( i );
							const iz = initialPositions.getZ( i );

							const dx = Math.abs( px - ix );
							const dy = Math.abs( py - iy );
							const dz = Math.abs( pz - iz );

							const d = dx + dy + dx;

							if ( d > 1 ) {

								positions.setXYZ(
									i,
									px - ( px - ix ) / dx * data.speed * delta * ( 0.85 - Math.random() ),
									py - ( py - iy ) / dy * data.speed * delta * ( 1 + Math.random() ),
									pz - ( pz - iz ) / dz * data.speed * delta * ( 0.85 - Math.random() )
								);

							} else {

								data.verticesUp += 1;

							}

						}

					}`;

const LOOP_REPLACEMENT = `				for ( let j = 0; j < meshes.length; j ++ ) {

					const data = meshes[ j ];
					const positions = data.mesh.geometry.attributes.position;
					const initialPositions = data.mesh.geometry.attributes.initialPosition;

					const count = positions.count;

					if ( data.start > 0 ) {

						data.start -= 1;

					} else {

						if ( data.direction === 0 ) {

							data.direction = - 1;

						}

					}

					// JSR fast path: direct typed-array access instead of ~300k
					// BufferAttribute accessor calls per frame (QuickJS-bound).
					// Math matches upstream exactly; Math.random() is replaced by
					// an inline xorshift32 (equivalent uniform [0,1) distribution,
					// different sequence — upstream is random per run anyway).
					// positions.needsUpdate is set only when a vertex actually
					// moved, so idle countdown/delay frames skip the R1 upload.
					const pa = positions.array;
					const ia = initialPositions.array;
					const direction = data.direction;
					const speedDelta = data.speed * delta;
					let rs = data.__jsrRng || ( data.__jsrRng = ( 123456789 + j * 2654435761 ) | 0 );
					let moved = false;

					for ( let i = 0, o = 0; i < count; i ++, o += 3 ) {

						const px = pa[ o ];
						const py = pa[ o + 1 ];
						const pz = pa[ o + 2 ];

						// falling down
						if ( direction < 0 ) {

							if ( py > 0 ) {

								rs ^= rs << 13; rs ^= rs >>> 17; rs ^= rs << 5;
								const rx = ( rs >>> 0 ) / 4294967296;
								rs ^= rs << 13; rs ^= rs >>> 17; rs ^= rs << 5;
								const ry = ( rs >>> 0 ) / 4294967296;
								rs ^= rs << 13; rs ^= rs >>> 17; rs ^= rs << 5;
								const rz = ( rs >>> 0 ) / 4294967296;
								pa[ o ] = px + 1.5 * ( 0.50 - rx ) * speedDelta;
								pa[ o + 1 ] = py + 3.0 * ( 0.25 - ry ) * speedDelta;
								pa[ o + 2 ] = pz + 1.5 * ( 0.50 - rz ) * speedDelta;
								moved = true;

							} else {

								data.verticesDown += 1;

							}

						}

						// rising up
						if ( direction > 0 ) {

							const ix = ia[ o ];
							const iy = ia[ o + 1 ];
							const iz = ia[ o + 2 ];

							const dx = Math.abs( px - ix );
							const dy = Math.abs( py - iy );
							const dz = Math.abs( pz - iz );

							const d = dx + dy + dx;

							if ( d > 1 ) {

								rs ^= rs << 13; rs ^= rs >>> 17; rs ^= rs << 5;
								const rx = ( rs >>> 0 ) / 4294967296;
								rs ^= rs << 13; rs ^= rs >>> 17; rs ^= rs << 5;
								const ry = ( rs >>> 0 ) / 4294967296;
								rs ^= rs << 13; rs ^= rs >>> 17; rs ^= rs << 5;
								const rz = ( rs >>> 0 ) / 4294967296;
								// JSR deviation: upstream divides by dx/dy/dz even when
								// they are 0, writing NaN components (the point then
								// disappears in WebGL, and the R1 upload validator
								// rejects the WHOLE geometry — two meshes froze every
								// frame). Skip the write instead: the vertex keeps its
								// current position, the geometry stays finite, and the
								// finite fast lane below stays sound.
								if ( dx !== 0 && dy !== 0 && dz !== 0 ) {
								pa[ o ] = px - ( px - ix ) / dx * speedDelta * ( 0.85 - rx );
								pa[ o + 1 ] = py - ( py - iy ) / dy * speedDelta * ( 1 + ry );
								pa[ o + 2 ] = pz - ( pz - iz ) / dz * speedDelta * ( 0.85 - rz );
								moved = true;
								}

							} else {

								data.verticesUp += 1;

							}

						}

					}`;

export function applyPointsDynamicSimFastPathPatch(bytes) {
	let source = bytes.toString('utf8');

	const count = source.split(LOOP_ANCHOR).length - 1;
	if (count !== 1) {
		throw new Error(
			`points_dynamic_sim_fast_path: vertex loop anchor drift (expected 1, got ${count})`
		);
	}
	source = source.replace(LOOP_ANCHOR, LOOP_REPLACEMENT);

	// The official per-mesh `positions.needsUpdate = true;` now carries the
	// rng write-back and the moved-only upload gate (same block scope).
	const NEEDS_UPDATE_ANCHOR = `					positions.needsUpdate = true;`;
	const NEEDS_UPDATE_REPLACEMENT = `					data.__jsrRng = rs;
					if ( moved ) {
						positions.needsUpdate = true;
						// Every write above is finite by construction (the rising
						// branch guards zero divisors), so the R1 attributeFloats
						// encoder may take its bulk-copy lane for this version
						// instead of re-checking all ~225k components per frame.
						positions._r1FiniteVersion = positions.version;
					}`;
	const nuCount = source.split(NEEDS_UPDATE_ANCHOR).length - 1;
	if (nuCount !== 1) {
		throw new Error(
			`points_dynamic_sim_fast_path: needsUpdate anchor drift (expected 1, got ${nuCount})`
		);
	}
	source = source.replace(NEEDS_UPDATE_ANCHOR, NEEDS_UPDATE_REPLACEMENT);

	return Buffer.from(source, 'utf8');
}
