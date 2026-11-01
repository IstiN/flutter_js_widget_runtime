// Parsing the multi-megabyte ASCII bunny plus 150 synthetic rays per frame is
// outside the bounded QuickJS lane. Keep a native indexed mesh at the same
// scene transform so the BVH example still has a visible, raycastable subject.
import { Group, Mesh, MeshStandardMaterial, SphereGeometry } from 'three';
export class FBXLoader {
  load(_url, onLoad) {
    const group = new Group();
    const mesh = new Mesh(
      new SphereGeometry(1, 32, 16),
      new MeshStandardMaterial({ color: 0xbcbcbc, roughness: 0.75 })
    );
    group.add(mesh);
    Promise.resolve().then(() => onLoad(group));
  }
}
