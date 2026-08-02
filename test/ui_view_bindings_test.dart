import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/ui_view_bindings.dart';

void main() {
  group('UiViewBindings.storageFromState / scriptsFromState', () {
    test('non-Map _storage yields an empty storage', () {
      expect(UiViewBindings.storageFromState({'_storage': 'nope'}), isEmpty);
    });

    test('scripts keep only non-blank strings', () {
      final scripts = UiViewBindings.scriptsFromState({
        '_scripts': {
          'save': 'storage.count++',
          'blank': '   ',
          'num': 42,
        },
      });
      expect(scripts, {'save': 'storage.count++'});
    });

    test('missing _scripts yields an empty map', () {
      expect(UiViewBindings.scriptsFromState(const {}), isEmpty);
    });
  });

  group('UiViewBindings.seedFieldsFromTree', () {
    test('seeds from initialValue with placeholder resolution', () {
      final seeded = UiViewBindings.seedFieldsFromTree({
        'type': 'column',
        'children': [
          {
            'type': 'textField',
            'id': 'city',
            'initialValue': '{{country}} capital',
          },
          {'type': 'textField', 'name': 'skip-empty', 'initialValue': ''},
        ],
      }, {
        'country': 'Belarus',
      });
      expect(seeded['city'], 'Belarus capital');
      expect(seeded.containsKey('skip-empty'), isFalse);
    });
  });

  group('UiViewBindings.applyTap', () {
    Map<String, dynamic> runScript({
      required String script,
      required Map<String, dynamic> storage,
      required String actionId,
      required Map<String, dynamic> payload,
    }) =>
        {...storage, 'ran': script};

    test('runs the bound script when one exists', () {
      final next = UiViewBindings.applyTap(
        state: {
          '_storage': {'n': 1},
          '_scripts': {'save': 'n++'},
        },
        actionId: 'save',
        payload: const {'x': 1},
        runScript: runScript,
      );
      expect(next['_storage']['ran'], 'n++');
      expect(next['_lastEvent']['actionId'], 'save');
    });

    test('falls back to applyEventToStorage without a script', () {
      final next = UiViewBindings.applyTap(
        state: const {},
        actionId: 'tap1',
        payload: const {'x': 1},
        runScript: runScript,
      );
      expect(next['_storage']['x'], 1);
      expect(next['_storage']['lastAction'], 'tap1');
      expect(next['_storage']['taps'], 1);
    });
  });

  group('UiViewBindings.shouldShowNode via applyTree', () {
    test('visible/when string falsy collapses the node', () {
      final tree = UiViewBindings.applyTree({
        'type': 'column',
        'children': [
          {
            'type': 'text',
            'visible': '{{hide}}',
            'data': 'gone',
          },
          {
            'type': 'text',
            'when': '0',
            'data': 'alsogone',
          },
          {'type': 'text', 'data': 'kept'},
        ],
      }, {
        'hide': 'false',
      });
      final children = tree['children'] as List;
      expect(children, hasLength(1));
      expect(children.single['data'], 'kept');
    });
  });
}
