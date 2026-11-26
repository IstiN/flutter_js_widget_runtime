// Angle1bTexturePlugin — ANGLE 1B texture bridge for iOS (F3b, issue #7
// AC3). Mirrors the macOS plugin (example/macos/Runner/Angle1bTexturePlugin.swift):
// Dart creates the GL surface + IOSurface through the C shim via FFI, then
// hands the IOSurfaceID to this plugin, which wraps it in a CVPixelBuffer
// (CVPixelBufferCreateWithIOSurface, Metal-compatible) and feeds it to the
// Flutter texture registry; every swapped frame is announced through
// 'frameAvailable' -> textureFrameAvailable.
//
// Adds one iOS-only diagnostic, 'debugHierarchy' (REG-NOWEBVIEW-1): returns
// the class names of the key window's view tree so the device suite can
// prove the 1B path presents through a Flutter texture, never a web view.
import Flutter
import UIKit
import CoreVideo

// F3b iOS: the iPhoneOS SDK ships no public IOSurface header or clang
// module (verified Xcode 16.4 / iPhoneOS18.5, CI run 45753628959), so the
// macOS plugin's `import IOSurface` + IOSurfaceLookup cannot resolve here.
// The C API is public, documented and ABI-stable on iOS since iOS 11;
// declare the one lookup call directly. IOSurfaceRef arrives as a raw
// pointer and is handed to CVPixelBufferCreateWithIOSurface, which retains
// it; the lookup's +1 is released with CFRelease right after.
@_silgen_name("IOSurfaceLookup")
private func angle1bIOSurfaceLookup(_ cSid: UInt32) -> UnsafeMutableRawPointer?

@_silgen_name("CVPixelBufferCreateWithIOSurface")
private func angle1bCVPixelBufferCreateWithIOSurface(
  _ allocator: CFAllocator?,
  _ iosurface: UnsafeMutableRawPointer,
  _ dictionary: CFDictionary?,
  _ out: UnsafeMutablePointer<Unmanaged<CVPixelBuffer>?>
) -> Int32

public final class Angle1bTexturePlugin: NSObject {
  private let registry: FlutterTextureRegistry
  private let channel: FlutterMethodChannel
  // textureId -> CVPixelBuffer wrapping the shim's IOSurface
  private var textures: [Int64: CVPixelBuffer] = [:]

  public static func register(with registrar: FlutterPluginRegistrar) {
    // The instance is self-retaining (channel -> handler -> self), matching
    // the flutter_angle registration pattern.
    _ = Angle1bTexturePlugin(
      registry: registrar.textures,
      messenger: registrar.messenger)
  }

  init(registry: FlutterTextureRegistry, messenger: FlutterBinaryMessenger) {
    self.registry = registry
    channel = FlutterMethodChannel(
      name: "angle_1b",
      binaryMessenger: messenger)
    super.init()
    channel.setMethodCallHandler(handle(_:result:))
  }

  private func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
    switch call.method {
    case "createSurface":
      createSurface(call.arguments, result: result)
    case "destroySurface":
      destroySurface(call.arguments, result: result)
    case "frameAvailable":
      frameAvailable(call.arguments, result: result)
    case "debugHierarchy":
      result(debugHierarchy())
    default:
      result(FlutterMethodNotImplemented)
    }
  }

  // args: [iosurfaceId, width, height] — the IOSurface already exists on the
  // C shim side (created by a1b_create_surface via FFI from Dart).
  private func createSurface(_ args: Any?, result: @escaping FlutterResult) {
    guard let args = args as? [Any], args.count == 3,
          let iosurfaceId = args[0] as? Int64, iosurfaceId > 0,
          let width = args[1] as? Int64, width > 0,
          let height = args[2] as? Int64, height > 0 else {
      result(FlutterError(code: "BAD_ARGS", message: "expected [iosurfaceId, width, height]", details: nil))
      return
    }
    // F3b iOS: lookup through the declared C entry point (see the comments
    // at the top of this file); IOSurfaceID is a UInt32 and the lookup
    // returns a +1-retained IOSurfaceRef.
    guard let ioSurface = angle1bIOSurfaceLookup(
      UInt32(truncatingIfNeeded: iosurfaceId)) else {
      result(FlutterError(code: "IOSURFACE_LOOKUP", message: "no IOSurface for id \(iosurfaceId)", details: nil))
      return
    }
    let pixelFormat = kCVPixelFormatType_32BGRA
    var unmanagedBuffer: Unmanaged<CVPixelBuffer>?
    let status = angle1bCVPixelBufferCreateWithIOSurface(
      kCFAllocatorDefault, ioSurface,
      [
        kCVPixelBufferPixelFormatTypeKey: pixelFormat,
        kCVPixelBufferMetalCompatibilityKey: true,
      ] as CFDictionary,
      &unmanagedBuffer)
    // The pixel buffer retains the surface; drop the lookup's +1.
    CFRelease(unsafeBitCast(ioSurface, to: CFTypeRef.self))
    guard status == kCVReturnSuccess, let buffer = unmanagedBuffer?.takeRetainedValue() else {
      result(FlutterError(code: "PIXELBUFFER", message: "CVPixelBufferCreateWithIOSurface failed: \(status)", details: nil))
      return
    }
    let texture = Angle1bFlutterTexture(pixelBuffer: buffer)
    let textureId = registry.register(texture)
    textures[textureId] = buffer
    result(["textureId": textureId, "iosurfaceId": iosurfaceId])
  }

  private func destroySurface(_ args: Any?, result: @escaping FlutterResult) {
    guard let textureId = (args as? [Any])?.first as? Int64 else {
      result(FlutterError(code: "BAD_ARGS", message: "expected [textureId]", details: nil))
      return
    }
    registry.unregisterTexture(textureId)
    textures.removeValue(forKey: textureId)
    result(nil)
  }

  private func frameAvailable(_ args: Any?, result: @escaping FlutterResult) {
    guard let textureId = (args as? [Any])?.first as? Int64 else {
      result(FlutterError(code: "BAD_ARGS", message: "expected [textureId]", details: nil))
      return
    }
    registry.textureFrameAvailable(textureId)
    result(nil)
  }

  // REG-NOWEBVIEW-1 diagnostic: class names of the key window's view tree,
  // breadth-first, capped. Read-only; never mutates the hierarchy.
  private func debugHierarchy() -> [String] {
    var names: [String] = []
    var queue: [UIView] = []
    for scene in UIApplication.shared.connectedScenes {
      if let windowScene = scene as? UIWindowScene, let window = windowScene.keyWindow {
        queue.append(window)
      }
    }
    while let view = queue.first, names.count < 512 {
      queue.removeFirst()
      names.append(String(describing: type(of: view)))
      queue.append(contentsOf: view.subviews)
    }
    return names
  }
}

private final class Angle1bFlutterTexture: NSObject, FlutterTexture {
  let pixelBuffer: CVPixelBuffer

  init(pixelBuffer: CVPixelBuffer) {
    self.pixelBuffer = pixelBuffer
  }

  public func copyPixelBuffer() -> Unmanaged<CVPixelBuffer>? {
    Unmanaged.passRetained(pixelBuffer)
  }
}
