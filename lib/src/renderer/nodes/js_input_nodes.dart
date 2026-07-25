part of '../json_widget_renderer.dart';

/// Input node builders for [JsonWidgetRenderer]: buttons, switches,
/// checkboxes, sliders, dropdowns, and text fields/text areas.
extension on JsonWidgetRenderer {
  void Function(T)? _changeHandler<T>(Map<String, dynamic> m) {
    final action = m['onChange'] ?? m['onChanged'] ?? m['onTap'];
    if (action == null) return null;
    return (T next) => onEvent('$action', <String, dynamic>{'value': next});
  }

  Widget _switchNode(Map<String, dynamic> m) {
    final value = m['value'] as bool? ?? false;
    return Switch(
      value: value,
      activeThumbColor: _color(m['color'] as String?),
      onChanged: _changeHandler<bool>(m),
    );
  }

  Widget _checkboxNode(Map<String, dynamic> m) {
    final value = m['value'] as bool? ?? false;
    final label = m['label'] as String?;
    final handler = _changeHandler<bool>(m);
    final control = Checkbox(
      value: value,
      activeColor: _color(m['color'] as String?),
      onChanged: handler == null
          ? null
          : (next) {
              if (next != null) handler(next);
            },
    );
    if (label == null) return control;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        control,
        const SizedBox(width: 8),
        Flexible(child: Text(label)),
      ],
    );
  }

  Widget _sliderNode(Map<String, dynamic> m) {
    final value = _double(m['value'], 0);
    final min = _double(m['min'], 0);
    final max = _double(m['max'], 1);
    return Slider(
      value: value.clamp(min, max),
      min: min,
      max: max,
      activeColor: _color(m['color'] as String?),
      onChanged: _changeHandler<double>(m),
    );
  }

  Widget _dropdown(Map<String, dynamic> m) {
    final items = _dropdownItems(m);
    if (items.isEmpty) return const SizedBox.shrink();
    final value = (m['value'] ?? items.first.value)?.toString();
    return DropdownButton<String>(
      isExpanded: m['expanded'] as bool? ?? true,
      value: items.any((item) => item.value == value)
          ? value
          : items.first.value,
      items: items,
      onChanged: (next) {
        final action = m['onChange'] ?? m['onChanged'] ?? m['onTap'];
        if (action == null || next == null) return;
        onEvent('$action', <String, dynamic>{'value': next});
      },
    );
  }

  List<DropdownMenuItem<String>> _dropdownItems(Map<String, dynamic> m) {
    final raw =
        m['items'] as List? ?? m['options'] as List? ?? const <dynamic>[];
    return raw.map((item) {
      if (item is String) {
        return DropdownMenuItem<String>(value: item, child: Text(item));
      }
      if (item is Map) {
        final map = item.cast<String, dynamic>();
        final value = (map['value'] ?? map['id'] ?? map['label'] ?? '')
            .toString();
        final label = (map['label'] ?? map['text'] ?? value).toString();
        return DropdownMenuItem<String>(value: value, child: Text(label));
      }
      return DropdownMenuItem<String>(value: '$item', child: Text('$item'));
    }).toList();
  }

  // ── Buttons ───────────────────────────────────────────────────────────────

  Widget _elevatedButton(Map<String, dynamic> m) {
    final label = _buttonLabel(m);
    final onTap = _tapHandler(_buttonActionId(m), m['payload']);
    return ElevatedButton(
      onPressed: onTap,
      style: _materialButtonStyle(
        m['style'] is Map
            ? Map<String, dynamic>.from(
                (m['style'] as Map).cast<String, dynamic>(),
              )
            : null,
      ),
      child: label,
    );
  }

  Widget _textButton(Map<String, dynamic> m) {
    return TextButton(
      onPressed: _tapHandler(_buttonActionId(m), m['payload']),
      style: _materialButtonStyle(
        m['style'] is Map
            ? Map<String, dynamic>.from(
                (m['style'] as Map).cast<String, dynamic>(),
              )
            : null,
        textButton: true,
      ),
      child: _buttonLabel(m),
    );
  }

  Widget _outlinedButton(Map<String, dynamic> m) {
    final style = m['style'] is Map
        ? Map<String, dynamic>.from((m['style'] as Map).cast<String, dynamic>())
        : null;
    final border = _color(style?['borderColor'] as String?);
    final base = _materialButtonStyle(style, outlined: true);
    return OutlinedButton(
      onPressed: _tapHandler(_buttonActionId(m), m['payload']),
      style: border != null
          ? (base ?? const ButtonStyle()).merge(
              ButtonStyle(
                side: WidgetStatePropertyAll(BorderSide(color: border)),
              ),
            )
          : base,
      child: _buttonLabel(m),
    );
  }

  String _buttonActionId(Map<String, dynamic> m) {
    final raw = m['onTap'] ?? m['action'] ?? m['actionId'];
    if (raw == null) return '_tap';
    final text = '$raw'.trim();
    return text.isEmpty ? '_tap' : text;
  }

  ButtonStyle? _materialButtonStyle(
    Map<String, dynamic>? style, {
    bool textButton = false,
    bool outlined = false,
  }) {
    if (style == null) return null;
    final bg = _color(style['backgroundColor'] as String?);
    final fg = _color(
      style['foregroundColor'] as String? ?? style['color'] as String?,
    );
    if (bg == null && fg == null) return null;

    final baseStyle = textButton
        ? TextButton.styleFrom(foregroundColor: fg)
        : outlined
        ? OutlinedButton.styleFrom(backgroundColor: bg, foregroundColor: fg)
        : ElevatedButton.styleFrom(backgroundColor: bg, foregroundColor: fg);

    return baseStyle.merge(
      ButtonStyle(
        backgroundColor: bg != null && !textButton
            ? WidgetStatePropertyAll(bg)
            : null,
        foregroundColor: fg != null ? WidgetStatePropertyAll(fg) : null,
      ),
    );
  }

  Widget _iconButton(Map<String, dynamic> m) => IconButton(
    icon: Icon(_iconData(m['icon'] as String? ?? 'info')),
    iconSize: _double(m['size'], 24),
    color: _color(m['color'] as String?),
    onPressed: _tapHandler(m['onTap'], m['payload']),
    tooltip: m['tooltip'] as String?,
  );

  Widget _buttonLabel(Map<String, dynamic> m) {
    final text =
        m['text'] as String? ??
        m['label'] as String? ??
        m['data'] as String? ??
        '';
    final icon = m['icon'] as String?;
    if (icon != null && text.isNotEmpty) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_iconData(icon), size: 16),
          const SizedBox(width: 6),
          Text(text),
        ],
      );
    }
    if (icon != null) return Icon(_iconData(icon));
    return Text(text);
  }

  Widget _textFieldNode(Map<String, dynamic> m) =>
      _textInputNode(m, obscure: m['obscure'] == true);

  Widget _textInputNode(
    Map<String, dynamic> m, {
    bool obscure = false,
    int? minLines,
    int? maxLines,
  }) => _TextFieldNode(
    initialValue: m['initialValue'] as String? ?? m['value'] as String? ?? '',
    hint: m['hint'] as String? ?? '',
    storageKey:
        m['storageKey'] as String? ??
        m['id'] as String? ??
        m['name'] as String?,
    fieldRegistry: fieldRegistry,
    onSubmit: m['onSubmit'] as String?,
    onChange: m['onChange'] as String? ?? m['onChanged'] as String?,
    style: _textStyle(m['style'] as Map?),
    obscure: obscure,
    minLines: minLines,
    maxLines: maxLines,
    onEvent: onEvent,
  );

  /// Renders a `textArea` node — a multiline text input that grows from
  /// `minLines` up to `maxLines` visible lines and then scrolls internally.
  ///
  /// Props:
  /// - `value` / `initialValue` (string): initial text, default `''`.
  /// - `hint` (string): placeholder text.
  /// - `minLines` (number): minimum visible lines, default 3.
  /// - `maxLines` (number): maximum visible lines before the field scrolls
  ///   internally, default 8.
  /// - `onChange` (action id): fired per keystroke with `{value}`, exactly
  ///   like `textField`.
  /// - `onSubmit` (action id, optional): shows a `done` keyboard action and
  ///   fires with `{value}` when pressed; without it Enter inserts a
  ///   newline.
  /// - `storageKey` / `id` / `name`: registers the live value with the field
  ///   registry under this key.
  ///
  /// Follows the renderer's input tolerance: `minLines`/`maxLines` accept
  /// numeric strings, garbage falls back to the defaults, and `maxLines` is
  /// clamped to at least `minLines`.
  ///
  /// JS example:
  /// ```js
  /// jsr.render({
  ///   type: 'textArea',
  ///   id: 'notes',
  ///   hint: 'Write something…',
  ///   value: draft,
  ///   minLines: 4,
  ///   maxLines: 10,
  ///   onChange: 'notes_changed',
  ///   onSubmit: 'notes_done',
  /// });
  /// ```
  Widget _textAreaNode(Map<String, dynamic> m) {
    final minLines = jsDoubleOrNull(m['minLines'])?.toInt() ?? 3;
    final maxLinesRaw = jsDoubleOrNull(m['maxLines'])?.toInt() ?? 8;
    final maxLines = maxLinesRaw < minLines ? minLines : maxLinesRaw;
    return _textInputNode(m, minLines: minLines, maxLines: maxLines);
  }
}

