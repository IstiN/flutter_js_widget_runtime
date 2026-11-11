// Angle1bTexturePlugin — ANGLE 1B spike texture bridge (M1).
//
// Mirrors the flutter_angle (Knightro63, MIT) macOS interop recipe: Dart
// creates the GL surface + IOSurface through the C shim via FFI, then hands
// the IOSurfaceID to this plugin. The plugin wraps the IOSurface in a
// CVPixelBuffer (CVPixelBufferCreateWithIOSurface) and feeds it to the
// Flutter texture registry; every swapped frame is announced through
// 'frameAvailable' -> textureFrameAvailable.
import Cocoa
import CoreVideo
import FlutterMacOS

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
    guard let ioSurface = IOSurfaceLookup(IOSurfaceID(iosurfaceId)) else {
      result(FlutterError(code: "IOSURFACE_LOOKUP", message: "no IOSurface for id \(iosurfaceId)", details: nil))
      return
    }
    let pixelFormat = kCVPixelFormatType_32BGRA
    var unmanagedBuffer: Unmanaged<CVPixelBuffer>?
    let status = CVPixelBufferCreateWithIOSurface(
      kCFAllocatorDefault, ioSurface,
      [
        kCVPixelBufferPixelFormatTypeKey: pixelFormat,
        kCVPixelBufferMetalCompatibilityKey: true,
      ] as CFDictionary,
      &unmanagedBuffer)
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
}

private final class Angle1bFlutterTexture: NSObject, FlutterTexture {
  let pixelBuffer: CVPixelBuffer

  init(pixelBuffer: CVPixelBuffer) {
    self.pixelBuffer = pixelBuffer
    super.init()
  }

  public func copyPixelBuffer() -> Unmanaged<CVPixelBuffer>? {
    Unmanaged.passRetained(pixelBuffer)
  }
}
