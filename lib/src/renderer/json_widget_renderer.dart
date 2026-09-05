import 'dart:async';
import 'dart:typed_data';
import 'dart:ui' show ImageFilter;

import 'package:fl_chart/fl_chart.dart';
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
    if (dart.library.html) 'package:js_widget_runtime/src/renderer/nodes/image_provider_resolver_web.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_3d_host.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_animation_nodes.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_map_node.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_node_helpers.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_path_node.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_shape_nodes.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_scene3d_mesh_node.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_scene3d_node.dart';
import 'package:js_widget_runtime/src/renderer/ui_view_field_registry.dart';

part 'json_widget_decoration.dart';

part 'nodes/js_input_nodes.dart';
part 'nodes/js_animated_nodes.dart';
part 'nodes/js_chart_nodes.dart';
part 'nodes/js_layout_nodes.dart';
part 'nodes/js_m3_nodes.dart';
part 'nodes/js_m3_overlay_nodes.dart';
part 'nodes/js_text_nodes.dart';

final _jsonWidgetDefaultColors = JsonWidgetTheme.fromAccent(Colors.deepPurple);

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
class JsonWidgetRenderer with JsonWidgetDecoration {
  // Not const: owns the per-instance widget memo cache.
  JsonWidgetRenderer({
    required this.onEvent,
    this.fieldRegistry,
    this.theme,
    this.imageResolver,
    this.customBuilders,
    this.mediaHost,
    this.webViewHost,
    this.js3dHost,
    this.onScene3dTap,
    this.externalAssetResolver,
    this.fontResolver,
    this.mapTileProvider,
  });

  /// Called when a user-triggered event fires (e.g. button tap).
  final void Function(String actionId, Map<String, dynamic> payload) onEvent;
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
    return _build(tree);
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

  Widget _build(dynamic node) {
    if (node is! Map) return const SizedBox.shrink();
    final cached = _widgetCache[node];
    if (cached != null) return cached;
    final built = _buildNode(node.cast<String, dynamic>());
    if (_widgetCache.length >= _widgetCacheLimit) _widgetCache.clear();
    _widgetCache[node] = built;
    return built;
  }

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

    final child = switch (type) {
      'column' => _column(m),
      'row' => _row(m),
      'stack' => _stack(m),
      'center' => Center(child: _child(m)),
      'align' => _align(m),
      'expanded' => Expanded(flex: _int(m['flex'], 1), child: _child(m)!),
      'flexible' => Flexible(flex: _int(m['flex'], 1), child: _child(m)!),
      'wrap' => _wrap(m),
      'padding' => Padding(
        padding: _edgeInsets(m['padding']),
        child: _child(m),
      ),
      'sizedBox' => _sizedBox(m),
      'spacer' => Spacer(flex: _int(m['flex'], 1)),
      'safeArea' => SafeArea(child: _child(m) ?? const SizedBox()),
      'text' => _text(m),
      'icon' => _icon(m),
      'divider' => _divider(m),
      'circularProgressIndicator' => _spinner(m),
      'linearProgressIndicator' => _linearProgress(m),
      'container' => _container(m),
      'card' => _card(m),
      'inkWell' => _inkWell(m),
      'scroll' => _scroll(m),
      'listView' => _listView(m),
      'gridView' => _gridView(m),
      'adaptive' => _adaptive(m),
      'listTile' => _listTile(m),
      'markdown' => _markdown(m),
      'circleAvatar' => _circleAvatar(m),
      'chip' => _chip(m),
      'badge' => _badge(m),
      'switch' => _switchNode(m),
      'checkbox' => _checkboxNode(m),
      'slider' => _sliderNode(m),
      'dropdown' => _dropdown(m),
      'button' => _elevatedButton(m),
      'textButton' => _textButton(m),
      'outlinedButton' => _outlinedButton(m),
      'iconButton' => _iconButton(m),
      // Material 3 nodes
      'appBar' => _appBarNode(m),
      'navigationBar' => _navigationBarNode(m),
      'tabBar' => _tabBarNode(m),
      'fab' => _fabNode(m),
      'segmentedButton' => _segmentedButtonNode(m),
      'radio' => _radioNode(m),
      'searchBar' => _searchBarNode(m),
      'tooltip' => _tooltipNode(m),
      'popupMenu' => _popupMenuNode(m),
      'banner' => _bannerNode(m),
      'bottomAppBar' => _bottomAppBarNode(m),
      'bottomSheet' => _bottomSheetNode(m),
      'dialog' => _dialogNode(m),
      'snackBar' => _snackBarNode(m),
      'navigationRail' => _navigationRailNode(m),
      'carousel' => _carouselNode(m),
      'image' => _image(m),
      'svg' => _svg(m),
      'aspectRatio' => _aspectRatio(m),
      // `opacity` is now handled by universal effect props; keep the node
      // type as a thin wrapper so existing JSON trees still work.
      'opacity' => _child(m) ?? const SizedBox.shrink(),
      'clipRRect' => _clipRRect(m),
      'textField' => _textFieldNode(m),
      'textArea' => _textAreaNode(m),
      'chart' => _chartNode(m),
      'flChart' => _flChartNode(m),
      'datePicker' => _datePickerNode(m),
      'timePicker' => _timePickerNode(m),
      'drawer' => _drawerNode(m),
      'blur' => _applyBlur(_child(m) ?? const SizedBox.shrink(), m['sigma']),

      // Animated widgets (implicit animations)
      'animatedContainer' => _animatedContainer(m),
      'animatedOpacity' => _animatedOpacity(m),
      'animatedPositioned' => _animatedPositioned(m),

      // Transition animations (mount + view switching)
      'entrance' => buildJsEntranceNode(
        m,
        _child(m) ?? const SizedBox.shrink(),
      ),
      'animatedSwitcher' => buildJsAnimatedSwitcherNode(
        m,
        _child(m) ?? const SizedBox.shrink(),
      ),

      // Gesture input
      'gestureDetector' => _gestureDetector(m),

      // New nodes
      'path' => buildJsPathNode(m),
      'rect' => buildJsRectNode(m),
      'circle' => buildJsCircleNode(m),
      'line' => buildJsLineNode(m),
      'polygon' => buildJsPolygonNode(m),
      'map' => buildJsMapNode(m, onEvent, tileProvider: mapTileProvider),
      'absoluteFill' || 'fill' => _absoluteFill(m),
      'video' => _video(m),
      'audio' => _audio(m),
      'audio_player' => _audioPlayer(m),
      'webView' => _webView(m),
      'scene3d' => _scene3d(m),

      _ => _unknownType(m),
    };

