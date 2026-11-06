// Camera-host face-signal tests (camera-free): the APPROXIMATE Vision
// landmark → Face Cap blendshape mapping in example/lib/camera_host.dart.
//
// The fixtures are synthetic named-point geometries in the exact compact
// format the Swift host ships (face-box normalized, y up, x toward the
// image's right = the subject's left on the un-mirrored front camera).
// They pin the mapping formulas, the 0..1 clamps, the official eye-look
// sums (In/Out/Up/Down → lookX/lookY), the lerp smoothing, the bounded
// payload, and the host-call contract: camera.frame responses carry
// {shapes, lookX, lookY} ONLY while camera.track is live — the no-tracking
// response bytes stay identical to the pre-tracking lane.
//
// Vision itself cannot run in CI; the Swift side is exercised by the live
// app capture round-trip (jsr-shot2.app), not here.
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import '../example/lib/camera_host.dart';

// 8 boundary points of a box; the symmetric layout keeps the centroid at
// the box centre (the mapper uses centroids and x-extremes, not indices).
List<double> boxPoints(double minX, double minY, double maxX, double maxY) =>
    <double>[
      minX, minY, //
      minX, (minY + maxY) / 2, //
      maxX, minY, //
      maxX, (minY + maxY) / 2, //
      maxX, maxY, //
      minX, (minY + maxY) / 2, //
      minX, maxY, //
      maxX, (minY + maxY) / 2, //
    ];

