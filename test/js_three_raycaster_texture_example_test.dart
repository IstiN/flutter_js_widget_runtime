import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// webgl_raycaster_texture — DOCUMENTED FACADE GAP (not a renderer bug).
///
/// The official module paints three meshes (box / plane / circle) from a
/// `CircleTexture`: a 1024x1024 `<canvas>` whose 2D context draws an
/// `<img>` background (the embedded `textures/uv_grid_opengl.jpg`,
/// 549505 bytes) plus a stroked cross that pointermove raycasts onto
/// (`transformUv` → `setCrossPosition` → `_draw`).
///
/// The prepared widget runs that canvas on the flutterGpu bounded canvas2d
/// lane (`document.createElement('canvas')` → `jsr.three.createCanvas2D`),
/// but the module dies during `init()`, before any mesh, material or GUI
/// exists:
///
/// 1. PRIMARY (pinned root cause) — `CircleTexture` builds its background
///    with `document.createElement('img')`, and the example facade's
///    `localImage()` hard-requires `OffscreenCanvas`:
///    tool/three_example/example_adapter.js:162-164 —
///    `if (typeof ROOT.OffscreenCanvas !== 'function') throw new Error(
///    '<widget>: local web textures require OffscreenCanvas')`. The native
///    QuickJS runtime never defines `globalThis.OffscreenCanvas`
///    (assets/three/three.native.js only ever *tests* `typeof
///    OffscreenCanvas < "u"`), so the constructor throws and the whole
///    example IIFE aborts. The R1 renderer itself is never reached: no
///    geometry upload, no submitted frame, and the error card replaces the
///    just-mounted `three` root (hence `surface == null` after the
///    reparent-stable flip).
/// 2. SECONDARY (next blocker, same bounded-profile family — verified
///    statically in the shipped facade, tool/three_example/
///    example_canvas2d.js:198-203 and :205-216): even with a decodable
///    image, `_draw()` opens with `clearRect(...)`, which the bounded
///    facade throws on (`three.unsupported: example canvas clearRect is
///    outside the bounded profile`), and the facade exposes no
///    `beginPath`/`moveTo`/`lineTo`/`stroke`/`lineWidth`/`strokeStyle` at
///    all, so the official cross stroking cannot run on this lane either.
///
/// Part 1 asserts the pristine boot: healthy asset registration, canvas
/// mounted, zero R1 frames, zero GUI controllers (init died before
/// lil-gui) and the exact OffscreenCanvas error card. Part 2 instruments
/// a copy of the same widget.js with a state-flag probe proving both
/// facts on the real lane: the native canvas2d path WAS taken (the lane
/// is active), and the `<img>` factory is the exact throw site.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'raycaster texture example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
      'webgl_raycaster_texture boots but dies in CircleTexture init on the '
      'native lane (OffscreenCanvas img facade gap)', (tester) async {
    // Part 1 — the unmodified widget: healthy boot, zero R1 submits.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-raycaster-texture',
      instanceId: 'three-raycaster-texture-test',
    );
    // Patient pumping: the img decode would run on a microtask and the
    // RAF loop keeps throwing on every tick — give it real wall clock.
    await harness.pumpFrames(tester, 60);

    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_raycaster_texture');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    // appendChild(container, canvas) ran BEFORE the throw.
    expect(exported['mounted'], isTrue);

    // The widget registered its embedded image asset (the uv_grid jpg is
    // sha-gated and base64-embedded by prepare).
    final assets = exported['assets'] as Map<String, dynamic>;
    final uvGrid = assets['textures/uv_grid_opengl.jpg'] as Map<String, dynamic>;
    expect(uvGrid['registered'], isTrue);
    expect(uvGrid['bytes'], 549505);

    // init() mounted the three root first, then died inside
    // `new CircleTexture(map)` — so the FIRST render tree is the bare
    // canvas and every later tree is the engine error card.
    expect(harness.renderTrees, isNotEmpty);
    expect(harness.renderTrees.first['type'], 'three');
    expect(harness.renderTrees.first['canvasId'], 'main');
    const primaryCause = 'local web textures require OffscreenCanvas';
    final errorCards = harness.renderTrees
        .map((tree) => tree.toString())
        .where((tree) => tree.contains('Widget error'))
        .toList();
    expect(errorCards, isNotEmpty);
    // The FIRST error card is the pinned primary cause — the RAF loop
    // that keeps ticking afterwards only cascades (its animation step
    // reads variables init() never assigned), it never changes the cause.
    expect(
      errorCards.first.contains(primaryCause),
      isTrue,
      reason: 'the init-time OffscreenCanvas error card must be the first '
          'failure; got ${errorCards.take(3)}',
    );

    // The root-type flip detaches the three surface — nothing is ever
    // presented and no R1 frame is ever decoded.
    expect(harness.surface, isNull);
    expect(harness.state, isNull);
    expect((exported['renderer'] as Map<String, dynamic>)['frame'], 0);
    expect((exported['stats'] as Map<String, dynamic>)['updates'], 0);

    // init() died before lil-gui: the official module builds 7 GUI
    // controllers (wrapS/wrapT options + offsetX/offsetY/repeatX/
    // repeatY/rotation numbers) after the meshes; none exist.
    final gui = exported['gui'] as Map<String, dynamic>;
    expect(gui['controllers'], 0);
    expect((gui['values'] as List), isEmpty);

    await harness.dispose(tester);

    // Part 2 — instrumented copy of the same widget.js proving the two
    // pinned facts on the live lane via a state-flag probe (no log
    // scraping): the native flutterGpu canvas2d path WAS taken for the
    // CircleTexture canvas, and the `<img>` factory guard is the exact
    // throw site inside the CircleTexture constructor.
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: _raycasterProbeSource(),
      instanceId: 'three-raycaster-texture-gap-probe',
    );
    await probe.pumpFrames(tester, 40);

    final probeExported = probe.engine.exportedState!;
    final findings = probeExported['probe'];
    expect(findings, isNotNull, reason: 'probe findings never exported');
    final facts = findings as Map;
    // The flutterGpu canvas2d lane is ACTIVE: the CircleTexture canvas was
    // created through jsr.three.createCanvas2D ('main', 300x150).
    expect(facts['canvas2dNative'], isTrue);
    // The 1024x1024 canvas resize reached the native delegate (the
    // software-pixel fallback was never needed).
    expect(facts['canvas2dWidth'], 1024);
    // The `<img>` factory guard is the exact throw site: reached and
    // thrown, with the module id prefix from the facade.
    expect(facts['imgGuardHit'], isTrue);
    expect(facts['imgGuardWidget'], 'three-raycaster-texture');
    // The official `_draw` body never ran: the constructor threw on the
    // img factory BEFORE reaching clearRect/stroke.
    expect(facts['drawCalls'], 0);

    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}

