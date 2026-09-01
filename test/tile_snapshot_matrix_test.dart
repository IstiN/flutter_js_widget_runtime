@Timeout(Duration(minutes: 10))
library;

import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/services.dart';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/hosts/cube_3d_host.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// Tile snapshot matrix: renders every example widget at the tile sizes the
/// Fa app uses (2x2 ~170x170, 4x2 ~350x170, 4x4 ~350x350) and writes the
/// captures as a PNG matrix under `doc/tile-matrix/` so layout regressions
/// across host sizes can be iterated on visually.
///
/// Gated behind JSR_TILE_MATRIX=1 so the regular suite and pre-commit gates
/// stay fast. Run:
///
/// ```sh
/// JSR_TILE_MATRIX=1 flutter test test/tile_snapshot_matrix_test.dart \
///     --update-goldens
/// ```
///
/// Then eyeball `doc/tile-matrix/` (e.g. open the folder in Finder). Files
/// are committed — diffing a widget change shows exactly which tile sizes
/// shifted.
final bool _enabled =
    Platform.environment['JSR_TILE_MATRIX'] == '1';

/// Real-UI tile geometry (logical px): size class → surface size.
const Map<String, Size> _tileSizes = {
  '2x2': Size(170, 170),
  '4x2': Size(350, 170),
  '4x4': Size(350, 350),
};

/// Widgets that need Impeller/GPU (flame_3d) — they render a fallback
/// message headlessly and would only add noise to the matrix.
const Set<String> _skip = {'3d-glb-showcase', 'fitness-trainer'};

const Map<String, String> _widgetFiles = {
  'yolo-hello': 'example/widgets/yolo-hello/widget.js',
  'calculator': 'example/widgets/calculator/widget.js',
  'weather': 'example/widgets/weather/widget.js',
  'stocks': 'example/widgets/stocks/widget.js',
  'crypto': 'example/widgets/crypto/widget.js',
  'animation-showcase': 'example/widgets/animation-showcase/widget.js',
  'map': 'example/widgets/map/widget.js',
  '3d-showcase': 'example/widgets/3d-showcase/widget.js',
  '3d-viewer': 'example/widgets/3d-viewer/widget.js',
  '3d-game-dodge': 'example/widgets/3d-game-dodge/widget.js',
  'm3-showcase': 'example/widgets/m3-showcase/widget.js',
  'pomodoro': 'example/widgets/pomodoro/widget.js',
  'audio-player': 'example/widgets/audio-player/widget.js',
  'video-player': 'example/widgets/video-player/widget.js',
  'adaptive-dashboard': 'example/widgets/adaptive-dashboard/widget.js',
  'charts-showcase': 'example/widgets/charts-showcase/widget.js',
  'webview-showcase': 'example/widgets/webview-showcase/widget.js',
};


final bool _hasNativeLib = File(QuickjsFfi.libraryPath).existsSync();

final Map<String, _RunningWidget> _runners = {};

/// Per-tile-size trees: captured in setUpAll on the real event loop —
/// testWidgets' fake-async zone never fires the real timers the engine's
/// re-render wait relies on.
final Map<String, Map<String, Map<String, dynamic>?>> _trees = {};

void main() {
  setUpAll(() async {
    if (!_enabled || !_hasNativeLib) return;
    await _loadFonts();
    for (final e in _widgetFiles.entries) {
      final js = File(e.value).readAsStringSync();
      final runner = await _runWidget(js, e.key);
      _trees[e.key] = {};
      final bootTree = runner.renders.isNotEmpty ? runner.renders.last : null;
      for (final sizeEntry in _tileSizes.entries) {
        final size = sizeEntry.value;
        // Viewport-reactive widgets re-render per size; size-agnostic ones
        // (scrollable/adaptive by contract) keep their boot tree.
        _trees[e.key]![sizeEntry.key] = await runner.hostEvent('viewport', {
          'width': size.width,
          'height': size.height,
        }) ?? bootTree;
      }
      // Timers/RAF loops must not tick during the captures.
      runner.stopEngineTimers();
      _runners[e.key] = runner;
    }
  });

  tearDownAll(() async {
    for (final r in _runners.values) {
      await r.dispose();
    }
  });

  if (!_enabled) {
    test('tile snapshot matrix is gated behind JSR_TILE_MATRIX=1', () {
      markTestSkipped(
        'Set JSR_TILE_MATRIX=1 (and --update-goldens) to regenerate '
        'doc/tile-matrix/',
      );
    });
    return;
  }

  for (final entry in _widgetFiles.entries) {
    for (final sizeEntry in _tileSizes.entries) {
      testWidgets('${entry.key} @ ${sizeEntry.key} (${sizeEntry.value})',
          (tester) async {
        if (!_hasNativeLib) {
          markTestSkipped('QuickJS native library not built');
        }
        if (_skip.contains(entry.key)) {
          markTestSkipped('needs GPU (flame_3d)');
        }
        await tester.binding.setSurfaceSize(sizeEntry.value);

        // The tree was captured in setUpAll: each tile size got its own
        // viewport report, so the widget re-rendered for that geometry
        // (pomodoro mini/strip/full, adaptive-dashboard…).
        final tree = _trees[entry.key]![sizeEntry.key];
        expect(tree, isNotNull,
            reason: '${entry.key} did not re-render for ${sizeEntry.key}');

        // Capture first, report overflow second: layout exceptions are
        // recorded instead of aborting, so every tile PNG still lands on
        // disk (overflow stripes included) before the test fails.
        final errors = <FlutterErrorDetails>[];
        final prevOnError = FlutterError.onError;
        FlutterError.onError = errors.add;
        try {
          await tester.pumpWidget(_host(tree!));
          await tester.pump(const Duration(milliseconds: 16));
          if (_is3d(entry.key)) {
            await tester.pump(const Duration(milliseconds: 16));
            await tester.pump(const Duration(milliseconds: 16));
          }

          await expectLater(
            find.byType(MaterialApp),
            matchesGoldenFile(
              '../doc/tile-matrix/${entry.key}-${sizeEntry.key}.png',
            ),
          );
        } finally {
          FlutterError.onError = prevOnError;
        }
        if (errors.isNotEmpty) {
          fail(
            '${entry.key} @ ${sizeEntry.key}: '
            '${errors.length} rendering error(s) — see '
            'doc/tile-matrix/${entry.key}-${sizeEntry.key}.png\n'
            '${errors.map((e) => e.exception.toString()).join('\n')}',
          );
        }
      });
    }
  }
}

