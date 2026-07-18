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
}
