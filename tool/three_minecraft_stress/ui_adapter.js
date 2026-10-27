import { reportUi } from './native_adapter.js';

// Explicit chainable debug fallback for the original lil-gui call graph.
// It never creates DOM, visual controls, or implicit change events.
class DebugController {
  constructor(folder, object, property, options) {
    this.folder = folder;
    this.object = object;
    this.property = property;
    this.options = options;
    this._name = property;
    this._change = null;
    this._finish = null;
  }

  name(value) { this._name = String(value); this.folder._report(); return this; }
  onChange(callback) { this._change = callback; return this; }
  onFinishChange(callback) { this._finish = callback; return this; }
  listen() { return this; }
  updateDisplay() { return this; }
  getValue() { return this.object[this.property]; }
  setValue(value) {
    this.object[this.property] = value;
    if (this._change) this._change(value);
    if (this._finish) this._finish(value);
    this.folder._finish({ object: this.object, property: this.property, value });
    this.folder._report();
    return this;
  }
}

class DebugFolder {
  constructor(root, name) {
    this._root = root;
    this._name = name || '';
    this._folders = [];
    this._controllers = [];
    this._finishHandlers = [];
    this._closed = false;
  }

  add(object, property, ...options) {
    const controller = new DebugController(this, object, property, options);
    this._controllers.push(controller);
    this._report();
    return controller;
  }

  addFolder(name) {
    const folder = new DebugFolder(this._root, name);
    this._folders.push(folder);
    this._report();
    return folder;
  }

  onFinishChange(callback) { this._finishHandlers.push(callback); return this; }
  _finish(event) { for (const callback of this._finishHandlers) callback(event); }
  close() { this._closed = true; this._report(); return this; }
  open() { this._closed = false; this._report(); return this; }
  _report() { this._root._report(); }

  _count() {
    return this._controllers.length + this._folders.reduce((sum, folder) => sum + folder._count(), 0);
  }
}

export class GUI extends DebugFolder {
  constructor() {
    super(null, 'root');
    this._root = this;
    this._hidden = false;
    this.visual = false;
    this.debugOnly = true;
    this.domElement = null;
    this._report();
  }

  show() { this._hidden = false; this._report(); return this; }
  hide() { this._hidden = true; this._report(); return this; }
  _report() {
    reportUi({
      visual: false, debugOnly: true, hidden: this._hidden,
      controllers: this._count(), folders: this._folders.length
    });
  }
}

export default GUI;
