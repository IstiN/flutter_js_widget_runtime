import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/running_widget.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'animation skinning ik example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  Future<ThreeQuickjsExampleHarness> boot(
    WidgetTester tester,
    String instanceId,
  ) => ThreeQuickjsExampleHarness.boot(
    tester,
    widgetId: 'three-animation-skinning-ik',
    instanceId: instanceId,
    assetLoader: widgetDirAssetLoader(
      'example/widgets/three-animation-skinning-ik',
    ),
  );

  testWidgets('webgl_animation_skinning_ik normalizes gizmo renderOrder', (
    tester,
  ) async {
    final harness = await boot(tester, 'three-animation-skinning-ik-test');
    final plan = await harness.pumpUntil(
      tester,
      (state, candidate) =>
          state.submittedFrameCount >= 1 &&
          state.nodes.values.any((node) => node.renderOrder > 9e29),
    );
    harness.expectHealthy('webgl_animation_skinning_ik');
    expect(plan, isNotNull);
    expect(
      harness.state!.nodes.values.where((node) => node.renderOrder > 9e29),
      isNotEmpty,
    );
    final submitted = harness.state!.submittedFrameCount;
    await harness.pumpFrames(tester, 4);
    expect(harness.state!.submittedFrameCount, greaterThan(submitted));
    harness.expectHealthy('webgl_animation_skinning_ik');
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 240)));

  testWidgets(
    'webgl_animation_skinning_ik keeps the IK head in the draw plan across an orbit sweep',
    (tester) async {
      final harness = await boot(tester, 'three-animation-skinning-ik-orbit');
      // The skinned head mesh (glTF mesh Kira_Base.001) is the only 1228-vertex
      // geometry in the packet stream; identify its node id from the plan
      // inputs instead of hardcoding the boot-order-dependent object id.
      const headVertexCount = 1228;
      final plan = await harness.pumpUntil(tester, (state, candidate) {
        harness.plan = candidate;
        return state.submittedFrameCount >= 5 &&
            state.geometries.values
                .where((g) => g.vertexCount == headVertexCount)
                .isNotEmpty;
      }, attempts: 600);
      harness.expectHealthy('webgl_animation_skinning_ik');
      final headIds = harness.state!.nodes.values
          .where(
            (n) =>
                harness.state!.geometries[n.geometryId]?.vertexCount ==
                headVertexCount,
          )
          .map((n) => n.nodeId)
          .toSet();
      expect(headIds, hasLength(1), reason: 'head mesh identification');
      final headNodeId = headIds.single;

      bool headDrawn(ThreeDrawPlan candidate) {
        final headDraws = candidate.draws
            .where((draw) => draw.node.nodeId == headNodeId)
            .toList();
        return headDraws.isNotEmpty &&
            headDraws.every((draw) => !draw.culledFromMain);
      }

      // Pre-sweep sanity: the head renders in the default pose too.
      expect(plan, isNotNull);
      expect(headDrawn(plan!), isTrue, reason: 'head drawn at default camera');

      void input(String type, double x, double y, int buttons) =>
          dispatchThreePointerEvent(
            harness.backend,
            type,
            x: x,
            y: y,
            buttons: buttons,
          );

      // Orbit gesture anchored at a canvas corner so the drags never hit the
      // TransformControls gizmo at screen center (a gizmo drag disables
      // OrbitControls and the camera stops rotating).
      Future<void> drag(int dx, int dy) async {
        input('pointerdown', 80, 400, 1);
        for (var i = 1; i <= 4; i++) {
          input('pointermove', 80 + dx * i / 4, 400 + dy * i / 4, 1);
          await harness.pumpFrame(tester);
        }
        input('pointerup', 80.0 + dx, 400.0 + dy, 0);
        // Let OrbitControls damping settle and the IK/head-bone pose catch up.
        for (var frame = 0; frame < 40; frame++) {
          await harness.pumpFrame(tester);
        }
      }

      double cameraX(List<double> matrix) => matrix[12];
      double cameraY(List<double> matrix) => matrix[13];
      double cameraZ(List<double> matrix) => matrix[14];

      // Sweep: three elevation bands (vertical pre-drag) with eight azimuth
      // steps each — >=24 distinct orbit directions. At every direction the
      // head mesh must survive into the draw plan: the skinned-aware culling
      // bound tracks the CPU-skinned extents, so the node is only culled when
      // the drawn head is genuinely outside the frustum.
      final visited = <int>{};
      var steps = 0;
      for (final band in const [(0, 40), (0, -25), (0, 25)]) {
        await drag(band.$1, band.$2);
        for (var i = 0; i < 8; i++) {
          await drag(55, 0);
          final candidate = const ThreeDrawPlanner().plan(harness.state!);
          harness.plan = candidate;
          steps++;
          final matrix = harness.state!.camera!.matrixWorld;
          visited.add(
            (cameraX(matrix) * 200).round() ^
                ((cameraY(matrix) * 200).round() << 10) ^
                ((cameraZ(matrix) * 200).round() << 20),
          );
          expect(
            headDrawn(candidate),
            isTrue,
            reason:
                'head mesh must stay in the draw plan at orbit step $steps '
                '(camera ${cameraX(matrix).toStringAsFixed(3)}, '
                '${cameraY(matrix).toStringAsFixed(3)}, '
                '${cameraZ(matrix).toStringAsFixed(3)}); '
                'logs=${harness.engine.peekLogs()}',
          );
        }
      }
      // The gesture path really covered distinct orbit directions.
      expect(
        visited,
        hasLength(greaterThanOrEqualTo(20)),
        reason: 'orbit sweep must reach >=20 distinct camera positions',
      );
      harness.expectHealthy('webgl_animation_skinning_ik');
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(minutes: 12)),
  );

  testWidgets(
    'webgl_animation_skinning_ik submits the bounded cube lane per frame',
    (tester) async {
      // The official animate() updates the mirror-sphere CubeCamera and then
      // renders the main scene. Upstream CubeCamera.update renders six faces;
      // R1 stores a WebGLCubeRenderTarget as ONE bounded 2D target whose
      // pixels are the last face written, so five of those six full scene
      // renders submit plan bytes that the next face immediately overwrites
      // (measured 21.8ms -> 3.5ms JS per frame on this example). Pin the
      // bounded lane: each animate() must submit exactly one cube-face frame
      // plus the main frame.
      final harness = await boot(tester, 'three-animation-skinning-ik-lane');
      await harness.pumpUntil(
        tester,
        (state, candidate) => state.submittedFrameCount >= 6,
        attempts: 600,
      );
      harness.expectHealthy('webgl_animation_skinning_ik');
      final before = harness.state!.submittedFrameCount;
      const pumps = 8;
      await harness.pumpFrames(tester, pumps);
      final delta = harness.state!.submittedFrameCount - before;
      // Per animate frame: one (-Z) cube face submit + one main submit.
      // A wider window tolerates the settling frame but a revert to the
      // six-face lane submits ~7 per frame and blows far past it.
      expect(
        delta,
        lessThanOrEqualTo(pumps * 2 + 2),
        reason:
            'cube-face collapse regressed: $delta frame submissions for '
            '$pumps animate frames (six-face lane would submit ~${pumps * 7}); '
            'logs=${harness.engine.peekLogs().take(4)}',
      );
      expect(delta, greaterThanOrEqualTo(pumps));
      harness.expectHealthy('webgl_animation_skinning_ik');
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(minutes: 6)),
  );

  testWidgets('skinned computeBoundingSphere publishes exact skinned extents', (
    tester,
  ) async {
    // R1 CPU skining bakes bone transforms into the position attribute.
    // Upstream SkinnedMesh.computeBoundingSphere re-applies the skeleton to
    // the already-skinned attribute (double transform -> the IK head-vanish
    // phantom sphere); the R1 override must publish the exact min/max of
    // the current attribute instead.
    final harness = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      instanceId: 'three-skinned-bounds-regression',
      source: r'''
        const canvas = jsr.three.createCanvas('main');
        const renderer = new THREE.WebGLRenderer({canvas: canvas});
        renderer.setSize(64, 64);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        camera.position.set(0, 0, 8);
        camera.lookAt(0, 0, 0);
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const count = geometry.attributes.position.count;
        const skinIndices = new THREE.Float32BufferAttribute(
          new Array(count * 4).fill(0), 4);
        const skinWeights = new THREE.Float32BufferAttribute(
          new Array(count * 4).fill(1), 4);
        geometry.setAttribute('skinIndex', skinIndices);
        geometry.setAttribute('skinWeight', skinWeights);
        const mesh = new THREE.SkinnedMesh(
          geometry, new THREE.MeshStandardMaterial());
        const bone = new THREE.Bone();
        bone.position.set(3, 0, 0);
        const skeleton = new THREE.Skeleton([bone]);
        mesh.bind(skeleton);
        mesh.add(bone);
        scene.add(mesh);
        renderer.render(scene, camera);
        renderer.render(scene, camera);
        // After the render the attribute holds the bone-transformed vertices.
        const attribute = geometry.attributes.position;
        const array = attribute.array;
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        for (let v = 0; v < attribute.count; v++) {
          const x = array[v * 3], y = array[v * 3 + 1], z = array[v * 3 + 2];
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
          minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
        }
        mesh.computeBoundingSphere();
        const sphere = geometry.boundingSphere;
        jsr.exportState({
          skinnedCenterX: (minX + maxX) / 2,
          skinnedCenterY: (minY + maxY) / 2,
          skinnedCenterZ: (minZ + maxZ) / 2,
          skinnedRadius: 0.5 * Math.hypot(maxX - minX, maxY - minY, maxZ - minZ),
          published: {
            x: sphere.center.x, y: sphere.center.y, z: sphere.center.z,
            r: sphere.radius
          },
          cullBound: mesh.boundingSphere ? {
            x: mesh.boundingSphere.center.x,
            y: mesh.boundingSphere.center.y,
            z: mesh.boundingSphere.center.z,
            r: mesh.boundingSphere.radius
          } : null,
          skinnedMovedX: minX > 2.5
        });
      ''',
    );
    final state = harness.engine.exportedState! as Map<String, dynamic>;
    expect(
      state['skinnedMovedX'],
      isTrue,
      reason: 'probe requires a genuinely skinned attribute',
    );
    final skinned = {
      'x': state['skinnedCenterX'],
      'y': state['skinnedCenterY'],
      'z': state['skinnedCenterZ'],
      'r': state['skinnedRadius'],
    };
    final published = (state['published'] as Map).cast<String, dynamic>();
    // Exact drawn extents, not the double-transformed phantom sphere.
    expect(published['x'], closeTo(skinned['x'] as num, 1e-4));
    expect(published['y'], closeTo(skinned['y'] as num, 1e-4));
    expect(published['z'], closeTo(skinned['z'] as num, 1e-4));
    expect(published['r'], closeTo(skinned['r'] as num, 1e-4));
    // The per-render cull refresh publishes the same exact bound.
    final cullBound = (state['cullBound'] as Map?)?.cast<String, dynamic>();
    expect(cullBound, isNotNull, reason: 'cull sphere must be defined');
    expect(cullBound!['x'], closeTo(skinned['x'] as num, 1e-4));
    expect(cullBound['r'], closeTo(skinned['r'] as num, 1e-4));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(minutes: 3)));

  testWidgets('cull-sphere refresh is memoized per attribute version', (
    tester,
  ) async {
    // Perf regression pin (cluster C): the skinned-aware culling bound is an
    // O(vertex) min/max scan that must run once per changed attribute
    // VERSION, not once per render call — the IK example renders the same
    // scene 7+ times per frame (cube-camera faces, main pass, shadow passes),
    // and a per-render re-scan cost the example ~2/3 of its frame budget
    // (40 -> 120 FPS when memoized). The probe asserts: repeated renders at a
    // frozen pose reuse the memo (same object identity, bound stays exact),
    // and a bone move (version bump) triggers exactly one refresh.
    final harness = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      instanceId: 'three-skinned-cull-memo-regression',
      source: r'''
        const canvas = jsr.three.createCanvas('main');
        const renderer = new THREE.WebGLRenderer({canvas: canvas});
        renderer.setSize(64, 64);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        camera.position.set(0, 0, 8);
        camera.lookAt(0, 0, 0);
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const count = geometry.attributes.position.count;
        geometry.setAttribute('skinIndex',
          new THREE.Float32BufferAttribute(new Array(count * 4).fill(0), 4));
        geometry.setAttribute('skinWeight',
          new THREE.Float32BufferAttribute(new Array(count * 4).fill(1), 4));
        const mesh = new THREE.SkinnedMesh(
          geometry, new THREE.MeshStandardMaterial());
        const bone = new THREE.Bone();
        const skeleton = new THREE.Skeleton([bone]);
        mesh.bind(skeleton);
        mesh.add(bone);
        scene.add(mesh);
        const radiusAfter = () => mesh.boundingSphere
          ? mesh.boundingSphere.radius : null;
        // 1) First render: the cull lane creates the memo and the exact bound.
        renderer.render(scene, camera);
        const memoRef1 = mesh._r1CullSphereMemo;
        const radius1 = radiusAfter();
        // 2) Pose change: bone moves -> attribute version bumps -> refresh.
        bone.position.set(3, 0, 0);
        renderer.render(scene, camera);
        const memoRef2 = mesh._r1CullSphereMemo;
        const radius2 = radiusAfter();
        // 3) Frozen pose: 6 duplicate render calls (cube-camera/pass fan-out)
        //    must reuse the memo and keep the exact skinned bound.
        let memoStable = true, radiusStable = true;
        for (let i = 0; i < 6; i++) {
          renderer.render(scene, camera);
          if (mesh._r1CullSphereMemo !== memoRef2) memoStable = false;
          if (radiusAfter() !== radius2) radiusStable = false;
        }
        // 4) A second pose change must invalidate the memo again.
        bone.position.set(-2, 1, 0);
        renderer.render(scene, camera);
        const memoRef3 = mesh._r1CullSphereMemo;
        jsr.exportState({
          memoCreated: memoRef1 != null,
          memoChangedOnPoseMove: memoRef2 !== memoRef1,
          memoStableAcrossFrozenRenders: memoStable,
          radiusStableAcrossFrozenRenders: radiusStable,
          memoChangedOnSecondMove: memoRef3 !== memoRef2,
          radius1: radius1,
          radius2: radius2,
          skinnedMoved: memoRef3 != null,
        });
      ''',
    );
    final state = harness.engine.exportedState! as Map<String, dynamic>;
    expect(state['memoCreated'], isTrue, reason: 'cull memo must exist');
    expect(
      state['memoChangedOnPoseMove'],
      isTrue,
      reason: 'pose change must refresh the cull bound',
    );
    expect(
      state['memoStableAcrossFrozenRenders'],
      isTrue,
      reason: 'frozen-pose renders must reuse the memo (perf pin)',
    );
    expect(
      state['radiusStableAcrossFrozenRenders'],
      isTrue,
      reason: 'memo hits must keep the exact skinned bound',
    );
    expect(
      state['memoChangedOnSecondMove'],
      isTrue,
      reason: 'a new pose change must invalidate the memo',
    );
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(minutes: 3)));
}
