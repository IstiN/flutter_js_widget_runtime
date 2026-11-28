import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui' show ImageFilter;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/gestures.dart' show PointerScrollEvent;
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart' show TileProvider;
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'package:js_widget_runtime/src/renderer/external_asset_resolver.dart';
import 'package:js_widget_runtime/src/renderer/font/js_font_loader.dart';
import 'package:js_widget_runtime/src/renderer/font/js_font_resolver.dart';
import 'package:js_widget_runtime/src/renderer/json_widget_theme.dart';
import 'package:js_widget_runtime/src/renderer/media/js_audio_player_widget.dart';
import 'package:js_widget_runtime/src/renderer/media/js_audio_widget.dart';
import 'package:js_widget_runtime/src/renderer/media/js_media_host.dart';
import 'package:js_widget_runtime/src/renderer/media/js_video_widget.dart';
import 'package:js_widget_runtime/src/renderer/webview/js_web_view_host.dart';
import 'package:js_widget_runtime/src/renderer/nodes/image_provider_resolver_stub.dart'
    if (dart.library.io) 'package:js_widget_runtime/src/renderer/nodes/image_provider_resolver_io.dart'
    if (dart.library.js_interop) 'package:js_widget_runtime/src/renderer/nodes/image_provider_resolver_web.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_3d_host.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_animation_nodes.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_map_node.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_node_helpers.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_path_node.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_shape_nodes.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_scene3d_mesh_node.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_scene3d_node.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_voxel_node.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_host.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_node.dart';
import 'package:js_widget_runtime/src/renderer/ui_view_field_registry.dart';
import 'package:js_widget_runtime/src/renderer/ui_view_tree_normalizer.dart';

part 'json_widget_decoration.dart';

part 'nodes/js_input_nodes.dart';
part 'nodes/js_animated_nodes.dart';
part 'nodes/js_chart_nodes.dart';
part 'nodes/js_layout_nodes.dart';
part 'nodes/js_m3_nodes.dart';
part 'nodes/js_m3_overlay_nodes.dart';
part 'nodes/js_text_nodes.dart';

final _jsonWidgetDefaultColors = JsonWidgetTheme.fromAccent(Colors.deepPurple);

ImageProvider? _dataImageProvider(String source) {
  if (!source.startsWith('data:image/')) return null;
  final separator = source.indexOf(',');
  if (separator < 0 || !source.substring(0, separator).endsWith(';base64')) {
    return null;
  }
  try {
    return MemoryImage(base64Decode(source.substring(separator + 1)));
  } on FormatException {
    return null;
  }
}

/// Converts a JSON widget tree (produced by JS widgets) into Flutter widgets.
///
/// Supported node types:
/// Layout:   column, row, stack, center, padding, sizedBox, expanded, flexible, wrap, align,
///           absoluteFill
/// Display:  text, icon, markdown, divider, spacer, image, svg, avatar, chip, badge,
///           linearProgressIndicator, circularProgressIndicator, path
/// Container: container, card, inkWell, safeArea, scroll, blur
/// List:     listView, gridView, listTile
/// Input:    button, textButton, outlinedButton, iconButton, textField,
///           textArea, switch, checkbox, slider, dropdown
/// M3:       appBar, navigationBar, tabBar, fab, segmentedButton, radio,
///           searchBar, tooltip, popupMenu, banner, bottomAppBar,
///           navigationRail, carousel, drawer
/// Overlays: bottomSheet, dialog, snackBar, datePicker, timePicker (drive
///           modal surfaces; render as zero-size placeholders and post a
///           dismiss event on close)
/// Charts:   chart (CustomPainter sparkline/bar), flChart (fl_chart-backed
///           line/bar/pie/radar/scatter)
/// Map:      map (OSM tiles via flutter_map, markers, polylines)
/// Animation: animatedContainer/animatedOpacity/animatedPositioned (implicit),
///           entrance (one-shot mount animation, staggered via `delay`),
///           animatedSwitcher (view transition on `switchKey` change)
/// Media:    video, audio (render placeholders unless a custom builder is registered)
/// 3D:       scene3d (software mesh rendering via a `meshes` prop — pure Dart;
///           or host-provided 3D engine for GLB/GLTF models, camera, lights)
/// Effects:  blur (ImageFilter), clip on container, boxShadows, radial gradients,
///           rotateX/rotateY/perspective transforms, textShadows, textTransform,
///           universal effect props (offsetX/offsetY, scale, rotation, opacity, blur).
///
/// Custom builders can be registered via [customBuilders] to render arbitrary
/// node types. Image loading can be customized via [imageResolver]; if it
/// returns null the renderer falls back to asset:/file:/http prefixes.
///
/// Node shape:
/// ```json
/// {
///   "type": "column",
///   "children": [...],
///   "mainAxisAlignment": "center",
///   "crossAxisAlignment": "start"
/// }
/// ```
/// Node shape:
/// ```json
/// {
///   "type": "column",
///   "children": [...],
///   "mainAxisAlignment": "center",
///   "crossAxisAlignment": "start"
/// }
/// ```

/// Transient build flag set on a row/column child map by the container
/// builder: the parent box has an explicit `alignment`, so the flex child
/// shrinks to its content (min main axis) and the box's Align actually
/// centers it — CSS-authored `{width, alignment: 'center', child:
/// {type: 'row'}}` means "center the content", not "stretch the row across
/// the box" (a default max-size row under the Align's loose constraints
/// pins its children to the start edge). Removed right after the child is
/// built. The yoclip renderer mirrors this contract for its overridden
/// row/column/container builders.
const kAlignContentMinMainAxis = '_alignContentMinMainAxis';

/// Host build hooks: let an embedding renderer interpose on child traversal
/// and node finishing WITHOUT forking the node builders — the mechanism that
/// keeps jsr the single source of truth for node semantics (the yoclip
/// renderer uses this for id stamping, Studio overrides, hidden layers and
/// its wrap pipeline instead of overriding row/column/container/...).
class JsonWidgetBuildHooks {
  const JsonWidgetBuildHooks({
    this.effectiveNode,
    this.stampChild,
    this.skipChild,
    this.finishNode,
  });

