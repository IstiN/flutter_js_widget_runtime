import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

Uint8List _packet(
  String engine,
  String surface,
  int sequence, {
  bool dispose = false,
}) {
  final engineBytes = utf8.encode(engine);
  final surfaceBytes = utf8.encode(surface);
  final payloadLength = dispose ? 20 : 12;
  final headerBytes = 32 + engineBytes.length + surfaceBytes.length;
  final out = Uint8List(headerBytes + payloadLength);
  final data = ByteData.sublistView(out);
  out.setAll(0, ascii.encode('JSR3'));
  out[4] = 1;
  out[5] = 1;
  data.setUint16(6, headerBytes, Endian.little);
  data.setUint32(8, sequence, Endian.little);
  data.setUint32(12, payloadLength, Endian.little);
  data.setUint16(16, engineBytes.length, Endian.little);
  data.setUint16(18, surfaceBytes.length, Endian.little);
  data.setUint32(24, out.length, Endian.little);
  out.setAll(32, engineBytes);
  out.setAll(32 + engineBytes.length, surfaceBytes);
  out.setAll(headerBytes, ascii.encode('JSR1'));
  data.setUint16(headerBytes + 4, 1, Endian.little);
  data.setUint32(headerBytes + 8, dispose ? 1 : 0, Endian.little);
  if (dispose) out[headerBytes + 12] = 10;
  return out;
}

void main() {
  test('rejects cross-engine envelopes before creating state', () {
    final host = createFlutterGpuThreeHost();
    expect(
      () => host.submit('engine-a', _packet('engine-b', 'main#1', 1)),
      throwsA(isA<JsThreeProtocolException>()),
    );
    expect(host.findSurface('engine-a', 'main#1'), isNull);
    expect(host.findSurface('engine-b', 'main#1'), isNull);
  });

  test('temporary detach preserves state; engine dispose releases it', () {
    final host = createFlutterGpuThreeHost();
    host.submit('engine-a', _packet('engine-a', 'main#1', 1));
    final surface = host.attach('engine-a', 'main#1', const {});
    expect(identical(surface, host.findSurface('engine-a', 'main#1')), isTrue);
    host.release('engine-a', 'main#1');
    expect(surface.isDisposed, isFalse);
    expect(
      identical(host.attach('engine-a', 'main#1', const {}), surface),
      isTrue,
    );
    host.disposeEngine('engine-a');
    expect(surface.isDisposed, isTrue);
    expect(host.findSurface('engine-a', 'main#1'), isNull);
  });

  test('surface disposal is terminal for that generation', () {
    final host = createFlutterGpuThreeHost();
    host.submit('engine-a', _packet('engine-a', 'main#1', 1));
    final surface = host.attach('engine-a', 'main#1', const {});
    host.submit('engine-a', _packet('engine-a', 'main#1', 2, dispose: true));
    expect(surface.isDisposed, isTrue);
    expect(() => host.attach('engine-a', 'main#1', const {}), throwsStateError);
    host.submit('engine-a', _packet('engine-a', 'main#1', 3));
    host.release('engine-a', 'main#1');
    expect(host.findSurface('engine-a', 'main#1'), isNull);
  });

  test('diagnostics are zero before state or GPU allocation', () {
    final host = createFlutterGpuThreeHost();
    final surface = host.attach('engine-a', 'main#1', const {});
    expect(surface.diagnostics, <String, num>{
      'decodeMs': 0,
      'frameMs': 0,
      'calls': 0,
      'triangles': 0,
      'uploads': 0,
      'presentedFrames': 0,
      'coalescedFrames': 0,
      'attached': 1,
      'scheduled': 0,
      'rendering': 0,
      'backendReady': 0,
      'backendInitializing': 0,
      'surfaceWidth': 0.0,
      'surfaceHeight': 0.0,
    });
    host.disposeEngine('engine-a');
  });

  testWidgets('build shows a placeholder then a disposed surface message', (
    tester,
  ) async {
    final host = createFlutterGpuThreeHost();
    final surface = host.attach('engine-a', 'main#1', const {});
    Widget presentation() => MaterialApp(
      home: Builder(
        builder: (context) => host.build(context, surface, const {}),
      ),
    );

    await tester.pumpWidget(presentation());
    expect(find.byType(RawImage), findsNothing);
    expect(
      find.byWidgetPredicate(
        (widget) =>
            widget is ColoredBox && widget.color == const Color(0xFF000000),
      ),
      findsOneWidget,
    );

    host.disposeEngine('engine-a');
    await tester.pumpWidget(presentation());
    expect(find.text('three.surface: disposed'), findsOneWidget);
  });
}
