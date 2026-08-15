part of 'json_widget_renderer.dart';

/// Decoration, styling and universal-effect helpers for
/// [JsonWidgetRenderer], kept in a mixin to keep the renderer class small
/// (class_size gate).
mixin JsonWidgetDecoration {
  Widget _applyBlur(Widget child, dynamic blur) {
    if (blur == null) return child;
    final sigma = _double(blur is num ? blur : (blur as Map?)?['sigma'], 0);
    if (sigma <= 0) return child;
    return ImageFiltered(
      imageFilter: ImageFilter.blur(sigmaX: sigma, sigmaY: sigma),
      child: child,
    );
  }

  Widget _applyUniversalEffects(Widget child, Map<String, dynamic> m) {
    // Flex layout helpers must remain direct children of their parent Flex.
    if (child is Expanded || child is Flexible || child is Spacer) {
      return child;
    }
    // Fast path: the vast majority of nodes carry no effect props at all —
    // one null-check per key beats parsing each value on every rebuild.
    if (_hasNoEffectProps(m)) return child;

    Widget result = _applyTransformEffects(child, m);
    result = _applyBlur(result, m['blur']);
    return _applyOpacityEffect(result, m);
  }

  bool _hasNoEffectProps(Map<String, dynamic> m) =>
      m['offsetX'] == null &&
      m['offsetY'] == null &&
      m['scale'] == null &&
      m['rotation'] == null &&
      m['blur'] == null &&
      m['opacity'] == null;

  Widget _applyTransformEffects(Widget child, Map<String, dynamic> m) {
    final offsetX = _doubleOrNull(m['offsetX']);
    final offsetY = _doubleOrNull(m['offsetY']);
    final scale = _doubleOrNull(m['scale']);
    final rotation = _doubleOrNull(m['rotation']);
    if (offsetX == null && offsetY == null && scale == null && rotation == null) {
      return child;
    }
    return Transform(
      transform: _effectMatrix(offsetX, offsetY, scale, rotation),
      alignment: Alignment.center,
      child: child,
    );
  }

  Matrix4 _effectMatrix(
    double? offsetX,
    double? offsetY,
    double? scale,
    double? rotation,
  ) {
    final matrix = Matrix4.identity();
    if (offsetX != null || offsetY != null) {
      matrix.translateByDouble(offsetX ?? 0.0, offsetY ?? 0.0, 0, 1);
    }
    if (scale != null) {
      matrix.scaleByDouble(scale, scale, 1, 1);
    }
    if (rotation != null) {
      matrix.rotateZ(rotation);
    }
    return matrix;
  }

  Widget _applyOpacityEffect(Widget child, Map<String, dynamic> m) {
    final opacity = _doubleOrNull(m['opacity']);
    // animatedOpacity handles opacity itself with an animation.
    final type = m['type'] as String? ?? '';
    if (opacity == null || opacity == 1.0 || type == 'animatedOpacity') {
      return child;
    }
    return Opacity(opacity: opacity.clamp(0.0, 1.0), child: child);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────


  BoxDecoration _boxDecoration(Map<String, dynamic> d) {
    final br = jsBorderRadius(d['borderRadius']);
    final borderColor = _color(d['borderColor'] as String?);
    final borderWidth = _double(d['borderWidth'], 1);
    return BoxDecoration(
      color: _color(d['color'] as String?),
      borderRadius: br,
      border: borderColor != null
          ? Border.all(color: borderColor, width: borderWidth)
          : null,
      gradient: _gradient(d['gradient'] as Map?),
      boxShadow: _boxShadows(d['shadows'] as List? ?? d['shadow'] as List?),
    );
  }

  List<BoxShadow>? _boxShadows(List? shadows) {
    if (shadows == null || shadows.isEmpty) return null;
    return shadows.map((s) {
      final m = (s as Map).cast<String, dynamic>();
      return BoxShadow(
        color: _color(m['color'] as String?) ?? Colors.black.withAlpha(128),
        blurRadius: _double(m['blur'], 4),
        spreadRadius: _double(m['spread'], 0),
        offset: Offset(_double(m['offsetX'], 0), _double(m['offsetY'], 0)),
      );
    }).toList();
  }

  Gradient? _gradient(Map? g) {
    if (g == null) return null;
    final colors = (g['colors'] as List? ?? [])
        .map((c) => _color(c as String?) ?? Colors.transparent)
        .toList();
    if (colors.isEmpty) return null;
    final stops = (g['stops'] as List? ?? [])
        .map((s) => (s as num?)?.toDouble())
        .whereType<double>()
        .toList();
    final type = g['type'] as String? ?? 'linear';
    if (type == 'radial') {
      final center = _alignmentGradient(g['center'] as String?);
      final radius = _double(g['radius'] as num?, 0.5);
      return RadialGradient(
        center: center,
        radius: radius,
        colors: colors,
        stops: stops.isEmpty ? null : stops,
      );
    }
    return LinearGradient(
      begin: _alignmentGradient(g['begin'] as String?),
      end: _alignmentGradient(g['end'] as String?),
      colors: colors,
      stops: stops.isEmpty ? null : stops,
    );
  }

  EdgeInsets _edgeInsets(dynamic v) {
    if (v is num) return EdgeInsets.all(v.toDouble());
    if (v is List && v.length == 4) return _edgeInsetsFromList(v);
    if (v is Map) return _edgeInsetsFromMap(v);
    return EdgeInsets.zero;
  }

  EdgeInsets _edgeInsetsFromList(List v) => EdgeInsets.fromLTRB(
        (v[0] as num).toDouble(),
        (v[1] as num).toDouble(),
        (v[2] as num).toDouble(),
        (v[3] as num).toDouble(),
      );

  EdgeInsets _edgeInsetsFromMap(Map v) => EdgeInsets.only(
        left: _double(v['left'], 0),
        top: _double(v['top'], 0),
        right: _double(v['right'], 0),
        bottom: _double(v['bottom'], 0),
      );

  EdgeInsetsGeometry? _edgeInsetsOrNull(dynamic v) =>
      v == null ? null : _edgeInsets(v);

  Color? _color(String? s) => parseColor(s);

  IconData _iconData(String name) =>
      const {
        'star': Icons.star,
        'favorite': Icons.favorite,
        'home': Icons.home,
        'settings': Icons.settings,
        'search': Icons.search,
        'add': Icons.add,
        'remove': Icons.remove,
        'delete': Icons.delete,
        'edit': Icons.edit,
        'info': Icons.info,
        'check': Icons.check,
        'close': Icons.close,
        'arrow_forward': Icons.arrow_forward,
        'arrow_back': Icons.arrow_back,
        'refresh': Icons.refresh,
        'share': Icons.share,
        'download': Icons.download,
        'upload': Icons.upload,
        'cloud': Icons.cloud,
        'person': Icons.person,
        'menu': Icons.menu,
        'more_vert': Icons.more_vert,
        'trending_up': Icons.trending_up,
        'trending_down': Icons.trending_down,
        'attach_money': Icons.attach_money,
        'show_chart': Icons.show_chart,
        'bar_chart': Icons.bar_chart,
        'notifications': Icons.notifications,
        'lock': Icons.lock,
        'key': Icons.key,
        'language': Icons.language,
        'thermostat': Icons.thermostat,
        'water_drop': Icons.water_drop,
        'air': Icons.air,
        'wb_sunny': Icons.wb_sunny,
        'nights_stay': Icons.nights_stay,
        'umbrella': Icons.umbrella,
        'calculate': Icons.calculate,
        'timer': Icons.timer,
        'calendar_today': Icons.calendar_today,
        'warning': Icons.warning,
        'error': Icons.error,
        'done': Icons.done,
        'play_arrow': Icons.play_arrow,
        'pause': Icons.pause,
        'stop': Icons.stop,
        'skip_next': Icons.skip_next,
        'skip_previous': Icons.skip_previous,
      }[name.toLowerCase()] ??
      Icons.widgets;

  Alignment _alignment(dynamic v) {
    if (v == null) return Alignment.center;
    if (v is String) {
      return switch (v) {
        'topLeft' => Alignment.topLeft,
        'topCenter' => Alignment.topCenter,
        'topRight' => Alignment.topRight,
        'centerLeft' => Alignment.centerLeft,
        'center' => Alignment.center,
        'centerRight' => Alignment.centerRight,
        'bottomLeft' => Alignment.bottomLeft,
        'bottomCenter' => Alignment.bottomCenter,
        'bottomRight' => Alignment.bottomRight,
        _ => Alignment.center,
      };
    }
    return Alignment.center;
  }

  AlignmentGeometry _alignmentGradient(String? v) => switch (v) {
    'topLeft' => Alignment.topLeft,
    'topRight' => Alignment.topRight,
    'bottomLeft' => Alignment.bottomLeft,
    'bottomRight' => Alignment.bottomRight,
    'topCenter' => Alignment.topCenter,
    'bottomCenter' => Alignment.bottomCenter,
    'centerLeft' => Alignment.centerLeft,
    'centerRight' => Alignment.centerRight,
    _ => Alignment.centerLeft,
  };

  BoxFit _boxFit(String? v) => switch (v) {
    'fill' => BoxFit.fill,
    'contain' => BoxFit.contain,
    'cover' => BoxFit.cover,
    'fitWidth' => BoxFit.fitWidth,
    'fitHeight' => BoxFit.fitHeight,
    'none' => BoxFit.none,
    _ => BoxFit.cover,
  };

  double _double(dynamic v, double def) => jsDouble(v, def);

  double? _doubleOrNull(dynamic v) => jsDoubleOrNull(v);

  int _int(dynamic v, int def) => v == null ? def : (v as num).toInt();

  Matrix4? _matrix4(dynamic v) {
    if (v == null) return null;
    if (v is Map) {
      final m = v.cast<String, dynamic>();
      final tx = _double(m['translateX'], 0);
      final ty = _double(m['translateY'], 0);
      final scale = _double(m['scale'], 1);
      final rotate = _double(m['rotate'], 0); // radians around Z
      final rotateX = _double(m['rotateX'], 0); // radians
      final rotateY = _double(m['rotateY'], 0); // radians
      final perspective = _double(m['perspective'], 0);
      final matrix = Matrix4.identity()
        ..translateByDouble(tx, ty, 0, 1)
        ..scaleByDouble(scale, scale, 1, 1);
      if (perspective > 0) {
        matrix.setEntry(3, 2, -1 / perspective);
      }
      if (rotateX != 0) matrix.rotateX(rotateX);
      if (rotateY != 0) matrix.rotateY(rotateY);
      if (rotate != 0) matrix.rotateZ(rotate);
      return matrix;
    }
    return null;
  }

}
