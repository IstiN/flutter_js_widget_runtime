import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter/material.dart';

/// Opt-in voxel frame telemetry. Disabled by default; the web preview exposes
/// frame logs, immutable-buffer, mob-frustum and single-pixel probe modes.
class VoxelDiagnostics {
  static bool enabled = false;
  static bool copyBuffers = false;
  static bool traceMobs = false;
  static double probeX = -1;
  static double probeY = -1;
  static int _sequence = 0;
  static final List<String> _records = [];

  int visibleChunks = 0;
  int nearClips = 0;
  int backfaceCull = 0;
  int subpixelCull = 0;
  int coveringTriangles = 0;
  int sortErrors = 0;
  int sharedEdges = 0;
  int sharedPairs = 0;
  int chunkSignature = 0;
  double maxArea = 0;
  double minDepth = 0;
  double maxDepth = 0;
  Map<String, Object?>? largestTriangle;
  final List<Map<String, Object?>> _mobs = [];
  final List<Map<String, Object?>> _probes = [];
  int _positionHash = 0;
  int _colorHash = 0;

  void begin() {
    visibleChunks = 0;
    nearClips = 0;
    backfaceCull = 0;
    subpixelCull = 0;
    coveringTriangles = 0;
    sortErrors = 0;
    sharedEdges = 0;
    sharedPairs = 0;
    chunkSignature = 0;
    maxArea = 0;
    minDepth = double.infinity;
    maxDepth = double.negativeInfinity;
    largestTriangle = null;
    _mobs.clear();
    _probes.clear();
    _positionHash = 0x811c9dc5;
    _colorHash = 0x811c9dc5;
  }

  static int _mix(int hash, int value) =>
      (hash ^ (value + 0x9e3779b9 + (hash << 6) + (hash >> 2))) & 0xffffffff;

  void observeChunk(String key, int id, int positionLength, int indexLength) {
    if (!enabled) return;
    var hash = chunkSignature;
    hash = _mix(hash, key.hashCode);
    hash = _mix(hash, id);
    hash = _mix(hash, positionLength);
    hash = _mix(hash, indexLength);
    chunkSignature = hash;
  }

  void observeMob(
    String key,
    bool outside,
    int before,
    int after,
    Float32List min,
    Float32List max,
    Float32List origin,
  ) {
    if (!enabled || !traceMobs || !key.startsWith('__mob')) return;
    _mobs.add({
      'key': key,
      'frustumCulled': outside,
      'emittedTris': after - before,
      'min': [for (final p in min) _round(p, 3)],
      'max': [for (final p in max) _round(p, 3)],
      'origin': [for (final p in origin) _round(p, 3)],
    });
  }

  void observeProbe(String key, int order, Float32List p, Int32List colors,
      double depth, int emission, double z0, double z1, double z2) {
    if (!enabled || probeX < 0) return;
    final den = (p[3] - p[5]) * (p[0] - p[4]) +
        (p[4] - p[2]) * (p[1] - p[5]);
    if (den.abs() < 1e-8) return;
    final a = ((p[3] - p[5]) * (probeX - p[4]) +
        (p[4] - p[2]) * (probeY - p[5])) / den;
    final b = ((p[5] - p[1]) * (probeX - p[4]) +
        (p[0] - p[4]) * (probeY - p[5])) / den;
    final c = 1 - a - b;
    if (a < -1e-6 || b < -1e-6 || c < -1e-6) return;
    _probes.add({
      'key': key,
      'order': order,
      'pts': [for (final v in p) _round(v, 1)],
      'rgb': [for (final v in colors) v.toRadixString(16)],
      'depth': _round(depth, 4),
      'z': [_round(z0, 4), _round(z1, 4), _round(z2, 4)],
      'probeZ': _round(1 / (a / z0 + b / z1 + c / z2), 4),
      'emission': emission,
    });
  }

