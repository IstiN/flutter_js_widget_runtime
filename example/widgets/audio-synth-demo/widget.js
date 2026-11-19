// Audio Synth Demo — one compact offline scene exercising every
// jsr.audio.synth parameter in 0.4.208: biquad sweeps, colored noise,
// vibrato/tremolo, waveshaper drive, carrier-ratio FM and track delay/reverb.
// The host receives interleaved Float32 PCM through onAudioSynthesis; the
// example app prints the metadata and frame count.
(function() {
  var state = {
    status: 'idle',
    info: null,
    error: null,
    rendering: false
  };

  function render() {
    var t = jsr.theme;
    var chip = function(label, value) {
      return {
        type: 'container',
        padding: [6, 10, 6, 10],
        decoration: {
          color: t.surfaceAlt,
          borderRadius: 12,
          border: { color: t.border, width: 1 }
        },
        child: {
          type: 'text',
          value: value,
          style: { fontSize: 11, color: t.muted, weight: 600 }
        }
      };
    };
    var feature = function(title, detail) {
      return {
        type: 'row',
        crossAxisAlignment: 'start',
        spacing: 8,
        children: [
          { type: 'container', width: 4, height: 24, decoration: { color: t.accent, borderRadius: 2 } },
          {
            type: 'expanded',
            child: {
              type: 'column',
              crossAxisAlignment: 'start',
              spacing: 2,
              children: [
                { type: 'text', value: title, style: { fontSize: 13, weight: 700, color: t.text } },
                { type: 'text', value: detail, style: { fontSize: 11, color: t.muted } }
              ]
            }
          }
        ]
      };
    };
    var statusColor = state.status === 'ready'
      ? t.accent
      : state.status === 'error'
        ? '#ff5a6a'
        : t.muted;
    var statusText = state.status === 'idle'
      ? 'Ready — the host receives interleaved Float32 PCM.'
      : state.status === 'rendering'
        ? 'Rendering 8 seconds @ 44.1 kHz…'
        : state.status === 'ready'
          ? 'Rendered: ' + state.info.name + ' · ' + state.info.frames +
            ' frames · ' + state.info.channels + 'ch · ' +
            state.info.sampleRate + ' Hz'
          : state.error;

    jsr.render({
      type: 'listView',
      padding: [16, 16, 24, 16],
      children: [
        {
          type: 'container',
          padding: [16, 16, 16, 16],
          decoration: {
            color: t.surface,
            borderRadius: 18,
            border: { color: t.border, width: 1 },
            boxShadow: [{ color: 'rgba(0,0,0,0.20)', blurRadius: 18, offset: [0, 8] }]
          },
          child: {
            type: 'column',
            spacing: 12,
            children: [
              {
                type: 'row',
                crossAxisAlignment: 'center',
                spacing: 10,
                children: [
                  { type: 'container', width: 38, height: 38, decoration: { color: t.accent, borderRadius: 12 }, child: { type: 'center', child: { type: 'svg', data: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' + t.onAccent + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h2.2l1.8-5.5 2.5 11 2.3-8 1.9 5.5H21"/></svg>', width: 20, height: 20 } } },
                  {
                    type: 'expanded',
                    child: {
                      type: 'column',
                      crossAxisAlignment: 'start',
                      spacing: 2,
                      children: [
                        { type: 'text', value: 'Audio Synth Demo', style: { fontSize: 18, weight: 800, color: t.text } },
                        { type: 'text', value: '8s offline scene · filter → noise → drive/FM → space', style: { fontSize: 12, color: t.muted } }
                      ]
                    }
                  }
                ]
              },
              {
                type: 'row',
                spacing: 6,
                children: [
                  chip('rate', '44.1 kHz'),
                  chip('shape', 'stereo'),
                  chip('tail', 'delay + reverb')
                ]
              },
              {
                type: 'inkWell',
                onTap: state.rendering ? '' : 'render_scene',
                borderRadius: 14,
                child: {
                  type: 'container',
                  width: 'infinity',
                  padding: [13, 14, 13, 14],
                  decoration: {
                    color: state.rendering ? t.surfaceAlt : t.accent,
                    borderRadius: 14
                  },
                  child: {
                    type: 'center',
                    child: {
                      type: 'text',
                      value: state.rendering ? 'RENDERING…' : 'RENDER DEMO SCENE',
                      style: { fontSize: 13, weight: 800, color: state.rendering ? t.muted : t.onAccent, letterSpacing: 0.7 }
                    }
                  }
                }
              },
              { type: 'text', value: statusText, style: { fontSize: 12, color: statusColor, weight: 600 } }
            ]
          }
        },
        {
          type: 'container',
          padding: [16, 16, 16, 16],
          decoration: {
            color: t.surface,
            borderRadius: 18,
            border: { color: t.border, width: 1 }
          },
          child: {
            type: 'column',
            spacing: 12,
            children: [
              feature('Filter sweep', 'lowpass 180→3600 Hz, q 3 — rising riser'),
              feature('Pink noise', 'ocean/wind bed under the full scene'),
              feature('LFOs', 'vibrato in cents + centered tremolo on the arp'),
              feature('Waveshaper', 'drive 7 · driveMix 0.75 on the bass drop'),
              feature('Carrier-ratio FM', 'fm {ratio:3.5, index:5} — metallic bells'),
              feature('Track effects', 'delay 0.22s + reverb decay 1.6s')
            ]
          }
        }
      ]
    });
  }

  function renderScene() {
    state.rendering = true;
    state.error = null;
    state.info = null;
    render();

    var track = jsr.audio.synth({
      name: 'audio-synth-demo',
      sampleRate: 44100,
      channels: 2,
      duration: 8,
      effects: [
        { type: 'delay', time: 0.22, feedback: 0.35, mix: 0.28 },
        { type: 'reverb', decay: 1.6, mix: 0.22 }
      ]
    });

    // Ocean/wind bed: pink noise is much darker than white noise.
    track.osc({
      type: 'noise',
      noiseColor: 'pink',
      start: 0,
      duration: 7.2,
      gain: 0.085,
      attack: 0.6,
      release: 0.8,
      pan: 0
    });

    // Riser: geometric carrier sweep and cutoff sweep together.
    track.note('A2', {
      start: 0.15,
      duration: 1.35,
      type: 'sawtooth',
      gain: 0.16,
      attack: 0.04,
      sustain: 0.8,
      release: 0.12,
      frequencyEnd: 640,
      filter: { type: 'lowpass', frequency: 180, frequencyEnd: 3600, q: 3 },
      vibrato: { rate: 5.5, depth: 14 },
      drive: 3,
      driveMix: 0.55
    });

    // Drop: bounded soft-clip grit.
    track.note('A1', {
      start: 1.5,
      duration: 0.82,
      type: 'square',
      gain: 0.24,
      attack: 0.01,
      decay: 0.08,
      sustain: 0.72,
      release: 0.14,
      drive: 7,
      driveMix: 0.75,
      tremolo: { rate: 6.5, depth: 0.22 }
    });

    // FM bells: modulator frequency is carrier frequency * ratio.
    track.note('E5', {
      start: 2.42,
      duration: 0.52,
      type: 'sine',
      gain: 0.16,
      attack: 0.005,
      decay: 0.1,
      sustain: 0.6,
      release: 0.5,
      fm: { ratio: 3.5, index: 5 },
      pan: -0.35
    });
    track.note('B5', {
      start: 3.02,
      duration: 0.45,
      type: 'sine',
      gain: 0.14,
      attack: 0.005,
      decay: 0.08,
      sustain: 0.55,
      release: 0.7,
      fm: { ratio: 2.25, index: 4 },
      pan: 0.38
    });

    // Tremolo/vibrato arpeggio over the noise bed.
    var arp = ['A3', 'C4', 'E4', 'G4', 'A4', 'G4', 'E4', 'C4'];
    for (var i = 0; i < 18; i++) {
      track.note(arp[i % arp.length], {
        start: 3.8 + i * 0.17,
        duration: 0.09,
        type: 'triangle',
        gain: 0.13,
        attack: 0.004,
        decay: 0.02,
        sustain: 0.72,
        release: 0.09,
        vibrato: { rate: 7, depth: 18 },
        tremolo: { rate: 4.2, depth: 0.35 },
        pan: i % 2 === 0 ? -0.22 : 0.22
      });
    }

    // Final open fifth into the effect tail.
    track.note('A4', {
      start: 7.05,
      duration: 0.45,
      type: 'sine',
      gain: 0.15,
      attack: 0.03,
      sustain: 0.7,
      release: 0.5,
      pan: -0.12
    });
    track.note('E5', {
      start: 7.05,
      duration: 0.45,
      type: 'sine',
      gain: 0.13,
      attack: 0.03,
      sustain: 0.7,
      release: 0.5,
      pan: 0.12
    });

    track.render().then(function(info) {
      state.rendering = false;
      state.status = 'ready';
      state.info = info;
      jsr.exportState({ status: state.status, info: info });
      render();
    }, function(e) {
      state.rendering = false;
      state.status = 'error';
      state.error = String(e && e.message || e);
      jsr.exportState({ status: state.status, error: state.error });
      render();
    });
  }

  handleEvent = function(actionId) {
    if (actionId === 'render_scene') renderScene();
    return Promise.resolve();
  };

  render();
  jsr.exportState({ status: state.status });
})();
