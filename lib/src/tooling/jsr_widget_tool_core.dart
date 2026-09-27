library;

import 'dart:convert';
import 'dart:io';

/// Core (Flutter-free) logic for the `jsr_widget` CLI: argument parsing,
/// the machine-readable spec passed to the Flutter harness, expectation
/// matchers and the result report.
///
/// Widget authors (and coding agents) drive widget verification from the
/// command line: `dart run bin/jsr_widget.dart test <target>` runs the
/// widget's real JavaScript on the QuickJS backend headlessly — no
/// rendering, no golden files — and `... screenshot <target>` rasterizes a
/// frame through the real renderer. This file holds everything that does
/// not need `dart:ui` so it stays unit-testable.

/// Marks the machine-readable report line inside `flutter test` output so
/// the CLI wrapper can extract it.
const String kJsrToolResultMarker = '__JSR_TOOL_RESULT__';

/// How the harness should exercise the widget.
enum JsrToolMode { test, screenshot }

/// A parsed invocation of the `jsr_widget` CLI.
class JsrToolSpec {
  JsrToolSpec({
    required this.mode,
    required this.target,
    this.events = const [],
    this.expectState,
    this.expectConsole = const [],
    this.settleMs = 1000,
    this.bootTimeoutMs = 20000,
    this.width = 420,
    this.height = 860,
    this.scale = 1.0,
    this.theme = 'dark',
    this.out,
    this.freezeClock = false,
    this.fixtures = const {},
    this.seedStorage = const {},
    this.machine = false,
  });

  final JsrToolMode mode;

  /// Widget directory (manifest.json + widget.js) or a single .js file.
  final String target;

  /// Events to dispatch in order: bare action ids or full
  /// `{"id": ..., "payload": ...}` maps.
  final List<Object> events;

  /// Deep-subset the final `jsr.exportState(...)` must contain.
  final Map<String, dynamic>? expectState;

  /// Substrings the captured console output must contain.
  final List<String> expectConsole;

  /// How long each event may take to produce its re-render (and the boot
  /// wait on top of [bootTimeoutMs]).
  final int settleMs;
  final int bootTimeoutMs;

  /// Screenshot surface (logical pixels) and the device pixel ratio
  /// multiplier for the PNG.
  final int width;
  final int height;
  final double scale;
  final String theme;

  /// Output path: the PNG for screenshot mode, the JSON report when
  /// `--json --out <file>` is given.
  final String? out;
  final bool freezeClock;

  /// fetchJson fixtures: substring-of-URL → payload. A URL matching a key
  /// resolves with that payload instead of hitting the network.
  final Map<String, dynamic> fixtures;

  /// Initial `jsr.storage` contents.
  final Map<String, dynamic> seedStorage;

  /// Emit only the machine-readable report (for agents).
  final bool machine;

  Map<String, dynamic> toJson() => {
        'mode': mode.name,
        'target': target,
        'events': events,
        if (expectState != null) 'expectState': expectState,
        'expectConsole': expectConsole,
        'settleMs': settleMs,
        'bootTimeoutMs': bootTimeoutMs,
        'width': width,
        'height': height,
        'scale': scale,
        'theme': theme,
        'out': out,
        'freezeClock': freezeClock,
        'fixtures': fixtures,
        'seedStorage': seedStorage,
        'machine': machine,
      };

  factory JsrToolSpec.fromJson(Map<String, dynamic> json) => JsrToolSpec(
        mode: json['mode'] == 'screenshot'
            ? JsrToolMode.screenshot
            : JsrToolMode.test,
        target: json['target'] as String,
        events: ((json['events'] as List?) ?? const []).cast<Object>(),
        expectState: (json['expectState'] as Map?)?.cast<String, dynamic>(),
        expectConsole:
            ((json['expectConsole'] as List?) ?? const []).cast<String>(),
        settleMs: (json['settleMs'] as num?)?.toInt() ?? 1000,
        bootTimeoutMs: (json['bootTimeoutMs'] as num?)?.toInt() ?? 20000,
        width: (json['width'] as num?)?.toInt() ?? 420,
        height: (json['height'] as num?)?.toInt() ?? 860,
        scale: (json['scale'] as num?)?.toDouble() ?? 1.0,
        theme: (json['theme'] as String?) ?? 'dark',
        out: json['out'] as String?,
        freezeClock: json['freezeClock'] as bool? ?? false,
        fixtures:
            ((json['fixtures'] as Map?) ?? const {}).cast<String, dynamic>(),
        seedStorage: ((json['seedStorage'] as Map?) ?? const {})
            .cast<String, dynamic>(),
        machine: json['machine'] as bool? ?? false,
      );
}

/// Thrown when the CLI arguments cannot form a valid [JsrToolSpec].
class JsrToolUsageException implements Exception {
  JsrToolUsageException(this.message);

  final String message;

  @override
  String toString() => message;
}

