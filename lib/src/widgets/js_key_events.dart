import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Helpers that map Flutter [KeyEvent]s to the JSON payload delivered to
/// `jsr.onKey` handlers, and decide when key capture must yield to text input.

/// Converts [event] into the payload shape documented for `jsr.onKey`:
/// `{key, code, down, repeat}`.
Map<String, dynamic> jsKeyEventPayload(KeyEvent event) => {
  'key': jsKeyLabel(event.logicalKey),
  'code': event.physicalKey.debugName ?? '',
  'down': event is! KeyUpEvent,
  'repeat': event is KeyRepeatEvent,
};

/// Maps a [LogicalKeyboardKey] to a short, JS-friendly label.
///
/// Named game keys use camelCase (`arrowLeft`, `space`, `enter`, ...);
/// printable single-character keys are lowercased (`'A'` → `'a'`).
String jsKeyLabel(LogicalKeyboardKey key) {
  final named = _namedKeyLabels[key];
  if (named != null) return named;
  final label = key.keyLabel;
  if (label.length == 1) return label.toLowerCase();
  return label;
}

final Map<LogicalKeyboardKey, String> _namedKeyLabels = {
  LogicalKeyboardKey.arrowLeft: 'arrowLeft',
  LogicalKeyboardKey.arrowRight: 'arrowRight',
  LogicalKeyboardKey.arrowUp: 'arrowUp',
  LogicalKeyboardKey.arrowDown: 'arrowDown',
  LogicalKeyboardKey.space: 'space',
  LogicalKeyboardKey.enter: 'enter',
  LogicalKeyboardKey.escape: 'escape',
  LogicalKeyboardKey.tab: 'tab',
  LogicalKeyboardKey.backspace: 'backspace',
  LogicalKeyboardKey.shiftLeft: 'shift',
  LogicalKeyboardKey.shiftRight: 'shift',
  LogicalKeyboardKey.controlLeft: 'control',
  LogicalKeyboardKey.controlRight: 'control',
  LogicalKeyboardKey.altLeft: 'alt',
  LogicalKeyboardKey.altRight: 'alt',
};

/// True when an editable text field currently holds the primary focus.
///
/// Key capture for `jsr.onKey` must never swallow keystrokes destined for a
/// focused `textField`/`textArea` node, so the runtime checks this before
/// forwarding key events to JS.
bool jsEditableTextHasFocus() {
  final context = FocusManager.instance.primaryFocus?.context;
  if (context == null) return false;
  if (context.widget is EditableText) return true;
  return context.findAncestorWidgetOfExactType<EditableText>() != null;
}

/// [Focus.onKeyEvent] handler used by the runtime widget: forwards [event] to
/// [dispatch] (which delivers it to `jsr.onKey`) unless an editable text
/// field holds the primary focus.
KeyEventResult jsHandleRuntimeKeyEvent(
  KeyEvent event,
  void Function(Map<String, dynamic> payload) dispatch,
) {
  if (jsEditableTextHasFocus()) return KeyEventResult.ignored;
  dispatch(jsKeyEventPayload(event));
  return KeyEventResult.handled;
}
