import 'package:flame/flame.dart';
import 'package:flame/src/cache/assets_cache.dart';
import 'package:flutter/services.dart';

/// Replaces Flame's global asset bundle.
///
/// `flame_3d` loads GLB/OBJ models (and their textures) through
/// `Flame.assets` → `Flame.bundle`, which defaults to the app's
/// [rootBundle]. Host apps that render projects from arbitrary directories
/// (YoClip Studio) do not have those files in their own bundle, so model
/// loads fail with "Unable to load asset". Installing a delegating bundle
/// that falls back to the project directory fixes it for every flame_3d
/// load in the process.
///
/// Both [Flame.bundle] and [Flame.assets] are replaced: the eagerly
/// created [AssetsCache] captured the original bundle at startup.
void jsrSetFlameAssetBundle(AssetBundle bundle) {
  Flame.bundle = bundle;
  Flame.assets = AssetsCache(bundle: bundle);
}
