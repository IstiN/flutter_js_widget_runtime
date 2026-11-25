// scroll_list.js — список из 30 айтемов: проверка нативного скролла на Tegra 2
(function() {
  var items = [];
  var colors = ['#1e293b', '#293548', '#334155'];
  for (var i = 1; i <= 30; i++) {
    items.push({
      type: 'container',
      color: colors[i % 3],
      borderRadius: 8,
      margin: 6,
      padding: 16,
      children: [
        {type: 'text', data: 'Item #' + i, style: {fontSize: 18, fontWeight: 'bold', color: '#f1f5f9'}},
        {type: 'text', data: 'Нативный скролл через QuickJS', style: {fontSize: 12, color: '#94a3b8'}},
      ],
    });
  }

  jsr.render({
    type: 'scroll',
    children: [{type: 'column', children: items}],
  });
  jsr.setTitle('JSR: список 30');
})();
