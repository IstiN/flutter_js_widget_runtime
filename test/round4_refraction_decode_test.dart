import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_protocol_cases.dart';

void main() {
  test('negative envMapIntensity decodes as refraction ratio (R1 v4)', () {
    final decoded = threeProtocolDecoder.decodeR1(threeR1([
      (3, threeMaterialV4(envMapId: 13, envMapIntensity: -0.98)),
    ], version: 4));
    final material = decoded.commands.whereType<JsThreeMaterialUpsert>().single;
    expect(material.envMapIntensity, closeTo(-0.98, 1e-6));
    expect(material.envMapTextureId, 13);
    expect(material.hasEnvMap, isTrue);
  });
}
