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
/// - `?manifest=<url>&js=<url>` — fetch the manifest and widget.js from
///   explicit URLs (fa1.dev passes these after the fa_widgets submodule
///   migration: vendored widgets resolve to raw
///   flutter_js_widget_runtime at the pinned sha, exactly the code in the
///   install zip). Extra files of multi-file widgets resolve relative to
///   the `js` URL's directory. When omitted, the `<base>/<id>/`
///   convention applies.
library;

import 'dart:js_interop';

import 'package:flutter/material.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'web_asr_handler.dart';
import 'package:web/web.dart' as web;

/// Default widget source: the fa_widgets gallery repo, raw main branch.
const String _defaultBaseUrl =
    'https://raw.githubusercontent.com/IstiN/fa_widgets/main/widgets';

/// Canonical sources of the vendored (CORE) widgets. After the fa_widgets
/// submodule migration the widget files no longer exist in the gallery
/// repo tree (raw.githubusercontent does not follow submodules), so a
/// direct `?widget=<id>` link for a CORE widget 404s at the default base
/// and the runner falls back to this one.
const String _canonicalBaseUrl =
    'https://raw.githubusercontent.com/IstiN/flutter_js_widget_runtime/'
    'main/example/widgets';

/// Widgets mirrored from external repos as SUBMODULES under
/// example/widgets/: raw.githubusercontent does not follow gitlinks, so
/// a bare link for one of these ids resolves from the SOURCE repo at the
/// pinned commit. Keep each pin in lockstep with the submodule pin.
/// NOTE: fa_craft uses a ROOT layout (manifest.json and widget.js at the
/// repo root, the code under game/ — see its issue #6 rework), so the
/// reader strips the `<id>/` segment the loader always prepends.
const Map<String, String> _submoduleWidgetBases = {
  'fa-craft': 'https://raw.githubusercontent.com/IstiN/fa_craft/'
      'b1419c3214a421098e5973fa29b171f8204cc0b3',
};

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

/// Reader for ROOT-layout source repos (e.g. fa_craft keeps
/// manifest.json / widget.js / game/ at the repo root): the loader always
/// addresses widget files as `<id>/...`, so strip that prefix before
/// delegating to the underlying HTTP reader.
class _RootLayoutReader implements WidgetFileReader {
  _RootLayoutReader(this._inner, this._widgetId);

  final HttpWidgetFileReader _inner;
  final String _widgetId;

  String _strip(String path) => path.startsWith('$_widgetId/')
      ? path.substring(_widgetId.length + 1)
      : path;

  @override
  Future<String?> readString(String path) => _inner.readString(_strip(path));

  @override
  Future<bool> exists(String path) => _inner.exists(_strip(path));
}

/// [WidgetFileReader] that serves the manifest and widget.js from explicit
/// URLs (`?manifest=`/`?js=` query parameters). Any other path of the
/// widget (multi-file imports, assets) resolves relative to the `js` URL's
/// directory, mirroring how the file would sit next to widget.js in the
/// source repo.
class _UrlMappedReader implements WidgetFileReader {
  _UrlMappedReader({
    required this.widgetId,
    required this.manifestUrl,
    required this.jsUrl,
  });

  final String widgetId;
  final String manifestUrl;
  final String jsUrl;

  String get _jsDir => jsUrl.substring(0, jsUrl.lastIndexOf('/'));

  String? _map(String path) {
    final norm = path.replaceAll('\\', '/').replaceFirst(RegExp('^/+'), '');
    if (norm == '$widgetId/manifest.json') return manifestUrl;
    if (norm == '$widgetId/widget.js') return jsUrl;
    if (norm.startsWith('$widgetId/')) {
      return '$_jsDir/${norm.substring(widgetId.length + 1)}';
    }
    return null;
  }

  @override
  Future<String?> readString(String path) async {
    final url = _map(path);
    if (url == null) return null;
    try {
      final response = await web.window.fetch(url.toJS).toDart;
      if (!response.ok) return null;
      return (await response.text().toDart).toDart;
    } catch (_) {
      return null;
    }
  }

