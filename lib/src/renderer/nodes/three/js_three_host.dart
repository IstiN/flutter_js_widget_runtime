import 'dart:typed_data';

import 'package:flutter/widgets.dart';

/// Bytes returned by a host-approved THREE asset loader.
///
/// Assets are data only: loaders must never evaluate their contents as JS.
@immutable
class JsThreeAsset {
  const JsThreeAsset({
    required this.data,
    required this.mimeType,
    this.width = 0,
    this.height = 0,
  });

  final Uint8List data;
  final String mimeType;
  final int width;
  final int height;
}

typedef JsThreeAssetLoader =
    Future<JsThreeAsset> Function(String engineId, String url);

/// Owned raw RGBA pixels produced by the bounded native Canvas2D capability.
/// A null [data] is a stale/disposed reply and must not update a texture.
final class JsThreeCanvas2DResult {
  const JsThreeCanvas2DResult({
    required this.engineId,
    required this.surfaceId,
    required this.canvasId,
    required this.generation,
    required this.requestId,
    required this.width,
    required this.height,
    required this.data,
    this.stale = false,
  });

  final String engineId;
  final String surfaceId;
  final String canvasId;
  final int generation;
  final int requestId;
  final int width;
  final int height;
  final Uint8List? data;
  final bool stale;
}

/// A native or Web surface referenced by one upstream THREE renderer.
///
/// Resource isolation is always the tuple `(engineId, surfaceId, resourceId)`.
abstract class JsThreeSurface extends ChangeNotifier {
  JsThreeSurface({required this.engineId, required this.surfaceId});

  final String engineId;
  final String surfaceId;

  Size get logicalSize;
  double get devicePixelRatio;
  bool get isDisposed;

  /// Resizes the backing surface. Zero-sized layouts skip GPU allocation.
  void resize(Size size, double devicePixelRatio);

  /// Captures the currently presented frame as PNG bytes, if available.
  Future<Uint8List?> capture();

  /// Opt-in counters only; never include asset payloads or credentials.
  Map<String, num> get diagnostics;

  @mustCallSuper
  @override
  void dispose() {
    super.dispose();
  }
}

/// Owns THREE surfaces independently of the existing `Js3dHost` hierarchy.
abstract class JsThreeHost {
  /// Attaches the JSON `three` node to an existing or new surface.
  JsThreeSurface attach(
    String engineId,
    String surfaceId,
    Map<String, dynamic> config,
  );

  JsThreeSurface? findSurface(String engineId, String surfaceId);

  /// Detaches the visual node. Bridge-owned state may survive a temporary
  /// unmount; renderer/surface disposal and [disposeEngine] release it fully.
  void release(String engineId, String surfaceId);

  /// Accepts one JSR3D-T1 envelope from a bridge-bound engine session.
  ///
  /// Implementations must verify that the untrusted envelope engine id
  /// matches [boundEngineId] and copy call-scoped native byte views before
  /// retaining them.
  void submit(String boundEngineId, Uint8List envelope);

  /// Host-approved asset bytes for TextureLoader/FileLoader adapters.
  Future<JsThreeAsset> loadAsset(String engineId, String url);

  /// Rasterizes a bounded command list with the host's native Canvas2D.
  /// Implementations must bind the request to [boundEngineId], validate all
  /// identities/quotas, and return owned bytes or a stale reply after disposal.
  Future<JsThreeCanvas2DResult> rasterizeCanvas2D(
    String boundEngineId,
    Map<String, dynamic> request,
  ) => Future.error(
    const JsThreeUnsupportedException(
      'canvas2d',
      'this THREE host does not provide Flutter Canvas',
    ),
  );

  /// Builds the surface presentation. The node owns input and layout.
  Widget build(
    BuildContext context,
    JsThreeSurface surface,
    Map<String, dynamic> config,
  );

  /// Releases every surface belonging to one engine generation.
  void disposeEngine(String engineId);
}

/// Named capability failure shown instead of a blank canvas.
class JsThreeUnsupportedException implements Exception {
  const JsThreeUnsupportedException(this.capability, [this.detail = '']);

  final String capability;
  final String detail;

  @override
  String toString() =>
      'three.unsupported: $capability${detail.isEmpty ? '' : ' — $detail'}';
}
