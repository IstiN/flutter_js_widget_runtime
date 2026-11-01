import { GUI as BrowserGUI } from 'three/addons/libs/lil-gui.module.min.js';
import { reportGui, useBrowserGui } from './example_adapter.js';

const MAX_ROOTS = 8;
const MAX_CONTROLLERS = 64;
const MAX_FOLDERS = 8;
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
      folder: controller.container._title,
      value: controller.getValue(),
      open: !controller.root._closed,
      visible: !controller.root._hidden && !controller._hidden,
      enabled: !controller._disabled
    }))
  };
}

function controllerRow(controller) {
  if (controller.kind === 'boolean') {
    return {
      type: 'checkbox',
      label: controller._name,
      value: controller.getValue(),
      onChanged: controller._disabled ? null : controller.action
    };
  }
  if (controller.kind === 'number') {
    if (controller._min === undefined || controller._max === undefined) {
      // Bare numeric controller (bounds not set yet): numeric text input —
      // the event router parses the string back to a finite number.
      return {
        type: 'textField',
        hint: controller._name,
        value: String(controller.getValue()),
        onChange: controller._disabled ? null : controller.action
      };
    }
    return {
      type: 'slider',
      label: controller._name,
      value: controller.getValue(),
      min: controller._min,
      max: controller._max,
      onChanged: controller._disabled ? null : controller.action
    };
  }
  if (controller.kind === 'color') {
    return {
      type: 'textField',
      hint: controller._name,
      value: colorDisplay(controller.getValue()),
      onChange: controller._disabled ? null : controller.action
    };
  }
  if (controller.kind === 'function') {
    return {
      type: 'button',
      label: controller._name,
      onPressed: controller._disabled ? null : controller.action
    };
  }
  if (controller.kind === 'options') {
    // Host dropdown node; values stringified for the items list, the typed
    // original is restored on the event path below.
    return {
      type: 'dropdown',
      label: controller._name,
      value: String(controller.getValue()),
      items: controller.labels || controller.allowed.map(v => String(v)),
      onChanged: controller._disabled ? null : controller.action
    };
  }
  if (controller.kind === 'string') {
    // Bounded string display: read-only snapshot of the current value
    // (upstream renders an editable text input; the facade snapshots
    // until `.options()` swaps in a dropdown).
    return {
      type: 'text',
      data: controller._name + ': ' + String(controller.getValue()).slice(0, 128)
    };
  }
  unsupported(`render(${controller.kind})`);
}

function rootTree(root) {
  if (root._hidden) return null;
  const children = [{
    type: 'text',
    data: root._title,
    style: { color: '#FFEBEBEB', fontSize: 12, fontWeight: 'w600' }
  }];
  if (!root._closed) {
    for (const controller of root.controllers) {
      if (!controller._hidden) children.push(controllerRow(controller));
    }
    for (const folder of root.folders) {
      if (folder._hidden) continue;
      children.push({
        type: 'text',
        data: folder._title,
        style: { color: '#FF9E9EA6', fontSize: 11, fontWeight: 'w600' }
      });
      if (folder._closed) continue;
      for (const controller of folder.controllers) {
        if (!controller._hidden) children.push(controllerRow(controller));
      }
    }
  }
  return {
    type: 'container',
    positioned: { right: 8, top: 48 },
    width: 245,
    padding: 8,
    decoration: { color: '#F21F1F1F', borderRadius: 4 },
    child: { type: 'column', mainAxisSize: 'min', children }
  };
}

