import { checkedU32 } from './errors.js';
// r1.js is imported directly by node tests; runtime.js pulls in the audio
// shim which needs the pinned three source, so inline the one helper it
// borrows instead of importing the whole runtime. The helper is the
// STRING->bytes direction (TextEncoder in browsers / Buffer in the vm).
const utf8 = value => (typeof TextEncoder !== 'undefined')
  ? new TextEncoder().encode(value)
  : Uint8Array.from(Buffer.from(value, 'utf8'));

export const T1_VERSION = 1;
// v9: recognised postprocessing materials carry three extra texture ids and
// sixteen extra scalar uniforms before the Dubois suffix. This bounded tail
// holds UnrealBloomPass's five-mip composite and at most eleven Gaussian
// pairs; v8: material stencil tail (last 32 bytes when MATERIAL_FLAG_STENCIL
// is set), the material colorWrite flag bit, OPCODE.STENCIL_CLEAR mid-stream
// markers and the FRAME_TARGET_FLAGS.clearStencil frame-start bit (see the v8
// block above materialCommand). v7: node renderOrder tail. v6: normal/bump/PBR
// map slots and the Dubois anaglyph tail. v5: matcap/gradient slots, sprite
// rotation, point-shadow block, cube texture flag. v4: alpha/env texture
// slots, UV transforms, tone mapping + FogExp2 density.
export const R1_VERSION = 9;
export const STREAM_R1 = 1;
const NATIVE_U32_LITTLE_ENDIAN = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
export const MAX_ENVELOPE = 64 * 1024 * 1024;
export const OPCODE = Object.freeze({
  GEOMETRY: 1,
  TEXTURE: 2,
  MATERIAL: 3,
  NODE: 4,
  REMOVE_NODE: 5,
  CAMERA: 6,
  LIGHT: 7,
  FRAME: 8,
  DISPOSE_RESOURCE: 9,
  DISPOSE_SURFACE: 10,
  DRAW_BATCH: 11,
  REMOVE_BATCH: 12,
  CLIPPING: 13,
  RENDER_TARGET: 14,
  // v8: mid-stream stencil-buffer clear (u32 nodeId, u32 value). Emitted
  // where upstream executes renderer.clearStencil(value) — usually an
  // object.onAfterRender callback right after that object's draw. The native
  // side applies the clear after ALL draws of nodeId in its sorted draw
  // order (renderOrder), so the marker stays correct under re-sorting;
  // nodeId 0 means "at this stream position" (no owning draw).
  STENCIL_CLEAR: 15
});

