import 'package:flutter/widgets.dart';

/// A global custom scroll behavior for the headless/offscreen renderer.
class HeadlessScrollBehavior extends ScrollBehavior {
  const HeadlessScrollBehavior();

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) {
    return const HeadlessScrollPhysics();
  }
}

/// A custom ScrollPhysics that overrides [recommendDeferredLoading] to bypass
/// the standard Flutter [View.of] lookup, avoiding headless runtime exceptions.
class HeadlessScrollPhysics extends ScrollPhysics {
  const HeadlessScrollPhysics({super.parent});

  @override
  HeadlessScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return HeadlessScrollPhysics(parent: buildParent(ancestor));
  }

  @override
  bool recommendDeferredLoading(
    double velocity,
    dynamic metrics,
    BuildContext context,
  ) {
    return false; // Bypass View.of() completely!
  }
}
