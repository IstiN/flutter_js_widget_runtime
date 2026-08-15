part of '../json_widget_renderer.dart';

/// Animated-widget builders (implicit animations) for [JsonWidgetRenderer].
extension JsonWidgetAnimatedNodes on JsonWidgetRenderer {
  // ── Animated widgets ──────────────────────────────────────────────────────

  Widget _animatedContainer(Map<String, dynamic> m) {
    final duration = _animDuration(m);
    final curve = _animCurve(m);
    return _buildBox(
      ({
        width,
        height,
        padding,
        margin,
        alignment,
        decoration,
        transform,
        child,
      }) => AnimatedContainer(
        duration: duration,
        curve: curve,
        width: width,
        height: height,
        padding: padding,
        margin: margin,
        alignment: alignment,
        decoration: decoration,
        transform: transform,
        child: child,
      ),
      m,
    );
  }

  /// Shared implicit-animation props: duration in ms (default 300) and the
  /// named curve (default linear).
  Duration _animDuration(Map<String, dynamic> m) =>
      Duration(milliseconds: _int(m['duration'], 300));
  Curve _animCurve(Map<String, dynamic> m) => _curve(m['curve'] as String?);

  Widget _animatedOpacity(Map<String, dynamic> m) => AnimatedOpacity(
    duration: _animDuration(m),
    curve: _animCurve(m),
    opacity: _double(m['opacity'], 1.0),
    child: _child(m) ?? const SizedBox.shrink(),
  );

  Widget _animatedPositioned(Map<String, dynamic> m) => AnimatedPositioned(
    duration: _animDuration(m),
    curve: _animCurve(m),
    left: _doubleOrNull(m['left']),
    top: _doubleOrNull(m['top']),
    right: _doubleOrNull(m['right']),
    bottom: _doubleOrNull(m['bottom']),
    width: _doubleOrNull(m['width']),
    height: _doubleOrNull(m['height']),
    child: _child(m) ?? const SizedBox.shrink(),
  );

  Curve _curve(String? v) => jsCurve(v);
}
