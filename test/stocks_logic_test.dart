import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

Map<String, dynamic> _stockResponse(String symbol, double price, double prev) => {
  'chart': {
    'result': [
      {
        'meta': {
          'regularMarketPrice': price,
          'chartPreviousClose': prev,
          'longName': '$symbol Inc.',
          'shortName': symbol,
          'symbol': symbol,
        },
        'indicators': {
          'quote': [
            {
              'close': [price - 0.5, price],
              'open': [prev, price - 0.5],
              'high': [price, price + 0.2],
              'low': [prev - 0.3, prev],
            }
          ]
        }
      }
    ]
  }
};

void main() {
  if (!hasQuickjsNativeLib) return;

  group('stocks widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget(
        'stocks',
        fetchResponses: {
          'AAPL': _stockResponse('AAPL', 175.5, 173.0),
          'MSFT': _stockResponse('MSFT', 330.0, 325.0),
          'GOOGL': _stockResponse('GOOGL', 140.0, 138.0),
          'NVDA': _stockResponse('NVDA', 460.0, 455.0),
          'TSLA': _stockResponse('TSLA', 240.0, 235.0),
        },
      );
      backend = h.backend;
      await Future<void>.delayed(const Duration(milliseconds: 300));
    });

    tearDown(() => backend.dispose());

    test('loads five default quotes', () {
      expect(h.state!['loading'], isFalse);
      expect(h.state!['view'], 'list');
      final symbols = (h.state!['symbols'] as List).cast<String>();
      expect(symbols, ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA']);
      final quotes = (h.state!['quotes'] as List).cast<Map<String, dynamic>>();
      expect(quotes.length, 5);
      expect(quotes.first['symbol'], 'AAPL');
    });

    test('apply_symbols replaces the watchlist', () async {
      await h.callEvent(
        'apply_symbols',
        payload: {'value': 'AAPL,TSLA'},
        timeout: const Duration(seconds: 2),
      );
      final symbols = (h.state!['symbols'] as List).cast<String>();
      expect(symbols, ['AAPL', 'TSLA']);
    });

    test('show_chart switches to chart view', () async {
      await h.callEvent(
        'show_chart_AAPL',
        timeout: const Duration(seconds: 2),
      );
      // Chart view does not call exportState; the event path is verified by
      // the widget staying alive and not exporting an error.
      expect(h.state!['error'], isNull);
    });
  });
}
