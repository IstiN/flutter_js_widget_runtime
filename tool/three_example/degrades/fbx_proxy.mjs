// Parsing the multi-megabyte ASCII bunny plus 150 synthetic rays per frame is
// outside the bounded QuickJS lane. Use the same Stanford Bunny, indexed and
// serialized offline by generate_fbx_bunny_geometry.mjs. In particular, retain
// the source FBX coordinate scale: the official module applies 0.0075 to it.
import {
  BufferAttribute, BufferGeometry, Float32BufferAttribute,
  Group, Mesh, MeshStandardMaterial
} from 'three';
import { bunnyIndices, bunnyNormals, bunnyPositions } from './fbx_bunny_geometry.mjs';

export class FBXLoader {
  load(_url, onLoad) {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(bunnyPositions, 3));
    geometry.setAttribute('normal', new Float32BufferAttribute(bunnyNormals, 3));
    geometry.setIndex(new BufferAttribute(bunnyIndices, 1));
    geometry.computeBoundingSphere();
    const mesh = new Mesh(
      geometry,
      new MeshStandardMaterial({ color: 0xbcbcbc, roughness: 0.75 })
    );
    const group = new Group();
    group.add(mesh);
    Promise.resolve().then(() => onLoad(group));
  }
}
