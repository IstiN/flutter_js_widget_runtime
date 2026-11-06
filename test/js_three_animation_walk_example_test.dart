import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart'
    hide createFlutterGpuThreeHost;
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_host.dart'
    show createFlutterGpuThreeHost;
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_test_config.dart';
import 'support/widget_logic_helper.dart' show hasQuickjsNativeLib;
import 'support/widget_asset_loader.dart';

/// Regression pin for the webgl_animation_walk silent freeze.
///
/// The official module switches its controls on `event.code` ('ArrowUp',
/// 'ShiftLeft') and only starts the Walk/Run clips after a matching keydown.
/// The host keyboard lane used to deliver Flutter debugName codes ('Arrow
/// Up'), so every keypress silently matched no branch: the mixer ran, bones
/// moved (Idle clip), skin packets flowed, but the character never walked and
/// nothing warned. This test drives the real production lane
/// (`backend.dispatchHostEvent` with the exact `jsKeyEventPayload` shape) on
/// the real prepared widget and requires the Walk clip to take over.
Future<String> _patchedWalkSource() async {
  final src = (await File(
    'example/widgets/three-animation-walk/widget.js',
  ).readAsString()).trimRight();
  final rIdx = src.lastIndexOf('.render(');
  if (rIdx < 0) throw StateError('no render call found in walk bundle');
  final sceneVar = src.substring(rIdx + '.render('.length).split(',').first;
  const tail = '}})();';
  if (!src.endsWith(tail)) {
    throw StateError('unexpected walk bundle tail');
  }
  // Expose the example's scene at the bundle tail via a STRUCTURAL anchor
  // (the facade's final `.render(scene, camera)` call). The mixer, actions
  // and character group are NOT pinned by minified identifier — those names
  // drift on every re-prepare — the sampler captures the mixer through the
  // pinned upstream AnimationMixer.update hook instead and derives actions
  // and root group from it.
  final exposes = 'globalThis.__exampleSceneGet=function(){return $sceneVar};';
  return src.substring(0, src.length - tail.length) +
      '}$exposes})();' +
      _samplerJs;
}

/// Samples the walk example every 120ms. The first tick installs an
/// `AnimationMixer.prototype.update` hook (upstream pinned surface — stable
/// across re-minification); the next mixer.update reveals the live instance,
/// from which clip actions (`_actions`, upstream internals) and the
/// character root (`getRoot()`) are read. Leg bone pose comes from the
/// scene traversal.
const _samplerJs = '''
;(function(){
  var S = { ticks: 0 };
  function captureMixer() {
    if (globalThis.__walkMixer || !globalThis.THREE || !globalThis.THREE.AnimationMixer) return;
    var proto = globalThis.THREE.AnimationMixer.prototype;
    if (proto.__walkHooked) return;
    proto.__walkHooked = true;
    var orig = proto.update;
    proto.update = function(delta) {
      if (!globalThis.__walkMixer) globalThis.__walkMixer = this;
      return orig.call(this, delta);
    };
  }
  function actionsOf(mixer) {
    var list = mixer._actions || [];
    var out = {};
    for (var i = 0; i < list.length; i++) {
      var name = list[i].getClip().name;
      if (name === 'Walk' || name === 'Idle' || name === 'Run') out[name] = list[i];
    }
    return out;
  }
  function sample(){
    S.ticks++;
    var out = { tick: S.ticks };
    try {
      captureMixer();
      var m = globalThis.__walkMixer;
      if (!m) { out.mixer = null; console.log('WALKPROBE ' + JSON.stringify(out)); return; }
      out.mixerTime = +m.time.toFixed(3);
      var acts = actionsOf(m);
      var walk = acts.Walk, idle = acts.Idle;
      if (!walk || !idle) { out.clips = Object.keys(acts).join(','); console.log('WALKPROBE ' + JSON.stringify(out)); return; }
      out.walkW = +walk.getEffectiveWeight().toFixed(3);
      out.walkT = +walk.time.toFixed(3);
      out.idleW = +idle.getEffectiveWeight().toFixed(3);
      var leg = null;
      globalThis.__exampleSceneGet().traverse(function(o){
        if (!leg && o.isBone && o.name === 'mixamorigLeftUpLeg') leg = o;
      });
      if (leg) {
        out.legQ = [leg.quaternion.x, leg.quaternion.y, leg.quaternion.z, leg.quaternion.w]
          .map(function(v){ return +v.toFixed(5); });
      }
      // The mixer is rooted on the glTF scene; the example positions its
      // outer container group (scene.parent in the official module), so
      // read the container's translation.
      var g = m.getRoot();
      if (g && g.parent) g = g.parent;
      out.groupZ = +g.position.z.toFixed(4);
    } catch (e) { out.err = String(e); }
    console.log('WALKPROBE ' + JSON.stringify(out));
  }
  setInterval(sample, 120);
})();
''';

List<Map<String, dynamic>> _parseSamples(Iterable<String> logs) {
  final rows = <Map<String, dynamic>>[];
  final pattern = RegExp(r'WALKPROBE (\{.*\})\}$');
  for (final line in logs) {
    final match = pattern.firstMatch(line);
    if (match == null) continue;
    try {
      rows.add(jsonDecode(match.group(1)!) as Map<String, dynamic>);
    } on FormatException {
      // Truncated log line — ignore.
    }
  }
  return rows;
}

