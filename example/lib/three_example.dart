import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

/// Generated official examples exposed by this runner.
enum ThreeExampleSelection {
  minecraft(
    exampleId: 'webgl_geometry_minecraft',
    label: 'Minecraft',
    widgetId: 'three-minecraft',
    assetPath: 'widgets/three-minecraft/widget.js',
  ),
  geometryColors(
    exampleId: 'webgl_geometry_colors',
    label: 'Vertex Colors',
    widgetId: 'three-geometry-colors',
    assetPath: 'widgets/three-geometry-colors/widget.js',
  ),
  linesColors(
    exampleId: 'webgl_lines_colors',
    label: 'Line Colors',
    widgetId: 'three-lines-colors',
    assetPath: 'widgets/three-lines-colors/widget.js',
  ),
  bufferGeometryUint(
    exampleId: 'webgl_buffergeometry_uint',
    label: 'Integer BufferGeometry',
    widgetId: 'three-buffergeometry-uint',
    assetPath: 'widgets/three-buffergeometry-uint/widget.js',
  ),
  bufferGeometryIndexed(
    exampleId: 'webgl_buffergeometry_indexed',
    label: 'Indexed BufferGeometry',
    widgetId: 'three-buffergeometry-indexed',
    assetPath: 'widgets/three-buffergeometry-indexed/widget.js',
  ),
  bufferGeometryLinesIndexed(
    exampleId: 'webgl_buffergeometry_lines_indexed',
    label: 'Indexed BufferGeometry Lines',
    widgetId: 'three-buffergeometry-lines-indexed',
    assetPath: 'widgets/three-buffergeometry-lines-indexed/widget.js',
  ),
  bufferGeometryPoints(
    exampleId: 'webgl_buffergeometry_points',
    label: 'BufferGeometry Points',
    widgetId: 'three-buffergeometry-points',
    assetPath: 'widgets/three-buffergeometry-points/widget.js',
  ),
  geometryTerrainRaycast(
    exampleId: 'webgl_geometry_terrain_raycast',
    label: 'Terrain Raycast',
    widgetId: 'three-geometry-terrain-raycast',
    assetPath: 'widgets/three-geometry-terrain-raycast/widget.js',
  ),
  mathOrientationTransform(
    exampleId: 'webgl_math_orientation_transform',
    label: 'Orientation Transform',
    widgetId: 'three-math-orientation-transform',
    assetPath: 'widgets/three-math-orientation-transform/widget.js',
  ),
  interactiveRaycastingPoints(
    exampleId: 'webgl_interactive_raycasting_points',
    label: 'Raycasting Points',
    widgetId: 'three-interactive-raycasting-points',
    assetPath: 'widgets/three-interactive-raycasting-points/widget.js',
  ),
  interactiveCubes(
    exampleId: 'webgl_interactive_cubes',
    label: 'Interactive Cubes',
    widgetId: 'three-interactive-cubes',
    assetPath: 'widgets/three-interactive-cubes/widget.js',
  ),
  interactiveCubesOrtho(
    exampleId: 'webgl_interactive_cubes_ortho',
    label: 'Orthographic Cubes',
    widgetId: 'three-interactive-cubes-ortho',
    assetPath: 'widgets/three-interactive-cubes-ortho/widget.js',
  ),
  mathObb(
    exampleId: 'webgl_math_obb',
    label: 'Oriented Bounding Boxes',
    widgetId: 'three-math-obb',
    assetPath: 'widgets/three-math-obb/widget.js',
  ),
  bufferGeometryPointsInterleaved(
    exampleId: 'webgl_buffergeometry_points_interleaved',
    label: 'Interleaved Points',
    widgetId: 'three-buffergeometry-points-interleaved',
    assetPath: 'widgets/three-buffergeometry-points-interleaved/widget.js',
  ),
  interactiveVoxelPainter(
    exampleId: 'webgl_interactive_voxelpainter',
    label: 'Voxel Painter',
    widgetId: 'three-interactive-voxelpainter',
    assetPath: 'widgets/three-interactive-voxelpainter/widget.js',
  ),
  panoramaEquirectangular(
    exampleId: 'webgl_panorama_equirectangular',
    label: 'Equirectangular Panorama',
    widgetId: 'three-panorama-equirectangular',
    assetPath: 'widgets/three-panorama-equirectangular/widget.js',
  );

