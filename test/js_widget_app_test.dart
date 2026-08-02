import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

WidgetManifest _manifest({String path = 'widgets/demo'}) => WidgetManifest(
  id: 'demo',
  name: 'Demo Widget',
  description: 'A demo manifest',
  version: '1.0.0',
  icon: '🧩',
  allowedCommands: const [],
  networkEnabled: false,
  widgetPath: path,
  isSingleFile: false,
);

JsRuntimeConfig _config() => JsRuntimeConfig(
  onRender: (_) {},
  onSetTitle: (_) {},
  onStorageUpdate: (_) {},
);

void main() {
  testWidgets('JsWidgetApp shows the error view when the source is missing', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: JsWidgetApp(
          manifest: _manifest(),
          reader: MemoryWidgetFileReader(const {}),
          config: _config(),
        ),
      ),
    );
    // First frame is the loading state.
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    await tester.pumpAndSettle();
    expect(
      find.textContaining('Error loading widget'),
      findsOneWidget,
    );
  });

  testWidgets('JsWidgetApp reports a reader failure via onError', (
    tester,
  ) async {
    Object? reported;
    await tester.pumpWidget(
      MaterialApp(
        home: JsWidgetApp(
          manifest: _manifest(),
          reader: _ThrowingReader(),
          config: _config(),
          onError: (error, stackTrace) => reported = error,
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(reported, isNotNull);
    expect(find.textContaining('Error loading widget'), findsOneWidget);
  });

  testWidgets('JsWidgetApp reloads when the manifest changes', (tester) async {
    Future<void> pump(WidgetManifest manifest) => tester.pumpWidget(
      MaterialApp(
        home: JsWidgetApp(
          manifest: manifest,
          reader: MemoryWidgetFileReader(const {}),
          config: _config(),
        ),
      ),
    );

    await pump(_manifest());
    await tester.pumpAndSettle();
    expect(find.textContaining('demo'), findsWidgets);

    await pump(_manifest(path: 'widgets/other'));
    // The reload resets into the loading state before settling on error.
    await tester.pumpAndSettle();
    expect(find.textContaining('Error loading widget'), findsOneWidget);
  });

  testWidgets('JsWidgetDemoMenu lists manifests and opens the detail page', (
    tester,
  ) async {
    final manifests = [_manifest(), _manifest(path: 'widgets/second')];
    await tester.pumpWidget(
      MaterialApp(
        home: JsWidgetDemoMenu(
          manifests: manifests,
          reader: MemoryWidgetFileReader(const {}),
          makeConfig: _config,
        ),
      ),
    );

    expect(find.text('JS Widget Runtime Demo'), findsOneWidget);
    expect(find.byType(ListTile), findsNWidgets(2));

    await tester.tap(find.byType(ListTile).first);
    await tester.pumpAndSettle();
    // The detail page pushed a JsWidgetApp, which surfaces the missing
    // source as its error view (no JS engine is started on this path).
    expect(find.textContaining('Error loading widget'), findsOneWidget);
  });
}

class _ThrowingReader implements WidgetFileReader {
  @override
  Future<String?> readString(String path) =>
      throw StateError('read failed: $path');

  @override
  Future<bool> exists(String path) async => false;
}