  void hashStreams(Float32List positions, Int32List colors, int vertexCount) {
    if (!enabled) return;
    var ph = _positionHash;
    for (var i = 0; i < vertexCount * 2; i++) {
      ph = _mix(ph, (positions[i] * 16).round());
    }
    var ch = _colorHash;
    for (var i = 0; i < vertexCount; i++) {
      ch = _mix(ch, colors[i]);
    }
    _positionHash = ph;
    _colorHash = ch;
  }

  void observeTriangle({
    required Float32List points,
    required Int32List colors,
    required Float32List origin,
    required double area,
    required double depth,
    required int emission,
    required double z0,
    required double z1,
    required double z2,
    required double width,
    required double height,
  }) {
    if (!enabled) return;
    minDepth = math.min(minDepth, depth);
    maxDepth = math.max(maxDepth, depth);
    final magnitude = area.abs() / 2;
    final minX = math.min(points[0], math.min(points[2], points[4]));
    final maxX = math.max(points[0], math.max(points[2], points[4]));
    final minY = math.min(points[1], math.min(points[3], points[5]));
    final maxY = math.max(points[1], math.max(points[3], points[5]));
    if (minX <= 0 && minY <= 0 && maxX >= width && maxY >= height) {
      coveringTriangles++;
    }
    if (magnitude <= maxArea) return;
    maxArea = magnitude;
    largestTriangle = {
      'pts': [for (final p in points) _round(p, 1)],
      'z': [_round(z0, 2), _round(z1, 2), _round(z2, 2)],
      'depth': _round(depth, 3),
      'origin': [for (final p in origin) _round(p, 2)],
      'rgb': [for (final c in colors) c.toRadixString(16)],
      'emission': emission,
    };
  }

  void record({
    required String instanceId,
    required int painterId,
    required Size size,
    required Float32List position,
    required double yaw,
    required double pitch,
    required double fov,
    required int chunkCount,
    required int triangleCount,
    required int elapsedUs,
    required int bufferPage,
    required int bufferId,
    required int bufferLength,
  }) {
    if (!enabled) return;
    final record = <String, Object?>{
      'f': ++_sequence,
      'id': instanceId,
      'painter': painterId,
      'us': elapsedUs,
      'size': [size.width.round(), size.height.round()],
      'cam': [
        _round(position[0], 3),
        _round(position[1], 3),
        _round(position[2], 3),
        _round(yaw, 4),
        _round(pitch, 4),
        _round(fov, 1),
      ],
      'chunks': chunkCount,
      'chunkSig': chunkSignature.toRadixString(16),
      'tris': triangleCount,
      'visibleChunks': visibleChunks,
      'nearClips': nearClips,
      'culls': [backfaceCull, subpixelCull],
      'cover': coveringTriangles,
      'maxArea': maxArea.round(),
      'sortErrors': sortErrors,
      'shared': [sharedEdges, sharedPairs],
      'buffer': [bufferPage, bufferId, bufferLength],
      'positionHash': _positionHash.toRadixString(16),
      'colorHash': _colorHash.toRadixString(16),
      'copy': copyBuffers ? 1 : 0,
      if (_mobs.isNotEmpty) 'mobs': _mobs,
      if (_probes.isNotEmpty)
        'probe': {'at': [probeX, probeY], 'tris': _probes},
      if (triangleCount > 0)
        'depth': [_round(minDepth, 3), _round(maxDepth, 3)],
      if (largestTriangle != null) 'largest': largestTriangle,
    };
    _records.add(jsonEncode(record));
    if (_records.length >= 30) flush();
  }

  static double _round(double value, int digits) =>
      double.parse(value.toStringAsFixed(digits));

  static void flush() {
    if (_records.isEmpty) return;
    debugPrint(
      '[voxel-debug frames=${_records.length}]\n${_records.join('\n')}',
    );
    _records.clear();
  }

  static void reset() {
    enabled = false;
    copyBuffers = false;
    traceMobs = false;
    probeX = -1;
    probeY = -1;
    _sequence = 0;
    _records.clear();
  }
}
