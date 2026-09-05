import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_node_helpers.dart';

/// Declarative shape nodes (`rect`, `circle`, `line`, `polygon`) — pure
/// CustomPaint work introduced for the Motion-Canvas port (yoclip#1), useful
/// to any widget. Pinned semantics:
///
/// - `rect` — `{width, height, radius?, fill, stroke?, strokeWidth?,
///   opacity?}`; widget is exactly width x height, the stroke is drawn
///   INSIDE the box (Flutter Container semantics).
/// - `circle` — `{size, fill, stroke?, strokeWidth?, opacity?}`; intrinsic
///   size x size.
/// - `line` — `{x1, y1, x2, y2, stroke, strokeWidth? (default 2), opacity?}`;
///   the only canonical form (length/angle is derivable in JS). Sizes to the
///   tight bounds of the geometry plus the stroke inset.
/// - `polygon` — `{points, fill, stroke?, strokeWidth?, opacity?}`;
///   `points` is a FLAT array `[x1, y1, x2, y2, ...]` (SVG polyline
///   convention); needs >= 3 complete pairs; sizes to tight bounds + inset.
///
/// All shapes are painted at the origin of their own node; missing fill AND
/// stroke renders `SizedBox.shrink` (invisible). `opacity` multiplies the
/// alpha of both inks.
///
/// JS example:
/// ```js
/// jsr.render({ type: 'rect', width: 120, height: 40, radius: 8,
///   fill: t.accent, opacity: jsr.motion.tween(now, t0, 300, 0, 1) });
/// ```

/// Resolved paint inks shared by the shape builders.
class _ShapeInk {
  const _ShapeInk({this.fill, this.stroke, required this.strokeWidth});

  final Color? fill;
  final Color? stroke;
  final double strokeWidth;
}

/// Parses the common fill/stroke/strokeWidth/opacity props. Returns null
/// when nothing would be painted.
_ShapeInk? _shapeInk(
  Map<String, dynamic> m, {
  double defaultStrokeWidth = 0,
  String strokeKey = 'stroke',
}) {
  final opacity = jsDouble(m['opacity'], 1.0).clamp(0.0, 1.0);
  final strokeWidth = jsDouble(
    m['strokeWidth'],
    defaultStrokeWidth,
  ).clamp(0.0, double.infinity);
  final fill = _tint(parseColor(m['fill'] as String?), opacity);
  final stroke = strokeWidth > 0
      ? _tint(parseColor(m[strokeKey] as String?), opacity)
      : null;
  if (fill == null && stroke == null) return null;
  return _ShapeInk(fill: fill, stroke: stroke, strokeWidth: strokeWidth);
}

Color? _tint(Color? color, double opacity) => color == null
    ? null
    : color.withValues(alpha: color.a * opacity);

Widget buildJsRectNode(Map<String, dynamic> m) {
  final width = jsDoubleOrNull(m['width']);
  final height = jsDoubleOrNull(m['height']);
  if (width == null || height == null || width <= 0 || height <= 0) {
    return const SizedBox.shrink();
  }
  final ink = _shapeInk(m);
  if (ink == null) return const SizedBox.shrink();
  final radius = jsDouble(m['radius'], 0).clamp(0.0, double.infinity);
  return CustomPaint(
    size: Size(width, height),
    painter: JsRectPainter(
      radius: radius,
      fill: ink.fill,
      stroke: ink.stroke,
      strokeWidth: ink.strokeWidth,
    ),
  );
}

Widget buildJsCircleNode(Map<String, dynamic> m) {
  final size = jsDoubleOrNull(m['size']);
  if (size == null || size <= 0) return const SizedBox.shrink();
  final ink = _shapeInk(m);
  if (ink == null) return const SizedBox.shrink();
  return CustomPaint(
    size: Size(size, size),
    painter: JsCirclePainter(
      fill: ink.fill,
      stroke: ink.stroke,
      strokeWidth: ink.strokeWidth,
    ),
  );
}

