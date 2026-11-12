import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('spot shadow rendering converts biased UV to clip space with w', () {
    final source = File('shaders/three_r1.vert').readAsStringSync();
    expect(
      source,
      contains('shadowPosition.xy * 2.0 - vec2(shadowPosition.w)'),
      reason:
          'subtracting scalar 1 instead of homogeneous w distorts the '
          'perspective spot-shadow caster projection',
    );
  });

  test('Lambert cube maps use upstream multiply combine, not standard IBL', () {
    final source = File('shaders/three_r1.frag').readAsStringSync();
    final envStart = source.indexOf('float encodedEnv =');
    final envEnd = source.indexOf(
      'color *= frame_info.cameraPositionExposure.w;',
      envStart,
    );
    final lane = source.substring(envStart, envEnd);
    expect(
      lane,
      contains('if (kind == 2) {'),
      reason:
          'MeshLambertMaterial has no metalness/roughness IBL inputs; routing '
          'it through the MeshStandardMaterial lane washes out the cubemap '
          'instead of applying upstream MultiplyOperation',
    );
    expect(lane, isNot(contains('if (kind == 1 || kind == 2) {')));
  });

  test('recognised PCSS shadows use blocker search and 34-tap filtering', () {
    final source = File('shaders/three_r1.frag').readAsStringSync();
    expect(source, contains('float pcssShadow(vec2 uv, float receiver)'));
    expect(source, contains('blockerSum += depth * blocked;'));
    expect(
      source,
      contains('visibility += step(receiver, a) + step(receiver, b);'),
    );
    expect(source, contains('return visibility / 34.0;'));
    expect(
      source,
      contains('frame_info.shadowBiasTexelRadius.w < 0.0'),
      reason: 'the native renderer marks only the recognised PCSS chunk',
    );
  });

  test('scissored clears encode the working-linear color as sRGB', () {
    final source = File('shaders/three_r1.frag').readAsStringSync();
    final start = source.indexOf('if (kind == 13) {');
    final end = source.indexOf('if (kind == 10) {', start);
    final lane = source.substring(start, end);
    expect(lane, contains('linearToSrgb(material_info.colorOpacity.rgb)'));
    expect(lane, isNot(contains('applyToneMapping')));
  });
}
