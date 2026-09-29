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
    this.captureDir = 'jsr-captures',
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

  /// Where `jsr.capture()` PNGs are written (created on demand).
  final String captureDir;

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
        'captureDir': captureDir,
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
        captureDir: (json['captureDir'] as String?) ?? 'jsr-captures',
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
    '[--fixture <url-substr>=<json>]... [--storage <json>] [--capture-dir <dir>] [--json]';

/// Parses [args] (everything after the subcommand) into a [JsrToolSpec].
/// Mutable parse state shared by the flag handlers below.
class _SpecState {
  JsrToolMode? mode;
  final List<String> positional = [];
  final events = <Object>[];
  Map<String, dynamic>? expectState;
  final expectConsole = <String>[];
  int settleMs = 1000;
  int bootTimeoutMs = 20000;
  int width = 420;
  int height = 860;
  double scale = 1.0;
  String theme = 'dark';
  String? out;
  bool freezeClock = false;
  final fixtures = <String, dynamic>{};
  Map<String, dynamic> seedStorage = const {};
  String captureDir = 'jsr-captures';
  bool machine = false;
}

/// The value of a two-token flag (`--width 320`), failing with usage when
/// missing.
String _valueOf(List<String> args, int i, String flag) {
  if (i + 1 >= args.length) {
    throw JsrToolUsageException('$flag needs a value');
  }
  return args[i + 1];
}

/// Parsed-integer option with a fallback default.
int _intOption(List<String> args, int i, String flag, int fallback) =>
    int.tryParse(_valueOf(args, i, flag)) ?? fallback;

double _doubleOption(List<String> args, int i, String flag, double fallback) =>
    double.tryParse(_valueOf(args, i, flag)) ?? fallback;

Map<String, dynamic> _jsonObjectOption(String flag, String raw) {
  final Object? decoded;
  try {
    decoded = jsonDecode(raw);
  } on FormatException {
    throw JsrToolUsageException('$flag is not valid JSON: "$raw"');
  }
  if (decoded is Map<String, dynamic>) return decoded;
  throw JsrToolUsageException('$flag is not a JSON object: "$raw"');
}

Object? _jsonValueOption(String flag, String raw) {
  try {
    return jsonDecode(raw);
  } on FormatException catch (e) {
    throw JsrToolUsageException('$flag is not valid JSON: $e');
  }
}

void _addEvent(_SpecState state, String raw) {
  final trimmed = raw.trim();
  if (!trimmed.startsWith('{')) {
    state.events.add(trimmed);
    return;
  }
  Object? decoded;
  try {
    decoded = jsonDecode(trimmed);
  } on FormatException {
    decoded = null;
  }
  if (decoded is Map<String, dynamic> && decoded['id'] != null) {
    state.events.add(decoded);
    return;
  }
  throw JsrToolUsageException(
    '--event JSON must be an object with an "id" field (got "$raw")',
  );
}

void _addFixture(_SpecState state, String raw) {
  final eq = raw.indexOf('=');
  if (eq <= 0) {
    throw JsrToolUsageException(
      '--fixture expects <url-substr>=<json> (got "$raw")',
    );
  }
  state.fixtures[raw.substring(0, eq)] =
      _jsonValueOption('--fixture', raw.substring(eq + 1));
}

/// One flag handler: consumes the flag (and its value at `i + 1` when
/// [wantsValue]) and mutates [state]. Keeping each handler branch-free
/// keeps every function under the CRAP ratchet.
class _FlagHandler {
  const _FlagHandler(this.apply, {this.wantsValue = true});

  final void Function(_SpecState state, String value, List<String> args, int i)
      apply;
  final bool wantsValue;
}

final Map<String, _FlagHandler> _flagHandlers = {
  'test': _FlagHandler(
    (s, _, __, ___) => s.mode ??= JsrToolMode.test,
    wantsValue: false,
  ),
  'screenshot': _FlagHandler(
    (s, _, __, ___) => s.mode ??= JsrToolMode.screenshot,
    wantsValue: false,
  ),
  '--event': _FlagHandler((s, v, _, __) => _addEvent(s, v)),
  '--tap': _FlagHandler((s, v, _, __) => _addEvent(s, v)),
  '--expect-state':
      _FlagHandler((s, v, _, __) => s.expectState = _jsonObjectOption(
              '--expect-state', v)),
  '--expect-console':
      _FlagHandler((s, v, _, __) => s.expectConsole.add(v)),
  '--settle-ms': _FlagHandler(
    (s, v, a, i) => s.settleMs = _intOption(a, i, '--settle-ms', 1000),
  ),
  '--boot-timeout-ms': _FlagHandler(
    (s, v, a, i) =>
        s.bootTimeoutMs = _intOption(a, i, '--boot-timeout-ms', 20000),
  ),
  '--width': _FlagHandler(
    (s, v, a, i) => s.width = _intOption(a, i, '--width', 420),
  ),
  '--height': _FlagHandler(
    (s, v, a, i) => s.height = _intOption(a, i, '--height', 860),
  ),
  '--scale': _FlagHandler(
    (s, v, a, i) => s.scale = _doubleOption(a, i, '--scale', 1.0),
  ),
  '--theme': _FlagHandler((s, v, _, __) => s.theme = v),
  '--out': _FlagHandler((s, v, _, __) => s.out = v),
  '-o': _FlagHandler((s, v, _, __) => s.out = v),
  '--freeze-clock': _FlagHandler(
    (s, _, __, ___) => s.freezeClock = true,
    wantsValue: false,
  ),
  '--fixture': _FlagHandler((s, v, _, __) => _addFixture(s, v)),
  '--storage': _FlagHandler(
    (s, v, _, __) => s.seedStorage = _jsonObjectOption('--storage', v),
  ),
  '--capture-dir': _FlagHandler((s, v, _, __) => s.captureDir = v),
  '--json': _FlagHandler(
    (s, _, __, ___) => s.machine = true,
    wantsValue: false,
  ),
  '--machine': _FlagHandler(
    (s, _, __, ___) => s.machine = true,
    wantsValue: false,
  ),
  '-h': _FlagHandler(
    (s, _, __, ___) => throw JsrToolUsageException(_usage),
    wantsValue: false,
  ),
  '--help': _FlagHandler(
    (s, _, __, ___) => throw JsrToolUsageException(_usage),
    wantsValue: false,
  ),
};