function renderRoots() {
  const overlays = Array.from(roots).map(rootTree).filter(Boolean);
  if (!overlays.length) return false;
  const JSR = roots.values().next().value.JSR;
  JSR.render({
    type: 'stack',
    fit: 'expand',
    children: [{ type: 'three', canvasId: 'main' }, ...overlays]
  });
  return true;
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
  JSR.three._guiRerender = renderRoots;
  delegatedHandler = typeof JSR._handler === 'function' ? JSR._handler : null;
  const register = JSR.onEvent;
  JSR.onEvent = function(handler) {
    delegatedHandler = typeof handler === 'function' ? handler : null;
  };
  register.call(JSR, (action, payload) => {
    const controller = controllers.get(String(action));
    if (controller) {
      const container = controller.container;
      if (!controller._disabled && !controller._hidden && !controller.root._hidden &&
          !container._hidden && !container._closed) {
        if (controller.kind === 'boolean') {
          if (!payload || typeof payload.value !== 'boolean') {
            throw new Error('three.invalid: lil-gui boolean events require a boolean value');
          }
        } else if (controller.kind === 'number') {
          const raw = payload ? payload.value : undefined;
          const numeric = typeof raw === 'number'
            ? raw
            : (typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN);
          if (!Number.isFinite(numeric)) {
            throw new Error('three.invalid: lil-gui number events require a finite number value');
          }
          payload = { value: numeric };
        } else if (controller.kind === 'color') {
          payload = { value: parseColorEvent(controller, payload ? payload.value : undefined) };
        } else if (controller.kind === 'options') {
          // The host dropdown delivers a stringified value; restore the
          // typed member before validating membership in setValue.
          const raw = payload ? payload.value : undefined;
          let typed = controller.allowed.find(v => String(v) === String(raw));
          if (typed === undefined && controller.labels) {
            const labelIndex = controller.labels.indexOf(String(raw));
            if (labelIndex >= 0) typed = controller.allowed[labelIndex];
          }
          if (typed === undefined) {
            throw new Error('three.invalid: lil-gui options events require a listed value');
          }
          payload = { value: typed };
        } else if (controller.kind !== 'function') {
          unsupported(`event(${controller.kind})`);
        }
        controller.setValue(payload ? payload.value : undefined);
        controller._callOnFinishChange();
        reportRoots();
      }
      return;
    }
    if (delegatedHandler) return delegatedHandler.call(JSR, action, payload);
  });
}

export class Controller {
  constructor(container, object, property, kind) {
    // ToPropertyKey coercion: morph-target dictionaries supply numeric indices.
    if (typeof property === 'number' && Number.isFinite(property)) property = String(property);
    if (!object || typeof property !== 'string' || !property || property.length > 128) {
      throw new Error('three.invalid: lil-gui requires a bounded object property');
    }
    if (controllers.size >= MAX_CONTROLLERS) {
      throw new Error('three.invalid: lil-gui controller quota exceeded');
    }
    this.container = container;
    // Upstream controller/folder styling also touches the returned facade's
    // DOM node (and folder $children.domElement). Keep those operations on a
    // bounded no-op sink while the host renders the actual native controls.
    this.domElement = {
      style: {},
      classList: { add() {}, remove() {}, toggle() {} },
      setAttribute() {}, appendChild() {}, removeChild() {}, remove() {}
    };
    this.root = container.root !== undefined ? container.root : container;
    this.object = object;
    this.property = property;
    this.kind = kind;
    this.initialValue = this.getValue();
    this._name = property;
    this._hidden = false;
    this._disabled = false;
    this._changed = false;
    this.action = `three.gui.${++nextController}`;
    container.controllers.push(this);
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
    this.container._callOnChange(this);
    if (this._onChange) this._onChange.call(this, this.getValue());
  }
  _callOnFinishChange() {
    if (!this._changed) return;
    finishes++;
    this.container._callOnFinishChange(this);
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
    const index = this.container.controllers.indexOf(this);
    if (index >= 0) this.container.controllers.splice(index, 1);
    controllers.delete(this.action);
    reportRoots();
  }
  // Upstream listen() makes the display auto-refresh from the object; the
  // native facade snapshots values on demand, so a silent pass-through keeps
  // official modules (e.g. webgl_clipping_advanced 'Visualize'.listen())
  // booting without changing value semantics.
  listen() { return this; }
  // Upstream `.options([...])` REPLACES the controller in place (a text
  // input becomes a dropdown). The OptionsController constructor appends
  // itself; drop the intermediate controller so counts and the action
  // map stay exact — webgl_instancing_scatter's distribution dropdown
  // goes through this path.
  options(allowed) {
    const replacement = new OptionsController(this.container, this.object, this.property, allowed);
    const list = this.container.controllers;
    const index = list.indexOf(this);
    if (index >= 0) list.splice(index, 1);
    controllers.delete(this.action);
    reportRoots();
    return replacement;
  }
  min() { unsupported('min'); }
  max() { unsupported('max'); }
  decimals() { unsupported('decimals'); }
}

