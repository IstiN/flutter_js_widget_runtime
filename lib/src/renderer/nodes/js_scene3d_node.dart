import 'package:flutter/material.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_3d_host.dart';

/// Renders an interactive 3D scene provided by a [Js3dHost].
///
/// The node type is `scene3d`. JSON shape:
///
/// ```json
/// {
///   "type": "scene3d",
///   "id": "main",
///   "width": 300,
///   "height": 300,
///   "camera": {"position": [0, 2, 5], "target": [0, 0, 0]},
///   "lights": [{"type": "ambient", "color": "#ffffff", "intensity": 0.5}]
/// }
/// ```
class JsScene3dNode extends StatefulWidget {
  const JsScene3dNode({
    required this.sceneId,
    required this.host,
    required this.config,
    super.key,
  });

  final String sceneId;
  final Js3dHost host;
  final Map<String, dynamic> config;

  @override
  State<JsScene3dNode> createState() => _JsScene3dNodeState();
}

class _JsScene3dNodeState extends State<JsScene3dNode> {
  late final Js3dController _controller;

  @override
  void initState() {
    super.initState();
    _controller = widget.host.createController(
      widget.sceneId,
      widget.config,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scene = widget.host.build(
      context,
      _controller,
      widget.config,
    );

    final width = _doubleOrNull(widget.config['width']);
    final height = _doubleOrNull(widget.config['height']);

    if (width != null || height != null) {
      return SizedBox(
        width: width,
        height: height,
        child: scene,
      );
    }

    return Expanded(child: scene);
  }

  static double? _doubleOrNull(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }
}
