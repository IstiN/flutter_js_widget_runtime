import 'package:flutter_test/flutter_test.dart';

import 'package:js_widget_runtime_example/main.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('demo config enables the three lane only for three-* widgets', () {
    final three = buildDemoConfig('three-geometry-colors');
    expect(three.threeEnabled, isTrue);
    expect(three.threeHost, isNotNull);

    final plain = buildDemoConfig('calculator');
    expect(plain.threeEnabled, isFalse);
    expect(plain.threeHost, isNull);

    // No id (legacy zero-argument callers): plain config, no host churn.
    final anonymous = buildDemoConfig();
    expect(anonymous.threeEnabled, isFalse);
    expect(anonymous.threeHost, isNull);
  });
}