  /// Merge host edits (property-panel overrides) into a node before
  /// dispatch. Return the SAME instance when there is nothing to merge so
  /// the widget memo cache stays effective.
  final Map<String, dynamic> Function(Map<String, dynamic> node)? effectiveNode;

  /// Prepare a child for building — stamp ids, etc. Receives the raw child
  /// map, its parent map and the child index; return the map the renderer
  /// should build (usually a copy carrying the host's id key).
  final Map<String, dynamic> Function(
    Map<String, dynamic> child,
    Map<String, dynamic> parent,
    int index,
  )?
  stampChild;

  /// Skip a child entirely (hidden layers). Receives the STAMPED child.
  final bool Function(Map<String, dynamic> stampedChild)? skipChild;

  /// Post-process a built node: wrap pipelines, selection decorators. Runs
  /// BEFORE the universal effects pass — strip consumed props from [node]
  /// to prevent double application. Not invoked for nodes rendered by
  /// `customBuilders` (those finish themselves).
  final Widget Function(Map<String, dynamic> node, Widget built)? finishNode;
}

class JsonWidgetRenderer with JsonWidgetDecoration {
  // Not const: owns the per-instance widget memo cache.
  JsonWidgetRenderer({
    required this.onEvent,
    this.onGestureEvent,
    this.fieldRegistry,
    this.theme,
    this.imageResolver,
    this.customBuilders,
    this.mediaHost,
    this.webViewHost,
    this.js3dHost,
    this.onScene3dTap,
    this.threeHost,
    this.onThreeEvent,
    this.voxelWorld,
    this.externalAssetResolver,
    this.fontResolver,
    this.mapTileProvider,
    this.buildHooks,
    this.hideText = false,
  });

  /// Called when a user-triggered event fires (e.g. button tap).
  final void Function(String actionId, Map<String, dynamic> payload) onEvent;

  /// Optional fire-and-forget sink for HIGH-FREQUENCY gesture streams
  /// (`onPanUpdate`, `onScroll`). The default [onEvent] path is serialized
  /// and round-trip-awaited per event — at 60–120 drag/scroll events per
  /// second under load the queue lags behind the finger and the widget
  /// visibly "catches up" after release. This sink skips the queue (the
  /// worker still processes messages in arrival order). Falls back to
  /// [onEvent] when null.
  final void Function(String actionId, Map<String, dynamic> payload)?
  onGestureEvent;
  final UiViewFieldRegistry? fieldRegistry;

  /// Optional theme overrides. Defaults to [JsonWidgetTheme.fromAccent].
  final JsonWidgetTheme? theme;

  /// Optional callback that resolves a source string to a custom [ImageProvider].
  /// If it returns null the renderer falls back to asset:/file:/network logic.
  final ImageProvider? Function(String source)? imageResolver;

  /// Optional map of custom node builders keyed by node type.
  /// Each callback receives the build context and the raw node map.
  final Map<String, Widget Function(BuildContext, Map<String, dynamic>)>?
  customBuilders;

  /// Optional host hooks — see [JsonWidgetBuildHooks].
  final JsonWidgetBuildHooks? buildHooks;

  /// PPTX background-patch mode: keep text layout footprints but paint no
  /// ink (a tiny non-zero alpha — a full alpha==0 OpacityLayer poisons
  /// headless layer capture). Parity with the yoclip renderer's flag.
  final bool hideText;

  /// Optional host-provided media factory. When set, `video`/`audio` nodes
  /// render real players; otherwise they render placeholder icons.
  final JsMediaHost? mediaHost;

  /// Optional host-provided web view factory. When set, `webView` nodes
  /// render real web content; otherwise they render a placeholder icon.
  final JsWebViewHost? webViewHost;

  /// Optional host-provided 3D engine factory. When set, `scene3d` nodes render
  /// real 3D scenes (GLB/GLTF models, cameras, lights); otherwise they render a
  /// placeholder icon.
  final Js3dHost? js3dHost;

  /// Optional callback for tap picking on `scene3d` nodes
  /// (`jsr.scene3d.onTap`). Receives the scene id and either
  /// `{modelId, point: [x, y, z]}` or `{modelId: null}` on a miss.
  final void Function(String sceneId, Map<String, dynamic> payload)?
  onScene3dTap;

  /// Independent upstream-THREE surface host and fire-and-forget DOM events.
  final JsThreeHost? threeHost;
  final void Function(String canvasId, Map<String, dynamic> event)?
  onThreeEvent;

  /// Voxel world state behind `voxel` nodes (`jsr.hostCall('voxel.*')`).
  /// Engines expose their bridge-owned world; hosts rendering trees
  /// without an engine pass the world they fill.
  final JsVoxelWorld? voxelWorld;

  /// Optional resolver for `external:<id>` asset sources.
  final ExternalAssetResolver? externalAssetResolver;

  /// Optional resolver that loads raw font bytes for a `fontFamily` name.
  final JsFontResolver? fontResolver;

  /// Optional tile provider for `map` nodes. Tests inject an in-memory
  /// provider so tile loading never hits the network; null uses the default
  /// OSM network provider.
  final TileProvider? mapTileProvider;

  JsonWidgetTheme get _effectiveTheme => theme ?? _jsonWidgetDefaultColors;

  Widget build(Map<String, dynamic>? tree, [BuildContext? ctx]) {
    if (tree == null) return const SizedBox.shrink();
    _nodeIds.clear();
    _parentDataInstances.clear();
    _nodeIdCounter = 0;
    _indexNodeIds(tree);
    return _build(tree);
  }

  // ── Node identity + applied-node records (AUI conformance) ───────────────

  /// Payload node → `n<i>` id, depth-first pre-order (root `n0`, every node
  /// counted — layout-only nodes too). Identity-keyed: one entry per source
  /// map of the current `jsr.render` payload. Rebuilt per `build()` call.
  final Map<Object?, String> _nodeIds = Map.identity();

