/// Host contract for the cinematic capture barrier (issue #8, ADR-0004
/// decision 4).
///
/// `pipeline.captureFrame(clock)` (the core `jsr.three.cinematic` module)
/// sends the existing `__jsr_capture` channel with options
/// `{engineId, clock, barrier: 'final-pass'}`; the bridge routes that
/// request here. Implementations complete only after the FINAL composer
/// pass of the frame-driven render has been captured and presented — never
/// from a wall-clock frame. A host that cannot honor the barrier must not
/// fall back to an effect-free capture: leave [JsRuntimeConfig.
/// cinematicCaptureHost] unset and the JS promise rejects with the named
/// error `cinematic.notCapturable`.
///
/// Resolve with a host-specific result map (the same shapes `captureHandler`
/// uses, e.g. `{path, width, height}` or `{bytes, width, height}`); throw to
/// reject with `{'__error': ...}`.
abstract class JsCinematicCaptureHost {
  const JsCinematicCaptureHost();

  /// Captures the frame identified by [clock] (`{frame, fps, shutter,
  /// samples, epoch}`) on the engine [engineId] (`__IID`), after the final
  /// pass of that frame's render.
  Future<Map<String, dynamic>> capture(
    String engineId,
    Map<String, dynamic> clock,
  );
}
