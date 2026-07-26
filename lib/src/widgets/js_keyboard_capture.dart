import 'package:flutter/material.dart';

import 'package:js_widget_runtime/src/widgets/js_key_events.dart';

/// Keyboard capture wrapper for `jsr.onKey`.
///
/// Hosts that render a [JsonWidgetRenderer] tree directly (instead of using
/// [JsWidgetRuntimeWidget]) must wrap the rendered tree with this widget so
/// `jsr.onKey` handlers receive key events:
///
/// ```dart
/// JsKeyboardCapture(
///   onEvent: (payload) => engine.dispatchHostEvent('key', payload),
///   child: renderer.build(tree, context),
/// )
/// ```
///
/// Behavior:
/// - Claims keyboard focus on the first tap inside the subtree — embedded
///   hosts (boards, panels) otherwise leave primary focus empty and
///   keystrokes die before reaching the widget.
/// - Yields to editable text: while a `textField`/`textArea` node (or any
///   other [EditableText]) holds focus, key events are not intercepted.
class JsKeyboardCapture extends StatefulWidget {
  const JsKeyboardCapture({
    super.key,
    required this.onEvent,
    required this.child,
  });

  /// Receives the JSON payload for every key event: `{key, code, down, repeat}`.
  final void Function(Map<String, dynamic> payload) onEvent;

  final Widget child;

  @override
  State<JsKeyboardCapture> createState() => _JsKeyboardCaptureState();
}

class _JsKeyboardCaptureState extends State<JsKeyboardCapture> {
  final FocusNode _keyFocusNode = FocusNode();

  @override
  void dispose() {
    _keyFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) {
        if (!_keyFocusNode.hasFocus && !jsEditableTextHasFocus()) {
          _keyFocusNode.requestFocus();
        }
      },
      child: Focus(
        focusNode: _keyFocusNode,
        autofocus: true,
        onKeyEvent: (node, event) =>
            jsHandleRuntimeKeyEvent(event, widget.onEvent),
        child: widget.child,
      ),
    );
  }
}
