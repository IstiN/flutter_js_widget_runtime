import { Vector2, Vector3 } from 'three';
export const CLOUD_SHAPE_TEXTURE_SIZE = 1;
export const CLOUD_SHAPE_DETAIL_TEXTURE_SIZE = 1;
export const DEFAULT_LOCAL_WEATHER_URL = 'textures/cesiumion.png';
export const DEFAULT_SHAPE_URL = 'textures/cesiumion.png';
export const DEFAULT_SHAPE_DETAIL_URL = 'textures/cesiumion.png';
export const DEFAULT_TURBULENCE_URL = 'textures/cesiumion.png';
export const DEFAULT_STBN_URL = 'textures/cesiumion.png';

export class CloudsEffect {
  constructor(camera) {
    this.camera = camera;
    this.sunDirection = new Vector3(1, 0, 0);
    this.localWeatherVelocity = new Vector2();
    this.shadow = { mapSize: new Vector2() };
    this.events = { addEventListener() {} };
  }
}
export class AerialPerspectiveEffect {
  constructor(camera) { this.camera = camera; this.sunDirection = new Vector3(1, 0, 0); }
}
export class PrecomputedTexturesGenerator {
  constructor(renderer) { this.renderer = renderer; }
  update() { return {}; }
}
export function getSunDirectionECEF(_date, target) { return target.set(1, 0, 0); }
export class STBNLoader { load() {} }
export class DitheringEffect {}
export class LensFlareEffect {}
