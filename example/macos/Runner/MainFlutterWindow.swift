import AVFoundation
import Cocoa
import FlutterMacOS
import Vision

class MainFlutterWindow: NSWindow {
  private var pointerChannel: FlutterMethodChannel?
  private var pointerMonitor: Any?
  private var pointerLocked = false

  // Webcam host for the JSR three webcam examples. The core package has no
  // camera dependency: this example-app lane publishes throttled RGBA frames
  // over the generic `jsr.camera` channel, and the widget's JSR config
  // exposes them to JS through JsRuntimeConfig.onHostCall (camera.start /
  // camera.frame / camera.stop).
  private var cameraChannel: FlutterMethodChannel?
  private var cameraPushedFrames = 0
  private var cameraSession: AVCaptureSession?
  private var cameraOutput: AVCaptureVideoDataOutput?
  private var cameraQueue: DispatchQueue?
  private let cameraState = NSLock()
  private var latestCameraFrame: Data?
  private var latestCameraWidth = 0
  private var latestCameraHeight = 0
  private var cameraSeq: Int64 = 0
  private var lastCameraPushTime: TimeInterval = 0
  private var cameraMinInterval: TimeInterval = 1.0 / 24.0

  // Optional face-tracking lane (`camera.track`): when enabled, the newest
  // frame is ALSO handed to VNDetectFaceLandmarksRequest on a dedicated
  // serial Vision queue, and the compact normalized landmark geometry is
  // attached to the frame snapshot. Dart (example/lib/camera_host.dart)
  // turns the geometry into approximate Face Cap blendshape signals; this
  // file only extracts and ships it, so the JSON/base64 camera lane stays
  // the only transport. Drop-if-busy: a Vision pass slower than the capture
  // rate simply skips frames (the queue never backs up).
  private var cameraTracking = false
  private var visionInFlight = false
  private var visionQueue: DispatchQueue?
  private var latestLandmarks: [String: [Double]]?

  override func awakeFromNib() {
    let flutterViewController = FlutterViewController()
    let windowFrame = self.frame
    self.contentViewController = flutterViewController
    self.setFrame(windowFrame, display: true)

    RegisterGeneratedPlugins(registry: flutterViewController)
    configurePointerLock(flutterViewController)
    configureCamera(flutterViewController)

    super.awakeFromNib()
  }

  // MARK: - Camera lane

  private func configureCamera(_ controller: FlutterViewController) {
    let channel = FlutterMethodChannel(
      name: "jsr.camera",
      binaryMessenger: controller.engine.binaryMessenger
    )
    cameraChannel = channel
    cameraPushedFrames = 0
    cameraQueue = DispatchQueue(label: "jsr.camera.capture")
    channel.setMethodCallHandler { [weak self] call, result in
      guard let self else {
        result(["available": false, "reason": "window released"])
        return
      }
      switch call.method {
      case "start":
        let args = call.arguments as? [String: Any]
        let fps = (args?["fps"] as? NSNumber)?.doubleValue ?? 24
        self.startCamera(fps: fps > 1 && fps <= 60 ? fps : 24, result: result)
      case "stop":
        self.stopCamera()
        result(["available": false, "reason": "stopped"])
      case "pull":
        // Dart-side drain used by tests; the live lane pushes proactively.
        result(self.cameraSnapshot() as [String: Any])
      case "track":
        // Optional face-tracking toggle. The geometry is only extracted
        // while a capture session runs; `camera.stop` clears it.
        let args = call.arguments as? [String: Any]
        let enable = (args?["enable"] as? Bool) ?? false
        cameraState.lock()
        cameraTracking = enable
        if !enable { latestLandmarks = nil }
        let running = cameraSession != nil
        cameraState.unlock()
        if enable {
          if visionQueue == nil {
            visionQueue = DispatchQueue(label: "jsr.camera.vision")
          }
          cameraFileDiag("track enable=true session=\(running)")
        }
        var trackReply: [String: Any] = [
          "available": running,
          "tracking": running && enable,
        ]
        if !running && enable {
          trackReply["reason"] = "camera not started"
        }
        result(trackReply)
      default:
        result(FlutterMethodNotImplemented)
      }
    }
  }


