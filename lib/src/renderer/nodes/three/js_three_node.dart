import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_host.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_error_message.dart';

/// Visual mount for one upstream THREE canvas.
///
/// The prepared JS owns the object; this node owns only presentation, layout
/// and DOM-shaped host events. Internal engine/surface ids are stamped by
/// `jsr.three._prepareTree` immediately before render.
class JsThreeNode extends StatefulWidget {
  const JsThreeNode({
    required this.host,
    required this.config,
    this.onEvent,
    super.key,
  });

  final JsThreeHost host;
  final Map<String, dynamic> config;
  final void Function(String canvasId, Map<String, dynamic> event)? onEvent;

  @override
  State<JsThreeNode> createState() => _JsThreeNodeState();
}

class _JsThreeNodeState extends State<JsThreeNode> with WidgetsBindingObserver {
  JsThreeSurface? _surface;
  String? _error;
  Size _lastSize = Size.zero;
  double _lastDpr = 0;

  String get _canvasId => widget.config['canvasId'] as String? ?? 'main';
  String? get _engineId => widget.config['engineId'] as String?;
  String? get _surfaceId =>
      widget.config['surfaceId'] as String? ??
      widget.config['canvasId'] as String?;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _attach();
  }

  @override
  void didUpdateWidget(JsThreeNode oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.host != widget.host ||
        oldWidget.config['engineId'] != widget.config['engineId'] ||
        oldWidget.config['surfaceId'] != widget.config['surfaceId'] ||
        oldWidget.config['canvasId'] != widget.config['canvasId']) {
      _detach();
      _attach();
    }
  }

  void _attach() {
    final engineId = _engineId;
    final surfaceId = _surfaceId;
    if (engineId == null || engineId.isEmpty || surfaceId == null) {
      _error = 'three.unsupported: unprepared canvas';
      return;
    }
    try {
      _surface = widget.host.attach(engineId, surfaceId, widget.config);
      _error = null;
      _lastSize = Size.zero;
      _lastDpr = 0;
    } catch (error) {
      _surface = null;
      _error = error.toString();
    }
  }

  void _detach() {
    final surface = _surface;
    if (surface != null) {
      _send('pointercancel', pointerId: 0);
      _send('blur');
      widget.host.release(surface.engineId, surface.surfaceId);
      _surface = null;
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _detach();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final hidden = state != AppLifecycleState.resumed;
    _send('visibilitychange', hidden: hidden);
    if (hidden) _send('blur');
  }

  void _send(
    String type, {
    PointerEvent? pointer,
    int pointerId = 0,
    bool hidden = false,
  }) {
    final callback = widget.onEvent;
    if (callback == null) return;
    final payload = <String, dynamic>{
      'type': type,
      'pointerId': pointer?.pointer ?? pointerId,
      'hidden': hidden,
    };
    final event = pointer;
    if (event != null) {
      final position = event.localPosition;
      final buttons = event.buttons;
      payload.addAll({
        'pointerType': _pointerType(event.kind),
        'isPrimary': true,
        'button': _domButton(buttons),
        'buttons': buttons,
        'clientX': position.dx,
        'clientY': position.dy,
        'pageX': position.dx,
        'pageY': position.dy,
        'offsetX': position.dx,
        'offsetY': position.dy,
        'movementX': event.localDelta.dx,
        'movementY': event.localDelta.dy,
        'pressure': event.pressure,
        'timeStamp': event.timeStamp.inMicroseconds / 1000,
        if (event is PointerScrollEvent) ...{
          'deltaX': event.scrollDelta.dx,
          'deltaY': event.scrollDelta.dy,
          'deltaMode': 0,
        },
      });
    }
    callback(_canvasId, payload);
  }

  static String _pointerType(PointerDeviceKind kind) => switch (kind) {
    PointerDeviceKind.touch => 'touch',
    PointerDeviceKind.stylus || PointerDeviceKind.invertedStylus => 'pen',
    _ => 'mouse',
  };

  static int _domButton(int buttons) {
    if (buttons & kSecondaryMouseButton != 0) return 2;
    if (buttons & kMiddleMouseButton != 0) return 1;
    return 0;
  }

  void _resize(Size size, double dpr) {
    final surface = _surface;
    if (surface == null || surface.isDisposed) return;
    if (size == _lastSize && dpr == _lastDpr) return;
    _lastSize = size;
    _lastDpr = dpr;
    surface.resize(size, dpr);
    widget.onEvent?.call(_canvasId, {
      'type': 'resize',
      'width': size.width,
      'height': size.height,
      'pixelRatio': dpr,
      'devicePixelRatio': dpr,
    });
  }

  void _scheduleResize(Size size, double dpr) {
    if (size == _lastSize && dpr == _lastDpr) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _resize(size, dpr);
    });
  }

  @override
  Widget build(BuildContext context) {
    final surface = _surface;
    final width = _number(widget.config['width']);
    final height = _number(widget.config['height']);
    Widget child;
    if (surface == null) {
      child = ThreeErrorMessage(_error ?? 'three.unsupported');
    } else {
      child = AnimatedBuilder(
        animation: surface,
        builder: (context, _) => Listener(
          behavior: HitTestBehavior.opaque,
          onPointerDown: (event) {
            _send('focus');
            _send('pointerdown', pointer: event);
          },
          onPointerMove: (event) => _send('pointermove', pointer: event),
          onPointerUp: (event) => _send('pointerup', pointer: event),
          onPointerCancel: (event) => _send('pointercancel', pointer: event),
          onPointerHover: (event) => _send('pointermove', pointer: event),
          onPointerSignal: (event) {
            if (event is PointerScrollEvent) _send('wheel', pointer: event);
          },
          child: widget.host.build(context, surface, widget.config),
        ),
      );
    }
    final content = child;
    child = LayoutBuilder(
      builder: (context, constraints) {
        final dpr = View.of(context).devicePixelRatio;
        final effectiveWidth =
            width ?? (constraints.hasBoundedWidth ? constraints.maxWidth : 640);
        final effectiveHeight =
            height ??
            (constraints.hasBoundedHeight ? constraints.maxHeight : 360);
        final size = Size(effectiveWidth, effectiveHeight);
        if (surface != null) _scheduleResize(size, dpr);
        return SizedBox(
          width: effectiveWidth,
          height: effectiveHeight,
          child: content,
        );
      },
    );
    return child;
  }

  static double? _number(dynamic value) {
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }
}
