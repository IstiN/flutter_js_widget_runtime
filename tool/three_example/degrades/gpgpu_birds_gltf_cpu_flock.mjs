// Prepare-time module patch for webgl_gpgpu_birds_gltf (R1/WebGL2).
//
// Root cause (trusted R3 diagnosis): the official flock is a GPGPU sim.
// GPUComputationRenderer.compute() runs two ShaderMaterial passes per tick
// (velocity + position) that R1 lowers to bounded RGBA8 blit materials —
// created and disposed twice per tick (churn), sim math dropped, float
// textures stored RGBA8. The 4096-copy merged BirdGeometry (~2.2M verts, one
// ~56MB upload) is displaced ONLY by material.onBeforeCompile, which R1 does
// not execute, so every bird renders at the base position: a static frozen
// blob (measured renderer.info: calls 1, triangles 1), 3 render walks per
// tick, and RT-only pump flicker.
//
// Degrade (this file patches the pinned official module bytes at prepare
// time, the ik_mirror_static / dragThrottleHover precedent; every anchor is
// byte-exact against the pinned r186 module and prepare throws on drift):
//
//  (a) REQUIRED sim-pass no-op: after detecting the initialized
//      GPUComputationRenderer (2 variables + init()-baked RTs) compute() is
//      replaced by a no-op, so the two per-tick RT sim passes and their blit
//      material churn vanish. The RTs keep the textures init() baked and the
//      module's remaining texture reads stay guarded (materialShader is
//      undefined after (b)), so the main render still works from the initial
//      textures.
//
//  (b) CPU flock: the merged static mesh is replaced by ONE bird geometry
//      from the same pinned GLB through the module's own GLTFLoader path
//      (Parrot.glb / Flamingo.glb exactly as the module randomly picks — the
//      real GLTF bird, no procedural stand-in), rendered as a 4096-instance
//      THREE.InstancedMesh (R1 DRAW_BATCH lane). A CPU boids integration
//      mirrors the official velocity/position shader formulas:
//      separation/alignment/cohesion zones from the live GUI sliders,
//      predator repulsion (the module's pointermove lane), center gravity,
//      SPEED_LIMIT 9 (+5 near the predator), position += velocity * delta *
//      15, per-bird wing phase. Neighbors come from hash-scattered random
//      subsampling (3 samples per bird per tick, density-proportional, the
//      official zone formulas unchanged per sample) — the GPU pass scanned
//      all 4096² pairs, which no JS budget can afford at 30Hz (measured:
//      a capped grid-bucket walk already cost 6-8ms/tick in V8). Instance
//      matrices update every 3rd
//      animation frame (~30Hz); wing flap is a per-instance roll about the
//      flight axis derived from the same phase formula plus a small
//      per-instance vertical wobble — replacing the GLB morph-target flap,
//      which InstancedMesh cannot play per instance. Official material
//      params (vertexColors from COLOR_0, flatShading, roughness 1,
//      metalness 0), lights, background/fog colors, the lil-gui sliders and
//      the pointer-predator lane are untouched; the official
//      birdMesh.rotation.y = PI/2 is folded into the instance orientation so
//      the node transform stays identity.
//
//   - neighbor scan is 3 random samples per bird per tick where the GPU pass
//     scanned all pairs → flocking is a bounded statistical approximation
//     (cohesion/alignment average over ticks; separation emerges in clumps);
//   - integration is in-place (samples may read birds already updated this
//     tick; the GPU pass was double-buffered);
//   - flap is a matrix roll + wobble instead of the morph-target wing bake
//     (the per-bird bake texture loop is skipped, speeding up boot).

