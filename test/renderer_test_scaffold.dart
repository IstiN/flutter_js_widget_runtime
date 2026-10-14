import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

/// Shared pump-and-build scaffold for the JsonWidgetRenderer suites.
/// One instance per test (create it in `setUp`) — events accumulate per
/// instance, `buildTree` pumps nothing by itself.
class RendererScaffold {
  /// Events fired through the default renderer this instance owns.
  final List<(String, Map<String, dynamic>)> events = [];

  /// The renderer under test (rebuilt per test via [reset]).
  late JsonWidgetRenderer renderer = _newRenderer();

  /// Re-creates the renderer and clears the event log.
  void reset() {
    events.clear();
    renderer = _newRenderer();
  }

  JsonWidgetRenderer _newRenderer() => JsonWidgetRenderer(
        onEvent: (id, payload) => events.add((id, payload)),
      );

  /// Builds [tree] inside a MaterialApp/Scaffold body. [width] pins the
  /// body width (adaptive/LayoutBuilder nodes); [hideText] renders the
  /// PPTX invisible-ink mode.
  Widget buildTree(
    Map<String, dynamic>? tree, {
    double? width,
    bool hideText = false,
    void Function(String, Map<String, dynamic>)? onGestureEvent,
  }) {
    final r = onGestureEvent != null
        ? JsonWidgetRenderer(
            onEvent: (id, payload) => events.add((id, payload)),
            onGestureEvent: onGestureEvent,
          )
        : (hideText
            ? JsonWidgetRenderer(
                onEvent: (id, payload) => events.add((id, payload)),
                hideText: true,
              )
            : renderer);
    final body = r.build(tree);
    return MaterialApp(
      home: Scaffold(
        body: width == null
            ? body
            : Center(child: SizedBox(width: width, child: body)),
      ),
    );
  }
}
