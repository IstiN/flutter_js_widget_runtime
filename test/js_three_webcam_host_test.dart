import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// Camera lane test for the two official webcam examples on native R1.
///
/// The example app publishes the live webcam through the generic
/// `onHostCall` contract (`camera.start` / `camera.frame` / `camera.stop`);
/// the widget's webcam_host degrade probes camera.start, resizes the tracked
/// VideoTexture to the granted camera dimensions BEFORE frame 0 (no 16x16
/// placeholder upsert ever reaches the GPU stream), then pulls frames and
/// writes them into the backdrop texture, which the R1 packet re-uploads
/// (raw RGBA8, same-size every frame). This test feeds synthetic RGBA frames
/// through a real QuickJS engine and asserts the submitted texture state
/// tracks them: dimensions, pixel bytes, version bumps, the `{changed,seq}`
/// short-circuit (no upload churn when nothing changed), and a bounded
/// upload count.
Uint8List _frameBytes(int width, int height, int seed) {
  final bytes = Uint8List(width * height * 4);
  for (var i = 0; i < bytes.length; i++) {
    bytes[i] = (i * 7 + seed) & 255;
  }
  return bytes;
}

/// Length of matrix column [col] (0-based) — the world scale along that axis
/// for the column-major 4x4 [m].
double _colLength(Float32List m, int col) {
  final x = m[col * 4], y = m[col * 4 + 1], z = m[col * 4 + 2];
  return math.sqrt(x * x + y * y + z * z);
}

final class _CameraHostStub {
  _CameraHostStub(this.frameA, this.frameB)
    : latest = frameA,
      seqOf = <Uint8List, int>{frameA: 0, frameB: 1};

  final Uint8List frameA;
  final Uint8List frameB;
  final Map<Uint8List, int> seqOf;
  Uint8List latest;
  int seq = -1;
  int startCalls = 0;
  int stopCalls = 0;
  int frameCalls = 0;

  Future<Object?> handleCall(String name, Map<String, dynamic> args) async {
    switch (name) {
      case 'camera.start':
        startCalls++;
        return <String, Object>{'available': true, 'width': 8, 'height': 6};
      case 'camera.frame':
        frameCalls++;
        final requested = (args['seq'] as num?)?.toInt() ?? -1;
        if (requested >= seq) {
          return <String, Object>{
            'available': true,
            'changed': false,
            'seq': seq < 0 ? 0 : seq,
          };
        }
        return <String, Object>{
          'available': true,
          'changed': true,
          'seq': seq,
          'width': 8,
          'height': 6,
          'format': 'rgba',
          'data': base64Encode(latest),
        };
      case 'camera.stop':
        stopCalls++;
        return <String, Object>{'available': false, 'reason': 'stopped'};
      default:
        throw ArgumentError.value(name, 'name', 'not a camera host call');
    }
  }

  void publish(Uint8List frame) {
    latest = frame;
    seq = seqOf[frame] ?? (seq + 1);
  }
}

Future<JsThreeTextureUpsert?> _cameraTexture(
  ThreeQuickjsExampleHarness harness, {
  bool pixelExact = false,
  Uint8List? expected,
}) async {
  final textures = harness.state?.textures;
  if (textures == null) return null;
  for (final texture in textures.values) {
    if (texture.width != 8 || texture.height != 6) continue;
    if (pixelExact && expected != null && listEquals(texture.data, expected)) {
      return texture;
    }
    if (!pixelExact) return texture;
  }
  return null;
}

