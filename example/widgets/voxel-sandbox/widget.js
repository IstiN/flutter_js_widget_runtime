// Voxel Sandbox — chunked terrain on the pure-Dart voxel node.
//
// World model mirrors fa_craft's chunk pipeline: a heightmap world split
// into CHUNK_X x CHUNK_Z chunks, a per-chunk mesher that emits only
// air-facing faces (plain float arrays, JSON-bridge friendly), and
// edits that rebuild + re-upload only the dirty chunk. Untouched chunks
// keep their buffers — repaints are driven by the camera.
(function() {
  var WORLD_ID = 'sandbox';
  var CHUNK = 8; // chunk footprint in blocks (demo scale)
  var CHUNKS = 3; // 3x3 chunk grid
  var WORLD = CHUNK * CHUNKS; // 24x24 blocks
  var MAX_H = 6;

  // Deterministic heightmap: layered sines, stable across sessions.
  function baseHeight(x, z) {
    return 1 +
        Math.floor(
          1.6 * Math.sin(x * 0.7) + 1.6 * Math.cos(z * 0.6) +
          0.9 * Math.sin((x + z) * 0.4)
        );
  }

  // edits: {"x,z": height} overrides applied on top of the base map.
  var edits = {};
  var stats = { chunks: 0, faces: 0 };
  var attached = false;
  var cam = {x: WORLD / 2, y: 9, z: -6, yaw: Math.PI, pitch: -0.45};

  function height(x, z) {
    var k = x + ',' + z;
    if (k in edits) return edits[k];
    var h = baseHeight(x, z);
    if (x < 0 || z < 0 || x >= WORLD || z >= WORLD) return 0;
    return Math.max(0, Math.min(MAX_H, h));
  }

  // Face table: dir, corner offsets (CCW from outside), base shade.
  var FACES = [
    { n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], s: 0.80 },
    { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], s: 0.80 },
    { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], s: 1.00 },
    { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], s: 0.55 },
    { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], s: 0.90 },
    { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], s: 0.70 }
  ];

  function solid(x, y, z) {
    return y >= 0 && y < height(x, z);
  }

  // Mesher for one chunk: emits only faces adjacent to air, as plain
  // arrays (JSON bridge payload). origin positions the chunk in world.
  function buildChunk(cx, cz) {
    var positions = [];
    var colors = [];
    var indices = [];
    var x0 = cx * CHUNK;
    var z0 = cz * CHUNK;
    for (var lx = 0; lx < CHUNK; lx++) {
      for (var lz = 0; lz < CHUNK; lz++) {
        var wx = x0 + lx;
        var wz = z0 + lz;
        var h = height(wx, wz);
        for (var y = 0; y < h; y++) {
          for (var f = 0; f < 6; f++) {
            var face = FACES[f];
            if (solid(wx + face.n[0], y + face.n[1], wz + face.n[2])) {
              continue; // hidden face: neighbor solid, skip
            }
            var base = positions.length / 3;
            var tint = y >= h - 1 ? 1 : 0.55 + y * 0.08; // grass over dirt
            for (var v = 0; v < 4; v++) {
              var c = face.c[v];
              positions.push(wx + c[0], y + c[1], wz + c[2]);
              colors.push(0.35 * tint, 0.65 * face.s * tint, 0.3 * tint);
            }
            indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
          }
        }
      }
    }
    return {
      id: WORLD_ID,
      key: cx + ',' + cz,
      origin: [0, 0, 0],
      positions: positions,
      colors: colors,
      indices: indices
    };
  }

  function pushChunk(cx, cz) {
    var built = buildChunk(cx, cz);
    stats.faces += built.indices.length / 6;
    return jsr.hostCall('voxel.mesh', built);
  }

  function pushCamera() {
    return jsr.hostCall('voxel.camera', {
      id: WORLD_ID,
      position: [cam.x, cam.y, cam.z],
      yaw: cam.yaw,
      pitch: cam.pitch,
      light: 1,
      skyColor: '#87ceeb'
    });
  }

  function uploadAll() {
    stats.chunks = CHUNKS * CHUNKS;
    stats.faces = 0;
    var jobs = [];
    for (var cx = 0; cx < CHUNKS; cx++) {
      for (var cz = 0; cz < CHUNKS; cz++) {
        jobs.push(pushChunk(cx, cz));
      }
    }
    jobs.push(pushCamera());
    return Promise.all(jobs);
  }

  // Edit: bump one column, then rebuild ONLY its chunk. Neighbors keep
  // their buffers — this is the cheap edit path the node is built for.
  function editCenter(delta) {
    var wx = Math.floor(WORLD / 2);
    var wz = Math.floor(WORLD / 2);
    var next = Math.max(0, Math.min(MAX_H, height(wx, wz) + delta));
    edits[wx + ',' + wz] = next;
    var cx = Math.floor(wx / CHUNK);
    var cz = Math.floor(wz / CHUNK);
    // Boundary edits also dirty the adjacent chunk (its hidden faces
    // facing this column may need to appear).
    var jobs = [pushChunk(cx, cz)];
    if (wx % CHUNK === 0 && cx > 0) jobs.push(pushChunk(cx - 1, cz));
    if (wz % CHUNK === 0 && cz > 0) jobs.push(pushChunk(cx, cz - 1));
    return Promise.all(jobs).then(render);
  }

  function orbit(dyaw, dpitch) {
    cam.yaw += dyaw;
    cam.pitch = Math.max(-1.3, Math.min(0.6, cam.pitch + dpitch));
    pushCamera().then(render);
  }

  function statRow(t) {
    return {
      type: 'row',
      mainAxisAlignment: 'spaceBetween',
      children: [
        {
          type: 'text',
          data: stats.chunks + ' chunks · ' + stats.faces + ' faces',
          style: { color: t.text, fontSize: 11.5 }
        },
        {
          type: 'text',
          data: attached ? 'voxel node live' : 'voxel node unsupported',
          style: { color: attached ? t.accent : t.text, fontSize: 11.5 }
        }
      ]
    };
  }

  function pill(t, label, action) {
    return {
      type: 'inkWell',
      onTap: action,
      borderRadius: 10,
      child: {
        type: 'container',
        padding: [7, 12, 7, 12],
        decoration: {
          color: t.surface,
          borderRadius: 10,
          borderColor: t.border,
          borderWidth: 1
        },
        child: {
          type: 'text',
          data: label,
          style: { color: t.text, fontSize: 12.5, fontWeight: 'w600' }
        }
      }
    };
  }

  function render() {
    var t = jsr.theme;
    jsr.render({
        type: 'container',
        padding: [10, 10, 10, 10],
        color: t.background,
        child: {
          type: 'column',
          children: [
            {
              type: 'stack',
              children: [
                {
                  type: 'container',
                  height: 240,
                  decoration: { color: '#87ceeb', borderRadius: 12 },
                  child: { type: 'voxel', id: WORLD_ID }
                }
              ],
              alignment: 'center'
            },
            { type: 'sizedBox', height: 8 },
            statRow(t),
            { type: 'sizedBox', height: 8 },
            {
              type: 'wrap',
              spacing: 8,
              runSpacing: 8,
              children: [
                pill(t, '◀', 'cam_left'),
                pill(t, '▶', 'cam_right'),
                pill(t, '▲', 'cam_up'),
                pill(t, '▼', 'cam_down'),
                pill(t, 'Dig', 'dig'),
                pill(t, 'Build', 'build')
              ]
            }
          ]
        }
      });
  }

  function handleEvent(actionId) {
    if (actionId === 'cam_left') orbit(0.35, 0);
    else if (actionId === 'cam_right') orbit(-0.35, 0);
    else if (actionId === 'cam_up') orbit(0, 0.2);
    else if (actionId === 'cam_down') orbit(0, -0.2);
    else if (actionId === 'dig') editCenter(-1);
    else if (actionId === 'build') editCenter(1);
  }

  jsr.onEvent(function(actionId) { handleEvent(actionId); });

  // Probe the node first: runtimes older than the voxel support reject
  // voxel.* calls — the widget degrades to the banner instead of hanging.
  jsr.hostCall('voxel.attach', { id: WORLD_ID }).then(function() {
    attached = true;
    return uploadAll();
  }).then(render).catch(function() {
    attached = false;
    render();
  });
  jsr.setTitle('Voxel Sandbox');
})();
