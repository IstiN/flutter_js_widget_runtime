package dev.fa1.jsr_example

import dev.fa1.angle1b.Angle1bTexturePlugin
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity : FlutterActivity() {
  override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
    super.configureFlutterEngine(flutterEngine)
    // F3a Android: the ANGLE 1B texture bridge (same channel contract as the
    // macOS Angle1bTexturePlugin in example/macos/Runner).
    flutterEngine.plugins.add(Angle1bTexturePlugin())
  }
}
