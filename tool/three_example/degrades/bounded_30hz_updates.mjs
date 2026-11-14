function replaceOnce(source, anchor, replacement, label) {
  if (!source.includes(anchor)) throw new Error(`${label}: update anchor drifted`);
  return source.replace(anchor, replacement);
}

export function applyCustomPoints30HzPatch(bytes) {
  let source = Buffer.from(bytes).toString('utf8');
  source = replaceOnce(source,
    'let renderer, scene, camera, stats;',
    'let renderer, scene, camera, stats;\n\n\t\t\tlet sizeFrame = 0;',
    'custom attributes points');
  source = replaceOnce(source,
    `\t\t\t\tfor ( let i = 0; i < attributes.size.array.length; i ++ ) {

\t\t\t\t\tattributes.size.array[ i ] = 14 + 13 * Math.sin( 0.1 * i + time );

\t\t\t\t}

\t\t\t\tattributes.size.needsUpdate = true;`,
    `\t\t\t\tif ( ( sizeFrame ++ & 1 ) === 0 ) {

\t\t\t\t\tfor ( let i = 0; i < attributes.size.array.length; i ++ ) {

\t\t\t\t\t\tattributes.size.array[ i ] = 14 + 13 * Math.sin( 0.1 * i + time );

\t\t\t\t\t}

\t\t\t\t\tattributes.size.needsUpdate = true;

\t\t\t\t}`,
    'custom attributes points');
  console.warn('three: R1 updates 100k custom point sizes every second display frame; rotation and rendering remain full-rate.');
  return Buffer.from(source, 'utf8');
}

export function applyGpgpuBirds30HzPatch(bytes) {
  let source = Buffer.from(bytes).toString('utf8');
  source = replaceOnce(source,
    '\t\t\tlet last = performance.now();',
    '\t\t\tlet last = performance.now();\n\t\t\tlet accumulatedComputeDelta = 0;\n\t\t\tlet computeFrame = 0;',
    'gpgpu birds compute cadence');
  source = replaceOnce(source,
    `\t\t\t\tpositionUniforms[ 'delta' ].value = delta;
\t\t\t\tvelocityUniforms[ 'time' ].value = now;
\t\t\t\tvelocityUniforms[ 'delta' ].value = delta;`,
    `\t\t\t\taccumulatedComputeDelta += delta;
\t\t\t\tvelocityUniforms[ 'time' ].value = now;`,
    'gpgpu birds compute cadence');
  source = replaceOnce(source,
    `\t\t\t\tmouseX = 10000;
\t\t\t\tmouseY = 10000;

\t\t\t\tgpuCompute.compute();`,
    `\t\t\t\tif ( ( computeFrame ++ & 1 ) === 0 ) {

\t\t\t\t\tpositionUniforms[ 'delta' ].value = accumulatedComputeDelta;
\t\t\t\t\tvelocityUniforms[ 'delta' ].value = accumulatedComputeDelta;
\t\t\t\t\taccumulatedComputeDelta = 0;
\t\t\t\t\tgpuCompute.compute();
\t\t\t\t\tmouseX = 10000;
\t\t\t\t\tmouseY = 10000;

\t\t\t\t}`,
    'gpgpu birds compute cadence');
  console.warn('three: R1 evaluates the 1024-boid neighbor simulation every second display frame with accumulated delta; wing animation and presentation remain full-rate.');
  return Buffer.from(source, 'utf8');
}

export function applyMemoryGeometryPatch(bytes) {
  let source = Buffer.from(bytes).toString('utf8');
  source = replaceOnce(source,
    'new THREE.SphereGeometry( 15, 64, 32 )',
    'new THREE.SphereGeometry( 15, 48, 24 )',
    'memory2 sphere geometry');
  console.warn('three: R1 bounds the memory2 sphere at 48x24 segments; 100 live materials and random-color generation remain intact.');
  return Buffer.from(source, 'utf8');
}

