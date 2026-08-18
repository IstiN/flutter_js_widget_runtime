/// Screenshot harness for the example widgets: renders one widget full-screen
/// in a macOS desktop window (Impeller), captures the frame through a
/// [RepaintBoundary], writes the PNG and exits.
///
/// Run from the example/ directory:
///   flutter run -d macos -t lib/screenshot.dart \
///     JSR_WIDGET=3d-glb-showcase JSR_OUT=/tmp/3d-glb-showcase.png \
///     build/macos/Build/Products/Release/js_widget_runtime_example.app/Contents/MacOS/js_widget_runtime_example
///
/// This is how real GLB scenes (flutter_gpu/Impeller) get their screenshots —
/// unit tests have no GPU context.
library;

import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/rendering.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

/// Widget id and output path come from the process environment, so a single
/// build covers every widget.
final _kWidget = Platform.environment['JSR_WIDGET'] ?? '';
final _kOut = Platform.environment['JSR_OUT'] ?? '/tmp/jsr-screenshot.png';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const _ScreenshotApp());
}

class _ScreenshotApp extends StatelessWidget {
  const _ScreenshotApp();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true),
      home: Scaffold(
        backgroundColor: const Color(0xFF0F172A),
        body: FutureBuilder<String>(
          future: rootBundle.loadString('widgets/$_kWidget/widget.js'),
          builder: (context, snap) {
            if (snap.hasError) {
              return Center(child: Text('missing widget $_kWidget'));
            }
            if (!snap.hasData) {
              return const Center(child: CircularProgressIndicator());
            }
            return _CaptureFrame(jsSource: snap.data!);
          },
        ),
      ),
    );
  }
}

class _CaptureFrame extends StatefulWidget {
  const _CaptureFrame({required this.jsSource});

  final String jsSource;

  @override
  State<_CaptureFrame> createState() => _CaptureFrameState();
}

class _CaptureFrameState extends State<_CaptureFrame> {
  final _boundaryKey = GlobalKey();
  Map<String, dynamic>? _tree;

  void _log(String m) {
    File('/tmp/jsr_screenshot.log').writeAsStringSync('\$m\n', mode: FileMode.append, flush: true);
  }

  @override
  void initState() {
    super.initState();
    // Wait for the widget to settle (model load + first frames), then capture
    // and exit. 5s covers the GLB parse + first rendered frame.
    Timer(const Duration(seconds: 5), _captureAndExit);
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      key: _boundaryKey,
      child: _tree == null
          ? const Center(child: CircularProgressIndicator())
          : JsonWidgetRenderer(
              onEvent: (_, __) {},
              js3dHost: createJs3dHost(),
            ).build(_tree),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _startEngine();
  }

  QuickjsWidgetEngineBackend? _engine;

  Future<void> _startEngine() async {
    final engine = QuickjsWidgetEngineBackend(
      config: JsRuntimeConfig(
        widgetId: _kWidget,
        js3dHost: createJs3dHost(),
        onRender: (tree) {
          if (mounted) setState(() => _tree = tree);
        },
        onSetTitle: (_) {},
        onStorageUpdate: (_) {},
      ),
    );
    _engine = engine;
    await engine.init();
    unawaited(engine.run(widget.jsSource));
  }

  Future<void> _captureAndExit() async {
    try {
      final boundary = _boundaryKey.currentContext?.findRenderObject();
      if (boundary == null || boundary is! RenderRepaintBoundary) {
        exitCode = 3;
        return;
      }
      final image = await boundary.toImage(pixelRatio: 2.0);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      if (bytes == null) {
        exitCode = 4;
        return;
      }
      final out = File(_kOut);
      await out.writeAsBytes(bytes.buffer.asUint8List(), flush: true);
      // ignore: avoid_print
      print('screenshot written: ${out.path} (${bytes.lengthInBytes} bytes)');
      image.dispose();
    } finally {
      await _engine?.dispose();
      exit(exitCode);
    }
  }
}
