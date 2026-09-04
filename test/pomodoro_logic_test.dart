import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

/// Polls [probe] until it returns true (or [timeout] passes).
Future<bool> waitUntil(
  bool Function() probe, [
  Duration timeout = const Duration(seconds: 2),
]) async {
  final deadline = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(deadline)) {
    if (probe()) return true;
    await Future<void>.delayed(const Duration(milliseconds: 20));
  }
  return probe();
}

/// Recursively collects nodes of [type] from a rendered JSON tree.
List<Map<String, dynamic>> findNodes(dynamic node, String type) {
  final out = <Map<String, dynamic>>[];
  void walk(dynamic n) {
    if (n is Map) {
      if (n['type'] == type) out.add(Map<String, dynamic>.from(n));
      n.values.forEach(walk);
    } else if (n is List) {
      for (final e in n) {
        walk(e);
      }
    }
  }

  walk(node);
  return out;
}

void main() {
  if (!hasQuickjsNativeLib) return;

  group('pomodoro widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget('pomodoro');
      backend = h.backend;
    });

    tearDown(() => backend.dispose());

    test('initial state is a fresh 25 min focus phase', () {
      expect(h.state!['mode'], 'focus');
      expect(h.state!['remaining'], 25 * 60);
      expect(h.state!['running'], isFalse);
      expect(h.state!['completed'], 0);
    });

    test('start_pause toggles running', () async {
      await h.callEvent('start_pause');
      expect(h.state!['running'], isTrue);
      await h.callEvent('start_pause');
      expect(h.state!['running'], isFalse);
    });

    test('timer ticks down while running', () async {
      await h.callEvent('start_pause');
      // The 1s interval is host-driven — give it real time to fire twice.
      final deadline = DateTime.now().add(const Duration(seconds: 3));
      while (DateTime.now().isBefore(deadline)) {
        await Future<void>.delayed(const Duration(milliseconds: 100));
        if ((h.state!['remaining'] as int) < 25 * 60) break;
      }
      expect(h.state!['remaining'], lessThan(25 * 60));
    });

    test('reset restores the fresh focus phase', () async {
      await h.callEvent('start_pause');
      await h.callEvent('skip');
      await h.callEvent('reset');
      expect(h.state!['mode'], 'focus');
      expect(h.state!['remaining'], 25 * 60);
      expect(h.state!['running'], isFalse);
    });

    test('skip on focus counts a completed pomodoro and starts a break', () async {
      await h.callEvent('skip');
      expect(h.state!['completed'], 1);
      expect(h.state!['mode'], 'break');
      expect(h.state!['remaining'], 5 * 60);
    });

    test('skip on break returns to focus without counting', () async {
      await h.callEvent('skip'); // -> break, completed 1
      await h.callEvent('skip'); // -> focus, still 1
      expect(h.state!['mode'], 'focus');
      expect(h.state!['completed'], 1);
    });

    test('every 4th break is a long one', () async {
      for (var i = 0; i < 3; i++) {
        await h.callEvent('skip'); // focus -> break
        await h.callEvent('skip'); // break -> focus
      }
      expect(h.state!['completed'], 3);
      await h.callEvent('skip'); // 4th pomodoro done -> long break
      expect(h.state!['completed'], 4);
      expect(h.state!['mode'], 'break');
      expect(h.state!['remaining'], 15 * 60);
    });
  });

  group('pomodoro storage', () {
    test('completed counter hydrates from storage on boot', () async {
      final h = await bootWidget(
        'pomodoro',
        initialStorage: {'completed': 7},
      );
      // storage.get resolves asynchronously — wait for the re-export.
      final deadline = DateTime.now().add(const Duration(seconds: 2));
      while (DateTime.now().isBefore(deadline)) {
        await Future<void>.delayed(const Duration(milliseconds: 50));
        if (h.state != null && h.state!['completed'] == 7) break;
      }
      expect(h.state!['completed'], 7);
      h.backend.dispose();
    });
  });

  Map<String, dynamic> stateSnapshotOf(Map<String, dynamic> storage) =>
      Map<String, dynamic>.from(storage['__state'] as Map<dynamic, dynamic>);

  group('pomodoro live state sync (protocol v1)', () {
    test('local transitions persist __state snapshots with fresh revisions',
        () async {
      final writes = <Map<String, dynamic>>[];
      final h = await bootWidget('pomodoro', onStorageUpdate: writes.add);
      addTearDown(h.backend.dispose);

      await h.callEvent('start_pause');
      var s = stateSnapshotOf(writes.last);
      expect(s['v'], 1);
      expect(s['rev'], 1);
      expect(s['writer'], isA<String>());
      expect(s['mode'], 'focus');
      expect(s['running'], isTrue);
      expect(s['remaining'], 25 * 60);
      expect(s['endsAt'], greaterThan(DateTime.now().millisecondsSinceEpoch));
      expect(s['completed'], 0);

      await h.callEvent('reset');
      s = stateSnapshotOf(writes.last);
      expect(s['rev'], 2);
      expect(s['running'], isFalse);
      expect(s['endsAt'], 0);
    });

    test('state.sync adopts a sibling snapshot (map and JSON-string payload)',
        () async {
      final h = await bootWidget('pomodoro');
      addTearDown(h.backend.dispose);
      final now = DateTime.now().millisecondsSinceEpoch;
      final sibling = <String, dynamic>{
        'v': 1,
        'rev': 5,
        'writer': 'sibling-1',
        'mode': 'focus',
        'running': true,
        'remaining': 1200,
        'endsAt': now + 20 * 60 * 1000,
        'completed': 2,
      };

      await h.callEvent('state.sync', payload: {
        'key': '__state',
        'value': sibling,
        'appId': 'app-1',
      });
      expect(h.state!['running'], isTrue);
      expect(h.state!['completed'], 2);
      expect(h.state!['mode'], 'focus');
      expect(h.state!['rev'], 5);
      // remaining is derived from the wall-clock endsAt, not trusted blindly.
      expect(h.state!['remaining'], inInclusiveRange(1195, 1201));

      // The same snapshot as a JSON string (host-dependent payload shape).
      await h.callEvent('reset');
      expect(h.state!['rev'], 6);
      await h.callEvent('state.sync', payload: {
        'key': '__state',
        'value': jsonEncode(<String, dynamic>{
          ...sibling,
          'rev': 9,
          'writer': 'sibling-2',
          'running': false,
          'endsAt': 0,
          'remaining': 777,
        }),
        'appId': 'app-1',
      });
      expect(h.state!['rev'], 9);
      expect(h.state!['running'], isFalse);
      expect(h.state!['remaining'], 777);
    });

    test('state.sync ignores own echoes and stale revisions', () async {
      final writes = <Map<String, dynamic>>[];
      final h = await bootWidget('pomodoro', onStorageUpdate: writes.add);
      addTearDown(h.backend.dispose);
      Map<String, dynamic> sibling(int rev, {String writer = 'sib'}) => {
            'v': 1,
            'rev': rev,
            'writer': writer,
            'mode': 'focus',
            'running': false,
            'remaining': 100,
            'endsAt': 0,
            'completed': 3,
          };

      // Adopt rev 5, then a same-rev write from another instance is stale.
      await h.callEvent('state.sync', payload: {
        'key': '__state',
        'value': sibling(5, writer: 'a'),
        'appId': 'app-1',
      });
      expect(h.state!['rev'], 5);
      await h.callEvent(
        'state.sync',
        payload: {'key': '__state', 'value': sibling(5, writer: 'b'), 'appId': 'app-1'},
        timeout: const Duration(milliseconds: 120),
      );
      expect(h.state!['rev'], 5);

      // A local transition bumps rev; feeding our own write back is a no-op.
      await h.callEvent('skip');
      expect(h.state!['rev'], 6);
      final own = stateSnapshotOf(writes.last);
      expect(own['writer'], isNot('a'));
      await h.callEvent(
        'state.sync',
        payload: {'key': '__state', 'value': own, 'appId': 'app-1'},
        timeout: const Duration(milliseconds: 120),
      );
      expect(h.state!['rev'], 6);
      expect(h.state!['mode'], 'break'); // skip from focus landed, no rewind
      expect(h.state!['completed'], 4); // adopted focus +1, no rewind

      // A higher revision still wins after local writes (last-writer-wins).
      await h.callEvent('state.sync', payload: {
        'key': '__state',
        'value': sibling(9),
        'appId': 'app-1',
      });
      expect(h.state!['rev'], 9);
      expect(h.state!['remaining'], 100);
    });

    test('reserved event names are not treated as UI actions', () async {
      final h = await bootWidget('pomodoro');
      addTearDown(h.backend.dispose);
      final before = Map<String, dynamic>.from(h.state!);
      for (final name in ['back', 'llm.delta', 'tile.refresh']) {
        await h.callEvent(name, timeout: const Duration(milliseconds: 120));
      }
      await h.callEvent(
        'state.sync',
        payload: {'key': 'other_key', 'value': {'x': 1}},
        timeout: const Duration(milliseconds: 120),
      );
      expect(h.state, before);
    });

    test('boot hydrates a running phase from __state', () async {
      final now = DateTime.now().millisecondsSinceEpoch;
      final h = await bootWidget('pomodoro', initialStorage: {
        '__state': {
          'v': 1,
          'rev': 4,
          'writer': 'sibling-1',
          'mode': 'break',
          'running': true,
          'remaining': 295,
          'endsAt': now + 5 * 60 * 1000,
          'completed': 2,
        },
      });
      addTearDown(h.backend.dispose);
      expect(
        await waitUntil(() => h.state != null && h.state!['completed'] == 2),
        isTrue,
      );
      expect(h.state!['running'], isTrue);
      expect(h.state!['mode'], 'break');
      expect(h.state!['rev'], 4);
      // Wall clock, not the possibly stale remaining field.
      expect(h.state!['remaining'], inInclusiveRange(295, 301));
    });

    test('boot hydrates a paused phase from __state', () async {
      final h = await bootWidget('pomodoro', initialStorage: {
        '__state': {
          'v': 1,
          'rev': 8,
          'writer': 'sibling-1',
          'mode': 'focus',
          'running': false,
          'remaining': 610,
          'endsAt': 0,
          'completed': 1,
        },
      });
      addTearDown(h.backend.dispose);
      expect(
        await waitUntil(() => h.state != null && h.state!['completed'] == 1),
        isTrue,
      );
      expect(h.state!['running'], isFalse);
      expect(h.state!['remaining'], 610);
      expect(h.state!['rev'], 8);
    });

    test('boot resolves an expired running phase and persists the bump',
        () async {
      final writes = <Map<String, dynamic>>[];
      final now = DateTime.now().millisecondsSinceEpoch;
      final h = await bootWidget(
        'pomodoro',
        initialStorage: {
          '__state': {
            'v': 1,
            'rev': 9,
            'writer': 'sibling-1',
            'mode': 'focus',
            'running': true,
            'remaining': 1,
            'endsAt': now - 30 * 1000,
            'completed': 1,
          },
        },
        onStorageUpdate: writes.add,
      );
      addTearDown(h.backend.dispose);
      expect(
        await waitUntil(() => h.state != null && h.state!['mode'] == 'break'),
        isTrue,
      );
      expect(h.state!['completed'], 2); // focus finished -> +1
      expect(h.state!['running'], isTrue); // continues into the break
      // The resolution was persisted with a revision past the hydrated one.
      // (Writes carry the whole storage map; the legacy 'completed' write
      // inside finishPhase has no '__state' yet — filter those out.)
      final persisted = writes
          .where((w) => w.containsKey('__state'))
          .map(stateSnapshotOf)
          .toList();
      expect(
        persisted.map((s) => s['rev'] as int).reduce((a, b) => a > b ? a : b),
        greaterThan(9),
      );
      expect(persisted.last['mode'], 'break');
    });
  });

  group('pomodoro mini tile', () {
    test('mini layout renders a compact controls row and stays interactive',
        () async {
      final renders = <Map<String, dynamic>>[];
      final h = await bootWidget('pomodoro', onRender: renders.add);
      addTearDown(h.backend.dispose);
      h.backend.dispatchHostEvent('viewport', {'width': 170, 'height': 170});
      expect(
        await waitUntil(() {
          if (renders.isEmpty) return false;
          return findNodes(renders.last, 'gestureDetector').length >= 3;
        }),
        isTrue,
        reason: 'mini tile did not render the compact controls row',
      );

      final tree = renders.last;
      final taps = findNodes(tree, 'gestureDetector')
          .map((n) => n['onTap'])
          .toSet();
      expect(taps, containsAll(['start_pause', 'reset', 'skip']));

      // The ring shrank to make room for the controls row (was ~134px).
      final rings = findNodes(tree, 'sizedBox')
          .where((n) => n['width'] == n['height'] && n['width'] is num)
          .toList();
      expect(
        rings.map((n) => n['width'] as num).reduce((a, b) => a > b ? a : b),
        lessThanOrEqualTo(110),
      );

      // The mini controls drive the same action ids as the full layout.
      await h.callEvent('start_pause');
      expect(h.state!['running'], isTrue);
    });
  });
}