    return _applyUniversalEffects(child, m);
  }

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

    return _imageWidget(provider, w, h, fit);
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
    BoxFit fit,
  ) => Image(
    image: provider,
    width: w,
    height: h,
    fit: fit,
    gaplessPlayback: true,
    errorBuilder: (_, __, ___) => Icon(Icons.broken_image, size: w ?? 48),
  );

  ImageProvider? _resolveImageProvider(String source) {
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
    return JsVideoWidget(host: host, node: m);
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
    final messageEvent = (m['onMessage'] as String?) ?? (m['onEvent'] as String?);
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
    return _build(c);
  }

  List<Widget> _children(Map<String, dynamic> m) =>
      (m['children'] as List? ?? []).map<Widget>(_build).toList();

  VoidCallback? _tapHandler(dynamic actionId, dynamic payload) {
    if (actionId == null) return null;
    final id = actionId.toString();
    final p = payload is Map
        ? payload.cast<String, dynamic>()
        : <String, dynamic>{};
    return () => onEvent(id, p);
  }

  // ── Gesture Detector ──────────────────────────────────────────────────────

  Widget _gestureDetector(Map<String, dynamic> m) {
    final child = _child(m) ?? const SizedBox.shrink();
    // Use scheduleMicrotask to defer onEvent calls outside Flutter's gesture/mouse
    // tracking pipeline — prevents !_debugDuringDeviceUpdate assertion.
    void fire(String event, Map<String, dynamic> payload) =>
        scheduleMicrotask(() => onEvent(event, payload));
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: m['onTap'] != null ? () => fire(m['onTap'] as String, {}) : null,
      onTapDown: m['onTapDown'] != null
          ? (d) => fire(m['onTapDown'] as String, {
              'x': d.localPosition.dx,
              'y': d.localPosition.dy,
            })
          : null,
      onTapUp: m['onTapUp'] != null
          ? (d) => fire(m['onTapUp'] as String, {
              'x': d.localPosition.dx,
              'y': d.localPosition.dy,
            })
          : null,
      onPanStart: m['onPanStart'] != null
          ? (d) => fire(m['onPanStart'] as String, {
              'x': d.localPosition.dx,
              'y': d.localPosition.dy,
            })
          : null,
      onPanUpdate: m['onPanUpdate'] != null
          ? (d) => fire(m['onPanUpdate'] as String, {
              'x': d.localPosition.dx,
              'y': d.localPosition.dy,
              'dx': d.delta.dx,
              'dy': d.delta.dy,
            })
          : null,
      onPanEnd: m['onPanEnd'] != null
          ? (d) => fire(m['onPanEnd'] as String, {
              'velocityX': d.velocity.pixelsPerSecond.dx,
              'velocityY': d.velocity.pixelsPerSecond.dy,
            })
          : null,
      child: child,
    );
  }
}
