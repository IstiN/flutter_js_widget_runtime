/// Flutter-web preview runner for jsr widgets (fa1.dev/widgets/preview/).
///
/// Web-only entry point (imports `package:web`) — build with:
///
/// ```bash
/// flutter build web -t lib/preview.dart --base-href /widgets/preview/
/// ```
///
/// Query parameters (read from `Uri.base`):
/// - `?widget=<id>` (required) — widget id, loaded from `<base>/<id>/`.
/// - `?theme=dark|light` — color theme, default `dark`.
/// - `?base=<url>` — override the widget source base URL
///   (default: the `fa_widgets` repo raw main branch).
library;

import 'dart:js_interop';

import 'package:flutter/material.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:web/web.dart' as web;

/// Default widget source: the fa_widgets gallery repo, raw main branch.
const String _defaultBaseUrl =
    'https://raw.githubusercontent.com/IstiN/fa_widgets/main/widgets';

/// Widget ids are directory names — reject anything that could escape the
/// base URL (path traversal, absolute URLs, query injection).
final RegExp _widgetIdPattern = RegExp(r'^[A-Za-z0-9_-]+$');

/// [WidgetFileReader] that fetches widget files over HTTP (web-only).
///
/// Paths are resolved as `<baseUrl>/<path>`; missing files (non-2xx or
/// network error) read as `null`, which the manifest loader treats as
/// "file does not exist".
class HttpWidgetFileReader implements WidgetFileReader {
  HttpWidgetFileReader(this.baseUrl);

  final String baseUrl;

  @override
  Future<String?> readString(String path) async {
    try {
      final response = await web.window.fetch('$baseUrl/$path'.toJS).toDart;
      if (!response.ok) return null;
      return (await response.text().toDart).toDart;
    } catch (_) {
      return null;
    }
  }

  @override
  Future<bool> exists(String path) async {
    try {
      final response = await web.window
          .fetch('$baseUrl/$path'.toJS, web.RequestInit(method: 'HEAD'))
          .toDart;
      return response.ok;
    } catch (_) {
      return false;
    }
  }
}

/// Dark theme injected as `jsr.theme` (mirrors the engine defaults).
const Map<String, dynamic> _darkJsTheme = {
  'isDark': true,
  'bg': '#0f172a',
  'surface': '#1e293b',
  'surfaceAlt': '#293548',
  'border': '#334155',
  'borderBright': '#475569',
  'accent': '#818cf8',
  'accent2': '#a78bfa',
  'onAccent': '#0f172a',
  'text': '#f1f5f9',
  'muted': '#64748b',
};

/// Light counterpart of [_darkJsTheme] for `?theme=light`.
const Map<String, dynamic> _lightJsTheme = {
  'isDark': false,
  'bg': '#f8fafc',
  'surface': '#ffffff',
  'surfaceAlt': '#f1f5f9',
  'border': '#e2e8f0',
  'borderBright': '#cbd5e1',
  'accent': '#6366f1',
  'accent2': '#8b5cf6',
  'onAccent': '#ffffff',
  'text': '#0f172a',
  'muted': '#64748b',
};

Color _hexColor(String hex) {
  final value = int.tryParse(hex.replaceFirst('#', ''), radix: 16) ?? 0;
  return Color(0xFF000000 | value);
}

void main() {
  runApp(PreviewApp(query: Uri.base.queryParameters));
}

/// Root app: picks the Flutter theme to match `?theme=` and hosts the
/// preview page.
class PreviewApp extends StatelessWidget {
  const PreviewApp({super.key, required this.query});

  final Map<String, String> query;

  @override
  Widget build(BuildContext context) {
    final dark = query['theme'] != 'light';
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'jsr widget preview',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF818CF8),
          brightness: dark ? Brightness.dark : Brightness.light,
        ),
      ),
      home: PreviewPage(query: query, dark: dark),
    );
  }
}

/// Loads the manifest + JS for `?widget=` and runs it full-bleed.
class PreviewPage extends StatefulWidget {
  const PreviewPage({super.key, required this.query, required this.dark});

  final Map<String, String> query;
  final bool dark;

  @override
  State<PreviewPage> createState() => _PreviewPageState();
}

class _PreviewPageState extends State<PreviewPage> {
  late final HttpWidgetFileReader _reader;
  WidgetManifest? _manifest;
  String? _error;

  @override
  void initState() {
    super.initState();
    final base = widget.query['base'];
    _reader = HttpWidgetFileReader(
      base != null && base.startsWith('http') ? base : _defaultBaseUrl,
    );
    _load();
  }

  Future<void> _load() async {
    final id = widget.query['widget'];
    if (id == null || !_widgetIdPattern.hasMatch(id)) {
      setState(() => _error = 'Missing or invalid ?widget=<id> parameter.');
      return;
    }
    try {
      final manifest = await WidgetManifest.fromStorage(id, reader: _reader);
      if (!mounted) return;
      if (manifest == null) {
        setState(() => _error = 'Widget "$id" not found.');
        return;
      }
      web.document.title = '${manifest.icon} ${manifest.name}';
      setState(() => _manifest = manifest);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Failed to load widget "$id": $e');
    }
  }

  JsRuntimeConfig _makeConfig(WidgetManifest manifest) => JsRuntimeConfig(
    widgetId: manifest.id,
    instanceId: 'preview',
    initialTheme: widget.dark ? _darkJsTheme : _lightJsTheme,
    onRender: (_) {},
    onSetTitle: (title) => web.document.title = title,
    onStorageUpdate: (_) {},
    // 3D: primitives/OBJ via flutter_cube work on web; GLB/flame_3d
    // scenes need flutter_gpu and stay empty (the dispatcher still
    // routes them, the host fails gracefully to the placeholder).
    js3dHost: createJs3dHost(),
    webViewHost: createIframeWebViewHost(),
    // Honor the manifest: widgets that did not opt into network access
    // get no fetch capability in the preview either.
    isPermissionAllowed: (capability) =>
        capability != 'fetch' || manifest.networkEnabled,
  );

  @override
  Widget build(BuildContext context) {
    final jsTheme = widget.dark ? _darkJsTheme : _lightJsTheme;
    return Scaffold(
      backgroundColor: _hexColor(jsTheme['bg']! as String),
      body: SafeArea(child: _buildBody()),
    );
  }

  Widget _buildBody() {
    final error = _error;
    if (error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            error,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: _hexColor(
                (widget.dark ? _darkJsTheme : _lightJsTheme)['muted']!
                    as String,
              ),
            ),
          ),
        ),
      );
    }
    final manifest = _manifest;
    if (manifest == null) {
      return const Center(child: CircularProgressIndicator());
    }
    return JsWidgetApp(
      manifest: manifest,
      reader: _reader,
      config: _makeConfig(manifest),
    );
  }
}
