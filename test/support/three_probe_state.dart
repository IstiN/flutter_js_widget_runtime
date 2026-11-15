/// Reads the `probe` section a widget exported through `jsr.exportState`.
/// [probe] is any harness exposing `engine.exportedState`.
Map<String, dynamic>? probeFindings(dynamic probe) {
  final exported = probe.engine.exportedState;
  final probeState = exported?['probe'];
  if (probeState is Map<String, dynamic>) return probeState;
  if (probeState is Map) return probeState.cast<String, dynamic>();
  return null;
}

/// Pumps an instrumented example until its exported probe satisfies [ready].
Future<Map<String, dynamic>?> pumpThreeProbeUntil(
  dynamic probe,
  dynamic tester,
  bool Function(Map<String, dynamic>) ready, {
  int attempts = 120,
}) async {
  Map<String, dynamic>? findings;
  for (var attempt = 0; attempt < attempts; attempt++) {
    findings = probeFindings(probe);
    if (findings != null && ready(findings)) break;
    await probe.pumpFrame(tester);
  }
  return findings;
}
