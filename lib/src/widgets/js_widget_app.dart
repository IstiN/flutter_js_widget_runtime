import 'package:flutter/material.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';

/// Loads a JS widget from a [WidgetManifest] and runs it inside a
/// [JsWidgetRuntimeWidget].
class JsWidgetApp extends StatefulWidget {
  const JsWidgetApp({
    super.key,
    required this.manifest,
    required this.reader,
    required this.config,
    this.onError,
    this.loadingBuilder,
  });

  final WidgetManifest manifest;
  final WidgetFileReader reader;
  final JsRuntimeConfig config;
  final void Function(Object error, StackTrace stackTrace)? onError;
  final WidgetBuilder? loadingBuilder;

  @override
  State<JsWidgetApp> createState() => _JsWidgetAppState();
}

class _JsWidgetAppState extends State<JsWidgetApp> {
  String? _jsSource;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant JsWidgetApp old) {
    super.didUpdateWidget(old);
    if (widget.manifest != old.manifest) {
      _load();
    }
  }

  Future<void> _load() async {
    setState(() {
      _jsSource = null;
      _error = null;
    });
    try {
      final source = await widget.manifest.readJs(reader: widget.reader);
      if (!mounted) return;
      if (source == null) {
        setState(() => _error = 'Failed to load widget source for ${widget.manifest.id}');
        return;
      }
      setState(() => _jsSource = source);
    } catch (e, st) {
      if (!mounted) return;
      setState(() => _error = e);
      widget.onError?.call(e, st);
    }
  }

  @override
  Widget build(BuildContext context) {
    final error = _error;
    if (error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text('Error loading widget: $error'),
        ),
      );
    }
    final source = _jsSource;
    if (source == null) {
      return widget.loadingBuilder?.call(context) ??
          const Center(child: CircularProgressIndicator());
    }
    return JsWidgetRuntimeWidget(
      jsSource: source,
      config: widget.config.copyWith(appDir: widget.manifest.appDir),
      onError: widget.onError,
    );
  }
}
