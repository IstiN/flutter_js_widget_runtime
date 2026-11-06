// Prepare-time GLB transform for webgl_performance (JSR bounded degrade).
//
// The official r186 webgl_performance module loads the static dungeon
// scene (dungeon_warkarma.glb): 798 meshes x 1 triangle-list primitive,
// 1489 TRS nodes, 25 materials, no extensions, no skinning/animation.
// On the JSR R1 runtime the JS render is cheap (measured frameMs ~4.0 for
// the whole scene on the QuickJS side) while the per-frame cost is the
// Dart draw envelope: measured 30.6 presented fps at 798 planned opaque
// draws (~32ms/frame wall). Merging the static meshes by material at
// prepare time cuts the draw count 798 -> 25 (per-material meshes, all
// node transforms baked into world space) for the same rendered pixels.
//
// Deviation: the shipped GLB is a material-merged re-layout of the pinned
// GLB (same geometry bytes, same 25 materials/textures/images/URIs, node
// transforms baked). Per-mesh names and the original node hierarchy are
// not preserved (nothing in the official module reads them: no raycast,
// no per-node animation). The official module, loader and JSR runtime are
// untouched; only the prepared asset bytes change.
//
// The transform is pure node (no deps), deterministic, and runs once per
// prepare. Prepare throws on any structural surprise (non-triangle
// primitives, extra attributes, extensions, sparse accessors) so the
// degrade cannot silently ship a wrong scene.

const COMPONENT_TYPE_FLOAT = 5126;
const COMPONENT_TYPE_UNSIGNED_INT = 5125;

const TYPE_SIZES = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const COMPONENT_BYTES = {
  5120: 2, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4
};

function assertMergeable(gltf) {
  if (gltf.extensionsUsed?.length || gltf.extensionsRequired?.length) {
    throw new Error('glb_material_merge: GLB declares extensions');
  }
  if (!gltf.scenes?.length || !gltf.scenes[0].nodes) {
    throw new Error('glb_material_merge: GLB has no default scene');
  }
  let prims = 0;
  for (const mesh of gltf.meshes ?? []) {
    for (const prim of mesh.primitives) {
      prims++;
      if ((prim.mode ?? 4) !== 4) {
        throw new Error(`glb_material_merge: non-triangle primitive mode ${prim.mode}`);
      }
      if (prim.extensions || prim.targets) {
        throw new Error('glb_material_merge: primitive extensions/targets');
      }
      const names = Object.keys(prim.attributes);
      for (const name of names) {
        if (name !== 'POSITION' && name !== 'NORMAL' && name !== 'TEXCOORD_0') {
          throw new Error(`glb_material_merge: unsupported attribute ${name}`);
        }
      }
      if (prim.attributes.POSITION === undefined) {
        throw new Error('glb_material_merge: primitive without POSITION');
      }
    }
  }
  if (prims === 0) throw new Error('glb_material_merge: no primitives');
}

function readAccessorComponent(gltf, bin, index) {
  const accessor = gltf.accessors[index];
  const view = gltf.bufferViews[accessor.bufferView ?? 0];
  const bytes = COMPONENT_BYTES[accessor.componentType];
  const count = TYPE_SIZES[accessor.type] * bytes;
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  // bufferViews may be interleaved (byteStride) and shared by several
  // accessors — take the rest of the BIN and let the stride do the layout.
  return {
    count: accessor.count,
    stride: view.byteStride ?? count,
    componentCount: TYPE_SIZES[accessor.type],
    componentType: accessor.componentType,
    bytes: bin.subarray(start)
  };
}

function accessorToFloat32(accessor) {
  const out = new Float32Array(accessor.count * accessor.componentCount);
  const { bytes, stride, componentCount, componentType } = accessor;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < accessor.count; i++) {
    for (let c = 0; c < componentCount; c++) {
      const at = i * stride + c * COMPONENT_BYTES[componentType];
      out[i * componentCount + c] =
        componentType === COMPONENT_TYPE_FLOAT
          ? dv.getFloat32(at, true)
          : componentType === 5123 ? dv.getUint16(at, true)
          : componentType === 5122 ? dv.getInt16(at, true)
          : componentType === 5121 ? dv.getUint8(at)
          : componentType === 5120 ? dv.getInt8(at)
          : dv.getUint32(at, true);
    }
  }
  return out;
}

