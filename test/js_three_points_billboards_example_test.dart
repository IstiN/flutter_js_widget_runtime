import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart'
    show JsThreeFogMode, JsThreeMaterialKind, JsThreeToneMapping;
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart'
    show JsThreeSurfaceState;
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// webgl_points_billboards — R1 RENDERING (wave-3 FogExp2 lane).
///
/// Official module facts (r186 webgl_points_billboards.html):
/// - PerspectiveCamera(55, aspect, 2, 200), camera.position.z = 100.
/// - scene.fog = FogExp2(0x000000, 0.001) — the R1 v4 frame carries
///   fogMode=exp2 + fogDensity (protocol v4; `1 - exp(-d^2 * depth^2)` in
///   shaders/three_r1.frag, three.js fog_fragment FOG_EXP2 math).
/// - 10000 particles at +/-100 per axis (r186), TextureLoader disc.png (sRGB),
///   PointsMaterial(size: 35, sizeAttenuation: true, map, alphaTest: 0.5,
///   transparent: true); NormalBlending (never set in this r186 module).
/// - animate() hue-cycles material.color.setHSL and camera-lerps toward the
///   pointer; render() runs on every setAnimationLoop tick.
///
/// Test 1 drives the prepared widget (stock module, no shims) and pins the
/// draw plan + frame fog fields. Test 2 runs the VERBATIM official module
/// body (minus its two import lines) on the shared jsr_three_native.js runtime
/// through the probe harness, proving the stock FogExp2 scene renders.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'points billboards example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
    'webgl_points_billboards renders on R1 with FogExp2 (prepared widget)',
    _runPreparedWidgetTest,
    timeout: const Timeout(Duration(seconds: 180)),
  );

  testWidgets(
    'webgl_points_billboards probe: verbatim official module body renders '
    'with exp2 fog on the shared R1 runtime',
    (tester) async {
      final disc = _readOfficialDiscSprite();
      final harness = await ThreeQuickjsExampleHarness.bootSource(
        tester,
        source: _probeSource(disc),
        instanceId: 'three-points-billboards-probe',
      );
      final plan = await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.textureUploadCount > 0 &&
            plan.draws.isNotEmpty &&
            state.submittedFrameCount >= 1,
      );
      expect(plan, isNotNull);
      expect(plan!.canRender, isTrue);
      expect(plan.diagnostics.warnings, isEmpty);
      _expectOfficialPointsScene(plan, harness.state!);

      // The official animate() hue-cycle keeps submitting frames.
      final framesBefore = harness.state!.submittedFrameCount;
      final exportedFramesBefore =
          (harness.engine.exportedState!['rendererFrame'] as num).toInt();
      await harness.pumpFrames(tester, 10);
      expect(harness.state!.submittedFrameCount, greaterThan(framesBefore));
      final exportedLate = harness.engine.exportedState!;
      expect(
        (exportedLate['rendererFrame'] as num).toInt(),
        greaterThan(exportedFramesBefore),
      );
      expect((exportedLate['rendererPoints'] as num).toInt(), 10000);
      expect((exportedLate['memoryTextures'] as num).toInt(), 1);
      expect((exportedLate['memoryGeometries'] as num).toInt(), 1);
      // The stock module still carries its FogExp2 — no substitution.
      expect(exportedLate['gapCode'], 'none');
      expect(exportedLate['gapFeature'], '');
      expect(exportedLate['fogIsFogExp2'], isTrue);
      expect(
        (exportedLate['fogDensity'] as num).toDouble(),
        closeTo(0.001, 1e-9),
      );

      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );

  test('points map uses gl_PointCoord instead of a missing mesh UV', () {
    final shader = File('shaders/three_r1.frag').readAsStringSync();
    expect(
      shader,
      contains('vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y)'),
      reason:
          'the official disc is transparent at (0,0); sampling the '
          'missing Points uv attribute discards every particle',
    );
  });
}

