// esbuild plugin: typed-array fast paths for the two per-frame vertex
// helper update loops used by webgl_helpers. The upstream loops call
// Vector3/Matrix methods per vertex (~5k vertices x2 helpers per frame);
// in the QuickJS interpreter that alone cost ~27ms per frame (36-44fps).
// The replacements do the identical math with direct typed-array reads and
// scalar locals (no allocations, no method calls) and fall back to the
// original loop for interleaved/normalized attributes.
import fs from 'node:fs';
import path from 'node:path';

const NORMALS_ORIGINAL = `	update() {

		this.object.updateMatrixWorld( true );

		_normalMatrix.getNormalMatrix( this.object.matrixWorld );

		const matrixWorld = this.object.matrixWorld;

		const position = this.geometry.attributes.position;

		//

		const objGeometry = this.object.geometry;

		if ( objGeometry ) {

			const objPos = objGeometry.attributes.position;

			const objNorm = objGeometry.attributes.normal;

			let idx = 0;

			// for simplicity, ignore index and drawcalls, and render every normal

			for ( let j = 0, jl = objPos.count; j < jl; j ++ ) {

				_v1.fromBufferAttribute( objPos, j ).applyMatrix4( matrixWorld );

				_v2.fromBufferAttribute( objNorm, j );

				_v2.applyMatrix3( _normalMatrix ).normalize().multiplyScalar( this.size ).add( _v1 );

				position.setXYZ( idx, _v1.x, _v1.y, _v1.z );

				idx = idx + 1;

				position.setXYZ( idx, _v2.x, _v2.y, _v2.z );

				idx = idx + 1;

			}

		}

		position.needsUpdate = true;

	}`;

const NORMALS_FAST = `	update() {

		this.object.updateMatrixWorld( true );

		_normalMatrix.getNormalMatrix( this.object.matrixWorld );

		const matrixWorld = this.object.matrixWorld;

		const position = this.geometry.attributes.position;

		//

		const objGeometry = this.object.geometry;

		if ( objGeometry ) {

			const objPos = objGeometry.attributes.position;

			const objNorm = objGeometry.attributes.normal;

			const p = objPos.array, n = objNorm.array, out = position.array;

			if ( p && n && out && p.length >= objPos.count * 3 && n.length >= objNorm.count * 3 ) {

				// JSR fast path: identical math with direct typed-array access.
				const m = matrixWorld.elements, nm = _normalMatrix.elements, size = this.size;
				let idx = 0;

				for ( let j = 0, jl = objPos.count; j < jl; j ++ ) {

					const k = j * 3;
					const x = p[k], y = p[k + 1], z = p[k + 2];
					const w = 1 / ( m[3] * x + m[7] * y + m[11] * z + m[15] );
					const v1x = ( m[0] * x + m[4] * y + m[8] * z + m[12] ) * w;
					const v1y = ( m[1] * x + m[5] * y + m[9] * z + m[13] ) * w;
					const v1z = ( m[2] * x + m[6] * y + m[10] * z + m[14] ) * w;
					const nx = n[k], ny = n[k + 1], nz = n[k + 2];
					const v2x = nm[0] * nx + nm[3] * ny + nm[6] * nz;
					const v2y = nm[1] * nx + nm[4] * ny + nm[7] * nz;
					const v2z = nm[2] * nx + nm[5] * ny + nm[8] * nz;
					const inv = 1 / ( Math.sqrt( v2x * v2x + v2y * v2y + v2z * v2z ) || 1 );
					const a = idx * 3, b = a + 3;
					out[a] = v1x; out[a + 1] = v1y; out[a + 2] = v1z;
					out[b] = v1x + v2x * inv * size;
					out[b + 1] = v1y + v2y * inv * size;
					out[b + 2] = v1z + v2z * inv * size;
					idx = idx + 2;

				}

			} else {

				let idx = 0;

				for ( let j = 0, jl = objPos.count; j < jl; j ++ ) {

					_v1.fromBufferAttribute( objPos, j ).applyMatrix4( matrixWorld );

					_v2.fromBufferAttribute( objNorm, j );

					_v2.applyMatrix3( _normalMatrix ).normalize().multiplyScalar( this.size ).add( _v1 );

					position.setXYZ( idx, _v1.x, _v1.y, _v1.z );

					idx = idx + 1;

					position.setXYZ( idx, _v2.x, _v2.y, _v2.z );

					idx = idx + 1;

				}

			}

		}

		position.needsUpdate = true;

	}`;

