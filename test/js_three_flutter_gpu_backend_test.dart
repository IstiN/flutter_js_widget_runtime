import 'dart:typed_data';

import 'package:flutter_gpu/gpu.dart' as gpu;
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_backend.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_protocol_bytes.dart';

JsThreeCommand _decode(int opcode, Uint8List body, {int version = 1}) {
  final bytes = Uint8List(20 + body.length);
  bytes.setAll(0, [0x4a, 0x53, 0x52, 0x31]);
  setU16(bytes, 4, version);
  setU32(bytes, 8, 1);
  bytes[12] = opcode;
  setU32(bytes, 16, body.length);
  bytes.setAll(20, body);
  return JsThreeProtocolDecoder().decodeR1(bytes).commands.single;
}

JsThreeSubmitFrame _frameWithRectangles({
  bool offscreen = false,
  List<double> viewport = const [0, 0, 320, 360],
  List<double>? scissor,
  bool scissorTest = true,
}) {
  final body = Uint8List(244);
  setU32(body, 0, 1);
  setU32(body, 4, 1);
  setF32(body, 24, 1);
  setF32(body, 100, 1);
  for (final index in [0, 5, 10, 15]) {
    setF32(body, 104 + index * 4, 1);
  }
  setU32(body, 184, 0x4658534a);
  setU32(body, 188, 1);
  setU32(body, 192, offscreen ? 2 : 0);
  setU32(body, 196, offscreen ? 640 : 0);
  setU32(body, 200, offscreen ? 360 : 0);
  final scissors = scissor ?? viewport;
  for (var index = 0; index < 4; index++) {
    setF32(body, 204 + index * 4, viewport[index]);
    setF32(body, 220 + index * 4, scissors[index]);
  }
  setU32(body, 236, 11 | (scissorTest ? 4 : 0));
  return _decode(8, body, version: 6) as JsThreeSubmitFrame;
}

ThreeShadowCacheKey _shadowKey({
  int contentRevision = 1,
  int width = 2048,
  int height = 2048,
  double bias = 0.001,
  double normalBias = 0.02,
  double pointFar = 0,
  List<double>? matrix,
}) => ThreeShadowCacheKey(
  contentRevision: contentRevision,
  width: width,
  height: height,
  bias: bias,
  normalBias: normalBias,
  pointFar: pointFar,
  matrix: matrix ?? List<double>.generate(16, (index) => index.toDouble()),
);

Uint8List _batch({bool instanced = true, List<double>? colors}) {
  final instanceCount = instanced ? 2 : 1;
  final matrixCount = instanced ? 32 : 0;
  final colorCount = colors?.length ?? 0;
  final body = Uint8List(36 + matrixCount * 4 + colorCount * 4);
  setU32(body, 0, 1);
  setU32(body, 4, 1);
  setU32(body, 8, instanceCount);
  setU32(body, 12, instanced ? (colors != null ? 3 : 1) : 0);
  setU32(body, 16, 1);
  setU32(body, 20, 1);
  setU32(body, 24, 1);
  setU32(body, 32, 3);
  for (var index = 0; index < matrixCount; index++) {
    setF32(body, 36 + index * 4, index + 0.25);
  }
  for (var index = 0; index < colorCount; index++) {
    setF32(body, 36 + matrixCount * 4 + index * 4, colors![index]);
  }
  return body;
}