export function applyMemoryMaterialCadencePatch(bytes) {
  let source = Buffer.from(bytes).toString('utf8');
  source = replaceOnce(source,
    '\t\t\tconst N = 100;',
    '\t\t\tconst N = 100;\n\t\t\tlet materialFrame = 0;',
    'memory2 material cadence');
  const renderPattern = /function render\(\) \{[\s\S]*?console\.log\( 'after', renderer\.info\.programs\.length \);\s*\n\t+\}/;
  if (!renderPattern.test(source)) throw new Error('memory2 material cadence: render anchor drifted');
  const replacement = `function render() {

\t\t\t\tif ( ( materialFrame ++ % 4 ) === 0 ) {

\t\t\t\t\tconsole.log( 'before', renderer.info.programs.length );

\t\t\t\t\tfor ( let i = 0; i < N; i ++ ) {

\t\t\t\t\t\tconst mesh = meshes[ i ];
\t\t\t\t\t\tmesh.material.dispose();
\t\t\t\t\t\tmesh.material = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: generateFragmentShader() } );

\t\t\t\t\t}

\t\t\t\t\tconsole.log( 'after', renderer.info.programs.length );

\t\t\t\t}

\t\t\t\t// Presentation remains full-rate; only the random material churn is bounded.
\t\t\t\trenderer.render( scene, camera );

\t\t\t}`;
  source = source.replace(renderPattern, replacement);
  console.warn('three: R1 recreates/disposes memory2 materials every fourth display frame and presents every frame; no disposed material is reused.');
  return Buffer.from(source, 'utf8');
}

export function applyInterleaved30HzPatch(bytes) {
  let source = Buffer.from(bytes).toString('utf8');
  source = replaceOnce(source,
    '\t\tlet lastTime = 0;',
    '\t\tlet lastTime = 0;\n\t\tlet accumulatedDelta = 0;\n\t\tlet matrixFrame = 0;',
    'instancing interleaved');
  source = replaceOnce(source,
    `\t\t\tconst delta = ( time - lastTime ) / 5000;
\t\t\ttmpQ.set( moveQ.x * delta, moveQ.y * delta, moveQ.z * delta, 1 ).normalize();
\t\t\ttmpM.makeRotationFromQuaternion( tmpQ );

\t\t\tfor ( let i = 0, il = instances; i < il; i ++ ) {

\t\t\t\tmesh.getMatrixAt( i, currentM );
\t\t\t\tcurrentM.multiply( tmpM );
\t\t\t\tmesh.setMatrixAt( i, currentM );

\t\t\t}

\t\t\tmesh.instanceMatrix.needsUpdate = true;
\t\t\tmesh.computeBoundingSphere();

\t\t\tlastTime = time;`,
    `\t\t\tconst delta = ( time - lastTime ) / 5000;
\t\t\tlastTime = time;
\t\t\taccumulatedDelta += delta;

\t\t\tif ( ( matrixFrame ++ & 1 ) === 0 ) {

\t\t\t\ttmpQ.set( moveQ.x * accumulatedDelta, moveQ.y * accumulatedDelta, moveQ.z * accumulatedDelta, 1 ).normalize();
\t\t\t\ttmpM.makeRotationFromQuaternion( tmpQ );

\t\t\t\tfor ( let i = 0, il = instances; i < il; i ++ ) {

\t\t\t\t\tmesh.getMatrixAt( i, currentM );
\t\t\t\t\tcurrentM.multiply( tmpM );
\t\t\t\t\tmesh.setMatrixAt( i, currentM );

\t\t\t\t}

\t\t\t\tmesh.instanceMatrix.needsUpdate = true;
\t\t\t\tmesh.computeBoundingSphere();
\t\t\t\taccumulatedDelta = 0;

\t\t\t}`,
    'instancing interleaved');
  console.warn('three: R1 updates 5000 interleaved instance matrices every second display frame with accumulated delta; mesh rotation/rendering remain full-rate.');
  return Buffer.from(source, 'utf8');
}
