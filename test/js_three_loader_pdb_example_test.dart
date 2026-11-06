import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// Pins webgl_loader_pdb molecule switching end to end: the lil-gui
/// molecule dropdown must tear the current molecule down and rebuild the
/// scene for the new PDB entry.
///
/// Regression guard: the teardown loop `while (root.children.length > 0)
/// root.remove(root.children[0])` detaches CSS2DObject labels, whose
/// 'removed' listener type-checks
/// `element instanceof element.ownerDocument.defaultView.Element`. When the
/// runtime document's defaultView lacked the bounded Element constructor,
/// that instanceof THREW inside Object3D.remove(), aborting the loop after
/// one object — the loader never ran, the scene lost one atom per click and
/// switching silently did nothing. The fix carries the marker class on
/// document.defaultView and puts local elements on its prototype chain.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('pdb example', () {}, skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets('webgl_loader_pdb molecule switch rebuilds the scene', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-loader-pdb',
      instanceId: 'three-loader-pdb-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount > 0 &&
          plan.draws.isNotEmpty &&
          state.submittedFrameCount >= 1,
    );
    harness.expectHealthy('webgl_loader_pdb');

    int trianglesOf(ThreeDrawPlan plan) =>
        plan.draws.fold<int>(0, (t, d) => t + d.drawCount ~/ 3);

    String? moleculeValue() {
      final rows = (harness.engine.exportedState?['gui']?['values']
          as List<dynamic>?);
      for (final row in rows ?? const <dynamic>[]) {
        if (row is Map && row['name'] == 'molecule') return row['value'] as String?;
      }
      return null;
    }

    // Boot molecule: caffeine — 24 atom spheres (IcosahedronGeometry(1,3),
    // 320 triangles each) + 25 bond boxes (12 each), one draw per mesh.
    expect(moleculeValue(), 'caffeine.pdb');
    expect(harness.plan!.draws, hasLength(49));
    expect(trianglesOf(harness.plan!), 7980);

    final rows = (harness.engine.exportedState?['gui']?['values']
        as List<dynamic>?);
    final action = rows!
        .map((row) => row as Map)
        .firstWhere((row) => row['name'] == 'molecule')['action'] as String;

    // Switch by LABEL — exactly what the Flutter dropdown sends — then by
    // raw value. Each switch must fully rebuild the root group.
    Future<void> expectSwitch(String eventValue, String file, int draws,
        int triangles) async {
      await harness.backend.callEvent(action, {'value': eventValue});
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            moleculeValue() == file &&
            plan.draws.isNotEmpty &&
            trianglesOf(plan) == triangles &&
            plan.draws.length == draws,
        attempts: 150,
      );
      expect(moleculeValue(), file, reason: 'gui value must track $eventValue');
      expect(harness.plan!.draws, hasLength(draws));
      expect(trianglesOf(harness.plan!), triangles);
    }

    await expectSwitch('Ethanol', 'ethanol.pdb', 17, 2976);
    await expectSwitch('cubane.pdb', 'cubane.pdb', 36, 5360);
    // Back to the boot molecule: switching must keep working repeatedly.
    await expectSwitch('Caffeine', 'caffeine.pdb', 49, 7980);

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
