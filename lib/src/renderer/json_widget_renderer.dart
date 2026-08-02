import 'dart:async';
import 'dart:typed_data';
import 'dart:ui' show ImageFilter;

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
import 'package:js_widget_runtime/src/renderer/nodes/image_provider_resolver_stub.dart'
    if (dart.library.io) 'package:js_widget_runtime/src/renderer/nodes/image_provider_resolver_io.dart'
    if (dart.library.html) 'package:js_widget_runtime/src/renderer/nodes/image_provider_resolver_web.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_3d_host.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_animation_nodes.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_map_node.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_node_helpers.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_path_node.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_scene3d_mesh_node.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_scene3d_node.dart';
import 'package:js_widget_runtime/src/renderer/ui_view_field_registry.dart';

part 'nodes/js_input_nodes.dart';
part 'nodes/js_layout_nodes.dart';
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
class JsonWidgetRenderer {
  const JsonWidgetRenderer({
    required this.onEvent,
    this.fieldRegistry,
    this.theme,
    this.imageResolver,
    this.customBuilders,
    this.mediaHost,
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

  Widget _build(dynamic node) {
    if (node == null) return const SizedBox.shrink();
    if (node is! Map) return const SizedBox.shrink();
    final m = node.cast<String, dynamic>();
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
      'map' => buildJsMapNode(m, onEvent, tileProvider: mapTileProvider),
      'absoluteFill' || 'fill' => _absoluteFill(m),
      'video' => _video(m),
      'audio' => _audio(m),
      'audio_player' => _audioPlayer(m),
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

    Widget result = child;
    final type = m['type'] as String? ?? '';

    final offsetX = _doubleOrNull(m['offsetX']);
    final offsetY = _doubleOrNull(m['offsetY']);
    final scale = _doubleOrNull(m['scale']);
    final rotation = _doubleOrNull(m['rotation']);

    if (offsetX != null ||
        offsetY != null ||
        scale != null ||
        rotation != null) {
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
      result = Transform(
        transform: matrix,
        alignment: Alignment.center,
        child: result,
      );
    }

    result = _applyBlur(result, m['blur']);

    final opacity = _doubleOrNull(m['opacity']);
    // animatedOpacity handles opacity itself with an animation.
    if (opacity != null && opacity != 1.0 && type != 'animatedOpacity') {
      result = Opacity(opacity: opacity.clamp(0.0, 1.0), child: result);
    }

    return result;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

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
    if (v == null) return EdgeInsets.zero;
    if (v is num) return EdgeInsets.all(v.toDouble());
    if (v is List && v.length == 4) {
      return EdgeInsets.fromLTRB(
        (v[0] as num).toDouble(),
        (v[1] as num).toDouble(),
        (v[2] as num).toDouble(),
        (v[3] as num).toDouble(),
      );
    }
    if (v is Map) {
      return EdgeInsets.only(
        left: _double(v['left'], 0),
        top: _double(v['top'], 0),
        right: _double(v['right'], 0),
        bottom: _double(v['bottom'], 0),
      );
    }
    return EdgeInsets.zero;
  }

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