  @override
  Future<bool> exists(String path) async => await readString(path) != null;
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
  late WidgetFileReader _reader;
  WidgetManifest? _manifest;
  String? _error;

  @override
  void initState() {
    super.initState();
    final js = widget.query['js'];
    if (js != null && js.startsWith('http')) {
      // Explicit source URLs (vendored widgets on fa1.dev). The manifest
      // URL is optional — without it the loader derives defaults.
      final manifest = widget.query['manifest'];
      _reader = _UrlMappedReader(
        widgetId: widget.query['widget'] ?? '',
        manifestUrl: manifest != null && manifest.startsWith('http')
            ? manifest
            : '${js.substring(0, js.lastIndexOf('/'))}/manifest.json',
        jsUrl: js,
      );
    } else {
      final base = widget.query['base'];
      _reader = HttpWidgetFileReader(
        base != null && base.startsWith('http') ? base : _defaultBaseUrl,
      );
    }
    _load();
  }

  /// True when the caller pinned the source explicitly (?base/?js) — in
  /// that case a miss must NOT fall back to the canonical repo.
  bool get _explicitSource =>
      (widget.query['js'] ?? '').startsWith('http') ||
      (widget.query['base'] ?? '').startsWith('http');

  Future<void> _load() async {
    final id = widget.query['widget'];
    if (id == null || !_widgetIdPattern.hasMatch(id)) {
      setState(() => _error = 'Missing or invalid ?widget=<id> parameter.');
      return;
    }
    try {
      // Submodule-mirrored widgets (fa-craft) are served straight from
      // their pinned source repo — probing the two canonical bases first
      // only produced two guaranteed 404s in the console on every open.
      var manifest = (!_explicitSource &&
              _submoduleWidgetBases.containsKey(id))
          ? null
          : await WidgetManifest.fromStorage(id, reader: _reader);
      if (!mounted) return;
      if (manifest == null && !_explicitSource &&
          !_submoduleWidgetBases.containsKey(id)) {
        // CORE widgets live only in the runtime repo after the submodule
        // migration — retry against the canonical sources.
        _reader = HttpWidgetFileReader(_canonicalBaseUrl);
        manifest = await WidgetManifest.fromStorage(id, reader: _reader);
        if (!mounted) return;
      }
      if (manifest == null && !_explicitSource) {
        // Mirrored-as-submodule widgets (e.g. fa-craft) do not exist in
        // this repo's tree either (raw does not follow gitlinks) — fall
        // back to the source repo at the submodule's pinned commit.
        final submoduleBase = _submoduleWidgetBases[id];
        if (submoduleBase != null) {
          // Root-layout repo: manifest.json/widget.js live at the source
          // repo root, so strip the `<id>/` segment (see _RootLayoutReader).
          _reader = _RootLayoutReader(
            HttpWidgetFileReader(submoduleBase),
            id,
          );
          manifest = await WidgetManifest.fromStorage(id, reader: _reader);
          if (!mounted) return;
        }
      }
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
    // Media: HTML <video>/<audio> elements (web build of the preview).
    mediaHost: createWebMediaHost(),
    // jsr.fa platform shims: make bridge-based widgets (voice-notes)
    // functional in the web preview where the browser offers the same
    // capability (getUserMedia + MediaRecorder for the mic, main thread).
    hostBootstrapJs: _kWebPlatformShims,
    onHostCall: _asrHandler.call,
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

/// Web shims for `jsr.fa.*` platform bridges, injected before the widget
/// runs. Thin wrappers over the generic `jsr.hostCall` channel — the real
/// work happens on the main thread in [WebAsrHandler] (widget JS lives in
/// a Worker, which has no microphone access). Bridges without a browser
/// equivalent stay undefined, so guarded widgets keep rendering their
/// "Runs in the Fa app" stubs.
final WebAsrHandler _asrHandler = WebAsrHandler();

const String _kWebPlatformShims = r'''
jsr.fa = jsr.fa || {};
jsr.fa.asr = {
  record: function(opts) { return jsr.hostCall('asr.record', opts || {}); },
  stop: function() { jsr.hostCall('asr.stop', {}); },
  transcribe: function(opts) { return jsr.hostCall('asr.transcribe', opts || {}); }
};
''';
