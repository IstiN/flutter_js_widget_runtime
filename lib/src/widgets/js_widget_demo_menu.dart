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

  /// Emoji/simple glyphs render as text; markup (e.g. inline SVG strings from
  /// a manifest) falls back to a generic Material icon so raw markup never
  /// leaks into the menu.
  Widget _leadingIcon(String icon) {
    if (icon.length <= 4 && !icon.contains('<')) {
      return Text(icon, style: const TextStyle(fontSize: 28));
    }
    return const Icon(Icons.widgets, size: 28);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ListView.builder(
        itemCount: manifests.length,
        itemBuilder: (context, index) {
          final manifest = manifests[index];
          return ListTile(
            leading: _leadingIcon(manifest.icon),
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
