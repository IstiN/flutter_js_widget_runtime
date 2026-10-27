export class ThreeCapabilityError extends Error {
  constructor(feature, detail, backend = '1B') {
    super(`three.unsupported: ${feature}${detail ? ` (${detail})` : ''}${backend === '1B' ? '; native R1 does not provide this capability; use the 1B backend where available' : ''}`);
    this.name = 'ThreeCapabilityError';
    this.code = 'three.unsupported';
    this.feature = feature;
    this.backend = backend;
  }
}

export function unsupported(feature, detail, backend) {
  throw new ThreeCapabilityError(feature, detail, backend);
}

export class UnsupportedWebGPURenderer {
  constructor() { unsupported('WebGPU', 'WebGPU/TSL compute is outside both the R1 and WebGL2 bundles', 'none'); }
}

export function assetFailure(url, detail) {
  const error = new Error(`three.assetFailure: ${url}${detail ? `: ${detail}` : ''}`);
  error.name = 'ThreeAssetError';
  error.code = 'three.assetFailure';
  error.url = url;
  return error;
}

export function requireFinite(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`three.invalid: ${name} must be finite`);
  }
  return value;
}

export function checkedU32(value, name) {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new Error(`three.invalid: ${name} is outside u32`);
  }
  return value >>> 0;
}
