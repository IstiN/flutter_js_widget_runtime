import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

// UT-BUNDLE-1 (issue #7, F2 row 1): bundle identity of the 1B inputs. The
// committed three bundles match their manifest hashes, and the facade/packer
// pair the jsr_three_angle package SHIPS is byte-identical to the tool/three
// sources it is generated from (the manifest hashes the tool/three inputs —
// assets/three/bundle_manifest.json). The reproducible-hash proof itself is
// the quality job's `node tool/three/build.mjs --source ... --verify` run.
String sha256(String path) {
  final r = Process.runSync('shasum', <String>['-a', '256', path]);
  if (r.exitCode != 0) throw StateError('shasum failed for $path');
  return (r.stdout as String).split(' ').first;
}

void main() {
  test(
    'UT-BUNDLE-1: committed three bundles match the manifest output hashes',
    () {
      final manifest = jsonDecode(
        File('assets/three/bundle_manifest.json').readAsStringSync(),
      ) as Map<String, dynamic>;
      final outputs = manifest['outputs'] as Map<String, dynamic>;
      expect(
        outputs.keys,
        containsAll(<String>['jsr_three_web.js', 'jsr_three_native.js']),
      );
      for (final entry in outputs.entries) {
        final bytes = File('assets/three/${entry.key}').readAsBytesSync();
        expect(
          entry.value['sha256'],
          sha256('assets/three/${entry.key}'),
          reason: '${entry.key} differs from the pinned-build manifest hash',
        );
        expect(entry.value['bytes'], bytes.length);
      }
    },
  );

  test('UT-BUNDLE-1: the manifest hashes the real facade input', () {
    final manifest = jsonDecode(
      File('assets/three/bundle_manifest.json').readAsStringSync(),
    ) as Map<String, dynamic>;
    final inputs =
        (manifest['build'] as Map<String, dynamic>)['inputSha256']
            as Map<String, dynamic>;
    expect(inputs['tool/three/src/webgl2_facade.js'], sha256('tool/three/src/webgl2_facade.js'));
  });

  test('UT-BUNDLE-1: the shipped jsr_three_angle facade copies are identical', () {
    expect(
      File('packages/jsr_three_angle/facade/webgl2_facade.js').readAsStringSync(),
      File('tool/three/src/webgl2_facade.js').readAsStringSync(),
    );
    expect(
      File('packages/jsr_three_angle/facade/g1_packer.js').readAsStringSync(),
      File('tool/three/gen/g1_packer.js').readAsStringSync(),
    );
  });
}
