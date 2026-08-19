@Timeout(Duration(minutes: 5))
library;

import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// Golden tests for the example JS widgets: each widget's real JavaScript
/// runs on the QuickJS backend (the same engine production hosts use) and
/// its rendered tree is captured and rasterized through
/// [JsonWidgetRenderer]. The goldens double as the widget gallery in
/// README.md.
///
/// Widgets that fetch data (weather/stocks/crypto) get deterministic
/// fixture responses through the injected fetch handler, so the golden
/// captures the populated UI instead of the first-frame spinner. Only a
/// fixed number of frames is pumped — infinite animations must never
/// reach `pumpAndSettle`.
///
/// Skipped when the QuickJS native library has not been built (CI builds it
/// before `flutter test`; locally run
/// `bash <quickjs_runtime>/tool/build_quickjs.sh` first).
final bool _hasNativeLib = File(QuickjsFfi.libraryPath).existsSync();

/// Example widget id → its widget.js path (relative to the repo root).
/// Widgets whose scenes need the Impeller-backed flame host (GLB models).
const _flameWidgets = {'3d-glb-showcase', 'fitness-trainer'};

/// All 3D widgets (cube or flame) — their scenes paint from the second
/// frame on, after `onSceneCreated` fires.
bool _is3dWidget(String id) => id.startsWith('3d-') || _flameWidgets.contains(id);

const _widgetFiles = {
  'yolo-hello': 'example/widgets/yolo-hello/widget.js',
  'calculator': 'example/widgets/calculator/widget.js',
  'weather': 'example/widgets/weather/widget.js',
  'stocks': 'example/widgets/stocks/widget.js',
  'crypto': 'example/widgets/crypto/widget.js',
  'animation-showcase': 'example/widgets/animation-showcase/widget.js',
  'map': 'example/widgets/map/widget.js',
  '3d-showcase': 'example/widgets/3d-showcase/widget.js',
  '3d-game-dodge': 'example/widgets/3d-game-dodge/widget.js',
  '3d-glb-showcase': 'example/widgets/3d-glb-showcase/widget.js',
  'fitness-trainer': 'example/widgets/fitness-trainer/widget.js',
  'm3-showcase': 'example/widgets/m3-showcase/widget.js',
  'charts-showcase': 'example/widgets/charts-showcase/widget.js',
};

/// One cube host for all 3D goldens — a fresh instance per test run so
/// scene controllers never leak across widget captures (the singleton would
/// serve disposed controllers from a previous test).
final _goldenCubeHost = Cube3dHost.fresh()..skipAnimationLoop = true;

/// Flame host for GLB widgets (Impeller-backed; the golden pumps render
/// through it on macOS, on Linux CI those widgets fall back to their
/// placeholder and the golden stays the placeholder image).
final _goldenFlameHost = createFlame3dHost();

/// Demo scenes of animation-showcase visited by the interactive golden:
/// tap each menu row and capture the scene it opens.
const _showcaseTaps = {
  'fade': 'go_fade',
  'morph': 'go_morph',
  'bounce': 'go_bounce',
  'cards': 'go_cards',
  'drag': 'go_drag',
  'pulse': 'go_pulse',
  'colors': 'go_colors',
};

/// Interactive states of m3-showcase captured as extra golden frames —
/// the frames double as GIF material for the README. The widget's handlers
/// treat an empty payload as "cycle to the next value", so a bare actionId
/// produces a deterministic next state.
const _m3Taps = {
  // Banner dismissed via its GOT IT action.
  'dismiss': 'banner_dismiss',
  // FAB tapped once: counter at 1.
  'fab': 'fab_tap',
  // NavigationBar cycled to Favorites, segmented cycled to Month, radio
  // flipped to Compact — one combined state per event.
  'nav': 'nav_changed',
  'controls': 'seg_changed',
};

/// 3d-showcase shape buttons: tap each and capture the primitive it swaps
/// in — guards the shape_sphere/torus/city event path end to end.
const _showcase3dTaps = {
  'sphere': 'shape_sphere',
  'torus': 'shape_torus',
  'city': 'shape_city',
};

