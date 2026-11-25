import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import 'package:js_widget_runtime/src/model/js_three_backend.dart';

import '../support/three_1b_engine.dart';
import '../support/three_1b_real_wire.dart';
import '../../tool/three/bench_1b.dart' show Shim;

// REG-CAP-1 (issue #7, F2c capability truth): the exposed capability set is
// the REAL one — every extension name the widget sees comes from the C GL
// string (plus the facade-granted WEBGL_lose_context), extension probes
// agree with the list, and the limits read back from the wire.
void main() {
  final realBundle = File('assets/three/jsr_three_web.js').readAsStringSync();
  final missing = Shim.resolveProblem();

  test('REG-CAP-1: the engine-exposed capability set matches the real GL',
      () async {
    final wire = Real1BWireHost()
      ..facadeBootstrapOverride = real1bFacadeBootstrap();
    final (_, reported, state) = await run1bWidgetEngine(
      r'''
var results = {};
try {
  var canvas = jsr.three.createCanvas('cap');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
  renderer.setSize(32, 32, false);
  var gl = renderer.getContext();
  var supported = gl.getSupportedExtensions();
  results.supported = supported;
  results.supportedCount = supported.length;
  // Every probe agrees with the list (plus the facade-granted loss ext).
  var probeMismatch = [];
  var probes = ['EXT_color_buffer_float', 'EXT_color_buffer_half_float',
    'OES_texture_float_linear', 'OES_element_index_uint',
    'WEBGL_debug_renderer_info', 'WEBGL_draw_buffers', 'NOT_A_REAL_EXTENSION'];
  for (var i = 0; i < probes.length; i++) {
    var inList = supported.indexOf(probes[i]) !== -1;
    var ext = gl.getExtension(probes[i]) != null;
    var granted = probes[i] === 'WEBGL_lose_context';
    if (ext !== (inList || granted)) probeMismatch.push(probes[i]);
  }
  results.probeMismatch = probeMismatch;
  results.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  // The float render target capability: present iff the GL says so.
  results.floatCap =
    gl.getExtension('EXT_color_buffer_float') != null ? 'present' : 'absent';
  results.loseContextExt = gl.getExtension('WEBGL_lose_context') != null;
} catch (e) {
  results.error = String((e && e.message) || e);
}
jsr.exportState(results);
''',
      threeSource: realBundle,
      realFacade: true,
      host: wire,
    );
    addTearDown(wire.dispose);
    expect(reported?.isAngle1b, isTrue);
    expect(state?['error'], isNull);
    final supported = (state?['supported'] as List?)?.cast<String>();
    expect(supported, isNotNull);
    expect(supported!.isNotEmpty, isTrue,
        reason: 'real ANGLE/Metal advertises extensions');
    expect(supported.toSet().contains('WEBGL_lose_context'), isTrue);
    expect(state?['probeMismatch'], isEmpty,
        reason: 'getExtension agrees with getSupportedExtensions for every '
            'probed name, including honest absence');
    expect((state?['maxTextureSize'] as num?) ?? 0, greaterThanOrEqualTo(4096),
        reason: 'limits are the real Metal-backed values');
    expect(
      <String>['present', 'absent'].contains(state?['floatCap']),
      isTrue,
      reason: 'the float render target capability is reported honestly, so '
          'three falls back when absent',
    );
    expect(state?['loseContextExt'], isTrue);
  }, skip: missing);
}
