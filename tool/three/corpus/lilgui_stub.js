// lilgui_stub.js — no-op lil-gui stub for the corpus harness (alias target
// for 'three/addons/libs/lil-gui.module.min.js'). GUI construction is side
// effect free here: defaults baked in the example module stay in effect,
// which is exactly the deterministic frame we compare.
class Controller {
  constructor(object, property) {
    this.object = object; this.property = property; this._fns = [];
    // Examples reach into control.domElement to toggle CSS classes
    // (animation-skinning-additive-blending).
    this.domElement = { style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } };
  }
  onChange(f) { this._fns.push(f); return this; }
  onFinishChange(f) { return this; }
  setValue(v) { this.object[this.property] = v; for (const f of this._fns) f(v); return this; }
  getValue() { return this.object[this.property]; }
  listen() { return this; }
  name() { return this; }
  min() { return this; }
  max() { return this; }
  step() { return this; }
  options() { return this; }
  enable() { return this; }
  disable() { return this; }
  show() { return this; }
  hide() { return this; }
  destroy() {}
}

export class GUI {
  constructor(opts) {
    this.domElement = { style: {}, appendChild() {} };
    // instancing-performance appends a stats div into perfFolder.$children.
    this.$children = { appendChild() {}, style: {}, innerHTML: '' };
    this.children = []; this.parent = null; this._closed = false;
  }
  add(object, property, ...rest) { const c = new Controller(object, property); this.children.push(c); return c; }
  addColor(object, property, ...rest) { return this.add(object, property); }
  addFolder(title) { const f = new GUI(); f.parent = this; this.children.push(f); return f; }
  addFolder2(title) { return this.addFolder(title); }
  remove() {}
  destroy() {}
  open() { this._closed = false; return this; }
  close() { this._closed = true; return this; }
  title() { return this; }
  controllersRecursive() { return []; }
  foldersRecursive() { return []; }
  childrenRecursive() { return []; }
  // r186 examples call .show()/.hide() on FOLDERS (webgl_loader_fbx
  // guiMorphsFolder/guiAnimationsFolder). Stub side-effect free like the
  // rest: visibility state is not part of the compared frame.
  show() { return this; }
  hide() { return this; }
  onChange() { return this; }
  onFinishChange() { return this; }
  load() { return this; }
  save() { return this; }
  remember() {}
  getRoot() { let g = this; while (g.parent) g = g.parent; return g; }
  isGUI = true;
}

export default GUI;
