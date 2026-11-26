// F3b iOS: CI entrypoint for the canonical device suite. `flutter test`
// attaches to a device ONLY for files under integration_test/; the suite
// itself lives at test/angle1b/e2e_ios_scene_test.dart in the root package
// (assignment location) and self-skips off iOS. This wrapper just runs it
// inside the example app package, which hosts the angle_1b plugin and the
// embedded ANGLE dylibs.
import '../../test/angle1b/e2e_ios_scene_test.dart' as suite;

void main() => suite.main();
