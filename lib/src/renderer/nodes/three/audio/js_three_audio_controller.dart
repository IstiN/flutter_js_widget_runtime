import 'package:js_widget_runtime/src/renderer/media/js_media_controller.dart';

/// Optional THREE transport extensions implemented by media hosts that can
/// apply playback rate and stereo balance to an existing audio controller.
///
/// The base [JsAudioController] remains source-compatible with existing
/// hosts. THREE keeps working without this interface, but rate/balance
/// updates are then bounded no-ops on the host side.
abstract interface class JsThreeAudioEnhancedController
    implements JsAudioController {
  Future<void> setPlaybackRate(double playbackRate);

  /// Sets stereo balance in the inclusive range `-1.0` (left) to `1.0`
  /// (right).
  Future<void> setBalance(double balance);
}
