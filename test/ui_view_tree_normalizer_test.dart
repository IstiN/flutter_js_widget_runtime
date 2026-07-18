import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/ui_view_tree_normalizer.dart';

void main() {
  group('UiViewTreeNormalizer', () {
    test('normalizes React-style type aliases', () {
      final result = UiViewTreeNormalizer.normalize({
        'type': 'View',
        'children': [
          {'type': 'Text', 'data': 'hello'},
          {'type': 'Button', 'title': 'tap'},
        ],
      });
      expect(result['type'], 'column');
      final children = result['children'] as List;
      expect(children[0]['type'], 'text');
      expect(children[1]['type'], 'button');
      expect(children[1]['data'], 'tap');
    });

    test('wraps single child into children for column', () {
      final result = UiViewTreeNormalizer.normalize({
        'type': 'column',
        'child': {'type': 'text', 'data': 'solo'},
      });
      expect(result['children'], isA<List>());
      expect((result['children'] as List).length, 1);
    });

    test('converts string child to text node', () {
      final result = UiViewTreeNormalizer.normalize({
        'type': 'column',
        'children': ['plain text'],
      });
      final children = result['children'] as List;
      expect(children[0]['type'], 'text');
      expect(children[0]['data'], 'plain text');
    });

    test('aliases content to data', () {
      final result = UiViewTreeNormalizer.normalize({
        'type': 'text',
        'content': 'hello',
      });
      expect(result['data'], 'hello');
    });

    test('moves backgroundColor into decoration for container', () {
      final result = UiViewTreeNormalizer.normalize({
        'type': 'container',
        'backgroundColor': '#FF0000',
      });
      expect(result['decoration'], {'color': '#FF0000'});
    });

    test('normalizes textField aliases', () {
      final result = UiViewTreeNormalizer.normalize({
        'type': 'input',
        'placeholder': 'hint',
        'value': 'v',
        'onChanged': 'changed',
      });
      expect(result['type'], 'textField');
      expect(result['hint'], 'hint');
      expect(result['initialValue'], 'v');
      expect(result['onChange'], 'changed');
    });

    test('normalizes image aliases', () {
      final result = UiViewTreeNormalizer.normalize({
        'type': 'img',
        'uri': 'https://example.com/a.png',
      });
      expect(result['type'], 'image');
      expect(result['url'], 'https://example.com/a.png');
    });

    test('normalizes svg markup alias', () {
      final result = UiViewTreeNormalizer.normalize({
        'type': 'svg',
        'markup': '<svg></svg>',
      });
      expect(result['data'], '<svg></svg>');
    });

    test('moves items to children', () {
      final result = UiViewTreeNormalizer.normalize({
        'type': 'dropdown',
        'items': ['a', 'b'],
      });
      expect(result['children'], ['a', 'b']);
    });
  });
}
