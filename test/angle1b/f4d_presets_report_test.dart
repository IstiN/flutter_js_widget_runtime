import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../support/three_1b_engine.dart';

// E2E-AA-4 (issue #8, segment F4d): every named preset reports through
// settings() exactly the documented settings table. The table is pinned HERE
// (the document) against the SURFACE — the probe runs the committed native
// bundle on the fake wire, no GPU, so it runs in every CI job. Source of
// record: tool/three/src/cinematic.js PRESETS; docs/angle_1b.md F4d section.
void main() {
  final bundle = File('assets/three/jsr_three_native.js').readAsStringSync();

  const documentedPresets = <String, Map<String, Object?>>{
    'draft': {
      'fps': 24,
      'shutter': 0.5,
      'samples': 1,
      'epoch': 0,
      'effects': {
        'bloom': false,
        'dof': false,
        'fxaa': true,
        'smaa': false,
        'colorGrade': false,
        'film': false,
        'vignette': false,
        'motion': false,
        'afterimage': false,
        'fringe': false,
      },
    },
    'production': {
      'fps': 24,
      'shutter': 0.5,
      'samples': 8,
      'epoch': 0,
      'effects': {
        'bloom': true,
        'dof': true,
        'fxaa': true,
        'smaa': true,
        'colorGrade': 'teal-orange',
        'film': true,
        'vignette': true,
        'motion': true,
        'afterimage': false,
        'fringe': false,
      },
    },
    'deterministic-export': {
      'fps': 24,
      'shutter': 0.5,
      'samples': 8,
      'epoch': 0,
      'effects': {
        'bloom': true,
        'dof': true,
        'fxaa': true,
        'smaa': true,
        'colorGrade': 'teal-orange',
        'film': true,
        'vignette': true,
        'motion': true,
        'afterimage': false,
        'fringe': false,
      },
      'note': 'fixed seed, epoch 0, no adaptive anything',
    },
  };

  test(
    'E2E-AA-4: the cinematic presets report the documented settings table',
    () async {
      final body =
          '''
var cine = jsr.three.cinematic;
if (!cine || typeof cine.presets !== 'object') {
  throw new Error('cinematic.surfaceMissing');
}
var names = ${jsonEncode(documentedPresets.keys.toList())};
var got = {};
for (var i = 0; i < names.length; i++) {
  var profile = cine.presets[names[i]];
  if (!profile || typeof profile.settings !== 'function') {
    throw new Error('preset.missing: ' + names[i]);
  }
  got[names[i]] = profile.settings();
}
results.presets = got;
''';
      final (_, _, state) = await run1bWidgetEngine(
        onebProbeWidget(body),
        threeSource: bundle,
      );
      expect(
        state?['error'],
        isNull,
        reason: 'the cinematic surface is installed',
      );
      final got = state?['presets'];
      expect(got, isA<Map>(), reason: 'settings() reported for every preset');
      String canon(dynamic v) {
        if (v is Map) {
          final keys = v.keys.map((k) => '$k').toList()..sort();
          return '{${keys.map((k) => '"$k":${canon(v[k])}').join(',')}}';
        }
        if (v is List) return '[${v.map(canon).join(',')}]';
        return jsonEncode(v);
      }

      expect(
        canon(got),
        canon(documentedPresets),
        reason: 'settings() must report exactly the documented table',
      );
    },
  );
}
