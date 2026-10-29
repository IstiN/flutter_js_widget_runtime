import { GUI as BrowserGUI } from 'three/addons/libs/lil-gui.module.min.js';
import { reportGui, useBrowserGui } from './example_adapter.js';

const MAX_ROOTS = 8;
const MAX_CONTROLLERS = 64;
const roots = new Set();
const controllers = new Map();
let nextRoot = 0;
let nextController = 0;
let eventsInstalled = false;
let delegatedHandler = null;
let changes = 0;
let finishes = 0;

function unsupported(api) {
  throw new Error(`three.unsupported: lil-gui.${api} is outside the bounded native facade`);
}

function snapshot() {
  return {
    native: true,
    roots: roots.size,
    controllers: controllers.size,
    changes,
    finishes,
    values: Array.from(controllers.values()).map(controller => ({
      action: controller.action,
      property: controller.property,
      name: controller._name,
      kind: controller.kind,
      value: controller.getValue(),
      open: !controller.root._closed,
      visible: !controller.root._hidden && !controller._hidden,
      enabled: !controller._disabled
    }))
  };
}

function controllerTree(controller) {
  if (controller.kind !== 'boolean') unsupported(`render(${controller.kind})`);
  return {
    type: 'checkbox',
    label: controller._name,
    value: controller.getValue(),
    onChanged: controller._disabled ? null : controller.action
  };
}

function rootTree(root) {
  if (root._hidden) return null;
  const children = [{
    type: 'text',
    data: root._title,
    style: { color: '#FF111111', fontSize: 12, fontWeight: 'w600' }
  }];
  if (!root._closed) {
    for (const controller of root.controllers) {
      if (!controller._hidden) children.push(controllerTree(controller));
    }
  }
  return {
    type: 'container',
    positioned: { right: 8, top: 48 },
    width: 245,
    padding: 8,
    decoration: { color: '#F2F2F2F2', borderRadius: 4 },
    child: { type: 'column', mainAxisSize: 'min', children }
  };
}

function renderRoots() {
  const overlays = Array.from(roots).map(rootTree).filter(Boolean);
  if (!overlays.length) return;
  const JSR = roots.values().next().value.JSR;
  JSR.render({
    type: 'stack',
    fit: 'expand',
    children: [{ type: 'three', canvasId: 'main' }, ...overlays]
  });
}

function reportRoots() {
  reportGui(snapshot());
  renderRoots();
}

function installEvents(JSR) {
  if (eventsInstalled) return;
  if (typeof JSR.onEvent !== 'function') {
    throw new Error('three.unsupported: native lil-gui requires the normal jsr.onEvent path');
  }
  eventsInstalled = true;
  delegatedHandler = typeof JSR._handler === 'function' ? JSR._handler : null;
  const register = JSR.onEvent;
  JSR.onEvent = function(handler) {
    delegatedHandler = typeof handler === 'function' ? handler : null;
  };
  register.call(JSR, (action, payload) => {
    const controller = controllers.get(String(action));
    if (controller) {
      if (!controller._disabled && !controller._hidden && !controller.root._hidden) {
        if (!payload || typeof payload.value !== 'boolean') {
          throw new Error('three.invalid: lil-gui boolean events require a boolean value');
        }
        controller.setValue(payload.value);
        controller._callOnFinishChange();
        reportRoots();
      }
      return;
    }
    if (delegatedHandler) return delegatedHandler.call(JSR, action, payload);
  });
}

export class Controller {
  constructor(root, object, property, kind) {
    if (!object || typeof property !== 'string' || !property || property.length > 128) {
      throw new Error('three.invalid: lil-gui requires a bounded object property');
    }
    if (root.controllers.length >= MAX_CONTROLLERS) {
      throw new Error('three.invalid: lil-gui controller quota exceeded');
    }
    this.root = root;
    this.object = object;
    this.property = property;
    this.kind = kind;
    this.initialValue = this.getValue();
    this._name = property;
    this._hidden = false;
    this._disabled = false;
    this._changed = false;
    this.action = `three.gui.${++nextController}`;
    root.controllers.push(this);
    controllers.set(this.action, this);
  }

