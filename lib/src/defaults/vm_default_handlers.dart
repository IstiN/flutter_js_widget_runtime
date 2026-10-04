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
  void Function(String id, dynamic value) resolve, {
  HttpClient? client,
}) async {
  final httpClient = client ?? HttpClient();
  try {
    final dartReq = await httpClient.openUrl(method, Uri.parse(url));
    dartReq.headers.set('User-Agent', 'js-widget-runtime/1.0');
    dartReq.headers.set('Accept', 'application/json');
    headers.forEach((k, v) => dartReq.headers.set(k, v));
    final res = await dartReq.close().timeout(const Duration(seconds: 15));
    final body = await res.transform(const Utf8Decoder()).join();
    final result = jsonDecode(body);
    resolve(id, result);
  } catch (e) {
    resolve(id, {'__error': e.toString()});
  } finally {
    if (client == null) httpClient.close();
  }
}

/// Process launcher used by [defaultVmOpenUrlHandler]; injectable in tests.
typedef VmProcessRunner =
    Future<ProcessResult> Function(String executable, List<String> args);

/// Default VM openUrl implementation: launches the URL in the system
/// browser through the platform opener. The URL is passed as a single argv
/// entry (no shell string interpolation). [runProcess] and
/// [operatingSystem] exist for tests.
Future<void> defaultVmOpenUrlHandler(
  String id,
  String url,
  void Function(String id, dynamic value) resolve, {
  VmProcessRunner? runProcess,
  String? operatingSystem,
}) async {
  try {
    final uri = Uri.tryParse(url);
    if (uri == null || !uri.hasScheme) {
      resolve(id, {'__error': 'openUrl: invalid url $url'});
      return;
    }
    final os = operatingSystem ?? Platform.operatingSystem;
    final String exe;
    final List<String> args;
    if (os == 'macos') {
      exe = 'open';
      args = [url];
    } else if (os == 'windows') {
      exe = 'cmd';
      args = ['/c', 'start', '', url];
    } else {
      exe = 'xdg-open';
      args = [url];
    }
    final run = runProcess ?? Process.run;
    final result = await run(exe, args);
    if (result.exitCode == 0) {
      resolve(id, true);
    } else {
      resolve(id, {
        '__error': 'openUrl: opener exited ${result.exitCode}: '
            '${result.stderr}',
      });
    }
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