const BAKE_BLOCK_ANCHOR = `				const tData = new Float32Array( 4 * tWidth * tHeight );

				for ( let i = 0; i < tWidth; i ++ ) {

					for ( let j = 0; j < tHeight; j ++ ) {

						const offset = j * tWidth * 4;

						const curMorph = Math.floor( j / durationAnimation * morphAttributes.length );
						const nextMorph = ( Math.floor( j / durationAnimation * morphAttributes.length ) + 1 ) % morphAttributes.length;
						const lerpAmount = j / durationAnimation * morphAttributes.length % 1;

						if ( j < durationAnimation ) {

							let d0, d1;

							d0 = morphAttributes[ curMorph ].array[ i * 3 ];
							d1 = morphAttributes[ nextMorph ].array[ i * 3 ];

							if ( d0 !== undefined && d1 !== undefined ) tData[ offset + i * 4 ] = THREE.MathUtils.lerp( d0, d1, lerpAmount );

							d0 = morphAttributes[ curMorph ].array[ i * 3 + 1 ];
							d1 = morphAttributes[ nextMorph ].array[ i * 3 + 1 ];

							if ( d0 !== undefined && d1 !== undefined ) tData[ offset + i * 4 + 1 ] = THREE.MathUtils.lerp( d0, d1, lerpAmount );

							d0 = morphAttributes[ curMorph ].array[ i * 3 + 2 ];
							d1 = morphAttributes[ nextMorph ].array[ i * 3 + 2 ];

							if ( d0 !== undefined && d1 !== undefined ) tData[ offset + i * 4 + 2 ] = THREE.MathUtils.lerp( d0, d1, lerpAmount );

							tData[ offset + i * 4 + 3 ] = 1;

						}

					}

				}

				textureAnimation = new THREE.DataTexture( tData, tWidth, tHeight, THREE.RGBAFormat, THREE.FloatType );
				textureAnimation.needsUpdate = true;`;

const GEO_BLOCK_ANCHOR = `				const vertices = [], color = [], reference = [], seeds = [], indices = [];
				const totalVertices = birdGeo.getAttribute( 'position' ).count * 3 * BIRDS;
				for ( let i = 0; i < totalVertices; i ++ ) {

					const bIndex = i % ( birdGeo.getAttribute( 'position' ).count * 3 );
					vertices.push( birdGeo.getAttribute( 'position' ).array[ bIndex ] );
					color.push( birdGeo.getAttribute( 'color' ).array[ bIndex ] );

				}

				let r = Math.random();
				for ( let i = 0; i < birdGeo.getAttribute( 'position' ).count * BIRDS; i ++ ) {

					const bIndex = i % ( birdGeo.getAttribute( 'position' ).count );
					const bird = Math.floor( i / birdGeo.getAttribute( 'position' ).count );
					if ( bIndex == 0 ) r = Math.random();
					const j = ~ ~ bird;
					const x = ( j % WIDTH ) / WIDTH;
					const y = ~ ~ ( j / WIDTH ) / WIDTH;
					reference.push( x, y, bIndex / tWidth, durationAnimation / tHeight );
					seeds.push( bird, r, Math.random(), Math.random() );

				}

				for ( let i = 0; i < birdGeo.index.array.length * BIRDS; i ++ ) {

					const offset = Math.floor( i / birdGeo.index.array.length ) * ( birdGeo.getAttribute( 'position' ).count );
					indices.push( birdGeo.index.array[ i % birdGeo.index.array.length ] + offset );

				}

				BirdGeometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( vertices ), 3 ) );
				BirdGeometry.setAttribute( 'birdColor', new THREE.BufferAttribute( new Float32Array( color ), 3 ) );
				BirdGeometry.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( color ), 3 ) );
				BirdGeometry.setAttribute( 'reference', new THREE.BufferAttribute( new Float32Array( reference ), 4 ) );
				BirdGeometry.setAttribute( 'seeds', new THREE.BufferAttribute( new Float32Array( seeds ), 4 ) );

				BirdGeometry.setIndex( indices );

				init();`;