/// m3-showcase overlay frames: bottomSheet/dialog/snackBar open with an
/// entrance animation, so these captures pump past it (the regular taps
/// pump a single 16ms frame).
const _m3OverlayTaps = {
  'sheet': 'show_sheet',
  'dialog': 'show_dialog',
  'snack': 'show_snack',
  'date': 'show_date',
  'time': 'show_time',
};

/// Fixed weather payload shaped like wttr.in j1.
const _weatherFixture = {
  'current_condition': [
    {
      'temp_C': '21',
      'weatherDesc': [{'value': 'Sunny'}],
      'humidity': '58',
      'windspeedKmph': '12',
      'FeelsLikeC': '20',
      'visibility': '10',
    },
  ],
  'nearest_area': [
    {
      'areaName': [{'value': 'Minsk'}],
      'country': [{'value': 'Belarus'}],
    },
  ],
};

/// Fixed quotes payload shaped like the Yahoo v8 chart API the stocks
/// widget consumes (one fetch per symbol, resolved by URL).
const _stocksQuotes = {
  'AAPL': 189.92,
  'MSFT': 412.3,
  'GOOGL': 141.48,
  'NVDA': 871.2,
  'TSLA': 248.5,
};

/// Fixed prices shaped like the CoinGecko simple/price API the crypto
/// widget consumes (map keyed by coin id).
const _cryptoPrices = {
  'bitcoin': {'usd': 43250.6, 'usd_24h_change': 2.1},
  'ethereum': {'usd': 2245.3, 'usd_24h_change': -1.2},
  'solana': {'usd': 98.4, 'usd_24h_change': 4.5},
  'binancecoin': {'usd': 305.1, 'usd_24h_change': 0.8},
};

/// Resolves the fixture payload for a fetch of [url] from [widget]; null
/// when the widget does not fetch anything golden-relevant.
dynamic _fixtureFor(String widget, String url) {
  switch (widget) {
    case 'weather':
      return _weatherFixture;
    case 'stocks':
      final sym = RegExp(r'chart/([A-Z.]+)').firstMatch(url)?.group(1);
      final price = _stocksQuotes[sym];
      if (price == null) return null;
      return {
        'chart': {
          'result': [
            {
              'meta': {
                'regularMarketPrice': price,
                'chartPreviousClose': price * 0.99,
                'longName': sym,
              },
            },
          ],
        },
      };
    case 'crypto':
      return _cryptoPrices;
  }
  return null;
}

/// A running widget engine plus its render log — lets golden tests drive
/// events (button taps) and capture the resulting tree.
class _RunningWidget {
  _RunningWidget(this.backend, this.renders);

  final QuickjsWidgetEngineBackend backend;
  final List<Map<String, dynamic>> renders;

  /// Stops the JS engine's RAF ticker and interval timers without disposing
  /// the bridge or its scene controllers — the scene3d golden still needs
  /// the controller alive. Widgets with infinite RAF/timer loops (showcase,
  /// 3D games) would otherwise trip the "animation still running after the
  /// tree was disposed" test invariant.
  void stopEngineTimers() => backend.debugStopTimers();

  /// Fires the widget's event handler (as a button tap would) and waits
  /// for the next render it produces.
  Future<Map<String, dynamic>?> tap(String actionId, [int waitFor = 20]) async {
    final before = renders.length;
    await backend.callEvent(actionId);
    for (var i = 0; i < waitFor && renders.length <= before; i++) {
      await Future<void>.delayed(const Duration(milliseconds: 10));
    }
    return renders.length > before ? renders.last : null;
  }

  Future<void> dispose() => backend.dispose();
}

