import { Group, Matrix4, Mesh, MeshStandardMaterial, SphereGeometry } from 'three';

console.warn('three: Cesium ion streaming and 3d-tiles-renderer are unavailable offline; rendering a bounded native globe proxy with the official camera and controls contract.');
export const CAMERA_FRAME = 0;
export class TilesRenderer {
  constructor() {
    this.group = new Group();
    const globe = new Mesh(new SphereGeometry(100, 48, 24), new MeshStandardMaterial({ color: 0x4d88b8, roughness: 0.8 }));
    this.group.add(globe);
    this.ellipsoid = {
      getObjectFrame(_lat, _lon, _height, _pitch, _roll, _yaw, matrix) {
        matrix.makeTranslation(0, 0, 250);
        return matrix;
      }
    };
  }
  registerPlugin() {}
  setCamera() {}
  setResolutionFromRenderer() {}
  update() {}
}
export class GlobeControls {
  constructor() { this.enableDamping = false; this.adjustHeight = false; }
  setEllipsoid() {}
  update() {}
}
