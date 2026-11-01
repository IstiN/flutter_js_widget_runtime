// Bounded WebGL fallback for the four official webgl_tsl_* examples. Their
// renderer is already WebGLRenderer; only node-material spellings and TSL
// expressions come from three/webgpu and three/tsl. Native R1 materials retain
// all ordinary maps/lights/shadows and explicitly omit procedural node graphs.
export * from 'three';
import {
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshMatcapMaterial,
  MeshNormalMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PointsMaterial,
  SpriteMaterial
} from 'three';

console.warn('three: bounded WebGL TSL fallback: node materials use their native base materials; procedural TSL node graphs are omitted with an explicit warning.');

export class MeshBasicNodeMaterial extends MeshBasicMaterial {}
export class MeshLambertNodeMaterial extends MeshLambertMaterial {}
export class MeshMatcapNodeMaterial extends MeshMatcapMaterial {}
export class MeshNormalNodeMaterial extends MeshNormalMaterial {}
export class MeshPhongNodeMaterial extends MeshPhongMaterial {}
export class MeshPhysicalNodeMaterial extends MeshPhysicalMaterial {}
export class MeshStandardNodeMaterial extends MeshStandardMaterial {}
export class PointsNodeMaterial extends PointsMaterial {}
export class SpriteNodeMaterial extends SpriteMaterial {}
