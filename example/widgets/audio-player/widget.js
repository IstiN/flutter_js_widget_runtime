// Audio Player — playlist transport driven by the zero-size `audio_player`
// node (props recomputed on every render; host supplies the real player via
// JsMediaHost — see example/lib/media_host.dart). The node itself renders
// nothing; the UI below is plain jsr nodes. Progress is approximated in JS
// (the media controller's position stream stays on the Dart side).
(function() {
  var TRACKS = [
    { title: 'SoundHelix Song 1', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { title: 'SoundHelix Song 2', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { title: 'SoundHelix Song 3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
  ];

  var state = {
    track: 0,
    playing: false,
    volume: 0.8,
    loop: false,
    elapsed: 0,      // JS-side approximation of position, seconds
    startedAt: 0
  };

  function current() { return TRACKS[state.track]; }

  function mmss(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function tick() {
    if (!state.playing) return;
    state.elapsed = (Date.now() - state.startedAt) / 1000;
    render();
  }

  // Transport glyphs — stylish inline SVG (no emoji).
  function svgIcon(body, size, color) {
    return {
      type: 'svg',
      data: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
        'fill="none" stroke="' + color + '" stroke-width="1.8" ' +
        'stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>',
      width: size, height: size
    };
  }
  var GLYPHS = {
    play: '<path d="M7 4.8v14.4L19.2 12Z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    prev: '<path d="M18 5.5v13L9.5 12Z"/><path d="M6.5 5.5v13"/>',
    next: '<path d="M6 5.5v13L14.5 12Z"/><path d="M17.5 5.5v13"/>',
    headphones: '<path d="M4 15v-2a8 8 0 0 1 16 0v2"/>' +
      '<rect x="3" y="14" width="4" height="6.5" rx="1.8"/>' +
      '<rect x="17" y="14" width="4" height="6.5" rx="1.8"/>',
    speaker: '<path d="M11 5.5 6.5 9H3.8v6h2.7L11 18.5Z"/>' +
      '<path d="M14.5 9.5a3.5 3.5 0 0 1 0 5M17 7a7 7 0 0 1 0 10"/>'
  };

  // Container size: at 2x2 tiles the pill transport row cannot fit —
  // switch to icon-only buttons and tighter paddings.
  var view = { w: 0, h: 0 };
  function isCompact() {
    return view.w > 0 && view.w < 260;
  }

  function transportButton(t, glyph, label, event, primary) {
    var fg = primary ? t.onAccent : t.text;
    return {
      type: 'inkWell',
      onTap: event,
      borderRadius: 12,
      child: {
        type: 'container',
        padding: isCompact() ? [7, 9, 7, 9] : [9, 14, 9, 14],
        decoration: {
          color: primary ? t.accent : t.surfaceAlt,
          borderRadius: 12
        },
        child: {
          type: 'row',
          mainAxisSize: 'min',
          crossAxisAlignment: 'center',
          children: (function () {
            var kids = [svgIcon(GLYPHS[glyph], isCompact() ? 16 : 14, fg)];
            if (!isCompact()) {
              kids.push({ type: 'sizedBox', width: 6 });
              kids.push({
                type: 'text', data: label,
                style: { color: fg, fontSize: 12.5, fontWeight: 'w600' }
              });
            }
            return kids;
          })()
        }
      }
    };
  }

  function render() {
    var t = jsr.theme;
    jsr.exportState({
      track: state.track,
      title: current().title,
      playing: state.playing,
      volume: state.volume,
      loop: state.loop,
      elapsed: Math.round(state.elapsed)
    });
    jsr.render({
      type: 'container',
      color: t.bg,
      // The zero-size audio_player driver node sits inside the scrollable
      // root as its first child: the host plays `src` and follows its props.
      child: {
        type: 'listView', shrinkWrap: false,
        padding: isCompact() ? [10, 10, 10, 12] : [16, 24, 16, 24],
        children: [
          {
            type: 'audio_player',
            src: current().url,
            playing: state.playing,
            volume: state.volume,
            loop: state.loop,
            seekToMs: 0
          },
              {
                type: 'card', color: t.surface,
                child: {
                  type: 'container', padding: isCompact() ? 10 : 20,
                  child: {
                    type: 'column', crossAxisAlignment: 'center',
                    children: [
                      {
                        type: 'container',
                        width: 64, height: 64,
                        decoration: {
                          color: t.surfaceAlt, borderRadius: 18
                        },
                        child: { type: 'center', child: svgIcon(GLYPHS.headphones, 34, t.accent) }
                      },
                      { type: 'sizedBox', height: 10 },
                      {
                        type: 'text', data: current().title,
                        style: { color: t.text, fontSize: 17, fontWeight: 'w600' }
                      },
                      { type: 'sizedBox', height: 4 },
                      {
                        type: 'text',
                        data: state.playing ? 'Playing · ' + mmss(state.elapsed) : 'Paused · ' + mmss(state.elapsed),
                        style: { color: t.muted, fontSize: 12 }
                      },
                      { type: 'sizedBox', height: 16 },
                      {
                        type: 'row', mainAxisAlignment: 'center',
                        children: [
                          transportButton(t, 'prev', 'Prev', 'prev', false),
                          { type: 'sizedBox', width: 10 },
                          transportButton(t, state.playing ? 'pause' : 'play', state.playing ? 'Pause' : 'Play', 'play_pause', true),
                          { type: 'sizedBox', width: 10 },
                          transportButton(t, 'next', 'Next', 'next', false)
                        ]
                      },
                      { type: 'sizedBox', height: 16 },
                      {
                        type: 'row',
                        children: [
                          { type: 'svg', data: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' + t.muted + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + GLYPHS.speaker + '</svg>', width: 16, height: 16 },
                          { type: 'sizedBox', width: 8 },
                          {
                            type: 'expanded',
                            child: {
                              type: 'slider',
                              value: state.volume, min: 0, max: 1, divisions: 20,
                              onChanged: 'volume'
                            }
                          }
                        ]
                      },
                      {
                        type: 'row',
                        children: [
                          {
                            type: 'expanded',
                            child: {
                              type: 'text', data: 'Loop track',
                              style: { color: t.text, fontSize: 14 }
                            }
                          },
                          { type: 'switch', value: state.loop, onChanged: 'toggle_loop' }
                        ]
                      }
                    ]
                  }
                }
              },
              { type: 'sizedBox', height: 14 },
              {
                type: 'text', data: 'PLAYLIST',
                style: { color: t.muted, fontSize: 11, fontWeight: 'w600', letterSpacing: 2.0 }
              },
              { type: 'sizedBox', height: 6 },
              {
                // Card = Material ancestor: ListTile ink splashes need one.
                type: 'card', color: t.surface,
                child: {
                  type: 'column', mainAxisSize: 'min',
                  children: TRACKS.map(function(tr, i) {
                    var tile = {
                      type: 'listTile',
                      title: tr.title,
                      onTap: 'select:' + i
                    };
                    if (i === state.track) {
                      tile.subtitle = state.playing ? 'Now playing' : 'Selected';
                    }
                    return tile;
                  })
                }
              }
        ]
      }
    });
  }

    jsr.onViewport(function (v) {
    var changed = view.w !== v.width || view.h !== v.height;
    view = { w: v.width, h: v.height };
    if (changed) render();
  });

jsr.onEvent(function(name, payload) {
    var value = payload && payload.value;
    if (name === 'play_pause') {
      state.playing = !state.playing;
      if (state.playing) {
        state.startedAt = Date.now() - state.elapsed * 1000;
      }
    }
    if (name === 'next' || name === 'prev') {
      var delta = name === 'next' ? 1 : -1;
      state.track = (state.track + delta + TRACKS.length) % TRACKS.length;
      state.elapsed = 0;
      state.startedAt = Date.now();
    }
    if (name.indexOf('select:') === 0) {
      state.track = parseInt(name.substring(7), 10) || 0;
      state.elapsed = 0;
      state.startedAt = Date.now();
      state.playing = true;
    }
    if (name === 'volume') {
      state.volume = Math.max(0, Math.min(1, Number(value) || 0));
    }
    if (name === 'toggle_loop') {
      state.loop = !!value;
    }
    render();
  });

  jsr.setTitle('Audio Player');
  setInterval(tick, 1000);
  render();
})();
