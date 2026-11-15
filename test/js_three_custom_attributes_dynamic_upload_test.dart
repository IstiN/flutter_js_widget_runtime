// Cluster-A regression pins for the per-frame dynamic-attribute examples
// (webgl_custom_attributes{,_lines,_points,_points2,_points3} family).
//
// The adapted R1 lanes used to re-encode and re-upload EVERY attribute on
// every animated frame:
//  - customLine rewrote position AND color with one QuickJS getComponent call
//    per component and recomputed the bounding sphere through upstream's
//    method-call scan;
//  - points rebuilt the adapted BufferGeometry (and a fresh resource id) each
//    frame, forcing a full position/color upload + GPU buffer replacement per
//    presented frame even though only the point-size mean changed.
//
// These pins fail if that behavior returns.
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';

const _timeout = Timeout(Duration(seconds: 180));

Future<ThreeQuickjsExampleHarness> _boot(
  WidgetTester tester,
  String id, {
  String? sourcePrelude,
}) async {
  final harness = await ThreeQuickjsExampleHarness.boot(
    tester,
    widgetId: id,
    instanceId: '$id-dynamic-upload-test',
    sourcePrelude: sourcePrelude,
  );
  // Let boot settle (font load, first adapted frame), then snapshot.
  await pumpThreeExampleHealthy(
    tester,
    harness,
    id.replaceFirst('three-', 'webgl_').replaceAll('-', '_'),
    targetFrames: 2,
  );
  return harness;
}

void main() {
  testWidgets(
    'custom-attributes points keep one geometry upload while sizes animate',
    (tester) async {
      final harness = await _boot(tester, 'three-custom-attributes-points');
      final state = harness.state!;
      final uploadsBefore = state.geometryUploadCount;
      final submittedBefore = state.submittedFrameCount;
      // The R1-prepared example rewrites the per-point size attribute every
      // second display frame; sizes are represented by their mean, so no
      // geometry data changes. Updates ride the material lane only while
      // rotation and presentation remain full-rate.
      await harness.pumpFrames(tester, 10);
      final state2 = harness.state!;
      expect(
        state2.geometryUploadCount,
        uploadsBefore,
        reason:
            'per-frame size mutation must not re-upload the 100k-point '
            'geometry (whole-buffer re-upload regression)',
      );
      expect(
        state2.geometryUploadCount,
        lessThanOrEqualTo(1),
        reason: 'the adapted point cloud must be uploaded exactly once',
      );
      expect(
        state2.submittedFrameCount,
        greaterThan(submittedBefore),
        reason: 'frames must keep presenting while the geometry is stable',
      );
      // The material lane carries the animated mean size: the upload
      // counters must show material (not geometry) traffic while frames
      // keep presenting.
      expect(
        state2.materialUploadCount,
        greaterThan(0),
        reason: 'the animated mean point size must ride the material lane',
      );
      await harness.dispose(tester);
    },
    timeout: _timeout,
  );

  testWidgets(
    'custom-attributes points3 keep one geometry upload while sizes animate',
    (tester) async {
      final harness = await _boot(tester, 'three-custom-attributes-points3');
      final state = harness.state!;
      final uploadsBefore = state.geometryUploadCount;
      await harness.pumpFrames(tester, 10);
      final state2 = harness.state!;
      expect(
        state2.geometryUploadCount,
        uploadsBefore,
        reason: 'points3 size-only mutation must not re-upload geometry',
      );
      await harness.dispose(tester);
    },
    timeout: _timeout,
  );

  testWidgets(
    'custom-attributes points2 keeps one geometry upload across frames',
    (tester) async {
      final harness = await _boot(tester, 'three-custom-attributes-points2');
      final state = harness.state!;
      final uploadsBefore = state.geometryUploadCount;
      await harness.pumpFrames(tester, 10);
      expect(
        harness.state!.geometryUploadCount,
        uploadsBefore,
        reason: 'points2 size-only mutation must not re-upload geometry',
      );
      await harness.dispose(tester);
    },
    timeout: _timeout,
  );

  testWidgets(
    'custom-attributes lines re-encodes positions but not the static colors',
    (tester) async {
      final harness = await _boot(
        tester,
        'three-custom-attributes-lines',
        sourcePrelude: '''
globalThis.__jsrLineWalkNativeCalls = 0;
globalThis.__jsrLinePositionNativeCalls = 0;
jsr.onKey(function() {
  jsr.exportState({
    calls: globalThis.__jsrLineWalkNativeCalls,
    positionCalls: globalThis.__jsrLinePositionNativeCalls
  });
});
if (typeof globalThis.__jsrLineWalkBytes === 'function') {
  var nativeLineWalk = globalThis.__jsrLineWalkBytes;
  globalThis.__jsrLineWalkBytes = function(name, data) {
    if (name === 'three.lineWalk') globalThis.__jsrLineWalkNativeCalls++;
    if (name === 'three.linePositions') globalThis.__jsrLinePositionNativeCalls++;
    return nativeLineWalk(name, data);
  };
}
''',
      );
      final state = harness.state!;
      expect(state.geometries, hasLength(1));
      final first = state.geometries.values.single;
      Float32List? previousColors = first.colors;
      Float32List? previousPositions = first.positions;
      final stableColors = <bool>[];
      final positionsChanged = <bool>[];
      // The official example random-walks the displacement attribute every
      // frame, so the adapted positions must be re-uploaded (bytes change),
      // while customColor is written once at init: its encoded bytes must
      // stay identical across frames (no per-frame color rewrite/re-encode).
      await harness.pumpFrames(tester, 6);
      final uploadsBefore = harness.state!.geometryUploadCount;
      for (var frame = 0; frame < 3; frame++) {
        await harness.pumpFrame(tester);
        final geometry = harness.state!.geometries.values.single;
        stableColors.add(
          _bytesEqual(
            geometry.colors ?? Float32List(0),
            previousColors ?? Float32List(0),
          ),
        );
        positionsChanged.add(
          !_bytesEqual(geometry.positions, previousPositions ?? Float32List(0)),
        );
        previousColors = geometry.colors;
        previousPositions = geometry.positions;
      }
      expect(
        stableColors,
        everyElement(isTrue),
        reason:
            'unchanged customColor must keep byte-identical encoded '
            'colors across frames (identity/version check), not a per-frame '
            'color rewrite; got $stableColors',
      );
      expect(
        positionsChanged,
        everyElement(isTrue),
        reason:
            'the animated displacement walk must still produce new '
            'position uploads every frame',
      );
      // Exactly one geometry upsert per animated frame: the per-frame
      // position change rides a single stable geometry id, not a fresh
      // resource per frame.
      final state2 = harness.state!;
      expect(state2.geometryUploadCount - uploadsBefore, 3);
      expect(
        state2.geometries,
        hasLength(1),
        reason: 'the adapted geometry id must stay stable across frames',
      );
      harness.backend.dispatchHostEvent('key', {'key': 'a', 'down': true});
      expect(
        harness.engine.exportedState?['calls'],
        greaterThan(0),
        reason: 'the prepared example must use the synchronous native walk',
      );
      expect(
        harness.engine.exportedState?['positionCalls'],
        greaterThan(0),
        reason: 'the custom vertex field must use the native position lane',
      );
      await harness.dispose(tester);
    },
    timeout: _timeout,
  );
}

bool _bytesEqual(Float32List a, Float32List b) {
  if (identical(a, b)) return true;
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return false;
  }
  return true;
}
