/// Reads the `probe` section a widget exported through `jsr.exportState`.
/// [probe] is any harness exposing `engine.exportedState`.
Map<String, dynamic>? probeFindings(dynamic probe) {
  final exported = probe.engine.exportedState;
  final probeState = exported?['probe'];
  if (probeState is Map<String, dynamic>) return probeState;
  if (probeState is Map) return probeState.cast<String, dynamic>();
  return null;
}
