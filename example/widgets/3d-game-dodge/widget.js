// Dodge Blocks 3D — keyboard-driven mini game on a scene3d node.
//
// Move the player cube with ArrowLeft/ArrowRight (or A/D), dodge the falling
// blocks, and press R to restart after game over. Demonstrates jsr.onKey,
// jsr.scene3d.setTransforms batching, addModel/removeModel churn,
// jsr.exportState and jsr.storage persistence.
(function() {
  var sceneId = 'dodge-' + (jsr.instanceId || 'demo');
  var playerId = 'player';

  // World layout (cube host units).
  var FIELD_X = 5;        // player clamp: x in [-FIELD_X, FIELD_X]
  var PLAYER_Z = 2;
  var SPAWN_Z = -22;
  var DESPAWN_Z = 5;
  var PLAYER_SPEED = 10;  // units per second
  var START_LIVES = 3;

  var state;
  var keys = { left: false, right: false };
  var lastTick = 0;
  var blockSeq = 0;

  function freshState() {
    return {
      running: true,
      score: 0,
      lives: START_LIVES,
      best: 0,
      elapsed: 0,
      fallSpeed: 6,
      spawnEvery: 0.8,
      spawnTimer: 0,
      playerX: 0,
      invulnerable: 0,
      blocks: []
    };
  }

  function init() {
    jsr.scene3d.create(sceneId, {
      camera: { position: [0, 12, 14], target: [0, 0, -4], fov: 55 },
      light: { position: [5, 10, 8], color: '#ffffff', ambient: 0.5, diffuse: 0.7 }
    });
    jsr.scene3d.addModel(sceneId, {
      modelId: playerId,
      primitive: 'cube',
      color: '#22d3ee',
      position: [0, 0, PLAYER_Z],
      scale: [1.2, 1.2, 1.2]
    });
    jsr.storage.get('dodge-best').then(function(saved) {
      if (typeof saved === 'number' && saved > state.best) {
        state.best = saved;
        render();
      }
    });
    jsr.onKey(onKey);
    lastTick = 0;
    requestAnimationFrame(tick);
    render();
  }

  function restart() {
    var best = state.best;
    var oldBlocks = state.blocks;
    for (var i = 0; i < oldBlocks.length; i++) {
      jsr.scene3d.removeModel(sceneId, oldBlocks[i].id);
    }
    state = freshState();
    state.best = best;
    keys.left = false;
    keys.right = false;
    jsr.scene3d.setTransforms(sceneId, [
      { modelId: playerId, position: [0, 0, PLAYER_Z] }
    ]);
    render();
  }

  function onKey(ev) {
    var k = ev.key;
    var left = k === 'arrowLeft' || k === 'a';
    var right = k === 'arrowRight' || k === 'd';
    if (left) keys.left = ev.down;
    if (right) keys.right = ev.down;
    if (ev.down && !ev.repeat && k === 'r' && !state.running) {
      restart();
    }
  }

  function spawnBlock() {
    var id = 'block-' + (blockSeq++);
    var x = (Math.random() * 2 - 1) * FIELD_X;
    state.blocks.push({ id: id, x: x, z: SPAWN_Z });
    jsr.scene3d.addModel(sceneId, {
      modelId: id,
      primitive: 'cube',
      color: '#ef4444',
      position: [x, 0, SPAWN_Z],
      scale: [1, 1, 1]
    });
  }

  function tick(elapsedMs) {
    requestAnimationFrame(tick);
    if (!state.running) return;
    if (!lastTick) { lastTick = elapsedMs; return; }
    var dt = Math.min((elapsedMs - lastTick) / 1000, 0.1);
    lastTick = elapsedMs;

    state.elapsed += dt;
    state.score = Math.floor(state.elapsed * 10) / 10;
    if (state.score > state.best) state.best = state.score;
    state.fallSpeed = 6 + state.elapsed * 0.15;
    state.spawnEvery = Math.max(0.35, 0.8 - state.elapsed * 0.01);
    if (state.invulnerable > 0) state.invulnerable -= dt;

    // Player movement.
    var dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    state.playerX = clamp(state.playerX + dir * PLAYER_SPEED * dt, -FIELD_X, FIELD_X);

    // Spawn and advance blocks.
    state.spawnTimer += dt;
    if (state.spawnTimer >= state.spawnEvery) {
      state.spawnTimer = 0;
      spawnBlock();
    }
    var items = [{ modelId: playerId, position: [state.playerX, 0, PLAYER_Z] }];
    var survivors = [];
    for (var i = 0; i < state.blocks.length; i++) {
      var b = state.blocks[i];
      b.z += state.fallSpeed * dt;
      if (b.z > DESPAWN_Z) {
        jsr.scene3d.removeModel(sceneId, b.id);
        continue;
      }
      if (state.invulnerable <= 0 && hitPlayer(b)) {
        jsr.scene3d.removeModel(sceneId, b.id);
        loseLife();
        if (!state.running) return;
        continue;
      }
      survivors.push(b);
      items.push({ modelId: b.id, position: [b.x, 0, b.z] });
    }
    state.blocks = survivors;

    // ONE batched transform message per frame.
    jsr.scene3d.setTransforms(sceneId, items);
    jsr.exportState({ score: state.score, lives: state.lives, best: state.best });

    // Refresh the HUD a few times per second (not every frame).
    state.hudTimer = (state.hudTimer || 0) + dt;
    if (state.hudTimer >= 0.25) {
      state.hudTimer = 0;
      render();
    }
  }

  function hitPlayer(b) {
    return Math.abs(b.x - state.playerX) < 1.1 && Math.abs(b.z - PLAYER_Z) < 1.1;
  }

  function loseLife() {
    state.lives -= 1;
    state.invulnerable = 1.5;
    if (state.lives <= 0) {
      state.running = false;
      state.best = Math.round(Math.max(state.best, state.score) * 10) / 10;
      jsr.storage.set('dodge-best', state.best);
      jsr.exportState({ score: state.score, lives: 0, best: state.best });
    }
    render();
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  // HP hearts — inline SVG (filled red when alive, outline slate when
  // lost); no emoji anywhere in this widget.
  var HEART_PATH = 'M12 20.5 C7 16.5 3.5 13.2 3.5 9.6 3.5 6.9 5.6 5 8.1 5 ' +
    'c1.6 0 3.1.8 3.9 2.1 C12.8 5.8 14.3 5 15.9 5 c2.5 0 4.6 1.9 4.6 4.6 ' +
    '0 3.6 -3.5 6.9 -8.5 10.9 Z';
  var BURST_PATH = 'M12 2.5 14 8.5 20.5 7 16 12 20.5 17 14 15.5 12 21.5 ' +
    '10 15.5 3.5 17 8 12 3.5 7 10 8.5 Z';

  function svgIcon(body, size, color, filled) {
    return {
      type: 'svg',
      data: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
        'fill="' + (filled ? color : 'none') + '" stroke="' + color + '" ' +
        'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        body + '</svg>',
      width: size, height: size
    };
  }

  function hearts() {
    var out = [];
    for (var i = 0; i < START_LIVES; i++) {
      var alive = i < state.lives;
      out.push(svgIcon(
        '<path d="' + HEART_PATH + '"/>', 15,
        alive ? '#ef4444' : '#475569', alive));
      if (i < START_LIVES - 1) out.push({ type: 'sizedBox', width: 3 });
    }
    return out;
  }

  function statText(label, value) {
    return {
      type: 'column',
      mainAxisSize: 'min',
      crossAxisAlignment: 'center',
      children: [
        { type: 'text', data: label, style: { fontSize: 10, color: jsr.theme.muted } },
        { type: 'text', data: String(value), style: { fontSize: 16, color: jsr.theme.text, fontWeight: 'w600' } }
      ]
    };
  }

  function gameOverOverlay() {
    return {
      type: 'container',
      color: '#b3000000',
      child: {
        type: 'center',
        child: {
          type: 'column',
          mainAxisSize: 'min',
          crossAxisAlignment: 'center',
          children: [
            {
              type: 'row', mainAxisSize: 'min', crossAxisAlignment: 'center',
              children: [
                svgIcon('<path d="' + BURST_PATH + '"/>', 26, '#ef4444', false),
                { type: 'sizedBox', width: 8 },
                { type: 'text', data: 'GAME OVER', style: { fontSize: 26, color: '#ef4444', fontWeight: 'w700' } }
              ]
            },
            { type: 'sizedBox', height: 8 },
            { type: 'text', data: 'Score: ' + state.score.toFixed(1) + 's', style: { fontSize: 16, color: '#ffffff' } },
            { type: 'sizedBox', height: 12 },
            { type: 'text', data: 'Press R to restart', style: { fontSize: 13, color: '#94a3b8' } }
          ]
        }
      }
    };
  }

  function render() {
    jsr.exportState({ score: state.score, lives: state.lives, best: state.best });
    var sceneChildren = [
      { type: 'scene3d', id: sceneId, interactive: false }
    ];
    if (!state.running) {
      sceneChildren.push({
        type: 'overlay',
        positioned: { left: 0, top: 0, right: 0, bottom: 0 },
        child: gameOverOverlay()
      });
    }
    jsr.render({
      type: 'column',
      crossAxisAlignment: 'stretch',
      children: [
        {
          type: 'expanded',
          child: {
            type: 'stack',
            fit: 'expand',
            children: sceneChildren
          }
        },
        {
          type: 'container',
          color: jsr.theme.surface,
          padding: [10, 16, 10, 16],
          child: {
            type: 'row',
            mainAxisAlignment: 'spaceBetween',
            crossAxisAlignment: 'center',
            children: [
              statText('SCORE', state.score.toFixed(1) + 's'),
              { type: 'row', mainAxisSize: 'min', children: hearts() },
              statText('BEST', state.best.toFixed(1) + 's'),
              { type: 'text', data: 'Arrows / A D', style: { fontSize: 11, color: jsr.theme.muted } }
            ]
          }
        }
      ]
    });
  }

  state = freshState();
  jsr.onEvent(function() {});
  jsr.setTitle('Dodge Blocks 3D');
  init();
})();
