import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

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

  testWidgets(
    'webgl_animation_keyframes submits the complete city without transient skin culling',
    (tester) async {
      final source =
          File(
            'example/widgets/three-animation-keyframes/widget.js',
          ).readAsStringSync() +
          _keyframeCityProbe;
      final harness = await ThreeQuickjsExampleHarness.bootSource(
        tester,
        source: source,
        instanceId: 'three-keyframe-city-test',
        // LittlestTokyo.glb ships as an external widget asset (>1.5MB).
        assetLoader: widgetDirAssetLoader(
          'example/widgets/three-animation-keyframes',
        ),
      );
      await harness.pumpUntil(tester, (state, plan) {
        final probe = harness.engine.exportedState?['keyframeCityProbe'];
        return probe is Map && (probe['frames'] as num? ?? 0) >= 3;
      }, attempts: 100);
      final probe = (harness.engine.exportedState?['keyframeCityProbe'] as Map?)
          ?.cast<String, dynamic>();
      expect(probe, isNotNull, reason: '${harness.engine.peekLogs()}');
      expect(probe!['meshCount'], 72);
      expect(probe['triangles'], 141814);
      expect(probe['frustumCulledMeshes'], 0);
      final cameraPosition = (probe['cameraPosition'] as List).cast<num>();
      expect(cameraPosition[0], closeTo(5, 1e-9));
      expect(cameraPosition[1], closeTo(2, 1e-9));
      expect(cameraPosition[2], closeTo(8, 1e-9));
      expect(probe['cityScale'], closeTo(0.01, 1e-6));
      expect(probe['skyScale'], closeTo(50, 1e-9));
      expect(probe['background'], 0xc5e8f2);
      final plan = const ThreeDrawPlanner().plan(harness.state!);
      expect(plan.mainDrawCallCount, 72);
      expect(plan.mainTriangleCount, 141814);
      expect(plan.hemisphereLights, hasLength(1));
      expect(plan.directionalLights, hasLength(1));
      expect(plan.hemisphereLights.single.intensity, 2);
      expect(plan.directionalLights.single.intensity, 3);
      expect(plan.diagnostics.warnings, isEmpty);
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );

  testWidgets(
    'webgl_morphtargets_webcam preserves official morph geometry and framing',
    (tester) async {
      final source =
          File(
            'example/widgets/three-morphtargets-webcam/widget.js',
          ).readAsStringSync() +
          _webcamMorphParityProbe;
      final harness = await ThreeQuickjsExampleHarness.bootSource(
        tester,
        source: source,
        instanceId: 'three-webcam-morph-parity-test',
        // facecap.glb ships as an external widget asset (>1.5MB).
        assetLoader: widgetDirAssetLoader(
          'example/widgets/three-morphtargets-webcam',
        ),
      );
      await harness.pumpUntil(tester, (state, plan) {
        final probe = harness.engine.exportedState?['webcamMorphProbe'];
        return probe is Map && probe['complete'] == true;
      }, attempts: 100);
      final probe = (harness.engine.exportedState?['webcamMorphProbe'] as Map?)
          ?.cast<String, dynamic>();
      expect(probe, isNotNull, reason: '${harness.engine.peekLogs()}');
      expect(
        probe!['complete'],
        isTrue,
        reason: '${harness.engine.peekLogs()}',
      );
      expect(probe['interleavedPosition'], isFalse);
      expect(probe['interleavedNormal'], isFalse);
      expect(probe['morphCount'], 52);
      expect(probe['normalMaterial'], isTrue);
      expect(probe['texturedLambertEyes'], 2);
      expect((probe['maxPositionError'] as num).toDouble(), lessThan(0.002));
      expect(
        (probe['maxNormalError'] as num).toDouble(),
        lessThan(0.00001),
        reason: '$probe',
      );
      expect((probe['centerNdcX'] as num).toDouble(), closeTo(0, 0.02));
      expect((probe['centerNdcY'] as num).toDouble(), closeTo(0, 0.12));
      expect(
        harness.engine.peekLogs().where(
          (entry) => (entry['msg'] as String).contains(
            'MediaPipe webcam tracking is unavailable',
          ),
        ),
        isNotEmpty,
      );
      final plan = const ThreeDrawPlanner().plan(harness.state!);
      expect(plan.mainTriangleCount, 8044);
      expect(plan.ambient.r, 5);
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

const _keyframeCityProbe = r'''
;(function(){
  const findings = { frames: 0 };
  const exportState = jsr.exportState;
  const prototype = THREE.WebGLRenderer.prototype;
  const render = prototype.render;
  prototype.render = function(scene, camera) {
    const result = render.call(this, scene, camera);
    let meshCount = 0, triangles = 0, frustumCulledMeshes = 0, cityScale = 0;
    let skyScale = 0;
    scene.traverseVisible(function(mesh) {
      if (mesh.isSky) skyScale = mesh.scale.x;
      if (!mesh.isMesh) return;
      meshCount++;
      if (mesh.frustumCulled) frustumCulledMeshes++;
      triangles += (mesh.geometry.index ? mesh.geometry.index.count :
        mesh.geometry.attributes.position.count) / 3;
      if (mesh.name === 'Object224_normal_0') {
        cityScale = new THREE.Vector3().setFromMatrixScale(mesh.matrixWorld).x;
      }
    });
    findings.frames++;
    findings.meshCount = meshCount;
    findings.triangles = triangles;
    findings.frustumCulledMeshes = frustumCulledMeshes;
    findings.cityScale = cityScale;
    findings.skyScale = skyScale;
    findings.background = scene.background && scene.background.isColor ?
      scene.background.getHex() : null;
    findings.cameraPosition = camera.position.toArray();
    exportState.call(this, { keyframeCityProbe: findings });
    return result;
  };
})();
''';

/// Uses THREE's own morph formula on pristine input as an independent reference.
/// Integer quantized output may differ by one position quantum; normals are
/// compared after the same normalization performed by the vertex shader.
const _webcamMorphParityProbe = r'''
;(function(){
  const findings = { complete: false };
  const exportState = jsr.exportState;
  const prototype = THREE.WebGLRenderer.prototype;
  const render = prototype.render;
  let record = null;
  prototype.render = function(scene, camera) {
    let head = null, texturedLambertEyes = 0;
    scene.traverseVisible(function(mesh) {
      if (mesh.name === 'mesh_2') head = mesh;
    });
    if (head && !record) {
      const position = head.geometry.attributes.position;
      const normal = head.geometry.attributes.normal;
      record = {
        basePosition: position.array.slice(),
        baseNormal: normal.array.slice(),
        interleavedPosition: !!position.isInterleavedBufferAttribute,
        interleavedNormal: !!normal.isInterleavedBufferAttribute
      };
    }
    const result = render.call(this, scene, camera);
    scene.traverseVisible(function(mesh) {
      if (mesh.isMesh && mesh.material && mesh.material.isMeshLambertMaterial &&
          mesh.material.map) texturedLambertEyes++;
    });
    if (!head || !record || findings.complete) return result;
    const geometry = head.geometry;
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    const actualPosition = position.array.slice();
    const actualNormal = normal.array.slice();
    const actualX = new Float64Array(position.count);
    const actualY = new Float64Array(position.count);
    const actualZ = new Float64Array(position.count);
    const actualNx = new Float64Array(position.count);
    const actualNy = new Float64Array(position.count);
    const actualNz = new Float64Array(position.count);
    for (let i = 0; i < position.count; i++) {
      actualX[i] = position.getComponent(i, 0);
      actualY[i] = position.getComponent(i, 1);
      actualZ[i] = position.getComponent(i, 2);
      actualNx[i] = normal.getComponent(i, 0);
      actualNy[i] = normal.getComponent(i, 1);
      actualNz[i] = normal.getComponent(i, 2);
    }
    let maxPositionError = 0, maxNormalError = 0, worstNormal = null;
    try {
      position.array.set(record.basePosition);
      normal.array.set(record.baseNormal);
      const expected = new THREE.Vector3();
      const expectedNormal = new THREE.Vector3();
      const morph = new THREE.Vector3();
      const sum = new THREE.Vector3();
      const morphNormals = geometry.morphAttributes.normal || [];
      for (let i = 0; i < position.count; i++) {
        head.getVertexPosition(i, expected);
        maxPositionError = Math.max(maxPositionError,
          Math.abs(expected.x - actualX[i]),
          Math.abs(expected.y - actualY[i]),
          Math.abs(expected.z - actualZ[i]));
        expectedNormal.fromBufferAttribute(normal, i);
        sum.set(0, 0, 0);
        for (let t = 0; t < morphNormals.length; t++) {
          const weight = head.morphTargetInfluences[t];
          if (weight === 0) continue;
          morph.fromBufferAttribute(morphNormals[t], i);
          if (geometry.morphTargetsRelative) sum.addScaledVector(morph, weight);
          else sum.addScaledVector(morph.sub(expectedNormal), weight);
        }
        expectedNormal.add(sum).normalize();
        const length = Math.hypot(actualNx[i], actualNy[i], actualNz[i]) || 1;
        const normalError = Math.max(
          Math.abs(expectedNormal.x - actualNx[i] / length),
          Math.abs(expectedNormal.y - actualNy[i] / length),
          Math.abs(expectedNormal.z - actualNz[i] / length));
        if (normalError > maxNormalError) {
          maxNormalError = normalError;
          worstNormal = { vertex: i, expected: expectedNormal.toArray(),
            actual: [actualNx[i] / length, actualNy[i] / length, actualNz[i] / length],
            base: [normal.getComponent(i, 0), normal.getComponent(i, 1), normal.getComponent(i, 2)],
            morphNormalized: morphNormals.map(attribute => attribute.normalized),
            morphSamples: morphNormals.slice(0, 12).map(attribute =>
              [attribute.getComponent(i, 0), attribute.getComponent(i, 1), attribute.getComponent(i, 2)]),
            influences: head.morphTargetInfluences.slice(0, 12) };
        }
      }
    } finally {
      position.array.set(actualPosition);
      normal.array.set(actualNormal);
    }
    const center = geometry.boundingSphere.center.clone()
      .applyMatrix4(head.matrixWorld)
      .applyMatrix4(camera.matrixWorldInverse)
      .applyMatrix4(camera.projectionMatrix);
    findings.interleavedPosition = record.interleavedPosition;
    findings.interleavedNormal = record.interleavedNormal;
    findings.morphCount = head.morphTargetInfluences.length;
    findings.normalMaterial = !!head.material.isMeshNormalMaterial;
    findings.texturedLambertEyes = texturedLambertEyes;
    findings.maxPositionError = maxPositionError;
    findings.maxNormalError = maxNormalError;
    findings.worstNormal = worstNormal;
    findings.centerNdcX = center.x;
    findings.centerNdcY = center.y;
    findings.complete = true;
    exportState.call(this, { webcamMorphProbe: findings });
    return result;
  };
})();
''';
