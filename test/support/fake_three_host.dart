import 'dart:typed_data';

import 'package:flutter/widgets.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_host.dart';

class FakeThreeSurface extends JsThreeSurface {
  FakeThreeSurface({
    required super.engineId,
    required super.surfaceId,
    Map<String, dynamic>? config,
  });

  Size _size = Size.zero;
  double _dpr = 1;
  bool _disposed = false;
  int resizeCount = 0;
  Uint8List? captureBytes;

  @override
  Size get logicalSize => _size;
  @override
  double get devicePixelRatio => _dpr;
  @override
  bool get isDisposed => _disposed;

  @override
  void resize(Size size, double devicePixelRatio) {
    _size = size;
    _dpr = devicePixelRatio;
    resizeCount++;
    notifyListeners();
  }

  @override
  Future<Uint8List?> capture() async => captureBytes;

  @override
  Map<String, num> get diagnostics => {'resizeCount': resizeCount};

  @override
  void dispose() {
    if (_disposed) return;
    _disposed = true;
    super.dispose();
  }
}

class FakeThreeHost implements JsThreeHost {
  final surfaces = <String, FakeThreeSurface>{};
  final submissions = <(String, Uint8List)>[];
  final releases = <String>[];
  final disposedEngines = <String>[];
  final assets = <String, JsThreeAsset>{};
  int attachCount = 0;

  static String key(String engineId, String surfaceId) =>
      '$engineId/$surfaceId';

  @override
  JsThreeSurface attach(
    String engineId,
    String surfaceId,
    Map<String, dynamic> config,
  ) {
    attachCount++;
    return surfaces.putIfAbsent(
      key(engineId, surfaceId),
      () => FakeThreeSurface(
        engineId: engineId,
        surfaceId: surfaceId,
        config: config,
      ),
    );
  }

  @override
  JsThreeSurface? findSurface(String engineId, String surfaceId) =>
      surfaces[key(engineId, surfaceId)];

  @override
  void release(String engineId, String surfaceId) {
    final id = key(engineId, surfaceId);
    releases.add(id);
    surfaces.remove(id)?.dispose();
  }

  @override
  void submit(String boundEngineId, Uint8List envelope) {
    submissions.add((boundEngineId, envelope));
  }

  @override
  Future<JsThreeAsset> loadAsset(String engineId, String url) async {
    final asset = assets[url];
    if (asset == null) throw StateError('three.assetFailure');
    return asset;
  }

  @override
  Widget build(
    BuildContext context,
    JsThreeSurface surface,
    Map<String, dynamic> config,
  ) => const SizedBox.expand();

  @override
  void disposeEngine(String engineId) {
    disposedEngines.add(engineId);
    final keys = surfaces.keys
        .where((key) => key.startsWith('$engineId/'))
        .toList();
    for (final key in keys) {
      surfaces.remove(key)?.dispose();
    }
  }
}
