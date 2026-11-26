// cinematic_perf_1b.dart — F4f cinematic performance matrix, native 1B leg
// (issue #8, PERF-CINEMATIC-*, REG-UPLOADS). Runs the committed perf scene
// (tool/three/perf/perf_scene.js) through the SAME wire and timing method as
// bench_1b.dart (PERF-1/PERF-2): one frame = one rt.eval — the runtime drains
// the facade's flush microtask inside the call, so the stopwatch covers
// encode + transport + native submit; wall percentiles per window, thread CPU
// percentiles via CLOCK_THREAD_CPUTIME_ID (the bench sanity probe runs), and
// the reported percentiles are the MEDIAN over the windows — never a
// best-of-N pick.
//
// Per cell (preset x resolution) a fresh session models a fresh page load
// (corpus rule): corpus prelude + DOM shims + three.core.js + jsr_three_web.js
// + packer + facade + scene. The measured window starts only after a QUIET
// warm-up: frames until the per-frame deltas of compiles/links/uploads are
// all zero for [kQuietFrames] consecutive frames (bounded at kWarmupMax —
// exceeding the bound is a structural failure, never a measurement). After
// the window the seek / resize / resetHistory events run; each must not
// recompile or re-upload the unchanged assets (REG-UPLOADS, gated).
// Timing numbers are NEVER gated — the matrix reports them.
//
// Prints one machine-parsable line per cell:
//   PERF_CELL <json>
// Exit 0 iff every cell's structural checks pass; exit 1 otherwise.
// Library use: test/angle1b/f4f_uploads_test.dart calls [run1bCinematicCell]
// directly and asserts the structural fields.
import 'dart:convert';
import 'dart:ffi';
import 'dart:io';

import 'package:ffi/ffi.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

import 'bench_1b.dart'
    as bench
    show checkThreadClock, kClockThreadCputimeId, percentile, threadCpuNs;
import 'run_1b_corpus.dart'
    as corpus
    show
        Shim,
        dartPrelude,
        kCorpusDomPath,
        kCorpusXmlDomPath,
        kFacadePath,
        kPackerPath,
        kShimPath,
        readScratch;

/// The three bundle of record (assets/three, darwin-arm64 builder host): an
/// IIFE that defines globalThis.THREE and installs jsr.three (cinematic
/// included) at evaluation. The WEB bundle is the one both legs run: its
/// WebGLRenderer takes any canvas that provides webgl2 (the facade canvas on
/// the 1B leg, the real canvas in Chrome) — the corpus discipline of one
/// bundle byte-identical across legs. (The NATIVE bundle's renderer requires
/// the engine's jsr.three.createCanvas host; the bench harness has none.)
/// The example/web modules are the older renderer-only copies without the F4a
/// runtime install — the scene needs `jsr.three.cinematic`.
const String kThreeBundlePath = 'assets/three/jsr_three_web.js';

// Measurement protocol (stated in docs/cinematic_perf.md):
const int kWindows = 3; // measurement windows per cell (median over windows)
const int kFrames = 300; // frames per measurement window
const int kQuietFrames = 10; // consecutive zero-counter frames that end warm-up
const int kWarmupMax =
    200; // warm-up bound: exceeding it is a structural failure

String argValue(List<String> args, String name, [String? dflt]) {
  final i = args.indexOf('--$name');
  if (i >= 0 && i + 1 < args.length) return args[i + 1];
  return dflt ?? '';
}

/// The marshalled host-function bridge hands one JSON array; element [i] it is
/// (corpus hostArgAt semantics).
String _hostArgAt(String argsJson, int i) {
  final d = jsonDecode(argsJson);
  return d is List && d.length > i ? '${d[i]}' : '$d';
}

/// One cell of the matrix: preset x resolution.
class PerfCellSpec {
  const PerfCellSpec(this.preset, this.width, this.height);
  final String preset;
  final int width;
  final int height;

  Map<String, dynamic> toJson() => {
    'preset': preset,
    'width': width,
    'height': height,
  };
}

/// The ANGLE surface of one cell — created lazily on the first GL dispatch so
/// the facade's reported context attributes (samples/depth/stencil) pick the
/// matching EGL config (corpus SurfaceBox rule, sized to the cell resolution).
class _CellSurface {
  _CellSurface(this.shim, this.width, this.height);
  final corpus.Shim shim;
  final int width;
  final int height;
  int? surface;
  int samples = 0;
  int depth = 1;
  int stencil = 0;
  bool current = false;