const INIT_BIRDS_BLOCK_ANCHOR = `				const geometry = BirdGeometry;

				const m = new THREE.MeshStandardMaterial( {
					vertexColors: true,
					flatShading: true,
					roughness: 1,
					metalness: 0
				} );

				m.onBeforeCompile = ( shader ) => {

					shader.uniforms.texturePosition = { value: null };
					shader.uniforms.textureVelocity = { value: null };
					shader.uniforms.textureAnimation = { value: textureAnimation };
					shader.uniforms.time = { value: 1.0 };
					shader.uniforms.size = { value: effectController.size };
					shader.uniforms.delta = { value: 0.0 };

					let token = '#define STANDARD';

					let insert = /* glsl */\`
						attribute vec4 reference;
						attribute vec4 seeds;
						attribute vec3 birdColor;
						uniform sampler2D texturePosition;
						uniform sampler2D textureVelocity;
						uniform sampler2D textureAnimation;
						uniform float size;
						uniform float time;
					\`;

					shader.vertexShader = shader.vertexShader.replace( token, token + insert );

					token = '#include <begin_vertex>';

					insert = /* glsl */\`
						vec4 tmpPos = texture2D( texturePosition, reference.xy );

						vec3 pos = tmpPos.xyz;
						vec3 velocity = normalize(texture2D( textureVelocity, reference.xy ).xyz);
						vec3 aniPos = texture2D( textureAnimation, vec2( reference.z, mod( time + ( seeds.x ) * ( ( 0.0004 + seeds.y / 10000.0) + normalize( velocity ) / 20000.0 ), reference.w ) ) ).xyz;
						vec3 newPosition = position;

						newPosition = mat3( modelMatrix ) * ( newPosition + aniPos );
						newPosition *= size + seeds.y * size * 0.2;

						velocity.z *= -1.;
						float xz = length( velocity.xz );
						float xyz = 1.;
						float x = sqrt( 1. - velocity.y * velocity.y );

						float cosry = velocity.x / xz;
						float sinry = velocity.z / xz;

						float cosrz = x / xyz;
						float sinrz = velocity.y / xyz;

						mat3 maty =  mat3( cosry, 0, -sinry, 0    , 1, 0     , sinry, 0, cosry );
						mat3 matz =  mat3( cosrz , sinrz, 0, -sinrz, cosrz, 0, 0     , 0    , 1 );

						newPosition =  maty * matz * newPosition;
						newPosition += pos;

						vec3 transformed = vec3( newPosition );
					\`;

					shader.vertexShader = shader.vertexShader.replace( token, insert );

					materialShader = shader;

				};

				birdMesh = new THREE.Mesh( geometry, m );
				birdMesh.rotation.y = Math.PI / 2;

				birdMesh.castShadow = true;
				birdMesh.receiveShadow = true;

				scene.add( birdMesh );`;

const DRAW_RANGE_LINE_ANCHOR = `					BirdGeometry.setDrawRange( 0, indicesPerBird * effectController.count );`;

const COMPUTE_LINE_ANCHOR = `				gpuCompute.compute();`;

const INIT_FUNCTION_LINE_ANCHOR = `			function init() {`;

const BAKE_BLOCK_REPLACEMENT = `				// JSR degrade: the morph-baked wing animation texture is not used
				// by the CPU flock (flap is a per-instance matrix roll), so the
				// tWidth × tHeight bake loop is skipped to keep boot fast.
				// textureAnimation stays undefined; its only consumer was the
				// onBeforeCompile block replaced below.`;

const GEO_BLOCK_REPLACEMENT = `				// JSR degrade: ONE bird geometry from the pinned GLB (position +
				// COLOR_0 vertex colors + index) feeds the InstancedMesh flock
				// (4096 instances render the same ~500-vertex bird; the merged
				// 2.2M-vertex build is gone). Morph targets are dropped — wing
				// flap is a per-instance matrix roll driven by the wing phase.
				indicesPerBird = birdGeo.index.count;
				jsrBirdGeometry = new THREE.BufferGeometry();
				jsrBirdGeometry.setAttribute( 'position', birdGeo.getAttribute( 'position' ).clone() );
				jsrBirdGeometry.setAttribute( 'color', birdGeo.getAttribute( 'color' ).clone() );
				if ( birdGeo.getAttribute( 'normal' ) ) jsrBirdGeometry.setAttribute( 'normal', birdGeo.getAttribute( 'normal' ).clone() );
				jsrBirdGeometry.setIndex( birdGeo.index.clone() );

				init();`;

