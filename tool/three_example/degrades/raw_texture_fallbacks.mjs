export function applyKtx2UprightPatch(bytes) {
  let source = Buffer.from(bytes).toString('utf8');
  if (source.includes('function ( texturearray )')) {
    const anchor = 'const material = new THREE.ShaderMaterial( {';
    if (!source.includes(anchor)) throw new Error('KTX2 upright: compressed material anchor drifted');
    source = source.replace(anchor, 'texturearray.flipY = true;\n\n\t\t\t\t\t' + anchor);
  } else if (source.includes('const textureArray = new THREE.DataArrayTexture')) {
    const anchor = '// Setup the GUI';
    if (!source.includes(anchor)) throw new Error('KTX2 upright: layer GUI anchor drifted');
    source = source.replace(anchor, 'textureArray.flipY = true;\n\n\t\t\t\t' + anchor);
  } else {
    throw new Error('KTX2 upright: texture container anchor drifted');
  }
  console.warn('three: R1 preserves source.flipY on array slices; transcoded KTX2 is marked for upright native upload.');
  return Buffer.from(source, 'utf8');
}

export function applyLayerUpdateRawArrayPatch(bytes) {
  let source = Buffer.from(bytes).toString('utf8');
  const anchor = /new THREE\.CompressedArrayTexture\( \[\s*\{\s*data: new Uint8Array\( layerByteLength \* 3 \),\s*width: spiritedaway\.image\.width,\s*height: spiritedaway\.image\.height,?\s*\}\s*\], spiritedaway\.image\.width, spiritedaway\.image\.height, 3, spiritedaway\.format, spiritedaway\.type \)/;
  if (!anchor.test(source)) throw new Error('texture array layer update: compressed container anchor drifted');
  source = source.replace(anchor,
    'new THREE.DataArrayTexture( new Uint8Array( layerByteLength * 3 ), spiritedaway.image.width, spiritedaway.image.height, 3 )');
  source = source.replaceAll('textureArray.mipmaps[ 0 ].data', 'textureArray.image.data');
  console.warn('three: R1 uses the transcoded RGBA DataArrayTexture container for layer updates; source layers and update cadence are unchanged.');
  return Buffer.from(source, 'utf8');
}

export function applyPartialUpdateRawCheckerPatch(bytes) {
  let source = Buffer.from(bytes).toString('utf8');
  const anchor = `\t\t\t\tconst loader = new THREE.TextureLoader();
\t\t\t\tdiffuseMap = await loader.loadAsync( 'textures/floors/FloorsCheckerboard_S_Diffuse.jpg' );`;
  if (!source.includes(anchor)) throw new Error('partial texture update: checker loader anchor drifted');
  const replacement = `\t\t\t// R1 copyTextureToTexture needs CPU-readable destination pixels.
\t\t\t// Keep the official 512px / 32px-tile checker layout as RGBA8 data.
\t\t\tconst checkerData = new Uint8Array( 512 * 512 * 4 );
\t\t\tfor ( let cy = 0; cy < 512; cy ++ ) {
\t\t\t\tfor ( let cx = 0; cx < 512; cx ++ ) {
\t\t\t\t\tconst light = ( ( cx >> 5 ) + ( cy >> 5 ) ) & 1;
\t\t\t\t\tconst value = light ? 224 : 72;
\t\t\t\t\tconst offset = ( cy * 512 + cx ) * 4;
\t\t\t\t\tcheckerData[ offset ] = value;
\t\t\t\t\tcheckerData[ offset + 1 ] = value;
\t\t\t\t\tcheckerData[ offset + 2 ] = value;
\t\t\t\t\tcheckerData[ offset + 3 ] = 255;
\t\t\t\t}
\t\t\t}
\t\t\tdiffuseMap = new THREE.DataTexture( checkerData, 512, 512 );`;
  source = source.replace(anchor, replacement);
  console.warn('three: R1 uses a CPU-readable 512px checkerboard for partial updates; the encoded JPEG cannot receive raw texel writes.');
  return Buffer.from(source, 'utf8');
}
