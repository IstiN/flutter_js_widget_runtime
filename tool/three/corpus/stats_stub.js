// stats_stub.js — no-op Stats stub for the corpus harness (alias target for
// 'three/addons/libs/stats.module.js'). Stats is a debug HUD; it never
// touches pixels, so a deterministic stub keeps both sides identical.
export default class Stats {
  constructor() {
    this.dom = { style: {}, textContent: '', id: 'stats' };
    this.domElement = this.dom;
  }
  addPanel() { return this; }
  showPanel() {}
  begin() {}
  end() {}
  update() {}
  setMode() {}
  get dom2() { return this.dom; }
}
