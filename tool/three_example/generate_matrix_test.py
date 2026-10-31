#!/usr/bin/env python3
"""Generate a scratch verification-matrix test for every three-* example widget.

Each case boots the real QuickJS engine, pumps frames, and appends one JSON
line to /tmp/three_matrix.jsonl: mounted state, submitted frames, draw counts
by material kind, texture uploads and planner warnings. Used to measure the
"80% of three API examples render correctly" goal; not committed.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
widgets = sorted(
    p.parent.name for p in (ROOT / 'example/widgets').glob('three-*/widget.js')
)
template = '''
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;
CASES
}
'''
case = '''
  testWidgets('matrix ID', (tester) async {
    final result = <String, Object?>{'id': 'ID'};
    try {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'ID',
        instanceId: 'ID-matrix',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) => state.submittedFrameCount >= 3,
        attempts: 40,
      );
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(seconds: 1)),
      );
      await harness.pumpFrames(tester, 15);
      final state = harness.state;
      final exported = harness.engine.exportedState;
      result['mounted'] = exported?['mounted'];
      result['submitted'] = state?.submittedFrameCount ?? 0;
      if (state != null) {
        final plan = const ThreeDrawPlanner().plan(state);
        result['draws'] = plan.draws.length;
        result['kinds'] = plan.draws
            .map((draw) => draw.material.kind.toString().split('.').last)
            .toSet()
            .toList();
        result['textures'] = state.textureUploadCount;
        result['warnings'] = plan.diagnostics.warnings.take(3).toList();
        result['canRender'] = plan.canRender;
      }
      await harness.dispose(tester);
    } catch (error) {
      result['error'] = error.toString().substring(0, 300);
    }
    File('/tmp/three_matrix.jsonl').writeAsStringSync('${jsonEncode(result)}\\n', mode: FileMode.append, flush: true);
  }, timeout: const Timeout(Duration(seconds: 120)));
'''
cases = ''.join(case.replace('ID', widget) for widget in widgets)
out = ROOT / 'test/zz_three_matrix_test.dart'
out.write_text(template.replace('CASES', cases))
print(f'{len(widgets)} cases -> {out}')
