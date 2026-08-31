// Adaptive Dashboard — reference for the adaptive-layout toolkit:
// - `adaptive` NODE: renderer picks a subtree by the ALLOTTED width
//   (LayoutBuilder — works for tiles/panels/full screen, no JS round trip)
// - `gridView.maxCrossAxisExtent`: columns float with width
// - `jsr.breakpoint()` / `jsr.adaptive()`: JS-side values (padding, labels)
// - `jsr.onViewport`: re-render when the host size changes
(function() {
  // KPI glyphs — stylish inline SVG (stroke 1.8, tinted with the theme
  // accent), never emoji.
  var ICONS = {
    revenue: '<path d="M3 17.5 9 11.5l3.5 3.5L21 6.5"/><path d="M15 6.5h6v6"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/>' +
      '<path d="M15.5 5.2a3.4 3.4 0 0 1 0 5.9M17.5 14.4a5.5 5.5 0 0 1 3 5.1"/>',
    orders: '<path d="M4 5h2l2.2 10.2a1.8 1.8 0 0 0 1.8 1.4h7.6a1.8 1.8 0 0 0 1.8-1.4L21 9H7"/>' +
      '<circle cx="10.6" cy="20" r="1.3"/><circle cx="17.4" cy="20" r="1.3"/>',
    session: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.6 1.8M9.5 2.5h5"/>',
    countries: '<circle cx="12" cy="12" r="8.5"/>' +
      '<path d="M3.5 12h17M12 3.5c2.7 2.3 4 5.2 4 8.5s-1.3 6.2-4 8.5c-2.7-2.3-4-5.2-4-8.5s1.3-6.2 4-8.5Z"/>',
    rating: '<path d="M12 3.2l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6L3.2 9.6l6.1-.9Z"/>'
  };
  var STATS = [
    { icon: 'revenue', label: 'Revenue', value: '$12.4k', delta: '+8.1%' },
    { icon: 'users', label: 'Users', value: '3,842', delta: '+2.4%' },
    { icon: 'orders', label: 'Orders', value: '512', delta: '-1.2%' },
    { icon: 'session', label: 'Avg. session', value: '4m 32s', delta: '+12s' },
    { icon: 'countries', label: 'Countries', value: '27', delta: '+3' },
    { icon: 'rating', label: 'Rating', value: '4.8', delta: '+0.1' }
  ];

  function svgIcon(t, key, size) {
    return {
      type: 'svg',
      data: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
        'fill="none" stroke="' + t.accent + '" stroke-width="1.8" ' +
        'stroke-linecap="round" stroke-linejoin="round">' +
        ICONS[key] + '</svg>',
      width: size, height: size
    };
  }

  var viewport = null;

  function statCard(t, s) {
    return {
      type: 'card', color: t.surface,
      child: {
        type: 'container', padding: 14,
        child: {
          type: 'column', crossAxisAlignment: 'start', mainAxisSize: 'min',
          children: [
            {
              type: 'container',
              width: 34, height: 34,
              decoration: {
                color: t.surfaceAlt, borderRadius: 10
              },
              child: { type: 'center', child: svgIcon(t, s.icon, 19) }
            },
            { type: 'sizedBox', height: 8 },
            {
              type: 'text', data: s.value,
              style: { color: t.text, fontSize: 20, fontWeight: 'w700' }
            },
            {
              type: 'text', data: s.label + ' · ' + s.delta,
              style: { color: t.muted, fontSize: 11 }
            }
          ]
        }
      }
    };
  }

  function header(t) {
    var bp = jsr.breakpoint();
    var sizeText = viewport
      ? Math.round(viewport.width) + '×' + Math.round(viewport.height)
      : 'unknown';
    return {
      type: 'row',
      children: [
        {
          type: 'expanded',
          child: {
            type: 'column', crossAxisAlignment: 'start', mainAxisSize: 'min',
            children: [
              {
                type: 'text', data: 'Dashboard',
                style: { color: t.text, fontSize: 20, fontWeight: 'w700' }
              },
              {
                type: 'text',
                data: 'breakpoint: ' + bp + ' · viewport: ' + sizeText,
                style: { color: t.muted, fontSize: 11 }
              }
            ]
          }
        },
        {
          type: 'chip', label: bp,
          color: t.accent
        }
      ]
    };
  }

  function render() {
    var t = jsr.theme;
    // jsr.adaptive for VALUES: outer padding breathes with the width.
    var pad = jsr.adaptive({ compact: [12, 12, 12, 20], medium: [20, 16, 20, 24], expanded: [32, 20, 32, 28] }) || [12, 12, 12, 20];
    jsr.exportState({
      breakpoint: jsr.breakpoint(),
      viewport: viewport
    });
    jsr.render({
      type: 'container',
      color: t.bg,
      child: {
        type: 'listView', shrinkWrap: false, padding: pad,
        children: [
          header(t),
          { type: 'sizedBox', height: 12 },
          // The adaptive NODE switches layout by the allotted width —
          // no viewport event needed, it reacts to pure constraints.
          {
            type: 'adaptive',
            compact: {
              type: 'column', mainAxisSize: 'min',
              children: STATS.map(function(s) { return statCard(t, s); })
            },
            medium: {
              type: 'gridView', crossAxisCount: 2,
              crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 1.9,
              children: STATS.map(function(s) { return statCard(t, s); })
            },
            expanded: {
              // Columns "no wider than 260" — the count floats with width.
              type: 'gridView', maxCrossAxisExtent: 260,
              crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.7,
              children: STATS.map(function(s) { return statCard(t, s); })
            }
          }
        ]
      }
    });
  }

  jsr.onViewport(function(v) {
    viewport = v;
    render();
  });

  jsr.setTitle('Adaptive Dashboard');
  render();
})();
