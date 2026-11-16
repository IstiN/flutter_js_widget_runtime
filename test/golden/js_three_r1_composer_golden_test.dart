@Timeout(Duration(minutes: 5))
library;

import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_host.dart'
    show FlutterGpuThreeSurface;
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import '../support/three_gpu_golden_harness.dart';
import '../support/widget_logic_helper.dart';

/// Real composer/addon integration goldens for the native R1 post lane.
/// The addon source is the reviewed, unminified cinematic bundle up to (but
/// not including) its scene, so these tests change neither the showcase nor
/// its camera/content. All scenes are deterministic and asset-free.
const _runGpuGolden = bool.fromEnvironment('JSR_THREE_GPU_GOLDEN');
const _bundlePath =
    'example/widgets/three-cinematic-showcase/cinematic_bundle.mjs';
String? _addonSource;

Future<ThreeGpuGoldenRun> _bootComposer(WidgetTester tester, String id) async {
  _addonSource ??= await tester.runAsync(() async {
    final source = await File(_bundlePath).readAsString();
    return source.split('// scene.js').first;
  });
  return bootBundledThreeGpuGolden(tester, id);
}

Future<void> _evalComposer(ThreeGpuGoldenRun run, String source) =>
    run.engine.run('${_addonSource!}\n$source');

Future<({FlutterGpuThreeSurface surface, Uint8List png})> _present(
  WidgetTester tester,
  ThreeGpuGoldenRun run,
) => presentThreeGpuGolden(tester, run, (_) => true);

List<int> _rgba(ByteData pixels, int x, int y) {
  final offset = (y * 256 + x) * 4;
  return [
    pixels.getUint8(offset),
    pixels.getUint8(offset + 1),
    pixels.getUint8(offset + 2),
    pixels.getUint8(offset + 3),
  ];
}

void _expectChannel(int actual, int expected, String label) {
  expect(
    (actual - expected).abs(),
    lessThanOrEqualTo(10),
    reason: '$label: actual=$actual expected=$expected',
  );
}

Future<void> _finish(
  WidgetTester tester,
  ThreeGpuGoldenRun run,
  Uint8List png,
  String name,
) async {
  await tester.runAsync(() => run.engine.dispose());
  await tester.pump();
  await tester.runAsync(
    () => expectLater(png, matchesGoldenFile('goldens/$name-macos.png')),
  );
}

double _postOp(JsThreeMaterialUpsert material) => material.duboisLeftMatrix[0];

