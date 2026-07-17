import 'package:flutter/material.dart';

/// Minimal color theme used by [JsonWidgetRenderer] when the host does not
/// provide one.
class JsonWidgetTheme {
  const JsonWidgetTheme({
    required this.primary,
    required this.divider,
    required this.surface,
    required this.text,
    required this.muted,
  });

  factory JsonWidgetTheme.fromAccent(Color accent, {Brightness brightness = Brightness.dark}) {
    final isDark = brightness == Brightness.dark;
    return JsonWidgetTheme(
      primary: accent,
      divider: isDark ? Colors.white24 : Colors.black12,
      surface: isDark ? const Color(0xFF1e293b) : Colors.white,
      text: isDark ? const Color(0xFFf1f5f9) : Colors.black87,
      muted: isDark ? const Color(0xFF64748b) : Colors.black54,
    );
  }

  final Color primary;
  final Color divider;
  final Color surface;
  final Color text;
  final Color muted;
}

/// Default input decoration used by text fields in the JSON renderer.
InputDecoration appInputDecoration({
  required BuildContext context,
  String? labelText,
  String? hintText,
  Widget? suffixIcon,
  EdgeInsetsGeometry contentPadding = const EdgeInsets.symmetric(
    horizontal: 12,
    vertical: 10,
  ),
}) {
  final theme = Theme.of(context);
  final colorScheme = theme.colorScheme;
  final border = OutlineInputBorder(
    borderRadius: BorderRadius.circular(8),
    borderSide: BorderSide(color: colorScheme.outline.withValues(alpha: 0.5)),
  );
  return InputDecoration(
    labelText: labelText,
    hintText: hintText,
    suffixIcon: suffixIcon,
    contentPadding: contentPadding,
    border: border,
    enabledBorder: border,
    focusedBorder: border.copyWith(
      borderSide: BorderSide(color: colorScheme.primary, width: 1.5),
    ),
    filled: true,
    fillColor: colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
  );
}
