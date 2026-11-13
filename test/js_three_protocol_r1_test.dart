import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_protocol_bytes.dart';
import 'support/three_protocol_cases.dart';

void main() {
  test('DRAW_BATCH and REMOVE_BATCH reject malformed bounded bodies', () {
    final mutations = <void Function(Uint8List)>[
      (body) => setU32(body, 0, 0),
      (body) => setU32(body, 4, 0),
      (body) => setU32(body, 8, 0),
      (body) => setU32(body, 8, 2),
      (body) => setU32(body, 12, 2),
      (body) => setU32(body, 16, 0),
      (body) => setU32(body, 16, 65537),
      (body) => setU32(body, 20, 0),
      (body) => setU32(body, 24, 0),
      (body) => setU32(body, 32, 0),
      (body) {
        setU32(body, 28, 0xffffffff);
        setU32(body, 32, 2);
      },
    ];
    for (final mutate in mutations) {
      final body = threeDrawBatch();
      mutate(body);
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(11, body)])));
    }
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        threeR1([
          (
            11,
            threeDrawBatch(instanceCount: 1000001, flags: 1, matrices: const []),
          ),
        ]),
      ),
    );
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(11, threeDrawBatch(partCount: 2))])));
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        threeR1([(11, threeDrawBatch(flags: 1, matrices: const []))]),
      ),
    );
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        threeR1([
          (11, threeDrawBatch(matrices: const [1])),
        ]),
      ),
    );
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        threeR1([
          (11, threeDrawBatch(instanceCount: 0, flags: 1, matrices: const [1])),
        ]),
      ),
    );
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(11, threeDrawBatch(flags: 4))])));
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(11, threeDrawBatch(flags: 2))])));
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        threeR1([(11, threeDrawBatch(instanceCount: 2, flags: 3, colors: const []))]),
      ),
    );
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        threeR1([
          (
            11,
            threeDrawBatch(
              instanceCount: 2,
              flags: 3,
              colors: const [0.1, 0.2, double.nan],
            ),
          ),
        ]),
      ),
    );
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(12, threeU32Body(0))])));
  });

  test(
    'T1 rejects bad metadata, integer overflow, invalid UTF-8, and trailing data',
    () {
      final mutations = <void Function(Uint8List)>[
        (b) => b[0] = 0,
        (b) => b[4] = 2,
        (b) => b[5] = 0x1b,
        (b) => setU16(b, 6, 32),
        (b) => setU32(b, 8, 0),
        (b) => setU32(b, 12, 1),
        (b) => setU16(b, 16, 0),
        (b) => setU16(b, 16, 129),
        (b) => setU16(b, 18, 0),
        (b) => setU16(b, 18, 129),
        (b) => setU32(b, 20, 1),
        (b) => setU32(b, 24, 0),
        (b) => setU32(b, 28, 1),
      ];
      for (final mutate in mutations) {
        final bytes = threeT1(threeR1(const []));
        mutate(bytes);
        threeBad(() => threeProtocolDecoder.decodeEnvelope(bytes));
      }
      final valid = threeT1(threeR1(threeAllCommands()));
      for (var length = 0; length < valid.length; length++) {
        final truncated = Uint8List.sublistView(valid, 0, length);
        threeBad(() => threeProtocolDecoder.decodeEnvelope(truncated));
      }
      threeBad(() => threeProtocolDecoder.decodeEnvelope(Uint8List.fromList([...valid, 0])));
      threeBad(
        () => JsThreeProtocolDecoder(
          maxEnvelopeBytes: valid.length - 1,
        ).decodeEnvelope(valid),
      );

      final badEngine = threeT1(threeR1(const []));
      badEngine[32] = 0xff;
      threeBad(() => threeProtocolDecoder.decodeEnvelope(badEngine));
      final badSurface = threeT1(threeR1(const []));
      badSurface[32 + utf8.encode('engine').length] = 0xff;
      threeBad(() => threeProtocolDecoder.decodeEnvelope(badSurface));
      final overflow = threeT1(threeR1(const []));
      setU32(overflow, 12, 0xffffffff);
      threeBad(() => threeProtocolDecoder.decodeEnvelope(overflow));
    },
  );

  test(
    'sequence helper distinguishes syntax, first sequence, and stale work',
    () {
      JsThreeProtocolDecoder.validateSequence(9);
      JsThreeProtocolDecoder.validateSequence(1, lastSequence: 0);
      JsThreeProtocolDecoder.validateSequence(8, lastSequence: 7);
      threeBad(() => JsThreeProtocolDecoder.validateSequence(0));
      threeBad(() => JsThreeProtocolDecoder.validateSequence(2, lastSequence: 0));
      threeBad(() => JsThreeProtocolDecoder.validateSequence(7, lastSequence: 7));
      threeBad(() => JsThreeProtocolDecoder.validateSequence(6, lastSequence: 7));
    },
  );

  test(
    'R1 rejects unknown headers, command metadata, truncation, and trailing bytes',
    () {
      final valid = threeR1(threeAllCommands());
      for (var length = 0; length < valid.length; length++) {
        final truncated = Uint8List.sublistView(valid, 0, length);
        threeBad(() => threeProtocolDecoder.decodeR1(truncated));
      }
      threeBad(() => threeProtocolDecoder.decodeR1(Uint8List.fromList([...valid, 0])));
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1(const [], version: 0)));
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1(const [], version: 9)));
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1(const [], flags: 1)));
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1(const [], commandCount: 100001)));
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(13, Uint8List(0))])));
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(1, threeGeometry())], commandCount: 0)));

      final commandCases = <Uint8List>[
        threeR1([(10, Uint8List(0))]),
        threeR1([(10, Uint8List(0))]),
        threeR1([(10, Uint8List(0))]),
        threeR1([(10, Uint8List(0))]),
      ];
      commandCases[0][0] = 0;
      commandCases[1][13] = 1;
      setU16(commandCases[2], 14, 1);
      setU32(commandCases[3], 16, 0xffffffff);
      for (final bytes in commandCases) {
        threeBad(() => threeProtocolDecoder.decodeR1(bytes));
      }
    },
  );

  test('every opcode rejects short and overlong bodies', () {
    for (final (opcode, body) in threeAllCommands()) {
      for (var length = 0; length < body.length; length++) {
        final short = Uint8List.sublistView(body, 0, length);
        threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(opcode, short)])));
      }
      final long = Uint8List.fromList([...body, 0]);
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(opcode, long)])));
    }
  });

  test(
    'geometry enforces quotas, masks, primitive counts, strides, and indices',
    () {
      final mutations = <void Function(Uint8List)>[
        (b) => setU32(b, 0, 0),
        (b) => setU32(b, 4, 0),
        (b) => setU32(b, 8, 0),
        (b) => setU32(b, 8, 16),
        (b) => setU32(b, 12, 0),
        (b) => setU32(b, 12, 4000001),
        (b) => setU32(b, 16, 12000001),
        (b) => setU32(b, 16, 2),
        (b) => setU32(b, 20, 3),
        (b) => setU32(b, 24, 1),
        (b) => setU32(b, 28, 12),
        (b) => setU32(b, 68, 12),
        (b) => setU32(b, 108, 12),
        (b) => setU32(b, 136, 12),
      ];
      for (final mutate in mutations) {
        final body = threeGeometry();
        mutate(body);
        threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(1, body)])));
      }
      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([
            (1, threeGeometry(indices: const [0, 1, 3])),
          ]),
        ),
      );
      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([(1, threeGeometry(mask: 1, vertexCount: 4, indices: const []))]),
        ),
      );
      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([
            (
              1,
              threeGeometry(
                mask: 1,
                vertexCount: 3,
                primitive: 1,
                indices: const [],
              ),
            ),
          ]),
        ),
      );
    },
  );

  test(
    'texture enforces encoding, dimensions, flags, exact data, and quotas',
    () {
      final mutations = <void Function(Uint8List)>[
        (b) => setU32(b, 0, 0),
        (b) => setU32(b, 4, 0),
        (b) => setU32(b, 8, 0),
        (b) => setU32(b, 12, 0),
        (b) => setU32(b, 16, 3),
        (b) => setU32(b, 20, 128),
        (b) => setU32(b, 24, 3),
      ];
      for (final mutate in mutations) {
        final body = threeTexture();
        mutate(body);
        threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(2, body)])));
      }
      for (final encoding in [1, 2]) {
        threeBad(
          () => threeProtocolDecoder.decodeR1(
            threeR1([(2, threeTexture(encoding: encoding, data: const []))]),
          ),
        );
        final excessive = threeTexture(encoding: encoding);
        setU32(excessive, 24, 64 * 1024 * 1024 + 1);
        threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(2, excessive)])));
      }
      final overflow = threeTexture();
      setU32(overflow, 8, 0x3fffffff);
      setU32(overflow, 12, 0x3fffffff);
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(2, overflow)])));
    },
  );

  test('round-trips the 128-byte emissive-plus-Dubois v6 material layout', () {
    final decoded = threeProtocolDecoder.decodeR1(
      threeR1([(3, threeMaterialV6(emissive: true))], version: 6),
    );
    final material = decoded.commands.whereType<JsThreeMaterialUpsert>().single;
    expect(material.emissiveR, closeTo(0.125, 1e-6));
    expect(material.emissiveG, closeTo(0.25, 1e-6));
    expect(material.emissiveB, closeTo(0.5, 1e-6));
    expect(material.emissiveIntensity, 2);
    expect(material.mapRightTextureId, 0);
    expect(material.duboisLeftMatrix.every((value) => value == 0), isTrue);
  });

  test('decodes the bounded v6 Dubois anaglyph material', () {
    final decoded = threeProtocolDecoder.decodeR1(
      threeR1([
        (3, threeMaterialV6(kind: JsThreeMaterialKind.anaglyph, anaglyph: true)),
      ], version: 6),
    );
    final material = decoded.commands.whereType<JsThreeMaterialUpsert>().single;
    expect(material.kind, JsThreeMaterialKind.anaglyph);
    expect(material.mapTextureId, 2);
    expect(material.mapRightTextureId, 9);
    expect(material.duboisLeftMatrix[0], closeTo(0.1, 1e-6));
    expect(material.duboisLeftMatrix[1], closeTo(0.2, 1e-6));
    expect(material.duboisLeftMatrix[2], closeTo(0.3, 1e-6));
    expect(material.duboisLeftMatrix[3], 0);
    expect(material.duboisRightMatrix[0], 1);
    expect(material.duboisRightMatrix[1], closeTo(1.1, 1e-6));
    expect(material.duboisRightMatrix[2], closeTo(1.2, 1e-6));
    expect(material.duboisRightMatrix[3], 0);
  });

  test('decodes target upserts and per-pass target rectangles on v6', () {
    final decoded = threeProtocolDecoder.decodeR1(
      threeR1([
        (14, threeRenderTarget(flags: 256 | 1 | 2)),
        (8, threeFrameV6Target()),
      ], version: 6),
    );
    final target = decoded.commands
        .whereType<JsThreeRenderTargetUpsert>()
        .single;
    expect(target.targetId, 2);
    expect(target.textureId, 2);
    expect((target.width, target.height), (640, 360));
    expect(target.hasDepth, isTrue);
    expect(target.nearestMag && target.nearestMin, isTrue);
    final frame = decoded.commands.whereType<JsThreeSubmitFrame>().single;
    expect(frame.renderTargetId, 2);
    expect((frame.targetWidth, frame.targetHeight), (640, 360));
    expect(
      [
        frame.viewportX,
        frame.viewportY,
        frame.viewportWidth,
        frame.viewportHeight,
      ],
      [0.0, 0.0, 640.0, 360.0],
    );
    expect(frame.clearColor && frame.clearDepth, isTrue);
    expect(frame.scissorTest && frame.hasViewport, isTrue);
  });

  test('v5 frames retain legacy target and viewport defaults', () {
    final decoded = threeProtocolDecoder.decodeR1(
      threeR1([
        (8, threeFrameV5Point(flag: 0, x: 0, y: 0, z: 0, far: 0, lightType: 0)),
      ], version: 5),
    );
    final frame = decoded.commands.whereType<JsThreeSubmitFrame>().single;
    expect(frame.renderTargetId, 0);
    expect(frame.hasViewport, isFalse);
    expect(frame.scissorTest, isFalse);
    expect(frame.clearColor && frame.clearDepth, isTrue);
  });

  test('rejects malformed target and frame-target extensions', () {
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(14, threeRenderTarget())], version: 5)));
    for (final body in [
      threeRenderTarget(width: 0),
      threeRenderTarget(flags: 16),
      threeRenderTarget(flags: 0x80000000),
    ]) {
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(14, body)], version: 6)));
    }
    final reservedTarget = threeRenderTarget();
    setU32(reservedTarget, 24, 1);
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(14, reservedTarget)], version: 6)));
    final badMagic = threeFrameV6Target();
    setU32(badMagic, 184, 0);
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(8, badMagic)], version: 6)));
    final badRect = threeFrameV6Target();
    setF32(badRect, 204, -1);
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(8, badRect)], version: 6)));
    final badFlags = threeFrameV6Target(flags: 7);
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(8, badFlags)], version: 6)));
    final reservedFrame = threeFrameV6Target();
    setU32(reservedFrame, 240, 1);
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(8, reservedFrame)], version: 6)));
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(8, threeFrameV6Target())], version: 5)));
  });

  test(
    'scalar bodies reject unknown kinds, flags, zero IDs, and invalid ranges',
    () {
      final cases = <(int, Uint8List, int, int)>[
        (3, threeMaterial(), 0, 0),
        (3, threeMaterial(), 4, 0),
        (3, threeMaterial(), 8, 15), // 15 is invalid; 14 is the native postprocessing kind
        (
          3,
          threeMaterial(),
          16,
          1024,
        ), // bits 7..9 are THREE blending; bit 10 stays invalid
        (3, threeMaterial(), 20, 3),
        (3, threeMaterial(), 52, 0),
        (4, threeNode(), 0, 0),
        (4, threeNode(), 16, 2),
        (4, threeNode(), 20, 5),
        (6, threeCamera(), 0, 0),
        (6, threeCamera(), 4, 2),
        (7, threeLight(), 0, 0),
        (7, threeLight(), 4, 4),
        (8, threeFrame(), 0, 0),
        (8, threeFrame(), 4, 0),
        (9, threeDisposal(), 0, 0),
        (9, threeDisposal(), 4, 0),
        (9, threeDisposal(), 4, 8),
      ];
      for (final (opcode, original, offset, value) in cases) {
        final body = Uint8List.fromList(original);
        setU32(body, offset, value);
        threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(opcode, body)])));
      }
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(5, threeU32Body(0))])));
      for (final offset in [36, 40, 44, 48]) {
        for (final value in [-0.01, 1.01]) {
          final body = threeMaterial();
          setF32(body, offset, value);
          threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(3, body)])));
        }
      }
      for (final value in [0.0, -1.0]) {
        final material = threeMaterial();
        setF32(material, 52, value);
        threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(3, material)])));
        final frame = threeFrame();
        setF32(frame, 24, value);
        threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(8, frame)])));
      }
      final light = threeLight();
      setF32(light, 20, -0.01);
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(7, light)])));
    },
  );

  test('every floating field rejects NaN and both infinities', () {
    final cases = <(int, Uint8List Function(), List<int>)>[
      (
        1,
        () => threeGeometry(mask: 1, indices: const []),
        [for (var offset = 32; offset < 64; offset += 4) offset],
      ),
      (3, threeMaterial, [for (var offset = 24; offset < 56; offset += 4) offset]),
      (4, threeNode, [for (var offset = 24; offset < 88; offset += 4) offset]),
      (6, threeCamera, [for (var offset = 8; offset < 200; offset += 4) offset]),
      (7, threeLight, [for (var offset = 8; offset < 48; offset += 4) offset]),
      (
        8,
        threeFrame,
        [
          for (var offset = 8; offset < 28; offset += 4) offset,
          for (var offset = 32; offset < 52; offset += 4) offset,
          for (var offset = 60; offset < 136; offset += 4) offset,
        ],
      ),
      (
        11,
        () => threeDrawBatch(flags: 1),
        [for (var offset = 36; offset < 100; offset += 4) offset],
      ),
    ];
    for (final (opcode, build, offsets) in cases) {
      for (final offset in offsets) {
        for (final value in [
          double.nan,
          double.infinity,
          double.negativeInfinity,
        ]) {
          final body = build();
          setF32(body, offset, value);
          threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(opcode, body)])));
        }
      }
    }
  });

  test('geometry attribute lengths and all attribute floats are checked', () {
    final offsets = <int>[];
    final body = threeGeometry();
    for (final start in [32, 72, 112, 140]) {
      final end = switch (start) {
        32 => 68,
        72 => 108,
        112 => 136,
        _ => 188,
      };
      offsets.addAll([
        for (var offset = start; offset < end; offset += 4) offset,
      ]);
    }
    for (final offset in offsets) {
      final invalid = Uint8List.fromList(body);
      setF32(invalid, offset, double.nan);
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(1, invalid)])));
    }
  });

  test('dynamic point positions tolerate non-finite vertices only for points', () {
    final body = threeGeometry(
      mask: 1,
      vertexCount: 2,
      primitive: 2,
      indices: const [],
    );
    setF32(body, 32, double.nan);
    setF32(body, 36, double.infinity);
    setF32(body, 40, double.negativeInfinity);
    final geometry = threeProtocolDecoder
        .decodeR1(threeR1([(1, body)]))
        .commands
        .single as JsThreeGeometryUpsert;
    expect(geometry.primitive, JsThreePrimitive.points);
    expect(geometry.positions[0].isNaN, isTrue);
    expect(geometry.positions[1], double.infinity);
    expect(geometry.positions[2], double.negativeInfinity);

    final triangles = threeGeometry(mask: 1, indices: const []);
    setF32(triangles, 32, double.nan);
    threeBad(
      () => threeProtocolDecoder.decodeR1(threeR1([(1, triangles)])),
    );
  });

  group('R1 v3', () {
    Uint8List spotLight({
      double angle = 0.6283,
      double penumbra = 0.2,
      double distance = 0,
      double decay = 0,
    }) {
      final out = Uint8List(64);
      setU32(out, 0, 4);
      setU32(out, 4, JsThreeLightType.spot.wireValue);
      setF32(out, 8, 0.1);
      setF32(out, 12, 0.2);
      setF32(out, 16, 0.3);
      setF32(out, 20, 60);
      for (var i = 0; i < 6; i++) {
        setF32(out, 24 + i * 4, i - 0.5);
      }
      setF32(out, 48, angle);
      setF32(out, 52, penumbra);
      setF32(out, 56, distance);
      setF32(out, 60, decay);
      return out;
    }

    Uint8List clippedMaterial({int clipId = 11, int clipFlags = 2}) {
      final out = Uint8List(80);
      setU32(out, 0, 3);
      setU32(out, 4, 1);
      setU32(out, 8, JsThreeMaterialKind.meshPhong.wireValue);
      setU32(out, 20, 2);
      setF32(out, 24, 0.25);
      setF32(out, 28, 0.5);
      setF32(out, 32, 0.75);
      setF32(out, 36, 1);
      setF32(out, 40, 0.5);
      setF32(out, 44, 0.5);
      setF32(out, 48, 0);
      setF32(out, 52, 1);
      setU32(out, 56, clipId);
      setU32(out, 60, clipFlags);
      setF32(out, 64, 0.9);
      setF32(out, 68, 0.8);
      setF32(out, 72, 0.7);
      setF32(out, 76, 100);
      return out;
    }

    Uint8List clipping({int id = 11, int version = 1, int count = 1}) {
      final planes = <double>[
        for (var index = 0; index < count; index++) ...[0, -1, 0, 0.8 - index],
      ];
      final out = Uint8List(12 + planes.length * 4);
      setU32(out, 0, id);
      setU32(out, 4, version);
      setU32(out, 8, count);
      for (var index = 0; index < planes.length; index++) {
        setF32(out, 12 + index * 4, planes[index]);
      }
      return out;
    }

    test('spot light decodes cone parameters and validates ranges', () {
      final stream = threeProtocolDecoder.decodeR1(threeR1([(7, spotLight())], version: 3));
      final light = stream.commands.single as JsThreeLightUpsert;
      expect(light.type, JsThreeLightType.spot);
      expect(light.intensity, 60);
      expect(light.spotAngle, closeTo(0.6283, 0.0001));
      expect(light.spotPenumbra, closeTo(0.2, 0.0001));
      expect(light.spotDistance, 0);
      expect(light.spotDecay, 0);
      expect(light.groundColorR, 0);

      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(7, spotLight())], version: 2)));
      threeBad(
        () => threeProtocolDecoder.decodeR1(threeR1([(7, spotLight(angle: 0))], version: 3)),
      );
      threeBad(
        () =>
            threeProtocolDecoder.decodeR1(threeR1([(7, spotLight(angle: 3.1416))], version: 3)),
      );
      threeBad(
        () =>
            threeProtocolDecoder.decodeR1(threeR1([(7, spotLight(penumbra: 8.5))], version: 3)),
      );
      // Upstream tweens penumbra above 1 (webgl_lights_spotlights); the
      // accepted band is [0, 8].
      final overOne = threeProtocolDecoder
          .decodeR1(threeR1([(7, spotLight(penumbra: 1.5))], version: 3))
          .commands;
      final overOneLight = overOne.whereType<JsThreeLightUpsert>().single;
      expect(overOneLight.spotPenumbra, 1.5);
      threeBad(
        () =>
            threeProtocolDecoder.decodeR1(threeR1([(7, spotLight(distance: -1))], version: 3)),
      );
    });

    test('materials carry clip id and flags', () {
      final stream = threeProtocolDecoder.decodeR1(
        threeR1([(3, clippedMaterial())], version: 3),
      );
      final material = stream.commands.single as JsThreeMaterialUpsert;
      expect(material.clipId, 11);
      expect(material.hasClipping, isTrue);
      expect(material.clipShadows, isTrue);
      expect(material.clipIntersection, isFalse);
      expect(material.shininess, 100);

      final badFlags = Uint8List.fromList(clippedMaterial(clipFlags: 4));
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(3, badFlags)], version: 3)));
    });

    test('clipping command decodes normalized planes and bounds counts', () {
      final stream = threeProtocolDecoder.decodeR1(
        threeR1([(13, clipping(count: 2))], version: 3),
      );
      final command = stream.commands.single as JsThreeClippingUpsert;
      expect(command.clipId, 11);
      expect(command.planeCount, 2);
      expect(command.planes[1], closeTo(-1, 0.0001));
      expect(command.planes[7], closeTo(-0.2, 0.0001));

      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(13, clipping())], version: 2)));
      threeBad(
        () => threeProtocolDecoder.decodeR1(threeR1([(13, clipping(count: 17))], version: 3)),
      );
      final zeroNormal = clipping();
      setF32(zeroNormal, 12, 0);
      setF32(zeroNormal, 16, 0);
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(13, zeroNormal)], version: 3)));
    });

    test('frame names its shadow light owner and rejects mismatches', () {
      final stream = threeProtocolDecoder.decodeR1(
        threeR1([
          (
            8,
            threeFrame(
              shadowWidth: 1024,
              shadowHeight: 1024,
              shadowLightType: 2,
              culledNodeIds: [4],
            ),
          ),
        ], version: 3),
      );
      final frame = stream.commands.single as JsThreeSubmitFrame;
      expect(frame.hasSpotShadow, isTrue);
      expect(frame.culledNodeIds, [4]);

      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([
            (
              8,
              threeFrame(shadowWidth: 1024, shadowHeight: 1024, shadowLightType: 3),
            ),
          ], version: 3),
        ),
      );
      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([(8, threeFrame(shadowLightType: 1))], version: 3),
        ),
      );
    });
  });

  group('R1 v8', () {
    Uint8List _stencilClear({int nodeId = 0, int value = 0}) {
      final out = Uint8List(8);
      setU32(out, 0, nodeId);
      setU32(out, 4, value);
      return out;
    }

    test('decodes the material stencil tail and the colorWrite flag', () {
      final decoded = threeProtocolDecoder.decodeR1(
        threeR1([(3, threeMaterialV8(stencil: true))], version: 8),
      );
      final material = decoded.commands.whereType<JsThreeMaterialUpsert>().single;
      expect(material.flags & 0x800, 0x800);
      expect(material.hasStencil, isTrue);
      expect(material.colorWrite, isTrue);
      expect(material.stencilWrite, isTrue);
      expect(material.stencilFunc, JsThreeStencilFunc.notEqual);
      expect(material.stencilRef, 3);
      expect(material.stencilFuncMask, 15);
      expect(material.stencilWriteMask, 240);
      expect(material.stencilFailOp, JsThreeStencilOp.keep);
      expect(material.stencilZFailOp, JsThreeStencilOp.replace);
      expect(material.stencilZPassOp, JsThreeStencilOp.incrementWrap);
    });

    test('colorWrite-off flag decodes without a stencil tail', () {
      final decoded = threeProtocolDecoder.decodeR1(
        threeR1([(3, threeMaterialV8(colorWriteOff: true))], version: 8),
      );
      final material = decoded.commands.whereType<JsThreeMaterialUpsert>().single;
      expect(material.colorWrite, isFalse);
      expect(material.hasStencil, isFalse);
      expect(material.stencilWrite, isFalse);
      expect(material.stencilFunc, JsThreeStencilFunc.always);
      expect(material.stencilRef, 0);
      expect(material.stencilFuncMask, 255);
      expect(material.stencilWriteMask, 255);
      expect(material.stencilFailOp, JsThreeStencilOp.keep);
      expect(material.stencilZFailOp, JsThreeStencilOp.keep);
      expect(material.stencilZPassOp, JsThreeStencilOp.keep);
    });

    test('stenciless v8 materials decode like v7 (byte-identical defaults)', () {
      final v7 = threeProtocolDecoder
          .decodeR1(threeR1([(3, threeMaterialV6())], version: 7))
          .commands
          .whereType<JsThreeMaterialUpsert>()
          .single;
      final v8 = threeProtocolDecoder
          .decodeR1(threeR1([(3, threeMaterialV8())], version: 8))
          .commands
          .whereType<JsThreeMaterialUpsert>()
          .single;
      expect(v8.flags, v7.flags);
      expect(v8.colorWrite, isTrue);
      expect(v8.hasStencil, isFalse);
      expect(v8.stencilWrite, v7.stencilWrite);
      expect(v8.stencilFunc, v7.stencilFunc);
      expect(v8.stencilRef, v7.stencilRef);
      expect(v8.stencilFuncMask, v7.stencilFuncMask);
      expect(v8.stencilWriteMask, v7.stencilWriteMask);
      expect(v8.stencilFailOp, v7.stencilFailOp);
      expect(v8.stencilZFailOp, v7.stencilZFailOp);
      expect(v8.stencilZPassOp, v7.stencilZPassOp);
      // bits 10/11 stay invalid below v8.
      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([(3, threeMaterialV8(colorWriteOff: true))], version: 7),
        ),
      );
      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([(3, threeMaterialV8(stencil: true))], version: 7),
        ),
      );
    });

    test('validates the stencil tail: presence, enums, and 8-bit ranges', () {
      // Flag bit 11 without the 32-byte tail.
      final flaggedNoTail = threeMaterialV8();
      setU32(flaggedNoTail, 16, 31 | 0x800);
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(3, flaggedNoTail)], version: 8)));
      // Tail without flag bit 11 (emissive range check rejects the bytes).
      final tailless = threeMaterialV8(stencil: true);
      setU32(tailless, 16, 31);
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(3, tailless)], version: 8)));
      for (final (offset, value) in [
        (4, 0x0208), // unknown stencil func
        (4, 0x0000), // 0 is GL_NEVER-adjacent junk, not in the GL table
        (8, 256), // reference outside the 8-bit attachment
        (12, 256), // func mask outside the 8-bit attachment
        (16, 256), // write mask outside the 8-bit attachment
        (20, 0x0001), // unknown fail op
        (24, 0x150b), // unknown zfail op
        (28, 0x8509), // unknown zpass op
        (0, 2), // stencil write must be 0 or 1
      ]) {
        final body = threeMaterialV8(stencil: true);
        final tail = body.length - 32;
        setU32(body, tail + offset, value);
        threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(3, body)], version: 8)));
      }
    });

    test('decodes STENCIL_CLEAR markers and their stream order', () {
      final decoded = threeProtocolDecoder.decodeR1(
        threeR1([
          (15, _stencilClear(nodeId: 7, value: 2)),
          (15, _stencilClear()),
          (15, _stencilClear(nodeId: 9, value: 255)),
        ], version: 8),
      );
      final clears = decoded.commands.whereType<JsThreeStencilClear>().toList();
      expect(clears, hasLength(3));
      expect(clears[0].nodeId, 7);
      expect(clears[0].value, 2);
      // nodeId 0 is meaningful ("at this stream position").
      expect(clears[1].nodeId, 0);
      expect(clears[1].value, 0);
      expect(clears[2].nodeId, 9);
      expect(clears[2].value, 255);
    });

    test('STENCIL_CLEAR requires v8, a short body, and an 8-bit value', () {
      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([(15, _stencilClear(value: 1))], version: 7),
        ),
      );
      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([(15, _stencilClear(value: 256))], version: 8),
        ),
      );
      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([(15, Uint8List(4))], version: 8),
        ),
      );
      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([(15, Uint8List(9))], version: 8),
        ),
      );
    });

    test('frame-target flag bit 0x10 decodes the frame-start stencil clear', () {
      final cleared = threeProtocolDecoder
          .decodeR1(threeR1([(8, threeFrameV6Target(flags: 0x1f))], version: 8))
          .commands
          .whereType<JsThreeSubmitFrame>()
          .single;
      expect(cleared.frameStartClearStencil, isTrue);
      final persisting = threeProtocolDecoder
          .decodeR1(threeR1([(8, threeFrameV6Target(flags: 0x0f))], version: 8))
          .commands
          .whereType<JsThreeSubmitFrame>()
          .single;
      expect(persisting.frameStartClearStencil, isFalse);
      // v7 keeps the legacy always-clear default and rejects the new bit.
      final legacy = threeProtocolDecoder
          .decodeR1(threeR1([(8, threeFrameV6Target(flags: 0x0f))], version: 7))
          .commands
          .whereType<JsThreeSubmitFrame>()
          .single;
      expect(legacy.frameStartClearStencil, isTrue);
      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([(8, threeFrameV6Target(flags: 0x1f))], version: 7),
        ),
      );
    });

    test('latestR1Version is 8', () {
      expect(JsThreeProtocolDecoder.latestR1Version, 8);
      expect(
        threeProtocolDecoder.decodeR1(threeR1(const [], version: 8)).version,
        8,
      );
    });
  });
}
