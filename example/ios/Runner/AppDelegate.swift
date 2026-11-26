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
    // MainFlutterWindow.swift).
    Angle1bTexturePlugin.register(
      with: engineBridge.pluginRegistry.registrar(forPlugin: "Angle1bTexturePlugin"))
  }
}
