import 'dart:typed_data';

/// Resolves external asset identifiers (`external:<id>`) to raw bytes.
///
/// Hosts implement this to wire their own asset pipelines (file cache,
/// download manager, frame directories, etc.) into the renderer.
abstract class ExternalAssetResolver {
  const ExternalAssetResolver();

  /// Resolves [id] to bytes.
  ///
  /// Returns `null` if the asset cannot be found. The renderer will then
  /// fall back to placeholder/error UI.
  Future<Uint8List?> resolve(String id);
}
