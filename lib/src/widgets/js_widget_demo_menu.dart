import 'package:flutter/material.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';

/// Lists available JS widget manifests and opens a detail page when tapped.
class JsWidgetDemoMenu extends StatelessWidget {
  const JsWidgetDemoMenu({
    super.key,
    required this.manifests,
    required this.reader,
    required this.makeConfig,
    this.title = 'JS Widget Runtime Demo',
  });

  final List<WidgetManifest> manifests;
  final WidgetFileReader reader;

  /// Builds the runtime config for a widget about to open. The [widgetId]
  /// positional parameter lets hosts specialize per-widget wiring (e.g. a
  /// `three` host bound to the widget's asset lane); zero-argument builders
  /// still conform.
  final JsRuntimeConfig Function([String widgetId]) makeConfig;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ListView.builder(
        itemCount: manifests.length,
        itemBuilder: (context, index) {
          final manifest = manifests[index];
          return ListTile(
            leading: Text(manifest.icon, style: const TextStyle(fontSize: 28)),
            title: Text(manifest.name),
            subtitle: Text(manifest.description),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => Scaffold(
                  appBar: AppBar(title: Text(manifest.name)),
                  body: JsWidgetApp(
                    manifest: manifest,
                    reader: reader,
                    config: makeConfig(manifest.id),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