  /// nodeId → the node map the renderer last applied (the record the AUI
  /// dump joins with the live element tree). Refreshed on every uncached
  /// build; entries of retired payloads are unreachable and simply age out.
  final Map<String, Map<String, dynamic>> _appliedRecords = {};
  int _nodeIdCounter = 0;

  /// nodeId → the payload `items` list the renderer last applied. Menu
  /// items (`popupMenu`, `dropdown`) are built lazily by their widgets and
  /// never appear in the element tree; the dump joins them from here.
  final Map<String, List<dynamic>> _appliedItems = {};

  /// nodeId → ordered ids of that node's `items` entries, including the
  /// string entries that carry no payload map (rule 7: every node counted).
  final Map<String, List<String>> _itemEntryIds = {};

  /// Built ParentDataWidget instance → nodeId (issue #14): these nodes
  /// stay unkeyed in the tree; the dump joins them through identity.
  final Map<Widget, String> _parentDataInstances = Map.identity();

  /// `n<i>` = depth-first pre-order index in the raw render payload:
  /// node first, then `child`, then `children`/`items` in order. Keyed by
  /// the ORIGINAL payload map objects (`cast()` wrappers have fresh
  /// identities and must never enter the map). `items` entries without a
  /// payload map (plain strings) still consume an id — the reference
  /// normalization lifts them to `text` nodes (rule 7).
  void _indexNodeIds(dynamic node) {
    if (node is! Map) return;
    final id = 'n${_nodeIdCounter++}';
    _nodeIds[node] = id;
    final child = node['child'];
    if (child is Map) _indexNodeIds(child);
    for (final listKey in const ['children', 'items']) {
      final list = node[listKey];
      if (list is! List) continue;
      if (listKey == 'items') {
        final entryIds = <String>[];
        for (final entry in list) {
          if (entry is Map) {
            _indexNodeIds(entry);
            entryIds.add(_nodeIds[entry] ?? '');
          } else {
            entryIds.add('n${_nodeIdCounter++}');
          }
        }
        _itemEntryIds[id] = entryIds;
        continue;
      }
      for (final entry in list) {
        _indexNodeIds(entry);
      }
    }
  }

  /// Stamps the built node with its `jsr:<nodeId>` key and records the
  /// applied node. [ParentDataWidget]s (Expanded/Flexible/Spacer/Positioned)
  /// must sit directly inside their Flex/Stack parent, so the key goes on
  /// the widget INSIDE them (issue #14): their subtree keeps the parent
  /// data path AND the dump finds the stamped element with its own nodeId.
  Widget _stampNode(Object? identity, Widget built, String? nodeIdOverride) {
    final id = nodeIdOverride ?? _nodeIds[identity];
    if (id == null) return built;
    final record = Map<String, dynamic>.from(identity as Map);
    final items = record.remove('items');
    if (items is List) _appliedItems[id] = items;
    record
      ..remove('child')
      ..remove('children');
    _appliedRecords[id] = record;
    if (built is ParentDataWidget) {
      // Issue #14, take two: a ParentDataWidget MUST stay unwrapped (its
      // Flex/Stack parent-data path is load-bearing — wrapping its child
      // drops the flex behavior and collapses scenes). The dump joins it
      // through the built instance's identity instead of a key: no tree
      // change, node still dumped with its own nodeId.
      _parentDataInstances[built] = id;
      return built;
    }
    return KeyedSubtree(key: ValueKey<String>('jsr:$id'), child: built);
  }

  // ── Dispatcher ────────────────────────────────────────────────────────────

  /// Built subtrees memoized by source-map identity. Widgets are immutable
  /// configs: returning the same instance for an unchanged node lets Flutter
  /// skip the subtree rebuild entirely (`identical` short-circuit). Render
  /// loops that re-render every frame with mostly-unchanged maps (or rebuild
  /// the same tree on unrelated state changes) hit this cache heavily — it
  /// cut the profile's build time roughly in half. Bounded like the mesh
  /// cache so mutated/discarded scenes cannot grow it unboundedly.
  final Map<Map, Widget> _widgetCache = {};
  static const _widgetCacheLimit = 256;

  Widget _build(dynamic node, {Object? cacheKey, String? nodeId}) {
    if (node is! Map) return const SizedBox.shrink();
    final hooks = buildHooks;
    final raw = node.cast<String, dynamic>();
    final effective = hooks?.effectiveNode?.call(raw) ?? raw;
    final merged = !identical(effective, raw);
    final key = cacheKey is Map ? cacheKey : node;
    if (!merged) {
      final cached = _widgetCache[key];
      if (cached != null) return cached;
    }
    var built = _buildNode(effective);
    built = _stampNode(node, built, nodeId);
    if (_widgetCache.length >= _widgetCacheLimit) _widgetCache.clear();
    if (!merged) _widgetCache[key] = built;
    return built;
  }

  /// Builds a child through the host hooks (stamping + skip), then the
  /// normal build. [cacheKey] keeps the memo keyed on the RAW child so
  /// stamped copies (fresh identity every build) still hit the cache.
  Widget? _buildChild(dynamic child, Map<String, dynamic> parent, int index) {
    final hooks = buildHooks;
    Object? cacheKey;
    var target = child;
    var childId = child is Map ? _nodeIds[child] : null;
    if (hooks?.stampChild != null && child is Map) {
      final stamped = hooks!.stampChild!(
        child.cast<String, dynamic>(),
        parent,
        index,
      );
      if (hooks.skipChild?.call(stamped) == true) return null;
      target = stamped;
      cacheKey = child;
    }
    return _build(target, cacheKey: cacheKey, nodeId: childId);
  }

