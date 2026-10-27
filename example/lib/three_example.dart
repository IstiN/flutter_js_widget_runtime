import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

/// Runs the unmodified official three.js r186 Minecraft example module.
///
/// Native: upstream object model + R1 + Flutter GPU. Web: real WebGL2 in the
/// existing Worker + ImageBitmap presentation. No WebView is used.
Future<void> main() async {
  runApp(const ThreeExampleApp());
}

class ThreeExampleApp extends StatelessWidget {
  const ThreeExampleApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: ThemeData.dark(useMaterial3: true),
    home: const ThreeExamplePage(),
  );
}

class ThreeExamplePage extends StatefulWidget {
  const ThreeExamplePage({super.key});

  @override
  State<ThreeExamplePage> createState() => _ThreeExamplePageState();
}

class _ThreeExamplePageState extends State<ThreeExamplePage> {
  static const String engineId = 'three-minecraft-example';

  late final JsThreeHost _threeHost = kIsWeb
      ? createWebThreeHost(diagnosticsEnabled: true)
      : createFlutterGpuThreeHost();
  late final Future<String> _source = rootBundle.loadString(
    'widgets/three-minecraft/widget.js',
  );
  late final JsRuntimeConfig _config = JsRuntimeConfig(
    widgetId: 'three-minecraft',
    instanceId: engineId,
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
    _threeHost.disposeEngine(engineId);
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
          child: IgnorePointer(child: _ThreeDiagnostics(host: _threeHost)),
        ),
      ],
    ),
  );
}

class _ThreeDiagnostics extends StatelessWidget {
  const _ThreeDiagnostics({required this.host});

  final JsThreeHost host;

  @override
  Widget build(BuildContext context) {
    final surface = host.findSurface(_ThreeExamplePageState.engineId, 'main#1');
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
