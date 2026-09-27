import 'dart:convert';
import 'dart:io';

import 'package:js_widget_runtime/src/tooling/jsr_widget_tool_core.dart';
import 'package:path/path.dart' as p;

export 'package:js_widget_runtime/src/tooling/jsr_widget_tool_core.dart' show kJsrToolResultMarker;

/// `jsr_widget` — headless widget verification for humans and agents.
///
///   dart run bin/jsr_widget.dart test <widget-dir|widget.js> \
///       [--event <id|json>]... [--expect-state <json>]
///       [--expect-console <substr>]... [--json]
///
///   dart run bin/jsr_widget.dart screenshot <widget-dir|widget.js> \
///       [--width <px>] [--height <px>] [--scale <x>] [--theme dark|light] \
///       [--event <id>]... [--out <png>]
///
/// TEST mode runs the widget's real JavaScript on the QuickJS backend with
/// NO rendering: dispatch events, capture console + `jsr.exportState`,
/// assert expectations — exit code 0/1. SCREENSHOT mode pumps the rendered
/// tree through the production renderer and writes a PNG.
///
/// Both modes run as a generated `flutter test` invocation against
/// tool/jsr_widget_harness_test.dart, so they need the Flutter SDK on
/// PATH (agents in the Fa ecosystem already have it). The QuickJS native
/// library is auto-discovered from the pub cache when JSR_QUICKJS_LIB is
/// not set.
Future<void> main(List<String> arguments) async {
  JsrToolSpec spec;
  try {
    spec = parseJsrToolArgs(arguments);
  } on JsrToolUsageException catch (e) {
    stderr.writeln(e.message);
    exit(2);
  }

  final flutter = _resolveFlutter();
  if (flutter == null) {
    stderr.writeln(
      'flutter not found on PATH — the jsr_widget CLI renders through the '
      'Flutter test harness. Add the Flutter SDK to PATH and retry.',
    );
    exit(2);
  }

  final packageRoot = _resolvePackageRoot();
  if (packageRoot == null) {
    stderr.writeln(
      'cannot locate the js_widget_runtime package (no .dart_tool/'
      'package_config.json above ${Directory.current.path}) — run from a '
      'project that depends on it.',
    );
    exit(2);
  }

  final env = {
    ...Platform.environment,
    ...defaultQuickjsLibEnv(),
    'JSR_TOOL_SPEC': jsonEncode(spec.toJson()),
  };

  final result = await Process.run(
    flutter,
    ['test', 'tool/jsr_widget_harness_test.dart', '--reporter', 'compact'],
    workingDirectory: packageRoot,
    environment: env,
    stdoutEncoding: utf8,
    stderrEncoding: utf8,
  );

  final report = _extractReport('${result.stdout}\n${result.stderr}');
  if (spec.machine && report != null) {
    stdout.writeln(const JsonEncoder.withIndent('  ').convert(report));
  } else {
    stdout.write(result.stdout);
    stderr.write(result.stderr);
    if (report != null) {
      stdout.writeln(const JsonEncoder.withIndent('  ').convert(report));
    }
  }

  if (result.exitCode != 0 || (report?['ok'] as bool? ?? false) == false) {
    exit(1);
  }
  exit(0);
}

/// The harness prints one `__JSR_TOOL_RESULT__ {json}` line.
Map<String, dynamic>? _extractReport(String output) {
  for (final line in output.split('\n').reversed) {
    final idx = line.indexOf(kJsrToolResultMarker);
    if (idx < 0) continue;
    final json = line.substring(idx + kJsrToolResultMarker.length).trim();
    try {
      if (jsonDecode(json) is Map<String, dynamic>) {
        return (jsonDecode(json) as Map).cast<String, dynamic>();
      }
    } on FormatException {
      // Keep scanning.
    }
  }
  return null;
}

String? _resolveFlutter() {
  final envPath = Platform.environment['FLUTTER_ROOT'];
  if (envPath != null && File('$envPath/bin/flutter').existsSync()) {
    return '$envPath/bin/flutter';
  }
  return Process.runSync('which', ['flutter'], runInShell: true)
          .exitCode ==
      0
      ? 'flutter'
      : null;
}

/// Walks up from the current directory looking for a package_config that
/// references js_widget_runtime — the CLI works from any depending
/// project, not only from the jsr checkout.
String? _resolvePackageRoot() {
  var dir = Directory.current;
  while (true) {
    final config = File(
      '${dir.path}/.dart_tool/package_config.json',
    );
    if (config.existsSync()) {
      try {
        final decoded = jsonDecode(config.readAsStringSync());
        if (decoded is Map && decoded['packages'] is List) {
          for (final package in decoded['packages'] as List) {
            if (package is Map && package['name'] == 'js_widget_runtime') {
              final rootUri = (package['rootUri'] as String?) ?? '';
              // rootUri is relative to the .dart_tool/ directory holding
              // package_config.json (../ for the package itself).
              final resolved = rootUri.startsWith('file:')
                  ? Uri.parse(rootUri).toFilePath()
                  : p.normalize(p.join(dir.path, '.dart_tool', rootUri));
              if (Directory(resolved).existsSync()) {
                return Directory(resolved).absolute.path;
              }
            }
          }
        }
      } on FormatException {
        // Broken config — keep walking up.
      }
    }
    final parent = dir.parent;
    if (parent.path == dir.path) return null;
    dir = parent;
  }
}
