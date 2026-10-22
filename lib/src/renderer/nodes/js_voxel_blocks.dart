import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';

import 'js_voxel_node.dart';

/// Bridge-side block data for one chunk, uploaded by widget JS via
/// `jsr.hostCall('voxel.blocks', ...)` and meshed HERE, in Dart AOT.
///
/// This is the native-fast alternative to `voxel.mesh`: instead of the
/// widget building vertex buffers in (interpreted) JS and shipping
/// 50-100 KB of JSON floats per chunk, it ships the raw block bytes
/// (~16 KB base64 for a 16x64x16 chunk) and the runtime runs the
/// greedy mesher in compiled Dart. The JS interpreter leaves the hot
/// path entirely; the painter consumes the exact same [JsVoxelChunk]
/// buffers it always has.
///
/// Payload contract (`voxel.blocks`):
/// - `id` — instance id (the node's `id` prop), as every voxel call.
/// - `key` — chunk key, `"cx,cz"` integers, chunk-grid aligned: the
///   mesher derives neighbor chunk keys from it for cross-chunk face
///   culling. Keys that do not parse still mesh (borders read as air)
///   but do not participate in neighbor re-meshing.
/// - `origin` — world-space translation `[x, y, z]` for the buffers.
/// - `size` — `[sx, sy, sz]` (each 1..256, product <= 1<<20 bytes).
/// - `blocks` — base64 of the raw block bytes, index
///   `(y * sz + z) * sx + x`. `0` = air, anything else = solid, and the
///   byte value is the palette type index (values past the palette
///   clamp to its last entry).
/// - `palette` — color spec, cached per instance after the first upload
///   (subsequent chunks for the same `id` may omit it):
///   per type either `['#rrggbb', '#rrggbb', '#rrggbb', '#rrggbb']`
///   (four deterministic tones used on every face) or
///   `{'top': [4 tones], 'side': [4 tones]}` (vertical faces read the
///   side palette — Minecraft grass-block styling).
/// - `shade` — optional `[bottom, side, top]` brightness classes,
///   default `[0.62, 0.82, 1.0]`.
/// - `overlay` — passed through to [JsVoxelChunk.overlay].
///
/// Tone jitter: the mesher picks one of the four tones per visible face
/// from a deterministic world-position hash and greedy-merges only
/// same-tone neighbors — crisp per-block pixel grain, merged quads
/// where the grain agrees. The hash is owned HERE (not by the widget)
/// so every host meshes identically.
///
/// Malformed uploads resolve `ok: false` (never throw) so one bad chunk
/// cannot wedge a session — the same fail-soft contract as `voxel.mesh`.
class JsVoxelBlocks {
  JsVoxelBlocks({
    required this.gx,
    required this.gz,
    required this.sx,
    required this.sy,
    required this.sz,
    required this.data,
    this.origin = const [0, 0, 0],
  });

  /// Chunk grid x parsed from the "cx,cz" key.
  final int gx;

  /// Chunk grid z parsed from the "cx,cz" key.
  final int gz;
  final int sx;
  final int sy;
  final int sz;
  final Uint8List data;

  /// World-space translation for the meshed buffers (needed again at
  /// neighbor-remesh time, long after the original payload is gone).
  final List<double> origin;

  /// Parses and validates a `voxel.blocks` payload up to (but not
  /// including) meshing. Returns null when the payload is unusable.
  static JsVoxelBlocks? fromDynamic(Map<String, dynamic> args) {
    final dims = _parseDims(args['size']);
    if (dims == null) return null;
    final total = dims[0] * dims[1] * dims[2];
    if (total > (1 << 20)) return null;
    final data = _decodeBlocks(args['blocks'], total);
    if (data == null) return null;
    final grid = parseGridKey(args['key']?.toString() ?? '');
    return JsVoxelBlocks(
      gx: grid?.$1 ?? 0,
      gz: grid?.$2 ?? 0,
      sx: dims[0],
      sy: dims[1],
      sz: dims[2],
      data: data,
      origin: _parseOrigin(args['origin']),
    );
  }

