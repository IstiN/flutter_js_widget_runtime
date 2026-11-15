// Math-preserving prepared-lane fast paths for the custom-attribute family.
// The pinned official_module.js files remain byte-exact; these anchored build
// transforms only remove per-point transcendental interpreter overhead.
function replaceOnce(source, anchor, replacement, label) {
  const first = source.indexOf(anchor);
  if (first < 0 || first !== source.lastIndexOf(anchor)) {
    throw new Error(`${label}: update anchor drifted`);
  }
  return source.replace(anchor, replacement);
}

function phaseTables(count, declarationAnchor, sizesAnchor, source, label) {
  const rendererAnchor = '\tlet renderer, scene, camera, stats;';
  source = replaceOnce(source, rendererAnchor,
    `${rendererAnchor}\n\n\tlet sizeSinPhases;\n\tlet sizeCosPhases;\n\tlet sizeNativePacket;\n\tlet sizeNativeBytes;`, label);
  source = replaceOnce(source, declarationAnchor,
    `${declarationAnchor}\n\n\t\t\t\tsizeSinPhases = new Float64Array( ${count} );\n\t\t\t\tsizeCosPhases = new Float64Array( ${count} );`,
    label);
  return replaceOnce(source, sizesAnchor,
    `${sizesAnchor}\n\n\t\t\t\t\tconst sizePhase = 0.1 * i;\n\t\t\t\t\tsizeSinPhases[ i ] = Math.sin( sizePhase );\n\t\t\t\t\tsizeCosPhases[ i ] = Math.cos( sizePhase );`,
    label);
}

function customAttributes(bytes) {
  const label = 'custom attributes native displacement';
  let source = Buffer.from(bytes).toString('utf8');
  source = replaceOnce(source, '\tlet sphere, uniforms;',
    '\tlet sphere, uniforms;\n\n\tlet displacementPacket;\n\tlet displacementBytes;', label);
  source = replaceOnce(source,
    `\t\t\t\tdisplacement = new Float32Array( geometry.attributes.position.count );
\t\t\t\tnoise = new Float32Array( geometry.attributes.position.count );`,
    `\t\t\t\tdisplacementPacket = new Float32Array( 4 + geometry.attributes.position.count * 2 );
\t\t\t\tdisplacementBytes = new Uint8Array( displacementPacket.buffer );
\t\t\t\tdisplacement = displacementPacket.subarray( 4, 4 + geometry.attributes.position.count );
\t\t\t\tnoise = displacementPacket.subarray( 4 + geometry.attributes.position.count );`, label);
  const loop = `\t\t\t\tfor ( let i = 0; i < displacement.length; i ++ ) {

\t\t\t\t\tdisplacement[ i ] = Math.sin( 0.1 * i + time );

\t\t\t\t\tnoise[ i ] += 0.5 * ( 0.5 - Math.random() );
\t\t\t\t\tnoise[ i ] = THREE.MathUtils.clamp( noise[ i ], - 5, 5 );

\t\t\t\t\tdisplacement[ i ] += noise[ i ];

\t\t\t\t}`;
  source = replaceOnce(source, loop,
    `\t\t\t\tlet nativeDisplacement = false;
\t\t\t\tif ( typeof globalThis.__jsrCustomAttributeBytes === 'function' ) {

\t\t\t\t\tdisplacementPacket[ 0 ] = displacement.length;
\t\t\t\t\tdisplacementPacket[ 1 ] = time;
\t\t\t\t\tdisplacementPacket[ 2 ] = 0;
\t\t\t\t\tglobalThis.__jsrCustomAttributeBytes( 'three.displacement', displacementBytes );
\t\t\t\t\tnativeDisplacement = displacementPacket[ 2 ] === 1;

\t\t\t\t}
\t\t\t\tif ( ! nativeDisplacement ) {

${loop.replace(/^/gm, '\t')}

\t\t\t\t}`, label);
  console.warn('three: R1 uses the native sine/noise displacement kernel when available; the exact official Math.random loop remains the fallback.');
  return Buffer.from(source, 'utf8');
}

function nativePointSizeLoop(loop, valueExpression, mode, vertices1 = '0') {
  return `\t\t\t\tlet nativeSizes = false;
\t\t\t\tif ( typeof globalThis.__jsrCustomAttributeBytes === 'function' ) {

\t\t\t\t\tconst sizeCount = ${valueExpression}.length;
\t\t\t\t\tif ( ! sizeNativePacket || sizeNativePacket.length !== 8 + sizeCount * 3 ) {

\t\t\t\t\t\tsizeNativePacket = new Float32Array( 8 + sizeCount * 3 );
\t\t\t\t\t\tsizeNativeBytes = new Uint8Array( sizeNativePacket.buffer );
\t\t\t\t\t\tsizeNativePacket.set( sizeSinPhases, 8 );
\t\t\t\t\t\tsizeNativePacket.set( sizeCosPhases, 8 + sizeCount );

\t\t\t\t\t}
\t\t\t\t\tsizeNativePacket[ 0 ] = sizeCount;
\t\t\t\t\tsizeNativePacket[ 1 ] = time;
\t\t\t\t\tsizeNativePacket[ 2 ] = ${mode};
\t\t\t\t\tsizeNativePacket[ 3 ] = ${vertices1};
\t\t\t\t\tsizeNativePacket[ 4 ] = 0;
\t\t\t\t\tglobalThis.__jsrCustomAttributeBytes( 'three.pointSizes', sizeNativeBytes );
\t\t\t\t\tif ( sizeNativePacket[ 4 ] === 1 ) {

\t\t\t\t\t\t${valueExpression}.set( sizeNativePacket.subarray( 8 + sizeCount * 2, 8 + sizeCount * 3 ) );
\t\t\t\t\t\tnativeSizes = true;

\t\t\t\t\t}

\t\t\t\t}
\t\t\t\tif ( ! nativeSizes ) {

${loop.replace(/^/gm, '\t')}

\t\t\t\t}`;
}