/// Runs [widgetJs] once and returns the tree of the render call that
/// follows data arrival: for fetching widgets that is the populated UI; for
/// pure widgets it is simply the first render.
///
/// [run] is raced against a timeout: animation widgets (yolo-hello,
/// animation-showcase) start an infinite `requestAnimationFrame` loop from
/// the initial eval, so awaiting run() would never complete inside the
/// synchronous QuickJS eval.
Future<_RunningWidget> _runWidget(String widgetJs, String widgetId) async {
  final renders = <Map<String, dynamic>>[];
  void Function(String id, dynamic value) resolve = (_, _) {};
  final backend = QuickjsWidgetEngineBackend(
    config: JsRuntimeConfig(
      widgetId: widgetId,
      js3dHost: _flameWidgets.contains(widgetId) ? _goldenFlameHost : _goldenCubeHost,
      onRender: renders.add,
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      onResolveReady: (fn) => resolve = fn,
      fetchHandler: (id, url, method, headers) async {
        final payload = _fixtureFor(widgetId, url);
        if (payload != null) resolve(id, payload);
      },
    ),
  );
  await backend.init();
  // Freeze the clock: widget headers show the current time, which would
  // make the goldens differ on every run.
  unawaited(backend
      .run(
        widgetJs,
        hostBootstrapJs: 'Date.now = function() { return 1760000000000; };'
            'Date.prototype.toLocaleTimeString = function() '
            '{ return "12:34"; };',
      )
      .catchError((_) {}));
  // Drain pending JS promise continuations (the awaited fetchJson .then);
  // stop as soon as we have the post-data frame.
  for (var i = 0; i < 50; i++) {
    await Future<void>.delayed(const Duration(milliseconds: 10));
    final isFetching = const ['weather', 'stocks', 'crypto'].contains(widgetId);
    final enough = !isFetching ? renders.isNotEmpty : renders.length >= 2;
    if (enough) break;
  }
  return _RunningWidget(backend, renders);
}

/// In-memory 1×1 tile so map goldens never touch the network or the
/// path_provider-backed cache.
class _GoldenTileProvider extends TileProvider {
  static final Uint8List _bytes = base64Decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk'
    'YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  );

  @override
  ImageProvider getImage(TileCoordinates coordinates, TileLayer options) =>
      MemoryImage(_bytes);
}

Widget _host(Map<String, dynamic>? tree, [String? widgetId]) => MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true),
      home: Scaffold(
        backgroundColor: const Color(0xFF0F172A),
        body: Center(
          child: JsonWidgetRenderer(
            onEvent: (_, __) {},
            mapTileProvider: _GoldenTileProvider(),
            js3dHost: widgetId != null && _flameWidgets.contains(widgetId)
                ? _goldenFlameHost
                : _goldenCubeHost,
          ).build(tree),
        ),
      ),
    );

/// Widget id → first post-data rendered tree, computed once before the
/// golden tests run. Running the JS engine in setUpAll keeps it on the real
/// event loop — inside testWidgets the fake async zone would freeze the
/// engine's timers and `run` would never complete.
final Map<String, Map<String, dynamic>?> _trees = {};
final Map<String, _RunningWidget> _runners = {};

/// Golden comparator tolerant to sub-pixel platform differences: font
/// rasterization (macOS CoreText vs Linux FreeType) produces slightly
/// different anti-aliasing — typically under 0.5% of pixels, but enough to
/// fail the strict comparison. Diffs above [tolerance] are real
/// regressions and still fail.
class TolerantGoldenComparator extends LocalFileComparator {
  TolerantGoldenComparator(super.testFile, {this.tolerance = 0.005});

  /// Max fraction of differing pixels (from ComparisonResult.diffPercent).
  final double tolerance;

  @override
  Future<bool> compare(Uint8List imageBytes, Uri golden) async {
    final result = await GoldenFileComparator.compareLists(
      imageBytes,
      await getGoldenBytes(golden),
    );
    if (result.passed) {
      result.dispose();
      return true;
    }
    final withinTolerance = result.diffPercent / 100 <= tolerance;
    result.dispose();
    if (withinTolerance) return true;
    return super.compare(imageBytes, golden);
  }
}

/// Registers a font committed under test/golden/ for deterministic
/// cross-platform glyph rendering.
Future<void> _loadCommittedFont(String path, String family) async {
  final file = File(path);
  if (!file.existsSync()) return;
  final bytes = await file.readAsBytes();
  final loader = FontLoader(family)
    ..addFont(Future.value(ByteData.view(bytes.buffer)));
  await loader.load();
}

