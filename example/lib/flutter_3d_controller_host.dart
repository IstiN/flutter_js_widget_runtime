import 'package:flutter/material.dart';
import 'package:flutter_3d_controller/flutter_3d_controller.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

/// A [Js3dHost] implementation backed by the `flutter_3d_controller` package.
///
/// Supports GLB/GLTF models, animations, camera orbit/target and auto-rotation.
/// This is intended as a demo/reference integration; hosts can swap in Flame 3D,
/// three_dart, or any other engine by implementing [Js3dHost].
class Flutter3dControllerHost extends Js3dHost {
  const Flutter3dControllerHost();

  @override
  Js3dController createController(
    String sceneId,
    Map<String, dynamic> config,
  ) =>
      _Flutter3dJsController(sceneId, config);

  @override
  Widget build(
    BuildContext context,
    Js3dController controller,
    Map<String, dynamic> config,
  ) {
    final c = controller as _Flutter3dJsController;
    return ListenableBuilder(
      listenable: c,
      builder: (context, _) {
        final src = c.currentSrc;
        if (src == null || src.isEmpty) {
          return Container(
            color: Colors.black12,
            alignment: Alignment.center,
            child: const Text('Add a model to the 3D scene'),
          );
        }
        return Flutter3DViewer(
          controller: c.flutterController,
          src: src,
          progressBarColor: Colors.transparent,
          enableTouch: config['enableTouch'] as bool? ?? true,
        );
      },
    );
  }
}

class _Flutter3dJsController extends Js3dController {
  _Flutter3dJsController(this.sceneId, this.config);

  final String sceneId;
  final Map<String, dynamic> config;
  final Flutter3DController flutterController = Flutter3DController();
  String? currentSrc;

  @override
  void apply(Js3dCommand command) {
    final payload = command.payload ?? {};
    switch (command.kind) {
      case 'addModel':
        final src = payload['src'] as String?;
        if (src != null && src.isNotEmpty) {
          currentSrc = src;
          notifyListeners();
        }
      case 'removeModel':
        currentSrc = null;
        notifyListeners();
      case 'playAnimation':
        final name = payload['animationName'] as String?;
        flutterController.playAnimation(animationName: name);
      case 'stopAnimation':
        flutterController.stopAnimation();
      case 'setTransform':
        // flutter_3d_controller does not expose per-model transforms; we map
        // scale/rotation requests to camera orbit as a best-effort demo.
        final transform = payload['transform'] as Map? ?? {};
        final rotation = transform['rotation'];
        if (rotation is List && rotation.length >= 2) {
          final theta = (rotation[0] as num).toDouble();
          final phi = (rotation[1] as num).toDouble();
          flutterController.setCameraOrbit(theta, phi, 4);
        }
      case 'setCamera':
        final orbit = payload['orbit'];
        if (orbit is List && orbit.length >= 3) {
          flutterController.setCameraOrbit(
            (orbit[0] as num).toDouble(),
            (orbit[1] as num).toDouble(),
            (orbit[2] as num).toDouble(),
          );
        }
        final target = payload['target'];
        if (target is List && target.length >= 3) {
          flutterController.setCameraTarget(
            (target[0] as num).toDouble(),
            (target[1] as num).toDouble(),
            (target[2] as num).toDouble(),
          );
        }
      case 'setLight':
      // flutter_3d_controller does not expose lighting controls.
    }
  }

  @override
  void dispose() {
    // flutter_3d_controller's controller does not expose a public dispose.
    super.dispose();
  }
}
