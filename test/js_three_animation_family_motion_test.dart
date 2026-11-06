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
import 'support/widget_asset_loader.dart';
import 'support/widget_logic_helper.dart' show hasQuickjsNativeLib;

/// Family-level pin against the "silent no-animation" class.
///
/// The skeletal/morph animation siblings were once preview-swept by eye with a
/// single static frame, which cannot distinguish a live mixer from a frozen
/// one. This test boots each prepared example in the real QuickJS harness,
/// samples the scene graph across ~10s of pumped frames and requires the
/// bones (and skin packets) to actually move. A frozen AnimationMixer shows up
/// as exactly-zero deltas on every sample.
///
/// The probe is appended to the prepared bundle's tail: the last `.render(`
/// call names the module-local scene variable, and the two trailing braces
/// close `animate()` and the bundle IIFE, so the sampler gains
/// `globalThis.__exampleScene` without touching any other byte of the bundle.
const _sweepProbeJs = '''
;(function(){
  var S = { ticks: 0, skin: { count: 0 }, last: null };
  globalThis.__animS = S;
  if (typeof globalThis.__jsrSkinBytes === 'function') {
    var orig = globalThis.__jsrSkinBytes;
    globalThis.__jsrSkinBytes = function(name, data) {
      S.skin.count++;
      return orig(name, data);
    };
  }
  function qdist(a, b) {
    var d = Math.max(
      Math.abs(a[0]-b[0]), Math.abs(a[1]-b[1]),
      Math.abs(a[2]-b[2]), Math.abs(a[3]-b[3]));
    return +d.toFixed(6);
  }
  function sample(scene, out) {
    var boneDelta = 0, moving = 0;
    var morphDelta = 0;
    scene.traverse(function(o){
      if (o.isSkinnedMesh && o.skeleton && o.skeleton.bones.length) {
        var bones = o.skeleton.bones;
        S.last = S.last || {};
        for (var i = 0; i < bones.length; i++) {
          var q = bones[i].quaternion;
          var cur = [q.x, q.y, q.z, q.w];
          if (S.last[i]) {
            var d = qdist(cur, S.last[i]);
            if (d > boneDelta) boneDelta = d;
            if (d > 0) moving++;
          }
          S.last[i] = cur;
        }
      }
      if (o.morphTargetInfluences && o.morphTargetInfluences.length) {
        var inf = Array.prototype.slice.call(o.morphTargetInfluences);
        if (S.lastMorph) {
          for (var j = 0; j < inf.length; j++) {
            var md = Math.abs(inf[j] - S.lastMorph[j]);
            if (md > morphDelta) morphDelta = +md.toFixed(6);
          }
        }
        S.lastMorph = inf;
      }
    });
    out.boneDelta = boneDelta;
    out.movingBones = moving;
    out.morphDelta = morphDelta;
    out.skinCount = S.skin.count;
  }
  setInterval(function(){
    S.ticks++;
    var scene = null;
    try { scene = globalThis.__exampleScene && globalThis.__exampleScene(); } catch (e) {}
    if (!scene) return;
    var out = { tick: S.ticks };
    try { sample(scene, out); } catch (e) { out.sampleErr = String(e); }
    console.log('ANIMPROBE ' + JSON.stringify(out));
  }, 120);
})();
''';

Future<String> _patchedSweepSource(String widgetPath) async {
  final src = (await File(widgetPath).readAsString()).trimRight();
  final rIdx = src.lastIndexOf('.render(');
  if (rIdx < 0) throw StateError('no render call found in $widgetPath');
  final sceneVar = src.substring(rIdx + '.render('.length).split(',').first;
  const tail = '}})();';
  if (!src.endsWith(tail)) {
    throw StateError(
      'unexpected widget tail: ...${src.substring(src.length - 40)}',
    );
  }
  return src.substring(0, src.length - tail.length) +
      '}globalThis.__exampleScene=function(){return $sceneVar};})();' +
      _sweepProbeJs;
}

final RegExp _samplePattern = RegExp(r'ANIMPROBE (\{.*\})\}$');