  /// Node-type → builder table. A flat map, not a switch: the renderer's
  /// cyclomatic complexity lives HERE as data (one entry per node type)
  /// instead of as branches in [_buildNode] — the crap4dart >= 0.14
  /// complexity counting charges every switch case, which pushed the
  /// dispatcher past the CRAP ratchet (comp ~94). Aliased types register
  /// the same builder under both keys.
  late final Map<String, Widget Function(Map<String, dynamic>)> _nodeBuilders =
      {
        'column': _column,
        'row': _row,
        'stack': _stack,
        'center': _centerNode,
        'align': _align,
        'expanded': _expandedNode,
        'flexible': _flexibleNode,
        'wrap': _wrap,
        'padding': _paddingNode,
        'sizedBox': _sizedBox,
        'spacer': _spacerNode,
        'safeArea': _safeAreaNode,
        'text': _text,
        'icon': _icon,
        'divider': _divider,
        'circularProgressIndicator': _spinner,
        'linearProgressIndicator': _linearProgress,
        'container': _container,
        'card': _card,
        'inkWell': _inkWell,
        'scroll': _scroll,
        'listView': _listView,
        'gridView': _gridView,
        'adaptive': _adaptive,
        'listTile': _listTile,
        'markdown': _markdown,
        'circleAvatar': _circleAvatar,
        'chip': _chip,
        'badge': _badge,
        'switch': _switchNode,
        'checkbox': _checkboxNode,
        'slider': _sliderNode,
        'dropdown': _dropdown,
        'button': _elevatedButton,
        'textButton': _textButton,
        'outlinedButton': _outlinedButton,
        'iconButton': _iconButton,
        // Material 3 nodes
        'appBar': _appBarNode,
        'navigationBar': _navigationBarNode,
        'tabBar': _tabBarNode,
        'fab': _fabNode,
        'segmentedButton': _segmentedButtonNode,
        'radio': _radioNode,
        'searchBar': _searchBarNode,
        'tooltip': _tooltipNode,
        'popupMenu': _popupMenuNode,
        'banner': _bannerNode,
        'bottomAppBar': _bottomAppBarNode,
        'bottomSheet': _bottomSheetNode,
        'dialog': _dialogNode,
        'snackBar': _snackBarNode,
        'navigationRail': _navigationRailNode,
        'carousel': _carouselNode,
        'image': _image,
        'svg': _svg,
        'aspectRatio': _aspectRatio,
        // `opacity` is now handled by universal effect props; keep the node
        // type as a thin wrapper so existing JSON trees still work.
        'opacity': _opacityNode,
        'clipRRect': _clipRRect,
        'textField': _textFieldNode,
        'textArea': _textAreaNode,
        'chart': _chartNode,
        'flChart': _flChartNode,
        'datePicker': _datePickerNode,
        'timePicker': _timePickerNode,
        'drawer': _drawerNode,
        'blur': _blurNode,
        // Animated widgets (implicit animations)
        'animatedContainer': _animatedContainer,
        'animatedOpacity': _animatedOpacity,
        'animatedPositioned': _animatedPositioned,
        // Transition animations (mount + view switching)
        'entrance': _entranceNode,
        'animatedSwitcher': _animatedSwitcherNode,
        // Gesture input
        'gestureDetector': _gestureDetector,
        // New nodes
        'path': (m) => buildJsPathNode(m),
        'rect': (m) => buildJsRectNode(m),
        'circle': (m) => buildJsCircleNode(m),
        'line': (m) => buildJsLineNode(m),
        'polygon': (m) => buildJsPolygonNode(m),
        'map': (m) => buildJsMapNode(m, onEvent, tileProvider: mapTileProvider),
        'absoluteFill': _absoluteFill,
        'fill': _absoluteFill,
        'video': _video,
        'audio': _audio,
        'audio_player': _audioPlayer,
        'webView': _webView,
        'scene3d': _scene3d,
        'three': _three,
        'voxel': _voxel,
      };

  Widget _buildNode(Map<String, dynamic> m) {
    final type = m['type'] as String? ?? '';

    final custom = customBuilders?[type];
    if (custom != null) {
      // Apply universal effects *inside* the deferred Builder so that custom
      // builders have a chance to consume (and strip) the same props first.
      // This avoids a double application of offsetX/Y, scale, rotation,
      // opacity and blur when the custom builder already handles them.
      return Builder(
        builder: (context) {
          final built = custom(context, m);
          return _applyUniversalEffects(built, m);
        },
      );
    }

    final hooks = buildHooks;
    final finish = hooks?.finishNode;
    final builder = _nodeBuilders[type] ?? _unknownType;
    final child = builder(m);

    // expanded/flexible/spacer are PURE LAYOUT: they must sit directly
    // inside their Flex parent, so neither the host finishNode nor the
    // universal effects may wrap them (wrapping strips the Flex parent
    // data and collapses the scene with "Incorrect use of ParentDataWidget").
    final isFlexChild =
        child is! Expanded && child is! Flexible && child is! Spacer;
    final hostFinished =
        finish != null &&
        !(customBuilders?.containsKey(type) ?? false) &&
        isFlexChild;
    return _applyUniversalEffects(hostFinished ? finish(m, child) : child, m);
  }

  // --- Thin per-type builders for the former inline switch cases. ------
  // Each keeps the EXACT widget the switch arm used to construct.

  Widget _centerNode(Map<String, dynamic> m) => Center(child: _child(m));

  Widget _expandedNode(Map<String, dynamic> m) =>
      Expanded(flex: _int(m['flex'], 1), child: _child(m)!);

  Widget _flexibleNode(Map<String, dynamic> m) =>
      Flexible(flex: _int(m['flex'], 1), child: _child(m)!);

  Widget _paddingNode(Map<String, dynamic> m) =>
      Padding(padding: _edgeInsets(m['padding']), child: _child(m));

  Widget _spacerNode(Map<String, dynamic> m) {
    final flex = _int(m['flex'], 1);
    return Spacer(flex: flex);
  }

  Widget _safeAreaNode(Map<String, dynamic> m) =>
      SafeArea(child: _child(m) ?? const SizedBox());

  Widget _opacityNode(Map<String, dynamic> m) =>
      _child(m) ?? const SizedBox.shrink();

  Widget _blurNode(Map<String, dynamic> m) =>
      _applyBlur(_child(m) ?? const SizedBox.shrink(), m['sigma']);

  Widget _entranceNode(Map<String, dynamic> m) =>
      buildJsEntranceNode(m, _child(m) ?? const SizedBox.shrink());

