import Cocoa
import FlutterMacOS

class MainFlutterWindow: NSWindow {
  private var pointerChannel: FlutterMethodChannel?
  private var pointerMonitor: Any?
  private var pointerLocked = false

  override func awakeFromNib() {
    let flutterViewController = FlutterViewController()
    let windowFrame = self.frame
    self.contentViewController = flutterViewController
    self.setFrame(windowFrame, display: true)

    RegisterGeneratedPlugins(registry: flutterViewController)
    configurePointerLock(flutterViewController)

    super.awakeFromNib()
  }

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
