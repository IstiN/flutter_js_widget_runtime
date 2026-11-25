import 'package:flutter/foundation.dart';

import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/model/js_three_backend.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_host.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_backend.dart';

/// 1B backend selection ladder (issue #7 / ADR-0003 decision 2).
///
/// Probes run in order and all must pass for angle1b:
/// - (a) the engine is a QuickJS backend with the synchronous byte lane
///   (`JsWidgetEngineBackend.hasSyncBinaryLane`); on the flutter_js backend
///   1B is never selected (reason: `sync channel required`).
/// - (b) the native `libangle_1b` loads and (c) the ANGLE display for the
///   platform type is created — one cached probe through
///   [JsThree1BWire.probeNative] on the configured [JsRuntimeConfig.threeHost].
/// - (d) on Android, API level >= 28.
///
/// `r1` requested → r1 unconditionally. A failed probe selects r1 **before
/// the renderer is allocated** (no ANGLE initialization, no facade
/// bootstrap, no JSR3D-T1 wire change) and reports the reason through
/// [JsRuntimeConfig.onThreeBackendSelected].
JsThreeBackendSelection selectThreeBackend({
  required JsRuntimeConfig config,
  required JsWidgetEngineBackend backend,
}) {
  final requested = config.threeBackend;
  if (requested == JsThreeBackend.r1) {
    return JsThreeBackendSelection(
      requested: requested,
      selected: JsThreeBackend.r1,
    );
  }
  if (!backend.hasSyncBinaryLane) {
    return _fallback(requested, 'sync channel required');
  }
  final JsThree1BWire? wire = config.threeHost is JsThree1BWire
      ? config.threeHost! as JsThree1BWire
      : null;
  if (wire == null) {
    return _fallback(requested, '1B host not configured');
  }
  final nativeReason = wire.probeNative();
  if (nativeReason != null) {
    return _fallback(requested, nativeReason);
  }
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    final api = wire.androidApiLevel;
    if (api == null || api < 28) {
      return _fallback(
        requested,
        'android api level ${api ?? 'unknown'} < 28',
      );
    }
  }
  return JsThreeBackendSelection(
    requested: requested,
    selected: JsThreeBackend.angle1b,
  );
}

JsThreeBackendSelection _fallback(JsThreeBackend requested, String reason) =>
    JsThreeBackendSelection(
      requested: requested,
      selected: JsThreeBackend.r1,
      reason: reason,
    );

/// Host policy glue for custom shaders (ADR-0003 decision 3), evaluated by
/// the engine wrapper after the THREE bundle and the 1B facade bootstrap
/// and before the host bootstrap / widget code.
///
/// When [allowCustomShaders] is false, `THREE.ShaderMaterial`,
/// `THREE.RawShaderMaterial` and `onBeforeCompile` throw
/// `three.unsupported: custom shaders are disabled by host policy` — at
/// material construction, before the renderer allocates its programs. The
/// `isShaderMaterial` flag-based identity upstream relies on stays intact
/// (the blocked constructors share the original prototype chain).
String three1bPolicyJs({required bool allowCustomShaders}) => '''
(function () {
  'use strict';
  var root = typeof globalThis !== 'undefined' ? globalThis : this;
  if (typeof THREE === 'undefined') return;
  if (${allowCustomShaders ? 'true' : 'false'}) return;
  var msg = 'three.unsupported: custom shaders are disabled by host policy';
  ['ShaderMaterial', 'RawShaderMaterial'].forEach(function (name) {
    var original = THREE[name];
    if (typeof original !== 'function') return;
    var blocked = function JsrBlockedMaterial() { throw new Error(msg); };
    if (original.prototype) blocked.prototype = Object.create(original.prototype);
    THREE[name] = blocked;
  });
  if (THREE.Material && THREE.Material.prototype) {
    Object.defineProperty(THREE.Material.prototype, 'onBeforeCompile', {
      set: function () { throw new Error(msg); },
      get: function () { return undefined; },
      configurable: true
    });
  }
})();
''';
