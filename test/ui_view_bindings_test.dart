import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

void main() {
  group('UiViewBindings', () {
    test('resolveString replaces storage placeholders', () {
      final resolved = UiViewBindings.resolveString(
        'Clicks: {{taps}} — {{message}}',
        <String, dynamic>{'taps': 3, 'message': 'Hi'},
      );
      expect(resolved, 'Clicks: 3 — Hi');
    });

    test('applyEventToStorage increments taps and stores payload', () {
      final next = UiViewBindings.applyEventToStorage(
        storage: <String, dynamic>{'taps': 2},
        actionId: 'btn1',
        payload: <String, dynamic>{'message': 'Clicked'},
      );
      expect(next['taps'], 3);
      expect(next['lastAction'], 'btn1');
      expect(next['message'], 'Clicked');
    });

    test('applyFieldStorage writes one key without tap increment', () {
      final next = UiViewBindings.applyFieldStorage(
        state: <String, dynamic>{'_storage': <String, dynamic>{'name': 'Old'}},
        key: 'nameInput',
        value: 'Anna',
      );
      final storage = UiViewBindings.storageFromState(next);
      expect(storage['nameInput'], 'Anna');
      expect(storage['name'], 'Old');
      expect(storage['taps'], isNull);
    });

    test('seedFieldsFromTree seeds textField id from value', () {
      final seeded = UiViewBindings.seedFieldsFromTree(
        <String, dynamic>{
          'type': 'textField',
          'id': 'nameInput',
          'value': 'Guest',
        },
        <String, dynamic>{},
      );
      expect(seeded['nameInput'], 'Guest');
    });

    test('withLiveFields overlays registry snapshot', () {
      final registry = UiViewFieldRegistry();
      registry.register('nameInput', () => 'Anna');
      final merged = UiViewBindings.withLiveFields(
        <String, dynamic>{'_storage': <String, dynamic>{'name': 'Old'}},
        registry,
      );
      final storage = UiViewBindings.storageFromState(merged);
      expect(storage['nameInput'], 'Anna');
      expect(storage['name'], 'Old');
    });

    test('applyTree hides nodes when when resolves empty', () {
      final resolved = UiViewBindings.applyTree(
        <String, dynamic>{
          'type': 'column',
          'children': <Map<String, dynamic>>[
            <String, dynamic>{
              'type': 'text',
              'data': 'Visible',
            },
            <String, dynamic>{
              'type': 'text',
              'data': 'Hidden',
              'when': '{{showHidden}}',
            },
          ],
        },
        <String, dynamic>{'showHidden': ''},
      );

      final children = resolved['children'] as List;
      expect(children, hasLength(1));
      expect((children.first as Map)['data'], 'Visible');
    });
  });
}
