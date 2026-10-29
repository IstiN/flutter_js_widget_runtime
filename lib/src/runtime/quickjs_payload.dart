import 'dart:convert';

/// Channels whose bootstrap `__tag` wraps string payloads as `{iid, id}`.
/// Native per-engine routing makes the iid redundant before dispatch.
const Set<String> _rawIdChannels = {
  '__jsr_log',
  '__jsr_set_title',
  '__jsr_clear_interval',
  '__jsr_caf',
  '__jsr_host_call_binary',
};

/// Unwraps the engine id added to raw-string bridge payloads on native JS.
dynamic unwrapQuickjsPayload(dynamic payload, [String? channel]) {
  if (payload is! String) return payload;
  if (channel != null && !_rawIdChannels.contains(channel)) return payload;
  if (!payload.startsWith('{"iid":')) return payload;
  try {
    final decoded = jsonDecode(payload);
    if (decoded is Map<String, dynamic> &&
        decoded.containsKey('iid') &&
        decoded.containsKey('id')) {
      return decoded['id'];
    }
  } catch (_) {}
  return payload;
}
