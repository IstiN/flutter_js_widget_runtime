import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

const _counterManifest = WidgetManifest(
  id: 'counter',
  name: 'Counter',
  description: '',
  version: '1.0.0',
  icon: '🔢',
  allowedCommands: <String>[],
  networkEnabled: true,
  widgetPath: 'widgets/counter',
  isSingleFile: false,
);

void main() {
  group('WidgetManifest', () {
    test('readJs returns widget.js content', () async {
      const manifest = _counterManifest;
      final reader = MemoryWidgetFileReader({
        'widgets/counter/widget.js': 'jsr.render({type:"text"});',
      });
      final js = await manifest.readJs(reader: reader);
      expect(js, 'jsr.render({type:"text"});');
    });

    test('readJs concatenates files when manifest declares them', () async {
      final manifest = WidgetManifest(
        id: _counterManifest.id,
        name: _counterManifest.name,
        description: _counterManifest.description,
        version: _counterManifest.version,
        icon: _counterManifest.icon,
        allowedCommands: _counterManifest.allowedCommands,
        networkEnabled: _counterManifest.networkEnabled,
        widgetPath: _counterManifest.widgetPath,
        isSingleFile: _counterManifest.isSingleFile,
        files: const ['lib/a.js', 'widget.js'],
      );
      final reader = MemoryWidgetFileReader({
        'widgets/counter/lib/a.js': '// a',
        'widgets/counter/widget.js': '// main',
      });
      final js = await manifest.readJs(reader: reader);
      expect(js, '// a\n// main');
    });

    test('readJs inlines jsr.include recursively', () async {
      const manifest = _counterManifest;
      final reader = MemoryWidgetFileReader({
        'widgets/counter/widget.js':
            'jsr.include("lib/a.js"); jsr.render({});',
        'widgets/counter/lib/a.js': '// included',
      });
      final js = await manifest.readJs(reader: reader);
      expect(js, '// included; jsr.render({});');
    });

    test('fromStorage returns null when widget.js is missing', () async {
      final reader = MemoryWidgetFileReader({});
      final manifest = await WidgetManifest.fromStorage(
        'widgets/missing',
        reader: reader,
      );
      expect(manifest, isNull);
    });

    test('fromStorage parses manifest.json', () async {
      final reader = MemoryWidgetFileReader({
        'widgets/counter/widget.js': '// noop',
        'widgets/counter/manifest.json': '''
{
  "id": "counter",
  "name": "Counter",
  "icon": "🔢",
  "allowedCommands": ["*"],
  "network": false,
  "files": ["lib/a.js"]
}
''',
      });
      final manifest = await WidgetManifest.fromStorage(
        'widgets/counter',
        reader: reader,
      );
      expect(manifest, isNotNull);
      expect(manifest!.name, 'Counter');
      expect(manifest.allowedCommands, ['*']);
      expect(manifest.networkEnabled, isFalse);
      expect(manifest.files, ['lib/a.js']);
    });

    test('fromJsFilePath creates a single-file manifest', () {
      final manifest = WidgetManifest.fromJsFilePath('widgets/foo.js');
      expect(manifest.id, 'foo');
      expect(manifest.isSingleFile, isTrue);
      expect(manifest.appDir, 'widgets');
    });

    test('toJson round-trips key fields', () {
      const manifest = WidgetManifest(
        id: 'x',
        name: 'X',
        description: 'desc',
        version: '1.2.3',
        icon: '🧪',
        allowedCommands: ['run'],
        networkEnabled: false,
        widgetPath: 'widgets/x',
        isSingleFile: false,
      );
      final json = manifest.toJson();
      expect(json['id'], 'x');
      expect(json['name'], 'X');
      expect(json['version'], '1.2.3');
      expect(json['network'], isFalse);
    });
  });
}