export const NODE_SHADOW_FLAGS = Object.freeze({ cast: 1, receive: 2 });
const IDENTITY_MATRIX = Object.freeze([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
export const NO_SHADOW = Object.freeze({
  width: 0, height: 0, bias: 0, normalBias: 0, radius: 1,
  matrix: IDENTITY_MATRIX
});

export class ByteWriter {
  constructor(size = 256) {
    this.buffer = new ArrayBuffer(Math.max(16, size));
    this.view = new DataView(this.buffer);
    this.length = 0;
  }

  ensure(bytes) {
    if (this.length + bytes <= this.buffer.byteLength) return;
    let size = this.buffer.byteLength;
    while (size < this.length + bytes) size *= 2;
    const next = new ArrayBuffer(size);
    new Uint8Array(next).set(new Uint8Array(this.buffer, 0, this.length));
    this.buffer = next;
    this.view = new DataView(next);
  }

  u8(value) { this.ensure(1); this.view.setUint8(this.length, value); this.length += 1; }
  u16(value) { this.ensure(2); this.view.setUint16(this.length, value, true); this.length += 2; }
  u32(value) { this.ensure(4); this.view.setUint32(this.length, checkedU32(value, 'u32'), true); this.length += 4; }
  f32(value) { this.ensure(4); this.view.setFloat32(this.length, value, true); this.length += 4; }
  bytes(value) { const bytes = value instanceof Uint8Array ? value : new Uint8Array(value); this.ensure(bytes.length); new Uint8Array(this.buffer, this.length, bytes.length).set(bytes); this.length += bytes.length; }
  floats(values) { for (let i = 0; i < values.length; i++) this.f32(values[i]); }
  finish() { return new Uint8Array(this.buffer, 0, this.length).slice(); }
}

export function command(opcode, body = new Uint8Array(0)) {
  if (body.length > 0xffffffff) throw new Error('three.invalid: command body is too large');
  return { opcode, body };
}

export function resourceId(object) {
  if (!object || !Number.isInteger(object.id) || object.id < 0 || object.id > 0xffffffff) throw new Error('three.invalid: upstream object id is not u32');
  // THREE starts several ID counters at zero, while R1 reserves zero for null.
  // Preserve every other upstream ID and use the otherwise unreachable u32 tail for zero.
  return object.id === 0 ? 0xffffffff : object.id >>> 0;
}

export function encodeEnvelope(commands, engineId, surfaceId, sequence) {
  if (!Array.isArray(commands) || commands.length > 100000) throw new Error('three.invalid: R1 command count exceeds 100000');
  checkedU32(sequence, 'sequence');
  const engine = utf8(engineId);
  const surface = utf8(surfaceId);
  if (!engine.length || engine.length > 128 || !surface.length || surface.length > 128) throw new Error('three.invalid: T1 identity length');
  let payloadSize = 12;
  for (const item of commands) {
    if (!item || !Number.isInteger(item.opcode) || item.opcode < 1 || item.opcode > 255) throw new Error('three.invalid: R1 opcode');
    payloadSize += 8 + item.body.length;
  }
  const payload = new ByteWriter(payloadSize);
  payload.bytes(new Uint8Array([0x4a, 0x53, 0x52, 0x31]));
  payload.u16(R1_VERSION);
  payload.u16(0);
  payload.u32(commands.length);
  for (const item of commands) {
    payload.u8(item.opcode);
    payload.u8(0);
    payload.u16(0);
    payload.u32(item.body.length);
    payload.bytes(item.body);
  }
  const payloadBytes = payload.finish();
  const headerBytes = 32 + engine.length + surface.length;
  const totalBytes = headerBytes + payloadBytes.length;
  if (totalBytes > MAX_ENVELOPE) throw new Error('three.invalid: T1 envelope exceeds 64 MiB');
  const output = new Uint8Array(totalBytes);
  const view = new DataView(output.buffer);
  output.set([0x4a, 0x53, 0x52, 0x33], 0);
  view.setUint8(4, T1_VERSION);
  view.setUint8(5, STREAM_R1);
  view.setUint16(6, headerBytes, true);
  view.setUint32(8, sequence, true);
  view.setUint32(12, payloadBytes.length, true);
  view.setUint16(16, engine.length, true);
  view.setUint16(18, surface.length, true);
  view.setUint32(20, 0, true);
  view.setUint32(24, totalBytes, true);
  view.setUint32(28, 0, true);
  output.set(engine, 32);
  output.set(surface, 32 + engine.length);
  output.set(payloadBytes, headerBytes);
  return output;
}

export function geometryCommand(id, version, primitive, vertexCount, attributes, indices, wireIndices = null) {
  let indexCount = indices ? indices.length : 0;
  let mask = 0;
  const names = ['position', 'normal', 'uv', 'color'];
  for (let i = 0; i < names.length; i++) if (attributes[names[i]]) mask |= 1 << i;
  if (wireIndices && (primitive !== 0 || wireIndices.length % 2 !== 0)) throw new Error('three.invalid: wire indices require complete triangle-mesh edges');
  const wireBytes = wireIndices ? 4 + wireIndices.length * 4 : 0;
  let attributeBytes = 0;
  for (const name of names) {
    const values = attributes[name];
    if (values) attributeBytes += 4 + values.byteLength;
  }
  const body = new ByteWriter(28 + attributeBytes + indexCount * 4 + wireBytes);
  body.u32(id);
  body.u32(version);
  body.u32(mask);
  body.u32(vertexCount);
  body.u32(indexCount);
  body.u32(primitive);
  body.u32(0);
  for (const name of names) {
    const values = attributes[name];
    if (!values) continue;
    body.u32(values.byteLength);
    body.bytes(new Uint8Array(values.buffer, values.byteOffset, values.byteLength));
  }
  if (indices) {
    if (indices instanceof Uint32Array && NATIVE_U32_LITTLE_ENDIAN) {
      // Dynamic position/normal uploads must not reserialize an unchanged
      // index buffer through one QuickJS DataView call per index.
      body.bytes(new Uint8Array(indices.buffer, indices.byteOffset, indices.byteLength));
    } else {
      for (let i = 0; i < indices.length; i++) body.u32(indices[i]);
    }
  }
  if (wireIndices) {
    body.u32(wireIndices.length);
    for (let i = 0; i < wireIndices.length; i++) body.u32(wireIndices[i]);
  }
  return command(OPCODE.GEOMETRY, body.finish());
}

export function textureCommand(id, version, width, height, encoding, flags, data) {
  const body = new ByteWriter(28 + data.length);
  body.u32(id);
  body.u32(version);
  body.u32(width);
  body.u32(height);
  body.u32(encoding);
  body.u32(flags);
  body.u32(data.length);
  body.bytes(data);
  return command(OPCODE.TEXTURE, body.finish());
}

// Texture flag bit for the R1 v5 cube lane: `data` concatenates the six
// +X,-X,+Y,-Y,+Z,-Z faces of `width` x `height` raw RGBA8 texel blocks.
export const TEXTURE_FLAG_CUBE = 0x80;

export const MATERIAL_CLIP_FLAGS = Object.freeze({ intersection: 1, shadows: 2 });

// --- R1 v8 stencil lane -----------------------------------------------------
// Upstream Material.stencil*/colorWrite state is encoded as raw WebGL enum
// values so the native pass can forward them straight to gl.stencilFunc /
// gl.stencilOp without a mapping table. Material flag bits (u32 at body
// offset 16): bits 0..9 pre-exist (vertexColors..blending<<7), bit 10 marks
// upstream colorWrite === false (default true, so the bit is absent — and
// the encoding byte-stable — for stenciless materials), bit 11 marks the v8
// stencil tail as the LAST 32 bytes of the material body:
//   -32 u32 stencilWrite     upstream material.stencilWrite (test+write enable)
//   -28 u32 stencilFunc      STENCIL_FUNC value (default always)
//   -24 u32 stencilRef       upstream material.stencilRef
//   -20 u32 stencilFuncMask  compare mask (default 255)
//   -16 u32 stencilWriteMask write mask (default 255)
//   -12 u32 stencilFailOp    STENCIL_OP value (default keep)
//    -8 u32 stencilZFailOp   STENCIL_OP value (default keep)
//    -4 u32 stencilZPassOp   STENCIL_OP value (default keep)
// The tail exists only when some stencil property leaves its upstream
// default; absent tail + clear bit 11 keeps pre-v8 bodies byte-identical.
// Frame-start stencil clears ride FRAME_TARGET_FLAGS.clearStencil in the
// FRAME frame-target flags (value is always 0); every other clear — the
// upstream renderer.clearStencil() path, typically object.onAfterRender —
// uses OPCODE.STENCIL_CLEAR markers with the exact value.
export const MATERIAL_FLAG_COLOR_WRITE_OFF = 0x400;
export const MATERIAL_FLAG_STENCIL = 0x800;
// Raw GL stencil test functions (upstream THREE.NeverStencilFunc..AlwaysStencilFunc).
export const STENCIL_FUNC = Object.freeze({
  never: 0x0200, less: 0x0201, equal: 0x0202, lessEqual: 0x0203,
  greater: 0x0204, notEqual: 0x0205, greaterEqual: 0x0206, always: 0x0207
});
// Raw GL stencil operations (upstream THREE.ZeroStencilOp..DecrementWrapStencilOp).
export const STENCIL_OP = Object.freeze({
  zero: 0, keep: 0x1e00, replace: 0x1e01, increment: 0x1e02,
  decrement: 0x1e03, invert: 0x150a, incrementWrap: 0x8507, decrementWrap: 0x8508
});

function stencilEnum(map, value, label) {
  for (const name of Object.keys(map)) if (map[name] === value) return value;
  throw new Error(`three.invalid: material ${label} is not a stencil enum value`);
}

export function stencilClearCommand(nodeId = 0, value = 0) {
  const body = new ByteWriter(8);
  body.u32(checkedU32(nodeId, 'stencilClear.nodeId'));
  body.u32(checkedU32(value, 'stencilClear.value'));
  return command(OPCODE.STENCIL_CLEAR, body.finish());
}

export function renderTargetCommand(id, version, width, height, textureId, flags) {
  const body = new ByteWriter(28);
  body.u32(checkedU32(id, 'renderTarget.id'));
  body.u32(checkedU32(version, 'renderTarget.version'));
  body.u32(checkedU32(width, 'renderTarget.width'));
  body.u32(checkedU32(height, 'renderTarget.height'));
  body.u32(checkedU32(textureId, 'renderTarget.textureId'));
  body.u32(checkedU32(flags, 'renderTarget.flags'));
  body.u32(0);
  return command(OPCODE.RENDER_TARGET, body.finish());
}

export function materialCommand(id, version, kind, mapId, flags, side, color, opacity, roughness, metalness, alphaTest, pointSize, specular = null, shininess = 0, emissive = null, emissiveIntensity = 1, clipId = 0, clipFlags = 0, textureSlots = null, v5Slots = null, v6Slots = null, dubois = null, stencil = null, post = null) {
  if ((kind === 5) !== (specular !== null)) throw new Error('three.invalid: Phong material requires exactly one specular payload');
  if (emissive !== null && kind !== 1 && kind !== 2 && kind !== 5 && kind !== 8) throw new Error('three.invalid: emissive payload requires a lit mesh material');
  if (!Number.isInteger(clipId) || clipId < 0) throw new Error('three.invalid: material clip id');
  if (clipFlags !== 0 && clipFlags !== 1 && clipFlags !== 2 && clipFlags !== 3) {
    throw new Error('three.invalid: material clip flags');
  }
  const slots = textureSlots || { alphaMapId: 0, envMapId: 0, envMapIntensity: 1, mapUvMatrix: null, alphaMapUvMatrix: null };
  for (const name of ['mapUvMatrix', 'alphaMapUvMatrix']) {
    const matrix = slots[name];
    if (matrix && matrix.length !== 9) {
      throw new Error('three.invalid: material uv matrix requires nine floats');
    }
  }
  const tail = v5Slots || { matcapId: 0, gradientMapId: 0, rotation: 0 };
  if (!Number.isFinite(tail.rotation)) throw new Error('three.invalid: material sprite rotation must be finite');
  const normal = v6Slots || { normalMapId: 0, normalScaleX: 1, normalScaleY: 1, bumpMapId: 0, bumpScale: 1, roughnessMapId: 0, metalnessMapId: 0 };
  if (!Number.isFinite(normal.normalScaleX) || !Number.isFinite(normal.normalScaleY)) throw new Error('three.invalid: material normalScale must be finite');
  if (!Number.isFinite(normal.bumpScale)) throw new Error('three.invalid: material bumpScale must be finite');
  if (post && kind !== 14) throw new Error('three.invalid: post tail requires a postprocessing material');
  const postTextureIds = post?.textureIds || [0, 0, 0];
  const postParams = post?.params || [];
  if (postTextureIds.length !== 3 || postParams.length > 16) throw new Error('three.invalid: post tail requires three textures and at most sixteen floats');
  const body = new ByteWriter(192 + (kind === 14 ? 80 : 0) + (specular ? 16 : 0) + (emissive ? 16 : 0) + (stencil ? 32 : 0));
  body.u32(id);
  body.u32(version);
  body.u32(kind);
  body.u32(mapId);
  body.u32(flags);
  body.u32(side);
  body.f32(color.r);
  body.f32(color.g);
  body.f32(color.b);
  body.f32(opacity);
  body.f32(roughness);
  body.f32(metalness);
  body.f32(alphaTest);
  body.f32(pointSize);
  body.u32(clipId);
  body.u32(clipFlags);
  // v4 texture-slot tail: alpha/env map ids, envMapIntensity and the two
  // column-major 3x3 per-map UV transforms (three.js Matrix3.elements).
  body.u32(slots.alphaMapId);
  body.u32(slots.envMapId);
  body.f32(slots.envMapIntensity);
  for (let i = 0; i < 9; i++) body.f32(slots.mapUvMatrix ? slots.mapUvMatrix[i] : (i % 4 === 0 ? 1 : 0));
  for (let i = 0; i < 9; i++) body.f32(slots.alphaMapUvMatrix ? slots.alphaMapUvMatrix[i] : (i % 4 === 0 ? 1 : 0));
  // v5 tail: matcap + gradient-map texture ids and SpriteMaterial rotation.
  body.u32(tail.matcapId);
  body.u32(tail.gradientMapId);
  body.f32(tail.rotation);
  body.u32(0);
  // v6 tail: tangentless normal-map texture id and the XY normal scale,
  // then the derivative bump-map texture id and its height scale.
  body.u32(normal.normalMapId);
  body.f32(normal.normalScaleX);
  body.f32(normal.normalScaleY);
  body.u32(normal.bumpMapId);
  body.f32(normal.bumpScale);
  // v6 PBR factor maps: roughness (G) and metalness (B) multipliers.
  body.u32(normal.roughnessMapId);
  body.u32(normal.metalnessMapId);
  if (specular) {
    body.f32(specular.r);
    body.f32(specular.g);
    body.f32(specular.b);
    body.f32(shininess);
  }
  if (emissive) {
    body.f32(emissive.r);
    body.f32(emissive.g);
    body.f32(emissive.b);
    body.f32(emissiveIntensity);
  }
  if (kind === 14) {
    // v9 post tail: blurTexture3..5 ids plus post params 18..33. Keeping it
    // BEFORE the Dubois suffix preserves the existing matrix-tail offsets.
    for (const textureId of postTextureIds) body.u32(checkedU32(textureId, 'post.textureId'));
    body.u32(0);
    for (let i = 0; i < 16; i++) {
      const value = postParams[i] === undefined ? 0 : postParams[i];
      if (!Number.isFinite(value)) throw new Error('three.invalid: post params must be finite');
      body.f32(value);
    }
  }
  body.u32(dubois ? checkedU32(dubois.rightId, 'anaglyph.rightId') : 0);
  body.u32(0); body.u32(0); body.u32(0);
  writeDuboisMatrix(body, dubois?.left);
  writeDuboisMatrix(body, dubois?.right);
  if (stencil) {
    // v8 stencil tail — always the LAST 32 bytes of the body (see the v8
    // block above). Presence is announced by MATERIAL_FLAG_STENCIL in flags.
    if (!(flags & MATERIAL_FLAG_STENCIL)) {
      throw new Error('three.invalid: stencil tail requires MATERIAL_FLAG_STENCIL in flags');
    }
    body.u32(stencil.stencilWrite ? 1 : 0);
    body.u32(stencilEnum(STENCIL_FUNC, stencil.stencilFunc, 'stencilFunc'));
    body.u32(checkedU32(stencil.stencilRef, 'material stencilRef'));
    body.u32(checkedU32(stencil.stencilFuncMask, 'material stencilFuncMask'));
    body.u32(checkedU32(stencil.stencilWriteMask, 'material stencilWriteMask'));
    body.u32(stencilEnum(STENCIL_OP, stencil.stencilFailOp, 'stencilFail'));
    body.u32(stencilEnum(STENCIL_OP, stencil.stencilZFailOp, 'stencilZFail'));
    body.u32(stencilEnum(STENCIL_OP, stencil.stencilZPassOp, 'stencilZPass'));
  }
  return command(OPCODE.MATERIAL, body.finish());
}

function writeDuboisMatrix(body, matrix) {
  if (matrix && matrix.length !== 9) throw new Error('three.invalid: Dubois matrix requires nine floats');
  for (let column = 0; column < 3; column++) {
    for (let row = 0; row < 3; row++) {
      const value = matrix ? matrix[column * 3 + row] : 0;
      if (!Number.isFinite(value)) throw new Error('three.invalid: Dubois matrix must be finite');
      body.f32(value);
    }
    body.f32(0);
  }
}

export function nodeCommand(id, parentId, geometryId, materialId, visible, objectKind, matrixWorld, shadows = {}, spriteCenter = null, renderOrder = 0) {
  const center = spriteCenter || { x: 0.5, y: 0.5 };
  const body = new ByteWriter(108);
  body.u32(id);
  body.u32(parentId);
  body.u32(geometryId);
  body.u32(materialId);
  body.u32(visible ? 1 : 0);
  body.u32(objectKind);
  body.floats(matrixWorld.elements || matrixWorld);
  body.u32((shadows.cast ? NODE_SHADOW_FLAGS.cast : 0) |
    (shadows.receive ? NODE_SHADOW_FLAGS.receive : 0));
  // v5 tail: upstream Sprite.center (R1 sprites billboard around it).
  body.f32(center.x);
  body.f32(center.y);
  // v7 tail: upstream Object3D.renderOrder, reusing the v5 reserved word.
  if (!Number.isFinite(renderOrder)) throw new Error('three.invalid: node renderOrder must be finite');
  body.f32(renderOrder);
  return command(OPCODE.NODE, body.finish());
}

export function removeNodeCommand(id) {
  const body = new ByteWriter(4);
  body.u32(id);
  return command(OPCODE.REMOVE_NODE, body.finish());
}

export function drawBatchCommand(id, version, instanceCount, flags, parts, matrices = null, colors = null) {
  checkedU32(id, 'batch nodeId');
  checkedU32(version, 'batch version');
  checkedU32(instanceCount, 'batch instanceCount');
  if (flags < 0 || flags > 3) throw new Error('three.invalid: batch flags');
  if ((flags & 2) !== 0 && (flags & 1) === 0) throw new Error('three.invalid: instance colors require instanced batches');
  if (flags === 0 && instanceCount !== 1) throw new Error('three.invalid: non-instanced batch instanceCount must be one');
  if (!Array.isArray(parts)) throw new Error('three.invalid: batch parts');
  checkedU32(parts.length, 'batch partCount');
  const matrixLength = flags === 1 || flags === 3 ? instanceCount * 16 : 0;
  if (matrixLength > 0 && (!matrices || matrices.length < matrixLength)) throw new Error('three.invalid: batch instance matrix payload');
  const colorLength = flags === 3 ? instanceCount * 3 : 0;
  if (colorLength > 0) {
    if (!colors || colors.length < colorLength) throw new Error('three.invalid: batch instance color payload');
    for (let i = 0; i < colorLength; i++) {
      if (!Number.isFinite(colors[i])) throw new Error('three.invalid: batch instance colors must be finite');
    }
  }
  const bodyLength = 20 + parts.length * 16 + matrixLength * 4 + colorLength * 4;
  if (bodyLength > MAX_ENVELOPE) throw new Error('three.invalid: batch exceeds 64 MiB');
  const body = new ByteWriter(bodyLength);
  body.u32(id);
  body.u32(version);
  body.u32(instanceCount);
  body.u32(flags);
  body.u32(parts.length);
  for (const part of parts) {
    body.u32(part.geometryId);
    body.u32(part.materialId);
    body.u32(part.offset);
    body.u32(part.count);
  }
  if (ArrayBuffer.isView(matrices)) {
    // Interleaved perf: the finiteness gate rides the encode pass as one
    // inline NaN/±Inf scan (sourceFiniteStrict shape, zero function calls)
    // instead of one requireFinite call per float — 80k calls per
    // instanceMatrix version bump on 5000-instance scenes. Rejection
    // semantics are identical: same check, same message, and the command is
    // still never pushed when any component is non-finite.
    for (let i = 0; i < matrixLength; i++) {
      const value = matrices[i];
      if (value !== value || value === Infinity || value === -Infinity) {
        throw new Error('three.invalid: instanceMatrix must be finite');
      }
    }
    body.bytes(new Uint8Array(matrices.buffer, matrices.byteOffset, matrixLength * 4));
  } else {
    for (let i = 0; i < matrixLength; i++) body.f32(matrices[i]);
  }
  if (ArrayBuffer.isView(colors)) {
    body.bytes(new Uint8Array(colors.buffer, colors.byteOffset, colorLength * 4));
  } else {
    for (let i = 0; i < colorLength; i++) body.f32(colors[i]);
  }
  return command(OPCODE.DRAW_BATCH, body.finish());
}

export function removeBatchCommand(id) {
  const body = new ByteWriter(4);
  body.u32(id);
  return command(OPCODE.REMOVE_BATCH, body.finish());
}

export function cameraCommand(id, type, matrixWorldInverse, projectionMatrix, matrixWorld) {
  const body = new ByteWriter(200);
  body.u32(id);
  body.u32(type);
  body.floats(matrixWorldInverse.elements || matrixWorldInverse);
  body.floats(projectionMatrix.elements || projectionMatrix);
  body.floats(matrixWorld.elements || matrixWorld);
  return command(OPCODE.CAMERA, body.finish());
}

export function lightCommand(id, type, color, intensity, position, direction, groundColor = null, spot = null) {
  if ((type === 3) !== (groundColor !== null)) throw new Error('three.invalid: HemisphereLight requires exactly one ground color payload');
  if ((type === 4) !== (spot !== null)) throw new Error('three.invalid: SpotLight requires exactly one spot payload');
  const body = new ByteWriter(64);
  body.u32(id);
  body.u32(type);
  body.f32(color.r);
  body.f32(color.g);
  body.f32(color.b);
  body.f32(intensity);
  body.f32(position.x);
  body.f32(position.y);
  body.f32(position.z);
  body.f32(direction.x);
  body.f32(direction.y);
  body.f32(direction.z);
  if (groundColor) {
    body.f32(groundColor.r);
    body.f32(groundColor.g);
    body.f32(groundColor.b);
    body.u32(0);
  }
  if (spot) {
    if (!Number.isFinite(spot.angle) || spot.angle <= 0 || spot.angle > Math.PI / 2) {
      throw new Error('three.invalid: SpotLight angle must be within (0, PI/2]');
    }
    if (!Number.isFinite(spot.penumbra) || spot.penumbra < 0 || spot.penumbra > 8) {
      // Upstream does not clamp penumbra; official examples tween it above 1
      // (webgl_lights_spotlights: `penumbra: Math.random() + 1`).
      throw new Error('three.invalid: SpotLight penumbra must be within [0, 8]');
    }
    if (!Number.isFinite(spot.distance) || spot.distance < 0 ||
        !Number.isFinite(spot.decay) || spot.decay < 0) {
      throw new Error('three.invalid: SpotLight distance/decay must be finite and non-negative');
    }
    body.f32(spot.angle);
    body.f32(spot.penumbra);
    body.f32(spot.distance);
    body.f32(spot.decay);
  }
  return command(OPCODE.LIGHT, body.finish());
}

export function clippingCommand(id, version, planes) {
  checkedU32(id, 'clipping id');
  checkedU32(version, 'clipping version');
  if (!Array.isArray(planes) || planes.length === 0 || planes.length > 16) {
    throw new Error('three.invalid: clipping plane count must be within 1..16');
  }
  for (const plane of planes) {
    if (!plane || !Number.isFinite(plane.normalX) || !Number.isFinite(plane.normalY) ||
        !Number.isFinite(plane.normalZ) || !Number.isFinite(plane.constant)) {
      throw new Error('three.invalid: clipping plane components must be finite');
    }
    const lengthSquared = plane.normalX * plane.normalX + plane.normalY * plane.normalY + plane.normalZ * plane.normalZ;
    if (lengthSquared <= 0) throw new Error('three.invalid: clipping plane normal must be nonzero');
  }
  const body = new ByteWriter(16 + planes.length * 16);
  body.u32(id);
  body.u32(version);
  body.u32(planes.length);
  for (const plane of planes) {
    body.f32(plane.normalX);
    body.f32(plane.normalY);
    body.f32(plane.normalZ);
    body.f32(plane.constant);
  }
  return command(OPCODE.CLIPPING, body.finish());
}

export function frameCommand(sceneId, cameraId, background, exposure, fog, shadow = NO_SHADOW, culledNodeIds = [], culledShadowNodeIds = [], shadowLightType = 0, toneMapping = 0, pointShadow = null, frameTarget = null) {
  const hasContentRevision = shadow.contentRevision !== undefined;
  const hasFrameTarget = frameTarget !== null;
  const hasOptionalIds = culledNodeIds.length || culledShadowNodeIds.length || hasContentRevision || hasFrameTarget;
  const optionalLength = (hasOptionalIds ? 4 + culledNodeIds.length * 4 : 0) +
    (culledShadowNodeIds.length || hasContentRevision || hasFrameTarget ? 4 + culledShadowNodeIds.length * 4 : 0) +
    (hasContentRevision ? 4 : 0);
  // v3: fixed trailing u32 naming which light owns the shadow map
  // (0 none, 1 directional, 2 spot, 3 point) so shading can scope it.
  // v4: tone mapping mode (three.js constants, u32) plus FogExp2 density
  // (f32, zero unless fog.mode === 2) right after the fog near/far block.
  // v5: point-shadow block naming the shadow-casting point light position
  // and the dual-paraboloid far plane (flag u32, reserved u32, xyz, far).
  const point = pointShadow || { active: 0, x: 0, y: 0, z: 0, far: 0 };
  const body = new ByteWriter(172 + optionalLength);
  body.u32(sceneId);
  body.u32(cameraId);
  body.f32(background.r);
  body.f32(background.g);
  body.f32(background.b);
  body.f32(background.a);
  body.f32(exposure);
  body.u32(fog.mode);
  body.f32(fog.color.r);
  body.f32(fog.color.g);
  body.f32(fog.color.b);
  body.f32(fog.near);
  body.f32(fog.far);
  body.u32(toneMapping);
  body.f32(fog.mode === 2 ? fog.density : 0);
  body.u32(point.active);
  body.u32(0);
  body.f32(point.active ? point.x : 0);
  body.f32(point.active ? point.y : 0);
  body.f32(point.active ? point.z : 0);
  body.f32(point.active ? point.far : 0);
  body.u32(shadow.width);
  body.u32(shadow.height);
  body.f32(shadow.bias);
  body.f32(shadow.normalBias);
  body.f32(shadow.radius);
  body.floats(shadow.matrix.elements || shadow.matrix);
  body.u32(shadowLightType);
  if (hasOptionalIds) {
    body.u32(culledNodeIds.length);
    for (const id of culledNodeIds) body.u32(id);
  }
  if (culledShadowNodeIds.length || hasContentRevision || hasFrameTarget) {
    body.u32(culledShadowNodeIds.length);
    for (const id of culledShadowNodeIds) body.u32(id);
  }
  if (hasContentRevision) body.u32(shadow.contentRevision);
  else if (hasFrameTarget) body.u32(0);
  if (hasFrameTarget) writeFrameTarget(body, frameTarget);
  return command(OPCODE.FRAME, body.finish());
}

function writeFrameTarget(body, target) {
  body.u32(0x4658534a); // JSXF
  body.u32(1);
  body.u32(checkedU32(target.targetId, 'frame.targetId'));
  body.u32(checkedU32(target.width, 'frame.targetWidth'));
  body.u32(checkedU32(target.height, 'frame.targetHeight'));
  for (const value of [target.viewport.x, target.viewport.y, target.viewport.z, target.viewport.w,
    target.scissor.x, target.scissor.y, target.scissor.z, target.scissor.w]) {
    if (!Number.isFinite(value)) throw new Error('three.invalid: frame rectangle must be finite');
    body.f32(value);
  }
  body.u32(checkedU32(target.flags, 'frame.flags'));
  body.u32(0);
}

export function disposeResourceCommand(id, kind) {
  const body = new ByteWriter(8);
  body.u32(id);
  body.u32(kind);
  return command(OPCODE.DISPOSE_RESOURCE, body.finish());
}

export function disposeSurfaceCommand() { return command(OPCODE.DISPOSE_SURFACE); }
