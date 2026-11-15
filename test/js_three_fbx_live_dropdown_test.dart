import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'support/fake_three_host.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/three_test_config.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets(
    'FBX asset dropdown opens and selects through real pointer taps',
    (tester) async {
      final host = _AssetLoadingThreeHost();
      final requestedAssets = host.requestedAssets;
      addTearDown(() => host.disposeEngine('fbx-live-dropdown'));
      final sources = await tester.runAsync(
        () async => (
          three: await rootBundle.loadString(
            'assets/three/jsr_three_native.js',
          ),
          widget: await File(
            'example/widgets/three-loader-fbx/widget.js',
          ).readAsString(),
        ),
      );
      Object? runtimeError;
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.dark(useMaterial3: true),
          home: Scaffold(
            body: JsWidgetRuntimeWidget(
              jsSource: sources!.widget,
              config: threeTestConfig(
                engineId: 'fbx-live-dropdown',
                widgetId: 'three-loader-fbx',
                host: host,
                threeSource: sources.three,
              ),
              onError: (error, stackTrace) => runtimeError = error,
            ),
          ),
        ),
      );

      for (var attempt = 0; attempt < 200; attempt++) {
        if (find.byType(DropdownButton<String>).evaluate().length >= 2) break;
        await tester.runAsync(
          () => Future<void>.delayed(const Duration(milliseconds: 20)),
        );
        await tester.pump(const Duration(milliseconds: 50));
      }
      expect(runtimeError, isNull);
      final dropdowns = find.byType(DropdownButton<String>);
      expect(dropdowns, findsNWidgets(2));
      final assetDropdown = tester.widget<DropdownButton<String>>(
        dropdowns.first,
      );
      expect(assetDropdown.value?.toLowerCase(), contains('samba'));

      await tester.tap(dropdowns.first);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      expect(
        find.byType(DropdownMenuItem<String>),
        findsWidgets,
        reason:
            'the real DropdownButton popup route must open on a pointer tap',
      );

      final warriorItem = find.byWidgetPredicate(
        (widget) =>
            widget is DropdownMenuItem<String> &&
            widget.value?.toLowerCase().contains('warrior') == true,
      );
      expect(warriorItem, findsOneWidget);
      await tester.tap(warriorItem);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      for (var attempt = 0; attempt < 200; attempt++) {
        final current = tester.widget<DropdownButton<String>>(dropdowns.first);
        if (current.value?.toLowerCase().contains('warrior') == true &&
            requestedAssets.any((url) => url.contains('warrior/Warrior.fbx'))) {
          break;
        }
        await tester.runAsync(
          () => Future<void>.delayed(const Duration(milliseconds: 20)),
        );
        await tester.pump(const Duration(milliseconds: 50));
      }

      expect(
        tester
            .widget<DropdownButton<String>>(dropdowns.first)
            .value
            ?.toLowerCase(),
        contains('warrior'),
        reason: 'the official controller must process the menu selection',
      );
      expect(
        requestedAssets.any((url) => url.contains('warrior/Warrior.fbx')),
        isTrue,
        reason: 'the visible selection must load the requested official asset',
      );
      expect(runtimeError, isNull);

      await tester.pumpWidget(const SizedBox());
    },
    timeout: const Timeout(Duration(minutes: 2)),
  );
}

/// Keeps the real QuickJS, asset, render-tree and Flutter hit-test paths while
/// leaving GPU presentation to the native integration tests that enable it.
class _AssetLoadingThreeHost extends FakeThreeHost {
  final requestedAssets = <String>[];
  final _assetLoader = widgetDirAssetLoader('example/widgets/three-loader-fbx');

  @override
  Future<JsThreeAsset> loadAsset(String engineId, String url) {
    requestedAssets.add(url);
    return _assetLoader(engineId, url);
  }
}
