import 'dart:math';

import 'package:flutter/material.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_node_helpers.dart';

/// Builds an SVG path stroke widget with optional progress animation.
///
/// Props:
/// - `path` (String, required): SVG path data.
/// - `progress` (double, 0..1, default 1.0): fraction of the path to draw.
/// - `color` (String): stroke color.
/// - `strokeWidth` (double, default 4): stroke width in logical pixels.
/// - `width` / `height`: optional explicit size.
/// - `cap` (`round`/`butt`/`square`, default `round`): stroke cap.
/// - `join` (`round`/`bevel`/`miter`, default `round`): stroke join.
Widget buildJsPathNode(Map<String, dynamic> m) {
  final path = m['path'] as String? ?? '';
  if (path.isEmpty) return const SizedBox.shrink();
  final progress = jsDouble(m['progress'], 1.0).clamp(0.0, 1.0);
  final color = parseColor(m['color'] as String?) ?? Colors.white;
  final strokeWidth = jsDouble(m['strokeWidth'], 4.0);
  final width = jsDoubleOrNull(m['width']);
  final height = jsDoubleOrNull(m['height']);
  final cap = _strokeCap(m['cap'] as String?);
  final join = _strokeJoin(m['join'] as String?);

  Widget child = CustomPaint(
    painter: JsPathPainter(
      path: path,
      progress: progress,
      color: color,
      strokeWidth: strokeWidth,
      cap: cap,
      join: join,
    ),
    size: Size.infinite,
  );

  if (width != null || height != null) {
    child = SizedBox(width: width, height: height, child: child);
  }
  return child;
}

/// Custom painter that strokes an SVG path, optionally up to [progress].
class JsPathPainter extends CustomPainter {
  JsPathPainter({
    required this.path,
    required this.progress,
    required this.color,
    required this.strokeWidth,
    required this.cap,
    required this.join,
  });

  final String path;
  final double progress;
  final Color color;
  final double strokeWidth;
  final StrokeCap cap;
  final StrokeJoin join;

  @override
  void paint(Canvas canvas, Size size) {
    if (progress <= 0) return;

    Path? source;
    try {
      source = Path()..addPath(parseSvgPathData(path), Offset.zero);
    } on Object {
      // Invalid path data: nothing to draw.
      return;
    }
    // Scale the path to fit the canvas while preserving aspect ratio. The
    // stroke extends `strokeWidth / 2` beyond the path bounds, so inset the
    // available area by the stroke width to keep the stroke inside the box.
    final bounds = source.getBounds();
    if (bounds.isEmpty) return;

    final availW = max(1.0, size.width - strokeWidth);
    final availH = max(1.0, size.height - strokeWidth);
    final scaleX = bounds.width > 0 ? availW / bounds.width : 1.0;
    final scaleY = bounds.height > 0 ? availH / bounds.height : 1.0;
    final scale = min(scaleX, scaleY);

    final scaledWidth = bounds.width * scale;
    final scaledHeight = bounds.height * scale;
    final dx = (size.width - scaledWidth) / 2 - bounds.left * scale;
    final dy = (size.height - scaledHeight) / 2 - bounds.top * scale;

    final matrix = Matrix4.identity()
      ..translateByDouble(dx, dy, 0, 1)
      ..scaleByDouble(scale, scale, 1, 1);
    source = source.transform(matrix.storage);

    final drawPath = Path();
    final metrics = source.computeMetrics().toList();
    final totalLength = metrics.fold<double>(0, (sum, m) => sum + m.length);
    if (totalLength <= 0) return;

    var targetLength = totalLength * progress;
    for (final metric in metrics) {
      final length = metric.length;
      if (targetLength <= 0) break;
      final segmentLength = min(length, targetLength);
      final segment = metric.extractPath(0, segmentLength);
      drawPath.addPath(segment, Offset.zero);
      targetLength -= segmentLength;
    }

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth / scale
      ..strokeCap = cap
      ..strokeJoin = join;

    canvas.drawPath(drawPath, paint);
  }

  @override
  bool shouldRepaint(covariant JsPathPainter old) =>
      old.path != path ||
      old.progress != progress ||
      old.color != color ||
      old.strokeWidth != strokeWidth ||
      old.cap != cap ||
      old.join != join;
}

