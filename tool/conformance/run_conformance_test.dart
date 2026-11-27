import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';

import 'conformance_runner.dart';

/// The `flutter test` entry point of the conformance runner. The CLI
/// wrapper (`run_conformance.dart`) builds a `JSR_CONFORMANCE_SPEC`
/// environment variable and runs THIS file; the machine-readable summary
/// comes back on stdout behind [kJsrConformanceResultMarker].
void main() {
  final spec = ConformanceSpec.fromEnvironment();
  if (spec == null) {
    test('conformance runner requires JSR_CONFORMANCE_SPEC', () {
      markTestSkipped(
        'JSR_CONFORMANCE_SPEC is not set — run through '
        'tool/conformance/run_conformance.dart',
      );
    });
    return;
  }

  final results = <Map<String, dynamic>>[];

  for (final fixture in spec.fixtures) {
    testWidgets(
      'conformance ${fixture.id}',
      (tester) async {
        final outcome = await runConformanceFixture(tester, spec, fixture);
        results.add(outcome.toJson());
        expect(
          outcome.error,
          isNull,
          reason: '${fixture.id}: ${outcome.error}',
        );
      },
      timeout: const Timeout(Duration(minutes: 3)),
    );
  }

  tearDownAll(() {
    // ignore: avoid_print
    print(
      '$kJsrConformanceResultMarker '
      '${jsonEncode(<String, dynamic>{'results': results})}',
    );
  });
}
