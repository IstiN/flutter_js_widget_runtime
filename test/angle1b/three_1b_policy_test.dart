import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/model/js_three_backend.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import '../support/fake_three_host.dart';

/// Host shader policy and wrapper wiring (issue #7 / ADR-0003 decisions 2,
/// 3, 4): the policy JS, the selection report and the REG-1A-1 guarantee
/// (no ANGLE probe without a 1B selection).
///
/// The real-bundle shader integration (IT-SHADER-*, web bundle over ANGLE)
/// is CI territory (quality-macos, F2b); here the policy is proven against
/// a stub THREE through the real engine stack.
void main() {
  const String stubThreeSource = '''
(function () {
  var root = typeof globalThis !== 'undefined' ? globalThis : this;
  function Material() {}
  function ShaderMaterial() {}
  ShaderMaterial.prototype = Object.create(Material.prototype);
  ShaderMaterial.prototype.isShaderMaterial = true;
  function RawShaderMaterial() {}
  RawShaderMaterial.prototype = Object.create(Material.prototype);
  RawShaderMaterial.prototype.isRawShaderMaterial = true;
  function MeshBasicMaterial() {}
  MeshBasicMaterial.prototype = Object.create(Material.prototype);
  root.THREE = {
    Material: Material,
    ShaderMaterial: ShaderMaterial,
    RawShaderMaterial: RawShaderMaterial,
    MeshBasicMaterial: MeshBasicMaterial
  };
})();
''';

  const String widgetSource = '''
var results = {};
try {
  var sm = new THREE.ShaderMaterial();
  results.shaderMaterial = sm.isShaderMaterial === true ? 'constructed' : 'wrong-identity';
} catch (e) {
  results.shaderMaterial = String(e.message);
}
try {
  var rsm = new THREE.RawShaderMaterial();
  results.rawShaderMaterial = rsm.isRawShaderMaterial === true ? 'constructed' : 'wrong-identity';
} catch (e) {
  results.rawShaderMaterial = String(e.message);
}
try {
  var mesh = new THREE.MeshBasicMaterial();
  mesh.onBeforeCompile = function () {};
  results.onBeforeCompile = 'set';
} catch (e) {
  results.onBeforeCompile = String(e.message);
}
jsr.exportState(results);
''';

  Fake1BWireHost wire({String? probeReason}) =>
      Fake1BWireHost()..probeReason = probeReason;

  Future<(Fake1BWireHost, JsThreeBackendSelection?, Map<String, dynamic>?)>
  runWidget({
    required JsThreeBackend backend,
    required bool allowCustomShaders,
    Fake1BWireHost? host,
  }) async {
    debugDefaultTargetPlatformOverride = TargetPlatform.macOS;
    final w = host ?? wire();
    JsThreeBackendSelection? reported;
    final engine = JsWidgetEngine(
      config: JsRuntimeConfig(
        onRender: (_) {},
        onSetTitle: (_) {},
        onStorageUpdate: (_) {},
        backendFactory: (cfg) => QuickjsWidgetEngineBackend(config: cfg),
        threeEnabled: true,
        threeSource: stubThreeSource,
        threeBackend: backend,
        threeHost: w,
        allowCustomShaders: allowCustomShaders,
        onThreeBackendSelected: (s) => reported = s,
      ),
    );
    try {
      await engine.run(widgetSource);
      return (w, reported, engine.exportedState);
    } finally {
      debugDefaultTargetPlatformOverride = null;
      await engine.dispose();
    }
  }

  test('IT-SHADER policy: blocked constructors and onBeforeCompile throw with '
      'the policy message before the renderer is allocated', () async {
    final (w, reported, state) = await runWidget(
      backend: JsThreeBackend.angle1b,
      allowCustomShaders: false,
    );
    expect(reported?.isAngle1b, isTrue);
    expect(w.bootstrapEnsured, isTrue);
    expect(
      state?['shaderMaterial'],
      'three.unsupported: custom shaders are disabled by host policy',
    );
    expect(
      state?['rawShaderMaterial'],
      'three.unsupported: custom shaders are disabled by host policy',
    );
    expect(
      state?['onBeforeCompile'],
      'three.unsupported: custom shaders are disabled by host policy',
    );
  });

  test(
    'allowCustomShaders: true permits construction with the flag identity',
    () async {
      final (_, reported, state) = await runWidget(
        backend: JsThreeBackend.angle1b,
        allowCustomShaders: true,
      );
      expect(reported?.isAngle1b, isTrue);
      expect(state?['shaderMaterial'], 'constructed');
      expect(state?['rawShaderMaterial'], 'constructed');
      expect(state?['onBeforeCompile'], 'set');
    },
  );

  test(
    'REG-1A-1: r1 selection never probes ANGLE and injects no policy',
    () async {
      final (w, reported, state) = await runWidget(
        backend: JsThreeBackend.r1,
        allowCustomShaders: false,
      );
      expect(reported?.selected, JsThreeBackend.r1);
      expect(reported?.reason, isNull);
      expect(w.probeCalls, 0, reason: 'no ANGLE touch on r1');
      expect(w.bootstrapEnsured, isFalse, reason: 'no facade on r1');
      // No policy glue on r1: the stub constructors stay constructable.
      expect(state?['shaderMaterial'], 'constructed');
      expect(state?['rawShaderMaterial'], 'constructed');
    },
  );

  test(
    'auto falling back to r1 reports the probe reason and skips the facade',
    () async {
      final (w, reported, state) = await runWidget(
        backend: JsThreeBackend.auto,
        allowCustomShaders: false,
        host: wire(probeReason: 'a1b_init failed (-5)'),
      );
      expect(reported?.requested, JsThreeBackend.auto);
      expect(reported?.selected, JsThreeBackend.r1);
      expect(reported?.reason, 'a1b_init failed (-5)');
      expect(w.bootstrapEnsured, isFalse);
      expect(state?['shaderMaterial'], 'constructed');
    },
  );
}
