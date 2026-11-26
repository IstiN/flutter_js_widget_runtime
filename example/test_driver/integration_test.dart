// F3b iOS: host-side driver for the e2e_ios device suite. CI run
// 45764221986: the `flutter test -d <simulator>` flow waits forever on the
// app-side `ext.flutter.integrationTest` beacon (registered by the tool's
// generated bootstrap) and ends "0 tests passed" after 15 silent minutes.
// `flutter drive` is the documented device integration flow; it streams the
// app's output to this process, so the suite's ANGLE_1B_UNAVAILABLE marker
// and per-test lines land in simulator-attempt.log. The suite itself is the
// canonical ../test/angle1b/e2e_ios_scene_test.dart via the integration_test/
// wrapper.
import 'package:integration_test/integration_test_driver_extended.dart';

Future<void> main() => integrationDriver();
