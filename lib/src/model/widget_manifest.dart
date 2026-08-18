import 'dart:convert';

import 'package:js_widget_runtime/src/loader/widget_file_reader.dart';

/// Describes a custom JS widget stored under a base path.
///
/// On VM the base path is a directory path; on web it is a virtual prefix
/// (e.g. `widgets/<id>`) managed by [FileStorageAdapter]. All internal paths
/// use forward slashes.
class WidgetManifest {
  const WidgetManifest({
    required this.id,
    required this.name,
    required this.description,
    required this.version,
    required this.icon,
    required this.allowedCommands,
    required this.networkEnabled,
    required this.widgetPath,
    required this.isSingleFile,
    this.files,
    this.cli,
  });

  /// Unique identifier (directory name or file stem).
  final String id;

  /// Human-readable name shown in the panel catalog.
  final String name;

  final String description;
  final String version;

  /// Emoji or short label used as the icon.
  final String icon;

  /// CLI commands this widget is allowed to call via `window.jsr.cli()`.
  /// Empty list means no CLI access. Use ["*"] to allow all (dev only).
  final List<String> allowedCommands;

  /// Whether the widget JS may make network requests (fetch/XHR).
  /// Currently informational — enforced by Content Security Policy.
  final bool networkEnabled;

  /// Base path to the widget directory (or the .js file if single-file).
  /// Uses forward slashes on both VM and web.
  final String widgetPath;

  /// True when the widget is a single .js file without a directory.
  final bool isSingleFile;

  /// Explicit ordered list of JS files to concatenate (relative to widgetPath).
  /// When null or empty, falls back to reading widget.js.
  final List<String>? files;

  /// Optional CLI help for agents: events, examples, read-state hints.
  final Map<String, dynamic>? cli;

  /// Virtual path to the main widget.js entry point.
  String get mainJsPath => isSingleFile ? widgetPath : '$widgetPath/widget.js';

  /// Parent directory of the entry point.
  String get appDir {
    if (isSingleFile) {
      final idx = widgetPath.lastIndexOf('/');
      if (idx <= 0) return widgetPath;
      return widgetPath.substring(0, idx);
    }
    return widgetPath;
  }

  /// Reads and returns the JS source code.
  ///
  /// If [files] is set, reads each file in order and concatenates them.
  /// Otherwise falls back to reading widget.js.
  /// After assembling, runs the [_preprocessIncludes] pass which inlines
  /// `jsr.include('path')` calls and ES-module-style relative imports
  /// (`import './helpers.js'`, `import { x } from './helpers.js'`) with the
  /// referenced file contents — familiar to React/Node developers, no
  /// manifest `files` list needed. Each imported file is inlined once.
  Future<String?> readJs({required WidgetFileReader reader}) async {
    final base = widgetPath;
    late final String js;

    if (files != null && files!.isNotEmpty) {
      final parts = <String>[];
      for (final filename in files!) {
        final path = '$base/$filename';
        final content = await reader.readString(path);
        if (content != null) {
          parts.add(content);
        } else {
          parts.add('/* jsr.include: file not found: $filename */');
        }
      }
      js = parts.join('\n');
    } else {
      final content = await reader.readString(mainJsPath);
      if (content == null) return null;
      js = content;
    }

    return _preprocessIncludes(js, appDir, 0, reader, <String>{});
  }

  /// Recursively inlines `jsr.include('path')` calls and relative `import`
  /// statements (up to [_maxIncludeDepth]).
  static const int _maxIncludeDepth = 5;
  static final RegExp _includeRegex = RegExp(
    r'''jsr\.include\(\s*['"]([^'"]+)['"]\s*\)''',
  );

  /// Statement-level relative import: `import './x.js'`,
  /// `import { a, b } from './x.js'`, `import name from './x.js'`.
  /// Bindings are not rewired — inlining shares one scope, so imported
  /// symbols are simply declared by the inlined file. Only relative paths
  /// (starting with `.`) are resolved; anything else is left as-is.
  static final RegExp _importRegex = RegExp(
    r'''^[ \t]*import\s+(?:[\w${},* ]+\s+from\s+)?['"](\.[^'"]+)['"]\s*;?[ \t]*$''',
    multiLine: true,
  );

  /// `export` keywords are stripped from inlined files: after concatenation
  /// everything lives in one scope, so exports are meaningless and would be
  /// a syntax error in the QuickJS/WebWorker eval path.
  static final RegExp _exportRegex = RegExp(
    r'^[ \t]*export\s+(?=(?:async\s+)?(?:function|class|const|let|var|default)\b)',
    multiLine: true,
  );

