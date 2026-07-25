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

/// Parses a curve name into a Flutter [Curve].
///
/// Unknown or null values fall back to [Curves.easeInOut].
Curve jsCurve(String? v) => switch (v) {
  'linear' => Curves.linear,
  'easeIn' => Curves.easeIn,
  'easeOut' => Curves.easeOut,
  'easeInOut' => Curves.easeInOut,
  'bounce' => Curves.bounceOut,
  'bounceIn' => Curves.bounceIn,
  'elastic' => Curves.elasticOut,
  'elasticIn' => Curves.elasticIn,
  'decelerate' => Curves.decelerate,
  'fastOutSlowIn' => Curves.fastOutSlowIn,
  _ => Curves.easeInOut,
};

/// Converts [v] to a [double], falling back to [def] when null.
///
/// Tolerant of LLM-generated input: numeric strings are parsed, a list
/// yields its first numeric element, anything else falls back to [def].
double jsDouble(dynamic v, double def) => jsDoubleOrNull(v) ?? def;

/// Converts [v] to a [double] when non-null.
///
/// Tolerant of LLM-generated input: numeric strings are parsed, a list
/// yields its first numeric element, anything else returns null instead of
/// throwing a cast error.
double? jsDoubleOrNull(dynamic v) {
  if (v == null) return null;
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v);
  if (v is List) {
    for (final e in v) {
      final d = jsDoubleOrNull(e);
      if (d != null) return d;
    }
  }
  return null;
}

/// Converts [v] to a [BorderRadius].
///
/// Accepts a single number (uniform radius), a numeric string, or a
/// CSS-style list: `[all]`, `[tl-br, tr-bl]`, `[tl, tr-bl, br]`, or
/// `[tl, tr, br, bl]`. Returns null for unusable input.
BorderRadius? jsBorderRadius(dynamic v) {
  if (v is List) {
    final vals = v.map(jsDoubleOrNull).whereType<double>().toList();
    if (vals.isEmpty) return null;
    if (vals.length == 1) return BorderRadius.circular(vals[0]);
    if (vals.length == 2) {
      return BorderRadius.only(
        topLeft: Radius.circular(vals[0]),
        bottomRight: Radius.circular(vals[0]),
        topRight: Radius.circular(vals[1]),
        bottomLeft: Radius.circular(vals[1]),
      );
    }
    if (vals.length == 3) {
      return BorderRadius.only(
        topLeft: Radius.circular(vals[0]),
        topRight: Radius.circular(vals[1]),
        bottomLeft: Radius.circular(vals[1]),
        bottomRight: Radius.circular(vals[2]),
      );
    }
    return BorderRadius.only(
      topLeft: Radius.circular(vals[0]),
      topRight: Radius.circular(vals[1]),
      bottomRight: Radius.circular(vals[2]),
      bottomLeft: Radius.circular(vals[3]),
    );
  }
  final d = jsDoubleOrNull(v);
  return d != null ? BorderRadius.circular(d) : null;
}
