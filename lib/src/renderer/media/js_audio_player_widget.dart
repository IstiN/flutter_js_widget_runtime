import 'dart:async';

import 'package:flutter/widgets.dart';

import 'package:js_widget_runtime/src/renderer/media/js_media_controller.dart';
import 'package:js_widget_runtime/src/renderer/media/js_media_host.dart';

/// Zero-size, frame-driven audio player rendered for `type: 'audio_player'`
/// nodes when a [JsMediaHost] is configured.
///
/// Unlike the `audio` node (static transport controls), this widget is
/// designed for JS scenes that recompute props on every frame:
///
/// - `src` (String, required): `assets://...`, `assets/...`, file path or
///   `external:<id>`. Recreates the controller when it changes.
/// - `playing` (bool, default true): play/pause driven from JS.
/// - `volume` (double 0..1, default 1.0): applied on change, clamped.
/// - `loop` (bool, default false): applied on change.
/// - `seekToMs` (int, optional): when the value changes between rebuilds,
///   seeks to it; the same value repeated does not seek again.
///
/// Renders a [SizedBox.shrink]; without a host the renderer also falls back
/// to a zero-size placeholder.
class JsAudioPlayerWidget extends StatefulWidget {
  const JsAudioPlayerWidget({
    super.key,
    required this.host,
    required this.node,
  });

  /// Host used to create the audio controller.
  final JsMediaHost host;

  /// Raw JSON node props.
  final Map<String, dynamic> node;

  @override
  State<JsAudioPlayerWidget> createState() => _JsAudioPlayerWidgetState();
}

class _JsAudioPlayerWidgetState extends State<JsAudioPlayerWidget> {
  JsAudioController? _controller;

  // Last applied props; sentinel defaults match the node defaults so the
  // initial sync only issues calls for props that differ.
  bool _appliedPlaying = false;
  double _appliedVolume = 1.0;
  bool _appliedLoop = false;
  int? _appliedSeekToMs;

  String get _src => (widget.node['src'] as String?) ?? '';
  bool get _playing => widget.node['playing'] as bool? ?? true;

  double get _volume =>
      ((widget.node['volume'] as num?)?.toDouble() ?? 1.0).clamp(0.0, 1.0);

  bool get _loop => widget.node['loop'] as bool? ?? false;
  int? get _seekToMs => (widget.node['seekToMs'] as num?)?.toInt();

  @override
  void initState() {
    super.initState();
    _initController();
  }

  @override
  void didUpdateWidget(covariant JsAudioPlayerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_src != ((oldWidget.node['src'] as String?) ?? '')) {
      _disposeController();
      _initController();
      return;
    }
    _syncProps();
  }

  @override
  void dispose() {
    _disposeController();
    super.dispose();
  }

  void _initController() {
    if (_src.isEmpty) return;
    _controller = widget.host.createAudioController(_src);
    _appliedPlaying = false;
    _appliedVolume = 1.0;
    _appliedLoop = false;
    _appliedSeekToMs = null;
    _syncProps();
  }

  void _syncProps() {
    final controller = _controller;
    if (controller == null) return;

    if (_playing != _appliedPlaying) {
      _appliedPlaying = _playing;
      unawaited(_playing ? controller.play() : controller.pause());
    }
    if (_volume != _appliedVolume) {
      _appliedVolume = _volume;
      unawaited(controller.setVolume(_volume));
    }
    if (_loop != _appliedLoop) {
      _appliedLoop = _loop;
      unawaited(controller.setLoop(_loop));
    }
    final seekToMs = _seekToMs;
    if (seekToMs != null && seekToMs != _appliedSeekToMs) {
      _appliedSeekToMs = seekToMs;
      unawaited(controller.seek(Duration(milliseconds: seekToMs)));
    }
  }

  void _disposeController() {
    final controller = _controller;
    _controller = null;
    if (controller != null) {
      unawaited(controller.dispose());
    }
  }

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}