Widget buildJsLineNode(Map<String, dynamic> m) {
  final x1 = jsDoubleOrNull(m['x1']);
  final y1 = jsDoubleOrNull(m['y1']);
  final x2 = jsDoubleOrNull(m['x2']);
  final y2 = jsDoubleOrNull(m['y2']);
  if (x1 == null || y1 == null || x2 == null || y2 == null) {
    return const SizedBox.shrink();
  }
  final ink = _shapeInk(m, defaultStrokeWidth: 2);
  if (ink == null || ink.stroke == null) return const SizedBox.shrink();
  final bounds = _OriginBounds.fromPoints([
    math.Point(x1, y1),
    math.Point(x2, y2),
  ], ink.strokeWidth);
  return CustomPaint(
    size: bounds.size,
    painter: JsLinePainter(
      start: Offset(x1, y1),
      end: Offset(x2, y2),
      origin: bounds.origin,
      stroke: ink.stroke!,
      strokeWidth: ink.strokeWidth,
    ),
  );
}

Widget buildJsPolygonNode(Map<String, dynamic> m) {
  final points = _doubleList(m['points']);
  if (points.length < 6) return const SizedBox.shrink(); // < 3 complete pairs
  final ink = _shapeInk(m);
  if (ink == null) return const SizedBox.shrink();
  final pairs = <math.Point<double>>[
    for (var i = 0; i + 1 < points.length; i += 2)
      math.Point(points[i], points[i + 1]),
  ];
  final bounds = _OriginBounds.fromPoints(pairs, ink.strokeWidth);
  return CustomPaint(
    size: bounds.size,
    painter: JsPolygonPainter(
      // Trailing odd coordinate (if any) is ignored.
      points: [for (final p in pairs) Offset(p.x, p.y)],
      origin: bounds.origin,
      fill: ink.fill,
      stroke: ink.stroke,
      strokeWidth: ink.strokeWidth,
    ),
  );
}

/// Flattens a flat points array into doubles, dropping non-numeric entries
/// (tolerates numeric strings from LLM-generated input).
List<double> _doubleList(dynamic v) {
  if (v is! List) return const <double>[];
  final out = <double>[];
  for (final e in v) {
    final d = e is num
        ? e.toDouble()
        : (e is String ? double.tryParse(e) : null);
    if (d != null) out.add(d);
  }
  return out;
}

/// Tight bounds of a set of points in the node's own coordinate space.
/// The widget size expands by [strokeWidth] so a centered stroke stays
/// fully visible; [origin] maps the geometry's top-left to that inset.
class _OriginBounds {
  _OriginBounds.fromPoints(List<math.Point<double>> points, this.strokeWidth) {
    var minX = points.first.x.toDouble();
    var minY = points.first.y.toDouble();
    var maxX = minX;
    var maxY = minY;
    for (final p in points) {
      minX = math.min(minX, p.x);
      minY = math.min(minY, p.y);
      maxX = math.max(maxX, p.x);
      maxY = math.max(maxY, p.y);
    }
    left = minX;
    top = minY;
    size = Size(maxX - minX + strokeWidth, maxY - minY + strokeWidth);
  }

  final double strokeWidth;
  late final double left;
  late final double top;
  late final Size size;

  /// Canvas offset that maps geometry (left, top) to the stroke inset.
  Offset get origin => Offset(-left, -top);
}

/// Shared paint helpers for the stroked shapes (line, polygon): geometry
/// is expressed in the node's own space; the canvas is translated so the
/// tight bounds start at half a stroke width inside the widget.
mixin _StrokedShapePaint on CustomPainter {
  Offset get origin;
  double get strokeWidth;

  /// Applies the origin translation to [canvas].
  void applyOrigin(Canvas canvas) {
    final inset = Offset(strokeWidth / 2, strokeWidth / 2);
    canvas.translate(origin.dx + inset.dx, origin.dy + inset.dy);
  }

  Paint? fillPaint(Color? color) =>
      color == null ? null : (Paint()..color = color);

  Paint? strokePaint(Color? color) =>
      color == null
          ? null
          : (Paint()
            ..color = color
            ..style = PaintingStyle.stroke
            ..strokeCap = StrokeCap.round
            ..strokeJoin = StrokeJoin.round
            ..strokeWidth = strokeWidth);
}

