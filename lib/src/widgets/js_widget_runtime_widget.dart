import 'dart:async';

import 'package:flutter/material.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';

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
  /// Serializes engine lifecycles ACROSS widget instances. dispose() is
  /// fire-and-forget from the framework, so a ValueKey remount (module
  /// switch) starts the NEXT engine while the previous isolate QuickJS
  /// worker may still be mid-JS_Eval of its bundle — two concurrent evals
  /// starve each other, stretch past the shutdown ack window and force
  /// the kill(immediate) backstop mid-eval, corrupting the FFI callback
  /// registry (marker.cc SIGSEGV / FfiCallbackThreadChecks SIGABRT).
  /// Chaining every engine dispose and boot through one static future
  /// guarantees at most ONE live engine lifecycle at a time.
  static Future<void> _lifecycleGate = Future<void>.value();

  /// Completion mirror for [_lifecycleGate] (Future has no isCompleted):
  /// completed whenever the gate chain has settled.
  static Completer<void> _lifecycleGateDone = Completer<void>()..complete();

  JsWidgetEngine? _engine;
  int _generation = 0;
  Map<String, dynamic>? _uiTree;
  Size? _lastLayoutSize;
  Size? _reportedViewport;

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
    _generation++;
    final engine = _engine;
    _engine = null;
    if (engine != null) {
      _lifecycleGate = _lifecycleGate
          .then((_) => engine.dispose())
          .catchError((Object _) {});
      _lifecycleGateDone = Completer<void>();
      _lifecycleGate.whenComplete(() => _lifecycleGateDone.complete());
    }
    super.dispose();
  }

  Future<void> _start() async {
    final generation = ++_generation;
    // Skip the await when the gate is already complete: an extra microtask
    // hop before the engine exists changes first-pump timing for hosts and
    // tests (keyboard focus claim, blur dispatch). Serialization only
    // matters when a previous lifecycle is ACTUALLY in flight.
    if (!_lifecycleGateDone.isCompleted) await _lifecycleGate;
    if (generation != _generation) return;
    final engine = JsWidgetEngine(
      config: widget.config.copyWith(
        onRender: (tree) {
          if (generation != _generation) return;
          widget.config.onRender(tree);
          if (mounted) setState(() => _uiTree = tree);
        },
        onSetTitle: (title) {
          widget.config.onSetTitle(title);
        },
      ),
    );
    final previous = _engine;
    _engine = null;
    if (previous != null) {
      final chained = _lifecycleGate
          .then((_) => previous.dispose())
          .catchError((Object _) {});
      _lifecycleGate = chained;
      _lifecycleGateDone = Completer<void>();
      chained.whenComplete(() => _lifecycleGateDone.complete());
      await chained;
    }
    if (generation != _generation) {
      await engine.dispose();
      return;
    }
    _engine = engine;
    // The first layout usually happens while the engine is still starting,
    // so that viewport report is dropped (engine == null). Re-report the
    // last known size once the widget JS has booted.
    _reportedViewport = null;
    try {
      await engine.run(widget.jsSource);
      final size = _lastLayoutSize;
      // Force: an earlier dispatch may have raced the worker bootstrap
      // (dropped before __jsrHostEvent was defined).
      if (generation == _generation && mounted && size != null) {
        _reportViewport(size, force: true);
      }
    } catch (e, st) {
      if (generation == _generation) widget.onError?.call(e, st);
    }
  }

  /// Reports the allotted size to JS (`jsr.viewport()` / `jsr.onViewport`)
  /// whenever the layout constraints change — covers panels, full screen
  /// and fixed-size board tiles alike.
  void _reportViewport(Size size, {bool force = false}) {
    _lastLayoutSize = size;
    if (!force && _reportedViewport == size) return;
    _reportedViewport = size;
    final engine = _engine;
    if (engine == null) return;
    // Post-frame: the QuickJS backend executes JS synchronously, and a
    // synchronous render → setState during the build phase would throw.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      engine.dispatchHostEvent('viewport', {
        'width': size.width,
        'height': size.height,
      });
    });
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
        onGestureEvent: (actionId, payload) =>
            _engine?.dispatchHostEvent('gesture:$actionId', payload),
        js3dHost: widget.config.js3dHost,
        threeHost: widget.config.threeHost,
        onThreeEvent: (canvasId, payload) =>
            _engine?.dispatchHostEvent('three.input:$canvasId', payload),
        mediaHost: widget.config.mediaHost,
        webViewHost: widget.config.webViewHost,
        voxelWorld: _engine?.voxelWorld,
        onScene3dTap: (sceneId, payload) =>
            _engine?.dispatchHostEvent('scene3d.tap:$sceneId', payload),
      );
      content = renderer.build(tree, context);
    }
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.hasBoundedWidth && constraints.hasBoundedHeight) {
          _reportViewport(Size(constraints.maxWidth, constraints.maxHeight));
        }
        return JsKeyboardCapture(
          onEvent: (payload) => _engine?.dispatchHostEvent('key', payload),
          onBlur: () => _engine?.dispatchHostEvent(
            'three.blur',
            const <String, dynamic>{},
          ),
          child: content,
        );
      },
    );
  }
}
