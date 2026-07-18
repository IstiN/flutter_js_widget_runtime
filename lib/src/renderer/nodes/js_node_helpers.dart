import 'package:flutter/material.dart';

/// Parses a CSS-style color string into a Flutter [Color].
///
/// Supports `#RRGGBB`, `#RGB`, and a fixed set of named colors.
/// Returns `null` for empty/unknown values.
Color? parseColor(String? s) {
  if (s == null || s.isEmpty) return null;
  if (s.startsWith('#')) {
    var hex = s.substring(1);
    if (hex.length == 3) {
      hex = hex.split('').map((c) => c + c).join();
    }
    if (hex.length == 6) hex = 'FF$hex';
    return Color(int.parse(hex, radix: 16));
  }
  return _parseNamedColor(s);
}

Color? _parseNamedColor(String name) {
  return switch (name.toLowerCase()) {
    'transparent' => Colors.transparent,
    'white' => Colors.white,
    'black' => Colors.black,
    'red' => Colors.red,
    'green' => Colors.green,
    'blue' => Colors.blue,
    'yellow' => Colors.yellow,
    'orange' => Colors.orange,
    'purple' => Colors.purple,
    'grey' => Colors.grey,
    'gray' => Colors.grey,
    'pink' => Colors.pink,
    'teal' => Colors.teal,
    'cyan' => Colors.cyan,
    'amber' => Colors.amber,
    'indigo' => Colors.indigo,
    'lime' => Colors.lime,
    'brown' => Colors.brown,
    _ => null,
  };
}

/// Converts [v] to a [double], falling back to [def] when null.
double jsDouble(dynamic v, double def) =>
    v == null ? def : (v as num).toDouble();

/// Converts [v] to a [double] when non-null.
double? jsDoubleOrNull(dynamic v) => v == null ? null : (v as num).toDouble();
