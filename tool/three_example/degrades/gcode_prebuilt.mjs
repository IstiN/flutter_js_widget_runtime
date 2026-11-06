// QuickJS never finishes the stock GCodeLoader boot: benchy.gcode crosses as
// a 2.6MB base64 string and the per-line token walk + JS number-array pushes
// keep the widget off its first frame for minutes (screenshot harness exit
// 143 after a 3+ minute wait). The parse output is boot-invariant, so
// generate_gcode_scenes.mjs runs the pinned r186 GCodeLoader offline and
// serializes the Group (two LineSegments: extruding green / path red) into a
// header + Float32 blob per asset. This module consumes that blob:
//
// - GCodeLoader rebuilds Group/LineSegments/LineBasicMaterial from typed-array
//   VIEWS (zero per-vertex work in QuickJS) with the exact colors the offline
//   parse produced, and keeps the loader shape the official module calls
//   (setPath + load(url, onLoad)).
// - 'models/gcode/<asset>.gcode' URLs redirect to the sibling
//   '<asset>_scene.bin' prebuilt asset pinned in the webgl_loader_gcode entry
//   (prepare.mjs `generated:` bytes — not r186 sources).
//
// model.rotation (the loader bakes -PI/2 X rotation) and the Group name are
// preserved, so the official module's position table and controls.reset()
// traverse run unchanged on top of the rebuilt group.
import {
  BufferAttribute, BufferGeometry, Color, Group, LineBasicMaterial, LineSegments
} from 'three';

const MAGIC_JGCB = 0x4243474a; // 'JGCB' little-endian

function floatView(bytes, byteOffset, count) {
  const start = bytes.byteOffset + byteOffset;
  if (start % 4 === 0 && start + count * 12 <= bytes.buffer.byteLength) {
    return new Float32Array(bytes.buffer, start, count * 3);
  }
  // Unaligned host buffers fall back to one aligned copy.
  return new Float32Array(bytes.slice(byteOffset, byteOffset + count * 12));
}

function buildGroup(buffer) {
  const view = new DataView(buffer);
  if (buffer.byteLength < 12 || view.getUint32(0, true) !== MAGIC_JGCB) {
    throw new Error('three: prebuilt GCode scene header mismatch (expected JGCB v1)');
  }
  const version = view.getUint32(4, true);
  if (version !== 1) throw new Error(`three: unsupported prebuilt GCode scene version ${version}`);
  const objectCount = view.getUint32(8, true);
  const bytes = new Uint8Array(buffer);
  const group = new Group();
  group.name = 'gcode';
  let offset = 12;
  for (let index = 0; index < objectCount; index++) {
    const nameLength = view.getUint32(offset, true); offset += 4;
    let name = '';
    for (let char = 0; char < nameLength; char++) name += String.fromCharCode(bytes[offset + char]);
    offset += nameLength;
    const colorHex = view.getUint32(offset, true); offset += 4;
    const vertexCount = view.getUint32(offset, true); offset += 4;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(floatView(bytes, offset, vertexCount), 3));
    offset += vertexCount * 12;
    geometry.computeBoundingSphere();
    const material = new LineBasicMaterial({ color: new Color(colorHex) });
    const segments = new LineSegments(geometry, material);
    segments.name = name;
    group.add(segments);
  }
  // Marker the official module's traverse reads (kept from the loader shape).
  group.userData.jsrPrebuilt = true;
  // The pinned r186 parse bakes this rotation into the returned Group.
  group.rotation.set(-Math.PI / 2, 0, 0);
  return group;
}

export class GCodeLoader {

  setPath() { return this; }

  setRequestHeader() { return this; }

  load(url, onLoad, onProgress, onError) {
    const binUrl = String(url).replace(/\.gcode(?:\?.*)?(?:#.*)?$/, '_scene.bin');
    if (binUrl === String(url)) {
      const error = new Error(`three: prebuilt GCode lane only accepts .gcode URLs, got ${url}`);
      if (onError) onError(error); else console.error(error);
      return;
    }
    console.time('jsr.gcode.prebuilt');
    fetch(binUrl).then(async response => {
      if (response.status !== 200 && response.status !== 0) {
        throw new Error(`three: prebuilt GCode scene fetch failed for ${binUrl} (${response.status})`);
      }
      const buffer = await response.arrayBuffer();
      if (onProgress) onProgress({ lengthComputable: true, loaded: buffer.byteLength, total: buffer.byteLength });
      const group = buildGroup(buffer);
      console.timeEnd('jsr.gcode.prebuilt');
      onLoad(group);
    }).catch(error => {
      if (onError) onError(error); else console.error(error);
    });
  }

  parse() {
    throw new Error('three: GCodeLoader in the prebuilt lane loads offline-generated scene bins; raw .gcode parse is unavailable');
  }

}