const INIT_BIRDS_BLOCK_REPLACEMENT = `				// JSR degrade: a 4096-instance InstancedMesh over the ONE-bird
				// geometry replaces the merged static mesh; the GPGPU
				// onBeforeCompile displacement (not executed by R1) is
				// replaced by the CPU boids integration in jsrCreateFlock.
				// Official material params and shadow flags are kept; bird
				// colors still come from the GLB's COLOR_0 attribute.
				const geometry = jsrBirdGeometry;

				const m = new THREE.MeshStandardMaterial( {
					vertexColors: true,
					flatShading: true,
					roughness: 1,
					metalness: 0
				} );

				jsrFlock = jsrCreateFlock( geometry, m, effectController, velocityUniforms );
				birdMesh = jsrFlock.mesh;

				scene.add( birdMesh );`;

const DRAW_RANGE_LINE_REPLACEMENT = `					if ( jsrFlock ) jsrFlock.setCount( Math.floor( effectController.count ) ); // JSR degrade: GUI count drives InstancedMesh.count`;

const COMPUTE_LINE_REPLACEMENT = `				// JSR degrade (a): no-op the GPGPU sim after detection — the
				// two per-tick RT sim passes (velocity + position) and their
				// lowered blit materials are skipped entirely; the RTs keep
				// the textures init() baked, so the module's guarded texture
				// reads still sample valid initial data. Flock state is CPU.
				jsrNopGpgpuSim( gpuCompute );

				// JSR degrade (b): CPU boids step + instance matrices, ~30Hz
				// (every 3rd animation frame).
				if ( jsrFlock ) jsrFlock.tick( delta, now );`;

