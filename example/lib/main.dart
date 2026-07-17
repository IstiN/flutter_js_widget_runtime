import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const DemoApp());
}

class DemoApp extends StatelessWidget {
  const DemoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'JS Widget Runtime Demo',
      theme: ThemeData.dark(useMaterial3: true),
      home: const DemoHome(),
    );
  }
}

class DemoHome extends StatefulWidget {
  const DemoHome({super.key});

  @override
  State<DemoHome> createState() => _DemoHomeState();
}

class _DemoHomeState extends State<DemoHome> {
  final List<WidgetManifest> _manifests = [];
  bool _loading = true;
  String? _error;

  static const _widgetIds = [
    'yolo-hello',
    'calculator',
    'animation-showcase',
    'weather',
    'stocks',
    'crypto',
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final reader = const AssetWidgetFileReader('widgets');
    final manifests = <WidgetManifest>[];
    try {
      for (final id in _widgetIds) {
        final manifest = await WidgetManifest.fromStorage(
          'widgets/$id',
          reader: reader,
        );
        if (manifest != null) manifests.add(manifest);
      }
      setState(() {
        _manifests.addAll(manifests);
        _loading = false;
      });
    } catch (e, st) {
      setState(() {
        _error = '$e';
        _loading = false;
      });
      debugPrint('Demo load error: $e\n$st');
    }
  }

  JsRuntimeConfig _makeConfig() => JsRuntimeConfig(
    widgetId: 'demo',
    onRender: (_) {},
    onSetTitle: (_) {},
    onStorageUpdate: (_) {},
    fetchHandler: (id, url, method, headers) async {
      // Demo fetch: only allow GET to a few public APIs used by weather/stocks.
      if (method != 'GET') {
        throw UnsupportedError('Only GET is allowed in demo');
      }
      final client = HttpClient();
      try {
        final request = await client.getUrl(Uri.parse(url));
        headers.forEach(request.headers.set);
        final response = await request.close();
        final body = await response.transform(const Utf8Decoder()).join();
        // ignore: avoid_print
        print('fetch $id: $body');
      } finally {
        client.close();
      }
    },
  );

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    final error = _error;
    if (error != null) {
      return Scaffold(
        body: Center(child: Text('Error: $error')),
      );
    }
    return JsWidgetDemoMenu(
      title: 'JS Widget Runtime Demo',
      manifests: _manifests,
      reader: const AssetWidgetFileReader('widgets'),
      makeConfig: _makeConfig,
    );
  }
}