List<Map<String, dynamic>> _parseSamples(Iterable<String> logs) {
  final rows = <Map<String, dynamic>>[];
  for (final line in logs) {
    final match = _samplePattern.firstMatch(line);
    if (match == null) continue;
    try {
      rows.add(jsonDecode(match.group(1)!) as Map<String, dynamic>);
    } on FormatException {
      // Truncated console line — skip.
    }
  }
  return rows;
}

Future<void> _pumpFrames(WidgetTester tester, int frames) async {
  for (var i = 0; i < frames; i++) {
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(milliseconds: 25)),
    );
    await tester.pump(const Duration(milliseconds: 16));
  }
}

Future<List<Map<String, dynamic>>> _sweepWidget(
  WidgetTester tester, {
  required String widgetId,
}) async {
  final three = await tester.runAsync(
    () => rootBundle.loadString('assets/three/jsr_three_native.js'),
  );
  final widget = await tester.runAsync(
    () => _patchedSweepSource('example/widgets/$widgetId/widget.js'),
  );
  final host = createFlutterGpuThreeHost(
    assetLoader: (engineId, url) => widgetAssetLoader(widgetId, url),
  );
  final config = threeTestConfig(
    engineId: '$widgetId-motion-test',
    widgetId: widgetId,
    host: host,
    threeSource: three!,
    onRender: (_) {},
  );
  final backend = QuickjsWidgetEngineBackend(config: config);
  final engine = JsWidgetEngine(config: config.copyWith(backend: backend));
  await engine.init();
  await engine.run(widget!);

  final logs = <String>[];
  var samples = <Map<String, dynamic>>[];
  // Pump until the scene produces motion evidence (or a hard cap so a frozen
  // example still fails with a full sample set instead of timing out empty).
  for (var pumped = 0; pumped < 400 && samples.length < 8; pumped += 20) {
    await _pumpFrames(tester, 20);
    logs.addAll(
      backend.flushLogs().map((e) => e.toString()).toList(growable: false),
    );
    samples = _parseSamples(logs);
  }
  await tester.runAsync(engine.dispose);
  await tester.pump();
  return samples;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    for (final widgetId in _sweepTargets) {
      test(
        'animation family motion: $widgetId',
        () {},
        skip: 'QuickJS native library is not available',
      );
    }
    return;
  }

  for (final widgetId in _sweepTargets) {
    testWidgets('animation family motion: $widgetId', (tester) async {
      final samples = await _sweepWidget(tester, widgetId: widgetId);
      expect(
        samples,
        isNotEmpty,
        reason: '$widgetId must produce animation samples',
      );
      expect(
        samples.where((r) => r['sampleErr'] != null),
        isEmpty,
        reason: '$widgetId sampler must run clean',
      );
      final maxBone = samples
          .map((r) => (r['boneDelta'] as num?) ?? 0)
          .reduce((a, b) => a > b ? a : b);
      final maxMorph = samples
          .map((r) => (r['morphDelta'] as num?) ?? 0)
          .reduce((a, b) => a > b ? a : b);
      final movingTicks = samples
          .where(
            (r) =>
                ((r['boneDelta'] as num?) ?? 0) > 0 ||
                ((r['morphDelta'] as num?) ?? 0) > 0,
          )
          .length;
      final skinPackets = samples.fold(
        0,
        (int sum, r) => sum + (((r['skinCount'] as num?) ?? 0).toInt()),
      );
      expect(
        movingTicks,
        greaterThan(0),
        reason:
            '$widgetId must animate: maxBoneDelta=$maxBone '
            'maxMorphDelta=$maxMorph samples=${samples.length}',
      );
      expect(
        skinPackets,
        greaterThan(0),
        reason: '$widgetId skinned meshes must stream skin packets',
      );
    }, timeout: const Timeout(Duration(seconds: 240)));
  }
}

const _sweepTargets = [
  'three-animation-skinning-blending',
  'three-animation-skinning-additive-blending',
  'three-animation-skinning-morph',
  'three-animation-keyframes',
  'three-animation-multiple',
];