/// The raycaster-texture widget.js instrumented with a state-flag probe.
/// Findings live on `globalThis.__JSR_PROBE` (declared at the TOP of the
/// bundle — the example IIFE aborts mid-init, so a trailing epilogue
/// would never run) and are re-exported via `jsr.exportState({probe})`
/// from each probe site.
///
/// Four structural, name-independent injections (minified identifiers
/// drift on every re-prepare; `$` allowed in identifiers), each guarded
/// to match exactly once:
/// 1. the flutterGpu canvas2d factory (`native Flutter canvas2d is
///    unavailable` guard → `return Fe(jsr, 'main', {width:300,...})`),
/// 2. the `<img>` factory OffscreenCanvas guard (the pinned primary
///    failure),
/// 3. the official 1024x1024 CircleTexture canvas resize,
/// 4. the `CircleTexture._draw` prototype method entry (never reached).
String _raycasterProbeSource() {
  var source =
      File('example/widgets/three-raycaster-texture/widget.js').readAsStringSync();

  // Loud guard: every anchor must match exactly once in the re-minified
  // bundle, and the patch accumulates into [source] for the next anchor.
  void patchOnce(String label, RegExp re, String Function(Match) build) {
    final matches = re.allMatches(source).toList();
    expect(
      matches,
      hasLength(1),
      reason: '$label anchor drifted after a re-prepare: $re',
    );
    source = source.replaceRange(
      matches.single.start,
      matches.single.end,
      build(matches.single),
    );
  }

  // Probe state + exporter first: every later probe site re-publishes it.
  const prologue = 'globalThis.__JSR_PROBE={canvas2dNative:false,'
      'canvas2dWidth:0,imgGuardHit:false,imgGuardWidget:"",drawCalls:0};'
      'globalThis.__JSR_PROBE_EXPORT=function(){try{'
      'if(globalThis.jsr&&jsr.exportState)jsr.exportState({probe:{'
      'canvas2dNative:globalThis.__JSR_PROBE.canvas2dNative,'
      'canvas2dWidth:globalThis.__JSR_PROBE.canvas2dWidth,'
      'imgGuardHit:globalThis.__JSR_PROBE.imgGuardHit,'
      'imgGuardWidget:globalThis.__JSR_PROBE.imgGuardWidget,'
      'drawCalls:globalThis.__JSR_PROBE.drawCalls}})}catch(e){}};\n';

  // 1 — canvas2d factory: `... canvas2d is unavailable`);return F(jsr,
  //     "main",{width:300,height:150})}. Record + publish on the way in.
  patchOnce(
    'canvas2d factory',
    RegExp(
      r'native Flutter canvas2d is unavailable`\);'
      r'return ([A-Za-z_$][\w$]*)\(([A-Za-z_$][\w$]*),"main",'
      r'\{width:300,height:150\}\)\}',
    ),
    (m) => 'native Flutter canvas2d is unavailable`);'
        'globalThis.__JSR_PROBE.canvas2dNative=true,'
        'globalThis.__JSR_PROBE_EXPORT();'
        'return ${m[1]}(${m[2]},"main",{width:300,height:150})}',
  );

  // 2 — the img factory guard: `if(typeof <G>.OffscreenCanvas!="function")
  //     throw new Error(`${<W>}: local web textures require OffscreenCanvas`);
  //     ...`. Record + publish before the throw so the probe survives the
  //     module abort; the statements after the guard stay untouched.
  patchOnce(
    'img OffscreenCanvas guard',
    RegExp(
      r'if\(typeof ([A-Za-z_$][\w$]*)\.OffscreenCanvas!="function"\)'
      r'throw new Error\(`\$\{([A-Za-z_$][\w$]*)\}: local web textures '
      r'require OffscreenCanvas`\);',
    ),
    (m) => 'if(typeof ${m[1]}.OffscreenCanvas!="function"){'
        'globalThis.__JSR_PROBE.imgGuardHit=true,'
        'globalThis.__JSR_PROBE.imgGuardWidget=String(${m[2]}),'
        'globalThis.__JSR_PROBE_EXPORT();'
        'throw new Error(`\$\{${m[2]}\}: local web textures require '
        'OffscreenCanvas`)}',
  );

  // 3 — the official 1024x1024 canvas resize inside the CircleTexture
  //     constructor (property names are not minified): records that the
  //     native facade accepted the official canvas geometry.
  patchOnce(
    'canvas 1024 resize',
    RegExp(r'this\._canvas\.width=this\._canvas\.height=1024'),
    (m) => 'this._canvas.width='
        'globalThis.__JSR_PROBE.canvas2dWidth='
        'this._canvas.height=1024',
  );

  // 4 — the CircleTexture `_draw` prototype entry (property names are not
  //     minified, so `_draw:function(){` is stable; the constructor's
  //     `_draw()` call site is inlined as `this._draw()`, so this anchor
  //     only matches the prototype method itself).
  patchOnce(
    '_draw entry',
    RegExp(r'_draw:function\(\)\{'),
    (m) => '_draw:function(){globalThis.__JSR_PROBE.drawCalls++,'
        'globalThis.__JSR_PROBE_EXPORT();',
  );

  return prologue + source;
}
