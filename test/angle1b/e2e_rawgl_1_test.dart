import 'package:flutter_test/flutter_test.dart';

import '../../tool/three/bench_1b.dart';

// E2E-RAWGL-1 (issue #7, F2 facade-completeness row): the raw GL fixture and
// the readback fixture on the REAL stack. The fixture (clear-to-red + green
// triangle, no three.js) renders through the REAL batched facade; its JS-side
// gl.readPixels FNV must equal the FNV of the SAME recorded batch bytes
// replayed directly through the C decoder on a fresh surface (transport
// equivalence), and both readbacks must show the drawn pixels.
void main() {
  final missing = Shim.resolveProblem();
  test(
    'E2E-RAWGL-1: raw GL fixture renders and the batched transport replays '
    'byte-faithfully',
    () async {
      final result = await run1bRawGlFixture();
      // ignore: avoid_print
      print(
        'E2E-RAWGL-1: match=${result.match} '
        'facade=${result.facadeHash} direct=${result.directHash} '
        'center=${result.center} corner=${result.corner}',
      );
      expect(result.match, isTrue);
      expect(result.center, <int>[0, 255, 0, 255]);
      expect(result.corner, <int>[255, 0, 0, 255]);
    },
    skip: missing,
  );
}
