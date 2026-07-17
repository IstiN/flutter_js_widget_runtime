import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';

/// Default VM fetch implementation used when the host does not provide one.
Future<void> defaultVmFetchHandler(
  String id,
  String url,
  String method,
  Map<String, String> headers,
  void Function(String id, dynamic value) resolve,
) async {
  try {
    final client = HttpClient();
    final dartReq = await client.openUrl(method, Uri.parse(url));
    dartReq.headers.set('User-Agent', 'js-widget-runtime/1.0');
    dartReq.headers.set('Accept', 'application/json');
    headers.forEach((k, v) => dartReq.headers.set(k, v));
    final res = await dartReq.close().timeout(const Duration(seconds: 15));
    final body = await res.transform(const Utf8Decoder()).join();
    client.close();
    final result = jsonDecode(body);
    resolve(id, result);
  } catch (e) {
    resolve(id, {'__error': e.toString()});
  }
}

/// Default VM loadAsset implementation reading from [appDir].
Future<void> defaultVmLoadAssetHandler(
  String id,
  String assetPath,
  String? appDir,
  void Function(String id, dynamic value) resolve,
) async {
  try {
    final dir = appDir;
    if (dir == null || dir.isEmpty) {
      resolve(id, null);
      return;
    }
    final file = File(
      '$dir${Platform.pathSeparator}${assetPath.replaceAll('/', Platform.pathSeparator)}',
    );
    if (await file.exists()) {
      final content = await file.readAsString();
      resolve(id, content);
    } else {
      resolve(id, null);
    }
  } catch (e) {
    debugPrint('[JsWidgetEngine] loadAsset error: $e');
    resolve(id, null);
  }
}