/// Minimal SVG path data parser.
///
/// Supports the most common commands: M/m, L/l, H/h, V/v, C/c, S/s, Q/q, T/t,
/// Z/z, A/a. Converts the data into a [Path].
Path parseSvgPathData(String data) {
  final path = Path();
  final tokens = _tokenize(data);
  var i = 0;

  double currentX = 0;
  double currentY = 0;
  double? startX;
  double? startY;
  double? lastCubicX2;
  double? lastCubicY2;
  double? lastQuadX;
  double? lastQuadY;

  double parseNum() => double.parse(tokens[i++]);

  while (i < tokens.length) {
    final token = tokens[i++];
    if (token.isEmpty) continue;

    final command = token[token.length - 1];
    final isRelative = command == command.toLowerCase();

    void moveTo(double x, double y) {
      if (isRelative) {
        currentX += x;
        currentY += y;
      } else {
        currentX = x;
        currentY = y;
      }
      path.moveTo(currentX, currentY);
      startX = currentX;
      startY = currentY;
    }

    void lineTo(double x, double y) {
      if (isRelative) {
        currentX += x;
        currentY += y;
      } else {
        currentX = x;
        currentY = y;
      }
      path.lineTo(currentX, currentY);
    }

    switch (command.toUpperCase()) {
      case 'M':
        moveTo(parseNum(), parseNum());
        // Subsequent coordinate pairs after M are treated as implicit lineTo.
        while (i < tokens.length && !_isCommand(tokens[i])) {
          lineTo(parseNum(), parseNum());
        }
      case 'L':
        lineTo(parseNum(), parseNum());
      case 'H':
        final x = parseNum();
        lineTo(isRelative ? x : x - currentX, isRelative ? 0 : currentY);
      case 'V':
        final y = parseNum();
        lineTo(isRelative ? 0 : currentX, isRelative ? y : y - currentY);
      case 'C':
        final x1 = parseNum();
        final y1 = parseNum();
        final x2 = parseNum();
        final y2 = parseNum();
        final x = parseNum();
        final y = parseNum();
        double ax1, ay1, ax2, ay2, ax, ay;
        if (isRelative) {
          ax1 = currentX + x1;
          ay1 = currentY + y1;
          ax2 = currentX + x2;
          ay2 = currentY + y2;
          ax = currentX + x;
          ay = currentY + y;
        } else {
          ax1 = x1;
          ay1 = y1;
          ax2 = x2;
          ay2 = y2;
          ax = x;
          ay = y;
        }
        path.cubicTo(ax1, ay1, ax2, ay2, ax, ay);
        lastCubicX2 = ax2;
        lastCubicY2 = ay2;
        currentX = ax;
        currentY = ay;
      case 'S':
        final x2 = parseNum();
        final y2 = parseNum();
        final x = parseNum();
        final y = parseNum();
        final ax2 = isRelative ? currentX + x2 : x2;
        final ay2 = isRelative ? currentY + y2 : y2;
        final ax = isRelative ? currentX + x : x;
        final ay = isRelative ? currentY + y : y;
        final ax1 = lastCubicX2 != null
            ? currentX * 2 - lastCubicX2
            : currentX;
        final ay1 = lastCubicY2 != null
            ? currentY * 2 - lastCubicY2
            : currentY;
        path.cubicTo(ax1, ay1, ax2, ay2, ax, ay);
        lastCubicX2 = ax2;
        lastCubicY2 = ay2;
        currentX = ax;
        currentY = ay;
      case 'Q':
        final x1 = parseNum();
        final y1 = parseNum();
        final x = parseNum();
        final y = parseNum();
        final ax1 = isRelative ? currentX + x1 : x1;
        final ay1 = isRelative ? currentY + y1 : y1;
        final ax = isRelative ? currentX + x : x;
        final ay = isRelative ? currentY + y : y;
        path.quadraticBezierTo(ax1, ay1, ax, ay);
        lastQuadX = ax1;
        lastQuadY = ay1;
        currentX = ax;
        currentY = ay;
      case 'T':
        final x = parseNum();
        final y = parseNum();
        final ax = isRelative ? currentX + x : x;
        final ay = isRelative ? currentY + y : y;
        final ax1 = lastQuadX != null
            ? currentX * 2 - lastQuadX
            : currentX;
        final ay1 = lastQuadY != null
            ? currentY * 2 - lastQuadY
            : currentY;
        path.quadraticBezierTo(ax1, ay1, ax, ay);
        lastQuadX = ax1;
        lastQuadY = ay1;
        currentX = ax;
        currentY = ay;
      case 'A':
        final rx = parseNum().abs();
        final ry = parseNum().abs();
        final phi = parseNum() * pi / 180;
        final largeArc = parseNum() != 0;
        final sweep = parseNum() != 0;
        var x = parseNum();
        var y = parseNum();
        if (isRelative) {
          x += currentX;
          y += currentY;
        }
        _arcTo(path, currentX, currentY, rx, ry, phi, largeArc, sweep, x, y);
        currentX = x;
        currentY = y;
      case 'Z':
        path.close();
        if (startX != null && startY != null) {
          currentX = startX!;
          currentY = startY!;
        }
      default:
        // Unknown command: skip.
        break;
    }
  }

  return path;
}

