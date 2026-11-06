import 'dart:async';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs_isolate_vm.dart'
    show QuickjsIsolateWidgetEngineBackend;
import 'support/quickjs_isolate_backend_factory.dart';

/// Regression tests for the APP-EXIT shutdown race of the QuickJS isolate
/// backend (SIGABRT, crash report 2026-11-03 13:49, "three catalog",
/// Release, ~13 min runtime):
///
/// Thread 0 (main) was inside `DartVM::~DartVM → Dart::Cleanup →
/// WaitForIsolateShutdown` — the VM had already disabled its FFI-callback
/// machinery — while thread 48 (the QuickJS worker isolate) was still
/// executing a queued command's pending-job drain:
/// `qjs_execute_pending_jobs_capped → JS_ExecutePendingJob →
/// promise_reaction_job → … → qjs_bytes_dispatch →
/// DLRT_GetFfiCallbackMetadata → dart::Assert::Fail → SIGABRT`.
///
/// Why the old ordering could not see it: the worker dequeues isolate
/// messages SEQUENTIALLY, so the 'shutdown' command sent by dispose()
/// stays invisible while a drain runs — and one drain can execute up to
/// 100k promise reactions, each entering a bytes-lane/host-call FI
/// trampoline (`__jsrSendCopy` → `qjs_bytes_dispatch`). Waiting for the
/// ack (or even for the 10s grace) leaves a window of SECONDS during
/// which the worker keeps invoking Dart receivers that VM teardown has
/// already invalidated.
///
/// Fix (ordering invariant): dispose() must stop the worker's job loop
/// FIRST — the process-global cooperative drain stop in the native bridge
/// (`qjs_request_drain_stop`; both `qjs_execute_pending_jobs*` loops
/// return early, leaving remaining jobs pending) is requested BEFORE the
/// 'shutdown' message is queued and cleared once the handshake resolves.
/// The worker then stops touching Dart receivers within ~one job of
/// dispose() starting, acks promptly, closes its runtime and exits.

/// A self-re-enqueueing promise chain whose every reaction crosses the
/// bytes-lane FI trampoline — the exact dispatch of the crashed thread —
/// and spins so one full drain lasts several seconds (longer than the
/// shrunk ack grace of test 1, which makes the pre-fix dispose stall
/// deterministic instead of machine-speed dependent). Measured ~0.18ms
/// per reaction (spin + bytes send), so 20000 reactions ≈ 4s of drain.
const String _longChainWidget = '''
var __n = 0;
function __step() {
  __n++;
  var s = 0;
  for (var i = 0; i < 200000; i++) { s += i; }
  jsr.hostCallBinary('race.tick', new Uint8Array([__n & 255]));
  if (__n < 20000) { Promise.resolve().then(__step); }
}
__step();
jsr.render({type: 'text', text: 'chained'});
''';

/// Same shape, but short and fast: used to prove the drain stop is
/// RELEASED after the handshake — a fresh engine must drain its whole
/// chain without truncation.
const String _shortChainWidget = '''
var __n = 0;
function __step() {
  __n++;
  jsr.hostCallBinary('race.tick', new Uint8Array([__n & 255]));
  if (__n < 200) { Promise.resolve().then(__step); }
}
__step();
jsr.render({type: 'text', text: 'chained'});
''';

Future<void> _waitFor(
  bool Function() condition, {
  Duration timeout = const Duration(seconds: 5),
  Duration step = const Duration(milliseconds: 10),
}) async {
  final deadline = DateTime.now().add(timeout);
  while (!condition()) {
    if (DateTime.now().isAfter(deadline)) {
      fail('condition not met within $timeout');
    }
    await Future<void>.delayed(step);
  }
}

