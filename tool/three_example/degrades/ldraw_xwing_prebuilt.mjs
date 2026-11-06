// QuickJS spends ~22s parsing + building the packed X-wing MPD and another
// ~2s merging it (webgl_renderer_pathtracer never presented until the whole
// cascade finished). Both results are boot-invariant, so
// generate_ldraw_xwing_scene.mjs runs the pinned r186 LDrawLoader +
// LDrawUtils.mergeObject offline and serializes the merged meshes (19
// materials, ~806k vertices; LineSegments skipped — the official module hides
// them) into a header + Float32 blob. This module consumes that blob:
//
// - LDrawLoader rebuilds Group/Mesh/MeshStandardMaterial from typed-array
//   VIEWS (zero per-vertex work in QuickJS) with the exact material table the
//   offline merge produced, so the official module's rotation and
//   transmission traverse run unchanged on top of it.
// - LDrawUtils.mergeObject passes the already-merged group through (a real
//   re-merge would clone + applyMatrix4 over every vertex again).
//
// The environment JPEG path is untouched; UltraHDRLoader keeps its SDR shim.
import {
  BufferAttribute, BufferGeometry, Color, Group, Mesh, MeshStandardMaterial
} from 'three';

// models/ldraw/officialLibrary/ldraw_xwing_scene.bin, pinned as a generated
// widget asset (see the webgl_renderer_pathtracer entry in prepare.mjs).
const SCENE_URL = 'models/ldraw/officialLibrary/ldraw_xwing_scene.bin';
const MAGIC_JLXS = 0x53584c4a;

function floatView(bytes, byteOffset, count) {
  const start = bytes.byteOffset + byteOffset;
  if (start % 4 === 0 && start + count * 12 <= bytes.buffer.byteLength) {
    return new Float32Array(bytes.buffer, start, count * 3);
  }
  // Unaligned host buffers fall back to one aligned copy.
  return new Float32Array(bytes.slice(byteOffset, byteOffset + count * 12));
}

function decodeName(bytes, start, length) {
  let name = '';
  for (let index = 0; index < length; index++) name += String.fromCharCode(bytes[start + index]);
  return name;
}

function buildGroup(buffer) {
  const view = new DataView(buffer);
  if (buffer.byteLength < 12 || view.getUint32(0, true) !== MAGIC_JLXS) {
    throw new Error('three: prebuilt LDraw scene header mismatch (expected JLXS v1)');
  }
  const version = view.getUint32(4, true);
  if (version !== 1) throw new Error(`three: unsupported prebuilt LDraw scene version ${version}`);
  const meshCount = view.getUint32(8, true);
  const bytes = new Uint8Array(buffer);
  const group = new Group();
  let offset = 12;
  for (let index = 0; index < meshCount; index++) {
    const nameLength = view.getUint32(offset, true); offset += 4;
    const name = decodeName(bytes, offset, nameLength); offset += nameLength;
    const colorHex = view.getUint32(offset, true); offset += 4;
    const emissiveR = view.getFloat32(offset, true); offset += 4;
    const emissiveG = view.getFloat32(offset, true); offset += 4;
    const emissiveB = view.getFloat32(offset, true); offset += 4;
    const roughness = view.getFloat32(offset, true); offset += 4;
    const metalness = view.getFloat32(offset, true); offset += 4;
    const opacity = view.getFloat32(offset, true); offset += 4;
    const transparent = view.getUint8(offset) === 1; offset += 1;
    const geometry = new BufferGeometry();
    const material = new MeshStandardMaterial({
      name,
      color: new Color(colorHex),
      roughness,
      metalness,
      opacity,
      transparent,
      depthWrite: !transparent
    });
    material.emissive.setRGB(emissiveR, emissiveG, emissiveB);
    material.polygonOffset = true;
    material.polygonOffsetFactor = 1;
    for (const attributeName of ['position', 'normal', 'color', 'uv']) {
      const count = view.getUint32(offset, true); offset += 4;
      const absoluteOffset = view.getUint32(offset, true); offset += 4;
      if (!count) continue;
      geometry.setAttribute(attributeName, new BufferAttribute(floatView(bytes, absoluteOffset, count), 3));
    }
    if (!geometry.getAttribute('position')) throw new Error('three: prebuilt LDraw mesh has no positions');
    geometry.computeBoundingSphere();
    group.add(new Mesh(geometry, material));
  }
  // Markers the official module reads or this lane guards on:
  // mergeObject passes jsrPrebuilt groups through; constructionStep /
  // numConstructionSteps keep the LDrawLoader shape.
  group.userData.jsrPrebuilt = true;
  group.userData.constructionStep = 0;
  group.userData.numConstructionSteps = 1;
  return group;
}

export class LDrawLoader {

  setConditionalLineMaterial() {
    // The prebuilt scene contains no line segments, so the conditional line
    // material type is accepted but never instantiated.
    return this;
  }

  setPath() { return this; }

  load(url, onLoad, onProgress, onError) {
    this.loadAsync(url, onProgress).then(onLoad, error => {
      if (onError) onError(error);
      else throw error;
    });
  }

  loadAsync(_url, onProgress) {
    console.time('jsr.ldraw.prebuilt');
    return fetch(SCENE_URL).then(response => {
      if (response.status !== 200 && response.status !== 0) {
        throw new Error(`three: prebuilt LDraw scene fetch failed (${response.status})`);
      }
      return response.arrayBuffer();
    }).then(buffer => {
      if (onProgress) onProgress({ lengthComputable: true, loaded: buffer.byteLength, total: buffer.byteLength });
      const group = buildGroup(buffer);
      console.timeEnd('jsr.ldraw.prebuilt');
      return group;
    });
  }

}

export class LDrawUtils {

  static mergeObject(object) {
    if (!object || !object.userData || object.userData.jsrPrebuilt !== true) {
      throw new Error('three: LDrawUtils.mergeObject in the prebuilt lane only accepts the offline-merged X-wing scene');
    }
    return object;
  }

}
