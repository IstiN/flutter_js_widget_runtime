@TestOn('chrome')
library;

import 'dart:js_interop';
import 'dart:typed_data';

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/web_three_host.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine.dart';
import 'package:web/web.dart' as web;

extension type _FrameMessage._(JSObject _) implements JSObject {
  external factory _FrameMessage({
    String type,
    String engineId,
    String surfaceId,
    String canvasId,
    int generation,
    int frameId,
    int width,
    int height,
    web.ImageBitmap bitmap,
  });
}

web.ImageBitmap _bitmap(String color, {String? bottom}) {
  final canvas = web.OffscreenCanvas(2, 2);
  final context =
      canvas.getContext('2d')! as web.OffscreenCanvasRenderingContext2D;
  context.fillStyle = color.toJS;
  context.fillRect(0, 0, 2, 2);
  if (bottom != null) {
    context.fillStyle = bottom.toJS;
    context.fillRect(0, 1, 2, 1);
  }
  return canvas.transferToImageBitmap();
}

_FrameMessage _frame(
  web.ImageBitmap bitmap, {
  String engineId = 'engine',
  String surfaceId = 'surface',
  String canvasId = 'canvas',
  int generation = 1,
  int frameId = 0,
}) => _FrameMessage(
  type: 'jsr.three.frame',
  engineId: engineId,
  surfaceId: surfaceId,
  canvasId: canvasId,
  generation: generation,
  frameId: frameId,
  width: 2,
  height: 2,
  bitmap: bitmap,
);

Map<String, dynamic> _object(JSObject value) =>
    (value.dartify()! as Map).cast<String, dynamic>();

List<int> _pixel(WebThreeSurface surface, int x, int y) {
  final context =
      surface.canvas.getContext('2d')! as web.CanvasRenderingContext2D;
  final data = context.getImageData(x, y, 1, 1).data.toDart;
  return [data[0], data[1], data[2], data[3]];
}

Future<String> _fetchText(String path) async {
  final response = await web.window
      .fetch(path.toJS)
      .toDart
      .timeout(const Duration(seconds: 5));
  expect(response.ok, isTrue, reason: path);
  return (await response.text().toDart).toDart;
}