void main() {
  const widgetId = 'isolate-drain-race-test';
  if (!isolateNativeLibAvailable) {
    test(
      'QuickJS isolate drain-race suite',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }
  if (!QuickjsIsolateWidgetEngineBackend.debugDrainStopSupported) {
    test(
      'QuickJS isolate drain-race suite',
      () {},
      skip:
          'libquickjs_bridge.so predates the cooperative drain stop '
          '(qjs_request_drain_stop) — rebuild quickjs_runtime '
          '(tool/build_quickjs.sh) and point JSR_QUICKJS_LIB at the new '
          'bridge; the shutdown-crash fix cannot be exercised otherwise',
    );
    return;
  }

  teardownIsolateBackends();

  tearDown(() {
    // The drain stop is process-global: a leaked request from a failed
    // test body would silently freeze every later drain in the suite.
    QuickjsIsolateWidgetEngineBackend.debugSetDrainStop(active: false);
  });

  test('drain-stop flag round-trips through the native bridge', () {
    expect(QuickjsIsolateWidgetEngineBackend.debugDrainStopRequested, isFalse);
    QuickjsIsolateWidgetEngineBackend.debugSetDrainStop(active: true);
    expect(QuickjsIsolateWidgetEngineBackend.debugDrainStopRequested, isTrue);
    QuickjsIsolateWidgetEngineBackend.debugSetDrainStop(active: false);
    expect(QuickjsIsolateWidgetEngineBackend.debugDrainStopRequested, isFalse);
  });

  test(
    'dispose freezes a running bytes-lane drain within one reaction',
    () async {
      final binaries = <Uint8List>[];
      final backend = buildIsolateBackend(
        widgetId,
        onBinary: (_, data) => binaries.add(data),
      );
      // Shrink the ack grace: pre-fix the worker is mid-drain when
      // 'shutdown' is queued, so dispose stalls for the whole grace (or
      // the whole drain, whichever is longer). Post-fix the drain stops
      // within ~one reaction of the flag, and the ack arrives immediately.
      final realGrace = QuickjsIsolateWidgetEngineBackend.shutdownAckGrace;
      QuickjsIsolateWidgetEngineBackend.shutdownAckGrace = const Duration(
        seconds: 3,
      );
      try {
        final runDone = backend.run(_longChainWidget);
        // The worker is now inside the run command's pending-job drain.
        await _waitFor(() => binaries.length >= 20);
        final drainedBefore = binaries.length;

        // dispose() while the drain is running — the app-close race.
        final sw = Stopwatch()..start();
        await backend.dispose();
        final disposeMs = sw.elapsedMilliseconds;
        unawaited(
          runDone.timeout(const Duration(seconds: 5), onTimeout: () {}),
        );

        expect(
          disposeMs,
          lessThan(1500),
          reason:
              'dispose() must stop the drain FIRST (drain stop before the '
              "'shutdown' handshake resolves): a mid-drain dispose took "
              '$disposeMs ms, i.e. it waited for the grace/ack while the '
              'worker kept entering FI trampolines — the exact window that '
              'SIGABRTs at app exit (crash 2026-11-03 13:49)',
        );

        // The chain must be FROZEN: after dispose only the small backlog of
        // messages already in flight may still be delivered. Pre-fix the
        // whole 300-reaction chain (plus spins) drains before the worker
        // even looks at 'shutdown'.
        await pumpEventQueue(times: 40);
        await Future<void>.delayed(const Duration(milliseconds: 300));
        final drainedAfter = binaries.length;
        expect(
          drainedAfter - drainedBefore,
          lessThan(100),
          reason:
              'the pending-job drain kept running after dispose() started '
              '(${drainedAfter - drainedBefore} reactions crossed the bytes '
              'lane afterwards) — execution did not stop before shutdown',
        );
        expect(
          drainedAfter,
          lessThan(20000),
          reason:
              'the chain was truncated '
              'by the drain stop instead of draining to completion',
        );
      } finally {
        QuickjsIsolateWidgetEngineBackend.shutdownAckGrace = realGrace;
      }
    },
  );

  test(
    'drain stop is released after dispose: fresh engine drains freely',
    () async {
      final binaries = <Uint8List>[];
      final backend = buildIsolateBackend(
        'isolate-drain-race-recovery',
        onBinary: (_, data) => binaries.add(data),
      );
      // The previous test (or a dispose anywhere) must NOT leave the
      // process-global stop request armed: a fresh worker's full chain has
      // to drain inside its own run command.
      await backend.run(_shortChainWidget);
      expect(
        binaries.length,
        200,
        reason:
            'a leaked drain-stop request '
            'truncates unrelated engines — dispose must clear it',
      );
    },
  );
}