export class BooleanController extends Controller {
  constructor(container, object, property) {
    if (typeof object[property] !== 'boolean') unsupported(`add(${typeof object[property]})`);
    super(container, object, property, 'boolean');
  }
  setValue(value) {
    if (typeof value !== 'boolean') throw new Error('three.invalid: lil-gui boolean value required');
    return super.setValue(value);
  }
}

// lil-gui color properties (addColor): the official matcap module drives
// material.color through a numeric 0xrrggbb property. The bounded facade
// renders a hex text input (same shape as the bare numeric controller) and
// restores the property's original type (number or '#rrggbb' string) on the
// event path. Arrays/objects stay outside the bounded profile.
function isThreeColorValue(value) {
  return !!value && typeof value === 'object' &&
    typeof value.getHex === 'function' && typeof value.setHex === 'function';
}

function validColorValue(value) {
  return (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xffffff) ||
    (typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) ||
    isThreeColorValue(value);
}

export class ColorController extends Controller {
  constructor(container, object, property) {
    if (!validColorValue(object[property])) unsupported(`addColor(${typeof object[property]})`);
    super(container, object, property, 'color');
  }
  setValue(value) {
    if (!validColorValue(value)) throw new Error('three.invalid: lil-gui color value must be 0xrrggbb, a #hex string or THREE.Color');
    return super.setValue(value);
  }
}

function colorDisplay(value) {
  if (isThreeColorValue(value)) return `#${value.getHex().toString(16).padStart(6, '0')}`;
  return typeof value === 'number' ? `#${value.toString(16).padStart(6, '0')}` : value;
}

function parseColorEvent(controller, raw) {
  if (typeof raw !== 'string') throw new Error('three.invalid: lil-gui color events require a hex string');
  const match = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(raw.trim());
  if (!match) throw new Error('three.invalid: lil-gui color events require #rgb or #rrggbb');
  let hex = match[1];
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  hex = hex.toLowerCase();
  const current = controller.getValue();
  if (isThreeColorValue(current)) {
    current.setHex(Number.parseInt(hex, 16));
    return current;
  }
  return typeof current === 'number' ? Number.parseInt(hex, 16) : `#${hex}`;
}


// lil-gui string properties: upstream renders a text input; the bounded
// facade snapshots the string. The official conversion pattern
// `gui.add(o, 'mode').options([...])` swaps this controller for an
// OptionsController in place (see Controller.options below), which is
// how webgl_instancing_scatter builds its distribution dropdown.
export class StringController extends Controller {
  constructor(container, object, property) {
    if (typeof object[property] !== 'string') unsupported(`add(${typeof object[property]})`);
    super(container, object, property, 'string');
  }
  setValue(value) {
    if (typeof value !== 'string') throw new Error('three.invalid: lil-gui string value required');
    return super.setValue(value);
  }
}

// lil-gui dropdown: add(obj, prop, ['a', 'b']) / add(obj, prop, [2, 4, 8]).
// Bounded native facade: values must be strings or finite numbers, list
// capped at MAX_OPTIONS entries; setValue validates membership.
const MAX_OPTIONS = 64;