/// The real widget test: the stock module renders every frame with its
/// official FogExp2(0x000000, 0.001) attached to the frame plan.
Future<void> _runPreparedWidgetTest(WidgetTester tester) async {
  final harness = await ThreeQuickjsExampleHarness.boot(
    tester,
    widgetId: 'three-points-billboards',
    instanceId: 'three-points-billboards-test',
  );
  final plan = await harness.pumpUntil(
    tester,
    (state, plan) =>
        state.textureUploadCount > 0 &&
        plan.draws.isNotEmpty &&
        state.submittedFrameCount >= 1,
  );
  harness.expectHealthy('webgl_points_billboards');

  final exported = harness.engine.exportedState!;
  expect(exported['backend'], 'flutterGpu');
  expect(exported['canvasCount'], 1);
  expect(exported['mounted'], isTrue);
  final assets = exported['assets'] as Map<String, dynamic>;
  expect(assets['textures/sprites/disc.png']['registered'], isTrue);
  _expectOfficialPointsScene(plan!, harness.state!);

  // The hue-cycling loop keeps rendering: renderer.info counts tick up.
  final framesBefore = harness.state!.submittedFrameCount;
  await harness.pumpFrames(tester, 10);
  expect(harness.state!.submittedFrameCount, greaterThan(framesBefore));
  final rendererInfo = exported['renderer'] as Map<String, dynamic>;
  expect(rendererInfo['frame'], greaterThan(0));
  // The exported adapter snapshot may aggregate across the export interval;
  // the per-frame draw plan (100 vertices) is already pinned above.
  expect((rendererInfo['points'] as num).toInt(), greaterThanOrEqualTo(10000));

  await harness.dispose(tester);
}

/// The official sprite: examples/textures/sprites/disc.png, checked into the
/// repo byte-identical as the three-interactive-points widget asset.
Uint8List _readOfficialDiscSprite() {
  final bytes = File(
    'example/widgets/three-interactive-points/disc.png',
  ).readAsBytesSync();
  expect(
    bytes.length,
    866,
    reason: 'disc.png must be the official 866B sprite',
  );
  final header = ByteData.sublistView(bytes, 16, 24);
  expect(header.getUint32(0), 32);
  expect(header.getUint32(4), 32);
  return bytes;
}

void _expectOfficialPointsScene(ThreeDrawPlan plan, JsThreeSurfaceState state) {
  // Exactly one Points object: 10000 particles, un-indexed position attribute.
  expect(plan.draws, hasLength(1));
  final draw = plan.draws.single;
  expect(draw.primitive, ThreeDrawPrimitive.points);
  expect(draw.drawCount, 10000);
  expect(draw.indexed, isFalse);

  // PointsMaterial facts straight from the official constructor call.
  final material = draw.material;
  expect(material.kind, JsThreeMaterialKind.pointsBasic);
  expect(material.pointSize, 35);
  expect(material.alphaTest, 0.5);
  expect(material.transparent, isTrue);
  expect(material.sizeAttenuation, isTrue);
  expect(material.colorR, inExclusiveRange(0, 1));
  expect(material.colorG, inExclusiveRange(0, 1));
  expect(material.colorB, inExclusiveRange(0, 1));

  // The disc.png map uploads once, sRGB, at its native 32x32.
  expect(material.mapTextureId, greaterThan(0));
  final texture = state.textures[material.mapTextureId]!;
  expect(texture.width, 32);
  expect(texture.height, 32);
  expect(texture.srgb, isTrue);
  expect(state.textureUploadCount, greaterThanOrEqualTo(1));
  expect(state.geometryUploadCount, 1);

  // Official frame fog: FogExp2(0x000000, 0.001) rides the v4 frame —
  // mode exp2 with density 0.001 (no near/far), no lights/shadow map.
  final frame = plan.frame!;
  expect(frame.fogMode, JsThreeFogMode.exp2);
  expect(frame.fogDensity, closeTo(0.001, 1e-9));
  expect(frame.fogNear, 0);
  expect(frame.fogFar, 0);
  expect(frame.hasShadow, isFalse);
  expect(frame.toneMapping, JsThreeToneMapping.none);
  expect(plan.spotLights, isEmpty);
  expect(plan.directionalLights, isEmpty);
  expect(plan.pointLights, isEmpty);
}

