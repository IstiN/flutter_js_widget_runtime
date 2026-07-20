import 'dart:typed_data';

/// Resolves a font family name to raw font bytes.
///
/// Hosts implement this to wire their own font sources (assets, files,
/// downloads, project font collections) into the renderer.
typedef JsFontResolver = Future<Uint8List> Function(String family);