export class OptionsController extends Controller {
  constructor(container, object, property, allowed, labels = null) {
    if (!Array.isArray(allowed) || allowed.length === 0 || allowed.length > MAX_OPTIONS) {
      unsupported('add(options list empty or over quota)');
    }
    // Array lists stay scalar-bounded for typed event restore; upstream
    // object maps may hold arbitrary values (null, textures, vectors) since
    // the dropdown round-trips LABELS and compares values by reference.
    if (!labels) {
      for (const v of allowed) {
        if (typeof v !== 'string' && (typeof v !== 'number' || !Number.isFinite(v))) {
          unsupported(`add(options ${typeof v})`);
        }
      }
    }
    super(container, object, property, 'options');
    this.allowed = allowed.slice();
    // Upstream object-map form add(o, 'mode', {Label: value}): the dropdown
    // shows labels while the property keeps the typed values.
    this.labels = labels ? labels.slice() : null;
  }
  setValue(value) {
    const ok = this.allowed.some(v => v === value ||
      (typeof v === 'number' && typeof value === 'number' && Number.isFinite(v) && v === value));
    if (!ok) throw new Error('three.invalid: lil-gui options value required');
    return super.setValue(value);
  }
}

const MAX_SLIDER_RANGE = 1e9;

// lil-gui function properties render as buttons; a press invokes the
// function once (no value semantics, no finish round trip).
export class FunctionController extends Controller {
  constructor(container, object, property) {
    if (typeof object[property] !== 'function') {
      unsupported(`add(function expected, got ${typeof object[property]})`);
    }
    super(container, object, property, 'function');
  }
  setValue() {
    const fn = this.object[this.property];
    fn();
    this._callOnChange();
    reportRoots();
    return this;
  }
  getValue() { return undefined; }
}

export class NumberController extends Controller {
  constructor(container, object, property, min, max, step) {
    if (typeof object[property] !== 'number' || !Number.isFinite(object[property])) {
      unsupported(`add(number expected, got ${typeof object[property]})`);
    }
    // Bounds may be omitted (bare `add(o, 'x')`) and late-bound via the
    // official `.min().max()` chain; validate only what is provided.
    for (const bound of [min, max]) {
      if (bound !== undefined &&
          (typeof bound !== 'number' || !Number.isFinite(bound))) {
        unsupported('add(number bounds)');
      }
    }
    if (min !== undefined && max !== undefined &&
        (!(min <= max) || max - min > MAX_SLIDER_RANGE)) {
      unsupported('add(number range)');
    }
    if (step !== undefined && (typeof step !== 'number' || !Number.isFinite(step) || step <= 0)) {
      unsupported('add(number step)');
    }
    super(container, object, property, 'number');
    this._min = min;
    this._max = max;
    this._step = step;
  }
  // lil-gui's chained .min(v)/.max(v): late-bound slider bounds (the
  // official examples' `gui.add(o, 'x').min(0).max(1)` idiom). Validated
  // like constructor bounds and re-snapshotted.
  min(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('three.invalid: lil-gui min must be a finite number');
    }
    this._min = value;
    if (this._max !== undefined && !(this._min <= this._max)) {
      throw new Error('three.invalid: lil-gui min must not exceed max');
    }
    this.setValue(this.getValue());
    reportRoots();
    return this;
  }
  max(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('three.invalid: lil-gui max must be a finite number');
    }
    this._max = value;
    if (this._min !== undefined && !(this._min <= this._max)) {
      throw new Error('three.invalid: lil-gui max must not be below min');
    }
    this.setValue(this.getValue());
    reportRoots();
    return this;
  }
  // lil-gui's chained .step(value): snap slider values to the increment.
  // Stored and applied on setValue; the native facade has no fine-drag
  // semantics, so this only quantizes programmatic/GUI-driven updates.
  step(value) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new Error('three.invalid: lil-gui step must be a positive number');
    }
    this._step = value;
    this.setValue(this.getValue());
    reportRoots();
    return this;
  }
  setValue(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('three.invalid: lil-gui number value required');
    }
    var snapped = value;
    if (this._step !== undefined) {
      const base = this._min === undefined ? 0 : this._min;
      snapped = base + Math.round((value - base) / this._step) * this._step;
    }
    // Late-bound bounds: clamp only the sides that are already set, so the
    // official `.min(0).max(1)` chain on a bare controller never NaNs the
    // controlled property before both bounds exist.
    var clamped = snapped;
    if (this._min !== undefined) clamped = Math.max(this._min, clamped);
    if (this._max !== undefined) clamped = Math.min(this._max, clamped);
    return super.setValue(clamped);
  }
}

