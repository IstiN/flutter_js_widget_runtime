import 'dart:async';
import 'dart:convert';

import 'dart:js_interop';

import 'package:web/web.dart' as web;

/// Default web fetch implementation used when the host does not provide one.
Future<void> defaultWebFetchHandler(
  String id,
  String url,
  String method,
  Map<String, String> headers,
  void Function(String id, dynamic value) resolve,
) async {
  try {
    final headersMap = <String, String>{
      'Accept': 'application/json',
      ...headers,
    };
    final init = web.RequestInit(
      method: method,
      headers: headersMap.jsify() as JSObject,
    );
    final response = await web.window.fetch(url.toJS, init).toDart;
    final text = await response.text().toDart;
    final decoded = jsonDecode(text.toDart) as dynamic;
    resolve(id, decoded);
  } catch (e) {
    resolve(id, {'__error': e.toString()});
  }
}

/// Default web exec implementation — exec is unavailable on web.
Future<void> defaultWebExecHandler(
  String id,
  String cmd,
  void Function(String id, dynamic value) resolve,
) async {
  resolve(id, {'__error': 'exec is not available on web'});
}
