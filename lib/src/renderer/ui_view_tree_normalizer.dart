/// Normalizes declarative UI trees from LLMs (React/HTML habits, wrong types).
class UiViewTreeNormalizer {
  UiViewTreeNormalizer._();

  static Map<String, dynamic> normalize(Map<String, dynamic> tree) {
    return _normalizeNode(tree);
  }

  static Map<String, dynamic> _normalizeNode(Map<String, dynamic> node) {
    final out = Map<String, dynamic>.from(node);

    final rawType = out['type'];
    if (rawType is String) {
      out['type'] = _aliasType(rawType);
    }

    _aliasFields(out);
    _hoistSingleChild(out);
    if (out['children'] is List) {
      out['children'] = _normalizeChildren(out['children'] as List);
    }

    if (out['child'] is Map) {
      out['child'] = _normalizeNode(
        Map<String, dynamic>.from(
          (out['child'] as Map).cast<String, dynamic>(),
        ),
      );
    }

    if (out['items'] is List && out['children'] == null) {
      out['children'] = out.remove('items');
    }

    return out;
  }

  /// Flex containers without `children` promote their single `child` map to
  /// a one-element `children` list.
  static void _hoistSingleChild(Map<String, dynamic> out) {
    final type = out['type'] as String? ?? '';
    final isFlex = type == 'column' || type == 'row' || type == 'wrap';
    if (isFlex && out['children'] == null && out['child'] is Map) {
      out['children'] = <dynamic>[out.remove('child')];
    }
  }

  static List<dynamic> _normalizeChildren(List children) => children
      .map((child) => _normalizeChild(child))
      .toList();

  static dynamic _normalizeChild(dynamic child) {
    if (child is Map) {
      return _normalizeNode(
        Map<String, dynamic>.from(child.cast<String, dynamic>()),
      );
    }
    if (child is String) {
      return <String, dynamic>{'type': 'text', 'data': child};
    }
    return child;
  }

  static void _aliasFields(Map<String, dynamic> out) {
    _aliasTextContent(out);
    final type = out['type'] as String? ?? '';
    if (_boxTypes.contains(type)) _aliasBoxDecoration(out, type);
    if (_buttonTypes.contains(type)) _aliasButtonLabel(out);
    if (_inputTypes.contains(type)) _aliasInputFields(out, type);
    if (_imageTypes.contains(type)) _aliasImageSource(out);
    if (type == 'svg') _aliasSvgMarkup(out);
    if (_valueTypes.contains(type)) _aliasOnChanged(out);
    if (type == 'dropdown' || type == 'select') _aliasDropdown(out);
  }

  static const Set<String> _boxTypes = {'container', 'card', 'animatedContainer'};
  static const Set<String> _buttonTypes = {'button', 'textButton', 'outlinedButton'};
  static const Set<String> _inputTypes = {'textField', 'input', 'textArea'};
  static const Set<String> _imageTypes = {'image', 'networkImage', 'img'};
  static const Set<String> _valueTypes = {'switch', 'checkbox', 'slider'};

  static void _aliasTextContent(Map<String, dynamic> out) {
    if (out['content'] != null && out['data'] == null) {
      out['data'] = out.remove('content');
    }
    if (out['label'] != null && out['data'] == null && out['type'] == 'text') {
      out['data'] = out['label'];
    }
  }

  static void _aliasBoxDecoration(Map<String, dynamic> out, String type) {
    if (out['backgroundColor'] != null && out['decoration'] == null) {
      out['decoration'] = <String, dynamic>{
        'color': out.remove('backgroundColor'),
      };
    }
    if (out['color'] != null && out['decoration'] == null &&
        type == 'container') {
      out['decoration'] = <String, dynamic>{'color': out.remove('color')};
    }
  }

  static void _aliasButtonLabel(Map<String, dynamic> out) {
    if (out['title'] != null && out['data'] == null) {
      out['data'] = out.remove('title');
    }
    if (out['text'] != null && out['data'] == null) {
      out['data'] = out.remove('text');
    }
  }

