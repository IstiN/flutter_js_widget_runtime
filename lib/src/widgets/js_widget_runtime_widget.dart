import 'package:flutter/material.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/widgets/js_key_events.dart';

/// Runs a JavaScript widget and renders its declarative JSON UI tree.
///
/// The host must provide [config] with at least [JsRuntimeConfig.onRender],
/// [JsRuntimeConfig.onSetTitle] and [JsRuntimeConfig.onStorageUpdate]. All
/// other I/O is optional; defaults are used when omitted.
class JsWidgetRuntimeWidget extends StatefulWidget {
  const JsWidgetRuntimeWidget({
    super.key,
    required this.jsSource,
    required this.config,
    this.onError,
  });

  /// JavaScript source code to evaluate.
  final String jsSource;

  /// Runtime configuration and injected handlers.
  final JsRuntimeConfig config;

  /// Optional error callback.
  final void Function(Object error, StackTrace stackTrace)? onError;

  @override
  State<JsWidgetRuntimeWidget> createState() => _JsWidgetRuntimeWidgetState();
}

class _JsWidgetRuntimeWidgetState extends State<JsWidgetRuntimeWidget> {
  JsWidgetEngine? _engine;
  Map<String, dynamic>? _uiTree;
  final FocusNode _keyFocusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _start();
  }

  @override
  void didUpdateWidget(covariant JsWidgetRuntimeWidget old) {
    super.didUpdateWidget(old);
    if (widget.jsSource != old.jsSource || widget.config != old.config) {
      _start();
    }
  }

  @override
  void dispose() {
    _keyFocusNode.dispose();
    _engine?.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    final engine = JsWidgetEngine(
      config: widget.config.copyWith(
        onRender: (tree) {
          widget.config.onRender(tree);
          if (mounted) setState(() => _uiTree = tree);
        },
        onSetTitle: (title) {
          widget.config.onSetTitle(title);
        },
      ),
    );
    await _engine?.dispose();
    _engine = engine;
    try {
      await engine.run(widget.jsSource);
    } catch (e, st) {
      widget.onError?.call(e, st);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tree = _uiTree;
    final Widget content;
    if (tree == null) {
      content = const Center(child: CircularProgressIndicator());
    } else {
      final renderer = JsonWidgetRenderer(
        onEvent: (actionId, payload) => _engine?.callEvent(actionId, payload),
        js3dHost: widget.config.js3dHost,
        onScene3dTap: (sceneId, payload) =>
            _engine?.dispatchHostEvent('scene3d.tap:$sceneId', payload),
      );
      content = renderer.build(tree, context);
    }
    // Keyboard capture for `jsr.onKey`. The handler only fires when this
    // subtree holds focus and no editable text field is focused, so
    // `textField`/`textArea` nodes keep receiving their keystrokes.
    // `autofocus` alone is not enough in embedded hosts (boards, panels):
    // the first tap anywhere inside the widget explicitly claims focus,
    // otherwise keystrokes die with no primary focus at all.
    return Listener(
      onPointerDown: (_) {
        if (!_keyFocusNode.hasFocus && !jsEditableTextHasFocus()) {
          _keyFocusNode.requestFocus();
        }
      },
      child: Focus(
        focusNode: _keyFocusNode,
        autofocus: true,
        onKeyEvent: (node, event) => jsHandleRuntimeKeyEvent(
          event,
          (payload) => _engine?.dispatchHostEvent('key', payload),
        ),
        child: content,
      ),
    );
  }
}
