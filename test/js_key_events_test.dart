import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/widgets/js_key_events.dart';

void main() {
  group('jsKeyLabel', () {
    test('maps named game keys to camelCase labels', () {
      expect(jsKeyLabel(LogicalKeyboardKey.arrowLeft), 'arrowLeft');
      expect(jsKeyLabel(LogicalKeyboardKey.arrowRight), 'arrowRight');
      expect(jsKeyLabel(LogicalKeyboardKey.arrowUp), 'arrowUp');
      expect(jsKeyLabel(LogicalKeyboardKey.arrowDown), 'arrowDown');
      expect(jsKeyLabel(LogicalKeyboardKey.space), 'space');
      expect(jsKeyLabel(LogicalKeyboardKey.enter), 'enter');
      expect(jsKeyLabel(LogicalKeyboardKey.escape), 'escape');
    });

    test('lowercases single character keys', () {
      expect(jsKeyLabel(LogicalKeyboardKey.keyA), 'a');
      expect(jsKeyLabel(LogicalKeyboardKey.keyD), 'd');
      expect(jsKeyLabel(LogicalKeyboardKey.keyR), 'r');
    });
  });

  group('jsKeyEventPayload', () {
    test('key down reports down=true repeat=false', () {
      const event = KeyDownEvent(
        physicalKey: PhysicalKeyboardKey.keyA,
        logicalKey: LogicalKeyboardKey.keyA,
        timeStamp: Duration.zero,
      );
      final payload = jsKeyEventPayload(event);
      expect(payload['key'], 'a');
      expect(payload['down'], isTrue);
      expect(payload['repeat'], isFalse);
      expect(payload['code'], isA<String>());
    });

    test('key up reports down=false', () {
      const event = KeyUpEvent(
        physicalKey: PhysicalKeyboardKey.arrowLeft,
        logicalKey: LogicalKeyboardKey.arrowLeft,
        timeStamp: Duration.zero,
      );
      final payload = jsKeyEventPayload(event);
      expect(payload['key'], 'arrowLeft');
      expect(payload['down'], isFalse);
    });

    test('key repeat reports repeat=true', () {
      const event = KeyRepeatEvent(
        physicalKey: PhysicalKeyboardKey.arrowRight,
        logicalKey: LogicalKeyboardKey.arrowRight,
        timeStamp: Duration.zero,
      );
      final payload = jsKeyEventPayload(event);
      expect(payload['repeat'], isTrue);
      expect(payload['down'], isTrue);
    });
  });

  group('jsEditableTextHasFocus', () {
    testWidgets('is false when nothing is focused', (tester) async {
      await tester.pumpWidget(const SizedBox());
      expect(jsEditableTextHasFocus(), isFalse);
    });

    testWidgets('is true when an EditableText holds primary focus', (
      tester,
    ) async {
      final focusNode = await _pumpEditableText(tester);
      expect(jsEditableTextHasFocus(), isFalse);
      focusNode.requestFocus();
      await tester.pump();
      expect(jsEditableTextHasFocus(), isTrue);
    });
  });

  group('jsHandleRuntimeKeyEvent', () {
    const event = KeyDownEvent(
      physicalKey: PhysicalKeyboardKey.keyA,
      logicalKey: LogicalKeyboardKey.keyA,
      timeStamp: Duration.zero,
    );

    testWidgets('dispatches the payload when no text field is focused', (
      tester,
    ) async {
      await tester.pumpWidget(const SizedBox());
      final dispatched = <Map<String, dynamic>>[];
      final result = jsHandleRuntimeKeyEvent(event, dispatched.add);
      expect(result, KeyEventResult.handled);
      expect(dispatched.single['key'], 'a');
      expect(dispatched.single['down'], isTrue);
    });

    testWidgets('ignores keys while an EditableText is focused', (
      tester,
    ) async {
      final focusNode = await _pumpEditableText(tester);
      focusNode.requestFocus();
      await tester.pump();

      final dispatched = <Map<String, dynamic>>[];
      final result = jsHandleRuntimeKeyEvent(event, dispatched.add);
      expect(result, KeyEventResult.ignored);
      expect(dispatched, isEmpty);
    });
  });
}

Future<FocusNode> _pumpEditableText(WidgetTester tester) async {
  final focusNode = FocusNode();
  await tester.pumpWidget(
    Directionality(
      textDirection: TextDirection.ltr,
      child: EditableText(
        controller: TextEditingController(),
        focusNode: focusNode,
        style: const TextStyle(),
        cursorColor: const Color(0xFF000000),
        backgroundCursorColor: const Color(0xFFFFFFFF),
      ),
    ),
  );
  return focusNode;
}
