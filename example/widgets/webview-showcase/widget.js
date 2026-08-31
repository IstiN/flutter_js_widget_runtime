// WebView Showcase — embeds web content via the `webView` node (host
// JsWebViewHost: flutter_inappwebview in the demo app, iframe on web).
// URL bar + presets + a message log fed by the page→widget bridge.
(function() {
  var PRESETS = [
    { title: 'example.com', url: 'https://example.com' },
    { title: 'Wikipedia', url: 'https://en.wikipedia.org' },
    { title: 'OpenStreetMap', url: 'https://www.openstreetmap.org/export/embed.html?bbox=-0.13,51.49,-0.09,51.52' }
  ];

  var state = {
    url: PRESETS[0].url,
    draft: PRESETS[0].url,
    lastMessage: ''
  };

  function render() {
    var t = jsr.theme;
    jsr.exportState({ url: state.url, lastMessage: state.lastMessage });
    jsr.render({
      type: 'container',
      color: t.bg,
      child: {
        type: 'listView', shrinkWrap: false, padding: [12, 12, 12, 20],
        children: [
          {
            type: 'row',
            children: [
              {
                type: 'expanded',
                child: {
                  type: 'textField',
                  hint: 'https://…',
                  value: state.draft,
                  onChange: 'draft',
                  onSubmit: 'go'
                }
              },
              { type: 'sizedBox', width: 8 },
              {
                type: 'button', text: 'Go',
                style: { backgroundColor: t.accent, foregroundColor: t.onAccent },
                onTap: 'go'
              }
            ]
          },
          { type: 'sizedBox', height: 10 },
          {
            type: 'segmentedButton',
            segments: PRESETS.map(function(p, i) {
              return { value: String(i), label: p.title };
            }),
            selected: [String(currentPreset())],
            onChanged: 'preset'
          },
          { type: 'sizedBox', height: 10 },
          {
            type: 'clipRRect', borderRadius: 10,
            child: {
              type: 'container',
              color: t.surface,
              // Fixed height: the host fills it with the web surface.
              child: {
                type: 'webView',
                src: state.url,
                height: 340,
                onMessage: 'webViewMessage'
              }
            }
          },
          { type: 'sizedBox', height: 10 },
          {
            type: 'text',
            data: state.lastMessage
              ? 'Page says: ' + state.lastMessage
              : 'Page-to-widget bridge: pages can postMessage({type:\'jsr\', data:\'…\'}) (web) or callHandler(\'jsr\', …) (VM).',
            style: { color: t.muted, fontSize: 12 }
          }
        ]
      }
    });
  }

  function currentPreset() {
    for (var i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].url === state.url) return i;
    }
    return 0;
  }

  jsr.onEvent(function(name, payload) {
    var value = payload && payload.value;
    if (name === 'draft') {
      state.draft = String(value == null ? '' : value);
      return; // typing must not re-render (would lose text field focus)
    }
    if (name === 'go') {
      var url = state.draft.trim();
      if (url && url.indexOf('http') !== 0) url = 'https://' + url;
      if (url) state.url = url;
    }
    if (name === 'preset') {
      var v = value instanceof Array ? value[0] : value;
      var i = Math.max(0, Math.min(PRESETS.length - 1, parseInt(v, 10) || 0));
      state.url = PRESETS[i].url;
      state.draft = state.url;
    }
    if (name === 'webViewMessage') {
      state.lastMessage = String(value == null ? '' : value);
    }
    render();
  });

  jsr.setTitle('WebView');
  render();
})();
