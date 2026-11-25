// counter.js — счётчик: полный цикл тап -> JS-состояние -> перерендер нативных View
(function() {
  var count = 0;

  function render() {
    jsr.render({
      type: 'center',
      child: {
        type: 'column',
        spacing: 16,
        children: [
          {type: 'text', data: 'QuickJS counter', style: {fontSize: 20, color: '#94a3b8'}},
          {type: 'text', data: String(count), style: {fontSize: 64, fontWeight: 'bold', color: '#f1f5f9'}},
          {type: 'row', spacing: 12, children: [
            {type: 'textButton', text: '-1', onTap: 'dec'},
            {type: 'textButton', text: '+1', onTap: 'inc'},
            {type: 'textButton', text: 'reset', onTap: 'reset'},
          ]},
          {type: 'text', data: 'перерендер целиком, но нативно и мгновенно', style: {fontSize: 12, color: '#64748b'}},
        ],
      },
    });
  }

  jsr.onEvent(function(actionId) {
    if (actionId === 'inc') count++;
    else if (actionId === 'dec') count--;
    else if (actionId === 'reset') count = 0;
    render();
  });

  render();
})();
