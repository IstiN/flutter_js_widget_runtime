// Pomodoro — 25 min focus / 5 min break cycles (every 4th break is 15 min).
// start/pause/reset/skip, completed-pomodoro counter persisted via
// jsr.storage (ASYNC — read with .then, never synchronously).
// The ring is an flChart pie (done vs left) with a large centerSpaceRadius.
// All colors from jsr.theme; every state change re-renders via jsr.render.
//
// Live state sync (protocol v1): the durable timer snapshot lives under the
// reserved storage key '__state' ({v, rev, writer, mode, running, remaining,
// endsAt, completed}). Hosts broadcast storage diffs to sibling engines of
// the same app as a reserved 'state.sync' event; instances converge by
// adopting any snapshot with a rev higher than the last one seen. The
// wall-clock endsAt keeps independent engines in phase even without the
// broadcast: boot hydrates from storage and resolves missed expiries.
(function() {
  var FOCUS_SEC = 25 * 60;
  var BREAK_SEC = 5 * 60;
  var LONG_BREAK_SEC = 15 * 60;

  // Reserved durable-state key + protocol version. Nothing else may be
  // stored under '__state' — it is the sync snapshot, whole.
  var STATE_KEY = '__state';
  var PROTOCOL_V = 1;

  // This instance's writer id: instanceId (host-stable) plus a random token
  // so two engines of the same app never collide even if the host reuses an
  // instance id across panels.
  var myId = ((typeof jsr.instanceId === 'string' && jsr.instanceId) || 'w') +
    '-' + Math.random().toString(36).slice(2, 8);

  var state = {
    mode: 'focus',      // 'focus' | 'break'
    remaining: FOCUS_SEC,
    running: false,
    completed: 0,       // persisted in storage under 'completed' (legacy)
    endsAt: 0           // Date.now() timestamp when the phase ends (running only)
  };

  // Revision bookkeeping: rev is the revision of the CURRENT state (local or
  // adopted), seenRev the highest revision seen from other instances. Every
  // local transition bumps rev past both, so concurrent writers cannot
  // clobber each other and stale echoes are dropped.
  var rev = 0;
  var seenRev = 0;

  // Host-allotted size, fed by jsr.viewport()/onViewport. Tiles are short
  // and wide (~150 px) — the full 230 px ring column cannot fit there.
  var view = { width: 0, height: 0 };

  // Tile sizes: 2x2 ~170x170, 4x2 ~350x170, 4x4+ ~350 tall.
  function layoutMode() {
    if (view.height <= 0) return 'full'; // no viewport report yet
    if (view.height < 200 && view.width < 260) return 'mini';
    if (view.height < 260 && view.width >= 300) return 'strip';
    return 'full';
  }

  function phaseSeconds() {
    if (state.mode === 'focus') return FOCUS_SEC;
    // Every 4th break is a long one.
    return state.completed > 0 && state.completed % 4 === 0
      ? LONG_BREAK_SEC
      : BREAK_SEC;
  }

  function mmss(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function tryParse(raw) {
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  // Durable snapshot of the live timer — the unit of cross-instance sync.
  function snapshot() {
    return {
      v: PROTOCOL_V,
      rev: rev,
      writer: myId,
      mode: state.mode,
      running: state.running,
      remaining: state.remaining,
      endsAt: state.endsAt,
      completed: state.completed
    };
  }

  // Persist the snapshot with a revision guaranteed fresh against anything
  // we have seen (own writes and adopted remote writes). The host broadcasts
  // storage diffs to sibling engines as the reserved 'state.sync' event.
  function persist() {
    rev = Math.max(rev, seenRev) + 1;
    jsr.storage.set(STATE_KEY, snapshot());
  }

  // Adopt a snapshot written elsewhere (state.sync or boot hydration).
  // Takes writer/rev as-is; an already-expired running phase is resolved
  // locally (and persisted with a bumped rev) so instances that missed the
  // live broadcast still converge.
  function adopt(s) {
    if (!s || typeof s !== 'object') return;
    rev = s.rev > 0 ? Math.floor(s.rev) : 0;
    seenRev = Math.max(seenRev, rev);
    state.mode = s.mode === 'break' ? 'break' : 'focus';
    state.running = s.running === true;
    state.completed = s.completed > 0 ? Math.floor(s.completed) : 0;
    var expired = false;
    if (state.running && s.endsAt > 0) {
      state.endsAt = s.endsAt;
      state.remaining = Math.max(0, Math.round((s.endsAt - Date.now()) / 1000));
      expired = s.endsAt <= Date.now();
    } else {
      state.endsAt = 0;
      var left = s.remaining > 0 ? Math.floor(s.remaining) : 0;
      state.remaining = left > 0 ? left : phaseSeconds();
    }
    if (expired) finishPhase(state.mode === 'focus');
    render();
  }

  // Reserved event from the host: a sibling engine wrote to storage
  // (payload {key, value, appId}). Only '__state' matters here; own echoes
  // and stale revisions are ignored so instances converge without loops.
  function handleStateSync(payload) {
    if (!payload || payload.key !== STATE_KEY) return;
    var v = payload.value;
    if (typeof v === 'string') v = tryParse(v);
    if (!v || typeof v !== 'object' || v.writer === myId) return;
    if (!(v.rev > seenRev)) return; // already seen (or older)
    adopt(v);
  }

  function finishPhase(countCompleted) {
    if (state.mode === 'focus') {
      if (countCompleted) {
        state.completed += 1;
        jsr.storage.set('completed', state.completed);
      }
      state.mode = 'break';
    } else {
      state.mode = 'focus';
    }
    state.remaining = phaseSeconds();
    state.endsAt = state.running ? Date.now() + state.remaining * 1000 : 0;
    persist(); // a phase finish is a local transition — broadcast it
  }

  function tick() {
    if (!state.running) return;
    var left = Math.round((state.endsAt - Date.now()) / 1000);
    if (left <= 0) {
      finishPhase(true);
    } else if (left !== state.remaining) {
      state.remaining = left;
    } else {
      return; // nothing changed — skip the re-render
    }
    render();
  }

  function ring(t, size) {
    var total = phaseSeconds();
    var done = total - state.remaining;
    var accent = state.mode === 'focus' ? t.accent : t.accent2;
    var compact = size < 200;
    // Very small hosts: scale the time text down so it stays inside the ring.
    var tiny = size < 100;
    var timeSize = compact ? (tiny ? 18 : 24) : 44;
    // fl_chart section radius is ABSOLUTE (default 40) and the painter
    // draws at centerSpace + radius — pass the exact ring thickness or the
    // pie paints past its sizedBox (sqrt(2) overshoot measured in goldens).
    var centerR = compact ? size * 0.36 : 96;
    var ringThickness = size / 2 - centerR;
    // No 0.0001 placeholder slivers: they draw a 1 px boundary line at
    // angle 0. A truly-empty ring is a single full-value section.
    var sections = done <= 0
      ? [{ value: total, color: t.surfaceAlt, radius: ringThickness }]
      : state.remaining <= 0
        ? [{ value: total, color: accent, radius: ringThickness }]
        : [
            { value: done, color: accent, radius: ringThickness },
            { value: state.remaining, color: t.surfaceAlt, radius: ringThickness }
          ];
    return {
      type: 'sizedBox', width: size, height: size,
      child: {
        type: 'stack',
        children: [
          {
            type: 'flChart',
            chartType: 'pie',
            centerSpaceRadius: centerR,
            sections: sections
          },
          {
            type: 'center',
            child: {
              type: 'column', mainAxisSize: 'min',
              children: [
                {
                  type: 'text', data: mmss(state.remaining),
                  style: { color: t.text, fontSize: timeSize, fontWeight: 'w700', letterSpacing: 2.0 }
                },
                { type: 'sizedBox', height: 4 },
                {
                  type: 'text',
                  data: state.mode === 'focus' ? 'FOCUS' : (phaseSeconds() === LONG_BREAK_SEC ? 'LONG BREAK' : 'BREAK'),
                  style: { color: accent, fontSize: compact ? (tiny ? 8 : 9) : 12, fontWeight: 'w600', letterSpacing: 2.5 }
                }
              ]
            }
          }
        ]
      }
    };
  }

  function cycleDots(t, dotSize) {
    // One dot per pomodoro in the current 4-cycle; filled = done.
    var filled = state.completed % 4;
    if (state.completed > 0 && filled === 0) filled = 4; // just finished a full cycle
    // Cycle dots — SVG tomato when done, outline circle otherwise.
    var TOMATO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      '<circle cx="12" cy="13.5" r="7.5" fill="#ef4444"/>' +
      '<path d="M12 6c-.8-1.8-2.4-2.6-4-2.4 1.4.6 2.3 1.6 2.7 2.8M12 6c.8-1.8 2.4-2.6 4-2.4-1.4.6-2.3 1.6-2.7 2.8M12 6V3.4" ' +
      'stroke="#22c55e" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
    var CIRCLE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      '<circle cx="12" cy="12" r="7" fill="none" stroke="' + t.borderBright +
      '" stroke-width="1.8"/></svg>';
    var dots = [];
    for (var i = 0; i < 4; i++) {
      dots.push({ type: 'svg', data: i < filled ? TOMATO : CIRCLE, width: dotSize, height: dotSize });
      if (i < 3) dots.push({ type: 'sizedBox', width: 6 });
    }
    return { type: 'row', mainAxisAlignment: 'center', children: dots };
  }

  function controls(t) {
    return {
      type: 'row', mainAxisAlignment: 'center',
      children: [
        {
          type: 'button',
          text: state.running ? 'Pause' : 'Start',
          style: { backgroundColor: state.mode === 'focus' ? t.accent : t.accent2, foregroundColor: t.onAccent },
          onTap: 'start_pause'
        },
        { type: 'sizedBox', width: 10 },
        { type: 'outlinedButton', text: 'Reset', onTap: 'reset' },
        { type: 'sizedBox', width: 10 },
        { type: 'textButton', text: 'Skip', onTap: 'skip' }
      ]
    };
  }

  // Mini-control icons — tiny filled inline SVGs (repo convention: icons,
  // not emoji). Filled shapes so the renderer's srcIn tint recolors them.
  var ICON_PLAY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#fff"/></svg>';
  var ICON_PAUSE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="#fff"/></svg>';
  var ICON_RESET = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="#fff"/></svg>';
  var ICON_SKIP = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="#fff"/></svg>';

  // Filled Start/Pause pill for the mini tile.
  function miniPill(t) {
    var fg = t.onAccent;
    return {
      type: 'gestureDetector',
      onTap: 'start_pause',
      child: {
        type: 'container',
        padding: [10, 5, 10, 5],
        decoration: {
          color: state.mode === 'focus' ? t.accent : t.accent2,
          borderRadius: 12
        },
        child: {
          type: 'row', mainAxisSize: 'min', crossAxisAlignment: 'center',
          children: [
            {
              type: 'svg',
              data: state.running ? ICON_PAUSE : ICON_PLAY,
              width: 11, height: 11, color: fg
            },
            { type: 'sizedBox', width: 5 },
            {
              type: 'text', data: state.running ? 'Pause' : 'Start',
              style: { color: fg, fontSize: 11, fontWeight: 'w700', letterSpacing: 0.3 }
            }
          ]
        }
      }
    };
  }

  // 26px round icon chip (Reset / Skip) for the mini tile. Material buttons
  // are >=64x40 — too big for a ~170px tile — so these are hand-sized.
  function miniChip(t, icon, actionId) {
    return {
      type: 'gestureDetector',
      onTap: actionId,
      child: {
        type: 'container',
        width: 26, height: 26, alignment: 'center',
        decoration: {
          color: t.surfaceAlt,
          borderRadius: 13,
          border: { color: t.border, width: 1 }
        },
        child: { type: 'svg', data: icon, width: 13, height: 13, color: t.muted }
      }
    };
  }

  // 2x2 tile: face + a compact controls row — the tile is live now, so
  // Start/Pause/Reset/Skip work without opening the full panel. The ring
  // shrinks ~28px (134 -> 106 at 170px) to make the row fit the height.
  // Strip/full layouts keep the full-size Material buttons.
  function renderMini(t) {
    var size = Math.max(80, Math.min(view.width, view.height) - 64);
    return {
      type: 'container',
      color: t.bg,
      child: {
        type: 'listView', shrinkWrap: false, padding: [4, 4, 4, 4],
        children: [
          { type: 'center', child: ring(t, size) },
          { type: 'sizedBox', height: 4 },
          {
            type: 'row', mainAxisAlignment: 'center', crossAxisAlignment: 'center',
            children: [
              miniPill(t),
              { type: 'sizedBox', width: 8 },
              miniChip(t, ICON_RESET, 'reset'),
              { type: 'sizedBox', width: 8 },
              miniChip(t, ICON_SKIP, 'skip')
            ]
          }
        ]
      }
    };
  }

  // 4x2 tile: a short wide strip — ring on the left, dots + controls
  // stacked on the right. Everything the full mode has, minus the caption.
  function renderCompact(t) {
    return {
      type: 'container',
      color: t.bg,
      child: {
        type: 'listView', shrinkWrap: false, padding: [6, 8, 6, 8],
        children: [
          {
            type: 'center',
            child: {
              type: 'row', mainAxisSize: 'min',
              crossAxisAlignment: 'center',
              children: [
                ring(t, 104),
                { type: 'sizedBox', width: 12 },
                {
                  type: 'column', mainAxisSize: 'min',
                  crossAxisAlignment: 'center',
                  children: [
                    cycleDots(t, 13),
                    { type: 'sizedBox', height: 10 },
                    {
                      type: 'row', mainAxisAlignment: 'center',
                      children: [
                        {
                          type: 'button',
                          text: state.running ? 'Pause' : 'Start',
                          style: { backgroundColor: state.mode === 'focus' ? t.accent : t.accent2, foregroundColor: t.onAccent },
                          onTap: 'start_pause'
                        },
                        { type: 'sizedBox', width: 8 },
                        { type: 'textButton', text: 'Reset', onTap: 'reset' },
                        { type: 'sizedBox', width: 4 },
                        { type: 'textButton', text: 'Skip', onTap: 'skip' }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    };
  }

  function render() {
    var t = jsr.theme;
    jsr.exportState({
      mode: state.mode,
      remaining: state.remaining,
      running: state.running,
      completed: state.completed,
      rev: rev
    });
    var mode = layoutMode();
    if (mode === 'mini') {
      jsr.render(renderMini(t));
      return;
    }
    if (mode === 'strip') {
      jsr.render(renderCompact(t));
      return;
    }
    jsr.render({
      type: 'container',
      color: t.bg,
      // Scrollable root by contract: hosts embed widgets at arbitrary
      // heights (~150px cards), a fixed centered column overflows there.
      child: {
        type: 'listView', shrinkWrap: false, padding: [16, 40, 16, 24],
        children: [
          { type: 'center', child: ring(t, 230) },
          { type: 'sizedBox', height: 20 },
          cycleDots(t, 18),
          { type: 'sizedBox', height: 20 },
          controls(t),
          { type: 'sizedBox', height: 16 },
          {
            type: 'text',
            data: 'Completed: ' + state.completed + ' pomodoro' + (state.completed === 1 ? '' : 's'),
            style: { color: t.muted, fontSize: 12, textAlign: 'center' }
          }
        ]
      }
    });
  }

  jsr.onEvent(function(name, payload) {
    // Reserved host names are never UI actions: 'state.sync' carries sibling
    // storage writes; back / llm.delta / tile.refresh belong to the shell.
    if (name === 'state.sync') {
      handleStateSync(payload);
      return;
    }
    if (name === 'back' || name === 'llm.delta' || name === 'tile.refresh') {
      return;
    }
    if (name === 'start_pause') {
      state.running = !state.running;
      state.endsAt = state.running
        ? Date.now() + state.remaining * 1000
        : 0;
      persist();
    }
    if (name === 'reset') {
      state.running = false;
      state.mode = 'focus';
      state.remaining = FOCUS_SEC;
      state.endsAt = 0;
      persist();
    }
    if (name === 'skip') {
      // Finish the phase now; skipping a focus counts it as completed.
      // (finishPhase persists the bumped revision.)
      finishPhase(state.mode === 'focus');
    }
    render();
  });

  // jsr.storage.get is ASYNC — hydrate the durable timer snapshot first
  // (cross-instance sync; adopt also resolves a missed expiry and persists
  // the bump), falling back to the legacy bare 'completed' counter.
  jsr.storage.get(STATE_KEY).then(function(raw) {
    var s = typeof raw === 'string' ? tryParse(raw) : raw;
    if (s && typeof s === 'object' && s.rev > 0) {
      adopt(s);
      return;
    }
    jsr.storage.get('completed').then(function(value) {
      var n = parseInt(value, 10);
      if (!isNaN(n) && n > 0) {
        state.completed = n;
        render();
      }
    });
  });

  jsr.setTitle('Pomodoro');
  // Track the host-allotted size: a short tile switches to the compact
  // strip layout, a tall panel keeps the full ring column.
  var initialView = jsr.viewport();
  if (initialView) view = initialView;
  jsr.onViewport(function(v) {
    if (v && (v.width !== view.width || v.height !== view.height)) {
      view = v;
      render();
    }
  });
  setInterval(tick, 1000);
  render();
})();
