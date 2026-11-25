// hello.js — знакомый пример из README js_widget_runtime
(function() {
  jsr.render({
    type: 'center',
    child: {
      type: 'column',
      mainAxisSize: 'min',
      spacing: 12,
      children: [
        {type: 'text', data: 'Hello from JS!', style: {fontSize: 24, fontWeight: 'bold', color: '#f1f5f9'}},
        {type: 'sizedBox', height: 12},
        {
          type: 'textButton',
          text: 'Tap me',
          onTap: 'tap',
        },
      ],
    },
  });
  var taps = 0;
  jsr.onEvent(function(actionId, payload) {
    if (actionId === 'tap') {
      taps++;
      jsr.setTitle('Tapped: ' + taps);
      jsr.render({
        type: 'center',
        child: {
          type: 'column',
          spacing: 12,
          children: [
            {type: 'text', data: 'Hello from JS!', style: {fontSize: 24, fontWeight: 'bold', color: '#f1f5f9'}},
            {type: 'text', data: 'Taps: ' + taps, style: {fontSize: 18, color: '#818cf8'}},
            {type: 'textButton', text: 'Tap me', onTap: 'tap'},
          ],
        },
      });
    }
  });
})();
