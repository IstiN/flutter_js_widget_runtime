import 'package:js_widget_runtime/js_widget_runtime.dart';

/// Builds the common config used by native THREE integration tests.
JsRuntimeConfig threeTestConfig({
  required String engineId,
  required JsThreeHost host,
  String? widgetId,
  String? threeSource,
  void Function(Map<String, dynamic> tree)? onRender,
}) => JsRuntimeConfig(
  widgetId: widgetId ?? engineId,
  instanceId: engineId,
  threeEnabled: true,
  threeSource: threeSource,
  threeHost: host,
  onRender: onRender ?? (_) {},
  onSetTitle: (_) {},
  onStorageUpdate: (_) {},
);

/// Renders the shared native-backend smoke scene for [frameCount] frames.
String threeSmokeSceneJs({int frameCount = 1}) =>
    '''
  const canvas = jsr.three.createCanvas('main');
  const renderer = new THREE.WebGLRenderer({canvas: canvas});
  renderer.setSize(64, 64);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 3;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({color: 0x44aa66});
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  for (let frame = 0; frame < $frameCount; frame++) {
    camera.position.x = frame * 0.001;
    renderer.render(scene, camera);
  }
  jsr.exportState({
    revision: THREE.REVISION,
    backend: jsr.three.capabilities.backend,
    rawWebGL: jsr.three.capabilities.rawWebGL,
    frame: renderer.info.render.frame,
    geometries: renderer.info.memory.geometries
  });
''';
