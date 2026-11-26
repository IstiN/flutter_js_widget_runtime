import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'three_1b_engine.dart';

/// Shared F4e/F4g scaffolding (issue #8, segments F4e lifecycle and F4g
/// security, plan 4.4): the recording cinematic capture host and the
/// recording mock renderer JS. One definition — every f4eg_* test rides it
/// (duplication gate).
///
/// The mock renderer is render-dispatch-capable (composer passes run) but
/// allocates no GPU truth: F4g asserts NAMED errors, chain composition and
/// metadata hygiene on this lane; pixel truth stays on the real-ANGLE f4eg
/// lifecycle/context tests and the F2/F4b corpus.

/// Barrier host that records every (engineId, clock) capture call. [calls]
/// is the metadata surface the SEC-CINEMATIC secret scan asserts on;
/// [failNext] simulates a host without the capability (named
/// `cinematic.notCapturable`).
class F4egRecordingCaptureHost extends JsCinematicCaptureHost {
  final List<Map<String, dynamic>> calls = <Map<String, dynamic>>[];
  bool failNext = false;

  @override
  Future<Map<String, dynamic>> capture(
    String engineId,
    Map<String, dynamic> clock,
  ) async {
    if (failNext) {
      failNext = false;
      throw StateError('capture refused by host policy (F4eg test fixture)');
    }
    calls.add(<String, dynamic>{'engineId': engineId, ...clock});
    return <String, dynamic>{
      'path': '/tmp/f4eg-capture-${calls.length}.png',
      'width': 64,
      'height': 64,
    };
  }

  /// The full metadata record as JSON — the byte surface the secret scan
  /// runs over.
  String metadataJson() => jsonEncode(calls);
}

/// JS: the recording mock renderer for the fake-wire cinematic lane — one
/// parameterized definition. `f4egMockRenderer()` is the native lane
/// (`isJsrThreeRenderer` identity, `r1: true` capability, bounded target
/// budget); `f4egWebMockRenderer()` omits every GL2 evidence marker so each
/// GL2-gated capability of probeCapabilities reports absent (the
/// E2E-FALLBACK forced-absent set). Both lanes count every composer call
/// under `__calls` (the "the policy fired before the renderer was
/// allocated" observable of SEC-CINEMATIC-1).
const String f4egMockRendererJs = '''
function f4egMockRendererOf(gl2) {
  var calls = {};
  function count(k) { calls[k] = (calls[k] || 0) + 1; }
  var r = {
    autoClear: true,
    outputColorSpace: 'srgb',
    toneMapping: 0,
    toneMappingExposure: 1,
    capabilities: gl2 ? { backend: 'flutterGpu', r1: true, maxTextureSize: 16384 } : { maxTextureSize: 16384 },
    getSize: function (v) { return v.set(64, 64); },
    getPixelRatio: function () { return 1; },
    setClearColor: function () { count('setClearColor'); },
    getClearColor: function (c) { if (c && c.set) c.set(0x000000); return c; },
    getClearAlpha: function () { return 1; },
    setClearAlpha: function () {},
    setRenderTarget: function () { count('setRenderTarget'); },
    getRenderTarget: function () { return null; },
    clear: function () { count('clear'); },
    render: function () { count('render'); },
    dispose: function () { count('dispose'); }
  };
  if (gl2) r.isJsrThreeRenderer = true;
  r.__calls = calls;
  return r;
}
function f4egMockRenderer() { return f4egMockRendererOf(true); }
function f4egWebMockRenderer() { return f4egMockRendererOf(false); }
''';

/// JS: the final-pass capture `.then` tail shared by the F4e/F4g capture
/// widgets — records the capture result and exports the state (one
/// definition; the resolve arm additionally runs [extraInThen], and
/// [capturedExpr] is the per-widget result-record expression).
String f4egCaptureExportJs({
  required String clockExpr,
  required String capturedExpr,
  String extraInThen = '',
}) =>
    '''
    pipeline.captureFrame($clockExpr).then(function (r) {
      $extraInThen
      results.captured = $capturedExpr;
      jsr.exportState(results);
    }, function (e) {
      results.captureError = String((e && e.message) || e);
      jsr.exportState(results);
    });
''';

/// JS: the export + error-net tail of the f4eg widgets — one definition.
/// The success path exports before the catch ([preExport]); the catch arm
/// records [catchBodyJs] (default: the engine error into `results.error`)
/// and exports again. The capture widgets export from their `.then` arms
/// only and pass `preExport: false`.
String f4egExportTailJs({
  String catchBodyJs = '  results.error = String((e && e.message) || e);',
  bool preExport = true,
}) {
  final head = preExport ? '  jsr.exportState(results);\n' : '';
  return '''
$head} catch (e) {
$catchBodyJs
  jsr.exportState(results);
}''';
}

/// JS: the bare renderer + pipeline + size setup the hostile-input widgets
/// share — one definition; [size] is the JS size argument list.
String f4egPipelineSetupJs({String size = '48, 48'}) => '''
  var renderer = f4egMockRenderer();
  var pipeline = cin.createPipeline({
    renderer: renderer, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera()
  });
  pipeline.setSize($size);''';

/// JS: the custom-pass probe — a ShaderMaterial with shaders is built and
/// inserted into the composer chain; the denied-policy lane throws inside
/// the caller's own try/catch. One definition, shared by SEC-CINEMATIC-1
/// and SEC-CINEMATIC-1b.
const String f4egCustomPassProbeJs = '''
  var customMaterial = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: 'void main() { gl_Position = vec4(0.0); }',
    fragmentShader: 'void main() { gl_FragColor = vec4(1.0); }'
  });
  pipeline.composer.insertPass({ render: function () {}, setSize: function () {}, material: customMaterial }, 1);''';

/// The committed native bundle every fake-wire f4eg widget runs on (read
/// once, lazily).
final String _f4egBundle = File(
  'assets/three/jsr_three_native.js',
).readAsStringSync();

/// Runs an f4eg widget on the fake-wire 1B engine with the shared committed
/// bundle — one invocation definition for the whole corpus — and asserts the
/// selection every f4eg test states (1B picked). [seedLabel] prints the
/// deterministic-seed record the docs cite. Returns the exported state.
Future<Map<String, dynamic>?> runF4eg(
  String widgetJs, {
  String? seedLabel,
  bool allowCustomShaders = false,
  JsCinematicCaptureHost? cinematicCaptureHost,
  String? instanceId,
  Future<void> Function(String id, String key, dynamic value)?
  secretsSetHandler,
}) async {
  if (seedLabel != null) {
    // ignore: avoid_print
    print('f4eg fuzz seed ($seedLabel)');
  }
  final (_, reported, state) = await run1bWidgetEngine(
    widgetJs,
    threeSource: _f4egBundle,
    allowCustomShaders: allowCustomShaders,
    cinematicCaptureHost: cinematicCaptureHost,
    instanceId: instanceId,
    secretsSetHandler: secretsSetHandler,
  );
  expect(reported?.isAngle1b, isTrue);
  return state;
}
