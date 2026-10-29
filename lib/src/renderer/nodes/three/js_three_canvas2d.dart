import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_host.dart';

const int jsThreeCanvas2DMaxDimension = 4096;
const int jsThreeCanvas2DMaxPixels = 16777216;
const int jsThreeCanvas2DMaxCommands = 1024;
const int jsThreeCanvas2DMaxStops = 64;

final class JsThreeCanvas2DRequest {
  const JsThreeCanvas2DRequest({
    required this.engineId,
    required this.surfaceId,
    required this.canvasId,
    required this.generation,
    required this.requestId,
    required this.width,
    required this.height,
    required this.commands,
    required this.dispose,
  });

  final String engineId;
  final String surfaceId;
  final String canvasId;
  final int generation;
  final int requestId;
  final int width;
  final int height;
  final List<JsThreeCanvas2DFillRect> commands;
  final bool dispose;
}

final class JsThreeCanvas2DFillRect {
  const JsThreeCanvas2DFillRect({
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    required this.paint,
  });

  final double x;
  final double y;
  final double width;
  final double height;
  final _Canvas2DPaint paint;
}

typedef JsThreeCanvas2DRasterizer =
    Future<Uint8List> Function(JsThreeCanvas2DRequest request);

sealed class _Canvas2DPaint {
  const _Canvas2DPaint();
  void apply(ui.Paint paint);
}

final class _Canvas2DColorPaint extends _Canvas2DPaint {
  const _Canvas2DColorPaint(this.color);
  final ui.Color color;
  @override
  void apply(ui.Paint paint) => paint.color = color;
}

final class _Canvas2DRadialPaint extends _Canvas2DPaint {
  const _Canvas2DRadialPaint({
    required this.centerX,
    required this.centerY,
    required this.radius,
    required this.colors,
    required this.stops,
  });

  final double centerX;
  final double centerY;
  final double radius;
  final List<ui.Color> colors;
  final List<double> stops;

  @override
  void apply(ui.Paint paint) {
    paint.shader = ui.Gradient.radial(
      ui.Offset(centerX, centerY),
      radius,
      colors,
      stops,
    );
  }
}

JsThreeCanvas2DRequest parseJsThreeCanvas2DRequest(
  Map<String, dynamic> source,
) {
  final action = source['action'] ?? 'rasterize';
  if (action != 'rasterize' && action != 'dispose') {
    throw const FormatException('three.canvas2d: unknown action');
  }
  final dispose = action == 'dispose';
  final width = _integer(source, 'width', 0, jsThreeCanvas2DMaxDimension);
  final height = _integer(source, 'height', 0, jsThreeCanvas2DMaxDimension);
  if (!dispose && (width == 0 || height == 0)) {
    throw const FormatException('three.canvas2d: dimensions must be nonzero');
  }
  if (width * height > jsThreeCanvas2DMaxPixels) {
    throw const FormatException('three.canvas2d: pixel quota exceeded');
  }
  final rawCommands = source['commands'];
  if (rawCommands is! List || rawCommands.length > jsThreeCanvas2DMaxCommands) {
    throw const FormatException('three.canvas2d: invalid command list');
  }
  final commands = dispose
      ? const <JsThreeCanvas2DFillRect>[]
      : rawCommands.map(_parseCommand).toList(growable: false);
  return JsThreeCanvas2DRequest(
    engineId: _identity(source, 'engineId'),
    surfaceId: _identity(source, 'surfaceId'),
    canvasId: _identity(source, 'canvasId'),
    generation: _integer(source, 'generation', 1, 9007199254740991),
    requestId: _integer(source, 'requestId', 1, 9007199254740991),
    width: width,
    height: height,
    commands: commands,
    dispose: dispose,
  );
}

String _identity(Map<String, dynamic> source, String name) {
  final value = source[name];
  if (value is! String || value.isEmpty || utf8.encode(value).length > 128) {
    throw FormatException('three.canvas2d: invalid $name');
  }
  return value;
}

int _integer(
  Map<String, dynamic> source,
  String name,
  int minimum,
  int maximum,
) {
  final value = source[name];
  if (value is! num || !value.isFinite || value % 1 != 0) {
    throw FormatException('three.canvas2d: $name must be an integer');
  }
  final integer = value.toInt();
  if (integer < minimum || integer > maximum) {
    throw FormatException('three.canvas2d: $name is outside its quota');
  }
  return integer;
}

double _number(Object? value, String name) {
  if (value is! num || !value.isFinite || value.abs() > 10000000) {
    throw FormatException('three.canvas2d: invalid $name');
  }
  return value.toDouble();
}

Map<String, dynamic> _stringMap(Object? value, String name) {
  if (value is! Map) throw FormatException('three.canvas2d: invalid $name');
  return value.cast<String, dynamic>();
}

JsThreeCanvas2DFillRect _parseCommand(Object? value) {
  final command = _stringMap(value, 'command');
  if (command['op'] != 'fillRect') {
    throw const JsThreeUnsupportedException(
      'canvas2d.operation',
      'only fillRect is included in the bounded profile',
    );
  }
  final style = _stringMap(command['style'], 'fillStyle');
  return JsThreeCanvas2DFillRect(
    x: _number(command['x'], 'rectangle'),
    y: _number(command['y'], 'rectangle'),
    width: _number(command['width'], 'rectangle'),
    height: _number(command['height'], 'rectangle'),
    paint: _parsePaint(style),
  );
}

_Canvas2DPaint _parsePaint(Map<String, dynamic> style) {
  final kind = style['kind'];
  if (kind == 'color') return _parseColorPaint(style);
  if (kind != 'radial') {
    throw const JsThreeUnsupportedException('canvas2d.fillStyle');
  }
  return _parseRadialPaint(style);
}

