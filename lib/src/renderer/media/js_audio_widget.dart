import 'package:flutter/material.dart';

import 'package:js_widget_runtime/src/renderer/media/js_media_controller.dart';
import 'package:js_widget_runtime/src/renderer/media/js_media_controller_mixin.dart';
import 'package:js_widget_runtime/src/renderer/media/js_media_controls.dart';
import 'package:js_widget_runtime/src/renderer/media/js_media_host.dart';

/// Host-provided audio widget rendered for `type: 'audio'` nodes when a
/// [JsMediaHost] is configured.
///
/// Supported node props:
/// - `src` (String, required): file path or URL.
/// - `autoPlay` (bool, default false)
/// - `loop` (bool, default false)
/// - `title` (String): optional label shown above controls.
class JsAudioWidget extends StatefulWidget {
  const JsAudioWidget({
    super.key,
    required this.host,
    required this.node,
  });

  final JsMediaHost host;
  final Map<String, dynamic> node;

  @override
  State<JsAudioWidget> createState() => _JsAudioWidgetState();
}

class _JsAudioWidgetState extends State<JsAudioWidget>
    with JsMediaControllerMixin<JsAudioController, JsAudioWidget> {
  @override
  String get src =>
      (widget.node['src'] as String?) ?? (widget.node['url'] as String?) ?? '';

  String? get _title => widget.node['title'] as String?;

  @override
  bool get autoPlay => widget.node['autoPlay'] == true;

  @override
  bool get loop => widget.node['loop'] == true;

  @override
  JsAudioController createController(String src) =>
      widget.host.createAudioController(src);

  @override
  Widget build(BuildContext context) {
    if (src.isEmpty) {
      return const Center(child: Icon(Icons.audiotrack_outlined));
    }

    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          if (_title?.isNotEmpty == true)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                _title!,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          JsMediaTransportControls(
            isPlaying: isPlaying,
            position: position,
            duration: duration,
            onToggle: toggle,
            onSeek: seek,
          ),
        ],
      ),
    );
  }
}