JsWidgetEngine _workerEngine({
  required String id,
  required String source,
  required WebThreeHost host,
  Size size = const Size(2, 2),
}) {
  return JsWidgetEngine(
    config: JsRuntimeConfig(
      widgetId: id,
      instanceId: id,
      threeSource: source,
      threeHost: host,
      onRender: (tree) {
        final surface = host.attach(
          tree['engineId']! as String,
          tree['surfaceId']! as String,
          tree,
        );
        surface.resize(size, 1);
      },
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
    ),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'draws and closes a bitmap, notifies, captures PNG, and disposes',
    () async {
      final controls = <Map<String, dynamic>>[];
      final host = createWebThreeHost(diagnosticsEnabled: true);
      host.bindEngine('engine', (message) => controls.add(_object(message)));
      final surface = host.attach('engine', 'surface', const {
        'canvasId': 'canvas',
        'generation': 1,
      });
      var notifications = 0;
      surface.addListener(() => notifications++);
      surface.resize(const Size(2, 2), 2);
      expect(surface.logicalSize, const Size(2, 2));
      expect(surface.devicePixelRatio, 2);
      expect(surface.canvas.width, 4);
      expect(surface.canvas.height, 4);
      final bitmap = _bitmap('#ff0000', bottom: '#0000ff');

      expect(
        host.handleWorkerMessage(
          'engine',
          _frame(bitmap, frameId: 1),
          (message) => controls.add(_object(message)),
        ),
        isTrue,
      );
      await pumpEventQueue();

      expect(_pixel(surface, 0, 0), [255, 0, 0, 255]);
      // Top stays top and bottom stays bottom through ImageBitmap presentation.
      expect(_pixel(surface, 0, 3), [0, 0, 255, 255]);
      expect(bitmap.width, 0);
      expect(bitmap.height, 0);
      expect(notifications, greaterThanOrEqualTo(2));
      expect(controls.single['type'], 'jsr.three.frameAck');
      expect(controls.single['frameId'], 1);
      expect(controls.single['accepted'], isTrue);
      expect(surface.diagnostics['presentedFrames'], 1);
      expect(surface.diagnostics['closedBitmaps'], 1);
      expect(surface.diagnostics['acknowledgedFrames'], 1);

      final png = await surface.capture();
      expect(png, isNotNull);
      expect(png!.take(8), [137, 80, 78, 71, 13, 10, 26, 10]);

      surface.dispose();
      surface.dispose();
      host.release('engine', 'surface');
      expect(surface.isDisposed, isTrue);
      expect(host.findSurface('engine', 'surface'), isNull);
      expect(surface.canvas.width, 0);
      expect(await surface.capture(), isNull);
      expect(controls.last['type'], 'jsr.three.release');
    },
  );

  test('bounds pre-attach frames to two and coalesces to the newest', () async {
    final acknowledgements = <Map<String, dynamic>>[];
    void send(JSObject message) => acknowledgements.add(_object(message));
    final host = WebThreeHost(diagnosticsEnabled: true);
    final first = _bitmap('#ff0000');
    final dropped = _bitmap('#00ff00');
    final newest = _bitmap('#0000ff');

    host.handleWorkerMessage('engine', _frame(first), send);
    host.handleWorkerMessage('engine', _frame(dropped, frameId: 1), send);
    host.handleWorkerMessage('engine', _frame(newest, frameId: 2), send);

    expect(acknowledgements, hasLength(1));
    expect(acknowledgements.single['frameId'], 1);
    expect(acknowledgements.single['reason'], 'coalesced');
    expect(dropped.width, 0);
    expect(first.width, 2);
    expect(newest.width, 2);

    final surface = host.attach('engine', 'surface', const {
      'canvasId': 'canvas',
      'generation': 1,
    });
    surface.resize(const Size(2, 2), 1);
    await pumpEventQueue();

    expect(_pixel(surface, 0, 0), [0, 0, 255, 255]);
    expect(first.width, 0);
    expect(newest.width, 0);
    expect(acknowledgements, hasLength(3));
    expect(surface.diagnostics['presentedFrames'], 2);
    expect(surface.diagnostics['coalescedFrames'], 1);
    expect(surface.diagnostics['pendingFrames'], 0);
    expect(surface.diagnostics['closedBitmaps'], 3);
    expect(surface.diagnostics['acknowledgedFrames'], 3);
    host.disposeEngine('engine');
  });

  test('disposeEngine closes and acknowledges queued frames idempotently', () {
    final controls = <Map<String, dynamic>>[];
    final host = WebThreeHost(diagnosticsEnabled: true);
    host.bindEngine('engine', (message) => controls.add(_object(message)));
    final first = _bitmap('#ff0000');
    final second = _bitmap('#00ff00');
    host.handleWorkerMessage(
      'engine',
      _frame(first),
      (message) => controls.add(_object(message)),
    );
    host.handleWorkerMessage(
      'engine',
      _frame(second, frameId: 1),
      (message) => controls.add(_object(message)),
    );
    expect(controls, isEmpty);

    host.disposeEngine('engine');
    host.disposeEngine('engine');

    expect(first.width, 0);
    expect(second.width, 0);
    expect(controls, hasLength(3));
    expect(controls[0]['type'], 'jsr.three.frameAck');
    expect(controls[0]['reason'], 'released');
    expect(controls[1]['type'], 'jsr.three.frameAck');
    expect(controls[2]['type'], 'jsr.three.release');
    expect(host.diagnostics['channels'], 0);
    expect(host.diagnostics['pendingFrames'], 0);
  });

  test(
    'rejects cross-engine, duplicate and released frames with acks',
    () async {
      final acknowledgements = <Map<String, dynamic>>[];
      void send(JSObject message) => acknowledgements.add(_object(message));
      final host = WebThreeHost(diagnosticsEnabled: true);
      var surface = host.attach('engine', 'surface', const {
        'canvasId': 'canvas',
        'generation': 1,
      });
      surface.resize(const Size(2, 2), 1);

      final foreign = _bitmap('#ffffff');
      host.handleWorkerMessage(
        'engine',
        _frame(foreign, engineId: 'other'),
        send,
      );
      expect(foreign.width, 0);
      expect(acknowledgements.single['engineId'], 'other');
      expect(acknowledgements.single['reason'], 'crossEngine');

      final accepted = _bitmap('#ff0000');
      host.handleWorkerMessage('engine', _frame(accepted, frameId: 5), send);
      await pumpEventQueue();
      final duplicate = _bitmap('#00ff00');
      host.handleWorkerMessage('engine', _frame(duplicate, frameId: 5), send);
      expect(duplicate.width, 0);
      expect(acknowledgements.last['reason'], 'stale');

      host.handleWorkerMessage(
        'engine',
        <String, Object?>{
          'type': 'jsr.three.release',
          'engineId': 'engine',
          'surfaceId': 'surface',
          'canvasId': 'canvas',
          'generation': 1,
        }.jsify(),
        send,
      );
      expect(surface.isDisposed, isTrue);
      expect(host.findSurface('engine', 'surface'), isNull);

      final late = _bitmap('#0000ff');
      host.handleWorkerMessage('engine', _frame(late, frameId: 6), send);
      expect(late.width, 0);
      expect(acknowledgements.last['reason'], 'released');
      expect(host.findSurface('engine', 'surface'), isNull);

      // The prepared mount re-arms this same generation before native attach.
      surface = host.attach('engine', 'surface', const {
        'canvasId': 'canvas',
        'generation': 1,
      });
      surface.resize(const Size(2, 2), 1);
      final remounted = _bitmap('#0000ff');
      host.handleWorkerMessage('engine', _frame(remounted, frameId: 6), send);
      await pumpEventQueue();
      expect(acknowledgements.last['accepted'], isTrue);
      expect(_pixel(surface, 0, 0), [0, 0, 255, 255]);
      host.disposeEngine('engine');
    },
  );

  test(
    'R1 is unsupported, assets fail closed, and counters are opt-in',
    () async {
      final host = WebThreeHost();
      final surface = host.attach('engine', 'surface', const {
        'canvasId': 'canvas',
        'generation': 1,
      });
      expect(surface.diagnostics, isEmpty);
      expect(host.diagnostics, isEmpty);
      expect(
        () => host.submit('engine', Uint8List(0)),
        throwsA(
          predicate(
            (error) => error.toString().contains('three.unsupported: r1'),
          ),
        ),
      );
      await expectLater(
        host.loadAsset('engine', 'asset.png'),
        throwsA(
          predicate((error) => error.toString().contains('three.assetFailure')),
        ),
      );
      host.disposeEngine('engine');
    },
  );

  test('real worker renders upstream WebGL2 and disposes normally', () async {
    // The web test server exposes test/, not build/unit_test_assets. This
    // fixture symlinks to the real generated bundle instead of copying it.
    final source = await _fetchText('/assets/three.web.js');
    final host = WebThreeHost(diagnosticsEnabled: true);
    final engine = _workerEngine(
      id: 'worker-webgl-test',
      source: source,
      host: host,
    );
    try {
      await engine.run('''
const canvas = jsr.three.createCanvas('main');
const renderer = new THREE.WebGLRenderer({canvas, antialias: false});
renderer.setPixelRatio(1);
renderer.setSize(2, 2, false);
renderer.setClearColor(0xff0000, 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10);
renderer.render(scene, camera);
jsr.render({type: 'three', canvasId: 'main', width: 2, height: 2});
''');
      final deadline = DateTime.now().add(const Duration(seconds: 10));
      WebThreeSurface? surface;
      do {
        surface = host.findSurface('worker-webgl-test', 'main#1');
        if (surface != null &&
            (surface.diagnostics['presentedFrames'] ?? 0) > 0) {
          break;
        }
        await Future<void>.delayed(const Duration(milliseconds: 20));
      } while (DateTime.now().isBefore(deadline));
      expect(surface, isNotNull);
      expect(surface!.error, isNull);
      expect(surface.diagnostics['presentedFrames'], greaterThan(0));
      expect(_pixel(surface, 0, 0), [255, 0, 0, 255]);
    } finally {
      await engine.dispose();
    }
  }, timeout: const Timeout(Duration(seconds: 30)));

  test('real worker renders the prepared official Minecraft module', () async {
    final sources = await Future.wait([
      _fetchText('/assets/three.web.js'),
      _fetchText('/assets/three_minecraft_widget.js'),
    ]);
    final host = WebThreeHost(diagnosticsEnabled: true);
    final engine = _workerEngine(
      id: 'worker-minecraft-test',
      source: sources[0],
      host: host,
      size: const Size(640, 360),
    );
    final binding = TestWidgetsFlutterBinding.instance;
    var frameTime = Duration.zero;
    try {
      await engine.run(sources[1]);
      final deadline = DateTime.now().add(const Duration(seconds: 20));
      WebThreeSurface? surface;
      do {
        surface = host.findSurface('worker-minecraft-test', 'main#1');
        if (surface != null &&
            (surface.diagnostics['presentedFrames'] ?? 0) >= 3) {
          break;
        }
        frameTime += const Duration(milliseconds: 25);
        binding.handleBeginFrame(frameTime);
        binding.handleDrawFrame();
        await Future<void>.delayed(const Duration(milliseconds: 25));
      } while (DateTime.now().isBefore(deadline));

      expect(surface, isNotNull);
      print(
        'Web Minecraft diagnostics: error=${surface!.error}; '
        'counters=${surface.diagnostics}; state=${engine.exportedState}; '
        'logs=${engine.peekLogs()}',
      );
      expect(surface.error, isNull);
      expect(surface.diagnostics['presentedFrames'], greaterThanOrEqualTo(3));
      final exported = engine.exportedState;
      expect(exported?['example'], 'webgl_geometry_minecraft');
      expect(exported?['mounted'], isTrue);
      final renderer = exported?['renderer'] as Map?;
      expect((renderer?['triangles'] as num?) ?? 0, greaterThan(1000));

      final colors = <String>{};
      for (var y = 0; y < 8; y++) {
        for (var x = 0; x < 12; x++) {
          final px = (surface.canvas.width * (x + 1)) ~/ 13;
          final py = (surface.canvas.height * (y + 1)) ~/ 9;
          colors.add(_pixel(surface, px, py).join(','));
        }
      }
      expect(colors.length, greaterThan(10), reason: 'non-solid terrain');
    } finally {
      await engine.dispose();
    }
  }, timeout: const Timeout(Duration(seconds: 40)));
}
