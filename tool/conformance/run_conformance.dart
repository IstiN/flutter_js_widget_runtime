import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:js_widget_runtime/src/tooling/jsr_widget_tool_core.dart';

/// Marks the machine-readable summary line inside `flutter test` output
/// (kept in sync with `conformance_runner.dart`, which cannot be imported
/// here — it needs Flutter).
const String kJsrConformanceResultMarker = '__JSR_CONFORMANCE_RESULT__';

/// CLI wrapper of the Flutter conformance runner (issue #9, F1).
///
/// Usage (mirrors the plan's runner contract):
/// ```
/// dart run tool/conformance/run_conformance.dart \
///   --fixtures <dir> --out <dir> [--filter <glob>] [--harness <dir>]
/// ```
///
/// The wrapper selects the fixtures, starts the per-fixture mock servers
/// declared by `meta.json` (`node <harness>/harness.mjs mock <fixture-dir>`),
/// runs `tool/conformance/run_conformance_test.dart` through `flutter test`,
/// and writes `<out>/conformance-summary.json`. Exit 0 when every result
/// file exists and carries no `error`; exit 1 otherwise (CI gate).
Future<void> main(List<String> arguments) async {
  String? fixturesDir;
  String? outDir;
  String? filter;
  var harness = '';

  /// Consumes the value of the flag at [i] (must exist and not be a flag).
  String take(int i) {
    if (i + 1 >= arguments.length || arguments[i + 1].startsWith('--')) {
      stderr.writeln('${arguments[i]} requires a value');
      exit(2);
    }
    return arguments[i + 1];
  }

  for (var i = 0; i < arguments.length; i++) {
    switch (arguments[i]) {
      case '--fixtures':
        fixturesDir = take(i++);
      case '--out':
        outDir = take(i++);
      case '--filter':
        filter = take(i++);
      case '--harness':
        harness = take(i++);
      case '--help' || '-h':
        _printUsage();
        exit(0);
      default:
        stderr.writeln('unknown argument: ${arguments[i]}');
        exit(2);
    }
  }
  if (fixturesDir == null || outDir == null) {
    stderr.writeln('--fixtures and --out are required');
    exit(2);
  }

  final packageRoot = _packageRoot();
  final harnessDir = harness.isEmpty
      ? '$packageRoot/.conformance/js_widget_runtime'
      : (harness.startsWith('/') ? harness : '$packageRoot/$harness');

  // ── Select fixtures ──────────────────────────────────────────────────
  final rootDir = Directory(fixturesDir);
  if (!rootDir.existsSync()) {
    stderr.writeln('fixtures directory not found: $fixturesDir');
    exit(2);
  }
  final pattern = _globToRegExp(filter ?? '*');
  final selected = <String>[];
  for (final entry in rootDir.listSync()) {
    if (entry is! Directory) continue;
    if (!File('${entry.path}/widget.js').existsSync()) continue;
    final id = entry.uri.pathSegments.where((s) => s.isNotEmpty).last;
    if (pattern.hasMatch(id)) selected.add(entry.path);
  }
  selected.sort();
  if (selected.isEmpty) {
    stderr.writeln('no fixture matches --filter ${filter ?? '*'}');
    exit(2);
  }

  // ── Mock servers ─────────────────────────────────────────────────────
  final mockServers = <String, Process>{};
  final fixtureSpecs = <Map<String, dynamic>>[];
  for (final dir in selected) {
    final id = dir.split('/').where((s) => s.isNotEmpty).last;
    String? origin;
    if (_declaresMock(dir)) {
      final started = await _startMockServer(harnessDir, dir);
      if (started == null) {
        stderr.writeln('mock server failed to start for $id');
        exit(1);
      }
      origin = started.origin;
      mockServers[id] = started.process;
      // ignore: avoid_print
      print('conformance: mock for $id at $origin');
    }
    fixtureSpecs.add(<String, dynamic>{
      'id': id,
      'dir': dir,
      'mockOrigin': origin,
    });
  }

  // ── Run through flutter test ─────────────────────────────────────────
  final spec = <String, dynamic>{
    'fixturesDir': fixturesDir,
    'outDir': outDir,
    'fixtures': fixtureSpecs,
  };
  final env = <String, String>{
    ...Platform.environment,
    ...defaultQuickjsLibEnv(),
    'JSR_CONFORMANCE_SPEC': jsonEncode(spec),
  };

  final result = await Process.run(
    _resolveFlutter(),
    ['test', 'tool/conformance/run_conformance_test.dart', '--reporter', 'compact'],
    workingDirectory: packageRoot,
    environment: env,
    stdoutEncoding: utf8,
    stderrEncoding: utf8,
  );

  final summary = _extractSummary('${result.stdout}\n${result.stderr}');
  final outPath = '$outDir/conformance-summary.json';
  Directory(outDir).createSync(recursive: true);
  File(outPath).writeAsStringSync(
    const JsonEncoder.withIndent('  ')
        .convert(summary ?? <String, dynamic>{'results': const <dynamic>[]}),
  );

  // ── Verdict: every result.json present, DONE/SKIP, no error ─────────
  var failures = 0;
  for (final fixture in fixtureSpecs) {
    final id = fixture['id'] as String;
    final file = File('$outDir/$id.result.json');
    if (!file.existsSync()) {
      stderr.writeln('conformance: missing result for $id');
      failures++;
      continue;
    }
    final json = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
    if (json['error'] != null) {
      stderr.writeln('conformance: $id error: ${json['error']}');
      failures++;
    }
  }
  if (summary == null) failures++;

  final results = (summary?['results'] as List? ?? const []).cast<Map>();
  final done = results.where((r) => r['status'] == 'DONE').length;
  final skipped = results.where((r) => r['status'] == 'SKIP').length;
  // ignore: avoid_print
  print('conformance: $done DONE, $skipped SKIP, $failures failures');
  stdout.write(result.stdout);
  stderr.write(result.stderr);
  // ignore: avoid_print
  print('conformance: summary → $outPath');

  for (final process in mockServers.values) {
    process.kill();
  }
  exit(failures > 0 || result.exitCode != 0 ? 1 : 0);
}

