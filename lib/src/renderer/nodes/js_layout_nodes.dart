part of '../json_widget_renderer.dart';

/// Layout node builders for [JsonWidgetRenderer]: flex layouts, stack,
/// wrap, sizing, containers/cards, scrolling lists, and implicit
/// animations.
extension on JsonWidgetRenderer {
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
    return SizedBox(width: w, height: h, child: child);
  }

  Widget _column(Map<String, dynamic> m) => _flexSize(_columnCore(m), m);

  Widget _row(Map<String, dynamic> m) => _flexSize(_rowCore(m), m);

  Widget _columnCore(Map<String, dynamic> m) => Column(
    mainAxisAlignment: _mainAxis(m['mainAxisAlignment']),
    crossAxisAlignment: _crossAxis(m['crossAxisAlignment']),
    mainAxisSize: _mainSize(m['mainAxisSize']),
    children: _children(m),
  );

  Widget _rowCore(Map<String, dynamic> m) => Row(
    mainAxisAlignment: _mainAxis(m['mainAxisAlignment']),
    crossAxisAlignment: _crossAxis(m['crossAxisAlignment']),
    mainAxisSize: _mainSize(m['mainAxisSize']),
    children: _children(m),
  );

  Widget _stackCore(Map<String, dynamic> m) {
    final children = (m['children'] as List? ?? []).map((c) {
      final cm = (c as Map?)?.cast<String, dynamic>() ?? {};
      if (cm['positioned'] != null) {
        final p = (cm['positioned'] as Map).cast<String, dynamic>();
        return Positioned(
          left: _doubleOrNull(p['left']),
          top: _doubleOrNull(p['top']),
          right: _doubleOrNull(p['right']),
          bottom: _doubleOrNull(p['bottom']),
          child: _build(cm['child'] ?? cm),
        );
      }
      return _build(c);
    }).toList();
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
    if (child != null) return SizedBox(width: w, height: h, child: child);
    return SizedBox(width: w, height: h);
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
    final bg = m['backgroundColor'] as String? ?? m['color'] as String?;
    if (bg != null) {
      return BoxDecoration(color: _color(bg));
    }
    return null;
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
    final p = _containerProps(m);
    return ctor(
      width: p.width,
      height: p.height,
      padding: p.padding,
      margin: p.margin,
      alignment: p.alignment,
      decoration: p.decoration,
      transform: _matrix4(m['transform']),
      child: p.child,
    );
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