  int ensureCurrent() {
    if (surface == null) {
      final ios = calloc<Uint32>();
      try {
        final s = shim.createSurfaceEx2(
          width,
          height,
          samples,
          depth,
          stencil,
          ios,
        );
        if (s < 1) throw StateError('a1b_create_surface_ex2 failed');
        if (shim.makeCurrent(s) != 0)
          throw StateError('a1b_make_current failed');
        surface = s;
      } finally {
        calloc.free(ios);
      }
    } else if (!current) {
      if (shim.makeCurrent(surface!) != 0)
        throw StateError('a1b_make_current failed');
    }
    current = true;
    return surface!;
  }
}

/// One cell session: the wire glue of bench_1b plus the corpus host bridges
/// the corpus boot expects (samples/depth/stencil reporting, console, asset
/// stubs — the scene fetches nothing, so a miss stays loud).
class _PerfSession {
  _PerfSession(this.shim, this.box) {
    rt = QuickjsRuntime();
    rt.registerHostBytesFn('__jsr1b_gl_bytes', (name, data) {
      dispatches++;
      // Corpus rule: the lazy surface (sized to the cell, config from the
      // facade's reported attributes) becomes current on the first dispatch.
      box.ensureCurrent();
      final buf = calloc<Uint8>(data.length);
      try {
        buf.asTypedList(data.length).setAll(0, data);
        lastRc = shim.dispatch(buf, data.length);
      } finally {
        calloc.free(buf);
      }
    });
    rt.registerHostFunction('__jsr1b_gl_rc', (_) => '$lastRc');
    rt.registerHostFunction(
      '__jsr1b_result_host',
      (_) => jsonEncode(base64Encode(corpus.readScratch(shim))),
    );
    rt.registerHostFunction('__jsr1b_set_samples_host', (argsJson) {
      box.samples = int.tryParse(_hostArgAt(argsJson, 0)) ?? box.samples;
      return '1';
    });
    rt.registerHostFunction('__jsr1b_set_depth_host', (argsJson) {
      box.depth = _hostArgAt(argsJson, 0) == '1' ? 1 : 0;
      return '1';
    });
    rt.registerHostFunction('__jsr1b_set_stencil_host', (argsJson) {
      box.stencil = _hostArgAt(argsJson, 0) == '1' ? 1 : 0;
      return '1';
    });
    rt.registerHostFunction('__jsr1b_console_host', (argsJson) {
      final a = jsonDecode(_hostArgAt(argsJson, 0));
      if (a is List && a.isNotEmpty) {
        console.add('${a.first}: ${a.length > 1 ? a[1] : ''}');
      }
      return '1';
    });
    // The scene fetches no assets; a miss stays loud on the console lane.
    rt.registerHostFunction('__jsr1b_asset_host', (_) => 'null');
    rt.registerHostFunction('__jsr1b_decode_image_host', (_) => 'null');
    rt.registerHostFunction('__jsr1b_decode_image_b64_host', (_) => 'null');
  }

  final corpus.Shim shim;
  final _CellSurface box;
  late final QuickjsRuntime rt;
  int dispatches = 0;
  int lastRc = 0;
  final List<String> console = [];

  String? evalJs(String code, [String name = 'perf.js']) {
    final err = <String?>[];
    final r = rt.eval(code, filename: name, errMsg: err);
    if (err.isNotEmpty && err.first != null) {
      throw StateError('eval $name failed: ${err.first}');
    }
    err.clear();
    return r;
  }

  /// Eval returning a JSON value: the bridge hands eval results JSON-encoded,
  /// so a JS string return arrives as a JSON string literal — unwrap one
  /// level, then parse the payload (corpus resultJson convention).
  dynamic evalJson(String code, [String name = 'perf.js']) {
    final raw = evalJs(code, name);
    if (raw == null || raw.isEmpty) return null;
    final first = jsonDecode(raw);
    return first is String ? jsonDecode(first) : first;
  }

  void close() => rt.close();
}

/// Diff of two scene counter snapshots (`__perfCounters` / `__perfFrameCounters`).
Map<String, int> countersDelta(
  Map<String, dynamic> after,
  Map<String, dynamic> before, {
  String assetKey = 'assets',
}) {
  // 'uploads' is a per-call-name dict in full snapshots, a total in frame
  // counters — sum both shapes into one number.
  int total(dynamic v) => v is Map
      ? v.values.fold<int>(0, (a, x) => a + (x as num).toInt())
      : (v ?? 0) as int;
  int d(String k) => total(after[k]) - total(before[k]);
  return {
    'compiles': d('compiles'),
    'links': d('links'),
    'uploads': d('uploads'),
    'assetUploads': d(assetKey),
  };
}

