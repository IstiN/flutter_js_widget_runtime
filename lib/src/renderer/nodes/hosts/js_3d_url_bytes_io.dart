import 'dart:io';
import 'dart:typed_data';

/// Fetches raw bytes over HTTP(S) for URL-based 3D models (VM).
Future<Uint8List> js3dFetchBytes(String url) async {
  final client = HttpClient();
  try {
    final request = await client.getUrl(Uri.parse(url));
    final response = await request.close();
    if (response.statusCode != 200) {
      throw HttpException('HTTP ${response.statusCode}', uri: Uri.parse(url));
    }
    final builder = BytesBuilder(copy: false);
    await for (final chunk in response) {
      builder.add(chunk);
    }
    return builder.takeBytes();
  } finally {
    client.close();
  }
}

/// Reads model bytes from the local filesystem (VM).
///
/// Returns null when [path] is not an existing file — the caller falls
/// back to the asset bundle. A `file://` scheme is stripped first.
Future<Uint8List?> js3dReadLocalFileBytes(String path) async {
  var local = path;
  if (local.startsWith('file://')) {
    local = Uri.parse(local).toFilePath();
  }
  if (local.isEmpty) return null;
  final file = File(local);
  if (!file.existsSync()) return null;
  return file.readAsBytes();
}
