// R1-native OutlinePass (prepare-lane degrade for webgl_postprocessing_outline).
//
// The official OutlinePass is a five-RT ShaderMaterial chain (depth mask,
// edge detection, separable blur, overlay composite). R1 lowers every one of
// those fullscreen ShaderMaterial quads to its bounded "first bound texture"
// blit, which drops the postprocess math — so the official lil-gui sliders
// (edgeStrength/edgeGlow/edgeThickness/pulsePeriod) and color controls
// dispatched correctly but had no visible effect, and hover-selected objects
// got no outline at all.
//
// This replacement keeps the exact public API the official module drives
// (constructor signature, selectedObjects/edge*/pulsePeriod/usePatternTexture/
// patternTexture/visibleEdgeColor/hiddenEdgeColor fields, Pass.setSize/
// render/dispose, needsSwap=false) but implements the outline with pure
// R1-native primitives — an inverted-hull shell per selected object:
//
// - hidden shell: backfaces, depthTest OFF (x-ray) — paints hiddenEdgeColor
//   wherever the hull band is ocluded; drawn first (renderOrder 1e6).
// - visible shell: backfaces, depthTest ON — repaints the band with
//   visibleEdgeColor where it is actually visible; drawn second (1e6+1).
// - glow shell (edgeGlow > 0): additive band slightly wider than the visible
//   one; opacity tracks edgeGlow.
//
// Param mapping (documented bounded degrade):
// - edgeStrength  → visible band opacity (min(1, strength/3)); glow band width.
// - edgeThickness → hull expansion distance along vertex normals (CPU-baked
//   clone of the source geometry, rebuilt only when the value moves).
// - pulsePeriod   → sinusoidal hull-width pulse in render().
// - usePatternTexture + patternTexture → visible band base map (needs uvs).
// - hiddenEdgeColor / visibleEdgeColor → shared Color INSTANCES, so the
//   official `outlinePass.visibleEdgeColor.set(hex)` mutates the live
//   materials and R1 re-encodes them (controls work without rebuilds).
// The screen-space edge/boundary math (internal edge detection, glow falloff
// shape) is approximated by silhouette shells; non-silhouette internal edges
// are not drawn.
import {
  AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, Color, Mesh,
  MeshBasicMaterial, RepeatWrapping
} from 'three';
import { Pass } from 'three/addons/postprocessing/Pass.js';

const HIDDEN_ORDER = 1e6;
const VISIBLE_ORDER = HIDDEN_ORDER + 1;
const GLOW_ORDER = HIDDEN_ORDER + 2;