  name(value) { this._name = String(value).slice(0, 128); reportRoots(); return this; }
  onChange(callback) { this._onChange = callback; return this; }
  onFinishChange(callback) { this._onFinishChange = callback; return this; }
  getValue() { return this.object[this.property]; }
  setValue(value) { this.object[this.property] = value; this._callOnChange(); return this; }
  _callOnChange() {
    this._changed = true;
    changes++;
    this.root._callOnChange(this);
    if (this._onChange) this._onChange.call(this, this.getValue());
  }
  _callOnFinishChange() {
    if (!this._changed) return;
    finishes++;
    this.root._callOnFinishChange(this);
    if (this._onFinishChange) this._onFinishChange.call(this, this.getValue());
    this._changed = false;
  }
  updateDisplay() { reportRoots(); return this; }
  reset() { this.setValue(this.initialValue); this._callOnFinishChange(); reportRoots(); return this; }
  show(value = true) { this._hidden = !value; reportRoots(); return this; }
  hide() { return this.show(false); }
  enable(value = true) { this._disabled = !value; reportRoots(); return this; }
  disable(value = true) { return this.enable(!value); }
  save() { return this.getValue(); }
  load(value) { this.setValue(value); this._callOnFinishChange(); reportRoots(); return this; }
  destroy() {
    const index = this.root.controllers.indexOf(this);
    if (index >= 0) this.root.controllers.splice(index, 1);
    controllers.delete(this.action);
    reportRoots();
  }
  listen() { unsupported('listen'); }
  options() { unsupported('options'); }
  min() { unsupported('min'); }
  max() { unsupported('max'); }
  step() { unsupported('step'); }
  decimals() { unsupported('decimals'); }
}

export class BooleanController extends Controller {
  constructor(root, object, property) {
    if (typeof object[property] !== 'boolean') unsupported(`add(${typeof object[property]})`);
    super(root, object, property, 'boolean');
  }
  setValue(value) {
    if (typeof value !== 'boolean') throw new Error('three.invalid: lil-gui boolean value required');
    return super.setValue(value);
  }
}

class NativeGUI {
  constructor(options = {}) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) unsupported('constructor options');
    for (const key of Object.keys(options)) if (key !== 'title') unsupported(`constructor option ${key}`);
    if (roots.size >= MAX_ROOTS) throw new Error('three.invalid: lil-gui root quota exceeded');
    this.JSR = globalThis.jsr;
    this.controllers = [];
    this.folders = [];
    this._title = options.title === undefined ? 'Controls' : String(options.title).slice(0, 128);
    this._closed = false;
    this._hidden = false;
    this._id = ++nextRoot;
    installEvents(this.JSR);
    roots.add(this);
    reportRoots();
  }

  add(object, property, ...options) {
    if (options.length) unsupported('add options');
    if (typeof object[property] !== 'boolean') unsupported(`add(${typeof object[property]})`);
    const controller = new BooleanController(this, object, property);
    reportRoots();
    return controller;
  }
  open(value = true) { this._closed = !value; reportRoots(); return this; }
  close() { return this.open(false); }
  show(value = true) { this._hidden = !value; reportRoots(); return this; }
  hide() { return this.show(false); }
  title(value) { this._title = String(value).slice(0, 128); reportRoots(); return this; }
  onChange(callback) { this._onChange = callback; return this; }
  onFinishChange(callback) { this._onFinishChange = callback; return this; }
  _callOnChange(controller) {
    if (this._onChange) this._onChange.call(this, {
      object: controller.object, property: controller.property,
      value: controller.getValue(), controller
    });
  }
  _callOnFinishChange(controller) {
    if (this._onFinishChange) this._onFinishChange.call(this, {
      object: controller.object, property: controller.property,
      value: controller.getValue(), controller
    });
  }
  reset() { for (const controller of this.controllers) controller.reset(); return this; }
  controllersRecursive() { return this.controllers.slice(); }
  foldersRecursive() { return []; }
  save() { unsupported('save'); }
  load() { unsupported('load'); }
  addColor() { unsupported('addColor'); }
  addFolder() { unsupported('addFolder'); }
  openAnimated() { unsupported('openAnimated'); }
  destroy() { for (const controller of this.controllers.slice()) controller.destroy(); roots.delete(this); reportRoots(); }
}

// Real browser documents retain lil-gui's official DOM implementation. The
// JSR Web Worker has no browser DOM, so it uses the same functional JSR UI.
export class GUI {
  constructor(options = {}) {
    if (useBrowserGui()) return new BrowserGUI(options);
    return new NativeGUI(options);
  }
}

export default GUI;