const PRELUDE = `			// ===== JSR degrade (degrades/gpgpu_birds_gltf_cpu_flock.mjs) =====
			// (a) GPGPU sim-pass no-op + (b) CPU boids flock over an
			// InstancedMesh. Full diagnosis + deviations in the prepare
			// manifest buildTransform for this widget.

			let jsrBirdGeometry = null;
			let jsrFlock = null;
			let jsrGpgpuSimNop = false;

			function jsrNopGpgpuSim( gpuCompute ) {

				if ( jsrGpgpuSimNop || ! gpuCompute || ! gpuCompute.variables || gpuCompute.variables.length === 0 ) return;
				jsrGpgpuSimNop = true;
				gpuCompute.compute = function () {}; // no-op'd: RT sim passes dropped
				console.warn( 'three: JSR degrade — GPUComputationRenderer.compute() no-op\\'d after detection; the flocking sim is CPU-driven (degrades/gpgpu_birds_gltf_cpu_flock.mjs)' );

			}

			function jsrCreateFlock( geometry, material, controller, velocityUniforms ) {

				const COUNT = WIDTH * WIDTH; // 4096 — the official bird count
				const HALF = BOUNDS / 2;
				const mesh = new THREE.InstancedMesh( geometry, material, COUNT );
				mesh.castShadow = true;
				mesh.receiveShadow = true;
				mesh.frustumCulled = false; // instances roam the whole BOUNDS cube
				mesh.count = Math.max( 1, Math.min( COUNT, Math.floor( controller.count ) ) );

				// State mirrors fillPositionTexture/fillVelocityTexture.
				const px = new Float32Array( COUNT ), py = new Float32Array( COUNT ), pz = new Float32Array( COUNT );
				const vx = new Float32Array( COUNT ), vy = new Float32Array( COUNT ), vz = new Float32Array( COUNT );
				const seeds = new Float32Array( COUNT ); // per-bird scale spread (official seeds.y)
				const phase = new Float32Array( COUNT ); // wing phase (official position .w)
				for ( let i = 0; i < COUNT; i ++ ) {

					px[ i ] = Math.random() * BOUNDS - HALF;
					py[ i ] = Math.random() * BOUNDS - HALF;
					pz[ i ] = Math.random() * BOUNDS - HALF;
					vx[ i ] = ( Math.random() - 0.5 ) * 10;
					vy[ i ] = ( Math.random() - 0.5 ) * 10;
					vz[ i ] = ( Math.random() - 0.5 ) * 10;
					seeds[ i ] = Math.random();
					phase[ i ] = Math.random() * 62.83;

				}

				// Neighbors: hash-scattered random subsampling (3 samples per
				// bird per tick) instead of a grid-bucket walk — the QuickJS
				// budget cannot afford 4096 × 27-cell scans at 30Hz. Sampling
				// is density-proportional (a dense cluster is hit more often),
				// so separation emerges in clumps while alignment/cohesion
				// average out over ticks; the official zone formulas and
				// thresholds are applied unchanged to every sample.
				const SAMPLES = 3;
				const matrices = mesh.instanceMatrix.array;
				const predator = velocityUniforms[ 'predator' ].value; // module pointermove lane
				const PREY_SQ = 22500; // official preyRadius 150²
				const TAU = 6.283185307179586;
				const PHASE_WRAP = 62.83185307179586;
				let tickFrame = 0;
				let lastNow = 0;

				function setCount( count ) {

					mesh.count = Math.max( 0, Math.min( COUNT, count | 0 ) );

				}

				function tick( frameDelta, now ) {

					if ( tickFrame ++ % 3 !== 0 ) return; // ~30Hz matrix cadence

					let dt = lastNow > 0 ? ( now - lastNow ) / 1000 : frameDelta;
					lastNow = now;
					if ( dt > 0.1 ) dt = 0.1;
					if ( dt < 0.0005 ) dt = 0.0005;

					// Live GUI params (official velocity-shader semantics).
					const sepD = controller.separation, aliD = controller.alignment, cohD = controller.cohesion;
					const zone = Math.max( sepD + aliD + cohD, 0.001 );
					const zoneSq = zone * zone;
					const sepThresh = sepD / zone;
					const aliThresh = Math.min( ( sepD + aliD ) / zone, 0.999 );
					const aliBand = Math.max( aliThresh - sepThresh, 1e-4 );
					const cohBand = Math.max( 1 - aliThresh, 1e-4 );
					const size = controller.size;

					const pvx = predator.x * BOUNDS, pvy = predator.y * BOUNDS;

					// Integrate (in-place; later birds may read a few
					// already-updated neighbors — bounded deviation from the
					// double-buffered GPU pass).
					for ( let i = 0; i < COUNT; i ++ ) {

						let ivx = vx[ i ], ivy = vy[ i ], ivz = vz[ i ];
						const pxi = px[ i ], pyi = py[ i ], pzi = pz[ i ];

						// Neighbor samples: xorshift-scattered birds, official
						// separation/alignment/cohesion zone formulas each.
						let hash = ( i * 2654435761 + tickFrame * 40503 ) >>> 0;
						for ( let n = 0; n < SAMPLES; n ++ ) {

							hash = ( hash ^ 61 ) ^ ( hash >>> 16 );
							hash = ( hash + ( hash << 3 ) ) | 0;
							hash = hash ^ ( hash >>> 4 );
							hash = Math.imul( hash, 0x27d4eb2d );
							hash = hash ^ ( hash >>> 15 );
							let j = ( hash >>> 0 ) % COUNT; // uint32: xorshift state may be signed here
							if ( j === i ) j = j + 1 === COUNT ? 0 : j + 1;
							const dx = px[ j ] - pxi, dy = py[ j ] - pyi, dz = pz[ j ] - pzi;
							const distSq = dx * dx + dy * dy + dz * dz;
							if ( distSq >= zoneSq || distSq < 1e-6 ) continue;
							const percent = distSq / zoneSq;
							const invDist = 1 / Math.sqrt( distSq );
							if ( percent < sepThresh ) {

								// Separation — move apart.
								const f = ( sepThresh / percent - 1 ) * dt;
								ivx -= dx * invDist * f;
								ivy -= dy * invDist * f;
								ivz -= dz * invDist * f;

							} else if ( percent < aliThresh ) {

								// Alignment — fly the same direction.
								const adj = ( percent - sepThresh ) / aliBand;
								const f = ( 1 - Math.cos( adj * TAU ) * 0.5 ) * dt;
								const nvx = vx[ j ], nvy = vy[ j ], nvz = vz[ j ];
								const nl = Math.sqrt( nvx * nvx + nvy * nvy + nvz * nvz );
								if ( nl > 1e-6 ) {

									ivx += ( nvx / nl ) * f;
									ivy += ( nvy / nl ) * f;
									ivz += ( nvz / nl ) * f;

								}

							} else {

								// Cohesion — move closer.
								const adj = ( percent - aliThresh ) / cohBand;
								const f = Math.cos( adj * TAU ) * 0.5 * dt;
								ivx += dx * invDist * f;
								ivy += dy * invDist * f;
								ivz += dz * invDist * f;

							}

						}

						// Predator repulsion (official velocity shader).
						let limit = 9; // official SPEED_LIMIT
						const dxp = pvx - pxi, dyp = pvy - pyi;
						const predSq = dxp * dxp + dyp * dyp;
						if ( predSq < PREY_SQ ) {

							const f = ( predSq / PREY_SQ - 1 ) * dt * 100;
							const inv = 1 / Math.sqrt( Math.max( predSq, 1e-6 ) );
							ivx += dxp * inv * f;
							ivy += dyp * inv * f;
							limit += 5; // official +5 near the predator

						}

						// Center gravity (official; y weighted 2.5).
						const gY = pyi * 2.5;
						const gLen = Math.sqrt( pxi * pxi + gY * gY + pzi * pzi );
						if ( gLen > 1e-6 ) {

							ivx -= ( pxi / gLen ) * 5 * dt;
							ivy -= ( gY / gLen ) * 5 * dt;
							ivz -= ( pzi / gLen ) * 5 * dt;

						}

						// Speed limit + integrate (official position shader).
						const spSq = ivx * ivx + ivy * ivy + ivz * ivz;
						if ( spSq > limit * limit ) {

							const s = limit / Math.sqrt( spSq );
							ivx *= s;
							ivy *= s;
							ivz *= s;

						}

						vx[ i ] = ivx; vy[ i ] = ivy; vz[ i ] = ivz;
						px[ i ] = pxi + ivx * dt * 15;
						py[ i ] = pyi + ivy * dt * 15;
						pz[ i ] = pzi + ivz * dt * 15;

						// Wing phase (official .w channel: faster when climbing).
						const hSpeed = Math.sqrt( ivx * ivx + ivz * ivz );
						phase[ i ] = ( phase[ i ] + dt + hSpeed * dt * 3 + Math.max( ivy, 0 ) * dt * 6 ) % PHASE_WRAP;

					}

					// Instance matrices: official velocity orientation
					// (velocity.z flip, yaw + pitch basis) with the official
					// birdMesh.rotation.y = PI/2 folded in — column
					// ( x, y, z ) -> ( z, y, - x ) — plus a per-instance flap
					// roll of the wing span (column 0) about the flight axis
					// (column 2) driven by the wing phase, and a small
					// vertical wobble on the translation.
					const visible = mesh.count;
					for ( let i = 0; i < visible; i ++ ) {

						const fvx = vx[ i ], fvy = vy[ i ], fvz = - vz[ i ];
						let fl = Math.sqrt( fvx * fvx + fvy * fvy + fvz * fvz );
						if ( fl < 1e-9 ) fl = 1;
						const inv = 1 / fl;
						const nx = fvx * inv, ny = fvy * inv, nz = fvz * inv;
						const cosrz = Math.sqrt( Math.max( 0, 1 - ny * ny ) );

						const c0x = - cosrz * nz, c0y = ny, c0z = - cosrz * nx;
						const c1x = ny * nz, c1y = cosrz, c1z = ny * nx;
						const c2x = nx, c2z = - nz;

						const roll = Math.sin( phase[ i ] ) * 0.6;
						const cr = Math.cos( roll ), sr = Math.sin( roll );
						const r0x = c0x * cr + c1x * sr, r0y = c0y * cr + c1y * sr, r0z = c0z * cr + c1z * sr;
						const r1x = c1x * cr - c0x * sr, r1y = c1y * cr - c0y * sr, r1z = c1z * cr - c0z * sr;

						const s = size * ( 1 + seeds[ i ] * 0.2 ); // official size spread
						const o = i * 16;
						matrices[ o ] = r0x * s;
						matrices[ o + 1 ] = r0y * s;
						matrices[ o + 2 ] = r0z * s;
						matrices[ o + 3 ] = 0;
						matrices[ o + 4 ] = r1x * s;
						matrices[ o + 5 ] = r1y * s;
						matrices[ o + 6 ] = r1z * s;
						matrices[ o + 7 ] = 0;
						matrices[ o + 8 ] = c2x * s;
						matrices[ o + 9 ] = 0;
						matrices[ o + 10 ] = c2z * s;
						matrices[ o + 11 ] = 0;
						matrices[ o + 12 ] = px[ i ];
						matrices[ o + 13 ] = py[ i ] + Math.sin( phase[ i ] * 0.5 ) * 0.5; // wobble
						matrices[ o + 14 ] = pz[ i ];
						matrices[ o + 15 ] = 1;

					}

					mesh.instanceMatrix.needsUpdate = true;

				}

				return { mesh, tick, setCount };

			}

`;

