import 'dart:convert';

import 'package:js_widget_runtime/js_widget_runtime.dart';

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

/// JS: a recording mock renderer for the fake-wire cinematic lane. Native
/// lane identity (`isJsrThreeRenderer`) with a bounded target budget, and
/// every composer call counted under `__calls` (the "the policy fired
/// before the renderer was allocated" observable of SEC-CINEMATIC-1).
const String f4egMockRendererJs = '''
function f4egMockRenderer() {
  var calls = {};
  function count(k) { calls[k] = (calls[k] || 0) + 1; }
  var r = {
    autoClear: true,
    isJsrThreeRenderer: true,
    outputColorSpace: 'srgb',
    toneMapping: 0,
    toneMappingExposure: 1,
    capabilities: { backend: 'flutterGpu', r1: true, maxTextureSize: 16384 },
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
  r.__calls = calls;
  return r;
}
''';

/// JS: a web-lane mock renderer WITHOUT GL2 evidence — every GL2-gated
/// capability of probeCapabilities reports absent (the E2E-FALLBACK
/// forced-absent capability set).
const String f4egWebMockRendererJs = '''
function f4egWebMockRenderer() {
  var calls = {};
  function count(k) { calls[k] = (calls[k] || 0) + 1; }
  var r = {
    autoClear: true,
    outputColorSpace: 'srgb',
    toneMapping: 0,
    toneMappingExposure: 1,
    capabilities: { maxTextureSize: 16384 },
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
  r.__calls = calls;
  return r;
}
''';
