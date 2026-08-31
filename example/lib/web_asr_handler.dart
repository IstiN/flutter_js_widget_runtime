import 'dart:async';
import 'dart:js_interop';

import 'package:web/web.dart' as web;

/// Web implementation of the `jsr.fa.asr` bridge contract for the preview
/// runner, backed by getUserMedia + MediaRecorder on the main thread
/// (widget JS runs in a Worker, which has no mic access).
///
/// Routed through the generic `jsr.hostCall(name, args)` channel:
/// - `asr.record({seconds})` → `{path, seconds}` where `path` is a
///   playable blob: URL; `seconds` is only the max guard.
/// - `asr.stop()` → stops the active recording immediately.
/// - `asr.transcribe()` → stub text (no on-device ASR on web).
class WebAsrHandler {
  web.MediaRecorder? _active;
  Timer? _guard;

  Future<Object?> call(String name, Map<String, dynamic> args) {
    return switch (name) {
      'asr.record' => _record(args),
      'asr.stop' => Future<Object?>.value(_stop()),
      'asr.transcribe' => Future<Object?>.value(const {
          'text': '(transcription is unavailable in the web preview)',
        }),
      _ => Future<Object?>.error(
          UnsupportedError('unknown host call: $name'),
        ),
    };
  }

  Future<Map<String, Object>> _record(Map<String, dynamic> args) async {
    if (_active != null) {
      throw StateError('recording already in progress');
    }
    final seconds = (args['seconds'] as num?)?.toInt() ?? 5;
    final web.MediaStream stream;
    try {
      stream = await web.window.navigator.mediaDevices
          .getUserMedia(web.MediaStreamConstraints(audio: true.toJS))
          .toDart;
    } catch (e) {
      final desc = e.toString();
      throw StateError(
        desc.contains('NotAllowedError')
            ? 'microphone permission denied'
            : 'microphone is not available: $desc',
      );
    }
    final completer = Completer<Map<String, Object>>();
    final recorder = web.MediaRecorder(stream);
    final chunks = <web.Blob>[];
    _active = recorder;
    recorder.addEventListener(
      'dataavailable',
      ((web.BlobEvent e) => chunks.add(e.data)).toJS,
    );
    recorder.addEventListener(
      'stop',
      ((web.Event _) {
        for (final track in stream.getTracks().toDart) {
          track.stop();
        }
        _guard?.cancel();
        _active = null;
        final blob = web.Blob(
          chunks.toJS,
          web.BlobPropertyBag(type: recorder.mimeType),
        );
        completer.complete({
          'path': web.URL.createObjectURL(blob),
          'seconds': seconds,
        });
      }).toJS,
    );
    recorder.start();
    _guard = Timer(Duration(seconds: seconds), _stop);
    return completer.future;
  }

  Map<String, Object> _stop() {
    final active = _active;
    if (active != null && active.state == 'recording') {
      active.stop();
    }
    return const {};
  }
}
