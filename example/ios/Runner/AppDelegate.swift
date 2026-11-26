import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    // F3b iOS (issue #7 AC3): the ANGLE 1B texture bridge, registered the
    // way the macOS Runner registers it (example/macos/Runner/
    // MainFlutterWindow.swift). registrar(forPlugin:) is failable in the
    // current embedding (CI run 45762273743).
    if let registrar = engineBridge.pluginRegistry
      .registrar(forPlugin: "Angle1bTexturePlugin") {
      Angle1bTexturePlugin.register(with: registrar)
    }
  }
}
