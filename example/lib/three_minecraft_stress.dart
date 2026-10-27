import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
// ignore: implementation_imports
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_host.dart'
    as gpu_host;

const String _defaultDirectory = '/tmp/jsr-minecraft-stress';
const String _engineId = 'three-minecraft-stress';

String _setting(String name) {
  const define = String.fromEnvironment('JSR_MINECRAFT_STRESS_DIR');
  if (name == 'JSR_MINECRAFT_STRESS_DIR' && define.isNotEmpty) return define;
  return Platform.environment[name] ?? '';
}

String? _stressProbeError(
  Map<String, num> values,
  Map<String, dynamic> manifest,
) {
  if ((values['presentedFrames'] ?? 0) < 1) return 'no presented frames';
  if ((values['calls'] ?? 0) < 1) return 'no GPU draw calls';
  for (final key in const [
    'failedPresentations',
    'geometryFailures',
    'batchFailures',
    'textureFailures',
  ]) {
    if ((values[key] ?? 0) != 0) return '$key=${values[key]}';
  }
  final profile = manifest['profile'] as Map<String, dynamic>? ?? const {};
  if (profile['directionalShadowMap'] != null &&
      ((values['renderedShadowDraws'] ?? 0) < 1 ||
          values['shadowMapWidth'] != 2048 ||
          values['shadowMapHeight'] != 2048)) {
    return 'directional shadow pass did not render at 2048x2048';
  }
  return null;
}

int _probeMilliseconds() {
  const define = String.fromEnvironment('JSR_MINECRAFT_STRESS_PROBE_MS');
  final value = define.isNotEmpty
      ? define
      : Platform.environment['JSR_MINECRAFT_STRESS_PROBE_MS'] ?? '0';
  final parsed = int.tryParse(value);
  if (parsed == null || parsed < 0 || parsed > 300000) {
    throw ArgumentError('JSR_MINECRAFT_STRESS_PROBE_MS must be 0..300000');
  }
  return parsed;
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final configured = _setting('JSR_MINECRAFT_STRESS_DIR');
  final directory = configured.isEmpty ? _defaultDirectory : configured;
  final widgetFile = File('$directory/widget.js');
  final manifestFile = File('$directory/manifest.json');
  final source = await widgetFile.readAsString();
  final manifest =
      jsonDecode(await manifestFile.readAsString()) as Map<String, dynamic>;
  if (manifest['id'] != _engineId ||
      manifest['widget'] is! Map<String, dynamic> ||
      (manifest['widget'] as Map<String, dynamic>)['entry'] != 'widget.js') {
    throw StateError(
      'Invalid THREE Minecraft stress manifest: ${manifestFile.path}',
    );
  }
  final upstream = manifest['upstream'] as Map<String, dynamic>?;
  if (upstream?['revision'] != '186' || upstream?['version'] != '0.186.1') {
    throw StateError('The stress target requires pinned THREE r186 (0.186.1)');
  }
  final probeMs = _probeMilliseconds();
  debugPrint(
    '[three-stress] widget=${widgetFile.path} (${source.length} chars)',
  );
  debugPrint('[three-stress] manifest=${manifestFile.path}');
  debugPrint('[three-stress] QuickJS FFI + native THREE/R1; probeMs=$probeMs');
  runApp(
    ThreeMinecraftStressApp(
      source: source,
      manifest: manifest,
      directory: directory,
      probeMilliseconds: probeMs,
    ),
  );
}

class ThreeMinecraftStressApp extends StatelessWidget {
  const ThreeMinecraftStressApp({
    required this.source,
    required this.manifest,
    required this.directory,
    required this.probeMilliseconds,
    super.key,
  });

  final String source;
  final Map<String, dynamic> manifest;
  final String directory;
  final int probeMilliseconds;

  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: ThemeData.dark(useMaterial3: true),
    home: ThreeMinecraftStressPage(
      source: source,
      manifest: manifest,
      directory: directory,
      probeMilliseconds: probeMilliseconds,
    ),
  );
}

class ThreeMinecraftStressPage extends StatefulWidget {
  const ThreeMinecraftStressPage({
    required this.source,
    required this.manifest,
    required this.directory,
    required this.probeMilliseconds,
    super.key,
  });

  final String source;
  final Map<String, dynamic> manifest;
  final String directory;
  final int probeMilliseconds;