// A bounded folder section: one nesting level only, no tap-to-collapse (the
// native facade has no header gestures); open()/close() stay programmatic.
class NativeFolder {
  constructor(root, title) {
    if (root.folders.length >= MAX_FOLDERS) {
      throw new Error('three.invalid: lil-gui folder quota exceeded');
    }
    this.root = root;
    this.controllers = [];
    this.folders = [];
    this._title = String(title).slice(0, 128);
    this._closed = false;
    this._hidden = false;
    // Bounded DOM parity sink: official modules append stats/label nodes and
    // upstream folder styling reaches $children.domElement.classList.
    this.domElement = {
      style: {},
      classList: { add() {}, remove() {}, toggle() {} },
      setAttribute() {}, appendChild() {}, removeChild() {}, remove() {}
    };
    this.$children = {
      appendChild() {}, removeChild() {}, children: [],
      domElement: {
        style: {},
        classList: { add() {}, remove() {}, toggle() {} },
        setAttribute() {}, appendChild() {}, removeChild() {}, remove() {}
      }
    };
  }

  add(object, property, ...options) {
    let controller;
    if (!options.length && typeof object[property] === 'function') {
      controller = new FunctionController(this, object, property);
    } else if (!options.length && typeof object[property] === 'number' &&
               Number.isFinite(object[property])) {
      // Bare numeric add: late-bound slider/text controller (`.min().max()`
      // chain supplies bounds); booleans keep the checkbox path below.
      controller = new NumberController(this, object, property, undefined, undefined);
    } else if (!options.length && typeof object[property] === 'string') {
      // Upstream renders a text input; the facade snapshots the string
      // until `.options([...])` swaps in the dropdown.
      controller = new StringController(this, object, property);
    } else if (!options.length) {
      controller = new BooleanController(this, object, property);
    } else if (options.length === 1 && Array.isArray(options[0])) {
      controller = new OptionsController(this, object, property, options[0]);
    } else if (options.length === 1 && options[0] && typeof options[0] === 'object') {
      const map = options[0];
      controller = new OptionsController(this, object, property, Object.values(map), Object.keys(map));
    } else if (options.length === 2 || options.length === 3) {
      controller = new NumberController(this, object, property, options[0], options[1], options[2]);
    } else {
      unsupported(`add(${options.length} options)`);
    }
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
    this.root._callOnChange(controller);
  }
  _callOnFinishChange(controller) {
    if (this._onFinishChange) this._onFinishChange.call(this, {
      object: controller.object, property: controller.property,
      value: controller.getValue(), controller
    });
    this.root._callOnFinishChange(controller);
  }
  reset() { for (const controller of this.controllers) controller.reset(); return this; }
  controllersRecursive() { return this.controllers.slice(); }
  foldersRecursive() { return []; }
  save() { unsupported('save'); }
  load() { unsupported('load'); }
  addColor(object, property) {
    const controller = new ColorController(this, object, property);
    reportRoots();
    return controller;
  }
  addFolder() { unsupported('addFolder.nested'); }
  openAnimated() { unsupported('openAnimated'); }
  destroy() {
    for (const controller of this.controllers.slice()) controller.destroy();
    const index = this.root.folders.indexOf(this);
    if (index >= 0) this.root.folders.splice(index, 1);
    reportRoots();
  }
}

