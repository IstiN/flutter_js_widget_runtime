// Video Player — `video` node backed by the host JsMediaHost (video_player
// in the demo app). Source switcher + BoxFit selector; the node's built-in
// transport controls stay enabled (controls: true).
(function() {
  var VIDEOS = [
    {
      title: 'Big Buck Bunny',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    },
    {
      title: 'Elephants Dream',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    },
    {
      title: 'Sintel',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
    }
  ];
  var FITS = ['contain', 'cover', 'fill'];

  var state = { video: 0, fit: 'contain' };

  function render() {
    var t = jsr.theme;
    jsr.exportState({ video: state.video, title: VIDEOS[state.video].title, fit: state.fit });
    jsr.render({
      type: 'container',
      color: t.bg,
      child: {
        type: 'listView', shrinkWrap: false, padding: [16, 16, 16, 24],
        children: [
          {
            type: 'clipRRect', borderRadius: 12,
            child: {
              // Fluid width, fixed 16:9 ratio — no hardcoded pixel size.
              type: 'aspectRatio', aspectRatio: 1.78,
              child: {
                type: 'video',
                src: VIDEOS[state.video].url,
                controls: true,
                autoPlay: false,
                fit: state.fit
              }
            }
          },
          { type: 'sizedBox', height: 14 },
          {
            type: 'text', data: VIDEOS[state.video].title,
            style: { color: t.text, fontSize: 17, fontWeight: 'w600' }
          },
          { type: 'sizedBox', height: 10 },
          {
            type: 'text', data: 'SOURCE',
            style: { color: t.muted, fontSize: 11, fontWeight: 'w600', letterSpacing: 2.0 }
          },
          { type: 'sizedBox', height: 6 },
          {
            type: 'segmentedButton',
            segments: VIDEOS.map(function(v, i) {
              return { value: String(i), label: v.title };
            }),
            selected: [String(state.video)],
            onChanged: 'select_video'
          },
          { type: 'sizedBox', height: 14 },
          {
            type: 'text', data: 'FIT',
            style: { color: t.muted, fontSize: 11, fontWeight: 'w600', letterSpacing: 2.0 }
          },
          { type: 'sizedBox', height: 6 },
          {
            type: 'segmentedButton',
            segments: FITS.map(function(f) { return { value: f, label: f }; }),
            selected: [state.fit],
            onChanged: 'select_fit'
          }
        ]
      }
    });
  }

  jsr.onEvent(function(name, payload) {
    var value = payload && payload.value;
    if (name === 'select_video') {
      // segmentedButton single-select payload may be a scalar or a list.
      var v = value instanceof Array ? value[0] : value;
      state.video = Math.max(0, Math.min(VIDEOS.length - 1, parseInt(v, 10) || 0));
    }
    if (name === 'select_fit') {
      var f = value instanceof Array ? value[0] : value;
      if (FITS.indexOf(f) >= 0) state.fit = f;
    }
    render();
  });

  jsr.setTitle('🎬 Video Player');
  render();
})();
