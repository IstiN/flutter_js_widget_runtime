// three-cinematic-showcase widget entry (bundled to IIFE by build.mjs).
//
// The RAF loop is the ONLY place that reads wall time, and it converts
// elapsed milliseconds to a frame index before touching the pipeline:
// pipeline.renderFrame(clockState(frame, ...)) — never a raw timestamp.

import { createCinematicPipeline, clockState, cinematicRandom } from './pipeline.js';
import { createShowcaseScene, updateShowcaseScene } from './scene.js';

(function main() {
  var jsr = globalThis.jsr;

  var state = {
    frame: 0,
    // Presentation default: the owner bar asks for >=60 presented fps. The
    // 24 fps 'draft' cinematic preset stays available via the fps chips.
    fps: 120,
    shutter: 0.5,
    samples: 1,
    preset: 'draft',
    effects: { bloom: false, dof: false, fxaa: true, smaa: false, colorGrade: false, film: false, vignette: false, motion: false },
    status: 'boot',
    seekText: '0',
    epochMs: 0,
    lastMs: 0,
    canvasW: 480,
    canvasH: 300
  };

  function exportState() {
    if (!jsr || typeof jsr.exportState !== 'function') return;
    jsr.exportState({
      frame: state.frame,
      fps: state.fps,
      shutter: state.shutter,
      samples: state.samples,
      effects: state.effects,
      preset: state.preset,
      status: state.status
    });
  }

  function fail(message) {
    state.status = String(message);
    exportState();
    if (jsr && typeof jsr.showError === 'function') jsr.showError(String(message));
  }

  if (!jsr) { return; }
  if (typeof globalThis.THREE === 'undefined') {
    fail('cinematic.runtimeUnavailable: globalThis.THREE is not installed — evaluate the jsr three bundle before this widget');
    return;
  }
  if (!jsr.three || typeof jsr.three.createCanvas !== 'function') {
    fail('cinematic.runtimeUnavailable: jsr.three host runtime is not installed — enable the three lane for three-* widgets');
    return;
  }

  var THREE = globalThis.THREE;
  var pipeline = null;
  var seekDraft = '0';

  try {
    var viewport = typeof jsr.viewport === 'function' ? jsr.viewport() : null;
    if (viewport && viewport.width > 0) {
      state.canvasW = Math.max(240, Math.floor(viewport.width) - 24);
      state.canvasH = Math.max(180, Math.floor(state.canvasW * 0.62));
    }

    var canvas = jsr.three.createCanvas('main');
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
    if (typeof renderer.setPixelRatio === 'function' && jsr.three.devicePixelRatio) {
      renderer.setPixelRatio(jsr.three.devicePixelRatio);
    }
    renderer.setSize(state.canvasW, state.canvasH, false);
    renderer.setClearColor(new THREE.Color(0x0a0f16), 1);

    var scene = createShowcaseScene({ width: state.canvasW, height: state.canvasH, seed: 1, random: cinematicRandom(1) });
    var camera = scene.userData.camera;

    pipeline = createCinematicPipeline({
      renderer: renderer,
      scene: scene,
      camera: camera,
      effects: state.effects
    });
    pipeline.updateScene = updateShowcaseScene;
    pipeline.setQuality({ fps: state.fps, shutter: state.shutter, samples: state.samples });
    pipeline.setSize(state.canvasW, state.canvasH);
    pipeline.resetHistory(0);
  } catch (error) {
    fail('cinematic.initFailed: ' + (error && error.message ? error.message : error));
    return;
  }

  function currentFrame() {
    var elapsed = Math.max(0, state.lastMs - state.epochMs);
    return Math.floor(elapsed * state.fps / 1000);
  }

  function renderPipelineFrame() {
    var clock = clockState(state.frame, state.fps, state.shutter, state.samples, 0);
    pipeline.renderFrame(clock);
  }

  function isUnsupported(effect) {
    for (var i = 0; i < pipeline.unsupported.length; i++) {
      if (pipeline.unsupported[i].effect === effect) return true;
    }
    return false;
  }

  function unsupportedHint() {
    if (pipeline.unsupported.length === 0) return '';
    return ' · unsupported: ' + pipeline.unsupported.map(function (u) { return u.effect; }).join(',');
  }

  // ── Declarative UI ──────────────────────────────────────────────────────
  function chip(label, action, payload, active, muted) {
    var node = { type: 'chip', label: label };
    if (action) {
      node.onTap = action;
      if (payload) node.payload = payload;
    }
    if (active) node.color = jsr.theme.accent;
    if (muted) {
      node.label = label + ' · unsupported';
    }
    return node;
  }

  function chipRow(title, chips) {
    return {
      type: 'column', mainAxisSize: 'min', crossAxisAlignment: 'start',
      children: [
        { type: 'text', data: title, style: { color: jsr.theme.muted, fontSize: 11 } },
        { type: 'wrap', spacing: 6, runSpacing: 4, children: chips }
      ]
    };
  }

  function render() {
    var t = jsr.theme;
    var children = [];

    children.push({
      type: 'padding',
      padding: [8, 8, 4, 4],
      child: {
        type: 'text',
        data: 'frame ' + state.frame + ' · ' + state.fps + ' fps · shutter 1/' + Math.round(state.fps / state.shutter) + ' · ' + state.samples + ' sample' + (state.samples > 1 ? 's' : '') + unsupportedHint(),
        style: { color: t.text, fontSize: 12 }
      }
    });

    children.push({
      type: 'sizedBox',
      height: state.canvasH,
      child: { type: 'three', canvasId: 'main' }
    });

    children.push({ type: 'divider' });

    children.push(chipRow('fps', [12, 24, 30, 60, 120].map(function (fps) {
      return chip(String(fps), 'setFps', { fps: fps }, state.fps === fps, false);
    })));

    children.push(chipRow('shutter', [
      chip('180°', 'setShutter', { shutter: 0.5 }, state.shutter === 0.5, false),
      chip('90°', 'setShutter', { shutter: 0.25 }, state.shutter === 0.25, false),
      chip('45°', 'setShutter', { shutter: 0.125 }, state.shutter === 0.125, false)
    ]));

    children.push(chipRow('samples', [1, 4, 8, 16].map(function (n) {
      return chip(String(n), 'setSamples', { samples: n }, state.samples === n, false);
    })));

    var effectDefs = [
      ['bloom', 'bloom'], ['dof', 'dof'], ['fxaa', 'fxaa'], ['smaa', 'smaa'],
      ['colorGrade', 'colorGrade'], ['film', 'film'], ['vignette', 'vignette'], ['motion', 'motion']
    ];
    children.push(chipRow('effects', effectDefs.map(function (def) {
      var name = def[0];
      var unsupported = isUnsupported(name);
      if (unsupported) return chip(name, null, null, false, true);
      return chip(name + (state.effects[name] ? ' ●' : ''), 'toggleEffect', { effect: name }, !!state.effects[name], false);
    })));

    children.push(chipRow('preset', pipeline.presets.map(function (name) {
      return chip(name, 'setPreset', { preset: name }, state.preset === name, false);
    })));

    children.push({
      type: 'padding',
      padding: [0, 4, 0, 4],
      child: {
        type: 'row',
        mainAxisAlignment: 'spaceBetween',
        children: [
          { type: 'textButton', label: '−1', onPressed: 'step', payload: { delta: -1 } },
          {
            type: 'expanded',
            child: {
              type: 'textField',
              value: String(state.frame),
              hint: 'seek frame',
              onSubmit: 'seek'
            }
          },
          { type: 'textButton', label: '+1', onPressed: 'step', payload: { delta: 1 } }
        ]
      }
    });

    children.push({
      type: 'padding',
      padding: [0, 4, 0, 8],
      child: {
        type: 'row',
        mainAxisAlignment: 'spaceBetween',
        children: [
          { type: 'button', label: 'Capture PNG', onPressed: 'capture' },
          { type: 'text', data: state.status, style: { color: t.muted, fontSize: 11 } }
        ]
      }
    });

    jsr.render({
      type: 'listView',
      shrinkWrap: false,
      physics: 'platform',
      padding: [8, 8, 8, 8],
      children: children
    });
  }

  // ── Events ───────────────────────────────────────────────────────────────
  function seekTo(frame) {
    var f = Math.max(0, Math.floor(Number(frame) || 0));
    state.epochMs = state.lastMs - f * 1000 / state.fps;
    state.frame = f;
    state.seekText = String(f);
    renderPipelineFrame();
  }

  jsr.onEvent(function (id, payload) {
    payload = payload || {};
    if (id === 'setFps') {
      state.fps = Math.max(1, Math.floor(Number(payload.fps) || 24));
      state.epochMs = state.lastMs - state.frame * 1000 / state.fps;
    } else if (id === 'setShutter') {
      state.shutter = Number(payload.shutter) || 0.5;
    } else if (id === 'setSamples') {
      state.samples = Math.max(1, Math.floor(Number(payload.samples) || 1));
      pipeline.setQuality({ samples: state.samples });
    } else if (id === 'toggleEffect') {
      var name = String(payload.effect || '');
      if (isUnsupported(name)) {
        state.status = 'cinematic.unsupported: ' + name + ' is not available on the ' + pipeline.lane + ' lane';
      } else {
        state.effects[name] = !state.effects[name];
        pipeline.setEffect(name, state.effects[name]);
      }
    } else if (id === 'setPreset') {
      var presetName = String(payload.preset || 'draft');
      var config = pipeline.setPreset(presetName);
      state.preset = presetName;
      state.fps = config.fps;
      state.shutter = config.shutter;
      state.samples = config.samples;
      state.effects = config.effects;
      state.epochMs = state.lastMs - state.frame * 1000 / state.fps;
      state.status = 'preset: ' + presetName;
    } else if (id === 'seek') {
      seekTo(payload.value !== undefined ? payload.value : seekDraft);
    } else if (id === 'step') {
      seekTo(currentFrame() + Math.floor(Number(payload.delta) || 0));
    } else if (id === 'capture') {
      try {
        pipeline.assertCapturable();
        state.status = 'capturing…';
        render();
        pipeline.captureFrame().then(function (result) {
          state.status = 'captured ' + (result.width || '?') + 'x' + (result.height || '?');
          exportState();
          render();
        }, function (error) {
          state.status = (error && error.name ? error.name : 'capture failed') + ': ' + (error && error.message ? error.message : error);
          exportState();
          render();
        });
      } catch (error) {
        state.status = (error && error.name ? error.name : 'cinematic.notCapturable') + ': ' + (error && error.message ? error.message : error);
      }
    }
    exportState();
    render();
  });

  if (typeof jsr.onViewport === 'function') {
    jsr.onViewport(function (viewport) {
      if (!viewport || viewport.width <= 0) return;
      state.canvasW = Math.max(240, Math.floor(viewport.width) - 24);
      state.canvasH = Math.max(180, Math.floor(state.canvasW * 0.62));
      try {
        pipeline.setSize(state.canvasW, state.canvasH);
        state.status = 'viewport ' + state.canvasW + 'x' + state.canvasH;
      } catch (error) {
        state.status = 'resize failed: ' + (error && error.message);
      }
      render();
    });
  }

  // ── RAF loop — the only wall-clock reader ────────────────────────────────
  function tick(elapsedMs) {
    state.lastMs = Number(elapsedMs) || 0;
    var frame = currentFrame();
    if (frame !== state.frame) {
      state.frame = frame;
      try {
        renderPipelineFrame();
      } catch (error) {
        state.status = 'render failed: ' + (error && error.message ? error.message : error);
      }
      exportState();
      render();
    }
    requestAnimationFrame(tick);
  }

  // First paint: frame 0 through the pipeline, then the declarative tree.
  try {
    state.status = 'lane: ' + pipeline.lane + (pipeline.unsupported.length ? ' · unsupported: ' + pipeline.unsupported.map(function (u) { return u.effect; }).join(', ') : ' · all effects available');
    renderPipelineFrame();
  } catch (error) {
    state.status = 'render failed: ' + (error && error.message ? error.message : error);
  }
  exportState();
  render();
  requestAnimationFrame(tick);
})();