  static Future<String> _preprocessIncludes(
    String source,
    String baseDir,
    int depth,
    WidgetFileReader reader,
    Set<String> visited,
  ) async {
    if (depth >= _maxIncludeDepth) return source;
    if (!_includeRegex.hasMatch(source) && !_importRegex.hasMatch(source)) {
      return source;
    }

    Future<String> load(String relPath, bool once) async {
      final absPath = _resolvePath(baseDir, relPath);
      if (once && !visited.add(absPath)) return '';
      final content = await reader.readString(absPath);
      if (content == null) return '/* import: file not found: $relPath */';
      final stripped = content.replaceAll(_exportRegex, '');
      return _preprocessIncludes(
        stripped,
        _parentOf(absPath),
        depth + 1,
        reader,
        visited,
      );
    }

    // Imports first: they are statement-level, so each match is replaced by
    // the (once-only) file content. Load in source order (dedup claims go to
    // the earliest import), then splice from the end so positions stay valid.
    var out = source;
    final imports = _importRegex.allMatches(source).toList();
    final replacements = <String>[
      for (final match in imports) await load(match.group(1)!, true),
    ];
    for (var i = imports.length - 1; i >= 0; i--) {
      out = out.replaceRange(imports[i].start, imports[i].end, replacements[i]);
    }

    final buffer = StringBuffer();
    var last = 0;
    var foundInclude = false;
    for (final match in _includeRegex.allMatches(out)) {
      foundInclude = true;
      buffer.write(out.substring(last, match.start));
      final relPath = match.group(1)!;
      final absPath = _resolvePath(baseDir, relPath);
      final content = await reader.readString(absPath);
      if (content != null) {
        final stripped = content.replaceAll(_exportRegex, '');
        buffer.write(
          await _preprocessIncludes(
            stripped,
            _parentOf(absPath),
            depth + 1,
            reader,
            visited,
          ),
        );
      } else {
        buffer.write('/* jsr.include: file not found: $relPath */');
      }
      last = match.end;
    }
    if (!foundInclude) return out;
    buffer.write(out.substring(last));
    return buffer.toString();
  }

  /// Resolves [relPath] (which may contain `./` and `../`) against
  /// [baseDir], using forward slashes.
  static String _resolvePath(String baseDir, String relPath) {
    final segments = '$baseDir/$relPath'.split('/');
    final out = <String>[];
    for (final segment in segments) {
      if (segment == '.' || segment.isEmpty) continue;
      if (segment == '..') {
        if (out.isNotEmpty) out.removeLast();
        continue;
      }
      out.add(segment);
    }
    return out.join('/');
  }

  static String _parentOf(String path) {
    final idx = path.lastIndexOf('/');
    if (idx <= 0) return path;
    return path.substring(0, idx);
  }

  static String _normalizePath(String path) => path.replaceAll('\\', '/');

  static String _lastSegment(String path) {
    final normalized = _normalizePath(path);
    final parts = normalized.split('/');
    return parts.isEmpty ? normalized : parts.last;
  }

  /// Creates a manifest from a storage base path (directory).
  static Future<WidgetManifest?> fromStorage(
    String basePath, {
    required WidgetFileReader reader,
  }) async {
    final normalized = _normalizePath(basePath);
    final jsPath = '$normalized/widget.js';
    if (!await reader.exists(jsPath)) return null;

    final id = _lastSegment(normalized);
    final manifestPath = '$normalized/manifest.json';
    final manifestRaw = await reader.readString(manifestPath);
    if (manifestRaw != null) {
      try {
        final raw = jsonDecode(manifestRaw) as Map<String, dynamic>;
        final filesList = raw['files'] as List?;
        final cliRaw = raw['cli'];
        return WidgetManifest(
          id: (raw['id'] as String? ?? id).trim(),
          name: (raw['name'] as String? ?? id),
          description: raw['description'] as String? ?? '',
          version: raw['version'] as String? ?? defaultWidgetVersion,
          icon: raw['icon'] as String? ?? '🔧',
          allowedCommands: List<String>.from(
            raw['allowedCommands'] as List? ?? [],
          ),
          networkEnabled: raw['network'] as bool? ?? true,
          widgetPath: normalized,
          isSingleFile: false,
          files: filesList != null ? List<String>.from(filesList) : null,
          cli:
              cliRaw is Map
                  ? Map<String, dynamic>.from(cliRaw)
                  : null,
        );
      } catch (_) {}
    }

    // No manifest — derive defaults from directory name.
    return WidgetManifest(
      id: id,
      name: _titleCase(id),
      description: '',
      version: defaultWidgetVersion,
      icon: '🔧',
      allowedCommands: const [],
      networkEnabled: true,
      widgetPath: normalized,
      isSingleFile: false,
    );
  }

  /// Creates a manifest from a single .js file path.
  static WidgetManifest fromJsFilePath(String filePath) {
    final normalized = _normalizePath(filePath);
    final stem = _lastSegment(normalized).replaceAll('.js', '');
    return WidgetManifest(
      id: stem,
      name: _titleCase(stem),
      description: '',
      version: defaultWidgetVersion,
      icon: '🔧',
      allowedCommands: const [],
      networkEnabled: true,
      widgetPath: normalized,
      isSingleFile: true,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
    'version': version,
    'icon': icon,
    'allowedCommands': allowedCommands,
    'network': networkEnabled,
    'widgetPath': widgetPath,
    'isSingleFile': isSingleFile,
    if (files != null) 'files': files,
    if (cli != null) 'cli': cli,
  };

  static String _titleCase(String s) =>
      s.replaceAll(RegExp(r'[-_]'), ' ').split(' ').map((w) {
        if (w.isEmpty) return w;
        return w[0].toUpperCase() + w.substring(1);
      }).join(' ');
}

/// Version assigned to manifests that do not declare one.
const defaultWidgetVersion = '1.0.0';
