import 'dart:async';

import 'package:flutter/material.dart';

import 'package:js_widget_runtime/src/renderer/media/js_media_controller.dart';
import 'package:js_widget_runtime/src/renderer/media/js_media_controller_mixin.dart';
import 'package:js_widget_runtime/src/renderer/media/js_media_controls.dart';
import 'package:js_widget_runtime/src/renderer/media/js_media_host.dart';

/// Host-provided video widget rendered for `type: 'video'` nodes when a
/// [JsMediaHost] is configured.
///
/// Supported node props:
/// - `src` (String, required): file path or URL.
/// - `autoPlay` (bool, default false)
/// - `loop` (bool, default false)
/// - `controls` (bool, default true)
/// - `fit` (`cover`/`contain`/`fill`/`fitWidth`/`fitHeight`/`none`, default `contain`)
/// - `width` / `height`: optional explicit size.
class JsVideoWidget extends StatefulWidget {
  const JsVideoWidget({
    super.key,
    required this.host,
    required this.node,
  });

  final JsMediaHost host;
  final Map<String, dynamic> node;

  @override
  State<JsVideoWidget> createState() => _JsVideoWidgetState();
}

class _JsVideoWidgetState extends State<JsVideoWidget>
    with JsMediaControllerMixin<JsVideoController, JsVideoWidget> {
  double? _aspectRatio;

  @override
  String get src => srcOf(widget);

  @override
  String srcOf(JsVideoWidget w) =>
      (w.node['src'] as String?) ?? (w.node['url'] as String?) ?? '';

  @override
  bool loopOf(JsVideoWidget w) => w.node['loop'] == true;

  @override
  bool get autoPlay => widget.node['autoPlay'] == true;

  @override
  bool get loop => widget.node['loop'] == true;

  bool get _controls => widget.node['controls'] != false;

  BoxFit get _fit => _parseBoxFit(widget.node['fit'] as String?);

  double? get _width => _doubleOrNull(widget.node['width']);

  double? get _height => _doubleOrNull(widget.node['height']);

  @override
  JsVideoController createController(String src) =>
      widget.host.createVideoController(src);

  @override
  Stream<double?>? get aspectRatioStream => controller?.aspectRatioStream;

  @override
  void onAspectRatioChanged(double? value) => _aspectRatio = value;

  @override
  Widget build(BuildContext context) {
    if (src.isEmpty) {
      return const Center(child: Icon(Icons.videocam_off_outlined));
    }

    Widget content = Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Flexible(
          child: SizedBox(
            width: _width,
            height: _height,
            child: _buildVideoContent(),
          ),
        ),
        if (_controls) _buildControls(),
      ],
    );

    if (_width != null || _height != null) {
      content = SizedBox(width: _width, height: _height, child: content);
    }

    return content;
  }

  Widget _buildVideoContent() {
    final controller = this.controller;
    if (controller == null) {
      return Container(
        color: Colors.black,
        width: _width,
        height: _height,
        alignment: Alignment.center,
        child: const Icon(Icons.videocam, color: Colors.white54),
      );
    }
    final aspect = _aspectRatio ?? controller.aspectRatio;
    final surface = controller.buildVideo(
      context,
      fit: _fit,
      width: _width,
      height: _height,
    );
    // When the parent reserved a FIXED box for the node (an `aspectRatio`
    // node, `sizedBox` with both sizes, a `stack` with fit expand — tight
    // constraints), hand the surface that box untouched so the node's `fit`
    // decides the mapping. Wrapping in AspectRatio here would pin the box
    // to the video's natural aspect and make contain/fill/cover render
    // identically (everything letterboxed — the fit buttons looked dead).
    // Loose parents (column/row children) keep the natural-shape
    // AspectRatio: an unboxed video would otherwise collapse to zero
    // height.
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.isTight) return surface;
        if (aspect != null && aspect > 0) {
          return AspectRatio(aspectRatio: aspect, child: surface);
        }
        return surface;
      },
    );
  }

  Widget _buildControls() => JsMediaTransportControls(
        isPlaying: isPlaying,
        position: position,
        duration: duration,
        onToggle: toggle,
        onSeek: seek,
        iconSize: 20,
        constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
        onFullscreen: _fullscreenEnabled ? _enterFullscreen : null,
      );

  /// Fullscreen is a real in-app route reusing the SAME controller —
  /// playback continues seamlessly. Hidden with `fullscreenButton: false`.
  bool get _fullscreenEnabled =>
      controller != null && widget.node['fullscreenButton'] != false;

  void _enterFullscreen() {
    final videoController = controller;
    if (videoController == null || !mounted) return;
    Navigator.of(context, rootNavigator: true).push(
      PageRouteBuilder<void>(
        fullscreenDialog: true,
        opaque: false,
        barrierColor: Colors.black,
        transitionDuration: const Duration(milliseconds: 200),
        reverseTransitionDuration: const Duration(milliseconds: 200),
        pageBuilder: (_, __, ___) => _JsVideoFullscreenPage(
          key: const ValueKey('jsr-video-fullscreen'),
          controller: videoController,
          fit: _fit,
          aspectRatio: _aspectRatio ?? videoController.aspectRatio,
        ),
      ),
    );
  }

  static BoxFit _parseBoxFit(String? value) => switch (value) {
        'cover' => BoxFit.cover,
        'contain' => BoxFit.contain,
        'fill' => BoxFit.fill,
        'fitWidth' => BoxFit.fitWidth,
        'fitHeight' => BoxFit.fitHeight,
        'none' => BoxFit.none,
        _ => BoxFit.contain,
      };

  static double? _doubleOrNull(dynamic v) =>
      v == null ? null : (v as num).toDouble();
}

