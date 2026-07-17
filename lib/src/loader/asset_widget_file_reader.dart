import 'package:flutter/services.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';

/// [WidgetFileReader] that reads widget files from Flutter assets.
class AssetWidgetFileReader implements WidgetFileReader {
  const AssetWidgetFileReader(this.basePath);

  final String basePath;

  String _resolve(String path) {
    final normalized = path.replaceAll('//', '/');
    if (normalized.startsWith(basePath)) return normalized;
    return '$basePath/$normalized'.replaceAll('//', '/');
  }

  @override
  Future<String?> readString(String path) async {
    final asset = _resolve(path);
    try {
      return await rootBundle.loadString(asset);
    } on FlutterError {
      return null;
    }
  }

  @override
  Future<bool> exists(String path) async {
    final asset = _resolve(path);
    try {
      await rootBundle.loadString(asset);
      return true;
    } on FlutterError {
      return false;
    }
  }
}