/// Converts an SVG elliptical arc (endpoint parameterization, spec F.6.5)
/// into cubic Bézier segments appended to [path]. The path's current point
/// must be (x0, y0); the arc ends at (x, y).
void _arcTo(
  Path path,
  double x0,
  double y0,
  double rx,
  double ry,
  double phi,
  bool largeArc,
  bool sweep,
  double x,
  double y,
) {
  if (rx == 0 || ry == 0 || (x0 == x && y0 == y)) {
    path.lineTo(x, y);
    return;
  }
  final cosPhi = cos(phi);
  final sinPhi = sin(phi);

  // Step 1: transform the endpoints into prime (rotated) coordinates.
  final dx2 = (x0 - x) / 2;
  final dy2 = (y0 - y) / 2;
  final x1p = cosPhi * dx2 + sinPhi * dy2;
  final y1p = -sinPhi * dx2 + cosPhi * dy2;

  // Step 2: scale the radii up if they are too small for the endpoints.
  var rxx = rx;
  var ryy = ry;
  final lambda = (x1p * x1p) / (rxx * rxx) + (y1p * y1p) / (ryy * ryy);
  if (lambda > 1) {
    final s = sqrt(lambda);
    rxx *= s;
    ryy *= s;
  }

  // Step 3: ellipse center in prime coordinates.
  final rx2 = rxx * rxx;
  final ry2 = ryy * ryy;
  final x1p2 = x1p * x1p;
  final y1p2 = y1p * y1p;
  final denom = rx2 * y1p2 + ry2 * x1p2;
  final radicand = denom == 0
      ? 0.0
      : max(0.0, (rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2) / denom);
  final coef = (largeArc == sweep ? -1 : 1) * sqrt(radicand);
  final cxp = coef * rxx * y1p / ryy;
  final cyp = -coef * ryy * x1p / rxx;

  // Step 4: center back in the original coordinate system.
  final cx = cosPhi * cxp - sinPhi * cyp + (x0 + x) / 2;
  final cy = sinPhi * cxp + cosPhi * cyp + (y0 + y) / 2;

  // Step 5: start angle and angular sweep of the arc.
  double angle(double ux, double uy, double vx, double vy) {
    final dot = ux * vx + uy * vy;
    final len = sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
    var a = acos((dot / len).clamp(-1.0, 1.0));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  }

  final theta1 = angle(1, 0, (x1p - cxp) / rxx, (y1p - cyp) / ryy);
  var dTheta = angle(
    (x1p - cxp) / rxx,
    (y1p - cyp) / ryy,
    (-x1p - cxp) / rxx,
    (-y1p - cyp) / ryy,
  );
  if (!sweep && dTheta > 0) dTheta -= 2 * pi;
  if (sweep && dTheta < 0) dTheta += 2 * pi;

  // Step 6: approximate with cubic segments of at most 90 degrees.
  final segments = max(1, (dTheta.abs() / (pi / 2)).ceil());
  final delta = dTheta / segments;
  final kappa = 4 / 3 * tan(delta / 4);
  double tx(double px, double py) => cosPhi * px - sinPhi * py + cx;
  double ty(double px, double py) => sinPhi * px + cosPhi * py + cy;
  for (var j = 0; j < segments; j++) {
    final t1 = theta1 + j * delta;
    final t2 = t1 + delta;
    final p1x = rxx * cos(t1);
    final p1y = ryy * sin(t1);
    final p2x = rxx * cos(t2);
    final p2y = ryy * sin(t2);
    final c1x = p1x - kappa * rxx * sin(t1);
    final c1y = p1y + kappa * ryy * cos(t1);
    final c2x = p2x + kappa * rxx * sin(t2);
    final c2y = p2y - kappa * ryy * cos(t2);
    path.cubicTo(
      tx(c1x, c1y),
      ty(c1x, c1y),
      tx(c2x, c2y),
      ty(c2x, c2y),
      tx(p2x, p2y),
      ty(p2x, p2y),
    );
  }
}

bool _isCommand(String token) {
  if (token.isEmpty) return false;
  final c = token[token.length - 1];
  return 'MmLlHhVvCcSsQqTtZzAa'.contains(c);
}

List<String> _tokenize(String data) {
  // Insert spaces around command letters and commas, then split.
  final buffer = StringBuffer();
  for (var i = 0; i < data.length; i++) {
    final c = data[i];
    if ('MmLlHhVvCcSsQqTtZzAa'.contains(c)) {
      buffer.write(' $c ');
    } else if (c == ',' || c == '\n' || c == '\r' || c == '\t') {
      buffer.write(' ');
    } else {
      buffer.write(c);
    }
  }
  return buffer
      .toString()
      .trim()
      .split(RegExp(r'\s+'))
      .where((s) => s.isNotEmpty)
      .toList();
}

StrokeCap _strokeCap(String? cap) => switch (cap) {
  'butt' => StrokeCap.butt,
  'square' => StrokeCap.square,
  _ => StrokeCap.round,
};

StrokeJoin _strokeJoin(String? join) => switch (join) {
  'bevel' => StrokeJoin.bevel,
  'miter' => StrokeJoin.miter,
  _ => StrokeJoin.round,
};