/// Pumps until the camera texture appears. Every observed per-texture
/// dimension pair is recorded in [dimsSeen] (textureId -> {WxH}), so the
/// caller can assert the submitted upsert stream never carried a 16x16
/// placeholder after the resize-at-start prime.
Future<JsThreeTextureUpsert> _pumpForCameraTexture(
  WidgetTester tester,
  ThreeQuickjsExampleHarness harness, {
  Map<int, Set<String>>? dimsSeen,
  bool pixelExact = false,
  Uint8List? expected,
}) async {
  for (var attempt = 0; attempt < 60; attempt++) {
    final state = harness.state;
    if (state != null && dimsSeen != null) {
      for (final entry in state.textures.entries) {
        dimsSeen
            .putIfAbsent(entry.key, () => <String>{})
            .add('${entry.value.width}x${entry.value.height}');
      }
    }
    final texture = await _cameraTexture(
      harness,
      pixelExact: pixelExact,
      expected: expected,
    );
    if (texture != null) return texture;
    await harness.pumpFrame(tester);
  }
  fail('the camera frame texture (8x6) never reached the submitted R1 state');
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('webcam camera lane', () {}, skip: 'QuickJS is unavailable');
    return;
  }

  testWidgets('webgl_materials_video_webcam renders live camera frames', (
    tester,
  ) async {
    final frameA = _frameBytes(8, 6, 11);
    final frameB = _frameBytes(8, 6, 200);
    final camera = _CameraHostStub(frameA, frameB)..publish(frameA);
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-video-webcam',
      instanceId: 'three-materials-video-webcam-camera-lane-test',
      onHostCall: camera.handleCall,
    );

    // The webcam degrade probes camera.start when the official module builds
    // its VideoTexture, then pulls frames on its bounded interval. The grant
    // response carries the camera format (8x6), so the host resizes the
    // texture BEFORE frame 0: the first submitted upsert must already be
    // camera-sized and no 16x16 placeholder may appear in the stream.
    final dimsSeen = <int, Set<String>>{};
    final texture = await _pumpForCameraTexture(
      tester,
      harness,
      dimsSeen: dimsSeen,
      pixelExact: true,
      expected: frameA,
    );
    expect(
      camera.startCalls,
      greaterThanOrEqualTo(1),
      reason: 'camera.start probed',
    );
    for (final dims in dimsSeen.values) {
      expect(
        dims.contains('16x16'),
        isFalse,
        reason:
            'resize-at-start prime: no 16x16 placeholder upsert in the '
            'submitted stream (saw $dims)',
      );
    }
    expect(
      dimsSeen.values.every((dims) => dims.contains('8x6')),
      isTrue,
      reason: 'every submitted upsert is at camera dimensions (saw $dimsSeen)',
    );
    expect(texture.encoding, JsThreeTextureEncoding.rawRgba8);
    expect(texture.width, 8);
    expect(texture.height, 6);
    expect(
      texture.data.length,
      8 * 6 * 4,
      reason: 'RGBA8 stride is width*height*4',
    );
    for (var i = 0; i < texture.data.length; i++) {
      expect(
        texture.data[i],
        frameA[i],
        reason: 'camera frame A pixel $i must reach the submitted texture',
      );
    }

    // Publish frame B: the next pull must re-upload the same texture with
    // new pixels (needsUpdate → signature change → textureCommand).
    camera.publish(frameB);
    final uploadsBeforeB = harness.state!.textureUploadCount;
    Uint8List dataB = Uint8List(0);
    for (var attempt = 0; attempt < 60; attempt++) {
      final current = await _cameraTexture(harness);
      if (current != null && !listEquals(current.data, frameA)) {
        dataB = Uint8List.fromList(current.data);
        break;
      }
      await harness.pumpFrame(tester);
    }
    expect(dataB, isNotEmpty, reason: 'frame B reached the submitted texture');
    for (var i = 0; i < dataB.length; i++) {
      expect(dataB[i], frameB[i], reason: 'camera frame B pixel $i');
    }
    expect(
      harness.state!.textureUploadCount,
      greaterThan(uploadsBeforeB),
      reason: 'frame B produced another texture upload',
    );

    // Short-circuit: with no newer frame, uploads stop growing — the same-
    // size camera stream stays bounded (primed upload + one per changed
    // frame, never a per-pull resend).
    final uploadsQuiet = harness.state!.textureUploadCount;
    await harness.pumpFrames(tester, 12);
    expect(
      harness.state!.textureUploadCount,
      uploadsQuiet,
      reason: 'unchanged seq must not re-upload the camera texture',
    );
    // Bounded headroom: prime + frame A + frame B — three uploads total for
    // the single-camera-texture example.
    expect(
      harness.state!.textureUploadCount,
      lessThanOrEqualTo(4),
      reason: 'the camera texture stream stays bounded',
    );
    expect(
      camera.frameCalls,
      greaterThanOrEqualTo(3),
      reason: 'pull loop kept polling',
    );
    // The host took ownership of the texture at grant (resize-at-start), so
    // the example adapter's VideoTexture degrade never fired: no checker
    // fallback and no 'transport unavailable' warn in the camera-present run.
    expect(
      harness.engine.exportedState!['media']['videoTextures'],
      0,
      reason: 'webcam host owns the texture; the 16x16 degrade is skipped',
    );
    expect(
      harness.engine.peekLogs().any(
        (entry) => (entry['msg'] as String).contains('VideoTexture transport'),
      ),
      isFalse,
      reason: 'no false degrade warn while the camera lane is live',
    );
    await harness.dispose(tester);
    expect(
      camera.stopCalls,
      0,
      reason:
          'JS never issues camera.stop; the host tears the session down on dispose',
    );
  }, timeout: const Timeout(Duration(minutes: 4)));

  testWidgets(
    'camera texture is bound to the rendered backdrop plane and the plane is camera-scaled',
    (tester) async {
      // End-to-end identity chain on the submitted R1 state: the webcam
      // registry texture (8x6 camera frames) must be the SAME texture the
      // backdrop plane's material references (mapTextureId), the plane node
      // must carry the loadedmetadata camera-geometry scale (not the 1x1
      // PlaneGeometry default that hides 8 pixels behind the face), and the
      // plane must be present in the submitted draw plan.
      final frameA = _frameBytes(8, 6, 11);
      final camera = _CameraHostStub(frameA, frameA)..publish(frameA);
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-morphtargets-webcam',
        instanceId: 'three-morphtargets-webcam-camera-binding-test',
        onHostCall: camera.handleCall,
      );
      final texture = await _pumpForCameraTexture(tester, harness);
      // The facecap model loads slower than the first camera frame — wait
      // for a real draw plan before inspecting bindings, transforms, draws.
      await harness.pumpUntil(
        tester,
        (state, plan) => plan.draws.isNotEmpty,
        attempts: 80,
      );
      final cameraTextureId = harness.state!.textures.entries
          .where((e) => identical(e.value, texture))
          .map((e) => e.key)
          .first;

      // (1) Instance chain: some submitted material must reference the camera
      // texture as its map — the registry texture and the rendered material.map
      // are the same object only if this binding exists in the stream.
      final boundMaterials = harness.state!.materials.values
          .where((m) => m.mapTextureId == cameraTextureId)
          .toList();
      expect(
        boundMaterials,
        isNotEmpty,
        reason:
            'the camera texture must be bound as some material map '
            '(texture id $cameraTextureId among '
            '${harness.state!.materials.values.map((m) => m.mapTextureId).toSet()})',
      );

      // (2) Geometry: the node drawing that material must be scaled beyond the
      // 1x1 PlaneGeometry default — the official example scales the backdrop to
      // fill the camera frustum in its loadedmetadata handler; if the shim
      // event never reaches it the plane stays 1x1 (8 px behind the face).
      final materialIds = boundMaterials.map((m) => m.materialId).toSet();
      final planeNodes = harness.state!.nodes.values
          .where((n) => materialIds.contains(n.materialId))
          .toList();
      expect(
        planeNodes,
        isNotEmpty,
        reason: 'the bound backdrop material must be used by a submitted node',
      );
      double sx = 0, sy = 0;
      for (final node in planeNodes) {
        final m = node.matrixWorld;
        sx = sx.abs() < _colLength(m, 0).abs() ? _colLength(m, 0) : sx;
        sy = sy.abs() < _colLength(m, 1).abs() ? _colLength(m, 1) : sy;
      }
      expect(
        sx.abs(),
        greaterThan(50),
        reason:
            'backdrop plane world scale X ($sx) must exceed the 1x1 default '
            '(the example scales it to ~height*aspect ≈ 165 at 8x6)',
      );
      expect(
        sy.abs(),
        greaterThan(50),
        reason:
            'backdrop plane world scale Y ($sy) must exceed the 1x1 default '
            '(the example scales it to ~height ≈ 124 at 8x6)',
      );

      // (3) Draw plan: the plane draw is actually submitted (not culled).
      final drawnMaterialIds = harness.plan!.draws
          .map((draw) => draw.material.materialId)
          .toSet();
      expect(
        materialIds.any(drawnMaterialIds.contains),
        isTrue,
        reason: 'the camera-textured backdrop plane must appear in the draws',
      );

      // (4) Aspect pin: the plane's world-scale ratio equals the GRANTED
      // camera aspect — the official listener's
      // scale.set(height * aspect, height, 1) after the shim loadedmetadata.
      // A square fallback (listener never fired) keeps ratio 1.0.
      expect(sy.abs(), greaterThan(0));
      expect(
        sx.abs() / sy.abs(),
        closeTo(8 / 6, 0.01),
        reason: 'backdrop plane keeps the granted camera aspect (sx/sy == 8/6)',
      );

      // (5) The 52 morph sliders ride the folder-grouping wrapper: the
      // facade gui diagnostics carry a folder title per controller, within
      // the bounded quotas (1 root, 52 controllers, 6 folders).
      final gui =
          harness.engine.exportedState!['gui']! as Map<dynamic, dynamic>;
      expect(gui['controllers'], 52, reason: 'one controller per morph slider');
      final folders = ((gui['values']! as List).map(
        (row) => row['folder'] as String,
      )).toSet();
      expect(
        folders,
        equals(<String>{
          'Brow',
          'Cheek',
          'Eyes',
          'Jaw',
          'Mouth',
          'Nose',
          'Other',
        }),
        reason:
            'the morph sliders are grouped into the six prefix folders '
            '(facecap.glb also ships one off-prefix target, e.g. tongueOut, '
            'which lands in the single bounded "Other")',
      );
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(minutes: 4)),
  );

  testWidgets('webcam probe failure keeps the bounded checker fallback', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-video-webcam',
      instanceId: 'three-materials-video-webcam-camera-fallback-test',
      onHostCall: (name, args) async {
        if (name == 'camera.start') {
          return <String, Object>{
            'available': false,
            'reason': 'camera permission denied',
          };
        }
        if (name == 'camera.frame' || name == 'camera.stop') {
          return <String, Object>{'available': false};
        }
        throw ArgumentError.value(name, 'name', 'not a camera host call');
      },
    );
    await harness.pumpUntil(
      tester,
      (state, plan) => state.submittedFrameCount >= 3 && plan.draws.isNotEmpty,
      attempts: 80,
    );
    await harness.pumpFrames(tester, 10);
    // The checker fallback texture is the ONLY texture lane in this example
    // without a camera — no 8x6 or other camera-sized texture may appear.
    expect(
      harness.state!.textures.values.any(
        (texture) => texture.width == 8 && texture.height == 6,
      ),
      isFalse,
    );
    expect(
      harness.state!.textures.values.any(
        (t) => t.width == 16 && t.height == 16,
      ),
      isTrue,
    );
    expect(harness.engine.exportedState!['media']['videoTextures'], 1);
    expect(
      harness.engine.peekLogs().any(
        (entry) => (entry['msg'] as String).contains('webcam host unavailable'),
      ),
      isTrue,
      reason: 'probe denial warns once, bounded',
    );
    expect(harness.plan!.draws, hasLength(128));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(minutes: 4)));
}
