import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_protocol_bytes.dart';
import 'support/three_protocol_cases.dart';

void main() {
  test('decodes the R1 v4 frame tone mapping + FogExp2 tail', () {
    final decoded = threeProtocolDecoder.decodeR1(threeR1([(8, threeFrameV4())], version: 4));
    final frame = decoded.commands.whereType<JsThreeSubmitFrame>().single;
    expect(frame.toneMapping, JsThreeToneMapping.acesFilmic);
    expect(frame.exposure, 2.5);
    expect(frame.toneMappingExposure, 2.5);
    expect(frame.fogMode, JsThreeFogMode.exp2);
    expect(frame.fogDensity, closeTo(0.0025, 1e-9));
    // The rest of the frame still decodes identically to v3.
    expect(frame.sceneId, 7);
    expect(frame.fogNear, 50);
    expect(frame.fogFar, 75);
    expect(frame.shadowContentRevision, isNull);
  });

  test('v3 streams still decode with v4-default tone/fog fields', () {
    final decoded = threeProtocolDecoder.decodeR1(
      threeR1([
        (8, threeFrame(shadowLightType: 1, shadowWidth: 1024, shadowHeight: 1024)),
      ], version: 3),
    );
    final frame = decoded.commands.whereType<JsThreeSubmitFrame>().single;
    expect(frame.toneMapping, JsThreeToneMapping.none);
    // v3 streams carry exposure through; tone mapping stays none.
    expect(frame.toneMappingExposure, 1.25);
    expect(frame.fogDensity, 0);
    expect(frame.shadowLightType, 1);
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        threeR1([(8, threeFrameVariant(threeFrameV4(), 28, 2))], version: 3),
      ),
    );
  });

  test('validates the R1 v4 tone/fog tail ranges', () {
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        threeR1([(8, threeFrameVariant(threeFrameV4(), 56, -1))], version: 4),
      ),
    );
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        // linear fog (mode 1) with a nonzero density
        threeR1([
          (8, threeFrameVariant(threeFrameVariant(threeFrameV4(), 28, 1), 56, 0.5)),
        ], version: 4),
      ),
    );
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        threeR1([(8, threeFrameVariant(threeFrameV4(), 52, 99))], version: 4),
      ),
    );
  });

  test('decodes the R1 v5 point-shadow frame tail', () {
    final decoded = threeProtocolDecoder.decodeR1(threeR1([(8, threeFrameV5Point())], version: 5));
    final frame = decoded.commands.whereType<JsThreeSubmitFrame>().single;
    expect(frame.hasPointShadow, 1);
    expect(frame.pointShadowLightX, 1.5);
    expect(frame.pointShadowLightY, -2);
    expect(frame.pointShadowLightZ, 3.25);
    expect(frame.pointShadowFar, 500);
    expect(frame.shadowLightType, JsThreeShadowLightType.point.wireValue);
    expect(frame.hasShadow, isTrue);
    // The v4 tone/fog tail still decodes in front of it.
    expect(frame.toneMapping, JsThreeToneMapping.acesFilmic);
    expect(frame.fogMode, JsThreeFogMode.exp2);
  });

  test('v4 streams decode with v5-default (inactive) point-shadow fields', () {
    final decoded = threeProtocolDecoder.decodeR1(threeR1([(8, threeFrameV4())], version: 4));
    final frame = decoded.commands.whereType<JsThreeSubmitFrame>().single;
    expect(frame.hasPointShadow, 0);
    expect(frame.pointShadowLightX, 0);
    expect(frame.pointShadowFar, 0);
  });

  test('inactive v5 point-shadow tail requires zeroed fields', () {
    // flag 0 with a light position set.
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        threeR1([(8, threeFrameV5Point(flag: 0, x: 1, lightType: 0))], version: 5),
      ),
    );
  });

  test('validates the R1 v5 point-shadow tail ranges', () {
    // flag must be 0 or 1.
    threeBad(
      () => threeProtocolDecoder.decodeR1(threeR1([(8, threeFrameV5Point(flag: 2))], version: 5)),
    );
    // reserved field must stay zero.
    threeBad(
      () =>
          threeProtocolDecoder.decodeR1(threeR1([(8, threeFrameV5Point(reserved: 1))], version: 5)),
    );
    // active shadow needs a positive far plane.
    threeBad(
      () => threeProtocolDecoder.decodeR1(threeR1([(8, threeFrameV5Point(far: 0))], version: 5)),
    );
    // the point-shadow fields require a point shadow light type.
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        threeR1([(8, threeFrameV5Point(lightType: 0))], version: 5),
      ),
    );
    // a point shadow light requires the point-shadow fields.
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        threeR1([
          (
            8,
            threeFrameV5Point(
              flag: 0,
              lightType: JsThreeShadowLightType.point.wireValue,
            ),
          ),
        ], version: 5),
      ),
    );
  });

  test('decodes the R1 v4 material texture-slot tail', () {
    final decoded = threeProtocolDecoder.decodeR1(
      threeR1([
        (
          3,
          threeMaterialV4(
            mapUv: [0.008, 0, 0, 0, 0.008, 0, 0.5, 0.25, 1],
            alphaMapUv: [2, 0, 0, 0, 2, 0, 0, 0, 1],
          ),
        ),
      ], version: 4),
    );
    final material = decoded.commands.whereType<JsThreeMaterialUpsert>().single;
    expect(material.mapTextureId, 11);
    expect(material.alphaMapTextureId, 12);
    expect(material.hasAlphaMap, isTrue);
    expect(material.envMapTextureId, 13);
    expect(material.hasEnvMap, isTrue);
    expect(material.envMapIntensity, 1.75);
    // Column-major three.js Matrix3 elements round-trip byte-exact.
    expect(material.mapUvMatrix[0], closeTo(0.008, 1e-7));
    expect(material.mapUvMatrix[4], closeTo(0.008, 1e-7));
    expect(material.mapUvMatrix[6], 0.5);
    expect(material.mapUvMatrix[7], 0.25);
    expect(material.alphaMapUvMatrix[0], 2);
    // v3 materials decode with the identity/default slot tail.
    final legacy = threeProtocolDecoder
        .decodeR1(threeR1([(3, threeMaterial())]))
        .commands
        .whereType<JsThreeMaterialUpsert>()
        .single;
    expect(legacy.alphaMapTextureId, 0);
    expect(legacy.hasAlphaMap, isFalse);
    expect(legacy.envMapTextureId, 0);
    expect(legacy.envMapIntensity, 1);
    expect(legacy.mapUvMatrix, everyElement(isNotNull));
    expect(legacy.mapUvMatrix[0], 1);
    expect(legacy.mapUvMatrix[1], 0);
    // envMapIntensity below -1 is rejected (negative encodes the
    // CubeRefractionMapping refraction ratio, so |v| <= 1).
    threeBad(
      () =>
          threeProtocolDecoder.decodeR1(threeR1([(3, threeFrameVariant(threeMaterialV4(), 72, -1.5))])),
    );
  });

  test('decodes T1 metadata and every R1 opcode into immutable values', () {
    final bytes = threeT1(
      threeR1(threeAllCommands()),
      sequence: 7,
      engine: 'enginæ',
      surface: '表面',
    );
    final decoded = threeProtocolDecoder.decode(bytes);
    expect(decoded.envelope.protocolVersion, 1);
    expect(decoded.envelope.kind, 1);
    expect(decoded.envelope.sequence, 7);
    expect(decoded.envelope.engineId, 'enginæ');
    expect(decoded.envelope.surfaceId, '表面');
    expect(decoded.envelope.totalBytes, bytes.length);
    expect(decoded.envelope.payloadBytes, decoded.envelope.payload.length);
    expect(decoded.stream.commands.map((c) => c.opcode), [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
    ]);

    final geometry = decoded.stream.commands[0] as JsThreeGeometryUpsert;
    expect(geometry.attributeMask, 15);
    expect(geometry.vertexCount, 3);
    expect(geometry.indexCount, 3);
    expect(geometry.positions, hasLength(9));
    expect(geometry.normals, hasLength(9));
    expect(geometry.uvs, hasLength(6));
    expect(geometry.colors, hasLength(12));
    expect(geometry.colorStride, 4);
    expect(geometry.indices, [0, 1, 2]);
    final texture = decoded.stream.commands[1] as JsThreeTextureUpsert;
    expect(texture.encoding, JsThreeTextureEncoding.rawRgba8);
    expect(texture.srgb && texture.flipY && texture.nearestMag, isTrue);
    expect(texture.nearestMin && texture.mipmaps, isTrue);
    expect(texture.repeatS && texture.repeatT && !texture.isEncoded, isTrue);
    final material = decoded.stream.commands[2] as JsThreeMaterialUpsert;
    expect(material.kind, JsThreeMaterialKind.meshStandard);
    expect(material.side, JsThreeSide.double);
    expect(material.vertexColors && material.flatShading, isTrue);
    expect(
      material.transparent && material.depthTest && material.depthWrite,
      isTrue,
    );
    final node = decoded.stream.commands[3] as JsThreeNodeUpsert;
    expect(node.visible, isTrue);
    expect(node.castShadow && node.receiveShadow, isTrue);
    expect(node.matrixWorld, hasLength(16));
    expect(decoded.stream.commands[4], isA<JsThreeRemoveNode>());
    final camera = decoded.stream.commands[5] as JsThreeCameraUpsert;
    expect(camera.type, JsThreeCameraType.orthographic);
    expect(camera.matrixWorldInverse, hasLength(16));
    expect(camera.projectionMatrix, hasLength(16));
    expect(camera.matrixWorld, hasLength(16));
    final light = decoded.stream.commands[6] as JsThreeLightUpsert;
    expect(light.type, JsThreeLightType.point);
    expect(light.worldPosition, hasLength(3));
    expect(light.worldDirection, hasLength(3));
    final frame = decoded.stream.commands[7] as JsThreeSubmitFrame;
    expect(frame.sceneId, 7);
    expect(frame.cameraId, 9);
    expect(frame.exposure, closeTo(1.25, 0.00001));
    expect(frame.fogMode, JsThreeFogMode.linear);
    expect(frame.fogColorR, closeTo(0.5, 0.00001));
    expect(frame.fogColorG, closeTo(0.6, 0.00001));
    expect(frame.fogColorB, closeTo(0.7, 0.00001));
    expect(frame.fogNear, 50);
    expect(frame.fogFar, 75);
    final disposal = decoded.stream.commands[8] as JsThreeDisposeResource;
    expect(disposal.resourceKind, JsThreeResourceKind.geometry);
    expect(decoded.stream.commands[9], isA<JsThreeDisposeSurface>());
    final batch = decoded.stream.commands[10] as JsThreeDrawBatchUpsert;
    expect(batch.nodeId, 7);
    expect(batch.version, 1);
    expect(batch.instanceCount, 1);
    expect(batch.instanced, isFalse);
    expect(batch.parts.single.geometryId, 1);
    expect(batch.parts.single.materialId, 3);
    expect(batch.parts.single.offset, 0);
    expect(batch.parts.single.count, 3);
    expect(batch.instanceMatrices, isEmpty);
    expect(decoded.stream.commands[11], isA<JsThreeRemoveBatch>());

    expect(() => decoded.envelope.payload[0] = 0, throwsUnsupportedError);
    expect(() => geometry.positions[0] = 0, throwsUnsupportedError);
    expect(() => geometry.indices[0] = 0, throwsUnsupportedError);
    expect(() => texture.data[0] = 0, throwsUnsupportedError);
    expect(
      () => decoded.stream.commands.add(decoded.stream.commands.first),
      throwsUnsupportedError,
    );
    expect(() => batch.parts.add(batch.parts.single), throwsUnsupportedError);
  });

  test(
    'R1 v2 adds strict HemisphereLight payloads without invalidating v1',
    () {
      final legacy = threeProtocolDecoder.decodeR1(threeR1([(7, threeLight())]));
      expect(legacy.version, 1);
      final legacyLight = legacy.commands.single as JsThreeLightUpsert;
      expect(legacyLight.type, JsThreeLightType.point);
      expect(legacyLight.groundColorR, 0);
      expect(legacyLight.groundColorG, 0);
      expect(legacyLight.groundColorB, 0);

      final legacyInV2 = threeProtocolDecoder.decodeR1(threeR1([(7, threeLight())], version: 2));
      expect(legacyInV2.version, 2);
      expect(legacyInV2.commands.single, isA<JsThreeLightUpsert>());

      final body = threeLight(type: JsThreeLightType.hemisphere);
      final decoded = threeProtocolDecoder.decodeR1(threeR1([(7, body)], version: 2));
      final light = decoded.commands.single as JsThreeLightUpsert;
      expect(decoded.version, 2);
      expect(light.type, JsThreeLightType.hemisphere);
      expect(light.type, isNot(JsThreeLightType.ambient));
      expect(light.colorR, closeTo(0.1, 1e-6));
      expect(light.colorG, closeTo(0.2, 1e-6));
      expect(light.colorB, closeTo(0.3, 1e-6));
      expect(light.intensity, 2);
      expect(light.worldPosition, hasLength(3));
      expect(light.worldDirection, hasLength(3));
      expect(light.groundColorR, 0.75);
      expect(light.groundColorG, 0.5);
      expect(light.groundColorB, 0.25);

      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(7, body)])));
      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([(7, Uint8List.sublistView(body, 0, 60))], version: 2),
        ),
      );
      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([
            (7, Uint8List.fromList([...body, 0])),
          ], version: 2),
        ),
      );
      final reserved = Uint8List.fromList(body);
      setU32(reserved, 60, 1);
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(7, reserved)], version: 2)));
      final legacyExtended = Uint8List.fromList([
        ...threeLight(),
        ...Uint8List(16),
      ]);
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(7, legacyExtended)], version: 2)));
      for (final offset in [48, 52, 56]) {
        for (final value in [double.nan, double.infinity]) {
          final invalid = Uint8List.fromList(body);
          setF32(invalid, offset, value);
          threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(7, invalid)], version: 2)));
        }
      }
    },
  );

  test(
    'accepts primitive, color stride, encoded texture, and empty variants',
    () {
      final variants = <JsThreeCommand>[
        ...threeProtocolDecoder
            .decodeR1(
              threeR1([
                (1, threeGeometry(mask: 1, vertexCount: 3, indices: const [])),
                (
                  1,
                  threeGeometry(
                    mask: 1,
                    vertexCount: 4,
                    primitive: 1,
                    indices: const [],
                  ),
                ),
                (
                  1,
                  threeGeometry(
                    mask: 9,
                    vertexCount: 1,
                    primitive: 2,
                    colorComponents: 3,
                    indices: const [],
                  ),
                ),
                (
                  2,
                  threeTexture(width: 0, height: 0, encoding: 1, data: const [9]),
                ),
                (
                  2,
                  threeTexture(
                    width: 0,
                    height: 0,
                    encoding: 2,
                    data: const [8, 7],
                  ),
                ),
              ]),
            )
            .commands,
      ];
      expect(
        (variants[0] as JsThreeGeometryUpsert).primitive,
        JsThreePrimitive.triangles,
      );
      expect(
        (variants[1] as JsThreeGeometryUpsert).primitive,
        JsThreePrimitive.lines,
      );
      final points = variants[2] as JsThreeGeometryUpsert;
      expect(points.primitive, JsThreePrimitive.points);
      expect(points.colorStride, 3);
      expect(points.colors, hasLength(3));
      expect(
        (variants[3] as JsThreeTextureUpsert).encoding,
        JsThreeTextureEncoding.png,
      );
      expect(
        (variants[4] as JsThreeTextureUpsert).encoding,
        JsThreeTextureEncoding.jpeg,
      );
      expect(threeProtocolDecoder.decodeR1(threeR1(const [])).commands, isEmpty);
    },
  );

  test('decodes the ShadowMaterial kind with its color/opacity payload', () {
    final commands = threeProtocolDecoder
        .decodeR1(threeR1([(3, threeMaterial(kind: JsThreeMaterialKind.shadow))]))
        .commands;
    final material = commands[0] as JsThreeMaterialUpsert;
    expect(material.kind, JsThreeMaterialKind.shadow);
    expect(material.transparent, isTrue);
    expect(material.opacity, closeTo(0.8, 1e-6));
  });

  test('decodes THREE blending from material flags bits 7..9', () {
    for (final mode in [0, 1, 2, 3, 4]) {
      final body = threeMaterial();
      setU32(body, 16, mode << 7);
      final commands = threeProtocolDecoder.decodeR1(threeR1([(3, body)])).commands;
      final material = commands[0] as JsThreeMaterialUpsert;
      expect(material.blending, mode, reason: 'blending mode $mode');
    }
  });

  test('decodes Phong scalars and optional unique-edge wire indices', () {
    final commands = threeProtocolDecoder
        .decodeR1(
          threeR1([
            (
              3,
              threeMaterial(
                kind: JsThreeMaterialKind.meshPhong,
                wireframe: true,
                shininess: 0,
              ),
            ),
            (1, threeGeometry(mask: 1, wireIndices: const [0, 1, 1, 2, 2, 0])),
          ]),
        )
        .commands;
    final material = commands[0] as JsThreeMaterialUpsert;
    expect(material.kind, JsThreeMaterialKind.meshPhong);
    expect(material.wireframe, isTrue);
    expect(material.specularR, 0.125);
    expect(material.specularG, 0.25);
    expect(material.specularB, 0.5);
    expect(material.shininess, 0);
    final geometry = commands[1] as JsThreeGeometryUpsert;
    expect(geometry.hasWireIndices, isTrue);
    expect(geometry.wireIndexCount, 6);
    expect(geometry.wireIndices, [0, 1, 1, 2, 2, 0]);
    expect(() => geometry.wireIndices![0] = 0, throwsUnsupportedError);
    expect(
      (threeProtocolDecoder.decodeR1(threeR1([(1, threeGeometry())])).commands.single
              as JsThreeGeometryUpsert)
          .wireIndices,
      isNull,
    );
  });

  test('decodes Normal distinctly and additive lit emissive payloads', () {
    final commands = threeProtocolDecoder
        .decodeR1(
          threeR1([
            (
              3,
              threeMaterial(kind: JsThreeMaterialKind.meshNormal, wireframe: true),
            ),
            for (final kind in [
              JsThreeMaterialKind.meshLambert,
              JsThreeMaterialKind.meshStandard,
              JsThreeMaterialKind.meshPhong,
            ])
              (3, threeMaterial(kind: kind, emissive: true)),
          ]),
        )
        .commands;
    final normal = commands[0] as JsThreeMaterialUpsert;
    expect(normal.kind, JsThreeMaterialKind.meshNormal);
    expect(normal.kind.wireValue, 6);
    expect(normal.wireframe, isTrue);
    expect(normal.emissiveR, 0);
    expect(normal.emissiveG, 0);
    expect(normal.emissiveB, 0);
    expect(normal.emissiveIntensity, 1);
    for (var index = 1; index < commands.length; index++) {
      final material = commands[index] as JsThreeMaterialUpsert;
      expect(material.emissiveR, 0.125);
      expect(material.emissiveG, 0.25);
      expect(material.emissiveB, 0.5);
      expect(material.emissiveIntensity, 2);
    }
    final legacy =
        threeProtocolDecoder.decodeR1(threeR1([(3, threeMaterial())])).commands.single
            as JsThreeMaterialUpsert;
    expect(legacy.emissiveR, 0);
    expect(legacy.emissiveIntensity, 1);
  });

  test('rejects malformed or unsupported emissive extensions', () {
    for (final kind in [
      JsThreeMaterialKind.meshBasic,
      JsThreeMaterialKind.lineBasic,
      JsThreeMaterialKind.pointsBasic,
      JsThreeMaterialKind.meshNormal,
    ]) {
      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([(3, threeMaterial(kind: kind, emissive: true))]),
        ),
      );
    }
    for (final kind in [
      JsThreeMaterialKind.meshLambert,
      JsThreeMaterialKind.meshStandard,
      JsThreeMaterialKind.meshPhong,
    ]) {
      final truncated = threeMaterial(kind: kind, emissive: true);
      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([(3, Uint8List.sublistView(truncated, 0, truncated.length - 1))]),
        ),
      );
      final negative = threeMaterial(kind: kind, emissive: true);
      setF32(negative, negative.length - 4, -0.01);
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(3, negative)])));
      final nonFinite = threeMaterial(kind: kind, emissive: true);
      setF32(nonFinite, nonFinite.length - 16, double.nan);
      threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(3, nonFinite)])));
    }
  });

  test('rejects malformed Phong and wireframe extensions', () {
    final phong = threeMaterial(kind: JsThreeMaterialKind.meshPhong);
    threeBad(
      () => threeProtocolDecoder.decodeR1(threeR1([(3, Uint8List.sublistView(phong, 0, 56))])),
    );
    setF32(phong, 68, -1);
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(3, phong)])));
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        threeR1([
          (3, threeMaterial(kind: JsThreeMaterialKind.lineBasic, wireframe: true)),
        ]),
      ),
    );
    for (final wireIndices in [
      const [0],
      const [0, 3],
    ]) {
      threeBad(
        () => threeProtocolDecoder.decodeR1(
          threeR1([(1, threeGeometry(mask: 1, wireIndices: wireIndices))]),
        ),
      );
    }
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        threeR1([
          (
            1,
            threeGeometry(
              mask: 1,
              vertexCount: 4,
              primitive: 1,
              indices: const [],
              wireIndices: const [0, 1],
            ),
          ),
        ]),
      ),
    );
    final quota = threeGeometry(mask: 1, wireIndices: const []);
    setU32(quota, quota.length - 4, JsThreeProtocolDecoder.maxIndexCount + 1);
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(1, quota)])));
  });

  test('frame validates fog mode and linear fog range', () {
    final frame =
        threeProtocolDecoder
                .decodeR1(threeR1([(8, threeFrame(fogMode: 0, fogNear: 0, fogFar: 0))]))
                .commands
                .single
            as JsThreeSubmitFrame;
    expect(frame.fogMode, JsThreeFogMode.none);
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(8, threeFrame(fogNear: -1))])));
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(8, threeFrame(fogNear: 50, fogFar: 50))])));
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(8, threeFrame(fogMode: 2))])));
  });

  test('frame decodes directional shadows and validates their limits', () {
    final frame =
        threeProtocolDecoder
                .decodeR1(
                  threeR1([(8, threeFrame(shadowWidth: 2048, shadowHeight: 2048))]),
                )
                .commands
                .single
            as JsThreeSubmitFrame;
    expect(frame.hasShadow, isTrue);
    expect(frame.shadowMapWidth, 2048);
    expect(frame.shadowMapHeight, 2048);
    expect(frame.shadowBias, closeTo(-0.0001, 0.000001));
    expect(frame.shadowNormalBias, closeTo(0.02, 0.000001));
    expect(frame.shadowRadius, 1);
    expect(frame.shadowMatrix, hasLength(16));
    final pcss = threeProtocolDecoder
        .decodeR1(threeR1([
          (8, threeFrame(shadowWidth: 1024, shadowHeight: 1024, shadowRadius: -2)),
        ]))
        .commands
        .single as JsThreeSubmitFrame;
    expect(pcss.shadowRadius, -2, reason: 'negative radius is the PCSS marker');
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([
      (8, threeFrame(shadowWidth: 1024, shadowHeight: 1024, shadowRadius: 0)),
    ])));
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        threeR1([(8, threeFrame(shadowWidth: 2048, shadowHeight: 0))]),
      ),
    );
    threeBad(
      () => threeProtocolDecoder.decodeR1(
        threeR1([(8, threeFrame(shadowWidth: 8193, shadowHeight: 8193))]),
      ),
    );
    final noRadius = threeFrame();
    setF32(noRadius, 68, 0);
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(8, noRadius)])));
  });

  test('frame decodes independent main and shadow culled node ids', () {
    final frame =
        threeProtocolDecoder
                .decodeR1(
                  threeR1([
                    (
                      8,
                      threeFrame(
                        culledNodeIds: const [7, 11, 7],
                        culledShadowNodeIds: const [13, 17, 13],
                      ),
                    ),
                  ]),
                )
                .commands
                .single
            as JsThreeSubmitFrame;
    expect(frame.culledNodeIds, {7, 11});
    expect(frame.culledShadowNodeIds, {13, 17});

    final shadowOnly =
        threeProtocolDecoder
                .decodeR1(
                  threeR1([
                    (8, threeFrame(culledShadowNodeIds: const [19])),
                  ]),
                )
                .commands
                .single
            as JsThreeSubmitFrame;
    expect(shadowOnly.culledNodeIds, isEmpty);
    expect(shadowOnly.culledShadowNodeIds, {19});
  });

  test('node rejects unknown shadow flags', () {
    final node = threeNode();
    setU32(node, 88, 4);
    threeBad(() => threeProtocolDecoder.decodeR1(threeR1([(4, node)])));
  });

  test('decodes instanced and empty batches with exact matrix payloads', () {
    final matrices = List<double>.generate(32, (index) => index + 0.5);
    final commands = threeProtocolDecoder
        .decodeR1(
          threeR1([
            (
              11,
              threeDrawBatch(
                instanceCount: 2,
                flags: 1,
                parts: const [(1, 3, 3, 6), (2, 4, 0, 3)],
                matrices: matrices,
              ),
            ),
            (11, threeDrawBatch(instanceCount: 0, flags: 1)),
          ]),
        )
        .commands;
    final instanced = commands[0] as JsThreeDrawBatchUpsert;
    expect(instanced.instanced, isTrue);
    expect(instanced.instanceCount, 2);
    expect(instanced.parts, hasLength(2));
    expect(instanced.parts[1].offset, 0);
    expect(instanced.parts[0].count, 6);
    expect(instanced.instanceMatrices, matrices);
    expect(() => instanced.instanceMatrices[0] = 0, throwsUnsupportedError);
    final empty = commands[1] as JsThreeDrawBatchUpsert;
    expect(empty.instanceCount, 0);
    expect(empty.parts, hasLength(1));
    expect(empty.instanceMatrices, isEmpty);
    expect(empty.hasInstanceColors, isFalse);
    expect(empty.instanceColors, isEmpty);
  });

  test('decodes per-instance colors behind flag bit 2', () {
    final commands = threeProtocolDecoder
        .decodeR1(
          threeR1([
            (
              11,
              threeDrawBatch(
                instanceCount: 2,
                flags: 3,
                matrices: List<double>.filled(32, 0.5),
                colors: const [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
              ),
            ),
          ]),
        )
        .commands;
    final batch = commands.single as JsThreeDrawBatchUpsert;
    expect(batch.instanced, isTrue);
    expect(batch.hasInstanceColors, isTrue);
    final expected = const [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
    for (var index = 0; index < expected.length; index++) {
      expect(batch.instanceColors[index], closeTo(expected[index], 1e-6));
    }
    expect(() => batch.instanceColors[0] = 0, throwsUnsupportedError);
  });

  // Back-compat pin: the color flag is a DRAW_BATCH body field, not a
  // versioned tail — every stream version v3..v5 decodes the same payload,
  // and older-looking streams without the flag stay color-neutral (the
  // material color wins, byte-identical goldens depend on it).
  test(
    'instance colors decode identically on v3/v4/v5 and stay neutral without the flag',
    () {
      List<double> colorsAt(int version) {
        final commands = threeProtocolDecoder
            .decodeR1(
              threeR1([
                (
                  11,
                  threeDrawBatch(
                    instanceCount: 2,
                    flags: 3,
                    matrices: List<double>.filled(32, 0.5),
                    colors: const [0.75, 0.5, 0.25, 0.125, 0.1, 0.2],
                  ),
                ),
              ], version: version),
            )
            .commands;
        final batch = commands.single as JsThreeDrawBatchUpsert;
        return batch.instanceColors.toList();
      }

      const expected = [0.75, 0.5, 0.25, 0.125, 0.1, 0.2];
      for (final version in [3, 4, 5]) {
        final colors = colorsAt(version);
        for (var index = 0; index < expected.length; index++) {
          expect(
            colors[index],
            closeTo(expected[index], 1e-6),
            reason: 'v$version',
          );
        }
      }

      for (final version in [3, 4, 5]) {
        final neutral =
            threeProtocolDecoder
                    .decodeR1(
                      threeR1([
                        (11, threeDrawBatch(instanceCount: 2, flags: 1)),
                      ], version: version),
                    )
                    .commands
                    .single
                as JsThreeDrawBatchUpsert;
        expect(neutral.instanced, isTrue, reason: 'v$version');
        expect(neutral.hasInstanceColors, isFalse, reason: 'v$version');
        expect(neutral.instanceColors, isEmpty, reason: 'v$version');
      }
    },
  );

}
