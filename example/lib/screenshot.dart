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
import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/rendering.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'camera_host.dart';
import 'three_widget_assets.dart';

/// Widget id and output path come from the process environment, so a single
/// build covers every widget. JSR_WIDGET_PATH skips the asset bundle and
/// loads widget.js straight from disk — much faster lighting/camera
/// iteration, since no rebuild is needed between tweaks.
final _kWidget = Platform.environment['JSR_WIDGET'] ?? '';
final _kWidgetPath = Platform.environment['JSR_WIDGET_PATH'] ?? '';
final _kOut = Platform.environment['JSR_OUT'] ?? '/tmp/jsr-screenshot.png';
// Optional extra seconds before the readiness/FPS gate starts counting —
// JSR_EXTRA_WAIT=20 lets slow-decode scenes (8K atlas panoramas) reach their
// first textured frame instead of capturing the pre-asset white window.
final _kExtraWait =
    int.tryParse(Platform.environment['JSR_EXTRA_WAIT'] ?? '') ?? 0;
// JSR_FIRST_PRESENT_ONLY=1: time-to-first-presented-frame sweep mode. Exits
// right after the firstPresentedMs line (no screenshot, no FPS window) so a
// 300-widget sweep costs ~2s per fast widget instead of ~9s. Widgets that
// never present log `firstPresentedMs=timeout` and exit 6 after 45s.
final _kFirstPresentOnly =
    Platform.environment['JSR_FIRST_PRESENT_ONLY'] == '1';
// Prepared official three.js modules all need the R1 host; ids are the
// example/widgets/three-* directories.
final _kThree = _kWidget.startsWith('three-');

/// Capture-run diagnostics: `open`-launched apps have no capturable stdout,
/// so JSR_CAMERA_LOG=`<path>` collects the lane's startup/host-call events.
void cameraDiag(String line) {
  final path = Platform.environment['JSR_CAMERA_LOG'];
  if (path == null || path.isEmpty) return;
  try {
    File(path).writeAsStringSync(
      '${DateTime.now().toIso8601String()} $line\n',
      mode: FileMode.append,
    );
  } catch (_) {
    // Diagnostics must never break the harness.
  }
}

