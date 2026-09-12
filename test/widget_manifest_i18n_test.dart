import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

/// Compat contract with the host-side manifest i18n schema (flutter_agent
/// catalog): localization lives ONLY in the additive `nameI18n` /
/// `descriptionI18n` keys; the legacy `name`/`description` stay scalar
/// strings and act as the default-locale values. The jsr core ignores the
/// i18n keys (hosts resolve localized display values) and must parse the
/// manifest without loss — and must not lose the WHOLE manifest when a
/// wrong-typed value shows up under a legacy key.
void main() {
  group('WidgetManifest i18n compat', () {
    test('nameI18n/descriptionI18n parse without loss', () async {
      final reader = MemoryWidgetFileReader({
        'widgets/calc/widget.js': 'jsr.render({type:"text"});',
        'widgets/calc/manifest.json': jsonEncode({
          'id': 'calc',
          'name': 'Calculator',
          'description': 'A calculator.',
          'version': '1.1.0',
          'icon': '🧮',
          'network': false,
          'allowedCommands': <String>[],
          'cli': {'summary': 'demo'},
          'nameI18n': {
            'ru': 'Калькулятор',
            'pt-BR': 'Calculadora',
          },
          'descriptionI18n': {
            'en': 'A calculator.',
            'ru': {'file': './i18n/description.ru.md'},
          },
        }),
      });

      final manifest = await WidgetManifest.fromStorage(
        'widgets/calc',
        reader: reader,
      );

      expect(manifest, isNotNull);
      // Legacy scalars stay the default-locale values.
      expect(manifest!.id, 'calc');
      expect(manifest.name, 'Calculator');
      expect(manifest.description, 'A calculator.');
      expect(manifest.version, '1.1.0');
      expect(manifest.icon, '🧮');
      expect(manifest.networkEnabled, false);
      expect(manifest.cli, {'summary': 'demo'});
    });

    test('a map under a legacy key degrades one field, not the manifest', () async {
      final reader = MemoryWidgetFileReader({
        'widgets/bad/widget.js': 'jsr.render({type:"text"});',
        'widgets/bad/manifest.json': jsonEncode({
          'id': 'bad',
          // Wrong-typed legacy value (a localization map under `name` is NOT
          // localization by contract): the field falls back to the id while
          // the rest of the manifest survives.
          'name': {'ru': 'Плохой'},
          'description': 'still here',
          'version': '2.0.0',
        }),
      });

      final manifest = await WidgetManifest.fromStorage(
        'widgets/bad',
        reader: reader,
      );

      expect(manifest, isNotNull);
      expect(manifest!.name, 'bad'); // id fallback
      expect(manifest.description, 'still here');
      expect(manifest.version, '2.0.0');
    });

    test('wrong-typed network/files degrade instead of discarding', () async {
      final reader = MemoryWidgetFileReader({
        'widgets/weird/widget.js': 'jsr.render({type:"text"});',
        'widgets/weird/manifest.json': jsonEncode({
          'id': 'weird',
          'name': 'Weird',
          'network': 'yes',
          'files': {'a': 'b'},
        }),
      });

      final manifest = await WidgetManifest.fromStorage(
        'widgets/weird',
        reader: reader,
      );

      expect(manifest, isNotNull);
      expect(manifest!.name, 'Weird');
      expect(manifest.networkEnabled, true); // default
      expect(manifest.files, isNull); // default
    });
  });
}
