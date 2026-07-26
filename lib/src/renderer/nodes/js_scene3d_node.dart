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
    this.onSceneTap,
    super.key,
  });

  final String sceneId;
  final Js3dHost host;
  final Map<String, dynamic> config;

  /// Called with the raycast result when the scene is tapped: either
  /// `{modelId, point: [x, y, z]}` for the nearest hit or `{modelId: null}`
  /// on a miss. When null, taps are not intercepted at all.
  final void Function(String sceneId, Map<String, dynamic> payload)?
  onSceneTap;

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

  void _handleTapUp(TapUpDetails details, Size size) {
    final callback = widget.onSceneTap;
    if (callback == null || size.width <= 0 || size.height <= 0) return;
    // Convert the tap into normalized device coordinates (y up).
    final ndc = Offset(
      (details.localPosition.dx / size.width) * 2 - 1,
      1 - (details.localPosition.dy / size.height) * 2,
    );
    final hit = _controller.raycastAt(ndc);
    callback(widget.sceneId, hit ?? const {'modelId': null});
  }

  @override
  Widget build(BuildContext context) {
    Widget scene = widget.host.build(
      context,
      _controller,
      widget.config,
    );

    if (widget.onSceneTap != null) {
      final inner = scene;
      scene = Builder(
        builder: (gestureContext) => GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTapUp: (details) {
            final box = gestureContext.findRenderObject() as RenderBox?;
            if (box != null && box.hasSize) {
              _handleTapUp(details, box.size);
            }
          },
          child: inner,
        ),
      );
    }

    final width = _doubleOrNull(widget.config['width']);
    final height = _doubleOrNull(widget.config['height']);

    if (width != null || height != null) {
      return SizedBox(
        width: width,
        height: height,
        child: scene,
      );
    }

    // Without an explicit size the scene fills the constraints of the
    // nearest bounded ancestor — wrap the node in `expanded` inside flex
    // layouts, or place it as a non-positioned child of a `stack`.
    return scene;
  }

  static double? _doubleOrNull(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }
}
