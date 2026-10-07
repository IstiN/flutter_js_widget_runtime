part of '../json_widget_renderer.dart';

/// Layout node builders for [JsonWidgetRenderer]: flex layouts, stack,
/// wrap, sizing, containers/cards, scrolling lists, and implicit
/// animations.
extension on JsonWidgetRenderer {
  /// CSS-authored sizing shield (parity with yoclip's wrap pipeline): a node
  /// with explicit `width`/`height` keeps that size even under TIGHT parent
  /// constraints — Flutter's Container/SizedBox would otherwise stretch to
  /// the parent (a root `{width: 400}` box rendered fullscreen in Scaffold
  /// bodies). Center(widthFactor:1, heightFactor:1) loosens the constraints
  /// and hugs under loose parents, so loose layouts see no difference.
  Widget _sizeShield(Widget child, Map<String, dynamic> m) {
    if (m['width'] == null && m['height'] == null) return child;
    return Center(widthFactor: 1, heightFactor: 1, child: child);
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  /// Caps a built flex/stack node to the node's `width`/`height` props.
  ///
  /// Same loose-constraint semantics as `container`: under a bounded-loose
  /// parent (panel, column cross axis) the box is exactly this size, so
  /// `crossAxisAlignment: 'center'` centers siblings across the requested
  /// span instead of the parent's full width; under tight constraints the
  /// parent wins.
  Widget _flexSize(Widget child, Map<String, dynamic> m) {
    final w = _doubleOrNull(m['width']);
    final h = _doubleOrNull(m['height']);
    if (w == null && h == null) return child;
    return _sizeShield(SizedBox(width: w, height: h, child: child), m);
  }

  Widget _column(Map<String, dynamic> m) => _flexSize(_columnCore(m), m);

  Widget _row(Map<String, dynamic> m) => _flexSize(_rowCore(m), m);

  Widget _columnCore(Map<String, dynamic> m) => Column(
    mainAxisAlignment: _mainAxis(m['mainAxisAlignment']),
    crossAxisAlignment: _textAlignAdoptedCrossAxis(m),
    mainAxisSize: m[kAlignContentMinMainAxis] == true
        ? MainAxisSize.min
        : _mainSize(m['mainAxisSize']),
    children: _children(m),
  );

  Widget _rowCore(Map<String, dynamic> m) {
  final cross = _textAlignAdoptedCrossAxis(m);
  return Row(
    mainAxisAlignment: _mainAxis(m['mainAxisAlignment']),
    crossAxisAlignment: cross,
    // Flutter requires a text baseline for CrossAxisAlignment.baseline —
    // default alphabetic, overridable via the node's `textBaseline`.
    textBaseline: cross == CrossAxisAlignment.baseline
        ? (m['textBaseline'] == 'ideographic'
              ? TextBaseline.ideographic
              : TextBaseline.alphabetic)
        : null,
    mainAxisSize: m[kAlignContentMinMainAxis] == true
        ? MainAxisSize.min
        : _mainSize(m['mainAxisSize']),
    children: _children(m),
  );
}

  /// Parity with yoclip's row/column rule: with `crossAxisAlignment`
  /// omitted and ALL children being texts carrying the SAME explicit
  /// `textAlign`, the cross axis adopts it (a CSS author centering the
  /// label glyphs means the row centers the labels too). Any non-text
  /// child, missing/unanimity-breaking textAlign, or explicit
  /// crossAxisAlignment keeps the default.
  CrossAxisAlignment _textAlignAdoptedCrossAxis(Map<String, dynamic> m) {
    final raw = m['crossAxisAlignment'];
    if (raw is String && raw.isNotEmpty) return _crossAxis(raw);
    final children = m['children'];
    if (children is List && children.isNotEmpty) {
      String? unanimous;
      var conflict = false;
      for (final c in children) {
        if (c is! Map || c['type'] != 'text') return _crossAxis(raw);
        final align = c['textAlign'] ??
            (c['style'] as Map?)?['textAlign'] as String?;
        if (align is! String) return _crossAxis(raw);
        if (unanimous == null) {
          unanimous = align;
        } else if (unanimous != align) {
          conflict = true;
        }
      }
      if (!conflict) {
        return switch (unanimous) {
          'left' || 'start' => CrossAxisAlignment.start,
          'right' || 'end' => CrossAxisAlignment.end,
          _ => CrossAxisAlignment.center,
        };
      }
    }
    return _crossAxis(raw);
  }

  Widget _stackCore(Map<String, dynamic> m) {
    final children = <Widget>[];
    var index = 0;
    for (final c in m['children'] as List? ?? []) {
      final cm = (c as Map?)?.cast<String, dynamic>() ?? {};
      if (cm['positioned'] != null) {
        final p = (cm['positioned'] as Map).cast<String, dynamic>();
        // Two positioned spellings: a bare wrapper ({positioned, child})
        // builds just the child; a typed node ({type, positioned, child})
        // is built WHOLE — dropping the node used to discard its
        // color/padding/size and leave only the content (the yoclip
        // container-padding test caught exactly that).
        final target = cm['type'] == null ? (cm['child'] ?? cm) : cm;
        final built = _buildChild(target, m, index);
        index++;
        if (built != null) {
          children.add(
            Positioned(
              left: _doubleOrNull(p['left']),
              top: _doubleOrNull(p['top']),
              right: _doubleOrNull(p['right']),
              bottom: _doubleOrNull(p['bottom']),
              child: built,
            ),
          );
        }
        continue;
      }
      final built = _buildChild(c, m, index);
      index++;
      if (built != null) children.add(built);
    }
    final fit = switch (m['fit'] as String?) {
      'expand' => StackFit.expand,
      'loose' => StackFit.loose,
      _ => StackFit.loose,
    };
    return Stack(
      alignment: _alignment(m['alignment']),
      fit: fit,
      children: children,
    );
  }

  Widget _stack(Map<String, dynamic> m) => _flexSize(_stackCore(m), m);

  Widget _wrap(Map<String, dynamic> m) => _flexSize(_wrapCore(m), m);

  Widget _wrapCore(Map<String, dynamic> m) => Wrap(
    spacing: _double(m['spacing'], 4),
    runSpacing: _double(m['runSpacing'], 4),
    alignment: _wrapAlignment(m['alignment']),
    children: _children(m),
  );

  Widget _align(Map<String, dynamic> m) =>
      Align(alignment: _alignment(m['alignment']), child: _child(m));

  Widget _sizedBox(Map<String, dynamic> m) {
    final w = _doubleOrNull(m['width']);
    final h = _doubleOrNull(m['height']);
    final child = _child(m);
    if (child != null) {
      return _sizeShield(SizedBox(width: w, height: h, child: child), m);
    }
    return _sizeShield(SizedBox(width: w, height: h), m);
  }

  Widget _scroll(Map<String, dynamic> m) => SingleChildScrollView(
    padding: _edgeInsetsOrNull(m['padding']),
    reverse: m['reverse'] as bool? ?? false,
    child: _child(m) ?? Column(children: _children(m)),
  );

  // ── Container & decoration ────────────────────────────────────────────────

  Decoration? _containerDecoration(Map<String, dynamic> m) {
    final deco = m['decoration'] as Map?;
    if (deco != null) {
      return _boxDecoration(deco.cast<String, dynamic>());
    }
    // Top-level yoclip scene vocabulary (the skill teaches gradient/shadow/
    // border/radius directly on the node): fold everything into one
    // BoxDecoration. `gradient` suppresses the flat color (the gradient is
    // the fill); a border only draws when borderWidth > 0; `radius` is the
    // primary spelling with `borderRadius` as the Flutter-ish alias.
    final gradient = _gradient(m['gradient'] as Map?);
    final bg = m['backgroundColor'] as String? ?? m['color'] as String?;
    final borderColor = _color(m['borderColor'] as String?);
    final borderWidth = _doubleOrNull(m['borderWidth']) ?? 0.0;
    final radiusValue =
        _doubleOrNull(m['radius']) ?? _doubleOrNull(m['borderRadius']);
    final radius = radiusValue != null && radiusValue > 0
        ? BorderRadius.circular(radiusValue)
        : null;
    final shadows = m['shadows'] ?? m['shadow'];
    final boxShadow = shadows is Map
        ? _boxShadows([shadows])
        : _boxShadows(shadows as List?);
    if (gradient == null &&
        bg == null &&
        borderColor == null &&
        radius == null &&
        boxShadow == null) {
      return null;
    }
    return BoxDecoration(
      color: gradient == null ? _color(bg) : null,
      gradient: gradient,
      border: borderColor != null && borderWidth > 0
          ? Border.all(color: borderColor, width: borderWidth)
          : null,
      borderRadius: radius,
      boxShadow: boxShadow,
    );
  }

  ({
    double? width,
    double? height,
    EdgeInsetsGeometry? padding,
    EdgeInsetsGeometry? margin,
    Alignment? alignment,
    Decoration? decoration,
    Widget? child,
  })
  _containerProps(Map<String, dynamic> m) => (
    width: _doubleOrNull(m['width']),
    height: _doubleOrNull(m['height']),
    padding: _edgeInsetsOrNull(m['padding']),
    margin: _edgeInsetsOrNull(m['margin']),
    alignment: m['alignment'] != null ? _alignment(m['alignment']) : null,
    decoration: _containerDecoration(m),
    child: _child(m),
  );

  Widget _container(Map<String, dynamic> m) {
    Widget child = _buildBox(Container.new, m);
    if (m['clip'] == true) {
      final radius = _containerBorderRadius(
        _containerDecoration(m),
        m['borderRadius'],
      );
      if (radius != null) {
        child = ClipRRect(borderRadius: radius, child: child);
      }
    }
    return child;
  }

  /// Builds a [Container] or [AnimatedContainer] from the shared box props
  /// (`width/height/padding/margin/alignment/decoration/transform/child`).
  Widget _buildBox(
    Widget Function({
      double? width,
      double? height,
      EdgeInsetsGeometry? padding,
      EdgeInsetsGeometry? margin,
      Alignment? alignment,
      Decoration? decoration,
      Matrix4? transform,
      Widget? child,
    })
    ctor,
    Map<String, dynamic> m,
  ) {
    // CSS-authored content centering: an explicit `alignment` around a
    // row/column child means "center the content in the box". Flutter's
    // Container(alignment:) wraps the child in an Align that hands it LOOSE
    // constraints — a default max-size row then stretches across the whole
    // box and its children pin to the start edge (the dmtools demo's stage
    // pills rendered left-flush instead of centered). Force min main axis
    // so the Align has something to center. An explicit mainAxisSize wins.
    final child = m['child'];
    final minAxisChild = m['alignment'] != null &&
        child is Map &&
        (child['type'] == 'row' || child['type'] == 'column') &&
        child['mainAxisSize'] == null;
    if (minAxisChild) child[kAlignContentMinMainAxis] = true;
    final p = _containerProps(m);
    if (minAxisChild) child.remove(kAlignContentMinMainAxis);
    // Parity with yoclip's fixed-box rule (yoclipFixedBoxContentAlignment):
    // a sized box with NO explicit alignment around a lone text child means
    // "center the label in the box" — horizontal follows the text's own
    // textAlign, vertical is always centered (Flutter would press glyphs to
    // the top of the tight box). Explicit alignment keeps Container's own
    // Align semantics; non-text children keep tight fill.
    Widget? content = p.child;
    if (p.alignment == null && (p.width != null || p.height != null)) {
      final contentAlign = _fixedBoxContentAlignment(m);
      if (contentAlign != null) {
        content = Align(
          alignment: contentAlign,
          widthFactor: p.width == null ? 1 : null,
          heightFactor: p.height == null ? 1 : null,
          child: content,
        );
      }
    }
    return _sizeShield(
      ctor(
        width: p.width,
        height: p.height,
        padding: p.padding,
        margin: p.margin,
        alignment: p.alignment,
        decoration: p.decoration,
        transform: _matrix4(m['transform']),
        child: content,
      ),
      m,
    );
  }

  /// Content alignment for a sized box with no explicit alignment around a
  /// lone text child (parity with yoclip's container builder), or null when
  /// tight-fill semantics must stay.
  Alignment? _fixedBoxContentAlignment(Map<String, dynamic> m) {
    final child = m['child'];
    if (child is! Map || child['type'] != 'text') return null;
    final align = child['textAlign'] ??
        (child['style'] as Map?)?['textAlign'] ??
        child['alignment'];
    return switch (align) {
      'left' || 'start' => Alignment.centerLeft,
      'right' || 'end' => Alignment.centerRight,
      _ => Alignment.center,
    };
  }

  BorderRadius? _containerBorderRadius(
    Decoration? decoration,
    dynamic borderRadius,
  ) {
    if (decoration is BoxDecoration &&
        decoration.borderRadius is BorderRadius) {
      return decoration.borderRadius as BorderRadius;
    }
    return jsBorderRadius(borderRadius);
  }

  Widget _card(Map<String, dynamic> m) => Card(
    elevation: _double(m['elevation'], 2),
    margin: _edgeInsetsOrNull(m['margin']) ?? EdgeInsets.zero,
    color: _color(m['color'] as String?),
    shape: RoundedRectangleBorder(
      borderRadius:
          jsBorderRadius(m['borderRadius']) ?? BorderRadius.circular(8),
    ),
    child: _child(m),
  );

  Widget _inkWell(Map<String, dynamic> m) => InkWell(
    onTap: _tapHandler(m['onTap'], m['payload']),
    borderRadius: jsBorderRadius(m['borderRadius']) ?? BorderRadius.circular(8),
    child: _child(m),
  );

  Widget _clipRRect(Map<String, dynamic> m) => ClipRRect(
    borderRadius: jsBorderRadius(m['borderRadius']) ?? BorderRadius.circular(8),
    child: _child(m),
  );

  Widget _aspectRatio(Map<String, dynamic> m) =>
      AspectRatio(aspectRatio: _double(m['aspectRatio'], 1), child: _child(m));

  // ── Lists ─────────────────────────────────────────────────────────────────

  /// Parses a `physics` prop into [ScrollPhysics].
  ///
  /// Accepted values: `'never'` (not user-scrollable), `'always'`
  /// (scrollable even when content fits), `'platform'` (Flutter default for
  /// the current platform). Unknown values fall back to [def].
  ScrollPhysics? _scrollPhysics(dynamic v, ScrollPhysics? def) =>
      switch (v is String ? v : null) {
        'never' => const NeverScrollableScrollPhysics(),
        'always' => const AlwaysScrollableScrollPhysics(),
        'platform' => null,
        _ => def,
      };

  /// Renders a `listView` node.
  ///
  /// Props:
  /// - `children` (list): items to lay out lazily.
  /// - `shrinkWrap` (bool): size to content, default `true`.
  /// - `physics`: `'never'`, `'always'`, or `'platform'`; default `'always'`
  ///   so a bounded listView (e.g. inside a fixed-height `sizedBox`) always
  ///   scrolls. Set `shrinkWrap: false` when the list lives in a bounded
  ///   parent.
  /// - `reverse` (bool), `padding`.
  ///
  /// JS example:
  /// ```js
  /// jsr.render({
  ///   type: 'sizedBox',
  ///   height: 200,
  ///   child: {
  ///     type: 'listView',
  ///     shrinkWrap: false,
  ///     children: items.map(function (s) {
  ///       return {type: 'text', data: s};
  ///     }),
  ///   },
  /// });
  /// ```
  Widget _listView(Map<String, dynamic> m) {
    final items = m['children'] as List? ?? [];
    final shrink = jsBool(m['shrinkWrap'], true);
    final reverse = jsBool(m['reverse'], false);
    return ListView.builder(
      shrinkWrap: shrink,
      reverse: reverse,
      physics: _scrollPhysics(
        m['physics'],
        const AlwaysScrollableScrollPhysics(),
      ),
      padding: _edgeInsetsOrNull(m['padding']),
      itemCount: items.length,
      itemBuilder: (_, i) => _build(items[i]),
    );
  }

  /// Renders a `gridView` node.
  ///
  /// Props:
  /// - `children` (list): cells to lay out lazily.
  /// - `crossAxisCount` (number): columns, default 2.
  /// - `shrinkWrap` (bool): size to content, default `true` (back-compat).
  /// - `physics`: `'never'` (default, back-compat), `'always'`, or
  ///   `'platform'`. Set `shrinkWrap: false` plus a scrollable physics when
  ///   the grid lives in a bounded parent.
  /// - `crossAxisSpacing`, `mainAxisSpacing`, `childAspectRatio`, `padding`.
  ///
  /// JS example:
  /// ```js
  /// jsr.render({
  ///   type: 'gridView',
  ///   crossAxisCount: 3,
  ///   shrinkWrap: false,
  ///   physics: 'platform',
  ///   children: tiles,
  /// });
  /// ```
  Widget _gridView(Map<String, dynamic> m) {
    final items = m['children'] as List? ?? [];
    final cols = _int(m['crossAxisCount'], 2);
    final maxExtent = _doubleOrNull(m['maxCrossAxisExtent']);
    return GridView.builder(
      shrinkWrap: jsBool(m['shrinkWrap'], true),
      physics: _scrollPhysics(
        m['physics'],
        const NeverScrollableScrollPhysics(),
      ),
      padding: _edgeInsetsOrNull(m['padding']),
      // `maxCrossAxisExtent` ("columns no wider than N", count floats with
      // width) wins over the fixed `crossAxisCount` when both are set.
      gridDelegate: maxExtent != null
          ? SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: maxExtent,
              crossAxisSpacing: _double(m['crossAxisSpacing'], 4),
              mainAxisSpacing: _double(m['mainAxisSpacing'], 4),
              childAspectRatio: _double(m['childAspectRatio'], 1),
            )
          : SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: cols,
              crossAxisSpacing: _double(m['crossAxisSpacing'], 4),
              mainAxisSpacing: _double(m['mainAxisSpacing'], 4),
              childAspectRatio: _double(m['childAspectRatio'], 1),
            ),
      itemCount: items.length,
      itemBuilder: (_, i) => _build(items[i]),
    );
  }

  /// Renders an `adaptive` node: picks one of its `compact` / `medium` /
  /// `expanded` children by the AVAILABLE width (LayoutBuilder — the size
  /// allotted to the widget, not the screen). Material 3 window size
  /// classes by default (<600 / 600-840 / >840), overridable via
  /// `breakpoints: [compactMax, mediumMax]`. A missing tier falls back to
  /// the nearest defined one.
  Widget _adaptive(Map<String, dynamic> m) {
    final bps = m['breakpoints'] as List?;
    final compactMax = bps != null && bps.isNotEmpty
        ? (bps[0] as num).toDouble()
        : 600.0;
    final mediumMax = bps != null && bps.length > 1
        ? (bps[1] as num).toDouble()
        : 840.0;
    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final bp = w < compactMax
            ? 'compact'
            : (w < mediumMax ? 'medium' : 'expanded');
        final child =
            m[bp] ??
            (bp == 'expanded'
                ? (m['medium'] ?? m['compact'])
                : bp == 'medium'
                ? (m['compact'] ?? m['expanded'])
                : (m['medium'] ?? m['expanded']));
        if (child == null) return const SizedBox.shrink();
        return _build(child);
      },
    );
  }

  MainAxisAlignment _mainAxis(dynamic v) => switch (v as String?) {
    'start' => MainAxisAlignment.start,
    'end' => MainAxisAlignment.end,
    'center' => MainAxisAlignment.center,
    'spaceBetween' => MainAxisAlignment.spaceBetween,
    'spaceAround' => MainAxisAlignment.spaceAround,
    'spaceEvenly' => MainAxisAlignment.spaceEvenly,
    _ => MainAxisAlignment.start,
  };

  CrossAxisAlignment _crossAxis(dynamic v) => switch (v as String?) {
    'start' => CrossAxisAlignment.start,
    'end' => CrossAxisAlignment.end,
    'center' => CrossAxisAlignment.center,
    'stretch' => CrossAxisAlignment.stretch,
    'baseline' => CrossAxisAlignment.baseline,
    _ => CrossAxisAlignment.start,
  };

  MainAxisSize _mainSize(dynamic v) =>
      v == 'min' ? MainAxisSize.min : MainAxisSize.max;

  WrapAlignment _wrapAlignment(dynamic v) => switch (v as String?) {
    'center' => WrapAlignment.center,
    'end' => WrapAlignment.end,
    'spaceBetween' => WrapAlignment.spaceBetween,
    'spaceAround' => WrapAlignment.spaceAround,
    'spaceEvenly' => WrapAlignment.spaceEvenly,
    _ => WrapAlignment.start,
  };
}