/// Full-screen route body for [JsVideoWidget]: renders the SAME controller's
/// surface edge-to-edge over a black background with its own transport
/// controls and a close button. Because the controller is shared, playback
/// continues seamlessly while the route is open and position/volume survive
/// the round trip.
class _JsVideoFullscreenPage extends StatefulWidget {
  const _JsVideoFullscreenPage({
    super.key,
    required this.controller,
    required this.fit,
    this.aspectRatio,
  });

  final JsVideoController controller;
  final BoxFit fit;
  final double? aspectRatio;

  @override
  State<_JsVideoFullscreenPage> createState() =>
      _JsVideoFullscreenPageState();
}

class _JsVideoFullscreenPageState extends State<_JsVideoFullscreenPage> {
  final List<StreamSubscription<dynamic>> _subs = <StreamSubscription<dynamic>>[];
  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;
  bool _isPlaying = false;

  @override
  void initState() {
    super.initState();
    final c = widget.controller;
    _subs
      ..add(c.positionStream.listen((p) => mounted ? setState(() => _position = p) : null))
      ..add(c.durationStream.listen((d) => mounted ? setState(() => _duration = d) : null))
      ..add(c.playingStream.listen((p) => mounted ? setState(() => _isPlaying = p) : null));
  }

  @override
  void dispose() {
    for (final sub in _subs) {
      sub.cancel();
    }
    super.dispose();
  }

  Future<void> _toggle() async {
    if (_isPlaying) {
      await widget.controller.pause();
    } else {
      await widget.controller.play();
    }
  }

  Future<void> _seek(double value) async {
    if (_duration.inMilliseconds <= 0) return;
    await widget.controller.seek(
      Duration(
        milliseconds: (value * _duration.inMilliseconds).round(),
      ),
    );
  }

  void _close() => Navigator.of(context).pop();

  @override
  Widget build(BuildContext context) {
    final surface = widget.controller.buildVideo(
      context,
      fit: widget.fit,
    );
    Widget video = surface;
    final aspect = widget.aspectRatio;
    if (aspect != null && aspect > 0) {
      video = AspectRatio(aspectRatio: aspect, child: surface);
    }
    return Material(
      color: Colors.black,
      child: Stack(
        fit: StackFit.expand,
        children: <Widget>[
          Center(child: video),
          Positioned(
            top: MediaQuery.paddingOf(context).top,
            right: 8,
            child: IconButton(
              icon: const Icon(Icons.close, color: Colors.white70),
              tooltip: 'Exit fullscreen',
              onPressed: _close,
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: MediaQuery.paddingOf(context).bottom,
            child: JsMediaTransportControls(
              isPlaying: _isPlaying,
              position: _position,
              duration: _duration,
              onToggle: _toggle,
              onSeek: _seek,
              iconSize: 24,
            ),
          ),
        ],
      ),
    );
  }
}
