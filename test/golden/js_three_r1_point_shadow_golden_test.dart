@Timeout(Duration(minutes: 3))
library;

import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../support/three_gpu_golden_harness.dart';
import '../support/widget_logic_helper.dart';

const _runGpuGolden = bool.fromEnvironment('JSR_THREE_GPU_GOLDEN');

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!_runGpuGolden || !hasQuickjsNativeLib || !Platform.isMacOS) {
    test(
      'R1 point-shadow GPU regression',
      () {},
      skip: 'requires macOS Impeller/Flutter GPU',
    );
    return;
  }

  testWidgets('point shadows preserve the main basic-material pass', (
    tester,
  ) async {
    final run = await bootBundledThreeGpuGolden(
      tester,
      'three-r1-point-shadow-golden',
    );
    await run.engine.run(r'''
      const canvas = jsr.three.createCanvas('main');
      const renderer = new THREE.WebGLRenderer({canvas: canvas});
      renderer.setSize(256, 256);
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = true;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x182238);
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);

      scene.add(new THREE.AmbientLight(0xcccccc, 0.4));
      const light = new THREE.PointLight(0xf6287d, 10000);
      light.position.set(0, 1, 3);
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.camera.far = 500;
      light.shadow.bias = -0.001;
      scene.add(light);

      const backdrop = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 4),
        new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide})
      );
      backdrop.position.z = -1;
      backdrop.castShadow = true;
      backdrop.receiveShadow = true;
      scene.add(backdrop);

      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshStandardMaterial({color: 0x333333})
      );
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);

      let frames = 0;
      function animate() {
        renderer.render(scene, camera);
        if (++frames < 8) requestAnimationFrame(animate);
      }
      animate();
    ''');
    final golden = await presentThreeGpuGolden(
      tester,
      run,
      (diagnostics) => (diagnostics['shadowCacheHits'] ?? 0) >= 1,
    );
    expect(golden.surface.diagnostics['renderedShadowDraws'], 4);
    final pixels = await decodeThreeGpuGolden(tester, golden.png);
    var red = 0;
    var background = 0;
    for (var y = 8; y < 256; y += 8) {
      for (var x = 8; x < 256; x += 8) {
        final offset = (y * 256 + x) * 4;
        final r = pixels.getUint8(offset);
        final g = pixels.getUint8(offset + 1);
        final b = pixels.getUint8(offset + 2);
        if (r > 180 && g < 30 && b < 30) red++;
        if (r == 0x18 && g == 0x22 && b == 0x38) background++;
      }
    }
    expect(red, greaterThan(200), reason: 'red basic backdrop must render');
    expect(
      background,
      greaterThan(20),
      reason: 'clear color must remain visible',
    );
    await tester.runAsync(() => run.engine.dispose());
    await tester.pump();
  });
}
