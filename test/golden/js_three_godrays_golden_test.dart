@Timeout(Duration(minutes: 3))
library;

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../support/three_gpu_golden_harness.dart';
import '../support/three_quickjs_example_harness.dart';
import '../support/widget_logic_helper.dart';

const _runGpuGolden = bool.fromEnvironment('JSR_THREE_GPU_GOLDEN');

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!_runGpuGolden || !hasQuickjsNativeLib || !Platform.isMacOS) {
    test(
      'godrays direct-pass GPU regression',
      () {},
      skip: 'requires macOS Impeller/Flutter GPU',
    );
    return;
  }

  testWidgets('official godrays direct pass remains visible', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-postprocessing-godrays',
      instanceId: 'three-godrays-golden',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.submittedFrameCount >= 1 && plan.mainDraws.isNotEmpty,
    );
    final surface = harness.surface!;
    harness.host.attach(harness.instanceId, 'main#1', const {});
    surface.resize(const Size(256, 256), 1);
    await tester.pumpWidget(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Center(
          child: SizedBox(
            width: 256,
            height: 256,
            child: AnimatedBuilder(
              animation: surface,
              builder: (context, _) =>
                  harness.host.build(context, surface, const {}),
            ),
          ),
        ),
      ),
    );
    final png = await captureThreeGpuGolden(
      tester,
      surface,
      (diagnostics) => (diagnostics['shadowCacheHits'] ?? 0) >= 1,
    );
    expect(png, isNotNull, reason: 'diagnostics=${surface.diagnostics}');
    expect(surface.lastError, isNull);
    expect(surface.diagnostics['failedPresentations'], 0);
    final pixels = await decodeThreeGpuGolden(tester, png!);
    var red = 0;
    var nonBlack = 0;
    var maxChannel = 0;
    for (var index = 0; index < 256 * 256; index++) {
      final offset = index * 4;
      final r = pixels.getUint8(offset);
      final g = pixels.getUint8(offset + 1);
      final b = pixels.getUint8(offset + 2);
      final high = r > g && r > b ? r : (g > b ? g : b);
      if (high > maxChannel) maxChannel = high;
      if (high > 12) nonBlack++;
      if (r > g + 4 && r > b + 4 && r > 12) red++;
    }
    // GodraysPass is deliberately omitted; the direct RenderPass is a dark
    // scene, not the browser's volumetric-light result. It must nevertheless
    // retain the visible red backdrop instead of presenting an all-black frame.
    expect(nonBlack, greaterThan(100));
    expect(maxChannel, greaterThan(12));
    expect(red, greaterThan(100));
    await harness.dispose(tester);
  });
}
