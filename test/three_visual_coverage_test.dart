import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('every registered THREE example has visual evidence and a verdict', () {
    final registry = File('example/lib/three_example.dart').readAsStringSync();
    final entries = RegExp(
      r"exampleId:\s*'([^']+)'[\s\S]*?widgetId:\s*'([^']+)'",
    ).allMatches(registry).toList();
    // Custom (non-upstream) widgets ship without a reference page; they are
    // catalog citizens but sit outside the official visual corpus.
    const customWidgetIds = {'three-cinematic-showcase'};
    final widgetIds = entries
        .map((match) => match.group(2)!)
        .where((id) => !customWidgetIds.contains(id))
        .toSet();

    expect(
      entries,
      hasLength(304),
      reason: '303 official examples + the custom cinematic showcase.',
    );
    expect(
      widgetIds,
      hasLength(303),
      reason: 'THREE widget ids must be unique.',
    );

    final violations = <String>[];
    const validStatuses = {
      'similar',
      'different',
      'blocked',
      'degraded-documented',
    };
    final actualCounts = {for (final status in validStatuses) status: 0};
    var pixelComparisons = 0;
    for (final id in widgetIds) {
      final directory = Directory('doc/three_visual/$id');
      if (!File('${directory.path}/pair.jpg').existsSync()) {
        violations.add('$id: missing pair.jpg');
      }
      final verdictFile = File('${directory.path}/verdict.json');
      if (!verdictFile.existsSync()) {
        violations.add('$id: missing verdict.json');
        continue;
      }
      try {
        final decoded = jsonDecode(verdictFile.readAsStringSync());
        if (decoded is! Map<String, dynamic>) {
          violations.add('$id: verdict.json is not a JSON object');
          continue;
        }
        final status = decoded['status'];
        if (status is String && validStatuses.contains(status)) {
          actualCounts[status] = actualCounts[status]! + 1;
        }
        if (decoded['mae'] != null) {
          pixelComparisons += 1;
        }
        if (status is! String || status.trim().isEmpty) {
          violations.add('$id: verdict status is empty');
        } else if (!validStatuses.contains(status)) {
          violations.add('$id: unknown verdict status "$status"');
        }
        if (status == 'different' &&
            (decoded['summary'] is! String ||
                (decoded['summary'] as String).trim().isEmpty)) {
          violations.add('$id: different verdict has no documented reason');
        }
      } on FormatException catch (error) {
        violations.add('$id: invalid verdict.json: $error');
      }
    }

    const regenerationScripts = [
      'common.py',
      'capture_references.py',
      'capture_reference.cjs',
      'capture_ours.py',
      'compose.py',
      'run_all.py',
    ];
    for (final script in regenerationScripts) {
      if (!File('tool/three_visual/$script').existsSync()) {
        violations.add('missing regeneration script tool/three_visual/$script');
      }
    }
    if (!File('doc/three_visual/index.html').existsSync()) {
      violations.add('missing doc/three_visual/index.html contact sheet');
    }
    final summaryFile = File('doc/three_visual/summary.json');
    if (!summaryFile.existsSync()) {
      violations.add('missing doc/three_visual/summary.json accounting');
    } else {
      try {
        final summary = jsonDecode(summaryFile.readAsStringSync());
        if (summary is! Map<String, dynamic>) {
          violations.add('summary.json is not a JSON object');
        } else {
          if (summary['total'] != widgetIds.length) {
            violations.add('summary total does not match the registry');
          }
          final counts = summary['counts'];
          if (counts is! Map<String, dynamic>) {
            violations.add('summary counts are missing');
          } else {
            for (final status in validStatuses) {
              if (counts[status] != actualCounts[status]) {
                violations.add('summary count drift for $status');
              }
            }
          }
          if (summary['pixel_comparisons'] != pixelComparisons) {
            violations.add('summary pixel_comparisons does not match verdicts');
          }
        }
      } on FormatException catch (error) {
        violations.add('invalid summary.json: $error');
      }
    }

    expect(
      violations,
      isEmpty,
      reason:
          'Visual coverage violations (${violations.length}):\n'
          '${violations.join('\n')}',
    );
  });

  test('screenshot harness forwards events and records presented FPS', () {
    final source = File('example/lib/screenshot.dart').readAsStringSync();
    expect(source, contains('onThreeEvent:'));
    expect(source, contains("'three.input:\$canvasId'"));
    expect(source, contains("'presentedFps': fps"));
    expect(source, contains("'sampleMs': elapsedMs"));
    expect(source, contains('Duration(seconds: 2)'));

    final capture = File(
      'tool/three_visual/capture_ours.py',
    ).readAsStringSync();
    expect(capture, contains('THREE performance:'));
    expect(capture, contains('"performance": performance'));
    expect(capture, contains('get("presentedFps")'));
  });
}