const _twoToneScene = r'''
  const canvas = jsr.three.createCanvas('main');
  const renderer = new THREE.WebGLRenderer({canvas: canvas});
  renderer.setSize(256, 256);
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 2;
  function panel(y, color) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 1),
      new THREE.MeshBasicMaterial({color: color, toneMapped: false})
    );
    mesh.position.y = y;
    scene.add(mesh);
  }
  const target = new THREE.WebGLRenderTarget(256, 256, {type: THREE.UnsignedByteType});
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  let frames = 0;
  function tick() {
    composer.render();
    if (++frames < 8) requestAnimationFrame(tick);
  }
''';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!_runGpuGolden || !hasQuickjsNativeLib || !Platform.isMacOS) {
    test(
      'R1 composer GPU goldens',
      () {},
      skip: 'requires macOS Impeller/Flutter GPU',
    );
    return;
  }

  testWidgets('FXAA and OutputPass preserve top/bottom orientation', (
    tester,
  ) async {
    final run = await _bootComposer(tester, 'three-r1-composer-fxaa');
    await _evalComposer(
      run,
      '$_twoToneScene\n'
      r'''
      panel(0.5, 0xff0000);
      panel(-0.5, 0x0000ff);
      const fxaa = new ShaderPass(FXAAShader);
      fxaa.uniforms.resolution.value.set(1 / 256, 1 / 256);
      composer.addPass(fxaa);
      composer.addPass(new OutputPass());
      tick();
    ''',
    );
    final golden = await _present(tester, run);
    final post = golden.surface.state!.materials.values
        .where((m) => m.kind == JsThreeMaterialKind.postProcessing)
        .toList();
    expect(post.map(_postOp).toSet(), containsAll(<double>{10, 18}));
    expect(
      post.map(_postOp),
      isNot(contains(14)),
      reason: 'FXAA must not execute the UnrealBloom Gaussian kernel',
    );
    final pixels = await decodeThreeGpuGolden(tester, golden.png);
    final top = _rgba(pixels, 128, 64);
    final bottom = _rgba(pixels, 128, 192);
    expect(top[0], greaterThan(230), reason: 'top=$top bottom=$bottom');
    expect(top[2], lessThan(25), reason: 'top=$top bottom=$bottom');
    expect(bottom[2], greaterThan(230), reason: 'top=$top bottom=$bottom');
    expect(bottom[0], lessThan(25), reason: 'top=$top bottom=$bottom');
    await _finish(tester, run, golden.png, 'three-r1-composer-fxaa-output');
  });

  testWidgets('UnrealBloom composites over a transparent base', (tester) async {
    final run = await _bootComposer(tester, 'three-r1-composer-bloom');
    await _evalComposer(run, r'''
      const canvas = jsr.three.createCanvas('main');
      const renderer = new THREE.WebGLRenderer({canvas: canvas});
      renderer.setSize(256, 256);
      renderer.setPixelRatio(1);
      renderer.setClearColor(0x000000, 0);
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 2;
      const darkBase = new THREE.Mesh(
        new THREE.PlaneGeometry(0.25, 0.25),
        new THREE.MeshBasicMaterial({color: 0x204080, toneMapped: false})
      );
      darkBase.position.set(-0.65, 0, 0);
      scene.add(darkBase);
      const quad = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.5),
        new THREE.MeshBasicMaterial({color: 0xffdd00, toneMapped: false})
      );
      scene.add(quad);
      const target = new THREE.WebGLRenderTarget(256, 256, {type: THREE.UnsignedByteType});
      const composer = new EffectComposer(renderer, target);
      composer.addPass(new RenderPass(scene, camera));
      const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.1, 0.5);
      composer.addPass(bloom);
      composer.addPass(new OutputPass());
      let frames = 0;
      function tick() {
        composer.render();
        if (++frames < 8) requestAnimationFrame(tick);
      }
      tick();
    ''');
    final golden = await _present(tester, run);
    final ops = golden.surface.state!.materials.values
        .where((m) => m.kind == JsThreeMaterialKind.postProcessing)
        .map(_postOp)
        .toList();
    expect(ops.where((op) => op == 13), isNotEmpty);
    expect(
      ops.where((op) => op == 14),
      hasLength(10),
      reason: 'five horizontal + five vertical Gaussian passes',
    );
    expect(ops.where((op) => op == 15), isNotEmpty);
    expect(ops, isNot(contains(18)));
    expect(golden.surface.diagnostics['explicitAdditiveLoads'], greaterThan(0));
    final pixels = await decodeThreeGpuGolden(tester, golden.png);
    final center = _rgba(pixels, 128, 128);
    final corner = _rgba(pixels, 8, 8);
    expect(center[0], greaterThan(180), reason: 'center=$center');
    expect(center[1], greaterThan(150), reason: 'center=$center');
    expect(center[3], 255, reason: 'center=$center');
    expect(
      corner[3],
      lessThan(10),
      reason: 'transparent base became opaque: corner=$corner',
    );
    final darkBase = _rgba(pixels, 45, 128);
    expect(darkBase[2], greaterThan(70), reason: 'base was cleared: $darkBase');
    expect(darkBase[0], lessThan(100), reason: 'base was cleared: $darkBase');
    expect(darkBase[3], 255, reason: 'base alpha was not preserved: $darkBase');
    final glow = _rgba(pixels, 80, 128);
    expect(glow[0], greaterThan(200), reason: 'missing bloom tint: $glow');
    expect(
      glow[3],
      greaterThan(corner[3] + 20),
      reason:
          'missing bloom outside the source quad: glow=$glow corner=$corner',
    );
    await _finish(tester, run, golden.png, 'three-r1-composer-bloom-alpha');
  });

  for (final lutAfterOutput in [false, true]) {
    testWidgets('identity LUT preserves orientation and midtones '
        '(${lutAfterOutput ? 'after' : 'before'} OutputPass)', (tester) async {
      final run = await _bootComposer(
        tester,
        'three-r1-composer-lut-${lutAfterOutput ? 'after' : 'before'}',
      );
      await _evalComposer(
        run,
        '$_twoToneScene\n'
        r'''
          panel(0.5, 0x404040);
          panel(-0.5, 0xc0c0c0);
          const lut = new LUTPass({lut: buildLutTexture('identity'), intensity: 1});
          const output = new OutputPass();
        '''
        '${lutAfterOutput ? 'composer.addPass(output); composer.addPass(lut);' : 'composer.addPass(lut); composer.addPass(output);'}\n'
        r'''
          tick();
        ''',
      );
      final golden = await _present(tester, run);
      final pixels = await decodeThreeGpuGolden(tester, golden.png);
      final top = _rgba(pixels, 128, 64);
      final bottom = _rgba(pixels, 128, 192);
      for (var channel = 0; channel < 3; channel++) {
        _expectChannel(top[channel], 64, 'top channel $channel: $top/$bottom');
        _expectChannel(
          bottom[channel],
          192,
          'bottom channel $channel: $top/$bottom',
        );
      }
      await _finish(
        tester,
        run,
        golden.png,
        'three-r1-composer-lut-${lutAfterOutput ? 'after' : 'before'}-output',
      );
    });
  }
}
