(function() {
  'use strict';

  var modelUrl = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';

  function buildUI() {
    return {
      type: 'column',
      mainAxisAlignment: 'center',
      crossAxisAlignment: 'center',
      children: [
        {
          type: 'text',
          data: '🧊 3D Model Viewer',
          style: { fontSize: 22, fontWeight: 'bold' }
        },
        { type: 'sizedBox', height: 12 },
        {
          type: 'scene3d',
          id: 'main',
          width: 320,
          height: 320
        },
        { type: 'sizedBox', height: 12 },
        {
          type: 'row',
          mainAxisAlignment: 'center',
          children: [
            { type: 'button', text: 'Load', onTap: 'load' },
            { type: 'sizedBox', width: 8 },
            { type: 'button', text: 'Rotate', onTap: 'rotate' },
            { type: 'sizedBox', width: 8 },
            { type: 'button', text: 'Reset', onTap: 'reset' }
          ]
        }
      ]
    };
  }

  var loaded = false;
  var rotation = [0, 0, 0];

  jsr.onEvent(function(actionId) {
    if (actionId === 'load') {
      loaded = true;
      jsr.scene3d.create('main', {
        camera: { position: [0, 0, 3], target: [0, 0, 0] }
      });
      jsr.scene3d.addModel('main', {
        id: 'astronaut',
        src: modelUrl
      });
    } else if (actionId === 'rotate') {
      rotation = [45, 45, 0];
      jsr.scene3d.setTransform('main', 'astronaut', {
        rotation: rotation
      });
    } else if (actionId === 'reset') {
      rotation = [0, 0, 0];
      jsr.scene3d.setTransform('main', 'astronaut', {
        rotation: rotation
      });
    }
    jsr.exportState({ loaded: loaded, rotation: rotation });
  });

  jsr.render(buildUI());
  jsr.exportState({ loaded: loaded, rotation: rotation });
})();
