import { reportStats } from './example_adapter.js';

const now = () => typeof performance !== 'undefined' ? performance.now() : Date.now();

function snapshot(stats, phase) {
  return {
    phase,
    frames: stats._frames,
    fps: stats._fps,
    frameTimeMs: stats._frameTimeMs,
    begins: stats._begins,
    ends: stats._ends,
    updates: stats._updates,
    mode: stats._mode
  };
}

// API-compatible with the three.js Stats methods used by the official example.
// It deliberately creates no canvas: diagnostics are exported as named values.
export default class Stats {
  constructor() {
    this.REVISION = 16;
    this.dom = document.createElement('div');
    this.dom.__jsrThreeExampleStats = true;
    this.dom.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none';
    this.domElement = this.dom;
    this._beginTime = now();
    this._previousTime = this._beginTime;
    this._intervalFrames = 0;
    this._frames = 0;
    this._fps = 0;
    this._frameTimeMs = 0;
    this._begins = 0;
    this._ends = 0;
    this._updates = 0;
    this._mode = 0;
    reportStats(snapshot(this, 'construct'));
  }

  addPanel(panel) {
    this.dom.appendChild(panel.dom);
    return panel;
  }

  showPanel(id) {
    this._mode = id;
    for (let i = 0; i < this.dom.children.length; i++) {
      this.dom.children[i].style.display = i === id ? 'block' : 'none';
    }
    reportStats(snapshot(this, 'panel'));
  }

  setMode(id) { this.showPanel(id); }

  begin() {
    this._beginTime = now();
    this._begins++;
    reportStats(snapshot(this, 'begin'));
  }

  _end(phase) {
    this._frames++;
    this._ends++;
    this._intervalFrames++;
    const time = now();
    this._frameTimeMs = time - this._beginTime;
    if (time >= this._previousTime + 1000) {
      this._fps = this._intervalFrames * 1000 / (time - this._previousTime);
      this._previousTime = time;
      this._intervalFrames = 0;
    }
    reportStats(snapshot(this, phase));
    return time;
  }

  end() { return this._end('end'); }

  update() {
    this._updates++;
    this._beginTime = this._end('update');
  }
}