/// `rect` painter: fill + optional inside stroke over a rounded rect.
class JsRectPainter extends CustomPainter {
  JsRectPainter({
    required this.radius,
    required this.fill,
    required this.stroke,
    required this.strokeWidth,
  });

  final double radius;
  final Color? fill;
  final Color? stroke;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final inset = strokeWidth / 2;
    final rect = (Offset.zero & size).deflate(inset);
    final effectiveRadius = math.max(0.0, radius - inset);
    final rrect = RRect.fromRectAndRadius(
      rect,
      Radius.circular(math.min(effectiveRadius, rect.shortestSide / 2)),
    );
    final fillPaint = fill == null
        ? null
        : (Paint()..color = fill!);
    if (fillPaint != null) canvas.drawRRect(rrect, fillPaint);
    final strokePaint = stroke == null || strokeWidth <= 0
        ? null
        : (Paint()
          ..color = stroke!
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth);
    if (strokePaint != null) canvas.drawRRect(rrect, strokePaint);
  }

  @override
  bool shouldRepaint(covariant JsRectPainter old) =>
      old.radius != radius ||
      old.fill != fill ||
      old.stroke != stroke ||
      old.strokeWidth != strokeWidth;
}

/// `circle` painter: fill + optional inside stroke, centered in the box.
class JsCirclePainter extends CustomPainter {
  JsCirclePainter({
    required this.fill,
    required this.stroke,
    required this.strokeWidth,
  });

  final Color? fill;
  final Color? stroke;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = math.max(0.0, size.shortestSide / 2 - strokeWidth / 2);
    if (fill != null) {
      canvas.drawCircle(center, radius, Paint()..color = fill!);
    }
    if (stroke != null && strokeWidth > 0) {
      canvas.drawCircle(
        center,
        radius,
        Paint()
          ..color = stroke!
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth,
      );
    }
  }

  @override
  bool shouldRepaint(covariant JsCirclePainter old) =>
      old.fill != fill || old.stroke != stroke || old.strokeWidth != strokeWidth;
}

/// `line` painter: round-capped segment between two points.
class JsLinePainter extends CustomPainter with _StrokedShapePaint {
  JsLinePainter({
    required this.start,
    required this.end,
    required this.origin,
    required this.stroke,
    required this.strokeWidth,
  });

  final Offset start;
  final Offset end;
  @override
  final Offset origin;
  final Color stroke;
  @override
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    applyOrigin(canvas);
    final paint = strokePaint(stroke);
    if (paint != null) canvas.drawLine(start, end, paint);
  }

  @override
  bool shouldRepaint(covariant JsLinePainter old) =>
      old.start != start ||
      old.end != end ||
      old.origin != origin ||
      old.stroke != stroke ||
      old.strokeWidth != strokeWidth;
}

/// `polygon` painter: closed flat-point polygon with optional fill.
class JsPolygonPainter extends CustomPainter with _StrokedShapePaint {
  JsPolygonPainter({
    required this.points,
    required this.origin,
    required this.fill,
    required this.stroke,
    required this.strokeWidth,
  });

  final List<Offset> points;
  @override
  final Offset origin;
  final Color? fill;
  final Color? stroke;
  @override
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    applyOrigin(canvas);
    final path = Path()..addPolygon(points, true);
    final fp = fillPaint(fill);
    if (fp != null) canvas.drawPath(path, fp);
    final sp = strokePaint(stroke);
    if (sp != null) canvas.drawPath(path, sp);
  }

  @override
  bool shouldRepaint(covariant JsPolygonPainter old) =>
      old.points != points ||
      old.origin != origin ||
      old.fill != fill ||
      old.stroke != stroke ||
      old.strokeWidth != strokeWidth;
}