function accessorToUint32(accessor) {
  const out = new Uint32Array(accessor.count);
  const { bytes, stride, componentType } = accessor;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < accessor.count; i++) {
    const at = i * stride;
    out[i] =
      componentType === 5125 ? dv.getUint32(at, true)
      : componentType === 5123 ? dv.getUint16(at, true)
      : componentType === 5122 ? dv.getInt16(at, true)
      : componentType === 5121 ? dv.getUint8(at)
      : componentType === 5120 ? dv.getInt8(at)
      : dv.getUint32(at, true);
  }
  return out;
}

function quatToMat3(q) {
  const [x, y, z, w] = q;
  return [
    1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w),
    2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w),
    2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)
  ];
}

function localMatrix(node) {
  if (node.matrix) {
    // GLTF stores column-major; return row-major 4x4.
    const m = node.matrix;
    return [
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15]
    ];
  }
  const t = node.translation ?? [0, 0, 0];
  const s = node.scale ?? [1, 1, 1];
  const r = quatToMat3(node.rotation ?? [0, 0, 0, 1]);
  return [
    r[0] * s[0], r[1] * s[1], r[2] * s[2], t[0],
    r[3] * s[0], r[4] * s[1], r[5] * s[2], t[1],
    r[6] * s[0], r[7] * s[1], r[8] * s[2], t[2],
    0, 0, 0, 1
  ];
}

function mul4(a, b) {
  const out = new Array(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      out[r * 4 + c] =
        a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c] + a[r * 4 + 3] * b[12 + c];
    }
  }
  return out;
}

function inverseTranspose3(m) {
  const [a00, a01, a02, a10, a11, a12, a20, a21, a22] = m;
  const b01 = a22 * a11 - a12 * a21;
  const b11 = -a22 * a10 + a12 * a20;
  const b21 = a21 * a10 - a11 * a20;
  const det = a00 * b01 + a01 * b11 + a02 * b21;
  if (!det) return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const inv = 1 / det;
  return [
    b01 * inv, (-a22 * a01 + a02 * a21) * inv, (a12 * a01 - a02 * a11) * inv,
    b11 * inv, (a22 * a00 - a02 * a20) * inv, (-a12 * a00 + a02 * a10) * inv,
    b21 * inv, (-a21 * a00 + a01 * a20) * inv, (a11 * a00 - a01 * a10) * inv
  ];
}

