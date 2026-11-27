import 'package:flutter/foundation.dart';

/// THREE render backend requested by the host (issue #7 / ADR-0003).
enum JsThreeBackend {
  /// The bounded flutter_gpu renderer (default; always available).
  r1,

  /// Pinned upstream WebGLRenderer over the ANGLE 1B host, when every
  /// probe of the selection ladder passes.
  angle1b,

  /// angle1b when every probe passes, r1 otherwise.
  auto,
}

/// Outcome of the 1B selection ladder, reported through the config's
/// `onThreeBackendSelected` callback.
@immutable
class JsThreeBackendSelection {
  const JsThreeBackendSelection({
    required this.requested,
    required this.selected,
    this.reason,
  });

  final JsThreeBackend requested;
  final JsThreeBackend selected;

  /// Null when the requested backend was selected; otherwise why the ladder
  /// fell back to r1 (probe name + reason).
  final String? reason;

  bool get isAngle1b => selected == JsThreeBackend.angle1b;

  @override
  String toString() =>
      'JsThreeBackendSelection(requested: $requested, selected: $selected'
      '${reason == null ? '' : ', reason: $reason'})';
}