  /// `[sx, sy, sz]` with each dim in 1..256, or null for garbage.
  static List<int>? _parseDims(dynamic size) {
    if (size is! List || size.length != 3) return null;
    final dims = <int>[];
    for (final d in size) {
      if (d is! num) return null;
      final v = d.toInt();
      if (v < 1 || v > 256) return null;
      dims.add(v);
    }
    return dims;
  }

  /// Decodes the block bytes (base64 string on the JSON lane, raw
  /// Uint8List on `voxel.blocks.bin`) and checks the exact length.
  static Uint8List? _decodeBlocks(dynamic raw, int total) {
    final Uint8List data;
    if (raw is Uint8List) {
      data = raw;
    } else if (raw is! String || raw.isEmpty) {
      return null;
    } else {
      try {
        data = base64Decode(raw);
      } on FormatException {
        return null;
      }
    }
    return data.length == total ? data : null;
  }

  /// `[x, y, z]` numbers, or the zero origin for garbage.
  static List<double> _parseOrigin(dynamic raw) {
    if (raw is! List || raw.length != 3) return const <double>[0, 0, 0];
    final o = <double>[];
    for (final v in raw) {
      if (v is! num) return const <double>[0, 0, 0];
      o.add(v.toDouble());
    }
    return o;
  }

  /// `"cx,cz"` → (cx, cz); null for keys outside the chunk grid.
  static (int, int)? parseGridKey(String key) {
    final i = key.indexOf(',');
    if (i <= 0 || i == key.length - 1) return null;
    final cx = int.tryParse(key.substring(0, i).trim());
    final cz = int.tryParse(key.substring(i + 1).trim());
    if (cx == null || cz == null) return null;
    return (cx, cz);
  }

  int at(int lx, int y, int lz) => data[(y * sz + lz) * sx + lx];
}

/// Parsed `palette` + `shade` for [meshVoxelBlocks]. Cached per instance
/// id by [JsVoxelWorld] so only the first chunk of a session carries it.
class JsVoxelPalette {
  JsVoxelPalette({required this.tones, required this.sideTones, Float32List? shade})
    : shade = shade ?? Float32List.fromList(const [0.62, 0.82, 1.0]);

  /// Per type: 4 tones x rgb, flat Float32List(12).
  final List<Float32List?> tones;

  /// Per type vertical-face tones, or null to reuse [tones].
  final List<Float32List?> sideTones;

  /// `[bottom, side, top]` brightness classes.
  final Float32List shade;

  /// Parses the JSON palette spec. Returns null for garbage. Type 0 is
  /// air and never looked up; entry 0 is a placeholder.
  static JsVoxelPalette? fromDynamic(dynamic raw) {
    if (raw is! List || raw.isEmpty) return null;
    final tones = List<Float32List?>.filled(raw.length, null);
    final sides = List<Float32List?>.filled(raw.length, null);
    for (var i = 0; i < raw.length; i++) {
      final e = raw[i];
      if (e is List) {
        final t = _toneSet(e);
        if (t == null) return null;
        tones[i] = t;
      } else if (e is Map) {
        final top = _toneSet(e['top']);
        final side = _toneSet(e['side']);
        if (top == null || side == null) return null;
        tones[i] = top;
        sides[i] = side;
      } else {
        return null;
      }
    }
    return JsVoxelPalette(tones: tones, sideTones: sides);
  }

  /// Parses `shade: [bottom, side, top]` onto the palette (kept when the
  /// payload omits or garbles it).
  void applyShade(dynamic raw) {
    if (raw is! List || raw.length != 3) return;
    for (var i = 0; i < 3; i++) {
      if (raw[i] is! num) return;
    }
    for (var i = 0; i < 3; i++) {
      shade[i] = (raw[i] as num).toDouble().clamp(0.0, 1.0);
    }
  }

  static Float32List? _toneSet(dynamic raw) {
    if (raw is! List || raw.length != 4) return null;
    final out = Float32List(12);
    for (var t = 0; t < 4; t++) {
      final rgb = _hexToRgb(raw[t]);
      if (rgb == null) return null;
      out[t * 3] = rgb[0];
      out[t * 3 + 1] = rgb[1];
      out[t * 3 + 2] = rgb[2];
    }
    return out;
  }

