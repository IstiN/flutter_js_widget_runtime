import 'package:flutter_test/flutter_test.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

import 'runner_fixture.dart';

/// Capability `three` on the conformance runner: the production wrapper
/// loads the upstream r186 bundle before the widget; math-level fixtures
/// (scene graph, Matrix4/Vector3, Euler/Quaternion — kit `three_*`) write
/// their results through `jsr.exportState` and need no canvas host.
void main() {
  if (!QuickjsFfi.isAvailable) {
    return; // CI builds the bridge first (see pr.yml job conformance).
  }

  testWidgets('three fixture computes math against the reference values', (
    tester,
  ) async {
    final result = await runInlineFixture(
      tester,
      id: 'three_math_probe',
      meta: <String, dynamic>{'capabilities': <String>['three']},
      widgetJs: '''
(function() {
  function r12(x) { return Math.round(x * 1e12) / 1e12; }
  var m = new THREE.Matrix4();
  m.compose(
    new THREE.Vector3(1, 2, 3),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0.2, 0.3)),
    new THREE.Vector3(2, 2, 2)
  );
  var applied = new THREE.Vector3(1, 0, 0).applyMatrix4(m);
  jsr.exportState({
    revision: Number(THREE.REVISION),
    applied: [r12(applied.x), r12(applied.y), r12(applied.z)],
  });
  jsr.render({ type: 'text', data: 'three ok' });
})();
''',
      expected: <String, dynamic>{
        'expect': <String, dynamic>{
          'state': <String, dynamic>{
            'revision': 186,
            'applied': <double>[2.872586727168, 2.625983651571, 2.681309841384],
          },
        },
      },
    );

    final state = result['state'] as Map<String, dynamic>;
    expect(state['revision'], 186);
    expect(
      state['applied'],
      <double>[2.872586727168, 2.625983651571, 2.681309841384],
      reason: 'QuickJS double math snapped to 12 decimals must equal the '
          'harness reference values (Chromium-generated)',
    );
  });
}
