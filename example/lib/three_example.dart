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

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'THREE r186 Samples',
    debugShowCheckedModeBanner: false,
    theme: ThemeData.dark(useMaterial3: true),
    home: Scaffold(
      body: Row(
        children: [
          _ThreeExampleSidebar(
            selection: _selection,
            onChanged: (selection) => setState(() => _selection = selection),
          ),
          Expanded(
            child: ThreeExamplePage(
              key: ValueKey(_selection),
              selection: _selection,
            ),
          ),
        ],
      ),
    ),
  );
}

class _ThreeExampleSidebar extends StatelessWidget {
  const _ThreeExampleSidebar({
    required this.selection,
    required this.onChanged,
  });

  final ThreeExampleSelection selection;
  final ValueChanged<ThreeExampleSelection> onChanged;

  @override
  Widget build(BuildContext context) => Container(
    width: 248,
    color: const Color(0xFF111827),
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
            'QuickJS  /  R1  /  Flutter GPU\n9 integrated native samples',
            style: TextStyle(
              color: Color(0xFF64748B),
              fontSize: 11,
              height: 1.5,
            ),
          ),
        ),
      ],
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
  late final Future<String> _source = rootBundle.loadString(
    widget.selection.assetPath,
  );
  late final JsRuntimeConfig _config = JsRuntimeConfig(
    widgetId: widget.selection.widgetId,
    instanceId: _engineId,
    threeEnabled: true,
    threeHost: _threeHost,
    onRender: (_) {},
    onSetTitle: (_) {},
    onStorageUpdate: (_) {},
  );
  final ThreeFpsSampler _fpsSampler = ThreeFpsSampler();
  Timer? _diagnosticsTimer;

  @override
  void initState() {
    super.initState();
    _diagnosticsTimer = Timer.periodic(const Duration(milliseconds: 250), (_) {
      if (!mounted) return;
      final frames =
          (_threeHost
                      .findSurface(_engineId, 'main#1')
                      ?.diagnostics['presentedFrames'] ??
                  0)
              .toInt();
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
            if (source == null) {
              return const Center(child: CircularProgressIndicator());
            }
            return JsWidgetRuntimeWidget(
              jsSource: source,
              config: _config,
              onError: (error, stackTrace) {
                debugPrint('THREE example error: $error');
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
      ],
    ),
  );
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