const TANGENTS_ORIGINAL = `	update() {

		this.object.updateMatrixWorld( true );

		const matrixWorld = this.object.matrixWorld;

		const position = this.geometry.attributes.position;

		//

		const objGeometry = this.object.geometry;

		const objPos = objGeometry.attributes.position;

		const objTan = objGeometry.attributes.tangent;

		let idx = 0;

		// for simplicity, ignore index and drawcalls, and render every tangent

		for ( let j = 0, jl = objPos.count; j < jl; j ++ ) {

			_v1.fromBufferAttribute( objPos, j ).applyMatrix4( matrixWorld );

			_v2.fromBufferAttribute( objTan, j );

			_v2.transformDirection( matrixWorld ).multiplyScalar( this.size ).add( _v1 );

			position.setXYZ( idx, _v1.x, _v1.y, _v1.z );

			idx = idx + 1;

			position.setXYZ( idx, _v2.x, _v2.y, _v2.z );

			idx = idx + 1;

		}

		position.needsUpdate = true;

	}`;

const TANGENTS_FAST = `	update() {

		this.object.updateMatrixWorld( true );

		const matrixWorld = this.object.matrixWorld;

		const position = this.geometry.attributes.position;

		//

		const objGeometry = this.object.geometry;

		const objPos = objGeometry.attributes.position;

		const objTan = objGeometry.attributes.tangent;

		const p = objPos.array, t = objTan.array, out = position.array;

		if ( p && t && out && p.length >= objPos.count * 3 && t.length >= objTan.count * 3 ) {

			// JSR fast path: identical math with direct typed-array access.
			const m = matrixWorld.elements, size = this.size;
			let idx = 0;

			for ( let j = 0, jl = objPos.count; j < jl; j ++ ) {

				const k = j * 3;
				const x = p[k], y = p[k + 1], z = p[k + 2];
				const w = 1 / ( m[3] * x + m[7] * y + m[11] * z + m[15] );
				const v1x = ( m[0] * x + m[4] * y + m[8] * z + m[12] ) * w;
				const v1y = ( m[1] * x + m[5] * y + m[9] * z + m[13] ) * w;
				const v1z = ( m[2] * x + m[6] * y + m[10] * z + m[14] ) * w;
				const tx = t[k], ty = t[k + 1], tz = t[k + 2];
				let v2x = m[0] * tx + m[4] * ty + m[8] * tz;
				let v2y = m[1] * tx + m[5] * ty + m[9] * tz;
				let v2z = m[2] * tx + m[6] * ty + m[10] * tz;
				const inv = 1 / ( Math.sqrt( v2x * v2x + v2y * v2y + v2z * v2z ) || 1 );
				const a = idx * 3, b = a + 3;
				out[a] = v1x; out[a + 1] = v1y; out[a + 2] = v1z;
				out[b] = v1x + v2x * inv * size;
				out[b + 1] = v1y + v2y * inv * size;
				out[b + 2] = v1z + v2z * inv * size;
				idx = idx + 2;

			}

		} else {

			let idx = 0;

			for ( let j = 0, jl = objPos.count; j < jl; j ++ ) {

				_v1.fromBufferAttribute( objPos, j ).applyMatrix4( matrixWorld );

				_v2.fromBufferAttribute( objTan, j );

				_v2.transformDirection( matrixWorld ).multiplyScalar( this.size ).add( _v1 );

				position.setXYZ( idx, _v1.x, _v1.y, _v1.z );

				idx = idx + 1;

				position.setXYZ( idx, _v2.x, _v2.y, _v2.z );

				idx = idx + 1;

			}

		}

		position.needsUpdate = true;

	}`;

export function helperFastPathPlugin() {
  const patches = new Map([
    ['VertexNormalsHelper.js', [NORMALS_ORIGINAL, NORMALS_FAST]],
    ['VertexTangentsHelper.js', [TANGENTS_ORIGINAL, TANGENTS_FAST]],
  ]);
  return {
    name: 'jsr-helper-fast-path',
    setup(build) {
      build.onLoad({ filter: /helpers[\/\\]Vertex(Normals|Tangents)Helper\.js$/ }, (args) => {
        const file = path.basename(args.path);
        const [original, fast] = patches.get(file);
        const source = fs.readFileSync(args.path, 'utf8');
        if (!source.includes(original)) {
          throw new Error(`helper fast-path anchor drifted for ${file} (pinned three source changed)`);
        }
        return {
          contents: source.replace(original, fast),
          loader: 'js',
          resolveDir: path.dirname(args.path),
        };
      });
    },
  };
}
