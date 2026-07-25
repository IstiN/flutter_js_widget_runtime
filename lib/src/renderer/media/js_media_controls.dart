import 'package:flutter/material.dart';

import 'package:js_widget_runtime/src/renderer/media/js_media_controller_mixin.dart';

/// Shared transport controls for audio/video widgets.
///
/// Renders a play/pause toggle, a position slider and a `position / duration`
/// label. The widget is intentionally minimal so hosts can style it further.
class JsMediaTransportControls extends StatelessWidget {
  const JsMediaTransportControls({
    super.key,
    required this.isPlaying,
    required this.position,
    required this.duration,
    required this.onToggle,
    required this.onSeek,
    this.padding = const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    this.iconSize,
    this.constraints,
  });

  final bool isPlaying;
  final Duration position;
  final Duration duration;
  final VoidCallback onToggle;
  final ValueChanged<double> onSeek;
  final EdgeInsets padding;
  final double? iconSize;
  final BoxConstraints? constraints;

  @override
  Widget build(BuildContext context) {
    final progress = duration.inMilliseconds > 0
        ? (position.inMilliseconds / duration.inMilliseconds).clamp(0.0, 1.0)
        : 0.0;
    return Padding(
      padding: padding,
      child: Row(
        children: <Widget>[
          IconButton(
            icon: Icon(isPlaying ? Icons.pause : Icons.play_arrow),
            iconSize: iconSize,
            padding: EdgeInsets.zero,
            constraints: constraints,
            onPressed: onToggle,
          ),
          Expanded(
            child: Slider(
              value: progress.toDouble(),
              onChanged: onSeek,
            ),
          ),
          SizedBox(
            width: 72,
            child: Text(
              '${JsMediaControllerMixin.format(position)} / '
              '${JsMediaControllerMixin.format(duration)}',
              style: const TextStyle(fontSize: 11),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}