  // File-based breadcrumbs: NSLog is invisible for `open`-launched release
  // apps (no stderr, and this target does not reach the unified log), so the
  // camera lane appends its milestones to JSR_CAMERA_LOG beside the Dart
  // lane's lines instead.
  private func cameraFileDiag(_ line: String) {
    let path = ProcessInfo.processInfo.environment["JSR_CAMERA_LOG"] ?? ""
    guard !path.isEmpty else { return }
    let stamp = DateFormatter()
    stamp.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
    let text = "\(stamp.string(from: Date())) swift: \(line)\n"
    if let handle = FileHandle(forWritingAtPath: path) {
      defer { try? handle.close() }
      _ = handle.seekToEndOfFile()
      handle.write(text.data(using: .utf8)!)
    } else {
      try? text.write(toFile: path, atomically: false, encoding: .utf8)
    }
  }

  private func startCamera(fps: Double, result: @escaping FlutterResult) {
    cameraMinInterval = 1.0 / fps
    NSLog("jsr.camera: start fps=%f auth=%d", fps, AVCaptureDevice.authorizationStatus(for: .video).rawValue)
    cameraFileDiag("start fps=\(fps) auth=\(AVCaptureDevice.authorizationStatus(for: .video).rawValue)")
    switch AVCaptureDevice.authorizationStatus(for: .video) {
    case .authorized:
      beginCameraSession(result: result)
    case .notDetermined:
      AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
        DispatchQueue.main.async {
          if granted {
            self?.beginCameraSession(result: result)
          } else {
            result(["available": false, "reason": "camera permission denied"])
          }
        }
      }
    default:
      result(["available": false, "reason": "camera permission denied"])
    }
  }

  private func beginCameraSession(result: @escaping FlutterResult) {
    guard let queue = cameraQueue else {
      result(["available": false, "reason": "capture queue unavailable"])
      return
    }
    queue.async { [weak self] in
      guard let self else { return }
      // Watchdog: session.startRunning() can block for a long time when the
      // camera device is contended right after a relaunch. Reply available
      // = false once so the widget degrades to its bounded checker instead
      // of freezing; a late successful start still wins if it lands first
      // (first reply wins, guarded by the cameraState lock).
      let startStamp = Date()
      NSLog("jsr.camera: session setup begin")
      cameraFileDiag("session setup begin")
      var replied = false
      let replyLock = NSLock()
      let reply: ([String: Any]) -> Void = { payload in
        replyLock.lock()
        let first = !replied
        replied = true
        replyLock.unlock()
        if first {
          DispatchQueue.main.async { result(payload) }
        }
      }
      DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
        replyLock.lock()
        let first = !replied
        replied = true
        replyLock.unlock()
        if first {
          NSLog("jsr.camera: session setup timeout after %.1fs", Date().timeIntervalSince(startStamp))
          self.cameraFileDiag("setup TIMEOUT")
          DispatchQueue.main.async {
            result(["available": false, "reason": "camera session timed out"])
          }
        }
      }
      do {
        let session = AVCaptureSession()
        session.beginConfiguration()
        guard
          let device = AVCaptureDevice.default(
            .builtInWideAngleCamera, for: .video, position: .unspecified),
          let input = try? AVCaptureDeviceInput(device: device)
        else {
          session.commitConfiguration()
          NSLog("jsr.camera: no camera device")
          cameraFileDiag("no camera device")
          reply(["available": false, "reason": "no camera device"])
          return
        }
        // Prefer a small format: the backdrop plane does not need retina and
        // every frame crosses the JSON/base64 pull lane into QuickJS.
        let formats = device.formats
        var chosen: AVCaptureDevice.Format?
        var chosenArea = Int.max
        for format in formats {
          let dims = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
          let area = Int(dims.width) * Int(dims.height)
          // Bench (tool/perf/js_webcam_pull_bench_test.dart): a 320-wide
          // pull+decode costs ~13ms through QuickJS; 640-wide costs ~50ms and
          // blows the 24fps frame budget. Serve the smallest usable format.
          if dims.width >= 320, dims.height >= 180, area < chosenArea {
            chosen = format
            chosenArea = area
          }
        }
        if chosen == nil {
          // Fall back to the smallest format the device exposes.
          for format in formats {
            let dims = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
            let area = Int(dims.width) * Int(dims.height)
            if area < chosenArea {
              chosen = format
              chosenArea = area
            }
          }
        }
        if let chosen, device.activeFormat != chosen {
          try device.lockForConfiguration()
          device.activeFormat = chosen
          device.unlockForConfiguration()
        }
        // No sessionPreset: .inputPriority is unavailable on macOS and any
        // constraining preset would override the small activeFormat above.
        session.addInput(input)
        let output = AVCaptureVideoDataOutput()
        output.videoSettings = [
          kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
        ]
        output.alwaysDiscardsLateVideoFrames = true
        output.setSampleBufferDelegate(self, queue: queue)
        session.addOutput(output)
        session.commitConfiguration()
        NSLog("jsr.camera: session configured, starting (setup %.1fs)", Date().timeIntervalSince(startStamp))
        cameraFileDiag("session configured, starting")
        session.startRunning()
        NSLog("jsr.camera: session running after %.1fs", Date().timeIntervalSince(startStamp))
        cameraFileDiag("session running")
        cameraSession = session
        cameraOutput = output
        let dims = CMVideoFormatDescriptionGetDimensions(device.activeFormat.formatDescription)
        reply([
          "available": true,
          "width": Int(dims.width),
          "height": Int(dims.height)
        ])
      } catch {
        NSLog("jsr.camera: session failed: \(error.localizedDescription)")
        reply(["available": false, "reason": "camera session failed: \(error.localizedDescription)"])
      }
    }
  }

  private func stopCamera() {
    cameraState.lock()
    latestCameraFrame = nil
    latestCameraWidth = 0
    latestCameraHeight = 0
    cameraTracking = false
    latestLandmarks = nil
    cameraState.unlock()
    cameraQueue?.async { [weak self] in
      guard let self else { return }
      self.cameraSession?.stopRunning()
      if let output = self.cameraOutput, let session = self.cameraSession {
        session.removeOutput(output)
      }
      self.cameraOutput = nil
      self.cameraSession = nil
    }
  }

  private func cameraSnapshot() -> [String: Any] {
    cameraState.lock()
    defer { cameraState.unlock() }
    guard let frame = latestCameraFrame, latestCameraWidth > 0 else {
      return ["available": false, "seq": NSNumber(value: cameraSeq)]
    }
    var snapshot: [String: Any] = [
      "available": true,
      "seq": NSNumber(value: cameraSeq),
      "width": latestCameraWidth,
      "height": latestCameraHeight,
      "data": frame,
    ]
    if cameraTracking, let landmarks = latestLandmarks {
      snapshot["landmarks"] = landmarks
    }
    return snapshot
  }

  // MARK: - Face landmark lane (approximate blendshape source)

  // Deep-copies a pixel buffer: the capture queue reuses/recycles buffers,
  // and the Vision pass runs asynchronously — it must never read a buffer
  // AVCapture may refill underneath it.
  private func copyPixelBuffer(_ source: CVPixelBuffer) -> CVPixelBuffer? {
    let width = CVPixelBufferGetWidth(source)
    let height = CVPixelBufferGetHeight(source)
    let format = CVPixelBufferGetPixelFormatType(source)
    var destination: CVPixelBuffer?
    guard
      CVPixelBufferCreate(kCFAllocatorDefault, width, height, format, nil, &destination)
        == kCVReturnSuccess,
      let destination
    else { return nil }
    CVPixelBufferLockBaseAddress(source, .readOnly)
    CVPixelBufferLockBaseAddress(destination, [])
    defer {
      CVPixelBufferUnlockBaseAddress(destination, [])
      CVPixelBufferUnlockBaseAddress(source, .readOnly)
    }
    guard
      let sourceBase = CVPixelBufferGetBaseAddress(source),
      let destinationBase = CVPixelBufferGetBaseAddress(destination)
    else { return nil }
    let sourceStride = CVPixelBufferGetBytesPerRow(source)
    let destinationStride = CVPixelBufferGetBytesPerRow(destination)
    if sourceStride == destinationStride {
      memcpy(destinationBase, sourceBase, sourceStride * height)
    } else {
      for row in 0..<height {
        memcpy(
          destinationBase.advanced(by: row * destinationStride),
          sourceBase.advanced(by: row * sourceStride),
          min(sourceStride, destinationStride))
      }
    }
    return destination
  }

  // Runs one VNDetectFaceLandmarksRequest per handed-off frame. Cheap per
  // pass at 320-wide buffers (~5ms on Apple Silicon); the drop-if-busy guard
  // in captureOutput caps the lane to one in-flight pass.
  private func runFaceLandmarks(on buffer: CVPixelBuffer, mirrored: Bool) {
    defer {
      cameraState.lock()
      visionInFlight = false
      cameraState.unlock()
    }
    let request = VNDetectFaceLandmarksRequest()
    let handler = VNImageRequestHandler(cvPixelBuffer: buffer, options: [:])
    do {
      try handler.perform([request])
    } catch {
      cameraFileDiag("vision failed: \(error.localizedDescription)")
      return
    }
    guard let landmarks = request.results?.first?.landmarks else {
      // No face in frame: drop the geometry so the Dart lane emits no
      // shapes and the widget's face rests at its last pose.
      cameraState.lock()
      latestLandmarks = nil
      cameraState.unlock()
      return
    }
    let map = compactLandmarks(landmarks, mirrored: mirrored)
    cameraState.lock()
    latestLandmarks = map
    cameraState.unlock()
  }

  // Compact named-point payload for the Dart mapping lane. Keys: le/re =
  // the subject's left/right eye, lp/rp = pupils, lb/rb = eyebrows, ol/il =
  // outer/inner lips, fc = face contour, nc = nose crest, no = nose tip
  // region. Points are face-box-normalized (0..1, origin at the box's
  // lower-left, y up), rounded to 2 decimals, so a full landmark set stays
  // ~1 KB of JSON — well inside the bounded camera lane. Which point is the
  // "subject's left" is decided HERE (Vision names regions subject-relative;
  // x grows toward the image's right, which for the un-mirrored front
  // camera is the subject's left side).
  private func compactLandmarks(
    _ landmarks: VNFaceLandmarks2D,
    mirrored: Bool
  ) -> [String: [Double]]? {
    func flat(_ region: VNFaceLandmarkRegion2D?) -> [Double]? {
      guard let region, region.pointCount > 0 else { return nil }
      var out: [Double] = []
      out.reserveCapacity(region.pointCount * 2)
      for point in region.normalizedPoints {
        let x = mirrored ? 1.0 - Double(point.x) : Double(point.x)
        out.append((x * 100).rounded() / 100)
        out.append((Double(point.y) * 100).rounded() / 100)
      }
      return out
    }
    var map: [String: [Double]] = [:]
    if let value = flat(landmarks.leftEye) { map["le"] = value }
    if let value = flat(landmarks.rightEye) { map["re"] = value }
    if let value = flat(landmarks.leftPupil) { map["lp"] = value }
    if let value = flat(landmarks.rightPupil) { map["rp"] = value }
    if let value = flat(landmarks.leftEyebrow) { map["lb"] = value }
    if let value = flat(landmarks.rightEyebrow) { map["rb"] = value }
    if let value = flat(landmarks.outerLips) { map["ol"] = value }
    if let value = flat(landmarks.innerLips) { map["il"] = value }
    if let value = flat(landmarks.faceContour) { map["fc"] = value }
    if let value = flat(landmarks.noseCrest) { map["nc"] = value }
    if let value = flat(landmarks.nose) { map["no"] = value }
    return map.isEmpty ? nil : map
  }

  // MARK: - Pointer lock (unchanged)

  private func configurePointerLock(_ controller: FlutterViewController) {
    let channel = FlutterMethodChannel(
      name: "jsr.three.pointer",
      binaryMessenger: controller.engine.binaryMessenger
    )
    pointerChannel = channel
    channel.setMethodCallHandler { [weak self] call, result in
      switch call.method {
      case "lock":
        result(self?.setPointerLocked(true) ?? false)
      case "unlock":
        result(self?.setPointerLocked(false) ?? false)
      default:
        result(FlutterMethodNotImplemented)
      }
    }
    let mask: NSEvent.EventTypeMask = [
      .mouseMoved, .leftMouseDragged, .rightMouseDragged, .otherMouseDragged,
    ]
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(applicationDidResignActive),
      name: NSApplication.didResignActiveNotification,
      object: nil
    )
    pointerMonitor = NSEvent.addLocalMonitorForEvents(matching: mask) {
      [weak self] event in
      guard let self, self.pointerLocked else { return event }
      channel.invokeMethod(
        "delta",
        arguments: ["dx": event.deltaX, "dy": event.deltaY]
      )
      return event
    }
  }

  @objc private func applicationDidResignActive() {
    guard pointerLocked else { return }
    _ = setPointerLocked(false)
    pointerChannel?.invokeMethod("lockState", arguments: ["locked": false])
  }

  private func setPointerLocked(_ locked: Bool) -> Bool {
    if locked == pointerLocked { return true }
    if locked {
      NSCursor.hide()
      guard CGAssociateMouseAndMouseCursorPosition(0) == .success else {
        NSCursor.unhide()
        return false
      }
      pointerLocked = true
      return true
    }
    pointerLocked = false
    CGAssociateMouseAndMouseCursorPosition(1)
    NSCursor.unhide()
    return true
  }

  deinit {
    if let pointerMonitor {
      NSEvent.removeMonitor(pointerMonitor)
    }
    if pointerLocked {
      CGAssociateMouseAndMouseCursorPosition(1)
      NSCursor.unhide()
    }
  }
}

