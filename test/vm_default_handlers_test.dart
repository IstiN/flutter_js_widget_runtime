import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/defaults/vm_default_handlers.dart';

void main() {
  group('defaultVmLoadAssetHandler', () {
    late Directory tempDir;

    setUp(() async {
      tempDir = await Directory.systemTemp.createTemp('js_widget_runtime_test');
    });

    tearDown(() async {
      await tempDir.delete(recursive: true);
    });

    test('returns file content when asset exists', () async {
      final file = File('${tempDir.path}/widget.js');
      await file.writeAsString('console.log("hi");');
      String? result;
      await defaultVmLoadAssetHandler(
        'id1',
        'widget.js',
        tempDir.path,
        (id, value) => result = value as String?,
      );
      expect(result, 'console.log("hi");');
    });

    test('returns null when appDir is null', () async {
      String? result = 'initial';
      await defaultVmLoadAssetHandler('id1', 'widget.js', null, (id, value) {
        result = value as String?;
      });
      expect(result, isNull);
    });

    test('returns null when asset is missing', () async {
      String? result = 'initial';
      await defaultVmLoadAssetHandler(
        'id1',
        'missing.js',
        tempDir.path,
        (id, value) => result = value as String?,
      );
      expect(result, isNull);
    });
  });

  group('defaultVmOpenUrlHandler', () {
    Future<ProcessResult> okRunner(String exe, List<String> args) async =>
        ProcessResult(0, 0, '', '');

    test('rejects an invalid url without launching anything', () async {
      dynamic result;
      var launched = false;
      await defaultVmOpenUrlHandler(
        'o1',
        'not-a-url',
        (id, value) => result = value,
        runProcess: (exe, args) async {
          launched = true;
          return ProcessResult(0, 0, '', '');
        },
      );
      expect(launched, isFalse);
      expect(result, {'__error': 'openUrl: invalid url not-a-url'});
    });

    test('resolves true and picks the macOS opener', () async {
      dynamic result;
      String? exe;
      List<String>? args;
      await defaultVmOpenUrlHandler(
        'o2',
        'https://example.com',
        (id, value) => result = value,
        operatingSystem: 'macos',
        runProcess: (e, a) async {
          exe = e;
          args = a;
          return ProcessResult(0, 0, '', '');
        },
      );
      expect(result, isTrue);
      expect(exe, 'open');
      expect(args, ['https://example.com']);
    });

    test('picks the Windows opener', () async {
      String? exe;
      List<String>? args;
      await defaultVmOpenUrlHandler(
        'o3',
        'https://example.com',
        (id, value) {},
        operatingSystem: 'windows',
        runProcess: (e, a) async {
          exe = e;
          args = a;
          return ProcessResult(0, 0, '', '');
        },
      );
      expect(exe, 'cmd');
      expect(args, ['/c', 'start', '', 'https://example.com']);
    });

    test('picks xdg-open on Linux', () async {
      String? exe;
      List<String>? args;
      await defaultVmOpenUrlHandler(
        'o4',
        'https://example.com',
        (id, value) {},
        operatingSystem: 'linux',
        runProcess: (e, a) async {
          exe = e;
          args = a;
          return ProcessResult(0, 0, '', '');
        },
      );
      expect(exe, 'xdg-open');
      expect(args, ['https://example.com']);
    });

    test('rejects when the opener exits non-zero', () async {
      dynamic result;
      await defaultVmOpenUrlHandler(
        'o5',
        'https://example.com',
        (id, value) => result = value,
        operatingSystem: 'linux',
        runProcess: (e, a) async => ProcessResult(0, 2, '', 'boom'),
      );
      expect(result, {'__error': 'openUrl: opener exited 2: boom'});
    });

    test('rejects when the opener throws', () async {
      dynamic result;
      await defaultVmOpenUrlHandler(
        'o6',
        'https://example.com',
        (id, value) => result = value,
        runProcess: (e, a) async => throw StateError('no opener'),
      );
      expect(result, {'__error': 'Bad state: no opener'});
    });

    test('uses the real platform opener when nothing is injected', () async {
      // Smoke: on this machine the real runner is Process.run — just make
      // sure the un-injected path is wired (do not assert the result: CI
      // runners may lack a browser opener).
      dynamic result;
      await defaultVmOpenUrlHandler(
        'o7',
        'not-a-url',
        (id, value) => result = value,
        runProcess: okRunner,
      );
      expect(result, {'__error': 'openUrl: invalid url not-a-url'});
    });
  });
}