ThreeDrawItem _draw({
  int offset = 0,
  int? count,
  JsThreeMaterialKind kind = JsThreeMaterialKind.meshBasic,
  bool indexed = true,
  bool wireframe = false,
  List<int>? wireIndices,
  double specularR = 0,
  double specularG = 0,
  double specularB = 0,
  double shininess = 0,
  bool emissive = false,
  double emissiveR = 0,
  double emissiveG = 0,
  double emissiveB = 0,
  double emissiveIntensity = 1,
  JsThreeSide side = JsThreeSide.front,
  int nodeId = 1,
  List<double>? matrixWorld,
  List<double> color = const [1, 1, 1],
  double opacity = 1,
}) {

  final geometry = Uint8List(
    68 +
        (indexed ? 24 : 0) +
        (wireIndices == null ? 0 : 4 + wireIndices.length * 4),
  );
  setU32(geometry, 0, 1);
  setU32(geometry, 4, 1);
  setU32(geometry, 8, 1);
  setU32(geometry, 12, 3);
  setU32(geometry, 16, indexed ? 6 : 0);
  setU32(geometry, 28, 36);
  const indices = [0, 1, 2, 2, 1, 0];
  if (indexed) {
    for (var index = 0; index < indices.length; index++) {
      setU32(geometry, 68 + index * 4, indices[index]);
    }
  }
  if (wireIndices != null) {
    final wireOffset = indexed ? 92 : 68;
    setU32(geometry, wireOffset, wireIndices.length);
    for (var index = 0; index < wireIndices.length; index++) {
      setU32(geometry, wireOffset + 4 + index * 4, wireIndices[index]);
    }
  }

  final phong = kind == JsThreeMaterialKind.meshPhong;
  final material = Uint8List((phong ? 72 : 56) + (emissive ? 16 : 0));
  setU32(material, 0, 1);
  setU32(material, 4, 1);
  setU32(material, 8, kind.wireValue);
  setU32(material, 16, 24 | (wireframe ? 32 : 0));
  setU32(material, 20, side.wireValue);
  setF32(material, 24, color[0]);
  setF32(material, 28, color[1]);
  setF32(material, 32, color[2]);
  setF32(material, 36, opacity);
  setF32(material, 40, 0.5);
  setF32(material, 44, 0.5);
  setF32(material, 52, 1);
  if (phong) {
    setF32(material, 56, specularR);
    setF32(material, 60, specularG);
    setF32(material, 64, specularB);
    setF32(material, 68, shininess);
  }
  if (emissive) {
    final offset = phong ? 72 : 56;
    setF32(material, offset, emissiveR);
    setF32(material, offset + 4, emissiveG);
    setF32(material, offset + 8, emissiveB);
    setF32(material, offset + 12, emissiveIntensity);
  }

  final node = Uint8List(92);
  setU32(node, 0, nodeId);
  setU32(node, 8, 1);
  setU32(node, 12, 1);
  setU32(node, 16, 1);
  setU32(node, 20, 1);
  for (var index = 0; index < 16; index++) {
    setF32(
      node,
      24 + index * 4,
      matrixWorld?[index] ?? (index % 5 == 0 ? 1 : 0),
    );
  }
  return ThreeDrawItem(
    node: _decode(4, node) as JsThreeNodeUpsert,
    geometry: _decode(1, geometry) as JsThreeGeometryUpsert,
    material: _decode(3, material) as JsThreeMaterialUpsert,
    primitive: wireframe
        ? ThreeDrawPrimitive.lines
        : ThreeDrawPrimitive.triangles,
    viewDepth: 0,
    indexOffset: offset,
    drawCount: count,
  );
}