  static List<double>? _hexToRgb(dynamic raw) {
    if (raw is! String) return null;
    var hex = raw;
    if (hex.startsWith('#')) hex = hex.substring(1);
    if (hex.length != 6) return null;
    final value = int.tryParse(hex, radix: 16);
    if (value == null) return null;
    return <double>[
      ((value >> 16) & 0xFF) / 255,
      ((value >> 8) & 0xFF) / 255,
      (value & 0xFF) / 255,
    ];
  }

  /// Face color for a solid block: tone from the world-position hash
  /// (side palette on vertical faces when the type has one), then the
  /// face brightness class, clamped at 1 like the widget mesher did.
  void faceColor(
      int type, bool vertical, int wx, int y, int wz, int faceClass, Float32List out) {
    final t = type < tones.length ? type : tones.length - 1;
    final top = tones[t];
    if (top == null) {
      out[0] = out[1] = out[2] = 1;
      return;
    }
    final side = sideTones[t] ?? top;
    final pal = vertical ? side : top;
    final tone = (_toneHash(wx, y, wz) & 3) * 3;
    final s = shade[faceClass];
    out[0] = _min1(pal[tone] * s);
    out[1] = _min1(pal[tone + 1] * s);
    out[2] = _min1(pal[tone + 2] * s);
  }

  /// Deterministic per-face tone hash — owned by the runtime so every
  /// host meshes identically. 32-bit mix of the world cell coords.
  static int _toneHash(int x, int y, int z) {
    final h = ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) & 0xFFFFFFFF;
    return h ^ (h >> 13);
  }
}

double _min1(double v) => v > 1 ? 1 : v;

/// Face tables ported 1:1 from the fa-craft greedy mesher (CCW from
/// outside — the painter's backface cull depends on the winding).
class _Faces {
  /// Normal axis (0=x, 1=y, 2=z) per face direction.
  static const axisOf = [0, 0, 1, 1, 2, 2];

  /// In-plane (U, V) axes per face — the two axes not pierced by the
  /// normal.
  static const axes = [
    [1, 2], [1, 2], [0, 2], [0, 2], [0, 1], [0, 1],
  ];

  /// Merged-quad corner sign patterns per face in (U, V); for a 1x1 quad
  /// each reduces to the unit square, preserving CCW-from-outside
  /// winding.
  static const corners = [
    [[0, 0], [1, 0], [1, 1], [0, 1]], // +x
    [[0, 1], [1, 1], [1, 0], [0, 0]], // -x
    [[0, 0], [0, 1], [1, 1], [1, 0]], // +y
    [[0, 0], [1, 0], [1, 1], [0, 1]], // -y
    [[1, 0], [1, 1], [0, 1], [0, 0]], // +z
    [[0, 0], [0, 1], [1, 1], [1, 0]], // -z
  ];
}

/// Growable float sink — typed storage without per-vertex boxing.
class _Sink32 {
  _Sink32() : _data = Float32List(1024);
  Float32List _data;
  int len = 0;

  void ensure(int extra) {
    while (len + extra > _data.length) {
      _grow();
    }
  }

  void _grow() {
    final grown = Float32List(_data.length * 2);
    grown.setAll(0, _data);
    _data = grown;
  }

  Float32List take() {
    final out = Float32List(len);
    out.setRange(0, len, _data);
    return out;
  }
}

class _SinkU32 {
  _SinkU32() : _data = Uint32List(1024);
  Uint32List _data;
  int len = 0;

  void ensure(int extra) {
    while (len + extra > _data.length) {
      final grown = Uint32List(_data.length * 2);
      grown.setAll(0, _data);
      _data = grown;
    }
  }

  Uint32List take() {
    final out = Uint32List(len);
    out.setRange(0, len, _data);
    return out;
  }
}