_Canvas2DPaint _parseColorPaint(Map<String, dynamic> style) {
  final value = style['color'];
  if (value is! String || value.length > 128) {
    throw const FormatException('three.canvas2d: invalid color');
  }
  return _Canvas2DColorPaint(_parseColor(value));
}

_Canvas2DPaint _parseRadialPaint(Map<String, dynamic> style) {
  final centerX = _number(style['centerX'], 'gradient center');
  final centerY = _number(style['centerY'], 'gradient center');
  final radius = _number(style['radius'], 'gradient radius');
  if (radius <= 0) {
    throw const JsThreeUnsupportedException(
      'canvas2d.radialGradient',
      'radius must be positive',
    );
  }
  final rawStops = style['stops'];
  if (rawStops is! List ||
      rawStops.length < 2 ||
      rawStops.length > jsThreeCanvas2DMaxStops) {
    throw const FormatException('three.canvas2d: invalid gradient stops');
  }
  final colors = <ui.Color>[];
  final stops = <double>[];
  var previous = -1.0;
  for (final rawStop in rawStops) {
    final stop = _stringMap(rawStop, 'gradient stop');
    final offset = _number(stop['offset'], 'gradient offset');
    final value = stop['color'];
    if (offset < 0 || offset > 1 || offset < previous) {
      throw const FormatException('three.canvas2d: invalid gradient offsets');
    }
    if (value is! String || value.length > 128) {
      throw const FormatException('three.canvas2d: invalid gradient color');
    }
    previous = offset;
    stops.add(offset);
    colors.add(_parseColor(value));
  }
  return _Canvas2DRadialPaint(
    centerX: centerX,
    centerY: centerY,
    radius: radius,
    colors: List.unmodifiable(colors),
    stops: List.unmodifiable(stops),
  );
}

const _canvas2dNamedColors = <String, int>{
  'transparent': 0x00000000,
  'black': 0xff000000,
  'white': 0xffffffff,
  'red': 0xffff0000,
  'green': 0xff008000,
  'blue': 0xff0000ff,
};

ui.Color _parseColor(String value) {
  final text = value.trim().toLowerCase();
  final namedValue = _canvas2dNamedColors[text];
  if (namedValue != null) return ui.Color(namedValue);
  final parsed = _parseHexColor(text) ?? _parseRgbColor(text);
  if (parsed != null) return parsed;
  throw const JsThreeUnsupportedException(
    'canvas2d.color',
    'unsupported CSS color syntax',
  );
}

ui.Color? _parseHexColor(String text) {
  if (!text.startsWith('#')) return null;
  return _parseHexDigits(text.substring(1));
}

ui.Color? _parseHexDigits(String hex) {
  final parsed = int.tryParse(hex, radix: 16);
  if (parsed == null) return null;
  if (hex.length == 3 || hex.length == 4) {
    return _parseShortHexColor(hex);
  }
  return _parseLongHexColor(hex, parsed);
}

ui.Color? _parseLongHexColor(String hex, int parsed) {
  if (hex.length == 6) return ui.Color(0xff000000 | parsed);
  if (hex.length != 8) return null;
  return ui.Color.fromARGB(
    parsed & 255,
    (parsed >> 24) & 255,
    (parsed >> 16) & 255,
    (parsed >> 8) & 255,
  );
}

ui.Color _parseShortHexColor(String hex) {
  final r = int.parse(hex[0] * 2, radix: 16);
  final g = int.parse(hex[1] * 2, radix: 16);
  final b = int.parse(hex[2] * 2, radix: 16);
  final a = hex.length == 4 ? int.parse(hex[3] * 2, radix: 16) : 255;
  return ui.Color.fromARGB(a, r, g, b);
}

ui.Color? _parseRgbColor(String text) {
  final match = RegExp(
    r'^rgba?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*(?:,\s*([0-9]*\.?[0-9]+)\s*)?\)$',
  ).firstMatch(text);
  if (match == null) return null;
  final r = int.parse(match.group(1)!);
  final g = int.parse(match.group(2)!);
  final b = int.parse(match.group(3)!);
  final a = match.group(4) == null ? 1.0 : double.parse(match.group(4)!);
  if (r > 255 || g > 255 || b > 255 || a < 0 || a > 1) return null;
  return ui.Color.fromARGB((a * 255).round(), r, g, b);
}

Future<Uint8List> rasterizeJsThreeCanvas2D(
  JsThreeCanvas2DRequest request,
) async {
  final recorder = ui.PictureRecorder();
  final canvas = ui.Canvas(recorder);
  for (final command in request.commands) {
    final paint = ui.Paint()..style = ui.PaintingStyle.fill;
    command.paint.apply(paint);
    final left = command.width < 0 ? command.x + command.width : command.x;
    final right = command.width < 0 ? command.x : command.x + command.width;
    final top = command.height < 0 ? command.y + command.height : command.y;
    final bottom = command.height < 0 ? command.y : command.y + command.height;
    canvas.drawRect(ui.Rect.fromLTRB(left, top, right, bottom), paint);
  }
  final picture = recorder.endRecording();
  try {
    final image = await picture.toImage(request.width, request.height);
    try {
      final bytes = await image.toByteData(format: ui.ImageByteFormat.rawRgba);
      if (bytes == null) {
        throw StateError('three.canvas2d: Flutter returned no RGBA bytes');
      }
      final expected = request.width * request.height * 4;
      if (bytes.lengthInBytes != expected) {
        throw StateError(
          'three.canvas2d: Flutter returned an invalid byte length',
        );
      }
      return Uint8List.fromList(
        bytes.buffer.asUint8List(bytes.offsetInBytes, bytes.lengthInBytes),
      );
    } finally {
      image.dispose();
    }
  } finally {
    picture.dispose();
  }
}
