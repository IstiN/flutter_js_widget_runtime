import 'package:flutter/services.dart';

/// Reproducible upstream identity for the generated THREE runtime bundles.
abstract final class ThreeUpstreamBundle {
  static const String revision = '186';
  static const String tagObject = '48dd7be01263658aad497fd72e09d1e4c6213461';
  static const String commit = '9b4a2ac29c63ccb43fd51c5661f2f873ac2c39b8';
  static const String nativeAsset =
      'packages/js_widget_runtime/assets/three/three.native.js';
  static const String webAsset =
      'packages/js_widget_runtime/assets/three/three.web.js';

  /// Loads the platform bundle only when THREE was explicitly enabled.
  static Future<String> load({
    required bool web,
    String? overrideSource,
  }) async {
    if (overrideSource != null) return overrideSource;
    final packageKey = web ? webAsset : nativeAsset;
    try {
      return await rootBundle.loadString(packageKey);
    } catch (_) {
      // Tests/apps running from the package itself index its own assets
      // without the `packages/<name>/` prefix.
      final localKey = packageKey.replaceFirst(
        'packages/js_widget_runtime/',
        '',
      );
      return rootBundle.loadString(localKey);
    }
  }
}