  const ThreeExampleSelection({
    required this.exampleId,
    required this.label,
    required this.widgetId,
    required this.assetPath,
  });

  static ThreeExampleSelection get initial {
    const exampleId = String.fromEnvironment('JSR_THREE_EXAMPLE');
    if (exampleId.isEmpty) return minecraft;
    for (final selection in values) {
      if (selection.exampleId == exampleId) return selection;
    }
    throw ArgumentError.value(
      exampleId,
      'JSR_THREE_EXAMPLE',
      'Unsupported official three.js example',
    );
  }

  final String exampleId;
  final String label;
  final String widgetId;
  final String assetPath;
}

/// Samples the rate of frames actually presented by a THREE surface.
class ThreeFpsSampler {
  int? _presentedFrames;
  DateTime? _sampledAt;
  double? _fps;

  double? get fps => _fps;

  double? sample(int presentedFrames, DateTime now) {
    final previousFrames = _presentedFrames;
    final previousSample = _sampledAt;
    _presentedFrames = presentedFrames;
    _sampledAt = now;
    if (previousFrames == null ||
        previousSample == null ||
        presentedFrames < previousFrames) {
      return _fps = null;
    }
    final seconds = now.difference(previousSample).inMicroseconds / 1000000;
    if (seconds <= 0) return _fps;
    return _fps = (presentedFrames - previousFrames) / seconds;
  }
}

/// Runs unmodified official three.js r186 example modules.
///
/// Native: upstream object model + R1 + Flutter GPU. Web: real WebGL2 in the
/// existing Worker + ImageBitmap presentation. No WebView is used.
Future<void> main() async {
  runApp(const ThreeExampleApp());
}

class ThreeExampleApp extends StatefulWidget {
  const ThreeExampleApp({super.key});

  @override
  State<ThreeExampleApp> createState() => _ThreeExampleAppState();
}

class _ThreeExampleAppState extends State<ThreeExampleApp> {
  ThreeExampleSelection _selection = ThreeExampleSelection.initial;
  ThreeExampleSelection? _pendingSelection;