class _WindowReport {
  _WindowReport(
    this.p50,
    this.p95,
    this.p99,
    this.cpuP50,
    this.cpuP95,
    this.cpuP99,
    this.frames,
  );
  final double p50, p95, p99, cpuP50, cpuP95, cpuP99;
  final int frames;
  Map<String, dynamic> toJson() => {
    'frames': frames,
    'wallP50Ms': _r(p50),
    'wallP95Ms': _r(p95),
    'wallP99Ms': _r(p99),
    'cpuP50Ms': _r(cpuP50),
    'cpuP95Ms': _r(cpuP95),
    'cpuP99Ms': _r(cpuP99),
  };
}

double _r(double v) => double.parse(v.toStringAsFixed(3));

double _median(List<double> values) {
  final v = List<double>.from(values)..sort();
  return v[v.length ~/ 2];
}

int? _rssKb() {
  // Resident set size via mach task_info (TASK_TASK_BASIC_INFO, resident_size
  // is the 3rd natural_t of the 8-field struct): no subprocess needed — the
  // sandbox of a spawned driver may deny `ps`, and the syscall works on any
  // macOS host.
  try {
    final lib = DynamicLibrary.process();
    final taskInfo = lib
        .lookupFunction<
          Int32 Function(Uint32, Int32, Pointer<Uint32>, Pointer<Uint32>),
          int Function(int, int, Pointer<Uint32>, Pointer<Uint32>)
        >('task_info');
    final taskSelf = lib.lookup<Uint32>('mach_task_self_').value;
    final buf = calloc<Uint32>(8);
    final cnt = calloc<Uint32>(1)..value = 8;
    try {
      final kr = taskInfo(taskSelf, 4 /* TASK_TASK_BASIC_INFO */, buf, cnt);
      if (kr != 0) return null;
      return buf[2] ~/ 1024; // resident_size in bytes
    } finally {
      calloc.free(buf);
      calloc.free(cnt);
    }
  } catch (_) {
    return null;
  }
}