  @override
  State<ThreeMinecraftStressPage> createState() =>
      _ThreeMinecraftStressPageState();
}

class _ThreeMinecraftStressPageState extends State<ThreeMinecraftStressPage> {
  late final JsThreeHost _threeHost = createFlutterGpuThreeHost();
  Timer? _diagnosticsTimer;
  Timer? _probeTimer;
  int _diagnosticTicks = 0;
  int _renderTrees = 0;
  int? _fpsFrames;
  DateTime? _fpsSampledAt;
  double _fps = 0;

  late final JsRuntimeConfig _config = _createConfig();
  static const _pointerChannel = MethodChannel('jsr.three.pointer');
  double _rawPointerDx = 0;
  double _rawPointerDy = 0;
  bool _nativePointerLocked = false;

  Future<Object?> _handleHostCall(
    String name,
    Map<String, dynamic> args,
  ) async {
    if (name == 'three.pointerLock') {
      final locked = args['locked'] == true;
      if (!locked) {
        _nativePointerLocked = false;
        _clearRawPointerDelta();
      }
      try {
        final nativeResult = await _pointerChannel.invokeMethod<bool>(
          locked ? 'lock' : 'unlock',
        );
        _nativePointerLocked = locked && nativeResult == true;
        if (!_nativePointerLocked) _clearRawPointerDelta();
        debugPrint(
          '[three-stress:pointer] locked=$locked native=$_nativePointerLocked',
        );
        return locked ? _nativePointerLocked : true;
      } catch (_) {
        _nativePointerLocked = false;
        _clearRawPointerDelta();
        return false;
      }
    }
    if (name == 'three.pointerDelta') {
      if (!_nativePointerLocked) {
        return const {'dx': 0.0, 'dy': 0.0, 'locked': false};
      }
      final result = {'dx': _rawPointerDx, 'dy': _rawPointerDy, 'locked': true};
      _clearRawPointerDelta();
      return result;
    }
    throw ArgumentError('Unsupported stress host call: $name');
  }

  void _clearRawPointerDelta() {
    _rawPointerDx = 0;
    _rawPointerDy = 0;
  }

  Future<dynamic> _handlePointerMethod(MethodCall call) async {
    if (call.method == 'lockState') {
      _nativePointerLocked = false;
      _clearRawPointerDelta();
      return null;
    }
    if (call.method != 'delta' || !_nativePointerLocked) return null;
    final args = call.arguments as Map<Object?, Object?>;
    _rawPointerDx += (args['dx'] as num).toDouble();
    _rawPointerDy += (args['dy'] as num).toDouble();
    return null;
  }

  JsRuntimeConfig _createConfig() {
    // Build the backend from JsWidgetEngine's FINAL config, including the
    // runtime widget's onRender wrapper. The default macOS factory selects
    // QuickJS FFI when available; its startup log confirms that selection.
    // Preconstructing a backend here would bypass the wrapper and leave the
    // runtime's UI tree null forever.
    return JsRuntimeConfig(
      widgetId: _engineId,
      instanceId: _engineId,
      threeEnabled: true,
      threeHost: _threeHost,
      onHostCall: _handleHostCall,
      onRender: (_) => _renderTrees++,
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      onLog: (message) => debugPrint('[three-stress:js] $message'),
    );
  }

  void _sampleFps() {
    final frames = (_surface?.diagnostics['presentedFrames'] ?? 0).toInt();
    final now = DateTime.now();
    final previousFrames = _fpsFrames;
    final previousSample = _fpsSampledAt;
    if (previousFrames != null && previousSample != null) {
      final seconds = now.difference(previousSample).inMicroseconds / 1000000;
      if (seconds > 0) _fps = (frames - previousFrames) / seconds;
    }
    _fpsFrames = frames;
    _fpsSampledAt = now;
  }

