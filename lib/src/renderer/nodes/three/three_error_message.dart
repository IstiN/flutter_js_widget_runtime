import 'package:flutter/material.dart';

/// Displays a native or web THREE surface error with the host theme.
class ThreeErrorMessage extends StatelessWidget {
  const ThreeErrorMessage(this.error, {super.key});

  final String error;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ColoredBox(
      color: theme.colorScheme.surfaceContainerHighest,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Text(
            error,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.error,
            ),
          ),
        ),
      ),
    );
  }
}