function expandHull(sourceGeometry, offset) {
  const position = sourceGeometry.attributes.position;
  const normal = sourceGeometry.attributes.normal;
  const count = position.count;
  const positions = new Float32Array(count * 3);
  const radius = sourceGeometry.boundingSphere ? sourceGeometry.boundingSphere.radius : 1;
  const limit = offset;
  const fast = normal && normal.count === count &&
    position.array instanceof Float32Array && normal.array instanceof Float32Array;
  for (let i = 0; i < count; i++) {
    const x = position.array[i * 3];
    const y = position.array[i * 3 + 1];
    const z = position.array[i * 3 + 2];
    let nx = 0, ny = 0, nz = 0;
    if (fast) {
      nx = normal.array[i * 3]; ny = normal.array[i * 3 + 1]; nz = normal.array[i * 3 + 2];
      const length = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= length; ny /= length; nz /= length;
    } else {
      // Sphere-ish fallback: expand radially from the geometry center.
      const length = Math.sqrt(x * x + y * y + z * z) || 1;
      nx = x / length; ny = y / length; nz = z / length;
    }
    positions[i * 3] = x + nx * limit;
    positions[i * 3 + 1] = y + ny * limit;
    positions[i * 3 + 2] = z + nz * limit;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  // Keep the source topology: R1 validates per-primitive alignment, so a
  // dropped index (indexed sphere: vertex count 49*25) would throw
  // "primitive vertex count is not aligned".
  if (sourceGeometry.index) geometry.setIndex(sourceGeometry.index);
  if (sourceGeometry.groups && sourceGeometry.groups.length) {
    for (const group of sourceGeometry.groups) geometry.addGroup(group.start, group.count, group.materialIndex);
  }
  if (sourceGeometry.attributes.uv) {
    const uv = sourceGeometry.attributes.uv;
    const uvs = new Float32Array(count * 2);
    const uvArray = uv.array;
    const uvItem = uv.itemSize === 2 ? 2 : 0;
    if (uvItem && uvArray instanceof Float32Array && uv.count === count) {
      uvs.set(uvArray.subarray(0, count * 2));
      geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
    }
  }
  geometry.computeBoundingSphere();
  void radius;
  return geometry;
}

export class OutlinePass extends Pass {

  constructor(resolution, scene, camera, selectedObjects) {
    super();
    this.isOutlinePass = true;
    this.renderScene = scene;
    this.renderCamera = camera;
    this.selectedObjects = selectedObjects !== undefined ? selectedObjects : [];

    this.edgeStrength = 3.0;
    this.edgeGlow = 0.0;
    this.edgeThickness = 1.0;
    this.usePatternTexture = false;
    this.patternTexture = null;
    this.downSampleRatio = 2;
    this.pulsePeriod = 0;

    this.visibleEdgeColor = new Color(0xffffff);
    this.hiddenEdgeColor = new Color(0x190a05);

    this.resolution = resolution !== undefined ? resolution : { x: 256, y: 256 };
    this.needsSwap = false;
    this.clear = false;

    // Live R1-native shells (rebuilt on selection/size changes).
    this._shellEntries = [];
    this._builtThickness = NaN;
    this._builtSelection = null;
    this._patternApplied = false;
  }

  setSize() {
    // Hull width is object-relative; nothing to resize.
  }

  render(renderer, writeBuffer, readBuffer, deltaTime) {
    this._syncShells(deltaTime);
    // The outline is part of the scene pass (RenderPass draws our shells);
    // this pass itself must not touch the composer chain.
  }

  dispose() {
    this._clearShells();
  }

  _clearShells() {
    for (const entry of this._shellEntries) {
      if (entry.shell.parent) entry.shell.removeFromParent();
      if (entry.glow && entry.glow.parent) entry.glow.removeFromParent();
      if (entry.hidden && entry.hidden.parent) entry.hidden.removeFromParent();
      if (entry.owned) entry.shell.geometry.dispose();
      entry.shell.material.dispose();
      if (entry.glow) entry.glow.material.dispose();
      if (entry.hidden) entry.hidden.material.dispose();
    }
    this._shellEntries = [];
    this._builtSelection = null;
    this._patternApplied = false;
  }

  _syncShells(deltaTime) {
    const selection = this.selectedObjects;
    const selectionKey = selection.map(object => object.id).join(',');
    const thickness = Number(this.edgeThickness) || 1;
    const rebuild = this._builtSelection !== selectionKey ||
      Math.abs(thickness - this._builtThickness) > 0.001;
    if (rebuild) {
      this._clearShells();
      this._builtSelection = selectionKey;
      this._builtThickness = thickness;
      const strength = Math.min(1, Math.max(0, (Number(this.edgeStrength) || 0) / 3));
      for (const object of selection) {
        if (!object || !object.isMesh || !object.geometry || !object.geometry.attributes ||
            !object.geometry.attributes.position) continue;
        const hullOffset = thickness * 0.02 * (object.geometry.boundingSphere ?
          object.geometry.boundingSphere.radius : 1);
        const geometry = expandHull(object.geometry, hullOffset);
        const visibleMaterial = new MeshBasicMaterial({
          color: this.visibleEdgeColor,
          side: BackSide,
          transparent: true,
          opacity: Math.max(0.15, strength),
          depthWrite: false
        });
        const shell = new Mesh(geometry, visibleMaterial);
        shell.renderOrder = VISIBLE_ORDER;
        object.add(shell);
        let glow = null;
        const edgeGlow = Number(this.edgeGlow) || 0;
        if (edgeGlow > 0) {
          const glowGeometry = expandHull(object.geometry, hullOffset * 2.5);
          const glowMaterial = new MeshBasicMaterial({
            color: this.visibleEdgeColor,
            side: BackSide,
            transparent: true,
            opacity: Math.min(0.85, edgeGlow),
            blending: AdditiveBlending,
            depthWrite: false
          });
          glow = new Mesh(glowGeometry, glowMaterial);
          glow.renderOrder = GLOW_ORDER;
          object.add(glow);
        }
        const hiddenMaterial = new MeshBasicMaterial({
          color: this.hiddenEdgeColor,
          side: BackSide,
          transparent: true,
          opacity: Math.max(0.15, strength),
          depthTest: false,
          depthWrite: false
        });
        const hidden = new Mesh(expandHull(object.geometry, hullOffset), hiddenMaterial);
        hidden.renderOrder = HIDDEN_ORDER;
        object.add(hidden);
        this._shellEntries.push({ source: object, shell, glow, hidden, owned: true });
      }
      this._patternApplied = false;
    } else {
      // Strength/glow update without a hull rebuild.
      const strength = Math.min(1, Math.max(0, (Number(this.edgeStrength) || 0) / 3));
      for (const entry of this._shellEntries) {
        entry.shell.material.opacity = Math.max(0.15, strength);
        entry.hidden.material.opacity = Math.max(0.15, strength);
        const edgeGlow = Number(this.edgeGlow) || 0;
        if (entry.glow) entry.glow.material.opacity = Math.min(0.85, edgeGlow);
      }
    }

    // Pattern texture toggles straight onto the live material.
    const wantPattern = this.usePatternTexture && this.patternTexture;
    for (const entry of this._shellEntries) {
      if (entry.shell.geometry.attributes.uv) {
        entry.shell.material.map = wantPattern ? this.patternTexture : null;
        if (wantPattern) {
          this.patternTexture.wrapS = RepeatWrapping;
          this.patternTexture.wrapT = RepeatWrapping;
        }
        entry.shell.material.needsUpdate = true;
      } else {
        entry.shell.material.map = null;
      }
    }

    // Pulse: the official pass modulates the stroke width; we breathe the hull
    // (uniform hull scale is the normal expansion direction for sphere-ish
    // geometry and stays silhouette-correct for the pulse band).
    const pulsePeriod = Number(this.pulsePeriod) || 0;
    this._pulseTime = (this._pulseTime || 0) + (Number(deltaTime) || 0);
    const pulseScale = pulsePeriod > 0 ?
      1 + 0.45 * (0.5 + 0.5 * Math.sin(2 * Math.PI * this._pulseTime / pulsePeriod)) : 1;
    if (pulseScale !== this._pulseScale) {
      this._pulseScale = pulseScale;
      for (const entry of this._shellEntries) {
        entry.shell.scale.setScalar(pulseScale);
        if (entry.glow) entry.glow.scale.setScalar(pulseScale);
        entry.hidden.scale.setScalar(pulseScale);
      }
    }
  }
}
