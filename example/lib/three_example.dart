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
    label: 'Vertex Colors (Web only)',
    widgetId: 'three-geometry-colors',
    assetPath: 'widgets/three-geometry-colors/widget.js',
  ),
  linesColors(
    exampleId: 'webgl_lines_colors',
    label: 'Line Colors',
    widgetId: 'three-lines-colors',
    assetPath: 'widgets/three-lines-colors/widget.js',
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
    debugShowCheckedModeBanner: false,
    theme: ThemeData.dark(useMaterial3: true),
    home: ThreeExamplePage(
      key: ValueKey(_selection),
      selection: _selection,
      onSelectionChanged: (selection) {
        setState(() => _selection = selection);
      },
    ),
  );
}

class ThreeExamplePage extends StatefulWidget {
  const ThreeExamplePage({
    super.key,
    this.selection = ThreeExampleSelection.minecraft,
    this.onSelectionChanged,
  });

  final ThreeExampleSelection selection;
  final ValueChanged<ThreeExampleSelection>? onSelectionChanged;

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
  Timer? _diagnosticsTimer;

  @override
  void initState() {
    super.initState();
    _diagnosticsTimer = Timer.periodic(const Duration(milliseconds: 250), (_) {
      if (mounted) setState(() {});
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
          left: 6,
          top: 6,
          child: IgnorePointer(
            child: _ThreeDiagnostics(host: _threeHost, engineId: _engineId),
          ),
        ),
        Positioned(
          right: 6,
          top: 6,
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: const Color(0xB8000000),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<ThreeExampleSelection>(
                  value: widget.selection,
                  onChanged: widget.onSelectionChanged == null
                      ? null
                      : (selection) {
                          if (selection != null) {
                            widget.onSelectionChanged!(selection);
                          }
                        },
                  items: [
                    for (final selection in ThreeExampleSelection.values)
                      DropdownMenuItem(
                        value: selection,
                        child: Text(selection.label),
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
  const _ThreeDiagnostics({required this.host, required this.engineId});

  final JsThreeHost host;
  final String engineId;

  @override
  Widget build(BuildContext context) {
    final surface = host.findSurface(engineId, 'main#1');
    final values = surface?.diagnostics ?? const <String, num>{};
    final backend = kIsWeb ? 'WebGL2 / Worker' : 'R1 / Flutter GPU';
    String number(String key, [int digits = 0]) =>
        (values[key] ?? 0).toStringAsFixed(digits);
    final text = StringBuffer(backend)
      ..write('\ndecode ${number('decodeMs', 2)} ms')
      ..write('  frame ${number('frameMs', 2)} ms')
      ..write('\ncalls ${number('calls')}')
      ..write('  triangles ${number('triangles')}')
      ..write('  uploads ${number('uploads')}');
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xB8000000),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        child: Text(
          text.toString(),
          style: const TextStyle(
            color: Color(0xFFE2E8F0),
            fontFamily: 'monospace',
            fontSize: 10,
            height: 1.25,
          ),
        ),
      ),
    );
  }
}
