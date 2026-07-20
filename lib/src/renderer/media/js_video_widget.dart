import 'package:flutter/material.dart';

import 'package:js_widget_runtime/src/renderer/media/js_media_controller.dart';
import 'package:js_widget_runtime/src/renderer/media/js_media_controller_mixin.dart';
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
  String get src =>
      (widget.node['src'] as String?) ?? (widget.node['url'] as String?) ?? '';

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
    if (aspect != null && aspect > 0) {
      return AspectRatio(aspectRatio: aspect, child: surface);
    }
    return surface;
  }

  Widget _buildControls() {
    final progress = duration.inMilliseconds > 0
        ? (position.inMilliseconds / duration.inMilliseconds).clamp(0.0, 1.0)
        : 0.0;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Row(
        children: <Widget>[
          IconButton(
            icon: Icon(isPlaying ? Icons.pause : Icons.play_arrow),
            onPressed: toggle,
            iconSize: 20,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          ),
          Expanded(
            child: Slider(
              value: progress.toDouble(),
              onChanged: seek,
            ),
          ),
          SizedBox(
            width: 72,
            child: Text(
              '${JsMediaControllerMixin.format(position)} / ${JsMediaControllerMixin.format(duration)}',
              style: const TextStyle(fontSize: 11),
              textAlign: TextAlign.end,
            ),
          ),
        ],
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