const _usage =
    'usage: dart run bin/jsr_widget.dart <test|screenshot> <widget-dir|widget.js> '
    '[--event <id|json>]... [--expect-state <json>] [--expect-console <substr>]... '
    '[--settle-ms <ms>] [--width <px>] [--height <px>] [--scale <x>] '
    '[--theme dark|light] [--tap <id>] [--out <file>] [--freeze-clock] '
    '[--fixture <url-substr>=<json>]... [--storage <json>] [--json]';

/// Parses [args] (everything after the subcommand) into a [JsrToolSpec].
JsrToolSpec parseJsrToolArgs(List<String> args, {JsrToolMode? mode}) {
  JsrToolMode? resolvedMode = mode;
  final positional = <String>[];
  final events = <Object>[];
  Map<String, dynamic>? expectState;
  final expectConsole = <String>[];
  var settleMs = 1000;
  var bootTimeoutMs = 20000;
  var width = 420;
  var height = 860;
  var scale = 1.0;
  var theme = 'dark';
  String? out;
  var freezeClock = false;
  final fixtures = <String, dynamic>{};
  var seedStorage = const <String, dynamic>{};
  var machine = false;

  String next(int i, String flag) {
    if (i + 1 >= args.length) {
      throw JsrToolUsageException('$flag needs a value\n$_usage');
    }
    return args[i + 1];
  }

  Map<String, dynamic> parseJson(String flag, String raw) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map<String, dynamic>) return decoded;
      throw const FormatException('expected a JSON object');
    } on FormatException catch (e) {
      throw JsrToolUsageException('$flag is not valid JSON: $e\n$_usage');
    }
  }

  for (var i = 0; i < args.length; i++) {
    final arg = args[i];
    switch (arg) {
      case 'test':
      case 'screenshot':
        resolvedMode ??= arg == 'test' ? JsrToolMode.test : JsrToolMode.screenshot;
      case '--event':
      case '--tap':
        final raw = next(i++, arg);
        events.add(_parseEvent(raw));
      case '--expect-state':
        expectState = parseJson(arg, next(i++, arg));
      case '--expect-console':
        expectConsole.add(next(i++, arg));
      case '--settle-ms':
        settleMs = int.tryParse(next(i++, arg)) ?? 1000;
      case '--boot-timeout-ms':
        bootTimeoutMs = int.tryParse(next(i++, arg)) ?? 20000;
      case '--width':
        width = int.tryParse(next(i++, arg)) ?? 420;
      case '--height':
        height = int.tryParse(next(i++, arg)) ?? 860;
      case '--scale':
        scale = double.tryParse(next(i++, arg)) ?? 1.0;
      case '--theme':
        theme = next(i++, arg);
      case '--out':
      case '-o':
        out = next(i++, arg);
      case '--freeze-clock':
        freezeClock = true;
      case '--fixture':
        final raw = next(i++, arg);
        final eq = raw.indexOf('=');
        if (eq <= 0) {
          throw JsrToolUsageException(
            '--fixture expects <url-substr>=<json> (got "$raw")\n$_usage',
          );
        }
        fixtures[raw.substring(0, eq)] =
            jsonDecode(raw.substring(eq + 1)) as Object?;
      case '--storage':
        seedStorage = parseJson(arg, next(i++, arg));
      case '--json':
      case '--machine':
        machine = true;
      case '-h':
      case '--help':
        throw JsrToolUsageException(_usage);
      default:
        if (!arg.startsWith('-')) {
          positional.add(arg);
        } else {
          throw JsrToolUsageException('unknown option $arg\n$_usage');
        }
    }
  }

  if (resolvedMode == null) {
    throw JsrToolUsageException(_usage);
  }
  if (positional.isEmpty) {
    throw JsrToolUsageException('missing <widget-dir|widget.js>\n$_usage');
  }
  if (theme != 'dark' && theme != 'light') {
    throw JsrToolUsageException('--theme must be dark or light\n$_usage');
  }
  return JsrToolSpec(
    mode: resolvedMode,
    target: positional.first,
    events: events,
    expectState: expectState,
    expectConsole: expectConsole,
    settleMs: settleMs,
    bootTimeoutMs: bootTimeoutMs,
    width: width,
    height: height,
    scale: scale,
    theme: theme,
    out: out,
    freezeClock: freezeClock,
    fixtures: fixtures,
    seedStorage: seedStorage,
    machine: machine,
  );
}

/// Accepts a bare action id or a JSON object `{"id": ..., "payload": ...}`.
Object _parseEvent(String raw) {
  final trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    try {
      final decoded = jsonDecode(trimmed);
      if (decoded is Map<String, dynamic> && decoded['id'] != null) {
        return decoded;
      }
    } on FormatException {
      // fall through to the bare-id error below
    }
    throw JsrToolUsageException(
      '--event JSON must be an object with an "id" field (got "$raw")',
    );
  }
  return trimmed;
}

/// Resolves an [events] entry into `(actionId, payload)`.
(String, Map<String, dynamic>) eventParts(Object event) {
  if (event is String) return (event, const {});
  if (event is Map) {
    return (
      event['id'] as String? ?? '',
      (event['payload'] as Map?)?.cast<String, dynamic>() ?? const {},
    );
  }
  return ('', const {});
}

