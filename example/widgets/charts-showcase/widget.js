// Charts Showcase — fl_chart-backed charts rendered from JSON nodes.
// One scrollable page with line / bar / pie / radar / scatter samples.
// All data is static and deterministic (gallery golden material).
(function() {
  function caption(t, text) {
    return { type: 'padding', padding: [0, 0, 0, 6], child: {
      type: 'text', data: text,
      style: { color: t.muted, fontSize: 11, fontWeight: 'w600', letterSpacing: 1.0 }
    } };
  }

  function card(t, title, chartType, props) {
    var node = { type: 'flChart', chartType: chartType };
    for (var k in props) node[k] = props[k];
    return { type: 'container', margin: [0, 0, 0, 14], padding: [12, 12, 12, 12],
      decoration: { color: t.surface, borderRadius: 14, border: { color: t.border } },
      child: { type: 'column', crossAxisAlignment: 'stretch', mainAxisSize: 'min',
        children: [
          caption(t, title),
          { type: 'container', height: 170, child: node }
        ] } };
  }

  function render() {
    var t = jsr.theme;
    jsr.exportState({ ready: true });
    jsr.render({
      type: 'column',
      crossAxisAlignment: 'stretch',
      children: [
        { type: 'appBar', title: 'Charts', color: t.bg,
          leading: { icon: 'menu', onTap: 'noop' } },
        { type: 'expanded', child: {
          type: 'scroll',
          padding: [16, 12, 16, 12],
          child: { type: 'column', crossAxisAlignment: 'stretch', children: [
            card(t, 'LINE — two series', 'line', {
              series: [
                { label: '2025', color: '#818cf8', points: [3, 5, 4, 7, 6, 9, 8, 11, 10, 13] },
                { label: '2026', color: '#22d3ee', points: [2, 3, 5, 4, 7, 8, 7, 10, 12, 12] }
              ]
            }),
            card(t, 'BAR — weekly', 'bar', {
              values: [4, 7, 5, 9, 6, 8, 10],
              color: '#a78bfa'
            }),
            card(t, 'PIE — traffic share', 'pie', {
              sections: [
                { label: 'Organic', value: 42, color: '#818cf8' },
                { label: 'Social', value: 26, color: '#22d3ee' },
                { label: 'Referral', value: 18, color: '#f59e0b' },
                { label: 'Direct', value: 14, color: '#ef4444' }
              ]
            }),
            card(t, 'RADAR — stack fitness', 'radar', {
              features: ['UI', 'API', 'DB', 'Tests', 'Docs'],
              entries: [
                { label: 'Now', color: '#818cf8', values: [4, 3, 3, 5, 2] },
                { label: 'Goal', color: '#22d3ee', values: [5, 4, 4, 5, 4] }
              ]
            }),
            card(t, 'SCATTER — samples', 'scatter', {
              points: [
                { x: 1, y: 2 }, { x: 2, y: 3.4 }, { x: 3, y: 2.8 },
                { x: 4, y: 5 }, { x: 5, y: 4.2 }, { x: 6, y: 6.4 },
                { x: 7, y: 5.8 }, { x: 8, y: 7.6 }, { x: 9, y: 7 }
              ]
            })
          ] }
        } }
      ]
    });
  }

  jsr.onEvent(function() {});
  jsr.setTitle('📊 Charts');
  render();
})();
