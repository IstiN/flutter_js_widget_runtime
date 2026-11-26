import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import '../../tool/three/bench_1b.dart' show Shim;
import '../support/three_1b_engine.dart';
import '../support/three_1b_real_wire.dart';

// E2E-ALPHA-* / REG-ALPHA (issue #8, F4b, AC4): a transparent emissive
// scene preserves meaningful alpha through the stock UnrealBloomPass + the
// output pass, composites over a dark AND a light background without black
// fringes, and an opaque scene stays opaque over both. Measured on native
// 1B (the shared battery over ANGLE) and on Web (bare Chrome WebGL2 through
// tool/three/cases_f4b.sh — no ANGLE lane, no Dart proxy).
//
// The alpha readback comes from the composer output buffer
// (renderToScreen=false), not the presented surface: the 1B IOSurface
// readback is opaque, so the presented surface cannot carry the contract.
// The premultiplied-over composite is checked twice per leg: the JS
// expectation hash and the same operation drawn through GL (hash equality,
// or the documented >=99 % of pixels within d<=2 fallback).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final bundle = File('assets/three/jsr_three_web.js').readAsStringSync();
  final caseSource = File(
    'tool/three/cases_f4b/f4b_case_source.js',
  ).readAsStringSync();
  final missing = Shim.resolveProblem();

  // ── native 1B battery (memoized for the whole file) ────────────────────
  final wires = <Real1BWireHost>[];
  Future<Map<String, dynamic>?> runNative() async {
    final wire = Real1BWireHost(width: 320, height: 180)
      ..facadeBootstrapOverride = real1bFacadeBootstrap();
    wires.add(wire);
    final (w, sel, state, logs) = await run1bRealEngine(
      '$caseSource\n$_glue',
      bundle,
      width: 320,
      height: 180,
      exportTimeout: const Duration(seconds: 30),
    );
    expect(sel?.isAngle1b, isTrue, reason: 'the battery runs on native 1B');
    expect(
      widgetErrorLogs(logs),
      isEmpty,
      reason: 'no composite error may reach the __jsr_log lane',
    );
    expect(state?['fatal'], isNull, reason: '${state?['fatal']}');
    return state;
  }

  Future<Map<String, dynamic>?>? nativeMemo;
  Future<Map<String, dynamic>?> native() =>
      missing != null ? Future.value(null) : (nativeMemo ??= runNative());

  tearDownAll(() async {
    for (final w in wires) {
      w.dispose();
    }
  });

  // ── web leg (memoized for the whole file) ──────────────────────────────
  // The web reference channel comes from the environment (JSR_WEBGL_REF_
  // CHANNEL): CI keeps the corpus default (system Chrome on the macos-15
  // runners); hosts without Chrome set it to 'chromium'.
  Future<ProcessResult> web = missing != null
      ? Future.value(ProcessResult(0, 0, '', ''))
      : Process.run(
          'bash',
          ['tool/three/cases_f4b.sh'],
          environment: Platform.environment,
          runInShell: false,
        ).timeout(const Duration(minutes: 6));

  Map<String, dynamic>? webResultOf(ProcessResult r) {
    final out = r.stdout as String;
    final line = out
        .split('\n')
        .firstWhere((l) => l.startsWith('F4B_RESULT '), orElse: () => '');
    if (line.isEmpty) return null;
    return jsonDecode(line.substring('F4B_RESULT '.length))
        as Map<String, dynamic>;
  }

  test(
    'E2E-ALPHA-1: transparent scene keeps meaningful alpha through bloom '
    'and the output pass; composites over dark and light differ; GL '
    'composite matches the premultiplied expectation (native 1B)',
    () async {
      if (missing != null) return;
      final s = await native();
      _assertAlphaContract(s!, 'native 1B');
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 5)),
  );

  test(
    'E2E-ALPHA-2: the same alpha contract holds on real WebGL2 Chrome '
    '(bare page, no ANGLE lane, no Dart proxy)',
    () async {
      if (missing != null) return;
      final r = await web;
      expect(
        r.exitCode,
        0,
        reason: 'cases_f4b.sh gate failed\n${r.stdout}\n${r.stderr}',
      );
      final s = webResultOf(r);
      expect(s, isNotNull, reason: 'F4B_RESULT line present');
      final checks = (s!['checks'] as List).cast<Map<String, dynamic>>();
      for (final c in checks) {
        expect(c['ok'], isTrue, reason: 'web ${c['name']}: ${c['detail']}');
      }
      _assertAlphaContract(s, 'web');
      // the web capture path: no jsr.capture in the bare reference page —
      // the named rejection is the honest record (never an effect-free
      // capture)
      final capture = s['capture9'] as Map<String, dynamic>;
      expect(capture['ok'], isFalse);
      expect(capture['error'], 'cinematic.notCapturable');
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );

  test(
    'REG-ALPHA: the transparent capture and two-background composite '
    'cannot become opaque or develop black fringes — native 1B and web '
    'both satisfy the alpha contract',
    () async {
      if (missing != null) return;
      final n = await native();
      final r = await web;
      _assertAlphaContract(n!, 'native 1B (REG)');
      final s = webResultOf(r);
      expect(s, isNotNull);
      _assertAlphaContract(s!, 'web (REG)');
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 6)),
  );
}

