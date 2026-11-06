import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart' show rootBundle;

import 'package:js_widget_runtime/js_widget_runtime.dart';

/// Host asset lane for prepared three.js widgets whose big assets ship as
/// separate widget files instead of base64 constants baked into widget.js
/// (see `tool/three_example/prepare.mjs --inline-max-bytes`).
///
/// Prepare pins every externalized asset in `<widgetDir>/assets.json`:
/// `{schema, id, inlineMaxBytes, assets: [{url, file, mime, width, height,
/// bytes, sha256, aliases}]}`. The runtime resolves a module fetch against
/// the canonical asset URL (`tool/three/src/runtime.js` strips `./` and `?#`
/// before the host request and follows `registerAssetRedirect` aliases), so
/// this loader only ever sees pinned names. Asset keys use the same
/// `widgets/<widgetId>/<file>` bundle layout as `AssetWidgetFileReader`,
/// read as bytes (`rootBundle.load`) because model/texture payloads are
/// binary — `readString` would corrupt them.
class WidgetBundleThreeAssets {
  WidgetBundleThreeAssets._(this.widgetId);

  static final Map<String, WidgetBundleThreeAssets> _cache = {};

  final String widgetId;
  final Map<String, _ExternalAssetEntry> _entries = {};
  Future<void>? _entriesFuture;
  final Map<String, Future<JsThreeAsset>> _pending = {};

  /// Per-widget singleton: the assets.json sidecar is parsed once per run.
  static WidgetBundleThreeAssets forWidget(String widgetId) =>
      _cache.putIfAbsent(widgetId, () => WidgetBundleThreeAssets._(widgetId));

  Future<void> _loadEntries() {
    // GLTFLoader fans out concurrent requests (GLB + textures). Share ONE
    // sidecar read so a request never observes the not-yet-populated map.
    return _entriesFuture ??= () async {
      late String raw;
      try {
        raw = await rootBundle.loadString('widgets/$widgetId/assets.json');
      } on FlutterError {
        // Widget has no externalized assets; every host request is a miss.
        return;
      }
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      final assets = decoded['assets'] as List? ?? const [];
      for (final entry in assets.cast<Map<String, dynamic>>()) {
        _entries[entry['url'] as String] = _ExternalAssetEntry(
          file: entry['file'] as String,
          mime: entry['mime'] as String? ?? 'application/octet-stream',
          width: (entry['width'] as num? ?? 0).toInt(),
          height: (entry['height'] as num? ?? 0).toInt(),
        );
      }
    }();
  }

  /// [JsThreeAssetLoader] for `createFlutterGpuThreeHost(assetLoader: ...)`.
  Future<JsThreeAsset> load(String engineId, String url) {
    // Coalesce concurrent requests for the same URL (GLTF texture fan-out).
    return _pending.putIfAbsent(url, () => _load(url));
  }

  Future<JsThreeAsset> _load(String url) async {
    try {
      await _loadEntries();
      final entry = _entries[url];
      if (entry == null) {
        throw StateError(
          'three.assetFailure: $url is not pinned in '
          'widgets/$widgetId/assets.json',
        );
      }
      final data = await rootBundle.load('widgets/$widgetId/${entry.file}');
      return JsThreeAsset(
        data: data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes),
        mimeType: entry.mime,
        width: entry.width,
        height: entry.height,
      );
    } finally {
      _pending.remove(url);
    }
  }
}

class _ExternalAssetEntry {
  const _ExternalAssetEntry({
    required this.file,
    required this.mime,
    required this.width,
    required this.height,
  });

  final String file;
  final String mime;
  final int width;
  final int height;
}