Future<String> _loadWidgetJs() {
  if (_kWidgetPath.isNotEmpty) return File(_kWidgetPath).readAsString();
  return rootBundle.loadString('widgets/$_kWidget/widget.js');
}

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
          future: _loadWidgetJs(),
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
  final JsThreeHost? _threeHost = _kThree
      ? createFlutterGpuThreeHost(
          assetLoader: WidgetBundleThreeAssets.forWidget(_kWidget).load,
        )
      : null;
  // Webcam examples probe `camera.start` through onHostCall; JSR_CAMERA=0
  // captures the no-camera fallback render for regression baselines.
  // JSR_CAMERA_SYNTH=1 swaps in the synthetic offline lane instead.
  final ExampleCameraHost? _cameraHost =
      _kThree && Platform.environment['JSR_CAMERA'] != '0'
      ? (Platform.environment['JSR_CAMERA_SYNTH'] == '1'
            ? SynthCameraHost()
            : ExampleCameraHost())
      : null;
  final Stopwatch _captureClock = Stopwatch()..start();
  // Capture-run GPU counters: dump the surface's backend diagnostics every
  // second (12x) into JSR_CAMERA_LOG so an `open`-launched run is debuggable.
  int _diagDump = 0;
  bool _capturing = false;
  int? _fpsStartFrames;
  int _fpsStartMs = 0;
  bool _loggedFirstPresent = false;
  Map<String, dynamic>? _tree;

  @override
  void initState() {
    super.initState();
    // THREE switches to a presented-frame readiness/FPS window below. Other
    // widgets retain the legacy fixed delay for assets and network content.
    Timer(Duration(seconds: (_kThree ? 2 : 8) + _kExtraWait), _captureAndExit);
    // TEMP probe: main-isolate event-loop freeze bracketing (removed).
    Timer.periodic(const Duration(milliseconds: 250), (t) {
      if (!mounted || t.tick > 120) {
        t.cancel();
        return;
      }
      cameraDiag('hb[${_captureClock.elapsedMilliseconds}ms]');
    });
    Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_diagDump >= 12 || !mounted) {
        timer.cancel();
        return;
      }
      _diagDump++;
      final surface = _threeHost?.findSurface('screenshot-$_kWidget', 'main#1');
      final d = surface?.diagnostics ?? const {};
      cameraDiag(
        'gpu[${_captureClock.elapsedMilliseconds}ms] '
        'renderedDraws=${d['renderedDraws']} '
        'skippedDraws=${d['skippedDraws']} '
        'textureUploads=${d['textureUploads']} '
        'textureFailures=${d['textureFailures']} '
        'geometryFailures=${d['geometryFailures']} '
        'presentedFrames=${d['presentedFrames']}',
      );
    });
    // First-present latency probe: poll finer than the readiness gate so the
    // logged timestamp is within ~100ms of the real first presentation.
    if (_kThree) {
      if (_kFirstPresentOnly) {
        Timer(const Duration(seconds: 45), () {
          if (_loggedFirstPresent || !mounted) return;
          // ignore: avoid_print
          print(
            'THREE capture: firstPresentedMs=timeout (no presented frame in 45s)',
          );
          exit(6);
        });
      }
      Timer.periodic(const Duration(milliseconds: 100), (timer) {
        if (_loggedFirstPresent || !mounted) {
          timer.cancel();
          return;
        }
        final presented =
            _threeHost
                ?.findSurface('screenshot-$_kWidget', 'main#1')
                ?.diagnostics['presentedFrames'] ??
            0;
        if (presented > 0) {
          _loggedFirstPresent = true;
          timer.cancel();
          // ignore: avoid_print
          print(
            'THREE capture: firstPresentedMs=${_captureClock.elapsedMilliseconds} frames=$presented',
          );
          if (_kFirstPresentOnly) {
            // Brief grace so the print flushes and the GPU frame lands, then
            // a hard process exit — no dispose/FPS/screenshot work.
            Timer(const Duration(milliseconds: 250), () => exit(0));
          }
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      key: _boundaryKey,
      // The boundary captures only its own subtree — the Scaffold backdrop
      // stays outside. Paint the dark board color inside, or text themed for
      // a dark UI disappears into the transparent (white-looking) PNG.
      child: Container(
        color: const Color(0xFF0F172A),
        child: _tree == null
            ? const Center(child: CircularProgressIndicator())
            : JsonWidgetRenderer(
                onEvent: (_, _) {},
                js3dHost: createJs3dHost(),
                threeHost: _threeHost,
                onThreeEvent: (canvasId, payload) => _engine?.dispatchHostEvent(
                  'three.input:$canvasId',
                  payload,
                ),
                voxelWorld: _engine?.voxelWorld,
              ).build(_tree),
      ),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _startEngine();
  }

  JsWidgetEngine? _engine;

  Future<void> _startEngine() async {
    final config = JsRuntimeConfig(
      widgetId: _kWidget,
      instanceId: 'screenshot-$_kWidget',
      js3dHost: createJs3dHost(),
      threeEnabled: _kThree,
      threeHost: _threeHost,
      onHostCall: _cameraHost == null
          ? null
          : () {
              // No audio lane on the screenshot harness; foreign names must
              // reject exactly like an absent host handler so probes degrade.
              Future<Object?> audioOnly(String name, Map<String, dynamic> _) =>
                  Future<Object?>.error(ArgumentError.value(name, 'name'));
              var loggedCalls = 0;
              return (String name, Map<String, dynamic> args) {
                if (loggedCalls < 12) {
                  loggedCalls++;
                  cameraDiag('onHostCall #$loggedCalls: $name');
                }
                return _cameraHost.chainedWith(audioOnly)(name, args);
              };
            }(),
      onRender: (tree) {
        if (mounted) setState(() => _tree = tree);
      },
      onLog: (message) {
        if (message.contains('webcam') ||
            message.contains('camera') ||
            message.contains('VideoTexture')) {
          cameraDiag('js: $message');
        }
      },
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
    );
    // Keep screenshots on deterministic QuickJS while using the production
    // wrapper for opt-in bundles, global THREE setup and host bootstrap.
    // JSR_ISOLATE=1 opt-in: run through the isolated QuickJS backend like the
    // three_example app does, so app-only presentation bugs reproduce here.
    final backend = Platform.environment['JSR_ISOLATE'] == '1'
        ? createQuickjsIsolateWidgetEngineBackend(config)
        : QuickjsWidgetEngineBackend(config: config);
    final engine = JsWidgetEngine(config: config.copyWith(backend: backend));
    _engine = engine;
    await engine.init();
    await engine.run(widget.jsSource).catchError((Object _) {});
  }

  Future<void> _captureAndExit() async {
    if (_capturing) return;
    if (_kThree) {
      final surface = _threeHost?.findSurface('screenshot-$_kWidget', 'main#1');
      final presented = surface?.diagnostics['presentedFrames'] ?? 0;
      // A fixed delay catches slow GLB decodes at zero/one presented frames,
      // producing a black RepaintBoundary even though the model is healthy.
      if (presented < 3 &&
          _captureClock.elapsed <
              const Duration(seconds: 30) + Duration(seconds: _kExtraWait)) {
        Timer(const Duration(milliseconds: 500), _captureAndExit);
        return;
      }
      if (presented >= 3) {
        final now = _captureClock.elapsedMilliseconds;
        final startFrames = _fpsStartFrames;
        if (startFrames == null) {
          _fpsStartFrames = presented.toInt();
          _fpsStartMs = now;
          Timer(const Duration(seconds: 2), _captureAndExit);
          return;
        }
        final elapsedMs = now - _fpsStartMs;
        if (elapsedMs < 1900) {
          Timer(Duration(milliseconds: 2000 - elapsedMs), _captureAndExit);
          return;
        }
        final fps = (presented - startFrames) * 1000 / elapsedMs;
        // ignore: avoid_print
        print(
          'THREE performance: ${jsonEncode({'presentedFps': fps, 'sampleMs': elapsedMs, 'presentedFramesDelta': presented - startFrames})}',
        );
      }
    }
    _capturing = true;
    try {
      // JSR_GUI_EVENT="<rowName>=<value>" drives one lil-gui overlay event
      // (same engine.callEvent lane the Flutter controls use) right before
      // the capture, so one run can screenshot a live-switched scene —
      // e.g. JSR_GUI_EVENT=molecule=Ethanol on webgl_loader_pdb.
      final guiEvent = Platform.environment['JSR_GUI_EVENT'];
      if (guiEvent != null && guiEvent.isNotEmpty) {
        final separator = guiEvent.indexOf('=');
        final name = separator > 0 ? guiEvent.substring(0, separator) : '';
        final value = separator > 0 ? guiEvent.substring(separator + 1) : '';
        // "#toggle[=<index>]" taps the Nth lil-gui title tap-toggle from the
        // rendered tree (three.gui.toggle.N actions), expanding/collapsing
        // folders whose official modules shipped gui.close() — e.g.
        // webgl_postprocessing_dof, webgl_gpgpu_birds.
        if (name == '#toggle') {
          final wanted = value.isEmpty ? 0 : int.tryParse(value) ?? 0;
          final actions = <String>[];
          void walk(Object? node) {
            if (node is Map) {
              final tap = node['onTap'];
              if (tap is String && tap.startsWith('three.gui.toggle.')) {
                actions.add(tap);
              }
              for (final child in node.values) {
                walk(child);
              }
            } else if (node is List) {
              for (final child in node) {
                walk(child);
              }
            }
          }

          walk(_tree);
          if (wanted < actions.length) {
            // ignore: avoid_print
            print('THREE gui toggle: #$wanted action=${actions[wanted]}');
            await _engine?.callEvent(
              actions[wanted],
              const <String, dynamic>{},
            );
          } else {
            // ignore: avoid_print
            print(
              'THREE gui toggle: #$wanted not found (${actions.length} rendered)',
            );
          }
        }
        final rows =
            (_engine?.exportedState?['gui']?['values'] as List<dynamic>?) ??
            const <dynamic>[];
        for (final row in rows) {
          if (row is! Map || row['name'] != name) continue;
          final action = row['action'];
          if (action is String) {
            // ignore: avoid_print
            print('THREE gui event: $name=$value action=$action');
            // JSR_SWITCH_DEBUG: report instead of hanging when the event
            // dispatch never resolves (asset-load during event dispatch).
            stderr.writeln(
              'THREE gui event: dispatch start (stderr, unbuffered)',
            );
            await _engine
                ?.callEvent(action, {'value': value})
                .timeout(
                  const Duration(seconds: 10),
                  onTimeout: () => stderr.writeln(
                    'THREE gui event: dispatch still pending after 10s '
                    '(host-call response not pumped?)',
                  ),
                );
            stderr.writeln(
              'THREE gui event: done renderer='
              '${(_engine?.exportedState?['renderer'] ?? {}).toString()}',
            );
          }
          break;
        }
      }
      // Even after the third presentation the Flutter texture can be one
      // vsync behind the R1 surface. Do not capture that transitional frame.
      await Future<void>.delayed(const Duration(milliseconds: 800));
      if (_kThree && Platform.environment['JSR_GUI_POLL'] == '1') {
        // JSR_GUI_POLL: watch the renderer export on stderr (stdout is block
        // buffered in release) until the switched scene lands or 16s pass.
        for (var i = 0; i < 8; i++) {
          final r = _engine?.exportedState?['renderer'] ?? const <String, dynamic>{};
          // ignore: avoid_print
          stderr.writeln('THREE gui poll[$i]: $r');
          final calls = r['calls'];
          if (calls is num && calls > 0 && calls != 218) break;
          await Future<void>.delayed(const Duration(milliseconds: 2000));
        }
      }
      if (_kThree) {
        final surface = _threeHost?.findSurface(
          'screenshot-$_kWidget',
          'main#1',
        );
        // ignore: avoid_print
        print('THREE diagnostics: ${surface?.diagnostics}');
      }
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
