import {
  BufferAttribute, BufferGeometry, FileLoader, Group, LineBasicMaterial,
  InstancedMesh, LineSegments, Loader, Mesh, MeshStandardMaterial, Uint32BufferAttribute
} from 'three';

const sceneCache = new Map();
const fileCache = new Map();
let warned = false;
let mergeWarned = false;

function decodeAttribute(bytes, view, record, url) {
  const length = record.count * record.itemSize;
  const width = record.encoding === 'float32' || record.encoding === 'int16' ? (record.encoding === 'float32' ? 4 : 2) : 1;
  if (!Number.isInteger(length) || length < 0 || record.offset + length * width > bytes.length) {
    throw new Error(`${url}: invalid quantized attribute`);
  }
  const output = new Float32Array(length);
  for (let index = 0; index < length; index++) {
    const offset = record.offset + index * width;
    if (record.encoding === 'int16') {
      const component = index % record.itemSize;
      output[index] = view.getInt16(offset, true) * record.scale[component] + record.center[component];
    } else if (record.encoding === 'int8') output[index] = view.getInt8(offset) / 127;
    else if (record.encoding === 'uint8') output[index] = view.getUint8(offset) / 255;
    else output[index] = view.getFloat32(offset, true);
  }
  return output;
}

function decode(buffer, url, smoothNormals) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  if (bytes.length < 12 || view.getUint32(0, true) !== 0x52444c4a) throw new Error(`${url}: invalid JLDR magic`);
  const headerLength = view.getUint32(4, true);
  if (headerLength > 16 * 1024 * 1024 || 8 + headerLength > bytes.length) throw new Error(`${url}: invalid JLDR header`);
  const header = JSON.parse(new TextDecoder().decode(bytes.subarray(8, 8 + headerLength)));
  if (header.magic !== 'JLDR' || header.version !== 2 || !header.nodes.length) throw new Error(`${url}: unsupported JLDR scene`);
  const materials = header.materials.map(record => {
    const material = record.kind === 'standard' ? new MeshStandardMaterial() : new LineBasicMaterial();
    material.name = record.name;
    material.color.setHex(record.color);
    if (material.isMeshStandardMaterial) {
      material.roughness = record.roughness;
      material.metalness = record.metalness;
    }
    material.opacity = record.opacity;
    material.transparent = record.transparent;
    material.depthWrite = record.depthWrite;
    material.side = record.side;
    material.vertexColors = record.vertexColors;
    material.polygonOffset = record.polygonOffset;
    material.polygonOffsetFactor = record.polygonOffsetFactor;
    material.polygonOffsetUnits = record.polygonOffsetUnits;
    return material;
  });
  const geometries = header.geometries.map(record => {
    const geometry = new BufferGeometry();
    for (const [name, attribute] of Object.entries(record.attributes)) {
      if (name === 'smoothNormal') continue;
      const selected = name === 'normal' && smoothNormals && record.attributes.smoothNormal
        ? record.attributes.smoothNormal : attribute;
      geometry.setAttribute(name, new BufferAttribute(decodeAttribute(bytes, view, selected, url), selected.itemSize));
    }
    if (record.index) {
      const { offset, count } = record.index;
      if (offset + count * 4 > bytes.length) throw new Error(`${url}: invalid index view`);
      const indices = new Uint32Array(count);
      for (let index = 0; index < count; index++) indices[index] = view.getUint32(offset + index * 4, true);
      geometry.setIndex(new Uint32BufferAttribute(indices, 1));
    }
    for (const group of record.groups) geometry.addGroup(group.start, group.count, group.materialIndex);
    return geometry;
  });
  const objects = header.nodes.map(record => {
    const object = record.kind === 'mesh' ? new Mesh() : record.kind === 'line' ? new LineSegments() : new Group();
    object.name = record.name;
    object.matrix.fromArray(record.matrix);
    object.matrix.decompose(object.position, object.quaternion, object.scale);
    if (record.buildingStep !== undefined) object.userData.buildingStep = record.buildingStep;
    if (record.geometry >= 0) object.geometry = geometries[record.geometry];
    if (record.materials.length === 1) object.material = materials[record.materials[0]];
    else if (record.materials.length) object.material = record.materials.map(id => materials[id]);
    object.isConditionalLine = record.conditional;
    return object;
  });
  header.nodes.forEach((record, index) => {
    if (record.parent >= 0) objects[record.parent].add(objects[index]);
  });
  const root = objects[0];
  root.userData.numBuildingSteps = header.numBuildingSteps;
  root.userData.prebuiltModel = header.model;
  root.userData.prebuiltSmoothNormals = smoothNormals;
  if (root.userData.buildingStep === undefined) root.userData.buildingStep = 0;
  if (!warned && header.nodes.some(node => node.conditional)) {
    warned = true;
    console.warn('[degrade] R1 renders LDraw conditional lines as bounded LineBasicMaterial lines; visibility switches and construction steps are preserved, view-dependent conditional shading is not.');
  }
  return root;
}

