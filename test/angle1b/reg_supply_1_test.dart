import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

// REG-SUPPLY-1 / BUILD-ANGLE-1 (issue #7, ADR-0002): the pin file, the
// vendor notices and the decision record must agree on the pinned ANGLE
// revision, and the tree must keep no reference to the pre-move shim
// location (the shim now lives under packages/jsr_three_angle/native/
// angle/). The searched pattern is assembled from two string literals so
// this guard does not match itself.
void main() {
  const revision = '9c6a64c9775b7c8ad1e9c624c2e1974f48f7dc87';
  const movedPrefix = 'packages/jsr_three_angle/native/angle';
  final stalePattern =
      'native/'
      'angle';

  final pin =
      jsonDecode(File('tool/three/pins/angle_pin.json').readAsStringSync())
          as Map<String, dynamic>;

  test(
    'BUILD-ANGLE-1: pin carries the pinned revision and all platform ids',
    () {
      expect(pin['revision'], revision);
      expect(pin['date'], '2026-11-08');
      expect(pin['source'], 'https://chromium.googlesource.com/angle/angle');
      expect(pin['license'], 'BSD-3-Clause');
      final gn = pin['gn'] as Map<String, dynamic>;
      expect(gn.keys.toList()..sort(), <String>[
        'android-arm64',
        'android-armv7',
        'android-x86_64',
        'ios-arm64',
        'macos-arm64',
      ]);
      expect(gn['macos-arm64'], contains('angle_enable_metal=true'));
      expect(gn['ios-arm64'], contains('target_os="ios"'));
      expect(gn['android-arm64'], contains('target_os="android"'));
    },
  );

  test('REG-SUPPLY-1: ANGLE_NOTICES names the pinned revision and license', () {
    final notices = File(
      'packages/jsr_three_angle/ANGLE_NOTICES',
    ).readAsStringSync();
    expect(notices, contains(revision));
    expect(notices, contains('BSD 3-Clause'));
  });

  test('REG-SUPPLY-1: ADR-0002 records the same revision', () {
    final adr = File('docs/adr/0002-angle-pin-and-build.md').readAsStringSync();
    expect(adr, contains(revision));
  });

  test('REG-SUPPLY-1: no stale shim path outside packages/ and docs/', () {
    final result = Process.runSync('git', <String>[
      'grep',
      '-n',
      stalePattern,
      '--',
      ':!docs',
      ':!packages',
    ]);
    // Exit 1 simply means no match at all, which is also fine.
    final lines = result.exitCode == 0
        ? (result.stdout as String)
              .split('\n')
              .where((l) => l.isNotEmpty)
              .toList()
        : <String>[];
    final hit = RegExp(r'^([^:]+):\d+:(.*)$', dotAll: true);
    for (final line in lines) {
      final m = hit.firstMatch(line);
      expect(m, isNotNull, reason: 'unparsable git grep line: $line');
      expect(
        m!.group(2)!.contains(movedPrefix),
        isTrue,
        reason: 'stale pre-move shim path in ${m.group(1)}',
      );
    }
  });
}
