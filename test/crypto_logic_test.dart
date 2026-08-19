import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

const _cryptoResponse = {
  'bitcoin': {'usd': 65000.0, 'usd_24h_change': 1.5},
  'ethereum': {'usd': 3500.0, 'usd_24h_change': -0.5},
  'solana': {'usd': 150.0, 'usd_24h_change': 2.1},
  'binancecoin': {'usd': 580.0, 'usd_24h_change': 0.25},
  'ripple': {'usd': 0.55, 'usd_24h_change': -1.2},
};

void main() {
  if (!hasQuickjsNativeLib) return;

  group('crypto widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget(
        'crypto',
        fetchResponses: {'api.coingecko.com': _cryptoResponse},
      );
      backend = h.backend;
      await Future<void>.delayed(const Duration(milliseconds: 300));
    });

    tearDown(() => backend.dispose());

    test('loads all five coins', () {
      expect(h.state!['loading'], isFalse);
      expect(h.state!['view'], 'list');
      final prices = (h.state!['prices'] as List).cast<Map<String, dynamic>>();
      expect(prices.length, 5);
      final btc = prices.firstWhere((p) => p['id'] == 'bitcoin');
      expect(btc['usd'], 65000.0);
      expect(btc['change24h'], 1.5);
    });

    test('refresh reloads prices', () async {
      await h.callEvent('refresh', timeout: const Duration(seconds: 2));
      final prices = (h.state!['prices'] as List).cast<Map<String, dynamic>>();
      expect(prices.length, 5);
    });

    test('show_chart event is handled', () async {
      await h.callEvent(
        'show_chart_bitcoin',
        timeout: const Duration(seconds: 2),
      );
      // Chart view does not exportState; just ensure no error state appeared.
      expect(h.state!['error'], isNull);
    });
  });
}