function mergeVisual(group) {
  group.updateMatrixWorld(true);
  const root = new Group();
  root.name = group.name;
  root.userData = { ...group.userData, numBuildingSteps: 1, buildingStep: 0, prebuiltMerged: true };
  const buckets = new Map();
  const place = (object, matrix) => {
    matrix.decompose(object.position, object.quaternion, object.scale);
    root.add(object);
  };
  group.traverse(object => {
    if (object === root || !object.geometry) return;
    if (object.isLineSegments) {
      const line = new LineSegments(object.geometry, object.material);
      line.isConditionalLine = object.isConditionalLine;
      place(line, object.matrixWorld.clone());
      return;
    }
    if (!object.isMesh) return;
    // Negative-determinant instances are unsupported by Three.js. Keep those
    // meshes and multi-material groups independent to preserve winding/groups.
    if (Array.isArray(object.material) || object.matrixWorld.determinant() < 0) {
      place(new Mesh(object.geometry, object.material), object.matrixWorld.clone());
      return;
    }
    const key = `${object.geometry.uuid}|${object.material.uuid}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(object);
  });
  for (const objects of buckets.values()) {
    const first = objects[0];
    if (objects.length === 1) {
      place(new Mesh(first.geometry, first.material), first.matrixWorld.clone());
      continue;
    }
    const mesh = new InstancedMesh(first.geometry, first.material, objects.length);
    objects.forEach((object, index) => mesh.setMatrixAt(index, object.matrixWorld));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    root.add(mesh);
  }
  if (!mergeWarned) {
    mergeWarned = true;
    console.warn('[degrade] LDraw merge collapses construction steps and instances compatible meshes; baked vertex concatenation is omitted to avoid duplicating the prepared corpus.');
  }
  return root;
}

export class LDrawLoader extends Loader {
  constructor(manager) {
    super(manager);
    this.smoothNormals = true;
  }

  setConditionalLineMaterial() { return this; }

  load(url, onLoad, onProgress, onError) {
    const resolved = (this.path || '') + url;
    const smooth = !!this.smoothNormals;
    const merge = !!this.prebuiltMerge;
    const cacheKey = `${resolved}|smooth=${smooth}|merge=${merge}`;
    const parts = url.split('/');
    const filename = parts.pop();
    const prepared = `${parts.join('/')}/${filename}.bin`;
    const fileKey = resolved;
    let filePending = fileCache.get(fileKey);
    if (!filePending) {
      const loader = new FileLoader(this.manager);
      loader.setPath(this.path).setRequestHeader(this.requestHeader).setResponseType('arraybuffer');
      filePending = new Promise((resolve, reject) => loader.load(prepared, resolve, onProgress, reject));
      fileCache.set(fileKey, filePending);
      filePending.catch(() => fileCache.delete(fileKey));
    }
    let pending = sceneCache.get(cacheKey);
    if (!pending) {
      pending = filePending.then(buffer => {
        const scene = decode(buffer, prepared, smooth);
        return merge ? mergeVisual(scene) : scene;
      });
      sceneCache.set(cacheKey, pending);
      pending.catch(() => sceneCache.delete(cacheKey));
    }
    pending.then(group => {
      const clone = group.clone(true);
      const sources = [];
      group.traverse(object => sources.push(object));
      let index = 0;
      // Object3D.copy does not preserve LDraw's custom conditional-line flag.
      clone.traverse(object => { object.isConditionalLine = sources[index++].isConditionalLine; });
      onLoad(clone);
    }, error => {
      if (onError) onError(error);
      else console.error(error);
    });
  }

  loadAsync(url, onProgress) {
    return new Promise((resolve, reject) => this.load(url, resolve, onProgress, reject));
  }
}