  Widget _animatedSwitcherNode(Map<String, dynamic> m) =>
      buildJsAnimatedSwitcherNode(m, _child(m) ?? const SizedBox.shrink());

  Widget _unknownType(Map<String, dynamic> m) {
    final type = m['type'] as String? ?? '?';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.orange.withValues(alpha: 0.6)),
        borderRadius: BorderRadius.circular(6),
        color: Colors.orange.withValues(alpha: 0.08),
      ),
      child: Text(
        'Unknown type: $type',
        style: const TextStyle(fontSize: 11, color: Colors.orange),
      ),
    );
  }

  Widget _absoluteFill(Map<String, dynamic> m) => Container(
    constraints: const BoxConstraints.expand(),
    color: _color(m['color'] as String?),
    child: _child(m),
  );

  Widget _mediaPlaceholder(
    Map<String, dynamic> m,
    IconData icon, {
    String? label,
  }) {
    final effectiveLabel =
        label ?? m['label'] as String? ?? m['text'] as String?;
    return Container(
      width: _doubleOrNull(m['width']) ?? 120,
      height: _doubleOrNull(m['height']) ?? 80,
      color: _color(m['color'] as String?) ?? Colors.black12,
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: _double(m['size'], 32)),
          if (effectiveLabel != null)
            Text(effectiveLabel, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }

  Widget _image(Map<String, dynamic> m) {
    final url = m['url'] as String? ?? m['src'] as String? ?? '';
    final w = _doubleOrNull(m['width']);
    final h = _doubleOrNull(m['height']);
    final fit = _boxFit(m['fit'] as String?);
    if (url.isEmpty) return const SizedBox.shrink();

    if (url.startsWith('external:')) {
      return _externalImage(url.substring(9), w, h, fit);
    }

    ImageProvider? provider;
    if (imageResolver != null) {
      provider = imageResolver!(url);
    }
    provider ??= _resolveImageProvider(url);

    if (provider == null) return const SizedBox.shrink();

    return _imageWidget(
      provider,
      w,
      h,
      fit,
      filterQuality: m['filterQuality'] == 'none'
          ? FilterQuality.none
          : FilterQuality.low,
    );
  }

  Widget _externalImage(String id, double? w, double? h, BoxFit fit) {
    final resolver = externalAssetResolver;
    if (resolver == null) {
      return Icon(Icons.broken_image, size: w ?? 48);
    }
    return FutureBuilder<Uint8List?>(
      future: resolver.resolve(id),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return SizedBox(
            width: w,
            height: h,
            child: const LinearProgressIndicator(),
          );
        }
        final bytes = snapshot.data;
        if (bytes == null || bytes.isEmpty) {
          return Icon(Icons.broken_image, size: w ?? 48);
        }
        return _imageWidget(MemoryImage(bytes), w, h, fit);
      },
    );
  }

  Widget _imageWidget(
    ImageProvider provider,
    double? w,
    double? h,
    BoxFit fit, {
    FilterQuality filterQuality = FilterQuality.low,
  }) => Image(
    image: provider,
    width: w,
    height: h,
    fit: fit,
    filterQuality: filterQuality,
    gaplessPlayback: true,
    errorBuilder: (_, __, ___) => Icon(Icons.broken_image, size: w ?? 48),
  );

  ImageProvider? _resolveImageProvider(String source) {
    final dataImage = _dataImageProvider(source);
    if (dataImage != null) return dataImage;
    if (source.startsWith('data:image/')) return null;
    if (source.startsWith('asset:')) {
      return AssetImage(source.substring(6));
    }
    if (source.startsWith('file:')) {
      return resolveFileImageProvider(source.substring(5));
    }
    // dart:io's default `Dart/x.y (dart:io)` UA is rejected by popular CDNs
    // (Wikimedia answers 400), so send a browser-ish one by default.
    return NetworkImage(source, headers: const {'User-Agent': _imageUserAgent});
  }

  static const _imageUserAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
      'AppleWebKit/537.36 (KHTML, like Gecko) '
      'Chrome/126.0.0.0 Safari/537.36';

  Widget _video(Map<String, dynamic> m) {
    final host = mediaHost;
    if (host == null) return _mediaPlaceholder(m, Icons.videocam);
    return JsVideoWidget(host: host, node: m, onEvent: onEvent);
  }

  Widget _audio(Map<String, dynamic> m) {
    final host = mediaHost;
    if (host == null) return _mediaPlaceholder(m, Icons.audiotrack);
    return JsAudioWidget(host: host, node: m);
  }

  Widget _audioPlayer(Map<String, dynamic> m) {
    final host = mediaHost;
    if (host == null) return const SizedBox.shrink();
    return JsAudioPlayerWidget(host: host, node: m);
  }

  Widget _webView(Map<String, dynamic> m) {
    final host = webViewHost;
    if (host == null) return _mediaPlaceholder(m, Icons.language);
    final messageEvent =
        (m['onMessage'] as String?) ?? (m['onEvent'] as String?);
    return host.buildWebView(
      src: (m['src'] as String?) ?? (m['url'] as String?) ?? '',
      onMessage: messageEvent == null
          ? null
          : (message) => onEvent(messageEvent, {'value': message}),
      width: _doubleOrNull(m['width']),
      height: _doubleOrNull(m['height']),
    );
  }

  Widget _scene3d(Map<String, dynamic> m) {
    // Software-rendered mesh scenes need no host: pure Dart CustomPaint.
    if (m['meshes'] is List) {
      return JsScene3dMeshNode(
        node: Map<String, dynamic>.from(m),
        onEvent: onEvent,
      );
    }
    final host = js3dHost;
    final sceneId = m['id'] as String? ?? 'default';
    if (host == null) {
      return _mediaPlaceholder(m, Icons.view_in_ar, label: '3D scene');
    }
    return JsScene3dNode(
      sceneId: sceneId,
      host: host,
      config: Map<String, dynamic>.from(m),
      onSceneTap: onScene3dTap,
    );
  }

  /// One cached GlobalKey per (engineId, surfaceId): identity-stable across
  /// renders so Flutter reparents the three node instead of remounting it.
  static final Map<String, Key> _threeSurfaceKeys = {};

  static Key _threeSurfaceKey(String engineId, String surfaceId) =>
      _threeSurfaceKeys.putIfAbsent(
        '$engineId/$surfaceId',
        () => GlobalKey(debugLabel: 'jsr-three/$engineId/$surfaceId'),
      );

  Widget _three(Map<String, dynamic> m) {
    final host = threeHost;
    if (host == null) {
      return _mediaPlaceholder(
        m,
        Icons.view_in_ar,
        label: 'three.unsupported: host',
      );
    }
    // Reparent-stable identity: the R1 render stream can flip the tree ROOT
    // between renders (e.g. a bare `three` root before the widget's first
    // jsr.render on the isolate lane). Without a stable GlobalKey Flutter
    // remounts the node on every render and the second attach races the old
    // state's release → `three.surface: main#1 is already attached`.
    // GlobalObjectKey is unsuitable here: it compares its value by
    // `identical()`, and a freshly interpolated string is a new instance
    // every build — the key must be a SINGLE cached instance per surface.
    return KeyedSubtree(
      key: _threeSurfaceKey(
        '${m['engineId']}',
        '${m['surfaceId'] ?? m['canvasId'] ?? 'main'}',
      ),
      child: JsThreeNode(
        host: host,
        config: Map<String, dynamic>.from(m),
        onEvent: onThreeEvent,
      ),
    );
  }

  Widget _voxel(Map<String, dynamic> m) {
    if (voxelWorld == null) {
      return _mediaPlaceholder(m, Icons.landscape, label: 'Voxel world');
    }
    return JsVoxelNode(world: voxelWorld!, config: parseVoxelNodeConfig(m));
  }

  Widget _svg(Map<String, dynamic> m) {
    final raw =
        m['data'] as String? ??
        m['svg'] as String? ??
        m['path'] as String? ??
        '';
    final w = _doubleOrNull(m['width']) ?? _doubleOrNull(m['size']);
    final h = _doubleOrNull(m['height']) ?? _doubleOrNull(m['size']);
    final fit = _boxFit(m['fit'] as String?);
    final tint = _color(m['color'] as String? ?? m['fill'] as String?);
    if (raw.trim().isEmpty) {
      return Icon(Icons.image_not_supported_outlined, size: w ?? 48);
    }

    final markup = _normalizeSvgMarkup(raw, m);
    Widget picture = SvgPicture.string(
      markup,
      fit: fit,
      width: w,
      height: h,
      colorFilter: tint == null
          ? null
          : ColorFilter.mode(tint, BlendMode.srcIn),
    );
    if (w != null || h != null) {
      picture = SizedBox(width: w, height: h, child: picture);
    }
    return picture;
  }

  String _normalizeSvgMarkup(String raw, Map<String, dynamic> m) {
    final trimmed = raw.trim();
    if (trimmed.startsWith('<')) return trimmed;

    final fill = m['fill'] as String? ?? m['color'] as String? ?? '#FF5733';
    final viewBox = m['viewBox'] as String? ?? '0 0 100 100';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="$viewBox">'
        '<path d="$trimmed" fill="$fill"/></svg>';
  }

  Widget? _child(Map<String, dynamic> m) {
    final c = m['child'];
    if (c == null) return null;
    return _buildChild(c, m, 0);
  }

  List<Widget> _children(Map<String, dynamic> m) {
    final raw = m['children'] as List? ?? [];
    final out = <Widget>[];
    var index = 0;
    for (final c in raw) {
      final built = _buildChild(c, m, index);
      index++;
      if (built != null) out.add(built);
    }
    return out;
  }

  VoidCallback? _tapHandler(dynamic actionId, dynamic payload) {
    if (actionId == null) return null;
    final id = actionId.toString();
    final p = payload is Map
        ? payload.cast<String, dynamic>()
        : <String, dynamic>{};
    return () => onEvent(id, p);
  }

  // ── Gesture Detector ──────────────────────────────────────────────────────

  // Builds a nullable gesture callback from a node prop: null when the prop
  // is absent (so the recognizer is not created), otherwise a closure that
  // fires the event id through [fire]/[fireFast]. Keeps _gestureDetector's
  // cyclomatic complexity under the CRAP gate.
  T? _gestureHandler<T extends Function>(
    Map<String, dynamic> m,
    String key,
    T Function(String id) build,
  ) {
    final id = m[key];
    return id == null ? null : build(id.toString());
  }

  Widget _gestureDetector(Map<String, dynamic> m) {
    final child = _child(m) ?? const SizedBox.shrink();
    // Static payload merged into every gesture event (gesture coords win on
    // a key clash) — the same `payload` contract buttons/listTiles have,
    // so e.g. hotbar slots can fire `onTap: 'hotbar', payload: {slot: 3}`.
    final staticPayload = m['payload'] is Map
        ? (m['payload'] as Map).cast<String, dynamic>()
        : const <String, dynamic>{};
    // Use scheduleMicrotask to defer onEvent calls outside Flutter's gesture/mouse
    // tracking pipeline — prevents !_debugDuringDeviceUpdate assertion.
    void fire(String event, Map<String, dynamic> payload) => scheduleMicrotask(
      () => onEvent(event, <String, dynamic>{...staticPayload, ...payload}),
    );
    // High-frequency streams (pan/scroll) bypass the serialized round-trip
    // queue when the host provides a fire-and-forget sink.
    void fireFast(String event, Map<String, dynamic> payload) =>
        scheduleMicrotask(
          () => (onGestureEvent ?? onEvent)(event, <String, dynamic>{
            ...staticPayload,
            ...payload,
          }),
        );
    Map<String, dynamic> xy(Offset o) => {'x': o.dx, 'y': o.dy};
    Map<String, dynamic> vel(Velocity v) => {
      'velocityX': v.pixelsPerSecond.dx,
      'velocityY': v.pixelsPerSecond.dy,
    };
    final gd = GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: _gestureHandler(
        m,
        'onTap',
        (id) =>
            () => fire(id, {}),
      ),
      onTapDown: _gestureHandler(
        m,
        'onTapDown',
        (id) =>
            (TapDownDetails d) => fire(id, xy(d.localPosition)),
      ),
      onTapUp: _gestureHandler(
        m,
        'onTapUp',
        (id) =>
            (TapUpDetails d) => fire(id, xy(d.localPosition)),
      ),
      // Cancel surfaces: without them a gesture stolen by the arena or the
      // OS (iOS edge gestures) leaves widget-side "held" state stuck.
      onTapCancel: _gestureHandler(
        m,
        'onTapCancel',
        (id) =>
            () => fire(id, {}),
      ),
      onPanStart: _gestureHandler(
        m,
        'onPanStart',
        (id) =>
            (DragStartDetails d) => fire(id, xy(d.localPosition)),
      ),
      onPanUpdate: _gestureHandler(
        m,
        'onPanUpdate',
        (id) =>
            (DragUpdateDetails d) => fireFast(id, {
              ...xy(d.localPosition),
              'dx': d.delta.dx,
              'dy': d.delta.dy,
            }),
      ),
      onPanEnd: _gestureHandler(
        m,
        'onPanEnd',
        (id) =>
            (DragEndDetails d) => fire(id, vel(d.velocity)),
      ),
      onPanCancel: _gestureHandler(
        m,
        'onPanCancel',
        (id) =>
            () => fire(id, {}),
      ),
      // Long press (Minecraft-style hold actions): stationary hold wins the
      // arena, a moved finger loses to pan, a quick lift loses to tap.
      onLongPress: _gestureHandler(
        m,
        'onLongPress',
        (id) =>
            () => fire(id, {}),
      ),
      onLongPressStart: _gestureHandler(
        m,
        'onLongPressStart',
        (id) =>
            (LongPressStartDetails d) => fire(id, xy(d.localPosition)),
      ),
      onLongPressMoveUpdate: _gestureHandler(
        m,
        'onLongPressMoveUpdate',
        (id) =>
            (LongPressMoveUpdateDetails d) => fireFast(id, {
              ...xy(d.localPosition),
              'dx': d.localOffsetFromOrigin.dx,
              'dy': d.localOffsetFromOrigin.dy,
            }),
      ),
      onLongPressEnd: _gestureHandler(
        m,
        'onLongPressEnd',
        (id) =>
            (LongPressEndDetails d) => fire(id, vel(d.velocity)),
      ),
      onLongPressUp: _gestureHandler(
        m,
        'onLongPressUp',
        (id) =>
            () => fire(id, {}),
      ),
      onLongPressCancel: _gestureHandler(
        m,
        'onLongPressCancel',
        (id) =>
            () => fire(id, {}),
      ),
      child: child,
    );
    return _maybePointerSignal(m, gd);
  }

  /// Two-finger trackpad swipe (and the mouse wheel) arrive as pointer
  /// scroll SIGNALS, not drag gestures — surface them as `onScroll`
  /// `{dx, dy}` so widgets can drive look/scroll actions without a
  /// pressed button. (GestureDetector has no signal surface — Listener.)
  Widget _maybePointerSignal(Map<String, dynamic> m, Widget built) {
    final onScroll = m['onScroll'];
    if (onScroll == null) return built;
    return Listener(
      behavior: HitTestBehavior.opaque,
      onPointerSignal: (event) {
        if (event is PointerScrollEvent) {
          // Defer outside Flutter's pointer pipeline (same reason as fire()).
          final sink = onGestureEvent ?? onEvent;
          scheduleMicrotask(
            () => sink(onScroll as String, {
              'dx': event.scrollDelta.dx,
              'dy': event.scrollDelta.dy,
            }),
          );
        }
      },
      child: built,
    );
  }

  // ── AUI dump (conformance PROTOCOL section 2) ────────────────────────────

  /// Normalized AUI dump of the currently built node tree:
  /// `{type, props, children, events, nodeId}` per node, `n<i>` ids from
  /// the payload, type aliases resolved, `style` merged into `props` (node
  /// keys win), `on*` string props in `events`, colors `#RRGGBB[AA]`, and
  /// text-bearing props read live from the built widgets (`Text.data`,
  /// `EditableText` controller text, `Tooltip` message). Starts at the
  /// first stamped element below [rootContext].
  Map<String, dynamic> dumpViewTree(BuildContext rootContext) {
    final root = _findStampedElement(rootContext as Element);
    if (root == null) return <String, dynamic>{};
    return _dumpNode(root);
  }

  static bool _isStamped(Widget widget) =>
      widget is KeyedSubtree &&
      widget.key is ValueKey<String> &&
      (widget.key as ValueKey<String>).value.startsWith('jsr:');

  Element? _findStampedElement(Element element) {
    if (_isStamped(element.widget)) return element;
    Element? found;
    element.visitChildElements((child) {
      found ??= _findStampedElement(child);
    });
    return found;
  }

  Map<String, dynamic> _dumpNode(Element element, {String? forcedId}) {
    final id =
        forcedId ??
        ((element.widget as KeyedSubtree).key! as ValueKey<String>).value
            .substring(4);
    final record = _appliedRecords[id] ?? const <String, dynamic>{};
    final type = UiViewTreeNormalizer.resolveType('${record['type'] ?? ''}');
    final props = _dumpProps(element, record);
    if (type == 'scroll') _applyScrollState(element, props);
    var children = _dumpChildren(element);
    if (children.isEmpty) children = _dumpItemChildren(id);
    return <String, dynamic>{
      'type': type,
      'props': props,
      'children': children,
      'events': _dumpEvents(record),
      'nodeId': id,
    };
  }

  /// Menu items are built lazily by their widget (`itemBuilder` fires only
  /// when the menu opens) and never appear in the element tree, so the
  /// payload's documented `items` list is joined here: every string entry
  /// dumps as a `text` node — the reference normalization lifts items to
  /// children. Nodes with element-tree children (payload `children`) never
  /// reach this path.
  List<Map<String, dynamic>> _dumpItemChildren(String id) {
    final items = _appliedItems[id];
    final entryIds = _itemEntryIds[id];
    if (items == null || entryIds == null) return const [];
    final children = <Map<String, dynamic>>[];
    for (var i = 0; i < items.length; i++) {
      final entry = items[i];
      if (entry is! String) continue;
      children.add(<String, dynamic>{
        'type': 'text',
        'props': <String, dynamic>{'data': entry},
        'children': const <Map<String, dynamic>>[],
        'events': const <String, dynamic>{},
        'nodeId': i < entryIds.length ? entryIds[i] : '',
      });
    }
    return children;
  }

  /// A3 (PROTOCOL amendment A3): a `scroll` dump carries its live scroll
  /// state — `scrollOffset` (pixels), `scrollExtent` (maxScrollExtent +
  /// viewportDimension), `viewportExtent` — in logical pixels, read from
  /// the node's `ScrollPosition` through the element tree. Nothing the
  /// widget builds changes (no controller attached); the numbers are
  /// additive dump props, so the payload-derived expected tree has no
  /// opinion about them while the comparator enforces their presence.
  void _applyScrollState(Element element, Map<String, dynamic> props) {
    ScrollPosition? position;
    void walk(Element node) {
      if (position != null) return;
      if (!identical(node, element) && _isStamped(node.widget)) return;
      if (node is StatefulElement && node.state is ScrollableState) {
        position = (node.state as ScrollableState).position;
        return;
      }
      node.visitChildElements(walk);
    }

    walk(element);
    final p = position;
    if (p == null) return;
    if (!p.hasContentDimensions || !p.hasViewportDimension) return;
    props['scrollOffset'] = p.pixels;
    props['scrollExtent'] = p.maxScrollExtent + p.viewportDimension;
    props['viewportExtent'] = p.viewportDimension;
  }

  /// The node's own props: style merged in (node keys win), reserved and
  /// event keys removed, values normalized — then live text overrides.
  Map<String, dynamic> _dumpProps(
    Element element,
    Map<String, dynamic> record,
  ) {
    final props = <String, dynamic>{};
    final style = record['style'];
    if (style is Map) {
      style.forEach((key, value) => props['$key'] = _normalizeDumpValue(value));
    }
    record.forEach((key, value) {
      if (_isReservedDumpKey(key)) return;
      if (_isEventKey(key) && value is String) return;
      props[key] = _normalizeDumpValue(value);
    });
    _applyLiveText(element, props);
    return props;
  }

  static bool _isReservedDumpKey(String key) =>
      key == 'type' ||
      key == 'style' ||
      key == 'child' ||
      key == 'children' ||
      key == 'items' ||
      key == 'key' ||
      key == '__iid' ||
      key == 'iid';

  static bool _isEventKey(String key) {
    if (key.length < 3 || !key.startsWith('on')) return false;
    final third = key[2];
    return third == third.toUpperCase() && third != third.toLowerCase();
  }

  static Map<String, dynamic> _dumpEvents(Map<String, dynamic> record) {
    final events = <String, dynamic>{};
    record.forEach((key, value) {
      if (_isEventKey(key) && value is String) events[key] = value;
    });
    UiViewTreeNormalizer.aliasDumpEventKeys('${record['type'] ?? ''}', events);
    return events;
  }

  /// Children in tree order: the first stamped element of every branch,
  /// descending through non-node wrappers (effect widgets, layout shims).
  List<Map<String, dynamic>> _dumpChildren(Element element) {
    final children = <Map<String, dynamic>>[];
    void walk(Element node) {
      node.visitChildElements((child) {
        final id = _parentDataInstances[child.widget];
        if (_isStamped(child.widget)) {
          children.add(_dumpNode(child));
        } else if (id != null) {
          children.add(_dumpNode(child, forcedId: id));
        } else {
          walk(child);
        }
      });
    }

    walk(element);
    return children;
  }

  /// Live text-bearing props: read from the node's own widgets, stopping at
  /// child-node boundaries (a nested node's text belongs to that node).
  void _applyLiveText(Element element, Map<String, dynamic> props) {
    String? text;
    String? editable;
    String? tooltip;
    void walk(Element node) {
      if (text != null && editable != null && tooltip != null) return;
      if (!identical(node, element) && _isStamped(node.widget)) return;
      final widget = node.widget;
      if (widget is Text && widget.data != null && text == null) {
        text = widget.data;
      }
      if (widget is EditableText && editable == null) {
        editable = widget.controller.text;
      }
      if (widget is Tooltip && tooltip == null) tooltip = widget.message;
      node.visitChildElements(walk);
    }

    walk(element);
    if (text != null) props['data'] = text;
    if (editable != null) props['text'] = editable;
    // Only report a live tooltip when the payload declares `message` —
    // widgets wrap themselves in Tooltip chrome (a PopupMenuButton always
    // adds a "Show menu" tooltip that the popupMenu node never declared).
    if (tooltip != null && props.containsKey('message')) {
      props['message'] = tooltip;
    }
  }

  /// Recursively normalizes dump values: hex color strings become
  /// `#RRGGBB` / `#RRGGBBAA` (upper case, 3/4-digit forms expanded);
  /// numbers and other JSON values pass through unchanged.
  static dynamic _normalizeDumpValue(dynamic value) {
    if (value is String) return _normalizeColorString(value);
    if (value is Map) {
      return {
        for (final entry in value.entries)
          '${entry.key}': _normalizeDumpValue(entry.value),
      };
    }
    if (value is List) return value.map(_normalizeDumpValue).toList();
    return value;
  }

  static final RegExp _hexColorPattern = RegExp(r'^#[0-9a-fA-F]{3,8}$');

  static String _normalizeColorString(String value) {
    if (!_hexColorPattern.hasMatch(value)) return value;
    var hex = value.substring(1);
    if (hex.length == 3 || hex.length == 4) {
      hex = hex.split('').map((c) => '$c$c').join();
    }
    if (hex.length != 6 && hex.length != 8) return value;
    return '#${hex.toUpperCase()}';
  }
}