Future<List<String>> _pump(
  WidgetTester tester,
  QuickjsWidgetEngineBackend backend,
  int frames,
) async {
  for (var i = 0; i < frames; i++) {
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(milliseconds: 25)),
    );
    await tester.pump(const Duration(milliseconds: 16));
  }
  return backend.flushLogs().map((e) => e.toString()).toList(growable: false);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'webgl_animation_walk keyboard lane',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
    'webgl_animation_walk plays the Walk clip through the production key lane',
    (tester) async {
      final three = await tester.runAsync(
        () => rootBundle.loadString('assets/three/jsr_three_native.js'),
      );
      final widget = await tester.runAsync(_patchedWalkSource);
      final host = createFlutterGpuThreeHost(
        assetLoader: (engineId, url) =>
            widgetAssetLoader('three-animation-walk', url),
      );
      final config = threeTestConfig(
        engineId: 'walk-key-lane-test',
        widgetId: 'three-animation-walk',
        host: host,
        threeSource: three!,
        onRender: (_) {},
      );
      final backend = QuickjsWidgetEngineBackend(config: config);
      final engine = JsWidgetEngine(config: config.copyWith(backend: backend));
      await engine.init();
      await engine.run(widget!);

      // Boot: model loads, Idle clip plays, Walk must stay at weight 0.
      List<String> bootLogs = [];
      var bootSamples = <Map<String, dynamic>>[];
      for (var pumped = 0; pumped < 150 && bootSamples.isEmpty; pumped += 10) {
        bootLogs = bootLogs
            .followedBy(await _pump(tester, backend, 10))
            .toList();
        bootSamples = _parseSamples(
          bootLogs,
        ).where((r) => r['mixerTime'] != null).toList();
      }
      final boot = _parseSamples(bootLogs);
      final mixerRows = boot.where((r) => r['mixerTime'] != null).toList();
      expect(mixerRows, isNotEmpty, reason: 'Soldier.glb must load and mix');
      expect(
        boot.any((r) => r['err'] != null),
        isFalse,
        reason:
            'sampler must run clean: ${boot.where((r) => r["err"] != null)}',
      );
      final idleQuat = mixerRows.last['legQ'] as List;
      expect(
        mixerRows.last['walkW'],
        0.0,
        reason: 'Walk starts idle by design',
      );

      // Production keyboard lane — exactly what jsKeyEventPayload emits.
      backend.dispatchHostEvent('key', {
        'key': 'arrowUp',
        'code': 'Arrow Up', // Flutter physicalKey.debugName, unnormalized.
        'down': true,
        'repeat': false,
      });

      final walkLogs = await _pump(tester, backend, 110);
      final rows = _parseSamples(walkLogs);

      // No silent errors on the whole run.
      expect(
        (bootLogs.followedBy(walkLogs)).where((l) => l.contains('[E]')),
        isEmpty,
      );

      // The Walk clip must take over (0.5s official fade) and cycle.
      final walkWeights = rows.map((r) => r['walkW'] as num).toList();
      expect(
        walkWeights.any((w) => w > 0.9),
        isTrue,
        reason: 'Walk action must reach full weight, got $walkWeights',
      );
      final walkTimes = rows
          .map((r) => r['walkT'] as num)
          .where((t) => t > 0)
          .toSet()
          .toList();
      expect(
        walkTimes.length,
        greaterThan(4),
        reason: 'Walk action time must advance across frames: $walkTimes',
      );

      // Bones must actually move: max per-component quaternion delta between
      // the idle pose and any post-keydown sample (the freeze showed ~0.005).
      var maxBoneDelta = 0.0;
      for (final r in rows) {
        final q = r['legQ'] as List?;
        if (q == null) continue;
        for (var i = 0; i < 4; i++) {
          final d = ((q[i] as num) - (idleQuat[i] as num)).abs();
          if (d > maxBoneDelta) maxBoneDelta = d.toDouble();
        }
      }
      expect(
        maxBoneDelta,
        greaterThan(0.05),
        reason: 'walk cycle must swing mixamorigLeftUpLeg, got $maxBoneDelta',
      );

      // The character must translate at the official walk velocity.
      final groupZ = rows.map((r) => r['groupZ'] as num).toList();
      expect(groupZ.isNotEmpty, isTrue);
      expect(
        groupZ.last,
        greaterThan(1.0),
        reason: 'group must advance while walking, got $groupZ',
      );

      // Key release hands control back to Idle.
      backend.dispatchHostEvent('key', {
        'key': 'arrowUp',
        'code': 'Arrow Up',
        'down': false,
        'repeat': false,
      });
      final releaseLogs = await _pump(tester, backend, 30);
      final release = _parseSamples(releaseLogs);
      final lastIdle = release.last['idleW'] as num;
      expect(
        lastIdle,
        greaterThan(0.5),
        reason: 'Idle must fade back in after keyup, samples: $release',
      );

      await tester.runAsync(engine.dispose);
      await tester.pump();
    },
    timeout: const Timeout(Duration(seconds: 240)),
  );
}