/// The probe wraps the VERBATIM official module body (r186
/// webgl_points_billboards.html, minus its two import lines) in the minimal
/// example-adapter pieces the shared runtime does not provide: the
/// createElementNS img/canvas hooks (official adapter:
/// tool/three_example/example_adapter.js), inert Stats/GUI shims and a
/// body/container stub. Instrumentation after the module body first proves
/// the FogExp2 capability error, then swaps in linear Fog and lets the
/// official animate() loop run.
String _probeSource(Uint8List discPng) {
  const source = r'''
(() => {
  const ROOT = globalThis;
  const jsr = ROOT.jsr;
  const THREE = ROOT.THREE;
  if (!jsr || !jsr.three || !THREE) {
    throw new Error('probe: evaluate the jsr_three_native.js bundle first');
  }

  // The official sprite asset (textures/sprites/disc.png), byte-identical
  // to the checked-in three-interactive-points widget asset.
  jsr.three.registerAsset('textures/sprites/disc.png', {
    data: '__DISC_B64__',
    mime: 'image/png',
    width: __DISC_W__,
    height: __DISC_H__
  });

  const canvas = jsr.three.createCanvas('main');
  const document = canvas.ownerDocument;
  const window = document.defaultView;

  function eventTarget(element) {
    const listeners = new Map();
    element.addEventListener = (type, callback) => {
      const list = listeners.get(type) || [];
      if (!list.includes(callback)) list.push(callback);
      listeners.set(type, list);
    };
    element.removeEventListener = (type, callback) => {
      const list = listeners.get(type);
      if (list) listeners.set(type, list.filter((item) => item !== callback));
    };
    element.dispatchEvent = (event) => {
      for (const callback of (listeners.get(event.type) || []).slice()) {
        callback.call(element, event);
      }
      return true;
    };
    return element;
  }

  // localImage() from the official example adapter: registered bytes are
  // decoded into an OffscreenCanvas and dispatched as an img load event.
  function localImage() {
    const image = eventTarget(new ROOT.OffscreenCanvas(1, 1));
    image.complete = false;
    let source = '';
    Object.defineProperty(image, 'src', {
      configurable: true,
      get() { return source; },
      set(value) {
        source = String(value);
        Promise.resolve().then(async () => {
          const asset = jsr.three.resolveAsset(source);
          if (!asset) throw new Error('probe: unregistered image URL ' + source);
          const encoded = ROOT.atob(asset.data);
          const bytes = new Uint8Array(encoded.length);
          for (let i = 0; i < encoded.length; i++) bytes[i] = encoded.charCodeAt(i);
          const bitmap = await ROOT.createImageBitmap(
            new ROOT.Blob([bytes], { type: asset.mime || 'image/png' })
          );
          try {
            const context = image.getContext('2d');
            if (!context) throw new Error('probe: OffscreenCanvas 2d unavailable');
            image.width = bitmap.width;
            image.height = bitmap.height;
            context.clearRect(0, 0, image.width, image.height);
            context.drawImage(bitmap, 0, 0);
            image.complete = true;
            image.dispatchEvent({ type: 'load' });
          } finally {
            if (bitmap.close) bitmap.close();
          }
        }).catch((error) => {
          image.complete = false;
          image.dispatchEvent({ type: 'error', error });
        });
      }
    });
    return image;
  }

  document.createElementNS = (namespace, tagName) => {
    const tag = String(tagName).toLowerCase();
    if (tag === 'canvas') return jsr.three.createCanvas('main');
    if (tag === 'img' || tag === 'image') return localImage();
    throw new Error('probe: unsupported createElementNS ' + tag);
  };
  document.body = {
    style: {},
    appendChild() {},
    addEventListener() {},
    removeEventListener() {}
  };
  document.getElementById = () => null;

  // Inert shims: stats/gui DOM is diagnostic-only in the official example.
  const Stats = class {
    constructor() { this.dom = eventTarget({ style: {} }); }
    update() {}
  };
  const GUI = class {
    add() { return { onChange() { return this; }, listen() { return this; } }; }
    open() {}
  };

  // ================= official webgl_points_billboards module body ====
  let camera, scene, renderer, stats, material;
  let mouseX = 0, mouseY = 0;

  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;

  init();

  function init() {

    camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 2, 200 );
    camera.position.z = 100;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0x000000, 0.001 );

    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    const sprite = new THREE.TextureLoader().load( 'textures/sprites/disc.png' );
    sprite.colorSpace = THREE.SRGBColorSpace;

    for ( let i = 0; i < 10000; i ++ ) {

      const x = 200 * Math.random() - 100;
      const y = 200 * Math.random() - 100;
      const z = 200 * Math.random() - 100;

      vertices.push( x, y, z );

    }

    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

    material = new THREE.PointsMaterial( { size: 35, sizeAttenuation: true, map: sprite, alphaTest: 0.5, transparent: true } );
    material.color.setHSL( 1.0, 0.3, 0.7, THREE.SRGBColorSpace );

    const particles = new THREE.Points( geometry, material );
    scene.add( particles );

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    document.body.appendChild( renderer.domElement );

    stats = new Stats();
    document.body.appendChild( stats.dom );

    const gui = new GUI();
    gui.add( material, 'sizeAttenuation' ).onChange( function () {
      material.needsUpdate = true;
    } );
    gui.open();

    document.body.style.touchAction = 'none';
    document.body.addEventListener( 'pointermove', onPointerMove );
    window.addEventListener( 'resize', onWindowResize );

  }

  function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  function onPointerMove( event ) {
    if ( event.isPrimary === false ) return;
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
  }

  function animate() {
    render();
    stats.update();
  }

  function render() {
    const time = Date.now() * 0.00005;
    camera.position.x += ( mouseX - camera.position.x ) * 0.05;
    camera.position.y += ( - mouseY - camera.position.y ) * 0.05;
    camera.lookAt( scene.position );
    const h = ( 360 * ( 1.0 + time ) % 360 ) / 360;
    material.color.setHSL( h, 0.5, 0.5 );
    renderer.render( scene, camera );
  }
  // ============== end of official webgl_points_billboards module body ====

  // Probe instrumentation: render once eagerly (FogExp2 is now an R1 v4
  // lane — a throw here would surface through gapFeature), then keep the
  // official animation loop running.
  renderer.setAnimationLoop( null );

  const probe = { code: 'none', feature: '', message: '' };
  try {
    renderer.render( scene, camera );
  } catch ( error ) {
    probe.code = ( error && error.code ) || 'unknown';
    probe.feature = ( error && error.feature ) || '';
    probe.message = ( error && error.message ) || String( error );
  }

  function publish() {
    const info = renderer.info;
    jsr.exportState({
      example: 'webgl_points_billboards',
      backend: jsr.three.getCapabilities().backend,
      canvasCount: 1,
      fogProbeDone: true,
      gapCode: probe.code,
      gapFeature: probe.feature,
      gapMessage: probe.message,
      fogIsFogExp2: !!( scene.fog && scene.fog.isFogExp2 ),
      fogDensity: scene.fog ? scene.fog.density : -1,
      rendererFrame: info.render.frame,
      rendererPoints: info.render.points,
      memoryTextures: info.memory.textures,
      memoryGeometries: info.memory.geometries,
      sceneChildren: scene.children.length
    });
  }

  publish();
  renderer.setAnimationLoop( ( time ) => {
    animate( time );
    publish();
  } );
})();
''';
  final header = ByteData.sublistView(discPng, 16, 24);
  return source
      .replaceAll('__DISC_B64__', base64Encode(discPng))
      .replaceAll('__DISC_W__', header.getUint32(0).toString())
      .replaceAll('__DISC_H__', header.getUint32(4).toString());
}
