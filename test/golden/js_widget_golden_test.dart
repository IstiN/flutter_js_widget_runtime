@Timeout(Duration(minutes: 5))
library;

import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
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
const _widgetFiles = {
  'yolo-hello': 'example/widgets/yolo-hello/widget.js',
  'calculator': 'example/widgets/calculator/widget.js',
  'weather': 'example/widgets/weather/widget.js',
  'stocks': 'example/widgets/stocks/widget.js',
  'crypto': 'example/widgets/crypto/widget.js',
  'animation-showcase': 'example/widgets/animation-showcase/widget.js',
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

/// Fixed quotes payload shaped like the stocks widget's API.
const _stocksFixture = {
  'quoteResponse': {
    'result': [
      {
        'symbol': 'AAPL',
        'shortName': 'Apple Inc.',
        'regularMarketPrice': 189.92,
        'regularMarketChangePercent': 1.24,
      },
      {
        'symbol': 'GOOGL',
        'shortName': 'Alphabet Inc.',
        'regularMarketPrice': 141.48,
        'regularMarketChangePercent': -0.52,
      },
      {
        'symbol': 'TSLA',
        'shortName': 'Tesla Inc.',
        'regularMarketPrice': 248.5,
        'regularMarketChangePercent': 2.87,
      },
    ],
  },
};

/// Fixed coins payload shaped like the crypto widget's API.
const _cryptoFixture = {
  'data': [
    {
      'name': 'Bitcoin',
      'symbol': 'BTC',
      'priceUsd': 43250.6,
      'changePercent24Hr': 2.1,
    },
    {
      'name': 'Ethereum',
      'symbol': 'ETH',
      'priceUsd': 2245.3,
      'changePercent24Hr': -1.2,
    },
    {
      'name': 'Solana',
      'symbol': 'SOL',
      'priceUsd': 98.4,
      'changePercent24Hr': 4.5,
    },
  ],
};

dynamic _fixtureFor(String widget) => switch (widget) {
      'weather' => _weatherFixture,
      'stocks' => _stocksFixture,
      'crypto' => _cryptoFixture,
      _ => null,
};

/// Runs [widgetJs] once and returns the tree of the render call that
/// follows data arrival: for fetching widgets that is the populated UI; for
/// pure widgets it is simply the first render.
///
/// [run] is raced against a timeout: animation widgets (yolo-hello,
/// animation-showcase) start an infinite `requestAnimationFrame` loop from
/// the initial eval, so awaiting run() would never complete inside the
/// synchronous QuickJS eval.
Future<Map<String, dynamic>?> _renderedTreeAfterData(
  String widgetJs,
  String widgetId,
) async {
  final renders = <Map<String, dynamic>>[];
  void Function(String id, dynamic value) resolve = (_, _) {};
  final backend = QuickjsWidgetEngineBackend(
    config: JsRuntimeConfig(
      widgetId: widgetId,
      onRender: renders.add,
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      onResolveReady: (fn) => resolve = fn,
      fetchHandler: _fixtureFor(widgetId) == null
          ? null
          : (id, url, method, headers) async =>
                resolve(id, _fixtureFor(widgetId)),
    ),
  );
  await backend.init();
  // Freeze the clock: widget headers show the current time, which would
  // make the goldens differ on every run.
  final running = backend.run(
    widgetJs,
    hostBootstrapJs: 'Date.now = function() { return 1760000000000; };'
        'Date.prototype.toLocaleTimeString = function() { return "12:34"; };',
  );
  // Drain pending JS promise continuations (the awaited fetchJson .then);
  // stop as soon as we have the post-data frame.
  for (var i = 0; i < 50; i++) {
    await Future<void>.delayed(const Duration(milliseconds: 10));
    final enough = _fixtureFor(widgetId) == null ? renders.isNotEmpty : renders.length >= 2;
    if (enough) break;
  }
  // The RAF/timer loop may keep the eval pending; dispose regardless.
  unawaited(running.catchError((_) {}));
  await backend.dispose();
  return renders.isNotEmpty ? renders.last : null;
}

Widget _host(Map<String, dynamic>? tree) => MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true),
      home: Scaffold(
        backgroundColor: const Color(0xFF0F172A),
        body: Center(
          child: JsonWidgetRenderer(onEvent: (_, __) {}).build(tree),
        ),
      ),
    );

/// Widget id → first post-data rendered tree, computed once before the
/// golden tests run. Running the JS engine in setUpAll keeps it on the real
/// event loop — inside testWidgets the fake async zone would freeze the
/// engine's timers and `run` would never complete.
final Map<String, Map<String, dynamic>?> _trees = {};

void main() {
  setUpAll(() async {
    if (_hasNativeLib) {
      for (final e in _widgetFiles.entries) {
        final js = File(e.value).readAsStringSync();
        _trees[e.key] = await _renderedTreeAfterData(js, e.key);
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

      await tester.pumpWidget(_host(tree));
      // A fixed frame, never pumpAndSettle: showcase widgets run infinite
      // animations and timers, and goldens must stay deterministic.
      await tester.pump(const Duration(milliseconds: 16));

      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/${entry.key}.png'),
      );
    });
  }
}
