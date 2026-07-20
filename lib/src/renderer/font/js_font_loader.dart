import 'dart:typed_data';

import 'package:flutter/services.dart' show FontLoader;

/// Loads custom fonts into Flutter's engine at runtime.
///
/// Fonts are cached by family name so the same font is only registered once
/// even if many text nodes reference it.
class JsFontLoader {
  JsFontLoader._();

  static final Set<String> _loadedFamilies = <String>{};

  /// Loads a font from raw [bytes] under [family].
  ///
  /// Returns immediately if [family] has already been loaded. If the font
  /// bytes are invalid, the error is caught and the family is still marked
  /// loaded so the engine falls back gracefully instead of retrying forever.
  static Future<void> loadFont(String family, Uint8List bytes) async {
    if (_loadedFamilies.contains(family)) return;
    try {
      final loader = FontLoader(family);
      loader.addFont(Future<ByteData>.value(bytes.buffer.asByteData()));
      await loader.load();
    } on Object catch (_) {
      // Invalid font bytes or engine failure: mark as attempted and let
      // Flutter use a fallback font for this family.
    }
    _loadedFamilies.add(family);
  }

  /// Clears the cache. Mainly useful in tests.
  static void reset() {
    _loadedFamilies.clear();
  }
}
