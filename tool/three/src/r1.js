import { checkedU32 } from './errors.js';
import { utf8 } from './runtime.js';

export const T1_VERSION = 1;
export const R1_VERSION = 1;
export const STREAM_R1 = 1;
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
  REMOVE_BATCH: 12
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
  const payload = new ByteWriter(12 + commands.length * 16);
  payload.bytes(new Uint8Array([0x4a, 0x53, 0x52, 0x31]));
  payload.u16(R1_VERSION);
  payload.u16(0);
  payload.u32(commands.length);
  for (const item of commands) {
    if (!item || !Number.isInteger(item.opcode) || item.opcode < 1 || item.opcode > 255) throw new Error('three.invalid: R1 opcode');
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
  const body = new ByteWriter(28 + indexCount * 4 + wireBytes + 64);
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
  if (indices) for (let i = 0; i < indices.length; i++) body.u32(indices[i]);
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

export function materialCommand(id, version, kind, mapId, flags, side, color, opacity, roughness, metalness, alphaTest, pointSize, specular = null, shininess = 0) {
  if ((kind === 5) !== (specular !== null)) throw new Error('three.invalid: Phong material requires exactly one specular payload');
  const body = new ByteWriter(specular ? 72 : 56);
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
  if (specular) {
    body.f32(specular.r);
    body.f32(specular.g);
    body.f32(specular.b);
    body.f32(shininess);
  }
  return command(OPCODE.MATERIAL, body.finish());
}

export function nodeCommand(id, parentId, geometryId, materialId, visible, objectKind, matrixWorld, shadows = {}) {
  const body = new ByteWriter(92);
  body.u32(id);
  body.u32(parentId);
  body.u32(geometryId);
  body.u32(materialId);
  body.u32(visible ? 1 : 0);
  body.u32(objectKind);
  body.floats(matrixWorld.elements || matrixWorld);
  body.u32((shadows.cast ? NODE_SHADOW_FLAGS.cast : 0) |
    (shadows.receive ? NODE_SHADOW_FLAGS.receive : 0));
  return command(OPCODE.NODE, body.finish());
}

export function removeNodeCommand(id) {
  const body = new ByteWriter(4);
  body.u32(id);
  return command(OPCODE.REMOVE_NODE, body.finish());
}

export function drawBatchCommand(id, version, instanceCount, flags, parts, matrices = null) {
  checkedU32(id, 'batch nodeId');
  checkedU32(version, 'batch version');
  checkedU32(instanceCount, 'batch instanceCount');
  if (flags !== 0 && flags !== 1) throw new Error('three.invalid: batch flags');
  if (flags === 0 && instanceCount !== 1) throw new Error('three.invalid: non-instanced batch instanceCount must be one');
  if (!Array.isArray(parts)) throw new Error('three.invalid: batch parts');
  checkedU32(parts.length, 'batch partCount');
  const matrixLength = flags === 1 ? instanceCount * 16 : 0;
  if (matrixLength > 0 && (!matrices || matrices.length < matrixLength)) throw new Error('three.invalid: batch instance matrix payload');
  const bodyLength = 20 + parts.length * 16 + matrixLength * 4;
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
    body.bytes(new Uint8Array(matrices.buffer, matrices.byteOffset, matrixLength * 4));
  } else {
    for (let i = 0; i < matrixLength; i++) body.f32(matrices[i]);
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

export function lightCommand(id, type, color, intensity, position, direction) {
  const body = new ByteWriter(48);
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
  return command(OPCODE.LIGHT, body.finish());
}

export function frameCommand(sceneId, cameraId, background, exposure, fog, shadow = NO_SHADOW, culledNodeIds = [], culledShadowNodeIds = []) {
  const hasContentRevision = shadow.contentRevision !== undefined;
  const hasOptionalIds = culledNodeIds.length || culledShadowNodeIds.length || hasContentRevision;
  const optionalLength = (hasOptionalIds ? 4 + culledNodeIds.length * 4 : 0) +
    (culledShadowNodeIds.length || hasContentRevision ? 4 + culledShadowNodeIds.length * 4 : 0) +
    (hasContentRevision ? 4 : 0);
  const body = new ByteWriter(136 + optionalLength);
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
  body.u32(shadow.width);
  body.u32(shadow.height);
  body.f32(shadow.bias);
  body.f32(shadow.normalBias);
  body.f32(shadow.radius);
  body.floats(shadow.matrix.elements || shadow.matrix);
  if (hasOptionalIds) {
    body.u32(culledNodeIds.length);
    for (const id of culledNodeIds) body.u32(id);
  }
  if (culledShadowNodeIds.length || hasContentRevision) {
    body.u32(culledShadowNodeIds.length);
    for (const id of culledShadowNodeIds) body.u32(id);
  }
  if (hasContentRevision) body.u32(shadow.contentRevision);
  return command(OPCODE.FRAME, body.finish());
}

export function disposeResourceCommand(id, kind) {
  const body = new ByteWriter(8);
  body.u32(id);
  body.u32(kind);
  return command(OPCODE.DISPOSE_RESOURCE, body.finish());
}

export function disposeSurfaceCommand() { return command(OPCODE.DISPOSE_SURFACE); }
