import 'dart:convert';

import 'package:flutter/foundation.dart';

/// Synthesized PCM audio delivered by `jsr.audio.synth(...).render()`.
///
/// [samples] is a Float32 PCM buffer. Multi-channel audio is INTERLEAVED
/// (`L R L R ...`), matching Web Audio's channel-planar-to-interleaved
/// host conversion point and the buffer layout media encoders usually
/// consume directly. Values are normalized to `[-1, 1]`.
///
/// The payload crosses the bridge through the `audio.synth` binary lane:
/// a `'JSRA'` envelope with a tiny JSON header and the raw Float32 body.
/// [samples] is owned by this value (the parser copies native call-scoped
/// bridge memory), so hosts may retain or transfer it freely.
@immutable
class JsAudioSynthesis {
  const JsAudioSynthesis({
    required this.samples,
    required this.sampleRate,
    required this.channels,
    required this.name,
  });

  /// Interleaved Float32 PCM samples.
  final Float32List samples;

  /// Samples per second (the value passed to `jsr.audio.synth`).
  final int sampleRate;

  /// Channel count: 1 (mono) or 2 (stereo interleaved).
  final int channels;

  /// Track name. A widget may pass `name` explicitly; otherwise JS
  /// generates a stable `synth-N` name and reports it back through
  /// `render()`.
  final String name;

  /// PCM frames (one sample per channel).
  int get frames => channels <= 0 ? 0 : samples.length ~/ channels;

  /// Rendered duration in seconds.
  double get durationSeconds => sampleRate <= 0 ? 0 : frames / sampleRate;

  /// Maximum Float32 samples accepted by the bridge envelope. This mirrors
  /// the JS-side guardrail (16 Mi samples = 64 MiB Float32 data).
  static const int maxSamples = 1 << 24;

  /// Parses the `audio.synth` binary envelope:
  ///
  /// ```
  /// 0  4  magic 'JSRA'
  /// 4  4  version (1, little-endian u32)
  /// 8  4  raw JSON header length (little-endian u32)
  /// 12 N   UTF-8 JSON header, NUL-padded to a 4-byte boundary
  /// ...    raw little-endian Float32 PCM samples
  /// ```
  ///
  /// Returns `(synthesis, requestId)` so the bridge can resolve the JS
  /// `render()` promise, or null for malformed/oversized payloads.
  static (JsAudioSynthesis, String)? parseEnvelope(Uint8List data) {
    final bodyStart = _envelopeBodyStart(data);
    if (bodyStart == null) return null;
    final Map<String, dynamic> header;
    try {
      final rawLen = ByteData.sublistView(data).getUint32(8, Endian.little);
      header =
          jsonDecode(utf8.decode(data.sublist(12, 12 + rawLen)))
              as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
    final meta = _AudioEnvelopeMeta.fromHeader(header);
    if (meta == null) return null;
    return _parseEnvelopeBody(data, bodyStart, meta);
  }

  static int? _envelopeBodyStart(Uint8List data) {
    if (data.length < 16 || !_hasJsraMagic(data)) return null;
    final bd = ByteData.sublistView(data);
    if (bd.getUint32(4, Endian.little) != 1) return null;
    final headerLen = bd.getUint32(8, Endian.little);
    if (headerLen < 2 || headerLen > 4096) return null;
    final bodyStart = 12 + headerLen + (4 - headerLen % 4) % 4;
    if (bodyStart > data.length) return null;
    if ((data.length - bodyStart) % 4 != 0) return null;
    return bodyStart;
  }

  static bool _hasJsraMagic(Uint8List data) =>
      data[0] == 0x4A && // 'J'
      data[1] == 0x52 && // 'S'
      data[2] == 0x52 && // 'R'
      data[3] == 0x41; // 'A'

  static (JsAudioSynthesis, String)? _parseEnvelopeBody(
    Uint8List data,
    int bodyStart,
    _AudioEnvelopeMeta meta,
  ) {
    final sampleCount = meta.frames * meta.channels;
    if (sampleCount > maxSamples) return null;
    if (data.length - bodyStart != sampleCount * 4) return null;

    // Native-engine envelopes pass call-scoped memory, and a foreign
    // Uint8List may be unaligned: decode explicitly and copy into an owned
    // Float32 buffer so hosts may retain it beyond the callback.
    final body = ByteData.sublistView(data, bodyStart);
    final samples = Float32List(sampleCount);
    for (var i = 0; i < sampleCount; i++) {
      samples[i] = body.getFloat32(i * 4, Endian.little);
    }
    return (
      JsAudioSynthesis(
        samples: samples,
        sampleRate: meta.sampleRate,
        channels: meta.channels,
        name: meta.name,
      ),
      meta.requestId,
    );
  }
}

@immutable
class _AudioEnvelopeMeta {
  const _AudioEnvelopeMeta({
    required this.requestId,
    required this.name,
    required this.sampleRate,
    required this.channels,
    required this.frames,
  });

  final String requestId;
  final String name;
  final int sampleRate;
  final int channels;
  final int frames;

  static _AudioEnvelopeMeta? fromHeader(Map<String, dynamic> header) {
    final requestId = header['id']?.toString().trim() ?? '';
    final name = header['name']?.toString().trim() ?? '';
    if (requestId.isEmpty || name.isEmpty) return null;
    final counts = _integerCounts(header);
    if (counts == null) return null;
    final (sampleRate, channels, frames) = counts;
    if (sampleRate <= 0 || sampleRate > 384000) return null;
    if (channels < 1 || channels > 2) return null;
    if (frames <= 0) return null;
    return _AudioEnvelopeMeta(
      requestId: requestId,
      name: name,
      sampleRate: sampleRate,
      channels: channels,
      frames: frames,
    );
  }

  static (int, int, int)? _integerCounts(Map<String, dynamic> header) {
    final sampleRateRaw = header['sampleRate'];
    final channelsRaw = header['channels'];
    final framesRaw = header['frames'];
    if (sampleRateRaw is! num || channelsRaw is! num || framesRaw is! num) {
      return null;
    }
    final sampleRate = sampleRateRaw.toInt();
    final channels = channelsRaw.toInt();
    final frames = framesRaw.toInt();
    if (sampleRateRaw != sampleRate ||
        channelsRaw != channels ||
        framesRaw != frames) {
      return null; // Header counters must be JSON integers.
    }
    return (sampleRate, channels, frames);
  }
}