void main() {
  test('main shadow sampling flips only the render-target V coordinate', () {
    final source = List<double>.generate(16, (index) => index.toDouble());
    final sampled = threeShadowSamplingMatrix(source);

    for (var index = 0; index < 16; index++) {
      final expected = switch (index) {
        1 || 5 || 9 => -source[index],
        13 => 1 - source[index],
        _ => source[index],
      };
      expect(sampled[index], expected);
    }
    expect(source, List<double>.generate(16, (index) => index.toDouble()));
  });

  test('vertex layout binds matrix columns and color at instance rate', () {
    final layout = debugThreeVertexLayout();

    expect(layout.buffers, hasLength(2));
    final instances = layout.buffers[1];
    expect(instances.strideInBytes, 80);
    expect(instances.stepMode, gpu.VertexStepMode.instance);
    expect(instances.attributes.map((attribute) => attribute.name), [
      'instanceModel0',
      'instanceModel1',
      'instanceModel2',
      'instanceModel3',
      'instanceColor',
    ]);
    expect(instances.attributes.map((attribute) => attribute.offsetInBytes), [
      0,
      16,
      32,
      48,
      64,
    ]);
    expect(
      instances.attributes.every(
        (attribute) => attribute.format == gpu.VertexFormat.float32x4,
      ),
      isTrue,
    );
  });

  test('ordinary and explicit instance payloads preserve exact ABI bytes', () {
    final identity = debugThreeIdentityInstanceData();
    expect(identity.lengthInBytes, 80);
    for (var index = 0; index < 16; index++) {
      expect(
        identity.getFloat32(index * 4, Endian.little),
        index % 5 == 0 ? 1.0 : 0.0,
      );
    }
    for (var component = 0; component < 4; component++) {
      expect(identity.getFloat32(64 + component * 4, Endian.little), 1);
    }

    final source = _decode(11, _batch()) as JsThreeDrawBatchUpsert;
    final packed = debugThreeInstanceData(source);
    expect(packed.lengthInBytes, 160);
    for (var instance = 0; instance < 2; instance++) {
      for (var index = 0; index < 16; index++) {
        expect(
          packed.getFloat32(instance * 80 + index * 4, Endian.little),
          instance * 16 + index + 0.25,
        );
      }
      for (var component = 0; component < 4; component++) {
        expect(
          packed.getFloat32(instance * 80 + 64 + component * 4, Endian.little),
          1,
        );
      }
    }
    final ordinary = _decode(11, _batch(instanced: false));
    expect(
      () => debugThreeInstanceData(ordinary as JsThreeDrawBatchUpsert),
      throwsArgumentError,
    );

    final coloredSource =
        _decode(11, _batch(colors: const [0.25, 0.5, 0.75, 0.9, 0.1, 0.2]))
            as JsThreeDrawBatchUpsert;
    expect(coloredSource.hasInstanceColors, isTrue);
    final colored = debugThreeInstanceData(coloredSource);
    expect(colored.lengthInBytes, 160);
    expect(colored.getFloat32(64, Endian.little), 0.25);
    expect(colored.getFloat32(68, Endian.little), 0.5);
    expect(colored.getFloat32(72, Endian.little), 0.75);
    expect(colored.getFloat32(76, Endian.little), 1);
    expect(colored.getFloat32(80 + 64, Endian.little), closeTo(0.9, 1e-6));
    expect(colored.getFloat32(80 + 68, Endian.little), closeTo(0.1, 1e-6));
    expect(colored.getFloat32(80 + 72, Endian.little), closeTo(0.2, 1e-6));
    expect(colored.getFloat32(80 + 76, Endian.little), 1);
  });

  test('auto-instance payload preserves 200 distinct matrices and colors', () {
    final draws = List<ThreeDrawItem>.generate(
      200,
      (instance) => _draw(
        nodeId: instance + 7,
        kind: JsThreeMaterialKind.meshPhong,
        matrixWorld: List<double>.generate(
          16,
          (index) => instance * 20 + index + 0.5,
        ),
        color: [instance / 199, (instance % 10) / 10, 0.75],
        opacity: instance.isEven ? 0.5 : 0.75,
      ),
    );
    final first = draws.first;
    final draw = ThreeDrawItem(
      node: first.node,
      geometry: first.geometry,
      material: first.material,
      primitive: first.primitive,
      viewDepth: 0,
      drawCount: first.drawCount,
      instanceCount: draws.length,
      autoInstanceDraws: draws,
    );

    final packed = debugThreeAutoInstanceData(draw);
    expect(packed.lengthInBytes, 200 * 80);
    for (var instance = 0; instance < draws.length; instance++) {
      for (var index = 0; index < 16; index++) {
        expect(
          packed.getFloat32(instance * 80 + index * 4, Endian.little),
          instance * 20 + index + 0.5,
        );
      }
      final expected = [
        instance / 199,
        (instance % 10) / 10,
        0.75,
        instance.isEven ? 0.5 : 0.75,
      ];
      for (var component = 0; component < 4; component++) {
        expect(
          packed.getFloat32(instance * 80 + 64 + component * 4, Endian.little),
          closeTo(expected[component], 1e-6),
        );
      }
    }
    final material = debugThreeMaterialUniform(draw);
    for (var component = 0; component < 4; component++) {
      expect(material.getFloat32(component * 4, Endian.little), 1);
    }
    expect(() => debugThreeAutoInstanceData(first), throwsArgumentError);
  });

  test('indexed batch metadata becomes a byte subrange', () {
    final range = debugThreeIndexRange(_draw(offset: 3, count: 3));
    expect(range.offsetInBytes, 12);
    expect(range.lengthInBytes, 12);
    expect(_draw().drawCount, 6);
    expect(
      () => debugThreeIndexRange(_draw(offset: 6, count: 3)),
      throwsArgumentError,
    );
  });

  test('non-indexed batch metadata becomes an interleaved vertex subrange', () {
    final range = debugThreeVertexRange(
      _draw(indexed: false, offset: 1, count: 2),
    );
    expect(range.offsetInBytes, ThreeInterleavedGeometry.strideInBytes);
    expect(range.lengthInBytes, ThreeInterleavedGeometry.strideInBytes * 2);
    expect(
      () => debugThreeVertexRange(_draw(indexed: false, offset: 2, count: 2)),
      throwsArgumentError,
    );
    expect(() => debugThreeVertexRange(_draw()), throwsArgumentError);
  });

  test(
    'Phong material uniforms carry distinct kind specular and shininess',
    () {
      final phong = debugThreeMaterialUniform(
        _draw(
          kind: JsThreeMaterialKind.meshPhong,
          specularR: 0.25,
          specularG: 0.5,
          specularB: 0.75,
          shininess: 64,
        ),
      );
      final lambert = debugThreeMaterialUniform(
        _draw(kind: JsThreeMaterialKind.meshLambert),
      );
      expect(phong.lengthInBytes, 336);
      expect(lambert.lengthInBytes, 336);
      expect(phong.getFloat32(28, Endian.little), 5);
      expect(lambert.getFloat32(28, Endian.little), 1);
      expect(phong.getFloat32(48, Endian.little), 0.25);
      expect(phong.getFloat32(52, Endian.little), 0.5);
      expect(phong.getFloat32(56, Endian.little), 0.75);
      expect(phong.getFloat32(60, Endian.little), 64);
      expect(lambert.getFloat32(48, Endian.little), 0);
      expect(lambert.getFloat32(60, Endian.little), 0);

      final changed = debugThreeMaterialUniform(
        _draw(kind: JsThreeMaterialKind.meshPhong, specularR: 1, shininess: 12),
      );
      expect(changed.getFloat32(48, Endian.little), 1);
      expect(changed.getFloat32(60, Endian.little), 12);
    },
  );

  test('Normal is distinct and emissive edits reach the 336-byte GPU ABI', () {
    final normal = debugThreeMaterialUniform(
      _draw(kind: JsThreeMaterialKind.meshNormal, side: JsThreeSide.double),
    );
    expect(normal.lengthInBytes, 336);
    expect(normal.getFloat32(28, Endian.little), 6);
    expect(normal.getFloat32(64, Endian.little), 0);
    expect(normal.getFloat32(76, Endian.little), 1);

    final emissive = debugThreeMaterialUniform(
      _draw(
        kind: JsThreeMaterialKind.meshStandard,
        emissive: true,
        emissiveR: 0.125,
        emissiveG: 0.25,
        emissiveB: 0.5,
        emissiveIntensity: 3,
      ),
    );
    expect(emissive.getFloat32(64, Endian.little), 0.125);
    expect(emissive.getFloat32(68, Endian.little), 0.25);
    expect(emissive.getFloat32(72, Endian.little), 0.5);
    expect(emissive.getFloat32(76, Endian.little), 3);

    final changed = debugThreeMaterialUniform(
      _draw(
        kind: JsThreeMaterialKind.meshPhong,
        emissive: true,
        emissiveR: 0.75,
        emissiveG: 0.5,
        emissiveB: 0.25,
        emissiveIntensity: 7,
      ),
    );
    expect(changed.getFloat32(28, Endian.little), 5);
    expect(changed.getFloat32(64, Endian.little), 0.75);
    expect(changed.getFloat32(68, Endian.little), 0.5);
    expect(changed.getFloat32(72, Endian.little), 0.25);
    expect(changed.getFloat32(76, Endian.little), 7);
  });

  test('wireframe index ranges use wire counts instead of triangle counts', () {
    final wire = _draw(wireframe: true, wireIndices: const [0, 1]);
    expect(wire.primitive, ThreeDrawPrimitive.lines);
    expect(wire.indexed, isTrue);
    expect(wire.drawCount, 2);
    final range = debugThreeIndexRange(wire);
    expect(range.offsetInBytes, 0);
    expect(range.lengthInBytes, 8);
    expect(
      () => debugThreeIndexRange(
        _draw(offset: 2, count: 2, wireframe: true, wireIndices: const [0, 1]),
      ),
      throwsArgumentError,
    );
  });

  test('shadow cache keys invalidate every content and shadow change', () {
    final original = _shadowKey();
    expect(original == _shadowKey(), isTrue);
    expect(original.hashCode, _shadowKey().hashCode);
    expect(original == Object(), isFalse);
    expect(original == _shadowKey(contentRevision: 2), isFalse);
    expect(original == _shadowKey(width: 1024), isFalse);
    expect(original == _shadowKey(height: 1024), isFalse);
    expect(original == _shadowKey(bias: 0.002), isFalse);
    expect(original == _shadowKey(normalBias: 0.03), isFalse);
    expect(original == _shadowKey(matrix: List<double>.filled(16, 0)), isFalse);
    final changed = List<double>.generate(16, (index) => index.toDouble());
    final defensiveCopy = _shadowKey(matrix: changed);
    changed[0] = 99;
    expect(defensiveCopy, original);
  });

  test('manual shadow revision overrides global content invalidation', () {
    final body = Uint8List(148);
    setU32(body, 0, 1);
    setU32(body, 4, 1);
    setF32(body, 24, 1);
    setU32(body, 52, 1024);
    setU32(body, 56, 1024);
    setF32(body, 68, 1);
    setU32(body, 144, 7);
    final frame = _decode(8, body) as JsThreeSubmitFrame;
    expect(frame.shadowContentRevision, 7);
    expect(frame.culledNodeIds, isEmpty);
    expect(frame.culledShadowNodeIds, isEmpty);
    expect(ThreeShadowCacheKey.fromFrame(frame, 99).contentRevision, 7);
  });

  test('pass rectangles scale once and convert THREE bottom-left Y', () {
    final mainLeft = _frameWithRectangles();
    final leftViewport = debugThreePassViewport(mainLeft, 1280, 720, 2);
    expect((leftViewport.x, leftViewport.y), (0, 0));
    expect((leftViewport.width, leftViewport.height), (640, 720));
    final mainRight = _frameWithRectangles(viewport: [320, 0, 320, 360]);
    final rightViewport = debugThreePassViewport(mainRight, 1280, 720, 2);
    expect((rightViewport.x, rightViewport.y), (640, 0));
    expect((rightViewport.width, rightViewport.height), (640, 720));
    final scissor = debugThreePassScissor(mainRight, 1280, 720, 2)!;
    expect((scissor.x, scissor.y), (640, 0));
    expect((scissor.width, scissor.height), (640, 720));

    final offscreen = _frameWithRectangles(offscreen: true);
    final targetViewport = debugThreePassViewport(offscreen, 640, 360, 2);
    expect((targetViewport.x, targetViewport.y), (0, 0));
    expect((targetViewport.width, targetViewport.height), (320, 360));

    final bottomLeft = _frameWithRectangles(
      viewport: [10, 20, 300, 200],
      scissorTest: false,
    );
    final converted = debugThreePassViewport(bottomLeft, 1280, 720, 2);
    expect((converted.x, converted.y), (20, 280));
    expect((converted.width, converted.height), (600, 400));
    expect(debugThreePassScissor(bottomLeft, 1280, 720, 2), isNull);
  });

  test('uniform payloads are padded to the platform alignment boundary', () {
    final source = ByteData(320);
    for (var index = 0; index < source.lengthInBytes; index++) {
      source.setUint8(index, index % 251);
    }
    final padded = debugThreeAlignedUniform(source, 256);
    expect(padded.lengthInBytes, 512);
    for (var index = 0; index < source.lengthInBytes; index++) {
      expect(padded.getUint8(index), source.getUint8(index));
    }
    for (
      var index = source.lengthInBytes;
      index < padded.lengthInBytes;
      index++
    ) {
      expect(padded.getUint8(index), 0);
    }
    expect(identical(debugThreeAlignedUniform(padded, 256), padded), isTrue);
    expect(() => debugThreeAlignedUniform(source, 0), throwsArgumentError);
    expect(debugThreeUniformFillerLength(1023744, 512, 1024000), 256);
    expect(debugThreeUniformFillerLength(1023744, 256, 1024000), 0);
    expect(debugThreeUniformFillerLength(1024000, 512, 1024000), 0);
    expect(debugThreeUniformFillerLength(0, 1024001, 1024000), 0);
  });

  group('threePointShadowLaneActive', () {
    test('requires an active shadow frame and both textures', () {
      expect(threePointShadowLaneActive(true, 1, true, true), isTrue);
      expect(threePointShadowLaneActive(false, 1, true, true), isFalse);
      expect(threePointShadowLaneActive(true, 0, true, true), isFalse);
      expect(threePointShadowLaneActive(true, 1, false, true), isFalse);
      expect(threePointShadowLaneActive(true, 1, true, false), isFalse);
    });
  });
}
