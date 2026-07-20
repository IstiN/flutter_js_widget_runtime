import 'dart:async';

import 'package:flutter/material.dart';

import 'package:js_widget_runtime/src/renderer/media/js_media_controller.dart';

/// Shared state management for [JsVideoWidget] and [JsAudioWidget].
///
/// Handles controller creation, stream subscriptions, play/pause/seek and
/// keeps position / duration / playing state in sync.
mixin JsMediaControllerMixin<C extends JsMediaController, T extends StatefulWidget>
    on State<T> {
  C? _controller;
  final List<StreamSubscription<dynamic>> _subs = <StreamSubscription<dynamic>>[];

  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;
  bool _isPlaying = false;

  /// Called by the state to create the concrete controller for [src].
  C createController(String src);

  /// Optional stream of aspect ratio updates for video controllers.
  Stream<double?>? get aspectRatioStream => null;

  /// Called when aspect ratio updates. Does nothing by default.
  void onAspectRatioChanged(double? value) {}

  String get src;
  bool get autoPlay;
  bool get loop;

  C? get controller => _controller;

  Duration get position => _position;
  Duration get duration => _duration;
  bool get isPlaying => _isPlaying;

  @override
  void initState() {
    super.initState();
    _initController();
  }

  @override
  void didUpdateWidget(covariant T oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (src.isNotEmpty && _controller == null) {
      _initController();
    }
  }

  @override
  void dispose() {
    _disposeController();
    super.dispose();
  }

  Future<void> _initController() async {
    if (src.isEmpty) return;
    final controller = createController(src);
    _controller = controller;
    _subs
      ..add(
        controller.positionStream.listen(
          (p) => mounted ? setState(() => _position = p) : null,
        ),
      )
      ..add(
        controller.durationStream.listen(
          (d) => mounted ? setState(() => _duration = d) : null,
        ),
      )
      ..add(
        controller.playingStream.listen(
          (p) => mounted ? setState(() => _isPlaying = p) : null,
        ),
      );
    final ratioStream = aspectRatioStream;
    if (ratioStream != null) {
      _subs.add(
        ratioStream.listen(
          (r) => mounted ? setState(() => onAspectRatioChanged(r)) : null,
        ),
      );
    }

    if (loop) {
      unawaited(controller.seek(Duration.zero));
    }
    if (autoPlay) {
      unawaited(controller.play());
    }
  }

  Future<void> _disposeController() async {
    for (final sub in _subs) {
      await sub.cancel();
    }
    _subs.clear();
    final controller = _controller;
    _controller = null;
    if (controller != null) {
      await controller.dispose();
    }
  }

  Future<void> toggle() async {
    final controller = _controller;
    if (controller == null) return;
    if (_isPlaying) {
      await controller.pause();
    } else {
      await controller.play();
    }
  }

  Future<void> seek(double value) async {
    final controller = _controller;
    if (controller == null || _duration.inMilliseconds <= 0) return;
    final target = Duration(
      milliseconds: (value * _duration.inMilliseconds).round(),
    );
    await controller.seek(target);
  }

  static String format(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }
}
