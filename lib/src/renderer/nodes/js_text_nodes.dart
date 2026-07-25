part of '../json_widget_renderer.dart';

/// Text and display node builders for [JsonWidgetRenderer]: text,
/// markdown, icons, chips, badges, list tiles, progress indicators, and
/// the built-in sparkline/bar chart painters.
extension on JsonWidgetRenderer {
  // ── Display ───────────────────────────────────────────────────────────────

  Widget _text(Map<String, dynamic> m) {
    var data = (m['data'] ?? m['text'] ?? '').toString();
    final styleMap = m['style'] as Map?;
    final style = _textStyle(styleMap);
    final align = _textAlign(
      m['textAlign'] as String? ??
          (m['style'] as Map?)?['textAlign'] as String?,
    );
    final maxLines = m['maxLines'] as int?;
    final overflow = _overflow(m['overflow'] as String?);
    final textTransform = (m['style'] as Map?)?['textTransform'] as String?;
    if (textTransform == 'uppercase') data = data.toUpperCase();
    if (textTransform == 'lowercase') data = data.toLowerCase();
    Widget textWidget = Text(
      data,
      style: style,
      textAlign: align,
      maxLines: maxLines,
      overflow: overflow,
    );
    final gradient = _gradient(styleMap?['gradient'] as Map?);
    if (gradient != null) {
      textWidget = ShaderMask(
        shaderCallback: (bounds) => gradient.createShader(bounds),
        blendMode: BlendMode.srcIn,
        child: textWidget,
      );
    }

    final family = style?.fontFamily;
    final fontResolver = this.fontResolver;
    if (family != null && family.isNotEmpty && fontResolver != null) {
      return FutureBuilder<Uint8List>(
        future: fontResolver(family),
        builder: (context, snapshot) {
          if (snapshot.hasData) {
            unawaited(JsFontLoader.loadFont(family, snapshot.data!));
          }
          return textWidget;
        },
      );
    }

    return textWidget;
  }

  Widget _icon(Map<String, dynamic> m) {
    final name = m['name'] as String? ?? m['icon'] as String? ?? '';
    final size = _double(m['size'], 24);
    final color = _color(m['color'] as String?);
    // Emoji / unicode strings pass through as Text
    if (name.runes.any((r) => r > 127)) {
      return Text(name, style: TextStyle(fontSize: size));
    }
    return Icon(_iconData(name), size: size, color: color);
  }

  Widget _divider(Map<String, dynamic> m) => Divider(
    color:
        _color(m['color'] as String?) ??
        _effectiveTheme.divider.withValues(alpha: 0.6),
    thickness: _double(m['thickness'], 1),
    height: _double(m['height'], 16),
    indent: _double(m['indent'], 0),
    endIndent: _double(m['endIndent'], 0),
  );

  Widget _spinner(Map<String, dynamic> m) => SizedBox(
    width: _double(m['size'], 24),
    height: _double(m['size'], 24),
    child: CircularProgressIndicator(
      strokeWidth: _double(m['strokeWidth'], 2),
      color: _color(m['color'] as String?),
    ),
  );

  Widget _linearProgress(Map<String, dynamic> m) => LinearProgressIndicator(
    value: _doubleOrNull(m['value']),
    minHeight: _double(m['height'], 4),
    color: _color(m['color'] as String?),
    backgroundColor: _color(m['backgroundColor'] as String?),
  );

  Widget _listTile(Map<String, dynamic> m) {
    final title = (m['title'] ?? m['data'] ?? m['label'] ?? '').toString();
    final subtitle = m['subtitle'] as String?;
    final leading = _childFromKey(m, 'leading');
    final trailing = _childFromKey(m, 'trailing');
    return ListTile(
      dense: m['dense'] as bool? ?? false,
      enabled: m['enabled'] as bool? ?? true,
      title: Text(title),
      subtitle: subtitle == null ? null : Text(subtitle),
      leading: leading,
      trailing: trailing,
      onTap: _tapHandler(m['onTap'] ?? m['onPress'], m['payload']),
    );
  }