void main() {
  // Tolerant goldens: font anti-aliasing differs per platform (CoreText vs
  // FreeType). Construct from the default comparator's basedir (a directory
  // URI) so golden paths keep resolving relative to this test file.
  final basedir = (goldenFileComparator as LocalFileComparator).basedir;
  goldenFileComparator = TolerantGoldenComparator(
    basedir.resolve('goldens_test_file.dart'),
  );

  setUpAll(() async {
    if (_hasNativeLib) {
      for (final e in _widgetFiles.entries) {
        final js = File(e.value).readAsStringSync();
        final runner = await _runWidget(js, e.key);
        _trees[e.key] = runner.renders.isNotEmpty ? runner.renders.last : null;
        // Non-interactive widgets' engines are no longer needed; timers and
        // tickers must not survive into the golden pumps below.
        // Interactive (showcase) and 3D widgets' engines must stay alive:
        // the scene3d node binds the controller created during JS startup,
        // and disposing the bridge would dispose the scene before the
        // golden capture. But their JS-side RAF loops/timers keep ticking
        // and would trip the "animation still running after the tree was
        // disposed" invariant — stop them while keeping the scene alive.
        if (e.key == 'animation-showcase' ||
            e.key == 'm3-showcase' ||
            _is3dWidget(e.key)) {
          runner.stopEngineTimers();
          _runners[e.key] = runner;
          // Cube controllers run their own animation Timer outside the
          // bridge — stop it too (the scene must stay alive for the golden,
          // but nothing may keep ticking into the capture).
          for (final c in _goldenCubeHost.liveControllers.values) {
            c.stopAnimationLoop();
          }
        } else {
          await runner.dispose();
        }
      }
    }
    // Real fonts make goldens readable and reusable as README screenshots;
    // the TTF comes from the pinned Flutter SDK so it is identical on every
    // machine and the goldens stay deterministic across platforms.
    final root = Platform.environment['FLUTTER_ROOT'];
    final file = File(
      '$root/bin/cache/artifacts/material_fonts/Roboto-Regular.ttf',
    );
    if (!file.existsSync()) return;
    final bytes = await file.readAsBytes();
    final loader = FontLoader('Roboto')
      ..addFont(Future.value(ByteData.view(bytes.buffer)));
    await loader.load();
    // MaterialIcons: without it every Icon renders the broken-image
    // placeholder (box with an X) in tests — the icon font is not part of
    // the default test environment.
    final icons = File(
      '$root/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf',
    );
    if (!icons.existsSync()) return;
    final iconBytes = await icons.readAsBytes();
    final iconLoader = FontLoader('MaterialIcons')
      ..addFont(Future.value(ByteData.view(iconBytes.buffer)));
    await iconLoader.load();
    // Emoji: widgets render emoji in text nodes; NotoEmoji (monochrome,
    // committed under test/golden/) keeps the glyphs identical on every
    // platform — color emoji fonts differ between macOS and Linux and
    // would break the goldens.
    await _loadCommittedFont('test/golden/NotoEmoji-Regular.ttf', 'NotoEmoji');
    // U+232B (backspace) & friends live in the symbols block, not emoji.
    await _loadCommittedFont(
      'test/golden/NotoSansSymbols2-Regular.ttf', 'NotoSansSymbols2');
  });


  for (final entry in _widgetFiles.entries) {
    testWidgets('example widget ${entry.key} renders its first frame',
        (tester) async {
      if (!_hasNativeLib) {
        markTestSkipped('QuickJS native library not built');
      }
      await tester.binding.setSurfaceSize(const Size(420, 860));

      final tree = _trees[entry.key];
      expect(tree, isNotNull, reason: '${entry.key} never called jsr.render');

      await tester.pumpWidget(_host(tree, entry.key));
      // A fixed frame, never pumpAndSettle: showcase widgets run infinite
      // animations and timers, and goldens must stay deterministic.
      await tester.pump(const Duration(milliseconds: 16));
      // 3D scenes need a second pump: the Cube widget creates the scene in
      // its first build and `onSceneCreated` fires after that frame; the
      // models and lighting are only painted from the second frame on.
      if (_is3dWidget(entry.key)) {
        // The Cube widget drains pending commands (addModel, etc.) in
        // onSceneCreated — which fires after its first frame; the scene then
        // paints objects only from the following frame. Two extra pumps.
        await tester.pump(const Duration(milliseconds: 16));
        await tester.pump(const Duration(milliseconds: 16));
      }

      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/${entry.key}.png'),
      );
    });
  }

  // Interactive showcase walk: tap each animation-demo row in the menu and
  // capture the scene it opens. Verifies the whole event → JS → render
  // round trip, not just the initial frame.
  for (final tap in _showcaseTaps.entries) {
    testWidgets('showcase scene ${tap.key} opens on tap', (tester) async {
      if (!_hasNativeLib) {
        markTestSkipped('QuickJS native library not built');
      }
      await tester.binding.setSurfaceSize(const Size(420, 860));

      final runner = _runners['animation-showcase'];
      // Start from the menu: fire the row tap and wait for the scene render.
      final tree = await runner!.tap(tap.value);
      expect(tree, isNotNull, reason: 'scene ${tap.key} did not re-render');

      await tester.pumpWidget(_host(tree, 'animation-showcase'));
      await tester.pump(const Duration(milliseconds: 16));

      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/showcase-${tap.key}.png'),
      );
    });
  }

  // Interactive m3-showcase walk: fire payload-less actions and capture the
  // resulting state frames (GIF material for the README).
  for (final tap in _m3Taps.entries) {
    testWidgets('m3-showcase state ${tap.key}', (tester) async {
      if (!_hasNativeLib) {
        markTestSkipped('QuickJS native library not built');
      }
      await tester.binding.setSurfaceSize(const Size(420, 860));

      final runner = _runners['m3-showcase'];
      final tree = await runner!.tap(tap.value);
      expect(tree, isNotNull, reason: 'state ${tap.key} did not re-render');

      await tester.pumpWidget(_host(tree, 'm3-showcase'));
      await tester.pump(const Duration(milliseconds: 16));

      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/m3-${tap.key}.png'),
      );
    });
  }

  // 3d-showcase shape variants: fire the shape_* button events and capture
  // the swapped primitive (extra pumps — the cube scene paints objects from
  // the second frame on).
  for (final tap in _showcase3dTaps.entries) {
    testWidgets('3d-showcase shape ${tap.key} renders on tap',
        (tester) async {
      if (!_hasNativeLib) {
        markTestSkipped('QuickJS native library not built');
      }
      await tester.binding.setSurfaceSize(const Size(420, 860));

      final runner = _runners['3d-showcase'];
      final tree = await runner!.tap(tap.value);
      expect(tree, isNotNull, reason: 'shape ${tap.key} did not re-render');

      await tester.pumpWidget(_host(tree, '3d-showcase'));
      await tester.pump(const Duration(milliseconds: 16));
      await tester.pump(const Duration(milliseconds: 16));
      await tester.pump(const Duration(milliseconds: 16));

      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/3d-showcase-${tap.key}.png'),
      );
    });
  }

  // m3-showcase overlays: pump past the entrance animation so the sheet /
  // dialog / snackbar is fully in frame.
  for (final tap in _m3OverlayTaps.entries) {
    testWidgets('m3-showcase overlay ${tap.key}', (tester) async {
      if (!_hasNativeLib) {
        markTestSkipped('QuickJS native library not built');
      }
      await tester.binding.setSurfaceSize(const Size(420, 860));

      final runner = _runners['m3-showcase'];
      final tree = await runner!.tap(tap.value);
      expect(tree, isNotNull, reason: 'overlay ${tap.key} did not re-render');

      await tester.pumpWidget(_host(tree, 'm3-showcase'));
      // Post-frame show* callback + ~250ms entrance transition.
      await tester.pump(const Duration(milliseconds: 16));
      await tester.pump(const Duration(milliseconds: 400));

      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/m3-${tap.key}.png'),
      );
    });
  }

  tearDownAll(() async {
    for (final runner in _runners.values) {
      await runner.dispose();
    }
  });
}