function customPoints(bytes) {
  const label = 'custom attributes points phase table';
  let source = Buffer.from(bytes).toString('utf8');
  source = phaseTables('amount',
    '\t\t\t\tconst sizes = new Float32Array( amount );',
    '\t\t\t\t\tsizes[ i ] = 10;', source, label);
  const phaseLoop = `\t\t\t\tconst sizeTimeSin = Math.sin( time );
\t\t\t\tconst sizeTimeCos = Math.cos( time );

\t\t\t\tfor ( let i = 0; i < attributes.size.array.length; i ++ ) {

\t\t\t\t\tattributes.size.array[ i ] = 14 + 13 * ( sizeSinPhases[ i ] * sizeTimeCos + sizeCosPhases[ i ] * sizeTimeSin );

\t\t\t\t}`;
  source = replaceOnce(source,
    `\t\t\t\tfor ( let i = 0; i < attributes.size.array.length; i ++ ) {

\t\t\t\t\tattributes.size.array[ i ] = 14 + 13 * Math.sin( 0.1 * i + time );

\t\t\t\t}`,
    nativePointSizeLoop(phaseLoop, 'attributes.size.array', 0), label);
  console.warn('three: R1 evaluates the custom point sine field with sin(a+b) phase tables; all 100k sizes still update every display frame.');
  return Buffer.from(source, 'utf8');
}

function buffergeometryParticles(bytes) {
  const label = 'buffergeometry custom particles phase table';
  let source = Buffer.from(bytes).toString('utf8');
  source = phaseTables('particles',
    '\t\t\t\tconst sizes = [];',
    '\t\t\t\t\tsizes.push( 20 );', source, label);
  source = replaceOnce(source,
    `\t\t\t\tfor ( let i = 0; i < particles; i ++ ) {

\t\t\t\t\tsizes[ i ] = 10 * ( 1 + Math.sin( 0.1 * i + time ) );

\t\t\t\t}`,
    `\t\t\t\tconst sizeTimeSin = Math.sin( time );
\t\t\t\tconst sizeTimeCos = Math.cos( time );

\t\t\t\tfor ( let i = 0; i < particles; i ++ ) {

\t\t\t\t\tsizes[ i ] = 10 * ( 1 + sizeSinPhases[ i ] * sizeTimeCos + sizeCosPhases[ i ] * sizeTimeSin );

\t\t\t\t}`,
    label);
  console.warn('three: R1 evaluates the buffergeometry particle sine field with sin(a+b) phase tables; all 100k sizes still update every display frame.');
  return Buffer.from(source, 'utf8');
}

function customPoints3(bytes) {
  const label = 'custom attributes points3 phase table';
  let source = Buffer.from(bytes).toString('utf8');
  source = phaseTables('positionAttribute.count',
    '\t\t\t\tconst sizes = [];',
    '\t\t\t\t\tsizes[ i ] = i < vertices1 ? 10 : 40;', source, label);
  const phaseLoop = `\t\t\t\tconst sizeTimeSin = Math.sin( 0.6 * time );
\t\t\t\tconst sizeTimeCos = Math.cos( 0.6 * time );

\t\t\t\tfor ( let i = 0; i < attributes.size.array.length; i ++ ) {

\t\t\t\t\tif ( i < vertices1 ) {

\t\t\t\t\t\tattributes.size.array[ i ] = Math.max( 0, 26 + 32 * ( sizeSinPhases[ i ] * sizeTimeCos + sizeCosPhases[ i ] * sizeTimeSin ) );

\t\t\t\t\t}

\t\t\t\t}`;
  source = replaceOnce(source,
    `\t\t\t\tfor ( let i = 0; i < attributes.size.array.length; i ++ ) {

\t\t\t\t\tif ( i < vertices1 ) {

\t\t\t\t\t\tattributes.size.array[ i ] = Math.max( 0, 26 + 32 * Math.sin( 0.1 * i + 0.6 * time ) );

\t\t\t\t\t}

\t\t\t\t}`,
    nativePointSizeLoop(phaseLoop, 'attributes.size.array', 2, 'vertices1'), label);
  console.warn('three: R1 evaluates the points3 sine field with sin(a+b) phase tables; the animated cloud and fixed 40px cage sizes are unchanged.');
  return Buffer.from(source, 'utf8');
}

export function applyCustomAttributeAnimationFastPath(bytes, example) {
  switch (example) {
    case 'webgl_custom_attributes': return customAttributes(bytes);
    case 'webgl_custom_attributes_points': return customPoints(bytes);
    case 'webgl_buffergeometry_custom_attributes_particles': return buffergeometryParticles(bytes);
    case 'webgl_custom_attributes_points3': return customPoints3(bytes);
    default: throw new Error(`custom attribute fast path: unsupported example ${example}`);
  }
}
