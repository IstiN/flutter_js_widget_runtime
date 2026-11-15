import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// Headless CPU probe for the prepared-lane math in the four custom-attribute
/// examples. This intentionally measures QuickJS execution only, not presented
/// FPS (the serial native-GPU probe owns that measurement).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!QuickjsFfi.isAvailable) return;

  test('custom-attribute official and prepared math costs', () {
    final runtime = QuickjsRuntime();
    addTearDown(runtime.close);
    final setup = runtime.eval(r'''
      globalThis.N = 100000;
      globalThis.L = 15000;
      globalThis.phaseSin = new Float64Array(N);
      globalThis.phaseCos = new Float64Array(N);
      for (let i = 0; i < N; i++) {
        phaseSin[i] = Math.sin(0.1 * i);
        phaseCos[i] = Math.cos(0.1 * i);
      }
      globalThis.official = new Float32Array(N);
      globalThis.prepared = new Float32Array(N);
      globalThis.maxDifference = 0;
      globalThis.officialPoints = time => {
        for (let i = 0; i < N; i++) official[i] = 14 + 13 * Math.sin(0.1 * i + time);
      };
      globalThis.preparedPoints = time => {
        const s = Math.sin(time), c = Math.cos(time);
        for (let i = 0; i < N; i++) prepared[i] = 14 + 13 * (phaseSin[i] * c + phaseCos[i] * s);
      };
      globalThis.officialBuffer = time => {
        for (let i = 0; i < N; i++) official[i] = 10 * (1 + Math.sin(0.1 * i + time));
      };
      globalThis.preparedBuffer = time => {
        const s = Math.sin(time), c = Math.cos(time);
        for (let i = 0; i < N; i++) prepared[i] = 10 * (1 + phaseSin[i] * c + phaseCos[i] * s);
      };
      globalThis.officialPoints3 = time => {
        for (let i = 0; i < N; i++) {
          if (i < N / 2) official[i] = Math.max(0, 26 + 32 * Math.sin(0.1 * i + 0.6 * time));
        }
      };
      globalThis.preparedPoints3 = time => {
        const s = Math.sin(0.6 * time), c = Math.cos(0.6 * time);
        for (let i = 0; i < N; i++) {
          if (i < N / 2) prepared[i] = Math.max(0, 26 + 32 * (phaseSin[i] * c + phaseCos[i] * s));
        }
      };
      globalThis.compareSizes = () => {
        maxDifference = 0;
        for (let i = 0; i < N; i++) maxDifference = Math.max(maxDifference, Math.abs(official[i] - prepared[i]));
        return maxDifference;
      };
      globalThis.officialLine = new Float32Array(L * 3);
      globalThis.preparedLine = new Float32Array(L * 3);
      globalThis.officialLines = () => {
        for (let i = 0; i < officialLine.length; i += 3) {
          officialLine[i] += 0.3 * (0.5 - Math.random());
          officialLine[i + 1] += 0.3 * (0.5 - Math.random());
          officialLine[i + 2] += 0.3 * (0.5 - Math.random());
        }
      };
      globalThis.randomState = 0x12345678;
      globalThis.preparedLines = () => {
        let random = randomState;
        for (let i = 0; i < preparedLine.length; i += 3) {
          random ^= random << 13; random ^= random >>> 17; random ^= random << 5;
          preparedLine[i] += 0.3 * (0.5 - (random >>> 0) / 4294967296);
          random ^= random << 13; random ^= random >>> 17; random ^= random << 5;
          preparedLine[i + 1] += 0.3 * (0.5 - (random >>> 0) / 4294967296);
          random ^= random << 13; random ^= random >>> 17; random ^= random << 5;
          preparedLine[i + 2] += 0.3 * (0.5 - (random >>> 0) / 4294967296);
        }
        randomState = random >>> 0;
      };
      'ready';
    ''');
    expect(setup, '"ready"');

    final measurements = <String, double>{};
    double measure(String name, String expression) {
      runtime.eval(expression);
      runtime.eval(expression);
      final stopwatch = Stopwatch()..start();
      for (var tick = 0; tick < 12; tick++) {
        runtime.eval(expression);
      }
      stopwatch.stop();
      final milliseconds = stopwatch.elapsedMicroseconds / 12000;
      measurements[name] = double.parse(milliseconds.toStringAsFixed(3));
      return milliseconds;
    }

    final pairs = <(String, String, String)>[
      ('points', 'officialPoints(0.317)', 'preparedPoints(0.317)'),
      ('buffer_particles', 'officialBuffer(0.317)', 'preparedBuffer(0.317)'),
      ('points3', 'officialPoints3(0.317)', 'preparedPoints3(0.317)'),
    ];
    for (final (name, official, prepared) in pairs) {
      measure('${name}_official_ms', official);
      final officialChecksum = runtime.eval('official[317]');
      measure('${name}_prepared_ms', prepared);
      expect(double.parse(runtime.eval('compareSizes()')!), lessThan(0.0001));
      expect(
        double.parse(runtime.eval('prepared[317]')!),
        closeTo(double.parse(officialChecksum!), 0.0001),
      );
    }
    measure('lines_official_ms', 'officialLines()');
    // This candidate is deliberately NOT wired into prepare.mjs: the probe
    // showed QuickJS's native Math.random is faster than JS xorshift.
    measure('lines_xorshift_candidate_ms', 'preparedLines()');
    expect(
      runtime.eval('preparedLine.every(value => Number.isFinite(value))'),
      'true',
    );
    expect(runtime.eval('randomState'), isNot('305419896'));

    // ignore: avoid_print
    print('custom-attribute QuickJS math probe ${jsonEncode(measurements)}');
  }, timeout: const Timeout(Duration(seconds: 90)));
}