/// Validates and freezes [state] into a [JsrToolSpec].
JsrToolSpec _buildSpec(_SpecState state) {
  if (state.mode == null) {
    throw JsrToolUsageException(_usage);
  }
  if (state.positional.isEmpty) {
    throw JsrToolUsageException('missing <widget-dir|widget.js>\n$_usage');
  }
  if (state.theme != 'dark' && state.theme != 'light') {
    throw JsrToolUsageException('--theme must be dark or light\n$_usage');
  }
  return JsrToolSpec(
    mode: state.mode!,
    target: state.positional.first,
    events: state.events,
    expectState: state.expectState,
    expectConsole: state.expectConsole,
    settleMs: state.settleMs,
    bootTimeoutMs: state.bootTimeoutMs,
    width: state.width,
    height: state.height,
    scale: state.scale,
    theme: state.theme,
    out: state.out,
    freezeClock: state.freezeClock,
    fixtures: state.fixtures,
    seedStorage: state.seedStorage,
    captureDir: state.captureDir,
    machine: state.machine,
  );
}

/// Parses [args] (everything after the subcommand) into a [JsrToolSpec].
JsrToolSpec parseJsrToolArgs(List<String> args, {JsrToolMode? mode}) {
  final state = _SpecState()..mode = mode;
  for (var i = 0; i < args.length; i++) {
    final arg = args[i];
    final handler = _flagHandlers[arg];
    if (handler == null) {
      if (arg.startsWith('-')) {
        throw JsrToolUsageException('unknown option $arg\n$_usage');
      }
      state.positional.add(arg);
      continue;
    }
    handler.apply(state, handler.wantsValue ? _valueOf(args, i, arg) : '', args, i);
    if (handler.wantsValue) i++;
  }
  return _buildSpec(state);
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
    return _loadDirWidget(target);
  }
  return _loadFileWidget(target);
}

(String, String) _loadDirWidget(String dir) {
  final js = File('$dir/widget.js');
  if (!js.existsSync()) {
    throw JsrToolUsageException('$dir has no widget.js');
  }
  return (js.readAsStringSync(), _dirWidgetId(dir));
}

/// The manifest id when readable, else the folder name.
String _dirWidgetId(String dir) {
  final fallback = dir.split(Platform.pathSeparator).where((s) => s.isNotEmpty).last;
  final manifest = File('$dir/manifest.json');
  if (!manifest.existsSync()) return fallback;
  try {
    final decoded = jsonDecode(manifest.readAsStringSync());
    if (decoded is Map && decoded['id'] is String) return decoded['id'];
  } on FormatException {
    // Unreadable manifest: keep the folder-name id.
  }
  return fallback;
}

(String, String) _loadFileWidget(String file) {
  if (!file.endsWith('.js')) {
    throw JsrToolUsageException(
      'target must be a widget directory or .js file',
    );
  }
  final base = file.split(Platform.pathSeparator).where((s) => s.isNotEmpty).last;
  return (File(file).readAsStringSync(), base.replaceAll('.js', ''));
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
  List<Map<String, dynamic>> captures = const [],
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
      if (captures.isNotEmpty) 'captures': captures,
    };

/// The newest built QuickJS bridge under [cacheRoot], or null.
String? _newestBuiltBridge(String cacheRoot) {
  final hosted = Directory('$cacheRoot/hosted/pub.dev');
  if (!hosted.existsSync()) return null;
  String? best;
  var bestVersion = Version.zero;
  for (final dir in hosted.listSync().whereType<Directory>()) {
    final name = dir.uri.pathSegments.where((s) => s.isNotEmpty).last;
    if (!name.startsWith('quickjs_runtime-')) continue;
    // tryParse degrades unparsable names to Version.zero, which never
    // beats the bestVersion seed below.
    final version = Version.tryParse(name.substring(_runtimePrefix.length));
    final candidate = '${dir.path}/$_bridgeRelPath';
    if (File(candidate).existsSync() && version > bestVersion) {
      best = candidate;
      bestVersion = version;
    }
  }
  return best;
}

/// When `JSR_QUICKJS_LIB` is unset, points it at the newest
/// `libquickjs_bridge.so` already built in the pub cache — widget authors
/// should not need to build QuickJS to run the CLI. [cacheRoot] and [env]
/// override the pub-cache location and process environment (tests).
Map<String, String> defaultQuickjsLibEnv({
  String? cacheRoot,
  Map<String, String>? env,
}) {
  final environment = env ?? Platform.environment;
  if (environment['JSR_QUICKJS_LIB'] != null) return const {};
  final root = cacheRoot ??
      environment['PUB_CACHE'] ??
      '${environment['HOME'] ?? ''}/.pub-cache';
  final best = _newestBuiltBridge(root);
  if (best == null) return const {};
  return {'JSR_QUICKJS_LIB': best};
}

const _runtimePrefix = 'quickjs_runtime-';
const _bridgeRelPath = 'native/quickjs/libquickjs_bridge.so';

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