/// Greedy-meshes one chunk of raw block bytes into a [JsVoxelChunk].
///
/// [neighborAt] resolves blocks OUTSIDE this chunk (one axis past the
/// border at a time) so interior faces between two uploaded chunks cull
/// instead of overdrawing; a missing neighbor reads as air — borders
/// stay visible until the neighbor arrives and triggers the re-mesh.
/// Overdraw only, never holes.
///
/// Returns null for a fully-air chunk: the caller keeps the block bytes
/// resident (neighbors still cull against them) but stores no mesh.
JsVoxelChunk? meshVoxelBlocks({
  required JsVoxelBlocks chunk,
  required JsVoxelPalette palette,
  required int Function(int lx, int y, int lz) neighborAt,
  List<double> origin = const [0, 0, 0],
  bool overlay = false,
}) {
  final sx = chunk.sx, sy = chunk.sy, sz = chunk.sz;
  final sizes = [sx, sy, sz];
  final positions = _Sink32(), colors = _Sink32(), indices = _SinkU32();

  int blockAt(int lx, int y, int lz) {
    if (y < 0 || y >= sy) return 0;
    if (lx >= 0 && lx < sx && lz >= 0 && lz < sz) return chunk.at(lx, y, lz);
    return neighborAt(lx, y, lz);
  }

  // Reused per-face-slice merge mask + per-cell color (sized for the
  // largest in-plane slice this chunk can have).
  final sliceCap = math.max(sx * sy, math.max(sy * sz, sx * sz));
  var mask = Int32List(sliceCap);
  var cellColor = Float32List(sliceCap * 3);
  final fc = Float32List(3);

  final maxY = _highestNonAirY(chunk);
  if (maxY < 0) return null;

  for (var f = 0; f < 6; f++) {
    final a = _Faces.axisOf[f];
    final positive = (f & 1) == 0;
    final u = _Faces.axes[f][0], v = _Faces.axes[f][1];
    final su = sizes[u], sv = a == 1 ? sizes[v] : maxY + 1;
    final sa = a == 1 ? maxY + 1 : sizes[a];
    final dn = positive ? 1 : -1;
    final vertical = a != 1;
    final faceClass = a == 1 ? (positive ? 2 : 0) : 1;
    if (su * sv > mask.length) {
      mask = Int32List(su * sv);
      cellColor = Float32List(su * sv * 3);
    } else {
      mask.fillRange(0, su * sv, 0);
    }
    final m = mask, cc = cellColor;
    final ox = origin[0].toInt(), oz = origin[2].toInt();

    for (var s = 0; s < sa; s++) {
      _rasterSlice(chunk, palette, blockAt, m, cc, fc, f, a, u, v, s, dn,
          su, sv, vertical, faceClass, ox, oz);
      _greedyScan(m, cc, su, sv, f, a, u, v, s, positive, positions, colors,
          indices);
    }
  }

  if (positions.len == 0) return null;
  return JsVoxelChunk(
    positions: positions.take(),
    colors: colors.take(),
    indices: indices.take(),
    origin: Float32List.fromList(origin),
    overlay: overlay,
  );
}

/// Highest Y layer in [chunk] containing at least one non-air voxel, or `-1`
/// when the chunk is completely air.
int _highestNonAirY(JsVoxelBlocks chunk) {
  final raw = chunk.data;
  final planeSize = chunk.sx * chunk.sz;
  for (var y = chunk.sy - 1; y >= 0; y--) {
    final yOff = y * planeSize;
    for (var i = 0; i < planeSize; i++) {
      if (raw[yOff + i] != 0) return y;
    }
  }
  return -1;
}

/// Rasters ONE slice of ONE face direction into the merge mask: visible
/// faces only, merge key = packed tone rgb (+1 so air stays 0) —
/// same-color neighbors collapse, differing grain stays crisp.
void _rasterSlice(
  JsVoxelBlocks chunk,
  JsVoxelPalette palette,
  int Function(int lx, int y, int lz) blockAt,
  Int32List m,
  Float32List cc,
  Float32List fc,
  int f,
  int a,
  int u,
  int v,
  int s,
  int dn,
  int su,
  int sv,
  bool vertical,
  int faceClass,
  int ox,
  int oz,
) {
  final coords = Int32List(3);
  for (var vv = 0; vv < sv; vv++) {
    for (var uu = 0; uu < su; uu++) {
      coords[a] = s;
      coords[u] = uu;
      coords[v] = vv;
      final px = coords[0], py = coords[1], pz = coords[2];
      final b = blockAt(px, py, pz);
      if (b == 0) continue;
      coords[a] = s + dn;
      if (blockAt(coords[0], coords[1], coords[2]) != 0) continue;
      palette.faceColor(b, vertical, ox + px, py, oz + pz, faceClass, fc);
      final ci = (vv * su + uu) * 3;
      cc[ci] = fc[0];
      cc[ci + 1] = fc[1];
      cc[ci + 2] = fc[2];
      // Merge key = packed tone rgb (+1 so air stays 0): same-tone
      // neighbours collapse into one greedy quad while differing tones
      // stay separate — crisp per-block pixel grain matching the
      // widget's own JS mesher (`game/mesh.js`).
      m[vv * su + uu] =
          (((fc[0] * 255).round() << 16) |
              ((fc[1] * 255).round() << 8) |
              (fc[2] * 255).round()) +
          1;
    }
  }
}

