import 'dart:convert';
import 'dart:io';

import 'package:js_widget_runtime/js_widget_runtime.dart';

/// Serves the externalized assets pinned in
/// `example/widgets/<widgetId>/assets.json` (prepare --inline-max-bytes lane).
/// Tests read the files directly from the widget directories; the app resolves
/// the same pins through `WidgetBundleThreeAssets` + rootBundle.
Future<JsThreeAsset> widgetAssetLoader(String widgetId, String url) async {
  final manifestFile = File('example/widgets/$widgetId/assets.json');
  if (!manifestFile.existsSync()) {
    throw StateError('three.assetFailure: no assets.json for $widgetId');
  }
  final manifest =
      jsonDecode(await manifestFile.readAsString()) as Map<String, dynamic>;
  for (final entry in (manifest['assets'] as List).cast<Map>()) {
    if (entry['url'] == url) {
      final bytes = await File(
        'example/widgets/$widgetId/${entry['file']}',
      ).readAsBytes();
      return JsThreeAsset(
        data: bytes,
        mimeType: entry['mime'] as String? ?? 'application/octet-stream',
        width: (entry['width'] as num?)?.toInt() ?? 0,
        height: (entry['height'] as num?)?.toInt() ?? 0,
      );
    }
  }
  throw StateError('three.assetFailure: $url not pinned for $widgetId');
}