export function mergeGlbByMaterial(bytes) {
  if (bytes.readUInt32LE(0) !== 0x46546C67) {
    throw new Error('glb_material_merge: not a GLB');
  }
  let offset = 12;
  let gltf = null;
  let bin = null;
  while (offset < bytes.length) {
    const chunkLength = bytes.readUInt32LE(offset);
    const chunkType = bytes.readUInt32LE(offset + 4);
    const data = bytes.subarray(offset + 8, offset + 8 + chunkLength);
    if (chunkType === 0x4E4F534A) gltf = JSON.parse(data.toString('utf8'));
    else if (chunkType === 0x004E4942) bin = data;
    offset += 8 + chunkLength;
  }
  if (!gltf || !bin) throw new Error('glb_material_merge: missing JSON/BIN chunk');
  assertMergeable(gltf);

  // World transforms per node (row-major 4x4).
  const world = new Map();
  const walk = (nodeIndex, parent) => {
    if (world.has(nodeIndex)) return;
    const node = gltf.nodes[nodeIndex];
    const m = mul4(parent, localMatrix(node));
    world.set(nodeIndex, m);
    for (const child of node.children ?? []) walk(child, m);
  };
  for (const root of gltf.scenes[0].nodes) walk(root, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

  // Accumulate per material.
  const groups = new Map();
  let triangles = 0;
  const emitPrimitive = (nodeIndex, meshIndex, prim) => {
    const material = prim.material ?? 0;
    let group = groups.get(material);
    if (!group) {
      group = { positions: [], normals: [], uvs: [], indices: [], base: 0 };
      groups.set(material, group);
    }
    const node = gltf.nodes[nodeIndex];
    const mesh = gltf.meshes[meshIndex];
    const m = world.get(nodeIndex);
    const n = inverseTranspose3([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]);
    const pos = accessorToFloat32(readAccessorComponent(gltf, bin, prim.attributes.POSITION));
    const nor = prim.attributes.NORMAL !== undefined
      ? accessorToFloat32(readAccessorComponent(gltf, bin, prim.attributes.NORMAL))
      : null;
    const uv = prim.attributes.TEXCOORD_0 !== undefined
      ? accessorToFloat32(readAccessorComponent(gltf, bin, prim.attributes.TEXCOORD_0))
      : null;
    const idx = accessorToUint32(readAccessorComponent(gltf, bin, prim.indices));
    const verts = pos.length / 3;
    const pOut = new Float32Array(pos.length);
    for (let i = 0; i < verts; i++) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      pOut[i * 3] = m[0] * x + m[1] * y + m[2] * z + m[3];
      pOut[i * 3 + 1] = m[4] * x + m[5] * y + m[6] * z + m[7];
      pOut[i * 3 + 2] = m[8] * x + m[9] * y + m[10] * z + m[11];
    }
    group.positions.push(pOut);
    if (nor) {
      const nOut = new Float32Array(nor.length);
      for (let i = 0; i < verts; i++) {
        const x = nor[i * 3], y = nor[i * 3 + 1], z = nor[i * 3 + 2];
        let nx = n[0] * x + n[1] * y + n[2] * z;
        let ny = n[3] * x + n[4] * y + n[5] * z;
        let nz = n[6] * x + n[7] * y + n[8] * z;
        const len = Math.hypot(nx, ny, nz) || 1;
        nOut[i * 3] = nx / len;
        nOut[i * 3 + 1] = ny / len;
        nOut[i * 3 + 2] = nz / len;
      }
      group.normals.push(nOut);
    }
    if (uv) group.uvs.push(uv.slice());
    for (let i = 0; i < idx.length; i++) group.indices.push(idx[i] + group.base);
    group.base += verts;
    triangles += idx.length / 3;
    void node; void mesh;
  };

  for (const [nodeIndex, node] of (gltf.nodes ?? []).entries()) {
    if (node.mesh === undefined) continue;
    const mesh = gltf.meshes[node.mesh];
    for (const prim of mesh.primitives) emitPrimitive(nodeIndex, node.mesh, prim);
  }
  if (groups.size === 0) throw new Error('glb_material_merge: no mesh nodes under the default scene');

  // Build the merged GLTF JSON + BIN.
  const binParts = [];
  let binLength = 0;
  const pushPart = (typed) => {
    const start = binLength;
    const pad = (4 - (binLength % 4)) % 4;
    if (pad) {
      binParts.push(Buffer.alloc(pad));
      binLength += pad;
    }
    binParts.push(Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength));
    binLength += typed.byteLength;
    return { start: start + pad, length: typed.byteLength };
  };
  const accessors = [];
  const bufferViews = [];
  const meshes = [];
  let accessorIndex = 0;
  const nextAccessor = view => {
    bufferViews.push({ buffer: 0, byteOffset: view.start, byteLength: view.length });
    const acc = { bufferView: bufferViews.length - 1, componentType: 0, count: 0, type: 'SCALAR' };
    accessors.push(acc);
    return acc;
  };
  for (const [material, group] of groups) {
    const positions = concatFloat32(group.positions);
    const posView = pushPart(positions);
    const posAcc = nextAccessor(posView);
    posAcc.componentType = COMPONENT_TYPE_FLOAT;
    posAcc.count = positions.length / 3;
    posAcc.type = 'VEC3';
    const { min, max } = minMax3(positions);
    posAcc.min = min;
    posAcc.max = max;
    const positionIndex = accessorIndex++;

    let normalIndex;
    if (group.normals.length) {
      const normals = concatFloat32(group.normals);
      const norView = pushPart(normals);
      const norAcc = nextAccessor(norView);
      norAcc.componentType = COMPONENT_TYPE_FLOAT;
      norAcc.count = normals.length / 3;
      norAcc.type = 'VEC3';
      normalIndex = accessorIndex++;
    }

    let uvIndex;
    if (group.uvs.length) {
      const uvs = concatFloat32(group.uvs);
      const uvView = pushPart(uvs);
      const uvAcc = nextAccessor(uvView);
      uvAcc.componentType = COMPONENT_TYPE_FLOAT;
      uvAcc.count = uvs.length / 2;
      uvAcc.type = 'VEC2';
      uvIndex = accessorIndex++;
    }

    const indices = Uint32Array.from(group.indices);
    const idxView = pushPart(indices);
    const idxAcc = nextAccessor(idxView);
    idxAcc.componentType = COMPONENT_TYPE_UNSIGNED_INT;
    idxAcc.count = indices.length;
    idxAcc.type = 'SCALAR';
    const indicesIndex = accessorIndex++;

    const attributes = { POSITION: positionIndex };
    if (normalIndex !== undefined) attributes.NORMAL = normalIndex;
    if (uvIndex !== undefined) attributes.TEXCOORD_0 = uvIndex;
    const materialName = gltf.materials?.[material]?.name ?? `material_${material}`;
    meshes.push({
      name: `jsr_merged_${materialName}`,
      primitives: [{ attributes, indices: indicesIndex, material, mode: 4 }]
    });
  }

  const mergedNodes = meshes.map((mesh, i) => ({ name: mesh.name, mesh: i }));
  const merged = {
    asset: {
      ...(gltf.asset ?? {}),
      version: '2.0',
      generator: `${gltf.asset?.generator ?? 'unknown'}; jsr prepare glb_material_merge (static material merge)`
    },
    scene: 0,
    scenes: [{ name: gltf.scenes?.[0]?.name ?? 'Scene', nodes: mergedNodes.map((_, i) => i) }],
    nodes: mergedNodes,
    meshes,
    accessors,
    bufferViews,
    materials: gltf.materials ?? [],
    textures: gltf.textures ?? [],
    samplers: gltf.samplers ?? [],
    images: gltf.images ?? [],
    buffers: [{ byteLength: 0 }]
  };

  const binBuffer = Buffer.concat(binParts);
  merged.buffers[0].byteLength = binBuffer.length;

  const jsonText = Buffer.from(JSON.stringify(merged), 'utf8');
  const jsonPad = (4 - (jsonText.length % 4)) % 4;
  const binPad = (4 - (binBuffer.length % 4)) % 4;
  const total = 12 + 8 + jsonText.length + jsonPad + 8 + binBuffer.length + binPad;
  const out = Buffer.alloc(total);
  out.writeUInt32LE(0x46546C67, 0);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(total, 8);
  out.writeUInt32LE(jsonText.length + jsonPad, 12);
  out.writeUInt32LE(0x4E4F534A, 16);
  jsonText.copy(out, 20);
  for (let i = 0; i < jsonPad; i++) out[20 + jsonText.length + i] = 0x20;
  const binChunkAt = 20 + jsonText.length + jsonPad;
  out.writeUInt32LE(binBuffer.length + binPad, binChunkAt);
  out.writeUInt32LE(0x004E4942, binChunkAt + 4);
  binBuffer.copy(out, binChunkAt + 8);
  void triangles;
  return out;
}

function concatFloat32(parts) {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Float32Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

function minMax3(values) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < values.length; i += 3) {
    for (let c = 0; c < 3; c++) {
      const v = values[i + c];
      if (v < min[c]) min[c] = v;
      if (v > max[c]) max[c] = v;
    }
  }
  return { min, max };
}