/// Runs ONE matrix cell (fresh session, fresh ANGLE surface) and returns its
/// result record. Throws on harness errors; structural check results are
/// FIELDS of the record ('structuralOk'), never swallowed.
Future<Map<String, dynamic>> run1bCinematicCell(
  PerfCellSpec spec, {
  required String scenePath,
  int windows = kWindows,
  int frames = kFrames,
  corpus.Shim? shim,
  bool readRss = true,
}) async {
  bench.checkThreadClock();
  final ownShim = shim ?? corpus.Shim();
  final box = _CellSurface(ownShim, spec.width, spec.height);
  final session = _PerfSession(ownShim, box);
  final watch = Stopwatch();
  Map<String, dynamic> out;
  try {
    if (ownShim.init() != 0) throw StateError('a1b_init failed');
    session.evalJs(corpus.dartPrelude('{}', '[]', '{}'), 'dart_prelude.js');
    session.evalJs(
      File(corpus.kCorpusXmlDomPath).readAsStringSync(),
      'corpus_xmldom.js',
    );
    session.evalJs(
      File(corpus.kCorpusDomPath).readAsStringSync(),
      'corpus_dom.js',
    );
    session.evalJs(File(corpus.kPackerPath).readAsStringSync(), 'g1_packer.js');
    session.evalJs(
      File(corpus.kFacadePath).readAsStringSync(),
      'webgl2_facade.js',
    );
    // Transport mode (measured defect, F4f): the BATCHED wire (F2b facade
    // batching) corrupts large inline texImage2D blobs — 4/8 bus errors
    // (BUS_ADRALN in ANGLE TextureMtl::setPerSliceSubImage) uploading a
    // 256 KiB DataTexture at 720p, reproducible only with batch+sized-blob
    // traffic (bench_1b = batched without blobs and the corpus = per-command
    // never hit it). The corpus transport — per-command dispatch, the same
    // __jsr1b_gl bytes lane — is the blob-validated mode and the default
    // here; the timing method is unchanged. JSR_PERF_BATCHED=1 keeps the
    // batch sink for re-measuring after the wire fix (owned by the native
    // leg fix lane, feat/9-f4i-host-proof).
    if (Platform.environment['JSR_PERF_BATCHED'] != '1') {
      session.evalJs(
        'if (typeof G1 !== "undefined" && G1.setSink) G1.setSink(null);',
        'clear-batch-sink.js',
      );
    }
    session.evalJs(
      File(kThreeBundlePath).readAsStringSync(),
      'jsr_three_web.js',
    );
    session.evalJs(File(scenePath).readAsStringSync(), 'perf_scene.js');
    // Boot sanity: the bundle must have installed THREE and jsr.three.cinematic
    // (installThreeRuntime runs at bundle evaluation).
    final boot =
        session.evalJson(
              'JSON.stringify({jsr: typeof globalThis.jsr, '
              'three: typeof globalThis.THREE, '
              'cine: globalThis.jsr && globalThis.jsr.three ? typeof globalThis.jsr.three.cinematic : "none"})',
            )
            as Map<String, dynamic>;
    // ignore: avoid_print
    print('PERF_BOOT $boot');
    if (boot['cine'] != 'object' || boot['three'] != 'object') {
      throw StateError('three bundle boot incomplete: $boot');
    }
    final setup =
        session.evalJson(
              'globalThis.__perfCellSetup(${jsonEncode(spec.toJson())});',
            )
            as Map<String, dynamic>;
    if (setup['ok'] != true) {
      throw StateError('perf scene setup failed: ${setup['error']}');
    }
    final errors = session.console
        .where((m) => m.startsWith('error:'))
        .toList();
    if (errors.isNotEmpty) {
      throw StateError(
        'perf scene console errors: ${errors.take(4).join(' | ')}',
      );
    }

    Map<String, dynamic> snap() =>
        session.evalJson('globalThis.__perfCounters();')
            as Map<String, dynamic>;
    Map<String, dynamic> frameCounters() =>
        session.evalJson('globalThis.__perfFrameCounters();')
            as Map<String, dynamic>;

    // QUIET warm-up (objective rule, stated in code and in the report):
    // consecutive frames with zero compiles/links/uploads deltas end the
    // warm-up. Never a timing-based rule.
    var warmFrames = 0, quietRun = 0;
    var prev = frameCounters();
    while (quietRun < kQuietFrames) {
      if (warmFrames >= kWarmupMax) {
        throw StateError(
          'warm-up never went quiet after $kWarmupMax frames '
          '(compiles/links/uploads keep moving) — structural failure',
        );
      }
      session.evalJs('globalThis.__perfRender($warmFrames);', 'perf_warm.js');
      final cur = frameCounters();
      final quiet =
          cur['c'] == prev['c'] &&
          cur['l'] == prev['l'] &&
          cur['u'] == prev['u'];
      quietRun = quiet ? quietRun + 1 : 0;
      prev = cur;
      warmFrames++;
    }

    final steadyStart = snap();
    final windowReports = <_WindowReport>[];
    var compilesPerFrameMax = 0, linksPerFrameMax = 0, uploadsPerFrameMax = 0;
    var measuredFrames = 0;
    var lastFrame = 0;
    for (var w = 0; w < windows; w++) {
      final wall = <double>[], cpu = <double>[];
      for (var f = 0; f < frames; f++) {
        lastFrame = warmFrames + w * frames + f;
        final cpu0 = bench.threadCpuNs(bench.kClockThreadCputimeId);
        watch
          ..reset()
          ..start();
        session.evalJs('globalThis.__perfRender($lastFrame);', 'perf_frame.js');
        watch.stop();
        final cpu1 = bench.threadCpuNs(bench.kClockThreadCputimeId);
        wall.add(watch.elapsedMicroseconds / 1000.0);
        cpu.add((cpu1 - cpu0) / 1000000.0);
        final cur = frameCounters();
        final dc = ((cur['c'] as num) - (prev['c'] as num)).toInt();
        final dl = ((cur['l'] as num) - (prev['l'] as num)).toInt();
        final du = ((cur['u'] as num) - (prev['u'] as num)).toInt();
        if (dc > compilesPerFrameMax) compilesPerFrameMax = dc;
        if (dl > linksPerFrameMax) linksPerFrameMax = dl;
        if (du > uploadsPerFrameMax) uploadsPerFrameMax = du;
        prev = cur;
        measuredFrames++;
      }
      wall.sort();
      cpu.sort();
      windowReports.add(
        _WindowReport(
          bench.percentile(wall, 0.50),
          bench.percentile(wall, 0.95),
          bench.percentile(wall, 0.99),
          bench.percentile(cpu, 0.50),
          bench.percentile(cpu, 0.95),
          bench.percentile(cpu, 0.99),
          frames,
        ),
      );
      // ignore: avoid_print
      print(
        'PERF_WINDOW leg=1b preset=${spec.preset} ${spec.width}x${spec.height} '
        'window=$w p50=${_r(windowReports.last.p50)} p95=${_r(windowReports.last.p95)} '
        'cpuP95=${_r(windowReports.last.cpuP95)}',
      );
    }
    final steadyEnd = snap();

    // Events: seek, resize (down+up), resetHistory. Each must not recompile or
    // re-upload the unchanged assets (REG-UPLOADS); render-target
    // re-allocation on resize lands in the separate 'uploads' delta and is
    // disclosed in the report.
    Map<String, dynamic> runEvent(String name, List<String> evals) {
      final before = snap();
      for (final e in evals) {
        session.evalJs(e, 'perf_event.js');
      }
      final d = countersDelta(snap(), before);
      return {
        'event': name,
        'ok': d['compiles'] == 0 && d['links'] == 0 && d['assetUploads'] == 0,
        'deltas': d,
      };
    }

    final events = <String, dynamic>{};
    events['seek'] = runEvent('seek', [
      'globalThis.__perfRender(${lastFrame + 10000});',
    ]);
    final halfW = (spec.width ~/ 2).clamp(1, 1 << 14);
    final halfH = (spec.height ~/ 2).clamp(1, 1 << 14);
    events['resize'] = runEvent('resize', [
      'globalThis.__perfResize($halfW,$halfH);',
      'globalThis.__perfRender(${lastFrame + 10001});',
      'globalThis.__perfRender(${lastFrame + 10002});',
      'globalThis.__perfResize(${spec.width},${spec.height});',
      'globalThis.__perfRender(${lastFrame + 10003});',
      'globalThis.__perfRender(${lastFrame + 10004});',
    ]);
    events['resetHistory'] = runEvent('resetHistory', [
      'globalThis.__perfResetHistory(1);', // presets run epoch 0: bump it
      'globalThis.__perfRender(${lastFrame + 10005});',
    ]);

    final steadyUploads = countersDelta(steadyEnd, steadyStart);

    // Honesty cross-check (1B leg only — the web context has no __stats):
    // the wrapper totals must equal the facade counters over the measured
    // window (the wrapper counts what the facade counts).
    final facadeStart = steadyStart['facade'] as Map<String, dynamic>?;
    final facadeEnd = steadyEnd['facade'] as Map<String, dynamic>?;
    const uploadKeys = [
      'texImage2D',
      'texSubImage2D',
      'texImage3D',
      'texSubImage3D',
      'compressedTexImage2D',
      'compressedTexSubImage2D',
      'compressedTexSubImage3D',
    ];
    final facadeUploads = (facadeStart == null || facadeEnd == null)
        ? 0
        : uploadKeys.fold<int>(
            0,
            (a, k) =>
                a +
                ((facadeEnd[k] ?? 0) as num).toInt() -
                ((facadeStart[k] ?? 0) as num).toInt(),
          );
    // Wrapper side of the SAME window: the uploads dict is cumulative since
    // instrumentation, so diff it through countersDelta like every other gate.
    final countersAgree = facadeStart == null || facadeEnd == null
        ? null
        : (steadyUploads['uploads'] == facadeUploads &&
              steadyUploads['compiles'] ==
                  (facadeEnd['compileShader'] as num).toInt() -
                      (facadeStart['compileShader'] as num).toInt() &&
              steadyUploads['links'] ==
                  (facadeEnd['linkProgram'] as num).toInt() -
                      (facadeStart['linkProgram'] as num).toInt());

    double median(double Function(_WindowReport) pick) =>
        _median(windowReports.map(pick).toList());

    final detail = facadeStart == null
        ? null
        : {
            'wrapperUploads': steadyUploads['uploads'],
            'facadeUploads': facadeUploads,
            'wrapperCompiles': steadyUploads['compiles'],
            'facadeCompiles':
                (facadeEnd!['compileShader'] as num).toInt() -
                (facadeStart['compileShader'] as num).toInt(),
            'wrapperLinks': steadyUploads['links'],
            'facadeLinks':
                (facadeEnd['linkProgram'] as num).toInt() -
                (facadeStart['linkProgram'] as num).toInt(),
          };

    out = {
      'leg': '1b',
      'cell': spec.toJson(),
      'warmup': {
        'frames': warmFrames,
        'quietFrames': kQuietFrames,
        'bound': kWarmupMax,
      },
      'windows': [for (final w in windowReports) w.toJson()],
      'frames': measuredFrames,
      'wallP50Ms': _r(median((w) => w.p50)),
      'wallP95Ms': _r(median((w) => w.p95)),
      'cpuP50Ms': _r(median((w) => w.cpuP50)),
      'cpuP95Ms': _r(median((w) => w.cpuP95)),
      'compilesPerFrameMax': compilesPerFrameMax,
      'linksPerFrameMax': linksPerFrameMax,
      'uploadsPerFrameMax': uploadsPerFrameMax,
      'steady': steadyUploads,
      'events': events,
      'lane': setup['lane'],
      'capabilities': setup['capabilities'],
      'applied': setup['applied'],
      'unsupported': setup['unsupported'],
      'rendererString': setup['rendererString'],
      'vendorString': setup['vendorString'],
      'glVersion': setup['glVersion'],
      'objects': {
        'steady': steadyEnd['objects'],
        // dispose the pipeline + renderer, then read the live object counts
        'afterDispose':
            (session.evalJson('globalThis.__perfDispose();')
                as Map<String, dynamic>)['objectsAfterDispose'],
      },
      'targets': steadyEnd['targets'],
      'countersAgree': countersAgree,
      'countersDetail': detail,
      'rssKb': readRss ? _rssKb() : null,
      'structuralOk':
          compilesPerFrameMax == 0 &&
          linksPerFrameMax == 0 &&
          uploadsPerFrameMax == 0 &&
          steadyUploads['assetUploads'] == 0 &&
          events.values.every((e) => e['ok'] == true) &&
          countersAgree !=
              false, // null (web: no facade counters) passes; false fails
    };
  } finally {
    session.close();
    if (box.surface != null) ownShim.destroySurface(box.surface!);
    if (shim == null) ownShim.shutdown();
  }
  return out;
}