// AVCaptureVideoDataOutput sample delivery: swizzle BGRA->RGBA in place,
// keep only the newest frame and push it to Dart at the throttled cadence.
extension MainFlutterWindow: AVCaptureVideoDataOutputSampleBufferDelegate {
  func captureOutput(
    _ output: AVCaptureOutput,
    didOutput sampleBuffer: CMSampleBuffer,
    from connection: AVCaptureConnection
  ) {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
    let width = CVPixelBufferGetWidth(pixelBuffer)
    let height = CVPixelBufferGetHeight(pixelBuffer)
    CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly) }
    guard let base = CVPixelBufferGetBaseAddress(pixelBuffer) else { return }
    let stride = CVPixelBufferGetBytesPerRow(pixelBuffer)
    // The pull lane is JSON/base64 and the JS decode runs on the QuickJS
    // thread: bench (tool/perf/js_webcam_pull_bench_test.dart) says a 320x180
    // RGBA frame costs ~14ms per pull+decode while 1080p is unusable, and
    // this device exposes no small native formats. Downsample to <=320 wide
    // (nearest neighbor, aspect preserved) on the capture queue.
    let downscale = max(1, (width + 319) / 320)
    let outWidth = width / downscale
    let outHeight = height / downscale
    var rgba = Data(count: outWidth * outHeight * 4)
    rgba.withUnsafeMutableBytes { (dest: UnsafeMutableRawBufferPointer) in
      guard let destBase = dest.baseAddress else { return }
      let src = base.assumingMemoryBound(to: UInt8.self)
      let dst = destBase.assumingMemoryBound(to: UInt8.self)
      for outY in 0..<outHeight {
        let srcRow = src + outY * downscale * stride
        let dstRow = dst + outY * outWidth * 4
        for outX in 0..<outWidth {
          let srcPixel = srcRow + outX * downscale * 4
          let dstPixel = dstRow + outX * 4
          // 32BGRA -> RGBA: swap the first and third byte per pixel.
          dstPixel[0] = srcPixel[2]
          dstPixel[1] = srcPixel[1]
          dstPixel[2] = srcPixel[0]
          dstPixel[3] = srcPixel[3]
        }
      }
    }
    cameraState.lock()
    cameraSeq += 1
    latestCameraFrame = rgba
    latestCameraWidth = outWidth
    latestCameraHeight = outHeight
    let seq = cameraSeq
    cameraState.unlock()

    // Optional face-tracking hand-off: deep-copy the buffer and run Vision
    // on its own queue (drop-if-busy — never a second in-flight pass, so
    // the capture queue and the push throttle stay frame-budget clean).
    cameraState.lock()
    let trackNow = cameraTracking && !visionInFlight
    if trackNow { visionInFlight = true }
    cameraState.unlock()
    if trackNow {
      let mirrored = connection.isVideoMirrored
      if let copy = copyPixelBuffer(pixelBuffer) {
        let queue = visionQueue
        queue?.async { [weak self] in
          self?.runFaceLandmarks(on: copy, mirrored: mirrored)
        }
      } else {
        cameraState.lock()
        visionInFlight = false
        cameraState.unlock()
        cameraFileDiag("vision: buffer copy failed")
      }
    }

    // Throttle the Dart push to the negotiated cadence; the latest frame is
    // always retained so a slower consumer never misses the newest image.
    let now = CACurrentMediaTime()
    var shouldPush = false
    cameraState.lock()
    if now - lastCameraPushTime >= cameraMinInterval {
      lastCameraPushTime = now
      shouldPush = true
    }
    cameraState.unlock()
    if shouldPush {
      DispatchQueue.main.async { [weak self] in
        guard let self else { return }
        let snapshot = self.cameraSnapshot()
        guard snapshot["available"] as? Bool == true else { return }
        if self.cameraPushedFrames == 0 {
          NSLog("jsr.camera: first push seq=%ld %ldx%ld",
                (snapshot["seq"] as? NSNumber)?.int64Value ?? -1,
                (snapshot["width"] as? NSNumber)?.int64Value ?? -1,
                (snapshot["height"] as? NSNumber)?.int64Value ?? -1)
        }
        self.cameraPushedFrames += 1
        self.cameraChannel?.invokeMethod("frame", arguments: snapshot)
      }
    }
    _ = seq
  }
}