  Widget? _childFromKey(Map<String, dynamic> m, String key) {
    final raw = m[key];
    if (raw is Map) return _build(raw);
    if (raw is String && raw.isNotEmpty) {
      return Icon(_iconData(raw), size: 20);
    }
    return null;
  }

  Widget _markdown(Map<String, dynamic> m) {
    final data = (m['data'] ?? m['text'] ?? m['markdown'] ?? '').toString();
    if (data.trim().isEmpty) return const SizedBox.shrink();
    return MarkdownBody(
      data: data,
      selectable: m['selectable'] as bool? ?? false,
      shrinkWrap: true,
    );
  }

  Widget _circleAvatar(Map<String, dynamic> m) {
    final radius = _double(m['radius'], 20);
    final bg = _color(m['backgroundColor'] as String? ?? m['color'] as String?);
    final label = (m['data'] ?? m['label'] ?? m['text'] ?? '').toString();
    final url = m['url'] as String? ?? m['image'] as String?;
    if (url != null && url.isNotEmpty) {
      return CircleAvatar(
        radius: radius,
        backgroundImage: NetworkImage(url),
        backgroundColor: bg,
      );
    }
    return CircleAvatar(
      radius: radius,
      backgroundColor: bg ?? _effectiveTheme.primary,
      child: Text(
        label.isEmpty ? '?' : label.characters.first.toUpperCase(),
        style: TextStyle(
          color: _color(m['foregroundColor'] as String? ?? 'white'),
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _chip(Map<String, dynamic> m) {
    final label = (m['label'] ?? m['data'] ?? m['text'] ?? '').toString();
    return ActionChip(
      label: Text(label),
      avatar: m['icon'] is String
          ? Icon(_iconData(m['icon'] as String), size: 16)
          : null,
      onPressed: _tapHandler(m['onTap'], m['payload']) ?? () {},
    );
  }

  Widget _badge(Map<String, dynamic> m) {
    final label = (m['label'] ?? m['data'] ?? m['text'] ?? '').toString();
    final child = _child(m);
    return Badge(
      label: Text(label),
      isLabelVisible: label.isNotEmpty,
      backgroundColor: _color(m['backgroundColor'] as String?),
      child: child ?? const Icon(Icons.notifications_none),
    );
  }

  // ── Style helpers ─────────────────────────────────────────────────────────

  TextStyle? _textStyle(Map? style) {
    if (style == null) return null;
    final isItalic = style['italic'] == true || style['fontStyle'] == 'italic';
    return TextStyle(
      color: _color(style['color'] as String?),
      fontSize: _doubleOrNull(style['fontSize']),
      fontWeight: _fontWeight(style['fontWeight']),
      fontStyle: isItalic ? FontStyle.italic : null,
      fontFamily: style['fontFamily'] as String?,
      letterSpacing: _doubleOrNull(style['letterSpacing']),
      height:
          _doubleOrNull(style['height']) ?? _doubleOrNull(style['lineHeight']),
      shadows: _textShadows(
        style['textShadows'] as List? ?? style['shadows'] as List?,
      ),
    );
  }

  List<Shadow>? _textShadows(List? shadows) {
    if (shadows == null || shadows.isEmpty) return null;
    return shadows.map((s) {
      final m = (s as Map).cast<String, dynamic>();
      return Shadow(
        color: _color(m['color'] as String?) ?? Colors.black.withAlpha(128),
        blurRadius: _double(m['blur'], 0),
        offset: Offset(_double(m['offsetX'], 0), _double(m['offsetY'], 0)),
      );
    }).toList();
  }

  TextAlign? _textAlign(String? v) => switch (v) {
    'left' => TextAlign.left,
    'right' => TextAlign.right,
    'center' => TextAlign.center,
    'justify' => TextAlign.justify,
    _ => null,
  };

  TextOverflow? _overflow(String? v) => switch (v) {
    'ellipsis' => TextOverflow.ellipsis,
    'clip' => TextOverflow.clip,
    'fade' => TextOverflow.fade,
    _ => null,
  };

  FontWeight? _fontWeight(dynamic v) {
    if (v == null) return null;
    if (v is num) {
      return FontWeight.values.firstWhere(
        (w) => w.value == ((v / 100).round() * 100).clamp(100, 900),
        orElse: () => FontWeight.normal,
      );
    }
    return switch (v.toString()) {
      'bold' => FontWeight.bold,
      'w100' => FontWeight.w100,
      'w200' => FontWeight.w200,
      'w300' => FontWeight.w300,
      'w400' => FontWeight.w400,
      'w500' => FontWeight.w500,
      'w600' => FontWeight.w600,
      'w700' => FontWeight.w700,
      'w800' => FontWeight.w800,
      'w900' => FontWeight.w900,
      _ => FontWeight.normal,
    };
  }

  /// Renders a `chart` node — a sparkline or simple bar chart.
  ///
  /// Props:
  /// - `data` (list of numbers): values to plot; `points` is accepted as a
  ///   backwards-compatible alias. Non-numeric entries are skipped; empty
  ///   data renders nothing.
  /// - `chartType`: `'line'` (default, smooth sparkline) or `'bar'`
  ///   (equal-width bars with rounded tops and a baseline). Unknown values
  ///   fall back to `'line'`.
  /// - `color` (hex string): line/bar stroke color, default `#4ade80`.
  /// - `fillColor` (hex string, alpha allowed, e.g. `#22c55e33`): fill under
  ///   the line / bar fill; falls back to [color] at ~20% alpha. For line
  ///   charts, `fill: true` also enables the fill.
  /// - `strokeWidth` (number): line stroke / bar outline width, default 2.
  /// - `height` (number): chart height, default 60.
  ///
  /// JS examples:
  /// ```js
  /// jsr.render({
  ///   type: 'chart',
  ///   chartType: 'line',
  ///   data: [1.2, 2.5, 1.8, 3.1, 2.7],
  ///   color: '#22c55e',
  ///   fillColor: '#22c55e33',
  ///   strokeWidth: 2,
  ///   height: 60,
  /// });
  ///
  /// jsr.render({
  ///   type: 'chart',
  ///   chartType: 'bar',
  ///   data: [4, 7, 3, 8, 5],
  ///   color: '#60a5fa',
  ///   fillColor: '#60a5fa66',
  ///   height: 80,
  /// });
  /// ```
  Widget _chartNode(Map<String, dynamic> m) {
    final rawData = m['data'] as List? ?? m['points'] as List?;
    final points = rawData == null
        ? const <double>[]
        : rawData.map(jsDoubleOrNull).whereType<double>().toList();
    if (points.isEmpty) return const SizedBox.shrink();
    final color =
        _color(m['color'] as String? ?? '#4ade80') ?? Colors.greenAccent;
    final fillColor = _color(m['fillColor'] as String?);
    final strokeWidth = _double(m['strokeWidth'], 2.0);
    final height = _double(m['height'], 60.0);
    final fill = m['fill'] == true;
    final onTap = m['onTap'] as String?;
    final CustomPainter painter = m['chartType'] == 'bar'
        ? _BarChartPainter(
            points: points,
            color: color,
            fillColor: fillColor,
            strokeWidth: strokeWidth,
          )
        : _SparklinePainter(
            points: points,
            color: color,
            fillColor: fillColor,
            strokeWidth: strokeWidth,
            fill: fill,
          );
    Widget chart = SizedBox(
      height: height,
      child: CustomPaint(
        isComplex: true,
        painter: painter,
        size: Size.infinite,
      ),
    );
    if (onTap != null) {
      chart = GestureDetector(onTap: () => onEvent(onTap, {}), child: chart);
    }
    return chart;
  }
}

// ── Sparkline chart painter ───────────────────────────────────────────────────

class _SparklinePainter extends CustomPainter {
  const _SparklinePainter({
    required this.points,
    required this.color,
    required this.fillColor,
    required this.strokeWidth,
    required this.fill,
  });
  final List<double> points;
  final Color color;
  final Color? fillColor;
  final double strokeWidth;
  final bool fill;

  @override
  void paint(Canvas canvas, Size size) {
    if (points.length < 2) return;
    final min = points.reduce((a, b) => a < b ? a : b);
    final max = points.reduce((a, b) => a > b ? a : b);
    final range = (max - min).abs();
    final effectiveRange = range < 0.0001 ? 1.0 : range;

    final xStep = size.width / (points.length - 1);

    double toY(double v) =>
        size.height -
        ((v - min) / effectiveRange) * size.height * 0.85 -
        size.height * 0.05;

    final path = Path();
    path.moveTo(0, toY(points[0]));
    for (int i = 1; i < points.length; i++) {
      final x = i * xStep;
      final prev = points[i - 1];
      final curr = points[i];
      final cpx = (i - 0.5) * xStep;
      path.cubicTo(cpx, toY(prev), cpx, toY(curr), x, toY(curr));
    }

    if (fill || fillColor != null) {
      final fillPath = Path()..addPath(path, Offset.zero);
      fillPath.lineTo(size.width, size.height);
      fillPath.lineTo(0, size.height);
      fillPath.close();
      canvas.drawPath(
        fillPath,
        Paint()
          ..color = fillColor ?? color.withAlpha(51)
          ..style = PaintingStyle.fill,
      );
    }

    final linePaint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(path, linePaint);
  }

  @override
  bool shouldRepaint(_SparklinePainter old) =>
      old.points != points ||
      old.color != color ||
      old.fillColor != fillColor ||
      old.strokeWidth != strokeWidth ||
      old.fill != fill;
}

class _BarChartPainter extends CustomPainter {
  const _BarChartPainter({
    required this.points,
    required this.color,
    required this.fillColor,
    required this.strokeWidth,
  });
  final List<double> points;
  final Color color;
  final Color? fillColor;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;
    final minVal = points.reduce((a, b) => a < b ? a : b);
    final maxVal = points.reduce((a, b) => a > b ? a : b);
    final lo = minVal < 0 ? minVal : 0.0;
    final hi = maxVal > 0 ? maxVal : 0.0;
    final range = (hi - lo).abs();
    final effectiveRange = range < 0.0001 ? 1.0 : range;

    const topPad = 0.05;
    const bottomPad = 0.05;
    double toY(double v) =>
        size.height -
        ((v - lo) / effectiveRange) * size.height * (1 - topPad - bottomPad) -
        size.height * bottomPad;

    final slot = size.width / points.length;
    final barWidth = slot * 0.7;
    const radius = Radius.circular(3);

    final fillPaint = Paint()
      ..color = fillColor ?? color.withAlpha(51)
      ..style = PaintingStyle.fill;
    final strokePaint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final baselineY = toY(0);
    for (int i = 0; i < points.length; i++) {
      final left = i * slot + (slot - barWidth) / 2;
      final y = toY(points[i]);
      final rect = Rect.fromLTRB(
        left,
        y < baselineY ? y : baselineY,
        left + barWidth,
        y < baselineY ? baselineY : y,
      );
      if (rect.height < 0.5) continue;
      final rrect = y < baselineY
          ? RRect.fromRectAndCorners(rect, topLeft: radius, topRight: radius)
          : RRect.fromRectAndCorners(
              rect,
              bottomLeft: radius,
              bottomRight: radius,
            );
      canvas.drawRRect(rrect, fillPaint);
      canvas.drawRRect(rrect, strokePaint);
    }

    canvas.drawLine(
      Offset(0, baselineY),
      Offset(size.width, baselineY),
      Paint()
        ..color = color.withAlpha(60)
        ..strokeWidth = 1,
    );
  }

  @override
  bool shouldRepaint(_BarChartPainter old) =>
      old.points != points ||
      old.color != color ||
      old.fillColor != fillColor ||
      old.strokeWidth != strokeWidth;
}
