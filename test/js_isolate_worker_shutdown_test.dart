import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs_isolate_vm.dart'
    show QuickjsIsolateWidgetEngineBackend;
import 'support/quickjs_isolate_backend_factory.dart';

/// Regression tests for the worker-shutdown lifecycle of the QuickJS
/// isolate backend.
///
/// Crash context (SIGABRT 2026-11-02, DLRT_GetFfiCallbackMetadata ←
/// qjs_bytes_dispatch ← qjs_eval on the worker thread): dispose() used to
/// `Isolate.kill(immediate)` when the shutdown ack did not arrive within
/// its grace window. The worker processes commands SEQUENTIALLY, so while
/// it is inside the synchronous JS_Eval of a widget bundle the 'shutdown'
/// message cannot be dequeued; the kill then tears the isolate down while
/// its C stack still runs the eval — and the eval's next `__jsrSendCopy`
/// dispatch (worker-owned bytes-lane FI callback) resolves against freed
/// callback metadata and aborts the process. These tests pin the
/// invariant: a dispose that lands mid-eval must NEVER kill the worker;
/// the worker drains its eval and exits by itself.

/// Widget JS that keeps the worker inside a synchronous eval for ~[ms]
/// while periodically dispatching through the bytes lane, mirroring the
/// per-frame skin/morph/copy traffic of the three examples.
String _busyWidget(int ms) =>
    '''
var end = Date.now() + $ms;
var sink = 0;
while (Date.now() < end) {
  sink++;
  if ((sink & 0xFFFF) === 0) {
    jsr.hostCallBinary('busy.bytes', new Uint8Array([sink & 255]));
  }
}
jsr.render({type: 'text', text: 'survived'});
''';

void main() {
  const widgetId = 'isolate-shutdown-test';
  if (!isolateNativeLibAvailable) {
    test(
      'QuickJS isolate shutdown suite',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  teardownIsolateBackends();

  test(
    'dispose during a bytes-dispatching eval never aborts the process',
    () async {
      // Shrink the ack grace so the dispose below times out while the worker
      // is still mid-eval (the real app: bundle eval 1-4s vs the 10s grace,
      // exceeded under backlog/contention). Restored in finally.
      final realGrace = QuickjsIsolateWidgetEngineBackend.shutdownAckGrace;
      QuickjsIsolateWidgetEngineBackend.shutdownAckGrace = const Duration(
        milliseconds: 250,
      );
      try {
        final renders = <Map<String, dynamic>>[];
        final backend = buildIsolateBackend(widgetId, onRender: renders.add);
        final starting = backend.run(_busyWidget(800));
        // Let the worker enter the busy eval first: 'shutdown' is now stuck
        // behind it on the worker's sequential command loop.
        await Future<void>.delayed(const Duration(milliseconds: 80));
        // Pre-fix: the ack grace expires mid-eval and Isolate.kill(immediate)
        // rips the worker apart — its next bytes dispatch asserts inside
        // DLRT_GetFfiCallbackMetadata and the whole test process SIGABRTs.
        await backend.dispose();
        unawaited(
          starting.timeout(const Duration(seconds: 5), onTimeout: () {}),
        );

        // The engine must stay usable — the next "example" boots and renders
        // while the orphaned worker finishes its eval in the background.
        await backend.run("jsr.render({type: 'text', text: 'switched'});");
        await pumpEventQueue();
        expect(renders.last['text'], 'switched');
        // Let the orphan drain its eval, process the queued shutdown, close
        // its runtime and exit before the tester tears the VM down.
        await Future<void>.delayed(const Duration(milliseconds: 900));
      } finally {
        QuickjsIsolateWidgetEngineBackend.shutdownAckGrace = realGrace;
      }
    },
  );

  test(
    'rapid example switching with mid-eval disposes keeps rendering',
    () async {
      final realGrace = QuickjsIsolateWidgetEngineBackend.shutdownAckGrace;
      QuickjsIsolateWidgetEngineBackend.shutdownAckGrace = const Duration(
        milliseconds: 250,
      );
      try {
        final renders = <Map<String, dynamic>>[];
        final backend = buildIsolateBackend(widgetId, onRender: renders.add);
        // Sidebar-click pattern: switch before the previous boot finished —
        // each 400ms eval outlives the 250ms ack grace, so every cycle
        // orphans its worker (brief worker coexistence while predecessors
        // drain) and the next cycle must still boot and render.
        for (var cycle = 0; cycle < 5; cycle++) {
          final starting = backend.run(_busyWidget(400));
          await Future<void>.delayed(const Duration(milliseconds: 30));
          await backend.dispose();
          unawaited(
            starting.timeout(const Duration(seconds: 5), onTimeout: () {}),
          );
        }
        await backend.run("jsr.render({type: 'text', text: 'final'});");
        await pumpEventQueue();
        expect(renders.last['text'], 'final');
        // Drain any orphan still finishing its eval before the VM exits.
        await Future<void>.delayed(const Duration(milliseconds: 600));
      } finally {
        QuickjsIsolateWidgetEngineBackend.shutdownAckGrace = realGrace;
      }
    },
  );
}
