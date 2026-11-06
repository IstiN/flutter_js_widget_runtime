import { BoxGeometry, Matrix4 } from 'three';

console.warn('three: web-ifc WASM decoding is unavailable in QuickJS; the IFC example renders a bounded native proxy building while preserving its camera, lights and merge path.');

// The proxy below never reads the model bytes: OpenModel/StreamAllMeshes
// ignore their payloads. The pinned 42.8 MB rac_advanced_sample_project.ifc
// still ships next to the widget (byte-verified at prepare time) so the
// asset stays available to a real decoder, but serving it through the
// runtime host lane would spend seconds copying+base64-decoding bytes that
// nothing consumes. Intercept exactly that URL and serve an empty 200 body
// instead; the official module keeps its fetch/await shape unchanged.
const IFC_PROXY_STUB_URL = 'models/ifc/rac_advanced_sample_project.ifc';
const proxyHostFetch = globalThis.fetch;
globalThis.fetch = input => {
  const requested = typeof input === 'string' ? input : input && input.url;
  const clean = String(requested || '').replace(/^\.\//, '').replace(/[?#].*$/, '');
  if (clean !== IFC_PROXY_STUB_URL) return proxyHostFetch(input);
  console.warn('three: IFC proxy serves an empty body for the pinned rac_advanced_sample_project.ifc — the degrade consumes no model bytes.');
  return Promise.resolve(new Response(new Uint8Array(0), { status: 200, url: IFC_PROXY_STUB_URL }));
};

export class IfcAPI {
  SetWasmPath() {}
  async Init() { return this; }
  OpenModel() { return 1; }
  CloseModel() {}
  StreamAllMeshes(_model, callback) {
    const geometry = new BoxGeometry(24, 12, 18).toNonIndexed();
    this._source = geometry;
    const positions = geometry.getAttribute('position');
    const normals = geometry.getAttribute('normal');
    const vertices = new Float32Array(positions.count * 6);
    for (let i = 0; i < positions.count; i++) {
      vertices[i * 6] = positions.getX(i);
      vertices[i * 6 + 1] = positions.getY(i);
      vertices[i * 6 + 2] = positions.getZ(i);
      vertices[i * 6 + 3] = normals.getX(i);
      vertices[i * 6 + 4] = normals.getY(i);
      vertices[i * 6 + 5] = normals.getZ(i);
    }
    const indices = new Uint32Array(positions.count);
    for (let i = 0; i < indices.length; i++) indices[i] = i;
    const placed = {
      geometryExpressID: 1,
      color: { x: 0.72, y: 0.78, z: 0.86, w: 1 },
      flatTransformation: new Matrix4().makeTranslation(30, 6, 0).elements.slice()
    };
    callback({ geometries: { size: () => 1, get: () => placed } });
  }
  GetGeometry() {
    return {
      GetVertexData: () => this._source.getAttribute('position').array,
      GetVertexDataSize: () => this._source.getAttribute('position').array.length,
      GetIndexData: () => this._indices,
      GetIndexDataSize: () => this._indices.length,
      delete() {}
    };
  }
  GetVertexArray(pointer) {
    if (!this._vertices) {
      const source = this._source;
      const p = source.getAttribute('position');
      const n = source.getAttribute('normal');
      this._vertices = new Float32Array(p.count * 6);
      for (let i = 0; i < p.count; i++) {
        this._vertices.set([p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)], i * 6);
      }
      this._indices = new Uint32Array(p.count);
      for (let i = 0; i < p.count; i++) this._indices[i] = i;
    }
    return this._vertices;
  }
  GetIndexArray() { return this._indices; }
}
