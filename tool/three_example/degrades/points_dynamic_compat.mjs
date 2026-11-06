// webgl_points_dynamic runtime adaptations (JSR bounded degrades).
//
// 1. Fast OBJ text lane. The official module OBJ-loads two pinned payloads
//    (male02 590KB + female02 464KB). The default FileLoader route decodes
//    them through the runtime's per-codepoint decodeUtf8 shim — a multi-second
//    single-eval QuickJS stall before the first frame. Wrapping the facade
//    OBJLoader to fetch bytes via JSR.three.loadAsset and decode with the
//    chunked decoder keeps the official parser and bytes identical while the
//    text lane moves in-widget.
//
// 2. Point-count degrade (measured): the official module animates every point
//    in JS per frame (combineBuffer merged meshes -> ~40.5k vertices iterated
//    across 13 geometries) and marks all 13 position attributes needsUpdate
//    every frame. Windowed probe on the QuickJS R1 runtime before the
//    loader patch: 18.0 presented fps, frameMs 6.8, 1.855MB R1 submit per
//    frame. With the loader patch (see degrades/points_dynamic_loader_patch.mjs
//    — the bundled OBJLoader addon bypasses facadeWraps, so the compat never
//    engaged) stride-2 decimation halves the JS loop and the per-frame R1
//    submit (1.855MB -> 0.931MB): 33-34 presented fps, frameMs 3.8. The
//    remaining wall cost is a fixed per-frame R1 command-buffer encode
//    (submit stays 931081B across stride 2 and 4) — an R1 lane residual,
//    not a widget cost. Deviation: half the points per cloud, same
//    layout/colors/point sizes (positions are a subset; the animation math
//    and materials are untouched).
import { BufferAttribute } from 'three';
import { bytesToText } from './fast_text_decode.mjs';

const POINT_STRIDE = 2;

function decimateGeometry(geometry, stride) {
  const attributes = geometry.attributes;
  const count = attributes.position ? attributes.position.count : 0;
  if (count < 4 * stride) return false;
  const keep = Math.floor((count + stride - 1) / stride);
  for (const name of ['position', 'normal', 'uv']) {
    const attribute = attributes[name];
    if (!attribute) continue;
    const ArrayCtor = attribute.array.constructor;
    const itemSize = attribute.itemSize;
    const next = new ArrayCtor(keep * itemSize);
    for (let i = 0; i < keep; i++) {
      const from = (i * stride) < count ? i * stride : count - 1;
      next.set(attribute.array.subarray(from * itemSize, from * itemSize + itemSize), i * itemSize);
    }
    geometry.setAttribute(name, new BufferAttribute(next, itemSize));
  }
  if (geometry.index) {
    const index = geometry.index;
    const IndexCtor = index.array.constructor;
    const nextIndex = new IndexCtor(index.array.length);
    for (let i = 0; i < index.array.length; i++) {
      nextIndex[i] = Math.floor(index.array[i] / stride);
    }
    geometry.setIndex(new BufferAttribute(nextIndex, index.itemSize));
  }
  if (geometry.morphAttributes) {
    for (const key of Object.keys(geometry.morphAttributes)) {
      delete geometry.morphAttributes[key];
    }
  }
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  return true;
}

export function installPointsDynamicCompat() {
  if (globalThis.__jsrPointsObjLoaderWrap) return;
  globalThis.__jsrPointsObjLoaderWrap = function wrapObjLoader(Base) {
    return class JsrPointsObjLoader extends Base {
      load(url, onLoad, onProgress, onError) {
        const runtime = globalThis.JSR && globalThis.JSR.three;
        if (runtime && typeof runtime.loadAsset === 'function' && typeof this.parse === 'function') {
          const fail = error => { if (onError) onError(error); else console.error(error); };
          runtime.loadAsset(url).then(record => {
            try { onLoad(this.decorate(this.parse(bytesToText(record.bytes)))); }
            catch (error) { fail(error); }
          }, fail);
          return;
        }
        return super.load(url, object => onLoad(this.decorate(object)), onProgress, onError);
      }
      decorate(object) {
        let decimated = 0;
        object.traverse(child => {
          if (child && child.isMesh && child.geometry && decimateGeometry(child.geometry, POINT_STRIDE)) {
            decimated++;
          }
        });
        console.warn('three: pointsDynamic bounded degrade decimated ' + decimated +
          ' OBJ meshes stride-' + POINT_STRIDE + ' (documented point-count deviation)');
        return object;
      }
    };
  };
}