/// Deep-subset match: every key in [expected] must exist in [actual] with
/// a matching value (maps and lists compared recursively, scalars with ==).
bool jsonContains(Object? actual, Object? expected) {
  if (expected is Map) {
    if (actual is! Map) return false;
    for (final key in expected.keys) {
      if (!actual.containsKey(key)) return false;
      if (!jsonContains(actual[key], expected[key])) return false;
    }
    return true;
  }
  if (expected is List) {
    if (actual is! List || actual.length != expected.length) return false;
    for (var i = 0; i < expected.length; i++) {
      if (!jsonContains(actual[i], expected[i])) return false;
    }
    return true;
  }
  return actual == expected;
}

/// Reads the widget source for [target]: a directory (manifest.json for the
/// id + widget.js) or a single `.js` file.
/// Returns `(source, widgetId)`.
(String, String) loadWidgetSource(String target) {
  final type = FileSystemEntity.typeSync(target);
  if (type == FileSystemEntityType.notFound) {
    throw JsrToolUsageException('target not found: $target');
  }
  if (type == FileSystemEntityType.directory) {
    final js = File('$target/widget.js');
    if (!js.existsSync()) {
      throw JsrToolUsageException('$target has no widget.js');
    }
    var id = target.split(Platform.pathSeparator).where((s) => s.isNotEmpty).last;
    final manifest = File('$target/manifest.json');
    if (manifest.existsSync()) {
      try {
        final decoded = jsonDecode(manifest.readAsStringSync());
        if (decoded is Map && decoded['id'] is String) id = decoded['id'];
      } on FormatException {
        // Unreadable manifest: keep the folder-name id.
      }
    }
    return (js.readAsStringSync(), id);
  }
  if (!target.endsWith('.js')) {
    throw JsrToolUsageException('target must be a widget directory or .js file');
  }
  final base = target
      .split(Platform.pathSeparator)
      .where((s) => s.isNotEmpty)
      .last;
  return (File(target).readAsStringSync(), base.replaceAll('.js', ''));
}

/// The machine-readable result the harness prints after a run.
Map<String, dynamic> buildReport({
  required bool ok,
  required String widgetId,
  required String mode,
  required List<Map<String, dynamic>> logs,
  required Map<String, dynamic>? state,
  required int renderCount,
  required List<Map<String, dynamic>> failures,
  required int durationMs,
  String? screenshot,
}) =>
    {
      'ok': ok,
      'widget': widgetId,
      'mode': mode,
      'renderCount': renderCount,
      'console': logs,
      'state': state,
      if (screenshot != null) 'screenshot': screenshot,
      'failures': failures,
      'durationMs': durationMs,
    };

/// When `JSR_QUICKJS_LIB` is unset, points it at the newest
/// `libquickjs_bridge.so` already built in the pub cache — widget authors
/// should not need to build QuickJS to run the CLI.
Map<String, String> defaultQuickjsLibEnv() {
  if (Platform.environment['JSR_QUICKJS_LIB'] != null) return const {};
  final cacheRoot = Platform.environment['PUB_CACHE'] ??
      '${Platform.environment['HOME'] ?? ''}/.pub-cache';
  final hosted = Directory('$cacheRoot/hosted/pub.dev');
  if (!hosted.existsSync()) return const {};
  String? best;
  var bestVersion = Version.zero;
  for (final dir in hosted.listSync().whereType<Directory>()) {
    final name = dir.uri.pathSegments.where((s) => s.isNotEmpty).last;
    if (!name.startsWith('quickjs_runtime-')) continue;
    // tryParse degrades unparsable names to Version.zero, which never
    // beats the bestVersion seed below.
    final version = Version.tryParse(name.substring('quickjs_runtime-'.length));
    final candidate = '${dir.path}/native/quickjs/libquickjs_bridge.so';
    if (File(candidate).existsSync() && version > bestVersion) {
      best = candidate;
      bestVersion = version;
    }
  }
  if (best == null) return const {};
  return {'JSR_QUICKJS_LIB': best};
}

/// Trivial semver used to pick the newest cached QuickJS build.
class Version implements Comparable<Version> {
  const Version(this.major, this.minor, this.patch);

  static const zero = Version(0, 0, 0);

  factory Version.tryParse(String raw) {
    final parts = raw.split('.').map((s) => int.tryParse(s)).toList();
    if (parts.length != 3 || parts.any((p) => p == null)) {
      return Version.zero;
    }
    return Version(parts[0]!, parts[1]!, parts[2]!);
  }

  final int major, minor, patch;

  @override
  int compareTo(Version other) {
    if (major != other.major) return major.compareTo(other.major);
    if (minor != other.minor) return minor.compareTo(other.minor);
    return patch.compareTo(other.patch);
  }

  bool operator >(Version other) => compareTo(other) > 0;
}