// ── TextField node ────────────────────────────────────────────────────────────

class _TextFieldNode extends StatefulWidget {
  const _TextFieldNode({
    required this.initialValue,
    required this.hint,
    required this.storageKey,
    required this.fieldRegistry,
    required this.onSubmit,
    required this.onChange,
    required this.style,
    required this.obscure,
    required this.onEvent,
    this.minLines,
    this.maxLines,
  });

  final String initialValue;
  final String hint;
  final String? storageKey;
  final UiViewFieldRegistry? fieldRegistry;
  final String? onSubmit;
  final String? onChange;
  final TextStyle? style;
  final bool obscure;

  /// Visible line bounds for multiline fields (`textArea`). Both null keeps
  /// the classic single-line `textField` behavior.
  final int? minLines;
  final int? maxLines;
  final void Function(String actionId, Map<String, dynamic> payload) onEvent;

  @override
  State<_TextFieldNode> createState() => _TextFieldNodeState();
}

class _TextFieldNodeState extends State<_TextFieldNode> {
  late final TextEditingController _ctrl;
  late final FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(text: widget.initialValue);
    _focusNode = FocusNode();
    _registerField();
  }

  @override
  void didUpdateWidget(_TextFieldNode old) {
    super.didUpdateWidget(old);
    if (widget.storageKey != old.storageKey) {
      _unregisterField(old.storageKey);
      _registerField();
    }
    if (widget.initialValue != old.initialValue &&
        widget.initialValue != _ctrl.text &&
        !_focusNode.hasFocus) {
      _ctrl.text = widget.initialValue;
    }
  }

  void _registerField() {
    final key = widget.storageKey;
    final registry = widget.fieldRegistry;
    if (key == null || key.isEmpty || registry == null) return;
    registry.register(key, () => _ctrl.text);
  }

  void _unregisterField(String? key) {
    final registry = widget.fieldRegistry;
    if (key == null || key.isEmpty || registry == null) return;
    registry.unregister(key);
  }

  @override
  void dispose() {
    _unregisterField(widget.storageKey);
    _focusNode.dispose();
    _ctrl.dispose();
    super.dispose();
  }

  void _emitChange(String value) {
    final key = widget.storageKey;
    if (key != null && key.isNotEmpty) {
      widget.onEvent('_field', <String, dynamic>{'key': key, 'value': value});
    }
    final action = widget.onChange;
    if (action != null) {
      widget.onEvent(action, <String, dynamic>{'value': value});
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final maxLines = widget.obscure ? 1 : widget.maxLines;
    final multiline = maxLines != null && maxLines != 1;
    return TextField(
      controller: _ctrl,
      focusNode: _focusNode,
      obscureText: widget.obscure,
      minLines: widget.minLines,
      maxLines: maxLines,
      keyboardType: multiline ? TextInputType.multiline : null,
      textInputAction: !multiline
          ? null
          : widget.onSubmit != null
          ? TextInputAction.done
          : TextInputAction.newline,
      style:
          widget.style ?? TextStyle(color: colorScheme.onSurface, fontSize: 14),
      decoration: appInputDecoration(context: context, hintText: widget.hint),
      onSubmitted: (val) {
        _emitChange(val);
        final action = widget.onSubmit;
        if (action != null) {
          widget.onEvent(action, <String, dynamic>{'value': val});
        }
      },
      onChanged: _emitChange,
    );
  }
}
