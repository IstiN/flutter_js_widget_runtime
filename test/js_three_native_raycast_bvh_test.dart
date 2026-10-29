import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets('native indexed BVH preserves hits, face ids and invalidation', (
    tester,
  ) async {
    const source = r'''
(() => {
  const geometry = new THREE.PlaneGeometry(100, 100, 64, 64);
  const material = new THREE.MeshBasicMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.updateMatrixWorld(true);
  let verifiedHits = 0;
  for (let i = 0; i < 40; i++) {
    const x = -43 + (i % 8) * 12;
    const y = -42 + Math.floor(i / 8) * 19;
    const ray = new THREE.Raycaster(
      new THREE.Vector3(x, y, 10),
      new THREE.Vector3(0, 0, -1)
    );
    const hit = ray.intersectObject(mesh)[0];
    if (!hit) throw new Error('BVH lost a plane intersection at ' + i);
    if (Math.abs(hit.point.x - x) > 0.0001 ||
        Math.abs(hit.point.y - y) > 0.0001 ||
        Math.abs(hit.point.z) > 0.0001 ||
        Math.abs(hit.distance - 10) > 0.0001) {
      throw new Error('BVH changed the intersection point or distance');
    }
    const faceOffset = hit.faceIndex * 3;
    if (hit.face.a !== geometry.index.getX(faceOffset) ||
        hit.face.b !== geometry.index.getX(faceOffset + 1) ||
        hit.face.c !== geometry.index.getX(faceOffset + 2)) {
      throw new Error('BVH did not restore the upstream face index');
    }
    verifiedHits++;
  }
  const initial = THREE.getNativeRaycastDiagnostics();
  if (initial.builds !== 1 || initial.queries !== 40) {
    throw new Error('indexed plane did not reuse its BVH: ' + JSON.stringify(initial));
  }

  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) position.setZ(i, 3);
  position.needsUpdate = true;
  geometry.boundingBox = null;
  geometry.boundingSphere = null;
  const movedRay = new THREE.Raycaster(
    new THREE.Vector3(0, 0, 10),
    new THREE.Vector3(0, 0, -1)
  );
  const movedHit = movedRay.intersectObject(mesh)[0];
  if (!movedHit || Math.abs(movedHit.point.z - 3) > 0.0001 ||
      Math.abs(movedHit.distance - 7) > 0.0001) {
    throw new Error('position update did not invalidate the BVH');
  }
  const updated = THREE.getNativeRaycastDiagnostics();
  if (updated.builds !== 2 || updated.queries !== 41) {
    throw new Error('updated geometry did not rebuild exactly once');
  }

  const plain = new THREE.Mesh(geometry.toNonIndexed(), material);
  plain.updateMatrixWorld(true);
  const plainHit = movedRay.intersectObject(plain)[0];
  if (!plainHit || Math.abs(plainHit.point.z - 3) > 0.0001) {
    throw new Error('non-indexed fallback changed the upstream result');
  }
  const finalStats = THREE.getNativeRaycastDiagnostics();
  jsr.exportState({
    verifiedHits,
    builds: finalStats.builds,
    queries: finalStats.queries,
    fallbacks: finalStats.fallbacks,
    averageCandidates: finalStats.candidateTriangles / finalStats.queries
  });
})();
''';
    final harness = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: source,
      instanceId: 'three-native-raycast-bvh-test',
    );
    final state = harness.engine.exportedState;
    expect(state, isNotNull, reason: '${harness.engine.peekLogs()}');
    expect(state!['verifiedHits'], 40);
    expect(state['builds'], 2);
    expect(state['queries'], 41);
    expect(state['fallbacks'], 1);
    expect((state['averageCandidates'] as num).toDouble(), lessThan(256));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 120)));
}