void _assertAlphaContract(Map<String, dynamic> s, String leg) {
  final checks = (s['checks'] as List).cast<Map<String, dynamic>>();
  const names = [
    'alphaMeaningful',
    'compositesDifferWhereTransparent',
    'glCompositeMatchesExpectation',
    'opaqueSceneStaysOpaque',
  ];
  for (final name in names) {
    final c = checks.firstWhere(
      (c) => c['name'] == name,
      orElse: () => <String, dynamic>{},
    );
    expect(c, isNotEmpty, reason: '$leg: check $name present');
    expect(c['ok'], isTrue, reason: '$leg: $name: ${c['detail']}');
  }
  final alpha = s['alpha'] as Map<String, dynamic>;
  expect(
    (alpha['partialPixels'] as num).toInt(),
    greaterThan(0),
    reason: '$leg: meaningful transparency through bloom (not opaque)',
  );
  // The untouched background stays dominantly transparent — the battery's
  // corner check (mean corner alpha < 0.1). A hard zero-transparency count
  // is NOT the contract: the premultiplied bloom halo reaches every pixel
  // at half-float precision on some GPUs (measured native 1B: every pixel
  // nonzero, corners mean 0.038) while the composite stays clean.
  expect(
    (alpha['cornerMeanAlpha'] as num).toDouble(),
    lessThan(0.1),
    reason:
        '$leg: untouched background stays transparent '
        '(cornerMeanAlpha=${alpha['cornerMeanAlpha']})',
  );
  // no black fringes: the GL premultiplied-over composite matches the
  // expectation pixel-exactly or within the documented band
  expect(
    (alpha['glDarkPct'] as num).toDouble(),
    greaterThanOrEqualTo(99.0),
    reason:
        '$leg: GL composite vs premultiplied expectation '
        '(${alpha['glDarkHash']} vs ${alpha['darkHash']}, '
        'pct=${alpha['glDarkPct']})',
  );
  final opaque = s['opaque'] as Map<String, dynamic>;
  expect(
    (opaque['nonOpaquePixels'] as num).toInt(),
    0,
    reason: '$leg: the opaque control stays fully opaque',
  );
  expect(
    opaque['darkHash'],
    opaque['lightHash'],
    reason: '$leg: an opaque scene is background-independent',
  );
}

/// The native glue around the shared battery (same contract as the web
/// driver; the legs differ only in io.sleep and the capture hook).
const String _glue = '''
var __f4b = null;
try {
  __f4b = globalThis.__f4bBattery(globalThis.THREE, jsr.three.cinematic, {
    sleep: function (ms) { return new Promise(function (res) { setTimeout(res, ms); }); },
    captureFrame: function (clock, pipeline) {
      return pipeline.captureFrame(clock).then(
        function (res) { return { ok: true, frame: clock.frame, path: (res && res.path) || null }; },
        function (e) { return { ok: false, error: (e && e.name) || String(e) }; });
    }
  });
} catch (e) {
  jsr.exportState({ fatal: String((e && e.message) || e) });
}
Promise.resolve(__f4b).then(function (r) { jsr.exportState(r || { fatal: 'battery returned nothing' }); },
  function (e) { jsr.exportState({ fatal: String((e && e.message) || e) }); });
''';
