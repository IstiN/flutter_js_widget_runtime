import 'dart:async';

/// Global pending-work tracker for offscreen/headless capture pipelines.
///
/// GPU scene initialization and model loads are real-async (asset bundle IO,
/// shader compilation), which never completes inside the fake-async zone of
/// `flutter_test`. The yoclip headless video exporter polls
/// [hasPendingCaptureWork] after every pump and yields the event loop via
/// [waitForPendingCaptureWork] until the 3D content is actually ready —
/// without this the first exported frames capture an empty scene.
///
/// Hosts register their in-flight work with [track].
class Js3dCaptureSync {
  Js3dCaptureSync._();

  static int _pending = 0;

  /// Whether any 3D scene work (GPU init, game load, model parse) is in
  /// flight right now.
  static bool get hasPendingCaptureWork => _pending > 0;

  /// Number of in-flight work items (exposed for tests).
  static int get pendingCount => _pending;

  /// Completes when nothing is pending. Polls on a short interval; callers
  /// are expected to wrap this in a timeout (like the video-load waits in
  /// yoclip's headless renderer) so a wedged load cannot deadlock export.
  static Future<void> waitForPendingCaptureWork() async {
    while (_pending > 0) {
      await Future<void>.delayed(const Duration(milliseconds: 20));
    }
  }

  /// Tracks [future] as pending capture work until it completes.
  static void track(Future<void> future) {
    _pending++;
    unawaited(future.whenComplete(() => _pending--));
  }
}
