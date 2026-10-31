import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'skinning morph example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
    'webgl_animation_skinning_morph hand vertices match upstream skinning',
    (tester) async {
      final source =
          File(
            'example/widgets/three-animation-skinning-morph/widget.js',
          ).readAsStringSync() +
          _skinningParityProbe;
      final harness = await ThreeQuickjsExampleHarness.bootSource(
        tester,
        source: source,
        instanceId: 'three-skinning-morph-parity-test',
      );

      Map<String, dynamic>? probe;
      for (var attempt = 0; attempt < 300; attempt++) {
        final value = harness.engine.exportedState?['skinProbe'];
        if (value is Map) {
          probe = value.cast<String, dynamic>();
          if (probe['complete'] == true) break;
        }
        await harness.pumpFrame(tester);
      }
      expect(probe, isNotNull, reason: '${harness.engine.peekLogs()}');
      expect(
        probe!['complete'],
        isTrue,
        reason: '${harness.engine.peekLogs()}',
      );

      final meshes = (probe['meshes'] as Map).cast<String, dynamic>();
      expect(meshes.keys.toSet(), {'HandR_1', 'HandR_2', 'HandL_1', 'HandL_2'});
      var vertexTotal = 0;
      for (final entry in meshes.entries) {
        final result = (entry.value as Map).cast<String, dynamic>();
        final vertices = result['vertices'] as int;
        vertexTotal += vertices;
        expect(vertices, anyOf(256, 298), reason: entry.key);
        expect(result['minWeightSum'], closeTo(1, 1e-5), reason: entry.key);
        expect(result['maxWeightSum'], closeTo(1, 1e-5), reason: entry.key);
        expect(
          (result['maxError'] as num).toDouble(),
          lessThan(2e-5),
          reason:
              '${entry.key}: every CPU-skinned position must equal the '
              'official SkinnedMesh.getVertexPosition/applyBoneTransform result '
              'for the same '
              'original vertex, skeleton, and bind matrices',
        );
      }
      expect(vertexTotal, 1108);
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );
}

/// Captures each hand's pristine GLTF positions before R1 touches them, then
/// compares R1's uploaded positions with THREE's own getVertexPosition().
/// The original array is restored only while the independent upstream CPU
/// reference is evaluated; the actual R1 output is put back immediately.
const _skinningParityProbe = r'''
;(function(){
  const findings = { complete: false, meshes: {} };
  const exportState = jsr.exportState;
  jsr.exportState = function(state) {
    if (state && state.example === 'webgl_animation_skinning_morph') {
      state.skinProbe = findings;
    }
    return exportState.call(this, state);
  };
  const renderer = jsr.three.getCanvas('main').renderer;
  const render = renderer.render;
  const records = new Map();
  const wanted = new Set(['HandR_1', 'HandR_2', 'HandL_1', 'HandL_2']);
  renderer.render = function(scene, camera) {
    if (scene.matrixWorldAutoUpdate === true) scene.updateMatrixWorld();
    const current = [];
    scene.traverseVisible(function(mesh) {
      if (!mesh.isSkinnedMesh || !wanted.has(mesh.name)) return;
      current.push(mesh);
      if (!records.has(mesh)) records.set(mesh, {
        base: mesh.geometry.attributes.position.array.slice(), seen: 0, done: false
      });
    });
    const result = render.call(this, scene, camera);
    for (const mesh of current) {
      const record = records.get(mesh);
      if (record.done) continue;
      record.seen++;
      const geometry = mesh.geometry;
      const position = geometry.attributes.position;
      const skinWeight = geometry.attributes.skinWeight;
      const actual = position.array.slice();
      let maxError = 0, minWeightSum = Infinity, maxWeightSum = -Infinity;
      try {
        position.array.set(record.base);
        for (let vertex = 0; vertex < position.count; vertex++) {
          const expected = mesh.getVertexPosition(
            vertex, new mesh.position.constructor()
          );
          maxError = Math.max(maxError,
            Math.abs(expected.x - actual[vertex * 3]),
            Math.abs(expected.y - actual[vertex * 3 + 1]),
            Math.abs(expected.z - actual[vertex * 3 + 2]));
          let weightSum = 0;
          for (let component = 0; component < 4; component++) {
            weightSum += skinWeight.getComponent(vertex, component);
          }
          minWeightSum = Math.min(minWeightSum, weightSum);
          maxWeightSum = Math.max(maxWeightSum, weightSum);
        }
      } finally {
        position.array.set(actual);
      }
      findings.meshes[mesh.name] = {
        vertices: position.count,
        maxError: maxError,
        minWeightSum: minWeightSum,
        maxWeightSum: maxWeightSum
      };
      record.done = record.seen >= 3;
    }
    findings.complete = Object.keys(findings.meshes).length === wanted.size &&
      Array.from(records.values()).every(function(record) { return record.done; });
    return result;
  };
})();
''';