bool _declaresMock(String fixtureDir) {
  final metaPath = '$fixtureDir/meta.json';
  if (!File(metaPath).existsSync()) return false;
  final mock = (jsonDecode(File(metaPath).readAsStringSync())
      as Map<String, dynamic>)['mock'];
  return mock is Map && mock.isNotEmpty;
}

Future<({Process process, String origin})?> _startMockServer(
  String harnessDir,
  String fixtureDir,
) async {
  final script = File('$harnessDir/harness.mjs');
  if (!script.existsSync()) {
    stderr.writeln('harness script not found: ${script.path}');
    return null;
  }
  final process = await Process.start('node', [script.path, 'mock', fixtureDir]);
  final completer = Completer<String?>();
  late final StreamSubscription<String> subscription;
  subscription = process.stdout
      .transform(const Utf8Decoder())
      .transform(const LineSplitter())
      .listen((line) {
    final match = RegExp(r'http://127\.0\.0\.1:\d+').firstMatch(line);
    if (match != null && !completer.isCompleted) {
      completer.complete(match.group(0));
    }
  });
  final timer = Timer(const Duration(seconds: 10), () {
    if (!completer.isCompleted) completer.complete(null);
  });
  final origin = await completer.future;
  timer.cancel();
  await subscription.cancel();
  if (origin == null) process.kill();
  return origin == null ? null : (process: process, origin: origin);
}

Map<String, dynamic>? _extractSummary(String output) {
  for (final line in output.split('\n').reversed) {
    final idx = line.indexOf(kJsrConformanceResultMarker);
    if (idx < 0) continue;
    final json = line.substring(idx + kJsrConformanceResultMarker.length).trim();
    try {
      final decoded = jsonDecode(json);
      if (decoded is Map<String, dynamic>) return decoded;
    } on FormatException {
      // Keep scanning.
    }
  }
  return null;
}

RegExp _globToRegExp(String glob) => RegExp(
      '^${glob.replaceAllMapped(RegExp(r'[*?]'), (m) => m[0] == '*' ? '.*' : '.')}\$',
    );

String _resolveFlutter() {
  final envPath = Platform.environment['FLUTTER_ROOT'];
  if (envPath != null && File('$envPath/bin/flutter').existsSync()) {
    return '$envPath/bin/flutter';
  }
  final which = Process.runSync('which', ['flutter'], runInShell: true);
  return which.exitCode == 0 ? '${which.stdout}'.trim() : 'flutter';
}

String _packageRoot() {
  var dir = Directory.current.path;
  while (true) {
    final pubspec = File('$dir/pubspec.yaml');
    if (pubspec.existsSync() &&
        pubspec
            .readAsStringSync()
            .contains(RegExp(r'^name:\s*js_widget_runtime\s*$', multiLine: true))) {
      return dir;
    }
    final parent = Directory(dir).parent.path;
    if (parent == dir) {
      stderr.writeln(
        'cannot locate the js_widget_runtime package above '
        '${Directory.current.path} — run inside the package checkout',
      );
      exit(2);
    }
    dir = parent;
  }
}

void _printUsage() {
  // ignore: avoid_print
  print(
    'Usage: dart run tool/conformance/run_conformance.dart\n'
    '  --fixtures <dir>   fixture directory (required)\n'
    '  --out <dir>        output directory for result.json files (required)\n'
    '  --filter <glob>    fixture id filter (default *)\n'
    '  --harness <dir>    contract harness directory\n'
    '                     (default .conformance/js_widget_runtime)',
  );
}
