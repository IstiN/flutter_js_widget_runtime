import 'dart:js_interop';
import 'dart:typed_data';

import 'package:web/web.dart' as web;

/// Fetches raw bytes over HTTP(S) for URL-based 3D models (web).
///
/// CORS applies: the model server must allow cross-origin reads
/// (modelviewer.dev does).
Future<Uint8List> js3dFetchBytes(String url) async {
  final response = await web.window.fetch(url.toJS).toDart;
  if (!response.ok) {
    throw Exception('HTTP ${response.status} fetching $url');
  }
  final buffer = (await response.arrayBuffer().toDart).toDart;
  return buffer.asUint8List();
}

/// Local filesystem reads are not available on the web — always null so
/// the caller falls back to the asset bundle.
Future<Uint8List?> js3dReadLocalFileBytes(String path) async => null;