  void _selectExample(ThreeExampleSelection selection) {
    final displayedSelection = _pendingSelection ?? _selection;
    if (selection == displayedSelection) return;
    if (selection == _selection) {
      setState(() => _pendingSelection = null);
      return;
    }

    // Paint the loading overlay before disposing the old engine and starting
    // the next one. Both operations can synchronously occupy the UI isolate.
    setState(() => _pendingSelection = selection);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _pendingSelection != selection) return;
      setState(() {
        _selection = selection;
        _pendingSelection = null;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final displayedSelection = _pendingSelection ?? _selection;
    final pendingSelection = _pendingSelection;
    return MaterialApp(
      title: 'THREE r186 Samples',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true),
      home: Scaffold(
        body: Row(
          children: [
            _ThreeExampleSidebar(
              selection: displayedSelection,
              onChanged: _selectExample,
            ),
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  ThreeExamplePage(
                    key: ValueKey(_selection),
                    selection: _selection,
                  ),
                  if (pendingSelection != null)
                    Positioned.fill(
                      child: _ThreeExampleLoading(selection: pendingSelection),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ThreeExampleSidebar extends StatelessWidget {
  const _ThreeExampleSidebar({
    required this.selection,
    required this.onChanged,
  });

  final ThreeExampleSelection selection;
  final ValueChanged<ThreeExampleSelection> onChanged;

  @override
  Widget build(BuildContext context) => Material(
    color: const Color(0xFF111827),
    child: Container(
      width: 248,
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'THREE r186',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
            ),
          ),
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 4, 20, 18),
            child: Text(
              'OFFICIAL SAMPLES  •  0.186.1',
              style: TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 10,
                letterSpacing: 1.1,
              ),
            ),
          ),
          Expanded(
            child: ListView(
              children: [
                for (final example in ThreeExampleSelection.values)
                  ListTile(
                    dense: true,
                    selected: example == selection,
                    selectedColor: const Color(0xFFE0F2FE),
                    selectedTileColor: const Color(0xFF164E63),
                    leading: Icon(
                      example == selection
                          ? Icons.play_circle_fill
                          : Icons.play_circle_outline,
                      size: 19,
                    ),
                    title: Text(example.label),
                    onTap: () => onChanged(example),
                  ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 12, 20, 0),
            child: Text(
              'QuickJS isolate  /  R1  /  Flutter GPU\n16 integrated native samples',
              style: TextStyle(
                color: Color(0xFF64748B),
                fontSize: 11,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class ThreeExamplePage extends StatefulWidget {
  const ThreeExamplePage({
    super.key,
    this.selection = ThreeExampleSelection.minecraft,
  });

  final ThreeExampleSelection selection;

  @override
  State<ThreeExamplePage> createState() => _ThreeExamplePageState();
}

class _ThreeExamplePageState extends State<ThreeExamplePage> {
  late final String _engineId = '${widget.selection.widgetId}-example';
  late final JsThreeHost _threeHost = kIsWeb
      ? createWebThreeHost(diagnosticsEnabled: true)
      : createFlutterGpuThreeHost();
  late final Future<String> _source = _loadSource();
  late final JsRuntimeConfig _config = JsRuntimeConfig(
    widgetId: widget.selection.widgetId,
    instanceId: _engineId,
    threeEnabled: true,
    threeHost: _threeHost,
    backendFactory: kIsWeb ? null : createQuickjsIsolateWidgetEngineBackend,
    onRender: (_) {},
    onSetTitle: (_) {},
    onStorageUpdate: (_) {},
  );
  final ThreeFpsSampler _fpsSampler = ThreeFpsSampler();
  Timer? _diagnosticsTimer;
  Object? _error;
  bool _ready = false;
  bool _startRuntime = false;

  Future<String> _loadSource() async {
    try {
      return await rootBundle.loadString(widget.selection.assetPath);
    } catch (error) {
      _showError(error);
      rethrow;
    }
  }

  void _showError(Object error) {
    if (!mounted) return;
    setState(() {
      _error = error;
      _ready = false;
    });
  }

  @override
  void initState() {
    super.initState();
    // Paint the loader once before creating the engine. Native QuickJS then
    // evaluates in its own isolate, so the indicator keeps animating.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) setState(() => _startRuntime = true);
    });
    _diagnosticsTimer = Timer.periodic(const Duration(milliseconds: 250), (_) {
      if (!mounted) return;
      final frames =
          (_threeHost
                      .findSurface(_engineId, 'main#1')
                      ?.diagnostics['presentedFrames'] ??
                  0)
              .toInt();
      if (frames > 0 && _error == null) _ready = true;
      _fpsSampler.sample(frames, DateTime.now());
      setState(() {});
    });
  }

  @override
  void dispose() {
    _diagnosticsTimer?.cancel();
    _threeHost.disposeEngine(_engineId);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFF0F172A),
    body: Stack(
      fit: StackFit.expand,
      children: [
        FutureBuilder<String>(
          future: _source,
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return Center(
                child: Text('three.assetFailure: ${snapshot.error}'),
              );
            }
            final source = snapshot.data;
            if (source == null || !_startRuntime) {
              return const SizedBox.expand();
            }
            return JsWidgetRuntimeWidget(
              jsSource: source,
              config: _config,
              onError: (error, stackTrace) {
                debugPrint('THREE example error: $error');
                _showError(error);
              },
            );
          },
        ),
        Positioned(
          left: 16,
          top: 16,
          child: IgnorePointer(
            child: _ThreeDiagnostics(
              host: _threeHost,
              engineId: _engineId,
              fps: _fpsSampler.fps,
            ),
          ),
        ),
        Positioned(
          right: 16,
          top: 16,
          child: IgnorePointer(
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: const Color(0xB8000000),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      widget.selection.label,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    Text(
                      widget.selection.exampleId,
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontFamily: 'monospace',
                        fontSize: 9,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        Positioned.fill(
          child: IgnorePointer(
            ignoring: _ready,
            child: ExcludeSemantics(
              excluding: _ready,
              child: AnimatedOpacity(
                opacity: _ready ? 0 : 1,
                duration: _ready
                    ? const Duration(milliseconds: 300)
                    : Duration.zero,
                curve: Curves.easeOut,
                child: _ThreeExampleLoading(
                  selection: widget.selection,
                  error: _error,
                ),
              ),
            ),
          ),
        ),
      ],
    ),
  );
}

class _ThreeExampleLoading extends StatelessWidget {
  const _ThreeExampleLoading({required this.selection, this.error});

  final ThreeExampleSelection selection;
  final Object? error;

  @override
  Widget build(BuildContext context) {
    final error = this.error;
    return ColoredBox(
      color: const Color(0xFF0F172A),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (error == null)
                Container(
                  width: 76,
                  height: 76,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color(0xFF111C31),
                    boxShadow: [
                      BoxShadow(color: Color(0x3338BDF8), blurRadius: 32),
                    ],
                  ),
                  child: const Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        width: 52,
                        height: 52,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          strokeCap: StrokeCap.round,
                          color: Color(0xFF38BDF8),
                          backgroundColor: Color(0xFF1E3A4C),
                        ),
                      ),
                      Icon(
                        Icons.view_in_ar_outlined,
                        color: Color(0xFFE0F2FE),
                        size: 21,
                      ),
                    ],
                  ),
                )
              else
                const Icon(
                  Icons.error_outline_rounded,
                  color: Color(0xFFFCA5A5),
                  size: 52,
                ),
              const SizedBox(height: 24),
              Text(
                error == null
                    ? 'Loading ${selection.label}'
                    : 'Could not load ${selection.label}',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFFF1F5F9),
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 9),
              Text(
                error == null
                    ? selection.exampleId
                    : 'three.assetFailure: $error',
                textAlign: TextAlign.center,
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontFamily: 'monospace',
                  fontSize: 11,
                  height: 1.5,
                ),
              ),
              if (error == null) ...[
                const SizedBox(height: 18),
                const Text(
                  'Starting the scene and preparing the first frame',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ThreeDiagnostics extends StatelessWidget {
  const _ThreeDiagnostics({
    required this.host,
    required this.engineId,
    required this.fps,
  });

  final JsThreeHost host;
  final String engineId;
  final double? fps;

  @override
  Widget build(BuildContext context) {
    final surface = host.findSurface(engineId, 'main#1');
    final values = surface?.diagnostics ?? const <String, num>{};
    final backend = kIsWeb ? 'WebGL2 / Worker' : 'R1 / Flutter GPU';
    String number(String key, [int digits = 0]) =>
        (values[key] ?? 0).toStringAsFixed(digits);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xC4000000),
        border: Border.all(color: const Color(0x22FFFFFF)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  fps?.toStringAsFixed(1) ?? '—',
                  style: const TextStyle(
                    color: Color(0xFF7DD3FC),
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    height: 1,
                  ),
                ),
                const SizedBox(width: 7),
                const Padding(
                  padding: EdgeInsets.only(bottom: 2),
                  child: Text(
                    'FPS\npresented',
                    style: TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 9,
                      height: 1.2,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 9),
            Text(
              backend,
              style: const TextStyle(
                color: Color(0xFFE2E8F0),
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'frame ${number('frameMs', 2)} ms  ·  decode ${number('decodeMs', 2)} ms\n'
              'calls ${number('calls')}  ·  triangles ${number('triangles')}\n'
              'frames ${number('presentedFrames')}  ·  uploads ${number('uploads')}',
              style: const TextStyle(
                color: Color(0xFF94A3B8),
                fontFamily: 'monospace',
                fontSize: 9,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