bool _is3d(String id) => id.startsWith('3d-');

/// In-memory 1x1 tile so the map widget never touches the network or the
/// path_provider-backed tile cache (MissingPluginException in tests).
class _MatrixTileProvider extends TileProvider {
  static final Uint8List _bytes = base64Decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk'
    'YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  );

  @override
  ImageProvider getImage(TileCoordinates coordinates, TileLayer options) =>
      MemoryImage(_bytes);
}

/// Fresh cross-platform 3D host (primitives/OBJ — cube renders headlessly;
/// GLB/flame needs a GPU and stays excluded from the matrix).
final _cubeHost = Cube3dHost.fresh()..skipAnimationLoop = true;

Widget _host(Map<String, dynamic> tree) => MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true),
      home: Scaffold(
        backgroundColor: const Color(0xFF0F172A),
        body: JsonWidgetRenderer(
          onEvent: (_, __) {},
          mapTileProvider: _MatrixTileProvider(),
          js3dHost: _cubeHost,
        ).build(tree),
      ),
    );

/// Real fonts: without them every glyph is an Ahem tofu box, which both
/// ruins the captures and skews text metrics (false overflows). Same set as
/// the golden suite — Roboto from the pinned SDK, MaterialIcons, and the
/// committed monochrome emoji/symbol fonts.
Future<void> _loadFonts() async {
  Future<void> load(String path, String family) async {
    final file = File(path);
    if (!file.existsSync()) return;
    final bytes = await file.readAsBytes();
    final loader = FontLoader(family)
      ..addFont(Future.value(ByteData.view(bytes.buffer)));
    await loader.load();
  }

  final root = Platform.environment['FLUTTER_ROOT'];
  await load(
    '$root/bin/cache/artifacts/material_fonts/Roboto-Regular.ttf', 'Roboto');
  await load(
    '$root/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf',
    'MaterialIcons');
  await load('test/golden/NotoEmoji-Regular.ttf', 'NotoEmoji');
  await load('test/golden/NotoSansSymbols2-Regular.ttf', 'NotoSansSymbols2');
}

class _RunningWidget {
  _RunningWidget(this.backend, this.renders);

  final QuickjsWidgetEngineBackend backend;
  final List<Map<String, dynamic>> renders;

  void stopEngineTimers() => backend.debugStopTimers();

  Future<void> dispose() => backend.dispose();

  Future<Map<String, dynamic>?> hostEvent(
    String target,
    Map<String, dynamic> payload, [
    int waitFor = 20,
  ]) async {
    final before = renders.length;
    backend.dispatchHostEvent(target, payload);
    for (var i = 0; i < waitFor && renders.length <= before; i++) {
      await Future<void>.delayed(const Duration(milliseconds: 10));
    }
    return renders.length > before ? renders.last : null;
  }
}

/// Boots [widgetJs] on the QuickJS backend on the real event loop (same
/// pattern as the golden suite — testWidgets' fake-async zone freezes the
/// engine).
Future<_RunningWidget> _runWidget(String widgetJs, String widgetId) async {
  final renders = <Map<String, dynamic>>[];
  final backend = QuickjsWidgetEngineBackend(
    config: JsRuntimeConfig(
      widgetId: widgetId,
      onRender: renders.add,
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      fetchHandler: (id, url, method, headers) async {},
      loadAssetHandler: (_, __) async => '',
      initialStorage: const {},
      execHandler: (_, __) async => '',
      intervalTickHandler: (_) {},
      rafTickHandler: (_, __) => {},
    ),
  );
  final raced = (() async {
    await backend.run(widgetJs);
    return true;
  })();
  final timeout = Future<void>.delayed(
    const Duration(seconds: 20),
    () {},
  ).then((_) => false);
  await Future.any([raced, timeout]);
  return _RunningWidget(backend, renders);
}