/// Greedy rectangles over a rastered slice: walk the mask, extend each
/// seed as far right and down as the same merge key holds, emit the quad
/// and clear the consumed cells.
void _greedyScan(
  Int32List m,
  Float32List cc,
  int su,
  int sv,
  int f,
  int a,
  int u,
  int v,
  int s,
  bool positive,
  _Sink32 positions,
  _Sink32 colors,
  _SinkU32 indices,
) {
  for (var vv = 0; vv < sv; vv++) {
    for (var uu = 0; uu < su; uu++) {
      final key = m[vv * su + uu];
      if (key == 0) continue;
      var wdt = 1;
      while (uu + wdt < su && m[vv * su + uu + wdt] == key) {
        wdt++;
      }
      var hgt = 1;
      outer:
      while (vv + hgt < sv) {
        for (var du = 0; du < wdt; du++) {
          if (m[(vv + hgt) * su + uu + du] != key) break outer;
        }
        hgt++;
      }
      _emitQuad(positions, colors, indices, f, s, positive, a, u, v, uu,
          uu + wdt, vv, vv + hgt, cc, (vv * su + uu) * 3);
      for (var dv = 0; dv < hgt; dv++) {
        for (var du2 = 0; du2 < wdt; du2++) {
          m[(vv + dv) * su + uu + du2] = 0;
        }
      }
    }
  }
}

/// Emits one merged quad: 4 corner vertices + 2 CCW triangles in
/// CHUNK-LOCAL coordinates ([JsVoxelChunk.origin] translates them once in
/// [VoxelPainter._collectChunk]), flat per-quad color.
void _emitQuad(
  _Sink32 positions,
  _Sink32 colors,
  _SinkU32 indices,
  int f,
  int s,
  bool positive,
  int a,
  int u,
  int v,
  int u0,
  int u1,
  int v0,
  int v1,
  Float32List cc,
  int ci,
) {
  positions.ensure(12);
  colors.ensure(12);
  indices.ensure(6);
  final pBuf = positions._data;
  final cBuf = colors._data;
  final iBuf = indices._data;
  var pLen = positions.len;
  var cLen = colors.len;
  final iLen = indices.len;
  final base = pLen ~/ 3;
  final plane = (positive ? s + 1 : s).toDouble();
  final cs = _Faces.corners[f];
  final r = cc[ci], g = cc[ci + 1], b = cc[ci + 2];
  final u0d = u0.toDouble(), u1d = u1.toDouble();
  final v0d = v0.toDouble(), v1d = v1.toDouble();
  for (var i = 0; i < 4; i++) {
    final cu = cs[i][0] == 1 ? u1d : u0d;
    final cv = cs[i][1] == 1 ? v1d : v0d;
    pBuf[pLen] = a == 0 ? plane : cu;
    pBuf[pLen + 1] = a == 1 ? plane : (u == 1 ? cu : cv);
    pBuf[pLen + 2] = a == 2 ? plane : cv;
    pLen += 3;
    cBuf[cLen] = r;
    cBuf[cLen + 1] = g;
    cBuf[cLen + 2] = b;
    cLen += 3;
  }
  positions.len = pLen;
  colors.len = cLen;
  iBuf[iLen] = base;
  iBuf[iLen + 1] = base + 1;
  iBuf[iLen + 2] = base + 2;
  iBuf[iLen + 3] = base;
  iBuf[iLen + 4] = base + 2;
  iBuf[iLen + 5] = base + 3;
  indices.len = iLen + 6;
}
