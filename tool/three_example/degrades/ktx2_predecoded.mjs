// GLB Basis textures are transcoded at prepare. No runtime KTX2 transcoder or
// WebGL extension profile query is needed for these pinned assets.
export class KTX2Loader {
  detectSupport() { return this; }
  setWorkerLimit() { return this; }
  dispose() { return this; }
}
