import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bootstrap.dart';

void main() {
  test('bootstrap declares __IID dependency contract: __tag reads it', () {
    // The __tag helper references __IID; every engine MUST declare it before
    // evaluating kJsWidgetBootstrap or every widget message throws
    // ReferenceError (widgets stuck on loading spinner — seen on web).
    final tagIdx = kJsWidgetBootstrap.indexOf('function __tag');
    expect(tagIdx, greaterThan(0));
    expect(kJsWidgetBootstrap, contains("__IID"));
  });

  test('bootstrap wraps payloads with iid via __send', () {
    expect(kJsWidgetBootstrap, contains('function __send(ch,payload)'));
    expect(kJsWidgetBootstrap, contains('{"iid":"\'+__IID+\'"'));
  });
}