  static void _aliasInputFields(Map<String, dynamic> out, String type) {
    out['type'] = type == 'textArea' ? 'textArea' : 'textField';
    if (out['placeholder'] != null && out['hint'] == null) {
      out['hint'] = out.remove('placeholder');
    }
    if (out['value'] != null && out['initialValue'] == null) {
      out['initialValue'] = out.remove('value');
    }
    _aliasOnChanged(out);
  }

  static void _aliasImageSource(Map<String, dynamic> out) {
    out['type'] = 'image';
    if (out['uri'] != null && out['url'] == null) {
      out['url'] = out.remove('uri');
    }
    if (out['source'] != null && out['url'] == null) {
      out['url'] = out.remove('source');
    }
  }

  static void _aliasSvgMarkup(Map<String, dynamic> out) {
    if (out['markup'] != null && out['data'] == null) {
      out['data'] = out.remove('markup');
    }
  }

  static void _aliasOnChanged(Map<String, dynamic> out) {
    if (out['onChanged'] != null && out['onChange'] == null) {
      out['onChange'] = out.remove('onChanged');
    }
  }

  static void _aliasDropdown(Map<String, dynamic> out) {
    out['type'] = 'dropdown';
    _aliasOnChanged(out);
  }

  static String _aliasType(String raw) {
    final key = raw.trim();
    return _typeAliases[key] ?? _typeAliases[key.toLowerCase()] ?? key;
  }

  static const Map<String, String> _typeAliases = <String, String>{
    'Text': 'text',
    'text': 'text',
    'Label': 'text',
    'label': 'text',
    'p': 'text',
    'span': 'text',
    'Button': 'button',
    'button': 'button',
    'ElevatedButton': 'button',
    'elevatedButton': 'button',
    'TextButton': 'textButton',
    'OutlinedButton': 'outlinedButton',
    'IconButton': 'iconButton',
    'View': 'column',
    'view': 'column',
    'div': 'column',
    'box': 'container',
    'Box': 'container',
    'Fragment': 'column',
    'ScrollView': 'scroll',
    'scrollView': 'scroll',
    'scroll': 'scroll',
    'SingleChildScrollView': 'scroll',
    'singleChildScrollView': 'scroll',
    'ListView': 'listView',
    'GridView': 'gridView',
    'Image': 'image',
    'networkImage': 'image',
    'NetworkImage': 'image',
    'img': 'image',
    'Svg': 'svg',
    'SVG': 'svg',
    'Card': 'card',
    'Row': 'row',
    'Column': 'column',
    'Stack': 'stack',
    'Center': 'center',
    'Padding': 'padding',
    'SizedBox': 'sizedBox',
    'Container': 'container',
    'ListTile': 'listTile',
    'listItem': 'listTile',
    'ListItem': 'listTile',
    'ProgressBar': 'linearProgressIndicator',
    'progress': 'linearProgressIndicator',
    'linearProgress': 'linearProgressIndicator',
    'ActivityIndicator': 'circularProgressIndicator',
    'spinner': 'circularProgressIndicator',
    'TextInput': 'textField',
    'textInput': 'textField',
    'input': 'textField',
    'TextArea': 'textArea',
    'textarea': 'textArea',
    'Switch': 'switch',
    'Checkbox': 'checkbox',
    'Slider': 'slider',
    'Markdown': 'markdown',
    'md': 'markdown',
    'Avatar': 'circleAvatar',
    'CircleAvatar': 'circleAvatar',
    'avatar': 'circleAvatar',
    'Chip': 'chip',
    'Tag': 'chip',
    'tag': 'chip',
    'Badge': 'badge',
    'Dropdown': 'dropdown',
    'Select': 'dropdown',
    'select': 'dropdown',
    'InkWell': 'inkWell',
    'GestureDetector': 'gestureDetector',
    'SafeArea': 'safeArea',
    'Divider': 'divider',
    'Spacer': 'spacer',
    'Icon': 'icon',
    'Scene3d': 'scene3d',
    'scene3d': 'scene3d',
    'scene3D': 'scene3d',
    '3d': 'scene3d',
    'model3d': 'scene3d',
    'model': 'scene3d',
    'glb': 'scene3d',
  };
}
