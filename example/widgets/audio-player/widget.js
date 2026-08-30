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

  function transportButton(t, label, event, primary) {
    return {
      type: 'button',
      text: label,
      style: primary
        ? { backgroundColor: t.accent, foregroundColor: t.onAccent }
        : { backgroundColor: t.surfaceAlt, foregroundColor: t.text },
      onTap: event
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
        type: 'listView', shrinkWrap: false, padding: [16, 24, 16, 24],
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
                  type: 'container', padding: 20,
                  child: {
                    type: 'column', crossAxisAlignment: 'center',
                    children: [
                      { type: 'text', data: '🎧', style: { fontSize: 42 } },
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
                          transportButton(t, '⏮ Prev', 'prev', false),
                          { type: 'sizedBox', width: 10 },
                          transportButton(t, state.playing ? '⏸ Pause' : '▶ Play', 'play_pause', true),
                          { type: 'sizedBox', width: 10 },
                          transportButton(t, 'Next ⏭', 'next', false)
                        ]
                      },
                      { type: 'sizedBox', height: 16 },
                      {
                        type: 'row',
                        children: [
                          { type: 'text', data: '🔊', style: { fontSize: 14 } },
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
                      title: (i === state.track ? '● ' : '') + tr.title,
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

  jsr.setTitle('🎧 Audio Player');
  setInterval(tick, 1000);
  render();
})();