class NativeGUI {
  constructor(options = {}) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) unsupported('constructor options');
    // Official modules style the GUI root DOM node directly (matcap sets
    // domElement.style.webkitUserSelect). The native facade renders host
    // rows, so expose a bounded no-op DOM sink instead of failing.
    this.domElement = {
      style: {},
      classList: { add() {}, remove() {}, toggle() {} },
      setAttribute() {},
      appendChild() {},
      remove() {}
    };
    // `width` is a pure layout hint (official modules pass e.g. {width: 285});
    // the native panel lays out host-side, so accept and clamp it. Anything
    // else stays outside the bounded facade.
    for (const key of Object.keys(options)) {
      if (key === 'width') {
        if (typeof options[key] !== 'number' || !Number.isFinite(options[key]) ||
            options[key] < 0 || options[key] > 4096) {
          unsupported('constructor option width');
        }
        continue;
      }
      if (key !== 'title') unsupported(`constructor option ${key}`);
    }
    if (roots.size >= MAX_ROOTS) throw new Error('three.invalid: lil-gui root quota exceeded');
    this.JSR = globalThis.jsr;
    this.controllers = [];
    this.folders = [];
    this.$children = { domElement: this.domElement, appendChild() {}, removeChild() {}, children: [] };
    this._title = options.title === undefined ? 'Controls' : String(options.title).slice(0, 128);
    this._closed = false;
    this._hidden = false;
    this._id = ++nextRoot;
    installEvents(this.JSR);
    roots.add(this);
    reportRoots();
  }

  add(object, property, ...options) {
    let controller;
    if (!options.length && typeof object[property] === 'function') {
      controller = new FunctionController(this, object, property);
    } else if (!options.length && typeof object[property] === 'number' &&
               Number.isFinite(object[property])) {
      // Bare numeric add: late-bound slider/text controller (`.min().max()`
      // chain supplies bounds); booleans keep the checkbox path below.
      controller = new NumberController(this, object, property, undefined, undefined);
    } else if (!options.length && typeof object[property] === 'string') {
      // Upstream renders a text input; the facade snapshots the string
      // until `.options([...])` swaps in the dropdown.
      controller = new StringController(this, object, property);
    } else if (!options.length) {
      controller = new BooleanController(this, object, property);
    } else if (options.length === 1 && Array.isArray(options[0])) {
      controller = new OptionsController(this, object, property, options[0]);
    } else if (options.length === 1 && options[0] && typeof options[0] === 'object') {
      const map = options[0];
      controller = new OptionsController(this, object, property, Object.values(map), Object.keys(map));
    } else if (options.length === 2 || options.length === 3) {
      controller = new NumberController(
        this, object, property, options[0], options[1], options[2]);
    } else {
      unsupported(`add(${options.length} options)`);
    }
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
  reset() {
    for (const controller of this.controllers) controller.reset();
    for (const folder of this.folders) folder.reset();
    return this;
  }
  controllersRecursive() {
    return [
      ...this.controllers,
      ...this.folders.flatMap(folder => folder.controllers)
    ];
  }
  foldersRecursive() { return this.folders.slice(); }
  save() { unsupported('save'); }
  load() { unsupported('load'); }
  addColor(object, property) {
    const controller = new ColorController(this, object, property);
    reportRoots();
    return controller;
  }
  addFolder(title) {
    if (typeof title !== 'string' || !title || title.length > 128) {
      throw new Error('three.invalid: lil-gui folder title is required');
    }
    const folder = new NativeFolder(this, title);
    this.folders.push(folder);
    reportRoots();
    return folder;
  }
  openAnimated() { unsupported('openAnimated'); }
  destroy() {
    for (const controller of this.controllers.slice()) controller.destroy();
    for (const folder of this.folders.slice()) folder.destroy();
    roots.delete(this);
    reportRoots();
  }
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
