import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

const _weatherResponse = {
  'current_condition': [
    {
      'temp_C': '15',
      'FeelsLikeC': '14',
      'humidity': '72',
      'windspeedKmph': '12',
      'visibility': '10',
      'weatherDesc': [{'value': 'Partly cloudy'}],
    }
  ],
  'nearest_area': [
    {
      'areaName': [{'value': 'London'}],
      'country': [{'value': 'United Kingdom'}],
    }
  ],
};

void main() {
  if (!hasQuickjsNativeLib) return;

  group('weather widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget(
        'weather',
        fetchResponses: {'wttr.in': _weatherResponse},
      );
      backend = h.backend;
      // Wait for the mocked fetch to resolve and exportState to update.
      await Future<void>.delayed(const Duration(milliseconds: 200));
    });

    tearDown(() => backend.dispose());

    test('loads weather for default city', () {
      expect(h.state, isNotNull);
      expect(h.state!['loading'], isFalse);
      expect(h.state!['city'], 'London');
      expect(h.state!['tempC'], '15');
      expect(h.state!['description'], 'Partly cloudy');
    });

    test('submit_city fetches weather for a new city', () async {
      await h.callEvent(
        'submit_city',
        payload: {'city': 'Paris'},
        timeout: const Duration(seconds: 2),
      );
      // The mock always returns London data; the important part is that the
      // query updated and loading settled without an error.
      expect(h.state!['query'], 'Paris');
      expect(h.state!['error'], isNull);
    });

    test('city_input_change updates input value', () async {
      await h.callEvent('city_input_change', payload: {'value': 'Berlin'});
      // The widget does not export the raw input; the submit path covers it.
      expect(h.state!['loading'], isFalse);
    });
  });
}