  @override
  void initState() {
    super.initState();
    _pointerChannel.setMethodCallHandler(_handlePointerMethod);
    HardwareKeyboard.instance.addHandler(_handleSystemShortcut);
    _diagnosticsTimer = Timer.periodic(const Duration(milliseconds: 250), (_) {
      if (!mounted) return;
      _sampleFps();
      setState(() {});
      _diagnosticTicks++;
      if (_diagnosticTicks % 16 != 0) return;
      final surface = _surface;
      final values = surface?.diagnostics ?? const <String, num>{};
      final error = surface is gpu_host.FlutterGpuThreeSurface
          ? surface.lastError
          : null;
      debugPrint(
        '[three-stress:r1] fps=${_fps.toStringAsFixed(1)} $values '
        'size=${surface?.logicalSize} disposed=${surface?.isDisposed} '
        'lastError=$error',
      );
    });
    if (widget.probeMilliseconds > 0) {
      _probeTimer = Timer(Duration(milliseconds: widget.probeMilliseconds), () {
        final values = _surface?.diagnostics ?? const <String, num>{};
        final error = _stressProbeError(values, widget.manifest);
        debugPrint(
          '[three-stress] bounded probe complete: error=$error; $values; '
          'renderTrees=$_renderTrees',
        );
        _threeHost.disposeEngine(_engineId);
        exit(error == null ? 0 : 1);
      });
    }
  }

  bool _handleSystemShortcut(KeyEvent event) {
    final keyboard = HardwareKeyboard.instance;
    final quitModifier = keyboard.isMetaPressed || keyboard.isControlPressed;
    if (event is! KeyDownEvent ||
        !quitModifier ||
        event.logicalKey != LogicalKeyboardKey.keyQ) {
      return false;
    }
    exit(0);
  }

  JsThreeSurface? get _surface => _threeHost.findSurface(_engineId, 'main#1');

  @override
  void dispose() {
    _pointerChannel.setMethodCallHandler(null);
    if (_nativePointerLocked) _pointerChannel.invokeMethod('unlock');
    HardwareKeyboard.instance.removeHandler(_handleSystemShortcut);
    _diagnosticsTimer?.cancel();
    _probeTimer?.cancel();
    _threeHost.disposeEngine(_engineId);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profile =
        widget.manifest['profile'] as Map<String, dynamic>? ?? const {};
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Stack(
        fit: StackFit.expand,
        children: [
          JsWidgetRuntimeWidget(
            jsSource: widget.source,
            config: _config,
            onError: (error, stackTrace) {
              debugPrint('[three-stress] widget error: $error\n$stackTrace');
            },
          ),
          Positioned(
            left: 6,
            top: 6,
            child: IgnorePointer(
              child: _StressDiagnostics(
                surface: _surface,
                drawDistance: profile['drawDistance'],
                directory: widget.directory,
                probeMilliseconds: widget.probeMilliseconds,
                fps: _fps,
                nativePointerLock: _nativePointerLocked,
              ),
            ),
          ),
          Positioned(
            right: 6,
            top: 6,
            child: IconButton(
              tooltip: 'Quit',
              onPressed: () {
                debugPrint('[three-stress] quit requested');
                exit(0);
              },
              style: IconButton.styleFrom(
                backgroundColor: const Color(0xB8000000),
                foregroundColor: const Color(0xFFE2E8F0),
              ),
              icon: const Icon(Icons.close, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}

class _StressDiagnostics extends StatelessWidget {
  const _StressDiagnostics({
    required this.surface,
    required this.drawDistance,
    required this.directory,
    required this.probeMilliseconds,
    required this.fps,
    required this.nativePointerLock,
  });

  final JsThreeSurface? surface;
  final Object? drawDistance;
  final String directory;
  final int probeMilliseconds;
  final double fps;
  final bool nativePointerLock;

  @override
  Widget build(BuildContext context) {
    final values = surface?.diagnostics ?? const <String, num>{};
    String number(String key, [int digits = 0]) =>
        (values[key] ?? 0).toStringAsFixed(digits);
    final text = StringBuffer('QuickJS / R1 / Flutter GPU')
      ..write('  pointer=${nativePointerLock ? 'native' : 'absolute'}')
      ..write('\nfps=${fps.toStringAsFixed(1)}')
      ..write(
        '  drawDistance=$drawDistance  presented=${number('presentedFrames')}',
      )
      ..write('  calls=${number('calls')}')
      ..write(
        '\ntriangles=${number('triangles')}  uploads=${number('uploads')}',
      )
      ..write(
        '\nshadow=${number('shadowMapWidth')}px  draws=${number('renderedShadowDraws')}  hits=${number('shadowCacheHits')}',
      )
      ..write(
        '\ndecode=${number('decodeMs', 2)}ms  frame=${number('frameMs', 2)}ms',
      )
      ..write(
        '\n$directory${probeMilliseconds > 0 ? '  probe=${probeMilliseconds}ms' : ''}',
      );
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