export function applyGpgpuBirdsGltfCpuFlockPatch( bytes ) {

	const source = bytes.toString( 'utf8' );
	const anchors = [
		[ 'morph bake block', BAKE_BLOCK_ANCHOR ],
		[ 'merged BirdGeometry block', GEO_BLOCK_ANCHOR ],
		[ 'initBirds body block', INIT_BIRDS_BLOCK_ANCHOR ],
		[ 'valuesChanger setDrawRange line', DRAW_RANGE_LINE_ANCHOR ],
		[ 'render() compute line', COMPUTE_LINE_ANCHOR ],
		[ 'function init() line', INIT_FUNCTION_LINE_ANCHOR ]
	];
	for ( const [ name, anchor ] of anchors ) {

		const count = source.split( anchor ).length - 1;
		if ( count !== 1 ) {

			throw new Error( `gpgpu birds cpu-flock anchor drifted (${ name }): expected exactly 1 occurrence, got ${ count } — pinned three source changed` );

		}

	}
	const transformed = source
		.replace( BAKE_BLOCK_ANCHOR, BAKE_BLOCK_REPLACEMENT )
		.replace( GEO_BLOCK_ANCHOR, GEO_BLOCK_REPLACEMENT )
		.replace( INIT_BIRDS_BLOCK_ANCHOR, INIT_BIRDS_BLOCK_REPLACEMENT )
		.replace( DRAW_RANGE_LINE_ANCHOR, DRAW_RANGE_LINE_REPLACEMENT )
		.replace( COMPUTE_LINE_ANCHOR, COMPUTE_LINE_REPLACEMENT )
		.replace( INIT_FUNCTION_LINE_ANCHOR, PRELUDE + INIT_FUNCTION_LINE_ANCHOR );
	return Buffer.from( transformed, 'utf8' );

}
