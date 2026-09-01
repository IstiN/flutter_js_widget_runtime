// 3D Showcase — procedural primitives powered by flutter_cube
(function() {
  var sceneId = 'demo-' + (jsr.instanceId || 'demo');
  var modelId = 'shape';
  var shape = 'cube';
  var color = '#3b82f6';
  var rotating = true;
  var speed = 0.5;
  var palette = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  function init() {
    jsr.scene3d.create(sceneId, {
      camera: { position: [4, 3, 10], target: [0, 0, 0], fov: 60 },
      // Higher ambient light makes flat shading less harsh; flutter_cube does
      // not cast real shadows, so a strong ambient term avoids "glitchy" dark
      // faces on the cube/torus/city.
      light: { position: [5, 8, 5], color: '#ffffff', ambient: 0.4, diffuse: 0.7 }
    });
    addModel();
    if (rotating) jsr.scene3d.playAnimation(sceneId, modelId, { axis: 'y', speed: speed });
    render();
  }

  function addModel() {
    var scale = [2, 2, 2];
    if (shape === 'torus' || shape === 'city') {
      scale = [1.4, 1.4, 1.4];
    }
    jsr.scene3d.addModel(sceneId, {
      modelId: modelId,
      primitive: shape,
      color: color,
      scale: scale
    });
  }

  function setShape(next) {
    shape = next;
    jsr.scene3d.removeModel(sceneId, modelId);
    addModel();
    if (rotating) jsr.scene3d.playAnimation(sceneId, modelId, { axis: 'y', speed: speed });
    render();
  }

  function setColor(next) {
    color = next;
    jsr.scene3d.removeModel(sceneId, modelId);
    addModel();
    if (rotating) jsr.scene3d.playAnimation(sceneId, modelId, { axis: 'y', speed: speed });
    render();
  }

  function toggleRotation() {
    rotating = !rotating;
    if (rotating) {
      jsr.scene3d.playAnimation(sceneId, modelId, { axis: 'y', speed: speed });
    } else {
      jsr.scene3d.stopAnimation(sceneId, modelId);
    }
    render();
  }

  function setSpeed(next) {
    speed = next;
    if (rotating) {
      jsr.scene3d.playAnimation(sceneId, modelId, { axis: 'y', speed: speed });
    }
    render();
  }

  function shapeButton(label, value) {
    var active = shape === value;
    // Wrap child: Expanded is illegal inside Wrap — size naturally.
    return {
      type: 'inkWell',
      onTap: 'shape_' + value,
        borderRadius: 8,
        child: {
          type: 'container',
          padding: [8, 8, 8, 8],
          decoration: {
            color: active ? jsr.theme.accent : jsr.theme.surface,
            borderRadius: 8,
            borderColor: jsr.theme.border,
            borderWidth: 1
          },
          child: {
            type: 'center',
            child: {
              type: 'text',
              data: label,
              style: {
                color: active ? '#ffffff' : jsr.theme.text,
                fontSize: 12,
                fontWeight: active ? 'w600' : 'w400'
              }
            }
          }
        }
    };
  }

  function colorDot(c) {
    var active = color === c;
    return {
      type: 'inkWell',
      onTap: 'color_' + c,
      borderRadius: 18,
      child: {
        type: 'container',
        width: 28,
        height: 28,
        margin: [4, 4, 4, 4],
        decoration: {
          color: c,
          borderRadius: 14,
          borderColor: active ? jsr.theme.text : 'transparent',
          borderWidth: active ? 2 : 0
        }
      }
    };
  }

  function exportNow() {
    jsr.exportState({ shape: shape, color: color, rotating: rotating, speed: speed });
  }

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
    exportNow();
    if (isTile()) {
      jsr.render(tileCard(jsr.theme, 'view_in_ar', '3D Shapes', 'Primitives demo'));
      return;
    }
    jsr.render({
      type: 'column',
      crossAxisAlignment: 'stretch',
      children: [
        {
          type: 'expanded',
          child: {
            type: 'scene3d',
            id: sceneId,
            width: 320,
            height: 320
          }
        },
        {
          type: 'container',
          color: jsr.theme.surface,
          padding: [12, 12, 12, 12],
          child: {
            type: 'column',
            crossAxisAlignment: 'stretch',
            mainAxisSize: 'min',
            children: [
              {
                type: 'wrap', spacing: 8, runSpacing: 8,
                children: [
                  shapeButton('Cube', 'cube'),
                  shapeButton('Sphere', 'sphere'),
                  shapeButton('Torus', 'torus'),
                  shapeButton('City', 'city')
                ]
              },
              { type: 'sizedBox', height: 12 },
              {
                type: 'wrap', spacing: 8, runSpacing: 8, alignment: 'center',
                children: palette.map(colorDot)
              },
              { type: 'sizedBox', height: 12 },
              {
                type: 'row',
                crossAxisAlignment: 'center',
                children: [
                  {
                    type: 'expanded',
                    child: {
                      type: 'column',
                      crossAxisAlignment: 'stretch',
                      mainAxisSize: 'min',
                      children: [
                        {
                          type: 'text',
                          data: 'Rotation speed: ' + speed.toFixed(1) + 'x',
                          style: { fontSize: 12, color: jsr.theme.text }
                        },
                        {
                          type: 'slider',
                          value: speed,
                          min: 0,
                          max: 3,
                          divisions: 30,
                          onChanged: 'set_speed'
                        }
                      ]
                    }
                  },
                  { type: 'sizedBox', width: 8 },
                  rotateButton(jsr.theme)
                ]
              }
            ]
          }
        }
      ]
    });
  }


  // Play/pause glyphs — inline SVG (no emoji).
  function svgIcon(body, size, color) {
    return {
      type: 'svg',
      data: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
        'fill="none" stroke="' + color + '" stroke-width="1.8" ' +
        'stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>',
      width: size, height: size
    };
  }
  var GLYPH_PLAY = '<path d="M7 4.8v14.4L19.2 12Z"/>';
  var GLYPH_PAUSE = '<path d="M8 5v14M16 5v14"/>';

  function rotateButton(t) {
    var fg = t.accent;
    return {
      type: 'inkWell',
      onTap: 'toggle_rotation',
      borderRadius: 12,
      child: {
        type: 'container',
        padding: [9, 14, 9, 14],
        decoration: {
          color: t.surface,
          borderRadius: 12,
          borderColor: t.border,
          borderWidth: 1
        },
        child: {
          type: 'row',
          mainAxisSize: 'min',
          crossAxisAlignment: 'center',
          children: [
            svgIcon(rotating ? GLYPH_PAUSE : GLYPH_PLAY, 15, fg),
            { type: 'sizedBox', width: 6 },
            {
              type: 'text',
              data: rotating ? 'Pause' : 'Rotate',
              style: { color: t.text, fontSize: 12.5, fontWeight: 'w600' }
            }
          ]
        }
      }
    };
  }

  function handleEvent(actionId, payload) {
    if (actionId === 'toggle_rotation') {
      toggleRotation();
      return;
    }
    if (actionId === 'set_speed') {
      setSpeed((payload && payload.value) || 0.5);
      return;
    }
    if (actionId.indexOf('shape_') === 0) {
      setShape(actionId.substring(6));
      return;
    }
    if (actionId.indexOf('color_') === 0) {
      setColor(actionId.substring(6));
      return;
    }
  }

  jsr.onEvent(handleEvent);
  viewportRerender(render);
  jsr.setTitle('3D Showcase');
  init();
})();
