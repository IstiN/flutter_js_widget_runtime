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

  // Compact tile (2x2/4x2 ~170px tall): the live demo does not fit —
  // render a launcher card instead (the host opens the panel on tap).
  var view = { w: 0, h: 0 };
  function isTile() {
    return view.h > 0 && view.h < 260;
  }
  function tileCard(t, icon, title, subtitle) {
    return {
      type: 'container',
      color: t.bg,
      child: {
        type: 'center',
        child: {
          type: 'container',
          padding: [10, 12, 10, 12],
          decoration: {
            color: t.surface,
            borderRadius: 14,
            borderColor: t.border,
            borderWidth: 1
          },
          child: {
            type: 'row', mainAxisSize: 'min', crossAxisAlignment: 'center',
            children: [
              {
                type: 'container',
                width: 40, height: 40,
                decoration: { color: '#22' + t.accent.replace('#', ''), borderRadius: 12 },
                child: { type: 'center', child: { type: 'icon',
                  name: icon, size: 22, color: t.accent } }
              },
              { type: 'sizedBox', width: 10 },
              {
                type: 'column', crossAxisAlignment: 'start', mainAxisSize: 'min',
                children: [
                  { type: 'text', data: title,
                    style: { color: t.text, fontSize: 14, fontWeight: 'w700' } },
                  { type: 'text', data: subtitle,
                    style: { color: t.muted, fontSize: 11 } }
                ]
              }
            ]
          }
        }
      }
    };
  }
  function viewportRerender(rerender) {
    jsr.onViewport(function (v) {
      var changed = view.w !== v.width || view.h !== v.height;
      view = { w: v.width, h: v.height };
      if (changed) rerender();
    });
  }
  function render() {
    var t = jsr.theme;
    jsr.exportState({ url: state.url, lastMessage: state.lastMessage });
    if (isTile()) {
      jsr.render(tileCard(t, 'language', 'Web Views', 'Browser demo'));
      return;
    }
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

    viewportRerender(render);

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
