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

  test('dynamic non-finite point positions clip before transform', () {
    final source = File('shaders/three_r1.vert').readAsStringSync();
    final mainStart = source.indexOf('void main() {');
    final transformStart = source.indexOf('mat4 instanceModel', mainStart);
    final guard = source.substring(mainStart, transformStart);
    expect(guard, contains('any(isnan(position))'));
    expect(guard, contains('any(isinf(position))'));
    expect(guard, contains('gl_Position = vec4(0.0, 0.0, 2.0, 1.0)'));
    expect(guard, contains('return;'));
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

  test('UnrealBloom uses threshold, bounded Gaussian mips and the five-mip composite', () {
    final source = File('shaders/three_r1.frag').readAsStringSync();
    final start = source.indexOf('if (op == 13) {');
    final end = source.indexOf('return base;', start);
    final bloom = source.substring(start, end);
    expect(bloom, contains('smoothstep(threshold, threshold + r1PostParam(2), luminance)'));
    expect(bloom, contains('mix(outputColor, base, alpha)'));
    expect(bloom, contains('for (int i = 0; i < 11; i++)'));
    expect(bloom, contains('texture(mapTexture, uv + uvOffset).rgb'));
    expect(bloom, contains('texture(mapTexture, uv - uvOffset).rgb'));
    expect(bloom, contains('r1BloomContribution(4, texture(postTexture5, uv).rgb)'));
    expect(bloom, contains('bloom *= 3.0 * r1PostParam(1);'));
    expect(bloom, contains('max(bloom.r, max(bloom.g, bloom.b))'));
    expect(source, contains('float r1PostParam(int index)'));
    expect(source, contains('vec4 postParams[4];'));
  });

  test('point-shadow MaterialInfo keeps the full 400-byte ABI layout', () {
    // Regression: the point-shadow stage declared the pre-v9 MaterialInfo
    // (336 bytes, no postParams tail) while the host encoder always writes
    // 400 bytes — every point-shadow draw failed shaderAbi and the example
    // (godrays) spun forever with zero presented frames. The two stages may
    // declare the Dubois matrices differently (mat3 vs three vec4s), so the
    // pinned invariant is the std140 SIZE in vec4 units, not the member text.
    int std140Vec4Units(String path) {
      final source = File(path).readAsStringSync();
      final start = source.indexOf('uniform MaterialInfo {');
      final end = source.indexOf('} material_info;', start);
      var units = 0;
      for (final line in source.substring(start, end).split('\n')) {
        final trimmed = line.trim();
        final array = RegExp(r'^vec4 \w+\[(\d+)\];').firstMatch(trimmed);
        if (array != null) {
          units += int.parse(array.group(1)!);
        } else if (trimmed.startsWith('vec4 ')) {
          units += 1;
        } else if (trimmed.startsWith('mat3 ')) {
          units += 3;
        }
      }
      return units;
    }

    expect(std140Vec4Units('shaders/three_r1.frag'), 25,
        reason: 'main MaterialInfo must stay 25 vec4s = 400 bytes');
    expect(std140Vec4Units('shaders/three_r1_point_shadow.frag'), 25,
        reason: 'point-shadow MaterialInfo must match the 400-byte encoder');
  });
}