/// Synthetic face: contour box 0.2..0.8 × 0.15..0.85, eyes at y 0.46..0.49,
/// brows, outer/inner lips with configurable corner lift and pupil offsets.
/// [cornerY] is both mouth corners' y (0.30 = level/neutral); pupil offsets
/// are signed deltas from each eye centre (+x = toward the subject's left).
Map<String, List<double>> faceFixture({
  double cornerY = 0.30,
  double ilMinY = 0.295,
  double ilMaxY = 0.305,
  double leMinY = 0.46,
  double leMaxY = 0.49,
  double browInnerY = 0.566,
  double browOuterY = 0.545,
  double lpDx = 0,
  double lpDy = 0,
  double rpDx = 0,
  double rpDy = 0,
}) {
  // Face contour (subject-left = image +x).
  final fc = boxPoints(0.2, 0.15, 0.8, 0.85);
  // Subject-left eye (image right half), 8-point contour + pupil.
  final le = boxPoints(0.55, leMinY, 0.70, leMaxY);
  final re = boxPoints(0.30, leMinY, 0.45, leMaxY);
  final lp = <double>[0.625 + lpDx, (leMinY + leMaxY) / 2 + lpDy];
  final rp = <double>[0.375 + rpDx, (leMinY + leMaxY) / 2 + rpDy];
  // Brows: the inner point is the one closest to the face centre x (0.5).
  final lb = <double>[
    0.52, browInnerY, //
    0.56, browOuterY, //
    0.60, browOuterY, //
    0.64, browOuterY, //
    0.72, browOuterY, // subject-left tail = max x
    0.66, browOuterY, //
    0.58, browOuterY, //
    0.54, browOuterY, //
  ];
  final rb = <double>[
    0.48, browInnerY, //
    0.44, browOuterY, //
    0.40, browOuterY, //
    0.36, browOuterY, //
    0.28, browOuterY, // subject-right tail = min x
    0.34, browOuterY, //
    0.42, browOuterY, //
    0.46, browOuterY, //
  ];
  // Outer lips: the x-extreme points ARE the corners (subject-right corner
  // first at min x, subject-left at max x).
  final ol = <double>[
    0.35, cornerY, //
    0.40, cornerY + 0.012, //
    0.50, cornerY + 0.014, //
    0.60, cornerY + 0.012, //
    0.65, cornerY, //
    0.60, cornerY - 0.012, //
    0.50, cornerY - 0.014, //
    0.40, cornerY - 0.012, //
  ];
  final il = boxPoints(0.40, ilMinY, 0.60, ilMaxY);
  return <String, List<double>>{
    'fc': fc,
    'le': le,
    're': re,
    'lp': lp,
    'rp': rp,
    'lb': lb,
    'rb': rb,
    'ol': ol,
    'il': il,
    'nc': <double>[0.5, 0.40],
    'no': <double>[0.5, 0.38, 0.49, 0.39, 0.51, 0.39, 0.5, 0.41],
  };
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('faceSignalsFromLandmarks (approximate mapping)', () {
    test('neutral geometry rests every mouth/eye/brow shape near zero', () {
      final signals = faceSignalsFromLandmarks(faceFixture())!;
      expect(signals.shapes['jawOpen'], closeTo(0, 1e-9));
      expect(signals.shapes['mouthSmile_L'], closeTo(0, 1e-9));
      expect(signals.shapes['mouthSmile_R'], closeTo(0, 1e-9));
      expect(signals.shapes['mouthFrown_L'], closeTo(0, 1e-9));
      expect(signals.shapes['mouthFrown_R'], closeTo(0, 1e-9));
      expect(signals.shapes['browInnerUp'], closeTo(0, 1e-9));
      expect(signals.shapes['browOuterUp_L'], closeTo(0, 1e-9));
      expect(signals.shapes['browOuterUp_R'], closeTo(0, 1e-9));
      expect(signals.shapes['eyeBlink_L'], closeTo(0, 1e-9));
      expect(signals.shapes['eyeBlink_R'], closeTo(0, 1e-9));
      expect(signals.shapes['eyeSquint_L'], closeTo(0, 1e-9));
      expect(signals.shapes['cheekPuff'], closeTo(0, 1e-9));
      expect(signals.shapes['mouthPucker'], closeTo(0, 1e-9));
      expect(signals.lookX, closeTo(0, 1e-9));
      expect(signals.lookY, closeTo(0, 1e-9));
      expect(
        signals.shapes.length,
        16,
        reason: '16 approximate shapes, inside the 20-payload quota',
      );
    });

    test('open jaw raises jawOpen by the inner-lip ratio formula', () {
      // il box 0.23..0.37 → height 0.14, face height 0.7 → ratio 0.2
      // jawOpen = (0.2 − 0.03) / 0.27 ≈ 0.6296.
      final signals = faceSignalsFromLandmarks(
        faceFixture(ilMinY: 0.23, ilMaxY: 0.37),
      )!;
      expect(signals.shapes['jawOpen'], closeTo(0.17 / 0.27, 1e-9));
    });

    test('raised mouth corners map to smile (both sides), level stays 0', () {
      final smile = faceSignalsFromLandmarks(faceFixture(cornerY: 0.33))!;
      // lift = (0.33 − 0.30) / 0.7 ≈ 0.04286 → smile = (lift − 0.005)/0.05.
      final expected = ((0.33 - 0.30) / 0.7 - 0.005) / 0.05;
      expect(smile.shapes['mouthSmile_L'], closeTo(expected, 1e-9));
      expect(smile.shapes['mouthSmile_R'], closeTo(expected, 1e-9));
      expect(smile.shapes['mouthFrown_L'], 0);
      // Extreme grin clamps to 1.
      final grin = faceSignalsFromLandmarks(faceFixture(cornerY: 0.40))!;
      expect(grin.shapes['mouthSmile_L'], 1);
      expect(grin.shapes['mouthSmile_R'], 1);
    });

    test('dropped mouth corners map to frown, not smile', () {
      final frown = faceSignalsFromLandmarks(faceFixture(cornerY: 0.28))!;
      final expected = ((0.30 - 0.28) / 0.7 - 0.005) / 0.035;
      expect(frown.shapes['mouthFrown_L'], closeTo(expected, 1e-9));
      expect(frown.shapes['mouthFrown_R'], closeTo(expected, 1e-9));
      expect(frown.shapes['mouthSmile_L'], 0);
    });

    test('closed eyes saturate blink and damp squint', () {
      const open = 0.001 / 0.7; // 0.4745..0.4755 eye box over the 0.7 face
      final closed = faceSignalsFromLandmarks(
        faceFixture(leMinY: 0.4745, leMaxY: 0.4755),
      )!;
      expect(closed.shapes['eyeBlink_L'], 1);
      expect(closed.shapes['eyeBlink_R'], 1);
      // squint raw saturates past 1, then the (1 − 0.5·blink) damping lands
      // before the 0..1 clamp: (raw · 0.5).
      final raw = (0.024 - open) / 0.021;
      expect(
        closed.shapes['eyeSquint_L'],
        closeTo((raw * 0.5).clamp(0.0, 1.0), 1e-9),
      );
      expect(
        closed.shapes['eyeSquint_R'],
        closeTo((raw * 0.5).clamp(0.0, 1.0), 1e-9),
      );
      final openFace = faceSignalsFromLandmarks(faceFixture())!;
      expect(openFace.shapes['eyeSquint_L'], 0);
    });

    test('raised brows use the inner/outer ratios against the eye line', () {
      final up = faceSignalsFromLandmarks(
        faceFixture(browInnerY: 0.60, browOuterY: 0.58),
      )!;
      final inner = ((0.60 - 0.475) / 0.7 - 0.13) / 0.05;
      final outer = ((0.58 - 0.475) / 0.7 - 0.10) / 0.05;
      expect(up.shapes['browInnerUp'], closeTo(inner.clamp(0.0, 1.0), 1e-9));
      expect(up.shapes['browOuterUp_L'], closeTo(outer.clamp(0.0, 1.0), 1e-9));
      expect(up.shapes['browOuterUp_R'], closeTo(outer.clamp(0.0, 1.0), 1e-9));
    });

    test(
      'pupil offsets produce the official eye-look sums (sign: +x = subject-left)',
      () {
        // dx such that dx / eyeWidth / 0.45 = 0.5 → both eye sums = −0.5.
        final dx = 0.225 * 0.15;
        final gaze = faceSignalsFromLandmarks(faceFixture(lpDx: dx, rpDx: dx))!;
        expect(gaze.lookY, closeTo(0, 1e-9));

        // Pupils toward the subject's right flip the sign.
        final right = faceSignalsFromLandmarks(
          faceFixture(lpDx: -dx, rpDx: -dx),
        )!;
        expect(right.lookX, closeTo(0.5, 1e-9));

        // Upward gaze: +y = up → lookY negative (Down − Up official sum).
        // dy is scaled by the eye BOX HEIGHT (0.03), so a half-deflection
        // offset is 0.225 · 0.03.
        final dy = 0.225 * 0.03;
        final up = faceSignalsFromLandmarks(faceFixture(lpDy: dy, rpDy: dy))!;
        expect(up.lookY, closeTo(-0.5, 1e-9));

        // Beyond the eye box the sums clamp at ±1.
        final far = faceSignalsFromLandmarks(
          faceFixture(lpDx: 0.2, rpDx: 0.2),
        )!;
        expect(far.lookX, -1);
      },
    );

    test('missing geometry degrades to null or mouth-only neutral look', () {
      expect(faceSignalsFromLandmarks(const {}), isNull);
      // Contour only, no eyes: Vision's variable point counts mean the
      // eye regions can come back too sparse — the mapper still ships the
      // mouth shapes and holds the gaze neutral instead of dropping the
      // whole lane.
      final eyesOnly = faceSignalsFromLandmarks(<String, List<double>>{
        'fc': <double>[0, 0, 1, 0, 1, 1],
      });
      expect(eyesOnly, isNotNull);
      expect(eyesOnly!.lookX, 0);
      expect(eyesOnly.lookY, 0);
      expect(eyesOnly.shapes.containsKey('eyeBlink_L'), isFalse);
    });

    test(
      'every emitted name exists in the official Face Cap dictionary values',
      () {
        const official = <String>{
          'jawOpen',
          'mouthSmile_L',
          'mouthSmile_R',
          'mouthFrown_L',
          'mouthFrown_R',
          'browInnerUp',
          'browOuterUp_L',
          'browOuterUp_R',
          'eyeBlink_L',
          'eyeBlink_R',
          'eyeSquint_L',
          'eyeSquint_R',
          'cheekPuff',
          'mouthPucker',
          'noseSneer_L',
          'noseSneer_R',
        };
        final signals = faceSignalsFromLandmarks(faceFixture())!;
        expect(signals.shapes.keys.toSet(), official);
        for (final value in signals.shapes.values) {
          expect(value.isNaN, isFalse);
          expect(value, inInclusiveRange(0, 1));
        }
      },
    );
  });

  group('parseLandmarks', () {
    test('parses the Swift push payload and drops unknown keys', () {
      final parsed = parseLandmarks(<String, dynamic>{
        'fc': <double>[0.2, 0.15, 0.8, 0.85],
        'le': <int>[0, 1, 2, 3],
        'zz': <int>[1, 2],
      });
      expect(parsed!.keys, <String>{'fc', 'le'});
      expect(parsed['le'], <double>[0, 1, 2, 3]);
    });

    test('malformed payloads return null', () {
      expect(parseLandmarks(null), isNull);
      expect(parseLandmarks(<String, dynamic>{}), isNull);
      expect(parseLandmarks(<String, dynamic>{'fc': 'nope'}), isNull);
    });
  });

  group('FaceSignalSmother (lerp smoothing)', () {
    test('approaches the target monotonically without overshoot', () {
      final smoother = FaceSignalSmother(factor: 0.3);
      const target = FaceSignals(<String, double>{'jawOpen': 1}, 0, 0);
      var previous = 0.0;
      for (var i = 0; i < 25; i++) {
        smoother.step(target);
        final value = smoother.shapes['jawOpen']!;
        expect(value, greaterThanOrEqualTo(previous));
        expect(value, inInclusiveRange(0, 1));
        previous = value;
      }
      expect(previous, greaterThan(0.99), reason: 'converges to the target');
      expect(smoother.hasSignals, isTrue);
    });

    test('first step jumps straight to the target, later steps lerp', () {
      final smoother = FaceSignalSmother(factor: 0.35);
      smoother.step(const FaceSignals(<String, double>{'jawOpen': 0.8}, 1, -1));
      expect(
        smoother.shapes['jawOpen'],
        closeTo(0.8, 1e-9),
        reason:
            'an empty lane adopts the first target verbatim (tracking enable)',
      );
      expect(
        smoother.lookX,
        closeTo(0.35, 1e-9),
        reason: 'look sums always lerp from neutral',
      );
      expect(smoother.lookY, closeTo(-0.35, 1e-9));
      smoother.step(const FaceSignals(<String, double>{'jawOpen': 0.4}, 1, -1));
      // Served values are rounded to 3 decimals for a compact JSON payload.
      expect(
        smoother.shapes['jawOpen'],
        closeTo(0.8 + (0.4 - 0.8) * 0.35, 5.1e-4),
      );
      expect(smoother.lookX, closeTo(0.35 + (1 - 0.35) * 0.35, 5.1e-4));
    });

    test('payload stays bounded at 20 shapes', () {
      final smoother = FaceSignalSmother();
      final shapes = <String, double>{
        for (var i = 0; i < 25; i++) 'shape_$i': 1,
      };
      smoother.step(FaceSignals(shapes, 0, 0));
      expect(smoother.shapes.length, 20);
    });

    test('clamps, rounds, and reset clears the lane', () {
      final smoother = FaceSignalSmother();
      smoother.step(
        const FaceSignals(
          <String, double>{'jawOpen': 2, 'cheekPuff': -1},
          5,
          -5,
        ),
      );
      expect(smoother.shapes['jawOpen'], 1);
      expect(smoother.shapes['cheekPuff'], 0);
      expect(
        smoother.lookX,
        0.35,
        reason: 'target clamps to 1, then lerps from neutral',
      );
      expect(smoother.lookY, -0.35);
      smoother.reset();
      expect(smoother.hasSignals, isFalse);
      expect(smoother.lookX, 0);
    });
  });

  group('ExampleCameraHost face-signal contract', () {
    test('camera.frame carries shapes only while camera.track is live', () async {
      const channel = MethodChannel('jsr.camera');
      final binding = TestWidgetsFlutterBinding.instance;
      binding.defaultBinaryMessenger.setMockMethodCallHandler(channel, (
        call,
      ) async {
        switch (call.method) {
          case 'start':
            return <String, Object>{
              'available': true,
              'width': 320,
              'height': 180,
            };
          case 'track':
            final enable = (call.arguments as Map?)?['enable'] == true;
            return <String, Object>{'available': true, 'tracking': enable};
          case 'stop':
            return <String, Object>{'available': false, 'reason': 'stopped'};
        }
        return null;
      });
      addTearDown(
        () => binding.defaultBinaryMessenger.setMockMethodCallHandler(
          channel,
          null,
        ),
      );

      final host = ExampleCameraHost();
      final start =
          await host.handleCall('camera.start', <String, dynamic>{}) as Map;
      expect(start['available'], true);

      // Feed a frame push with neutral-face landmarks BEFORE tracking: the
      // response bytes stay identical to the pre-tracking lane (no shapes).
      final landmarks = faceFixture();
      host.handlePushForTesting(<Object?, Object?>{
        'available': true,
        'data': Uint8List.fromList(<int>[1, 2, 3, 4]),
        'seq': 0,
        'width': 2,
        'height': 2,
        'landmarks': landmarks,
      });
      final before =
          await host.handleCall('camera.frame', <String, dynamic>{'seq': -1})
              as Map;
      expect(before['changed'], true);
      expect(
        before.containsKey('shapes'),
        isFalse,
        reason: 'no shapes without camera.track',
      );
      expect(before.containsKey('lookX'), isFalse);

      final track =
          await host.handleCall('camera.track', <String, dynamic>{
                'enable': true,
              })
              as Map;
      expect(track['available'], true);
      expect(track['tracking'], true);

      host.handlePushForTesting(<Object?, Object?>{
        'available': true,
        'data': Uint8List.fromList(<int>[5, 6, 7, 8]),
        'seq': 1,
        'width': 2,
        'height': 2,
        'landmarks': landmarks,
      });
      final frame =
          await host.handleCall('camera.frame', <String, dynamic>{'seq': 0})
              as Map;
      expect(frame['changed'], true);
      final shapes = frame['shapes'] as Map;
      expect(shapes.keys, contains('jawOpen'));
      expect(frame['lookX'], closeTo(0, 1e-6));
      expect(frame['lookY'], closeTo(0, 1e-6));

      // Smoothing: a second identical push keeps values stable; a
      // wide-open-jaw push moves jawOpen 35% of the way per step.
      host.handlePushForTesting(<Object?, Object?>{
        'available': true,
        'data': Uint8List.fromList(<int>[9, 10, 11, 12]),
        'seq': 2,
        'width': 2,
        'height': 2,
        'landmarks': faceFixture(ilMinY: 0.23, ilMaxY: 0.37),
      });
      final frame2 =
          await host.handleCall('camera.frame', <String, dynamic>{'seq': 2})
              as Map;
      final target = 0.17 / 0.27;
      final first = frame['shapes']['jawOpen'] as double;
      final second = frame2['shapes']['jawOpen'] as double;
      expect(
        first,
        closeTo(0, 1e-6),
        reason: 'first tracked push is the neutral fixture',
      );
      expect(
        second,
        closeTo(first + (target - first) * 0.35, 5.1e-4),
        reason:
            'the open-jaw push continues the 0.35 lerp from the smoothed value '
            '(served values round to 3 decimals)',
      );

      // changed:false short-circuit responses still carry live signals.
      final quiet =
          await host.handleCall('camera.frame', <String, dynamic>{'seq': 99})
              as Map;
      expect(quiet['changed'], false);
      expect(quiet.containsKey('shapes'), isTrue);

      // camera.stop tears tracking down; later pulls are unavailable.
      final stop =
          await host.handleCall('camera.stop', <String, dynamic>{}) as Map;
      expect(stop['available'], false);
      final after =
          await host.handleCall('camera.frame', <String, dynamic>{'seq': 100})
              as Map;
      expect(after['available'], false);
      expect(after.containsKey('shapes'), isFalse);

      // Disabling tracking mid-session clears the served shapes too.
      final host2 = ExampleCameraHost();
      await host2.handleCall('camera.start', <String, dynamic>{});
      await host2.handleCall('camera.track', <String, dynamic>{'enable': true});
      host2.handlePushForTesting(<Object?, Object?>{
        'available': true,
        'data': Uint8List.fromList(<int>[1, 2, 3, 4]),
        'seq': 0,
        'width': 2,
        'height': 2,
        'landmarks': landmarks,
      });
      final live =
          await host2.handleCall('camera.frame', <String, dynamic>{'seq': -1})
              as Map;
      expect(live['shapes'], isNotNull);
      await host2.handleCall('camera.track', <String, dynamic>{
        'enable': false,
      });
      final cleared =
          await host2.handleCall('camera.frame', <String, dynamic>{'seq': -1})
              as Map;
      expect(cleared.containsKey('shapes'), isFalse);
    });
  });
}
