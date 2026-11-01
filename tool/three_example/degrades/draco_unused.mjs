// The bounded 3D Tiles proxy never enters a Draco payload. Preserve the
// official loader/plugin configuration without starting browser Worker lanes.
export const DRACO_GLTF_CONFIG = {};
export class DRACOLoader {
  setDecoderPath() { return this; }
  setDecoderConfig() { return this; }
  setWorkerLimit() { return this; }
  dispose() { return this; }
}
