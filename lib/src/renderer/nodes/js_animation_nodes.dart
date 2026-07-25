import 'package:flutter/material.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_node_helpers.dart';

/// Entrance (one-shot mount) animation variants.
const _entranceVariants = {
  'fade',
  'slideUp',
  'slideDown',
  'slideLeft',
  'slideRight',
  'scale',
  'fadeScale',
};

/// View transition variants for `animatedSwitcher`.
const _switcherVariants = {
  'fade',
  'slideLeft',
  'slideRight',
  'slideUp',
  'scale',
  'fadeScale',
};

/// Reads the animation variant from a node map.
///
/// The variant lives under `animation` (aliases `variant` / `kind`) — it
/// cannot reuse the node's `type` key because the dispatcher consumes that
/// (a JS object literal like `{type: 'entrance', type: 'slideUp'}` keeps
/// only the last `type`). Unknown values fall back to `'fade'`.
String _variant(dynamic v, Set<String> allowed) {
  final s = v is String ? v : '';
  return allowed.contains(s) ? s : 'fade';
}

/// Tolerant duration parser: numeric strings parse, garbage falls back to
/// [defMs], negatives clamp to 0.
int _durationMs(dynamic v, int defMs) {
  final d = jsDoubleOrNull(v);
  if (d == null) return defMs;
  final ms = d.round();
  return ms < 0 ? 0 : ms;
}

String? _curveName(dynamic v) => v is String ? v : null;

/// Builds a one-shot mount animation wrapper for an `entrance` node.
///
/// The animation plays once when the node first mounts. Use `delay` for
/// staggered list entrances.
///
/// Props:
/// - `animation` (string, default `'fade'`): one of `fade`, `slideUp`,
///   `slideDown`, `slideLeft`, `slideRight`, `scale`, `fadeScale`.
///   Aliases: `variant`, `kind`. Unknown values fall back to `fade`.
/// - `delay` (ms, default 0): time to hold the hidden start state before
///   animating in — JS uses `delay: i * 60` for staggered lists.
/// - `duration` (ms, default 300): animation length once it starts.
/// - `curve` (string): any curve name understood by [jsCurve].
/// - `child`: the node to animate in.
///
/// JS example (staggered list):
/// ```js
/// jsr.render({
///   type: 'listView',
///   children: items.map((it, i) => ({
///     type: 'entrance',
///     animation: 'slideUp',
///     delay: i * 60,
///     duration: 300,
///     child: row(it),
///   })),
/// });
/// ```
Widget buildJsEntranceNode(Map<String, dynamic> m, Widget child) {
  return JsEntranceAnimation(
    variant: _variant(
      m['animation'] ?? m['variant'] ?? m['kind'],
      _entranceVariants,
    ),
    delay: Duration(milliseconds: _durationMs(m['delay'], 0)),
    duration: Duration(milliseconds: _durationMs(m['duration'], 300)),
    curve: jsCurve(_curveName(m['curve'])),
    child: child,
  );
}

/// One-shot entrance animation: plays once on mount, then rests at the
/// completed state. Implemented over [TweenAnimationBuilder] with an
/// [Interval] curve for the delay, so no timers are ever scheduled.
class JsEntranceAnimation extends StatelessWidget {
  const JsEntranceAnimation({
    super.key,
    required this.variant,
    required this.delay,
    required this.duration,
    required this.curve,
    required this.child,
  });

  final String variant;
  final Duration delay;
  final Duration duration;
  final Curve curve;
  final Widget child;

  /// Slide distance in logical pixels at the start of the animation.
  static const double slideDistance = 24;

  @override
  Widget build(BuildContext context) {
    if (duration <= Duration.zero) return child;
    final total = delay + duration;
    final hold = delay.inMicroseconds / total.inMicroseconds;
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0, end: 1),
      duration: total,
      curve: Interval(hold, 1, curve: curve),
      builder: (context, t, child) => _apply(t, child!),
      child: child,
    );
  }

  Widget _apply(double t, Widget child) {
    final d = (1 - t) * slideDistance;
    return switch (variant) {
      'slideUp' => Transform.translate(offset: Offset(0, d), child: child),
      'slideDown' => Transform.translate(offset: Offset(0, -d), child: child),
      'slideLeft' => Transform.translate(offset: Offset(d, 0), child: child),
      'slideRight' => Transform.translate(offset: Offset(-d, 0), child: child),
      'scale' => Transform.scale(
        scale: 0.8 + 0.2 * t,
        alignment: Alignment.center,
        child: child,
      ),
      'fadeScale' => Opacity(
        opacity: t,
        child: Transform.scale(
          scale: 0.9 + 0.1 * t,
          alignment: Alignment.center,
          child: child,
        ),
      ),
      _ => Opacity(opacity: t, child: child),
    };
  }
}

/// Builds a view-transition wrapper for an `animatedSwitcher` node.
///
/// Wraps Flutter's [AnimatedSwitcher]: when `switchKey` changes between
/// renders, the old child animates out and the new one animates in. The
/// child gets a [ValueKey] derived from `switchKey` so the switcher
/// recognises it as a new widget.
///
/// Props:
/// - `switchKey` (string/num): identity of the current view. Changing it
///   triggers the transition; keeping it updates the child in place.
/// - `animation` (string, default `'fade'`): one of `fade`, `slideLeft`,
///   `slideRight`, `slideUp`, `scale`, `fadeScale`. Aliases: `variant`,
///   `kind`. Unknown values fall back to `fade`.
/// - `duration` (ms, default 300).
/// - `curve` (string): any curve name understood by [jsCurve].
/// - `child`: the current view.
///
/// JS example (list → detail view switching):
/// ```js
/// jsr.render({
///   type: 'animatedSwitcher',
///   switchKey: state.view, // e.g. 'list' | 'detail'
///   animation: 'slideLeft',
///   duration: 300,
///   child: viewNode,
/// });
/// ```
Widget buildJsAnimatedSwitcherNode(Map<String, dynamic> m, Widget child) {
  final variant = _variant(
    m['animation'] ?? m['variant'] ?? m['kind'],
    _switcherVariants,
  );
  final curve = jsCurve(_curveName(m['curve']));
  return AnimatedSwitcher(
    duration: Duration(milliseconds: _durationMs(m['duration'], 300)),
    transitionBuilder: (child, animation) =>
        _switcherTransition(variant, curve, child, animation),
    child: KeyedSubtree(
      key: ValueKey<String>('${m['switchKey']}'),
      child: child,
    ),
  );
}

Widget _switcherTransition(
  String variant,
  Curve curve,
  Widget child,
  Animation<double> animation,
) {
  final curved = CurvedAnimation(parent: animation, curve: curve);
  return switch (variant) {
    'slideLeft' => SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(1, 0),
        end: Offset.zero,
      ).animate(curved),
      child: child,
    ),
    'slideRight' => SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(-1, 0),
        end: Offset.zero,
      ).animate(curved),
      child: child,
    ),
    'slideUp' => SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(0, 1),
        end: Offset.zero,
      ).animate(curved),
      child: child,
    ),
    'scale' => ScaleTransition(
      scale: Tween<double>(begin: 0.8, end: 1).animate(curved),
      child: child,
    ),
    'fadeScale' => FadeTransition(
      opacity: curved,
      child: ScaleTransition(
        scale: Tween<double>(begin: 0.9, end: 1).animate(curved),
        child: child,
      ),
    ),
    _ => FadeTransition(opacity: curved, child: child),
  };
}