/// Runs the cell list sequentially (fresh ANGLE context per cell, corpus rule).
Future<List<Map<String, dynamic>>> run1bCinematicCells(
  List<PerfCellSpec> specs, {
  required String scenePath,
  int windows = kWindows,
  int frames = kFrames,
}) async {
  final out = <Map<String, dynamic>>[];
  for (final spec in specs) {
    out.add(
      await run1bCinematicCell(
        spec,
        scenePath: scenePath,
        windows: windows,
        frames: frames,
      ),
    );
  }
  return out;
}

Future<void> main(List<String> args) async {
  // corpus.Shim opens kShimPath in a field initializer; give a friendly
  // error instead of the raw DynamicLibrary.open throw.
  if (!File(corpus.kShimPath).existsSync() &&
      !File(
        'packages/jsr_three_angle/native/angle/out/macos-arm64/libangle_1b.dylib',
      ).existsSync()) {
    stderr.writeln(
      'cinematic_perf_1b: libangle_1b.dylib not found — build the pinned ANGLE '
      '(bash tool/build_angle.sh --platform macos-arm64) and the shim '
      '(bash packages/jsr_three_angle/native/angle/build.sh)',
    );
    exit(2);
  }
  final scenePath = argValue(args, 'scene', 'tool/three/perf/perf_scene.js');
  final presets = argValue(
    args,
    'presets',
    'draft,production,deterministic-export',
  ).split(',');
  final sizes = argValue(
    args,
    'sizes',
    '1280x720,1920x1080,3840x2160',
  ).split(',');
  final windows =
      int.tryParse(argValue(args, 'windows', '$kWindows')) ?? kWindows;
  final frames = int.tryParse(argValue(args, 'frames', '$kFrames')) ?? kFrames;
  final specs = <PerfCellSpec>[];
  for (final preset in presets) {
    for (final size in sizes) {
      final m = RegExp(r'^(\d+)x(\d+)$').firstMatch(size.trim());
      if (m == null) {
        stderr.writeln('cinematic_perf_1b: bad size "$size"');
        exit(1);
      }
      specs.add(
        PerfCellSpec(
          preset.trim(),
          int.parse(m.group(1)!),
          int.parse(m.group(2)!),
        ),
      );
    }
  }
  try {
    final results = await run1bCinematicCells(
      specs,
      scenePath: scenePath,
      windows: windows,
      frames: frames,
    );
    for (final r in results) {
      // ignore: avoid_print
      print('PERF_CELL ${jsonEncode(r)}');
    }
    // Timing numbers are never gated; the structural counters are.
    exit(results.every((r) => r['structuralOk'] == true) ? 0 : 1);
  } catch (e) {
    stderr.writeln('cinematic_perf_1b: $e');
    exit(1);
  }
}
