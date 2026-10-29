import 'dart:typed_data';

import 'package:flutter_gpu/gpu.dart' as gpu;
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_backend.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

ByteData _view(Uint8List bytes) => ByteData.sublistView(bytes);

void _u16(Uint8List bytes, int offset, int value) =>
    _view(bytes).setUint16(offset, value, Endian.little);

void _u32(Uint8List bytes, int offset, int value) =>
    _view(bytes).setUint32(offset, value, Endian.little);

void _f32(Uint8List bytes, int offset, double value) =>
    _view(bytes).setFloat32(offset, value, Endian.little);

JsThreeCommand _decode(int opcode, Uint8List body) {
  final bytes = Uint8List(20 + body.length);
  bytes.setAll(0, [0x4a, 0x53, 0x52, 0x31]);
  _u16(bytes, 4, 1);
  _u32(bytes, 8, 1);
  bytes[12] = opcode;
  _u32(bytes, 16, body.length);
  bytes.setAll(20, body);
  return JsThreeProtocolDecoder().decodeR1(bytes).commands.single;
}

ThreeShadowCacheKey _shadowKey({
  int contentRevision = 1,
  int width = 2048,
  int height = 2048,
  double bias = 0.001,
  double normalBias = 0.02,
  List<double>? matrix,
}) => ThreeShadowCacheKey(
  contentRevision: contentRevision,
  width: width,
  height: height,
  bias: bias,
  normalBias: normalBias,
  matrix: matrix ?? List<double>.generate(16, (index) => index.toDouble()),
);

Uint8List _batch({bool instanced = true}) {
  final instanceCount = instanced ? 2 : 1;
  final matrixCount = instanced ? 32 : 0;
  final body = Uint8List(36 + matrixCount * 4);
  _u32(body, 0, 1);
  _u32(body, 4, 1);
  _u32(body, 8, instanceCount);
  _u32(body, 12, instanced ? 1 : 0);
  _u32(body, 16, 1);
  _u32(body, 20, 1);
  _u32(body, 24, 1);
  _u32(body, 32, 3);
  for (var index = 0; index < matrixCount; index++) {
    _f32(body, 36 + index * 4, index + 0.25);
  }
  return body;
}

({
  JsThreeNodeUpsert node,
  JsThreeGeometryUpsert geometry,
  JsThreeMaterialUpsert material,
})
_drawResources({
  JsThreeMaterialKind kind = JsThreeMaterialKind.meshBasic,
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
}) {
  final geometry = Uint8List(
    92 + (wireIndices == null ? 0 : 4 + wireIndices.length * 4),
  );
  _u32(geometry, 0, 1);
  _u32(geometry, 4, 1);
  _u32(geometry, 8, 1);
  _u32(geometry, 12, 3);
  _u32(geometry, 16, 6);
  _u32(geometry, 28, 36);
  const indices = [0, 1, 2, 2, 1, 0];
  for (var index = 0; index < indices.length; index++) {
    _u32(geometry, 68 + index * 4, indices[index]);
  }
  if (wireIndices != null) {
    _u32(geometry, 92, wireIndices.length);
    for (var index = 0; index < wireIndices.length; index++) {
      _u32(geometry, 96 + index * 4, wireIndices[index]);
    }
  }

  final phong = kind == JsThreeMaterialKind.meshPhong;
  final material = Uint8List(
    (phong ? 72 : 56) + (emissive ? 16 : 0),
  );
  _u32(material, 0, 1);
  _u32(material, 4, 1);
  _u32(material, 8, kind.wireValue);
  _u32(material, 16, 24 | (wireframe ? 32 : 0));
  _u32(material, 20, side.wireValue);
  _f32(material, 24, 1);
  _f32(material, 28, 1);
  _f32(material, 32, 1);
  _f32(material, 36, 1);
  _f32(material, 40, 0.5);
  _f32(material, 44, 0.5);
  _f32(material, 52, 1);
  if (phong) {
    _f32(material, 56, specularR);
    _f32(material, 60, specularG);
    _f32(material, 64, specularB);
    _f32(material, 68, shininess);
  }
  if (emissive) {
    final offset = phong ? 72 : 56;
    _f32(material, offset, emissiveR);
    _f32(material, offset + 4, emissiveG);
    _f32(material, offset + 8, emissiveB);
    _f32(material, offset + 12, emissiveIntensity);
  }

  final node = Uint8List(92);
  _u32(node, 0, 1);
  _u32(node, 8, 1);
  _u32(node, 12, 1);
  _u32(node, 16, 1);
  _u32(node, 20, 1);
  for (final index in [0, 5, 10, 15]) {
    _f32(node, 24 + index * 4, 1);
  }
  return (
    node: _decode(4, node) as JsThreeNodeUpsert,
    geometry: _decode(1, geometry) as JsThreeGeometryUpsert,
    material: _decode(3, material) as JsThreeMaterialUpsert,
  );
}

