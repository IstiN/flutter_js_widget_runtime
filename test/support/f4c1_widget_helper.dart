import 'dart:convert';
import 'dart:io';

// Shared F4c1 harness (issue #8, segment F4c1): assembles the checkpoint
// widget for the engine/1B legs from the SAME sources the web leg runs —
// tool/three/cases_f4c1/scene_f4c1.js + widget_f4c1.js (one implementation of
// the checkpoint program on both lanes) — runs it through the real engine
// stack, and persists the exported pixel dumps for the tier compare.
const kF4c1Dir = '/tmp/f4c1';

String f4c1Bundle() => File('assets/three/jsr_three_web.js').readAsStringSync();

String f4c1Widget() {
  final scene = File('tool/three/cases_f4c1/scene_f4c1.js').readAsStringSync();
  final widget = File(
    'tool/three/cases_f4c1/widget_f4c1.js',
  ).readAsStringSync();
  return '$scene\n$widget';
}

/// Runs the web driver (Chrome WebGL2 reference leg) and then the tier
/// compare against the 1B dumps written by [writeOnebDumps]. Returns the
/// parsed driver stdout.
Future<String> runF4c1WebAndCompare() async {
  final web = await Process.run(
    'bash',
    ['tool/three/cases_f4c1.sh', 'web'],
    environment: {
      ...Platform.environment,
      // Playwright's bundled Chromium: the repo has no Google Chrome.app.
      'JSR_WEBGL_REF_CHANNEL': 'chromium',
    },
    runInShell: false,
  ).timeout(const Duration(minutes: 6));
  if (web.exitCode != 0) {
    // ignore: avoid_print
    print(web.stdout);
    // ignore: avoid_print
    print(web.stderr);
    throw StateError('F4c1 web leg failed');
  }
  return web.stdout as String;
}

Future<String> runF4c1Compare() async {
  final cmp = await Process.run(
    'bash',
    ['tool/three/cases_f4c1.sh', 'compare'],
    environment: Platform.environment,
    runInShell: false,
  ).timeout(const Duration(minutes: 6));
  // ignore: avoid_print
  print(cmp.stdout);
  if (cmp.exitCode != 0) {
    // ignore: avoid_print
    print(cmp.stderr);
    throw StateError('F4c1 tier compare failed');
  }
  return cmp.stdout as String;
}

/// Decodes the widget's exported base64 dumps and writes them as raw RGBA
/// files for the corpus tier diff (diff_1b.cjs).
void writeOnebDumps(Map<String, dynamic> state, List<String> checkpoints) {
  Directory(kF4c1Dir).createSync(recursive: true);
  final dumps = state['dumps'] as Map<String, dynamic>;
  for (final cp in checkpoints) {
    final dump = dumps[cp];
    if (dump is! String) {
      throw StateError('the 1B leg exported no dump for $cp');
    }
    File('$kF4c1Dir/oneb_$cp.rgba').writeAsBytesSync(base64Decode(dump));
  }
}

Map<String, dynamic> f4c1Tiers() {
  final text = File('$kF4c1Dir/tiers.json').readAsStringSync();
  final rows = (jsonDecode(text) as List).cast<Map<String, dynamic>>();
  return {for (final r in rows) r['cp'] as String: r};
}

/// The widget's exported state — every caller asserts [check] maps first.
Map<String, dynamic> f4c1State(Map<String, dynamic>? exported) {
  if (exported == null) {
    throw StateError('the F4c1 widget exported no state');
  }
  final error = exported['error'];
  if (error != null) {
    throw StateError('the F4c1 widget errored: $error');
  }
  return exported;
}
