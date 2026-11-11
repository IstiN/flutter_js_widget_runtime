// Bounded Sponza stand-in for webgl_lightprobes_sponza (jsr-three R1).
//
// The official example resolves its Sponza model from the KhronosGroup
// glTF-Sample-Assets GitHub index (MODEL_INDEX_URL -> SAMPLE_ASSETS_BASE_URL).
// The bounded runtime has no network: `fetch` rejects and loadAsync never
// settles, which left the widget presenting only its Sky box (calls=1,
// triangles=12) with no scene.
//
// This degrade replaces the model URL with a PINNED local GLB generated at
// prepare time — a small colonnaded courtyard (floor, perimeter walls, two
// colonnades, arch band) whose bbox feeds the example's unmodified light
// probe grid, SunLight framing and FirstPersonControls. The official module
// text keeps its load/parse path (GLTFLoader.loadAsync on a real glTF binary),
// so every downstream stage is exercised unchanged.
//
// Disclosed loss: the substitute is NOT the photogrammetric Sponza asset; it
// is a stand-in courtyard with the same architectural role. The mesh carries
// per-vertex colors (stone bands) because the bounded lane has no texture
// pipeline for this example's assets.

function pushBox(target, cx, cy, cz, sx, sy, sz, r, g, b) {
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  const faces = [
    // +X
    [[hx, -hy, -hz], [hx, -hy, hz], [hx, hy, hz], [hx, hy, -hz], [1, 0, 0]],
    // -X
    [[-hx, -hy, hz], [-hx, -hy, -hz], [-hx, hy, -hz], [-hx, hy, hz], [-1, 0, 0]],
    // +Y
    [[-hx, hy, -hz], [hx, hy, -hz], [hx, hy, hz], [-hx, hy, hz], [0, 1, 0]],
    // -Y
    [[-hx, -hy, hz], [hx, -hy, hz], [hx, -hy, -hz], [-hx, -hy, -hz], [0, -1, 0]],
    // +Z
    [[-hx, -hy, hz], [-hx, hy, hz], [hx, hy, hz], [hx, -hy, hz], [0, 0, 1]],
    // -Z
    [[hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz], [-hx, -hy, -hz], [0, 0, -1]]
  ];
  for (const [a, b2, c, d, n] of faces) {
    const base = target.positions.length / 3;
    for (const [x, y, z] of [a, b2, c, d]) {
      target.positions.push(cx + x, cy + y, cz + z);
      target.normals.push(n[0], n[1], n[2]);
      target.colors.push(r, g, b);
    }
    target.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
}

// A courtyard ~16m wide, 8m tall, 32m deep (half of the real Sponza atrium's
// scale so FirstPersonControls movement speed 2 m/s still feels right).
export function buildSponzaStandin() {
  const target = { positions: [], normals: [], colors: [], indices: [] };
  const stone = [0.86, 0.82, 0.74];
  const band = [0.72, 0.66, 0.58];
  const roof = [0.58, 0.54, 0.5];
  // Atrium-scale courtyard: walls at x=±20 and z=±30 with the interior clear
  // so the official FirstPersonControls camera (-10.25, 4.99, 0.40) starts
  // INSIDE the volume (a smaller stand-in left the camera inside the west
  // wall and the whole viewport read black).
  pushBox(target, 0, 0, 0, 40, 1, 60, ...stone);   // floor (top at y=0.5)
  // No ceiling slab: the real Sponza atrium is open to the sky, so the
  // example's high-elevation sun can light the interior directly. A ceiling
  // turned the whole courtyard into permanent shadow (black viewport).
  pushBox(target, -20.5, 8.5, 0, 1, 16, 60, ...stone); // west wall
  pushBox(target, 20.5, 8.5, 0, 1, 16, 60, ...stone);  // east wall
  pushBox(target, 0, 8.5, -30.5, 40, 16, 1, ...stone); // back wall
  // Colonnades: two rows of twelve columns with band courses.
  for (let i = 0; i < 12; i++) {
    const z = -27.5 + i * 5;
    for (const x of [-13, 13]) {
      pushBox(target, x, 7, z, 1.6, 12, 1.6, ...stone);
      pushBox(target, x, 13.5, z, 2.2, 0.9, 2.2, ...band);
    }
  }
  // Arch band per bay along both colonnades.
  for (let i = 0; i < 11; i++) {
    const z = -25 + i * 5;
    for (const x of [-13, 13]) {
      pushBox(target, x, 15.2, z, 1.8, 2.4, 5, ...band);
    }
  }
  // Corner buttresses.
  for (const z of [-29, 29]) for (const x of [-19.5, 19.5]) {
    pushBox(target, x, 8.5, z, 2.5, 15, 2.5, ...band);
  }

  const vertexCount = target.positions.length / 3;
  const indexCount = target.indices.length;
  const positions = new Float32Array(target.positions);
  const normals = new Float32Array(target.normals);
  const colors = Buffer.alloc(target.colors.length);
  for (let i = 0; i < target.colors.length; i++) colors[i] = Math.round(target.colors[i] * 255);
  const indices = new Uint32Array(target.indices);

  const posBytes = positions.byteLength;
  const norBytes = normals.byteLength;
  const colBytes = colors.byteLength;
  const idxBytes = indices.byteLength;
  const pad = (n) => (n + 3) & ~3;
  const offsets = {
    positions: 0,
    normals: pad(posBytes),
    colors: pad(posBytes) + pad(norBytes),
    indices: pad(posBytes) + pad(norBytes) + pad(colBytes)
  };
  const binLength = offsets.indices + pad(idxBytes);
  const bin = Buffer.alloc(binLength);
  Buffer.from(positions.buffer, positions.byteOffset, posBytes).copy(bin, offsets.positions);
  Buffer.from(normals.buffer, normals.byteOffset, norBytes).copy(bin, offsets.normals);
  colors.copy(bin, offsets.colors);
  Buffer.from(indices.buffer, indices.byteOffset, idxBytes).copy(bin, offsets.indices);

  const gltf = {
    asset: { version: '2.0', generator: 'jsr-three sponza standin degrade' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: 'SponzaStandin' }],
    meshes: [{
      name: 'Courtyard',
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 },
        indices: 3,
        material: 0
      }]
    }],
    materials: [{
      name: 'Stone',
      pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0.05, roughnessFactor: 0.85 }
    }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: vertexCount, type: 'VEC3', min: [-21, -0.5, -31], max: [21, 17.5, 31] },
      { bufferView: 1, componentType: 5126, count: vertexCount, type: 'VEC3' },
      { bufferView: 2, componentType: 5121, count: vertexCount, type: 'VEC3', normalized: true },
      { bufferView: 3, componentType: 5125, count: indexCount, type: 'SCALAR' }
    ],
    bufferViews: [
      { buffer: 0, byteOffset: offsets.positions, byteLength: posBytes },
      { buffer: 0, byteOffset: offsets.normals, byteLength: norBytes },
      { buffer: 0, byteOffset: offsets.colors, byteLength: colBytes },
      { buffer: 0, byteOffset: offsets.indices, byteLength: idxBytes }
    ],
    buffers: [{ byteLength: binLength }]
  };
  const jsonBytes = Buffer.from(JSON.stringify(gltf), 'utf8');
  const jsonPad = (4 - (jsonBytes.length % 4)) % 4;
  const binPad = (4 - (binLength % 4)) % 4;
  const total = 12 + 8 + jsonBytes.length + jsonPad + 8 + binLength + binPad;
  const glb = Buffer.alloc(total);
  glb.writeUInt32LE(0x46546c67, 0); // glTF
  glb.writeUInt32LE(2, 4);
  glb.writeUInt32LE(total, 8);
  glb.writeUInt32LE(jsonBytes.length + jsonPad, 12);
  glb.writeUInt32LE(0x4e4f534a, 16); // JSON
  jsonBytes.copy(glb, 20);
  // GLB spec: JSON chunk padding must be SPACES (0x20); zero padding makes
  // GLTFLoader's JSON.parse throw "Unexpected non-whitespace character after
  // JSON" and the whole widget silently drops its scene.
  glb.fill(0x20, 20 + jsonBytes.length, 20 + jsonBytes.length + jsonPad);
  const binHeaderAt = 20 + jsonBytes.length + jsonPad;
  glb.writeUInt32LE(binLength + binPad, binHeaderAt);
  glb.writeUInt32LE(0x004e4942, binHeaderAt + 4); // BIN
  bin.copy(glb, binHeaderAt + 8);
  return glb;
}

// Anchored module patch: route the example's model load at the pinned local
// stand-in instead of the network sample index. Throws on drift so a silent
// miss is impossible.
export function applySponzaStandInPatch(moduleBytes) {
  const anchor = 'const modelURL = await getSponzaModelURL();';
  const source = moduleBytes.toString('utf8');
  if (!source.includes(anchor)) {
    throw new Error('sponza_standin: model URL anchor drifted — re-pin the patch');
  }
  const replacement = [
    '// jsr-three: bounded offline lane — the KhronosGroup sample index needs',
    '// network fetch, which the runtime rejects. Load the pinned generated',
    '// courtyard stand-in instead (disclosed below).',
    "const modelURL = 'models/gltf/sponza_standin.glb';",
    "console.warn('three: R1 substitutes the bounded generated courtyard stand-in for the network Sponza sample (offline runtime).');"
  ].join('\n');
  return Buffer.from(source.replace(anchor, replacement), 'utf8');
}