ThreeDrawItem _draw({
  int offset = 0,
  int? count,
  JsThreeMaterialKind kind = JsThreeMaterialKind.meshBasic,
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
}) {
  final resources = _drawResources(
    kind: kind,
    wireframe: wireframe,
    wireIndices: wireIndices,
    specularR: specularR,
    specularG: specularG,
    specularB: specularB,
    shininess: shininess,
    emissive: emissive,
    emissiveR: emissiveR,
    emissiveG: emissiveG,
    emissiveB: emissiveB,
    emissiveIntensity: emissiveIntensity,
    side: side,
  );
  return ThreeDrawItem(
    node: resources.node,
    geometry: resources.geometry,
    material: resources.material,
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

  test('vertex layout binds four column vectors at instance rate', () {
    final layout = debugThreeVertexLayout();

    expect(layout.buffers, hasLength(2));
    final instances = layout.buffers[1];
    expect(instances.strideInBytes, 64);
    expect(instances.stepMode, gpu.VertexStepMode.instance);
    expect(instances.attributes.map((attribute) => attribute.name), [
      'instanceModel0',
      'instanceModel1',
      'instanceModel2',
      'instanceModel3',
    ]);
    expect(instances.attributes.map((attribute) => attribute.offsetInBytes), [
      0,
      16,
      32,
      48,
    ]);
    expect(
      instances.attributes.every(
        (attribute) => attribute.format == gpu.VertexFormat.float32x4,
      ),
      isTrue,
    );
  });

  test('ordinary identity and real instance payloads have exact ABI bytes', () {
    final identity = debugThreeIdentityInstanceData();
    expect(identity.lengthInBytes, 64);
    for (var index = 0; index < 16; index++) {
      expect(
        identity.getFloat32(index * 4, Endian.little),
        index % 5 == 0 ? 1.0 : 0.0,
      );
    }

    final source = _decode(11, _batch()) as JsThreeDrawBatchUpsert;
    final packed = debugThreeInstanceData(source);
    expect(packed.lengthInBytes, 128);
    for (var index = 0; index < 32; index++) {
      expect(packed.getFloat32(index * 4, Endian.little), index + 0.25);
    }
    final ordinary = _decode(11, _batch(instanced: false));
    expect(
      () => debugThreeInstanceData(ordinary as JsThreeDrawBatchUpsert),
      throwsArgumentError,
    );
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

  test('Phong material uniforms carry distinct kind specular and shininess', () {
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
    expect(phong.lengthInBytes, 80);
    expect(lambert.lengthInBytes, 80);
    expect(phong.getFloat32(28, Endian.little), 5);
    expect(lambert.getFloat32(28, Endian.little), 1);
    expect(phong.getFloat32(48, Endian.little), 0.25);
    expect(phong.getFloat32(52, Endian.little), 0.5);
    expect(phong.getFloat32(56, Endian.little), 0.75);
    expect(phong.getFloat32(60, Endian.little), 64);
    expect(lambert.getFloat32(48, Endian.little), 0);
    expect(lambert.getFloat32(60, Endian.little), 0);

    final changed = debugThreeMaterialUniform(
      _draw(
        kind: JsThreeMaterialKind.meshPhong,
        specularR: 1,
        shininess: 12,
      ),
    );
    expect(changed.getFloat32(48, Endian.little), 1);
    expect(changed.getFloat32(60, Endian.little), 12);
  });

  test('Normal is distinct and emissive edits reach the 80-byte GPU ABI', () {
    final normal = debugThreeMaterialUniform(
      _draw(kind: JsThreeMaterialKind.meshNormal, side: JsThreeSide.double),
    );
    expect(normal.lengthInBytes, 80);
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
        _draw(
          offset: 2,
          count: 2,
          wireframe: true,
          wireIndices: const [0, 1],
        ),
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
    _u32(body, 0, 1);
    _u32(body, 4, 1);
    _f32(body, 24, 1);
    _u32(body, 52, 1024);
    _u32(body, 56, 1024);
    _f32(body, 68, 1);
    _u32(body, 144, 7);
    final frame = _decode(8, body) as JsThreeSubmitFrame;
    expect(frame.shadowContentRevision, 7);
    expect(frame.culledNodeIds, isEmpty);
    expect(frame.culledShadowNodeIds, isEmpty);
    expect(ThreeShadowCacheKey.fromFrame(frame, 99).contentRevision, 7);
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
}
